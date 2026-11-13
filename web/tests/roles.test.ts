/* Rôle des exercices (audit coach du 13 novembre 2026) : un seul « polyarticulaire » et un rôle
   naturel par exercice, pour les séances générées, les badges et le gabarit. */
import { describe, expect, it } from "vitest";
import { EX } from "@/lib/data/exercices";
import { construireSeance, hasardDe } from "@/lib/logic/assistant";
import { convientA, estPoly, roleDe } from "@/lib/logic/roles";

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
