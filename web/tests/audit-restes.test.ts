/* Restes de l'audit (S1 à S5) : lest, barre à vide, modèles selon le rythme, force, poids du corps. */
import { describe, expect, it } from "vitest";
import { recoDuJour } from "@/lib/logic/recommandation";
import { construireSeance, hasardDe } from "@/lib/logic/assistant";
import { departProfil } from "@/lib/logic/core";
import { decaler } from "@/lib/logic/historique";
import { EX } from "@/lib/data/exercices";
import type { LigneHist } from "@/lib/logic/historique";
import type { Reponses } from "@/lib/logic/types";

const SEL = ["m0", "m1", "m2", "m3", "bt"];
const A = (o: Partial<Reponses>) => ({ ...o }) as Reponses;
function suivre(niveau: number | undefined, hebdo: number | undefined, jours = 28) {
  const H: LigneHist[] = [], fait: string[] = [], ids: string[] = [];
  for (let k = 0; k < jours; k++) {
    const d = decaler("2026-11-02", k), r = recoDuJour(H, d, [], niveau, [], { hebdo, jours: fait });
    if (r.type !== "seance") continue;
    const p = r.propositions[0], ex = construireSeance(p.muscles, 60, 0, SEL, hasardDe(d), () => false, niveau);
    H.push({ d, s: "L|0", nom: p.nom, vol: 0, ser: 0, ex: Object.fromEntries(ex.map((e) => [e.id, [20, 0, 0, e.r, e.s]])) });
    fait.push(d); ids.push(p.id);
  }
  return { n: fait.length, ids, fait };
}

describe("S1 : charges de départ", () => {
  it("tractions : au poids du corps pour un débutant ou un régulier", () => {
    expect(departProfil(A({ regularite: 1 }), EX.tr, 5)).toBe(0);
    expect(departProfil(A({ regularite: 2 }), EX.trs, 8)).toBe(0);
  });
  it("une barre ne descend pas sous son poids à vide", () => {
    expect(departProfil(A({ sexe: 1, regularite: 1 }), EX.dm, 10)).toBeGreaterThanOrEqual(20);
    expect(departProfil(A({ sexe: 1, regularite: 1 }), EX.sdt, 12)).toBeGreaterThanOrEqual(20);
  });
});

describe("S2/S3 : rythme et modèles", () => {
  it("débutant à 5 séances : 4 au plus, jamais deux jours d'affilée", () => {
    const s = suivre(1, 5);
    expect(s.n).toBeLessThanOrEqual(16);
    for (let i = 1; i < s.fait.length; i++) expect(s.fait[i]).not.toBe(decaler(s.fait[i - 1], 1));
  });
  it("profil non rempli : 3 séances par semaine, full body, haut et bas", () => {
    const s = suivre(undefined, undefined);
    expect(s.n).toBeLessThanOrEqual(12);
    expect(s.ids.every((m) => ["full", "haut", "bas"].includes(m))).toBe(true);
  });
  it("2 séances : 2 full body", () => {
    expect(new Set(suivre(2, 2).ids)).toEqual(new Set(["full"]));
  });
  it("4 séances : haut et bas du corps", () => {
    expect(suivre(2, 4).ids.slice(1).every((m) => ["haut", "bas"].includes(m))).toBe(true);
  });
  it("5 séances et plus : pousser, tirer, jambes ; plus d'« Épaules et abdos »", () => {
    const s = suivre(3, 5);
    expect(s.ids).not.toContain("epaabd");
    const push = s.ids.filter((m) => m === "push").length, pull = s.ids.filter((m) => m === "pull").length;
    expect(Math.abs(push - pull)).toBeLessThanOrEqual(1);
  });
});

describe("S4 : construction", () => {
  it("force, régulier : le mouvement principal des jambes à la barre, à la presse ou guidé", () => {
    for (let k = 0; k < 15; k++) {
      const ex = construireSeance(["qua", "isc"], 60, 1, SEL, hasardDe("f" + k), () => false, 2);
      expect(["sq", "sqf", "pr", "hack", "smith"]).toContain(ex.find((e) => EX[e.id].pat === "eg")!.id);
    }
  });
  it("poids du corps exigeant : 8 répétitions au plus", () => {
    for (let k = 0; k < 20; k++)
      for (const e of construireSeance(["pec", "tri", "abd"], 45, 0, ["m3", "bt"], hasardDe("d" + k), () => false, 2))
        if (["dip", "dipt", "pompe", "roue", "rj"].includes(e.id)) expect(e.r).toBeLessThanOrEqual(8);
  });
  it("haut du corps régulier : deux tirages", () => {
    for (let k = 0; k < 15; k++) {
      const ex = construireSeance(["pec", "dos", "epa", "bic", "tri"], 45, 0, SEL, hasardDe("h" + k), () => false, 2);
      expect(ex.filter((e) => ["tv", "th"].includes(EX[e.id].pat)).length).toBeGreaterThanOrEqual(2);
    }
  });
});

describe("audit final", () => {
  it("F4 : pas de soulevé de terre sumo à la barre pour un débutant", async () => {
    const { chargeLombaires } = await import("@/lib/logic/assistant");
    expect(chargeLombaires("sdts")).toBe(true);
    for (let k = 0; k < 30; k++) expect(construireSeance(["isc", "qua"], 45, 0, SEL, hasardDe("s" + k), () => false, 1).map((e) => e.id)).not.toContain("sdts");
  });
  it("F2 : une seule valeur par défaut pour le rythme (objectifHebdo)", async () => {
    const { objectifHebdo } = await import("@/lib/logic/motivation");
    const { recoPour } = await import("@/lib/logic/agenda");
    expect(objectifHebdo(A({}))).toBe(2);
    /* profil sans rythme : 2 séances → full body */
    const r = recoPour({ A: A({ regularite: 2 }), HIST: [], SEANCES: [], LOG: {} } as never, "2026-11-10", "2026-11-10");
    expect(r.propositions[0].id).toBe("full");
  });
});
