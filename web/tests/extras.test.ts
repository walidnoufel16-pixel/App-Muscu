import { describe, expect, it } from "vitest";
import { ajouterProt, objectifProteines, protDuJour } from "@/lib/logic/nutrition";
import { comparer, moisPrecedent, periode, recap } from "@/lib/logic/recap";
import { phaseDe } from "@/lib/cycle";
import type { Etat, Reponses } from "@/lib/logic/types";

describe("protéines", () => {
  it("objectif selon poids et objectif, ou réglé à la main", () => {
    expect(objectifProteines({ objectif: 0, profil: { Poids: 80 } })).toBe(145);
    expect(objectifProteines({ objectif: 2, poids: [["2026-10-01", 60]] })).toBe(120);
    expect(objectifProteines({})).toBe(120);
    expect(objectifProteines({ protObj: 90, profil: { Poids: 80 } })).toBe(90);
  });
  it("ajout, retrait borné à 0, 30 jours gardés", () => {
    const A: Reponses = {};
    ajouterProt(A, "2026-10-04", 25);
    ajouterProt(A, "2026-10-04", -40);
    expect(protDuJour(A, "2026-10-04")).toBe(0);
    for (let i = 1; i <= 40; i++) ajouterProt(A, `2026-08-${String(i).padStart(2, "0")}`, 10);
    expect(Object.keys(A.prot as object)).toHaveLength(30);
  });
});

describe("bilan de période", () => {
  it("périodes", () => {
    expect(periode("2026-02")).toMatchObject({ debut: "2026-02-01", fin: "2026-02-28", nom: "février 2026" });
    expect(periode("2026")).toMatchObject({ debut: "2026-01-01", fin: "2026-12-31", annee: true });
    expect(periode("2026-13")).toBeNull();
    expect(moisPrecedent("2026-01-15")).toBe("2025-12");
  });
  it("comparaisons", () => {
    expect(comparer(24)).toBe("4 éléphants d'Afrique");
    expect(comparer(0)).toBe("");
  });
  it("chiffres du mois", () => {
    const E = {
      A: {}, LOG: {}, SWAP: {}, SWAPP: {}, PLAN: null, SEANCES: [], wk: 0, day: 0, FINI: false,
      HIST: [
        { d: "2026-08-30", s: "L|0", nom: "", vol: 3000, ser: 9, ex: { dc: [70, 3000, 60, 8, 3] } },
        { d: "2026-09-02", s: "L|0", nom: "", vol: 4000, ser: 9, ex: { dc: [80, 4000, 70, 6, 3] } },
        { d: "2026-09-09", s: "L|0", nom: "", vol: 5000, ser: 9, ex: { dc: [85, 5000, 75, 5, 3] } },
      ],
      CARDIO: [{ nom: "", f: "tabata", m: "ram", min: 20, effort: 8, ts: new Date("2026-09-05T10:00").getTime() }],
    } as unknown as Etat;
    const r = recap(E, "2026-09")!;
    expect([r.seances, r.muscu, r.cardio, r.tonnes, r.minutesCardio, r.jours, r.nbRecords]).toEqual([3, 2, 1, 9, 20, 3, 2]);
    expect(r.exFavori).toEqual({ n: "Développé couché barre", fois: 2 });
    expect(r.record).toMatchObject({ n: "Développé couché barre", avant: 70, apres: 80 });
  });
});

describe("cycle", () => {
  it("phases sur un cycle de 28 jours", () => {
    const c = { actif: true, debut: "2026-10-01", duree: 28 };
    expect(phaseDe(c, "2026-10-01")).toMatchObject({ jour: 1, nom: "Règles", leger: true });
    expect(phaseDe(c, "2026-10-08")!.nom).toBe("Phase folliculaire");
    expect(phaseDe(c, "2026-10-14")!.nom).toBe("Ovulation");
    expect(phaseDe(c, "2026-10-20")!.nom).toBe("Phase lutéale");
    expect(phaseDe(c, "2026-10-26")!.nom).toBe("Fin de phase lutéale");
    expect(phaseDe(c, "2026-10-29")!.jour).toBe(1); // cycle suivant
    expect(phaseDe(c, "2026-09-20")).toBeNull();
  });
});
