/* Accès admin : agrégats sur tous les comptes (fonctions serveur admin_*,
   migration 20261006090000_admin.sql). Logique pure, rien n'est stocké. */
import { MATN, OBJN } from "@/lib/data/referentiels";
import { avecSorties } from "./course";
import { dateDe, decaler, jourDe, semaines } from "./historique";
import type { Etat } from "./types";

export type CompteAdmin = {
  id: string; email: string | null; anonyme: boolean; cree: string; connexion: string | null;
  pseudo: string | null; maj: string | null; etat: Partial<Etat>;
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
  const plan = E.FINI || E.PLAN ? `Semaine ${(E.wk ?? 0) + 1}/8` : null;
  return {
    seances: H(c).length + C(c).filter((x) => !x.ref).length, muscu: H(c).length, cardio,
    sorties: (E.SORTIES || []).length, km: Math.round((E.SORTIES || []).reduce((n, s) => n + s.km, 0)),
    derniere: derniereActivite(c), plan, course: !!E.COURSE,
    objectif: OBJN[A.objectif ?? -1] || "—", materiel: MATN[A.materiel ?? -1] || "—",
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
    ["plan", "Plan de 8 semaines", (c) => !!(c.etat.FINI || c.etat.PLAN)],
    ["carte", "Séances à la carte", (c) => H(c).some((l) => l.s.startsWith("L")) || (c.etat.SEANCES || []).length > 0],
    ["cardio", "Cardio", (c) => (c.etat.CARDIO || []).some((x) => !x.ref)],
    ["combinee", "Séances combinées", (c) => (c.etat.CARDIO || []).some((x) => !!x.ref)],
    ["course", "Préparation course", (c) => !!c.etat.COURSE || (c.etat.SORTIES || []).length > 0],
    ["defis", "Défis entre amis", (c) => ((c.etat.A?.defis as string[] | undefined) || []).length > 0],
    ["forme", "Forme du jour", (c) => !!c.etat.A?.forme || !!c.etat.A?.formePassee],
    ["prot", "Suivi des protéines", (c) => Object.keys((c.etat.A?.prot as object | undefined) || {}).length > 0],
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
    objectifs: compte(avecReponses.map((c) => OBJN[c.etat.A!.objectif!] || "—")),
    materiel: compte(avecReponses.map((c) => MATN[c.etat.A!.materiel ?? -1] || "—")),
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

export const court = (j: string) => dateDe(j).toLocaleDateString("fr-FR", { day: "numeric", month: "short" }).replace(".", "");
/** « aujourd'hui », « hier », « il y a 5 j », puis la date. */
export const ilya = (j: string | null, auj = jourDe(Date.now())) => {
  if (!j) return "jamais";
  const n = Math.round((dateDe(auj).getTime() - dateDe(j).getTime()) / 864e5);
  return n <= 0 ? "aujourd'hui" : n === 1 ? "hier" : n < 31 ? `il y a ${n} j` : court(j);
};
/** « 1 séance », « 3 séances ». */
export const pl = (n: number, mot: string) => `${n} ${mot}${n > 1 ? "s" : ""}`;
