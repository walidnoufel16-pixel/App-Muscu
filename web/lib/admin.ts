"use client";

/* Accès admin côté client : appels aux fonctions serveur (migration
   20261006090000_admin.sql). Le serveur refuse tout compte absent de la table
   admins ; rien n'est gardé sur le téléphone (ni localStorage, ni cache). */
import { tr } from "@/lib/i18n";
import { useEffect, useState } from "react";
import { sb } from "@/lib/supabase";
import { appareil } from "@/lib/mesure";
import { nettoieArbre, useRepere, versEtat } from "@/lib/store";
import type { CompteAdmin, FicheAdmin, StatsAdmin } from "@/lib/logic/admin";
import type { Analyse } from "@/lib/logic/erreurs";
import type { EvenementVisiteur, ResumeVisiteur } from "@/lib/logic/visiteurs";

async function appel<T>(nom: string, args?: Record<string, unknown>): Promise<T> {
  const c = await sb();
  if (!c) throw new Error(tr("Pas de connexion au serveur."));
  const { data, error } = await c.rpc(nom, args);
  if (error) throw new Error(error.message);
  return data as T;
}

export const estAdmin = () => appel<boolean>("est_admin").catch(() => false);
/* Les textes saisis par les utilisateurs sont nettoyés comme partout ailleurs dans l'app. */
/* versEtat remet chaque état au format courant et reconstruit l'historique des
   comptes anciens depuis leur journal (LOG), comme l'app le fait à l'ouverture. */
export const utilisateurs = () => appel<CompteAdmin[]>("admin_utilisateurs")
  .then((l) => nettoieArbre(l || []).map((c) => ({ ...c, etat: versEtat(c.etat) })));
export const statsAdmin = () => appel<StatsAdmin>("admin_stats").then(nettoieArbre);
/* Mesure anonyme (migration 20261106090000_mesure.sql) : agrégats seulement. */
export type MesureAdmin = {
  actifs: { j1: number; j7: number; j30: number };
  cohortes: { semaine: string; nouveaux: number; actives: number; j7: number | null; j30: number | null }[];
  seances: { semaine: string; seances: number; appareils: number; arretees: number }[];
  rubriques: { rubrique: string; ouvertures: number; appareils: number }[];
  /* migration 20261106150000 : absent tant qu'elle n'est pas appliquée */
  sources?: { source: string; appareils: number; actives: number }[];
  actions: Record<string, number>;
  erreurs: { message: string; page: string; version: string; navigateur: string; pile: string; n: number; jours: number; dernier: string }[];
};
export const mesureAdmin = () => appel<MesureAdmin>("admin_mesure").then(nettoieArbre);
/* Admin en 3 onglets (migration 20261118140000_admin_vue.sql) */
export type VueAdmin = {
  visiteurs: number; visiteurs7: number; visite: number; erreurs: number;
  sources: { source: string; n: number }[]; rubriques: { rubrique: string; appareils: number }[];
};
export const vueAdmin = (jours: number, avecMoi: boolean) => appel<VueAdmin>("admin_vue", { p_jours: jours, p_avec_moi: avecMoi }).then(nettoieArbre);
/* Entonnoir des nouveaux visiteurs (admin_parcours, migration 20261120230000_parcours_accueil.sql) */
export type EntonnoirAdmin = {
  etapes: { ouverture: number; visite?: number; chemin?: number; prete?: number; agit?: number; seance: number; deux: number };
  sources: { source: string; n: number }[];
  chemins?: { chemin: string; n: number }[];
};
export const entonnoirAdmin = (jours: number, avecMoi: boolean, src: string | null, chemin: string | null = null) =>
  appel<EntonnoirAdmin>("admin_parcours", { p_jours: jours, p_avec_moi: avecMoi, p_src: src, ...(chemin ? { p_chemin: chemin } : {}) }).then(nettoieArbre);
/* Admin › Visiteurs : un résumé par appareil, et le parcours complet d'un appareil
   (migration 20261127180000_suivi_visiteurs.sql) */
