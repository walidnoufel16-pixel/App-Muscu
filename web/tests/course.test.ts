import { describe, expect, it } from "vitest";
import {
  adapter, allureHyrox, allures, ATELIERS, avertissement, calendrier, chronoPrevu, consigneAtelier, estimation, genererPlan, reprendre, riegel, seancesRenfoHyrox,
  semaineDe, tempsAteliers, tempsPrevu, vdot, type PlanCourse,
} from "@/lib/logic/course";
import { EX } from "@/lib/data/exercices";
import { scoreDe } from "@/lib/logic/defis";
import { BADGES, stats } from "@/lib/logic/motivation";
import type { Etat } from "@/lib/logic/types";

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


describe("suivi course", () => {
  it("chrono estimé : amélioré par une sortie soutenue récente, pas par un footing", () => {
    const p = plan(); // 50 min au 10 km
    const base = estimation(p, [], "2026-10-05").sec;
    expect(estimation(p, [{ d: "2026-10-01", km: 12, sec: 12 * 330, rpe: 4 }], "2026-10-05").sec).toBe(base); // footing facile
    const mieux = estimation(p, [{ d: "2026-10-01", km: 10, sec: 46 * 60, rpe: 9 }], "2026-10-05");
    expect(mieux.sec).toBeLessThan(base);
    expect(mieux.depuis?.km).toBe(10);
    expect(estimation(p, [{ d: "2026-06-01", km: 10, sec: 40 * 60, rpe: 9 }], "2026-10-05").sec).toBe(base); // trop ancienne
  });
  it("défi kilomètres et badges course", () => {
    const E = { A: {}, LOG: {}, SWAP: {}, SWAPP: {}, PLAN: null, SEANCES: [], wk: 0, day: 0, FINI: false,
      SORTIES: [{ d: "2026-10-02", km: 60.4, sec: 20000, rpe: 5 }, { d: "2026-10-04", km: 42.2, sec: 13000, rpe: 9, course: true }, { d: "2026-09-01", km: 10, sec: 3000, rpe: 5 }] } as unknown as Etat;
    expect(scoreDe(E, { type: "km", debut: "2026-10-01", fin: "2026-10-31" })).toBe(103);
    expect(scoreDe(E, { type: "seances", debut: "2026-10-01", fin: "2026-10-31" })).toBe(2);
    const s = stats(E, "2026-10-05"), ok = BADGES.filter((b) => b.valeur(s) >= b.cible).map((b) => b.id);
    expect(ok).toEqual(expect.arrayContaining(["run1", "km100", "jourj"]));
    expect(ok).not.toContain("km500");
  });
});

describe("Hyrox", () => {
  const hx = (x: Partial<PlanCourse> = {}) => plan({ obj: "hyrox", date: "2027-01-10", cat: "h", salle: true, ...x });
  it("plan de 8 à 12 semaines, une séance « Course + ateliers » par semaine qui monte en tours", () => {
    const p = hx(), P = genererPlan(p);
    expect(P.length).toBeGreaterThanOrEqual(8);
    expect(P.length).toBeLessThanOrEqual(12);
    const tours = P.slice(0, -1).map((W) => W.seances.filter((x) => x.type === "hyrox"));
    for (const t of tours) expect(t.length).toBe(1);
    const n = tours.map((t) => t[0].tours!.length);
    expect(n[0]).toBe(4); // fondation : 4 tours de 500 m
    expect(tours[0][0].tours![0].km).toBe(0.5);
    expect(Math.max(...n)).toBe(8); // simulation complète en phase spécifique
    expect(n.at(-1)).toBe(4); // affûtage
    /* chaque tour : un km libre puis un atelier libre, entre échauffement et retour au calme */
    const ph = tours.find((t) => t[0].tours!.length === 8)![0].phases!;
    expect(ph[0].type).toBe("echauf");
    expect(ph.at(-1)!.type).toBe("calme");
    expect(ph.filter((x) => x.libre).length).toBe(16);
    expect(ph.map((x) => x.titre)).toEqual(expect.arrayContaining(["SkiErg", "Wall balls", "Farmer's carry"]));
  });
  it("jour J : Hyrox, chrono = 8 km à l'allure Hyrox + ateliers", () => {
    const P = genererPlan(hx()), J = P.at(-1)!.seances.find((x) => x.type === "course")!;
    expect(J.titre).toMatch(/Hyrox/);
    expect(J.km).toBe(8);
    const A = allures(vdot(10, 3000));
    expect(chronoPrevu("hyrox", vdot(10, 3000))).toBe(Math.round(8 * allureHyrox(A) + tempsAteliers(vdot(10, 3000))));
    expect(allureHyrox(A)).toBe(A.dix + 30);
    expect(estimation(hx(), [], "2026-10-05").sec).toBe(chronoPrevu("hyrox", vdot(10, 3000)));
  });
  it("charges de la catégorie, et remplaçants sans machine", () => {
    const wall = ATELIERS.find((a) => a.k === "wall")!, ski = ATELIERS.find((a) => a.k === "ski")!;
    expect(consigneAtelier(wall, 1, { cat: "h", salle: true }).dose).toBe("× 100 · 6 kg");
    expect(consigneAtelier(wall, 1, { cat: "f", salle: true }).dose).toBe("× 100 · 4 kg");
    expect(consigneAtelier(ski, 0.75, { salle: true }).dose).toBe("750 m");
    expect(consigneAtelier(ski, 1, { salle: false }).texte).toMatch(/Sans machine/);
    const P = genererPlan(hx({ salle: false })), seance = P.flatMap((W) => W.seances).find((x) => x.type === "hyrox" && x.tours!.length === 8)!;
    expect(seance.phases!.find((x) => x.titre === "SkiErg")!.consigne).toMatch(/Sans machine/);
  });
  it("renfo Hyrox A et B, adaptés au matériel ; les plans de course ne changent pas", () => {
    const tout = seancesRenfoHyrox(() => true), rien = seancesRenfoHyrox((id) => ["fepc", "jsq", "burpsl", "gai", "sqpc", "pont", "ra", "fsaut"].includes(id));
    expect(tout.map((s) => s.nom)).toEqual(["Renfo Hyrox A", "Renfo Hyrox B"]);
    expect(tout[1].ex.map((e) => e.id)).toContain("trpush");
    expect(rien[1].ex.map((e) => e.id)).not.toContain("trpush");
    for (const s of [...tout, ...rien]) for (const e of s.ex) expect(EX[e.id], e.id).toBeTruthy();
    expect(genererPlan(hx()).flatMap((W) => W.seances).filter((x) => x.type === "renfo")[0].titre).toBe("Renfo Hyrox A");
    expect(genererPlan(plan()).flatMap((W) => W.seances).some((x) => x.type === "hyrox")).toBe(false);
  });
});
describe("Hyrox : charges réduites", () => {
  it("traîneau à 70 % tant que la dose est partielle, charge de course à pleine dose", () => {
    const push = ATELIERS.find((a) => a.k === "push")!;
    expect(consigneAtelier(push, 0.5, { cat: "h", salle: true }).dose).toBe("30 m · 105 kg");
    expect(consigneAtelier(push, 1, { cat: "f", salle: true }).dose).toBe("50 m · 102 kg");
  });
  it("chrono réaliste : 50 min au 10 km donne un premier Hyrox entre 1 h 15 et 1 h 35", () => {
    const t = chronoPrevu("hyrox", vdot(10, 3000));
    expect(t).toBeGreaterThan(75 * 60);
    expect(t).toBeLessThan(95 * 60);
  });
});
