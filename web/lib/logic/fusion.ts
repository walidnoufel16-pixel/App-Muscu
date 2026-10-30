/* Fusion de deux sauvegardes du même compte (deux appareils). Ce qui a été FAIT ne se perd
   jamais : l'historique des séances, le journal des séries, le cardio, les sorties de course,
   les tests et les produits sont réunis des deux côtés. Les réglages et les séances
   enregistrées (qui se modifient plutôt qu'ils ne s'ajoutent) viennent de la sauvegarde la
   plus récente. */
import type { Etat, Journal } from "./types";

type Sauvegarde = Partial<Etat> & { ts?: number };

/* réunit deux listes ; à clé égale, `garder` choisit (par défaut : la version récente) */
function reunir<T>(a: T[] = [], b: T[] = [], cle: (x: T) => string, garder: (x: T, y: T) => T = (_x, y) => y): T[] {
  const m = new Map<string, T>();
  for (const x of a) m.set(cle(x), x);
  for (const y of b) { const k = cle(y), x = m.get(k); m.set(k, x ? garder(x, y) : y); }
  return [...m.values()];
}

/* une série validée vaut plus qu'une série prévue ; à égalité, la plus récente */
const valides = (j: Journal) => (j.series || []).filter((s) => s.ok).length;
const meilleurJournal = (x: Journal, y: Journal) => (valides(y) !== valides(x) ? (valides(y) > valides(x) ? y : x) : (y.ts || 0) >= (x.ts || 0) ? y : x);

/** La sauvegarde fusionnée ; `ts` est celui de la plus récente des deux. */
export function fusionner(a: Sauvegarde, b: Sauvegarde): Sauvegarde {
  const [vieux, recent] = (a.ts || 0) <= (b.ts || 0) ? [a, b] : [b, a];
  const LOG: Record<string, Journal> = { ...(vieux.LOG || {}) };
  for (const [k, j] of Object.entries(recent.LOG || {})) LOG[k] = LOG[k] ? meilleurJournal(LOG[k], j) : j;
  const A = { ...(vieux.A || {}), ...(recent.A || {}) };
  const tests = reunir(vieux.A?.testsStreet, recent.A?.testsStreet, (t) => t.d);
  if (tests.length) A.testsStreet = tests.sort((x, y) => x.d.localeCompare(y.d)).slice(-12);
  const produits = reunir(vieux.A?.produits, recent.A?.produits, (p) => p.code || `${p.n}|${p.marque ?? ""}`.toLowerCase());
  if (produits.length) A.produits = produits.slice(-30);
  return {
    ...vieux, ...recent, A, LOG,
    /* une séance du même jour : la ligne la plus fournie (plus de séries) */
    HIST: reunir(vieux.HIST, recent.HIST, (l) => `${l.d}|${l.s}`, (x, y) => ((y.ser || 0) >= (x.ser || 0) ? y : x)).sort((x, y) => x.d.localeCompare(y.d)),
    CARDIO: reunir(vieux.CARDIO, recent.CARDIO, (c) => String(c.ts)).sort((x, y) => x.ts - y.ts),
    SORTIES: reunir(vieux.SORTIES, recent.SORTIES, (s) => `${s.d}|${s.s ?? ""}|${s.km}|${s.sec}`).sort((x, y) => x.d.localeCompare(y.d)),
    ts: Math.max(a.ts || 0, b.ts || 0),
  };
}
