/* Historique durable des séances de musculation (HIST) : une ligne par séance
   et par jour, qui survit aux nouveaux cycles et aux séances libres refaites
   (leurs lignes du journal sont réécrites à chaque fois). Logique pure.
   Le cardio garde son propre historique (CARDIO). */
import { EX } from "@/lib/data/exercices";
import { MUSC, PAT2MUSC } from "@/lib/data/referentiels";
import { okDe, titreSeance, week } from "./core";
import type { Etat, HistoCardio, Journal } from "./types";

/** Par exercice : [1RM estimé, volume, meilleure charge, reps à cette charge, séries validées]. */
export type PerfEx = [number, number, number, number, number];
export type LigneHist = {
  d: string; // jour local AAAA-MM-JJ
  s: string; // séance : « semaine|séance » (plan) ou « L|i » (libre)
  nom: string;
  vol: number; // kg soulevés
  ser: number; // séries validées
  rec?: number; // records battus pendant la séance
  min?: number; // durée
  fo?: number; // forme du jour (−2 à +1)
  ex: Record<string, PerfEx>;
};

export const MAX_HIST = 400;

const deux = (n: number) => String(n).padStart(2, "0");
/** Jour local d'un instant, « AAAA-MM-JJ ». */
export const jourDe = (ts: number) => { const d = new Date(ts); return `${d.getFullYear()}-${deux(d.getMonth() + 1)}-${deux(d.getDate())}`; };
export const dateDe = (j: string) => { const [a, m, d] = j.split("-").map(Number); return new Date(a, m - 1, d); };

/** Lundi de la semaine d'un jour, « AAAA-MM-JJ ». */
export function lundiDe(j: string) {
  const d = dateDe(j);
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  return jourDe(d.getTime());
}
/** Décale un jour de n jours. */
export function decaler(j: string, n: number) { const d = dateDe(j); d.setDate(d.getDate() + n); return jourDe(d.getTime()); }

/** 1RM estimé (Epley), au-delà de 12 répétitions l'estimation n'a plus de sens : on plafonne. */
export const e1rm = (charge: number, reps: number) =>
  charge <= 0 || reps <= 0 ? 0 : reps === 1 ? charge : Math.round(charge * (1 + Math.min(reps, 12) / 30) * 10) / 10;

/** Performance d'un exercice à partir de sa ligne du journal (séries validées seulement). */
export function perfDe(L: Journal): PerfEx | null {
  const ch = EX[L.ex]?.ch;
  let rm = 0, vol = 0, max = 0, repsMax = 0, n = 0;
  for (const s of L.series || []) {
    if (!okDe(L, s)) continue;
    n++;
    if (ch === "kg" || ch === "lest") vol += s.v * s.reps;
    if (ch === "kg") rm = Math.max(rm, e1rm(s.v, s.reps));
    /* charge (ou lest, ou valeur) la plus haute ; à égalité, le plus de répétitions */
    const v = ch === "aucune" ? +(s.lest ?? 0) || 0 : s.v, r = ch === "aucune" ? s.v : s.reps;
    if (v > max || (v === max && r > repsMax)) { max = v; repsMax = r; }
  }
  return n ? [rm, Math.round(vol), max, repsMax, n] : null;
}

/** Nom affiché d'une séance du journal. */
export function nomSeance(E: Etat, s: string) {
  const [a, b] = s.split("|");
  if (a === "L") return E.SEANCES[+b]?.nom || "Séance libre";
  const S = week(E)[+b];
  return S ? titreSeance(S.t) : "Séance";
}

/** Ligne d'historique d'une séance pour un jour : les lignes du journal de la séance modifiées ce jour-là. */
export function ligneDe(E: Etat, s: string, d: string, extra: Partial<LigneHist> = {}): LigneHist | null {
  const ex: Record<string, PerfEx> = {};
  let vol = 0, ser = 0;
  for (const k in E.LOG) {
    if (!k.startsWith(s + "|")) continue;
    const L = E.LOG[k];
    if (!L || jourDe(L.ts || 0) !== d) continue;
    const p = perfDe(L);
    if (!p) continue;
    const a = ex[L.ex];
    /* le même exercice deux fois dans la séance : on additionne volume et séries, on garde le meilleur */
    ex[L.ex] = a ? [Math.max(a[0], p[0]), a[1] + p[1], Math.max(a[2], p[2]), p[2] > a[2] ? p[3] : a[3], a[4] + p[4]] : p;
    vol += p[1]; ser += p[4];
  }
  if (!ser) return null;
  return { d, s, nom: nomSeance(E, s), vol, ser, ex, ...extra };
}

/** Insère ou remplace la ligne (même jour, même séance), ou la retire si elle est vide. Trié, borné. */
export function inscrire(H: LigneHist[], d: string, s: string, l: LigneHist | null): LigneHist[] {
  const i = H.findIndex((x) => x.d === d && x.s === s);
  const r = H.slice();
  if (i >= 0) {
    if (l) r[i] = { ...l, rec: Math.max(l.rec ?? 0, r[i].rec ?? 0) || undefined, min: l.min ?? r[i].min, fo: l.fo ?? r[i].fo };
    else r.splice(i, 1);
  } else if (l) r.push(l);
  r.sort((a, b) => (a.d < b.d ? -1 : a.d > b.d ? 1 : 0));
  return r.slice(-MAX_HIST);
}

