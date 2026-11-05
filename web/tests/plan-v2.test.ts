/* Oxa Plan v2 : périodisation sur 8 semaines, progression des charges, charge de départ. */
import { describe, expect, it } from "vitest";
import { baseRPE, chargeDepart, key, periode, phaseDe, suggere, week } from "@/lib/logic/core";
import type { Etat, Journal } from "@/lib/logic/types";

const plan = {
  seances: [{ titre: "Full body A", focus: "", exercices: [{ id: "dc", series: 3, reps: 8, repos: "2 min", role: 1 }, { id: "cu", series: 3, reps: 12, repos: "60 s", role: 0 }] },
    { titre: "Full body B", focus: "", exercices: [{ id: "sq", series: 3, reps: 8, repos: "2 min", role: 1 }, { id: "rw", series: 3, reps: 10, repos: "90 s", role: 0 }] }],
};
const E = (LOG: Record<string, Journal> = {}, wk = 0): Etat => ({ A: { materiel: 0, socle: 0 }, PLAN: plan, SWAP: {}, SWAPP: {}, LOG, SEANCES: [], wk, day: 0, FINI: true } as unknown as Etat);
const J = (v: number, reps: number[], feel: number | null = 1): Journal => ({ done: true, ex: "dc", ts: 1, v, reps: reps.at(-1), feel, series: reps.map((r) => ({ v, reps: r, ok: true })) } as Journal);

describe("périodisation", () => {
  it("phases et effort : prise en main, accumulation, intensification, pic, allègement", () => {
    expect([0, 1, 2, 3, 4, 5, 6, 7].map((w) => phaseDe(w).k)).toEqual(["prise", "accumulation", "accumulation", "accumulation", "intensification", "intensification", "pic", "allegement"]);
    expect([0, 1, 2, 3, 4, 5, 6, 7].map(baseRPE)).toEqual([7, 7, 8, 8, 8, 9, 9, 6]);
  });
  it("principaux : une série de plus puis moins de répétitions ; allègement : 40 % de séries en moins", () => {
    const e: [string, number, number, string, number] = ["dc", 3, 8, "2 min", 1];
    expect(periode(e, 0)).toEqual(e);
    expect(periode(e, 2).slice(1, 3)).toEqual([4, 8]);
    expect(periode(e, 4).slice(1, 3)).toEqual([4, 6]);
    expect(periode(e, 6).slice(1, 3)).toEqual([3, 5]);
    expect(periode(e, 7).slice(1, 3)).toEqual([2, 8]);
    expect(periode(["cu", 3, 12, "60 s", 0], 4)).toEqual(["cu", 3, 12, "60 s", 0]);
    expect(week(E({}, 2))[0].x![0][1]).toBe(4);
  });
});

describe("progression des charges du programme", () => {
  it("toutes les séries au-dessus des répétitions visées : la charge monte, sans cocher « facile »", () => {
    const e = E({ [key(0, 0, 0)]: J(60, [9, 9, 9]) }, 1);
    expect(suggere(e, 1, 0, 0, "dc")?.v).toBe(62.5);
  });
  it("répétitions juste atteintes : même charge ; ratées : même charge", () => {
    expect(suggere(E({ [key(0, 0, 0)]: J(60, [8, 8, 8]) }, 1), 1, 0, 0, "dc")?.v).toBe(60);
    expect(suggere(E({ [key(0, 0, 0)]: J(60, [8, 7, 6]) }, 1), 1, 0, 0, "dc")?.v).toBe(60);
  });
  it("intensification : moins de répétitions, un peu plus lourd ; allègement : −10 %", () => {
    expect(suggere(E({ [key(3, 0, 0)]: J(60, [8, 8, 8, 8]) }, 4), 4, 0, 0, "dc")?.v).toBe(62.5);
    expect(suggere(E({ [key(6, 0, 0)]: J(70, [5, 5, 5]) }, 7), 7, 0, 0, "dc")?.v).toBe(62.5);
  });
  it("charge de départ d'après l'historique (1RM estimé)", () => {
    const e = { ...E(), HIST: [{ d: "2026-10-01", s: "L|0", nom: "x", vol: 0, ser: 3, ex: { dc: [80, 2400, 80, 10, 3] } }] } as unknown as Etat;
    const c = chargeDepart(e, "dc", 8)!;
    expect(c.v).toBeGreaterThan(70); expect(c.v).toBeLessThan(85);
    expect(chargeDepart(E(), "dc", 8)).toBeNull();
  });
});
