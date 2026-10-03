import { describe, expect, it } from "vitest";
import { decoderBlocs, deplacer, dureeTotale, encoderBlocs, estCombinee, nouveauBloc, ordre } from "@/lib/logic/combinee";

const ex = [{ id: "dc", s: 3, r: 8, p: "2 min" }, { id: "tr", s: 3, r: 8, p: "2 min" }, { id: "dmh", s: 3, r: 10, p: "90 s" }];
const bloc = (apres: number) => ({ ...nouveauBloc(apres, "trente", "velo", 1), id: "b" + apres });

describe("séances combinées", () => {
  it("ordre : les blocs se placent après le bon nombre d'exercices", () => {
    const s = { ex, blocs: [bloc(3), bloc(1)] };
    expect(ordre(s).map((x) => (x.t === "ex" ? x.e.id : x.b.id))).toEqual(["dc", "b1", "tr", "dmh", "b3"]);
    expect(estCombinee(s)).toBe(true);
    expect(estCombinee({ blocs: [] })).toBe(false);
  });
  it("déplacer un bloc au début, au milieu, à la fin", () => {
    const s = { ex, blocs: [bloc(3)] };
    expect(deplacer(s, 3, 0).blocs[0].apres).toBe(0);
    expect(deplacer(s, 3, 2).blocs[0].apres).toBe(2);
    const r = deplacer({ ex, blocs: [bloc(0)] }, 0, 3);
    expect(r.blocs[0].apres).toBe(3);
    expect(r.ex.map((e) => e.id)).toEqual(["dc", "tr", "dmh"]);
  });
  it("déplacer un exercice par-dessus un bloc garde le bloc à sa place relative", () => {
    const r = deplacer({ ex, blocs: [bloc(1)] }, 0, 1); // dc passe après le bloc
    expect(ordre(r).map((x) => (x.t === "ex" ? x.e.id : "bloc"))).toEqual(["bloc", "dc", "tr", "dmh"]);
  });
  it("durée totale : musculation + cardio", () => {
    const b = bloc(3);
    expect(dureeTotale({ ex, blocs: [b] })).toBeGreaterThan(dureeTotale({ ex }));
  });
  it("un bloc après de la musculation n'a pas d'échauffement", () => {
    expect(nouveauBloc(2, "fractionne", "ram", 1).r.echauf).toBe(0);
    expect(nouveauBloc(0, "fractionne", "ram", 1).r.echauf).toBe(300);
  });
  it("partage : format, machine, niveau et place voyagent", () => {
    const enc = encoderBlocs([{ ...bloc(2), n: 2 }]);
    expect(enc[0]).toEqual({ id: "bloccardio", s: 6, r: 1, p: "2,2" });
    const dec = decoderBlocs([{ id: "dc", s: 3, r: 8 }, ...enc]);
    expect(dec).toHaveLength(1);
    expect(dec[0]).toMatchObject({ f: "trente", m: "velo", n: 2, apres: 2 });
  });
});
