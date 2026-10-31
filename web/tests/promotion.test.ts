import { describe, expect, it } from "vitest";
import { GUIDES } from "@/lib/data/guides";
import { EX } from "@/lib/data/exercices";

describe("guides publics", () => {
  it("chaque guide a une adresse unique, un lien marqué ?src= et des exercices connus", () => {
    expect(new Set(GUIDES.map((g) => g.slug)).size).toBe(GUIDES.length);
    for (const g of GUIDES) {
      expect(g.lien).toMatch(/^\/\?src=[a-z0-9_-]{1,24}$/);
      expect(g.description.length).toBeLessThan(200);
    }
  });
  it("les exercices cités par les guides existent", () => {
    for (const id of ["susp", "ra", "trneg", "sqpc", "pomp", "fepc", "pont", "sup", "gai"]) expect(EX[id], id).toBeTruthy();
  });
  it("la progression vers la traction commence par la suspension et finit par la traction", () => {
    const g = GUIDES.find((x) => x.slug === "premiere-traction")!;
    const l = g.blocs[0].liste!;
    expect(l[0]).toContain(EX.susp.n);
    expect(l.at(-1)).toContain(EX.tr.n);
  });
});
