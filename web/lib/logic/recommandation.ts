/* « Ma recommandation du jour » : d'après les séances des derniers jours, quels muscles travailler
   aujourd'hui. Logique pure.
   - Chaque grand groupe : dernier jour travaillé, séries sur 7 jours (muscle principal 1 série,
     muscle secondaire ½), séries du dernier jour.
   - Récupération : 24 h pour les abdos et les mollets ; 72 h pour les jambes et le dos après une
     grosse séance (8 séries ou plus), 48 h sinon ; 48 h pour les autres à partir de 4 séries.
   - Récupération seulement (hors objectif de séries et hors recommandations) : trapèzes, lombaires
     (48 h dès 2 séries, celles d'un soulevé de terre comptant pour moitié), avant-bras, adducteurs.
   - Course et cardio guidé fatiguent aussi les jambes (effortsEndurance) : la récupération l'affiche,
     et la recommandation évite une séance de jambes tant qu'elles récupèrent.
   - Séances possibles : les splits classiques ; on écarte celles qui touchent un groupe qui récupère
     ou que la personne a écarté, puis on préfère les groupes les moins travaillés de la semaine et
     ceux laissés de côté depuis le plus longtemps. */
import { tr } from "@/lib/i18n";
import { EX } from "@/lib/data/exercices";
import { PAT2MUSC } from "@/lib/data/referentiels";
import { dateDe, decaler, jourDe, type LigneHist } from "./historique";
import type { HistoCardio } from "./types";
import type { Sortie } from "./course";

export const GROUPES = ["pec", "dos", "epa", "bic", "tri", "qua", "isc", "mol", "abd"] as const;
export type Groupe = (typeof GROUPES)[number];
/** Les muscles suivis par la récupération : les grands groupes, et ceux qu'on ne programme pas à part. */
export const MUSCLES_RECUP = [...GROUPES, "tra", "lom", "avb", "add"] as const;
export type MuscleRecup = (typeof MUSCLES_RECUP)[number];
const SUIVIS = new Set<string>(MUSCLES_RECUP);

/** Ce qu'on peut écarter des recommandations (Profil ou carte) : des zones, plus parlantes que les muscles. */
export type ZoneEcartable = "pec" | "dos" | "epa" | "bras" | "abd" | "jambes";
export const ZONES_ECARTABLES: ZoneEcartable[] = ["jambes", "pec", "dos", "epa", "bras", "abd"];
const GROUPES_ZONE: Record<ZoneEcartable, Groupe[]> = { pec: ["pec"], dos: ["dos"], epa: ["epa"], bras: ["bic", "tri"], abd: ["abd"], jambes: ["qua", "isc", "mol"] };
export const nomZone = (z: ZoneEcartable) => ({ pec: tr("Pectoraux"), dos: tr("Dos"), epa: tr("Épaules"), bras: tr("Bras"), abd: tr("Abdos"), jambes: tr("Jambes") })[z];

export const nomGroupe = (g: Groupe) => ({
  pec: tr("Pecs"), dos: tr("Dos"), epa: tr("Épaules"), bic: tr("Biceps"), tri: tr("Triceps"), qua: tr("Quadriceps"), isc: tr("Ischios"), mol: tr("Mollets"), abd: tr("Abdos"),
})[g];
export const nomMuscle = (g: MuscleRecup) => (GROUPES as readonly string[]).includes(g) ? nomGroupe(g as Groupe)
  : ({ tra: tr("Trapèzes"), lom: tr("Lombaires"), avb: tr("Avant-bras"), add: tr("Adducteurs") } as Record<string, string>)[g];

/** Séance faite avant d'installer Oxa (accueil : « Tu t'es entraîné ces dernières 48 h ? ») : le jour et les muscles. */
export type Avant = { d: string; m: string[] };
/** Les muscles déclarés à l'accueil, en jours de récupération comme après une séance de volume moyen
    (abdos et mollets 1 jour, lombaires 2, dos et jambes 3, les autres 2) ; sans fausse séance dans l'historique. */
