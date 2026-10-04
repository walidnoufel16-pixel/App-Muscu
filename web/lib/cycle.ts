"use client";

/* Option cycle menstruel. Donnée de santé sensible : elle reste UNIQUEMENT sur ce
   téléphone (clé localStorage à part), elle n'est jamais envoyée au serveur. */
import { create } from "zustand";
import { dateDe, jourDe } from "@/lib/logic/historique";

export const CKEY = "repere.cycle.v1";
export type Cycle = { actif: boolean; debut: string; duree: number };

function lire(): Cycle | null {
  try { const c = JSON.parse(localStorage.getItem(CKEY) || "null"); return c && typeof c.debut === "string" ? c : null; } catch { return null; }
}
export const useCycle = create<{ c: Cycle | null; charger: () => void; ecrire: (c: Cycle | null) => void }>((set) => ({
  c: null,
  charger() { set({ c: lire() }); },
  ecrire(c) {
    try { if (c) localStorage.setItem(CKEY, JSON.stringify(c)); else localStorage.removeItem(CKEY); } catch {}
    set({ c });
  },
}));

export type Phase = { jour: number; nom: string; conseil: string; leger: boolean };
/** Phase du jour, déduite de la date des dernières règles et de la durée moyenne du cycle. */
export function phaseDe(c: Cycle, auj = jourDe(Date.now())): Phase | null {
  const n = Math.round((dateDe(auj).getTime() - dateDe(c.debut).getTime()) / 864e5);
  if (n < 0 || c.duree < 20 || c.duree > 45) return null;
  const jour = (n % c.duree) + 1, ov = c.duree - 14;
  if (jour <= 5) return { jour, nom: "Règles", leger: jour <= 2, conseil: "Si l'énergie manque, garde une ou deux répétitions de plus en réserve ; sinon, entraîne-toi normalement." };
  if (jour < ov - 1) return { jour, nom: "Phase folliculaire", leger: false, conseil: "Souvent une bonne période pour viser des records et monter les charges." };
  if (jour <= ov + 1) return { jour, nom: "Ovulation", leger: false, conseil: "Force souvent au rendez-vous. Soigne l'échauffement des genoux sur les sauts et les fentes." };
  if (jour > c.duree - 5) return { jour, nom: "Fin de phase lutéale", leger: true, conseil: "Fatigue et rétention d'eau sont fréquentes : une séance un peu plus légère reste une bonne séance." };
  return { jour, nom: "Phase lutéale", leger: false, conseil: "Hydrate-toi bien ; le ressenti de l'effort peut être un peu plus élevé." };
}
