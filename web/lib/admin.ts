"use client";

/* Accès admin côté client : appels aux fonctions serveur (migration
   20261006090000_admin.sql). Le serveur refuse tout compte absent de la table
   admins ; rien n'est gardé sur le téléphone (ni localStorage, ni cache). */
import { useEffect, useState } from "react";
import { sb } from "@/lib/supabase";
import { nettoieArbre, useRepere } from "@/lib/store";
import type { CompteAdmin, FicheAdmin, StatsAdmin } from "@/lib/logic/admin";

async function appel<T>(nom: string, args?: Record<string, unknown>): Promise<T> {
  const c = await sb();
  if (!c) throw new Error("Pas de connexion au serveur.");
  const { data, error } = await c.rpc(nom, args);
  if (error) throw new Error(error.message);
  return data as T;
}

export const estAdmin = () => appel<boolean>("est_admin").catch(() => false);
/* Les textes saisis par les utilisateurs sont nettoyés comme partout ailleurs dans l'app. */
export const utilisateurs = () => appel<CompteAdmin[]>("admin_utilisateurs").then((l) => nettoieArbre(l || []));
export const statsAdmin = () => appel<StatsAdmin>("admin_stats").then(nettoieArbre);
export const fiche = (id: string) => appel<FicheAdmin | null>("admin_etat", { p_user: id }).then(nettoieArbre);

/** null tant qu'on ne sait pas, puis vrai ou faux. Revérifié à chaque changement de compte. */
export function useEstAdmin() {
  const id = useRepere((s) => s.user?.id), pret = useRepere((s) => s.pret);
  const [ok, setOk] = useState<{ id?: string; v: boolean } | null>(null);
  useEffect(() => {
    if (!id) return;
    let vivant = true;
    estAdmin().then((v) => vivant && setOk({ id, v }));
    return () => { vivant = false; };
  }, [id]);
  if (!pret) return null;
  if (!id) return false;
  return ok && ok.id === id ? ok.v : null;
}
