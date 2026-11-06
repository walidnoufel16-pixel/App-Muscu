/* Fusion de deux sauvegardes du même compte (deux appareils). Ce qui a été FAIT ne se perd
   jamais : l'historique des séances, le journal des séries, le cardio, les sorties de course,
   les tests et les produits sont réunis des deux côtés. Les réglages et les séances
   enregistrées (qui se modifient plutôt qu'ils ne s'ajoutent) viennent de la sauvegarde la
   plus récente. */
import type { Etat, Journal } from "./types";
import { ECART_SEANCE, jourDe } from "./historique";

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

/* Séances retirées : « jour|séance » → moment du retrait (ancien format sans moment : pour toujours). */
function tombes(R: string[]) {
  const m = new Map<string, number>();
  for (const r of R) {
    if (r.startsWith("c|")) continue;
    const [k, t] = r.split("@"), q = t ? +t : Infinity;
    m.set(k, Math.max(m.get(k) ?? 0, q));
  }
  return m;
}

/** La sauvegarde fusionnée ; `ts` est celui de la plus récente des deux. */
export function fusionner(a: Sauvegarde, b: Sauvegarde): Sauvegarde {
  const [vieux, recent] = (a.ts || 0) <= (b.ts || 0) ? [a, b] : [b, a];
  /* une séance retirée (ou arrêtée) ne revient pas par l'autre appareil ; refaite après, elle reste.
     On écarte avant de réunir : une ancienne version plus fournie ne doit pas évincer la nouvelle. */
  const T = tombes([...(vieux.RETIRES || []), ...(recent.RETIRES || [])]);
  const retiree = (d: string, s: string, ts = 0) => { const t = T.get(`${d}|${s}`); return t != null && ts <= t; };
  const vivant = ([k, j]: [string, Journal]) => {
    const s = k.split("|").slice(0, 2).join("|"), ts = j?.ts || 0;
    return !ts || !(retiree(jourDe(ts), s, ts) || retiree(jourDe(ts - ECART_SEANCE), s, ts));
  };
  const LOG: Record<string, Journal> = Object.fromEntries(Object.entries(vieux.LOG || {}).filter(vivant));
  for (const [k, j] of Object.entries(recent.LOG || {}).filter(vivant)) LOG[k] = LOG[k] ? meilleurJournal(LOG[k], j) : j;
  const histVivant = (H: Etat["HIST"] = []) => H.filter((l) => !retiree(l.d, l.s, l.ts));
  const A = { ...(vieux.A || {}), ...(recent.A || {}) };
  const tests = reunir(vieux.A?.testsStreet, recent.A?.testsStreet, (t) => t.d);
  if (tests.length) A.testsStreet = tests.sort((x, y) => x.d.localeCompare(y.d)).slice(-12);
  const produits = reunir(vieux.A?.produits, recent.A?.produits, (p) => p.code || `${p.n}|${p.marque ?? ""}`.toLowerCase());
  if (produits.length) A.produits = produits.slice(-30);
  /* une séance retirée de l'historique sur un appareil ne revient pas par l'autre */
  const retires = [...new Set([...(vieux.RETIRES || []), ...(recent.RETIRES || [])])].slice(-300), R = new Set(retires);
  return {
    ...vieux, ...recent, A, LOG,
    RETIRES: retires,
    /* une séance du même jour : la ligne la plus fournie (plus de séries) */
    HIST: reunir(histVivant(vieux.HIST), histVivant(recent.HIST), (l) => `${l.d}|${l.s}`, (x, y) => ((y.ser || 0) >= (x.ser || 0) ? y : x)).sort((x, y) => x.d.localeCompare(y.d)),
    CARDIO: reunir(vieux.CARDIO, recent.CARDIO, (c) => String(c.ts)).filter((c) => !R.has(`c|${c.ts}`)).sort((x, y) => x.ts - y.ts),
    SORTIES: reunir(vieux.SORTIES, recent.SORTIES, (s) => `${s.d}|${s.s ?? ""}|${s.km}|${s.sec}`).sort((x, y) => x.d.localeCompare(y.d)),
    ts: Math.max(a.ts || 0, b.ts || 0),
  };
}
