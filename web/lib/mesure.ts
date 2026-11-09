/* Mesure anonyme de l'usage et des erreurs (supabase/migrations/20261106090000_mesure.sql).
   Aucune donnée personnelle : un identifiant d'appareil tiré au hasard (repere.appareil), jamais lié
   au compte. Les événements attendent dans une file (repere.mesure.file, gardée hors ligne) et partent
   par lots, au plus toutes les 30 s ou quand l'app passe en arrière-plan. Une erreur de l'app est
   envoyée une fois par session et par message. Rien ne doit jamais faire échouer l'app : tout est
   protégé, et sans Supabase la file reste simplement en attente. */
import { sb } from "@/lib/supabase";
import { sourceNotee } from "@/lib/source";

export const NOMS = ["ouverture", "premiere_serie", "seance_terminee", "seance_arretee", "rubrique_ouverte", "plan_genere", "repas_note", "visite_finie"] as const;
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
export function noter(nom: NomEvenement, props?: Record<string, unknown>) {
  if (!NOMS.includes(nom)) return;
  const e: Evenement = { nom, jour: jourLocal() };
  const p = nettoyerProps(props);
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
    /* bruit sans intérêt : extensions du navigateur, coupures réseau, scripts tiers, et l'animation de
       changement d'écran annulée par le navigateur quand l'app passe en arrière-plan (sans effet visible) */
    if (/ResizeObserver loop|Failed to fetch|NetworkError|Load failed|chrome-extension:|moz-extension:|AbortError|Transition was aborted|Transition was skipped|Skipping view transition/i.test(message + (err.stack || ""))) return;
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
  document.addEventListener("visibilitychange", () => { if (document.visibilityState === "hidden") void envoyer(); });
  noterOuverture();
  if (lireFile().length) planifier();
}

/** Une « ouverture » par jour suffit pour les actifs et la rétention ; elle porte la source du
   premier lien (?src=, lib/source.ts) pour compter d'où viennent les visiteurs, même sans compte. */
export function noterOuverture() {
  try {
    const auj = jourLocal(), cle = "repere.mesure.jour";
    if (localStorage.getItem(cle) !== auj) { localStorage.setItem(cle, auj); const src = sourceNotee(); noter("ouverture", src ? { src } : undefined); }
  } catch {}
}
