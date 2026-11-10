/* Séance construite à partir des muscles choisis : tout se calcule ici, sans
   IA (instantané, gratuit, hors ligne). Port fidèle de l'ancienne app. */

import { tr } from "@/lib/i18n";
import { EX } from "@/lib/data/exercices";
import { MUSC, ZPATS } from "@/lib/data/referentiels";
import { exoFiltre, secondesDe } from "./core";
import type { ExLibre, Reponses, SeanceLibre } from "./types";

type Hasard = () => number;
const tirer = <T,>(l: T[], rnd: Hasard) => l[Math.floor(rnd() * l.length)];

/* Prescription selon l'objectif : polyarticulaire plus lourd, isolation plus légère. */
export function prescription(id: string, poly: boolean, obj: number): ExLibre {
  const x = EX[id], abdo = ["ae", "ft"].includes(x.pat);
  let s = obj === 1 ? 4 : 3, r = [10, poly ? 6 : 8, 12, 10][obj] ?? 10;
  const p = abdo ? tr("60 s") : obj === 1 ? (poly ? tr("3 min") : tr("2 min")) : obj === 0 ? (poly ? tr("2 min") : tr("90 s")) : poly ? tr("90 s") : tr("60 s");
  if (x.ch === "temps") r = obj === 1 ? 30 : 45;
  else if (x.ch === "aucune") r = Math.max(r, 12);
  if (obj === 1 && !poly) s = 3;
  return { id, s, r, p };
}

/* `evite` : exercices à éviter (zones sensibles), gardés seulement s'il n'y a rien d'autre. */
/* Groupes du Profil (muscles prioritaires) → muscles de l'assistant. */
const GROUPE_MUSC: Record<string, string[]> = {
  "Pectoraux": ["pec"], "Dos": ["dos"], "Épaules": ["epa"], "Bras": ["bic", "tri"], "Quadriceps": ["qua"],
  "Fessiers et ischio-jambiers": ["isc"], "Abdominaux et lombaires": ["abd", "lom"],
};
export const musclesPrioritaires = (noms: string[]) => noms.flatMap((n) => GROUPE_MUSC[n] || []);

/* `niveau` (Profil, A.regularite) : volume ×0,8 pour qui débute ou reprend, ×1,15 pour un confirmé.
   `o.prio` : muscles prioritaires (un exercice de plus s'ils sont choisis) ; `o.habitudes` : exercices
   déjà faits, préférés pour le premier exercice de chaque muscle (une base stable, des courbes lisibles). */
/** Un hasard reproductible : la même clé (jour, muscles, réglages) donne la même séance. Rouvrir l'assistant
    le même jour avec les mêmes choix propose donc la même séance ; « Autre » dans le composeur en tire une autre. */
