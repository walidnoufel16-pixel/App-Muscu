import { describe, expect, it } from "vitest";
import { EX } from "@/lib/data/exercices";
import { PAT2MUSC, TYPES } from "@/lib/data/referentiels";
import { COURANTS, exosCourants, MUSCLES_PREMIERE } from "@/components/repere/premiere-seance";

const TOUT = TYPES.map(([t]) => t);

describe("première séance : exercices courants", () => {
  it("chaque exercice courant existe et travaille bien ce muscle", () => {
    for (const [k, l] of Object.entries(COURANTS)) for (const o of l) {
      expect(EX[o], o).toBeDefined();
      expect(PAT2MUSC[EX[o].pat], o).toBe(k);
    }
  });
  it("chaque muscle proposé a des exercices, les courants d'abord, 6 au plus", () => {
    for (const k of MUSCLES_PREMIERE) {
      const { debut, reste } = exosCourants(k, TOUT);
      expect(debut.length, k).toBeGreaterThan(0);
      expect(debut.length, k).toBeLessThanOrEqual(6);
      expect(debut[0], k).toBe(COURANTS[k][0]);
      expect(debut.some((o) => reste.includes(o)), k).toBe(false);
    }
  });
  it("au poids du corps, seulement des exercices faisables sans matériel", () => {
    const { debut } = exosCourants("pec", ["m3"]);
    expect(debut.length).toBeGreaterThan(0);
    expect(debut.every((o) => EX[o].eq === 3)).toBe(true);
  });
});
