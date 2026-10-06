/* Agrégats de l'accès admin (lib/logic/admin.ts) sur des comptes fictifs. */
import { describe, expect, it } from "vitest";
import { derniereActivite, filtrer, ilya, resume, tableau, type CompteAdmin } from "@/lib/logic/admin";
import type { LigneHist } from "@/lib/logic/historique";

const AUJ = "2026-10-07"; // un mercredi
const h = (d: string, s: string, ex: string[]): LigneHist => ({ d, s, nom: "Séance", vol: 1000, ser: 9, ex: Object.fromEntries(ex.map((id) => [id, [60, 8, 70, 8, 3]])) as LigneHist["ex"] });
const compte = (id: string, o: Partial<CompteAdmin> & { etat?: CompteAdmin["etat"] }): CompteAdmin => ({
  id, email: null, anonyme: true, cree: "2026-09-01T10:00:00Z", connexion: null, pseudo: id, maj: null, etat: {}, ...o,
});

const L: CompteAdmin[] = [
  compte("ana", {
    email: "ana@ex.fr", anonyme: false, cree: "2026-10-05T10:00:00Z",
    etat: {
      A: { objectif: 0, materiel: 3, defis: ["ABCDE"], forme: { d: AUJ, sommeil: 1, energie: 1, courbatures: 1 } },
      FINI: true, wk: 2, HIST: [h("2026-10-06", "2|0", ["pomp", "sqpc"]), h("2026-09-29", "1|0", ["pomp"])],
    },
  }),
  compte("bob", {
    cree: "2026-08-01T10:00:00Z",
    etat: {
      A: { objectif: 1, materiel: 0, prot: { [AUJ]: 40 } },
      HIST: [h("2026-09-20", "L|0", ["dc"])],
      CARDIO: [{ nom: "Tabata", f: "tabata", m: "velo", min: 20, effort: 7, ts: Date.parse("2026-10-07T08:00:00") }],
      SORTIES: [{ d: "2026-10-04", km: 10.4, sec: 3300, rpe: 4 }],
      COURSE: { obj: "10k", date: "2026-12-01", debut: "2026-10-05", jours: 3, renfo: 1, ref: null, pauses: [], ajust: {}, cree: "2026-10-01" },
    } as CompteAdmin["etat"],
  }),
  compte("cle", { cree: "2026-06-01T10:00:00Z", maj: "2026-07-01T10:00:00Z" }),
];

describe("admin", () => {
  it("dernière activité : séance, cardio ou sortie, sinon synchronisation", () => {
    expect(derniereActivite(L[0])).toBe("2026-10-06");
    expect(derniereActivite(L[1])).toBe(AUJ);
    expect(derniereActivite(L[2])).toBe("2026-07-01");
  });
  it("résumé d'un compte", () => {
    const r = resume(L[0]);
    expect(r).toMatchObject({ seances: 2, muscu: 2, plan: "Semaine 3/8", course: false, objectif: expect.any(String) });
    const b = resume(L[1]);
    expect(b).toMatchObject({ seances: 3, cardio: 1, sorties: 1, km: 10, course: true, plan: null });
  });
  it("tableau de bord", () => {
    const T = tableau(L, AUJ);
    expect(T).toMatchObject({ total: 3, avecMail: 1, anonymes: 2, nouveaux7: 1, nouveaux30: 1, actifs7: 2, actifs30: 2 });
    expect(T.semaines).toHaveLength(8);
    expect(T.semaines.at(-1)).toMatchObject({ lundi: "2026-10-05", seances: 2, comptes: 2 });
    const u = Object.fromEntries(T.usage.map((x) => [x.k, x.comptes]));
    expect(u).toMatchObject({ plan: 1, carte: 1, cardio: 1, combinee: 0, course: 1, defis: 1, forme: 1, prot: 1 });
    expect(T.topEx[0]).toEqual({ id: "pomp", seances: 2, comptes: 1 });
    expect(T.objectifs.reduce((n, [, v]) => n + v, 0)).toBe(2);
  });
  it("recherche et tri", () => {
    expect(filtrer(L, "ANA@", "activite").map((c) => c.id)).toEqual(["ana"]);
    expect(filtrer(L, "", "activite").map((c) => c.id)).toEqual(["bob", "ana", "cle"]);
    expect(filtrer(L, "", "inscription").map((c) => c.id)).toEqual(["ana", "bob", "cle"]);
    expect(filtrer(L, "", "seances").map((c) => c.id)).toEqual(["bob", "ana", "cle"]);
  });
  it("il y a…", () => {
    expect(ilya(AUJ, AUJ)).toBe("aujourd'hui");
    expect(ilya("2026-10-06", AUJ)).toBe("hier");
    expect(ilya("2026-10-01", AUJ)).toBe("il y a 6 j");
    expect(ilya(null, AUJ)).toBe("jamais");
  });
});
