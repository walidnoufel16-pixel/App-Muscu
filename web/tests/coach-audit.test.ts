/* Audit du 12 novembre 2026 (auditeur-app, I1, I3, I4, M2) : volume des pectoraux en full body,
   mouvement principal des jambes chargé dès le niveau régulier, débutant au poids du corps. */
import { describe, expect, it } from "vitest";
import { construireSeance, hasardDe } from "@/lib/logic/assistant";
import { EX } from "@/lib/data/exercices";

const SALLE = ["m0", "m1", "m2", "m3", "bt"], PDC = ["m3"];
const FULL = ["pec", "dos", "qua", "isc", "epa", "abd"];
const tirages = (m: string[], d: number, obj: number, sel: string[], niveau: number) =>
  Array.from({ length: 20 }, (_, k) => construireSeance(m, d, obj, sel, hasardDe("coach" + m.join() + d + niveau + k), () => false, niveau, { dense: d === 30 }));
const seriesDe = (ex: ReturnType<typeof construireSeance>, pat: string[]) => ex.filter((e) => pat.includes(EX[e.id].pat)).reduce((a, e) => a + e.s, 0);

describe("coach", () => {
  it("full body 45 min, régulier en salle : le développé garde au moins 3 séries", () => {
    for (const ex of tirages(FULL, 45, 0, SALLE, 2)) expect(seriesDe(ex, ["ph"]), JSON.stringify(ex)).toBeGreaterThanOrEqual(3);
  });
  it("régulier et confirmé en salle : le principal des quadriceps se charge vraiment (pas de goblet squat)", () => {
    for (const n of [2, 3])
      for (const ex of tirages(["qua", "isc", "mol"], 60, 0, SALLE, n)) expect(["sq", "sqf", "pr", "hack", "smith"], ex[0].id).toContain(ex[0].id);
  });
  it("débutant au poids du corps : ni pompes larges ni pompes pike, pas plus de 10 répétitions", () => {
    for (const ex of tirages(FULL, 45, 0, PDC, 1)) {
      expect(ex.some((e) => ["pompl", "pompk"].includes(e.id)), JSON.stringify(ex)).toBe(false);
      for (const e of ex) if (EX[e.id].ch === "aucune") expect(e.r, e.id).toBeLessThanOrEqual(10);
    }
  });
  it("un accessoire n'a jamais plus de séries que le principal du même muscle", () => {
    for (const ex of tirages(["pec", "dos", "epa", "bic", "tri"], 45, 0, SALLE, 2)) {
      const principal = (pat: string) => ex.find((e) => e.ro === "b" && EX[e.id].pat === pat)?.s ?? 9;
      for (const e of ex) if (e.ro === "c") expect(e.s, e.id).toBeLessThanOrEqual(principal(EX[e.id].pat) === 9 ? 5 : Math.max(principal(EX[e.id].pat), 3));
    }
  });
});
