/* Mesure anonyme de l'usage et des erreurs (supabase/migrations/20261106090000_mesure.sql).
   Aucune donnée personnelle : un identifiant d'appareil tiré au hasard (repere.appareil), jamais lié
   au compte. Les événements attendent dans une file (repere.mesure.file, gardée hors ligne) et partent
   par lots, au plus toutes les 30 s ou quand l'app passe en arrière-plan. Une erreur de l'app est
   envoyée une fois par session et par message. Rien ne doit jamais faire échouer l'app : tout est
   protégé, et sans Supabase la file reste simplement en attente. */
import { sb } from "@/lib/supabase";
import { sourceNotee } from "@/lib/source";
import { enDemo } from "@/lib/demo";

export const NOMS = ["ouverture", "premiere_serie", "seance_terminee", "seance_arretee", "rubrique_ouverte", "plan_genere", "repas_note", "visite_finie", "seance_programmee", "chemin_choisi", "seance_prete", "ecran", "clic", "compte_cree"] as const;
export type NomEvenement = (typeof NOMS)[number];
export type Evenement = { nom: NomEvenement; jour: string; props?: Record<string, string | number | boolean> };

const CLE_APPAREIL = "repere.appareil", CLE_FILE = "repere.mesure.file";
const MAX_FILE = 200, LOT = 50, DELAI = 30_000;
export const VERSION = (process.env.NEXT_PUBLIC_VERSION || "dev").slice(0, 24);

const jourLocal = (t = Date.now()) => { const d = new Date(t); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; };

/** Identifiant d'appareil : 20 caractères [a-z0-9] tirés au hasard, créé une fois. */
export function appareil(): string {
  try {
    const v = localStorage.getItem(CLE_APPAREIL);
    if (v && /^[a-z0-9]{8,32}$/.test(v)) return v;
    const a = new Uint8Array(20);
    crypto.getRandomValues(a);
    const id = Array.from(a, (x) => "abcdefghijklmnopqrstuvwxyz0123456789"[x % 36]).join("");
    localStorage.setItem(CLE_APPAREIL, id);
    return id;
  } catch { return ""; }
}

/** Propriétés gardées : clés courtes, valeurs simples, 200 caractères au plus en tout. */
export function nettoyerProps(p?: Record<string, unknown>): Evenement["props"] {
  if (!p) return undefined;
  const o: Record<string, string | number | boolean> = {};
  for (const [k, v] of Object.entries(p)) {
    if (!/^[a-z]{1,12}$/.test(k)) continue;
    if (typeof v === "number" && Number.isFinite(v)) o[k] = Math.round(v * 100) / 100;
    else if (typeof v === "boolean") o[k] = v;
    else if (typeof v === "string") o[k] = v.slice(0, 40);
  }
  return Object.keys(o).length && JSON.stringify(o).length <= 200 ? o : undefined;
}

const lireFile = (): Evenement[] => { try { const f = JSON.parse(localStorage.getItem(CLE_FILE) || "[]"); return Array.isArray(f) ? f : []; } catch { return []; } };
const ecrireFile = (f: Evenement[]) => { try { localStorage.setItem(CLE_FILE, JSON.stringify(f.slice(-MAX_FILE))); } catch {} };

/** Ajoute un événement à la file (les plus anciens tombent au-delà de 200). */
/* Événements qui n'ont de sens qu'une fois par appareil (ils étaient parfois notés deux fois) */
const UNE_FOIS: NomEvenement[] = ["visite_finie", "premiere_serie"], CLE_UNE_FOIS = "repere.mesure.une";
function dejaNote(nom: NomEvenement) {
  if (!UNE_FOIS.includes(nom)) return false;
  try {
    const l: string[] = JSON.parse(localStorage.getItem(CLE_UNE_FOIS) || "[]");
    if (l.includes(nom)) return true;
    localStorage.setItem(CLE_UNE_FOIS, JSON.stringify([...l, nom]));
  } catch { /* stockage indisponible : on note quand même */ }
  return false;
}

export function noter(nom: NomEvenement, props?: Record<string, unknown>) {
  if (!NOMS.includes(nom) || enDemo() || dejaNote(nom)) return;
  const e: Evenement = { nom, jour: jourLocal() };
  /* l'heure exacte (secondes) : les événements partent par lots, l'heure d'arrivée au serveur ne suffit pas
     pour retracer un parcours minute par minute */
  const p = nettoyerProps({ ...props, t: Math.round(Date.now() / 1000) });
  if (p) e.props = p;
  ecrireFile([...lireFile(), e]);
  planifier();
}

