import { describe, expect, it } from "vitest";
import { ARTICLES, CATEGORIES, aLireAussi, article, tempsLecture } from "@/lib/data/blog";
import { EX } from "@/lib/data/exercices";

describe("blog public", () => {
  it("chaque article a une adresse unique, un lien marqué src= et une description courte", () => {
    expect(new Set(ARTICLES.map((g) => g.slug)).size).toBe(ARTICLES.length);
    for (const g of ARTICLES) {
      expect(g.lien).toMatch(/^\/[a-z/]*\?(.*&)?src=[a-z0-9_-]{1,24}$/);
      expect(g.description.length).toBeLessThan(200);
    }
  });
  it("les exercices cités par les guides existent", () => {
    for (const id of ["susp", "ra", "trneg", "sqpc", "pomp", "fepc", "pont", "sup", "gai"]) expect(EX[id], id).toBeTruthy();
  });
  it("la progression vers la traction commence par la suspension et finit par la traction", () => {
    const g = article("premiere-traction")!;
    const l = g.blocs[0].liste!;
    expect(l[0]).toContain(EX.susp.n);
    expect(l.at(-1)).toContain(EX.tr.n);
  });
  it("8 articles du plus récent au plus ancien, chacun avec catégorie, couverture et temps de lecture", () => {
    expect(ARTICLES.length).toBe(8);
    for (let i = 1; i < ARTICLES.length; i++) expect(ARTICLES[i - 1].date >= ARTICLES[i].date).toBe(true);
    for (const a of ARTICLES) {
      expect(CATEGORIES).toContain(a.categorie);
      expect(a.couverture).toMatch(/^(\/img\/|https:\/\/images\.unsplash\.com\/)/);
      if (a.couverture.startsWith("https://")) expect(a.credit?.lien).toMatch(/^https:\/\/unsplash\.com\/@/);
      expect(tempsLecture(a)).toBeGreaterThanOrEqual(1);
    }
    expect(ARTICLES[0].slug).toBe("preparer-premier-hyrox");
    expect(article("preparer-premier-hyrox")!.lien).toContain("obj=hyrox");
  });
  it("à lire aussi : deux autres articles, de la même catégorie d'abord", () => {
    const l = aLireAussi("creatine-a-quoi-ca-sert");
    expect(l.length).toBe(2);
    expect(l.map((x) => x.slug)).not.toContain("creatine-a-quoi-ca-sert");
    expect(l[0].categorie).toBe("Nutrition");
  });
});
