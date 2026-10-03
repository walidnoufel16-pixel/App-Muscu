/* Cardio guidé : formats, réglages par niveau, suite des phases et position
   dans la séance à un instant donné. Logique pure, sans interface. */

export type FormatCardio = "fractionne" | "tabata" | "emom" | "endurance" | "norvegien" | "trente" | "pyramide" | "cote" | "paliers";
export type Machine = "tapis" | "velo" | "ram" | "ellip" | "stair" | "corde" | "pdc";
export type Niveau = 0 | 1 | 2;

/** Durées en secondes, sauf `duree` (endurance) en minutes. */
export type Reglages = {
  effort: number; recup: number; tours: number; // fractionné, tabata
  blocs: number; pauseBlocs: number; // tabata
  reps: number; // emom : répétitions par minute
  duree: number; // endurance, en minutes
  echauf: number; calme: number;
};

export type TypePhase = "echauf" | "effort" | "recup" | "pause" | "continu" | "calme";
export type Phase = {
  type: TypePhase;
  titre?: string; // nom affiché à la place du type (« Palier 2 sur 3 », « Sommet »)
  duree: number; // secondes
  rpe: string;
  tour?: number; tours?: number; bloc?: number; blocs?: number;
  consigne?: string; // exercice ou rappel affiché sous le chrono
};

export const FORMATS: Record<FormatCardio, { nom: string; court: string; texte: string }> = {
  fractionne: { nom: "Fractionné", court: "Effort et récupération alternés", texte: "Des efforts soutenus entrecoupés de récupérations actives. Le meilleur rapport temps passé / condition physique gagnée." },
  tabata: { nom: "Tabata", court: "20 s à fond, 10 s de pause", texte: "Des blocs de huit tours de 20 secondes à fond et 10 secondes de pause. Court et très intense." },
  emom: { nom: "EMOM", court: "Chaque minute, un défi", texte: "Au début de chaque minute, tu fais le nombre de répétitions demandé ; le temps qui reste te sert de récupération." },
  endurance: { nom: "Endurance douce", court: "En continu, sans s'essouffler", texte: "Une allure régulière où tu peux encore parler en phrases. Elle construit le fond et aide à récupérer de la musculation." },
  norvegien: { nom: "4×4 norvégien", court: "4 min forts, 3 min de récupération", texte: "Quatre minutes à un effort élevé mais tenable, trois minutes de récupération active. Le format de référence pour faire progresser le cœur et le souffle." },
  trente: { nom: "30/30", court: "30 s d'effort, 30 s de repos", texte: "Des efforts courts et rapides, autant de récupération. Facile à tenir, et beaucoup de temps passé à haute intensité au total." },
  pyramide: { nom: "Pyramide", court: "On monte, puis on redescend", texte: "Des efforts de plus en plus longs jusqu'au sommet, puis de plus en plus courts. Chaque palier change le rythme : la séance passe vite." },
  cote: { nom: "Sprints en côte", court: "Courts, très intenses, en montée", texte: "Des sprints brefs sur une pente ou une forte résistance : beaucoup de puissance, peu de choc pour les articulations. Récupération complète en marchant." },
  paliers: { nom: "Endurance à paliers", court: "En continu, de plus en plus vite", texte: "Trois paliers d'allure qui montent doucement, sans jamais aller jusqu'à l'essoufflement. Plus vivant qu'une endurance à allure fixe." },
};
/* L'ordre fixe les codes de partage : les nouveaux formats se rangent toujours à la fin. */
export const ORDRE_FORMATS: FormatCardio[] = ["fractionne", "tabata", "emom", "endurance", "norvegien", "trente", "pyramide", "cote", "paliers"];
/* Présentation dans l'assistant : deux familles. */
export const FAMILLES: { nom: string; formats: FormatCardio[] }[] = [
  { nom: "Intervalles", formats: ["fractionne", "trente", "tabata", "norvegien", "pyramide", "cote", "emom"] },
  { nom: "Continu", formats: ["endurance", "paliers"] },
];

