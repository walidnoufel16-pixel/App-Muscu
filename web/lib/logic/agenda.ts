/* « Mon agenda » : deux semaines de séances faites et prévues, en tête d'Entraînement.
   Logique pure. Le fait vient de l'historique (musculation, cardio, sorties de course) ; le prévu
   vient d'AGENDA, des séances programmées par la personne, à une date ou chaque semaine, avec un
   rappel la veille ou le jour même à l'heure choisie (envoyé par la fonction Edge « rappels »,
   dont la règle est la même : supabase/functions/rappels/logique.ts). */
import { decaler, ECART_SEANCE, jourDe, lundiDe } from "./historique";
import { okDe } from "./core";
import { EX } from "@/lib/data/exercices";
import { PAT2MUSC } from "@/lib/data/referentiels";
import { effortsEndurance, recoDuJour } from "./recommandation";
import { objectifHebdo } from "./motivation";
import { datesDuPlan, faite, genererPlan } from "./course";
import type { LigneHist } from "./historique";
import type { Etat } from "./types";

export type QuoiPrevu =
  | { t: "libre"; i: number }
  | { t: "reco"; m?: string[] } // m : muscles proposés par Oxa ; sans m, Oxa choisit le jour même
  | { t: "course"; cle: string }
  | { t: "plan"; wk: number; day: number }
  | { t: "cardio"; i: number };

export type Rappel = { veille: boolean; h: number };
export type Prevu = {
  id: string;
  d: string; // premier jour (AAAA-MM-JJ)
  nom: string; // nom affiché (et dans la notification)
  quoi: QuoiPrevu;
  hebdo?: boolean; // chaque semaine à partir de d
  sauf?: string[]; // jours retirés d'une répétition
  rappel?: Rappel;
  plan?: boolean; // posée par le plan de course (reposée quand le plan change)
};

export type Famille = "muscu" | "cardio" | "course";
export type Fait = { nom: string; famille: Famille; s?: string; ts?: number };
export type JourAgenda = { d: string; fait: Fait[]; prevus: Prevu[]; manques: Prevu[] };

export const familleDe = (q: QuoiPrevu): Famille => (q.t === "cardio" ? "cardio" : q.t === "course" ? "course" : "muscu");
export const nouvelId = () => Math.random().toString(36).slice(2, 10);

/** Le prévu tombe-t-il ce jour-là ? */
export function tombeLe(p: Prevu, d: string) {
  if (p.sauf?.includes(d)) return false;
  if (!p.hebdo) return p.d === d;
  if (d < p.d) return false;
  return Math.round((Date.parse(d + "T12:00:00Z") - Date.parse(p.d + "T12:00:00Z")) / 864e5) % 7 === 0;
}

export type EnCours = { i: number; s: string; d: string; nom: string; ts: number; series: number };
/** Séances libres commencées et pas encore rangées (« Ajouter à mon suivi ») : des séries validées
    il y a moins de 6 heures dans leur journal. Elles ne comptent pas encore comme faites. */
export function seancesEnCours(E: Partial<Pick<Etat, "LOG" | "SEANCES">>, maintenant = Date.now()): EnCours[] {
  const m = new Map<number, EnCours>();
  for (const [k, L] of Object.entries(E.LOG || {})) {
    const r = /^L\|(\d+)\|\d+$/.exec(k);
    if (!r || !L?.ts || maintenant - L.ts > ECART_SEANCE) continue;
    const n = (L.series || []).filter((x) => okDe(L, x)).length;
    if (!n) continue;
    const i = +r[1], S = E.SEANCES?.[i];
    if (!S) continue;
    const c = m.get(i) ?? { i, s: `L|${i}`, d: jourDe(L.ts), nom: S.nom, ts: 0, series: 0 };
    c.series += n; c.ts = Math.max(c.ts, L.ts);
    m.set(i, c);
  }
  return [...m.values()].sort((a, b) => b.ts - a.ts);
}

/** Ce qui a été fait, jour par jour (une séance en cours n'y est pas encore). */
export function faitsParJour(E: Pick<Etat, "HIST" | "CARDIO" | "SORTIES"> & Partial<Pick<Etat, "LOG" | "SEANCES">>) {
  const m = new Map<string, Fait[]>();
  const ajouter = (d: string, f: Fait) => m.set(d, [...(m.get(d) || []), f]);
  const enCours = new Set(seancesEnCours(E).map((c) => `${c.d}|${c.s}`));
  for (const l of E.HIST || []) if (!enCours.has(`${l.d}|${l.s}`)) ajouter(l.d, { nom: l.nom, famille: "muscu", s: l.s });
  /* un bloc cardio d'une séance combinée (ref) est déjà dans sa séance */
  for (const c of E.CARDIO || []) if (!c.ref && !c.run) ajouter(jourDe(c.ts), { nom: c.nom, famille: "cardio", ts: c.ts });
  for (const s of E.SORTIES || []) ajouter(s.d, { nom: s.course ? "Course" : "Course à pied", famille: "course" });
  return m;
}

/** Les jours de l'agenda : n jours à partir du lundi `debut`. Un prévu est « fait » quand une
    séance de la même famille a été faite ce jour-là ; passé et pas fait, il est « manqué ». */
