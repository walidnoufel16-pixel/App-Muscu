/* Autres activités déclarées dans l'agenda : leurs muscles récupèrent, et pas de jambes la veille. */
import { describe, expect, it } from "vitest";
import { effortsEndurance, etatGroupes } from "@/lib/logic/recommandation";
import { activiteJambesLe, joursAgenda, recoPour } from "@/lib/logic/agenda";
import { joursRecup } from "@/lib/data/activites";
import { decaler } from "@/lib/logic/historique";
import type { Activite, Etat } from "@/lib/logic/types";

const vide = (): Etat => ({ A: { regularite: 2, objHebdo: 3 }, LOG: {}, SWAP: {}, SWAPP: {}, PLAN: null, SEANCES: [], wk: 0, day: 0, FINI: false, HIST: [] });
const AUJ = "2026-11-16";
const foot = (d: string, int: 0 | 1 | 2 = 1, min = 90): Activite => ({ id: "a" + d, d, sp: "foot", min, int, m: ["qua", "isc", "mol", "add"] });

describe("autres activités", () => {
  it("récupération : tranquille 1 jour, normale 2, à fond ou 2 h 3", () => {
    expect(joursRecup(0, 60)).toBe(1);
    expect(joursRecup(1, 90)).toBe(2);
    expect(joursRecup(1, 120)).toBe(3);
    expect(joursRecup(2, 45)).toBe(3);
  });
  it("le foot d'hier : jambes pas prêtes aujourd'hui, prêtes demain ; le haut reste prêt", () => {
    const efforts = effortsEndurance([], [], null, [foot(decaler(AUJ, -1))]);
    const auj = etatGroupes([], AUJ, efforts), demain = etatGroupes([], decaler(AUJ, 1), efforts);
    expect(auj.qua.recupere).toBe(false);
    expect(auj.isc.recupere).toBe(false);
    expect(auj.pec.recupere).toBe(true);
    expect(demain.qua.recupere).toBe(true);
  });
  it("une activité à venir ne fatigue pas encore", () => {
    expect(etatGroupes([], AUJ, effortsEndurance([], [], null, [foot(decaler(AUJ, 2))])).qua.recupere).toBe(true);
  });
  it("la veille d'un match, Oxa ne propose pas de jambes ; une activité tranquille ne compte pas", () => {
    const E = vide();
    E.ACTIVITES = [foot(decaler(AUJ, 1))];
    expect(activiteJambesLe(E, decaler(AUJ, 1))).toBe(true);
    const r = recoPour(E, AUJ, AUJ);
    expect(r.propositions.every((p) => !p.muscles.some((g) => g === "qua" || g === "isc"))).toBe(true);
    E.ACTIVITES = [foot(decaler(AUJ, 1), 0)];
    expect(activiteJambesLe(E, decaler(AUJ, 1))).toBe(false);
  });
  it("l'agenda montre l'activité ce jour-là", () => {
    const E = vide();
    E.ACTIVITES = [foot(AUJ)];
    expect(joursAgenda(E, AUJ, AUJ, 1)[0].act.length).toBe(1);
  });
});
