/* Cardio guidé : formats, réglages par niveau, suite des phases et position
   dans la séance à un instant donné. Logique pure, sans interface. */

import { tr } from "@/lib/i18n";
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
  libre?: string; // phase sans fin fixe (Hyrox : un km, un atelier) : elle dure jusqu'au bouton qui porte ce texte ; `duree` est l'objectif
};

export const FORMATS: Record<FormatCardio, { nom: string; court: string; texte: string }> = {
  fractionne: { nom: tr("Fractionné"), court: tr("Effort et récupération alternés"), texte: tr("Des efforts soutenus entrecoupés de récupérations actives. Le meilleur rapport temps passé / condition physique gagnée.") },
  tabata: { nom: tr("Tabata"), court: tr("20 s à fond, 10 s de pause"), texte: tr("Des blocs de huit tours de 20 secondes à fond et 10 secondes de pause. Court et très intense.") },
  emom: { nom: "EMOM", court: tr("Chaque minute, un défi"), texte: tr("Au début de chaque minute, tu fais le nombre de répétitions demandé ; le temps qui reste te sert de récupération.") },
  endurance: { nom: tr("Endurance douce"), court: tr("En continu, sans s'essouffler"), texte: tr("Une allure régulière où tu peux encore parler en phrases. Elle construit le fond et aide à récupérer de la musculation.") },
  norvegien: { nom: tr("4×4 norvégien"), court: tr("4 min forts, 3 min de récupération"), texte: tr("Quatre minutes à un effort élevé mais tenable, trois minutes de récupération active. Le format de référence pour faire progresser le cœur et le souffle.") },
  trente: { nom: "30/30", court: tr("30 s d'effort, 30 s de repos"), texte: tr("Des efforts courts et rapides, autant de récupération. Facile à tenir, et beaucoup de temps passé à haute intensité au total.") },
  pyramide: { nom: tr("Pyramide"), court: tr("On monte, puis on redescend"), texte: tr("Des efforts de plus en plus longs jusqu'au sommet, puis de plus en plus courts. Chaque palier change le rythme : la séance passe vite.") },
  cote: { nom: tr("Sprints en côte"), court: tr("Courts, très intenses, en montée"), texte: tr("Des sprints brefs sur une pente ou une forte résistance : beaucoup de puissance, peu de choc pour les articulations. Récupération complète en marchant.") },
  paliers: { nom: tr("Endurance à paliers"), court: tr("En continu, de plus en plus vite"), texte: tr("Trois paliers d'allure qui montent doucement, sans jamais aller jusqu'à l'essoufflement. Plus vivant qu'une endurance à allure fixe.") },
};
/* L'ordre fixe les codes de partage : les nouveaux formats se rangent toujours à la fin. */
export const ORDRE_FORMATS: FormatCardio[] = ["fractionne", "tabata", "emom", "endurance", "norvegien", "trente", "pyramide", "cote", "paliers"];
/* Présentation dans l'assistant : deux familles. */
export const FAMILLES: { nom: string; formats: FormatCardio[] }[] = [
  { nom: tr("Intervalles"), formats: ["fractionne", "trente", "tabata", "norvegien", "pyramide", "cote", "emom"] },
  { nom: tr("Continu"), formats: ["endurance", "paliers"] },
];

export const MACHINES: Record<Machine, { nom: string; ex?: string; effort: string; recup: string; continu: string; cote?: string }> = {
  tapis: { nom: tr("Tapis de course"), ex: "tapis", effort: tr("Course soutenue, ou marche rapide inclinée à 8-10 %."), recup: tr("Marche tranquille, inclinaison à 0."), continu: tr("Footing léger ou marche inclinée à 5-8 %."), cote: tr("Inclinaison 10-12 %, vitesse rapide : cours, ne marche pas.") },
  velo: { nom: tr("Vélo"), ex: "velo", effort: tr("Résistance élevée, au-dessus de 90 tours par minute."), recup: tr("Résistance basse, on tourne les jambes."), continu: tr("Résistance moyenne, 80 à 90 tours par minute."), cote: tr("Résistance très élevée, en danseuse, le plus vite possible.") },
  ram: { nom: tr("Rameur"), ex: "ram", effort: tr("Cadence 28 à 32, la poussée vient des jambes."), recup: tr("Cadence 18 à 20, mouvement ample et lent."), continu: tr("Cadence 22 à 24, régulière.") },
  ellip: { nom: tr("Elliptique"), ex: "ellip", effort: tr("Résistance haute, grandes foulées, les bras poussent."), recup: tr("Résistance basse, foulées souples."), continu: tr("Résistance moyenne, rythme constant.") },
  stair: { nom: tr("Stairmaster"), ex: "stair", effort: tr("Rythme rapide, sans s'appuyer sur les rampes."), recup: tr("Rythme lent, ou descends et marche."), continu: tr("Rythme modéré, buste droit."), cote: tr("Rythme maximal, une marche à la fois, sans les rampes.") },
  corde: { nom: tr("Corde à sauter"), ex: "corde", effort: tr("Sauts rapides, petits rebonds sur l'avant du pied."), recup: tr("Marche sur place, épaules relâchées."), continu: tr("Sauts souples par séries d'une minute, marche entre deux.") },
  pdc: { nom: tr("Sans matériel"), ex: "mclimb", effort: tr("Enchaîne l'exercice affiché sans t'arrêter."), recup: tr("Marche sur place, respire."), continu: tr("Marche rapide ou montées de genoux souples.") },
};
export const ORDRE_MACHINES: Machine[] = ["tapis", "velo", "ram", "ellip", "stair", "corde", "pdc"];

