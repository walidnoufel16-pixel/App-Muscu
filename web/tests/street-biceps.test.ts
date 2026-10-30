import { describe, expect, it } from "vitest";
import { construireSeance } from "@/lib/logic/assistant";
import { EX } from "@/lib/data/exercices";

describe("street workout : biceps sans haltères", () => {
  it("poids du corps et barre : des tractions qui travaillent les biceps", () => {
    const l = construireSeance(["bic"], 30, 0, ["m3", "bt"], () => 0);
    expect(l.length).toBeGreaterThan(0);
    for (const e of l) expect(EX[e.id].pat2).toBe("fc");
  });
  it("avec des haltères, l'isolation reste prioritaire", () => {
    const l = construireSeance(["bic"], 30, 0, ["m2"], () => 0);
    for (const e of l) expect(EX[e.id].pat).toBe("fc");
  });
});
