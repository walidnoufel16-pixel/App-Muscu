/* « Ton max » sur un exercice (lib/logic/core.ts). */
import { describe, expect, it } from "vitest";
import { fmtMax, maxAuDessus, maxHist } from "@/lib/logic/core";
import type { Etat, Journal } from "@/lib/logic/types";
import type { LigneHist, PerfEx } from "@/lib/logic/historique";

const ligne = (d: string, s: string, ex: Record<string, PerfEx>): LigneHist => ({ d, s, nom: "t", vol: 0, ser: 3, ex });
const etat = (HIST: LigneHist[], LOG: Etat["LOG"] = {}) => ({ HIST, LOG }) as unknown as Etat;
const prev = (series: [number, number][], lest?: number): Journal => ({ ex: "x", done: true, series: series.map(([v, reps]) => ({ v, reps, ok: true, ...(lest ? { lest } : {}) })) }) as unknown as Journal;

describe("ton max", () => {
  it("8 kg la dernière fois, 10 kg avant : le max est 10 kg, et il s'affiche", () => {
    const E = etat([ligne("2026-10-12", "L|0", { el: [0, 0, 10, 8, 3] }), ligne("2026-11-02", "L|0", { el: [0, 0, 8, 12, 3] })]);
    const m = maxHist(E, "el", "L|0|0")!;
    expect(m).toEqual({ v: 10, reps: 8, d: "2026-10-12" });
    expect(maxAuDessus("el", m, prev([[8, 12], [8, 12], [8, 10]]))).toEqual(m);
    expect(fmtMax("el", m)).toBe("10 kg × 8");
  });
  it("à charge égale, le plus de répétitions l'emporte", () => {
    const E = etat([ligne("2026-10-01", "L|0", { el: [0, 0, 10, 6, 3] }), ligne("2026-10-08", "L|0", { el: [0, 0, 10, 9, 3] })]);
    expect(maxHist(E, "el", "L|0|0")).toMatchObject({ v: 10, reps: 9 });
  });
  it("max égal au précédent : pas de pastille", () => {
    const m = { v: 10, reps: 8, d: "2026-10-12" };
    expect(maxAuDessus("el", m, prev([[10, 8]]))).toBeNull();
  });
  it("la séance en cours ne compte pas", () => {
    const auj = new Date(2026, 10, 5, 12).getTime();
    const E = etat([ligne("2026-11-05", "L|0", { el: [0, 0, 12, 5, 1] }), ligne("2026-10-12", "L|1", { el: [0, 0, 10, 8, 3] })],
      { "L|0|0": { ex: "el", ts: auj, series: [{ v: 12, reps: 5, ok: true }] } as unknown as Journal });
    expect(maxHist(E, "el", "L|0|0")).toMatchObject({ v: 10 });
  });
  it("poids du corps, lest, gainage", () => {
    expect(fmtMax("pomp", { v: 0, reps: 15 })).toBe("15 réps");
    expect(fmtMax("dip", { v: 5, reps: 6 })).toBe("+5 kg × 6");
    expect(fmtMax("plat", { v: 75, reps: 0 })).toBe("75 s");
  });
  it("jamais fait : pas de max", () => {
    expect(maxHist(etat([]), "el", "L|0|0")).toBeNull();
  });
});
