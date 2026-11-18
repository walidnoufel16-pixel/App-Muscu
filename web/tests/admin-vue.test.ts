import { describe, expect, it } from "vitest";
import { nomSource, sourcesLisibles, testeurs, vueTesteurs, type CompteAdmin } from "@/lib/logic/admin";

const c = (id: string, cree: string, jours: string[] = []): CompteAdmin => ({
  id, email: null, anonyme: false, cree, connexion: null, pseudo: id, maj: null,
  etat: { HIST: jours.map((d) => ({ d, s: "L|0", nom: "x", vol: 0, ser: 1, ex: {} })) } as unknown as CompteAdmin["etat"],
});
const L = [c("moi", "2026-10-04T10:00:00Z", ["2026-11-14"]), c("claire", "2026-09-29T10:00:00Z", ["2026-11-14", "2026-11-01"]), c("mel", "2026-11-18T00:05:00Z"), c("issam", "2026-10-27T10:00:00Z")];

describe("Admin › Vue d'ensemble", () => {
  it("écarte les comptes exclus et filtre par séance", () => {
    expect(testeurs(L, ["moi"]).map((x) => x.id)).toEqual(["claire", "mel", "issam"]);
    expect(testeurs(L, ["moi"], "seance").map((x) => x.id)).toEqual(["claire"]);
    expect(testeurs(L, ["moi"], "sans").map((x) => x.id)).toEqual(["mel", "issam"]);
  });
  it("compte testeurs, inscrits et séances sur la période", () => {
    const v = vueTesteurs(L, ["moi"], 30, "2026-11-18");
    expect(v).toEqual({ total: 3, nouveaux7: 1, inscrits: 2, inscritsAvecSeance: 0, seances: 2, seances7: 1 });
    expect(vueTesteurs(L, ["moi"], 3650, "2026-11-18").inscritsAvecSeance).toBe(1);
  });
  it("donne des noms de source lisibles, regroupés", () => {
    expect(nomSource("")).toBe("Lien direct ou inconnu");
    expect(nomSource("insta")).toBe("Instagram");
    expect(sourcesLisibles([{ source: "blog-proteines-en", n: 1 }, { source: "guide-repas-en", n: 1 }, { source: "", n: 27 }])).toEqual([["Lien direct ou inconnu", 27], ["Blog", 2]]);
  });
});
