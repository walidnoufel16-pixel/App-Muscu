/* Recalage des éléments fixés en bas quand l'iPhone décale la partie visible de l'écran. */
import { describe, expect, it } from "vitest";
import { decalage } from "@/lib/viewport";

describe("decalage", () => {
  it("écran normal : aucun décalage", () => {
    expect(decalage({ offsetTop: 0, height: 844, scale: 1 }, 844, false)).toBe(0);
  });
  it("partie visible plus bas que l'écran des éléments fixes : on descend d'autant", () => {
    expect(decalage({ offsetTop: 300, height: 844, scale: 1 }, 844, false)).toBe(300);
  });
  it("écran des éléments fixes resté raccourci après le clavier : on descend", () => {
    expect(decalage({ offsetTop: 0, height: 844, scale: 1 }, 508, false)).toBe(336);
  });
  it("clavier ouvert ou zoom : on ne touche à rien", () => {
    expect(decalage({ offsetTop: 0, height: 508, scale: 1 }, 844, true)).toBe(0);
    expect(decalage({ offsetTop: 120, height: 400, scale: 2 }, 844, false)).toBe(0);
  });
  it("écart d'un pixel (arrondis) ignoré", () => {
    expect(decalage({ offsetTop: 0.6, height: 844, scale: 1 }, 844, false)).toBe(0);
  });
});