let minuteur: ReturnType<typeof setTimeout> | null = null, enCours = false;
function planifier() {
  if (minuteur || typeof window === "undefined") return;
  minuteur = setTimeout(() => { minuteur = null; void envoyer(); }, DELAI);
}

/** Envoie la file par lots de 50 ; ce qui n'est pas parti reste pour la prochaine fois. */
export async function envoyer(envoi?: (lot: Evenement[]) => Promise<boolean>) {
  if (enCours) return;
  enCours = true;
  try {
    const id = appareil();
    if (!id) return;
    const pousser = envoi ?? (async (lot: Evenement[]) => {
      const c = await sb();
      if (!c) return false;
      const { error } = await c.rpc("noter_evenements", { p_appareil: id, p_evenements: lot });
      return !error;
    });
    for (let f = lireFile(); f.length; f = lireFile()) {
      const lot = f.slice(0, LOT);
      if (!(await pousser(lot))) return;
      ecrireFile(lireFile().slice(lot.length));
    }
  } catch { /* la mesure ne bloque jamais l'app */ } finally { enCours = false; }
}

/* ---------------- erreurs ---------------- */
const vues = new Set<string>();
/** Signale une erreur, une fois par session et par message. */
export async function signalerErreur(e: unknown, page = typeof location !== "undefined" ? location.pathname : "") {
  try {
    const err = e instanceof Error ? e : new Error(typeof e === "string" ? e : JSON.stringify(e)?.slice(0, 300) || "inconnue");
    const message = `${err.name}: ${err.message}`.slice(0, 300);
    /* bruit sans intérêt : portefeuille crypto injecté par Brave (window.ethereum), robots qui exécutent la page dans Deno (pile « ext:core/… »), extensions du navigateur, coupures réseau, scripts tiers (« Script error. », sans
       aucun détail : le navigateur le masque), et l'animation de
       changement d'écran annulée par le navigateur quand l'app passe en arrière-plan (sans effet visible) */
    if (/^Error: Script error\.?$/.test(message) || /ResizeObserver loop|Failed to fetch|NetworkError|Load failed|chrome-extension:|moz-extension:|\bext:(?:core|deno_)|AbortError|window\.ethereum|Transition was aborted|Transition was skipped|Skipping view transition/i.test(message + (err.stack || ""))) return;
    if (vues.has(message) || vues.size >= 20) return;
    vues.add(message);
    const id = appareil(), c = await sb();
    if (!id || !c) return;
    await c.rpc("noter_erreur", {
      p_appareil: id, p_message: message, p_pile: (err.stack || "").slice(0, 1500), p_page: page.slice(0, 120),
      p_version: VERSION, p_navigateur: (navigator.userAgent || "").slice(0, 160),
    });
  } catch { /* jamais d'erreur en signalant une erreur */ }
}

let branche = false;
/** Branche la mesure : erreurs globales, envoi en arrière-plan, et l'ouverture du jour. */
export function demarrerMesure() {
  if (branche || typeof window === "undefined") return;
  branche = true;
  addEventListener("error", (ev) => void signalerErreur(ev.error ?? ev.message));
  addEventListener("unhandledrejection", (ev) => void signalerErreur(ev.reason));
  noterOuverture();
  suivreEcrans();
  /* après suivreEcrans : l'écran quitté en passant en arrière-plan part dans le même envoi */
  document.addEventListener("visibilitychange", () => { if (document.visibilityState === "hidden") void envoyer(); });
  if (lireFile().length) planifier();
}

/** Une « ouverture » par jour suffit pour les actifs et la rétention ; elle porte la source du
   premier lien (?src=, lib/source.ts) pour compter d'où viennent les visiteurs, même sans compte. */
export function noterOuverture() {
  try {
    const auj = jourLocal(), cle = "repere.mesure.jour";
    if (localStorage.getItem(cle) !== auj) { localStorage.setItem(cle, auj); const src = sourceNotee(); noter("ouverture", { ...(src ? { src } : {}), ...contexte() }); }
  } catch {}
}

/** D'où vient le visiteur et sur quoi il regarde l'app : site d'origine (pas l'adresse complète),
    téléphone ou ordinateur, app installée sur l'écran d'accueil, langue, et première visite. */
