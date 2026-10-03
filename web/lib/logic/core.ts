/* Logique métier de Repère, portée de l'ancienne app (public/index.html).
   Fonctions pures : elles reçoivent l'état et ne touchent ni au DOM ni au
   stockage. Les tests de parité (tests/parite.test.ts) les comparent à
   l'ancien code sur les mêmes entrées. */

import { EX } from "@/lib/data/exercices";
import {
  ACC, BAS, BONUS, HAUT, MUSCLES, PAT, PAT2GRP, PATN, SOCLE, SPORTS, VARIANTES, GROUPES,
} from "@/lib/data/referentiels";
import type { Exercice } from "@/lib/data/types";
import type { Etat, Journal, Reponses, SeanceIA, SeanceSemaine, Serie } from "./types";

/* ---------------- petits utilitaires ---------------- */
export const nb = (v: number | string) => String(v).replace(".", ",");
export const key = (w: number, s: number, i: number) => `${w}|${s}|${i}`;
export const nomPat = (p: string) => PATN[p] || PAT[p] || p;
export const UNITE: Record<string, string> = { kg: "kg", lest: "kg", aucune: "reps", temps: "s", dist: "m" };

/* ---------------- matériel ---------------- */
export const accDeclares = (A: Reponses) =>
  (A.acc || []).map((i) => (ACC[i] || [])[0]).filter(Boolean) as string[];

export function exoDispo(o: string, mat: number, acc: string[]) {
  const e = EX[o];
  if (!e) return false;
  if (e.acc) return acc.includes(e.acc);
  return e.eq >= mat || (!!e.ou && acc.includes(e.ou));
}
export const dispoDeclare = (A: Reponses, o: string) => exoDispo(o, A.materiel ?? 0, accDeclares(A));

/* Filtre « Matériel disponible » : m0…m3 = champ eq, kb et el = champ acc. */
export const selDeclare = (A: Reponses) =>
  [3, 2, 1, 0].filter((v) => v >= (A.materiel ?? 0)).map((v) => "m" + v).concat(accDeclares(A));
export function exoFiltre(o: string, sel: string[]) {
  const e = EX[o];
  if (!e) return false;
  if (e.acc) return sel.includes(e.acc);
  return sel.includes("m" + e.eq) || (!!e.ou && sel.includes(e.ou));
}

/* ---------------- sports ---------------- */
export const sportsChoisis = (A: Reponses) => (A.sport || []).filter((i) => i > 0);
export const sportsInfo = (A: Reponses) => sportsChoisis(A).map((i) => SPORTS[i]).filter(Boolean);
export const freqDe = (A: Reponses, i: number) => (A.sportFreq || {})[i] ?? 0;
export const sportsTotal = (A: Reponses) => sportsChoisis(A).reduce((n, i) => n + freqDe(A, i) + 1, 0);
export const aTrait = (A: Reponses, t: string) => sportsInfo(A).some((s) => (s as Record<string, unknown>)[t]);
export const maxTrait = (A: Reponses, t: string) =>
  sportsInfo(A).reduce((m, s) => Math.max(m, ((s as unknown as Record<string, number>)[t]) || 0), 0);
export const groupes = (A: Reponses) => GROUPES[A.sexe === 0 ? "h" : A.sexe === 1 ? "f" : "n"];

/* ---------------- semaine ---------------- */
export const patsOff = (A: Reponses) => {
  const s = new Set<string>();
  (A.exclus || []).forEach((g) => Object.keys(PAT2GRP).forEach((p) => { if (PAT2GRP[p] === g) s.add(p); }));
  return s;
};
const conv = (s: SeanceIA, b: boolean): SeanceSemaine => ({
  b: b ? 1 : 0, t: s.titre, f: s.focus,
  x: s.exercices.map((e) => [e.id, e.series, e.reps, e.repos, e.role]),
});

