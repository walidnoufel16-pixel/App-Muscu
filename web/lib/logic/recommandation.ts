/* « Ma recommandation du jour » : d'après les séances des derniers jours, quels muscles travailler
   aujourd'hui. Logique pure.
   - Chaque grand groupe : dernier jour travaillé, séries sur 7 jours (muscle principal 1 série,
     muscle secondaire ½), séries du dernier jour.
   - Récupération : 24 h pour les abdos et les mollets ; 72 h pour les jambes et le dos après une
     grosse séance (8 séries ou plus), 48 h sinon ; 48 h pour les autres à partir de 4 séries.
   - Séances possibles : les splits classiques ; on écarte celles qui touchent un groupe qui récupère
     ou que la personne a écarté, puis on préfère les groupes les moins travaillés de la semaine et
     ceux laissés de côté depuis le plus longtemps. */
import { tr } from "@/lib/i18n";
import { EX } from "@/lib/data/exercices";
import { PAT2MUSC } from "@/lib/data/referentiels";
import { dateDe, decaler, type LigneHist } from "./historique";

export const GROUPES = ["pec", "dos", "epa", "bic", "tri", "qua", "isc", "mol", "abd"] as const;
export type Groupe = (typeof GROUPES)[number];

/** Ce qu'on peut écarter des recommandations (Profil ou carte) : des zones, plus parlantes que les muscles. */
export type ZoneEcartable = "pec" | "dos" | "epa" | "bras" | "abd" | "jambes";
export const ZONES_ECARTABLES: ZoneEcartable[] = ["jambes", "pec", "dos", "epa", "bras", "abd"];
const GROUPES_ZONE: Record<ZoneEcartable, Groupe[]> = { pec: ["pec"], dos: ["dos"], epa: ["epa"], bras: ["bic", "tri"], abd: ["abd"], jambes: ["qua", "isc", "mol"] };
export const nomZone = (z: ZoneEcartable) => ({ pec: tr("Pectoraux"), dos: tr("Dos"), epa: tr("Épaules"), bras: tr("Bras"), abd: tr("Abdos"), jambes: tr("Jambes") })[z];

export const nomGroupe = (g: Groupe) => ({
  pec: tr("Pecs"), dos: tr("Dos"), epa: tr("Épaules"), bic: tr("Biceps"), tri: tr("Triceps"), qua: tr("Quadriceps"), isc: tr("Ischios"), mol: tr("Mollets"), abd: tr("Abdos"),
})[g];

type Modele = { id: string; nom: () => string; g: Groupe[]; large?: boolean };
const MODELES: Modele[] = [
  { id: "push", nom: () => tr("Pecs et triceps"), g: ["pec", "tri", "epa"] },
  { id: "pull", nom: () => tr("Dos et biceps"), g: ["dos", "bic"] },
  { id: "jambes", nom: () => tr("Jambes"), g: ["qua", "isc", "mol"] },
  { id: "epaabd", nom: () => tr("Épaules et abdos"), g: ["epa", "abd"] },
  { id: "haut", nom: () => tr("Haut du corps"), g: ["pec", "dos", "epa", "bic", "tri"], large: true },
  { id: "full", nom: () => tr("Full body"), g: ["pec", "dos", "qua", "isc", "epa", "abd"], large: true },
];

const CIBLE = 10; // séries par groupe et par semaine
const ecart = (a: string, b: string) => Math.round((dateDe(b).getTime() - dateDe(a).getTime()) / 864e5);

export type EtatGroupe = { dernier: string | null; jours: number; semaine: number; dernierVolume: number; recupere: boolean };

