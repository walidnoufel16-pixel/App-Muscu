/* Actions sur l'état : elles reçoivent un brouillon (immer) et le modifient.
   Port fidèle de serVal, serOk, toutCocher, setFeel, ajouterLest, swap… */
import { journal, key, majJournal, type Ctx } from "./core";
import type { Etat } from "./types";

export type Champ = "v" | "reps" | "lest";

/* Saisie d'une valeur : les séries suivantes pas encore touchées la reprennent. */
export function serVal(E: Etat, c: Ctx, n: number, f: Champ, brut: string) {
  const t = parseFloat(String(brut).replace(",", "."));
  const L = journal(E.LOG, c), sr = L.series[n];
  if (!sr || !Number.isFinite(t)) return;
  const val = f === "reps" ? Math.max(0, Math.round(t)) : Math.max(0, Math.round(t * 10) / 10);
  sr[f] = val;
  if (f === "lest") L.lest = true;
  for (let m = n + 1; m < L.series.length; m++) {
    /* Le lest s'ajoute souvent après coup, séries déjà cochées : on le reporte
       tant que la série suivante n'en a pas reçu un à la main. */
    if (f === "lest" ? L.series[m].tlest : L.series[m].ok || L.series[m].touche) break;
    L.series[m][f] = val;
  }
  if (f === "lest") sr.tlest = true;
  else sr.touche = true;
  majJournal(L);
}

/* Coche ou décoche une série. Renvoie vrai si la série vient d'être validée. */
export function serOk(E: Etat, c: Ctx, n: number) {
  const L = journal(E.LOG, c), sr = L.series[n];
  if (!sr) return false;
  sr.ok = !sr.ok;
  majJournal(L);
  return !!sr.ok;
}

export function toutCocher(E: Etat, c: Ctx) {
  const L = journal(E.LOG, c), tous = L.series.every((s) => s.ok);
  L.series.forEach((s) => (s.ok = !tous));
  majJournal(L);
}

export function setFeel(E: Etat, k: string, j: number) {
  const L = E.LOG[k];
  if (!L) return;
  L.feel = L.feel === j ? null : j;
  L.ts = Date.now();
}

export function ajouterLest(E: Etat, c: Ctx) {
  const L = journal(E.LOG, c);
  L.lest = true;
  L.series.forEach((s) => { if (s.lest === undefined) s.lest = 0; });
  L.ts = Date.now();
}
export function retirerLest(E: Etat, c: Ctx) {
  const L = journal(E.LOG, c);
  L.lest = false;
  L.series.forEach((s) => { delete s.lest; });
  L.ts = Date.now();
}

/* Remplacement d'un exercice du plan : pour aujourd'hui, pour toujours, ou retour. */
export function swap(E: Etat, idx: number, newId: string, orig: string, portee: "jour" | "tjs" | "reset") {
  const k = key(E.wk, E.day, idx), perm = E.day + "|" + idx;
  if (portee === "reset" || newId === orig) { delete E.SWAP[k]; delete E.SWAPP[perm]; }
  else if (portee === "tjs") { E.SWAPP[perm] = newId; delete E.SWAP[k]; }
  else E.SWAP[k] = newId;
  delete E.LOG[k];
}

/* Suppression d'une séance libre : l'historique des suivantes est recalé. */
export function supprimerSeance(E: Etat, i: number) {
  Object.keys(E.LOG).filter((k) => k.startsWith("L|" + i + "|")).forEach((k) => delete E.LOG[k]);
  for (let j = i + 1; j < E.SEANCES.length; j++)
    Object.keys(E.LOG).filter((k) => k.startsWith("L|" + j + "|")).forEach((k) => {
      E.LOG["L|" + (j - 1) + "|" + k.split("|")[2]] = E.LOG[k];
      delete E.LOG[k];
    });
  E.SEANCES.splice(i, 1);
}
