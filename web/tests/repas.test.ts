import { describe, expect, it } from "vitest";
import { ALIM } from "@/lib/data/aliments";
import { RECETTES } from "@/lib/data/recettes";
import {
  allergenesDe, avecCeQueJai, besoins, compatible, listeCourses, macros, mains, planSemaine, portion, prefsDe, quantite, R, recettesPour, regimeDe, semaineParDefaut, suggestions,
} from "@/lib/logic/repas";
import type { Etat, Reponses } from "@/lib/logic/types";

const etat = (A: Reponses): Etat => ({ A, LOG: {}, SWAP: {}, SWAPP: {}, PLAN: null, SEANCES: [], wk: 0, day: 0, FINI: true, HIST: [] }) as Etat;
const homme = etat({ objectif: 0, sexe: 0, profil: { "Âge": 28, Taille: 180, Poids: 80 } });
const femme = etat({ objectif: 2, sexe: 1, profil: { "Âge": 32, Taille: 165, Poids: 60 } });

describe("recettes", () => {
  it("chaque ingrédient existe, chaque recette a ses étapes en deux langues", () => {
    expect(RECETTES.length).toBeGreaterThanOrEqual(55);
    for (const r of RECETTES) {
      for (const [id, g] of r.ing) { expect(ALIM[id], `${r.id} : ${id}`).toBeTruthy(); expect(g).toBeGreaterThan(0); }
      expect(r.e.length, r.id).toBe(r.ee.length);
      expect(r.e.length).toBeGreaterThan(0);
      expect(new Set(RECETTES.map((x) => x.id)).size).toBe(RECETTES.length);
    }
  });
  it("assez de protéines : plats ≥ 25 g, petits-déjeuners ≥ 20 g (portion de base)", () => {
    for (const r of RECETTES.filter((x) => x.m === "repas")) expect(macros(r).p, r.id).toBeGreaterThanOrEqual(25);
    for (const r of RECETTES.filter((x) => x.m === "matin")) expect(macros(r).p, r.id).toBeGreaterThanOrEqual(20);
  });
  it("régime et allergènes déduits des ingrédients", () => {
    expect(regimeDe(R["chili-con-carne"])).toBe(0);
    expect(regimeDe(R["poke-saumon"])).toBe(1);
    expect(regimeDe(R["omelette-epinards"])).toBe(2);
    expect(regimeDe(R["curry-pois-chiches"])).toBe(3);
    expect(allergenesDe(R["mug-cake"])).toEqual(expect.arrayContaining(["l", "g", "o"]));
    for (const r of recettesPour({ ...prefsDe({}), regime: 3 })) expect(r.ing.every(([id]) => !ALIM[id].m.includes("a")), r.id).toBe(true);
    for (const r of recettesPour({ ...prefsDe({}), allergies: ["l", "g"] })) expect(r.ing.some(([id]) => /[lg]/.test(ALIM[id].m)), r.id).toBe(false);
  });
  it("de quoi faire pour chaque régime", () => {
    for (const regime of [0, 1, 2, 3]) {
      const l = recettesPour({ ...prefsDe({}), regime });
      for (const m of ["matin", "repas", "collation"]) expect(l.filter((r) => r.m === m).length, `régime ${regime}, ${m}`).toBeGreaterThanOrEqual(2);
    }
  });
  it("halal : sans porc ; casher : sans porc ni fruits de mer, jamais viande et laitage ensemble", () => {
    const halal = recettesPour({ ...prefsDe({}), culte: 1 }), casher = recettesPour({ ...prefsDe({}), culte: 2 });
    for (const r of halal) expect(r.ing.some(([id]) => id === "porc" || id === "jambon"), r.id).toBe(false);
    expect(halal.some((r) => r.id === "crevettes-ail-riz")).toBe(true);
    for (const r of casher) {
      const m = r.ing.map(([id]) => ALIM[id].m).join("");
      expect(/[hk]/.test(m) || (m.includes("v") && m.includes("l")), r.id).toBe(false);
    }
    expect(casher.some((r) => r.id === "gratin-pates-poulet")).toBe(false);
    expect(casher.some((r) => r.id === "poulet-riz-brocoli")).toBe(true);
    for (const culte of [1, 2]) for (const m of ["matin", "repas", "collation"]) expect(recettesPour({ ...prefsDe({}), culte }).filter((r) => r.m === m).length).toBeGreaterThanOrEqual(5);
  });
  it("temps et matériel", () => {
    const p = { ...prefsDe({}), temps: 0, mat: ["plaques"] };
    for (const r of recettesPour(p)) { expect(r.min).toBeLessThanOrEqual(15); expect(r.mat.every((m) => m === "plaques")).toBe(true); }
    expect(compatible(R["saumon-patate-douce"], p)).toBe(false);
  });
});

