"use client";

/* Fonctionnalités mises de côté pour l'instant.
   Le programme sur 8 semaines est en pause : l'admin l'ouvre compte par compte
   (migration 20261019090000_acces_programme.sql, fiche admin). La réponse du serveur
   est gardée sur le téléphone pour fonctionner hors ligne, liée au compte.
   `localStorage["repere.programme"] = "1"` rallume l'écran (tests, démonstration) ; le serveur garde le dernier mot. */
import { useEffect } from "react";
import { create } from "zustand";
import { sb } from "@/lib/supabase";
import { useRepere } from "@/lib/store";

const CLE = "repere.programme.acces";
const lire = (): { id?: string; ok: boolean } => { try { return JSON.parse(localStorage.getItem(CLE) || "") || { ok: false }; } catch { return { ok: false }; } };
/* Le forçage n'ouvre que l'écran (tests, démonstration) : la génération du programme, elle, est
   refusée par le serveur aux comptes non autorisés (generer vérifie programme_autorise()). */
const force = () => { try { return localStorage.getItem("repere.programme") === "1"; } catch { return false; } };

export const useAccesProgramme = create<{ id?: string; ok: boolean }>(() => lire());

/** Le compte connecté peut-il utiliser le programme sur 8 semaines ? */
export function programmeActif() {
  const a = useAccesProgramme.getState(), id = useRepere.getState().user?.id;
  return force() || (a.ok && !!id && a.id === id);
}

/** Même chose, et l'écran se met à jour quand la réponse du serveur arrive. */
export function useProgrammeActif() {
  const a = useAccesProgramme(), id = useRepere((s) => s.user?.id);
  return force() || (a.ok && !!id && a.id === id);
}

/** Demande au serveur, à chaque changement de compte, si le programme est ouvert pour lui. */
export function useVerifierAccesProgramme() {
  const id = useRepere((s) => s.user?.id);
  useEffect(() => {
    if (!id) return;
    let vivant = true;
    (async () => {
      const c = await sb();
      if (!c) return;
      const { data, error } = await c.rpc("programme_autorise");
      if (error || !vivant) return;
      const v = { id, ok: data === true };
      useAccesProgramme.setState(v);
      try { localStorage.setItem(CLE, JSON.stringify(v)); } catch {}
    })();
    return () => { vivant = false; };
  }, [id]);
}

/* ---------- mode Guidé (docs/produit/mode-suivi) ----------
   Les nouveaux comptes n'ont que le mode Suivi (A.suiviSeul, posé à l'arrivée) ; l'admin ouvre le mode
   Guidé compte par compte (migration 20261125090000_acces_guide.sql). Les admins l'ont toujours.
   Les comptes d'avant ce verrou (sans A.suiviSeul) gardent le choix. Ce n'est pas une question de coût
   (la séance guidée se calcule sur le téléphone) : c'est pour garder l'app simple.
   `localStorage["repere.guide"] = "1"` ouvre le mode Guidé sur l'appareil (tests, démonstration). */
const CLE_GUIDE = "repere.guide.acces";
const lireGuide = (): { id?: string; ok: boolean } => { try { return JSON.parse(localStorage.getItem(CLE_GUIDE) || "") || { ok: false }; } catch { return { ok: false }; } };
const forceGuide = () => { try { return localStorage.getItem("repere.guide") === "1"; } catch { return false; } };

export const useAccesGuide = create<{ id?: string; ok: boolean }>(() => lireGuide());

/** Le compte connecté a-t-il le mode Guidé ouvert par l'admin (ou est-il admin) ? */
export function guideAutorise() {
  const a = useAccesGuide.getState(), id = useRepere.getState().user?.id;
  return forceGuide() || (a.ok && !!id && a.id === id);
}
export function useGuideAutorise() {
  const a = useAccesGuide(), id = useRepere((s) => s.user?.id);
  return forceGuide() || (a.ok && !!id && a.id === id);
}
/** Compte limité au mode Suivi : arrivé après le verrou, et mode Guidé pas ouvert pour lui. */
export function useSuiviSeul() {
  const seul = useRepere((s) => !!s.etat.A.suiviSeul);
  return useGuideAutorise() ? false : seul;
}

/** Demande au serveur si le mode Guidé est ouvert pour le compte ; fermé : le compte repasse en Suivi. */
export function useVerifierAccesGuide() {
  const id = useRepere((s) => s.user?.id);
  useEffect(() => {
    if (!id) return;
    let vivant = true;
    (async () => {
      const c = await sb();
      if (!c) return;
      const { data, error } = await c.rpc("guide_autorise");
      if (error || !vivant) return;
      const v = { id, ok: data === true };
      useAccesGuide.setState(v);
      try { localStorage.setItem(CLE_GUIDE, JSON.stringify(v)); } catch {}
      const E = useRepere.getState().etat;
      if (!v.ok && !forceGuide() && E.A.suiviSeul && E.A.mode !== "suivi") useRepere.getState().muter((e) => { e.A.mode = "suivi"; });
    })();
    return () => { vivant = false; };
  }, [id]);
}