/** Reconstruction depuis le journal (premier lancement après la mise à jour) : une ligne par séance et par jour. */
export function reconstruire(E: Etat): LigneHist[] {
  const paires = new Set<string>();
  for (const k in E.LOG) {
    const L = E.LOG[k];
    if (!L?.ts || !(L.series || []).some((x) => okDe(L, x))) continue;
    paires.add(k.split("|").slice(0, 2).join("|") + "#" + jourDe(L.ts));
  }
  let H: LigneHist[] = [];
  for (const p of paires) {
    const [s, d] = p.split("#");
    H = inscrire(H, d, s, ligneDe(E, s, d));
  }
  return H;
}

/* ---------------- lectures pour l'écran Progrès ---------------- */

export type Semaine = { lundi: string; seances: number; vol: number; ser: number; cardio: number };
/** Totaux des n dernières semaines (la dernière est la semaine en cours). */
export function semaines(H: LigneHist[], C: HistoCardio[], n: number, auj = jourDe(Date.now())): Semaine[] {
  const fin = lundiDe(auj);
  const S: Semaine[] = Array.from({ length: n }, (_, i) => ({ lundi: decaler(fin, -7 * (n - 1 - i)), seances: 0, vol: 0, ser: 0, cardio: 0 }));
  const idx = new Map(S.map((s, i) => [s.lundi, i]));
  for (const l of H) {
    const i = idx.get(lundiDe(l.d));
    if (i !== undefined) { S[i].seances++; S[i].vol += l.vol; S[i].ser += l.ser; }
  }
  for (const c of C) {
    const i = idx.get(lundiDe(jourDe(c.ts)));
    if (i !== undefined) { S[i].cardio += c.min; if (!c.ref) S[i].seances++; }
  }
  return S;
}

export type Jour = { muscu: boolean; cardio: boolean; noms: string[] };
/** Activité par jour (calendrier). */
export function activite(H: LigneHist[], C: HistoCardio[]): Map<string, Jour> {
  const m = new Map<string, Jour>();
  const de = (d: string) => { let j = m.get(d); if (!j) m.set(d, (j = { muscu: false, cardio: false, noms: [] })); return j; };
  for (const l of H) { const j = de(l.d); j.muscu = true; j.noms.push(l.nom); }
  for (const c of C) { const j = de(jourDe(c.ts)); j.cardio = true; if (!c.ref) j.noms.push(c.nom); }
  return m;
}

/** Séries validées par muscle entre deux jours (inclus), réparties selon le schéma de mouvement de l'exercice. */
export function seriesParMuscle(H: LigneHist[], de: string, a: string): Record<string, number> {
  const r: Record<string, number> = {};
  for (const l of H) {
    if (l.d < de || l.d > a) continue;
    for (const id in l.ex) {
      const x = EX[id];
      const m = x && (PAT2MUSC[x.pat] || (x.pat2 ? PAT2MUSC[x.pat2] : undefined));
      if (m) r[m] = (r[m] || 0) + l.ex[id][4];
    }
  }
  return r;
}
export const nomMuscle = (k: string) => MUSC.find((m) => m.k === k)?.n || k;

export type PointEx = { d: string; rm: number; max: number; reps: number; vol: number; ser: number };
/** Courbe d'un exercice : un point par jour (le meilleur s'il a été fait deux fois). */
export function courbe(H: LigneHist[], id: string): PointEx[] {
  const r: PointEx[] = [];
  for (const l of H) {
    const p = l.ex[id];
    if (!p) continue;
    const pt = { d: l.d, rm: p[0], max: p[2], reps: p[3], vol: p[1], ser: p[4] };
    const der = r[r.length - 1];
    if (der && der.d === l.d) { if (pt.rm > der.rm || pt.max > der.max) r[r.length - 1] = pt; } else r.push(pt);
  }
  return r;
}

/** Exercices déjà faits, du plus récent au plus ancien, avec leur nombre de séances. */
export function exercicesFaits(H: LigneHist[]): { id: string; n: number; dernier: string }[] {
  const m = new Map<string, { n: number; dernier: string }>();
  for (const l of H) for (const id in l.ex) {
    const a = m.get(id);
    m.set(id, { n: (a?.n || 0) + 1, dernier: l.d });
  }
  return [...m].map(([id, v]) => ({ id, ...v })).sort((a, b) => (a.dernier < b.dernier ? 1 : a.dernier > b.dernier ? -1 : b.n - a.n));
}

export type Record_ = { d: string; id: string; rm: number; max: number; reps: number; avant: number };
/** Records : chaque fois qu'un exercice dépasse son meilleur précédent (1RM estimé, ou charge pour le poids du corps). */
export function records(H: LigneHist[]): Record_[] {
  const best = new Map<string, number>(), r: Record_[] = [];
  for (const l of H) for (const id in l.ex) {
    const p = l.ex[id], ch = EX[id]?.ch;
    const v = ch === "kg" ? p[0] : ch === "lest" ? p[2] * 1000 + p[3] : ch === "aucune" ? p[2] * 1000 + p[3] : p[2];
    if (v <= 0) continue;
    const avant = best.get(id);
    if (avant !== undefined && v > avant) r.push({ d: l.d, id, rm: p[0], max: p[2], reps: p[3], avant });
    if (avant === undefined || v > avant) best.set(id, v);
  }
  return r.reverse();
}
