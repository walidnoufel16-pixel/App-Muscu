/* Rôle d'un exercice : Base, Complément, Isolation ou Gainage (audit coach du 13 novembre 2026).
   Une seule source pour « polyarticulaire » (le générateur et les avis de séance l'utilisaient
   chacun à sa façon), et un rôle « naturel » par exercice pour les badges et le gabarit de séance.
   Logique pure. */
import { EX } from "@/lib/data/exercices";
import { PAT2MUSC } from "@/lib/data/referentiels";
import { estSoin } from "@/lib/data/soin";
import type { ExLibre, RoleEx } from "./types";

/* Le second schéma ne suffit pas toujours à dire si un mouvement est polyarticulaire :
   corrections relevées par le coach sur les vraies séances générées. */
const POLY_OUI = new Set([
  "sdts", // soulevé de terre sumo : le second schéma (adducteurs) le classait en isolation
  "sql", // squat pieds larges : idem
  "rwm", // rowing à la machine : pas de second schéma renseigné
  "tbarp", // rowing T-bar buste appuyé : idem
  "rkp", // soulevé de terre partiel
]);
const POLY_NON = new Set([
  "scap", "elf", // élévations en Y, élévations frontales : une seule articulation qui travaille
  "scappu", // tractions scapulaires : mouvement d'omoplates
  "trxy", "trxt", // Y-raise et T-raise TRX
  "curlpc", // curl au poids du corps
  "pull", // pull-over
]);

/** Plusieurs articulations et plusieurs muscles qui comptent (pas les avant-bras d'un curl,
    ni les trapèzes, adducteurs ou mollets en second), hors gainage. */
export function estPoly(id: string): boolean {
  if (POLY_OUI.has(id)) return true;
  if (POLY_NON.has(id)) return false;
  const x = EX[id];
  return !!x?.pat2 && !["ae", "ft", "lo"].includes(x.pat) && !["avb", "tra", "add", "mol"].includes(PAT2MUSC[x.pat2]);
}

/* Explosifs (à faire frais, jamais proposés dans une case) et exercices portés ou de traîneau
   (en fin de séance) : pas de badge. */
export const EXPLOSIFS = new Set(["pp", "pompp", "jsq", "ktj", "fsaut", "bondl", "grenou", "sautl", "burpsl", "kbsw", "kbthr"]);
export const PORTES = new Set(["ferm", "trpush", "trpull"]);
/* Exercices complets ou de cardio rangés dans le tronc : pas de badge non plus. */
const SANS_ROLE = new Set(["kbtgu", "kbwm", "mclimb", "trxmc", "corde"]);

/* Les exercices qu'un coach met en 2e case d'un grand muscle (sous un autre angle) et jamais en
   1re : fentes, développé incliné, rowings, montées sur banc… (mêmes listes que le générateur). */
const COMPLEMENTS = new Set([
  "fe", "fb", "bul", "ferh", "bulsm", "mont", "montb", "fepc",
  "dci", "dhi", "dcism", "chpi", "pompe",
  "rw", "rh", "tps", "rw2", "rwapp", "rwm", "tbarp", "seal", "tps1", "landr", "rwsu", "rwhm", "tbar", "kbrw", "kbrw2",
]);

/** Rôle naturel d'un exercice ("b" base, "c" complément, "i" isolation, "g" gainage), ou
    undefined (cardio, soin, explosif, porté). Avec `muscle` : relatif à ce muscle ; un exercice
    de base qui ne le travaille qu'en second y compte comme complément (tractions supination
    pour les biceps, développé serré pour les pectoraux…). */
export function roleDe(id: string, muscle?: string): RoleEx | undefined {
  const x = EX[id];
  if (!x || estSoin(id) || x.pat === "ca" || x.ch === "dist" || EXPLOSIFS.has(id) || PORTES.has(id) || SANS_ROLE.has(id)) return undefined;
  if (["ae", "ft", "lo"].includes(x.pat) && !POLY_OUI.has(id)) return "g";
  if (!estPoly(id)) return "i";
  const base: RoleEx = COMPLEMENTS.has(id) ? "c" : "b";
  if (muscle && PAT2MUSC[x.pat] !== muscle && x.pat2 && PAT2MUSC[x.pat2] === muscle) return "c";
  return base;
}

/** Une case du gabarit accepte-t-elle cet exercice ? Base ← Base ou Complément ;
    Complément ← Complément ou Base ; Isolation ← Isolation ; Gainage ← Gainage. */
export function convientA(caseRole: RoleEx, id: string, muscle?: string) {
  const r = roleDe(id, muscle);
  if (!r) return false;
  if (caseRole === "b" || caseRole === "c") return r === "b" || r === "c";
  return r === caseRole;
}

/* Rang dans la musculation : explosifs (à faire frais), Base, Complément, Isolation, Gainage, portés. */
function rang(x: ExLibre) {
  if (EXPLOSIFS.has(x.id)) return 0;
  if (PORTES.has(x.id)) return 5;
  const r = x.ro ?? roleDe(x.id);
  return r === "b" ? 1 : r === "c" ? 2 : r === "g" ? 4 : 3;
}

/** Place un exercice ajouté à la main dans la musculation : après ceux de même rang ou d'avant
    (explosifs, Base, Complément, Isolation, Gainage, portés). L'utilisateur peut ensuite le déplacer.
    Soin et cardio vont à la fin (le rangement par parties les remet à leur place). */
export function placer(ex: ExLibre[], e: ExLibre) {
  const muscu = (x: ExLibre) => !!EX[x.id] && !estSoin(x.id) && EX[x.id].pat !== "ca";
  if (!muscu(e)) { ex.push(e); return; }
  const r = rang(e);
  const apres = ex.findLastIndex((x) => muscu(x) && rang(x) <= r);
  const k = apres >= 0 ? apres + 1 : ex.findIndex(muscu);
  if (k < 0) ex.push(e); else ex.splice(k, 0, e);
}
