/* Charges de départ selon le profil, rythme hebdomadaire et full body débutant : simulation sur
   28 jours en suivant chaque jour la séance conseillée (voir docs/audit/bilan-2026-11-10.md). */
import { describe, expect, it } from "vitest";
import { recoDuJour, etatGroupes, cibleNiveau, GROUPES } from "@/lib/logic/recommandation";
import { construireSeance, hasardDe } from "@/lib/logic/assistant";
import { departProfil, propositionLibre } from "@/lib/logic/core";
import { decaler } from "@/lib/logic/historique";
import { EX } from "@/lib/data/exercices";
import type { LigneHist } from "@/lib/logic/historique";
import type { Etat, Reponses } from "@/lib/logic/types";

const SEL = ["m0", "m1", "m2", "m3", "bt"];
function simuler(niveau: number, hebdo: number, jours = 28) {
  const H: LigneHist[] = [], fait: string[] = [], modeles: string[] = [];
  let maxSemaine = 0;
  const debut = "2026-11-02"; // un lundi
  for (let k = 0; k < jours; k++) {
    const d = decaler(debut, k);
    const r = recoDuJour(H, d, [], niveau, [], { hebdo, jours: fait });
    if (r.type !== "seance") continue;
    const p = r.propositions[0];
    const ex = construireSeance(p.muscles, 45, 0, SEL, hasardDe(d), () => false, niveau);
    H.push({ d, s: "L|0", nom: p.nom, vol: 0, ser: 0, ex: Object.fromEntries(ex.map((e) => [e.id, [20, 0, 0, e.r, e.s]])) });
    fait.push(d); modeles.push(p.id);
    const E = etatGroupes(H, d);
    maxSemaine = Math.max(maxSemaine, ...GROUPES.map((g) => E[g].semaine));
  }
  return { n: fait.length, modeles, maxSemaine, fait };
}

describe("rythme hebdomadaire", () => {
  it("débutant à 3 séances par semaine : 3 séances par semaine, jamais deux jours de suite, full body", () => {
    const s = simuler(1, 3);
    expect(s.n).toBeGreaterThanOrEqual(10);
    expect(s.n).toBeLessThanOrEqual(12);
    expect(new Set(s.modeles)).toEqual(new Set(["full"]));
    for (let i = 1; i < s.fait.length; i++) expect(s.fait[i]).not.toBe(decaler(s.fait[i - 1], 1));
    /* 3 full body de 3 séries par grand muscle, plus le travail indirect compté à moitié (le squat
       pour les fessiers, le développé pour les triceps) : 9 à 14 séries par semaine */
    expect(s.maxSemaine).toBeLessThanOrEqual(2 * cibleNiveau(1));
  });
  it("régulier à 3 séances : full body, haut et bas du corps", () => {
    const s = simuler(2, 3);
    expect(s.n).toBeLessThanOrEqual(12);
    expect(s.modeles.every((m) => ["full", "haut", "bas"].includes(m))).toBe(true);
  });
  it("confirmé à 5 séances : des splits, aucun muscle au-delà d'1,5 fois son volume", () => {
    const s = simuler(3, 5);
    expect(s.n).toBeLessThanOrEqual(20);
    expect(s.modeles.some((m) => ["push", "pull", "jambes"].includes(m))).toBe(true);
    expect(s.maxSemaine).toBeLessThanOrEqual(1.5 * cibleNiveau(3) + 4);
  });
  it("quota atteint : repos, avec une séance « quand même »", () => {
    const r = recoDuJour([], "2026-11-06", [], 2, [], { hebdo: 3, jours: ["2026-11-02", "2026-11-03", "2026-11-04"] });
    expect(r.type).toBe("repos");
    expect(r.pause).toMatch(/3 séances/);
    expect(r.autres?.length).toBeGreaterThan(0);
  });
});

describe("full body débutant", () => {
  it("après « Hier : pecs, triceps », un débutant reçoit un full body sans pecs", async () => {
    const { effortsEndurance } = await import("@/lib/logic/recommandation");
    const r = recoDuJour([], "2026-11-10", [], 1, effortsEndurance([], [], { d: "2026-11-09", m: ["pec", "tri"] }), { hebdo: 3 });
    expect(r.propositions[0].id).toBe("full");
    expect(r.propositions[0].muscles).not.toContain("pec");
    expect(r.propositions[0].raison).toBe("Pecs récupère : retiré de ta séance.");
  });
});

describe("charges de départ", () => {
  const A = (o: Partial<Reponses>) => ({ ...o }) as Reponses;
  it("débutante : soulevé de terre, curl et tirage prudents", () => {
    const f = A({ sexe: 1, regularite: 1 });
    expect(departProfil(f, EX.sdt, 12)).toBeLessThanOrEqual(30);
    expect(departProfil(f, EX.sdt, 12)).toBeGreaterThanOrEqual(20);
    const curl = Object.keys(EX).find((id) => EX[id].pat === "fc" && EX[id].eq === 2 && EX[id].ch === "kg")!;
    expect(departProfil(f, EX[curl], 10)).toBeLessThanOrEqual(EX[curl].d * 0.35);
  });
  it("confirmé à 10 répétitions : la charge par défaut", () => {
    expect(departProfil(A({ sexe: 0, regularite: 3 }), EX.dc, 10)).toBe(EX.dc.d);
  });
  it("la séance libre l'utilise et l'explique la première fois", () => {
    const E = { A: { sexe: 1, regularite: 1 }, LOG: {}, HIST: [], SEANCES: [] } as unknown as Etat;
    const p = propositionLibre(E, { id: "sdt", s: 3, r: 12, p: "2 min" }, { k: "L|x|0" })!;
    expect(p.base.v).toBeLessThanOrEqual(30);
    expect(p.why).toMatch(/Première fois/);
  });
  it("débutant : pas de soulevé de terre à la barre dans une séance générée", async () => {
    const { chargeLombaires } = await import("@/lib/logic/assistant");
    for (let k = 0; k < 20; k++) {
      const ex = construireSeance(["isc", "dos"], 60, 0, SEL, hasardDe("s" + k), () => false, 1);
      expect(ex.some((e) => EX[e.id].eq === 1 && chargeLombaires(e.id))).toBe(false);
    }
  });
});

describe("régressions du contre-audit", () => {
  it("R1 : le cardio doux et la course ne comptent pas pour le rythme de la muscu", async () => {
    const { recoPour } = await import("@/lib/logic/agenda");
    const E = { A: { regularite: 1, objHebdo: 3 }, HIST: [], SEANCES: [], LOG: {},
      CARDIO: [{ ts: new Date("2026-11-09T18:00").getTime(), f: "doux", m: "velo", min: 20 }],
      SORTIES: [{ d: "2026-11-09", km: 6, rpe: 4 }] } as unknown as Etat;
    const r = recoPour(E, "2026-11-10", "2026-11-10");
    expect(r.type).toBe("seance");
  });
  it("R5 : pas de « demain » quand demain est aussi un repos pour le rythme", () => {
    const r = recoDuJour([], "2026-11-07", [], 1, [], { hebdo: 3, jours: ["2026-11-02", "2026-11-04", "2026-11-06"] });
    expect(r.type).toBe("repos");
    expect(r.demain).toBeUndefined();
  });
});
