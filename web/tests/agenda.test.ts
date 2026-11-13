/* « Mon agenda » (lib/logic/agenda.ts) et ses rappels côté serveur (supabase/functions/rappels/logique.ts). */
import { describe, expect, it } from "vitest";
import { debutGrille, deplacer, faitsParJour, joursAgenda, seancesEnCours, nomCourt, programmer, rappelsDus, remplacerLe, retirer, tombeLe, type Prevu } from "@/lib/logic/agenda";
import { rappelsAgenda, seancePrevueBientot, rappelDu } from "../../supabase/functions/rappels/logique";
import type { LigneHist } from "@/lib/logic/historique";

const AUJ = "2026-11-05"; // jeudi
const jourDe = (ts: number) => new Date(ts).toISOString().slice(0, 10);
const pecs = (d: string, x: Partial<Prevu> = {}): Prevu => ({ id: "p" + d, d, nom: "Pecs et triceps", quoi: { t: "libre", i: 0 }, ...x });
const ligne = (d: string, nom = "Pecs et triceps"): LigneHist => ({ d, s: "L|0", nom, vol: 1000, ser: 9, ex: {} });

describe("grille", () => {
  it("commence le lundi de la semaine, sur 14 jours", () => {
    expect(debutGrille(AUJ)).toBe("2026-11-02");
    const J = joursAgenda({ HIST: [], AGENDA: [] }, debutGrille(AUJ), AUJ);
    expect(J).toHaveLength(14);
    expect(J[13].d).toBe("2026-11-15");
  });
  it("place le fait et le prévu au bon jour ; un prévu fait n'apparaît plus ; un prévu passé non fait est manqué", () => {
    const E = { HIST: [ligne("2026-11-02"), ligne("2026-11-04", "Dos et biceps")], AGENDA: [pecs("2026-11-04"), pecs("2026-11-03"), pecs("2026-11-10")] };
    const J = joursAgenda(E, "2026-11-02", AUJ);
    const j = (d: string) => J.find((x) => x.d === d)!;
    expect(j("2026-11-02").fait[0].nom).toBe("Pecs et triceps");
    expect(j("2026-11-04").prevus).toEqual([]); // fait (dos) ce jour-là : le prévu muscu disparaît
    expect(j("2026-11-03").manques).toHaveLength(1);
    expect(j("2026-11-10").prevus[0].nom).toBe("Pecs et triceps");
  });
  it("répétition hebdo, avec un jour retiré", () => {
    const p = pecs("2026-11-03", { hebdo: true, sauf: ["2026-11-10"] });
    expect(tombeLe(p, "2026-11-03")).toBe(true);
    expect(tombeLe(p, "2026-11-10")).toBe(false);
    expect(tombeLe(p, "2026-11-17")).toBe(true);
    expect(tombeLe(p, "2026-11-04")).toBe(false);
    expect(tombeLe(p, "2026-10-27")).toBe(false);
  });
  it("nom court pour la case", () => {
    expect(nomCourt("Pecs et triceps")).toBe("Pecs");
    expect(nomCourt("Pectoraux · Dos")).toBe("Pectoraux");
    expect(nomCourt("Recommandation d'Oxa")).toBe("Recommanda…");
  });
});

describe("modifier l'agenda", () => {
  it("déplacer : un prévu simple change de jour ; une répétition ne bouge que ce jour-là", () => {
    const A: Prevu[] = [pecs("2026-11-06"), pecs("2026-11-03", { id: "h", hebdo: true })];
    deplacer(A, "p2026-11-06", "2026-11-06", "2026-11-07");
    expect(A[0].d).toBe("2026-11-07");
    deplacer(A, "h", "2026-11-10", "2026-11-11");
    expect(A[1].sauf).toEqual(["2026-11-10"]);
    expect(A[2]).toMatchObject({ d: "2026-11-11", nom: "Pecs et triceps" });
    expect(A[2].hebdo).toBeUndefined();
  });
  it("retirer : ce jour seulement, ou toute la répétition", () => {
    const A: Prevu[] = [pecs("2026-11-03", { id: "h", hebdo: true })];
    retirer(A, "h", "2026-11-10");
    expect(A[0].sauf).toEqual(["2026-11-10"]);
    retirer(A, "h", "tout");
    expect(A).toEqual([]);
  });
  it("variante pour un jour d'une répétition : la répétition garde la séance, ce jour-là prend la variante", () => {
    const A: Prevu[] = [pecs("2026-11-03", { id: "h", hebdo: true, rappel: { veille: true, h: 20 } })];
    remplacerLe(A, "h", "2026-11-10", { t: "libre", i: 3 }, "Pecs et triceps (variante)");
    expect(A[0].sauf).toEqual(["2026-11-10"]);
    expect(A[1]).toMatchObject({ d: "2026-11-10", nom: "Pecs et triceps (variante)", quoi: { t: "libre", i: 3 }, rappel: { veille: true, h: 20 } });
  });
  it("refaire une séance faite = la programmer un autre jour", () => {
    const A: Prevu[] = [];
    const p = programmer(A, { d: "2026-11-09", nom: "Pecs et triceps", quoi: { t: "libre", i: 0 } });
    expect(p.id).toBeTruthy();
    expect(joursAgenda({ HIST: [ligne("2026-11-02")], AGENDA: A }, "2026-11-02", AUJ)[7].prevus).toHaveLength(1);
  });
});