export const visiteursAdmin = (jours: number, avecMoi: boolean) =>
  appel<ResumeVisiteur[]>("admin_visiteurs", { p_jours: jours, p_avec_moi: avecMoi }).then((l) => nettoieArbre(l || []));
export const parcoursVisiteur = (appareilId: string) =>
  appel<EvenementVisiteur[]>("admin_visiteur", { p_appareil: appareilId }).then((l) => nettoieArbre(l || []));
/** Comptes écartés des chiffres (l'admin, ses comptes de test) ; vide tant que la migration n'est pas passée. */
export const comptesExclus = () => appel<string[]>("admin_comptes_exclus").then((l) => l || []).catch(() => [] as string[]);
export const compteTest = (id: string, test: boolean) => appel<void>("admin_compte_test", { p_user: id, p_test: test });
/* L'appareil de l'admin est écarté des chiffres anonymes, une fois par appareil. */
const CLE_EXCLU = "repere.admin.exclu";
async function exclureCetAppareil() {
  try {
    const a = appareil();
    if (!a || localStorage.getItem(CLE_EXCLU) === a) return;
    await appel("admin_exclure_appareil", { p_appareil: a });
    localStorage.setItem(CLE_EXCLU, a);
  } catch { /* la migration n'est peut-être pas encore passée : on réessaiera */ }
}
/* Erreurs analysées par l'admin (migration 20261118160000_erreurs_analyses.sql) ; vide sans elle */
export const analysesErreurs = () => appel<Analyse[]>("admin_analyses_erreurs").then((l) => nettoieArbre(l || [])).catch(() => [] as Analyse[]);
/** Marque une erreur comme analysée (note), ou retire la marque (note null). */
export const analyserErreur = (message: string, note: string | null) => appel<void>("admin_analyser_erreur", { p_message: message, p_note: note });
export const fiche = (id: string) => appel<FicheAdmin | null>("admin_etat", { p_user: id }).then(nettoieArbre);

/** Ouvre ou ferme le programme sur 8 semaines pour un compte (noté au journal admin). */
export const accesProgramme = (id: string, acces: boolean) => appel<boolean>("admin_acces_programme", { p_user: id, p_acces: acces });

/** Mode Guidé (migration 20261125090000_acces_guide.sql) : les comptes ouverts, et l'interrupteur. */
export const comptesGuide = () => appel<string[]>("admin_comptes_guide").then((l) => l || []);
export const accesGuide = (id: string, acces: boolean) => appel<boolean>("admin_acces_guide", { p_user: id, p_acces: acces });

/** null tant qu'on ne sait pas, puis vrai ou faux. Revérifié à chaque changement de compte. */
export function useEstAdmin() {
  /* On attend que la session soit restaurée : au rechargement d'une page admin,
     l'état local est prêt avant elle, et le compte paraîtrait non connecté. */
  const id = useRepere((s) => s.user?.id), session = useRepere((s) => s.session);
  const [ok, setOk] = useState<{ id?: string; v: boolean } | null>(null);
  useEffect(() => {
    if (!id) return;
    let vivant = true;
    estAdmin().then((v) => { if (vivant) setOk({ id, v }); if (v) void exclureCetAppareil(); });
    return () => { vivant = false; };
  }, [id]);
  if (session === "inconnue") return null;
  if (!id) return false;
  return ok && ok.id === id ? ok.v : null;
}

/** Supprime un compte (fonction Edge « supprimer » : vérifiée côté serveur, notée au journal). */
export async function supprimer(id: string): Promise<void> {
  const c = await sb();
  if (!c) throw new Error(tr("Pas de connexion au serveur."));
  const { data, error } = await c.functions.invoke("supprimer", { body: { user: id } });
  if (error) {
    const corps = await (error as { context?: Response }).context?.json?.().catch(() => null);
    throw new Error(corps?.erreur || error.message);
  }
  if (!data?.ok) throw new Error(data?.erreur || tr("Suppression impossible."));
}
