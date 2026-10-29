/* La séance libre à proposer en tête d'Entraînement : parmi tes séances enregistrées (hors
   routines de soin), une jamais faite d'abord, sinon celle faite il y a le plus longtemps.
   Les séances tournent ainsi d'elles-mêmes. L'historique note une séance libre « L|i ». */
type SeanceMin = { soin?: string; ex: unknown[] };
type LigneMin = { d: string; s: string };

export function prochaineLibre(seances: SeanceMin[], hist: LigneMin[] = []): number | null {
  const derniere = new Map<number, string>();
  for (const h of hist) {
    const m = /^L\|(\d+)$/.exec(h.s);
    if (!m) continue;
    const i = +m[1], d = derniere.get(i);
    if (!d || h.d > d) derniere.set(i, h.d);
  }
  const candidates = seances.map((_, i) => i).filter((i) => !seances[i].soin && seances[i].ex.length > 0);
  if (!candidates.length) return null;
  /* tri stable : à égalité (jamais faites), l'ordre de la liste */
  return candidates.sort((a, b) => (derniere.get(a) ?? "").localeCompare(derniere.get(b) ?? ""))[0];
}