describe("rappels d'agenda", () => {
  const E = { HIST: [] as LigneHist[], AGENDA: [pecs("2026-11-06", { rappel: { veille: true, h: 20 } }), pecs("2026-11-05", { id: "j", nom: "Jambes", rappel: { veille: false, h: 7 } })] };
  it("la veille à 20 h pour le lendemain, le jour même à 7 h", () => {
    expect(rappelsDus(E, AUJ, 20).map((x) => x.p.nom)).toEqual(["Pecs et triceps"]);
    expect(rappelsDus(E, AUJ, 7).map((x) => x.p.nom)).toEqual(["Jambes"]);
    expect(rappelsDus(E, AUJ, 19)).toEqual([]);
  });
  it("le jour même : rien si la séance est déjà faite", () => {
    expect(rappelsDus({ ...E, HIST: [ligne(AUJ, "Jambes")] }, AUJ, 7)).toEqual([]);
  });
  it("serveur : mêmes rappels, avec le texte de la notification", () => {
    expect(rappelsAgenda(E, AUJ, 20, "fr", jourDe)).toEqual([{ id: "p2026-11-06", titre: "Demain : Pecs et triceps", corps: "Prépare tes affaires de sport.", url: "/entrainement/" }]);
    expect(rappelsAgenda(E, AUJ, 7, "en", jourDe)[0].titre).toBe("Today: Jambes");
    expect(rappelsAgenda({ ...E, HIST: [ligne(AUJ)] }, AUJ, 7, "fr", jourDe)).toEqual([]);
  });
  it("le rappel « quelques jours sans séance » se tait quand une séance est prévue aujourd'hui ou demain", () => {
    expect(seancePrevueBientot(E, AUJ)).toBe(true);
    expect(seancePrevueBientot({ AGENDA: [pecs("2026-11-20")] }, AUJ)).toBe(false);
    expect(typeof rappelDu).toBe("function");
  });
});

describe("séance en cours", () => {
  const maintenant = Date.now(), auj = jourDe(maintenant), avant = jourDe(maintenant - 2 * 864e5);
  const E = {
    HIST: [{ d: auj, s: "L|0", nom: "Push", vol: 600, ser: 2, ex: {} }, { d: avant, s: "L|0", nom: "Push", vol: 600, ser: 3, ex: {} }],
    LOG: {
      "L|0|0": { done: false, ex: "dc", ts: maintenant - 20 * 60e3, series: [{ v: 60, reps: 10, ok: true }, { v: 60, reps: 10, ok: true }, { v: 60, reps: 10, ok: false }] },
      "L|0|a0": { done: true, ex: "dc", ts: maintenant - 2 * 864e5, series: [{ v: 60, reps: 10, ok: true }] },
    },
    SEANCES: [{ nom: "Push", ex: [] }], CARDIO: [], SORTIES: [],
  } as unknown as Parameters<typeof seancesEnCours>[0] & Parameters<typeof faitsParJour>[0];
  it("des séries validées il y a moins de 6 heures, pas encore rangées : en cours", () => {
    expect(seancesEnCours(E, maintenant)).toMatchObject([{ i: 0, nom: "Push", series: 2 }]);
    expect(seancesEnCours(E, maintenant + 7 * 3600e3)).toEqual([]);
  });
  it("ne compte pas encore comme faite dans l'agenda ; les séances rangées, si", () => {
    const f = faitsParJour(E);
    expect(f.get(auj)).toBeUndefined();
    expect(f.get(avant)?.length).toBe(1);
  });
});

import { programmerNouvelle } from "@/lib/logic/agenda";
import { feuilleDuJour } from "@/components/repere/agenda";
import type { Etat } from "@/lib/logic/types";

describe("menu du jour", () => {
  it("toucher un jour vide : le menu (aujourd'hui et à venir), rien pour un jour passé ; sinon la feuille du jour", () => {
    const vide = (d: string) => ({ d, fait: [], prevus: [], manques: [] }) as never;
    expect(feuilleDuJour(vide("2026-11-09"), "2026-11-09")).toEqual({ m: "nouvelle", d: "2026-11-09" });
    expect(feuilleDuJour(vide("2026-11-12"), "2026-11-09")).toEqual({ m: "nouvelle", d: "2026-11-12" });
    expect(feuilleDuJour(vide("2026-11-05"), "2026-11-09")).toBeNull();
    expect(feuilleDuJour({ d: "2026-11-12", fait: [], prevus: [{}], manques: [] } as never, "2026-11-09")).toEqual({ m: "jour", d: "2026-11-12" });
  });
  it("une séance créée pour un jour à venir est programmée ce jour-là, avec le rappel habituel", () => {
    const demain = new Date(Date.now() + 864e5).toISOString().slice(0, 10);
    const E = { A: { rappelAgenda: { veille: false, h: 7 } }, SEANCES: [{ nom: "Dos", ex: [] }] } as unknown as Etat;
    const p = programmerNouvelle(E, demain, 0);
    expect(E.AGENDA).toHaveLength(1);
    expect(p).toMatchObject({ d: demain, nom: "Dos", quoi: { t: "libre", i: 0 }, rappel: { veille: false, h: 7 } });
    const E2 = { A: {}, SEANCES: [{ nom: "Jambes", ex: [] }] } as unknown as Etat;
    expect(programmerNouvelle(E2, demain, 0).rappel).toEqual({ veille: true, h: 20 });
  });
  it("une séance créée pour aujourd'hui est ajoutée à aujourd'hui, sans rappel (il serait déjà passé)", () => {
    const auj = jourDe(Date.now());
    const E = { A: {}, SEANCES: [{ nom: "Dos", ex: [] }] } as unknown as Etat;
    const p = programmerNouvelle(E, auj, 0);
    expect(p).toMatchObject({ d: auj, quoi: { t: "libre", i: 0 } });
    expect(p.rappel).toBeUndefined();
  });
});