export const MACHINES: Record<Machine, { nom: string; ex?: string; effort: string; recup: string; continu: string; cote?: string }> = {
  tapis: { nom: "Tapis de course", ex: "tapis", effort: "Course soutenue, ou marche rapide inclinée à 8-10 %.", recup: "Marche tranquille, inclinaison à 0.", continu: "Footing léger ou marche inclinée à 5-8 %.", cote: "Inclinaison 10-12 %, vitesse rapide : cours, ne marche pas." },
  velo: { nom: "Vélo", ex: "velo", effort: "Résistance élevée, au-dessus de 90 tours par minute.", recup: "Résistance basse, on tourne les jambes.", continu: "Résistance moyenne, 80 à 90 tours par minute.", cote: "Résistance très élevée, en danseuse, le plus vite possible." },
  ram: { nom: "Rameur", ex: "ram", effort: "Cadence 28 à 32, la poussée vient des jambes.", recup: "Cadence 18 à 20, mouvement ample et lent.", continu: "Cadence 22 à 24, régulière." },
  ellip: { nom: "Elliptique", ex: "ellip", effort: "Résistance haute, grandes foulées, les bras poussent.", recup: "Résistance basse, foulées souples.", continu: "Résistance moyenne, rythme constant." },
  stair: { nom: "Stairmaster", ex: "stair", effort: "Rythme rapide, sans s'appuyer sur les rampes.", recup: "Rythme lent, ou descends et marche.", continu: "Rythme modéré, buste droit.", cote: "Rythme maximal, une marche à la fois, sans les rampes." },
  corde: { nom: "Corde à sauter", ex: "corde", effort: "Sauts rapides, petits rebonds sur l'avant du pied.", recup: "Marche sur place, épaules relâchées.", continu: "Sauts souples par séries d'une minute, marche entre deux." },
  pdc: { nom: "Sans matériel", ex: "mclimb", effort: "Enchaîne l'exercice affiché sans t'arrêter.", recup: "Marche sur place, respire.", continu: "Marche rapide ou montées de genoux souples." },
};
export const ORDRE_MACHINES: Machine[] = ["tapis", "velo", "ram", "ellip", "stair", "corde", "pdc"];

/* Exercices sans matériel, en rotation d'un effort à l'autre. */
const PDC = ["Burpees", "Mountain climbers", "Squats sautés", "Jumping jacks", "Montées de genoux", "Fentes sautées"];
/* EMOM : ce qu'on fait chaque minute, selon le matériel. */
const EMOM_EX: Partial<Record<Machine, string>> = { corde: "sauts à la corde", pdc: "" };

export const NIVEAUX = ["Débutant", "Intermédiaire", "Avancé"] as const;

/** Réglages de départ d'un format, selon le niveau. */
export function reglagesDe(f: FormatCardio, n: Niveau): Reglages {
  const base: Reglages = { effort: 60, recup: 90, tours: 8, blocs: 2, pauseBlocs: 60, reps: 10, duree: 30, echauf: 300, calme: 180 };
  if (f === "fractionne") return { ...base, ...[{ effort: 30, recup: 90, tours: 6 }, { effort: 60, recup: 90, tours: 8 }, { effort: 90, recup: 60, tours: 10 }][n] };
  if (f === "tabata") return { ...base, effort: 20, recup: 10, tours: 8, blocs: [2, 3, 4][n] };
  if (f === "emom") return { ...base, tours: [8, 12, 16][n], reps: [8, 10, 12][n] };
  if (f === "norvegien") return { ...base, effort: 240, recup: 180, tours: [2, 3, 4][n], echauf: 600 };
  if (f === "trente") return { ...base, effort: 30, recup: 30, tours: [8, 10, 12][n], blocs: [1, 2, 2][n], pauseBlocs: 120 };
  if (f === "pyramide") return { ...base, effort: 30, tours: [3, 4, 5][n], recup: [60, 60, 45][n] }; // effort : pas ; tours : marches jusqu'au sommet
  if (f === "cote") return { ...base, effort: [20, 25, 30][n], recup: [90, 75, 60][n], tours: [6, 8, 10][n] };
  if (f === "paliers") return { ...base, duree: [24, 30, 36][n], tours: 3 };
  return { ...base, duree: [20, 30, 40][n] };
}

/** Le niveau proposé d'office, d'après la régularité déclarée au questionnaire. */
export const niveauDe = (regularite?: number): Niveau => (regularite == null ? 1 : regularite <= 0 ? 0 : regularite >= 3 ? 2 : 1);

/** Machines possibles pour un format (EMOM : seulement ce qui se compte en répétitions). */
export const machinesDe = (f: FormatCardio): Machine[] =>
  f === "emom" ? ["pdc", "corde"] : f === "cote" ? ["tapis", "velo", "stair"] : ORDRE_MACHINES;