export function contexte(): Record<string, string | boolean> {
  const o: Record<string, string | boolean> = {};
  try {
    const r = document.referrer ? new URL(document.referrer).hostname.replace(/^www\./, "") : "";
    if (r && r !== location.hostname) o.ref = r.slice(0, 40);
    const ua = navigator.userAgent || "";
    o.dev = /iPhone|iPod/.test(ua) ? "iphone" : /iPad/.test(ua) ? "ipad" : /Android/.test(ua) ? (/Mobile/.test(ua) ? "android" : "tablette") : "ordinateur";
    o.app = matchMedia("(display-mode: standalone)").matches || (navigator as { standalone?: boolean }).standalone === true;
    o.lang = (navigator.language || "").slice(0, 5);
    const cle = "repere.mesure.vu";
    if (!localStorage.getItem(cle)) { localStorage.setItem(cle, "1"); o.nouveau = true; }
  } catch { /* la mesure ne bloque jamais l'app */ }
  return o;
}

/* ---------------- écrans et clics ----------------
   Chaque écran vu : son adresse (sans les paramètres), le temps passé dessus et jusqu'où on a fait
   défiler (en %), noté quand on le quitte ou que l'app passe en arrière-plan. Une étape d'un écran
   (le formulaire d'inscription dans Bienvenue) peut se déclarer comme un écran à part (ecranVirtuel).
   Chaque clic sur un bouton ou un lien : son libellé (jamais ce qui est saisi), 150 par jour au plus. */
let ecran: { p: string; debut: number; dfl: number } | null = null;
let virtuel: string | null = null;
const cheminCourant = () => (virtuel ?? location.pathname.replace(/\/+$/, "")) || "/";
function profondeur() {
  const h = document.documentElement.scrollHeight - innerHeight;
  return h <= 0 ? 100 : Math.min(100, Math.round(((scrollY + innerHeight) / document.documentElement.scrollHeight) * 100));
}
function fermerEcran() {
  if (!ecran) return;
  const s = Math.round((Date.now() - ecran.debut) / 1000);
  if (s >= 1) noter("ecran", { p: ecran.p, s, dfl: ecran.dfl });
  ecran = null;
}
function ouvrirEcran() {
  if (ecran || document.visibilityState === "hidden") return;
  ecran = { p: cheminCourant(), debut: Date.now(), dfl: profondeur() };
}
function changerEcran() {
  const p = cheminCourant();
  if (ecran?.p === p) return;
  fermerEcran(); ouvrirEcran();
}
/** Une étape d'un écran comptée comme un écran à part (null : retour à l'adresse). */
export function ecranVirtuel(nom: string | null) {
  virtuel = nom;
  if (typeof window !== "undefined" && branche) changerEcran();
}
/** Le libellé d'un élément cliqué : son nom accessible, sinon sa première ligne de texte. */
export function libelleClic(el: Element): string {
  const t = el.getAttribute("aria-label") || (el as HTMLElement).innerText || el.textContent || "";
  return t.split("\n").map((x) => x.trim()).find(Boolean)?.replace(/\s+/g, " ").slice(0, 40) ?? "";
}
const MAX_CLICS = 150, CLE_CLICS = "repere.mesure.clics";
function noterClic(ev: Event) {
  try {
    const el = (ev.target as Element | null)?.closest?.("button, a, [role=button], [role=tab], [role=radio], [role=checkbox], [role=link]");
    if (!el || el.closest("[data-mesure-non]")) return;
    const l = libelleClic(el);
    if (!l) return;
    const auj = jourLocal(), c = JSON.parse(localStorage.getItem(CLE_CLICS) || "{}");
    const n = c.j === auj ? c.n : 0;
    if (n >= MAX_CLICS) return;
    localStorage.setItem(CLE_CLICS, JSON.stringify({ j: auj, n: n + 1 }));
    noter("clic", { p: cheminCourant(), l });
  } catch { /* la mesure ne bloque jamais l'app */ }
}
function suivreEcrans() {
  for (const m of ["pushState", "replaceState"] as const) {
    const avant = history[m].bind(history);
    history[m] = (...a: Parameters<History["pushState"]>) => { const r = avant(...a); setTimeout(changerEcran, 0); return r; };
  }
  addEventListener("popstate", () => setTimeout(changerEcran, 0));
  addEventListener("scroll", () => { if (ecran) ecran.dfl = Math.max(ecran.dfl, profondeur()); }, { passive: true });
  document.addEventListener("visibilitychange", () => { if (document.visibilityState === "hidden") fermerEcran(); else ouvrirEcran(); });
  addEventListener("pagehide", fermerEcran);
  document.addEventListener("click", noterClic, true);
  ouvrirEcran();
}
