import { describe, expect, it } from "vitest";
import { prochaineLibre } from "@/lib/logic/prochaine";

const s = (n = 3, soin?: string) => ({ ex: Array(n).fill({}), ...(soin ? { soin } : {}) });

describe("séance libre à proposer", () => {
  it("aucune séance : rien", () => {
    expect(prochaineLibre([], [])).toBeNull();
    expect(prochaineLibre([s(0), s(3, "dos")])).toBeNull();
  });
  it("une jamais faite passe en premier, dans l'ordre de la liste", () => {
    expect(prochaineLibre([s(), s(), s()], [{ d: "2026-10-20", s: "L|0" }])).toBe(1);
  });
  it("toutes faites : la plus ancienne", () => {
    const h = [{ d: "2026-10-20", s: "L|0" }, { d: "2026-10-27", s: "L|0" }, { d: "2026-10-22", s: "L|1" }, { d: "2026-10-25", s: "L|2" }];
    expect(prochaineLibre([s(), s(), s()], h)).toBe(1);
  });
  it("les routines de soin et les séances du programme ne comptent pas", () => {
    expect(prochaineLibre([s(3, "dos"), s()], [{ d: "2026-10-20", s: "1|0" }])).toBe(1);
  });
});
