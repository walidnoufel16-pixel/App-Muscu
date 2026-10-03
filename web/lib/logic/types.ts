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

export type ExLibre = { id: string; s: number; r: number; p: string };
export type SeanceLibre = {
  nom: string;
  ex: ExLibre[];
  code?: string;
  obj?: number;
  colObj?: number;
  gen?: { m: string[]; d: number; obj: number };
};

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
  blessure?: number[];
  sexe?: number;
  prio?: number[];
  prefs?: Record<string, number[]>;
  exclus?: string[];
  actuel?: number;
  profil?: Record<string, number>;
  [k: string]: unknown;
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
};

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
