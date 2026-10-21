/* Soin & mobilité : zones du corps et routines prêtes (rééducation légère,
   mobilité). Les exercices eux-mêmes sont dans EX, avec leur zone dans `soin`. */
import { langue, tr } from "@/lib/i18n";
import type { ExLibre } from "@/lib/logic/types";
import { EX } from "@/lib/data/exercices";

export type ZoneSoin = "epaules" | "hanches" | "dos" | "genoux" | "chevilles" | "poignets" | "nuque";

/** Zones dans l'ordre d'affichage : [clé, nom]. */
export const ZONES_SOIN: [ZoneSoin, string][] = [
  ["epaules", "Épaules et coiffe des rotateurs"],
  ["hanches", "Hanches"],
  ["dos", "Bas du dos"],
  ["genoux", "Genoux"],
  ["chevilles", "Chevilles"],
  ["poignets", "Poignets et coudes"],
  ["nuque", "Nuque et haut du dos"],
];

export type RoutineSoin = { z: ZoneSoin; nom: string; but: string; ex: ExLibre[] };

/* Ordre pensé pour chaque routine : mobilisation douce, renforcement léger, étirement. */
export const ROUTINES_SOIN: RoutineSoin[] = [
  { z: "epaules", nom: "Coiffe des rotateurs", but: "Réveiller et renforcer les petits muscles qui stabilisent l'épaule.", ex: [
    { id: "cbras", s: 1, r: 15, p: "15 s" }, { id: "batep", s: 2, r: 10, p: "15 s" }, { id: "elrot", s: 2, r: 15, p: "30 s" },
    { id: "rintel", s: 2, r: 15, p: "30 s" }, { id: "oisrot", s: 2, r: 12, p: "45 s" }, { id: "bcrois", s: 2, r: 30, p: "15 s" }] },
  { z: "hanches", nom: "Mobilité des hanches", but: "Retrouver de l'amplitude dans toutes les directions et réveiller les fessiers.", ex: [
    { id: "chq", s: 2, r: 10, p: "15 s" }, { id: "groin", s: 2, r: 8, p: "30 s" }, { id: "hext", s: 2, r: 15, p: "30 s" },
    { id: "fig4", s: 2, r: 30, p: "15 s" }, { id: "flexd", s: 2, r: 30, p: "15 s" }] },
  { z: "dos", nom: "Bas du dos", but: "Mobiliser le bassin, gainer sans comprimer, puis relâcher.", ex: [
    { id: "bascp", s: 2, r: 10, p: "30 s" }, { id: "tho", s: 2, r: 10, p: "15 s" }, { id: "croix", s: 2, r: 8, p: "30 s" },
    { id: "gpoit", s: 1, r: 30, p: "15 s" }, { id: "enf", s: 1, r: 30, p: "15 s" }] },
  { z: "genoux", nom: "Genoux", but: "Renforcer la cuisse sans irriter le genou et retrouver le contrôle en flexion.", ex: [
    { id: "cgen", s: 1, r: 10, p: "15 s" }, { id: "sqas", s: 3, r: 12, p: "30 s" }, { id: "pont", s: 3, r: 12, p: "45 s" },
    { id: "molP", s: 2, r: 15, p: "45 s" }, { id: "quadet", s: 2, r: 30, p: "15 s" }] },
  { z: "chevilles", nom: "Chevilles", but: "Gagner de la flexion de cheville et renforcer les mollets.", ex: [
    { id: "cchev", s: 1, r: 10, p: "15 s" }, { id: "molP", s: 2, r: 15, p: "45 s" }, { id: "mol1", s: 2, r: 10, p: "45 s" },
    { id: "molmur", s: 2, r: 30, p: "15 s" }, { id: "sole", s: 2, r: 30, p: "15 s" }] },
  { z: "poignets", nom: "Poignets et coudes", but: "Assouplir les avant-bras et renforcer les tendons du coude en douceur.", ex: [
    { id: "cpoi", s: 1, r: 10, p: "15 s" }, { id: "avbet", s: 2, r: 30, p: "15 s" }, { id: "poiinv", s: 3, r: 15, p: "45 s" }] },
  { z: "nuque", nom: "Nuque et haut du dos", but: "Contre les journées d'écran : redresser la tête et ouvrir le haut du dos.", ex: [
    { id: "mentp", s: 2, r: 20, p: "15 s" }, { id: "nuqinc", s: 2, r: 20, p: "15 s" }, { id: "rotbu", s: 2, r: 10, p: "15 s" },
    { id: "hdos", s: 1, r: 30, p: "15 s" }] },
];

/** Zone de soin de chaque gêne du questionnaire (index de BLESN : épaules, bas du dos, genoux, coudes ou poignets). */
export const SOIN_DE_BLESSURE: ZoneSoin[] = ["epaules", "dos", "genoux", "poignets"];

/** Exercice de la bibliothèque Soin & mobilité (rangé par zone, ou de motif « soin »). */
export const estSoin = (id: string) => !!EX[id]?.soin || EX[id]?.pat === "soin";

/** Zones de soin montrées quand on touche une zone du schéma du corps (clés de ZONES). */
export const SOIN_DE_ZONE: Record<string, ZoneSoin[]> = {
  epaules: ["epaules", "nuque"],
  pectoraux: ["epaules"],
  dos: ["dos", "nuque"],
  bras: ["poignets"],
  tronc: ["dos"],
  fessiers: ["hanches"],
  jambes: ["hanches", "genoux", "chevilles"],
};

export const AVERTISSEMENT_SOIN = "Ne remplace pas l'avis d'un kiné. Une douleur vive ou qui augmente : on arrête.";

export const routineDe = (z: ZoneSoin) => ROUTINES_SOIN.find((r) => r.z === z)!;

/* En anglais, noms traduits au chargement (la langue ne change qu'en rechargeant l'app). */
if (langue() === "en") {
  ZONES_SOIN.forEach((z) => (z[1] = tr(z[1])));
  ROUTINES_SOIN.forEach((r) => { r.nom = tr(r.nom); r.but = tr(r.but); });
}
