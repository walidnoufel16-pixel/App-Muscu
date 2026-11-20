import { describe, expect, it } from "vitest";
import { etapesEntonnoir, nomSource, sourcesLisibles, testeurs, vueTesteurs, type CompteAdmin } from "@/lib/logic/admin";

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

describe("entonnoir des nouveaux visiteurs", () => {
  it("part des visiteurs, passage depuis l'étape d'avant, plus grosse perte", () => {
    const { etapes, perte } = etapesEntonnoir({ ouverture: 100, profil: 60, serie: 30, seance: 24, deux: 10 });
    expect(etapes.map((x) => x.part)).toEqual([100, 60, 30, 24, 10]);
    expect(etapes.map((x) => x.passage)).toEqual([null, 60, 50, 80, 42]);
    expect(perte).toBe(4);
  });
  it("une étape sautée (séance sans profil) ne dépasse pas 100 % ; pas de perte signalée sous 3 personnes", () => {
    const r = etapesEntonnoir({ ouverture: 2, profil: 0, serie: 1, seance: 1, deux: 0 });
    expect(r.etapes[2].passage).toBe(null);
    expect(r.perte).toBe(null);
    expect(etapesEntonnoir({ ouverture: 10, profil: 2, serie: 5, seance: 5, deux: 1 }).etapes[2].passage).toBe(100);
  });
  it("aucun visiteur : tout à zéro", () => {
    expect(etapesEntonnoir({ ouverture: 0, profil: 0, serie: 0, seance: 0, deux: 0 }).etapes.every((x) => x.part === 0)).toBe(true);
  });
});