export function week(E: Etat): SeanceSemaine[] {
  const { A, PLAN } = E;
  let w: SeanceSemaine[];
  if (PLAN && PLAN.seances && PLAN.seances.length) {
    w = PLAN.seances.map((s) => conv(s, false));
    if (PLAN.bonus) w.push(conv(PLAN.bonus, true));
  } else {
    w = SOCLE.slice(0, 2 + (A.socle ?? 2)).map((s) => s as SeanceSemaine);
    w.push(BONUS[A.axe ?? 0] as SeanceSemaine);
  }
  const off = patsOff(A);
  if (off.size)
    w = w
      .map((s) => (s.x ? { ...s, x: s.x.filter((e) => !off.has((EX[e[0]] || ({} as Exercice)).pat)) } : s))
      .filter((s) => !s.x || s.x.length);
  if (sportsChoisis(A).length) w.push({ sportOnly: 1, t: sportsInfo(A).map((s) => s.n).join(" · ") });
  return w;
}

export function typeSeance(s: SeanceSemaine): "haut" | "bas" | "bonus" {
  if (s.b) return "bonus";
  let a = 0, b = 0;
  (s.x || []).forEach((e) => {
    const p = (EX[e[0]] || ({} as Exercice)).pat;
    if (HAUT.has(p)) a++;
    else if (BAS.has(p)) b++;
  });
  return b > a ? "bas" : "haut";
}

/* ---------------- effort ---------------- */
export const baseRPE = (w: number) => (w < 2 ? 7 : w < 5 ? 8 : 9);
export function rpeOf(A: Reponses, w: number, id: string, role: number) {
  const e = EX[id];
  let r = baseRPE(w) + (role ? 0 : 1);
  if (r > 9) r = 9;
  if (e.cap && r > e.cap) r = e.cap;
  if (e.capDeb && (A.regularite === 0 || A.regularite === 1) && r > e.capDeb) r = e.capDeb;
  return r;
}
export const rirTxt = (r: number) => {
  const n = 10 - r;
  return n === 0 ? "aucune répétition en réserve" : n === 1 ? "il te reste 1 répétition" : `il te reste ${n} répétitions`;
};
export const noRPE = (id: string) => ["temps", "dist"].includes(EX[id].ch) || EX[id].pat === "mo";

/* ---------------- variété d'une semaine sur l'autre ----------------
   Principaux : l'exercice du plan les semaines 1, 3, 5, 7 ; sa variante les
   semaines 2, 4, 6, 8. Accessoires : ils tournent chaque semaine dans le même
   schéma moteur. Jamais deux fois le même exercice dans une séance. */
export function variante(A: Reponses, id: string, pris: Set<string>) {
  const e = EX[id];
  if (!e) return id;
  const auto = Object.keys(EX)
    .filter((o) => o !== id && EX[o].pat === e.pat && EX[o].ch === e.ch)
    .sort((a, b) => Math.abs(EX[a].eq - e.eq) - Math.abs(EX[b].eq - e.eq) || a.localeCompare(b));
  const l = (VARIANTES[id] || []).concat(auto).filter((o) => o !== id && EX[o] && dispoDeclare(A, o) && !pris.has(o));
  return l[0] || id;
}
export function rotation(A: Reponses, w: number, id: string, pris?: Set<string>) {
  const e = EX[id];
  if (!e) return id;
  const l = Object.keys(EX).filter((o) => EX[o].pat === e.pat && dispoDeclare(A, o)).sort();
  if (!l.length) return id;
  const k = Math.max(0, l.indexOf(id));
  if (l.length < 2 && l[0] === id) return id;
  for (let j = 0; j < l.length; j++) {
    const o = l[(k + w + j) % l.length];
    if (!pris || !pris.has(o)) return o;
  }
  return id;
}
export function curId(E: Etat, w: number, s: number, i: number, id: string, W = week(E)): string {
  const sw = E.SWAP[key(w, s, i)] || E.SWAPP[s + "|" + i];
  if (sw) return sw;
  /* Ce qui a été fait fait foi : un exercice enregistré garde son nom. */
  const L = E.LOG[key(w, s, i)];
  if (L && L.ex && EX[L.ex]) return L.ex;
  const S = W[s], e = S && S.x && S.x[i];
  if (!e || !S.x) return id;
  const pris = new Set(S.x.map((x, j) => (j === i ? null : x[0])).filter(Boolean) as string[]);
  for (let j = 0; j < i; j++) pris.add(curId(E, w, s, j, S.x[j][0], W));
  if (e[4]) {
    const base = dispoDeclare(E.A, id) ? id : variante(E.A, id, pris);
    return w % 2 === 1 ? variante(E.A, base, new Set([...pris, id])) : base;
  }
  return rotation(E.A, w, id, pris);
}

