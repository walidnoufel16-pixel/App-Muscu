import { describe, expect, it } from "vitest";
import { tempsTenu } from "@/lib/logic/tenue";

describe("temps tenu d'une série en durée", () => {
  it("un seul côté : le temps écoulé moins la préparation, plafonné à la cible", () => {
    expect(tempsTenu(30, 40)).toBe(30);
    expect(tempsTenu(30, 30)).toBe(20);
    expect(tempsTenu(30, 5)).toBe(1);
  });
  it("côté par côté : les deux côtés au complet donnent la cible", () => {
    expect(tempsTenu(30, 10 + 30 + 5 + 30, true)).toBe(30);
  });
  it("côté par côté : arrêté pendant le côté droit, le côté le moins tenu compte", () => {
    expect(tempsTenu(30, 10 + 30 + 5 + 18, true)).toBe(18);
  });
  it("côté par côté : arrêté avant le côté droit, la gauche seule", () => {
    expect(tempsTenu(30, 10 + 22, true)).toBe(22);
    expect(tempsTenu(30, 10 + 30 + 3, true)).toBe(30);
  });
});
