/* Les autres activités qu'on peut déclarer dans l'agenda (foot, padel, vélo…) et les muscles
   qu'elles sollicitent : Oxa les compte comme pas prêts le temps qu'ils récupèrent. */
import { tr } from "@/lib/i18n";
import type { MuscleRecup } from "@/lib/logic/recommandation";

export type SportActivite = { id: string; n: () => string; e: string; m: MuscleRecup[]; /* index dans SPORTS (questionnaire) */ q?: number };

export const ACTIVITES: SportActivite[] = [
  { id: "foot", n: () => tr("Foot"), e: "⚽", m: ["qua", "isc", "mol", "add"], q: 4 },
  { id: "raquette", n: () => tr("Padel / tennis"), e: "🎾", m: ["qua", "mol", "epa"], q: 5 },
  { id: "combat", n: () => tr("Boxe / combat"), e: "🥊", m: ["epa", "qua", "abd"], q: 6 },
  { id: "escalade", n: () => tr("Escalade"), e: "🧗", m: ["dos", "bic", "avb"], q: 7 },
  { id: "velo", n: () => tr("Vélo"), e: "🚴", m: ["qua", "isc"], q: 2 },
  { id: "natation", n: () => tr("Natation"), e: "🏊", m: ["dos", "epa"], q: 3 },
  { id: "rando", n: () => tr("Randonnée"), e: "🥾", m: ["qua", "mol"] },
  { id: "danse", n: () => tr("Danse / cours collectif"), e: "💃", m: ["qua", "mol"], q: 8 },
  { id: "autre", n: () => tr("Autre"), e: "＋", m: [] },
];
export const activite = (id: string) => ACTIVITES.find((a) => a.id === id);

/** Jours avant que les muscles soient prêts : tranquille, prêts le lendemain ; normale, deux jours ;
    à fond ou 2 h et plus, trois jours. */
export const joursRecup = (int: number, min: number) => (int === 0 ? 1 : int === 2 || min >= 120 ? 3 : 2);
