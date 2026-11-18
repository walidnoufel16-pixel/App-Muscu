/* Admin › Technique : le statut de chaque erreur du journal.
   - « ignorée » : bruit connu, analysé une fois pour toutes (l'app ne le remonte plus) ;
   - « analysée » : erreur marquée par l'admin, avec sa note (table erreurs_analyses) ;
   - « à regarder » : tout le reste. */
import { tr } from "@/lib/i18n";

export type Analyse = { message: string; note: string; cree: string };
export type Statut = { etat: "a_regarder" | "analysee" | "ignoree"; note: string };

/* Bruit connu (même liste que le filtre de lib/mesure.ts, qui ne le remonte plus) */
const BRUIT: { re: RegExp; note: () => string }[] = [
  { re: /^Error: Script error\.?$/, note: () => tr("Script extérieur à l'appli (extension, traduction, bloqueur de pub) : le navigateur en cache le détail. Plus remontée depuis le 18 nov.") },
  { re: /Transition was aborted|Transition was skipped|Skipping view transition/i, note: () => tr("Animation de changement d'écran annulée quand l'appli passe en arrière-plan, sans effet visible. Plus remontée depuis le 9 nov.") },
  { re: /ResizeObserver loop/i, note: () => tr("Avertissement du navigateur sans effet visible.") },
];

export function statutErreur(message: string, analyses: Analyse[]): Statut {
  const b = BRUIT.find((x) => x.re.test(message));
  if (b) return { etat: "ignoree", note: b.note() };
  const a = analyses.find((x) => x.message === message);
  if (a) return { etat: "analysee", note: a.note };
  return { etat: "a_regarder", note: "" };
}
/** Les erreurs à regarder d'abord, puis les analysées, puis le bruit connu. */
export function trierErreurs<T extends { message: string; n: number }>(l: T[], analyses: Analyse[]): (T & { statut: Statut })[] {
  const rang = { a_regarder: 0, analysee: 1, ignoree: 2 } as const;
  return l.map((e) => ({ ...e, statut: statutErreur(e.message, analyses) }))
    .sort((a, b) => rang[a.statut.etat] - rang[b.statut.etat] || b.n - a.n);
}
export const aRegarder = (l: { message: string }[], analyses: Analyse[]) => l.filter((e) => statutErreur(e.message, analyses).etat === "a_regarder").length;