/** Suite complète des phases d'une séance. */
export function construireSeance(f: FormatCardio, m: Machine, r: Reglages): Phase[] {
  const P: Phase[] = [];
  const M = MACHINES[m];
  if (r.echauf > 0) P.push({ type: "echauf", duree: r.echauf, rpe: "RPE 3-4", consigne: "Monte doucement en rythme." });
  if (f === "fractionne") {
    for (let t = 1; t <= r.tours; t++) {
      P.push({ type: "effort", duree: r.effort, rpe: "RPE 8", tour: t, tours: r.tours, consigne: m === "pdc" ? PDC[(t - 1) % PDC.length] : M.effort });
      if (t < r.tours) P.push({ type: "recup", duree: r.recup, rpe: "RPE 3", tour: t, tours: r.tours, consigne: M.recup });
    }
  } else if (f === "tabata") {
    for (let b = 1; b <= r.blocs; b++) {
      for (let t = 1; t <= r.tours; t++) {
        P.push({ type: "effort", duree: r.effort, rpe: "RPE 9", tour: t, tours: r.tours, bloc: b, blocs: r.blocs, consigne: m === "pdc" ? PDC[(b - 1) % PDC.length] : M.effort });
        if (t < r.tours) P.push({ type: "recup", duree: r.recup, rpe: "Souffle", tour: t, tours: r.tours, bloc: b, blocs: r.blocs });
      }
      if (b < r.blocs) P.push({ type: "pause", duree: r.pauseBlocs, rpe: "RPE 2", bloc: b, blocs: r.blocs, consigne: "Marche, bois une gorgée." });
    }
  } else if (f === "emom") {
    for (let t = 1; t <= r.tours; t++) {
      const ex = m === "pdc" ? PDC[(t - 1) % PDC.length] : EMOM_EX[m] ?? "répétitions";
      P.push({ type: "effort", duree: 60, rpe: "RPE 7-8", tour: t, tours: r.tours, consigne: `${r.reps * (m === "corde" ? 5 : 1)} ${ex.toLowerCase()}, puis récupère jusqu'à la minute suivante` });
    }
  } else if (f === "norvegien" || f === "cote") {
    for (let t = 1; t <= r.tours; t++) {
      P.push({ type: "effort", duree: r.effort, rpe: f === "cote" ? "RPE 9-10" : "RPE 8-9", tour: t, tours: r.tours, consigne: f === "cote" ? M.cote ?? M.effort : `${M.effort} Un effort que tu tiens les 4 minutes.` });
      if (t < r.tours) P.push({ type: "recup", duree: r.recup, rpe: "RPE 3", tour: t, tours: r.tours, consigne: f === "cote" ? "Marche, laisse le souffle revenir complètement." : M.recup });
    }
  } else if (f === "trente") {
    for (let b = 1; b <= r.blocs; b++) {
      for (let t = 1; t <= r.tours; t++) {
        P.push({ type: "effort", duree: r.effort, rpe: "RPE 8", tour: t, tours: r.tours, bloc: b, blocs: r.blocs, consigne: m === "pdc" ? PDC[(t - 1) % PDC.length] : M.effort });
        if (t < r.tours) P.push({ type: "recup", duree: r.recup, rpe: "RPE 3", tour: t, tours: r.tours, bloc: b, blocs: r.blocs, consigne: M.recup });
      }
      if (b < r.blocs) P.push({ type: "pause", duree: r.pauseBlocs, rpe: "RPE 2", bloc: b, blocs: r.blocs, consigne: "Marche, bois une gorgée." });
    }
  } else if (f === "pyramide") {
    const marches = [...Array.from({ length: r.tours }, (_, k) => k + 1), ...Array.from({ length: r.tours - 1 }, (_, k) => r.tours - 1 - k)];
    marches.forEach((k, j) => {
      const sommet = k === r.tours;
      P.push({ type: "effort", titre: sommet ? "Sommet" : j < r.tours ? "Montée" : "Descente", duree: k * r.effort, rpe: sommet ? "RPE 8" : "RPE 7-8", tour: j + 1, tours: marches.length, consigne: m === "pdc" ? PDC[j % PDC.length] : M.effort });
      if (j < marches.length - 1) P.push({ type: "recup", duree: r.recup, rpe: "RPE 3", tour: j + 1, tours: marches.length, consigne: M.recup });
    });
  } else if (f === "paliers") {
    const n = Math.max(2, r.tours), d = Math.round((r.duree * 60) / n);
    for (let k = 1; k <= n; k++)
      P.push({ type: "continu", titre: `Palier ${k} sur ${n}`, duree: d, rpe: `RPE ${Math.min(6, 2 + k)}`, tour: k, tours: n, consigne: k === 1 ? `${M.continu} Allure facile pour commencer.` : "Un cran plus vite qu'au palier précédent, sans t'essouffler." });
  } else {
    P.push({ type: "continu", duree: r.duree * 60, rpe: "RPE 4", consigne: `${M.continu} Tu dois pouvoir parler en phrases.` });
  }
  if (r.calme > 0) P.push({ type: "calme", duree: r.calme, rpe: "RPE 2", consigne: "Ralentis progressivement, laisse redescendre le souffle." });
  return P;
}

