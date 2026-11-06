/* Nutrition simple : un objectif de protéines par jour et un suivi en un geste.
   Les calories restent discrètes (Repas › réglages). Stocké dans A.prot (30 derniers jours). Logique pure. */
import { tr } from "@/lib/i18n";
import type { Reponses } from "./types";

/* g de protéines par kg, selon l'objectif (0 muscle · 1 force · 2 s'affiner · 3 forme), dans la
   fourchette des recommandations pour le sportif (ISSN : 1,6 à 2,2 g/kg) : plus haut en sèche, pour
   garder le muscle. +0,2 g/kg après 50 ans (le muscle répond moins bien aux protéines). */
const FACTEUR = [2, 1.8, 2.2, 1.6];

export const poidsDe = (A: Reponses): number | null => {
  const p = Array.isArray(A.poids) ? (A.poids as [string, number][]).at(-1)?.[1] : undefined;
  return p ?? A.profil?.["Poids"] ?? null;
};

/** Poids de référence pour les protéines : au-delà d'un IMC de 30, le poids « ajusté »
    (poids à IMC 25 + 40 % de l'excédent), pour ne pas gonfler l'objectif avec la masse grasse. */
export function poidsReference(A: Reponses, p: number) {
  const cm = A.profil?.["Taille"];
  if (!cm) return p;
  const m2 = (cm / 100) ** 2, ideal = 25 * m2;
  return p / m2 > 30 ? ideal + 0.4 * (p - ideal) : p;
}

/** Objectif du jour en grammes (réglé à la main, sinon calculé ; 120 g sans poids connu). */
export function objectifProteines(A: Reponses): number {
  if (typeof A.protObj === "number") return A.protObj;
  const p = poidsDe(A);
  if (!p) return 120;
  const f = (FACTEUR[A.objectif ?? 3] ?? 1.6) + ((A.profil?.["Âge"] ?? 0) >= 50 ? 0.2 : 0);
  return Math.round((poidsReference(A, p) * f) / 5) * 5;
}

export const ALIMENTS: { n: string; q: string; g: number }[] = [
  { n: "Œufs", q: tr("2 œufs"), g: 12 },
  { n: tr("Skyr ou yaourt grec"), q: tr("150 g"), g: 15 },
  { n: tr("Fromage blanc"), q: tr("200 g"), g: 16 },
  { n: tr("Poulet ou dinde"), q: tr("120 g"), g: 30 },
  { n: tr("Steak haché 5 %"), q: tr("125 g"), g: 26 },
  { n: tr("Thon en boîte"), q: tr("1 boîte"), g: 25 },
  { n: tr("Saumon"), q: tr("120 g"), g: 24 },
  { n: tr("Shaker de whey"), q: tr("30 g"), g: 24 },
  { n: tr("Lentilles cuites"), q: tr("200 g"), g: 18 },
  { n: tr("Tofu"), q: tr("150 g"), g: 20 },
  { n: tr("Lait"), q: tr("1 verre (250 ml)"), g: 8 },
  { n: tr("Emmental"), q: tr("30 g"), g: 8 },
];

export const protDuJour = (A: Reponses, jour: string) => ((A.prot || {}) as Record<string, number>)[jour] || 0;

/** Ajoute (ou retire) des grammes au jour, en ne gardant que 30 jours. */
export function ajouterProt(A: Reponses, jour: string, g: number) {
  const p = { ...((A.prot || {}) as Record<string, number>) };
  p[jour] = Math.max(0, Math.min(500, (p[jour] || 0) + g));
  A.prot = Object.fromEntries(Object.entries(p).sort(([a], [b]) => (a < b ? -1 : 1)).slice(-30));
}
