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
  writeFileSync(f, src + "\nexport { valider, prefOk, PARID };\n");
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