export const dureeTotale = (P: Phase[]) => P.reduce((s, p) => s + p.duree, 0);

/** Où en est-on, `ecoule` secondes après le départ ? */
export function ou(P: Phase[], ecoule: number) {
  const total = dureeTotale(P);
  let debut = 0;
  for (let i = 0; i < P.length; i++) {
    const fin = debut + P[i].duree;
    if (ecoule < fin) return { i, phase: P[i], reste: fin - ecoule, depuis: ecoule - debut, suivante: P[i + 1] ?? null, debutPhase: debut, progression: ecoule / total, fini: false };
    debut = fin;
  }
  return { i: P.length, phase: null, reste: 0, depuis: 0, suivante: null, debutPhase: total, progression: 1, fini: true };
}

/** Instants (en secondes depuis le départ) de chaque changement de phase. */
export function changements(P: Phase[]) {
  const t: number[] = [];
  let s = 0;
  for (const p of P) { s += p.duree; t.push(s); }
  return t;
}

/** Bilan : minutes réelles, temps à l'effort, tours d'effort terminés. */
export function bilanCardio(P: Phase[], ecoule: number) {
  let s = 0, effort = 0, tours = 0;
  for (const p of P) {
    const fait = Math.max(0, Math.min(p.duree, ecoule - s));
    if (p.type === "effort" || p.type === "continu") { effort += fait; if (fait >= p.duree) tours++; }
    s += p.duree;
  }
  return { minutes: Math.max(1, Math.round(Math.min(ecoule, s) / 60)), effort: Math.round(effort), tours };
}

export const nomSeanceCardio = (f: FormatCardio, m: Machine) => `${FORMATS[f].nom} · ${MACHINES[m].nom}`;

/* ---------- partage : une séance cardio voyage dans le même format qu'une séance de musculation ----------
   La table des séances partagées attend une liste d'objets { id, s, r, p } :
   un premier élément « cardio » porte le format, la machine et le niveau, les suivants les réglages. */
const CODES_F = ORDRE_FORMATS, CODES_M = ORDRE_MACHINES;
const CLES: (keyof Reglages)[] = ["effort", "recup", "tours", "blocs", "pauseBlocs", "reps", "duree", "echauf", "calme"];

export type SeanceCardio = { nom: string; f: FormatCardio; m: Machine; n: Niveau; r: Reglages; code?: string };

export function encoderCardio(s: SeanceCardio) {
  return [
    { id: "cardio", s: CODES_F.indexOf(s.f) + 1, r: CODES_M.indexOf(s.m), p: String(s.n) },
    ...CLES.map((k) => ({ id: k, s: 1, r: Math.max(0, Math.min(1000, Math.round(s.r[k]))) })),
  ];
}

export function decoderCardio(nom: string, ex: unknown): SeanceCardio | null {
  if (!Array.isArray(ex) || ex[0]?.id !== "cardio") return null;
  const f = CODES_F[(+ex[0].s || 0) - 1], m = CODES_M[+ex[0].r];
  const n = Math.min(2, Math.max(0, +ex[0].p || 0)) as Niveau;
  if (!f || !m) return null;
  const r = reglagesDe(f, n);
  for (const e of ex.slice(1)) if (CLES.includes(e?.id) && Number.isFinite(+e.r)) r[e.id as keyof Reglages] = Math.max(0, Math.min(1000, Math.round(+e.r)));
  return { nom, f, m, n, r };
}
