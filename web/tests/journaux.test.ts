import { describe, expect, it } from "vitest";
import { rattacherJournaux, reattacherJournaux } from "@/lib/logic/actions";
import { ctxLibre, journal } from "@/lib/logic/core";
import { ligneDe } from "@/lib/logic/historique";
import { versEtat } from "@/lib/store";
import type { Etat, Journal } from "@/lib/logic/types";

const J = (ex: string, v: number, reps: number[], ts = 1): Journal => ({ v, ex, nb: reps.length, ts, done: true, feel: null, reps: reps[0], series: reps.map((r) => ({ v, reps: r, ok: true })) }) as unknown as Journal;
const E = (ex: string[], LOG: Record<string, Journal>) =>
  versEtat({ SEANCES: [{ nom: "S", ex: ex.map((id) => ({ id, s: 3, r: 10, p: "90 s" })) }], LOG } as never) as Etat;

describe("les séries suivent leur exercice", () => {
  it("modification : déplacé, retiré, remplacé", () => {
    const e = E(["fp", "rotp", "cuban"], { "L|0|0": J("fp", 10, [10]), "L|0|1": J("rotp", 4, [10]), "L|0|2": J("cuban", 4, [10]) });
    /* nouvelle séance : cuban (était 2), un exercice de soin (nouveau), fp (était 0) ; rotp retiré */
    e.SEANCES[0].ex = [{ id: "cuban", s: 3, r: 10, p: "90 s" }, { id: "cbras", s: 1, r: 15, p: "15 s" }, { id: "fp", s: 3, r: 10, p: "90 s" }];
    reattacherJournaux(e, 0, [2, undefined, 0]);
    expect(e.LOG["L|0|0"].ex).toBe("cuban");
    expect(e.LOG["L|0|1"]).toBeUndefined();
    expect(e.LOG["L|0|2"].ex).toBe("fp");
    expect(e.LOG["L|0|a1"].ex).toBe("rotp"); // mis de côté, pas effacé
  });
  it("le travail mis de côté reste dans l'historique du jour", () => {
    const e = E(["fp"], { "L|0|0": J("fp", 10, [10], Date.now()), "L|0|a1": J("rotp", 4, [10, 10], Date.now()) });
    const d = new Date().toLocaleDateString("sv-SE");
    expect(ligneDe(e, "L|0", d)?.vol).toBe(100 + 80);
  });
  it("un journal d'un autre exercice n'est pas repris au premier geste", () => {
    const e = E(["dipt"], {});
    e.LOG["L|0|0"] = J("bfronth", 0, [10]);
    const c = ctxLibre(e, 0, 0)!;
    const L = journal(e.LOG, c);
    expect(L.ex).toBe("dipt");
    expect(L.series.every((s) => !s.ok)).toBe(true);
    expect(e.LOG["L|0|a0"].ex).toBe("bfronth");
  });
  it("réparation au chargement : la séance « Épaules Triceps Cardio »", () => {
    const ex = ["fp", "rotp", "cuban", "arn", "ois", "bfronth", "dipt", "tricor"];
    const e = E(ex, {
      "L|0|0": J("fp", 10, [10, 10, 10]), "L|0|1": J("rotp", 4, [10, 10, 10]), "L|0|2": J("cuban", 4, [10, 10, 10]), "L|0|3": J("arn", 8, [10, 10, 11]),
      "L|0|4": J("dmhd", 6, [10, 10, 15]), "L|0|5": J("ois", 6, [10, 10, 12]), "L|0|6": J("bfronth", 0, [10, 7, 0]),
      "L|0|7": J("tricor", 7, [10, 10, 10]), "L|0|8": J("tricor", 9, [10, 10, 10]),
    });
    expect(e.LOG["L|0|4"].ex).toBe("ois");
    expect(e.LOG["L|0|5"].ex).toBe("bfronth");
    expect(e.LOG["L|0|6"]).toBeUndefined(); // les dips repartent vierges
    expect(e.LOG["L|0|7"].ex).toBe("tricor");
    expect(Object.keys(e.LOG).filter((k) => k.includes("|a")).map((k) => e.LOG[k].ex).sort()).toEqual(["dmhd", "tricor"]);
    ex.forEach((id, n) => { const L = e.LOG["L|0|" + n]; if (L) expect(L.ex).toBe(id); });
  });
});
