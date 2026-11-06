/* Logique métier de Repère, portée de l'ancienne app (public/index.html).
   Fonctions pures : elles reçoivent l'état et ne touchent ni au DOM ni au
   stockage. Les tests de parité (tests/parite.test.ts) les comparent à
   l'ancien code sur les mêmes entrées. */

import { langue, loc, tr } from "@/lib/i18n";
import { EX, EX_FR } from "@/lib/data/exercices";
import {
  ACC, BAS, BONUS, HAUT, MUSCLES, PAT, PAT2GRP, PATN, SOCLE, SPORTS, VARIANTES, GROUPES,
} from "@/lib/data/referentiels";
import type { Exercice } from "@/lib/data/types";
import { POSTE_DE } from "@/lib/data/salle";
import { ajuster, formeDuJour, zonesDe } from "./forme";
import type { Etat, Journal, Reponses, SeanceIA, SeanceSemaine, Serie } from "./types";
import type { LigneHist } from "./historique";

/* ---------------- petits utilitaires ---------------- */
export const nb = (v: number | string) => (langue() === "en" ? String(v) : String(v).replace(".", ","));
export const key = (w: number, s: number, i: number) => `${w}|${s}|${i}`;
export const nomPat = (p: string) => PATN[p] || PAT[p] || p;
export const UNITE: Record<string, string> = { kg: "kg", lest: "kg", aucune: "reps", temps: "s", dist: "m" };

/* ---------------- matériel ---------------- */
export const accDeclares = (A: Reponses) =>
  (A.acc || []).map((i) => (ACC[i] || [])[0]).filter(Boolean) as string[];

export function exoDispo(o: string, mat: number, acc: string[]) {
  const e = EX[o];
  if (!e) return false;
  if (e.acc) return acc.includes(e.acc);
  return e.eq >= mat || (!!e.ou && acc.includes(e.ou));
}
/* Avec les sangles TRX, déclarées à part (Profil) : elles ne passent pas par le questionnaire ni l'IA. */
const enPlus = (A: Reponses) => accDeclares(A).concat(A.trx ? ["trx"] : []);
export const dispoDeclare = (A: Reponses, o: string) => exoDispo(o, A.materiel ?? 0, enPlus(A));

/* Barre de traction : déclarée dans Profil ; sans réponse, présente en salle et en home gym. */
export const barreDeclaree = (A: Reponses) => A.barre ?? (A.materiel ?? 0) <= 1;

/* Machines et postes absents de la salle (Profil › Mon matériel › Ma salle) : « x:<poste> ». */
export const sansPostes = (A: Reponses) => (A.sansPostes || []).map((p) => "x:" + p);

/* Filtre « Matériel disponible » : m0…m3 = champ eq, kb, el et trx = champ acc, bt = barre de traction,
   x:<poste> = machine absente de la salle. */
export const selDeclare = (A: Reponses) =>
  [3, 2, 1, 0].filter((v) => v >= (A.materiel ?? 0)).map((v) => "m" + v).concat(enPlus(A), barreDeclaree(A) ? ["bt"] : [], sansPostes(A));
/* Une sélection de matériel (brouillon d'écran) avec les machines absentes déclarées, toujours à jour. */
export const avecSalle = (sel: string[], A: Reponses) => sel.filter((t) => !t.startsWith("x:")).concat(sansPostes(A));
export function exoFiltre(o: string, sel: string[]) {
  const e = EX[o];
  if (!e) return false;
  if (POSTE_DE[o] && sel.includes("x:" + POSTE_DE[o])) return false;
  if (e.acc) return sel.includes(e.acc);
  if (e.bt) return sel.includes("bt");
  return sel.includes("m" + e.eq) || (!!e.ou && sel.includes(e.ou));
}

/* ---------------- sports ---------------- */
export const sportsChoisis = (A: Reponses) => (A.sport || []).filter((i) => i > 0);
export const sportsInfo = (A: Reponses) => sportsChoisis(A).map((i) => SPORTS[i]).filter(Boolean);
export const freqDe = (A: Reponses, i: number) => (A.sportFreq || {})[i] ?? 0;
export const sportsTotal = (A: Reponses) => sportsChoisis(A).reduce((n, i) => n + freqDe(A, i) + 1, 0);
export const aTrait = (A: Reponses, t: string) => sportsInfo(A).some((s) => (s as Record<string, unknown>)[t]);
export const maxTrait = (A: Reponses, t: string) =>
  sportsInfo(A).reduce((m, s) => Math.max(m, ((s as unknown as Record<string, number>)[t]) || 0), 0);
export const groupes = (A: Reponses) => GROUPES[A.sexe === 0 ? "h" : A.sexe === 1 ? "f" : "n"];

/* ---------------- semaine ---------------- */
export const patsOff = (A: Reponses) => {
  const s = new Set<string>();
  (A.exclus || []).forEach((g) => Object.keys(PAT2GRP).forEach((p) => { if (PAT2GRP[p] === g) s.add(p); }));
  return s;
};
const conv = (s: SeanceIA, b: boolean): SeanceSemaine => ({
  b: b ? 1 : 0, t: s.titre, f: s.focus,
  x: s.exercices.map((e) => [e.id, e.series, e.reps, e.repos, e.role]),
});

/* ---------------- périodisation sur 8 semaines (Oxa Plan v2) ----------------
   S1 prise en main · S2 à S4 accumulation (une série de plus sur les principaux à partir de S3) ·
   S5 et S6 intensification (2 répétitions de moins sur les principaux, la charge monte) ·
   S7 pic (3 de moins) · S8 allègement (40 % de séries en moins, effort léger) pour récupérer.
   La semaine 1 reste la semaine du programme telle quelle. */
