/* Questionnaire et génération du cycle : port fidèle de buildQ, payload,
   recap, CHOIX_DEF, txtRefus et volReel de l'ancienne app. */
import { EX } from "@/lib/data/exercices";
import { AXES, BLESN, MATN, OBJN, PAT2GRP, REGN, SPORTS } from "@/lib/data/referentiels";
import { accDeclares, aTrait, freqDe, groupes, sportsChoisis, sportsInfo, sportsTotal, week } from "./core";
import type { Etat, Reponses } from "./types";

export type Question = {
  k: string;
  q: string;
  h?: string;
  t?: "multi" | "freq" | "prefs" | "loads";
  max?: number;
  o?: [string, string | null | undefined][];
  rows?: string[];
  loads?: [string, number, number, string][];
};

export function buildQ(A: Reponses): Question[] {
  const deb = A.regularite === 0 || A.regularite === 1;
  const q: Question[] = [
    { k: "objectif", q: "Quel est ton objectif principal ?", h: "Un seul. C'est ce qui décide du volume et des charges.", o: [
      ["Prendre du muscle", "Volume et surcharge progressive"], ["Gagner en force", "Charges lourdes, séries courtes"],
      ["M'affiner et perdre du gras", "Garder le muscle en déficit"], ["Rester en forme", "Entretien, sans forcer"]] },
    { k: "regularite", q: "Sur les six derniers mois, tu t'es entraîné à quel rythme ?", h: "Une moyenne honnête. C'est ce qui détermine le volume que ton corps encaisse aujourd'hui.", o: [
      ["Pas du tout ou presque", "Reprise complète"], ["Par périodes", "Quelques séances par mois"],
      ["Une à deux fois par semaine", null], ["Trois fois par semaine ou plus", null]] },
    { k: "socle", q: "Combien de séances peux-tu tenir chaque semaine ?", h: "Elles sont numérotées, pas datées. Tu les places dans l'ordre, aux jours qui t'arrangent, et l'ordre peut changer d'une semaine à l'autre.", o: [
      ["2 séances", null], ["3 séances", null], ["4 séances", null]] },
    { k: "axe", q: "Sur quoi veux-tu axer ta séance bonus ?", h: "Trente minutes en plus du socle, à faire si l'envie et le temps sont là. La sauter ne freine jamais ta progression.", o: [
      ["Points faibles", "Curl incliné, extensions poulie, élévations latérales"],
      ["Souffle et condition physique", "Rameur en intervalles et gainage"],
      ["Mobilité et récupération", "Fléchisseurs de hanche, haut du dos, arrière d'épaule"]] },
    { k: "sport", t: "multi", max: 3, q: "Pratiques-tu d'autres sports dans la semaine ?",
      h: "Trois au maximum. Ce qui compte n'est pas le nom du sport mais ce qu'il coûte à ton corps : jambes, souffle, épaules, récupération.",
      o: SPORTS.map((s) => [s.n, s.d || null]) },
  ];
  if (sportsChoisis(A).length) q.push({ k: "sportFreq", t: "freq", q: "À quelle fréquence ?", h: "Sert à calculer ce que ton corps encaisse déjà en dehors de la salle." });
  q.push(
    { k: "materiel", q: "À quoi as-tu accès ?", h: "Détermine aussi les alternatives qu'on te proposera en salle.", o: [["Salle complète", "Barres, machines, poulies"], ["Home gym", "Rack, barre, banc"], ["Haltères seuls", null], ["Poids du corps", null]] },
    { k: "acc", t: "multi", q: "As-tu aussi ce matériel ?", h: "Utilisable quel que soit ton lieu d'entraînement : les exercices correspondants s'ajoutent à ceux de ton matériel.", o: [["Kettlebell", null], ["Élastiques de résistance", null], ["Aucun des deux", null]] },
    { k: "blessure", t: "multi", q: "Des blessures ou des gênes ?", h: "On retire les mouvements concernés du programme.", o: [["Épaules", null], ["Bas du dos", null], ["Genoux", null], ["Coudes ou poignets", null], ["Rien à signaler", null]] },
    { k: "sexe", q: "Tu es…", h: "Le sexe change la répartition de force entre haut et bas du corps, la tolérance au volume et la récupération. Il sert aussi à ordonner les questions qui suivent.", o: [
      ["Un homme", null], ["Une femme", null], ["Je préfère ne pas répondre", "Le programme utilisera des repères moyens"]] },
    { k: "prio", t: "multi", max: 2, q: "Des groupes à prioriser ?", h: "Deux au maximum, sinon plus rien n'est prioritaire. C'est aussi vers eux que sera redirigé le volume si tu écartes un groupe à l'étape suivante.",
      o: groupes(A).map((g) => [g, null] as [string, null]).concat([["Aucun en particulier", null]]) },
    { k: "prefs", t: "prefs", q: "Tes préférences d'exercices", h: "Pour chaque groupe, coche le matériel que tu aimes utiliser. Tu peux aussi écarter complètement un groupe du programme.", rows: groupes(A) },
  );
  if (!deb)
    q.push({ k: "actuel", q: "Que fais-tu en ce moment ?", h: "C'est ce qui permet de comparer et de dire ce qui manque.", o: [
      ["Full body", "Tout le corps à chaque séance"], ["Haut / bas", null], ["Push Pull Legs", null], ["Rien de structuré", "Selon l'envie"]] });
  q.push({ k: "profil", t: "loads", q: "Pour finir", h: "Sert à calibrer le volume, les temps de récupération et à situer ton IMC.", loads: [["Âge", 29, 1, "ans"], ["Taille", 178, 1, "cm"], ["Poids", 76, 1, "kg"]] });
  return q;
}

