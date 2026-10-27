/* État de l'app : format IDENTIQUE à l'ancienne version (localStorage et
   table Supabase), pour que les données existantes s'ouvrent telles quelles. */

export type Serie = {
  v: number; // charge (kg), répétitions (aucune), secondes (temps) ou mètres (dist)
  reps: number;
  ok?: boolean;
  touche?: boolean; // modifiée à la main : on ne la recopie plus
  lest?: number; // lest facultatif (kg)
  tlest?: boolean; // lest saisi à la main
};

export type Journal = {
  done: boolean;
  v?: number;
  reps?: number;
  nb?: number;
  feel: number | null; // 0 facile · 1 juste · 2 trop dur
  ex: string; // exercice réellement fait
  ts: number;
  why?: string;
  series: Serie[];
  memo?: Serie[];
  plie?: boolean;
  lest?: boolean;
};

export type ExIA = { id: string; series: number; reps: number; repos: string; role: number };
export type SeanceIA = { titre: string; focus?: string; exercices: ExIA[] };
export type PlanIA = {
  plan?: { titre?: string; intro?: string; choix?: { titre: string; texte: string }[] };
  seances?: SeanceIA[];
  bonus?: SeanceIA;
  notes?: { refus?: string[]; volume?: Record<string, number>; cible?: number[]; faibles?: string[] };
  [k: string]: unknown;
};

/* o : position d'origine pendant une modification dans le composeur (jamais enregistrée). */
export type ExLibre = { id: string; s: number; r: number; p: string; o?: number };
export type SeanceLibre = {
  nom: string;
  ex: ExLibre[];
  code?: string;
  obj?: number;
  colObj?: number;
  gen?: { m: string[]; d: number; obj: number };
  /* Blocs cardio d'une séance combinée, placés librement entre les exercices. */
  blocs?: BlocCardio[];
  /* Routine « Soin & mobilité » : zone concernée. */
  soin?: string;
  /* Séance d'un programme street workout : niveau et lettre (« debutant-A »). */
  street?: string;
};

/** Bloc cardio : `apres` = nombre d'exercices de musculation placés avant lui. */
export type BlocCardio = { id: string; apres: number; f: FormatCardio; m: Machine; n: Niveau; r: Reglages };

/* Réponses au questionnaire. */
export type Reponses = {
  objectif?: number;
  regularite?: number;
  socle?: number;
  axe?: number;
  sport?: number[];
  sportFreq?: Record<number, number>;
  materiel?: number;
  acc?: number[];
  /* barre de traction (Profil) ; absente = selon le matériel */
  barre?: boolean;
  /* sangles de suspension (Profil) */
  trx?: boolean;
  /* machines et postes absents de la salle (lib/data/salle.ts) */
  sansPostes?: string[];
  blessure?: number[];
  sexe?: number;
  prio?: number[];
  prefs?: Record<string, number[]>;
  exclus?: string[];
  actuel?: number;
  /** Langue choisie dans Profil (suit le compte sur un autre appareil). */
  langue?: "fr" | "en";
  profil?: Record<string, number>;
  /** Partie Repas : préférences, aliments en stock, réglages (lib/logic/repas.ts). */
  repas?: PrefsRepas;
  /** Partie Repas : semaine de repas planifiée et cases cochées de la liste de courses. */
  semaine?: SemaineRepas;
  [k: string]: unknown;
};

/* Partie Repas. Régime : 0 omnivore · 1 pescétarien · 2 végétarien · 3 vegan.
   Allergies : marques des aliments (l lactose, g gluten, o œuf, c fruits à coque, r arachide, p poisson).
   Temps : 0 ≤ 15 min · 1 ≤ 30 min · 2 sans limite. */
export type PrefsRepas = {
  fait?: boolean;
  regime: number;
  allergies: string[];
  exclus: string[];
  temps: number;
  mat: string[];
  kcal?: boolean;
  stock?: string[];
  pers?: number;
};
export type CreneauRepas = "matin" | "dejeuner" | "diner" | "collation";
export type SemaineRepas = {
  jours: number;
  creneaux: CreneauRepas[];
  graine: number;
  /* recette choisie à la main pour une case « jour|créneau » */
  choix: Record<string, string>;
  coches: string[];
};

export type Etat = {
  A: Reponses;
  LOG: Record<string, Journal>;
  SWAP: Record<string, string>;
  SWAPP: Record<string, string>;
  PLAN: PlanIA | null;
  SEANCES: SeanceLibre[];
  wk: number;
  day: number;
  FINI: boolean;
  /* Cardio : séances enregistrées et historique des séances faites (champs facultatifs, ajoutés après coup). */
  SEANCES_CARDIO?: SeanceCardio[];
  CARDIO?: HistoCardio[];
  /* Historique durable des séances de musculation (lib/logic/historique.ts). */
  HIST?: LigneHist[];
  /* Préparation course à pied (lib/logic/course.ts) : le plan en cours et les sorties notées. */
  COURSE?: PlanCourse | null;
  SORTIES?: Sortie[];
};

export type HistoCardio = { nom: string; f: FormatCardio; m: Machine; min: number; effort: number; ts: number; ref?: string; run?: boolean };

import type { FormatCardio, Machine, Niveau, Reglages, SeanceCardio } from "./cardio";
import type { LigneHist } from "./historique";
import type { PlanCourse, Sortie } from "./course";

/* Séance de la semaine telle qu'affichée (plan IA converti, ou socle par défaut). */
export type SeanceSemaine = {
  t: string;
  f?: string;
  dur?: string;
  sp?: [number, string];
  sport?: number;
  b?: number;
  x?: [string, number, number, string, number][];
  sportOnly?: 1;
};
