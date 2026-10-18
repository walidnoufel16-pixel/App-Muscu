/* Street workout : poids du corps et barre de traction. Les exercices sont dans EX ;
   ici, leurs familles (dans l'ordre de progression) et les programmes prêts par niveau. */
import { langue, tr } from "@/lib/i18n";
import type { ExLibre } from "@/lib/logic/types";

/* Familles, de la variante la plus accessible à la plus dure. */
export const FAMILLES_STREET: { k: string; n: string; ex: string[] }[] = [
  { k: "tirage", n: "Tirage à la barre", ex: ["scappu", "ra", "eltr", "trneg", "trs", "tr"] },
  { k: "poussee", n: "Poussée", ex: ["pompi", "pomp", "pompl", "pompt", "bdips", "pompe", "dip", "dipt", "pompgl", "pompp"] },
  { k: "jambes", n: "Jambes et explosivité", ex: ["sqpc", "fepc", "splsq", "pont1", "jsq", "ktj", "nord", "mol1"] },
  { k: "gainage", n: "Abdos et gainage", ex: ["gai", "plat", "mclimb", "rgen", "rj", "hpike"] },
  { k: "figures", n: "Figures", ex: ["mup", "pv3", "pomp1", "tr1"] },
];

export type Niveau = "debutant" | "intermediaire" | "avance";
export type ProgrammeStreet = { niv: Niveau; nom: string; but: string; seances: { k: string; nom: string; ex: ExLibre[] }[] };

const e = (id: string, s: number, r: number, p = "90 s"): ExLibre => ({ id, s, r, p });

/* Trois séances par semaine : tirage, poussée, jambes et gainage. */
export const PROGRAMMES_STREET: ProgrammeStreet[] = [
  { niv: "debutant", nom: "Débutant", but: "Construire la base pour ta première traction et tes premiers dips.", seances: [
    { k: "A", nom: "Tirage et abdos", ex: [e("scappu", 3, 8), e("ra", 3, 10), e("trneg", 3, 4, "2 min"), e("gai", 3, 30, "60 s"), e("mclimb", 3, 20, "60 s")] },
    { k: "B", nom: "Poussée", ex: [e("pompi", 3, 10), e("bdips", 3, 10), e("pomp", 3, 8), e("plat", 3, 20, "60 s")] },
    { k: "C", nom: "Jambes et gainage", ex: [e("sqpc", 3, 15), e("fepc", 3, 10), e("pont1", 3, 12), e("mol1", 3, 12, "60 s"), e("gai", 3, 30, "60 s")] },
  ] },
  { niv: "intermediaire", nom: "Intermédiaire", but: "Des tractions et des dips en séries, et des jambes plus explosives.", seances: [
    { k: "A", nom: "Tirage et abdos", ex: [e("tr", 4, 6, "2 min"), e("trs", 3, 8, "2 min"), e("ra", 3, 12), e("rj", 3, 10)] },
    { k: "B", nom: "Poussée", ex: [e("dip", 4, 8, "2 min"), e("pompe", 3, 12), e("pompl", 3, 12), e("pompt", 3, 10), e("plat", 3, 30, "60 s")] },
    { k: "C", nom: "Jambes et gainage", ex: [e("splsq", 3, 10), e("jsq", 3, 10, "2 min"), e("nord", 3, 5, "2 min"), e("mol1", 3, 15, "60 s"), e("gai", 3, 45, "60 s")] },
  ] },
  { niv: "avance", nom: "Avancé", but: "Les figures : muscle-up, pompes en équilibre, traction à un bras.", seances: [
    { k: "A", nom: "Tirage et figures", ex: [e("mup", 5, 3, "2 min"), e("tr", 4, 10, "2 min"), e("tr1", 3, 2, "2 min"), e("hpike", 3, 10)] },
    { k: "B", nom: "Poussée et figures", ex: [e("pv3", 4, 6, "2 min"), e("dipt", 4, 10, "2 min"), e("pompp", 3, 8), e("pomp1", 3, 4, "2 min")] },
    { k: "C", nom: "Jambes et gainage", ex: [e("splsq", 4, 12), e("ktj", 3, 10), e("nord", 4, 6, "2 min"), e("jsq", 3, 12), e("gai", 3, 60, "60 s")] },
  ] },
];

/* Matériel du street workout pour « Créer une séance pour moi ». */
export const MATERIEL_STREET = ["m3", "bt"];

if (langue() === "en") {
  FAMILLES_STREET.forEach((f) => (f.n = tr(f.n)));
  PROGRAMMES_STREET.forEach((p) => { p.nom = tr(p.nom); p.but = tr(p.but); p.seances.forEach((s) => (s.nom = tr(s.nom))); });
}
