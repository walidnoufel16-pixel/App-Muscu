/* Course et musculation sur un seul calendrier (lot 4) : les sorties du plan sont posées dans
   l'agenda sur les jours choisis, et une séance de street workout faite compte comme une séance. */
import { describe, expect, it } from "vitest";
import { courseDureLe, joursAgenda, poserPlan, recoPour, type Prevu } from "@/lib/logic/agenda";
import { datesDuPlan, genererPlan, joursParDefaut, type PlanCourse } from "@/lib/logic/course";
import { decaler, lundiDe } from "@/lib/logic/historique";

const plan = (o: Partial<PlanCourse> = {}): PlanCourse => ({ obj: "semi", date: "2027-03-07", debut: "2026-11-16", jours: 4, renfo: 1, ref: { km: 10, sec: 50 * 60 }, pauses: [], ajust: {}, cree: "2026-11-13", ...o });
const etat = (o: Record<string, unknown> = {}) => ({ A: { regularite: 2, objHebdo: 3 }, LOG: {}, SWAP: {}, SWAPP: {}, PLAN: null, SEANCES: [], wk: 0, day: 0, FINI: true, HIST: [], SORTIES: [], ...o });
const jourSemaine = (d: string) => Math.round((Date.parse(d + "T12:00:00Z") - Date.parse(lundiDe(d) + "T12:00:00Z")) / 864e5);

describe("les sorties du plan dans l'agenda", () => {
  it("une sortie par jour choisi, la longue le dernier, le jour J à sa date", () => {
    const p = plan({ jsem: [1, 3, 5, 6] }), S = genererPlan(p), L = datesDuPlan(p, S);
    for (const W of S) {
      const sem = L.filter((x) => x.cle.startsWith(W.k + "|"));
      const runs = W.seances.filter((s) => s.type !== "renfo");
      expect(sem.length, `semaine ${W.k}`).toBe(runs.length);
      for (const x of sem) {
        const s = W.seances[+x.cle.split("|")[1]];
        if (s.type === "course") expect(x.d).toBe(p.date);
        else expect(p.jsem).toContain(jourSemaine(x.d));
        if (s.type === "longue") expect(jourSemaine(x.d)).toBe(6);
      }
      /* jamais deux sorties le même jour */
      expect(new Set(sem.map((x) => x.d)).size).toBe(sem.length);
    }
  });
  it("jours par défaut : autant que de sorties, la longue le dimanche", () => {
    for (const n of [3, 4, 5]) { expect(joursParDefaut(n).length).toBe(n); expect(joursParDefaut(n).at(-1)).toBe(6); }
  });
  it("poser le plan : sorties à venir seulement, reposées quand le plan change, retirées sans plan", () => {
    const auj = "2026-12-01", E = etat({ COURSE: plan({ jsem: [1, 3, 5, 6] }), AGENDA: [] as Prevu[] }) as never as { COURSE: PlanCourse | null; AGENDA: Prevu[]; SORTIES: never[] };
    poserPlan(E, auj);
    expect(E.AGENDA.length).toBeGreaterThan(20);
    expect(E.AGENDA.every((p) => p.d >= auj && p.plan && p.quoi.t === "course")).toBe(true);
    /* une sortie déplacée à la main garde sa place */
    const moved = E.AGENDA[0]; moved.d = decaler(moved.d, 1); delete moved.plan;
    E.COURSE = plan({ jsem: [0, 2, 4, 6] });
    poserPlan(E, auj);
    expect(E.AGENDA.filter((p) => p.quoi.t === "course" && moved.quoi.t === "course" && p.quoi.cle === moved.quoi.cle).length).toBe(1);
    expect(E.AGENDA.filter((p) => p.plan).every((p) => [0, 2, 4, 6].includes(jourSemaine(p.d)) || p.d === "2027-03-07")).toBe(true);
    E.COURSE = null;
    poserPlan(E, auj);
    expect(E.AGENDA).toEqual([moved]);
  });
  it("la veille d'une sortie longue posée par le plan : pas de jambes", () => {
    const p = plan({ jsem: [1, 3, 5, 6] }), auj = "2026-11-21"; // samedi, longue le dimanche 22
    const E = etat({ COURSE: p, AGENDA: [] as Prevu[] });
    poserPlan(E as never, "2026-11-16");
    expect(courseDureLe(E as never, decaler(auj, 1), auj)).toBe(true);
    const r = recoPour(E as never, auj, auj);
    for (const q of r.propositions) expect(q.muscles.some((m) => ["qua", "isc", "mol"].includes(m)), q.nom).toBe(false);
  });
});

describe("street workout", () => {
  it("une séance de street workout faite le lundi compte : dans l'agenda et pour la récupération", () => {
    const lundi = "2026-11-16", mardi = "2026-11-17";
    const street = { nom: "Street · Débutant A", ex: [{ id: "pomp", s: 3, r: 10, p: "90 s" }, { id: "tr", s: 3, r: 5, p: "2 min" }], street: "debutant-A" };
    const HIST = [{ d: lundi, s: "L|0", nom: street.nom, vol: 0, ser: 6, ex: { pomp: [0, 10, 0, 10, 3], tr: [0, 5, 0, 5, 3] } }];
    const E = etat({ SEANCES: [street], HIST, AGENDA: [] });
    const j = joursAgenda(E as never, lundi, mardi, 2);
    expect(j[0].fait.map((f) => f.famille)).toEqual(["muscu"]);
    const r = recoPour(E as never, mardi, mardi);
    /* le lendemain, pas de nouveau haut du corps : pecs et dos récupèrent */
    for (const q of r.propositions) expect(q.muscles.includes("pec") && q.muscles.includes("dos"), q.nom).toBe(false);
  });
});