/** Séries par groupe et par jour (principal 1, secondaire ½). */
function seriesParJour(H: LigneHist[], de: string, a: string) {
  const r: Record<string, Partial<Record<Groupe, number>>> = {};
  for (const l of H) {
    if (l.d < de || l.d > a) continue;
    const j = (r[l.d] ??= {});
    for (const id in l.ex) {
      const x = EX[id], n = l.ex[id][4] || 0;
      if (!x || !n) continue;
      const p = PAT2MUSC[x.pat] as Groupe | undefined, s = x.pat2 ? (PAT2MUSC[x.pat2] as Groupe | undefined) : undefined;
      if (p && GROUPES.includes(p)) j[p] = (j[p] || 0) + n;
      if (s && s !== p && GROUPES.includes(s)) j[s] = (j[s] || 0) + n / 2;
    }
  }
  return r;
}

/** État de chaque groupe au jour `auj`. */
export function etatGroupes(H: LigneHist[], auj: string): Record<Groupe, EtatGroupe> {
  const parJour = seriesParJour(H, decaler(auj, -13), auj);
  const jours = Object.keys(parJour).sort();
  const out = {} as Record<Groupe, EtatGroupe>;
  for (const g of GROUPES) {
    const avec = jours.filter((d) => (parJour[d][g] || 0) >= 1);
    const dernier = avec.at(-1) ?? null;
    const semaine = jours.filter((d) => d > decaler(auj, -7)).reduce((n, d) => n + (parJour[d][g] || 0), 0);
    const dernierVolume = dernier ? parJour[dernier][g] || 0 : 0;
    const j = dernier ? ecart(dernier, auj) : 99;
    const recup = !dernier ? 0
      : g === "abd" || g === "mol" ? 1
      : g === "qua" || g === "isc" || g === "dos" ? (dernierVolume >= 8 ? 3 : 2)
      : dernierVolume >= 4 ? 2 : 1;
    out[g] = { dernier, jours: j, semaine, dernierVolume, recupere: j >= recup };
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
    const depuis = Math.min(...g.map((x) => E[x].jours));
    const raison = jamais.length === g.length ? tr("Pas encore travaillés cette semaine.")
      : depuis >= 99 ? tr("Pas encore travaillés cette semaine.")
      : tr("Pas travaillés depuis {n} jours.", { n: depuis });
    res.push({ p: { id: m.id, nom: m.nom(), muscles: g, raison }, score });
  }
  return res.sort((a, b) => b.score - a.score).map((x) => x.p);
}

/** La recommandation du jour, ou null sans aucune séance sur les 14 derniers jours. */
export function recommander(H: LigneHist[], auj: string, ecartes: ZoneEcartable[] = []): Recommandation | null {
  const E = etatGroupes(H, auj);
  if (GROUPES.every((g) => !E[g].dernier)) return null;
  const parJour = seriesParJour(H, decaler(auj, -3), auj);
  const faits = Object.keys(parJour).sort().map((d) => ({ d, groupes: GROUPES.filter((g) => (parJour[d][g] || 0) >= 2) })).filter((f) => f.groupes.length);
  const exclus = groupesEcartes(ecartes);
  const recuperent = GROUPES.filter((g) => !E[g].recupere && !exclus.has(g));
  const ajouterRecup = (p: Proposition) => recuperent.length
    ? { ...p, raison: p.raison + " " + tr("{a} récupèrent.", { a: phrase(recuperent.slice(0, 3).map(nomGroupe)) }) }
    : p;
  const demain = () => propositions(etatGroupes(H, decaler(auj, 1)), exclus)[0];
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
export function recoDuJour(H: LigneHist[], d: string, ecartes: ZoneEcartable[] = []): Recommandation & { debut?: boolean } {
  const r = recommander(H, d, ecartes);
  if (r) return r;
  const exclus = groupesEcartes(ecartes), full = MODELES.find((m) => m.id === "full")!;
  const muscles = full.g.filter((g) => !exclus.has(g));
  return { faits: [], type: "seance", debut: true, propositions: [{ id: "full", nom: full.nom(), muscles: muscles.length ? muscles : full.g, raison: tr("Idéal pour démarrer.") }] };
}

/** Les muscles à cocher pour lancer la recommandation de ce jour (séance conseillée, sinon celle de demain). */
export const musclesRecommandes = (r: Recommandation) => (r.propositions[0] ?? r.demain)?.muscles ?? null;
