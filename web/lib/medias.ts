/* Toutes les images de l'app passent par ici, avec leur crédit.
   Le jour où un pack sous licence remplace les démonstrations, il suffit
   d'ajouter sa source ci-dessous et de l'associer aux exercices concernés :
   les écrans n'ont pas à changer. */
import { tr } from "@/lib/i18n";
import { EX } from "@/lib/data/exercices";

export type Source = { nom: string; licence: string; lien: string; mention: string };

export const SOURCES = {
  fedb: {
    nom: "free-exercise-db",
    licence: tr("Domaine public (Unlicense)"),
    lien: "https://github.com/yuhonas/free-exercise-db",
    mention: tr("Illustrations · free-exercise-db · domaine public · retouche Repère"),
  },
} satisfies Record<string, Source>;

export type CleSource = keyof typeof SOURCES;

/* Source des démonstrations de chaque exercice (toutes free-exercise-db pour l'instant). */
const SOURCE_EX: Partial<Record<string, CleSource>> = {};
export const sourceEx = (id: string): Source => SOURCES[SOURCE_EX[id] ?? "fedb"];

/** Photo de démonstration : 0 = départ, 1 = fin. */
export const imgEx = (id: string, n: 0 | 1 = 0) => `/img/${EX[id]?.img}_${n}.avif`;

/* Tout ce que l'app emprunte, pour la page Compte › Crédits. */
export const CREDITS: { quoi: string; nom: string; licence: string; lien: string }[] = [
  ...Object.values(SOURCES).map((s) => ({ quoi: tr("Photos des exercices"), nom: s.nom, licence: s.licence, lien: s.lien })),
  { quoi: tr("Schéma du corps"), nom: tr("react-native-body-highlighter, Hicham Elabbassi"), licence: "MIT", lien: "https://github.com/HichamELBSI/react-native-body-highlighter" },
  { quoi: tr("Icônes"), nom: tr("Phosphor Icons"), licence: "MIT", lien: "https://phosphoricons.com" },
  { quoi: tr("Polices"), nom: tr("Geist (Vercel) · Barlow Condensed (Jeremy Tribby)"), licence: tr("SIL Open Font License"), lien: "https://vercel.com/font" },
];