export function joursAgenda(E: Pick<Etat, "HIST" | "CARDIO" | "SORTIES"> & Partial<Pick<Etat, "LOG" | "SEANCES">> & { AGENDA?: Prevu[] }, debut: string, auj: string, n = 14): JourAgenda[] {
  const faits = faitsParJour(E), A = E.AGENDA || [];
  return Array.from({ length: n }, (_, k) => {
    const d = decaler(debut, k), fait = faits.get(d) || [];
    const tous = A.filter((p) => tombeLe(p, d));
    const restants = tous.filter((p) => !fait.some((f) => f.famille === familleDe(p.quoi)));
    return { d, fait, prevus: d >= auj ? restants : [], manques: d < auj ? restants : [] };
  });
}

/** Lundi de la grille qui contient aujourd'hui (cette semaine et la suivante). */
export const debutGrille = (auj: string, decalage = 0) => decaler(lundiDe(auj), decalage * 14);

/* ---------------- modifier l'agenda (mutations, comme `muter`) ---------------- */
export function programmer(A: Prevu[], p: Omit<Prevu, "id"> & { id?: string }): Prevu {
  const x = { ...p, id: p.id ?? nouvelId() } as Prevu;
  A.push(x);
  return x;
}

/** Une séance libre créée pour un jour à venir (menu du jour) : programmée ce jour-là, avec le rappel habituel. */
export function programmerNouvelle(E: Etat, d: string, i: number): Prevu {
  E.AGENDA ??= [];
  /* le rappel habituel, pour un jour à venir seulement (aujourd'hui, il serait déjà passé) */
  const rappel = d <= jourDe(Date.now()) ? null : E.A.rappelAgenda === undefined ? { veille: true, h: 20 } : E.A.rappelAgenda;
  return programmer(E.AGENDA, { d, nom: E.SEANCES[i].nom, quoi: { t: "libre", i }, ...(rappel ? { rappel } : {}) });
}

/** Retire un prévu : ce jour seulement (pour une répétition) ou en entier. */
export function retirer(A: Prevu[], id: string, jour: string | "tout") {
  const i = A.findIndex((p) => p.id === id);
  if (i < 0) return;
  const p = A[i];
  if (jour === "tout" || !p.hebdo) { A.splice(i, 1); return; }
  p.sauf = [...(p.sauf || []), jour];
}

/** Déplace un prévu d'un jour à un autre. Pour une répétition : seul ce jour-là bouge. */
export function deplacer(A: Prevu[], id: string, de: string, vers: string) {
  const p = A.find((x) => x.id === id);
  if (!p || de === vers) return;
  delete p.plan; // déplacée à la main : le plan ne la repose plus
  if (!p.hebdo) { p.d = vers; return; }
  p.sauf = [...(p.sauf || []), de];
  const { sauf: _s, hebdo: _h, id: _i, ...reste } = p;
  void _s; void _h; void _i;
  programmer(A, { ...reste, d: vers });
}

/** Change ce qu'il y a à faire pour un jour (variante) : pour une répétition, ce jour-là seulement. */
export function remplacerLe(A: Prevu[], id: string, jour: string, quoi: QuoiPrevu, nom: string) {
  const p = A.find((x) => x.id === id);
  if (!p) return;
  if (!p.hebdo) { p.quoi = quoi; p.nom = nom; return; }
  p.sauf = [...(p.sauf || []), jour];
  programmer(A, { d: jour, quoi, nom, ...(p.rappel ? { rappel: p.rappel } : {}) });
}

/** Les prochains jours (aujourd'hui compris), pour choisir une date. */
export const prochainsJours = (auj: string, n = 21) => Array.from({ length: n }, (_, k) => decaler(auj, k));

/** Le rappel tombe-t-il à cette heure-là (heure de Paris) ? Un rappel « le jour même » ne part pas
    si une séance de la même famille est déjà faite ce jour-là. */
export function rappelsDus(E: Pick<Etat, "HIST" | "CARDIO" | "SORTIES"> & { AGENDA?: Prevu[] }, auj: string, heure: number) {
  const faits = faitsParJour(E), out: { p: Prevu; d: string; veille: boolean }[] = [];
  for (const p of E.AGENDA || []) {
    if (!p.rappel || p.rappel.h !== heure) continue;
    const d = p.rappel.veille ? decaler(auj, 1) : auj;
    if (!tombeLe(p, d)) continue;
    if (!p.rappel.veille && (faits.get(d) || []).some((f) => f.famille === familleDe(p.quoi))) continue;
    out.push({ p, d, veille: p.rappel.veille });
  }
  return out;
}

