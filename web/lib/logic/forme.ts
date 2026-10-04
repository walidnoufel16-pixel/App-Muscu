/* Forme du jour et zones sensibles. Logique pure.
   - Forme : trois réponses avant la séance (sommeil, énergie, courbatures) donnent
     un niveau de −2 à +1, qui ajuste la charge proposée et l'explique.
   - Zones sensibles : les gênes déclarées au questionnaire (A.blessure) et la douleur
     signalée aujourd'hui marquent les exercices à ménager. */
import { EX } from "@/lib/data/exercices";
import { BLESN } from "@/lib/data/referentiels";
import type { Exercice } from "@/lib/data/types";
import type { Reponses } from "./types";

export type Forme = { d: string; sommeil: number; energie: number; courbatures: number; douleur?: number[] };
/* 0 = mauvais, 1 = moyen, 2 = bon (courbatures : 0 = fortes, 2 = aucune) */
export const QUESTIONS_FORME = [
  { k: "sommeil", q: "Sommeil", o: ["Mauvais", "Moyen", "Bon"] },
  { k: "energie", q: "Énergie", o: ["À plat", "Correcte", "En forme"] },
  { k: "courbatures", q: "Courbatures", o: ["Fortes", "Légères", "Aucune"] },
] as const;

const deux = (n: number) => String(n).padStart(2, "0");
const aujourdhui = (t = Date.now()) => { const d = new Date(t); return `${d.getFullYear()}-${deux(d.getMonth() + 1)}-${deux(d.getDate())}`; };

/** Forme saisie aujourd'hui, ou null. */
export function formeDuJour(A: Reponses, t = Date.now()): Forme | null {
  const f = A.forme as Forme | undefined;
  return f && f.d === aujourdhui(t) ? f : null;
}

/** Niveau de forme : −2 (très fatigué) à +1 (grande forme). */
export function niveau(f: Forme) {
  const v = (x: number) => (x === 0 ? -1 : x === 1 ? 0 : 0.5);
  const s = v(f.sommeil) + v(f.energie) + (f.courbatures === 0 ? -1 : f.courbatures === 1 ? -0.25 : 0);
  return s <= -2 ? -2 : s <= -0.75 ? -1 : s >= 1 ? 1 : 0;
}
export const NOMS_NIVEAU: Record<number, string> = { [-2]: "basse", [-1]: "un peu basse", 0: "normale", 1: "excellente" };

/* ---------------- zones sensibles ---------------- */
/* Par zone (index de BLESN) : exercices qui la sollicitent le plus, repérés par leur nom. */
const RISQUES: RegExp[] = [
  /développé (militaire|nuque|assis barre|épaules)|dips|tirage menton|arnold|press barre|push press|snatch|arraché/i,
  /soulevé de terre|good morning|squat barre|rowing barre|front squat|hip thrust barre|kettlebell swing|swing/i,
  /fente|squat|sauté|leg extension|pistol|bulgare|step|box jump|burpee|saut/i,
  /barre au front|skull|curl barre|dips|pompes|front squat|extension nuque|tirage poignet/i,
];
export const nomZone = (z: number) => BLESN[z] || "";

/** Zones à ménager : déclarées (sauf « rien à signaler ») et douleur du jour. */
export function zonesActives(A: Reponses, t = Date.now()): number[] {
  const z = new Set((A.blessure || []).filter((i) => i >= 0 && i < RISQUES.length));
  for (const i of formeDuJour(A, t)?.douleur || []) z.add(i);
  return [...z].sort();
}
/** Zones sensibles qu'un exercice sollicite. */
export const zonesDe = (id: string, zones: number[]) => (EX[id] ? zones.filter((z) => RISQUES[z].test(EX[id].n)) : []);

/* ---------------- ajustement de la charge ---------------- */
export type Base = { v: number; reps: number };
/** Ajuste la charge de départ selon la forme et la douleur du jour. Renvoie la base et l'explication à ajouter. */
export function ajuster(x: Exercice, base: Base, pas: number, f: Forme | null, douleurIci: boolean): { base: Base; texte?: string } {
  const charge = x.ch === "kg" || x.ch === "lest";
  if (!f && !douleurIci) return { base };
  const n = f ? niveau(f) : 0;
  let moins = n <= -2 ? 2 : n === -1 ? 1 : 0;
  if (douleurIci) moins = Math.max(moins, 1);
  if (moins && charge && base.v > 0) {
    const v = Math.max(0, Math.round((base.v - moins * pas) * 10) / 10);
    const pourquoi = douleurIci && !(n < 0) ? "zone douloureuse aujourd'hui" : `forme du jour ${NOMS_NIVEAU[n]}`;
    return { base: { ...base, v }, texte: `${pourquoi[0].toUpperCase() + pourquoi.slice(1)} : −${String(moins * pas).replace(".", ",")} kg sur la charge prévue.` };
  }
  if (moins && !charge && x.ch === "aucune" && base.v > 2) {
    return { base: { ...base, v: base.v - moins }, texte: `Forme du jour ${NOMS_NIVEAU[n]} : ${moins} répétition${moins > 1 ? "s" : ""} de moins.` };
  }
  if (n === 1 && charge) return { base, texte: `Grande forme : si la première série sort facile, ajoute ${String(pas).replace(".", ",")} kg.` };
  if (n < 0) return { base, texte: `Forme du jour ${NOMS_NIVEAU[n]} : garde 2 ou 3 répétitions en réserve.` };
  return { base };
}
