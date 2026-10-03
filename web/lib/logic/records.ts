/* Records personnels et bilan de séance. Logique pure, testée à part. */
import { EX } from "@/lib/data/exercices";
import { okDe } from "./core";
import type { Journal, Serie } from "./types";

/* Score d'une série, comparable d'une séance à l'autre pour un même exercice :
   - charge (kg, lest) : la charge d'abord, les répétitions départagent ;
   - poids du corps : le lest d'abord, puis les répétitions ;
   - temps, distance : la valeur. */
export function score(id: string, s: Serie) {
  const ch = EX[id]?.ch;
  if (ch === "kg" || ch === "lest") return s.v * 1000 + s.reps;
  if (ch === "aucune") return (+(s.lest ?? 0) || 0) * 1000 + s.v;
  return s.v;
}

/* Meilleur score déjà validé sur cet exercice, hors de la ligne `sauf`. 0 si jamais fait. */
export function meilleur(LOG: Record<string, Journal>, id: string, sauf: string) {
  let m = 0;
  for (const k in LOG) {
    const L = LOG[k];
    if (k === sauf || !L || L.ex !== id || !L.series) continue;
    for (const s of L.series) if (okDe(L, s)) m = Math.max(m, score(id, s));
  }
  return m;
}

/* Une série qu'on valide est un record si elle dépasse tout ce qui a déjà été validé sur
   cet exercice : séances passées (il en faut au moins une) et séries déjà cochées aujourd'hui. */
export function estRecord(LOG: Record<string, Journal>, id: string, k: string, s: Serie) {
  const avant = meilleur(LOG, id, k);
  if (avant <= 0) return false;
  const L = LOG[k], auj = L?.series ? Math.max(0, ...L.series.filter((x) => okDe(L, x)).map((x) => score(id, x))) : 0;
  return score(id, s) > Math.max(avant, auj);
}

export type Bilan = { exercices: number; series: number; volume: number; records: number; minutes: number | null };

/* Bilan d'une séance à partir des lignes du journal. Le volume ne compte que les exercices chargés. */
export function bilanDe(lignes: (Journal | undefined)[], records: number, debut: number | null, fin = Date.now()): Bilan {
  let exercices = 0, series = 0, volume = 0;
  for (const L of lignes) {
    if (!L) continue;
    if (L.done) exercices++;
    const ch = EX[L.ex]?.ch;
    for (const s of L.series || []) {
      if (!okDe(L, s)) continue;
      series++;
      if (ch === "kg" || ch === "lest") volume += s.v * s.reps;
    }
  }
  return { exercices, series, volume: Math.round(volume), records, minutes: debut ? Math.max(1, Math.round((fin - debut) / 60000)) : null };
}
