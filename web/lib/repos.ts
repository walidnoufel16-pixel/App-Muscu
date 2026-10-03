"use client";

/* Minuteur de repos, calé sur une heure de fin : juste même après un passage
   en arrière-plan. Le son est préparé au moment où l'on coche (iOS n'autorise
   l'audio qu'après un geste) et programmé pour la fin du repos. */
import { create } from "zustand";
import { couper, fin as sonFin, preparer, programmer } from "./sons";

type Repos = {
  fin: number | null;
  total: number;
  fini: boolean;
  lancer: (sec: number) => void;
  ajuster: (d: number) => void;
  arreter: () => void;
  terminer: () => void;
};

const bipFin = (fin: number) => programmer("repos", sonFin(Math.max(0, (fin - Date.now()) / 1000)));

export const useRepos = create<Repos>((set, get) => ({
  fin: null,
  total: 0,
  fini: false,
  lancer(sec) {
    preparer();
    const fin = Date.now() + sec * 1000;
    set({ fin, total: sec, fini: false });
    bipFin(fin);
  },
  ajuster(d) {
    const { fin, total } = get();
    if (!fin) return;
    const f = Math.max(Date.now(), fin + d * 1000);
    set({ fin: f, total: Math.max(total + d, 1) });
    bipFin(f);
  },
  arreter() { couper("repos"); set({ fin: null, fini: false }); },
  terminer() {
    try { navigator.vibrate?.([180, 90, 180]); } catch {}
    set({ fin: null, fini: true });
    setTimeout(() => { if (!get().fin) set({ fini: false }); }, 2600);
  },
}));

/* Petite vibration au toucher, là où le navigateur le permet. */
export const tactile = (ms = 8) => { try { navigator.vibrate?.(ms); } catch {} };