/* Exercices sans matériel, en rotation d'un effort à l'autre. */
const PDC = [tr("Burpees"), tr("Mountain climbers"), tr("Squats sautés"), tr("Jumping jacks"), tr("Montées de genoux"), tr("Fentes sautées")];
/* EMOM : ce qu'on fait chaque minute, selon le matériel. */
const EMOM_EX: Partial<Record<Machine, string>> = { corde: tr("sauts à la corde"), pdc: "" };

export const NIVEAUX = [tr("Débutant"), tr("Intermédiaire"), tr("Avancé")] as const;

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

/* Le réglage qui fait varier la durée d'un format : [clé, pas, min, max]. */
const LEVIER: Record<FormatCardio, [keyof Reglages, number, number, number]> = {
  fractionne: ["tours", 1, 2, 20], tabata: ["blocs", 1, 1, 6], emom: ["tours", 1, 4, 30], endurance: ["duree", 5, 10, 90],
  norvegien: ["tours", 1, 2, 6], trente: ["tours", 1, 4, 20], pyramide: ["tours", 1, 2, 6], cote: ["tours", 1, 3, 15], paliers: ["duree", 3, 12, 90],
};

/** Réglages d'un format au niveau donné, ajustés pour durer au plus près de `minutes` (mise en route comprise). */
export function reglagesPour(f: FormatCardio, n: Niveau, minutes: number, depart?: Reglages): Reglages {
  const r = { ...(depart ?? reglagesDe(f, n)) }, [k, pas, min, max] = LEVIER[f];
  let meilleur = r[k], ecart = Infinity;
  for (let v = min; v <= max; v += pas) {
    const d = Math.abs(dureeTotale(construireSeance(f, "velo", { ...r, [k]: v })) - minutes * 60);
    if (d < ecart) { ecart = d; meilleur = v; }
  }
  r[k] = meilleur;
  return r;
}

/** La séance en une phrase : « 6 × 1 min fort, 1 min 30 tranquille ». */
export function resumeCardio(f: FormatCardio, r: Reglages) {
  const d = (s: number) => (s < 60 ? `${s} s` : s % 60 ? `${Math.floor(s / 60)} min ${String(s % 60).padStart(2, "0")}` : `${s / 60} min`);
  if (f === "fractionne" || f === "norvegien") return tr("{n} × {e} fort, {r} tranquille", { n: r.tours, e: d(r.effort), r: d(r.recup) });
  if (f === "tabata") return tr("{n} blocs de 8 × 20 s à fond", { n: r.blocs });
  if (f === "emom") return tr("{n} minutes, {reps} répétitions au début de chacune", { n: r.tours, reps: r.reps });
  if (f === "trente") return tr("{b} × {n} fois 30 s d'effort, 30 s de repos", { b: r.blocs, n: r.tours });
  if (f === "pyramide") return tr("{n} marches de {e} jusqu'au sommet, puis on redescend", { n: r.tours, e: d(r.effort) });
  if (f === "cote") return tr("{n} sprints de {e}, récupération en marchant", { n: r.tours, e: d(r.effort) });
  if (f === "paliers") return tr("{n} paliers de plus en plus rapides sur {d} min", { n: r.tours, d: r.duree });
  return tr("{d} min en continu, sans t'essouffler", { d: r.duree });
}

