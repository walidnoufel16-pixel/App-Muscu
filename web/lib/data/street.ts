/* Street workout : poids du corps et barre de traction. Les exercices sont dans EX ;
   ici, leurs familles (dans l'ordre de progression), les programmes par niveau et le test
   d'entrée qui conseille un niveau. */
import { langue, tr } from "@/lib/i18n";
import type { ExLibre } from "@/lib/logic/types";

/* Familles, de la variante la plus accessible à la plus dure : la « prochaine étape »
   d'un exercice est le suivant de sa famille. */
export const FAMILLES_STREET: { k: string; n: string; ex: string[] }[] = [
  { k: "tirage", n: "Tirage à la barre", ex: ["ra", "scappu", "trneg", "eltr", "trs", "tr", "trmix", "trarch", "trlest", "tr1"] },
  { k: "poussee", n: "Pompes", ex: ["pompi", "pompis", "pomp", "pompl", "pompt", "pomph", "pompe", "pompeg", "pompgl", "pompp", "pomp1"] },
  { k: "dips", n: "Dips", ex: ["bdips", "dip", "dipt", "dipan"] },
  { k: "jambes", n: "Jambes", ex: ["sqpc", "fepc", "splsq", "stepg", "pont1", "pistol", "nord", "mol1"] },
  { k: "explosivite", n: "Explosivité", ex: ["jsq", "fsaut", "ktj", "bondl", "grenou", "sautl"] },
  { k: "gainage", n: "Abdos et gainage", ex: ["gai", "plat", "dbug", "mclimb", "spider", "ciseaux", "legpi", "rgen", "crsusp", "rj", "hpike"] },
  { k: "figures", n: "Figures", ex: ["mup", "pv3", "pomp1", "tr1"] },
];

/** La variante avant et après un exercice dans sa famille (ex. pompes inclinées → pompes). */
export function etapesDe(id: string): { avant?: string; apres?: string } | null {
  const f = FAMILLES_STREET.find((x) => x.k !== "figures" && x.ex.includes(id));
  if (!f) return null;
  const i = f.ex.indexOf(id);
  return { avant: f.ex[i - 1], apres: f.ex[i + 1] };
}

export type Niveau = "debutant" | "intermediaire" | "avance";
export type ProgrammeStreet = {
  niv: Niveau; nom: string; but: string;
  pour: string; // à qui il s'adresse (résultat du test)
  objectif: string; // ce qu'on vise en fin de cycle
  fourchette: string; // répétitions visées : la règle de progression
  seances: { k: string; nom: string; ex: ExLibre[] }[];
};

const e = (id: string, s: number, r: number, p = "90 s"): ExLibre => ({ id, s, r, p });
/* échauffement de chaque séance : poignets, puis omoplates pour les séances de tirage */
const poignets = e("cpoi", 1, 10, "15 s"), omoplates = e("scappu", 2, 8, "45 s");

