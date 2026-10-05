/* Motivation : série de semaines réussies (avec un joker par mois) et badges.
   Tout se calcule depuis l'historique ; seule la date d'obtention des badges
   est enregistrée (A.badges). Logique pure. */
import { EX } from "@/lib/data/exercices";
import { decaler, jourDe, lundiDe, records, type LigneHist } from "./historique";
import type { Etat, HistoCardio, Reponses } from "./types";
import { avecSorties } from "./course";

/** Objectif de séances par semaine : réglé à la main, sinon celui du questionnaire (2, 3 ou 4). */
export const objectifHebdo = (A: Reponses) =>
  typeof A.objHebdo === "number" ? Math.min(6, Math.max(1, A.objHebdo)) : typeof A.socle === "number" ? A.socle + 2 : 2;

/** Séances faites par semaine (lundi → nombre) : musculation, et cardio seul (un bloc d'une séance combinée ne compte pas en plus). */
export function seancesParSemaine(H: LigneHist[], C: HistoCardio[]) {
  const m = new Map<string, number>();
  for (const l of H) m.set(lundiDe(l.d), (m.get(lundiDe(l.d)) || 0) + 1);
  for (const c of C) if (!c.ref) { const k = lundiDe(jourDe(c.ts)); m.set(k, (m.get(k) || 0) + 1); }
  return m;
}

export type Serie = { semaines: number; jokers: string[]; cetteSemaine: number; objectif: number; jokerDispo: boolean; record: number };
/** Série en cours : semaines réussies d'affilée. La semaine en cours compte dès que l'objectif est atteint,
    et ne casse rien tant qu'elle n'est pas finie. Une semaine manquée par mois est rattrapée par le joker. */
export function serie(H: LigneHist[], C: HistoCardio[], objectif: number, auj = jourDe(Date.now())): Serie {
  const m = seancesParSemaine(H, C), courante = lundiDe(auj);
  const debut = [...m.keys()].sort()[0];
  const cetteSemaine = m.get(courante) || 0;
  const reussie = (l: string) => (m.get(l) || 0) >= objectif;
  /* on parcourt toutes les semaines depuis la première, en tenant le compte (pour la meilleure série aussi) */
  let n = 0, best = 0;
  const jokers: string[] = [], moisJoker = new Set<string>();
  if (debut) for (let l = debut; l < courante; l = decaler(l, 7)) {
    if (reussie(l)) n++;
    else if (n > 0 && !moisJoker.has(l.slice(0, 7))) { moisJoker.add(l.slice(0, 7)); jokers.push(l); }
    else { n = 0; jokers.length = 0; }
    best = Math.max(best, n);
  }
  const total = n + (reussie(courante) ? 1 : 0);
  return { semaines: total, jokers, cetteSemaine, objectif, jokerDispo: !moisJoker.has(courante.slice(0, 7)), record: Math.max(best, total) };
}

/* ---------------- badges ---------------- */
export type Stats = {
  seances: number; muscu: number; cardio: number; combinees: number; records: number; tonnes: number; heuresCardio: number;
  tabata: number; norvegien: number; serie: number; max: Record<string, number>; poidsCorps: boolean; defis: number; km: number; sorties: number; courses: number;
};
export function stats(E: Etat, auj = jourDe(Date.now())): Stats {
  const H = E.HIST || [], C = avecSorties(E.CARDIO, E.SORTIES);
  const max: Record<string, number> = {};
  let vol = 0;
  for (const l of H) { vol += l.vol; for (const id in l.ex) if (EX[id]?.ch === "kg") max[id] = Math.max(max[id] || 0, l.ex[id][2]); }
  const poids = (Array.isArray(E.A.poids) ? (E.A.poids as [string, number][]).at(-1)?.[1] : undefined) ?? E.A.profil?.["Poids"];
  const seul = C.filter((c) => !c.ref);
  return {
    seances: H.length + seul.length, muscu: H.length, cardio: seul.length, combinees: new Set(C.filter((c) => c.ref).map((c) => jourDe(c.ts) + c.ref!.split("|")[0])).size,
    records: records(H).length, tonnes: vol / 1000, heuresCardio: C.reduce((n, c) => n + c.min, 0) / 60,
    tabata: C.filter((c) => c.f === "tabata").length, norvegien: C.filter((c) => c.f === "norvegien").length,
    serie: serie(H, C, objectifHebdo(E.A), auj).record, max,
    poidsCorps: !!poids && Object.values(max).some((v) => v >= poids),
    defis: Object.keys((E.A.defisOk as Record<string, string> | undefined) || {}).length,
    km: (E.SORTIES || []).reduce((n, s) => n + s.km, 0), sorties: (E.SORTIES || []).length, courses: (E.SORTIES || []).filter((s) => s.course).length,
  };
}

