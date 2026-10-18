"use client";

/* Fonctionnalités mises de côté pour l'instant.
   Le programme sur 8 semaines est en pause : l'admin l'ouvre compte par compte
   (migration 20261019090000_acces_programme.sql, fiche admin). La réponse du serveur
   est gardée sur le téléphone pour fonctionner hors ligne, liée au compte.
   `localStorage["repere.programme"] = "1"` le rallume aussi (tests, démonstration). */
import { useEffect } from "react";
import { create } from "zustand";
import { sb } from "@/lib/supabase";
import { useRepere } from "@/lib/store";

const CLE = "repere.programme.acces";
const lire = (): { id?: string; ok: boolean } => { try { return JSON.parse(localStorage.getItem(CLE) || "") || { ok: false }; } catch { return { ok: false }; } };
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
