import { describe, expect, it } from "vitest";
import { bilanCardio, changements, construireSeance, decoderCardio, dureeTotale, encoderCardio, machinesDe, ORDRE_FORMATS, ou, reglagesDe, type Niveau } from "@/lib/logic/cardio";

describe("cardio", () => {
  it("fractionné intermédiaire : 5 min + 8 × 60 s + 7 × 90 s + 3 min", () => {
    const P = construireSeance("fractionne", "ram", reglagesDe("fractionne", 1));
    expect(dureeTotale(P)).toBe(300 + 8 * 60 + 7 * 90 + 180);
    expect(P.map((p) => p.type).slice(0, 4)).toEqual(["echauf", "effort", "recup", "effort"]);
    expect(P.filter((p) => p.type === "effort")).toHaveLength(8);
    expect(P.at(-2)!.type).toBe("effort"); // pas de récupération après le dernier effort
  });
  it("tabata : blocs de 8 × (20 s + 10 s) séparés d'une pause", () => {
    const P = construireSeance("tabata", "pdc", reglagesDe("tabata", 0));
    expect(P.filter((p) => p.type === "effort")).toHaveLength(16);
    expect(P.filter((p) => p.type === "pause")).toHaveLength(1);
    expect(P.find((p) => p.type === "effort")!.consigne).toBe("Burpees");
  });
  it("chaque format et niveau donne une séance cohérente", () => {
    for (const f of ORDRE_FORMATS) for (const n of [0, 1, 2] as Niveau[]) {
      const P = construireSeance(f, f === "emom" ? "pdc" : "velo", reglagesDe(f, n));
      expect(P.length).toBeGreaterThan(2);
      expect(P.every((p) => p.duree > 0)).toBe(true);
      expect(dureeTotale(P)).toBeGreaterThan(8 * 60);
    }
  });
  it("ou() suit les changements de phase et la fin", () => {
    const P = construireSeance("fractionne", "tapis", reglagesDe("fractionne", 1));
    expect(ou(P, 0).phase!.type).toBe("echauf");
    expect(ou(P, 299.9).phase!.type).toBe("echauf");
    expect(ou(P, 300).phase!.type).toBe("effort");
    expect(ou(P, 300).reste).toBe(60);
    expect(ou(P, 360).phase!.type).toBe("recup");
    expect(changements(P)[0]).toBe(300);
    expect(ou(P, 1e6).fini).toBe(true);
  });
  it("bilan : temps d'effort et tours terminés", () => {
    const P = construireSeance("fractionne", "tapis", reglagesDe("fractionne", 1));
    const b = bilanCardio(P, 300 + 60 + 90 + 30); // deux efforts entamés, un fini
    expect(b).toEqual({ minutes: 8, effort: 90, tours: 1 });
  });
  it("partage : encodé dans le format des séances partagées, puis relu à l'identique", () => {
    const s = { nom: "Rameur du mardi", f: "fractionne" as const, m: "ram" as const, n: 2 as Niveau, r: { ...reglagesDe("fractionne", 2), effort: 75 } };
    const ex = encoderCardio(s);
    expect(ex.length).toBeLessThanOrEqual(12);
    for (const e of ex) {
      expect(e.id).toMatch(/^[A-Za-z0-9]{1,20}$/);
      expect(e.s).toBeGreaterThanOrEqual(1);
      expect(e.r).toBeLessThanOrEqual(1000);
    }
    expect(decoderCardio(s.nom, JSON.parse(JSON.stringify(ex)))).toEqual(s);
    expect(decoderCardio("x", [{ id: "dc", s: 3, r: 8 }])).toBeNull();
  });
});

describe("cardio : nouveaux formats", () => {
  it("4×4 norvégien : 4 min d'effort, 3 min de récupération, 10 min d'échauffement", () => {
    const P = construireSeance("norvegien", "tapis", reglagesDe("norvegien", 1));
    expect(P.filter((p) => p.type === "effort").map((p) => p.duree)).toEqual([240, 240, 240]);
    expect(P.filter((p) => p.type === "recup")).toHaveLength(2);
    expect(P[0]).toMatchObject({ type: "echauf", duree: 600 });
  });
  it("30/30 : blocs de tours égaux, pause entre les blocs", () => {
    const P = construireSeance("trente", "velo", reglagesDe("trente", 2));
    expect(P.filter((p) => p.type === "effort")).toHaveLength(24);
    expect(P.filter((p) => p.type === "pause")).toHaveLength(1);
  });
  it("pyramide : monte jusqu'au sommet puis redescend", () => {
    const P = construireSeance("pyramide", "ram", reglagesDe("pyramide", 1));
    expect(P.filter((p) => p.type === "effort").map((p) => p.duree)).toEqual([30, 60, 90, 120, 90, 60, 30]);
    expect(P.find((p) => p.titre === "Sommet")!.duree).toBe(120);
  });
  it("sprints en côte : seulement sur tapis, vélo ou stairmaster, consigne de pente", () => {
    expect(machinesDe("cote")).toEqual(["tapis", "velo", "stair"]);
    const P = construireSeance("cote", "tapis", reglagesDe("cote", 0));
    expect(P.filter((p) => p.type === "effort")).toHaveLength(6);
    expect(P.find((p) => p.type === "effort")!.consigne).toMatch(/Inclinaison/);
  });
  it("endurance à paliers : 3 paliers d'intensité croissante", () => {
    const P = construireSeance("paliers", "ellip", reglagesDe("paliers", 1)).filter((p) => p.type === "continu");
    expect(P.map((p) => p.titre)).toEqual(["Palier 1 sur 3", "Palier 2 sur 3", "Palier 3 sur 3"]);
    expect(P.map((p) => p.rpe)).toEqual(["RPE 3", "RPE 4", "RPE 5"]);
    expect(P.reduce((s, p) => s + p.duree, 0)).toBe(30 * 60);
  });
  it("partage : les nouveaux formats voyagent aussi", () => {
    for (const f of ["norvegien", "trente", "pyramide", "cote", "paliers"] as const) {
      const s = { nom: "x", f, m: "tapis" as const, n: 1 as Niveau, r: reglagesDe(f, 1) };
      const ex = encoderCardio(s);
      for (const e of ex) { expect(e.s).toBeLessThanOrEqual(20); expect(e.r).toBeLessThanOrEqual(1000); }
      expect(decoderCardio("x", ex)).toEqual(s);
    }
  });
});
