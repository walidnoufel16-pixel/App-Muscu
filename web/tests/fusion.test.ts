import { describe, expect, it } from "vitest";
import { fusionner } from "@/lib/logic/fusion";
import type { LigneHist } from "@/lib/logic/historique";

const ligne = (d: string, s: string, ser = 10): LigneHist => ({ d, s, nom: "Séance", vol: 1000, ser, ex: {} });

describe("fusion de deux appareils", () => {
  it("la séance faite sur l'iPhone survit à l'iPad resté ouvert", () => {
    const iphone = { ts: 200, HIST: [ligne("2026-10-28", "L|0"), ligne("2026-10-30", "L|1")], SEANCES: [{ nom: "Full body", ex: [] }] };
    const ipad = { ts: 300, HIST: [ligne("2026-10-28", "L|0")], SEANCES: [{ nom: "Full body", ex: [] }, { nom: "Jambes", ex: [] }] };
    const f = fusionner(iphone, ipad);
    expect(f.HIST!.map((l) => l.d)).toEqual(["2026-10-28", "2026-10-30"]);
    /* réglages et séances enregistrées : la sauvegarde la plus récente */
    expect(f.SEANCES!.map((s) => s.nom)).toEqual(["Full body", "Jambes"]);
    expect(f.ts).toBe(300);
  });
  it("même séance des deux côtés : la ligne la plus fournie", () => {
    const f = fusionner({ ts: 1, HIST: [ligne("2026-10-30", "L|0", 18)] }, { ts: 2, HIST: [ligne("2026-10-30", "L|0", 6)] });
    expect(f.HIST).toHaveLength(1);
    expect(f.HIST![0].ser).toBe(18);
  });
  it("journal des séries : la version avec le plus de séries validées", () => {
    const j = (ok: number, ts: number) => ({ done: false, feel: null, ex: "dc", ts, series: Array.from({ length: 4 }, (_, i) => ({ v: 60, reps: 8, ok: i < ok })) });
    const f = fusionner({ ts: 1, LOG: { "L|0|0": j(4, 10), "L|0|1": j(1, 10) } }, { ts: 2, LOG: { "L|0|0": j(2, 20), "L|0|2": j(3, 20) } });
    expect(Object.keys(f.LOG!).sort()).toEqual(["L|0|0", "L|0|1", "L|0|2"]);
    expect(f.LOG!["L|0|0"].ts).toBe(10);
  });
  it("cardio, sorties, tests et produits réunis sans doublon", () => {
    const f = fusionner(
      { ts: 1, CARDIO: [{ nom: "a", f: "fractionne", m: "tapis", min: 20, effort: 7, ts: 5 }], SORTIES: [{ d: "2026-10-01", km: 5, sec: 1800, rpe: 4 }], A: { testsStreet: [{ d: "2026-09-01", tr: 3, po: 10, di: 2, sq: 20 }], produits: [{ code: "1", n: "Skyr", p: 10 }] } },
      { ts: 2, CARDIO: [{ nom: "a", f: "fractionne", m: "tapis", min: 20, effort: 7, ts: 5 }, { nom: "b", f: "fractionne", m: "velo", min: 30, effort: 5, ts: 9 }], SORTIES: [{ d: "2026-10-01", km: 5, sec: 1800, rpe: 4 }], A: { testsStreet: [{ d: "2026-10-15", tr: 5, po: 14, di: 6, sq: 25 }], produits: [{ code: "2", n: "Thon", p: 25 }] } },
    );
    expect(f.CARDIO).toHaveLength(2);
    expect(f.SORTIES).toHaveLength(1);
    expect(f.A!.testsStreet!.map((t) => t.d)).toEqual(["2026-09-01", "2026-10-15"]);
    expect(f.A!.produits).toHaveLength(2);
  });
});
