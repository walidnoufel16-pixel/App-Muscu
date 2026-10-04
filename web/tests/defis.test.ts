import { describe, expect, it } from "vitest";
import { codePropre, finDe, joursRestants, nouveauCode, scoreDe, termine } from "@/lib/logic/defis";
import type { Etat } from "@/lib/logic/types";

const E = {
  A: {}, LOG: {}, SWAP: {}, SWAPP: {}, PLAN: null, SEANCES: [], wk: 0, day: 0, FINI: false,
  HIST: [
    { d: "2026-09-30", s: "L|0", nom: "", vol: 9000, ser: 9, ex: {} },
    { d: "2026-10-02", s: "L|0", nom: "", vol: 4000, ser: 9, ex: {} },
    { d: "2026-10-05", s: "L|1", nom: "", vol: 2500, ser: 6, ex: {} },
  ],
  CARDIO: [
    { nom: "", f: "tabata", m: "ram", min: 20, effort: 8, ts: new Date("2026-10-03T09:00").getTime() },
    { nom: "", f: "tabata", m: "ram", min: 12, effort: 8, ts: new Date("2026-10-05T09:00").getTime(), ref: "1|b" },
  ],
} as unknown as Etat;

describe("défis", () => {
  const d = { debut: "2026-10-01", fin: "2026-10-07" };
  it("score selon le type, sur la période seulement", () => {
    expect(scoreDe(E, { ...d, type: "seances" })).toBe(3); // 2 muscu + 1 cardio seul (le bloc combiné ne compte pas en plus)
    expect(scoreDe(E, { ...d, type: "tonnage" })).toBe(6500);
    expect(scoreDe(E, { ...d, type: "cardio" })).toBe(32);
  });
  it("dates", () => {
    expect(finDe("2026-10-04", 1)).toBe("2026-10-10");
    expect(joursRestants({ fin: "2026-10-10" }, "2026-10-04")).toBe(7);
    expect(joursRestants({ fin: "2026-10-10" }, "2026-10-12")).toBe(0);
    expect(termine({ fin: "2026-10-10" }, "2026-10-11")).toBe(true);
  });
  it("codes", () => {
    expect(nouveauCode()).toMatch(/^[A-HJ-NP-Z2-9]{5}$/);
    expect(codePropre(" ab-c2 3 ")).toBe("ABC23");
  });
});
