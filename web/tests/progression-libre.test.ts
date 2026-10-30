import { describe, expect, it } from "vitest";
import { progressionLibre } from "@/lib/logic/core";
import { EX } from "@/lib/data/exercices";
import type { Journal } from "@/lib/logic/types";

const j = (series: [number, number, boolean][], feel: number | null = 1): Journal =>
  ({ done: true, feel, ex: "", ts: 1, series: series.map(([v, reps, ok]) => ({ v, reps, ok })), reps: series.at(-1)?.[1] });

describe("progression en séance libre", () => {
  it("toutes les séries à l'objectif : la charge monte d'un cran", () => {
    const p = progressionLibre(EX.dc, { s: 3, r: 8 }, j([[60, 8, true], [60, 8, true], [60, 9, true]]));
    expect(p?.v).toBeGreaterThan(60);
    expect(p?.reps).toBe(8);
  });
  it("une série sous l'objectif : on reprend la dernière fois", () => {
    expect(progressionLibre(EX.dc, { s: 3, r: 8 }, j([[60, 8, true], [60, 8, true], [60, 6, true]]))).toBeNull();
    expect(progressionLibre(EX.dc, { s: 3, r: 8 }, j([[60, 8, true], [60, 8, true]]))).toBeNull();
  });
  it("trop dur la dernière fois : même charge", () => {
    expect(progressionLibre(EX.dc, { s: 3, r: 8 }, j([[60, 8, true], [60, 8, true], [60, 8, true]], 2))?.v).toBe(60);
  });
  it("poids du corps : une répétition de plus ; gainage : 5 s de plus", () => {
    expect(progressionLibre(EX.pomp, { s: 3, r: 10 }, j([[10, 0, true], [11, 0, true], [10, 0, true]]))?.v).toBe(11);
    expect(progressionLibre(EX.gai, { s: 3, r: 30 }, j([[30, 0, true], [30, 0, true], [35, 0, true]]))?.v).toBe(35);
  });
});
