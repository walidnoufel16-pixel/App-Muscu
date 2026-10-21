import { describe, expect, it } from "vitest";
import { decoderBlocs, deplacer, deplacerPartie, dureeTotale, encoderBlocs, estCombinee, nouveauBloc, ordre, partieDe, partiesDe, ranger, sections } from "@/lib/logic/combinee";

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

describe("parties d'une séance : soin & mobilité, musculation, cardio", () => {
  const e = (id: string) => ({ id, s: 2, r: 10, p: "30 s" });
  const ids = (s: Parameters<typeof ordre>[0]) => ordre(s).map((x) => (x.t === "ex" ? x.e.id : x.b.id));
  it("partieDe : soin, muscu, cardio, bloc", () => {
    expect(partieDe({ t: "ex", i: 0, e: e("elrot") })).toBe("soin");
    expect(partieDe({ t: "ex", i: 0, e: e("enf") })).toBe("soin"); // posture de l'enfant : rangée dans le soin du dos
    expect(partieDe({ t: "ex", i: 0, e: e("dc") })).toBe("muscu");
    expect(partieDe({ t: "bloc", b: bloc(0) })).toBe("cardio");
  });
  it("ranger : une nouvelle partie se place à la suite, chaque élément rejoint la sienne", () => {
    /* ordre d'ajout : soin, muscu, cardio, puis un 2e soin ajouté à la fin */
    const s = { ex: [e("elrot"), e("dc"), e("cbras")], blocs: [bloc(2)] };
    const r = ranger(s);
    expect(ids(r)).toEqual(["elrot", "cbras", "dc", "b2"]);
    expect(partiesDe(r)).toEqual(["soin", "muscu"].concat("cardio"));
    expect(sections(r).map((x) => [x.p, x.el.length])).toEqual([["soin", 2], ["muscu", 1], ["cardio", 1]]);
  });
  it("l'ordre des parties suit le choix : cardio d'abord si on l'ajoute d'abord", () => {
    const s = { ex: [e("dc"), e("elrot")], blocs: [bloc(0)] };
    expect(partiesDe(ranger(s))).toEqual(["cardio", "muscu", "soin"]);
  });
  it("monter / descendre une partie entière", () => {
    const s = ranger({ ex: [e("elrot"), e("cbras"), e("dc"), e("tr")], blocs: [bloc(4)] });
    const m = deplacerPartie(s, "cardio", -1);
    expect(ids(m)).toEqual(["elrot", "cbras", "b4", "dc", "tr"]);
    const d = deplacerPartie(m, "soin", 1);
    expect(ids(d)).toEqual(["b4", "elrot", "cbras", "dc", "tr"]);
    expect(ids(deplacerPartie(d, "cardio", -1))).toEqual(ids(d)); // déjà en tête
  });
});

