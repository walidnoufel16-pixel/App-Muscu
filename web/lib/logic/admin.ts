/* Accès admin : agrégats sur tous les comptes (fonctions serveur admin_*,
   migration 20261006090000_admin.sql). Logique pure, rien n'est stocké. */
import { loc, pluriel, tr } from "@/lib/i18n";
import { MATN, OBJN } from "@/lib/data/referentiels";
import { avecSorties } from "./course";
import { dateDe, decaler, jourDe, semaines } from "./historique";
import type { Etat } from "./types";

export type CompteAdmin = {
  id: string; email: string | null; anonyme: boolean; cree: string; connexion: string | null;
  pseudo: string | null; maj: string | null; etat: Partial<Etat>;
  /* programme sur 8 semaines ouvert pour ce compte */
  programme?: boolean;
};
export type FicheAdmin = CompteAdmin & {
  defis: { code: string; nom: string; type: string; cible: number; debut: string; fin: string; score: number }[];
  generations: { jour: string; n: number }[];
};
export type StatsAdmin = {
  generations: { jour: string; n: number; comptes: number }[];
  cache: number;
  defis: { code: string; nom: string; type: string; cible: number; debut: string; fin: string; participants: number }[];
  partages: number;
  partages_recents: { nom: string; cree: string }[];
  /* absents tant que la migration sources_avis n'est pas passée */
  sources?: { source: string; comptes: number; actifs7: number }[];
  avis?: { texte: string; seances: number | null; cree: string; pseudo: string | null }[];
};

/* Plafond quotidien de générations par IA, tous comptes confondus (secret QUOTA_TOTAL de generer). */
export const PLAFOND_IA = 150;

const H = (c: CompteAdmin) => c.etat.HIST || [];
const C = (c: CompteAdmin) => avecSorties(c.etat.CARDIO, c.etat.SORTIES);
/** Instant (ms) d'une date du serveur. Postgres envoie des microsecondes
    (« 2026-10-04 09:54:24.478679+00 ») que Safari lit mal : on les ramène au format ISO strict. */
export function instant(t: string | null | undefined): number | null {
  if (!t) return null;
  const m = String(t).trim().match(/^(\d{4}-\d{2}-\d{2})(?:[T ](\d{2}:\d{2}(?::\d{2})?)(?:\.(\d+))?)?\s*(Z|[+-]\d{2}(?::?\d{2})?)?$/i);
  if (!m) { const v = Date.parse(t); return Number.isFinite(v) ? v : null; }
  const [, d, h = "00:00:00", f = "", z] = m;
  const hh = h.length === 5 ? h + ":00" : h;
  const tz = !z ? "Z" : z.toUpperCase() === "Z" ? "Z" : z.length === 3 ? z + ":00" : z.includes(":") ? z : z.slice(0, 3) + ":" + z.slice(3);
  const v = Date.parse(`${d}T${hh}.${(f + "000").slice(0, 3)}${tz}`);
  return Number.isFinite(v) ? v : null;
}
export const jourIso = (t: string | null) => { const v = instant(t); return v == null ? null : jourDe(v); };

/** Dernier jour d'entraînement (séance, cardio ou sortie), à défaut la dernière synchronisation. */
export function derniereActivite(c: CompteAdmin): string | null {
  const j = [...H(c).map((l) => l.d), ...C(c).map((x) => jourDe(x.ts))].sort().at(-1);
  return j || jourIso(c.maj);
}

export type Resume = {
  seances: number; muscu: number; cardio: number; sorties: number; km: number;
  derniere: string | null; plan: string | null; course: boolean; objectif: string; materiel: string;
};
export function resume(c: CompteAdmin): Resume {
  const E = c.etat, A = E.A || {}, cardio = C(c).filter((x) => !x.ref && !x.run).length;
  const plan = E.FINI || E.PLAN ? tr("Semaine {a}/8", { a: (E.wk ?? 0) + 1 }) : null;
  return {
    seances: H(c).length + C(c).filter((x) => !x.ref).length, muscu: H(c).length, cardio,
    sorties: (E.SORTIES || []).length, km: Math.round((E.SORTIES || []).reduce((n, s) => n + s.km, 0)),
    derniere: derniereActivite(c), plan, course: !!E.COURSE,
    objectif: tr(OBJN[A.objectif ?? -1] || "—"), materiel: tr(MATN[A.materiel ?? -1] || "—"),
  };
}

const compte = <T extends string>(l: T[]) => {
  const m = new Map<T, number>();
  for (const x of l) m.set(x, (m.get(x) || 0) + 1);
  return [...m].sort((a, b) => b[1] - a[1]);
};

export type Tableau = {
  total: number; avecMail: number; anonymes: number; nouveaux7: number; nouveaux30: number; actifs7: number; actifs30: number;
  semaines: { lundi: string; seances: number; comptes: number }[];
  usage: { k: string; n: string; comptes: number }[];
  topEx: { id: string; seances: number; comptes: number }[];
  objectifs: [string, number][]; materiel: [string, number][];
};

