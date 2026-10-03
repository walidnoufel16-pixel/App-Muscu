/* Client Supabase. La clé est la clé publishable (publique par nature : la
   sécurité repose sur les règles RLS). Surchargeable au build par
   NEXT_PUBLIC_SUPABASE_URL et NEXT_PUBLIC_SUPABASE_KEY. */
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export const SB_URL = (process.env.NEXT_PUBLIC_SUPABASE_URL || "https://iyjiwfzrmyvcnmzwlgxe.supabase.co").trim();
export const SB_KEY = (process.env.NEXT_PUBLIC_SUPABASE_KEY || "sb_publishable_lZmQsTMMyzcaY9A80Zr26Q_V_zHmf3R").trim();

let client: SupabaseClient | null = null;
export function sb(): SupabaseClient | null {
  if (typeof window === "undefined") return null;
  if (client) return client;
  if (!/^https:\/\/[a-z0-9-]+\.supabase\.co\/?$/.test(SB_URL) || !/^eyJ|^sb_publishable_/.test(SB_KEY)) return null;
  try {
    client = createClient(SB_URL, SB_KEY);
  } catch {
    client = null;
  }
  return client;
}

export const valideMail = (m: string) => /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test((m || "").trim());

/* Messages d'erreur Supabase traduits pour l'utilisateur. */
export function messageErreur(e: unknown, contexte: "lier" | "envoi" | "code" | "recup" | "connexion" = "envoi") {
  const t = ((e as { message?: string; error_description?: string })?.message || (e as { error_description?: string })?.error_description || "") as string;
  if (/rate limit|429|too many|for security/i.test(t)) return "Trop de demandes. Réessaie dans quelques minutes.";
  if (contexte === "lier" && /already been registered|already registered|exists/i.test(t))
    return "Cette adresse est déjà rattachée à un autre compte. Utilise « J'ai déjà un compte » pour le rouvrir.";
  if (contexte === "recup" && /signups not allowed|not found|disabled/i.test(t)) return "Aucun compte n'est rattaché à cette adresse.";
  if (contexte === "code" && /expired|invalid/i.test(t)) return "Code incorrect ou expiré. Demande-en un nouveau.";
  if (contexte === "connexion" && /anonymous.*disabled|not enabled/i.test(t)) return "Les comptes anonymes sont désactivés côté serveur.";
  return (contexte === "code" ? "Vérification impossible" : contexte === "connexion" ? "Connexion impossible" : "Envoi impossible") + (t ? " : " + t : ".");
}
