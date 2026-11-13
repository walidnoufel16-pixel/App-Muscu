/* Séance guidée : le gabarit en cases (audit coach et design du 13 novembre 2026).
   Les cases (un muscle et un rôle : « Complément · Dos ») sont celles qu'Oxa remplirait lui-même
   pour ces muscles, cette durée et ce niveau : on les prend dans la séance qu'il construit
   (casesPour), donc mêmes règles, calculées muscle par muscle, jamais un ratio fixe.
   Rien n'est jamais bloqué : un exercice qui ne va dans aucune case reste « en plus ».
   Logique pure. */
import { EX } from "@/lib/data/exercices";
import { PAT2MUSC } from "@/lib/data/referentiels";
import { estSoin } from "@/lib/data/soin";
import { exoFiltre } from "./core";
import { casesPour } from "./generer-seance";
import { convientA, EXPLOSIFS, PORTES, rang, roleDe } from "./roles";
import type { Etat, ExLibre, RoleEx } from "./types";

export type CaseG = { k: string; ro: RoleEx };
/** m : muscles choisis ; d : durée (min) ; cases et, pour chacune, l'exercice qu'Oxa y mettrait. */
export type Gabarit = { m: string[]; d: number; cases: CaseG[]; sug: string[] };
/** Un exercice du brouillon, avec le muscle de la case où il a été choisi. */
export type ExCase = ExLibre & { k?: string };

export const ROLES_BLOCS: RoleEx[] = ["b", "c", "i", "g"];

export function gabaritPour(E: Etat, m: string[], d: number, obj: number, sel: string[], jour: string): Gabarit {
  const l = casesPour(E, m, d, obj, sel, jour);
  return { m: [...m], d, cases: l.map((e) => ({ k: e.k, ro: e.ro ?? "i" })), sug: l.map((e) => e.id) };
}

const muscu = (id: string) => !!EX[id] && !estSoin(id) && EX[id].pat !== "ca" && EX[id].ch !== "dist";

/** Le bloc où s'affiche un exercice de musculation : son rôle ; un explosif avec les Base (en tête),
    un porté avec le Gainage (en fin), un exercice sans rôle avec l'Isolation. */
export function blocDe(e: ExLibre): RoleEx {
  if (EXPLOSIFS.has(e.id)) return "b";
  if (PORTES.has(e.id)) return "g";
  return e.ro ?? roleDe(e.id) ?? "i";
}

const compatible = (c: RoleEx, b: RoleEx) => (c === "b" || c === "c" ? b === "b" || b === "c" : b === c);

/** Pour chaque case, l'indice de l'exercice qui la remplit (-1 : vide). D'abord un exercice choisi
    pour ce muscle, puis un exercice ajouté librement dont c'est le muscle principal, puis (Base et
    Complément) un exercice qui le travaille en second. */
export function remplissage(ex: ExCase[], cases: CaseG[]): number[] {
  const pris = new Set<number>();
  const ok = (c: CaseG, e: ExCase, i: number) => !pris.has(i) && muscu(e.id) && !!roleDe(e.id) && compatible(c.ro, blocDe(e));
  return cases.map((c) => {
    let j = ex.findIndex((e, i) => ok(c, e, i) && e.k === c.k);
    if (j < 0) j = ex.findIndex((e, i) => ok(c, e, i) && !e.k && PAT2MUSC[EX[e.id].pat] === c.k);
    if (j < 0 && c.ro !== "i" && c.ro !== "g") j = ex.findIndex((e, i) => ok(c, e, i) && !e.k && !!EX[e.id].pat2 && PAT2MUSC[EX[e.id].pat2!] === c.k);
    if (j >= 0) pris.add(j);
    return j;
  });
}

/** Indices des cases vides. */
export const casesVides = (ex: ExCase[], cases: CaseG[]) => remplissage(ex, cases).flatMap((j, i) => (j < 0 ? [i] : []));

/** « 6 exercices : 2 Base · 2 Complément · 2 Isolation » : combien de cases par rôle. */
export function compte(cases: CaseG[]) {
  const n: Record<RoleEx, number> = { b: 0, c: 0, i: 0, g: 0 };
  for (const c of cases) n[c.ro]++;
  return n;
}

const travaille = (id: string, k: string) => PAT2MUSC[EX[id].pat] === k || (!!EX[id].pat2 && PAT2MUSC[EX[id].pat2!] === k);

/** Les exercices qui vont dans cette case avec le matériel coché : ceux du même rôle d'abord. */
export function candidatsCase(c: CaseG, sel: string[], pris: (id: string) => boolean = () => false) {
  const l = Object.keys(EX).filter((o) => muscu(o) && exoFiltre(o, sel) && !pris(o) && travaille(o, c.k) && convientA(c.ro, o, c.k));
  return [...l.filter((o) => roleDe(o, c.k) === c.ro), ...l.filter((o) => roleDe(o, c.k) !== c.ro)];
}

/** Les autres exercices du muscle (autres rôles), pour « Voir tous les exercices ». */
export function autresDuMuscle(c: CaseG, sel: string[], pris: (id: string) => boolean = () => false) {
  return Object.keys(EX).filter((o) => muscu(o) && exoFiltre(o, sel) && !pris(o) && travaille(o, c.k) && !!roleDe(o, c.k) && !convientA(c.ro, o, c.k));
}

/** La suggestion d'Oxa pour une case : l'exercice de sa séance, s'il n'est pas déjà pris, sinon le
    premier qui convient. */
export function suggestion(g: Gabarit, i: number, sel: string[], pris: (id: string) => boolean = () => false): string | undefined {
  const s = g.sug[i];
  if (s && EX[s] && !pris(s) && exoFiltre(s, sel)) return s;
  return candidatsCase(g.cases[i], sel, pris)[0];
}

/** Range la musculation par bloc (explosifs, Base, Complément, Isolation, Gainage, portés), chaque
    exercice gardant sa place dans son bloc ; soin et cardio ne bougent pas. */
export function trierParBloc(ex: ExCase[]) {
  const pos = ex.flatMap((e, i) => (muscu(e.id) ? [i] : []));
  const tries = pos.map((i) => ex[i]).map((e, k) => ({ e, k })).sort((a, b) => rang(a.e) - rang(b.e) || a.k - b.k).map((x) => x.e);
  pos.forEach((i, k) => { ex[i] = tries[k]; });
}
