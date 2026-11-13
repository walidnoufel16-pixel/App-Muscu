/* Rôle des exercices (audit coach du 13 novembre 2026) : un seul « polyarticulaire » et un rôle
   naturel par exercice, pour les séances générées, les badges et le gabarit. */
import { describe, expect, it } from "vitest";
import { EX } from "@/lib/data/exercices";
import { PAT2MUSC } from "@/lib/data/referentiels";
import { construireSeance, exPourRole, hasardDe } from "@/lib/logic/assistant";
import { secondesDe } from "@/lib/logic/core";
import type { ExLibre } from "@/lib/logic/types";
import { convientA, estPoly, placer, roleDe } from "@/lib/logic/roles";

describe("rôle des exercices", () => {
  it("les corrections du coach", () => {
    for (const id of ["sdts", "sql"]) expect(roleDe(id), id).toBe("b");
    for (const id of ["rwm", "tbarp"]) expect(roleDe(id), id).toBe("c");
    expect(roleDe("rkp")).toBe("b");
    for (const id of ["scap", "elf", "scappu", "trxy", "trxt", "curlpc"]) expect(roleDe(id), id).toBe("i");
  });
  it("les classiques", () => {
    expect(roleDe("sq")).toBe("b");
    expect(roleDe("dc")).toBe("b");
    expect(roleDe("tr")).toBe("b");
    expect(roleDe("fe")).toBe("c");
    expect(roleDe("dci")).toBe("c");
    expect(roleDe("lext")).toBe("i");
    expect(roleDe("curlh")).toBe("i");
    expect(roleDe("gai")).toBe("g");
  });
  it("pas de badge pour le cardio, le soin, les explosifs et les portés", () => {
    for (const id of ["ram", "jsq", "pompp", "kbsw", "pp", "ferm", "trpush", "kbtgu"]) expect(roleDe(id), id).toBeUndefined();
  });
  it("relatif au muscle affiché : une base qui ne le travaille qu'en second compte comme complément", () => {
    expect(roleDe("trs")).toBe("b");
    if (EX.trs.pat2) expect(roleDe("trs", "bic")).toBe("c");
  });
  it("chaque exercice a un rôle connu ou aucun", () => {
    for (const id of Object.keys(EX)) expect([undefined, "b", "c", "i", "g"], id).toContain(roleDe(id));
  });
  it("correspondance des cases : Base ← Base ou Complément ; Isolation ← Isolation", () => {
    expect(convientA("b", "fe")).toBe(true);
    expect(convientA("c", "dc")).toBe(true);
    expect(convientA("i", "dc")).toBe(false);
    expect(convientA("i", "lext")).toBe(true);
  });
  it("le soulevé de terre sumo n'est plus réglé comme de l'isolation dans les séances générées", () => {
    for (let k = 0; k < 30; k++) {
      const ex = construireSeance(["qua", "isc", "mol"], 60, 1, ["m0", "m1", "m2", "m3", "bt"], hasardDe("sumo" + k), () => false, 3);
      for (const e of ex) if (["sdts", "rwm", "tbarp", "sql"].includes(e.id)) expect(e.ro, e.id).not.toBe("i");
    }
    expect(estPoly("sdts")).toBe(true);
  });
});

describe("ajout à la main", () => {
  it("prescrit selon le rôle", () => {
    const b = exPourRole("sq", 0, 2), i = exPourRole("curlb", 0, 2);
    expect(b.ro).toBe("b");
    expect(i.ro).toBe("i");
    expect(b.r).toBeLessThan(i.r);
    expect(secondesDe(b.p)).toBeGreaterThan(secondesDe(i.p));
  });
  it("sans rôle : prescription par défaut", () => {
    expect(exPourRole("ferm", 0, 2).ro).toBeUndefined();
  });
  it("range : explosifs, Base, Complément, Isolation, Gainage, portés", () => {
    const ex: ExLibre[] = [exPourRole("curlb", 0), exPourRole("ferm", 0)];
    for (const id of ["gai", "sq", "fe", "jsq", "dc"]) placer(ex, exPourRole(id, 0));
    expect(ex.map((e) => e.id)).toEqual(["jsq", "sq", "dc", "fe", "curlb", "gai", "ferm"]);
  });
});

describe("supersets (M'affiner)", () => {
  const ANT: Record<string, string> = { pec: "dos", dos: "pec", bic: "tri", tri: "bic", qua: "isc", isc: "qua" };
  const muscle = (id: string) => PAT2MUSC[EX[id].pat];
  it("deux exercices de muscles opposés et de même rôle, côte à côte, repos court sur le premier", () => {
    let vus = 0;
    for (let k = 0; k < 20; k++) {
      const ex = construireSeance(["pec", "dos", "bic", "tri"], 60, 2, ["m0", "m1", "m2", "m3", "bt"], hasardDe("ss" + k), () => false, 2);
      ex.forEach((e, i) => {
        if (!e.sup) return;
        vus++;
        const b = ex[i + 1];
        expect(b, e.id).toBeTruthy();
        expect(ANT[muscle(e.id)]).toBe(muscle(b.id));
        expect(e.ro).toBe(b.ro);
        expect(["c", "i"]).toContain(e.ro);
        expect(e.p).toBe("15 s");
        expect(b.sup).toBeUndefined();
      });
    }
    expect(vus).toBeGreaterThan(0);
  });
  it("pas de superset pour les autres objectifs ni pour un débutant", () => {
    for (let k = 0; k < 10; k++) {
      for (const [obj, niv] of [[0, 2], [1, 3], [3, 2], [2, 1]])
        expect(construireSeance(["pec", "dos", "bic", "tri"], 60, obj, ["m0", "m1", "m2", "m3", "bt"], hasardDe("ns" + k), () => false, niv).some((e) => e.sup)).toBe(false);
    }
  });
});
