/* Mesure anonyme (lib/mesure.ts) : identifiant d'appareil, propriétés nettoyées, file et envoi par lots. */
import { beforeEach, describe, expect, it, vi } from "vitest";

const stock = new Map<string, string>();
vi.stubGlobal("localStorage", {
  getItem: (k: string) => stock.get(k) ?? null,
  setItem: (k: string, v: string) => void stock.set(k, String(v)),
  removeItem: (k: string) => void stock.delete(k),
});
vi.mock("@/lib/supabase", () => ({ sb: async () => null }));
const M = await import("@/lib/mesure");
const file = () => JSON.parse(stock.get("repere.mesure.file") || "[]");

beforeEach(() => stock.clear());

describe("mesure anonyme", () => {
  it("un identifiant d'appareil aléatoire, stable, au bon format", () => {
    const a = M.appareil();
    expect(a).toMatch(/^[a-z0-9]{20}$/);
    expect(M.appareil()).toBe(a);
  });
  it("seules des propriétés courtes et simples sont gardées", () => {
    expect(M.nettoyerProps({ r: "street", n: 3.14159, ok: true, objet: { x: 1 }, "Clé longue!": 1 })).toEqual({ r: "street", n: 3.14, ok: true });
    expect(M.nettoyerProps({ texte: "x".repeat(500) })).toEqual({ texte: "x".repeat(40) });
    expect(M.nettoyerProps({})).toBeUndefined();
  });
  it("un nom hors liste n'entre pas dans la file ; la file est bornée à 200", () => {
    M.noter("inconnu" as never);
    expect(file()).toHaveLength(0);
    for (let i = 0; i < 230; i++) M.noter("ouverture");
    expect(file()).toHaveLength(200);
    expect(file()[0]).toMatchObject({ nom: "ouverture" });
    expect(file()[0].jour).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
  it("envoi par lots de 50 ; en cas d'échec, le reste attend", async () => {
    for (let i = 0; i < 120; i++) M.noter("rubrique_ouverte", { r: "libre" });
    const lots: number[] = [];
    await M.envoyer(async (l) => { lots.push(l.length); return lots.length < 2; });
    expect(lots).toEqual([50, 50]);
    expect(file()).toHaveLength(70);
    await M.envoyer(async (l) => { lots.push(l.length); return true; });
    expect(lots.slice(2)).toEqual([50, 20]);
    expect(file()).toHaveLength(0);
  });
  it("sans Supabase, rien ne casse et la file reste", async () => {
    M.noter("seance_terminee", { r: "plan" });
    await M.envoyer();
    expect(file()).toHaveLength(1);
  });
});

describe("source des visiteurs", () => {
  it("l'ouverture du jour porte la source du premier lien, une seule fois par jour", () => {
    stock.set("repere.source", "tiktok");
    M.noterOuverture(); M.noterOuverture();
    expect(file()).toHaveLength(1);
    expect(file()[0]).toMatchObject({ nom: "ouverture", props: { src: "tiktok" } });
  });
  it("sans source : ouverture sans propriété", () => {
    M.noterOuverture();
    expect(file()[0].props).toBeUndefined();
  });
});