export function effortsDeclares(av?: Avant | null): Endurance[] {
  if (!av?.d || !av.m?.length) return [];
  const delai = (g: string) => (g === "abd" || g === "mol" ? 1 : g === "qua" || g === "isc" || g === "dos" ? 3 : 2);
  const m = av.m.filter((g): g is MuscleRecup => SUIVIS.has(g));
  return [1, 2, 3].map((jours) => ({ d: av.d, jours, muscles: m.filter((g) => delai(g) === jours) })).filter((e) => e.muscles.length);
}

/** Un effort d'endurance qui fatigue des muscles : `jours` de récupération à partir du jour `d`. */
export type Endurance = { d: string; jours: number; muscles: MuscleRecup[] };
const JAMBES: MuscleRecup[] = ["qua", "isc", "mol"];
/* cardio guidé : les muscles de chaque machine */
const MUSCLES_MACHINE: Record<string, MuscleRecup[]> = { tapis: JAMBES, ellip: JAMBES, stair: JAMBES, velo: ["qua", "isc"], ram: ["dos", "qua", "isc"], corde: ["mol"], pdc: ["qua", "mol"] };

/** Les sorties de course et le cardio guidé, en jours de récupération :
    - course : 72 h après 25 km et plus (ou une course de 21 km et plus), 48 h après 15 km, une course
      ou une sortie très dure (ressenti 8 et plus), 24 h après 8 km ou une sortie soutenue (6 et plus) ;
      rien pour un footing court et facile ;
    - cardio guidé : 24 h après du fractionné de 10 min et plus, ou une heure d'endurance. */
export function effortsEndurance(S: Sortie[] = [], C: HistoCardio[] = [], avant?: Avant | null): Endurance[] {
  const out: Endurance[] = effortsDeclares(avant);
  for (const s of S) {
    const jours = s.km >= 25 || (s.course && s.km >= 21) ? 3 : s.km >= 15 || s.course || s.rpe >= 8 ? 2 : s.km >= 8 || s.rpe >= 6 ? 1 : 0;
    if (jours) out.push({ d: s.d, jours, muscles: JAMBES });
  }
  for (const c of C) {
    const m = MUSCLES_MACHINE[c.m];
    if (m && (c.f === "endurance" ? c.min >= 60 : c.min >= 10)) out.push({ d: jourDe(c.ts), jours: 1, muscles: m });
  }
  return out;
}

type Modele = { id: string; nom: () => string; g: Groupe[]; large?: boolean };
const MODELES: Modele[] = [
  { id: "push", nom: () => tr("Pecs et triceps"), g: ["pec", "tri", "epa"] },
  { id: "pull", nom: () => tr("Dos et biceps"), g: ["dos", "bic"] },
  { id: "jambes", nom: () => tr("Jambes"), g: ["qua", "isc", "mol"] },
  { id: "epaabd", nom: () => tr("Épaules et abdos"), g: ["epa", "abd"] },
  { id: "haut", nom: () => tr("Haut du corps"), g: ["pec", "dos", "epa", "bic", "tri"], large: true },
  { id: "full", nom: () => tr("Full body"), g: ["pec", "dos", "qua", "isc", "epa", "abd"], large: true },
];

/* séries par groupe et par semaine, selon le niveau (Profil) : 8 en débutant, 12 en régulier,
   16 en confirmé ; 10 sans niveau connu */
let CIBLE = 10;
export const cibleNiveau = (niveau?: number) => (niveau == null ? 10 : niveau <= 1 ? 8 : niveau >= 3 ? 16 : 12);
const ecart = (a: string, b: string) => Math.round((dateDe(b).getTime() - dateDe(a).getTime()) / 864e5);

export type EtatGroupe = { dernier: string | null; jours: number; semaine: number; dernierVolume: number; recupere: boolean;
  /** jours restants avant d'être récupéré (0 : prêt) */
  reste: number };

