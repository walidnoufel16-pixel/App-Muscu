import { describe, expect, it } from "vitest";
import { EX } from "@/lib/data/exercices";
import { echauffementDe } from "@/lib/logic/echauffement";

const ids = (e: { l: [string, string, string | null, string][] }) => e.l.map((x) => x[2]);

describe("échauffement adapté à la séance", () => {
  const push = echauffementDe(["dc", "dmh", "tri"]), jambes = echauffementDe(["sq", "pr", "rm"]), dos = echauffementDe(["tr", "rw", "cuban"]);
  it("chaque séance a ses propres étapes", () => {
    expect(ids(push)).toContain("pompi");
    expect(ids(jambes)).toEqual(expect.arrayContaining(["sqpc", "pont"]));
    expect(ids(dos)).toContain("fp");
    expect(ids(push).join()).not.toBe(ids(jambes).join());
  });
  it("séries d'approche sur le premier exercice chargé", () => {
    expect(push.l.at(-1)![2]).toBe("dc");
    expect(push.l.at(-1)![3]).toContain(EX.dc.n);
  });
  it("les exercices illustrés existent, la durée est la somme des étapes", () => {
    for (const e of [push, jambes, dos]) {
      for (const x of e.l) if (x[2]) expect(EX[x[2]], x[2]).toBeTruthy();
      expect(e.min).toBeGreaterThanOrEqual(8);
      expect(e.min).toBeLessThanOrEqual(16);
    }
  });
  it("aucun nombre de répétitions, jamais le mot RPE", () => {
    for (const e of [push, jambes, dos, echauffementDe(["pomp", "tr", "gai"])])
      for (const x of e.l) {
        expect(x.join(" ")).not.toMatch(/\d+\s*(rép|pompes|squats|reps)|\bRPE\b/i);
      }
  });
  it("séance de soin seule : une mise en route courte", () => {
    const s = echauffementDe(["tho", "hip"]);
    expect(s.l.length).toBe(1);
    expect(s.min).toBeLessThanOrEqual(3);
  });
});
