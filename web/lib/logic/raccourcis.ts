/* Raccourcis du choix des muscles (20/11/2026) : Full body, Haut du corps, Bas du corps.
   Mêmes groupes que les séances qu'Oxa propose lui-même (recommandation.ts), pour qu'un raccourci
   coche exactement ce qu'Oxa conseille ailleurs. Logique pure. */
import { tr } from "@/lib/i18n";
import { MUSC } from "@/lib/data/referentiels";

export const FULL_BODY = ["pec", "dos", "qua", "isc", "epa", "abd"] as const;
export const HAUT_CORPS = ["pec", "dos", "epa", "bic", "tri"] as const;
export const BAS_CORPS = ["qua", "isc", "mol", "abd"] as const;

export type CleRaccourci = "full" | "haut" | "bas";
export const RACCOURCIS: { k: CleRaccourci; n: () => string; d: () => string; m: readonly string[] }[] = [
  { k: "full", n: () => tr("Full body"), d: () => tr("tout le corps"), m: FULL_BODY },
  { k: "haut", n: () => tr("Haut du corps"), d: () => tr("pecs, dos, épaules, bras"), m: HAUT_CORPS },
  { k: "bas", n: () => tr("Bas du corps"), d: () => tr("jambes et abdos"), m: BAS_CORPS },
];

/** Le raccourci dont ces muscles sont exactement la sélection (dans n'importe quel ordre). */
export function raccourciDe(m: readonly string[]): CleRaccourci | null {
  const r = RACCOURCIS.find((x) => x.m.length === m.length && x.m.every((k) => m.includes(k)));
  return r ? r.k : null;
}

/** Le nom d'une sélection de muscles : celui du raccourci (« Haut du corps »), sinon « Épaules · Dos ». */
export function nomMuscles(m: readonly string[]): string {
  const r = RACCOURCIS.find((x) => x.k === raccourciDe(m));
  return r ? r.n() : m.map((k) => MUSC.find((g) => g.k === k)?.n ?? k).join(" · ");
}
