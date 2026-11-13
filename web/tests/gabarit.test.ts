/* Séance guidée : le gabarit en cases reprend exactement la séance qu'Oxa construirait. */
import { describe, expect, it } from "vitest";
import { exPourRole } from "@/lib/logic/assistant";
import { seancePour } from "@/lib/logic/generer-seance";
import { candidatsCase, casesVides, compte, gabaritPour, remplissage, suggestion, trierParBloc, type ExCase } from "@/lib/logic/gabarit";
import { convientA, roleDe } from "@/lib/logic/roles";
import type { Etat, Reponses } from "@/lib/logic/types";

const etat = (A: Reponses): Etat => ({ A, LOG: {}, SWAP: {}, SWAPP: {}, PLAN: null, SEANCES: [], wk: 0, day: 0, FINI: true, HIST: [] }) as Etat;
const SALLE = ["m0", "m1", "m2", "m3", "bt"];
const JOUR = "2026-11-13";

describe("gabarit de la séance guidée", () => {
  it("les cases sont celles de la séance d'Oxa (mêmes rôles, même ordre)", () => {
    for (const niv of [1, 2, 3])
      for (const m of [["pec", "dos"], ["qua", "isc", "mol"], ["pec", "epa", "tri"], ["pec", "dos", "epa", "qua", "isc"]])
        for (const d of [30, 45, 60]) {
          const E = etat({ regularite: niv } as Reponses);
          const g = gabaritPour(E, m, d, 0, SALLE, JOUR), ex = seancePour(E, m, d, 0, SALLE, JOUR);
          expect(g.cases.map((c) => c.ro)).toEqual(ex.map((e) => e.ro));
          expect(g.sug).toEqual(ex.map((e) => e.id));
          for (const c of g.cases) expect(m.includes(c.k)).toBe(true);
        }
  });
  it("calculé muscle par muscle : full body = des Base, pecs-épaules-triceps = surtout de l'isolation", () => {
    const fb = compte(gabaritPour(etat({ regularite: 2 } as Reponses), ["pec", "dos", "epa", "qua", "isc"], 45, 0, SALLE, JOUR).cases);
    expect(fb.b).toBeGreaterThanOrEqual(fb.i);
    const ppt = compte(gabaritPour(etat({ regularite: 3 } as Reponses), ["pec", "epa", "tri"], 60, 0, SALLE, JOUR).cases);
    expect(ppt.i).toBeGreaterThan(0);
  });
  it("compléter avec les suggestions remplit toutes les cases", () => {
    const g = gabaritPour(etat({ regularite: 2 } as Reponses), ["pec", "dos"], 60, 0, SALLE, JOUR);
    const ex: ExCase[] = [];
    g.cases.forEach((c, i) => {
      const id = suggestion(g, i, SALLE, (o) => ex.some((e) => e.id === o));
      expect(id).toBeTruthy();
      ex.push({ ...exPourRole(id!, 0, 2, convientA(c.ro, id!, c.k) ? c.ro : roleDe(id!, c.k)), k: c.k });
    });
    expect(casesVides(ex, g.cases)).toEqual([]);
  });
  it("retirer un exercice vide sa case ; un exercice ajouté librement remplit la case de son muscle", () => {
    const cases = [{ k: "pec", ro: "b" as const }, { k: "pec", ro: "i" as const }];
    const ex: ExCase[] = [exPourRole("dc", 0), exPourRole("curlb", 0)];
    expect(remplissage(ex, cases)).toEqual([0, -1]);
    ex.push(exPourRole("ecart", 0));
    expect(remplissage(ex, cases)).toEqual([0, 2]);
    ex.splice(0, 1);
    expect(casesVides(ex, cases)).toEqual([0]);
  });
  it("une case Complément accepte une Base, une case Isolation non", () => {
    const c = candidatsCase({ k: "dos", ro: "c" }, SALLE);
    expect(c).toContain("rw");
    expect(c).toContain("tr");
    expect(c.indexOf("rw")).toBeLessThan(c.indexOf("tr"));
    expect(candidatsCase({ k: "dos", ro: "i" }, SALLE)).not.toContain("tr");
  });
  it("range par bloc sans toucher au soin ni au cardio", () => {
    const ex: ExCase[] = [exPourRole("curlb", 0), exPourRole("sq", 0), exPourRole("gai", 0), exPourRole("dc", 0)];
    trierParBloc(ex);
    expect(ex.map((e) => e.id)).toEqual(["sq", "dc", "curlb", "gai"]);
  });
});