/* Alertes de cohérence sur les sports : [en gras, suite]. */
export function sportWarn(A: Reponses): [string, string][] {
  const l: [string, string][] = [];
  if (aTrait(A, "muscu")) l.push(["Le crossfit est déjà de la musculation.", "Une partie de ton volume serait comptée deux fois : le programme sera allégé, mais cumuler les deux demande une vraie récupération."]);
  if (A.axe === 1 && aTrait(A, "cardio")) l.push(["Tu as choisi l'axe souffle pour ta séance bonus,", "or tes pratiques couvrent déjà le cardio. L'axe mobilité te servirait davantage."]);
  if (A.axe === 2 && aTrait(A, "leger") && sportsInfo(A).length === 1) l.push(["Tu as choisi l'axe mobilité,", "or le yoga et le pilates la travaillent déjà mieux que nous. L'axe points faibles serait plus utile."]);
  if (aTrait(A, "tirage")) l.push(["L'escalade sollicite lourdement tes tirages et tes avant-bras.", "Le volume de dos du programme en tiendra compte."]);
  if (sportsTotal(A) >= 4) l.push([`Tu totalises ${sportsTotal(A)} séances de sport par semaine`, "en plus de la musculation. Le volume des jambes sera nettement réduit, et la récupération devient ton facteur limitant."]);
  return l;
}

export const prioNoms = (A: Reponses) => { const g = groupes(A); return (A.prio || []).map((i) => g[i]).filter(Boolean); };

/* Corps de la requête envoyée à la fonction `generer` (inchangée). */
export function payload(A: Reponses, forcer = false) {
  const p: Record<string, unknown> = {
    objectif: A.objectif, regularite: A.regularite, socle: A.socle, axe: A.axe, materiel: A.materiel,
    sexe: A.sexe, acc: accDeclares(A), blessure: A.blessure, prefs: A.prefs, profil: A.profil, sportFreq: A.sportFreq,
    exclus: A.exclus || [],
  };
  if (forcer) p.forcer = true;
  if (sportsChoisis(A).length) {
    p.sportNom = sportsChoisis(A).map((i) => SPORTS[i].n + " (" + (freqDe(A, i) + 1) + "×/sem)").join(", ");
    p.sportSeances = sportsTotal(A);
  }
  if (A.actuel != null) p.actuelNom = ["full body", "haut / bas", "push pull legs", "rien de structuré"][A.actuel];
  if (A.prio && A.prio.length) p.prioNoms = prioNoms(A);
  return p;
}

