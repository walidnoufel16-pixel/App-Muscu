import { describe, expect, it } from "vitest";
import { EX } from "@/lib/data/exercices";
import { ajuster, formeDuJour, niveau, zonesActives, zonesDe, type Forme } from "@/lib/logic/forme";
import { ctxLibre } from "@/lib/logic/core";
import { construireSeance } from "@/lib/logic/assistant";
import type { Etat } from "@/lib/logic/types";

const auj = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; };
const F = (sommeil: number, energie: number, courbatures: number, douleur: number[] = []): Forme => ({ d: auj(), sommeil, energie, courbatures, douleur });

describe("forme du jour", () => {
  it("niveaux", () => {
    expect(niveau(F(0, 0, 0))).toBe(-2);
    expect(niveau(F(0, 1, 2))).toBe(-1);
    expect(niveau(F(1, 1, 1))).toBe(0);
    expect(niveau(F(2, 2, 2))).toBe(1);
  });
  it("ne compte que celle d'aujourd'hui", () => {
    expect(formeDuJour({ forme: { ...F(0, 0, 0), d: "2020-01-01" } })).toBeNull();
    expect(formeDuJour({ forme: F(0, 0, 0) })).not.toBeNull();
  });
  it("ajuste la charge et l'explique", () => {
    const dc = EX.dc;
    expect(ajuster(dc, { v: 60, reps: 8 }, 2.5, F(0, 0, 0), false)).toMatchObject({ base: { v: 55 }, texte: expect.stringContaining("−5 kg") });
    expect(ajuster(dc, { v: 60, reps: 8 }, 2.5, F(1, 1, 2), false)).toEqual({ base: { v: 60, reps: 8 } });
    expect(ajuster(dc, { v: 60, reps: 8 }, 2.5, F(2, 2, 2), false).texte).toContain("Grande forme");
    expect(ajuster(dc, { v: 60, reps: 8 }, 2.5, F(1, 1, 2), true)).toMatchObject({ base: { v: 57.5 }, texte: expect.stringContaining("douloureuse") });
    expect(ajuster(dc, { v: 60, reps: 8 }, 2.5, null, false)).toEqual({ base: { v: 60, reps: 8 } });
  });
  it("s'applique à la séance libre (charge de départ et raison)", () => {
    const E = {
      A: { forme: F(0, 0, 0) }, SWAP: {}, SWAPP: {}, PLAN: null, wk: 0, day: 0, FINI: false,
      SEANCES: [{ nom: "Push", ex: [{ id: "dc", s: 3, r: 8, p: "2 min" }] }],
      LOG: { "L|9|0": { done: true, feel: 1, ex: "dc", ts: 1, v: 60, reps: 8, series: [{ v: 60, reps: 8, ok: true }] } },
    } as unknown as Etat;
    const c = ctxLibre(E, 0, 0)!;
    expect(c.base.v).toBe(55);
    expect(c.why).toContain("Reprise de ta dernière séance");
    expect(c.why).toContain("Forme du jour basse");
  });
});

describe("zones sensibles", () => {
  it("déclarées et douleur du jour, sans « rien à signaler »", () => {
    expect(zonesActives({ blessure: [2, 4], forme: F(1, 1, 1, [0]) })).toEqual([0, 2]);
  });
  it("exercices repérés par zone", () => {
    expect(zonesDe("sq", [2])).toEqual([2]);
    expect(zonesDe("sdt", [1])).toEqual([1]);
    expect(zonesDe("dc", [2])).toEqual([]);
  });
  it("l'assistant évite les exercices à ménager quand il a le choix", () => {
    const sel = ["m0", "m1", "m2", "m3"];
    for (let i = 0; i < 20; i++) {
      const ex = construireSeance(["qua"], 45, 0, sel, Math.random, (o) => zonesDe(o, [2]).length > 0);
      const surs = ex.filter((e) => zonesDe(e.id, [2]).length === 0);
      expect(surs.length).toBeGreaterThan(0);
    }
  });
});
