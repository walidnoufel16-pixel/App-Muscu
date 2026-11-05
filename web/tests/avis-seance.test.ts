/* « L'avis d'Oxa » (lib/logic/avis-seance.ts). */
import { describe, expect, it } from "vitest";
import { appliquerAvis, avisSeance, candidat, estPoly } from "@/lib/logic/avis-seance";
import { construireSeance } from "@/lib/logic/assistant";
import { EX } from "@/lib/data/exercices";
import type { ExLibre, SeanceLibre } from "@/lib/logic/types";
import type { LigneHist } from "@/lib/logic/historique";

const SEL = ["m0", "m1", "m2", "m3", "bt"];
const AUJ = "2026-11-05";
const e = (id: string, s = 3, r = 10, p = "90 s"): ExLibre => ({ id, s, r, p });
const seance = (ex: ExLibre[], x: Partial<SeanceLibre> = {}): SeanceLibre => ({ nom: "t", ex, ...x });
const avis = (L: SeanceLibre, x: { H?: LigneHist[]; zones?: number[]; sel?: string[]; objectif?: number } = {}) =>
  avisSeance(L, { A: { objectif: x.objectif }, H: x.H, sel: x.sel ?? SEL, zones: x.zones, auj: AUJ });
const ids = (l: { id: string }[]) => l.map((a) => a.id);
/* une semaine équilibrée : dos et pecs déjà travaillés */
const semaine: LigneHist[] = [
  { d: "2026-11-02", s: "L|0", nom: "t", vol: 1, ser: 9, ex: { rw: [50, 1, 60, 10, 5], tr: [50, 1, 60, 10, 4] } },
  { d: "2026-11-01", s: "L|0", nom: "t", vol: 1, ser: 9, ex: { dc: [50, 1, 60, 10, 5], dm: [50, 1, 60, 10, 4] } },
];

describe("volume", () => {
  it("4 exercices de biceps : retirer le dernier curl d'isolation", () => {
    const L = seance([e("curlb"), e("cu"), e("pup"), e("mart"), e("tri"), e("dipt")]);
    const a = avis(L).find((x) => x.id === "trop-bic")!;
    expect(a).toBeDefined();
    expect(a.action).toEqual({ t: "retirer", id: "mart" });
    appliquerAvis(L, a.action!);
    expect(L.ex.map((x) => x.id)).not.toContain("mart");
    expect(ids(avis(L))).not.toContain("trop-bic");
  });
  it("un muscle prévu dont on a retiré les exercices : on propose d'en remettre un", () => {
    const L = seance([e("dc"), e("dh"), e("ecart")], { gen: { m: ["pec", "bic"], d: 45, obj: 0 } });
    const a = avis(L).find((x) => x.id === "oubli-bic")!;
    expect(a.action?.t).toBe("ajouter");
    expect(PAT(a.action)).toBe("fc");
  });
  it("séance trop longue, sans bouton", () => {
    const L = seance(["dc", "dh", "rw", "rh", "sq", "rm", "dm", "cu", "tri"].map((id) => e(id, 4)));
    const a = avis(L, { H: semaine }).find((x) => x.id === "long")!;
    expect(a).toBeDefined();
    expect(a.action).toBeUndefined();
  });
  it("séance trop légère : passer à 3 séries", () => {
    const L = seance([e("dc", 1), e("rw", 1), e("sq", 2)]);
    const a = avis(L).find((x) => x.id === "court")!;
    appliquerAvis(L, a.action!);
    expect(L.ex.every((x) => x.s === 3)).toBe(true);
  });
});

