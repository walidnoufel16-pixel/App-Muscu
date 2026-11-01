import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { EX } from "@/lib/data/exercices";
import { POSTES, POSTE_DE, ZONES_SALLE } from "@/lib/data/salle";
import { etapesDe, FAMILLES_STREET, niveauConseille, PROGRAMMES_STREET, testARefaire } from "@/lib/data/street";
import EX_EN from "@/lib/i18n/exercices.en.json";
import { CREDITS, creditPoste, imgEx, imgExGrand, imgPoste, imgPosteGrand, photosDistantes } from "@/lib/medias";
import { avecSalle, barreDeclaree, exoFiltre, selDeclare } from "@/lib/logic/core";
import { construireSeance } from "@/lib/logic/assistant";

const PUB = path.join(__dirname, "../public");
const FICHES = JSON.parse(fs.readFileSync(path.join(PUB, "data/fiches.json"), "utf8"));
const FICHES_EN = JSON.parse(fs.readFileSync(path.join(PUB, "data/fiches.en.json"), "utf8"));

describe("Ma salle", () => {
  it("chaque poste regroupe des exercices existants, sans doublon, avec une zone", () => {
    const vus = new Set<string>();
    expect(new Set(POSTES.map((p) => p.id)).size).toBe(POSTES.length);
    for (const p of POSTES) {
      expect(ZONES_SALLE.some((z) => z.k === p.zone), p.id).toBe(true);
      if (p.img) expect(EX[p.img], p.id).toBeTruthy();
      /* un poste avec exercices montre la photo de l'un d'eux */
      if (p.ex.length) expect(p.img && p.ex.includes(p.img), p.id).toBe(true);
      for (const o of p.ex) {
        expect(EX[o], `${p.id} : ${o}`).toBeTruthy();
        expect(vus.has(o), `${o} dans deux postes`).toBe(false);
        vus.add(o);
      }
    }
  });
  it("photo Unsplash : affichée depuis leurs serveurs, photographe cité dans Crédits", () => {
    const unsplash = POSTES.filter((p) => imgPoste(p)?.startsWith("https://images.unsplash.com/"));
    expect(unsplash.length).toBe(6);
    for (const p of unsplash) {
      expect(imgPoste(p), p.id).toMatch(/^https:\/\/images\.unsplash\.com\//);
      const c = CREDITS.find((x) => x.quoi.includes(p.n));
      expect(c?.lien, p.id).toMatch(/^https:\/\/unsplash\.com\/@[\w-]+\?utm_source=repere&utm_medium=referral$/);
      expect(c?.nom, p.id).toMatch(/ sur Unsplash$/);
    }
  });
  it("photo libre : copiée dans public/img, auteur et licence dans Crédits", () => {
    const libres = POSTES.filter((p) => imgPoste(p)?.startsWith("/img/poste-"));
    expect(libres.map((p) => p.id).sort()).toEqual(["devinc", "latm", "mollass"]);
    for (const p of libres) {
      expect(fs.existsSync(path.join(PUB, imgPoste(p)!)), p.id).toBe(true);
      const c = CREDITS.find((x) => x.quoi.includes(p.n));
      expect(c?.licence, p.id).toMatch(/^CC BY(-SA)? \d\.\d$/);
      expect(c?.lien, p.id).toMatch(/^https:\/\//);
    }
  });
  it("chaque machine avec photo l'a aussi en grand, avec son auteur ; les fichiers locaux existent", () => {
    for (const p of POSTES.filter((x) => imgPoste(x))) {
      const g = imgPosteGrand(p)!;
      expect(g, p.id).toBeTruthy();
      if (g.startsWith("/")) expect(fs.existsSync(path.join(PUB, g)), g).toBe(true);
      expect(creditPoste(p)?.lien, p.id).toMatch(/^https:\/\//);
    }
  });
  it("chaque photo d'exercice existe aussi en grand (fiche, photo en grand de Ma salle)", () => {
    const manquantes = [...new Set(Object.keys(EX).filter((o) => fs.existsSync(path.join(PUB, imgEx(o)))).flatMap((o) => [imgExGrand(o, 0), imgExGrand(o, 1)]))].filter((f) => !fs.existsSync(path.join(PUB, f)));
    expect(manquantes).toEqual([]);
  });
  it("hors connexion : la liste des photos à garder ne contient que des photos Unsplash, sans doublon", () => {
    const l = photosDistantes();
    expect(l.length).toBe(63 * 2 + 6 * 2);
    expect(new Set(l).size).toBe(l.length);
    for (const u of l) expect(u).toMatch(/^https:\/\/images\.unsplash\.com\/photo-/);
  });
  it("chaque exercice machine (eq 0) hors soin a son poste", () => {
    const sans = Object.keys(EX).filter((o) => EX[o].eq === 0 && EX[o].pat !== "soin" && !POSTE_DE[o]);
    expect(sans).toEqual([]);
  });
  it("une machine absente retire ses exercices, les autres restent", () => {
    const A = { materiel: 0, sansPostes: ["presse"] };
    const sel = selDeclare(A);
    expect(sel).toContain("x:presse");
    expect(exoFiltre("pr", sel)).toBe(false);
    expect(exoFiltre("hack", sel)).toBe(true);
    /* un brouillon d'écran garde les machines déclarées à jour */
    expect(exoFiltre("pr", avecSalle(["m0", "m3"], A))).toBe(false);
    expect(exoFiltre("pr", avecSalle(["m0", "m3", "x:hack"], { materiel: 0 }))).toBe(true);
  });
  it("l'assistant ne propose pas une machine absente", () => {
    const sel = selDeclare({ materiel: 0, sansPostes: POSTES.filter((p) => p.zone !== "cardio").map((p) => p.id) });
    for (let i = 0; i < 10; i++) {
      const ex = construireSeance(["qua", "pec", "dos"], 45, 0, sel);
      expect(ex.some((e) => POSTE_DE[e.id] && POSTE_DE[e.id] !== "rameur"), JSON.stringify(ex)).toBe(false);
    }
  });
});

describe("barre de traction", () => {
  it("salle et home gym l'ont par défaut, le poids du corps seul non ; le Profil décide sinon", () => {
    expect(barreDeclaree({ materiel: 0 })).toBe(true);
    expect(barreDeclaree({ materiel: 1 })).toBe(true);
    expect(barreDeclaree({ materiel: 3 })).toBe(false);
    expect(barreDeclaree({ materiel: 3, barre: true })).toBe(true);
    expect(barreDeclaree({ materiel: 0, barre: false })).toBe(false);
  });
  it("les tractions demandent la barre", () => {
    expect(exoFiltre("tr", ["m3"])).toBe(false);
    expect(exoFiltre("tr", ["m3", "bt"])).toBe(true);
    expect(exoFiltre("tr", ["bt"])).toBe(true);
    expect(exoFiltre("pomp", ["m3"])).toBe(true);
  });
});

describe("TRX", () => {
  const trx = Object.keys(EX).filter((o) => EX[o].acc === "trx");
  it("20 exercices aux sangles (TRX, et les dips aux anneaux), hors du programme généré, visibles seulement avec les sangles", () => {
    expect(trx.length).toBe(20);
    for (const o of trx) {
      expect(EX[o].horsIA, o).toBe(1);
      expect(exoFiltre(o, ["trx"]), o).toBe(true);
      expect(exoFiltre(o, ["m3", "m2", "m1", "m0", "kb", "el", "bt"]), o).toBe(false);
    }
  });
  it("déclaré à part dans le Profil : « Aucun des deux » ne coche pas le TRX", () => {
    expect(selDeclare({ materiel: 0, trx: true })).toContain("trx");
    expect(selDeclare({ materiel: 0, acc: [2] })).not.toContain("trx");
    expect(selDeclare({ materiel: 0, acc: [0, 1] })).not.toContain("trx");
  });
});

describe("street workout", () => {
  it("familles et programmes ne citent que des exercices existants", () => {
    for (const f of FAMILLES_STREET) for (const o of f.ex) expect(EX[o], `${f.k} : ${o}`).toBeTruthy();
    for (const p of PROGRAMMES_STREET) {
      expect(p.seances.map((s) => s.k)).toEqual(p.niv === "debutant" ? ["A", "B", "C"] : ["A", "B", "C", "D"]);
      for (const s of p.seances) for (const e of s.ex) expect(EX[e.id], `${p.niv}-${s.k} : ${e.id}`).toBeTruthy();
    }
  });
  it("les programmes se font avec le poids du corps et la barre seulement", () => {
    for (const p of PROGRAMMES_STREET) for (const s of p.seances) for (const e of s.ex) expect(exoFiltre(e.id, ["m3", "bt"]), e.id).toBe(true);
  });
  it("chaque exercice des familles a une étape suivante, sauf le dernier", () => {
    expect(etapesDe("pompi")?.apres).toBe("pompis");
    expect(etapesDe("tr1")?.apres).toBeUndefined();
    expect(etapesDe("cpoi")).toBeNull();
    for (const f of FAMILLES_STREET) expect(new Set(f.ex).size, f.k).toBe(f.ex.length);
  });
  it("le test d'entrée conseille un niveau", () => {
    expect(niveauConseille({ tr: 0, po: 8, di: 0, sq: 20 })).toBe("debutant");
    expect(niveauConseille({ tr: 6, po: 25, di: 10, sq: 40 })).toBe("intermediaire");
    expect(niveauConseille({ tr: 6, po: 25, di: 4, sq: 40 })).toBe("debutant");
    expect(niveauConseille({ tr: 14, po: 40, di: 20, sq: 50 })).toBe("avance");
    expect(testARefaire(undefined, "2026-10-30")).toBe(true);
    expect(testARefaire({ d: "2026-10-01", tr: 1, po: 1, di: 1, sq: 1 }, "2026-10-30")).toBe(false);
    expect(testARefaire({ d: "2026-09-10", tr: 1, po: 1, di: 1, sq: 1 }, "2026-10-30")).toBe(true);
  });
  const PHOTO_A_VENIR = ["curlpc", "curlel", "pompk", "susp", "lsit", "burpsl"];
  it("les nouveaux exercices ont fiche, traduction et photos", () => {
    const nouveaux = Object.keys(EX).filter((o) => EX[o].horsIA);
    expect(nouveaux.length).toBeGreaterThanOrEqual(10);
    for (const o of nouveaux) {
      expect(FICHES[o], o).toBeTruthy();
      expect(FICHES_EN[o], o).toBeTruthy();
      expect((EX_EN as Record<string, unknown>)[o], o).toBeTruthy();
      /* photo à venir (fiche : « Photo à venir ») : seulement ceux-ci, choisis en connaissance de cause */
      if (PHOTO_A_VENIR.includes(o)) { expect(EX[o].img, o).toBe(""); continue; }
      for (const n of [0, 1] as const) expect(fs.existsSync(path.join(PUB, imgEx(o, n))), imgEx(o, n)).toBe(true);
    }
  });
  it("hors de la bibliothèque du programme généré (generer inchangé)", () => {
    const src = fs.readFileSync(path.join(__dirname, "../../scripts/sync-lib.mjs"), "utf8");
    expect(src).toMatch(/!e\.horsIA/);
  });
});
