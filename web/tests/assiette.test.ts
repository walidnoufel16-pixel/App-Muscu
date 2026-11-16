/* L'assiette d'un plat selon l'objectif : classement des ingrédients, type de plat, accompagnement. */
import { describe, expect, it } from "vitest";
import { assietteDe, FRACTIONS, PLATS, roleDe } from "@/lib/logic/assiette";
import { R } from "@/lib/logic/repas";

describe("assiette", () => {
  it("règles du coach : coulis et oignon en légumes, maïs en féculents, avocat en gras, parmesan en garniture, légumineuses en protéines", () => {
    expect(roleDe("passata", 150)).toBe("l");
    expect(roleDe("oignon", 50)).toBe("l");
    expect(roleDe("mais", 40)).toBe("f");
    expect(roleDe("avocat", 50)).toBe("gras");
    expect(roleDe("parmesan", 10)).toBe("garniture");
    expect(roleDe("lentilles_corail", 60)).toBe("p");
    expect(roleDe("feta", 50)).toBe("p");
    expect(roleDe("feta", 20)).toBe("garniture");
    expect(roleDe("ail", 5)).toBeNull();
  });
  it("chaque objectif remplit toute l'assiette ; la sèche a plus de protéines que la forme", () => {
    for (const f of Object.values(FRACTIONS)) expect(f.p + f.f + f.l).toBeCloseTo(1);
    expect(FRACTIONS.seche.p).toBeGreaterThan(FRACTIONS.forme.p);
    expect(FRACTIONS.seche.f).toBeGreaterThan(0);
  });
  it("les 42 plats ont une protéine et des légumes", () => {
    const P = PLATS();
    expect(P).toHaveLength(42);
    for (const r of P) { const a = assietteDe(r); expect(a.p.length, r.id).toBeGreaterThan(0); expect(a.l.length, r.id).toBeGreaterThan(0); }
  });
  it("chili : mijoté avec riz à part et crudités ; poulet-riz-brocoli : séparé sans accompagnement ; salade composée : rien à ajouter", () => {
    const c = assietteDe(R["chili-con-carne"]);
    expect(c.type).toBe("mijote"); expect(c.f).toContain("riz"); expect(c.l).toContain("passata"); expect(c.accomp).toBeTruthy();
    const p = assietteDe(R["poulet-riz-brocoli"]);
    expect(p.type).toBe("separe"); expect(p.accomp).toBeUndefined();
    expect(assietteDe(R["salade-pois-chiches-haricots"]).accomp).toBeUndefined();
    expect(assietteDe(R["butternut-lentilles"]).sansFeculent).toBe(true);
  });
});
