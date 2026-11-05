"use client";

/* État d'interface partagé entre écrans, non enregistré : la séance en cours
   de composition et le filtre de matériel choisi dans la bibliothèque. */
import { create } from "zustand";
import type { SeanceLibre } from "@/lib/logic/types";

/* agenda : modification lancée depuis « Mon agenda » (jour et séance programmée concernés) */
export type Brouillon = SeanceLibre & { idx: number | null; agenda?: { d: string; id?: string } };

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