export type Phase = { k: "prise" | "accumulation" | "intensification" | "pic" | "allegement"; nom: string; series: number; reps: number; rpe: number };
export function phaseDe(w: number): Phase {
  if (w <= 0) return { k: "prise", nom: tr("Prise en main"), series: 0, reps: 0, rpe: 7 };
  if (w === 1) return { k: "accumulation", nom: tr("Accumulation"), series: 0, reps: 0, rpe: 7 };
  if (w <= 3) return { k: "accumulation", nom: tr("Accumulation"), series: 1, reps: 0, rpe: 8 };
  if (w <= 5) return { k: "intensification", nom: tr("Intensification"), series: 1, reps: -2, rpe: w === 4 ? 8 : 9 };
  if (w === 6) return { k: "pic", nom: tr("Pic"), series: 0, reps: -3, rpe: 9 };
  return { k: "allegement", nom: tr("Allègement"), series: 0, reps: 0, rpe: 6 };
}
/** Séries et répétitions d'un exercice du programme pour la semaine w. */
export function periode(e: [string, number, number, string, number], w: number): [string, number, number, string, number] {
  const ph = phaseDe(w), x = EX[e[0]];
  if (ph.k === "allegement") return [e[0], Math.max(1, Math.round(e[1] * 0.6)), e[2], e[3], e[4]];
  if (!e[4] || !x) return e;
  const charge = x.ch === "kg" || x.ch === "lest";
  return [e[0], Math.min(6, e[1] + ph.series), charge ? Math.max(3, e[2] + ph.reps) : e[2], e[3], e[4]];
}

export function week(E: Etat, w = E.wk): SeanceSemaine[] {
  const W = semaineDeBase(E);
  return w ? W.map((s) => (s.x ? { ...s, x: s.x.map((e) => periode(e as [string, number, number, string, number], w)) } : s)) : W;
}
function semaineDeBase(E: Etat): SeanceSemaine[] {
  const { A, PLAN } = E;
  let w: SeanceSemaine[];
  if (PLAN && PLAN.seances && PLAN.seances.length) {
    w = PLAN.seances.map((s) => conv(s, false));
    if (PLAN.bonus) w.push(conv(PLAN.bonus, true));
  } else {
    w = SOCLE.slice(0, 2 + (A.socle ?? 2)).map((s) => s as SeanceSemaine);
    w.push(BONUS[A.axe ?? 0] as SeanceSemaine);
  }
  const off = patsOff(A);
  if (off.size)
    w = w
      .map((s) => (s.x ? { ...s, x: s.x.filter((e) => !off.has((EX[e[0]] || ({} as Exercice)).pat)) } : s))
      .filter((s) => !s.x || s.x.length);
  if (sportsChoisis(A).length) w.push({ sportOnly: 1, t: sportsInfo(A).map((s) => s.n).join(" · ") });
  return w;
}

export function typeSeance(s: SeanceSemaine): "haut" | "bas" | "bonus" {
  if (s.b) return "bonus";
  let a = 0, b = 0;
  (s.x || []).forEach((e) => {
    const p = (EX[e[0]] || ({} as Exercice)).pat;
    if (HAUT.has(p)) a++;
    else if (BAS.has(p)) b++;
  });
  return b > a ? "bas" : "haut";
}

/* ---------------- effort ---------------- */
export const baseRPE = (w: number) => phaseDe(w).rpe;
export function rpeOf(A: Reponses, w: number, id: string, role: number) {
  const e = EX[id];
  let r = baseRPE(w) + (role || w >= 7 ? 0 : 1);
  if (r > 9) r = 9;
  if (e.cap && r > e.cap) r = e.cap;
  if (e.capDeb && (A.regularite === 0 || A.regularite === 1) && r > e.capDeb) r = e.capDeb;
  return r;
}
export const rirTxt = (r: number) => {
  const n = 10 - r;
  return n === 0 ? tr("aucune répétition en réserve") : n === 1 ? tr("il te reste 1 répétition") : tr("il te reste {n} répétitions", { n });
};
export const noRPE = (id: string) => ["temps", "dist"].includes(EX[id].ch) || EX[id].pat === "mo" || EX[id].pat === "soin";

/* ---------------- variété d'une semaine sur l'autre ----------------
   Principaux : l'exercice du plan les semaines 1, 3, 5, 7 ; sa variante les
   semaines 2, 4, 6, 8. Accessoires : ils tournent chaque semaine dans le même
   schéma moteur. Jamais deux fois le même exercice dans une séance. */
/* Préférences de matériel par groupe (questionnaire) : catégories 0 machines,
   1 barre, 2 haltères, 3 poids du corps, 4 kettlebell, 5 élastiques. */
const CAT_ACC: Record<string, number> = { kb: 4, el: 5, trx: 3 }; // TRX : rangé avec le poids du corps
export function prefOk(A: Reponses, id: string) {
  const e = EX[id];
  const p = e && (A.prefs || {})[PAT2GRP[e.pat]];
  if (!e || !p || !p.length) return true;
  const c = e.acc ? [CAT_ACC[e.acc]] : [e.eq].concat(e.ou ? [CAT_ACC[e.ou]] : []);
  return c.some((x) => p.includes(x));
}
/* Faisable avec le matériel déclaré et conforme aux préférences du groupe. */
export const convient = (A: Reponses, id: string) => dispoDeclare(A, id) && prefOk(A, id);