/** Séries par muscle et par jour (principal 1, secondaire ½). */
function seriesParJour(H: LigneHist[], de: string, a: string) {
  const r: Record<string, Partial<Record<MuscleRecup, number>>> = {};
  for (const l of H) {
    if (l.d < de || l.d > a) continue;
    const j = (r[l.d] ??= {});
    for (const id in l.ex) {
      const x = EX[id], n = l.ex[id][4] || 0;
      if (!x || !n) continue;
      const p = PAT2MUSC[x.pat] as MuscleRecup | undefined, s = x.pat2 ? (PAT2MUSC[x.pat2] as MuscleRecup | undefined) : undefined;
      if (p && SUIVIS.has(p)) j[p] = (j[p] || 0) + n;
      if (s && s !== p && SUIVIS.has(s)) j[s] = (j[s] || 0) + n / 2;
    }
  }
  return r;
}

/** État de chaque muscle au jour `auj` ; `efforts` : course et cardio (effortsEndurance). */
export function etatGroupes(H: LigneHist[], auj: string, efforts: Endurance[] = []): Record<MuscleRecup, EtatGroupe> {
  const parJour = seriesParJour(H, decaler(auj, -13), auj);
  const jours = Object.keys(parJour).sort();
  const out = {} as Record<MuscleRecup, EtatGroupe>;
  for (const g of MUSCLES_RECUP) {
    const avec = jours.filter((d) => (parJour[d][g] || 0) >= 1);
    const dernier = avec.at(-1) ?? null;
    const semaine = jours.filter((d) => d > decaler(auj, -7)).reduce((n, d) => n + (parJour[d][g] || 0), 0);
    const dernierVolume = dernier ? parJour[dernier][g] || 0 : 0;
    const j = dernier ? ecart(dernier, auj) : 99;
    const recup = !dernier ? 0
      : g === "abd" || g === "mol" ? 1
      : g === "qua" || g === "isc" || g === "dos" ? (dernierVolume >= 8 ? 3 : 2)
      : g === "lom" ? (dernierVolume >= 2 ? 2 : 1)
      : dernierVolume >= 4 ? 2 : 1;
    out[g] = { dernier, jours: j, semaine, dernierVolume, recupere: j >= recup, reste: Math.max(0, recup - j) };
  }
  /* course et cardio : le plus long délai l'emporte */
  for (const e of efforts) {
    if (e.d > auj) continue;
    const reste = e.jours - ecart(e.d, auj);
    if (reste > 0) for (const g of e.muscles) if (reste > out[g].reste) out[g] = { ...out[g], recupere: false, reste };
  }
  return out;
}

export type Proposition = { id: string; nom: string; muscles: Groupe[]; raison: string };
export type Recommandation = {
  /** Jours travaillés récemment (4 derniers jours), du plus ancien au plus récent. */
  faits: { d: string; groupes: Groupe[] }[];
  type: "seance" | "repos" | "fait";
  propositions: Proposition[];
  /** repos ou séance déjà faite : ce qui irait le mieux demain */
  demain?: Proposition;
};

const groupesEcartes = (ecartes: ZoneEcartable[] = []) => new Set(ecartes.flatMap((z) => GROUPES_ZONE[z] ?? []));

/* un groupe bien travaillé il y a 2 jours ou moins est « frais » : récupéré peut-être, mais on préfère
   d'abord tourner sur les autres (le principe du split) */
const frais = (g: Groupe, e: EtatGroupe) => g !== "abd" && g !== "mol" && e.jours <= 2 && e.dernierVolume >= 4;

function propositions(E: Record<Groupe, EtatGroupe>, ecartes: Set<Groupe>): Proposition[] {
  const toutes = candidats(E, ecartes);
  const tournantes = toutes.filter((p) => !p.muscles.some((g) => frais(g, E[g])));
  return tournantes.length ? tournantes : toutes;
}

