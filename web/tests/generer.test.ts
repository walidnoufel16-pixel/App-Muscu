/* Garde-fou de la fonction Edge `generer` : un exercice hors préférences de
   matériel est remplacé, même si l'IA l'a proposé. La fonction est chargée sans
   serveur ni réseau (Deno simulé) ; aucun appel à l'IA n'est fait. */
import { beforeAll, describe, expect, it } from "vitest";
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let F: any;
beforeAll(async () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (globalThis as any).Deno = { env: { get: () => undefined }, serve: () => {} };
  const src = readFileSync(new URL("../../supabase/functions/generer/index.ts", import.meta.url), "utf8");
  const f = join(mkdtempSync(join(tmpdir(), "generer-")), "generer.ts");
  writeFileSync(f, src + "\nexport { valider, prefOk, PARID, signature, SYSTEME };\n");
  F = await import(/* @vite-ignore */ f);
});

const ex = (id: string, role = 0) => ({ id, s: 3, r: 8, p: "90 s", o: role });
const plan = (seances: { t: string; ex: ReturnType<typeof ex>[] }[]) => ({ plan: { t: "Plan", i: "Intro", c: [] }, seances });

describe("generer : préférences de matériel", () => {
  it("pectoraux au poids du corps en salle complète : développé couché et presse remplacés", () => {
    const A = { materiel: 0, socle: 0, prefs: { Pectoraux: [3] } };
    const v = F.valider(plan([
      { t: "Haut A", ex: [ex("dc", 1), ex("tr", 1), ex("dhi"), ex("el")] },
      { t: "Bas A", ex: [ex("sq", 1), ex("rm", 1), ex("fe")] },
    ]), A);
    expect(v.ok).toBe(true);
    const ids = v.seances.flatMap((s: { exercices: { id: string }[] }) => s.exercices.map((e) => e.id));
    for (const id of ids) if (F.PARID[id].pat === "ph") expect(F.PARID[id].eq, id).toBe(3);
    expect(ids[0]).toBe("pomp");
    expect(ids).toContain("sq"); // les autres groupes ne bougent pas
    expect(new Set(ids.slice(0, 4)).size).toBe(4); // pas de doublon dans la séance
    expect(v.notes.remplaces).toContain("dc → pomp");
  });
  it("sans préférence, rien n'est remplacé", () => {
    const v = F.valider(plan([{ t: "A", ex: [ex("dc", 1), ex("tr", 1)] }, { t: "B", ex: [ex("sq", 1), ex("rm", 1)] }]), { materiel: 0, socle: 0 });
    expect(v.seances[0].exercices[0].id).toBe("dc");
    expect(v.notes.remplaces).toEqual([]);
  });
  it("catégories : haltères, kettlebell en option, élastiques", () => {
    expect(F.prefOk(F.PARID.dh, { prefs: { Pectoraux: [2] } })).toBe(true);
    expect(F.prefOk(F.PARID.dc, { prefs: { Pectoraux: [2] } })).toBe(false);
    expect(F.prefOk(F.PARID.gob, { prefs: { Quadriceps: [4] } })).toBe(true);
    expect(F.prefOk(F.PARID.dc, { prefs: { Pectoraux: [] } })).toBe(true);
  });
});

describe("generer : langue", () => {
  const P = { plan: { t: "", i: "", c: [] }, seances: [{ ex: [ex("dc", 1), ex("tr", 1)] }, { ex: [ex("sq", 1), ex("rm", 1)] }] };
  it("en anglais : textes par défaut en anglais, consigne de sortie en anglais", () => {
    const v = F.valider(structuredClone(P), { materiel: 0, socle: 0, langue: "en" });
    expect(v.plan.titre).toBe("Your plan");
    expect(v.seances[0].titre).toBe("Workout");
    expect(v.plan.choix.map((c: { titre: string }) => c.titre)).toContain("Eight weeks that build up, then a lighter week");
    expect(F.SYSTEME(0, 3, false, [], true)).toContain("LANGUE DE SORTIE : ANGLAIS");
    expect(F.SYSTEME(0, 3, false, [], false)).not.toContain("ANGLAIS");
  });
  it("en français : rien ne change", () => {
    const v = F.valider(structuredClone(P), { materiel: 0, socle: 0 });
    expect(v.plan.titre).toBe("Ton plan");
    expect(v.seances[0].titre).toBe("Séance");
  });
  it("cache : un programme anglais n'est jamais servi en français, signatures françaises inchangées", async () => {
    const A = { objectif: 0, regularite: 2, socle: 1, axe: 0, materiel: 0, sexe: 0 };
    const fr = await F.signature(A), en = await F.signature({ ...A, langue: "en" });
    expect(en).not.toBe(fr);
    expect(await F.signature({ ...A, langue: "fr" })).toBe(fr);
  });
});


describe("generer : Oxa Plan v2", () => {
  it("programme type selon le nombre de séances, répétitions selon l'objectif", () => {
    const s2 = F.SYSTEME(0, 2, false, [], false, 0), s4 = F.SYSTEME(0, 4, false, [], false, 1);
    expect(s2).toContain("FULL BODY (A et B)");
    expect(s2).toContain("6 à 10 sur les principaux");
    expect(s4).toContain("HAUT / BAS");
    expect(s4).toContain("3 à 6");
  });
  it("un grand groupe sous la cible reçoit des séries ; une séance trop longue est rognée", () => {
    const A = { materiel: 0, socle: 0, regularite: 3, objectif: 0 };
    const plan = { seances: [
      { t: "Full body A", ex: [ex("dc", 1), ex("sq", 1), { id: "cu", s: 3, r: 12, p: "60 s", o: 0 }] },
      { t: "Full body B", ex: [ex("tr", 1), ex("rm", 1), { id: "cu", s: 3, r: 12, p: "60 s", o: 0 }] },
    ] };
    const v = F.valider(plan, A);
    expect(v.ok).toBe(true);
    /* un seul exercice de pectoraux : monté de 3 à 5 séries (plafond par exercice) */
    expect(v.notes.volume["Pectoraux"]).toBe(5);
    expect(v.notes.corriges.join(" ")).toContain("Pectoraux");
    for (const s of v.seances) expect(s.exercices.reduce((n: number, e: { series: number }) => n + e.series, 0)).toBeLessThanOrEqual(24);
  });
});
