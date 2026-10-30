import { describe, expect, it } from "vitest";
import { niveauDu, rappelDu, seuil } from "../../supabase/functions/rappels/logique";

const jourDe = (ts: number) => new Date(ts).toISOString().slice(0, 10);
const j = (n: number) => new Date(Date.parse("2026-11-20T12:00:00Z") - n * 864e5).toISOString().slice(0, 10);
const AUJ = j(0);

describe("rappels après quelques jours sans séance", () => {
  it("seuil : 4 jours pour un rythme serré, écart habituel + 2 pour un rythme espacé", () => {
    expect(seuil([j(20), j(18), j(16), j(14)], AUJ)).toBe(4);
    expect(seuil([j(24), j(19), j(14), j(9)], AUJ)).toBe(7);
    expect(seuil([j(3)], AUJ)).toBe(4);
  });

  it("niveaux à 4, 8 et 15 jours, rien avant", () => {
    const base = [j(30), j(28), j(26)];
    expect(niveauDu([...base, j(3)], AUJ).niveau).toBe(0);
    expect(niveauDu([...base, j(4)], AUJ).niveau).toBe(1);
    expect(niveauDu([...base, j(8)], AUJ).niveau).toBe(2);
    expect(niveauDu([...base, j(15)], AUJ).niveau).toBe(3);
    expect(niveauDu([], AUJ).niveau).toBe(0);
  });

  it("propose la séance libre la moins récente et ne renvoie pas un niveau déjà envoyé", () => {
    const e = {
      HIST: [{ d: j(10), s: "L|0" }, { d: j(5), s: "L|1" }],
      SEANCES: [{ nom: "Haut du corps", ex: [1] }, { nom: "Jambes", ex: [1] }],
    };
    const r = rappelDu(e, AUJ, 0, "fr", jourDe);
    expect(r).toMatchObject({ niveau: 1, jours: 5, url: "/entrainement/seance/?l=0", corps: "Ta séance Haut du corps t'attend." });
    expect(rappelDu(e, AUJ, 1, "fr", jourDe)).toBeNull();
  });

  it("le cardio et la course comptent comme une séance", () => {
    const e = { HIST: [{ d: j(10), s: "L|0" }], CARDIO: [{ ts: Date.parse(j(1) + "T08:00:00Z") }] };
    expect(rappelDu(e, AUJ, 0, "fr", jourDe)).toBeNull();
    expect(rappelDu({ HIST: [{ d: j(10), s: "P|1" }], SORTIES: [{ d: j(2) }] }, AUJ, 0, "en", jourDe)).toBeNull();
  });
});
