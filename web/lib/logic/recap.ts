/* Bilan d'une période (un mois ou une année) à partager. Logique pure. */
import { EX } from "@/lib/data/exercices";
import { FORMATS } from "./cardio";
import { dateDe, jourDe, records } from "./historique";
import { serie, objectifHebdo } from "./motivation";
import { BADGES } from "./motivation";
import type { Etat } from "./types";
import { avecSorties } from "./course";

export type Periode = { id: string; debut: string; fin: string; nom: string; annee: boolean };
const MOIS = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];
const deux = (n: number) => String(n).padStart(2, "0");

/** « 2026-09 » (un mois) ou « 2026 » (une année). */
export function periode(id: string): Periode | null {
  const m = id.match(/^(\d{4})(?:-(\d{2}))?$/);
  if (!m) return null;
  const a = +m[1];
  if (!m[2]) return { id, debut: `${a}-01-01`, fin: `${a}-12-31`, nom: String(a), annee: true };
  const mo = +m[2];
  if (mo < 1 || mo > 12) return null;
  const der = new Date(a, mo, 0).getDate();
  return { id, debut: `${a}-${deux(mo)}-01`, fin: `${a}-${deux(mo)}-${deux(der)}`, nom: `${MOIS[mo - 1]} ${a}`, annee: false };
}
/** Mois précédent celui d'un jour. */
export function moisPrecedent(j: string) {
  const d = dateDe(j); d.setDate(1); d.setMonth(d.getMonth() - 1);
  return `${d.getFullYear()}-${deux(d.getMonth() + 1)}`;
}

export type Recap = {
  p: Periode; seances: number; muscu: number; cardio: number; tonnes: number; series: number; minutesCardio: number;
  jours: number; jourFavori: string | null; exFavori: { n: string; fois: number } | null; formatFavori: string | null;
  record: { n: string; avant: number; apres: number; unite: string } | null; nbRecords: number; serie: number; badges: string[];
  comparaison: string;
};
const JOURS = ["dimanche", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"];

/** Image parlante pour un tonnage. */
export function comparer(t: number) {
  if (t >= 150) return `le poids d'une baleine bleue${t >= 300 ? ` × ${Math.round(t / 150)}` : ""}`;
  if (t >= 12) return `${Math.round(t / 6)} éléphants d'Afrique`;
  if (t >= 1.2) return `${Math.max(1, Math.round(t / 1.2))} voiture${t >= 2.4 ? "s" : ""} citadine${t >= 2.4 ? "s" : ""}`;
  if (t > 0) return `${Math.max(1, Math.round((t * 1000) / 80))} sacs de ciment`;
  return "";
}

export function recap(E: Etat, id: string): Recap | null {
  const p = periode(id);
  if (!p) return null;
  const dans = (d: string) => d >= p.debut && d <= p.fin;
  const H = (E.HIST || []).filter((l) => dans(l.d));
  const C = avecSorties(E.CARDIO, E.SORTIES).filter((c) => dans(jourDe(c.ts)));
  const cardioSeul = C.filter((c) => !c.ref);
  const vol = H.reduce((n, l) => n + l.vol, 0);
  const jours = new Set([...H.map((l) => l.d), ...C.map((c) => jourDe(c.ts))]);
  const parJour = new Array(7).fill(0);
  for (const d of jours) parJour[dateDe(d).getDay()]++;
  const jf = parJour.indexOf(Math.max(...parJour));
  const fois = new Map<string, number>();
  for (const l of H) for (const ex in l.ex) fois.set(ex, (fois.get(ex) || 0) + 1);
  const ef = [...fois].sort((a, b) => b[1] - a[1])[0];
  const fmt = new Map<string, number>();
  for (const c of C) if (!c.run) fmt.set(c.f, (fmt.get(c.f) || 0) + 1);
  const ff = [...fmt].sort((a, b) => b[1] - a[1])[0];
  /* le record le plus marquant : le plus gros gain relatif sur la période */
  const R = records(E.HIST || []).filter((r) => dans(r.d) && EX[r.id]);
  const gain = (r: (typeof R)[number]) => {
    const ch = EX[r.id].ch, apres = ch === "kg" ? r.rm : r.max * 1000 + r.reps;
    return apres / Math.max(1, r.avant) - 1;
  };
  const top = R.sort((a, b) => gain(b) - gain(a))[0];
  const record = top ? (() => {
    const ch = EX[top.id].ch;
    if (ch === "kg") return { n: EX[top.id].n, avant: Math.round(top.avant), apres: Math.round(top.rm), unite: "kg (1RM estimé)" };
    return { n: EX[top.id].n, avant: top.avant % 1000, apres: top.reps, unite: "répétitions" };
  })() : null;
  const notes = (E.A.badges || {}) as Record<string, string>;
  const badges = BADGES.filter((b) => notes[b.id] && dans(notes[b.id])).map((b) => b.nom);
  const t = vol / 1000;
  return {
    p, seances: H.length + cardioSeul.length, muscu: H.length, cardio: cardioSeul.length, tonnes: t,
    series: H.reduce((n, l) => n + l.ser, 0), minutesCardio: Math.round(C.reduce((n, c) => n + c.min, 0)),
    jours: jours.size, jourFavori: jours.size >= 3 ? JOURS[jf] : null,
    exFavori: ef ? { n: EX[ef[0]]?.n || ef[0], fois: ef[1] } : null,
    formatFavori: ff ? FORMATS[ff[0] as keyof typeof FORMATS]?.nom || null : null,
    record, nbRecords: R.length,
    serie: serie(E.HIST || [], E.CARDIO || [], objectifHebdo(E.A), p.fin).record,
    badges, comparaison: comparer(t),
  };
}
