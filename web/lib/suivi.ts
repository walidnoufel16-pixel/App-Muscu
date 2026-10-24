"use client";

/* Tient l'historique (HIST) à jour pendant qu'on s'entraîne : dès qu'une série
   est validée ou retirée, la ligne du jour de cette séance est recalculée.
   Le journal est produit par immer : une ligne inchangée garde la même
   référence, la comparaison est donc instantanée. */
import { useRepere } from "@/lib/store";
import { useCelebrer, seanceDe } from "@/lib/celebrer";
import { okDe } from "@/lib/logic/core";
import { inscrire, jourDe, joursSeance, ligneDe } from "@/lib/logic/historique";
import { formeDuJour, niveau } from "@/lib/logic/forme";
import { cloturerSeance } from "@/lib/logic/actions";
import type { Journal } from "@/lib/logic/types";

const valides = (L?: Journal) => (L?.series || []).filter((s) => okDe(L!, s)).length + (L?.done ? 0.5 : 0);

let branche = false;
export function suivreHistorique() {
  if (branche) return;
  branche = true;
  useRepere.subscribe((st, avant) => {
    const LOG = st.etat.LOG, LOG0 = avant.etat.LOG;
    if (LOG === LOG0 || !st.pret || !avant.pret) return;
    /* état remplacé en entier (chargement, compte synchronisé, changement de compte) : rien à noter */
    if (st.etat.HIST !== avant.etat.HIST) return;
    const auj = jourDe(Date.now()), touchees = new Map<string, string>();
    /* le jour de la séance, pas forcément aujourd'hui : une séance finie après minuit garde son jour */
    for (const k in LOG) if (LOG[k] !== LOG0[k] && valides(LOG[k]) !== valides(LOG0[k]) && jourDe(LOG[k]?.ts || 0) === auj) touchees.set(seanceDe(k), joursSeance(st.etat, seanceDe(k))[k] || auj);
    for (const k in LOG0) if (!(k in LOG) && jourDe(LOG0[k]?.ts || 0) === auj && !touchees.has(seanceDe(k))) touchees.set(seanceDe(k), joursSeance(avant.etat, seanceDe(k))[k] || auj);
    if (!touchees.size) return;
    /* après la mutation en cours (et le record éventuellement compté juste après) */
    queueMicrotask(() => {
      const c = useCelebrer.getState();
      useRepere.getState().muter((E) => {
        let H = E.HIST || [];
        const f = formeDuJour(E.A);
        for (const [s, d] of touchees) {
          const debut = c.debut[s], ancienne = H.find((l) => l.d === d && l.s === s);
          /* une séance reprise plus tard (après minuit) garde sa durée et sa forme du jour */
          const min = d !== auj ? ancienne?.min : debut ? Math.max(1, Math.round((Date.now() - debut) / 60000)) : undefined;
          const fo = d !== auj ? ancienne?.fo : f ? niveau(f) : undefined;
          H = inscrire(H, d, s, ligneDe(E, s, d, {
            ...(c.records[s] ? { rec: c.records[s] } : ancienne?.rec ? { rec: ancienne.rec } : {}),
            ...(fo != null ? { fo } : {}),
            ...(min ? { min } : {}),
          }));
        }
        E.HIST = H;
      });
    });
  });
}

/* « Ajouter à mon suivi » : la séance libre i est rangée dans Progrès et repart vierge. */
export function ajouterAuSuivi(i: number) {
  useRepere.getState().muter((E) => cloturerSeance(E, i));
  useCelebrer.getState().oublier("L|" + i);
}
