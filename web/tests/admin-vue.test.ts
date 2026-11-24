import { describe, expect, it } from "vitest";
import { etapesEntonnoir, inscritsSurPeriode, nomSource, sourcesLisibles, surPeriode, testeurs, TOUT, vueTesteurs, type CompteAdmin } from "@/lib/logic/admin";
import { raccourciDe } from "@/lib/logic/raccourcis";
import { nomSeance } from "@/lib/logic/assistant";
import { questionsManquantes } from "@/components/repere/premiers-pas";

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
  describe("suit la période choisie (Aujourd'hui, 7 jours, 30 jours, Tout)", () => {
    const auj = "2026-11-18";
    const P = [
      c("a", "2026-11-18T12:00:00Z", ["2026-11-18"]),
      c("b", "2026-11-15T12:00:00Z", ["2026-11-16", "2026-11-12"]),
      c("f", "2026-11-11T12:00:00Z"),
      c("d", "2026-11-01T12:00:00Z"),
      c("e", "2025-01-10T12:00:00Z", ["2026-11-18", "2026-10-01"]),
    ];
    const sans = (j: number) => { const { total, nouveaux7, ...r } = vueTesteurs(P, [], j, auj); void total; void nouveaux7; return r; };
    it("aujourd'hui : seulement les comptes créés et les séances du jour", () => {
      expect(sans(1)).toEqual({ inscrits: 1, inscritsAvecSeance: 1, seances: 2, seances7: 4 });
    });
    it("7 jours : aujourd'hui compris, le 7e jour en arrière inclus, le 8e exclu", () => {
      expect(sans(7)).toEqual({ inscrits: 2, inscritsAvecSeance: 2, seances: 4, seances7: 4 });
      expect(inscritsSurPeriode(P, [], 7, auj).map((x) => x.id)).toEqual(["a", "b"]);
      expect(surPeriode("2026-11-12T12:00:00Z", 7, auj)).toBe(true);
      expect(surPeriode("2026-11-11T12:00:00Z", 7, auj)).toBe(false);
    });
    it("30 jours", () => {
      expect(sans(30)).toEqual({ inscrits: 4, inscritsAvecSeance: 2, seances: 4, seances7: 4 });
    });
    it("tout : tous les comptes et toutes les séances", () => {
      expect(sans(TOUT)).toEqual({ inscrits: 5, inscritsAvecSeance: 3, seances: 5, seances7: 4 });
      expect(vueTesteurs(P, [], TOUT, auj).total).toBe(5);
    });
    it("le total et les 7 derniers jours ne dépendent pas de la période", () => {
      for (const j of [1, 7, 30, TOUT]) expect(vueTesteurs(P, [], j, auj)).toMatchObject({ total: 5, nouveaux7: 2, seances7: 4 });
    });
    it("les comptes exclus ne comptent sur aucune période", () => {
      expect(vueTesteurs(P, ["e"], 1, auj)).toMatchObject({ total: 4, seances: 1 });
      expect(inscritsSurPeriode(P, ["e"], TOUT, auj).map((x) => x.id)).toEqual(["a", "b", "f", "d"]);
    });
    it("sans date de création : jamais sur la période", () => {
      expect(surPeriode(null, TOUT, auj)).toBe(false);
    });
  });
  it("donne des noms de source lisibles, regroupés", () => {
    expect(nomSource("")).toBe("Lien direct ou inconnu");
    expect(nomSource("insta")).toBe("Instagram");
    expect(sourcesLisibles([{ source: "blog-proteines-en", n: 1 }, { source: "guide-repas-en", n: 1 }, { source: "", n: 27 }])).toEqual([["Lien direct ou inconnu", 27], ["Blog", 2]]);
  });
});

describe("entonnoir des nouveaux visiteurs", () => {
  it("part des visiteurs, passage depuis l'étape d'avant, plus grosse perte", () => {
    const { etapes, perte } = etapesEntonnoir({ ouverture: 100, visite: 70, chemin: 55, prete: 30, agit: 22, seance: 14, deux: 6 });
    expect(etapes.map((x) => x.part)).toEqual([100, 70, 55, 30, 22, 14, 6]);
    expect(etapes.map((x) => x.passage)).toEqual([null, 70, 79, 55, 73, 64, 43]);
    expect(perte).toBe(6);
  });
  it("une étape sautée ne dépasse pas 100 % ; pas de perte signalée sous 3 personnes", () => {
    const r = etapesEntonnoir({ ouverture: 2, visite: 0, chemin: 1, prete: 1, agit: 1, seance: 1, deux: 0 });
    expect(r.etapes[2].passage).toBe(null);
    expect(r.perte).toBe(null);
    expect(etapesEntonnoir({ ouverture: 10, visite: 2, chemin: 5, prete: 5, agit: 1, seance: 1, deux: 0 }).etapes[2].passage).toBe(100);
    /* ancienne version de la fonction en base (sans les nouvelles étapes) : elles valent 0, rien ne casse */
    expect(etapesEntonnoir({ ouverture: 4, seance: 1, deux: 0 }).etapes[1].n).toBe(0);
  });
  it("aucun visiteur : tout à zéro", () => {
    expect(etapesEntonnoir({ ouverture: 0, seance: 0, deux: 0 }).etapes.every((x) => x.part === 0)).toBe(true);
  });
});

describe("raccourcis du choix des muscles", () => {
  it("chaque raccourci se reconnaît dans n'importe quel ordre, et donne son nom à la séance", () => {
    expect(raccourciDe(["tri", "bic", "epa", "dos", "pec"])).toBe("haut");
    expect(raccourciDe(["abd", "mol", "isc", "qua"])).toBe("bas");
    expect(raccourciDe(["pec", "dos"])).toBe(null);
    expect(nomSeance(["pec", "dos", "epa", "bic", "tri"])).toBe("Haut du corps");
    expect(nomSeance(["qua", "isc", "mol", "abd"])).toBe("Bas du corps");
    expect(nomSeance(["pec", "dos", "qua", "isc", "epa", "abd"])).toBe("Full body");
    expect(nomSeance(["pec", "tri"])).toBe("Pectoraux · Triceps");
  });
  it("les 4 questions d'accueil : une réponse déjà donnée n'est jamais redemandée", () => {
    expect(questionsManquantes({} as never)).toEqual({ sexe: true, niveau: true, materiel: true, duree: true });
    expect(questionsManquantes({ sexe: 1, regularite: 2, materiel: 0, duree: 45 } as never)).toEqual({ sexe: false, niveau: false, materiel: false, duree: false });
  });
});
