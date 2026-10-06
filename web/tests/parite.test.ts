/* Parité avec l'ancienne app : les résultats de référence ont été produits par
   l'ancien code (tests/genere-fixtures.mjs) sur les mêmes états. */
import { describe, expect, it } from "vitest";
import fx from "./fixtures/parite.json";
import {
  curId, dispoDeclare, espacementDe, key, musclesDe, resumeDe, rpeOf, secondesDe, suggere, titreSeance, week, wkDone, wkFull, ctxPlan,
} from "@/lib/logic/core";
import { construireSeance, dureeEstimee, objCollation } from "@/lib/logic/assistant";
import { EX } from "@/lib/data/exercices";
import type { Etat } from "@/lib/logic/types";

const lcg = (s: number) => () => ((s = (s * 1103515245 + 12345) % 2147483648) / 2147483648);
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const F = fx as any;

const PROFILS: [number, unknown][] = F.profils.map((p: unknown, i: number) => [i, p]);
describe.each(PROFILS)("profil %i", (_i, p) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const P = p as any;
  const E: Etat = { A: P.A, PLAN: P.PLAN, SWAP: P.SWAP, SWAPP: P.SWAPP, LOG: structuredClone(P.LOG), SEANCES: [], wk: 0, day: 0, FINI: false };
  const W = week(E);
  it("semaine identique", () => expect(JSON.parse(JSON.stringify(W))).toEqual(P.week));
  it("exercices, RPE et suggestions identiques sur 8 semaines", () => {
    for (let w = 0; w < 8; w++) {
      expect(wkFull(E, w, W)).toBe(P.full[w]);
      W.forEach((s, si) => {
        expect(wkDone(E, w, si, W)).toBe(P.done[w + "|" + si]);
        let corrige = false;
        (s.x || []).forEach((e, i) => {
          const k = key(w, si, i), id = curId(E, w, si, i, e[0], W);
          /* Correction volontaire : l'ancien code affichait un exercice impossible
             avec le matériel déclaré (développé couché au poids du corps). Le
             remplaçant peut décaler les exercices suivants de la séance. */
          if (!dispoDeclare(E.A, P.cur[k]) || (corrige && id !== P.cur[k])) {
            corrige ||= !E.LOG[k]?.ex;
            expect(E.LOG[k]?.ex ? id === E.LOG[k].ex : dispoDeclare(E.A, id), k).toBe(true);
            return;
          }
          expect(id, k).toBe(P.cur[k]);
          expect(rpeOf(E.A, w, id, e[4]), k).toBe(P.rpe[k]);
          expect(suggere(E, w, si, i, id, W), k).toEqual(P.sug[k]);
        });
      });
    }
  });
  it("espacement identique", () => expect(W.map((_, i) => espacementDe(W, i))).toEqual(P.esp));
  it("contexte de série identique", () => {
    for (const k of Object.keys(P.ctx)) {
      const [w, i] = k.split("|").map(Number);
      const c = ctxPlan({ ...E, wk: w, day: 0 }, i, W)!;
      if (!dispoDeclare(E.A, P.ctx[k].id)) { expect(E.LOG[w + "|0|" + i]?.ex ? c.id === E.LOG[w + "|0|" + i].ex : dispoDeclare(E.A, c.id), k).toBe(true); continue; }
      expect(JSON.parse(JSON.stringify(c)), k).toEqual(P.ctx[k]);
    }
  });
});

describe("assistant", () => {
  it.each(F.assistant.map((c: unknown, i: number) => [i, c]) as [number, unknown][])("cas %i : même séance à hasard égal", (_i, c) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const C = c as any;
    const ex = construireSeance(C.m, C.d, C.o, C.sel, lcg(C.seed));
    expect(ex).toEqual(C.ex);
    expect(dureeEstimee(ex)).toBe(C.duree);
  });
});

describe("divers", () => {
  it("muscles", () => F.divers.muscles.forEach(([id, r]: [string, string[]]) => expect(musclesDe([id])).toEqual(r)));
  it("titres", () => F.divers.titres.forEach(([t, r]: [string, string]) => expect(titreSeance(t)).toBe(r)));
  it("secondes", () => F.divers.secondes.forEach(([t, r]: [string, number]) => expect(secondesDe(t)).toBe(r)));
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  it("collation", () => F.divers.objCol.forEach(([a, s, r]: any) => expect(objCollation(a, s)).toBe(r)));
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  it("résumé", () => F.divers.resume.forEach(([L, id, u, r]: any) => expect(resumeDe(L, EX[id], u)).toBe(r)));
});
