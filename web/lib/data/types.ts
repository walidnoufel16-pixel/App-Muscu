/* Types des données de la bibliothèque, identiques à l'ancienne app. */

/** Type de charge : kg, lest (poids du corps + lest), aucune, temps (s), dist (m). */
export type Charge = "kg" | "lest" | "aucune" | "temps" | "dist";

export type Exercice = {
  n: string; // nom
  m: string; // muscles, texte libre
  img: string; // préfixe des photos img/<img>_0.jpg et _1.jpg
  pat: string; // schéma moteur principal
  pat2?: string; // schéma secondaire
  eq: number; // 0 machine/poulie · 1 barre · 2 haltères · 3 poids du corps
  ch: Charge;
  d: number; // charge de départ suggérée
  cap?: number; // RPE plafond
  capDeb?: number; // RPE plafond pour un débutant
  acc?: string; // matériel en plus exigé (kb, el)
  ou?: string; // matériel en plus qui suffit aussi
  e: string; // exécution
  err: string[]; // erreurs fréquentes
  p: string; // comment progresser
};

/** Ligne d'exercice d'une séance du plan : [id, séries, répétitions, repos, principal (1) ou accessoire (0)]. */
export type LignePlan = [string, number, number, string, number];

export type Seance = {
  t: string;
  f: string;
  dur?: string;
  sp?: [number, string];
  sport?: number;
  b?: number; // séance bonus
  x: LignePlan[];
};

/** Étape d'échauffement : [nom, durée, exercice illustré ou null, texte]. */
export type Etape = [string, string, string | null, string];

export type Collation = { t: string; i: string; l: [string, string][]; n: string };

export type Sport = {
  n: string;
  d?: string;
  cardio?: number;
  jambes?: number;
  epaules?: number;
  tirage?: number;
  muscu?: number;
  leger?: number;
};

export type MuscleAss = { k: string; n: string; pats: string[]; g: number };