/* Fondations : corps entier, 3 fois par semaine. Force et Figures : 4 séances, haut et bas du corps. */
export const PROGRAMMES_STREET: ProgrammeStreet[] = [
  {
    niv: "debutant", nom: "Fondations", but: "Construire la base pour ta première traction, tes premiers dips et des pompes propres.",
    pour: "0 à 4 tractions", objectif: "1re traction, 10 pompes, 5 dips", fourchette: "6 à 12 répétitions",
    seances: [
      { k: "A", nom: "Corps entier · tirage", ex: [poignets, omoplates, e("trneg", 3, 4, "2 min"), e("pompi", 3, 10), e("sqpc", 3, 15), e("gai", 3, 30, "60 s")] },
      { k: "B", nom: "Corps entier · poussée", ex: [poignets, e("ra", 3, 8), e("bdips", 3, 8), e("fepc", 3, 10), e("plat", 3, 20, "60 s"), e("dbug", 3, 10, "60 s")] },
      { k: "C", nom: "Corps entier · équilibre", ex: [poignets, omoplates, e("trneg", 3, 5, "2 min"), e("pomp", 3, 6), e("splsq", 3, 8), e("pont1", 3, 10), e("legpi", 3, 10, "60 s")] },
    ],
  },
  {
    niv: "intermediaire", nom: "Force", but: "Des tractions et des dips en séries, ton premier pistol squat, des jambes explosives.",
    pour: "5 à 12 tractions", objectif: "12 tractions, 20 dips, pistol squat", fourchette: "5 à 8 répétitions, lest dès 3 × 8",
    seances: [
      { k: "A", nom: "Haut · tirage", ex: [poignets, omoplates, e("tr", 4, 6, "2 min"), e("trarch", 3, 4, "2 min"), e("ra", 3, 10), e("crsusp", 3, 8, "60 s")] },
      { k: "B", nom: "Bas · force", ex: [e("pistol", 3, 4, "2 min"), e("fsaut", 3, 8), e("nord", 3, 4, "2 min"), e("mol1", 3, 12, "60 s")] },
      { k: "C", nom: "Haut · poussée", ex: [poignets, e("dip", 4, 8, "2 min"), e("pompt", 3, 10), e("pompe", 3, 10), e("rj", 3, 8, "60 s")] },
      { k: "D", nom: "Bas · explosivité et gainage", ex: [e("stepg", 3, 10), e("bondl", 3, 8), e("pont1", 3, 12), e("spider", 3, 30, "60 s"), e("gai", 3, 45, "60 s")] },
    ],
  },
  {
    niv: "avance", nom: "Figures", but: "Le muscle-up, les pompes en appui vertical, la traction à un bras et des jambes puissantes.",
    pour: "12 tractions et 15 dips", objectif: "Muscle-up propre, 5 pompes en appui vertical", fourchette: "3 à 6 répétitions sur les figures",
    seances: [
      { k: "A", nom: "Muscle-up et tirage", ex: [poignets, omoplates, e("mup", 5, 3, "2 min"), e("trlest", 4, 5, "2 min"), e("trarch", 3, 6, "2 min"), e("hpike", 3, 8, "60 s")] },
      { k: "B", nom: "Appui vertical et poussée", ex: [poignets, e("pv3", 4, 5, "2 min"), e("dip", 4, 8, "2 min"), e("pompp", 3, 8), e("pompeg", 3, 6)] },
      { k: "C", nom: "Jambes puissantes", ex: [e("pistol", 4, 5, "2 min"), e("sautl", 4, 4, "2 min"), e("grenou", 3, 6), e("nord", 4, 6, "2 min"), e("mol1", 3, 15, "60 s")] },
      { k: "D", nom: "Un bras et gainage", ex: [poignets, omoplates, e("tr1", 3, 2, "2 min"), e("trmix", 3, 6, "2 min"), e("pomp1", 3, 3, "2 min"), e("rj", 3, 10, "60 s"), e("ciseaux", 3, 30, "60 s")] },
    ],
  },
];

/* Test d'entrée : quatre maxima, une fois. */
export type TestStreet = { d: string; tr: number; po: number; di: number; sq: number };

/** Le niveau conseillé par un test (tractions et dips décident ; les pompes et squats affinent l'avis). */
export function niveauConseille(t: Omit<TestStreet, "d">): Niveau {
  if (t.tr >= 12 && t.di >= 15) return "avance";
  if (t.tr >= 5 && t.di >= 8) return "intermediaire";
  return "debutant";
}

/** Le test est à refaire toutes les 6 semaines. */
export const testARefaire = (t: TestStreet | undefined, auj: string) =>
  !t || (Date.parse(auj) - Date.parse(t.d)) / 864e5 >= 42;

/* Matériel du street workout pour « Créer une séance pour moi ». */
export const MATERIEL_STREET = ["m3", "bt"];

if (langue() === "en") {
  FAMILLES_STREET.forEach((f) => (f.n = tr(f.n)));
  PROGRAMMES_STREET.forEach((p) => {
    p.nom = tr(p.nom); p.but = tr(p.but); p.pour = tr(p.pour); p.objectif = tr(p.objectif); p.fourchette = tr(p.fourchette);
    p.seances.forEach((s) => (s.nom = tr(s.nom)));
  });
}
