/* Nutrition simple : un objectif de protéines par jour et un suivi en un geste.
   Pas de calories, volontairement. Stocké dans A.prot (30 derniers jours). Logique pure. */
import type { Reponses } from "./types";

/* g de protéines par kg de poids du corps, selon l'objectif du questionnaire
   (0 muscle · 1 force · 2 s'affiner · 3 forme). */
const FACTEUR = [1.8, 1.7, 2, 1.4];

export const poidsDe = (A: Reponses): number | null => {
  const p = Array.isArray(A.poids) ? (A.poids as [string, number][]).at(-1)?.[1] : undefined;
  return p ?? A.profil?.["Poids"] ?? null;
};

/** Objectif du jour en grammes (réglé à la main, sinon calculé ; 120 g sans poids connu). */
export function objectifProteines(A: Reponses): number {
  if (typeof A.protObj === "number") return A.protObj;
  const p = poidsDe(A);
  return p ? Math.round((p * FACTEUR[A.objectif ?? 3] || p * 1.6) / 5) * 5 : 120;
}

export const ALIMENTS: { n: string; q: string; g: number }[] = [
  { n: "Œufs", q: "2 œufs", g: 12 },
  { n: "Skyr ou yaourt grec", q: "150 g", g: 15 },
  { n: "Fromage blanc", q: "200 g", g: 16 },
  { n: "Poulet ou dinde", q: "120 g", g: 30 },
  { n: "Steak haché 5 %", q: "125 g", g: 26 },
  { n: "Thon en boîte", q: "1 boîte", g: 25 },
  { n: "Saumon", q: "120 g", g: 24 },
  { n: "Shaker de whey", q: "30 g", g: 24 },
  { n: "Lentilles cuites", q: "200 g", g: 18 },
  { n: "Tofu", q: "150 g", g: 20 },
  { n: "Lait", q: "1 verre (250 ml)", g: 8 },
  { n: "Emmental", q: "30 g", g: 8 },
];

export const protDuJour = (A: Reponses, jour: string) => ((A.prot || {}) as Record<string, number>)[jour] || 0;

/** Ajoute (ou retire) des grammes au jour, en ne gardant que 30 jours. */
export function ajouterProt(A: Reponses, jour: string, g: number) {
  const p = { ...((A.prot || {}) as Record<string, number>) };
  p[jour] = Math.max(0, Math.min(500, (p[jour] || 0) + g));
  A.prot = Object.fromEntries(Object.entries(p).sort(([a], [b]) => (a < b ? -1 : 1)).slice(-30));
}
