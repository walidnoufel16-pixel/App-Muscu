import { describe, expect, it } from "vitest";
import { CORPS, CORPS_F, CORPS_VB, CORPS_VB_F } from "@/lib/data/corps";

/* Silhouettes homme et femme : mêmes muscles touchables, seule la forme change. */
const zones = (R: { z?: string; p?: string; n?: string }[]) => [...new Set(R.filter((r) => r.z).map((r) => `${r.z}|${r.p}|${r.n}`))].sort();

describe("schéma du corps homme / femme", () => {
  for (const cote of ["front", "back"] as const) {
    it(`${cote} : les mêmes zones et groupes musculaires`, () => {
      expect(zones(CORPS_F[cote])).toEqual(zones(CORPS[cote]));
      expect(CORPS_F[cote].every((r) => r.d.startsWith("m") || r.d.startsWith("M"))).toBe(true);
    });
    it(`${cote} : un cadrage pour chaque silhouette`, () => {
      expect(CORPS_VB_F[cote].split(" ").map(Number).every((n) => !isNaN(n))).toBe(true);
      expect(CORPS_VB[cote]).toBeTruthy();
    });
  }
});
