import { describe, expect, it } from "vitest";
import { aRegarder, statutErreur, trierErreurs } from "@/lib/logic/erreurs";

const A = [{ message: "TypeError: x is undefined", note: "Corrigé le 18/11", cree: "2026-11-18" }];
describe("Admin › statut des erreurs", () => {
  it("reconnaît le bruit connu, les analysées et le reste", () => {
    expect(statutErreur("Error: Script error.", A).etat).toBe("ignoree");
    expect(statutErreur("InvalidStateError: Transition was aborted because of invalid state. Document hidden", A).etat).toBe("ignoree");
    expect(statutErreur("TypeError: x is undefined", A)).toEqual({ etat: "analysee", note: "Corrigé le 18/11" });
    expect(statutErreur("RangeError: boom", A).etat).toBe("a_regarder");
  });
  it("met les erreurs à regarder en premier et les compte", () => {
    const l = [{ message: "Error: Script error.", n: 5 }, { message: "RangeError: boom", n: 1 }, { message: "TypeError: x is undefined", n: 3 }];
    expect(trierErreurs(l, A).map((e) => e.statut.etat)).toEqual(["a_regarder", "analysee", "ignoree"]);
    expect(aRegarder(l, A)).toBe(1);
  });
});
