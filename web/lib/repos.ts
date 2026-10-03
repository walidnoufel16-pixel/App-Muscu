"use client";

/* Minuteur de repos, calé sur une heure de fin : juste même après un passage
   en arrière-plan. Le son est préparé au moment où l'on coche (iOS n'autorise
   l'audio qu'après un geste) et programmé pour la fin du repos. */
import { create } from "zustand";

type Repos = {
  fin: number | null;
  total: number;
  fini: boolean;
  lancer: (sec: number) => void;
  ajuster: (d: number) => void;
  arreter: () => void;
  terminer: () => void;
};

let ac: AudioContext | null = null;
let sons: OscillatorNode[] = [];
function programmerBip(fin: number) {
  if (!ac) return;
  try {
    sons.forEach((o) => { try { o.stop(); } catch {} });
    const t0 = ac.currentTime + Math.max(0, (fin - Date.now()) / 1000);
    sons = [0, 0.22].map((d, i) => {
      const o = ac!.createOscillator(), g = ac!.createGain();
      o.frequency.value = i ? 1320 : 880;
      g.gain.setValueAtTime(0, t0 + d);
      g.gain.linearRampToValueAtTime(0.25, t0 + d + 0.02);
      g.gain.exponentialRampToValueAtTime(0.001, t0 + d + 0.18);
      o.connect(g).connect(ac!.destination);
      o.start(t0 + d);
      o.stop(t0 + d + 0.2);
      return o;
    });
  } catch {}
}
const couper = () => { sons.forEach((o) => { try { o.stop(); } catch {} }); sons = []; };

export const useRepos = create<Repos>((set, get) => ({
  fin: null,
  total: 0,
  fini: false,
  lancer(sec) {
    try {
      const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AC) { ac = ac || new AC(); ac.resume?.(); }
    } catch {}
    const fin = Date.now() + sec * 1000;
    set({ fin, total: sec, fini: false });
    programmerBip(fin);
  },
  ajuster(d) {
    const { fin, total } = get();
    if (!fin) return;
    const f = Math.max(Date.now(), fin + d * 1000);
    set({ fin: f, total: Math.max(total + d, 1) });
    programmerBip(f);
  },
  arreter() { couper(); set({ fin: null, fini: false }); },
  terminer() {
    try { navigator.vibrate?.([180, 90, 180]); } catch {}
    set({ fin: null, fini: true });
    setTimeout(() => { if (!get().fin) set({ fini: false }); }, 2600);
  },
}));

/* Petite vibration au toucher, là où le navigateur le permet. */
export const tactile = (ms = 8) => { try { navigator.vibrate?.(ms); } catch {} };
