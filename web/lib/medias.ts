/* Toutes les images de l'app passent par ici, avec leur crédit.
   Le jour où un pack sous licence remplace les démonstrations, il suffit
   d'ajouter sa source ci-dessous et de l'associer aux exercices concernés :
   les écrans n'ont pas à changer. */
import { tr } from "@/lib/i18n";
import { EX } from "@/lib/data/exercices";
import { POSTES } from "@/lib/data/salle";

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

/* Photos Unsplash des machines sans exercice illustré (Ma salle). Règles d'Unsplash :
   l'image s'affiche depuis leurs serveurs (jamais copiée dans public/) et son
   photographe est cité dans Crédits, avec un lien vers son profil. */
const UTM = "?utm_source=repere&utm_medium=referral";
const PHOTOS_POSTES: Record<string, { img: string; auteur: string; profil: string }> = {
  bancreg: { img: "photo-1735647134600-fd2b75fba36d", auteur: "LIFE FIT", profil: "lifefitinda1" },
  functr: { img: "photo-1591940806652-c400764a8da8", auteur: "Andrew Valdivia", profil: "donovan_valdivia" },
  ghd: { img: "photo-1591940808747-05d59b31a299", auteur: "Andrew Valdivia", profil: "donovan_valdivia" },
  chaise: { img: "photo-1434656742621-5c4a7d73d0e7", auteur: "Scott Webb", profil: "scottwebb" },
  airbike: { img: "photo-1685633224623-7551691bb604", auteur: "Ambitious Studio* | Rick Barrett", profil: "weareambitious" },
  velosa: { img: "photo-1637714102098-6514a99eefd3", auteur: "Intenza Fitness", profil: "intenzafitness" },
  traineau: { img: "photo-1751456357786-68c278e9063c", auteur: "TSquared Lab", profil: "tsquaredlab" },
};

/* Photos sous licence libre (Creative Commons), copiées dans public/img, recadrées au carré. */
const PHOTOS_LIBRES: Record<string, { auteur: string; licence: string; lien: string }> = {
  mollass: { auteur: "DakilAuctioneers", licence: "CC BY 2.0", lien: "https://www.flickr.com/photos/29694550@N06/19507914228" },
  devinc: { auteur: "Aliva Sahoo", licence: "CC BY-SA 4.0", lien: "https://commons.wikimedia.org/w/index.php?curid=179972402" },
  latm: { auteur: "Aliva Sahoo", licence: "CC BY-SA 4.0", lien: "https://commons.wikimedia.org/w/index.php?curid=179972398" },
};

/** Photo d'un poste de « Ma salle » : celle de son exercice, sinon une photo libre ou Unsplash, sinon rien (icône). */
export const imgPoste = (p: { id: string; img?: string }) => {
  if (p.img) return imgEx(p.img);
  if (PHOTOS_LIBRES[p.id]) return `/img/poste-${p.id}.avif`;
  const ph = PHOTOS_POSTES[p.id];
  return ph && `https://images.unsplash.com/${ph.img}?w=360&h=360&fit=crop&auto=format&q=70`;
};

/* Tout ce que l'app emprunte, pour la page Compte › Crédits. */
export const CREDITS: { quoi: string; nom: string; licence: string; lien: string }[] = [
  ...Object.values(SOURCES).map((s) => ({ quoi: tr("Photos des exercices"), nom: s.nom, licence: s.licence, lien: s.lien })),
  ...POSTES.filter((p) => PHOTOS_POSTES[p.id]).map((p) => {
    const ph = PHOTOS_POSTES[p.id];
    return { quoi: tr("Photo · {n}", { n: p.n }), nom: tr("{n} sur Unsplash", { n: ph.auteur }), licence: tr("Licence Unsplash"), lien: `https://unsplash.com/@${ph.profil}${UTM}` };
  }),
  ...POSTES.filter((p) => PHOTOS_LIBRES[p.id]).map((p) => {
    const ph = PHOTOS_LIBRES[p.id];
    return { quoi: tr("Photo recadrée · {n}", { n: p.n }), nom: ph.auteur, licence: ph.licence, lien: ph.lien };
  }),
  { quoi: tr("Schéma du corps"), nom: tr("react-native-body-highlighter, Hicham Elabbassi"), licence: "MIT", lien: "https://github.com/HichamELBSI/react-native-body-highlighter" },
  { quoi: tr("Icônes"), nom: tr("Phosphor Icons"), licence: "MIT", lien: "https://phosphoricons.com" },
  { quoi: tr("Polices"), nom: tr("Geist (Vercel) · Barlow Condensed (Jeremy Tribby)"), licence: tr("SIL Open Font License"), lien: "https://vercel.com/font" },
];
