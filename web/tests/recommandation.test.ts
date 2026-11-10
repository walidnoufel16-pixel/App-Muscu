/* « Ma recommandation du jour » (lib/logic/recommandation.ts). */
import { describe, expect, it } from "vitest";
import { recommander, etatGroupes, recoDuJour, musclesRecommandes } from "@/lib/logic/recommandation";
import { MUSC } from "@/lib/data/referentiels";
import type { LigneHist } from "@/lib/logic/historique";

/* une séance : exercice → nombre de séries */
const seance = (d: string, ex: Record<string, number>): LigneHist => ({
  d, s: "L|0", nom: "test", vol: 1000, ser: Object.values(ex).reduce((a, b) => a + b, 0),
  ex: Object.fromEntries(Object.entries(ex).map(([id, n]) => [id, [50, 500, 60, 10, n]])),
}) as LigneHist;

const LUN = "2026-11-02", MAR = "2026-11-03", MER = "2026-11-04";
const push = (d: string) => seance(d, { dc: 4, dh: 3, tri: 3 });
const pull = (d: string) => seance(d, { tr: 4, rw: 4, cu: 3 });
const jambes = (d: string) => seance(d, { sq: 4, pr: 4, rm: 3, mol: 3 });

describe("recommander", () => {
  it("pecs/triceps lundi + dos/biceps mardi → mercredi jambes ou épaules/abdos, jamais pecs ni dos", () => {
    const r = recommander([push(LUN), pull(MAR)], MER)!;
    expect(r.type).toBe("seance");
    expect(["jambes", "epaabd"]).toContain(r.propositions[0].id);
    for (const p of r.propositions) {
      expect(p.muscles).not.toContain("pec");
      expect(p.muscles).not.toContain("dos");
    }
    expect(r.faits.map((f) => f.d)).toEqual([LUN, MAR]);
    expect(r.faits[0].groupes).toEqual(expect.arrayContaining(["pec", "tri"]));
  });

  it("des jambes travaillées la veille sont écartées", () => {
    const r = recommander([jambes(MAR)], MER)!;
    for (const p of r.propositions) for (const g of ["qua", "isc", "mol"]) expect(p.muscles).not.toContain(g);
  });

  it("des abdos travaillés la veille sont de nouveau proposés", () => {
    const H = [seance(MAR, { crp: 4, plat: 3 })];
    expect(etatGroupes(H, MER).abd.recupere).toBe(true);
    const r = recommander(H, MER)!;
    expect(r.propositions.some((p) => p.muscles.includes("abd"))).toBe(true);
  });

  it("sans historique récent, pas de recommandation", () => {
    expect(recommander([], MER)).toBeNull();
    expect(recommander([push("2026-10-01")], MER)).toBeNull();
  });

  it("tout récent → repos", () => {
    const H = [jambes(LUN), seance(MAR, { dc: 4, tr: 4, dm: 4, cu: 3, tri: 3, crp: 3 }), seance(MER, { crp: 3 })];
    const r = recommander(H, MER)!;
    expect(r.type === "repos" || r.type === "fait").toBe(true);
    expect(r.propositions).toEqual([]);
  });

  it("une séance déjà faite aujourd'hui → « fait », avec une idée pour demain", () => {
    const r = recommander([push(MER)], MER)!;
    expect(r.type).toBe("fait");
    expect(r.demain).toBeDefined();
    expect(r.demain!.muscles).not.toContain("pec");
  });

  it("écarter les jambes retire toute séance de jambes", () => {
    const r = recommander([push(LUN), pull(MAR)], MER, ["jambes"])!;
    expect(r.propositions.length).toBeGreaterThan(0);
    for (const p of r.propositions) {
      expect(p.id).not.toBe("jambes");
      for (const g of ["qua", "isc", "mol"]) expect(p.muscles).not.toContain(g);
    }
  });

  it("les muscles proposés existent dans l'assistant (?m=)", () => {
    const r = recommander([push(LUN), pull(MAR)], MER)!;
    for (const p of r.propositions) for (const g of p.muscles) expect(MUSC.some((x) => x.k === g)).toBe(true);
  });
});

describe("recoDuJour (agenda)", () => {
  it("sans séance récente : un full body pour démarrer", () => {
    const r = recoDuJour([], MER);
    expect(r.debut).toBe(true);
    expect(r.propositions[0].id).toBe("full");
    expect(musclesRecommandes(r)).toContain("pec");
  });
  it("jambes écartées : le full body s'en passe", () => {
    const r = recoDuJour([], MER, ["jambes"]);
    expect(r.propositions[0].muscles).not.toContain("qua");
  });
  it("avec un historique : la même chose que recommander", () => {
    const H = [push(LUN), pull(MAR)];
    expect(recoDuJour(H, MER)).toEqual(recommander(H, MER));
    expect(musclesRecommandes(recoDuJour(H, MER))).not.toContain("pec");
  });
});

/* Trapèzes, lombaires, avant-bras, adducteurs ; course et cardio guidé. */
import { effortsEndurance, MUSCLES_RECUP } from "@/lib/logic/recommandation";
import { chargeLombaires, construireSeance } from "@/lib/logic/assistant";
import type { Sortie } from "@/lib/logic/course";
import type { HistoCardio } from "@/lib/logic/types";