/** Suite complète des phases d'une séance. */
export function construireSeance(f: FormatCardio, m: Machine, r: Reglages): Phase[] {
  const P: Phase[] = [];
  const M = MACHINES[m];
  if (r.echauf > 0) P.push({ type: "echauf", duree: r.echauf, rpe: tr("RPE 3-4"), consigne: tr("Monte doucement en rythme.") });
  if (f === "fractionne") {
    for (let t = 1; t <= r.tours; t++) {
      P.push({ type: "effort", duree: r.effort, rpe: tr("RPE 8"), tour: t, tours: r.tours, consigne: m === "pdc" ? PDC[(t - 1) % PDC.length] : M.effort });
      if (t < r.tours) P.push({ type: "recup", duree: r.recup, rpe: tr("RPE 3"), tour: t, tours: r.tours, consigne: M.recup });
    }
  } else if (f === "tabata") {
    for (let b = 1; b <= r.blocs; b++) {
      for (let t = 1; t <= r.tours; t++) {
        P.push({ type: "effort", duree: r.effort, rpe: tr("RPE 9"), tour: t, tours: r.tours, bloc: b, blocs: r.blocs, consigne: m === "pdc" ? PDC[(b - 1) % PDC.length] : M.effort });
        if (t < r.tours) P.push({ type: "recup", duree: r.recup, rpe: tr("Souffle"), tour: t, tours: r.tours, bloc: b, blocs: r.blocs });
      }
      if (b < r.blocs) P.push({ type: "pause", duree: r.pauseBlocs, rpe: tr("RPE 2"), bloc: b, blocs: r.blocs, consigne: tr("Marche, bois une gorgée.") });
    }
  } else if (f === "emom") {
    for (let t = 1; t <= r.tours; t++) {
      const ex = m === "pdc" ? PDC[(t - 1) % PDC.length] : EMOM_EX[m] ?? tr("répétitions");
      P.push({ type: "effort", duree: 60, rpe: tr("RPE 7-8"), tour: t, tours: r.tours, consigne: tr("{a} {a1}, puis récupère jusqu'à la minute suivante", { a: r.reps * (m === "corde" ? 5 : 1), a1: ex.toLowerCase() }) });
    }
  } else if (f === "norvegien" || f === "cote") {
    for (let t = 1; t <= r.tours; t++) {
      P.push({ type: "effort", duree: r.effort, rpe: f === "cote" ? tr("RPE 9-10") : tr("RPE 8-9"), tour: t, tours: r.tours, consigne: f === "cote" ? M.cote ?? M.effort : tr("{effort} Un effort que tu tiens les 4 minutes.", { effort: M.effort }) });
      if (t < r.tours) P.push({ type: "recup", duree: r.recup, rpe: tr("RPE 3"), tour: t, tours: r.tours, consigne: f === "cote" ? tr("Marche, laisse le souffle revenir complètement.") : M.recup });
    }
  } else if (f === "trente") {
    for (let b = 1; b <= r.blocs; b++) {
      for (let t = 1; t <= r.tours; t++) {
        P.push({ type: "effort", duree: r.effort, rpe: tr("RPE 8"), tour: t, tours: r.tours, bloc: b, blocs: r.blocs, consigne: m === "pdc" ? PDC[(t - 1) % PDC.length] : M.effort });
        if (t < r.tours) P.push({ type: "recup", duree: r.recup, rpe: tr("RPE 3"), tour: t, tours: r.tours, bloc: b, blocs: r.blocs, consigne: M.recup });
      }
      if (b < r.blocs) P.push({ type: "pause", duree: r.pauseBlocs, rpe: tr("RPE 2"), bloc: b, blocs: r.blocs, consigne: tr("Marche, bois une gorgée.") });
    }
  } else if (f === "pyramide") {
    const marches = [...Array.from({ length: r.tours }, (_, k) => k + 1), ...Array.from({ length: r.tours - 1 }, (_, k) => r.tours - 1 - k)];
    marches.forEach((k, j) => {
      const sommet = k === r.tours;
      P.push({ type: "effort", titre: sommet ? tr("Sommet") : j < r.tours ? tr("Montée") : tr("Descente"), duree: k * r.effort, rpe: sommet ? tr("RPE 8") : tr("RPE 7-8"), tour: j + 1, tours: marches.length, consigne: m === "pdc" ? PDC[j % PDC.length] : M.effort });
      if (j < marches.length - 1) P.push({ type: "recup", duree: r.recup, rpe: tr("RPE 3"), tour: j + 1, tours: marches.length, consigne: M.recup });
    });
  } else if (f === "paliers") {
    const n = Math.max(2, r.tours), d = Math.round((r.duree * 60) / n);
    for (let k = 1; k <= n; k++)
      P.push({ type: "continu", titre: tr("Palier {k} sur {n}", { k, n }), duree: d, rpe: `RPE ${Math.min(6, 2 + k)}`, tour: k, tours: n, consigne: k === 1 ? tr("{continu} Allure facile pour commencer.", { continu: M.continu }) : tr("Un cran plus vite qu'au palier précédent, sans t'essouffler.") });
  } else {
    P.push({ type: "continu", duree: r.duree * 60, rpe: tr("RPE 4"), consigne: tr("{continu} Tu dois pouvoir parler en phrases.", { continu: M.continu }) });
  }
  if (r.calme > 0) P.push({ type: "calme", duree: r.calme, rpe: tr("RPE 2"), consigne: tr("Ralentis progressivement, laisse redescendre le souffle.") });
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