export type Badge = { id: string; nom: string; texte: string; icone: string; famille: string; cible: number; valeur: (s: Stats) => number };
const B = (famille: string, icone: string) => (id: string, nom: string, texte: string, cible: number, valeur: (s: Stats) => number): Badge => ({ id, nom, texte, icone, famille, cible, valeur });
const course = B("Course à pied", "course"), premiere = B("Premières fois", "etoile"), regul = B("Régularité", "flamme"), force = B("Force", "haltere"), volume = B("Volume", "poids"), cardio = B("Cardio", "coeur");
export const BADGES: Badge[] = [
  premiere("s1", "Premier pas", "Ta première séance", 1, (s) => s.seances),
  premiere("c1", "Souffle", "Ta première séance cardio", 1, (s) => s.cardio),
  premiere("m1", "Deux en un", "Ta première séance combinée", 1, (s) => s.combinees),
  premiere("r1", "Premier record", "Battre un record pour la première fois", 1, (s) => s.records),
  premiere("d1", "Défi relevé", "Atteindre l'objectif d'un défi entre amis", 1, (s) => s.defis),
  regul("s10", "Lancé", "10 séances", 10, (s) => s.seances),
  regul("s50", "Habitué", "50 séances", 50, (s) => s.seances),
  regul("s100", "Pilier", "100 séances", 100, (s) => s.seances),
  regul("w4", "Un mois plein", "4 semaines réussies d'affilée", 4, (s) => s.serie),
  regul("w12", "Trimestre", "12 semaines réussies d'affilée", 12, (s) => s.serie),
  regul("w26", "Six mois", "26 semaines réussies d'affilée", 26, (s) => s.serie),
  force("r10", "Collectionneur", "10 records battus", 10, (s) => s.records),
  force("r50", "Insatiable", "50 records battus", 50, (s) => s.records),
  force("dc100", "Club des 100 · couché", "100 kg au développé couché", 100, (s) => s.max.dc || 0),
  force("sq100", "Club des 100 · squat", "100 kg au squat", 100, (s) => s.max.sq || 0),
  force("sdt140", "Soulevé lourd", "140 kg au soulevé de terre", 140, (s) => s.max.sdt || 0),
  force("pdc", "Ton propre poids", "Soulever ton poids du corps sur un exercice", 1, (s) => +s.poidsCorps),
  volume("t10", "10 tonnes", "10 t soulevées au total", 10, (s) => s.tonnes),
  volume("t100", "100 tonnes", "100 t soulevées au total", 100, (s) => s.tonnes),
  volume("t1000", "Mille tonnes", "1 000 t soulevées au total", 1000, (s) => s.tonnes),
  cardio("h10", "Endurant", "10 heures de cardio", 10, (s) => s.heuresCardio),
  cardio("h50", "Moteur", "50 heures de cardio", 50, (s) => s.heuresCardio),
  cardio("tab10", "Tabata ×10", "10 séances de Tabata", 10, (s) => s.tabata),
  cardio("nor1", "Norvégien", "Un 4×4 norvégien bouclé", 1, (s) => s.norvegien),
  cardio("c25", "Cardio régulier", "25 séances de cardio", 25, (s) => s.cardio),
  course("run1", "Premiers kilomètres", "Ta première sortie de course notée", 1, (s) => s.sorties),
  course("km100", "100 km", "100 km courus au total", 100, (s) => s.km),
  course("km500", "500 km", "500 km courus au total", 500, (s) => s.km),
  course("jourj", "Jour J", "Ta course préparée avec Repère, bouclée", 1, (s) => s.courses),
];
export const obtenu = (b: Badge, s: Stats) => b.valeur(s) >= b.cible;

/** Badges nouvellement obtenus par rapport à ceux déjà notés. */
export const nouveaux = (s: Stats, notes: Record<string, string>) => BADGES.filter((b) => obtenu(b, s) && !notes[b.id]);
