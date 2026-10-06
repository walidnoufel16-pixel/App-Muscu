/* Programme de huit semaines : chaque exercice affiché est faisable avec le
   matériel déclaré et respecte les préférences de matériel par groupe, quelle
   que soit la semaine (variantes, rotations), avec ou sans plan généré par l'IA. */
import { describe, expect, it } from "vitest";
import fx from "./fixtures/parite.json";
import { EX } from "@/lib/data/exercices";
import { PAT2GRP } from "@/lib/data/referentiels";
import { convient, curId, dispoDeclare, prefOk, remplacant, week } from "@/lib/logic/core";
import type { Etat, PlanIA, Reponses } from "@/lib/logic/types";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const PLAN_IA = (fx as any).profils[3].PLAN as PlanIA;
const etat = (A: Reponses, PLAN: PlanIA | null = null): Etat => ({ A, PLAN, LOG: {}, SWAP: {}, SWAPP: {}, SEANCES: [], wk: 0, day: 0, FINI: true });
/* Un groupe a-t-il au moins un exercice qui respecte matériel et préférences ? */
const possible = (A: Reponses, g: string) => Object.keys(EX).some((o) => PAT2GRP[EX[o].pat] === g && convient(A, o));

function verifier(E: Etat) {
  const W = week(E), fautes: string[] = [];
  for (let w = 0; w < 8; w++)
    W.forEach((S, s) => {
      const vus = new Set<string>();
      (S.x || []).forEach((e, i) => {
        const id = curId(E, w, s, i, e[0], W), g = PAT2GRP[EX[e[0]].pat];
        if (!dispoDeclare(E.A, id)) fautes.push(`S${w + 1}·${s + 1}·${i + 1} ${EX[id].n} : matériel absent`);
        else if (!prefOk(E.A, id) && g && possible(E.A, g)) fautes.push(`S${w + 1}·${s + 1}·${i + 1} ${EX[id].n} : hors préférences`);
        if (vus.has(id)) fautes.push(`S${w + 1}·${s + 1} ${EX[id].n} en double`);
        vus.add(id);
      });
    });
  return fautes;
}

describe("programme et matériel", () => {
  it("développé couché → pompes au poids du corps", () => {
    const A: Reponses = { materiel: 3, acc: [] };
    expect(remplacant(A, "dc", new Set())).toBe("pomp");
    expect(curId(etat({ ...A, socle: 2, axe: 0 }), 0, 0, 0, "dc")).toBe("pomp");
  });
  it("pectoraux au poids du corps en salle complète : plus de développé couché", () => {
    const A: Reponses = { materiel: 0, acc: [], socle: 2, axe: 0, prefs: { Pectoraux: [3] } };
    expect(prefOk(A, "dc")).toBe(false);
    expect(prefOk(A, "pomp")).toBe(true);
    expect(prefOk(A, "sq")).toBe(true); // un groupe sans préférence accepte tout
    for (const P of [null, PLAN_IA]) {
      const E = etat(A, P), W = week(E);
      for (let w = 0; w < 8; w++)
        W.forEach((S, s) => (S.x || []).forEach((e, i) => {
          const id = curId(E, w, s, i, e[0], W);
          if (EX[id].pat === "ph") expect(EX[id].eq, `S${w + 1} ${EX[id].n}`).toBe(3);
        }));
    }
  });
  const PREFS: Record<string, number[]>[] = [{}, { Pectoraux: [3] }, { Pectoraux: [2], Dos: [3] }, { Quadriceps: [1], Bras: [2, 3] }, { Épaules: [3], "Fessiers et ischio-jambiers": [3] }];
  for (const materiel of [0, 1, 2, 3])
    for (const acc of [[], [0], [1], [0, 1]])
      for (const [k, prefs] of PREFS.entries())
        it(`matériel ${materiel}, accessoires ${JSON.stringify(acc)}, préférences ${k}`, () => {
          for (const socle of [0, 1, 2])
            for (const axe of [0, 1])
              for (const P of [null, PLAN_IA]) {
                const A: Reponses = { materiel, acc, socle, axe, prefs, regularite: 2 };
                expect(verifier(etat(A, P)), JSON.stringify(A) + (P ? " IA" : " règles")).toEqual([]);
              }
        });
});
