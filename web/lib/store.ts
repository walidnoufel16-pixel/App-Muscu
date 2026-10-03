"use client";

/* État global de Repère.
   - Format IDENTIQUE à l'ancienne app : même clé localStorage, même ligne
     dans la table Supabase `etats`. Les données existantes s'ouvrent telles
     quelles, et l'ancienne version relirait celles-ci.
   - Toute modification passe par `muter`, qui produit un nouvel état (immer),
     l'enregistre localement et le pousse vers Supabase 1,5 s plus tard. */

import { create } from "zustand";
import { produce } from "immer";
import type { User } from "@supabase/supabase-js";
import { EX } from "@/lib/data/exercices";
import { sb, SB_KEY, SB_URL } from "@/lib/supabase";
import type { Etat, Reponses, SeanceLibre } from "@/lib/logic/types";

export const SKEY = "palier.state.v1";
export const PKEY = "palier.pseudo.v1";

const vide = (): Etat => ({ A: {}, LOG: {}, SWAP: {}, SWAPP: {}, PLAN: null, SEANCES: [], wk: 0, day: 0, FINI: false });

/* ---------- nettoyage ---------- */
export const sansBalise = (t: unknown) => String(t ?? "").replace(/[<>]/g, "");
export function nettoieArbre<T>(o: T): T {
  if (typeof o === "string") return sansBalise(o) as T;
  if (Array.isArray(o)) return o.map(nettoieArbre) as T;
  if (o && typeof o === "object") {
    const r: Record<string, unknown> = {};
    for (const k in o) r[k] = nettoieArbre((o as Record<string, unknown>)[k]);
    return r as T;
  }
  return o;
}
export const borne = (v: unknown, min: number, max: number, def: number) => {
  const n = Math.round(+(v as number));
  return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : def;
};

/* Un état d'une version plus ancienne peut contenir des champs qui ont changé de forme. */
export function normaliser(A: Reponses): Reponses {
  const tab = (v: unknown) => (Array.isArray(v) ? v : typeof v === "number" ? [v] : []);
  const obj = (v: unknown) => (v && typeof v === "object" && !Array.isArray(v) ? v : {});
  if (A.sport !== undefined && !Array.isArray(A.sport)) A.sport = tab(A.sport);
  if (A.sportFreq !== undefined && (typeof A.sportFreq !== "object" || Array.isArray(A.sportFreq))) {
    const n = typeof A.sportFreq === "number" ? (A.sportFreq as number) : 0;
    const prem = (A.sport || []).filter((i) => i > 0)[0];
    A.sportFreq = prem !== undefined ? { [prem]: n } : {};
  }
  (["blessure", "prio", "exclus", "acc"] as const).forEach((k) => { if (A[k] !== undefined) (A as Record<string, unknown>)[k] = tab(A[k]); });
  (["prefs", "charges", "profil", "sportFreq"] as const).forEach((k) => { if (A[k] !== undefined) (A as Record<string, unknown>)[k] = obj(A[k]); });
  Object.keys(A.prefs || {}).forEach((g) => { if (!Array.isArray(A.prefs![g])) A.prefs![g] = []; });
  return A;
}

type Stocke = Partial<Etat> & { ts?: number };
function lireLocal(): Stocke | null {
  try { return JSON.parse(localStorage.getItem(SKEY) || "null"); } catch { return null; }
}
function versEtat(s: Stocke | null): Etat {
  const e = vide();
  if (!s) return e;
  e.A = normaliser({ ...(s.A || {}) });
  e.LOG = { ...(s.LOG || {}) };
  e.SWAP = { ...(s.SWAP || {}) };
  e.SWAPP = { ...(s.SWAPP || {}) };
  e.PLAN = nettoieArbre(s.PLAN) || null;
  e.SEANCES = nettoieArbre(s.SEANCES) || [];
  e.wk = s.wk || 0;
  e.day = s.day || 0;
  e.FINI = !!s.FINI;
  return e;
}
const instantane = (e: Etat) => ({ ...e, ts: Date.now() });

