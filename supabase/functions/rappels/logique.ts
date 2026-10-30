/* Rappels après quelques jours sans séance : logique pure, partagée avec les tests de l'app
   (web/tests/rappels.test.ts). Aucune API Deno ici.

   Le seuil suit ton rythme : ton écart habituel entre deux séances + 2 jours, au moins 4.
   Trois rappels au plus (seuil, seuil + 4, seuil + 11 jours : 4, 8, 15 pour un rythme
   serré), puis plus rien jusqu'à la prochaine séance, qui remet tout à zéro. */

export type Seance = { nom?: string; soin?: string; ex?: unknown[] };
export type Sauvegarde = {
  HIST?: { d: string; s: string; nom?: string }[];
  CARDIO?: { ts: number }[];
  SORTIES?: { d: string }[];
  SEANCES?: Seance[];
};
export type Rappel = { niveau: 1 | 2 | 3; jours: number; titre: string; corps: string; url: string };

const jour = (d: string) => Date.parse(d + "T12:00:00Z") / 864e5;
const ecart = (a: string, b: string) => Math.round(jour(b) - jour(a));

/** Les jours d'activité (séances, cardio, sorties), triés et sans doublon. */
export function joursActifs(e: Sauvegarde, jourDe: (ts: number) => string): string[] {
  const s = new Set<string>();
  for (const h of e.HIST || []) if (h.d) s.add(h.d);
  for (const c of e.CARDIO || []) if (c.ts) s.add(jourDe(c.ts));
  for (const o of e.SORTIES || []) if (o.d) s.add(o.d);
  return [...s].sort();
}

/** Seuil en jours : écart habituel (médiane des 60 derniers jours) + 2, au moins 4. */
export function seuil(jours: string[], auj: string): number {
  const recents = jours.filter((d) => ecart(d, auj) <= 60);
  if (recents.length < 3) return 4;
  const e = recents.slice(1).map((d, i) => ecart(recents[i], d)).sort((a, b) => a - b);
  return Math.max(4, e[Math.floor(e.length / 2)] + 2);
}

/** Le niveau de rappel dû aujourd'hui (0 : rien). */
export function niveauDu(jours: string[], auj: string): { niveau: 0 | 1 | 2 | 3; sans: number } {
  if (!jours.length) return { niveau: 0, sans: 0 };
  const sans = ecart(jours[jours.length - 1], auj), s = seuil(jours, auj);
  return { niveau: sans >= s + 11 ? 3 : sans >= s + 4 ? 2 : sans >= s ? 1 : 0, sans };
}

/** La séance libre à proposer : jamais faite d'abord, sinon la plus ancienne (comme lib/logic/prochaine.ts). */
export function seanceAProposer(e: Sauvegarde): { i: number; nom: string } | null {
  const S = e.SEANCES || [], der = new Map<number, string>();
  for (const h of e.HIST || []) {
    const m = /^L\|(\d+)$/.exec(h.s);
    if (m && (!der.get(+m[1]) || h.d > der.get(+m[1])!)) der.set(+m[1], h.d);
  }
  const c = S.map((_, i) => i).filter((i) => !S[i].soin && (S[i].ex || []).length > 0 && S[i].nom);
  if (!c.length) return null;
  const i = c.sort((a, b) => (der.get(a) ?? "").localeCompare(der.get(b) ?? ""))[0];
  return { i, nom: S[i].nom! };
}

const TEXTES = {
  fr: {
    t1: "{n} jours de repos, tes muscles sont prêts",
    c1s: "Ta séance {s} t'attend.", c1: "Une séance aujourd'hui ?",
    t2: "Ça fait {n} jours", c2: "Une séance courte de 20 minutes suffit pour reprendre le fil.",
    t3: "On reprend quand tu veux", c3: "Ta progression t'attend : on repart en douceur, à ton rythme.",
  },
  en: {
    t1: "{n} days of rest, your muscles are ready",
    c1s: "Your {s} workout is waiting.", c1: "A workout today?",
    t2: "It's been {n} days", c2: "A short 20-minute workout is enough to get back on track.",
    t3: "Come back whenever you're ready", c3: "Your progress is waiting: we'll ease back in, at your pace.",
  },
};

/** Le rappel à envoyer aujourd'hui, ou null (déjà envoyé à ce niveau, ou pas encore dû). */
export function rappelDu(e: Sauvegarde, auj: string, dejaEnvoye: number, langue: string, jourDe: (ts: number) => string): Rappel | null {
  const { niveau, sans } = niveauDu(joursActifs(e, jourDe), auj);
  if (niveau === 0 || niveau <= dejaEnvoye) return null;
  const T = langue === "en" ? TEXTES.en : TEXTES.fr, f = (s: string, v: Record<string, string | number>) => s.replace(/\{(\w+)\}/g, (_, k) => String(v[k]));
  const p = seanceAProposer(e), url = p ? `/entrainement/seance/?l=${p.i}` : "/entrainement/";
  if (niveau === 1) return { niveau, jours: sans, titre: f(T.t1, { n: sans }), corps: p ? f(T.c1s, { s: p.nom }) : T.c1, url };
  if (niveau === 2) return { niveau, jours: sans, titre: f(T.t2, { n: sans }), corps: T.c2, url };
  return { niveau, jours: sans, titre: T.t3, corps: T.c3, url };
}

/** Dernier jour d'activité : s'il a changé depuis le dernier rappel, le compteur repart à zéro. */
export const derniereActivite = (e: Sauvegarde, jourDe: (ts: number) => string) => joursActifs(e, jourDe).at(-1) ?? null;