describe("besoins", () => {
  it("homme 80 kg en prise de muscle, femme 60 kg en affinement : des besoins cohérents", () => {
    const h = besoins(homme, true), f = besoins(femme, false);
    expect(h.kcal).toBeGreaterThan(2500); expect(h.kcal).toBeLessThan(3400);
    expect(f.kcal).toBeGreaterThan(1300); expect(f.kcal).toBeLessThan(1900);
    expect(h.p).toBe(145); expect(f.p).toBe(120);
    expect(f.l).toBeGreaterThanOrEqual(48);
    expect(besoins(homme, true).g).toBeGreaterThan(besoins(homme, false).g);
  });
  it("méthode de la main", () => {
    const m = mains(besoins(homme, true), "dejeuner");
    expect(m.paumes).toBeGreaterThanOrEqual(1.5); expect(m.legumes).toBe(2);
  });
  it("portion : plus grande pour un grand gabarit, bornée, desserts à une portion", () => {
    const r = R["poulet-riz-brocoli"];
    expect(portion(r, besoins(homme, true), "dejeuner")).toBeGreaterThanOrEqual(portion(r, besoins(femme, false), "dejeuner"));
    expect(portion(R["mug-cake"], besoins(homme, true))).toBe(1);
    for (const x of RECETTES) { const f = portion(x, besoins(homme, true)); expect(f).toBeGreaterThanOrEqual(0.75); expect(f).toBeLessThanOrEqual(1.75); }
  });
});

describe("quantités", () => {
  it("unités lisibles", () => {
    expect(quantite("oeuf", 150)).toBe("3 œufs");
    expect(quantite("riz", 82)).toBe("80 g");
    expect(quantite("lait", 250)).toBe("250 ml");
    expect(quantite("huile", 5)).toBe("1 c. à café");
    expect(quantite("poulet", 1200)).toBe("1,2 kg");
  });
});

describe("suggestions, avec ce que j'ai, semaine, courses", () => {
  it("trois suggestions qui respectent les préférences, ↻ en propose une autre", () => {
    const p = { ...prefsDe({}), regime: 2 };
    const s = suggestions(p, "2026-10-27", true), s2 = suggestions(p, "2026-10-27", true, { dejeuner: 1 });
    expect(s.matin && s.dejeuner && s.collation).toBeTruthy();
    expect([s.matin!, s.dejeuner!, s.collation!].every((r) => regimeDe(r) >= 2)).toBe(true);
    expect(s2.dejeuner!.id).not.toBe(s.dejeuner!.id);
    expect(s2.matin!.id).toBe(s.matin!.id);
  });
  it("avec ce que j'ai : les recettes faisables en tête, avec ce qui manque", () => {
    const l = avecCeQueJai(prefsDe({}), ["poulet", "riz", "brocoli", "ail"]);
    expect(l[0].r.id).toBe("poulet-riz-brocoli");
    expect(l[0].manque).toEqual([]);
    expect(l.find((c) => c.r.id === "buddha-bowl")?.manque).toContain("avocat");
  });
  it("semaine : variée, les restes du dîner batch au déjeuner suivant", () => {
    const S = { ...semaineParDefaut(), jours: 7, creneaux: ["dejeuner", "diner"] as ("dejeuner" | "diner")[] };
    const cases = planSemaine(prefsDe({}), S);
    expect(cases.length).toBe(14);
    for (const k of cases.filter((x) => x.reste)) {
      const veille = cases.find((x) => x.jour === k.jour - 1 && x.c === "diner");
      expect(veille?.r.id).toBe(k.r.id);
      expect(k.r.t).toContain("batch");
    }
    const nouveaux = cases.filter((x) => !x.reste).map((x) => x.r.id);
    expect(new Set(nouveaux).size).toBe(nouveaux.length);
    /* un choix à la main est gardé */
    const avec = planSemaine(prefsDe({}), { ...S, choix: { "2|diner": "burger-maison" } });
    expect(avec.find((x) => x.jour === 2 && x.c === "diner")?.r.id).toBe("burger-maison");
  });
  it("liste de courses : additionnée, par rayon, sans le stock ni les produits de base", () => {
    const S = { ...semaineParDefaut(), jours: 2, creneaux: ["dejeuner"] as "dejeuner"[], choix: { "0|dejeuner": "poulet-riz-brocoli", "1|dejeuner": "buddha-bowl" } };
    const cases = planSemaine(prefsDe({}), S), b = besoins(homme, false);
    const l = listeCourses(cases, b, 1, ["riz"]);
    const tout = l.flatMap((r) => r.l);
    const poulet = tout.find((x) => x.id === "poulet")!;
    const attendu = 150 * portion(R["poulet-riz-brocoli"], b, "dejeuner") + 130 * portion(R["buddha-bowl"], b, "dejeuner");
    expect(poulet.g).toBeCloseTo(attendu);
    expect(tout.some((x) => x.id === "riz" || x.id === "huile" || x.id === "sel_poivre")).toBe(false);
    expect(l.map((r) => r.k)[0]).toBe("leg");
    /* deux personnes : deux fois plus */
    expect(listeCourses(cases, b, 2, []).flatMap((r) => r.l).find((x) => x.id === "poulet")!.g).toBeCloseTo(attendu * 2);
  });
});