/* ---------- store ---------- */
type Store = {
  pret: boolean;
  etat: Etat;
  user: User | null;
  pseudo: string;
  sync: boolean | null; // vert : synchronisé · gris : hors ligne · null : inconnu
  session: "inconnue" | "ouverte" | "aucune";
  muter: (fn: (e: Etat) => void) => void;
  demarrer: () => Promise<void>;
  apresConnexion: (forcerDistant?: boolean) => Promise<string | null>;
  creerCompte: (pseudo: string, mail?: string) => Promise<{ ok: boolean; message?: string }>;
  pousser: () => Promise<void>;
  setUser: (u: User | null) => void;
  toutEffacer: () => Promise<void>;
  changerDeCompte: () => Promise<void>;
  partager: (i: number) => Promise<{ code?: string; erreur?: string }>;
  importer: (code: string) => Promise<{ nom?: string; absents?: number; erreur?: string }>;
};

let minuteurPush: ReturnType<typeof setTimeout> | null = null;

export const useRepere = create<Store>((set, get) => ({
  pret: false,
  etat: vide(),
  user: null,
  pseudo: "",
  sync: null,
  session: "inconnue",

  muter(fn) {
    const etat = produce(get().etat, fn);
    set({ etat });
    try { localStorage.setItem(SKEY, JSON.stringify(instantane(etat))); } catch {}
    if (get().user) {
      if (minuteurPush) clearTimeout(minuteurPush);
      minuteurPush = setTimeout(() => get().pousser(), 1500);
    }
  },

  async pousser() {
    const c = await sb(), u = get().user;
    if (!c || !u) return;
    try {
      const { error } = await c.from("etats").upsert({ user_id: u.id, pseudo: get().pseudo, etat: instantane(get().etat), maj: new Date().toISOString() });
      set({ sync: !error });
    } catch {
      set({ sync: false });
    }
  },

  setUser(u) { set({ user: u, session: u ? "ouverte" : "aucune" }); },

  /* L'écran s'affiche tout de suite avec l'état local ; la session Supabase
     (client chargé en différé) arrive ensuite et peut le remplacer s'il est
     plus récent sur le serveur. */
  async demarrer() {
    let pseudo = "";
    try { pseudo = sansBalise(localStorage.getItem(PKEY)) || ""; } catch {}
    set({ etat: versEtat(lireLocal()), pret: true, pseudo });
    const c = await sb();
    if (!c) { set({ sync: false, session: "aucune" }); return; }
    try {
      const { data } = await c.auth.getSession();
      if (data?.session) {
        set({ user: data.session.user, pseudo: pseudo || "toi", session: "ouverte" });
        await get().apresConnexion();
        return;
      }
    } catch {}
    set({ session: "aucune" });
  },

  /* forcerDistant : à la récupération sur un nouvel appareil, le compte a raison. */
  async apresConnexion(forcerDistant) {
    const c = await sb(), u = get().user;
    let distant: Stocke | null = null, info: string | null = null;
    if (c && u) {
      try {
        const { data } = await c.from("etats").select("etat,pseudo").eq("user_id", u.id).maybeSingle();
        if (data) { distant = data.etat; if (data.pseudo) set({ pseudo: sansBalise(data.pseudo) }); }
      } catch {}
    }
    const local = lireLocal();
    const choisi = forcerDistant ? distant || local
      : distant && local ? ((distant.ts || 0) >= (local.ts || 0) ? distant : local) : distant || local;
    set({ etat: versEtat(choisi), pret: true, sync: true });
    if (forcerDistant && !distant)
      info = "Compte ouvert, mais il ne contenait aucune sauvegarde. Ce qui était sur cet appareil a été conservé et lui est maintenant rattaché.";
    try { if (get().pseudo) localStorage.setItem(PKEY, get().pseudo); } catch {}
    if (!distant || (local && (local.ts || 0) > (distant.ts || 0))) {
      try { localStorage.setItem(SKEY, JSON.stringify(instantane(get().etat))); } catch {}
      await get().pousser();
    }
    return info;
  },

  async creerCompte(pseudo, mail) {
    const c = await sb();
    const p = sansBalise(pseudo.trim());
    set({ pseudo: p });
    try { localStorage.setItem(PKEY, p); } catch {}
    if (!c) { set({ etat: versEtat(lireLocal()), pret: true }); return { ok: true, message: "Mode local : tes données restent sur ce téléphone." }; }
    const { data, error } = await c.auth.signInAnonymously();
    if (error || !data.user) return { ok: false, message: error?.message };
    set({ user: data.user, session: "ouverte" });
    let message: string | undefined;
    if (mail) {
      const r = await c.auth.updateUser({ email: mail });
      if (r.error) message = "Ton compte est créé, mais l'adresse n'a pas pu y être rattachée. Tu peux réessayer depuis l'onglet Compte.";
      else set({ user: r.data.user ? { ...r.data.user, new_email: r.data.user.new_email || mail } : get().user });
    }
    await get().apresConnexion();
    return { ok: true, message };
  },

  /* Tout effacer : ici comme sur le serveur, compte compris. */
  async toutEffacer() {
    const c = await sb(), u = get().user;
    try {
      if (c && u) {
        await c.from("etats").delete().eq("user_id", u.id);
        const { data } = await c.auth.getSession();
        if (data.session)
          await fetch(SB_URL.replace(/\/$/, "") + "/functions/v1/oublier", {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: "Bearer " + data.session.access_token, apikey: SB_KEY },
            body: "{}",
          });
        await c.auth.signOut();
      }
    } catch {}
    try { localStorage.removeItem(SKEY); localStorage.removeItem(PKEY); } catch {}
    // Rechargement complet voulu : repartir d'un état vierge.
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination
    location.href = "/";
  },

  /* Changer de compte : dernière synchronisation, déconnexion, puis le
     téléphone est vidé. Les données restent sur le serveur, rattachées au
     compte qu'on quitte ; elles reviennent en s'y reconnectant. */
  async changerDeCompte() {
    if (minuteurPush) { clearTimeout(minuteurPush); minuteurPush = null; }
    const c = await sb();
    if (get().user) {
      await get().pousser();
      try { await c?.auth.signOut(); } catch {}
    }
    try { localStorage.removeItem(SKEY); localStorage.removeItem(PKEY); } catch {}
    set({ etat: vide(), user: null, pseudo: "", sync: null, session: "aucune" });
  },

  /* ---------- partage d'une séance ---------- */
  async partager(i) {
    const c = await sb(), u = get().user, s = get().etat.SEANCES[i];
    if (!s) return { erreur: "Séance introuvable." };
    if (s.code) return { code: s.code };
    if (!c || !u) return { erreur: "Le partage demande un compte." };
    const ALPHA = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let code: string | null = null, err: string | undefined;
    for (let essai = 0; essai < 4 && !code; essai++) {
      const x = Array.from({ length: 5 }, () => ALPHA[Math.floor(Math.random() * ALPHA.length)]).join("");
      const { error } = await c.from("seances_partagees").insert({
        code: x, nom: s.nom.slice(0, 60), auteur: u.id,
        ex: s.ex.map((e) => ({ id: e.id, s: e.s, r: e.r, p: e.p })), // jamais les charges
      });
      if (!error) code = x; else err = error.message;
    }
    if (!code) return { erreur: "Partage impossible : " + (err || "réessaie") };
    get().muter((e) => { e.SEANCES[i].code = code!; });
    return { code };
  },

  async importer(codeBrut) {
    const code = (codeBrut || "").trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
    if (code.length < 4) return { erreur: "Le code fait cinq caractères." };
    const c = await sb();
    if (!c) return { erreur: "L'import demande une connexion." };
    try {
      const { data, error } = await c.rpc("lire_seance", { p_code: code }).maybeSingle<{ nom: string; ex: unknown }>();
      if (error) throw error;
      if (!data) return { erreur: "Aucune séance ne correspond au code " + code + "." };
      const ex = (Array.isArray(data.ex) ? data.ex : [])
        .filter((e: { id?: string }) => e && e.id && EX[e.id]).slice(0, 12)
        .map((e: { id: string; s: unknown; r: unknown; p: unknown }) => ({
          id: e.id, s: borne(e.s, 1, 10, 3), r: borne(e.r, 1, 600, 10), p: sansBalise(e.p).slice(0, 12) || "90 s",
        }));
      if (!ex.length) return { erreur: "Cette séance ne contient aucun exercice reconnu." };
      const nom = sansBalise(data.nom).slice(0, 60) || "Séance";
      get().muter((e) => { e.SEANCES.push({ nom: nom + " (reçue)", ex } as SeanceLibre); });
      return { nom, absents: 0 };
    } catch (e) {
      return { erreur: "Import impossible : " + (e as Error).message };
    }
  },
}));
