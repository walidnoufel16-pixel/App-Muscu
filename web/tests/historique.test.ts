import { describe, expect, it } from "vitest";
import {
  courbe, decaler, e1rm, inscrire, jourDe, ligneDe, lundiDe, MAX_HIST, reconstruire, records, semaines, seriesParMuscle, type LigneHist,
} from "@/lib/logic/historique";
import type { Etat, Journal } from "@/lib/logic/types";

const ts = (j: string, h = 18) => new Date(j + `T${h}:00:00`).getTime();
const J = (ex: string, series: { v: number; reps: number; ok?: boolean }[], t: number): Journal => ({ done: true, feel: null, ex, ts: t, series }) as Journal;
const etat = (LOG: Record<string, Journal>): Etat =>
  ({ A: {}, LOG, SWAP: {}, SWAPP: {}, PLAN: null, SEANCES: [{ nom: "Push", ex: [] }], wk: 0, day: 0, FINI: false }) as Etat;

describe("historique", () => {
  it("1RM estimé (Epley), plafonné à 12 reps", () => {
    expect(e1rm(100, 1)).toBe(100);
    expect(e1rm(100, 10)).toBe(133.3);
    expect(e1rm(100, 20)).toBe(e1rm(100, 12));
    expect(e1rm(0, 5)).toBe(0);
  });
  it("semaines : lundi et décalages", () => {
    expect(lundiDe("2026-10-04")).toBe("2026-09-28"); // dimanche → lundi précédent
    expect(lundiDe("2026-09-28")).toBe("2026-09-28");
    expect(decaler("2026-02-27", 3)).toBe("2026-03-02");
  });
  it("ligne d'une séance : séries validées du jour, volume, meilleur 1RM", () => {
    const E = etat({
      "L|0|0": J("dc", [{ v: 60, reps: 8, ok: true }, { v: 70, reps: 5, ok: true }, { v: 80, reps: 5 }], ts("2026-10-01")),
      "L|0|1": J("dc", [{ v: 50, reps: 10, ok: true }], ts("2026-10-01")),
      "L|0|2": J("dc", [{ v: 90, reps: 3, ok: true }], ts("2026-09-20")), // un autre jour
    });
    E.LOG["L|0|0"].done = false;
    const l = ligneDe(E, "L|0", "2026-10-01")!;
    expect(l.nom).toBe("Push");
    expect(l.ser).toBe(3);
    expect(l.vol).toBe(60 * 8 + 70 * 5 + 500);
    expect(l.ex.dc[0]).toBe(e1rm(70, 5));
    expect(l.ex.dc[2]).toBe(70);
    expect(ligneDe(E, "L|0", "2026-10-02")).toBeNull();
  });
  it("inscrire remplace la ligne du même jour, retire une ligne vide, garde les records et la durée", () => {
    const l = (d: string, ser: number, x: Partial<LigneHist> = {}): LigneHist => ({ d, s: "L|0", nom: "Push", vol: 0, ser, ex: {}, ...x });
    let H = inscrire([], "2026-10-01", "L|0", l("2026-10-01", 2, { rec: 1, min: 40 }));
    H = inscrire(H, "2026-09-01", "L|0", l("2026-09-01", 1));
    H = inscrire(H, "2026-10-01", "L|0", l("2026-10-01", 5));
    expect(H.map((x) => [x.d, x.ser, x.rec, x.min])).toEqual([["2026-09-01", 1, undefined, undefined], ["2026-10-01", 5, 1, 40]]);
    expect(inscrire(H, "2026-10-01", "L|0", null)).toHaveLength(1);
  });
  it("historique borné", () => {
    let H: LigneHist[] = [];
    for (let i = 0; i < MAX_HIST + 20; i++) H = inscrire(H, decaler("2025-01-01", i), "L|0", { d: decaler("2025-01-01", i), s: "L|0", nom: "", vol: 0, ser: 1, ex: {} });
    expect(H).toHaveLength(MAX_HIST);
    expect(H[0].d).toBe(decaler("2025-01-01", 20));
  });
  it("reconstruction depuis le journal : une ligne par séance et par jour", () => {
    const E = etat({
      "0|0|0": J("dc", [{ v: 60, reps: 8, ok: true }], ts("2026-09-01")),
      "0|0|1": J("dc", [{ v: 62.5, reps: 8, ok: true }], ts("2026-09-01", 19)),
      "1|0|0": J("dc", [{ v: 65, reps: 8, ok: true }], ts("2026-09-08")),
      "L|0|0": J("dc", [{ v: 40, reps: 8 }], ts("2026-09-09")),
    });
    E.LOG["L|0|0"].done = false; // rien de validé : pas de ligne
    const H = reconstruire(E);
    expect(H.map((l) => [l.d, l.s, l.ser])).toEqual([["2026-09-01", "0|0", 2], ["2026-09-08", "1|0", 1]]);
    expect(courbe(H, "dc").map((p) => p.max)).toEqual([62.5, 65]);
    expect(records(H)).toHaveLength(1);
  });
  it("totaux par semaine et séries par muscle", () => {
    const H: LigneHist[] = [
      { d: "2026-09-29", s: "L|0", nom: "", vol: 1000, ser: 6, ex: { dc: [80, 1000, 70, 5, 4] } },
      { d: "2026-10-02", s: "L|0", nom: "", vol: 500, ser: 3, ex: { dc: [80, 500, 70, 5, 3] } },
    ];
    const C = [{ nom: "Rameur", f: "tabata" as const, m: "ram" as const, min: 20, effort: 8, ts: ts("2026-10-01") }];
    const [a, b] = semaines(H, C, 2, "2026-10-04");
    expect(a).toMatchObject({ lundi: "2026-09-21", seances: 0 });
    expect(b).toMatchObject({ lundi: "2026-09-28", seances: 3, vol: 1500, ser: 9, cardio: 20 });
    expect(seriesParMuscle(H, "2026-09-28", "2026-10-04")).toEqual({ pec: 7 });
    expect(jourDe(ts("2026-10-01"))).toBe("2026-10-01");
  });
});