/* ---------------- avancement ---------------- */
export function wkDone(E: Etat, w: number, si: number, W = week(E)) {
  const s = W[si];
  if (!s || s.sportOnly || !s.x) return false;
  return s.x.every((_, i) => E.LOG[key(w, si, i)] && E.LOG[key(w, si, i)].done);
}
export function wkFull(E: Etat, w: number, W = week(E)) {
  return W.some((x) => !x.b && !x.sportOnly) && W.every((s, i) => s.b || s.sportOnly || wkDone(E, w, i, W));
}
export function espacementDe(W: SeanceSemaine[], i: number): [number, string] {
  const s = W[i];
  if (!s || s.sportOnly) return [1, ""];
  if (s.b) return [1, "Aucune contrainte. Elle peut se coller à n'importe quelle séance, ou disparaître de la semaine."];
  if (i === 0) return [1, "Première séance du cycle. Place-la où tu veux dans ta semaine."];
  const t = typeSeance(s), tp = typeSeance(W[i - 1]);
  if (t !== tp) return [1, `Tu peux l'enchaîner dès le lendemain de la séance ${i} : elle ne touche pas les mêmes muscles. Espacer n'apporte rien ici.`];
  return [0, `Laisse au moins un jour plein après la séance ${i}, qui travaillait déjà les mêmes muscles.`];
}

