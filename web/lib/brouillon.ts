"use client";

/* État d'interface partagé entre écrans, non enregistré : la séance en cours
   de composition et le filtre de matériel choisi dans la bibliothèque. */
import { create } from "zustand";
import type { Etat, SeanceLibre } from "@/lib/logic/types";
import { seancePour } from "@/lib/logic/generer-seance";
import { avecSalle, selDeclare } from "@/lib/logic/core";

/* agenda : modification lancée depuis « Mon agenda » (jour et séance programmée concernés) */
/* pour : le jour à venir où la séance créée sera programmée (menu du jour, ?jour=) */
export type Brouillon = SeanceLibre & { idx: number | null; agenda?: { d: string; id?: string }; pour?: string; garder?: boolean };

type B = {
  libre: Brouillon | null;
  sel: string[] | null; // null : rien de coché au départ, l'utilisateur choisit
  setLibre: (l: Brouillon | null) => void;
  majLibre: (fn: (l: Brouillon) => void) => void;
  setSel: (s: string[] | null) => void;
};

export const useBrouillon = create<B>((set, get) => ({
  libre: null,
  sel: null,
  setLibre: (libre) => set({ libre }),
  majLibre: (fn) => {
    const l = get().libre;
    if (!l) return;
    const c = structuredClone(l);
    fn(c);
    set({ libre: c });
  },
  setSel: (sel) => set({ sel }),
}));

/* Prépare une séance à partir de muscles conseillés et la place dans le composeur, pour
   ouvrir directement l'aperçu (exercices, séries, charges, « Commencer ») sans repasser
   par le formulaire de l'assistant. Renvoie false s'il n'y a rien à proposer. */
export function preparerApercu(etat: Etat, muscles: string[], nom: string, auj: string) {
  if (!muscles.length) return false;
  const A = etat.A, duree = typeof A.duree === "number" && [30, 45, 60].includes(A.duree) ? A.duree : 45, obj = A.objectif ?? 0;
  const ex = seancePour(etat, muscles, duree, obj, avecSalle(selDeclare(A), A), auj);
  if (!ex.length) return false;
  useBrouillon.getState().setLibre({ nom, ex, obj, gen: { m: [...muscles], d: duree, obj }, idx: null } as Brouillon);
  return true;
}
