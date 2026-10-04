"use client";

/* Tient l'historique (HIST) à jour pendant qu'on s'entraîne : dès qu'une série
   est validée ou retirée, la ligne du jour de cette séance est recalculée.
   Le journal est produit par immer : une ligne inchangée garde la même
   référence, la comparaison est donc instantanée. */
import { useRepere } from "@/lib/store";
import { useCelebrer, seanceDe } from "@/lib/celebrer";
import { okDe } from "@/lib/logic/core";
import { inscrire, jourDe, ligneDe } from "@/lib/logic/historique";
import type { Journal } from "@/lib/logic/types";

const valides = (L?: Journal) => (L?.series || []).filter((s) => okDe(L!, s)).length + (L?.done ? 0.5 : 0);

let branche = false;
export function suivreHistorique() {
  if (branche) return;
  branche = true;
  useRepere.subscribe((st, avant) => {
    const LOG = st.etat.LOG, LOG0 = avant.etat.LOG;
    if (LOG === LOG0 || !st.pret || !avant.pret) return;
    const auj = jourDe(Date.now()), touchees = new Set<string>();
    for (const k in LOG) if (LOG[k] !== LOG0[k] && valides(LOG[k]) !== valides(LOG0[k]) && jourDe(LOG[k]?.ts || 0) === auj) touchees.add(seanceDe(k));
    for (const k in LOG0) if (!(k in LOG) && jourDe(LOG0[k]?.ts || 0) === auj) touchees.add(seanceDe(k));
    if (!touchees.size) return;
    /* après la mutation en cours (et le record éventuellement compté juste après) */
    queueMicrotask(() => {
      const c = useCelebrer.getState();
      useRepere.getState().muter((E) => {
        let H = E.HIST || [];
        for (const s of touchees) {
          const debut = c.debut[s];
          H = inscrire(H, auj, s, ligneDe(E, s, auj, {
            ...(c.records[s] ? { rec: c.records[s] } : {}),
            ...(debut ? { min: Math.max(1, Math.round((Date.now() - debut) / 60000)) } : {}),
          }));
        }
        E.HIST = H;
      });
    });
  });
}
