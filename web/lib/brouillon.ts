"use client";

/* État d'interface partagé entre écrans, non enregistré : la séance en cours
   de composition et le filtre de matériel choisi dans la bibliothèque. */
import { create } from "zustand";
import type { SeanceLibre } from "@/lib/logic/types";

export type Brouillon = SeanceLibre & { idx: number | null };

type B = {
  libre: Brouillon | null;
  sel: string[] | null; // null : matériel déclaré
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