describe("équilibre", () => {
  it("haut du corps sans lombaires ni gainage : ajouter une extension lombaire disponible", () => {
    const L = seance([e("dc"), e("tr"), e("dm"), e("rh"), e("cu")]);
    const a = avis(L, { H: semaine }).find((x) => x.id === "gainage")!;
    expect(a.action?.t).toBe("ajouter");
    const id = (a.action as { id: string }).id;
    expect(EX[id].pat).toBe("lo");
    appliquerAvis(L, a.action!);
    expect(L.ex.at(-1)!.id).toBe(id);
    expect(ids(avis(L, { H: semaine }))).not.toContain("gainage");
  });
  it("9 séries de pecs, pas de dos de la semaine : ajouter un exercice de dos", () => {
    const L = seance([e("dc"), e("dh"), e("ecart"), e("tri")]);
    const a = avis(L).find((x) => x.id === "tirage")!;
    expect(["th", "tv"]).toContain(PAT(a.action));
    /* avec du dos dans la semaine, rien à dire */
    expect(ids(avis(L, { H: semaine }))).not.toContain("tirage");
  });
  it("quadriceps sans ischios", () => {
    const L = seance([e("sq", 4), e("pr"), e("lext")]);
    expect(PAT(avis(L).find((x) => x.id === "ischios")!.action)).toBe("fh");
  });
  it("que de l'isolation : ajouter un polyarticulaire, placé en tête", () => {
    const L = seance([e("ecart"), e("pecdk"), e("tri")]);
    const a = avis(L).find((x) => x.id === "poly")!;
    appliquerAvis(L, a.action!);
    expect(estPoly(L.ex[0].id)).toBe(true);
  });
  it("sans matériel adapté, le conseil n'a pas de bouton", () => {
    const L = seance([e("dc"), e("tr"), e("dm"), e("rh"), e("cu")]);
    const a = avis(L, { H: semaine, sel: [] }).find((x) => x.id === "gainage")!;
    expect(a.action).toBeUndefined();
  });
});

describe("ordre", () => {
  it("écarté avant développé couché : mettre le développé en premier", () => {
    const L = seance([e("ecart"), e("dc"), e("rw"), e("tri")]);
    const a = avis(L, { H: semaine }).find((x) => x.id === "ordre-dc")!;
    appliquerAvis(L, a.action!);
    expect(L.ex.map((x) => x.id)).toEqual(["dc", "ecart", "rw", "tri"]);
  });
  it("gainage avant le squat : à la fin", () => {
    const L = seance([e("crp"), e("sq"), e("rm"), e("pr")]);
    const a = avis(L).find((x) => x.id === "gainage-fin")!;
    appliquerAvis(L, a.action!);
    expect(L.ex.at(-1)!.id).toBe("crp");
  });
});

describe("réglages et corps", () => {
  it("objectif force : développé couché à 5 répétitions et 3 min", () => {
    const L = seance([e("dc"), e("rw"), e("sq", 3, 5, "3 min")], { obj: 1 });
    const a = avis(L).find((x) => x.id === "reglages")!;
    appliquerAvis(L, a.action!);
    expect(L.ex[0]).toMatchObject({ r: 5, p: "3 min" });
  });
  it("6 séries sur un exercice : garder 4", () => {
    const L = seance([e("dc", 6), e("rw"), e("tri")]);
    const a = avis(L).find((x) => x.id === "series")!;
    appliquerAvis(L, a.action!);
    expect(L.ex[0].s).toBe(4);
  });
  it("pecs travaillés hier : ils récupèrent encore", () => {
    const H: LigneHist[] = [{ d: "2026-11-04", s: "L|0", nom: "t", vol: 1, ser: 8, ex: { dc: [50, 1, 60, 10, 4], dh: [50, 1, 60, 10, 4] } }];
    const L = seance([e("dc"), e("dh"), e("rw")]);
    expect(avis(L, { H })[0].id).toBe("recup");
  });
  it("moins de 3 exercices de musculation : pas d'avis", () => {
    expect(avis(seance([e("cu"), e("mart")]))).toEqual([]);
  });
});

describe("cohérence avec les séances proposées par Oxa", () => {
  it("une séance générée ne déclenche ni volume ni ordre ni réglages", () => {
    const combos = [["pec", "tri"], ["dos", "bic"], ["qua", "isc", "mol"], ["epa", "abd"], ["bic", "tri"], ["pec", "dos", "epa", "qua", "isc", "abd"]];
    for (const m of combos) for (const d of [30, 45, 60]) for (const obj of [0, 1, 2, 3]) for (let k = 0; k < 8; k++) {
      let x = 0.37 * (k + 1);
      const rnd = () => (x = ((x * 9301 + 49297) % 233280) / 233280);
      const L = seance(construireSeance(m, d, obj, SEL, rnd), { obj, gen: { m, d, obj } });
      const l = avis(L, { H: semaine }).filter((a) => a.f !== "equilibre");
      expect(ids(l), `${m} ${d} min, objectif ${obj}`).toEqual([]);
    }
  });
  it("candidat : disponible avec le matériel et pas déjà pris", () => {
    const id = candidat(["th"], ["m2"], new Set(["rh"]))!;
    expect(EX[id].pat).toBe("th");
    expect(id).not.toBe("rh");
  });
});

function PAT(a: unknown) {
  return a && typeof a === "object" && "id" in a ? EX[(a as { id: string }).id].pat : undefined;
}
