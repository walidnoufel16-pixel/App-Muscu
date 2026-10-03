"use client";

/* Moments forts d'une séance : exercice terminé, record, bilan final.
   État éphémère, jamais enregistré : il ne sert qu'aux animations. */
import { create } from "zustand";
import type { Bilan } from "@/lib/logic/records";

/* Le bilan d'une séance de musculation, ou des cases au choix (cardio). */
export type CaseBilan = { n: string; v: number; accent?: boolean };
export type BilanAffiche = (Bilan & { titre: string; cases?: undefined }) | { titre: string; cases: CaseBilan[] };

/* Séance d'une ligne du journal : « semaine|séance » pour le plan, « L|i » pour une séance libre. */
export const seanceDe = (k: string) => k.split("|").slice(0, 2).join("|");

type Celebrer = {
  fini: string | null; // ligne qui vient d'être terminée (coche dessinée)
  records: Record<string, number>; // records battus, par séance
  debut: Record<string, number>; // première série validée, par séance
  bilan: BilanAffiche | null;
  marquerDebut: (seance: string) => void;
  ajouterRecord: (seance: string) => void;
  terminer: (k: string) => void;
  montrerBilan: (b: BilanAffiche) => void;
  fermerBilan: () => void;
};

export const useCelebrer = create<Celebrer>((set, get) => ({
  fini: null,
  records: {},
  debut: {},
  bilan: null,
  marquerDebut(s) { if (!get().debut[s]) set({ debut: { ...get().debut, [s]: Date.now() } }); },
  ajouterRecord(s) { set({ records: { ...get().records, [s]: (get().records[s] || 0) + 1 } }); },
  terminer(k) {
    set({ fini: k });
    setTimeout(() => { if (get().fini === k) set({ fini: null }); }, 1600);
  },
  montrerBilan(b) { set({ bilan: b }); },
  fermerBilan() { set({ bilan: null }); },
}));

export const mouvementReduit = () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* Gerbe de petits disques jaunes et gris depuis un point de l'écran (record battu). */
export function gerbe(x: number, y: number) {
  if (mouvementReduit()) return;
  const c = document.createElement("canvas"), dpr = Math.min(2, window.devicePixelRatio || 1);
  c.width = innerWidth * dpr; c.height = innerHeight * dpr;
  c.style.cssText = "position:fixed;inset:0;width:100vw;height:100vh;pointer-events:none;z-index:90";
  document.body.appendChild(c);
  const g = c.getContext("2d")!;
  g.scale(dpr, dpr);
  const css = getComputedStyle(document.documentElement);
  const couleurs = [css.getPropertyValue("--plate").trim() || "#f5c94a", css.getPropertyValue("--plate").trim() || "#f5c94a", css.getPropertyValue("--foreground").trim() || "#18181b"];
  const P = Array.from({ length: 34 }, (_, i) => {
    const a = -Math.PI / 2 + (Math.random() - 0.5) * 2.2, v = 5 + Math.random() * 7;
    return { x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, r: 2.5 + Math.random() * 3.5, c: couleurs[i % 3], rot: Math.random() * 6 };
  });
  const t0 = performance.now();
  const pas = (t: number) => {
    const e = (t - t0) / 900;
    g.clearRect(0, 0, innerWidth, innerHeight);
    if (e >= 1) { c.remove(); return; }
    g.globalAlpha = 1 - e * e;
    for (const p of P) {
      p.vy += 0.32; p.vx *= 0.985; p.x += p.vx; p.y += p.vy; p.rot += 0.2;
      g.fillStyle = p.c;
      // disque de fonte vu de biais : une ellipse qui tourne
      g.beginPath(); g.ellipse(p.x, p.y, p.r, p.r * Math.abs(Math.cos(p.rot)) + 0.8, 0, 0, Math.PI * 2); g.fill();
    }
    requestAnimationFrame(pas);
  };
  requestAnimationFrame(pas);
}
