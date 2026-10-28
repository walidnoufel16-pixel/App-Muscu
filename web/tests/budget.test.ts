import { describe, expect, it } from "vitest";
import { ALIM } from "@/lib/data/aliments";
import { PRIX } from "@/lib/data/prix";
import { RECETTES } from "@/lib/data/recettes";
import { ajuster, appliquer, coutAliment, coutRecette, echanges, estimer, estimerSemaine, petitBudget } from "@/lib/logic/budget";
import { listeCourses, macros, planSemaine, portion, prefsDe, semaineParDefaut, type Besoins } from "@/lib/logic/repas";
import type { SemaineRepas } from "@/lib/logic/types";

const b: Besoins = { kcal: 2600, p: 140, g: 300, l: 80, seance: true };
const p = prefsDe({});
const S: SemaineRepas = { ...semaineParDefaut(), jours: 7, creneaux: ["matin", "dejeuner", "diner", "collation"] };

describe("prix de référence", () => {
  it("chaque aliment qu'on achète a un prix et un emballage plausibles ; les produits de base n'en ont pas", () => {
    for (const a of Object.values(ALIM)) {
      if (a.ray === "base") { expect(PRIX[a.id], a.id).toBeUndefined(); continue; }
      const [kg, pack] = PRIX[a.id] ?? [];
      expect(kg, a.id).toBeGreaterThan(0.5);
      expect(kg, a.id).toBeLessThan(60);
      expect(pack, a.id).toBeGreaterThanOrEqual(30);
    }
    for (const id of Object.keys(PRIX)) expect(ALIM[id], id).toBeTruthy();
  });
  it("chaque recette coûte entre 0,30 € et 8 € la portion de base", () => {
    for (const r of RECETTES) {
      const c = coutRecette(r);
      expect(c, r.id).toBeGreaterThan(0.3);
      expect(c, r.id).toBeLessThan(8);
    }
  });
});

describe("coût d'un aliment", () => {
  it("consommé au gramme près, en caisse par emballages entiers", () => {
    expect(coutAliment("pates", 180)).toBeCloseTo(0.288);
    expect(coutAliment("pates", 180, true)).toBeCloseTo(0.8);
    expect(coutAliment("pates", 505, true)).toBeCloseTo(0.8);
    expect(coutAliment("pates", 600, true)).toBeCloseTo(1.6);
  });
  it("le prix de l'utilisateur remplace la référence", () => {
    expect(coutAliment("skyr", 1000, false, { skyr: 5 })).toBe(5);
    expect(coutAliment("sel_poivre", 10)).toBe(0);
  });
});

describe("estimation de la liste", () => {
  const liste = listeCourses(planSemaine(p, S), b, 1, []);
  it("en caisse coûte au moins autant que consommé ; la fourchette encadre le total", () => {
    const caisse = estimer(liste, [], true), conso = estimer(liste, [], false);
    expect(caisse.total).toBeGreaterThanOrEqual(conso.total);
    expect(caisse.bas).toBeLessThan(caisse.total);
    expect(caisse.haut).toBeGreaterThan(caisse.total);
    expect(caisse.rayons.reduce((s, r) => s + r.total, 0)).toBeCloseTo(caisse.total);
  });
  it("les articles ajoutés et les prix de l'utilisateur sont exacts, hors fourchette", () => {
    const base = estimer(liste, [], true);
    const avec = estimer(liste, [{ id: "art:1", n: "Papier cuisson", q: "", e: "🧻", prix: 2.5 }], true);
    expect(avec.total - base.total).toBeCloseTo(2.5);
    expect(avec.bas - base.bas).toBeCloseTo(2.5);
    const id = liste[0].l[0].id, tout = Object.fromEntries(liste.flatMap((r) => r.l.map((x) => [x.id, 10])));
    expect(id).toBeTruthy();
    const perso = estimer(liste, [], true, tout);
    expect(perso.bas).toBeCloseTo(perso.total);
    expect(perso.haut).toBeCloseTo(perso.total);
  });
});

describe("échanges et ajustement au budget", () => {
  it("chaque échange fait baisser la liste et garde au moins 85 % des protéines", () => {
    const avant = estimerSemaine(p, S, b).total, l = echanges(p, S, b, 5);
    expect(l.length).toBeGreaterThan(0);
    expect(new Set(l.map((e) => e.vers.id)).size).toBe(l.length);
    expect(new Set(l.map((e) => `${e.k.jour}|${e.k.c}`)).size).toBe(l.length);
    for (const e of l) {
      const apres = estimerSemaine(p, appliquer(S, e), b).total;
      expect(avant - apres).toBeCloseTo(e.gain);
      expect(e.gain).toBeGreaterThan(0);
      expect(macros(e.vers, portion(e.vers, b, e.k.c)).p).toBeGreaterThanOrEqual(0.85 * macros(e.k.r, portion(e.k.r, b, e.k.c)).p);
    }
  });
  it("« Ajuster ma semaine » passe sous un budget atteignable, et ne touche à rien sans budget", () => {
    const avant = estimerSemaine(p, S, b).total;
    const q = { ...p, budget: Math.round(avant * 0.85) };
    const s = ajuster(q, S, b);
    expect(estimerSemaine(q, s, b).total).toBeLessThanOrEqual(q.budget);
    expect(ajuster(p, S, b)).toBe(S);
  });
});

describe("petit budget", () => {
  it("environ un tiers des recettes de chaque moment", () => {
    for (const m of ["matin", "repas", "collation"] as const) {
      const l = RECETTES.filter((r) => r.m === m), n = l.filter((r) => petitBudget(r)).length;
      expect(n, m).toBeGreaterThanOrEqual(Math.floor(l.length / 3));
      expect(n, m).toBeLessThanOrEqual(Math.ceil(l.length / 3) + 1);
    }
  });
});
