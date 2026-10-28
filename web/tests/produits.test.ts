import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { chercherProduits, codeValide, depuisOFF, garderProduit, produitParCode, protDe } from "@/lib/logic/produits";

/* vraies réponses, allégées : Open Food Facts (skyr Danone, code absent) et recherche Wger */
const F = (n: string) => JSON.parse(fs.readFileSync(path.join(__dirname, "fixtures/produits", n), "utf8"));
const repond = (json: unknown, ok = true) => (async () => ({ ok, status: ok ? 200 : 503, json: async () => json })) as unknown as typeof fetch;

describe("codes-barres", () => {
  it("clé de contrôle EAN-13, EAN-8 et UPC-A", () => {
    expect(codeValide("3033491454080")).toBe(true);
    expect(codeValide("3033491454081")).toBe(false);
    expect(codeValide("96385074")).toBe(true);
    expect(codeValide("036000291452")).toBe(true);
    expect(codeValide("12345")).toBe(false);
    expect(codeValide("30334914540a0")).toBe(false);
  });
});

describe("Open Food Facts", () => {
  it("lit nom, marque, valeurs pour 100 g et portion", async () => {
    const p = await produitParCode("3033491454080", repond(F("off-skyr.json")));
    expect(p).toEqual({ code: "3033491454080", n: "SKYR", marque: "Danone", p: 10, kcal: 57.5, g: 3.9, l: 0.2, portion: 120 });
  });
  it("code inconnu ou produit sans protéines : rien", async () => {
    expect(await produitParCode("0000000000000", repond(F("off-absent.json")))).toBeNull();
    const sans = F("off-skyr.json");
    delete sans.product.nutriments.proteins_100g;
    expect(depuisOFF(sans)).toBeNull();
  });
  it("serveur indisponible : une erreur, que l'écran affiche", async () => {
    await expect(produitParCode("3033491454080", repond({}, false))).rejects.toThrow();
  });
});

describe("recherche par nom", () => {
  it("produits avec protéines, sans doublon, au plus 15", async () => {
    const l = await chercherProduits("yaourt grec", repond(F("wger-yaourt-grec.json")));
    expect(l.length).toBeGreaterThan(0);
    expect(l.length).toBeLessThanOrEqual(15);
    for (const p of l) expect(p.p).toBeGreaterThanOrEqual(0);
    expect(new Set(l.map((p) => p.code ?? p.n)).size).toBe(l.length);
    expect(l.find((p) => p.marque === "MONOPRIX GOURMET")).toMatchObject({ n: "Yaourt Grec", p: 6.3, kcal: 130 });
  });
  it("moins de deux lettres : pas de requête", async () => {
    let appels = 0;
    await chercherProduits("y", (async () => { appels++; return { ok: true, json: async () => ({}) }; }) as unknown as typeof fetch);
    expect(appels).toBe(0);
  });
});

describe("protéines et « Mes produits »", () => {
  const skyr = { code: "3033491454080", n: "SKYR", marque: "Danone", p: 10, portion: 120 };
  it("protéines pour une quantité", () => {
    expect(protDe(skyr, 120)).toBe(12);
    expect(protDe(skyr, 150)).toBe(15);
  });
  it("le dernier utilisé en tête, sans doublon, 30 au plus", () => {
    const autres = Array.from({ length: 35 }, (_, i) => ({ n: `Produit ${i}`, p: 5 }));
    const l = garderProduit(garderProduit(autres, skyr), { ...skyr, p: 11 });
    expect(l[0]).toMatchObject({ code: skyr.code, p: 11 });
    expect(l.filter((x) => x.code === skyr.code)).toHaveLength(1);
    expect(l).toHaveLength(30);
  });
});
