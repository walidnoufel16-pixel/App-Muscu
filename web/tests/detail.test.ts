import { describe, expect, it } from "vitest";
import { detailDe, ligneDe, type LigneHist } from "@/lib/logic/historique";
import type { Etat, Journal } from "@/lib/logic/types";

const auj = new Date().toLocaleDateString("sv-SE");
const J = (ex: string, s: [number, number][]): Journal => ({ ex, done: true, nb: s.length, feel: 1, ts: Date.now(), series: s.map(([v, reps]) => ({ v, reps, ok: true })) }) as unknown as Journal;
const E = (LOG: Record<string, Journal>): Etat => ({ A: {}, LOG, SWAP: {}, SWAPP: {}, PLAN: null, SEANCES: [{ nom: "Push", ex: [] }], wk: 0, day: 0, FINI: false, HIST: [] }) as unknown as Etat;

describe("relire une séance passée", () => {
  it("l'historique garde chaque série, dans l'ordre de la séance", () => {
    const e = E({ "L|0|1": J("dmh", [[20, 10]]), "L|0|0": J("dc", [[60, 8], [62.5, 8]]), "L|0|a2": J("tricor", [[9, 10]]) });
    const l = ligneDe(e, "L|0", auj)!;
    expect(l.det!.map((x) => x.id)).toEqual(["dc", "dmh", "tricor"]);
    expect(l.det![0].s).toEqual([[60, 8], [62.5, 8]]);
    expect(l.det![0].f).toBe(1);
  });
  it("détail : celui de l'historique, sinon le journal du jour, sinon le résumé", () => {
    const e = E({ "L|0|0": J("dc", [[60, 8], [65, 6]]) });
    const avecDet = ligneDe(e, "L|0", auj)!;
    expect(detailDe(E({}), avecDet)[0].L.series.map((s) => s.v)).toEqual([60, 65]);
    const ancien: LigneHist = { ...avecDet, det: undefined };
    expect(detailDe(e, ancien)[0].L.series.map((s) => s.v)).toEqual([60, 65]); // journal encore là
    const resume = detailDe(E({}), { ...ancien, ex: { dc: [80, 900, 65, 6, 2] } });
    expect(resume[0].L.series).toHaveLength(2);
    expect(resume[0].L.series[0]).toMatchObject({ v: 65, reps: 6 });
  });
});