/* Remplaçant d'un exercice qui ne convient pas : d'abord le même schéma moteur,
   puis un exercice qui le travaille en second (curl → tractions supination), puis
   le même groupe. À rang égal : même type de charge, matériel proche, sans lest
   (développé couché → pompes). En dernier recours, le matériel seul compte. */
export function remplacant(A: Reponses, id: string, pris: Set<string>) {
  const e = EX[id];
  if (!e) return id;
  const v = VARIANTES[id] || [], g = PAT2GRP[e.pat];
  const rang = (o: string) => (EX[o].ch === e.ch ? 0 : EX[o].ch === "lest" ? 101 : 100) + Math.abs(EX[o].eq - e.eq) * 10 + (v.includes(o) ? 0 : 5);
  /* les exercices de soin ne remplacent qu'un autre exercice de soin */
  const autres = Object.keys(EX).filter((o) => o !== id && !pris.has(o) && (EX[o].pat !== "soin" || e.pat === "soin"));
  const R = new Map(autres.map((o) => [o, rang(o)]));
  autres.sort((a, b) => R.get(a)! - R.get(b)! || a.localeCompare(b));
  const paliers = [
    autres.filter((o) => EX[o].pat === e.pat),
    autres.filter((o) => EX[o].pat2 === e.pat),
    g ? autres.filter((o) => PAT2GRP[EX[o].pat] === g || PAT2GRP[EX[o].pat2 || ""] === g) : [],
  ];
  for (const ok of [convient, dispoDeclare]) for (const l of paliers) {
    const o = l.find((x) => ok(A, x));
    if (o) return o;
  }
  return id;
}

export function variante(A: Reponses, id: string, pris: Set<string>) {
  const e = EX[id];
  if (!e) return id;
  const auto = Object.keys(EX)
    .filter((o) => o !== id && EX[o].pat === e.pat && EX[o].ch === e.ch)
    .sort((a, b) => Math.abs(EX[a].eq - e.eq) - Math.abs(EX[b].eq - e.eq) || a.localeCompare(b));
  const l = (VARIANTES[id] || []).concat(auto).filter((o) => o !== id && EX[o] && convient(A, o) && !pris.has(o));
  if (l[0]) return l[0];
  /* Aucune variante du même type : on garde l'exercice s'il convient, sinon on le remplace. */
  return convient(A, id) ? id : remplacant(A, id, pris);
}
export function rotation(A: Reponses, w: number, id: string, pris?: Set<string>) {
  const e = EX[id];
  if (!e) return id;
  const l = Object.keys(EX).filter((o) => EX[o].pat === e.pat && convient(A, o)).sort();
  if (!l.length) return remplacant(A, id, pris || new Set());
  const k = Math.max(0, l.indexOf(id));
  if (l.length < 2 && l[0] === id) return id;
  for (let j = 0; j < l.length; j++) {
    const o = l[(k + w + j) % l.length];
    if (!pris || !pris.has(o)) return o;
  }
  return id;
}
export function curId(E: Etat, w: number, s: number, i: number, id: string, W = week(E)): string {
  const sw = E.SWAP[key(w, s, i)] || E.SWAPP[s + "|" + i];
  if (sw) return sw;
  /* Ce qui a été fait fait foi : un exercice enregistré garde son nom. */
  const L = E.LOG[key(w, s, i)];
  if (L && L.ex && EX[L.ex]) return L.ex;
  const S = W[s], e = S && S.x && S.x[i];
  if (!e || !S.x) return id;
  const pris = new Set(S.x.map((x, j) => (j === i ? null : x[0])).filter(Boolean) as string[]);
  for (let j = 0; j < i; j++) pris.add(curId(E, w, s, j, S.x[j][0], W));
  if (e[4]) {
    const base = convient(E.A, id) ? id : variante(E.A, id, pris);
    return w % 2 === 1 ? variante(E.A, base, new Set([...pris, id])) : base;
  }
  return rotation(E.A, w, id, pris);
}

/* ---------------- avancement ---------------- */
export function wkDone(E: Etat, w: number, si: number, W = week(E)) {
  const s = W[si];
  if (!s || s.sportOnly || !s.x) return false;
  return s.x.every((_, i) => E.LOG[key(w, si, i)] && E.LOG[key(w, si, i)].done);
}
export function wkFull(E: Etat, w: number, W = week(E)) {
  return W.some((x) => !x.b && !x.sportOnly) && W.every((s, i) => s.b || s.sportOnly || wkDone(E, w, i, W));
}
export function espacementDe(W: SeanceSemaine[], i: number): [number, string] {
  const s = W[i];
  if (!s || s.sportOnly) return [1, ""];
  if (s.b) return [1, tr("Aucune contrainte. Elle peut se coller à n'importe quelle séance, ou disparaître de la semaine.")];
  if (i === 0) return [1, tr("Première séance du cycle. Place-la où tu veux dans ta semaine.")];
  const t = typeSeance(s), tp = typeSeance(W[i - 1]);
  if (t !== tp) return [1, tr("Tu peux l'enchaîner dès le lendemain de la séance {i} : elle ne touche pas les mêmes muscles. Espacer n'apporte rien ici.", { i })];
  return [0, tr("Laisse au moins un jour plein après la séance {i}, qui travaillait déjà les mêmes muscles.", { i })];
}

