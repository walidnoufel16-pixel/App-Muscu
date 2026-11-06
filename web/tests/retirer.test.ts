/* Retirer une séance validée par erreur (lib/logic/actions.ts) et synchronisation (fusion.ts). */
import { describe, expect, it } from "vitest";
import { arreterSeance, retirerCardio, retirerDeHistorique } from "@/lib/logic/actions";
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
    expect(E.RETIRES!.some((r) => r.startsWith("2026-11-03|L|0@"))).toBe(true);
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
  it("ancien format (sans moment) : toujours retirée", () => {
    const autre = { ...etat(), ts: 1 }, ici = { ...etat(), ts: 2, RETIRES: ["2026-11-03|L|0"] };
    expect(fusionner(autre, ici).HIST!.map((l) => l.d)).toEqual(["2026-11-01"]);
  });
});

describe("arrêter une séance commencée par erreur", () => {
  const maintenant = Date.now(), auj = new Date(maintenant - 60_000).toISOString().slice(0, 10);
  const enCours = (): Etat => {
    const E = etat();
    const t = maintenant - 60_000, d = new Date(t);
    const jour = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    E.LOG = { "L|0|a0": { done: false, ex: "dc", ts: t, v: 60, reps: 10, feel: null, series: [{ v: 60, reps: 10, ok: true }] } as never };
    E.HIST = [...E.HIST!, { d: jour, s: "L|0", nom: "Push", vol: 600, ser: 1, ts: t, ex: { dc: [60, 600, 60, 10, 1] } }];
    return E;
  };
  it("les séries et la ligne disparaissent, et ne reviennent pas par l'autre appareil", () => {
    const autre = { ...enCours(), ts: 1 }, ici = { ...enCours(), ts: 2 };
    const jour = ici.HIST!.at(-1)!.d;
    arreterSeance(ici, jour, "L|0");
    expect(Object.keys(ici.LOG)).toHaveLength(0);
    for (const f of [fusionner(autre, ici), fusionner({ ...ici, ts: 1 }, { ...autre, ts: 2 })]) {
      expect(f.HIST!.some((l) => l.d === jour)).toBe(false);
      expect(Object.keys(f.LOG!)).toHaveLength(0);
    }
  });
  it("refaite pour de bon juste après, elle reste", () => {
    const ici = { ...enCours(), ts: 2 };
    const jour = ici.HIST!.at(-1)!.d;
    arreterSeance(ici, jour, "L|0");
    const t = Date.now() + 1000;
    ici.LOG["L|0|a0"] = { done: true, ex: "dc", ts: t, v: 60, reps: 10, feel: null, series: [{ v: 60, reps: 10, ok: true }] } as never;
    ici.HIST = [...ici.HIST!, { d: jour, s: "L|0", nom: "Push", vol: 600, ser: 1, ts: t, ex: { dc: [60, 600, 60, 10, 1] } }];
    const f = fusionner({ ...enCours(), ts: 1 }, ici);
    expect(f.HIST!.filter((l) => l.d === jour)).toHaveLength(1);
    expect(f.LOG!["L|0|a0"].ts).toBe(t);
    void auj;
  });
});
