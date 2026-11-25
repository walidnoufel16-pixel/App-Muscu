/* Deux modes, une seule app (docs/produit/mode-suivi/cahier-des-charges.md).
   - Suivi : on note ses séances, comme dans un carnet, sans questionnaire ni séance proposée. Oxa
     propose la charge suivante comme en Guidé (décision du 26 novembre), sans demander le ressenti
     ni conseiller d'effort (RPE).
   - Guidé : le parcours d'Oxa (profil sportif, séances préparées selon la récup et le matériel).
   Le réglage vit dans les réponses (A.mode) : il suit le compte, et changer de mode ne perd rien.
   Logique pure, sans interface. */
import { dateDe, decaler, type LigneHist } from "./historique";
import type { Etat, Reponses } from "./types";
import { EX } from "@/lib/data/exercices";

export type Mode = "suivi" | "guide";

/** Le mode du compte ; « guide » par défaut (comptes d'avant le réglage compris). */
export const modeDe = (A: Pick<Reponses, "mode"> | undefined): Mode => (A?.mode === "suivi" ? "suivi" : "guide");
export const enSuivi = (E: Pick<Etat, "A">) => modeDe(E.A) === "suivi";

/** Le mode demandé par un lien (?mode=suivi ou ?mode=guide), sinon null. */
export function modeDuLien(recherche: string): Mode | null {
  const m = new URLSearchParams(recherche).get("mode")?.toLowerCase();
  return m === "suivi" ? "suivi" : m === "guide" || m === "guidé" || m === "guidee" ? "guide" : null;
}

/** Les séances de « Mes séances » qu'on note en mode Suivi : musculation à soi (ni soin, ni street,
    ni séance d'Oxa non gardée). */
export function seancesSuivies(E: Pick<Etat, "SEANCES">): number[] {
  return E.SEANCES.map((_, i) => i).filter((i) => { const s = E.SEANCES[i]; return !!s && !s.soin && !s.street && !s.auto; });
}

/** La dernière ligne de Progrès d'une séance libre (index i), la plus récente d'abord. */
export function derniereLigne(H: LigneHist[] | undefined, i: number): LigneHist | null {
  let best: LigneHist | null = null;
  for (const l of H || []) if (l.s === `L|${i}` && (!best || l.d > best.d || (l.d === best.d && (l.ts || 0) > (best.ts || 0)))) best = l;
  return best;
}

/** « Dernière fois » d'une séance : le jour, et le premier exercice à charge de la séance tel qu'il a
    été fait (charge × répétitions de la meilleure série). */
export type DerniereFois = { d: string; ex?: { id: string; v: number; reps: number } };
export function derniereFois(E: Pick<Etat, "SEANCES" | "HIST">, i: number): DerniereFois | null {
  const l = derniereLigne(E.HIST, i), s = E.SEANCES[i];
  if (!l) return null;
  const ids = [...(s?.ex.map((e) => e.id) || []), ...Object.keys(l.ex || {})];
  const id = ids.find((x) => EX[x]?.ch === "kg" && l.ex?.[x] && l.ex[x][2] > 0);
  return id ? { d: l.d, ex: { id, v: l.ex[id][2], reps: l.ex[id][3] } } : { d: l.d };
}

/** La séance à proposer en premier (« Commencer ») : une jamais faite, dans l'ordre de la liste,
    sinon celle faite il y a le plus longtemps (on tourne dans ses séances, comme dans un carnet). */
export function prochaineSeance(E: Pick<Etat, "SEANCES" | "HIST">, liste = seancesSuivies(E as Etat)): number | null {
  if (!liste.length) return null;
  const jamais = liste.find((i) => !derniereLigne(E.HIST, i));
  if (jamais !== undefined) return jamais;
  return [...liste].sort((a, b) => (derniereLigne(E.HIST, a)!.d).localeCompare(derniereLigne(E.HIST, b)!.d))[0];
}

/** Le jour d'une séance passée dit simplement : aujourd'hui, hier, le nom du jour dans la semaine
    écoulée, sinon null (l'appelant écrit la date). */
export function quandRelatif(d: string, auj: string): "auj" | "hier" | number | null {
  if (d === auj) return "auj";
  if (d === decaler(auj, -1)) return "hier";
  if (d >= decaler(auj, -6) && d < auj) return dateDe(d).getDay(); // 0 dimanche … 6 samedi
  return null;
}

/** Admin : comptes par mode, et part de ceux qui ont fait au moins une séance. */
export function parMode<T extends { etat: Partial<Etat> }>(L: T[], aFait: (c: T) => boolean) {
  return (["suivi", "guide"] as Mode[]).map((m) => {
    const l = L.filter((c) => modeDe(c.etat.A) === m), f = l.filter(aFait).length;
    return { m, comptes: l.length, avecSeance: f, part: l.length ? Math.round((f / l.length) * 100) : 0 };
  });
}
