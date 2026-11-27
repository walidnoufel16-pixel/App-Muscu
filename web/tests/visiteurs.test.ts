import { describe, expect, it } from "vitest";
import { duree, etapeVisiteur, nomEcran, phraseEvenement, provenance } from "@/lib/logic/visiteurs";

describe("Admin › Visiteurs", () => {
  it("les écrans ont un nom lisible", () => {
    expect(nomEcran("/bienvenue/compte")).toBe("Formulaire d'inscription");
    expect(nomEcran("/entrainement/composer")).toBe("Création de séance");
    expect(nomEcran("/blog/creatine")).toBe("Blog");
    expect(nomEcran("/inconnu")).toBe("/inconnu");
  });
  it("durées", () => {
    expect(duree(42)).toBe("42 s");
    expect(duree(185)).toBe("3 min 05");
    expect(duree(4320)).toBe("1 h 12");
  });
  it("provenance : source, sinon site d'origine, sinon accès direct", () => {
    expect(provenance({ src: "tiktok", dev: "iphone", app: true })).toBe("Tiktok · iPhone · app installée");
    expect(provenance({ ref: "google.com", dev: "ordinateur" })).toBe("Google.com · Ordinateur");
    expect(provenance({ dev: "android" })).toBe("Accès direct · Android");
  });
  it("étape la plus avancée", () => {
    const base = { formulaire: false, compte: false, prete: false, serie: false, seances: 0 };
    expect(etapeVisiteur(base).texte).toBe("Parti sans s'inscrire");
    expect(etapeVisiteur({ ...base, formulaire: true }).texte).toBe("Formulaire ouvert, pas de compte");
    expect(etapeVisiteur({ ...base, formulaire: true, compte: true, serie: true }).n).toBe(4);
    expect(etapeVisiteur({ ...base, seances: 3 }).texte).toBe("3 séances terminées");
  });
  it("phrases du parcours", () => {
    expect(phraseEvenement({ nom: "ecran", props: { p: "/repas", s: 75, dfl: 60 }, h: "" })).toEqual({ texte: "Repas", detail: "1 min 15 · défilé 60 %" });
    expect(phraseEvenement({ nom: "clic", props: { p: "/bienvenue/accueil", l: "Commencer" }, h: "" }).texte).toBe("Touche « Commencer »");
  });
});