describe("récupération des autres muscles", () => {
  it("shrugs et extensions lombaires : trapèzes et lombaires en récupération", () => {
    const E = etatGroupes([seance(MAR, { shr: 4, lom: 3 })], MER);
    expect(E.tra.recupere).toBe(false);
    expect(E.lom.recupere).toBe(false);
    expect(etatGroupes([seance(MAR, { shr: 4, lom: 3 })], "2026-11-05").lom.recupere).toBe(true);
  });

  it("un soulevé de terre (lombaires en second) fatigue les lombaires 48 h", () => {
    const E = etatGroupes([seance(MAR, { sdt: 4 })], MER);
    expect(E.lom).toMatchObject({ recupere: false, reste: 1 });
  });

  it("ces muscles ne changent pas les séances proposées", () => {
    const r = recommander([seance(MAR, { shr: 4, lom: 3, poi: 3, add: 3 })], MER)!;
    expect(r.propositions.length).toBeGreaterThan(0);
    for (const p of r.propositions) for (const g of p.muscles) expect(["tra", "lom", "avb", "add"]).not.toContain(g);
    expect(MUSCLES_RECUP).toHaveLength(13);
  });
});

describe("course et cardio", () => {
  const sortie = (d: string, km: number, rpe: number, course = false): Sortie => ({ d, km, sec: km * 330, rpe, course });
  it("un footing court et facile ne compte pas ; une sortie longue, si", () => {
    expect(effortsEndurance([sortie(MAR, 5, 4)])).toEqual([]);
    const E = etatGroupes([push(LUN)], MER, effortsEndurance([sortie(MAR, 18, 6)]));
    expect(E.qua).toMatchObject({ recupere: false, reste: 1 });
    expect(E.mol.recupere).toBe(false);
    expect(E.pec.recupere).toBe(true);
  });

  it("un marathon : 72 h", () => {
    expect(effortsEndurance([sortie(LUN, 42.2, 9, true)])[0].jours).toBe(3);
    expect(etatGroupes([], MER, effortsEndurance([sortie(LUN, 42.2, 9, true)])).isc.reste).toBe(1);
  });

  it("le lendemain d'une sortie longue, pas de séance de jambes proposée", () => {
    const r = recommander([push(LUN)], MER, [], undefined, effortsEndurance([sortie(MAR, 20, 7)]))!;
    for (const p of r.propositions) for (const g of ["qua", "isc", "mol"]) expect(p.muscles).not.toContain(g);
  });

  it("cardio guidé : du fractionné au rameur fatigue dos et jambes 24 h, une endurance courte rien", () => {
    const ts = new Date(MAR + "T18:00").getTime();
    const C = [{ nom: "x", f: "fractionne", m: "ram", min: 20, effort: 600, ts }, { nom: "y", f: "endurance", m: "velo", min: 30, effort: 1800, ts }] as HistoCardio[];
    expect(effortsEndurance([], C)).toEqual([{ d: MAR, jours: 1, muscles: ["dos", "qua", "isc"] }]);
  });
});

describe("assistant : lombaires en récupération", () => {
  it("les soulevés de terre lourds sont reconnus", () => {
    for (const o of ["sdt", "rm", "gm", "tbar", "rkp"]) expect(chargeLombaires(o)).toBe(true);
    for (const o of ["lc", "sq", "lom", "hip"]) expect(chargeLombaires(o)).toBe(false);
  });
  it("une séance ischios évite les soulevés de terre quand c'est possible", () => {
    const ex = construireSeance(["isc"], 60, 0, ["m0", "m1", "m2", "m3", "bt"], () => 0.5, chargeLombaires);
    expect(ex.length).toBeGreaterThan(0);
    expect(ex.some((e) => chargeLombaires(e.id))).toBe(false);
  });
});

describe("séance déclarée à l'accueil (dernières 48 h)", () => {
  it("les muscles déclarés récupèrent sans séance dans l'historique", async () => {
    const { effortsEndurance: ef } = await import("@/lib/logic/recommandation");
    /* hier pecs, triceps et dos : aujourd'hui ils récupèrent, la proposition les évite */
    const efforts = ef([], [], { d: MAR, m: ["pec", "tri", "dos"] });
    const E = etatGroupes([], MER, efforts);
    expect(E.pec.recupere).toBe(false);
    expect(E.dos.recupere).toBe(false);
    expect(E.qua.recupere).toBe(true);
    const r = recoDuJour([], MER, [], undefined, efforts);
    expect(r.propositions[0].muscles).not.toContain("pec");
    expect(r.propositions[0].muscles).not.toContain("tri");
    /* avant-hier : pecs prêts, le dos (3 jours) récupère encore */
    const E2 = etatGroupes([], MER, ef([], [], { d: LUN, m: ["pec", "dos"] }));
    expect(E2.pec.recupere).toBe(true);
    expect(E2.dos.recupere).toBe(false);
    expect(ef([], [], { d: MAR, m: [] })).toEqual([]);
  });
});

describe("zones écartées : les jambes séparées", () => {
  it("quadriceps, ischios-fessiers et mollets s'écartent un par un ; l'ancienne « jambes » se déplie", async () => {
    const { basculerZone, ecartesDe } = await import("@/lib/logic/recommandation");
    expect(ecartesDe(["jambes", "pec"])).toEqual(["qua", "isc", "mol", "pec"]);
    expect(basculerZone(["jambes"], "mol")).toEqual(["qua", "isc"]);
    expect(basculerZone([], "isc")).toEqual(["isc"]);
    const r = recoDuJour([], MER, ["qua", "isc"]);
    expect(r.propositions[0].muscles).not.toContain("qua");
    expect(r.propositions[0].muscles).not.toContain("isc");
  });
});