/* ---------------- libellés ---------------- */
export function musclesDe(ids: string[]) {
  const l: string[] = [];
  ids.forEach((id) => {
    const x = EX_FR[id];
    if (!x || !x.m) return;
    x.m.split(",").forEach((t) => {
      const f = MUSCLES.find(([r]) => r.test(t.trim().toLowerCase()));
      if (f && !l.includes(f[1])) l.push(f[1]);
    });
  });
  return l.slice(0, 6);
}
export const titreSeance = (t: string) => {
  const c = String(t || "").replace(/^séance\s*\d+\s*[–—:·-]\s*/i, "").replace(/\s*\(.*$/, "").trim();
  return c || t;
};
export function secondesDe(t: string) {
  const s = String(t || "");
  const m = s.match(/(\d+)\s*min\s*(\d+)?/), sec = s.match(/(\d+)\s*s\b/);
  const v = m ? +m[1] * 60 + (+m[2] || 0) : sec ? +sec[1] : 0;
  return v > 0 ? v : 90;
}

/* ---------------- journal des séries ---------------- */
export function seriesDe(L: Journal, n?: number) {
  n = n || L.nb || 1;
  if (!L.series || !L.series.length) L.series = Array.from({ length: n }, () => ({ v: L.v ?? 0, reps: L.reps ?? 0 }));
  if (!L.memo) L.memo = [];
  /* On mémorise les lignes retirées : repasser de 4 à 6 séries les retrouve. */
  while (L.series.length < n) L.series.push(L.memo.pop() || { ...L.series[L.series.length - 1] });
  while (L.series.length > n) L.memo.push(L.series.pop()!);
  return L.series;
}
export const maxV = (L?: Journal | null) =>
  L && L.series && L.series.length ? Math.max(...L.series.map((s) => s.v)) : (L && L.v) || 0;
export const okDe = (L: Journal, s: Serie) => s.ok ?? !!L.done;
/** Variation de la charge proposée par rapport à la dernière fois (exercices en kg) ; 0 sans précédent. */
export const variationDe = (c: { id: string; base: { v: number }; prev?: Journal | null }) =>
  EX[c.id]?.ch === "kg" && c.prev ? Math.round((c.base.v - maxV(c.prev)) * 100) / 100 : 0;
export const lestMax = (L?: Journal | null) => (L && L.series ? Math.max(0, ...L.series.map((s) => +(s.lest ?? 0) || 0)) : 0);

export function resumeDe(L: Journal, x: Exercice, unit: string) {
  const S = L.series && L.series.length ? L.series : [{ v: L.v ?? 0, reps: L.reps ?? 0 }];
  const feels = ["facile", "juste", tr("trop dur")];
  const par = (s: Serie) =>
    `${nb(s.v)}${unit ? " " + unit : ""}${["kg", "lest"].includes(x.ch) ? tr(" × ") + s.reps : ""}${L.lest && +(s.lest ?? 0) > 0 ? " +" + nb(s.lest!) + " kg" : ""}`;
  const tous = S.every((s) => s.v === S[0].v && s.reps === S[0].reps && (+(s.lest ?? 0) || 0) === (+(S[0].lest ?? 0) || 0));
  return (tous ? `${S.length} × ${par(S[0])}` : S.map(par).join(", ")) + (L.feel != null ? " · " + feels[L.feel] : "");
}
export function fmtSerie(x: Exercice, s?: Serie) {
  if (!s) return "—";
  const b = ["kg", "lest"].includes(x.ch) ? `${nb(s.v)} × ${s.reps}` : x.ch === "temps" ? `${nb(s.v)} s` : x.ch === "dist" ? `${nb(s.v)} m` : `${nb(s.v)}`;
  return +(s.lest ?? 0) > 0 ? `${b} +${nb(s.lest!)}kg` : b;
}
/* Dernier enregistrement terminé de l'exercice, hors de la ligne en cours. */
export function precedentDe(LOG: Record<string, Journal>, id: string, sauf?: string) {
  let best: Journal | null = null;
  for (const k in LOG) {
    const L = LOG[k];
    if (k !== sauf && L && L.done && L.ex === id && (!best || (L.ts || 0) > (best.ts || 0))) best = L;
  }
  return best;
}

/* Dernière fois que l'exercice figure dans Progrès : les séries validées de la ligne d'historique
   la plus récente qui le contient, quelle que soit la séance. La séance en cours ne compte pas
   (sa ligne du jour, tant que son journal a des séries validées). */
const jourLocal = (ts: number) => { const d = new Date(ts), z = (n: number) => String(n).padStart(2, "0"); return `${d.getFullYear()}-${z(d.getMonth() + 1)}-${z(d.getDate())}`; };
export function precedentHist(E: Etat, id: string, k: string): Journal | null {
  return historiqueEx(E, id, k, 1)[0] ?? null;
}
/** Les n dernières fois où l'exercice figure dans Progrès, de la plus récente à la plus ancienne
    (séance en cours exclue, comme precedentHist). */
export function historiqueEx(E: Etat, id: string, k: string, n = 3): Journal[] {
  const s = k.split("|").slice(0, 2).join("|"), cur = E.LOG[k];
  const auj = cur?.ts && (cur.series || []).some((x) => okDe(cur, x)) ? jourLocal(cur.ts) : null;
  const H: LigneHist[] = E.HIST || [], out: Journal[] = [];
  for (let i = H.length - 1; i >= 0 && out.length < n; i--) {
    const l = H[i];
    if (l.s === s && l.d === auj) continue;
    const det = (l.det || []).filter((x) => x.id === id && x.s.length).at(-1);
    if (!det) continue;
    const series: Serie[] = det.s.map(([v, reps, lest]) => ({ v, reps, ok: true, ...(lest ? { lest } : {}) }));
    const [a, m, j] = l.d.split("-").map(Number);
    out.push({ ex: id, done: true, nb: series.length, feel: det.f ?? null, ts: new Date(a, m - 1, j, 12).getTime(), series, v: Math.max(...series.map((x) => x.v)), reps: series.at(-1)!.reps, lest: series.some((x) => +(x.lest ?? 0) > 0) });
  }
  return out;
}
/** Le précédent d'un exercice : d'abord ce que montre Progrès, sinon le journal. */
export const precedent = (E: Etat, id: string, k: string) => precedentHist(E, id, k) ?? precedentDe(E.LOG, id, k);

/* ---------------- suggestion de charge ---------------- */
const PAS_LOURD = new Set(["eg", "fh"]), PAS_MOYEN = new Set(["ph", "pv", "tv", "th"]);
export function pasDe(x: Exercice) {
  if (x.ch === "temps") return 5;
  if (x.ch === "dist") return 50;
  if (x.ch === "aucune") return 1;
  if (PAS_LOURD.has(x.pat)) return 5;
  if (PAS_MOYEN.has(x.pat)) return 2.5;
  return 1;
}
/* Palier de charge d'un exercice en séance libre : selon le matériel et le mouvement, pour des sauts
   réalisables (barre et machine des gros mouvements de jambes 5 kg, autres barres et machines 2,5 kg,
   haltères 2 kg, petits muscles aux haltères 1 kg). Le plan (Oxa Plan) garde pasDe, pour la parité. */
const PETITS = new Set(["re", "ep", "fc", "ec", "avb", "tra", "mol", "add", "ae", "soin"]);
export function pasExercice(x: Exercice) {
  if (x.ch !== "kg") return pasDe(x);
  const jambesLourdes = PAS_LOURD.has(x.pat) && !!x.pat2;
  if (x.eq === 1) return jambesLourdes ? 5 : 2.5;
  if (x.eq === 0) return jambesLourdes ? 5 : 2.5;
  if (x.eq === 2) return PETITS.has(x.pat) || !x.pat2 ? 1 : 2;
  return 2.5;
}
/** Charge arrondie au palier inférieur. */
const auPalier = (v: number, pas: number) => Math.max(0, Math.round(Math.floor(v / pas + 1e-9) * pas * 100) / 100);
/** Fourchette de répétitions autour de l'objectif d'un exercice : ±1 en force, ±2 sinon
    (10 → 8 à 12 en prise de muscle, 6 → 5 à 7 en force, 12 → 10 à 14 pour s'affiner). */
export const fourchette = (r: number, obj?: number) => {
  const w = obj === 1 ? 1 : 2;
  return { bas: Math.max(1, r - w), haut: r + w };
};
export type Suggestion = { v: number; reps: number; t: string };
export function suggere(E: Etat, w: number, s: number, i: number, id: string, W = week(E)): Suggestion | null {
  const x = EX[id];
  if (!x) return null;
  if (!W[s] || !W[s].x || !W[s].x![i]) return null;
  const base = semaineDeBase(E)[s]?.x?.[i] as [string, number, number, string, number] | undefined;
  for (let p = w - 1; p >= 0; p--) {
    if (curId(E, p, s, i, W[s].x![i][0], W) !== id) continue;
    const L = E.LOG[key(p, s, i)];
    if (!L || !L.done) continue;
    const pas = pasExercice(x), u = UNITE[x.ch], v = maxV(L);
    const rP = base ? periode(base, p)[2] : L.reps ?? 0, rW = base ? periode(base, w)[2] : rP, nP = base ? periode(base, p)[1] : L.nb ?? 1;
    const dbl = x.ch === "kg" || x.ch === "lest";
    if (!dbl) return { v, reps: rW, t: tr("Reprise de ta semaine {a}.", { a: p + 1 }) };
    /* semaine d'allègement : −10 %, moins de séries, pour récupérer */
    if (phaseDe(w).k === "allegement") return { v: auPalier(v * 0.9, pas), reps: rW, t: tr("Semaine d'allègement : −10 % et moins de séries, pour récupérer et repartir plus fort.") };
    const ok = (L.series || []).filter((z) => okDe(L, z)), m = ok.length ? Math.min(...ok.map((z) => z.reps)) : 0;
    /* moins de répétitions demandées (intensification) : la charge monte d'environ 2,5 % par répétition */
    const plus = rW < rP ? v * 0.025 * (rP - rW) : 0;
    if (L.feel === 2) return { v: Math.max(0, auPalier(v - pas + plus, pas)), reps: rW, t: tr("−{a} {u} : la semaine {a1} était au-dessus de la cible.", { a: nb(pas), u, a1: p + 1 }) };
    const reussi = ok.length >= nP && m >= rP, depasse = (reussi && m >= rP + 1) || (reussi && L.feel === 0);
    if (depasse) return { v: auPalier(v + pas + plus, pas) || v + pas, reps: rW, t: tr("Toutes tes séries au-dessus de {r} répétitions en semaine {a} : la charge monte.", { r: rP, a: p + 1 }) };
    if (reussi && plus) return { v: auPalier(v + plus, pas) || v, reps: rW, t: tr("Moins de répétitions cette semaine ({r}) : un peu plus lourd qu'en semaine {a}.", { r: rW, a: p + 1 }) };
    if (reussi) return { v, reps: rW, t: tr("Même charge qu'en semaine {a} : dépasse {r} répétitions sur toutes tes séries et elle montera.", { a: p + 1, r: rW }) };
    return { v, reps: rW, t: tr("Même charge qu'en semaine {a} : vise les {r} répétitions avant d'ajouter du poids.", { a: p + 1, r: rW }) };
  }
  return null;
}

/** Charge de départ d'un exercice du programme sans semaine précédente : d'après ta meilleure
    série dans l'historique (1RM estimé, Epley), pour les répétitions visées avec 2 en réserve. */
export function chargeDepart(E: Etat, id: string, reps: number): Suggestion | null {
  const x = EX[id];
  if (!x || x.ch !== "kg") return null;
  let rm = 0;
  for (const l of E.HIST || []) { const q = l.ex?.[id]; if (q && q[2] > 0 && q[3] > 0) rm = Math.max(rm, q[2] * (1 + Math.min(q[3], 12) / 30)); }
  if (!rm) return null;
  const pas = pasExercice(x), v = auPalier(rm / (1 + (reps + 2) / 30), pas);
  return v > 0 ? { v, reps, t: tr("Calculée d'après ta meilleure série sur cet exercice ({a} kg estimés au maximum).", { a: Math.round(rm) }) } : null;
}

/* ---------------- contexte d'un exercice affiché ----------------
   Clé du journal, exercice, nombre de séries, valeurs proposées, repos et
   dernière séance comparable. Plan : ctxPlan(i). Séance libre : ctxLibre(j). */
export type Ctx = {
  k: string; id: string; n: number;
  base: { v: number; reps: number };
  why?: string; repos: string;
  prev: Journal | null;
  /** meilleure performance passée sur l'exercice, si elle dépasse le précédent */
  max?: MaxEx | null;
};

/* ---------------- ton max sur un exercice ----------------
   Meilleure série dans l'historique de Progrès (colonnes « meilleure charge » et « répétitions à
   cette charge »), séance en cours exclue. Même classement que les records (records.ts) :
   la charge (ou le lest) d'abord, les répétitions départagent ; temps et distance : la valeur. */
export type MaxEx = { v: number; reps: number; d: string };
const scoreMax = (ch: string | undefined, v: number, reps: number) => (ch === "temps" || ch === "dist" ? v : v * 1000 + reps);
export function maxHist(E: Etat, id: string, k: string): MaxEx | null {
  const s = k.split("|").slice(0, 2).join("|"), cur = E.LOG[k];
  const auj = cur?.ts && (cur.series || []).some((x) => okDe(cur, x)) ? jourLocal(cur.ts) : null;
  const ch = EX[id]?.ch;
  let best: MaxEx | null = null;
  for (const l of E.HIST || []) {
    const p = l.ex?.[id];
    if (!p || (l.s === s && l.d === auj)) continue;
    const m = { v: p[2], reps: p[3], d: l.d };
    if (!best || scoreMax(ch, m.v, m.reps) > scoreMax(ch, best.v, best.reps)) best = m;
  }
  return best;
}
/** Le max, seulement s'il dépasse ce que montre « Précédent » (sinon il ferait doublon). */
export function maxAuDessus(id: string, max: MaxEx | null, prev: Journal | null): MaxEx | null {
  if (!max) return null;
  const ch = EX[id]?.ch;
  const p = (prev?.series || []).filter((x) => okDe(prev!, x)).reduce((m, x) => {
    const v = ch === "aucune" ? +(x.lest ?? 0) || 0 : x.v, r = ch === "aucune" ? x.v : x.reps;
    return Math.max(m, scoreMax(ch, v, r));
  }, 0);
  return scoreMax(ch, max.v, max.reps) > p ? max : null;
}
/** « 10 kg × 8 », « +5 kg × 6 », « 15 réps », « 75 s », « 500 m ». */
export function fmtMax(id: string, m: Pick<MaxEx, "v" | "reps">) {
  const ch = EX[id]?.ch;
  if (ch === "kg") return `${nb(m.v)} kg × ${m.reps}`;
  if (ch === "temps") return `${nb(m.v)} s`;
  if (ch === "dist") return `${nb(m.v)} m`;
  return m.v > 0 ? `+${nb(m.v)} kg × ${m.reps}` : tr("{n} réps", { n: m.reps });
}

export function ctxPlan(E: Etat, i: number, W = week(E)): Ctx | null {
  const S = W[E.day];
  const e = S?.x?.[i];
  if (!e) return null;
  const id = curId(E, E.wk, E.day, i, e[0], W), x = EX[id], g = suggere(E, E.wk, E.day, i, id, W), k = key(E.wk, E.day, i);
  let prev: Journal | null = null;
  for (let p = E.wk - 1; p >= 0 && !prev; p--)
    if (curId(E, p, E.day, i, e[0], W) === id && E.LOG[key(p, E.day, i)]?.done) prev = E.LOG[key(p, E.day, i)];
  const dep = g ? null : chargeDepart(E, id, e[2]);
  const aj = selonForme(E.A, x, id, g ? { v: g.v, reps: g.reps } : dep ? { v: dep.v, reps: e[2] } : { v: x.d, reps: e[2] }, pasExercice(x));
  const c: Ctx = {
    k, id, n: e[1],
    base: aj.base,
    why: joindre(g ? g.t : dep?.t, aj.texte), repos: e[3],
    prev: precedentHist(E, id, k) || prev || precedentDe(E.LOG, id, k),
  };
  const max = maxAuDessus(id, maxHist(E, id, k), c.prev);
  return max ? { ...c, max } : c;
}
export const kLibre = (idx: number, j: number) => `L|${idx}|${j}`;
/* Forme du jour et douleur signalée : charge de départ ajustée, et dite (lib/logic/forme.ts). */
function selonForme(A: Reponses, x: Exercice, id: string, base: { v: number; reps: number }, pas = pasDe(x)) {
  const f = formeDuJour(A);
  return ajuster(x, base, pas, f, zonesDe(id, f?.douleur || []).length > 0);
}
const joindre = (...t: (string | undefined)[]) => t.filter(Boolean).join(" ") || undefined;
/* Séance libre : double progression dans une fourchette de répétitions (fourchette()).
   - Toutes les séries en haut de la fourchette → un palier de plus, et on repart en bas.
   - Toutes dans la fourchette → même charge, une répétition de plus à viser.
   - Sous le bas de la fourchette → même charge ; deux séances de suite → −10 %.
   - Après une pause (10 jours : −10 %, 21 jours : −20 %), la charge est réduite pour reprendre.
   - Trois séances à la même charge sans atteindre le haut : on suggère une variante.
   Poids du corps, gainage et lest sans charge : un cran de plus quand l'objectif est atteint.
   `avant` : les séances précédentes à d, de la plus récente à la plus ancienne. */
const minReps = (d: Journal, dbl: boolean) => {
  const ok = (d.series || []).filter((s) => okDe(d, s));
  return ok.length ? Math.min(...ok.map((s) => (dbl ? s.reps : s.v))) : 0;
};
export function progressionLibre(
  x: Exercice, cible: { s: number; r: number }, d: Journal,
  o: { obj?: number; avant?: Journal[]; maintenant?: number } = {},
): { v: number; reps: number; t: string } | null {
  const ok = (d.series || []).filter((s) => okDe(d, s)), dbl = x.ch === "kg" || x.ch === "lest";
  const v = maxV(d), reps = d.reps ?? cible.r;
  const chargee = x.ch === "kg" || (x.ch === "lest" && v > 0);
  /* une pause : on reprend plus léger, quoi qu'il se soit passé la dernière fois */
  const jours = d.ts ? Math.floor(((o.maintenant ?? Date.now()) - d.ts) / 864e5) : 0;
  if (chargee && jours >= 10) {
    const pas = pasExercice(x), pc = jours >= 21 ? 20 : 10, nv = auPalier(v * (1 - pc / 100), pas);
    if (nv < v) return { v: nv, reps: cible.r, t: tr("Reprise après {n} jours sans cet exercice : −{p} % pour réhabituer tes muscles.", { n: jours, p: pc }) };
  }
  if (d.feel === 2) return { v, reps, t: tr("Même charge : la dernière fois était au-dessus de la cible.") };
  if (x.ch === "dist") return null;

  if (chargee) {
    const pas = pasExercice(x), { bas, haut } = fourchette(cible.r, o.obj), m = minReps(d, dbl), complet = ok.length >= cible.s;
    if (complet && m >= haut)
      return { v: Math.round((v + pas) * 100) / 100, reps: bas, t: tr("Toutes tes séries à {h} répétitions ou plus : +{a} kg, et tu repars à {b} répétitions.", { h: haut, a: nb(pas), b: bas }) };
    /* sous le bas de la fourchette (ou séries manquantes) */
    if (!complet || m < bas) {
      const p = o.avant?.[0];
      if (p && maxV(p) >= v && (minReps(p, dbl) < bas || (p.series || []).filter((s) => okDe(p, s)).length < cible.s)) {
        const nv = auPalier(v * 0.9, pas);
        if (nv < v) return { v: nv, reps: bas, t: tr("Deux séances sous {b} répétitions : −10 % pour repartir sur de bonnes bases.", { b: bas }) };
      }
      return { v, reps: bas, t: tr("Même charge : vise au moins {b} répétitions sur chaque série.", { b: bas }) };
    }
    /* dans la fourchette : même charge, une répétition de plus */
    const vise = Math.min(haut, m + 1);
    const stagne = (o.avant || []).length >= 2 && o.avant!.slice(0, 2).every((p) => maxV(p) === v && minReps(p, dbl) < haut);
    return {
      v, reps: vise,
      t: tr("Même charge, vise {r} répétitions : à {h} sur toutes tes séries, on ajoute {a} kg.", { r: vise, h: haut, a: nb(pas) })
        + (stagne ? " " + tr("Ça stagne depuis trois séances : essaie une variante de l'exercice.") : ""),
    };
  }

  const atteint = ok.length >= cible.s && ok.every((s) => (dbl ? s.reps : s.v) >= cible.r);
  if (!atteint) return null;
  if (x.ch === "lest") return { v, reps: reps + 1, t: tr("Toutes tes séries réussies la dernière fois : une répétition de plus, ou un lest de 2,5 kg.") };
  /* répétitions ou secondes : on part de la série la plus faible, pour que toutes suivent */
  const bas = Math.min(...ok.map((s) => s.v)), pas = pasDe(x);
  if (x.ch === "temps") return { v: bas + pas, reps, t: tr("Toutes tes séries tenues la dernière fois : +{a} s.", { a: pas }) };
  return { v: bas + 1, reps, t: tr("Toutes tes séries réussies la dernière fois : une répétition de plus.") };
}

export function ctxLibre(E: Etat, idx: number, j: number): Ctx | null {
  const S = E.SEANCES[idx], e = S?.ex[j];
  if (!e || !EX[e.id]) return null;
  const x = EX[e.id], k = kLibre(idx, j), h = historiqueEx(E, e.id, k, 3), d = h[0] ?? precedentDe(E.LOG, e.id, k);
  const pr = d ? progressionLibre(x, e, d, { obj: S.obj ?? S.gen?.obj, avant: h.slice(1) }) : null;
  const aj = selonForme(E.A, x, e.id, pr ? { v: pr.v, reps: pr.reps } : d ? { v: maxV(d), reps: d.reps ?? e.r } : { v: x.d, reps: e.r }, pasExercice(x));
  return {
    k, id: e.id, n: e.s,
    base: aj.base,
    why: joindre(pr ? pr.t : d ? tr("Reprise de ta dernière séance sur cet exercice.") : undefined, aj.texte),
    repos: e.p, prev: d,
    ...(() => { const max = maxAuDessus(e.id, maxHist(E, e.id, k), d); return max ? { max } : {}; })(),
  };
}

/* Journal mis de côté : il garde sa place dans l'historique (la clé commence toujours par
   « L|i| »), mais ne s'affiche plus sous un exercice de la séance. Vide, il est simplement retiré. */
export function archiver(LOG: Record<string, Journal>, k: string) {
  const L = LOG[k];
  delete LOG[k];
  if (!L || !(L.series || []).some((s) => okDe(L, s))) return;
  const [a, b, c] = k.split("|");
  let n = `${a}|${b}|a${c.replace(/^a/, "")}`;
  while (LOG[n]) n += "+";
  LOG[n] = L;
}

/* Journal de l'exercice, créé au premier geste. Mute LOG (appelé dans le store). */
import { LESTABLE } from "@/lib/data/referentiels";
export function journal(LOG: Record<string, Journal>, c: Ctx): Journal {
  /* un journal laissé là par un autre exercice (séance modifiée) n'est pas le sien */
  if (LOG[c.k] && LOG[c.k].ex !== c.id) archiver(LOG, c.k);
  let L = LOG[c.k];
  if (!L) {
    L = LOG[c.k] = {
      done: false, ...c.base, nb: c.n, feel: null, ex: c.id, ts: Date.now(), why: c.why,
      series: Array.from({ length: c.n }, () => ({ ...c.base, ok: false })),
    };
    /* Lest de la dernière fois repris d'office. */
    if (LESTABLE.has(c.id) && c.prev && c.prev.lest) {
      L.lest = true;
      const P = c.prev.series || [];
      L.series.forEach((sr, n) => { sr.lest = +((P[n] || P[P.length - 1] || ({} as Serie)).lest ?? 0) || 0; });
    }
  }
  seriesDe(L, c.n);
  L.series.forEach((s) => { if (s.ok === undefined) s.ok = !!L.done; });
  return L;
}
export function majJournal(L: Journal) {
  L.done = L.series.length > 0 && L.series.every((s) => s.ok);
  if (!L.done) L.plie = false;
  L.v = maxV(L);
  L.reps = L.series[0] ? L.series[0].reps : L.reps;
  L.ts = Date.now();
}

/* ---------------- historique d'un exercice ---------------- */
export type LigneHisto = { label: string; v: number; reps: number; lest: number };
export function histo(E: Etat, id: string, idx: number): LigneHisto[] {
  if (idx < 0) {
    return Object.values(E.LOG)
      .filter((L) => L && L.done && L.ex === id)
      .sort((a, b) => (a.ts || 0) - (b.ts || 0))
      .slice(-8)
      .map((L) => ({
        label: L.ts ? new Date(L.ts).toLocaleDateString(loc(), { day: "2-digit", month: "2-digit" }) : "—",
        v: maxV(L), reps: L.reps ?? 0, lest: lestMax(L),
      }));
  }
  const W = week(E), rows: LigneHisto[] = [];
  for (let w = 0; w < 8; w++)
    for (let s = 0; s < W.length; s++) {
      const kk = key(w, s, idx), x = W[s].x?.[idx];
      if (x && curId(E, w, s, idx, x[0], W) === id && E.LOG[kk]?.done)
        rows.push({ label: "S" + (w + 1), v: E.LOG[kk].v ?? maxV(E.LOG[kk]), reps: E.LOG[kk].reps ?? 0, lest: lestMax(E.LOG[kk]) });
    }
  return rows;
}

/* Alternatives d'un exercice : même schéma moteur, matériel déclaré. */
export const alternativesDe = (A: Reponses, id: string) =>
  Object.keys(EX).filter((o) => EX[o].pat === EX[id].pat && dispoDeclare(A, o));

/* ---------------- fin de semaine et fin de cycle (Oxa Plan v2) ---------------- */
const lundiDeTs = (t: number) => { const d = new Date(t); d.setHours(12, 0, 0, 0); d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); return d.toDateString(); };
/** La semaine du programme est bouclée et une nouvelle semaine du calendrier a commencé depuis
    la dernière séance : on passe tout seul à la semaine suivante. */