/** Nom court pour une case de la grille : « Pecs et triceps » → « Pecs ». */
export const nomCourt = (nom: string) => {
  const t = nom.split(/ · | et | \+ |,| \(/)[0].trim();
  return t.length > 11 ? t.slice(0, 10) + "…" : t;
};

export const HEURES_VEILLE = [18, 19, 20, 21, 22];
export const HEURES_JOUR = [6, 7, 8, 12, 17, 18];

/* ---------------- la recommandation d'un jour, agenda compris ----------------
   Les séances déjà programmées avant ce jour (à partir d'aujourd'hui) comptent comme faites :
   leurs muscles récupèrent et remplissent la semaine, et le jour compte pour le rythme. Ainsi,
   programmer la semaine avec « Oxa choisit pour toi » fait tourner les séances. */
const REPRESENTANT: Record<string, string> = {};
for (const id in EX) { const p = PAT2MUSC[EX[id].pat]; if (p && !REPRESENTANT[p] && !EX[id].pat2 && EX[id].ch === "kg") REPRESENTANT[p] = id; }

const DURES = new Set(["longue", "seuil", "vma", "allure", "hyrox", "course"]);
/** Une sortie exigeante du plan de course est-elle programmée ce jour-là dans l'agenda ? */
export function courseDureLe(E: Etat & { AGENDA?: Prevu[] }, d: string, auj: string) {
  if (!E.COURSE) return false;
  const p = (joursAgenda(E, d, auj, 1)[0]?.prevus || []).find((x) => x.quoi.t === "course");
  if (!p || p.quoi.t !== "course") return false;
  const [k, j] = p.quoi.cle.split("|").map(Number);
  try { return DURES.has(genererPlan(E.COURSE)[k]?.seances[j]?.type ?? ""); } catch { return false; }
}

export function recoPour(E: Etat & { AGENDA?: Prevu[] }, d: string, auj = jourDe(Date.now())) {
  const debut = [lundiDe(d), decaler(d, -2), auj].sort()[0];
  const n = Math.max(0, Math.round((new Date(d + "T12:00").getTime() - new Date(debut + "T12:00").getTime()) / 864e5));
  const J = joursAgenda(E, debut, auj, n), jours: string[] = [], prevus: LigneHist[] = [];
  for (const j of J) {
    const futurs = j.d >= auj ? j.prevus : [];
    /* pour le rythme, seuls les jours de musculation comptent : la course et le cardio fatiguent les
       jambes (effortsEndurance), mais un footing ou le « cardio doux » conseillé un jour de repos ne
       doivent pas bloquer la séance du lendemain */
    const soin = (s?: string) => !!s && /^L\|\d+$/.test(s) && !!E.SEANCES[+s.slice(2)]?.soin;
    if (j.fait.some((f) => f.famille === "muscu" && !soin(f.s)) || futurs.some((p) => familleDe(p.quoi) === "muscu" && !(p.quoi.t === "libre" && E.SEANCES[p.quoi.i]?.soin))) jours.push(j.d);
    for (const p of futurs) {
      const ex: LigneHist["ex"] = {};
      if (p.quoi.t === "libre") for (const e of E.SEANCES[p.quoi.i]?.ex || []) ex[e.id] = [0, 0, 0, e.r, e.s];
      else if (p.quoi.t === "reco") for (const g of p.quoi.m || []) if (REPRESENTANT[g]) ex[REPRESENTANT[g]] = [0, 0, 0, 10, 4];
      if (Object.keys(ex).length) prevus.push({ d: j.d, s: "prevu|" + p.id, nom: p.nom, vol: 0, ser: 0, ex });
    }
  }
  /* course et musculation sur un seul calendrier : la veille d'une sortie longue, d'une séance de qualité
     ou d'un Hyrox programmés, pas de jambes (elles doivent arriver fraîches) */
  const ecartes: NonNullable<Parameters<typeof recoDuJour>[2]> = [...(E.A.recoSans || [])];
  if (courseDureLe(E, decaler(d, 1), auj) && !ecartes.includes("jambes")) ecartes.push("jambes");
  return recoDuJour([...(E.HIST || []), ...prevus], d, ecartes, E.A.regularite, effortsEndurance(E.SORTIES, E.CARDIO, E.A.avant),
    { hebdo: objectifHebdo(E.A), jours, futur: d > auj });
}

/** Pose les sorties à venir du plan de course dans l'agenda, sur les jours choisis : la musculation
    les voit (pas de jambes la veille d'une sortie dure) et elles se déplacent comme une séance.
    Les sorties déjà posées par le plan et pas encore passées sont reposées ; une sortie déplacée
    à la main, déjà faite ou passée ne bouge pas. Sans plan : les sorties à venir sont retirées. */
export function poserPlan(E: Pick<Etat, "COURSE" | "SORTIES"> & { AGENDA?: Prevu[] }, auj: string) {
  const A = (E.AGENDA ??= []);
  for (let i = A.length - 1; i >= 0; i--) if (A[i].plan && A[i].d >= auj) A.splice(i, 1);
  if (!E.COURSE) return;
  const places = new Set(A.flatMap((p) => (p.quoi.t === "course" ? [p.quoi.cle] : [])));
  for (const x of datesDuPlan(E.COURSE)) {
    if (x.d < auj || places.has(x.cle)) continue;
    const [k, j] = x.cle.split("|").map(Number);
    if (faite(E.SORTIES || [], k, j)) continue;
    programmer(A, { d: x.d, nom: x.nom, quoi: { t: "course", cle: x.cle }, plan: true });
  }
}
