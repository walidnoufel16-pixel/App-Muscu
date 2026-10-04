import { describe, expect, it } from "vitest";
import { decaler } from "@/lib/logic/historique";
import { BADGES, nouveaux, objectifHebdo, serie, stats } from "@/lib/logic/motivation";
import type { LigneHist } from "@/lib/logic/historique";
import type { Etat } from "@/lib/logic/types";

const L = (d: string, ex: LigneHist["ex"] = {}, vol = 0): LigneHist => ({ d, s: "L|0", nom: "", vol, ser: 1, ex });
/* n séances la semaine dont le lundi est donné */
const semaine = (lundi: string, n: number) => Array.from({ length: n }, (_, i) => L(decaler(lundi, i)));

describe("série de semaines", () => {
  const auj = "2026-10-07"; // mercredi, semaine du 5 octobre
  it("objectif : réglé, sinon questionnaire, sinon 2", () => {
    expect(objectifHebdo({})).toBe(2);
    expect(objectifHebdo({ socle: 1 })).toBe(3);
    expect(objectifHebdo({ socle: 1, objHebdo: 9 })).toBe(6);
  });
  it("semaines réussies d'affilée ; la semaine en cours ne casse rien", () => {
    const H = [...semaine("2026-09-14", 2), ...semaine("2026-09-21", 2), ...semaine("2026-09-28", 3), ...semaine("2026-10-05", 1)];
    const S = serie(H, [], 2, auj);
    expect(S.semaines).toBe(3);
    expect(S.cetteSemaine).toBe(1);
    expect(serie([...H, L("2026-10-07")], [], 2, auj).semaines).toBe(4);
  });
  it("une semaine manquée par mois est couverte par le joker, pas deux", () => {
    const H = [...semaine("2026-08-31", 2), ...semaine("2026-09-14", 2), ...semaine("2026-09-28", 2)]; // 7 et 21 sept. manquées
    const S = serie(H, [], 2, auj);
    expect(S.semaines).toBe(1); // le 21 septembre casse la série (joker de septembre déjà pris)
    const T = serie([...semaine("2026-09-14", 2), ...semaine("2026-09-28", 2)], [], 2, auj);
    expect([T.semaines, T.jokers, T.jokerDispo]).toEqual([2, ["2026-09-21"], true]);
  });
  it("le cardio seul compte, pas un bloc d'une séance combinée", () => {
    const t = new Date("2026-10-06T10:00").getTime();
    const C = [{ nom: "", f: "tabata" as const, m: "ram" as const, min: 10, effort: 8, ts: t }, { nom: "", f: "tabata" as const, m: "ram" as const, min: 10, effort: 8, ts: t, ref: "0|b1" }];
    expect(serie([], C, 2, auj).cetteSemaine).toBe(1);
  });
});

describe("badges", () => {
  const E = (H: LigneHist[], A = {}): Etat => ({ A, LOG: {}, SWAP: {}, SWAPP: {}, PLAN: null, SEANCES: [], wk: 0, day: 0, FINI: false, HIST: H }) as Etat;
  it("première séance, 100 kg au couché, poids du corps, tonnage", () => {
    const s = stats(E([L("2026-09-01", { dc: [110, 2000, 100, 3, 3] }, 12000)], { poids: [["2026-09-01", 80]] }), "2026-10-07");
    const ids = BADGES.filter((b) => b.valeur(s) >= b.cible).map((b) => b.id);
    expect(ids).toEqual(expect.arrayContaining(["s1", "dc100", "pdc", "t10"]));
    expect(ids).not.toContain("sq100");
    expect(nouveaux(s, { s1: "2026-09-01" }).map((b) => b.id)).not.toContain("s1");
  });
  it("identifiants uniques", () => {
    expect(new Set(BADGES.map((b) => b.id)).size).toBe(BADGES.length);
  });
});
