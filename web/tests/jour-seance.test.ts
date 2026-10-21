import { describe, expect, it } from "vitest";
import { joursSeance, journauxDuJour, redater } from "@/lib/logic/historique";
import { versEtat } from "@/lib/store";
import type { Etat, Journal } from "@/lib/logic/types";

const t = (iso: string) => new Date(iso).getTime();
const J = (ex: string, ts: number, n = 3): Journal => ({ ex, done: true, nb: n, feel: null, ts, series: Array.from({ length: n }, () => ({ v: 10, reps: 10, ok: true })) }) as unknown as Journal;

describe("jour de séance", () => {
  it("une série validée après minuit reste sur le jour de la séance", () => {
    const E = { LOG: { "L|2|0": J("fp", t("2026-10-21T19:33")), "L|2|1": J("tricor", t("2026-10-21T20:14")), "L|2|6": J("dipt", t("2026-10-22T00:18")) } } as unknown as Etat;
    expect(joursSeance(E, "L|2")["L|2|6"]).toBe("2026-10-21");
    expect(journauxDuJour(E, "L|2", "2026-10-21")).toEqual(["L|2|0", "L|2|1", "L|2|6"]);
    expect(journauxDuJour(E, "L|2", "2026-10-22")).toEqual([]);
  });
  it("plus de 6 h après : une nouvelle séance, datée de son jour", () => {
    const E = { LOG: { "L|2|0": J("fp", t("2026-10-21T19:33")), "L|2|1": J("tricor", t("2026-10-22T10:00")) } } as unknown as Etat;
    expect(joursSeance(E, "L|2")).toEqual({ "L|2|0": "2026-10-21", "L|2|1": "2026-10-22" });
  });
  it("réparation : la séance fantôme du lendemain rejoint celle de la veille", () => {
    const LOG = { "L|2|0": J("fp", t("2026-10-21T19:33")), "L|2|1": J("tricor", t("2026-10-21T20:14")), "L|2|6": J("dipt", t("2026-10-22T00:18")) };
    const HIST = [
      { d: "2026-10-21", s: "L|2", nom: "Épaules Triceps Cardio", vol: 600, ser: 6, ex: {}, min: 44 },
      { d: "2026-10-22", s: "L|2", nom: "Épaules Triceps Cardio", vol: 300, ser: 3, ex: {}, min: 1 },
    ];
    const e = versEtat({ SEANCES: [{ nom: "a", ex: [] }, { nom: "b", ex: [] }, { nom: "Épaules Triceps Cardio", ex: [{ id: "fp", s: 3, r: 10, p: "90 s" }, { id: "tricor", s: 3, r: 10, p: "90 s" }] }], LOG, HIST } as never);
    expect(e.HIST!.map((l) => l.d)).toEqual(["2026-10-21"]);
    expect(e.HIST![0]).toMatchObject({ ser: 9, min: 44 });
    expect(Object.keys(e.HIST![0].ex).sort()).toEqual(["dipt", "fp", "tricor"]);
    /* une fois réparé, plus rien ne bouge */
    expect(redater(e)).toEqual(e.HIST);
  });
});
