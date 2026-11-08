/* Corps en miniature de la fiche (lib/logic/muscles-cibles.ts). */
import { describe, expect, it } from "vitest";
import { musclesCibles } from "@/lib/logic/muscles-cibles";
import { CORPS } from "@/lib/data/corps";

const zones = [...CORPS.front, ...CORPS.back];
const noms = (id: string, k: "principal" | "secondaire") => [...new Set(zones.filter((z) => musclesCibles(id)![k](z)).map((z) => z.n))].sort();

describe("musclesCibles", () => {
  it("développé couché : pectoraux principaux, triceps et épaules en secondaire", () => {
    expect(noms("dc", "principal")).toEqual(["Pectoraux"]);
    expect(noms("dc", "secondaire")).toContain("Triceps");
  });
  it("plusieurs secondaires : extensions lombaires → fessiers ; soulevé de terre → lombaires", () => {
    expect(noms("lom", "principal")).toEqual(["Lombaires, bas du dos"]);
    expect(noms("lom", "secondaire")).toEqual(expect.arrayContaining(["Fessiers", "Ischio-jambiers, arrière de la cuisse"]));
    expect(noms("sdt", "secondaire")).toContain("Lombaires, bas du dos");
  });
  it("un principal n'est jamais aussi secondaire", () => {
    for (const id of ["dc", "sq", "sdt", "tp", "rw"]) {
      const m = musclesCibles(id)!;
      for (const z of zones) expect(m.principal(z) && m.secondaire(z)).toBe(false);
    }
  });
  it("exercice inconnu : rien", () => expect(musclesCibles("???")).toBeNull());
});
