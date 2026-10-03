/* Séance construite à partir des muscles choisis : tout se calcule ici, sans
   IA (instantané, gratuit, hors ligne). Port fidèle de l'ancienne app. */

import { EX } from "@/lib/data/exercices";
import { DUREES, MUSC, ZPATS } from "@/lib/data/referentiels";
import { exoFiltre, secondesDe } from "./core";
import type { ExLibre, Reponses, SeanceLibre } from "./types";

type Hasard = () => number;
const tirer = <T,>(l: T[], rnd: Hasard) => l[Math.floor(rnd() * l.length)];

/* Prescription selon l'objectif : polyarticulaire plus lourd, isolation plus légère. */
export function prescription(id: string, poly: boolean, obj: number): ExLibre {
  const x = EX[id], abdo = ["ae", "ft"].includes(x.pat);
  let s = obj === 1 ? 4 : 3, r = [10, poly ? 6 : 8, 12, 10][obj] ?? 10;
  const p = abdo ? "60 s" : obj === 1 ? (poly ? "3 min" : "2 min") : obj === 0 ? (poly ? "2 min" : "90 s") : poly ? "90 s" : "60 s";
  if (x.ch === "temps") r = obj === 1 ? 30 : 45;
  else if (x.ch === "aucune") r = Math.max(r, 12);
  if (obj === 1 && !poly) s = 3;
  return { id, s, r, p };
}

export function construireSeance(muscles: string[], duree: number, obj: number, sel: string[], rnd: Hasard = Math.random): ExLibre[] {
  const series = (DUREES.find((d) => d[0] === duree) || DUREES[1])[1];
  const parEx = obj === 1 ? 4 : 3, n = Math.max(muscles.length, Math.round(series / parEx));
  const G = muscles.map((k) => MUSC.find((g) => g.k === k)).filter(Boolean) as typeof MUSC;
  /* Répartition au plus fort reste, au moins un exercice par muscle. */
  const tot = G.reduce((a, g) => a + g.g, 0);
  const parts = G.map((g) => ({ g, q: (n * g.g) / tot, n: 0 }));
  parts.forEach((p) => (p.n = Math.max(1, Math.floor(p.q))));
  let reste = n - parts.reduce((a, p) => a + p.n, 0);
  parts.slice().sort((a, b) => b.q - Math.floor(b.q) - (a.q - Math.floor(a.q))).forEach((p) => { if (reste > 0) { p.n++; reste--; } });
  const pris = new Set<string>(), res: { o: string; poly: boolean; big: boolean; abdo: boolean }[] = [];
  const libres = (pat: string) => Object.keys(EX).filter((o) => EX[o].pat === pat && exoFiltre(o, sel) && !pris.has(o) && EX[o].ch !== "dist");
  /* Parmi les candidats, on préfère ceux qui se chargent quand il y en a. */
  const choisir = (l: string[]) => {
    const kg = l.filter((o) => EX[o].ch === "kg"), c = l.filter((o) => EX[o].ch !== "aucune");
    return tirer(kg.length ? kg : c.length ? c : l, rnd);
  };
  /* Le pull-over a un second schéma mais reste un mouvement d'isolation. */
  const estPoly = (o: string) => !!EX[o].pat2 && o !== "pull";
  parts.forEach(({ g, n: k }) => {
    for (let j = 0; j < k; j++) {
      const pat = g.pats[j % g.pats.length], l = libres(pat);
      if (!l.length) continue;
      const poly = l.filter(estPoly), iso = l.filter((o) => !estPoly(o));
      const o = j === 0 ? choisir(poly.length ? poly : l) : choisir(iso.length ? iso : l);
      pris.add(o);
      res.push({ o, poly: estPoly(o) && j === 0, big: g.g >= 0.8, abdo: g.k === "abd" || g.k === "lom" });
    }
  });
  const rang = (e: (typeof res)[number]) => (e.abdo ? 3 : e.poly && e.big ? 0 : e.poly ? 1 : 2);
  res.sort((a, b) => rang(a) - rang(b));
  const l = res.map((e) => ({ ...prescription(e.o, e.poly, obj), big: e.big }));
  /* Full body sur une durée courte : 2 séries sur les petits groupes, puis sur le reste. */
  const total = () => l.reduce((a, e) => a + e.s, 0);
  for (const cond of [(e: (typeof l)[number]) => !e.big, () => true])
    l.forEach((e) => { if (total() > series && cond(e) && e.s > 2) e.s = 2; });
  return l.map(({ big: _b, ...e }) => e);
}

/* Nom de la séance générée. */
export const nomSeance = (m: string[]) =>
  m.length >= 5 ? "Full body" : m.map((k) => MUSC.find((g) => g.k === k)!.n).join(" · ");

/* Durée approximative : 40 s d'effort par série (ou la durée demandée),
   le repos entre les séries, une minute de mise en place par exercice. */
export function dureeEstimee(ex: ExLibre[]) {
  const sec = ex.reduce((a, e) => {
    const x = EX[e.id], t = x?.ch === "temps" ? +e.r || 45 : 40;
    return a + e.s * t + Math.max(0, e.s - 1) * secondesDe(e.p) + 60;
  }, 0);
  return Math.max(5, Math.round(sec / 300) * 5);
}

/* Objectif retenu pour la collation d'une séance libre. */
export function objCollation(A: Reponses, s?: SeanceLibre | null) {
  if (!s) return A.objectif ?? 0;
  if (s.colObj != null) return s.colObj;
  const ex = s.ex || [], series = ex.reduce((a, e) => a + (+e.s || 0), 0);
  const leger = series < 10 || ex.every((e) => ["ae", "ft", "lo", "mo", "ca"].includes(EX[e.id]?.pat));
  if (leger) return 3;
  return s.obj ?? A.objectif ?? 0;
}

/* Bibliothèque par zone du corps (Explorer, composeur). */
export function exosDe(p: string, sel: string[]) {
  const dispo = Object.keys(EX).filter((o) => exoFiltre(o, sel));
  return dispo.filter((o) => EX[o].pat === p).concat(dispo.filter((o) => EX[o].pat2 === p));
}
export function exosZone(z: string, sel: string[]) {
  const l: string[] = [];
  (ZPATS[z] || []).forEach((p) => exosDe(p, sel).forEach((o) => { if (!l.includes(o)) l.push(o); }));
  return l;
}
export const patsZone = (z: string, sel: string[]) => (ZPATS[z] || []).filter((p) => exosDe(p, sel).length);
export const sansAccent = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

/* Prescription par défaut quand on ajoute un exercice à la main. */
export const exParDefaut = (o: string): ExLibre => {
  const x = EX[o];
  return { id: o, s: 3, r: x.ch === "temps" ? 45 : x.ch === "dist" ? 250 : 10, p: x.pat === "eg" || x.pat === "fh" ? "2 min 30" : "90 s" };
};
