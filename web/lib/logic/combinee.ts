/* Séances combinées : des exercices de musculation (SeanceLibre.ex, inchangés)
   et des blocs cardio placés librement entre eux. Logique pure. */
import { construireSeance, dureeTotale as dureeCardio, ORDRE_FORMATS, ORDRE_MACHINES, reglagesDe, type Niveau } from "./cardio";
import { dureeEstimee } from "./assistant";
import type { BlocCardio, ExLibre, SeanceLibre } from "./types";

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