export function tableau(L: CompteAdmin[], auj = jourDe(Date.now())): Tableau {
  const depuis = (n: number) => decaler(auj, -n + 1);
  const der = L.map(derniereActivite);
  const sem = L.map((c) => semaines(H(c), C(c), 8, auj));
  const ex = new Map<string, { seances: number; comptes: Set<string> }>();
  for (const c of L) for (const l of H(c)) for (const id in l.ex) {
    const e = ex.get(id) || { seances: 0, comptes: new Set<string>() };
    e.seances++; e.comptes.add(c.id); ex.set(id, e);
  }
  const usage: [string, string, (c: CompteAdmin) => boolean][] = [
    ["plan", tr("Plan de 8 semaines"), (c) => !!(c.etat.FINI || c.etat.PLAN)],
    ["carte", tr("Séances à la carte"), (c) => H(c).some((l) => l.s.startsWith("L")) || (c.etat.SEANCES || []).length > 0],
    ["cardio", tr("Cardio"), (c) => (c.etat.CARDIO || []).some((x) => !x.ref)],
    ["combinee", tr("Séances combinées"), (c) => (c.etat.CARDIO || []).some((x) => !!x.ref)],
    ["course", tr("Préparation course"), (c) => !!c.etat.COURSE || (c.etat.SORTIES || []).length > 0],
    ["defis", tr("Défis entre amis"), (c) => ((c.etat.A?.defis as string[] | undefined) || []).length > 0],
    ["forme", tr("Forme du jour"), (c) => !!c.etat.A?.forme || !!c.etat.A?.formePassee],
    ["prot", tr("Suivi des protéines"), (c) => Object.keys((c.etat.A?.prot as object | undefined) || {}).length > 0],
  ];
  const avecReponses = L.filter((c) => c.etat.A && c.etat.A.objectif != null);
  return {
    total: L.length,
    avecMail: L.filter((c) => c.email).length,
    anonymes: L.filter((c) => !c.email).length,
    nouveaux7: L.filter((c) => (jourIso(c.cree) || "") >= depuis(7)).length,
    nouveaux30: L.filter((c) => (jourIso(c.cree) || "") >= depuis(30)).length,
    actifs7: der.filter((d) => (d || "") >= depuis(7)).length,
    actifs30: der.filter((d) => (d || "") >= depuis(30)).length,
    semaines: (sem[0] || semaines([], [], 8, auj)).map((s, i) => ({
      lundi: s.lundi,
      seances: sem.reduce((n, l) => n + l[i].seances, 0),
      comptes: sem.filter((l) => l[i].seances > 0).length,
    })),
    usage: usage.map(([k, n, f]) => ({ k, n, comptes: L.filter(f).length })),
    topEx: [...ex].map(([id, e]) => ({ id, seances: e.seances, comptes: e.comptes.size }))
      .sort((a, b) => b.seances - a.seances || a.id.localeCompare(b.id)).slice(0, 10),
    objectifs: compte(avecReponses.map((c) => tr(OBJN[c.etat.A!.objectif!] || "—"))),
    materiel: compte(avecReponses.map((c) => tr(MATN[c.etat.A!.materiel ?? -1] || "—"))),
  };
}

export type Tri = "activite" | "inscription" | "seances";
/** Liste filtrée (surnom ou e-mail) et triée. */
export function filtrer(L: CompteAdmin[], q: string, tri: Tri): CompteAdmin[] {
  const t = q.trim().toLowerCase();
  const l = t ? L.filter((c) => (c.pseudo || "").toLowerCase().includes(t) || (c.email || "").toLowerCase().includes(t)) : L.slice();
  const cle = (c: CompteAdmin) =>
    tri === "inscription" ? c.cree : tri === "seances" ? String(resume(c).seances).padStart(6, "0") : derniereActivite(c) || "";
  return l.sort((a, b) => cle(b).localeCompare(cle(a)));
}

export const court = (j: string) => dateDe(j).toLocaleDateString(loc(), { day: "numeric", month: "short" }).replace(".", "");
/** « aujourd'hui », « hier », « il y a 5 j », puis la date. */
export const ilya = (j: string | null, auj = jourDe(Date.now())) => {
  if (!j) return tr("jamais");
  const n = Math.round((dateDe(auj).getTime() - dateDe(j).getTime()) / 864e5);
  return n <= 0 ? tr("aujourd'hui") : n === 1 ? tr("hier") : n < 31 ? tr("il y a {n} j", { n }) : court(j);
};
/** « 1 séance », « 3 séances ». */
export const pl = (n: number, mot: string) => `${n} ${mot}${pluriel(n) ? "s" : ""}`;

/* ---------------- Vue d'ensemble (Admin en 3 onglets) ----------------
   Les comptes « exclus » (l'admin, ses comptes de test) ne comptent pas dans les chiffres. */