function candidats(E: Record<Groupe, EtatGroupe>, ecartes: Set<Groupe>): Proposition[] {
  const res: { p: Proposition; score: number }[] = [];
  for (const m of MODELES) {
    const g = m.g.filter((x) => !ecartes.has(x));
    /* un split dont un groupe principal est écarté ne veut plus rien dire ; haut du corps et full body s'en passent */
    if (!m.large && g.length < m.g.length && !(m.id === "push" && g.includes("pec"))) continue;
    if (g.length < (m.large ? 3 : 1)) continue;
    if (g.some((x) => !E[x].recupere)) continue;
    const score = g.reduce((n, x) => n + Math.max(0, CIBLE - E[x].semaine) / CIBLE + Math.min(E[x].jours, 7) / 7, 0) / g.length - (m.large ? 0.15 : 0);
    const jamais = g.filter((x) => E[x].semaine === 0);
    /* comme la feuille Récupération : le muscle le plus récent et le plus ancien, au-delà de 7 jours « 7 j et plus » */
    const js = g.map((x) => E[x].jours), depuis = Math.min(...js), jusqua = Math.max(...js);
    const raison = jamais.length === g.length || depuis >= 99 ? tr("Pas encore travaillés cette semaine.")
      : depuis >= 7 ? tr("Au repos depuis 7 jours et plus.")
      : jusqua === depuis ? tr("Au repos depuis {n} jours.", { n: depuis })
      : tr("Au repos depuis {n} jours et plus.", { n: depuis });
    res.push({ p: { id: m.id, nom: m.nom(), muscles: g, raison }, score });
  }
  return res.sort((a, b) => b.score - a.score).map((x) => x.p);
}

/** La recommandation du jour, ou null sans aucune séance sur les 14 derniers jours. */
export function recommander(H: LigneHist[], auj: string, ecartes: ZoneEcartable[] = [], niveau?: number, efforts: Endurance[] = []): Recommandation | null {
  CIBLE = cibleNiveau(niveau);
  const E = etatGroupes(H, auj, efforts);
  /* aucune séance sur 14 jours et rien en récupération (course, cardio, séance déclarée à l'accueil) : pas de recul */
  if (GROUPES.every((g) => !E[g].dernier && E[g].recupere)) return null;
  const parJour = seriesParJour(H, decaler(auj, -3), auj);
  const faits = Object.keys(parJour).sort().map((d) => ({ d, groupes: GROUPES.filter((g) => (parJour[d][g] || 0) >= 2) })).filter((f) => f.groupes.length);
  const exclus = groupesEcartes(ecartes);
  const recuperent = GROUPES.filter((g) => !E[g].recupere && !exclus.has(g));
  const ajouterRecup = (p: Proposition) => recuperent.length
    ? { ...p, raison: p.raison + " " + tr("{a} récupèrent.", { a: phrase(recuperent.slice(0, 3).map(nomGroupe)) }) }
    : p;
  const demain = () => propositions(etatGroupes(H, decaler(auj, 1), efforts), exclus)[0];
  if (faits.at(-1)?.d === auj) return { faits, type: "fait", propositions: [], demain: demain() };
  const props = propositions(E, exclus);
  if (!props.length) return { faits, type: "repos", propositions: [], demain: demain() };
  return { faits, type: "seance", propositions: [ajouterRecup(props[0]), ...props.slice(1)], demain: undefined };
}

/** « a, b et c » */
export function lister(l: string[]) {
  return l.length <= 1 ? l.join("") : l.slice(0, -1).join(", ") + " " + tr("et") + " " + l.at(-1);
}

/** Une liste de muscles dans une phrase : « Dos et biceps ». */
export const phrase = (l: string[]) => { const t = lister(l).toLowerCase(); return t.charAt(0).toUpperCase() + t.slice(1); };

/** La recommandation pour un jour donné, avec un repli quand Oxa manque de recul (aucune séance
    sur les 14 derniers jours) : un full body pour démarrer. Sert à l'agenda. */
export function recoDuJour(H: LigneHist[], d: string, ecartes: ZoneEcartable[] = [], niveau?: number, efforts: Endurance[] = []): Recommandation & { debut?: boolean } {
  const r = recommander(H, d, ecartes, niveau, efforts);
  if (r) return r;
  const exclus = groupesEcartes(ecartes), full = MODELES.find((m) => m.id === "full")!;
  const muscles = full.g.filter((g) => !exclus.has(g));
  return { faits: [], type: "seance", debut: true, propositions: [{ id: "full", nom: full.nom(), muscles: muscles.length ? muscles : full.g, raison: tr("Idéal pour démarrer.") }] };
}

/** Les muscles à cocher pour lancer la recommandation de ce jour (séance conseillée, sinon celle de demain). */
export const musclesRecommandes = (r: Recommandation) => (r.propositions[0] ?? r.demain)?.muscles ?? null;
