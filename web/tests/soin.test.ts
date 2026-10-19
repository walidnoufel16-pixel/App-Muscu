import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { EX } from "@/lib/data/exercices";
import { MUSC } from "@/lib/data/referentiels";
import { ROUTINES_SOIN, SOIN_DE_BLESSURE, ZONES_SOIN } from "@/lib/data/soin";
import EX_EN from "@/lib/i18n/exercices.en.json";
import { imgEx } from "@/lib/medias";
import { alternativesDe, remplacant, variante } from "@/lib/logic/core";
import { construireSeance } from "@/lib/logic/assistant";
import { zonesDe } from "@/lib/logic/forme";
import { versEtat } from "@/lib/store";

const PUB = path.join(__dirname, "../public");
const FICHES = JSON.parse(fs.readFileSync(path.join(PUB, "data/fiches.json"), "utf8"));
const FICHES_EN = JSON.parse(fs.readFileSync(path.join(PUB, "data/fiches.en.json"), "utf8"));
const soins = Object.keys(EX).filter((o) => EX[o].pat === "soin");
const estSoin = (o: string) => EX[o]?.pat === "soin";

describe("soin & mobilité", () => {
  it("chaque exercice de soin a sa zone, sa fiche, sa traduction et ses deux images", () => {
    expect(Object.keys(EX).filter((x) => EX[x].soin).length).toBeGreaterThanOrEqual(44);
    const zones = ZONES_SOIN.map((z) => z[0]) as string[];
    for (const o of Object.keys(EX).filter((x) => EX[x].soin)) {
      expect(zones, o).toContain(EX[o].soin);
      expect(FICHES[o], o).toBeTruthy();
      expect(FICHES_EN[o], o).toBeTruthy();
      expect((EX_EN as Record<string, unknown>)[o], o).toBeTruthy();
      for (const n of [0, 1] as const) expect(fs.existsSync(path.join(PUB, imgEx(o, n))), imgEx(o, n)).toBe(true);
    }
    for (const o of soins) expect(EX[o].soin, o).toBeTruthy();
  });
  it("les routines ne contiennent que des exercices existants, une par zone", () => {
    expect(ROUTINES_SOIN.map((r) => r.z).sort()).toEqual(ZONES_SOIN.map((z) => z[0]).sort());
    for (const r of ROUTINES_SOIN) {
      expect(r.ex.length).toBeGreaterThanOrEqual(3);
      for (const e of r.ex) expect(EX[e.id], `${r.z} : ${e.id}`).toBeTruthy();
    }
    SOIN_DE_BLESSURE.forEach((z) => expect(ROUTINES_SOIN.some((r) => r.z === z)).toBe(true));
  });
  it("absents des tirages automatiques", () => {
    const A = {};
    for (const o of Object.keys(EX).filter((x) => !estSoin(x))) {
      expect(estSoin(remplacant(A, o, new Set())), o).toBe(false);
      expect(estSoin(variante(A, o, new Set())), o).toBe(false);
      expect(alternativesDe(A, o).some(estSoin), o).toBe(false);
    }
    const sel = ["m0", "m1", "m2", "m3"];
    for (let i = 0; i < 20; i++) expect(construireSeance(MUSC.map((m) => m.k), 90, i % 3, sel).some((e) => estSoin(e.id))).toBe(false);
  });
  it("ni ménagés ni comptés comme charge pour les zones sensibles", () => {
    for (const o of soins) expect(zonesDe(o, [0, 1, 2, 3])).toEqual([]);
  });
  it("des photos partout : plus aucun pictogramme dessiné", () => {
    for (const o of Object.keys(EX)) expect(imgEx(o), o).toMatch(/^\/img\/[^/]+\.avif$/);
    expect(fs.existsSync(path.join(PUB, "img/picto"))).toBe(false);
  });
  it("un exercice retiré disparaît des séances enregistrées", () => {
    const e = versEtat({ SEANCES: [
      { nom: "Push", ex: [{ id: "dc", s: 3, r: 8, p: "2 min" }, { id: "wallsl", s: 2, r: 10, p: "30 s" }, { id: "pomp", s: 3, r: 10, p: "1 min" }],
        blocs: [{ id: "b", apres: 3 } as never] },
      { nom: "Coiffe des rotateurs", soin: "epaules", ex: [{ id: "wallsl", s: 2, r: 10, p: "30 s" }, { id: "elrot", s: 2, r: 15, p: "30 s" }] },
      { nom: "Jambes", ex: [{ id: "sq", s: 3, r: 8, p: "2 min" }] },
    ] } as never);
    expect(e.SEANCES[0].ex.map((x) => x.id)).toEqual(["dc", "pomp"]);
    expect(e.SEANCES[0].blocs?.[0].apres).toBe(2);
    expect(e.SEANCES[1].ex.map((x) => x.id)).toEqual(ROUTINES_SOIN[0].ex.map((x) => x.id));
    expect(e.SEANCES[2].ex.map((x) => x.id)).toEqual(["sq"]);
  });
  it("exclus de la bibliothèque envoyée à l'IA", () => {
    const src = fs.readFileSync(path.join(__dirname, "../../scripts/sync-lib.mjs"), "utf8");
    expect(src).toMatch(/pat !== "soin"/);
  });
});
