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
