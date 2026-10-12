"use client";

/* Appel de la fonction Edge `generer` (inchangée). Le réseau mobile lâche
   souvent pendant la génération : le serveur met le plan en cache avant de
   répondre, donc les tentatives suivantes se contentent de le réclamer. */
import { tr } from "@/lib/i18n";
import { sb, SB_KEY, SB_URL } from "@/lib/supabase";
import { nettoieArbre } from "@/lib/store";
import { payload } from "@/lib/logic/questionnaire";
import type { PlanIA, Reponses } from "@/lib/logic/types";

export async function genererCycle(A: Reponses, forcer: boolean, info: (t: string) => void): Promise<{ plan: PlanIA | null; erreur?: string; avertissement?: string }> {
  try {
    const c = await sb();
    if (!c) throw new Error(tr("compte non connecté"));
    const { data } = await c.auth.getSession();
    if (!data.session) throw new Error(tr("session expirée, relance l'app"));
    const url = SB_URL.replace(/\/$/, "") + "/functions/v1/generer";
    const corps: Record<string, unknown> = payload(A, forcer);
    let r: Response | null = null, derniere: unknown = null;
    for (let essai = 0; essai < 4; essai++) {
      try {
        const ac = new AbortController();
        const minuteur = setTimeout(() => ac.abort(), essai === 0 ? 150000 : 20000);
        if (essai > 0) corps.cacheSeul = true;
        const rep = await fetch(url, {
          method: "POST", signal: ac.signal,
          headers: { "Content-Type": "application/json", Authorization: "Bearer " + data.session.access_token, apikey: SB_KEY },
          body: JSON.stringify(corps),
        });
        clearTimeout(minuteur);
        if (essai > 0 && rep.status === 404) { info(tr("Le serveur termine, on récupère le résultat…")); await new Promise((z) => setTimeout(z, 8000)); continue; }
        r = rep;
        break;
      } catch (e) {
        derniere = e;
        info(essai === 0 ? tr("Connexion lente, on récupère le résultat…") : tr("Nouvelle tentative…"));
        await new Promise((z) => setTimeout(z, 3000));
      }
    }
    if (!r) throw new Error((derniere as Error)?.message || tr("connexion perdue"));
    const j = await r.json();
    if (!r.ok || !j.plan) throw new Error((j.erreur || tr("erreur HTTP ") + r.status) + (j.diagnostic ? " — " + JSON.stringify(j.diagnostic) : ""));
    const plan = nettoieArbre(j.plan) as PlanIA;
    const n = plan.notes as { retenues?: number; demandees?: number; bonus?: boolean } | undefined;
    const avertissement = n && ((n.retenues ?? 0) < (n.demandees ?? 0) || !n.bonus)
      ? tr("Cycle généré, mais incomplet : {retenues} séances sur {demandees}{a}. Tu peux le régénérer.", { retenues: n.retenues, demandees: n.demandees, a: n.bonus ? "" : tr(", sans séance bonus") })
      : undefined;
    return { plan, avertissement };
  } catch (e) {
    return { plan: null, erreur: (e as Error).message };
  }
}
