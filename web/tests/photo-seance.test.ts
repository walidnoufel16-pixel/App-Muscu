/* Photo des aperçus de séance : choisie selon les muscles, jamais une photo d'exercice. */
import { describe, expect, it } from "vitest";
import { photoSeance } from "@/components/repere/accueil-entrainement";
import { EX } from "@/lib/data/exercices";
import { PAT2MUSC } from "@/lib/data/referentiels";

const de = (m: string, n: number) => Object.keys(EX).filter((id) => PAT2MUSC[EX[id].pat] === m && EX[id].pat !== "ca").slice(0, n);

describe("photoSeance", () => {
  it("le groupe le plus travaillé", () => {
    expect(photoSeance([...de("pec", 3), ...de("tri", 1)]).grand).toBe("/img/grand/seance-pecs.avif");
    expect(photoSeance(de("dos", 3)).grand).toBe("/img/grand/seance-dos.avif");
    expect(photoSeance(de("qua", 3)).grand).toBe("/img/grand/seance-jambes.avif");
  });
  it("haut et bas partagés : corps entier", () => {
    expect(photoSeance([...de("pec", 2), ...de("qua", 2)]).grand).toBe("/img/grand/seance-corps.avif");
  });
  it("sans exercice : corps entier", () => {
    expect(photoSeance([]).grand).toBe("/img/grand/seance-corps.avif");
  });
});
