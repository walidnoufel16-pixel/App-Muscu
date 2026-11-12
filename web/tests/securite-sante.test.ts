/* Audit du 12 novembre 2026 : allergènes complets et garde-fous de santé d'Oxa Meal. */
import { describe, expect, it } from "vitest";
import { ALIM } from "@/lib/data/aliments";
import { RECETTES } from "@/lib/data/recettes";
import { allergenesDe, besoins, prefsDe, R, recettesPour, regimeDe } from "@/lib/logic/repas";
import { objectifProteines } from "@/lib/logic/nutrition";
import type { Etat, Reponses } from "@/lib/logic/types";

const etat = (A: Reponses): Etat => ({ A, LOG: {}, SWAP: {}, SWAPP: {}, PLAN: null, SEANCES: [], wk: 0, day: 0, FINI: true, HIST: [] }) as Etat;

describe("allergènes", () => {
  it("les aliments à base de soja, sésame, moutarde ou céleri portent leur marque", () => {
    for (const id of ["tofu", "tempeh", "tofu_fume", "lait_soja", "proteine_vege", "sauce_soja"]) expect(ALIM[id].m, id).toContain("s");
    expect(ALIM.houmous.m).toContain("e");
    expect(ALIM.moutarde.m).toContain("u");
    expect(ALIM.bouillon.m).toContain("y");
    expect(ALIM.bouillon.m).toContain("g");
  });
  it("la pâte de curry n'est ni vegan, ni sans poisson, ni casher", () => {
    expect(ALIM.curry_pate.m).toMatch(/a/);
    expect(ALIM.curry_pate.m).toMatch(/p/);
    expect(ALIM.curry_pate.m).toMatch(/k/);
  });
  it("le curry de pois chiches reste vegan, mais signale le soja", () => {
    expect(regimeDe(R["curry-pois-chiches"])).toBe(3);
    expect(allergenesDe(R["curry-pois-chiches"])).toContain("s");
  });
  it("aucune recette proposée à un allergique ne contient son allergène", () => {
    for (const a of ["s", "e", "u", "y"])
      for (const r of recettesPour({ ...prefsDe({}), allergies: [a] }))
        expect(r.ing.some(([id]) => ALIM[id].m.includes(a)), `${a} : ${r.id}`).toBe(false);
  });
  it("chaque recette déclare au moins les allergènes de ses ingrédients", () => {
    for (const r of RECETTES) {
      const attendus = new Set(r.ing.flatMap(([id]) => [...ALIM[id].m]).filter((k) => "lgocrpseuy".includes(k)));
      expect(new Set(allergenesDe(r)), r.id).toEqual(attendus);
    }
  });
});

describe("garde-fous de santé", () => {
  const seche = (age: number, kg: number, cm: number, sexe = 1) =>
    besoins(etat({ objectif: 2, sexe, profil: { "Âge": age, Taille: cm, Poids: kg } }), false);
  const maintien = (age: number, kg: number, cm: number, sexe = 1) =>
    besoins(etat({ objectif: 3, sexe, profil: { "Âge": age, Taille: cm, Poids: kg } }), false);

  it("pas de déficit avant 18 ans", () => {
    const b = seche(16, 52, 162);
    expect(b.kcal).toBe(maintien(16, 52, 162).kcal);
    expect(b.ajustement).toMatch(/médecin|diététicien/);
  });
  it("pas de déficit sous un IMC de 18,5", () => {
    expect(seche(30, 45, 157).kcal).toBe(maintien(30, 45, 157).kcal);
  });
  it("le déficit reste proposé à un adulte de poids normal", () => {
    expect(seche(32, 60, 165).kcal).toBeLessThan(maintien(32, 60, 165).kcal);
  });
  it("une personne obèse en sèche n'est plus au-dessus de son maintien", () => {
    expect(seche(40, 140, 180, 0).kcal).toBeLessThan(maintien(40, 140, 180, 0).kcal);
    expect(seche(40, 110, 165, 1).kcal).toBeLessThan(maintien(40, 110, 165, 1).kcal);
  });
  it("protéines plafonnées à 1,6 g/kg avant 18 ans", () => {
    expect(objectifProteines({ objectif: 2, profil: { "Âge": 16, Taille: 162, Poids: 52 } } as Reponses)).toBeLessThanOrEqual(85);
  });
  it("l'eau suit le poids de référence (pas 5 litres à 140 kg)", () => {
    expect(maintien(40, 140, 180, 0).eau!).toBeLessThanOrEqual(4000);
  });
});
