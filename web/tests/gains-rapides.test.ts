/* Les 3 gains rapides : délai de récupération, variation de charge, bilan de la semaine. */
import { describe, expect, it } from "vitest";
import { etatGroupes } from "@/lib/logic/recommandation";
import { variationDe } from "@/lib/logic/core";
import { bilanSemaine, jourDuBilan } from "@/lib/logic/bilan-semaine";
import type { LigneHist } from "@/lib/logic/historique";
import type { Journal } from "@/lib/logic/types";

const ligne = (d: string, ex: Record<string, number>): LigneHist => ({
  d, s: "L|0", nom: "Test", vol: 0, ser: Object.values(ex).reduce((a, b) => a + b, 0),
  ex: Object.fromEntries(Object.entries(ex).map(([id, n]) => [id, [60, 600, 60, 10, n]])),
});

describe("récupération", () => {
  it("un muscle travaillé hier : au repos, prêt demain ; jamais travaillé : prêt", () => {
    const E = etatGroupes([ligne("2026-11-05", { dc: 4 })], "2026-11-06");
    expect(E.pec.recupere).toBe(false);
    expect(E.pec.reste).toBe(1);
    expect(E.qua.recupere).toBe(true);
    expect(E.qua.reste).toBe(0);
  });
  it("gros volume de jambes : 3 jours", () => {
    const E = etatGroupes([ligne("2026-11-05", { sq: 9 })], "2026-11-05");
    expect(E.qua.reste).toBe(3);
  });
});

describe("variation de charge", () => {
  const prev = { ex: "dc", v: 60, series: [{ v: 60, reps: 10, ok: true }] } as unknown as Journal;
  it("hausse, baisse, rien sans précédent ni hors kg", () => {
    expect(variationDe({ id: "dc", base: { v: 62.5 }, prev })).toBe(2.5);
    expect(variationDe({ id: "dc", base: { v: 54 }, prev })).toBe(-6);
    expect(variationDe({ id: "dc", base: { v: 60 }, prev: undefined })).toBe(0);
    expect(variationDe({ id: "pomp", base: { v: 12 }, prev })).toBe(0);
  });
});

describe("bilan de la semaine", () => {
  const H = [ligne("2026-10-27", { dc: 9 }), ligne("2026-10-30", { tr: 6, sq: 4 }), ligne("2026-11-03", { dc: 3 })];
  it("la semaine précédente seulement, séances, objectif, muscles", () => {
    const b = bilanSemaine(H, { objHebdo: 2, regularite: 2 }, "2026-11-03")!;
    expect([b.lundi, b.dimanche]).toEqual(["2026-10-26", "2026-11-01"]);
    expect(b.seances).toBe(2);
    expect(b.tenu).toBe(true);
    expect(b.cible).toBe(12);
    expect(b.plusTravaille?.k).toBe("pec");
    expect(b.aTravailler).not.toBeNull();
    expect(b.protJours).toBeNull();
  });
  it("semaine vide : pas de bilan ; protéines comptées si notées", () => {
    expect(bilanSemaine(H, {}, "2026-11-20")).toBeNull();
    const b = bilanSemaine(H, { prot: { "2026-10-28": 150, "2026-10-29": 80 } }, "2026-11-03", 140)!;
    expect(b.protJours).toBe(1);
  });
  it("visible le lundi et le mardi", () => {
    expect([jourDuBilan("2026-11-02"), jourDuBilan("2026-11-03"), jourDuBilan("2026-11-04")]).toEqual([true, true, false]);
  });
});

import { journal, journalActif, journalPerime } from "@/lib/logic/core";
import { serVal } from "@/lib/logic/actions";
import type { Ctx } from "@/lib/logic/core";
import type { Etat } from "@/lib/logic/types";

describe("journal oublié", () => {
  const vieux = Date.now() - 11 * 864e5;
  const oublie = { ex: "fp", done: false, ts: vieux, v: 10, reps: 10, nb: 3, feel: null, series: [{ v: 10, reps: 10 }, { v: 10, reps: 10 }, { v: 10, reps: 10 }] } as unknown as Journal;
  const c = { k: "L|0|0", id: "fp", n: 3, base: { v: 7.5, reps: 10 }, why: "Reprise", repos: "90 s" } as unknown as Ctx;
  it("plus de 6 h sans série validée : oublié ; récent ou commencé : actif", () => {
    expect(journalPerime(oublie)).toBe(true);
    expect(journalActif(oublie)).toBeUndefined();
    expect(journalPerime({ ...oublie, ts: Date.now() - 3600e3 } as Journal)).toBe(false);
    expect(journalPerime({ ...oublie, series: [{ v: 10, reps: 10, ok: true }] } as unknown as Journal)).toBe(false);
  });
  it("la première saisie repart de la charge proposée", () => {
    const E = { LOG: { "L|0|0": structuredClone(oublie) } } as unknown as Etat;
    serVal(E, c, 0, "reps", "12");
    expect(E.LOG["L|0|0"].series.map((x: { v: number }) => x.v)).toEqual([7.5, 7.5, 7.5]);
    expect(E.LOG["L|0|0"].series[0].reps).toBe(12);
    expect(journal({}, c).why).toBe("Reprise");
  });
});

import { ctxLibre, progressionLibre, varianteRecente } from "@/lib/logic/core";
import { EX } from "@/lib/data/exercices";

describe("variantes du même mouvement", () => {
  const jour = (n: number) => { const d = new Date(Date.now() - n * 864e5); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; };
  const L = (n: number, v: number) => ({ ex: "dmh", done: true, ts: Date.now() - n * 864e5, v, reps: 10, nb: 3, feel: null, series: [{ v, reps: 10, ok: true }, { v, reps: 10, ok: true }, { v, reps: 10, ok: true }] }) as unknown as Journal;
  it("Arnold et développé haltères : même mouvement", () => {
    expect(EX.arn.pat).toBe(EX.dmh.pat);
    const H = [ligne(jour(3), { arn: 3 })];
    expect(varianteRecente({ HIST: H }, "dmh")?.id).toBe("arn");
  });
  it("16 jours sans l'exercice mais une variante il y a 3 jours : pas de reprise allégée", () => {
    const seul = progressionLibre(EX.dmh, { s: 3, r: 10 }, L(16, 20));
    expect(seul?.t).toMatch(/Reprise après 16 jours/);
    const avecVariante = progressionLibre(EX.dmh, { s: 3, r: 10 }, L(16, 20), { voisin: Date.now() - 3 * 864e5 });
    expect(avecVariante?.t ?? "").not.toMatch(/Reprise/);
    expect(avecVariante?.v ?? 20).toBeGreaterThanOrEqual(20);
  });
  it("jamais fait : départ à 90 % de la variante au même matériel", () => {
    const H = [ligne(jour(5), { arn: 3 })];
    H[0].ex.arn[2] = 20;
    const E = { A: {}, LOG: {}, HIST: H, SEANCES: [{ nom: "Épaules", ex: [{ id: "dmh", s: 3, r: 10, p: "90 s" }] }] } as unknown as Etat;
    const c = ctxLibre(E, 0, 0)!;
    expect(c.base.v).toBe(18);
    expect(c.why).toMatch(/90 %.*développé arnold/i);
  });
});
