import { describe, expect, it } from "vitest";
import { fourchette, pasExercice, progressionLibre } from "@/lib/logic/core";
import { EX } from "@/lib/data/exercices";
import type { Journal } from "@/lib/logic/types";

const MAINTENANT = 1_800_000_000_000, JOUR = 864e5;
const j = (series: [number, number, boolean][], feel: number | null = 1, ilYa = 3): Journal =>
  ({ done: true, feel, ex: "", ts: MAINTENANT - ilYa * JOUR, series: series.map(([v, reps, ok]) => ({ v, reps, ok })), reps: series.at(-1)?.[1] });
const o = (avant: Journal[] = [], obj = 0) => ({ obj, avant, maintenant: MAINTENANT });

describe("fourchette de répétitions", () => {
  it("±2 en général, ±1 en force", () => {
    expect(fourchette(10, 0)).toEqual({ bas: 8, haut: 12 });
    expect(fourchette(6, 1)).toEqual({ bas: 5, haut: 7 });
    expect(fourchette(12, 2)).toEqual({ bas: 10, haut: 14 });
  });
});

describe("paliers par exercice", () => {
  it("gros mouvements de jambes 5 kg, barre 2,5 kg, haltères 2 kg, petits muscles 1 kg", () => {
    expect(pasExercice(EX.sq)).toBe(5);
    expect(pasExercice(EX.dc)).toBe(2.5);
    expect(pasExercice(EX.dh)).toBe(2);
    expect(pasExercice(EX.cu)).toBe(1);
    expect(pasExercice(EX.lext)).toBe(2.5);
    expect(pasExercice(EX.lc)).toBe(2.5);
  });
});

describe("progression en séance libre (double progression)", () => {
  it("toutes les séries en haut de la fourchette : +1 palier et retour en bas", () => {
    const p = progressionLibre(EX.dc, { s: 3, r: 10 }, j([[60, 12, true], [60, 12, true], [60, 13, true]]), o());
    expect(p).toMatchObject({ v: 62.5, reps: 8 });
  });
  it("dans la fourchette : même charge, une répétition de plus", () => {
    const p = progressionLibre(EX.dc, { s: 3, r: 10 }, j([[60, 10, true], [60, 10, true], [60, 9, true]]), o());
    expect(p).toMatchObject({ v: 60, reps: 10 });
  });
  it("sous le bas une fois : même charge ; deux fois de suite : −10 %", () => {
    const d = j([[60, 8, true], [60, 7, true], [60, 6, true]]);
    expect(progressionLibre(EX.dc, { s: 3, r: 10 }, d, o())).toMatchObject({ v: 60, reps: 8 });
    const avant = j([[60, 8, true], [60, 6, true], [60, 6, true]], 1, 6);
    expect(progressionLibre(EX.dc, { s: 3, r: 10 }, d, o([avant]))).toMatchObject({ v: 52.5, reps: 8 });
  });
  it("après une pause : −10 % à 10 jours, −20 % à 21 jours", () => {
    const d = (n: number) => j([[60, 10, true], [60, 10, true], [60, 10, true]], 1, n);
    expect(progressionLibre(EX.dc, { s: 3, r: 10 }, d(12), o())?.v).toBe(52.5);
    expect(progressionLibre(EX.dc, { s: 3, r: 10 }, d(25), o())?.v).toBe(47.5);
  });
  it("trois séances à la même charge sans atteindre le haut : on suggère une variante", () => {
    const d = j([[60, 10, true], [60, 10, true], [60, 10, true]]);
    const avant = [j([[60, 10, true], [60, 9, true], [60, 9, true]], 1, 6), j([[60, 9, true], [60, 9, true], [60, 9, true]], 1, 9)];
    expect(progressionLibre(EX.dc, { s: 3, r: 10 }, d, o(avant))?.t).toContain("variante");
  });
  it("trop dur la dernière fois : même charge", () => {
    expect(progressionLibre(EX.dc, { s: 3, r: 8 }, j([[60, 10, true], [60, 10, true], [60, 10, true]], 2), o())?.v).toBe(60);
  });
  it("poids du corps : une répétition de plus ; gainage : 5 s de plus", () => {
    expect(progressionLibre(EX.pomp, { s: 3, r: 10 }, j([[10, 0, true], [11, 0, true], [10, 0, true]]), o())?.v).toBe(11);
    expect(progressionLibre(EX.gai, { s: 3, r: 30 }, j([[30, 0, true], [30, 0, true], [35, 0, true]]), o())?.v).toBe(35);
  });
});
