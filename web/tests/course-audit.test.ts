/* Audit du 12 novembre 2026 (auditeur-app, I5) : vrai débutant et sortie longue plafonnée. */
import { describe, expect, it } from "vitest";
import { calendrier, genererPlan, type PlanCourse } from "@/lib/logic/course";

const plan = (x: Partial<PlanCourse> = {}): PlanCourse => {
  const c = calendrier(x.obj ?? "marathon", x.date ?? "2027-04-11", "2026-11-02");
  return { obj: "marathon", date: "2027-04-11", debut: c.debut, jours: 4, renfo: 1, ref: null, pauses: [], ajust: {}, cree: "2026-11-02", ...x };
};

describe("course : débutant", () => {
  it("marathon débutant : sortie longue de 2 h 30 au plus", () => {
    for (const W of genererPlan(plan())) for (const s of W.seances) if (s.type === "longue") expect(s.min, `semaine ${W.k}`).toBeLessThanOrEqual(155);
  });
  it("coureur confirmé : 3 h au plus", () => {
    for (const W of genererPlan(plan({ ref: { km: 10, sec: 60 * 60 } }))) for (const s of W.seances) if (s.type === "longue") expect(s.min).toBeLessThanOrEqual(185);
  });
  it("« pas encore 30 min » : course-marche les 6 premières semaines, puis course continue", () => {
    const S = genererPlan(plan({ obj: "10k", date: "2027-02-14", marche: true }));
    for (const W of S.slice(0, 6)) for (const s of W.seances.filter((x) => x.type !== "renfo"))
      expect(s.phases?.some((p) => p.type === "recup"), `${W.k} ${s.titre}`).toBe(true);
    expect(S[6].seances.some((s) => s.type === "footing" && !s.phases?.some((p) => p.type === "recup"))).toBe(true);
  });
  it("débutant : un test de 30 min à allure régulière, pas un 5 km à fond", () => {
    const tests = genererPlan(plan({ obj: "semi", date: "2027-03-07" })).flatMap((W) => W.seances.filter((s) => s.test));
    expect(tests.length).toBeGreaterThan(0);
    for (const t of tests) expect(t.titre).toMatch(/30 min/);
  });
});

describe("course et musculation", () => {
  it("la veille d'une sortie longue programmée, la séance conseillée ne travaille pas les jambes", async () => {
    const { recoPour } = await import("@/lib/logic/agenda");
    const { decaler } = await import("@/lib/logic/historique");
    const p = plan({ obj: "semi", date: "2027-03-07", ref: { km: 10, sec: 50 * 60 } });
    const S = genererPlan(p);
    const k = 2, j = S[k].seances.findIndex((s) => s.type === "longue");
    const auj = "2026-11-12", demain = decaler(auj, 1);
    const E = { A: { regularite: 2, objHebdo: 3 }, LOG: {}, SWAP: {}, SWAPP: {}, PLAN: null, SEANCES: [], wk: 0, day: 0, FINI: true, HIST: [],
      COURSE: p, AGENDA: [{ id: "x", d: demain, nom: "Sortie longue", quoi: { t: "course" as const, cle: `${k}|${j}` } }] };
    const r = recoPour(E as never, auj, auj);
    for (const q of r.propositions) expect(q.muscles.some((m) => ["qua", "isc", "mol"].includes(m)), q.nom).toBe(false);
  });
});
