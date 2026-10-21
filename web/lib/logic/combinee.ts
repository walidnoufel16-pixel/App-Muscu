/* Séances combinées : des exercices de musculation (SeanceLibre.ex, inchangés)
   et des blocs cardio placés librement entre eux. Logique pure. */
import { construireSeance, dureeTotale as dureeCardio, ORDRE_FORMATS, ORDRE_MACHINES, reglagesDe, type Niveau } from "./cardio";
import { dureeEstimee } from "./assistant";
import type { BlocCardio, ExLibre, SeanceLibre } from "./types";
import { EX } from "@/lib/data/exercices";
import { estSoin } from "@/lib/data/soin";

export type Element = { t: "ex"; i: number; e: ExLibre } | { t: "bloc"; b: BlocCardio };

export const estCombinee = (s: Pick<SeanceLibre, "blocs">) => !!s.blocs?.length;
export const nouvelId = () => Math.random().toString(36).slice(2, 10);

/** Liste unifiée, dans l'ordre affiché. */
export function ordre(s: Pick<SeanceLibre, "ex" | "blocs">): Element[] {
  const blocs = [...(s.blocs || [])];
  const L: Element[] = [];
  const poser = (k: number) => blocs.filter((b) => Math.min(b.apres, s.ex.length) === k).forEach((b) => L.push({ t: "bloc", b }));
  s.ex.forEach((e, i) => { poser(i); L.push({ t: "ex", i, e }); });
  poser(s.ex.length);
  return L;
}

/** Recompose exercices et blocs à partir d'une liste unifiée. */
export function recomposer(L: Element[]): { ex: ExLibre[]; blocs: BlocCardio[] } {
  const ex: ExLibre[] = [], blocs: BlocCardio[] = [];
  for (const x of L) {
    if (x.t === "ex") ex.push(x.e);
    else blocs.push({ ...x.b, apres: ex.length });
  }
  return { ex, blocs };
}

/* Parties d'une séance libre : soin & mobilité, musculation, cardio. Leur ordre est celui
   que l'utilisateur choisit (la première apparition, puis les flèches du composeur). */
export type Partie = "soin" | "muscu" | "cardio";
export const PARTIES: Partie[] = ["soin", "muscu", "cardio"];

export function partieDe(x: Element): Partie {
  if (x.t === "bloc") return "cardio";
  if (estSoin(x.e.id)) return "soin";
  return EX[x.e.id]?.pat === "ca" ? "cardio" : "muscu";
}

/** Parties présentes, dans l'ordre où elles apparaissent. */
export function partiesDe(s: Pick<SeanceLibre, "ex" | "blocs">): Partie[] {
  const l: Partie[] = [];
  for (const x of ordre(s)) { const p = partieDe(x); if (!l.includes(p)) l.push(p); }
  return l;
}

/** Remet exercices et blocs dans l'ordre des parties, chacun gardant sa place dans sa partie.
    `ordreParties` : l'ordre voulu (les parties absentes de cette liste suivent dans leur ordre actuel). */
export function ranger(s: Pick<SeanceLibre, "ex" | "blocs">, ordreParties: Partie[] = partiesDe(s)) {
  const L = ordre(s), presentes = partiesDe(s);
  const rang = [...ordreParties.filter((p) => presentes.includes(p)), ...presentes.filter((p) => !ordreParties.includes(p))];
  return recomposer(rang.flatMap((p) => L.filter((x) => partieDe(x) === p)));
}

/** Monte (-1) ou descend (+1) une partie entière. */
export function deplacerPartie(s: Pick<SeanceLibre, "ex" | "blocs">, p: Partie, sens: -1 | 1) {
  const o = partiesDe(s), k = o.indexOf(p), j = k + sens;
  if (k < 0 || j < 0 || j >= o.length) return ranger(s, o);
  [o[k], o[j]] = [o[j], o[k]];
  return ranger(s, o);
}

/** Liste unifiée découpée en parties consécutives (pour l'affichage). */
export function sections(s: Pick<SeanceLibre, "ex" | "blocs">): { p: Partie; el: Element[]; debut: number }[] {
  const out: { p: Partie; el: Element[]; debut: number }[] = [];
  ordre(s).forEach((x, k) => {
    const p = partieDe(x), d = out[out.length - 1];
    if (d && d.p === p) d.el.push(x); else out.push({ p, el: [x], debut: k });
  });
  return out;
}

/** Déplace l'élément de la position `de` à la position `vers` (indices de la liste unifiée). */
export function deplacer(s: Pick<SeanceLibre, "ex" | "blocs">, de: number, vers: number) {
  const L = ordre(s);
  const [x] = L.splice(de, 1);
  L.splice(Math.max(0, Math.min(L.length, vers)), 0, x);
  return recomposer(L);
}

export const minutesBloc = (b: BlocCardio) => Math.round(dureeCardio(construireSeance(b.f, b.m, b.r)) / 60);

/** Durée estimée de toute la séance : musculation + cardio. */
export const dureeTotale = (s: Pick<SeanceLibre, "ex" | "blocs">) =>
  (s.ex.length ? dureeEstimee(s.ex) : 0) + (s.blocs || []).reduce((t, b) => t + minutesBloc(b), 0);

/** Bloc ajouté à une séance : sans échauffement s'il vient après de la musculation. */
export function nouveauBloc(apres: number, f: BlocCardio["f"], m: BlocCardio["m"], n: Niveau): BlocCardio {
  const r = reglagesDe(f, n);
  return { id: nouvelId(), apres, f, m, n, r: apres > 0 ? { ...r, echauf: 0 } : r };
}

/* ---------- partage : un bloc = un élément { id: "bloccardio", s, r, p } ---------- */
export function encoderBlocs(blocs: BlocCardio[] = []) {
  return blocs.map((b) => ({ id: "bloccardio", s: ORDRE_FORMATS.indexOf(b.f) + 1, r: ORDRE_MACHINES.indexOf(b.m), p: `${b.n},${b.apres}` }));
}
export function decoderBlocs(ex: unknown): BlocCardio[] {
  if (!Array.isArray(ex)) return [];
  return ex.filter((e) => e?.id === "bloccardio").flatMap((e) => {
    const f = ORDRE_FORMATS[(+e.s || 0) - 1], m = ORDRE_MACHINES[+e.r];
    const [n, apres] = String(e.p ?? "").split(",").map((x) => Math.max(0, Math.round(+x) || 0));
    if (!f || !m) return [];
    return [nouveauBloc(Math.min(apres, 12), f, m, Math.min(2, n) as Niveau)];
  });
}
