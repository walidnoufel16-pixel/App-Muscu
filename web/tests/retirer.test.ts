/* Retirer une séance validée par erreur (lib/logic/actions.ts) et synchronisation (fusion.ts). */
import { describe, expect, it } from "vitest";
import { retirerCardio, retirerDeHistorique } from "@/lib/logic/actions";
import { fusionner } from "@/lib/logic/fusion";
import type { Etat } from "@/lib/logic/types";

const ts = (d: string) => new Date(d + "T18:00").getTime();
const etat = (): Etat => ({
  A: {}, SWAP: {}, SWAPP: {}, PLAN: null, wk: 0, day: 0, FINI: false,
  SEANCES: [{ nom: "Push", ex: [{ id: "dc", s: 3, r: 10, p: "2 min" }], blocs: [{ id: "b1" } as never] }],
  LOG: { "L|0|a0": { done: true, ex: "dc", ts: ts("2026-11-03"), v: 60, reps: 10, feel: 1, series: [{ v: 60, reps: 10, ok: true }] } },
  HIST: [
    { d: "2026-11-01", s: "L|0", nom: "Push", vol: 500, ser: 3, ex: { dc: [55, 500, 55, 10, 3] } },
    { d: "2026-11-03", s: "L|0", nom: "Push", vol: 600, ser: 3, ex: { dc: [60, 600, 60, 10, 3] } },
  ],
  CARDIO: [{ nom: "Bloc", f: "endurance", m: "tapis", min: 10, effort: 1, ts: ts("2026-11-03"), ref: "b1" }, { nom: "Vélo", f: "endurance", m: "velo", min: 20, effort: 1, ts: ts("2026-11-02") }],
} as unknown as Etat);

describe("retirer une séance de l'historique", () => {
  it("la ligne, ses séries du jour et le cardio de ses blocs disparaissent ; le reste reste", () => {
    const E = etat();
    retirerDeHistorique(E, "2026-11-03", "L|0");
    expect(E.HIST!.map((l) => l.d)).toEqual(["2026-11-01"]);
    expect(Object.keys(E.LOG)).toHaveLength(0);
    expect(E.CARDIO!.map((c) => c.nom)).toEqual(["Vélo"]);
    expect(E.SEANCES).toHaveLength(1);
    expect(E.RETIRES).toContain("2026-11-03|L|0");
  });
  it("un cardio seul", () => {
    const E = etat();
    retirerCardio(E, ts("2026-11-02"));
    expect(E.CARDIO!.map((c) => c.nom)).toEqual(["Bloc"]);
  });
  it("la synchronisation avec un autre appareil ne la fait pas revenir", () => {
    const autre = { ...etat(), ts: 1 }, ici = { ...etat(), ts: 2 };
    retirerDeHistorique(ici, "2026-11-03", "L|0");
    for (const f of [fusionner(autre, ici), fusionner({ ...ici, ts: 1 }, { ...autre, ts: 2 })]) {
      expect(f.HIST!.map((l) => l.d)).toEqual(["2026-11-01"]);
      expect(f.CARDIO!.some((c) => c.ref === "b1")).toBe(false);
    }
  });
});