export function hasardDe(cle: string): Hasard {
  let h = 2166136261;
  for (let i = 0; i < cle.length; i++) h = Math.imul(h ^ cle.charCodeAt(i), 16777619);
  return () => { h = (h + 0x6d2b79f5) | 0; let t = Math.imul(h ^ (h >>> 15), 1 | h); t ^= t + Math.imul(t ^ (t >>> 7), 61 | t); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

/* ---------------- construction d'une séance : des cases par fonction ----------------
   Comme un coach l'écrit (NSCA, Essentials, chap. 17 ; ACSM 2009) : chaque muscle se travaille par
   fonctions, dans l'ordre. Case 1 : le mouvement principal (polyarticulaire), case 2 : l'autre
   fonction ou un second polyarticulaire, case 3 : l'isolation. Le niveau dit combien de cases on
   remplit ; la durée choisie dit jusqu'où (temps réel : séries, repos, mise en place, échauffement).
   Jamais dans une séance générée : la pliométrie, les mouvements balistiques, les exercices de soin,
   les élévations frontales (le devant de l'épaule travaille déjà sur tous les développés). */
const CASES: Record<string, string[][]> = {
  qua: [["sq", "sqf", "pr", "hack", "smith", "gob", "sqh", "kbfs", "sqpc", "elsq"], ["fe", "fb", "bul", "ferh", "bulsm", "mont", "montb", "fepc"], ["lext", "lext1"]],
  isc: [["rm", "rmh", "ht", "trap", "sdt", "gm", "sdts", "kbsdt1", "pth", "elgm", "pont"], ["lc", "lcas", "lcd", "nord"], ["ht", "pont", "pont1", "kick", "kickpc", "pth", "elpt"]],
  pec: [["dc", "dh", "chpm", "dcsm", "dhn", "kbfp", "pomp", "pompl", "eldc", "dip"], ["dci", "dhi", "dcism", "chpi", "pompe"], ["ecart", "pecdk", "ecah", "ecai", "ecab", "ecpb", "ecpi", "elec"]],
  dos: [["tp", "tr", "trs", "tpn", "tpsu", "tp1", "eltr"], ["rw", "rh", "tps", "rw2", "rwapp", "rwm", "tbarp", "seal", "tps1", "landr", "rwsu", "rwhm", "tbar", "kbrw", "kbrw2", "ra"], ["tbt", "tbtc", "pull"]],
  epa: [["dmh", "dm", "dmm", "arn", "dmsm", "dmhd", "kbdm", "kbdma", "eldm"], ["el", "elp", "eli", "elel"], ["ois", "rmf", "oisp", "oisc", "oisi", "eloi"]],
  bic: [["curlh", "cu", "curlb", "curlez", "curlp", "pup", "pupp", "pupm", "spid", "drag", "curlc"], ["mart", "martc", "martx", "zott"]],
  tri: [["dcs", "dipt", "bfront", "skull", "dipm", "bfronth", "pompt", "bdips"], ["tri", "tricor", "nuq", "extnh", "extdb", "trim", "kickt", "trinv", "elskull"]],
  mol: [["mol", "molh", "molp", "mol1", "elmol"], ["molA", "molah", "molab"]],
  abd: [["gai", "pal", "roue", "dbug", "plat"], ["crp", "crm", "rj", "crinv", "crinvp", "buch", "rjb", "rgen", "cr", "crd", "velocr", "crx"]],
  lom: [["lom", "revhyp", "lomsol", "sup"]],
};
const JAMAIS = new Set(["pp", "elf", "elfp", "mclimb", "kbtgu", "kbwm", "trpush", "trpull", "kbsw", "kbthr", "abd"]);
const genere = (o: string) => !!EX[o] && !EX[o].horsIA && !EX[o].soin && !JAMAIS.has(o) && EX[o].ch !== "dist";

type Role = "principal" | "accessoire" | "isolation" | "tronc";
/* Répétitions et repos selon l'objectif (muscle, force, s'affiner, forme) et le rôle (NSCA). */
const REPS: Record<Exclude<Role, "tronc">, number[]> = { principal: [8, 5, 10, 10], accessoire: [10, 6, 12, 12], isolation: [12, 10, 15, 12] };
const REPOS: Record<Exclude<Role, "tronc">, string[]> = { principal: ["2 min 30", "3 min", "90 s", "2 min"], accessoire: ["90 s", "2 min", "75 s", "90 s"], isolation: ["60 s", "90 s", "45 s", "60 s"] };
function prescrire(id: string, role: Role, obj: number, niveau: number | undefined, dense?: boolean): ExLibre {
  const x = EX[id], debut = niveau != null && niveau <= 1, conf = niveau != null && niveau >= 3;
  if (role === "tronc") {
    const r = x.ch === "temps" ? (obj === 1 ? 30 : 45) : 12;
    return { id, s: debut ? 2 : 3, r, p: tr("60 s") };
  }
  let r = REPS[role][obj] ?? 10, p = tr(REPOS[role][obj] ?? "90 s");
  /* débutant (ACSM 2009) : 8 à 12 répétitions et des repos d'une à deux minutes, même sur les gros mouvements */
  if (debut && role !== "isolation") { r = Math.max(r, obj === 1 ? 8 : 10); p = role === "principal" ? tr("2 min") : tr("90 s"); }
  const s = role === "principal" ? (debut ? 3 : conf || obj === 1 ? 4 : 3) : debut ? 2 : 3;
  if (x.ch === "temps") r = obj === 1 ? 30 : 45;
  else if (x.ch === "aucune") r = Math.max(r, 12);
  if (dense && role === "isolation") p = tr("45 s");
  return { id, s, r, p };
}

export function construireSeance(muscles: string[], duree: number, obj: number, sel: string[], rnd: Hasard = Math.random, eviteZones: (o: string) => boolean = () => false, niveau?: number, o: { prio?: string[]; habitudes?: Set<string>; dense?: boolean } = {}): ExLibre[] {
  /* débutant : pas de soulevé de terre ni de good morning à la barre (technique et charge sur le bas du
     dos) ; soulevé de terre roumain aux haltères, hip thrust… à la place, s'il y en a */
  const evite = (x: string) => eviteZones(x) || (niveau != null && niveau <= 1 && EX[x]?.eq === 1 && chargeLombaires(x));
  const G = muscles.map((k) => MUSC.find((g) => g.k === k)).filter(Boolean) as typeof MUSC;
  /* combien de cases par muscle selon le niveau (ACSM : un exercice par grand groupe pour débuter) :
     grands muscles et épaules 1 en débutant, 2 en régulier, 3 en confirmé ; petits muscles et tronc
     1 (confirmé 2) ; un muscle prioritaire en a une de plus */
  const max = (g: (typeof G)[number]) => {
    const grand = g.g >= 0.8, tronc = g.k === "abd" || g.k === "lom";
    const n = tronc ? (niveau != null && niveau >= 3 ? 2 : 1) : !grand ? (niveau != null && niveau >= 3 ? 2 : 1)
      : niveau != null && niveau >= 3 ? 3 : niveau != null && niveau <= 1 ? 1 : 2;
    return Math.min((CASES[g.k] || [[]]).length, n + (o.prio?.includes(g.k) ? 1 : 0));
  };
  const pris = new Set<string>(), res: (ExLibre & { role: Role; k: string })[] = [];
  const candidats = (k: string, c: number) => {
    const ids = CASES[k] ? CASES[k][c] || [] : Object.keys(EX).filter((x) => MUSC.find((g) => g.k === k)?.pats.includes(EX[x].pat));
    const l = ids.filter((x) => genere(x) && exoFiltre(x, sel) && !pris.has(x));
    const surs = l.filter((x) => !evite(x));
    return surs.length ? surs : l;
  };
  /* rien dans les cases avec ce matériel (street workout, poids du corps) : les exercices du muscle
     (exercices street compris), sinon ceux qui le travaillent aussi (tractions supination pour les biceps) */
  const secours = (k: string) => {
    const pats = MUSC.find((g) => g.k === k)?.pats || [];
    /* les pompes en appui vertical (en équilibre sur les mains) : un exercice de confirmé */
    const ok = (x: string) => exoFiltre(x, sel) && !pris.has(x) && !EX[x].soin && !JAMAIS.has(x) && EX[x].ch !== "dist" && (x !== "pv3" || (niveau != null && niveau >= 3));
    const l = Object.keys(EX).filter((x) => pats.includes(EX[x].pat) && ok(x)), l2 = l.length ? l : Object.keys(EX).filter((x) => pats.includes(EX[x].pat2 || "") && ok(x));
    const surs = l2.filter((x) => !evite(x));
    return surs.length ? surs : l2;
  };
  /* parmi les candidats : un exercice déjà fait (une base stable), sinon un qui se charge, sinon un autre */
  const choisir = (l: string[]) => {
    const connus = l.filter((x) => o.habitudes?.has(x));
    if (connus.length) return tirer(connus, rnd);
    const kg = l.filter((x) => EX[x].ch === "kg"), c = l.filter((x) => EX[x].ch !== "aucune");
    return tirer(kg.length ? kg : c.length ? c : l, rnd);
  };
  /* un second schéma « avant-bras », « trapèzes », « adducteurs » ou « mollets » ne fait pas un polyarticulaire (curls) */
  const estPoly = (x: string) => !!EX[x].pat2 && !["avb", "tra", "add", "mol"].includes(EX[x].pat2!) && x !== "pull" && !["ae", "ft"].includes(EX[x].pat);
  const ajouter = (g: (typeof G)[number], c: number) => {
    const l = c < 0 ? secours(g.k) : candidats(g.k, c);
    if (!l.length) return false;
    const id = choisir(l), tronc = g.k === "abd" || g.k === "lom";
    /* le premier exercice d'un muscle, s'il est polyarticulaire, est son mouvement principal */
    const premier = !res.some((e) => e.k === g.k);
    const role: Role = tronc ? "tronc" : premier && estPoly(id) ? "principal" : estPoly(id) ? "accessoire" : "isolation";
    pris.add(id);
    res.push({ ...prescrire(id, role, obj, niveau, o.dense), role, k: g.k });
    return true;
  };
  /* le temps réel (échauffement compris) ne doit pas dépasser la durée choisie */
  /* et pas plus de 24 séries : au-delà, la fatigue l'emporte (même avis que le composeur) */
  const tient = () => dureeEstimee(res) <= duree && res.reduce((a, e) => a + e.s, 0) <= 24;
  /* à taille égale, le tirage et les jambes passent avant la poussée (l'équilibre du haut du corps) */
  const PREF = ["dos", "qua", "isc", "pec", "epa"], pref = (k: string) => (PREF.includes(k) ? PREF.indexOf(k) : 9);
  const ordre = G.slice().sort((a, b) => Number(!!o.prio?.includes(b.k)) - Number(!!o.prio?.includes(a.k)) || b.g - a.g || pref(a.k) - pref(b.k));
  /* 1. un exercice par muscle, quoi qu'il arrive (la première case qui a un candidat) */
  for (const g of ordre) { let ok = false; for (let c = 0; c < (CASES[g.k]?.length || 1) && !ok; c++) ok = ajouter(g, c); if (!ok) ajouter(g, -1); }
  /* trop long : 2 séries sur l'isolation et le tronc, puis partout sauf le principal, puis partout */
  for (const garde of [(e: (typeof res)[number]) => e.role === "principal" || e.role === "accessoire", (e: (typeof res)[number]) => e.role === "principal", () => false])
    /* en partant de la fin : les petits muscles et l'isolation d'abord, le mouvement principal en dernier */
    for (const e of [...res].reverse()) if (!tient() && !garde(e) && e.s > 2) e.s = 2;
  /* 2. les cases suivantes, tour par tour (grands muscles d'abord), tant que la durée le permet */
  for (let c = 1; c < 3; c++)
    for (const g of ordre) {
      if (c >= max(g) || res.filter((e) => e.k === g.k).length !== c) continue;
      if (!ajouter(g, c)) continue;
      if (!tient()) res.pop();
    }
  /* 3. du temps en trop : une série de plus aux mouvements principaux, puis aux accessoires (5 au plus,
     3 pour un débutant : ACSM, 1 à 3 séries) */
  for (const role of ["principal", "accessoire"] as Role[])
    for (const e of res) if (e.role === role && e.s < (niveau != null && niveau <= 1 ? 3 : 5)) { e.s++; if (!tient()) e.s--; }
  const rang = (e: (typeof res)[number]) => (e.role === "tronc" ? 3 : e.role === "principal" ? 0 : e.role === "accessoire" ? 1 : 2);
  return res.map((e, i) => ({ e, i })).sort((a, b) => rang(a.e) - rang(b.e) || a.i - b.i).map(({ e }) => ({ id: e.id, s: e.s, r: e.r, p: e.p }));
}

/** Charge lourdement le bas du dos (soulevés de terre, good mornings, rowing T-bar, rack pull) : écarté
    quand les lombaires récupèrent, au profit d'une variante plus douce s'il y en a une. */
export const chargeLombaires = (o: string) => EX[o]?.pat2 === "lo" || o === "rkp";

/* Nom de la séance générée. */
export const nomSeance = (m: string[]) =>
  m.length >= 5 ? tr("Full body") : m.map((k) => MUSC.find((g) => g.k === k)!.n).join(" · ");

/* Durée approximative : 40 s d'effort par série (ou la durée demandée), le repos entre les
   séries, une minute de mise en place par exercice, et 5 minutes d'échauffement. */
export function dureeEstimee(ex: ExLibre[]) {
  const sec = (ex.length ? 300 : 0) + ex.reduce((a, e) => {
    const x = EX[e.id], t = x?.ch === "temps" ? (+e.r || 45) * (x.cote ? 2 : 1) : 40;
    return a + e.s * t + Math.max(0, e.s - 1) * secondesDe(e.p) + 60;
  }, 0);
  return Math.max(5, Math.round(sec / 300) * 5);
}

/* Objectif retenu pour la collation d'une séance libre. */
export function objCollation(A: Reponses, s?: SeanceLibre | null) {
  if (!s) return A.objectif ?? 0;
  if (s.colObj != null) return s.colObj;
  const ex = s.ex || [], series = ex.reduce((a, e) => a + (+e.s || 0), 0);
  const leger = series < 10 || ex.every((e) => ["ae", "ft", "lo", "mo", "ca"].includes(EX[e.id]?.pat));
  if (leger) return 3;
  return s.obj ?? A.objectif ?? 0;
}

/* Bibliothèque par zone du corps (Explorer, composeur). */
export function exosDe(p: string, sel: string[]) {
  const dispo = Object.keys(EX).filter((o) => exoFiltre(o, sel));
  return dispo.filter((o) => EX[o].pat === p).concat(dispo.filter((o) => EX[o].pat2 === p));
}
export function exosZone(z: string, sel: string[]) {
  const l: string[] = [];
  (ZPATS[z] || []).forEach((p) => exosDe(p, sel).forEach((o) => { if (!l.includes(o)) l.push(o); }));
  return l;
}
export const patsZone = (z: string, sel: string[]) => (ZPATS[z] || []).filter((p) => exosDe(p, sel).length);
export const sansAccent = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

/* Prescription par défaut quand on ajoute un exercice à la main. */
export const exParDefaut = (o: string): ExLibre => {
  const x = EX[o];
  return { id: o, s: 3, r: x.ch === "temps" ? 45 : x.ch === "dist" ? 250 : 10, p: x.pat === "eg" || x.pat === "fh" ? tr("2 min 30") : tr("90 s") };
};
