/* Parité avec l'ancienne app : les résultats de référence ont été produits par
   l'ancien code (tests/genere-fixtures.mjs) sur les mêmes états. */
import { describe, expect, it } from "vitest";
import fx from "./fixtures/parite.json";
import {
  curId, dispoDeclare, espacementDe, key, musclesDe, resumeDe, rpeOf, secondesDe, suggere, titreSeance, week, wkDone, wkFull, ctxPlan, departProfil,
} from "@/lib/logic/core";
import { objCollation } from "@/lib/logic/assistant";
import { EX } from "@/lib/data/exercices";
import type { Etat } from "@/lib/logic/types";

/* L'ancienne app ne connaissait ni les exercices street workout ajoutés depuis (horsIA) ni la
   barre de traction : on compare sur la même bibliothèque, barre de traction disponible. */
for (const o of Object.keys(EX)) if (EX[o].horsIA) delete EX[o];

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
          /* Oxa Plan v2 : la périodisation (effort, séries, répétitions) et la progression des
             charges ont changé volontairement à partir de la semaine 2 ; la semaine 1 reste identique. */
          if (w === 0) {
            expect(rpeOf(E.A, w, id, e[4]), k).toBe(P.rpe[k]);
            expect(suggere(E, w, si, i, id, W), k).toEqual(P.sug[k]);
          }
        });
      });
    }
  });
  it("espacement identique", () => expect(W.map((_, i) => espacementDe(W, i))).toEqual(P.esp));
  it("contexte de série identique", () => {
    for (const k of Object.keys(P.ctx)) {
      const [w, i] = k.split("|").map(Number);
      if (w !== 0) continue; // Oxa Plan v2 : voir plus haut
      const c = ctxPlan({ ...E, wk: w, day: 0 }, i, W)!;
      if (!dispoDeclare(E.A, P.ctx[k].id)) { expect(E.LOG[w + "|0|" + i]?.ex ? c.id === E.LOG[w + "|0|" + i].ex : dispoDeclare(E.A, c.id), k).toBe(true); continue; }
      /* Correction volontaire (audit S1) : la première fois, sans historique, l'ancien code partait de la
         charge par défaut de l'exercice, la même pour tout le monde ; c'est désormais celle du profil. */
      const ref = P.ctx[k], x = EX[c.id];
      if (x?.ch !== "aucune" && ref.base.v === x?.d && !ref.why) {
        expect(c.base.v, k).toBe(departProfil(E.A, x, ref.base.reps));
        expect(JSON.parse(JSON.stringify({ ...c, base: { ...c.base, v: ref.base.v }, why: undefined })), k).toEqual(ref);
        continue;
      }
      expect(JSON.parse(JSON.stringify(c)), k).toEqual(ref);
    }
  });
});

/* L'assistant ne reproduit plus l'ancienne app : la construction des séances a été refaite (cases
   par fonction, prescription selon le rôle, durée réelle ; docs/audit/bilan-2026-11-10.md, S4 et S5).
   Ses règles sont vérifiées dans tests/seances.test.ts. */

describe("divers", () => {
  it("muscles", () => F.divers.muscles.forEach(([id, r]: [string, string[]]) => expect(musclesDe([id])).toEqual(r)));
  it("titres", () => F.divers.titres.forEach(([t, r]: [string, string]) => expect(titreSeance(t)).toBe(r)));
  it("secondes", () => F.divers.secondes.forEach(([t, r]: [string, number]) => expect(secondesDe(t)).toBe(r)));
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  it("collation", () => F.divers.objCol.forEach(([a, s, r]: any) => expect(objCollation(a, s)).toBe(r)));
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  it("résumé", () => F.divers.resume.forEach(([L, id, u, r]: any) => expect(resumeDe(L, EX[id], u)).toBe(r)));
});
