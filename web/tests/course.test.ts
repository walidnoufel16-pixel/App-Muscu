import { describe, expect, it } from "vitest";
import {
  adapter, allures, avertissement, calendrier, genererPlan, reprendre, riegel, semaineDe, tempsPrevu, vdot, type PlanCourse,
} from "@/lib/logic/course";

const proche = (a: number, b: number, tol: number) => expect(Math.abs(a - b)).toBeLessThanOrEqual(tol);
const plan = (x: Partial<PlanCourse> = {}): PlanCourse => {
  const c = calendrier(x.obj ?? "semi", x.date ?? "2027-03-07", "2026-10-05");
  return { obj: "semi", date: "2027-03-07", debut: c.debut, jours: 4, renfo: 1, ref: { km: 10, sec: 50 * 60 }, pauses: [], ajust: {}, cree: "2026-10-05", ...x };
};

describe("allures (Daniels)", () => {
  it("VDOT d'une performance, et l'inverse", () => {
    proche(vdot(5, 19 * 60 + 57), 50, 0.5); // table de Daniels : VDOT 50 ≈ 19:57 au 5 km
    proche(tempsPrevu(50, 10), 41 * 60 + 21, 20);
    proche(tempsPrevu(50, 21.0975), 91 * 60 + 35, 45);
    proche(tempsPrevu(50, 42.195), 190 * 60 + 49, 120);
  });
  it("allures d'entraînement proches des tables (VDOT 50)", () => {
    const A = allures(50);
    expect(A.facile).toBeGreaterThan(4 * 60 + 55); // facile : 5:00-5:40 /km
    expect(A.facile).toBeLessThan(5 * 60 + 45);
    proche(A.seuil, 4 * 60 + 15, 12); // seuil ≈ 4:15 /km
    proche(A.vma, 3 * 60 + 55, 12); // intervalles ≈ 3:55 /km
    expect(A.marathon).toBeGreaterThan(A.semi);
    expect(A.semi).toBeGreaterThan(A.dix);
  });
  it("Riegel", () => {
    proche(riegel(10, 3000, 21.0975), 6619, 2); // 50 min au 10 km → ≈ 1 h 50 au semi
  });
});

describe("plan", () => {
  it("calendrier : plafonné à la durée utile, et signale une préparation courte", () => {
    const c = calendrier("semi", "2027-03-07", "2026-10-05");
    expect(c.semaines).toBe(16);
    expect(calendrier("marathon", "2026-11-15", "2026-10-05").court).toBe(true);
    expect(avertissement("marathon", null, 10)).toMatch(/16 semaines/);
    expect(avertissement("10k", { km: 5, sec: 1500 }, 10)).toBeNull();
  });
  it("phases, affûtage, semaine de course, séances par semaine", () => {
    const P = genererPlan(plan());
    expect(P).toHaveLength(16);
    expect(P[0].phase).toBe("fondation");
    expect(P.at(-1)!.phase).toBe("course");
    expect(P.at(-2)!.phase).toBe("affutage");
    expect(P.at(-1)!.seances.some((s) => s.type === "course")).toBe(true);
    for (const S of P.slice(0, -1)) expect(S.seances.filter((s) => s.type !== "renfo")).toHaveLength(4);
    expect(P.slice(0, -1).every((S) => S.seances.filter((s) => s.type === "renfo").length === 1)).toBe(true);
  });
  it("sortie longue : +10 % au plus, semaines allégées, pic avant l'affûtage", () => {
    const P = genererPlan(plan({ obj: "marathon", date: "2027-04-11" }));
    const L = P.map((s) => s.long);
    for (let k = 1; k < P.length; k++) if (!P[k].allegee && !P[k - 1].allegee && P[k].phase !== "affutage") expect(L[k]).toBeLessThanOrEqual(L[k - 1] * 1.1 + 0.5);
    expect(P.some((s) => s.allegee)).toBe(true);
    expect(Math.max(...L)).toBeGreaterThanOrEqual(28);
    expect(L.at(-2)!).toBeLessThan(Math.max(...L));
  });
  it("80 % facile : au plus une ou deux séances de qualité par semaine", () => {
    for (const S of genererPlan(plan({ jours: 5 }))) {
      const dures = S.seances.filter((s) => ["seuil", "vma", "allure"].includes(s.type)).length;
      expect(dures).toBeLessThanOrEqual(2);
    }
  });
  it("débutant : plus prudent", () => {
    const deb = genererPlan(plan({ ref: null })), conf = genererPlan(plan());
    expect(Math.max(...deb.map((s) => s.long))).toBeLessThan(Math.max(...conf.map((s) => s.long)));
  });
});

describe("adaptation et pause", () => {
  it("trop dur ou douleur : semaine suivante allégée", () => {
    const p = plan();
    expect(adapter(p, 3, { rpe: 9 })).toMatch(/10 %/);
    expect(p.ajust[4]).toBe(0.9);
    adapter(p, 3, { rpe: 6, douleur: true });
    expect(p.ajust[4]).toBe(0.8);
    expect(adapter(p, 5, { rpe: 6 })).toBeNull();
    const P = genererPlan(p);
    expect(P[4].long).toBeLessThan(genererPlan(plan())[4].long);
    expect(P[4].allegee).toBe(true);
  });
  it("reprise après une pause de 10 jours", () => {
    const p = plan();
    const N = genererPlan(p).length;
    p.pauses.push({ de: "2026-11-02" });
    const msg = reprendre(p, "2026-11-12", N);
    expect(msg).toMatch(/10 jours/);
    const k = semaineDe(p, "2026-11-12", N);
    expect(p.ajust[k]).toBe(0.7);
    expect(p.ajust[k + 1]).toBe(0.9);
    expect(p.pauses[0].a).toBe("2026-11-12");
  });
});
