/* Progrès › progression par exercice : « Prochaine fois » suit la règle de la séance. */
import { describe, expect, it } from "vitest";
import { prochaineFois } from "@/components/repere/progression-exercice";
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
