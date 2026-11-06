/* Bilan de la semaine écoulée (lundi → dimanche), affiché le lundi et le mardi en tête de Progrès.
   Logique pure : séances faites sur l'objectif, séries par grand muscle comparées à la cible du
   niveau, records de la semaine, et un seul conseil (le grand muscle le moins travaillé). */
import { decaler, lundiDe, records, seriesParMuscle, type LigneHist, type Record_ } from "./historique";
import { cibleNiveau } from "./recommandation";
import type { Reponses } from "./types";

export const GRANDS_MUSCLES = ["pec", "dos", "epa", "qua", "isc", "bic", "tri"] as const;

export type BilanSemaine = {
  lundi: string; dimanche: string;
  seances: number; objectif: number; tenu: boolean;
  parMuscle: { k: string; n: number }[];
  cible: number;
  records: Record_[];
  plusTravaille: { k: string; n: number } | null;
  aTravailler: { k: string; n: number } | null;
  protJours: number | null; // null : protéines pas notées cette semaine (on n'affiche rien)
};

/** Le bilan de la semaine qui précède `auj`, ou null si elle est vide. */
export function bilanSemaine(H: LigneHist[], A: Reponses, auj: string, objProt?: number): BilanSemaine | null {
  const lundi = decaler(lundiDe(auj), -7), dimanche = decaler(lundi, 6);
  const lignes = H.filter((l) => l.d >= lundi && l.d <= dimanche);
  if (!lignes.length) return null;
  const seances = new Set(lignes.map((l) => l.d + "|" + l.s)).size;
  const objectif = typeof A.objHebdo === "number" && A.objHebdo > 0 ? A.objHebdo : 3;
  const s = seriesParMuscle(H, lundi, dimanche);
  const parMuscle = GRANDS_MUSCLES.map((k) => ({ k, n: Math.round((s[k] || 0) * 10) / 10 }));
  const cible = cibleNiveau(A.regularite == null ? undefined : A.regularite <= 1 ? 1 : A.regularite);
  const tri = [...parMuscle].sort((a, b) => b.n - a.n);
  const faible = tri.at(-1)!;
  const prot = (A.prot || {}) as Record<string, number>;
  const notes = Object.keys(prot).filter((d) => d >= lundi && d <= dimanche);
  return {
    lundi, dimanche, seances, objectif, tenu: seances >= objectif,
    parMuscle, cible,
    records: records(H).filter((r) => r.d >= lundi && r.d <= dimanche),
    plusTravaille: tri[0].n > 0 ? tri[0] : null,
    aTravailler: faible.n < cible / 2 ? faible : null,
    protJours: notes.length && objProt ? notes.filter((d) => prot[d] >= objProt * 0.9).length : null,
  };
}

/** Visible le lundi et le mardi. */
export const jourDuBilan = (auj: string) => { const j = new Date(auj + "T12:00").getDay(); return j === 1 || j === 2; };
