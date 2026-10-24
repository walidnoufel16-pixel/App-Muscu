import { describe, expect, it } from "vitest";
import { cloturerSeance } from "@/lib/logic/actions";
import { ctxLibre, precedent, precedentHist } from "@/lib/logic/core";
import { jourDe, ligneDe } from "@/lib/logic/historique";
import { versEtat } from "@/lib/store";
import type { Etat, Journal } from "@/lib/logic/types";

const J = (ex: string, v: number, reps: number[], ts = Date.now(), ok = reps.map(() => true)): Journal =>
  ({ v, ex, nb: reps.length, ts, done: ok.every(Boolean), feel: null, reps: reps[0], series: reps.map((r, n) => ({ v, reps: r, ok: ok[n] })) }) as unknown as Journal;
const S = (nom: string, ex: string[]) => ({ nom, ex: ex.map((id) => ({ id, s: 3, r: 10, p: "90 s" })) });
const E = (seances: ReturnType<typeof S>[], LOG: Record<string, Journal>, HIST: unknown[] = []) =>
  versEtat({ SEANCES: seances, LOG, HIST } as never) as Etat;

describe("Ajouter à mon suivi", () => {
  it("la séance repart vierge, le travail reste dans Progrès", () => {
    const auj = jourDe(Date.now());
    const e = E([S("Push", ["dc", "dmh", "tri"])], {
      "L|0|0": J("dc", 60, [8, 8, 8]), "L|0|1": J("dmh", 20, [10, 10, 10]), "L|0|2": J("tri", 15, [12, 12, 12], Date.now(), [true, false, false]),
    });
    const avant = ligneDe(e, "L|0", auj);
    cloturerSeance(e, 0);
    expect(Object.keys(e.LOG).filter((k) => /^L\|0\|\d+$/.test(k))).toEqual([]);
    expect(Object.keys(e.LOG).filter((k) => /^L\|0\|a/.test(k)).length).toBe(3);
    const apres = ligneDe(e, "L|0", auj);
    expect(apres?.ex).toEqual(avant?.ex);
    expect(apres?.det).toEqual(avant?.det);
    expect(apres?.ser).toBe(7);
  });
  it("un journal sans série validée est retiré", () => {
    const e = E([S("Push", ["dc"])], { "L|0|0": J("dc", 60, [8, 8], Date.now(), [false, false]) });
    cloturerSeance(e, 0);
    expect(Object.keys(e.LOG)).toEqual([]);
  });
  it("la prochaine fois reprend la charge de la dernière fois", () => {
    const e = E([S("Push", ["dc"])], { "L|0|0": J("dc", 62.5, [8, 8, 8]) });
    cloturerSeance(e, 0);
    const c = ctxLibre(e, 0, 0)!;
    expect(c.prev?.series.map((x) => x.v)).toEqual([62.5, 62.5, 62.5]);
    expect(c.base.v).toBeGreaterThanOrEqual(62.5);
  });
});

describe("« Précédent » : la dernière fois dans Progrès", () => {
  const ligne = (d: string, s: string, id: string, series: [number, number][]) => ({ d, s, nom: "x", vol: 0, ser: series.length, ex: {}, det: [{ id, s: series }] });
  it("dernière ligne qui contient l'exercice, quelle que soit la séance", () => {
    const H = [ligne("2026-10-20", "L|0", "dc", [[60, 8], [60, 8], [60, 8]]), ligne("2026-10-22", "L|1", "dc", [[62.5, 6], [62.5, 5]])];
    const e = E([S("A", ["dc"]), S("B", ["dc", "rw"])], {}, H);
    const p = precedentHist(e, "dc", "L|0|0")!;
    expect(p.series.map((x) => [x.v, x.reps])).toEqual([[62.5, 6], [62.5, 5]]);
    expect(ctxLibre(e, 0, 0)!.prev?.series.length).toBe(2);
  });
  it("la ligne du jour de la séance en cours est ignorée", () => {
    const auj = jourDe(Date.now());
    const H = [ligne("2026-10-20", "L|0", "dc", [[60, 8]]), ligne(auj, "L|0", "dc", [[70, 3]])];
    const e = E([S("A", ["dc"])], { "L|0|0": J("dc", 70, [3]) }, H);
    expect(precedentHist(e, "dc", "L|0|0")!.series[0].v).toBe(60);
  });
  it("sans détail dans l'historique : le journal", () => {
    const e = E([S("A", ["dc"]), S("B", ["dc"])], { "L|1|a0": J("dc", 55, [10, 10]) });
    expect(precedentHist(e, "dc", "L|0|0")).toBeNull();
    expect(precedent(e, "dc", "L|0|0")?.series[0].v).toBe(55);
  });
});
