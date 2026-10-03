import { describe, expect, it } from "vitest";
import { bilanDe, estRecord, meilleur } from "@/lib/logic/records";
import type { Journal } from "@/lib/logic/types";

const J = (ex: string, series: { v: number; reps: number; ok?: boolean; lest?: number }[], done = true): Journal =>
  ({ done, feel: null, ex, ts: 1, series }) as Journal;

describe("records", () => {
  const LOG = { "0|0|0": J("dc", [{ v: 60, reps: 8, ok: true }, { v: 62.5, reps: 6, ok: true }]) };
  it("le meilleur précédent ignore la ligne en cours", () => {
    expect(meilleur({ ...LOG, "1|0|0": J("dc", [{ v: 100, reps: 1, ok: true }]) }, "dc", "1|0|0")).toBe(62.5 * 1000 + 6);
  });
  it("plus lourd = record, plus de répétitions à charge égale = record", () => {
    expect(estRecord(LOG, "dc", "1|0|0", { v: 65, reps: 5 })).toBe(true);
    expect(estRecord(LOG, "dc", "1|0|0", { v: 62.5, reps: 7 })).toBe(true);
    expect(estRecord(LOG, "dc", "1|0|0", { v: 62.5, reps: 6 })).toBe(false);
  });
  it("pas de record la toute première fois", () => {
    expect(estRecord({}, "dc", "0|0|0", { v: 200, reps: 1 })).toBe(false);
  });
  it("une seule fois par charge dans la même séance", () => {
    const auj = { ...LOG, "1|0|0": J("dc", [{ v: 65, reps: 5, ok: true }, { v: 65, reps: 5 }], false) };
    expect(estRecord(auj, "dc", "1|0|0", { v: 65, reps: 5 })).toBe(false);
  });
  it("bilan : séries, volume des exercices chargés, durée", () => {
    const b = bilanDe([LOG["0|0|0"], J("gai", [{ v: 45, reps: 0, ok: true }]), undefined], 2, 0 + 1, 1 + 30 * 60000);
    expect(b).toEqual({ exercices: 2, series: 3, volume: 60 * 8 + 62.5 * 6, records: 2, minutes: 30 });
  });
});
