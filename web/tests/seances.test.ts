/* Construction des séances : cases par fonction, prescription selon le rôle, durée réelle
   (docs/audit/bilan-2026-11-10.md, S4 et S5). Cinq profils types, vingt tirages chacun. */
import { describe, expect, it } from "vitest";
import { construireSeance, dureeEstimee, hasardDe } from "@/lib/logic/assistant";
import { EX } from "@/lib/data/exercices";

const SALLE = ["m0", "m1", "m2", "m3", "bt"], HALT = ["m2", "m3"];
const PROFILS: [string, string[], number, number, string[], number][] = [
  ["débutante 30 min haltères full body", ["pec", "dos", "qua", "isc", "epa", "abd"], 30, 2, HALT, 1],
  ["débutant 45 min salle full body", ["pec", "dos", "qua", "isc", "epa", "abd"], 45, 0, SALLE, 1],
  ["régulier 45 min bas du corps", ["qua", "isc", "mol", "abd"], 45, 0, SALLE, 2],
  ["confirmé 60 min force jambes", ["qua", "isc", "mol"], 60, 1, SALLE, 3],
  ["confirmé 60 min poussée", ["pec", "tri", "epa"], 60, 0, SALLE, 3],
];
const SAUTS = /saut|bond|plyo|genoux-poitrine/i;
const tirages = (p: (typeof PROFILS)[number]) => Array.from({ length: 20 }, (_, k) => construireSeance(p[1], p[2], p[3], p[4], hasardDe(p[0] + k), () => false, p[5], { dense: p[2] === 30 }));

describe.each(PROFILS)("%s", (...p) => {
  const S = tirages(p);
  it("durée réelle à 5 min près de la durée choisie, 24 séries au plus", () => {
    for (const ex of S) {
      expect(Math.abs(dureeEstimee(ex) - p[2])).toBeLessThanOrEqual(5);
      expect(ex.reduce((a, e) => a + e.s, 0)).toBeLessThanOrEqual(24);
    }
  });
  it("ni pliométrie, ni balistique, ni soin, ni élévations frontales, ni doublon", () => {
    for (const ex of S) {
      const ids = ex.map((e) => e.id);
      expect(new Set(ids).size).toBe(ids.length);
      for (const id of ids) {
        expect(EX[id].soin, id).toBeFalsy();
        expect(EX[id].horsIA, id).toBeFalsy();
        expect(SAUTS.test(EX[id].n), id).toBe(false);
        expect(["pp", "elf", "elfp", "abd"]).not.toContain(id);
      }
      /* jamais deux leg extensions */
      expect(ids.filter((id) => id.startsWith("lext")).length).toBeLessThanOrEqual(1);
    }
  });
  it("un polyarticulaire en tête pour chaque grand muscle, l'isolation après", () => {
    for (const ex of S) {
      if (p[1].includes("qua")) expect(ex.some((e) => EX[e.id].pat === "eg" && EX[e.id].pat2)).toBe(true);
      if (p[1].includes("isc")) expect(ex.some((e) => EX[e.id].pat === "fh" && ["rm", "rmh", "ht", "trap", "sdt", "gm", "sdts", "kbsdt1", "pth", "pont"].includes(e.id))).toBe(true);
      const premier = ex.findIndex((e) => !EX[e.id].pat2), dernierPoly = ex.map((e) => !!EX[e.id].pat2 && !["ae", "ft"].includes(EX[e.id].pat)).lastIndexOf(true);
      if (premier >= 0 && dernierPoly >= 0) expect(dernierPoly).toBeLessThan(ex.length);
    }
  });
});

describe("règles du coach", () => {
  it("épaules : des élévations latérales dès qu'il y a la place", () => {
    for (let k = 0; k < 20; k++) {
      const ex = construireSeance(["pec", "tri", "epa"], 60, 0, SALLE, hasardDe("e" + k), () => false, 3);
      expect(ex.some((e) => ["el", "elp", "eli", "elel"].includes(e.id))).toBe(true);
    }
  });
  it("débutant : un exercice par grand muscle, 3 séries au plus, 10 répétitions et plus", () => {
    for (let k = 0; k < 20; k++) {
      const ex = construireSeance(["pec", "dos", "qua", "isc", "epa", "abd"], 45, 0, SALLE, hasardDe("d" + k), () => false, 1);
      for (const e of ex) { expect(e.s).toBeLessThanOrEqual(3); if (EX[e.id].ch === "kg") expect(e.r).toBeGreaterThanOrEqual(10); }
      for (const pat of ["ph", "eg"]) expect(ex.filter((e) => EX[e.id].pat === pat).length).toBeLessThanOrEqual(1);
    }
  });
  it("force : mouvement principal lourd (4 à 6 répétitions, 3 min de repos)", () => {
    const ex = construireSeance(["qua", "isc", "mol"], 60, 1, SALLE, hasardDe("f"), () => false, 3);
    expect(ex[0].r).toBeLessThanOrEqual(6);
    expect(ex[0].p).toBe("3 min");
  });
  it("street workout : les exercices au poids du corps restent possibles", () => {
    const ex = construireSeance(["pec", "dos", "qua"], 45, 0, ["m3", "bt"], hasardDe("s"), () => false, 2);
    expect(ex.length).toBeGreaterThanOrEqual(3);
  });
});