export type FiltreTesteurs = "tous" | "seance" | "sans";
export const aFaitUneSeance = (c: CompteAdmin) => resume(c).seances > 0;
/** Les testeurs (comptes non exclus), avec le filtre de l'onglet Testeurs. */
export function testeurs(L: CompteAdmin[], exclus: string[], f: FiltreTesteurs = "tous"): CompteAdmin[] {
  const ex = new Set(exclus), l = L.filter((c) => !ex.has(c.id));
  return f === "seance" ? l.filter(aFaitUneSeance) : f === "sans" ? l.filter((c) => !aFaitUneSeance(c)) : l;
}
export type VueTesteurs = { total: number; nouveaux7: number; inscrits: number; inscritsAvecSeance: number; seances: number; seances7: number };
/* Période de la Vue d'ensemble : les « jours » derniers jours, aujourd'hui compris (1 : aujourd'hui ; 3650 : tout). */
export const TOUT = 3650;
/** Vrai si l'instant (ISO) tombe sur la période. */
export const surPeriode = (cree: string | null, jours: number, auj = jourDe(Date.now())) => (jourIso(cree) || "") >= decaler(auj, -jours + 1);
/** Les testeurs dont le compte a été créé sur la période. */
export const inscritsSurPeriode = (L: CompteAdmin[], exclus: string[], jours: number, auj = jourDe(Date.now())) =>
  testeurs(L, exclus).filter((c) => surPeriode(c.cree, jours, auj));
/** Chiffres des testeurs sur la période (jours ; TOUT pour « tout »). */
export function vueTesteurs(L: CompteAdmin[], exclus: string[], jours: number, auj = jourDe(Date.now())): VueTesteurs {
  const t = testeurs(L, exclus), d0 = decaler(auj, -jours + 1), d7 = decaler(auj, -6);
  const inscrits = inscritsSurPeriode(L, exclus, jours, auj);
  const jSeances = t.flatMap((c) => [...H(c).map((l) => l.d), ...C(c).filter((x) => !x.ref).map((x) => jourDe(x.ts))]);
  return {
    total: t.length,
    nouveaux7: t.filter((c) => (jourIso(c.cree) || "") >= d7).length,
    inscrits: inscrits.length,
    inscritsAvecSeance: inscrits.filter(aFaitUneSeance).length,
    seances: jSeances.filter((d) => d >= d0).length,
    seances7: jSeances.filter((d) => d >= d7).length,
  };
}
/** Nom lisible d'une source (?src= du lien). */
export function nomSource(src: string): string {
  const s = src.toLowerCase();
  if (!s) return tr("Lien direct ou inconnu");
  if (/^(insta|instagram|ig)/.test(s)) return "Instagram";
  if (/^(tiktok|tt)/.test(s)) return "TikTok";
  if (/^(yt|youtube)/.test(s)) return "YouTube";
  if (/^(blog|guide)/.test(s)) return tr("Blog");
  if (/^mail/.test(s)) return tr("E-mail");
  if (/^reddit/.test(s)) return "Reddit";
  return src;
}
/** Les sources regroupées par nom lisible, de la plus fréquente à la moins fréquente. */
export function sourcesLisibles(l: { source: string; n: number }[]): [string, number][] {
  const m = new Map<string, number>();
  for (const x of l) m.set(nomSource(x.source), (m.get(nomSource(x.source)) || 0) + x.n);
  return [...m].sort((a, b) => b[1] - a[1]);
}

/* Entonnoir des nouveaux visiteurs : chaque étape avec sa part des visiteurs et le taux de passage
   depuis l'étape précédente ; « perte » : l'étape où l'on perd la plus grande part des gens (au moins
   3 personnes à l'étape d'avant, pour ne pas crier au loup sur un seul appareil). */
export type EtapeEntonnoir = { k: "ouverture" | "visite" | "chemin" | "prete" | "agit" | "seance" | "deux"; n: number; part: number; passage: number | null };
export function etapesEntonnoir(e: Partial<Record<EtapeEntonnoir["k"], number>>): { etapes: EtapeEntonnoir[]; perte: number | null } {
  const ks: EtapeEntonnoir["k"][] = ["ouverture", "visite", "chemin", "prete", "agit", "seance", "deux"];
  const base = e.ouverture || 0;
  const etapes = ks.map((k, i) => {
    const n = e[k] || 0, avant = i ? e[ks[i - 1]] || 0 : 0;
    return { k, n, part: base ? Math.round((n / base) * 100) : 0, passage: i && avant ? Math.min(100, Math.round((n / avant) * 100)) : null };
  });
  let perte: number | null = null, pire = 101;
  etapes.forEach((x, i) => {
    if (i && (e[ks[i - 1]] || 0) >= 3 && x.passage != null && x.passage < pire) { pire = x.passage; perte = i; }
  });
  return { etapes, perte };
}
