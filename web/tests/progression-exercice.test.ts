/* Progrès › progression par exercice : « Prochaine fois » suit la règle de la séance. */
import { describe, expect, it } from "vitest";
import { prochaineFois, seriesParJour } from "@/components/repere/progression-exercice";
import type { Etat } from "@/lib/logic/types";
import { jourDe, type LigneHist } from "@/lib/logic/historique";

const vide = (): Etat => ({ A: {}, LOG: {}, SWAP: {}, SWAPP: {}, PLAN: null, SEANCES: [], wk: 0, day: 0, FINI: false });
const ligne = (jours: number, v: number, reps: number): LigneHist => ({
  d: jourDe(Date.now() - jours * 864e5), s: "L|0", nom: "Haut", vol: v * reps * 3, ser: 3,
  ex: { arn: [0, v * reps * 3, v, reps, 3] }, det: [{ id: "arn", s: [[v, reps], [v, reps], [v, reps]] }],
});

describe("prochaineFois", () => {
  it("dans la fourchette : même charge, une répétition de plus", () => {
    const E = vide();
    E.HIST = [ligne(9, 10, 10), ligne(2, 12, 7)];
    E.SEANCES = [{ nom: "Haut", ex: [{ id: "arn", s: 3, r: 10, p: "90 s" }], obj: 0 }];
    const p = prochaineFois(E, "arn")!;
    expect(p.v).toBe(12);
    expect(p.reps).toBe(8);
  });
  it("exercice sans charge : rien", () => {
    expect(prochaineFois(vide(), "pompe")).toBeNull();
  });
});

describe("seriesParJour", () => {
  const H: LigneHist[] = ([
    { d: "2026-11-04", s: "L|0", nom: "Haut", vol: 0, ser: 3, ex: { arn: [0, 0, 10, 10, 3] }, det: [{ id: "arn", s: [[10, 10], [10, 10], [10, 8]] }] },
    { d: "2026-11-14", s: "L|0", nom: "Haut", vol: 0, ser: 3, ex: { arn: [0, 0, 12, 7, 3], pompe: [0, 0, 0, 15, 3] }, det: [{ id: "arn", s: [[12, 7], [12, 7], [12, 7]] }, { id: "pompe", s: [[0, 15], [0, 12], [0, 12]] }] },
    { d: "2026-10-21", s: "L|0", nom: "Haut", vol: 0, ser: 3, ex: { arn: [0, 0, 8, 11, 3] } },
  ] as LigneHist[]).sort((a, b) => (a.d < b.d ? -1 : 1));
  it("le plus récent d'abord, séries identiques regroupées", () => {
    const j = seriesParJour(H, "arn");
    expect(j.map((x) => x.d)).toEqual(["2026-11-14", "2026-11-04", "2026-10-21"]);
    expect(j[0].groupes).toEqual([{ n: 3, t: "12 kg × 7" }]);
    expect(j[1].groupes).toEqual([{ n: 2, t: "10 kg × 10" }, { n: 1, t: "10 kg × 8" }]);
    expect(j[2].groupes).toBeNull();
  });
  it("poids du corps : des répétitions", () => {
    expect(seriesParJour(H, "pompe")[0].groupes).toEqual([{ n: 1, t: "15 réps" }, { n: 2, t: "12 réps" }]);
  });
});