export function volReel(E: Etat) {
  const t: Record<string, number> = {};
  groupes(E.A).forEach((g) => (t[g] = 0));
  week(E).forEach((s) => {
    if (s.sportOnly || s.b) return;
    (s.x || []).forEach((e) => { const g = PAT2GRP[EX[e[0]]?.pat]; if (g && t[g] !== undefined) t[g] += e[1]; });
  });
  return t;
}

export function recap(E: Etat): [string, string][] {
  const A = E.A, n = week(E).filter((s) => !s.b && !s.sportOnly).length, r: [string, string][] = [];
  r.push(["Objectif", OBJN[A.objectif ?? -1] || "—"]);
  r.push(["Ces 6 derniers mois", REGN[A.regularite ?? -1] || "—"]);
  r.push(["Séances", n + " par semaine, plus un bonus"]);
  r.push(["Axe du bonus", AXES[A.axe ?? -1] || "—"]);
  r.push(["Matériel", MATN[A.materiel ?? -1] || "—"]);
  if (sportsChoisis(A).length) r.push(["Autres sports", sportsChoisis(A).map((i) => SPORTS[i].n + " " + (freqDe(A, i) + 1) + "×").join(", ")]);
  const b = (A.blessure || []).map((i) => BLESN[i]).filter(Boolean);
  if (b.length) r.push(["À ménager", b.join(", ")]);
  const p = prioNoms(A);
  if (p.length) r.push(["Priorités", p.join(", ")]);
  if ((A.exclus || []).length) r.push(["Écartés du programme", A.exclus!.join(", ")]);
  const np = Object.values(A.prefs || {}).filter((v) => v.length).length;
  if (np) r.push(["Préférences", np + " groupe" + (np > 1 ? "s" : "") + " avec un matériel choisi"]);
  return r;
}

export function choixDef(E: Etat): [string, string][] {
  const n = week(E).filter((s) => !s.b && !s.sportOnly).length;
  return [
    ["Un découpage haut du corps et bas du corps", `Avec ${n} séances par semaine, c'est le format qui permet de solliciter chaque groupe deux fois. C'est le rythme qui produit le plus de progression pour un volume donné.`],
    ["Deux variantes par mouvement, en alternance", "Chaque exercice principal alterne avec une variante proche d'une semaine sur l'autre : tu ne refais jamais la même séance deux semaines de suite. Chaque variante revient toutes les deux semaines et progresse de son côté, pendant que les accessoires changent chaque semaine."],
    ["C'est l'effort qui monte, pas le volume", "RPE 7 sur les semaines 1 et 2, RPE 8 jusqu'à la cinquième, RPE 9 ensuite. Tu gardes le même nombre de séries, mais tu t'approches progressivement de ta limite."],
  ];
}

export function txtRefus(l: string[]) {
  const u = [...new Set(l)];
  return (u.length > 1 ? u.length + " exercices proposés par l'IA ont été écartés et remplacés" : "Un exercice proposé par l'IA a été écarté et remplacé")
    + " : " + u.join(" · ")
    + ". En cause : un mouvement qui n'existe pas dans la bibliothèque, ou qui ne correspond pas à ton matériel ou aux groupes que tu as exclus.";
}

/* Une question est-elle répondue (pour activer « Continuer ») ? */
export function repondue(A: Reponses, q: Question) {
  const v = A[q.k];
  if (q.t === "freq") return sportsChoisis(A).every((i) => (A.sportFreq || {})[i] !== undefined);
  if (q.t === "multi") return Array.isArray(v) && v.length > 0;
  if (q.t === "prefs") return v !== undefined;
  return v !== undefined;
}
