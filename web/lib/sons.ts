"use client";

/* Bips programmés à l'avance sur l'horloge audio : ils tombent juste même si
   l'écran saccade. iOS n'autorise le son qu'après un geste : `preparer()` est
   appelé au toucher (cocher une série, démarrer une séance). Chaque « canal »
   (repos, cardio) peut être reprogrammé ou coupé sans toucher aux autres. */

let ac: AudioContext | null = null;
const canaux: Record<string, OscillatorNode[]> = {};

export function preparer() {
  try {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (AC) { ac = ac || new AC(); ac.resume?.(); }
  } catch {}
}

export type Bip = { dans: number; f: number; d?: number; v?: number }; // dans : secondes à partir de maintenant

export function couper(canal: string) {
  (canaux[canal] || []).forEach((o) => { try { o.stop(); } catch {} });
  canaux[canal] = [];
}

/** Remplace les bips du canal par ceux-ci. */
export function programmer(canal: string, bips: Bip[]) {
  couper(canal);
  if (!ac) return;
  try {
    const t0 = ac.currentTime;
    canaux[canal] = bips.filter((b) => b.dans >= 0).map((b) => {
      const o = ac!.createOscillator(), g = ac!.createGain(), t = t0 + b.dans, d = b.d ?? 0.18;
      o.frequency.value = b.f;
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(b.v ?? 0.25, t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.001, t + d);
      o.connect(g).connect(ac!.destination);
      o.start(t);
      o.stop(t + d + 0.02);
      return o;
    });
  } catch {}
}

/* Signal de fin : deux notes montantes. */
export const fin = (dans: number): Bip[] => [{ dans, f: 880 }, { dans: dans + 0.22, f: 1320 }];
/* Décompte 3-2-1 avant un instant donné. */
export const decompte = (dans: number): Bip[] => [3, 2, 1].map((k) => ({ dans: dans - k, f: 660, d: 0.09, v: 0.16 }));
