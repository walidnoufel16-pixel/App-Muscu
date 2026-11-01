import { describe, expect, it } from "vitest";
import { ARTICLES, CATEGORIES, aLireAussi, adresse, article, tempsLecture, texte } from "@/lib/data/blog";
import fs from "node:fs";
import path from "node:path";
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
  it("chaque article a sa version anglaise, avec une adresse unique, et les deux langues se répondent", () => {
    const en = ARTICLES.map((a) => texte(a, "en"));
    for (const t of en) { expect(t?.titre, "anglais manquant").toBeTruthy(); expect(t.blocs.length).toBeGreaterThan(0); expect(t.description.length).toBeLessThan(200); }
    expect(new Set(en.map((t) => t.slug)).size).toBe(ARTICLES.length);
    for (const a of ARTICLES) {
      expect(article(texte(a, "en").slug, "en")).toBe(a);
      expect(adresse(a, "en")).toMatch(/^\/en\/blog\/[a-z0-9-]+\/$/);
      expect(aLireAussi(texte(a, "en").slug, 2, "en")).not.toContain(a);
    }
  });
  it("plus d'argument « sans pub » ni « sans abonnement » affiché", () => {
    const dirs = ["app", "components"], trouve: string[] = [];
    const lire = (d: string) => { for (const f of fs.readdirSync(d)) { const p = path.join(d, f); if (fs.statSync(p).isDirectory()) lire(p); else if (/\.tsx?$/.test(f) && /sans pub|sans abonnement/i.test(fs.readFileSync(p, "utf8"))) trouve.push(p); } };
    for (const d of dirs) lire(path.join(__dirname, "..", d));
    expect(trouve).toEqual([]);
  });
});
