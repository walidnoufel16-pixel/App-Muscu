/* Langue de l'app : français (langue source) ou anglais.
   Le texte français sert de clé : tr("Tout effacer") renvoie la traduction
   anglaise si l'app est en anglais, sinon le texte tel quel. Une traduction
   manquante affiche donc le français plutôt qu'un écran cassé (le test
   tests/i18n.test.ts vérifie qu'il n'en manque aucune).
   La langue est lue une fois, au chargement : changer de langue recharge l'app,
   ce qui permet aussi aux constantes de module d'utiliser tr(). */
import EN from "./en.json";

export type Langue = "fr" | "en";
export const LANGUES: { v: Langue; n: string }[] = [{ v: "fr", n: "Français" }, { v: "en", n: "English" }];
const CLE = "repere.langue.v1";
const DICO = EN as Record<string, string>;

/** Langue choisie à la main sur cet appareil, sinon celle du téléphone. */
function initiale(): Langue {
  try {
    const v = localStorage.getItem(CLE);
    if (v === "fr" || v === "en") return v;
  } catch {}
  try { return (navigator.language || "fr").toLowerCase().startsWith("fr") ? "fr" : "en"; } catch { return "fr"; }
}
let courante: Langue = typeof window === "undefined" ? "fr" : initiale();
if (typeof document !== "undefined") document.documentElement.lang = courante;

export const langue = () => courante;
export const choixExplicite = () => { try { return !!localStorage.getItem(CLE); } catch { return false; } };

/** Change la langue et recharge l'app (sans rien perdre : l'état est sur le téléphone et le serveur). */
export function changerLangue(l: Langue, recharger = true) {
  try { localStorage.setItem(CLE, l); } catch {}
  if (l === courante) return;
  courante = l;
  if (recharger && typeof location !== "undefined") location.reload();
}
/** Pour les tests uniquement. */
export const _fixerLangue = (l: Langue) => { courante = l; };

type Vars = Record<string, unknown>;
const remplir = (s: string, v?: Vars) =>
  v ? s.replace(/\{(\w+)\}/g, (m, k) => (k in v ? String(v[k] ?? "") : m)) : s;

/** Traduit un texte français ; {nom} est remplacé par v.nom. */
export function tr(fr: string, v?: Vars): string {
  return remplir(courante === "en" ? (DICO[fr] ?? fr) : fr, v);
}
/** Pluriel ? (en anglais, 0 prend le pluriel : « 0 workouts ».) */
export const pluriel = (n: number) => (courante === "en" ? n !== 1 : n > 1);
/** Pourcentage : « 12 % » en français, « 12% » en anglais. */
export const pct = (n: number | string) => (courante === "en" ? `${n}%` : `${n} %`);
/** Singulier ou pluriel selon n (« 1 séance », « 3 séances » ; en anglais, 0 prend le pluriel). */
export function tp(n: number, un: string, plusieurs: string, v?: Vars): string {
  return tr(pluriel(n) ? plusieurs : un, { n, ...v });
}
/** Rang : « 1er », « 2e » ou « 1st », « 2nd », « 3rd », « 4th ». */
export function rang(n: number): string {
  if (courante === "fr") return n === 1 ? "1er" : `${n}e`;
  const d = n % 10, c = n % 100;
  return n + (c >= 11 && c <= 13 ? "th" : d === 1 ? "st" : d === 2 ? "nd" : d === 3 ? "rd" : "th");
}
/** Locale pour les dates et les nombres. */
export const loc = () => (courante === "en" ? "en-GB" : "fr-FR");