/* ---------------- libellés ---------------- */
export function musclesDe(ids: string[]) {
  const l: string[] = [];
  ids.forEach((id) => {
    const x = EX[id];
    if (!x || !x.m) return;
    x.m.split(",").forEach((t) => {
      const f = MUSCLES.find(([r]) => r.test(t.trim().toLowerCase()));
      if (f && !l.includes(f[1])) l.push(f[1]);
    });
  });
  return l.slice(0, 6);
}
export const titreSeance = (t: string) => {
  const c = String(t || "").replace(/^séance\s*\d+\s*[–—:·-]\s*/i, "").replace(/\s*\(.*$/, "").trim();
  return c || t;
};
export function secondesDe(t: string) {
  const s = String(t || "");
  const m = s.match(/(\d+)\s*min\s*(\d+)?/), sec = s.match(/(\d+)\s*s\b/);
  const v = m ? +m[1] * 60 + (+m[2] || 0) : sec ? +sec[1] : 0;
  return v > 0 ? v : 90;
}

/* ---------------- journal des séries ---------------- */
export function seriesDe(L: Journal, n?: number) {
  n = n || L.nb || 1;
  if (!L.series || !L.series.length) L.series = Array.from({ length: n }, () => ({ v: L.v ?? 0, reps: L.reps ?? 0 }));
  if (!L.memo) L.memo = [];
  /* On mémorise les lignes retirées : repasser de 4 à 6 séries les retrouve. */
  while (L.series.length < n) L.series.push(L.memo.pop() || { ...L.series[L.series.length - 1] });
  while (L.series.length > n) L.memo.push(L.series.pop()!);
  return L.series;
}
export const maxV = (L?: Journal | null) =>
  L && L.series && L.series.length ? Math.max(...L.series.map((s) => s.v)) : (L && L.v) || 0;
export const okDe = (L: Journal, s: Serie) => s.ok ?? !!L.done;
export const lestMax = (L?: Journal | null) => (L && L.series ? Math.max(0, ...L.series.map((s) => +(s.lest ?? 0) || 0)) : 0);

export function resumeDe(L: Journal, x: Exercice, unit: string) {
  const S = L.series && L.series.length ? L.series : [{ v: L.v ?? 0, reps: L.reps ?? 0 }];
  const feels = ["facile", "juste", "trop dur"];
  const par = (s: Serie) =>
    `${nb(s.v)}${unit ? " " + unit : ""}${["kg", "lest"].includes(x.ch) ? " × " + s.reps : ""}${L.lest && +(s.lest ?? 0) > 0 ? " +" + nb(s.lest!) + " kg" : ""}`;
  const tous = S.every((s) => s.v === S[0].v && s.reps === S[0].reps && (+(s.lest ?? 0) || 0) === (+(S[0].lest ?? 0) || 0));
  return (tous ? `${S.length} × ${par(S[0])}` : S.map(par).join(", ")) + (L.feel != null ? " · " + feels[L.feel] : "");
}
export function fmtSerie(x: Exercice, s?: Serie) {
  if (!s) return "—";
  const b = ["kg", "lest"].includes(x.ch) ? `${nb(s.v)} × ${s.reps}` : x.ch === "temps" ? `${nb(s.v)} s` : x.ch === "dist" ? `${nb(s.v)} m` : `${nb(s.v)}`;
  return +(s.lest ?? 0) > 0 ? `${b} +${nb(s.lest!)}kg` : b;
}
/* Dernier enregistrement terminé de l'exercice, hors de la ligne en cours. */
export function precedentDe(LOG: Record<string, Journal>, id: string, sauf?: string) {
  let best: Journal | null = null;
  for (const k in LOG) {
    const L = LOG[k];
    if (k !== sauf && L && L.done && L.ex === id && (!best || (L.ts || 0) > (best.ts || 0))) best = L;
  }
  return best;
}

/* ---------------- suggestion de charge ---------------- */
const PAS_LOURD = new Set(["eg", "fh"]), PAS_MOYEN = new Set(["ph", "pv", "tv", "th"]);
export function pasDe(x: Exercice) {
  if (x.ch === "temps") return 5;
  if (x.ch === "dist") return 50;
  if (x.ch === "aucune") return 1;
  if (PAS_LOURD.has(x.pat)) return 5;
  if (PAS_MOYEN.has(x.pat)) return 2.5;
  return 1;
}
export type Suggestion = { v: number; reps: number; t: string };
export function suggere(E: Etat, w: number, s: number, i: number, id: string, W = week(E)): Suggestion | null {
  const x = EX[id];
  if (!x) return null;
  if (!W[s] || !W[s].x || !W[s].x![i]) return null;
  for (let p = w - 1; p >= 0; p--) {
    if (curId(E, p, s, i, W[s].x![i][0], W) !== id) continue;
    const L = E.LOG[key(p, s, i)];
    if (!L || !L.done) continue;
    const pas = pasDe(x), monte = baseRPE(w) > baseRPE(p), u = UNITE[x.ch];
    const v = maxV(L), reps = L.reps ?? 0;
    if (L.feel === 0 && !monte) return { v: v + pas, reps, t: `+${nb(pas)} ${u} par rapport à la semaine ${p + 1}, où tu avais trouvé ça facile.` };
    if (L.feel === 0 && monte) return { v, reps, t: `Même charge qu'en semaine ${p + 1} : l'effort visé passe à RPE ${baseRPE(w)}, ce sera plus dur sans rien ajouter.` };
    if (L.feel === 2) return { v: Math.max(0, v - pas), reps, t: `−${nb(pas)} ${u} : la semaine ${p + 1} était au-dessus de la cible.` };
    if (monte) return { v, reps, t: `Même charge qu'en semaine ${p + 1} : l'effort visé monte à RPE ${baseRPE(w)}.` };
    return { v, reps, t: `Reprise de ta semaine ${p + 1}. Si la série sort facile, monte de ${nb(pas)} ${u} la prochaine fois.` };
  }
  return null;
}

/* ---------------- contexte d'un exercice affiché ----------------
   Clé du journal, exercice, nombre de séries, valeurs proposées, repos et
   dernière séance comparable. Plan : ctxPlan(i). Séance libre : ctxLibre(j). */
export type Ctx = {
  k: string; id: string; n: number;
  base: { v: number; reps: number };
  why?: string; repos: string;
  prev: Journal | null;
};
export function ctxPlan(E: Etat, i: number, W = week(E)): Ctx | null {
  const S = W[E.day];
  const e = S?.x?.[i];
  if (!e) return null;
  const id = curId(E, E.wk, E.day, i, e[0], W), x = EX[id], g = suggere(E, E.wk, E.day, i, id, W), k = key(E.wk, E.day, i);
  let prev: Journal | null = null;
  for (let p = E.wk - 1; p >= 0 && !prev; p--)
    if (curId(E, p, E.day, i, e[0], W) === id && E.LOG[key(p, E.day, i)]?.done) prev = E.LOG[key(p, E.day, i)];
  return {
    k, id, n: e[1],
    base: g ? { v: g.v, reps: g.reps } : { v: x.d, reps: e[2] },
    why: g ? g.t : undefined, repos: e[3],
    prev: prev || precedentDe(E.LOG, id, k),
  };
}
export const kLibre = (idx: number, j: number) => `L|${idx}|${j}`;
export function ctxLibre(E: Etat, idx: number, j: number): Ctx | null {
  const S = E.SEANCES[idx], e = S?.ex[j];
  if (!e || !EX[e.id]) return null;
  const x = EX[e.id], k = kLibre(idx, j), d = precedentDe(E.LOG, e.id, k);
  return {
    k, id: e.id, n: e.s,
    base: d ? { v: maxV(d), reps: d.reps ?? e.r } : { v: x.d, reps: e.r },
    why: d ? "Reprise de ta dernière séance sur cet exercice." : undefined,
    repos: e.p, prev: d,
  };
}

/* Journal de l'exercice, créé au premier geste. Mute LOG (appelé dans le store). */
import { LESTABLE } from "@/lib/data/referentiels";
export function journal(LOG: Record<string, Journal>, c: Ctx): Journal {
  let L = LOG[c.k];
  if (!L) {
    L = LOG[c.k] = {
      done: false, ...c.base, nb: c.n, feel: null, ex: c.id, ts: Date.now(), why: c.why,
      series: Array.from({ length: c.n }, () => ({ ...c.base, ok: false })),
    };
    /* Lest de la dernière fois repris d'office. */
    if (LESTABLE.has(c.id) && c.prev && c.prev.lest) {
      L.lest = true;
      const P = c.prev.series || [];
      L.series.forEach((sr, n) => { sr.lest = +((P[n] || P[P.length - 1] || ({} as Serie)).lest ?? 0) || 0; });
    }
  }
  seriesDe(L, c.n);
  L.series.forEach((s) => { if (s.ok === undefined) s.ok = !!L.done; });
  return L;
}
export function majJournal(L: Journal) {
  L.done = L.series.length > 0 && L.series.every((s) => s.ok);
  if (!L.done) L.plie = false;
  L.v = maxV(L);
  L.reps = L.series[0] ? L.series[0].reps : L.reps;
  L.ts = Date.now();
}

/* ---------------- historique d'un exercice ---------------- */
export type LigneHisto = { label: string; v: number; reps: number; lest: number };
export function histo(E: Etat, id: string, idx: number): LigneHisto[] {
  if (idx < 0) {
    return Object.values(E.LOG)
      .filter((L) => L && L.done && L.ex === id)
      .sort((a, b) => (a.ts || 0) - (b.ts || 0))
      .slice(-8)
      .map((L) => ({
        label: L.ts ? new Date(L.ts).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" }) : "—",
        v: maxV(L), reps: L.reps ?? 0, lest: lestMax(L),
      }));
  }
  const W = week(E), rows: LigneHisto[] = [];
  for (let w = 0; w < 8; w++)
    for (let s = 0; s < W.length; s++) {
      const kk = key(w, s, idx), x = W[s].x?.[idx];
      if (x && curId(E, w, s, idx, x[0], W) === id && E.LOG[kk]?.done)
        rows.push({ label: "S" + (w + 1), v: E.LOG[kk].v ?? maxV(E.LOG[kk]), reps: E.LOG[kk].reps ?? 0, lest: lestMax(E.LOG[kk]) });
    }
  return rows;
}

/* Alternatives d'un exercice : même schéma moteur, matériel déclaré. */
export const alternativesDe = (A: Reponses, id: string) =>
  Object.keys(EX).filter((o) => EX[o].pat === EX[id].pat && dispoDeclare(A, o));
