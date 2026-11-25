/* Modes Suivi et Guidé (lib/logic/mode.ts, docs/produit/mode-suivi/cahier-des-charges.md). */
import { describe, expect, it } from "vitest";
import { derniereFois, modeDe, modeDuLien, parMode, prochaineSeance, quandRelatif, seancesSuivies } from "@/lib/logic/mode";
import { ctxLibre, journal } from "@/lib/logic/core";
import type { Etat, Journal } from "@/lib/logic/types";
import type { LigneHist, PerfEx } from "@/lib/logic/historique";

const ligne = (d: string, s: string, ex: Record<string, PerfEx>): LigneHist => ({ d, s, nom: "t", vol: 0, ser: 3, ex });
const SEANCES = [
  { nom: "Jambes", ex: [{ id: "sq", s: 4, r: 8, p: "2 min 30" }] },
  { nom: "Pecs", ex: [{ id: "dc", s: 3, r: 10, p: "2 min" }] },
  { nom: "Mobilité", soin: "dos", ex: [{ id: "el", s: 2, r: 12, p: "60 s" }] },
  { nom: "Oxa", auto: true, ex: [{ id: "el", s: 3, r: 12, p: "60 s" }] },
];
const etat = (o: Partial<Etat> = {}) => ({ A: {}, LOG: {}, SWAP: {}, SWAPP: {}, PLAN: null, SEANCES, wk: 0, day: 0, FINI: false, HIST: [], ...o }) as unknown as Etat;

describe("le réglage", () => {
  it("Guidé par défaut (comptes d'avant le réglage), Suivi s'il est choisi", () => {
    expect(modeDe({})).toBe("guide");
    expect(modeDe(undefined)).toBe("guide");
    expect(modeDe({ mode: "suivi" })).toBe("suivi");
    expect(modeDe({ mode: "guide" })).toBe("guide");
  });
  it("lien direct : ?mode=suivi (avec ?src=…) présélectionne le mode Suivi", () => {
    expect(modeDuLien("?mode=suivi&src=tiktok")).toBe("suivi");
    expect(modeDuLien("?src=insta&mode=SUIVI")).toBe("suivi");
    expect(modeDuLien("?mode=guide")).toBe("guide");
    expect(modeDuLien("?src=tiktok")).toBeNull();
    expect(modeDuLien("?mode=coach")).toBeNull();
  });
});

describe("l'accueil du mode Suivi", () => {
  it("Mes séances : ni soin, ni street, ni séance d'Oxa non gardée", () => {
    expect(seancesSuivies(etat())).toEqual([0, 1]);
  });
  it("« Commencer » : une séance jamais faite d'abord, sinon la plus ancienne", () => {
    expect(prochaineSeance(etat())).toBe(0);
    expect(prochaineSeance(etat({ HIST: [ligne("2026-11-20", "L|0", { sq: [0, 0, 80, 10, 4] })] }))).toBe(1);
    expect(prochaineSeance(etat({ HIST: [ligne("2026-11-20", "L|0", {}), ligne("2026-11-23", "L|1", {})] }))).toBe(0);
    expect(prochaineSeance(etat({ SEANCES: [] }))).toBeNull();
  });
  it("« Dernière fois · squat 80 × 10 » : la dernière ligne de la séance, son exercice à charge", () => {
    const E = etat({ HIST: [ligne("2026-11-13", "L|0", { sq: [0, 0, 75, 10, 4] }), ligne("2026-11-20", "L|0", { sq: [0, 0, 80, 10, 4] })] });
    expect(derniereFois(E, 0)).toEqual({ d: "2026-11-20", ex: { id: "sq", v: 80, reps: 10 } });
    expect(derniereFois(E, 1)).toBeNull();
  });
  it("le jour dit simplement : aujourd'hui, hier, le jour de la semaine, puis rien", () => {
    expect(quandRelatif("2026-11-25", "2026-11-25")).toBe("auj");
    expect(quandRelatif("2026-11-24", "2026-11-25")).toBe("hier");
    expect(quandRelatif("2026-11-19", "2026-11-25")).toBe(4); // jeudi
    expect(quandRelatif("2026-11-10", "2026-11-25")).toBeNull();
  });
});

describe("la séance en mode Suivi (décision du 26 novembre)", () => {
  const prev = (series: [number, number][]): Journal => ({ ex: "sq", done: true, feel: null, ts: 1, series: series.map(([v, reps]) => ({ v, reps, ok: true })) });
  const H = [ligne("2026-11-20", "L|0", { sq: [0, 0, 80, 10, 4] })];
  const LOG = { "L|0|a0": { ...prev([[80, 10], [80, 10], [80, 10], [80, 10]]), ts: Date.parse("2026-11-20T18:00") } };
  it("la charge suivante est proposée comme en Guidé, avec son pourquoi", () => {
    const suivi = ctxLibre(etat({ A: { mode: "suivi" }, HIST: H, LOG }), 0, 0)!;
    const guide = ctxLibre(etat({ HIST: H, LOG }), 0, 0)!;
    expect(suivi.base).toEqual(guide.base);
    expect(suivi.why).toBe(guide.why);
    expect(suivi.why).toBeTruthy();
    expect(suivi.base.v).toBeGreaterThanOrEqual(80);
  });
  it("première fois : rien à suivre, la case KG part vide (répétitions de la séance)", () => {
    const suivi = ctxLibre(etat({ A: { mode: "suivi" } }), 0, 0)!;
    expect(suivi).toMatchObject({ base: { v: 0, reps: 8 }, vide: true, prev: null });
    expect(suivi.why).toBeUndefined();
    /* en Guidé, Oxa estime une charge de départ */
    const guide = ctxLibre(etat(), 0, 0)!;
    expect(guide.vide).toBeUndefined();
    expect(guide.base.v).toBeGreaterThan(0);
  });
  it("les cases KG / RÉPS partent de cette proposition", () => {
    const E = etat({ A: { mode: "suivi" }, HIST: H, LOG });
    const c = ctxLibre(E, 0, 0)!;
    const L = journal(E.LOG, c);
    expect(L.series.every((s) => s.v === c.base.v && s.reps === c.base.reps)).toBe(true);
  });
  it("changer de mode ne perd rien : mêmes séances, même historique", () => {
    const E = etat({ HIST: [ligne("2026-11-20", "L|0", { sq: [0, 0, 80, 10, 4] })] });
    const S = etat({ ...E, A: { mode: "suivi" } });
    expect(S.SEANCES).toBe(E.SEANCES);
    expect(S.HIST).toBe(E.HIST);
  });
});

describe("admin", () => {
  it("comptes par mode et part avec au moins une séance", () => {
    const c = (mode: string | undefined, n: number) => ({ etat: { A: mode ? { mode } : {}, HIST: Array.from({ length: n }, () => ligne("2026-11-20", "L|0", {})) } as unknown as Partial<Etat> });
    const L = [c("suivi", 1), c("suivi", 0), c("suivi", 2), c(undefined, 0), c("guide", 3)];
    expect(parMode(L, (x) => (x.etat.HIST?.length ?? 0) > 0)).toEqual([
      { m: "suivi", comptes: 3, avecSeance: 2, part: 67 },
      { m: "guide", comptes: 2, avecSeance: 1, part: 50 },
    ]);
  });
});