export function passerSemaine(E: Etat, maintenant = Date.now(), W = week(E)): boolean {
  if (E.wk >= 7 || !wkFull(E, E.wk, W)) return false;
  const ts = Object.entries(E.LOG).filter(([k]) => k.startsWith(E.wk + "|")).map(([, L]) => L.ts || 0);
  const der = Math.max(0, ...ts);
  return !!der && lundiDeTs(maintenant) !== lundiDeTs(der);
}
/** Bilan du cycle : pour chaque exercice principal fait en semaine 1 et en fin de cycle (le même
    exercice, au même emplacement), la meilleure charge d'avant et d'après. */
export function bilanCycle(E: Etat, W = week(E, 0)): { id: string; avant: number; apres: number }[] {
  const out: { id: string; avant: number; apres: number }[] = [];
  W.forEach((S, si) => (S.x || []).forEach((e, i) => {
    if (!e[4]) return;
    const L0 = E.LOG[key(0, si, i)];
    if (!L0?.done || !EX[L0.ex]) return;
    for (let w = 7; w >= 1; w--) {
      const L = E.LOG[key(w, si, i)];
      if (L?.done && L.ex === L0.ex) { out.push({ id: L0.ex, avant: maxV(L0), apres: maxV(L) }); return; }
    }
  }));
  return out.filter((x, k) => out.findIndex((y) => y.id === x.id) === k).slice(0, 4);
}
