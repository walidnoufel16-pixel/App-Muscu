// ============================================================
//  Repère — suppression d'un compte par l'admin (fonction Edge "supprimer")
//  1. admin_verifier_suppression, appelée avec le jeton de l'appelant, refuse
//     tout non-admin, l'admin lui-même et les autres admins ;
//  2. le compte est supprimé par l'API d'administration d'Auth (comme
//     « oublier »), les tables liées suivent en cascade ;
//  3. la suppression est notée dans admin_journal.
// ============================================================

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const rep = (o: unknown, s = 200) =>
  new Response(JSON.stringify(o), { status: s, headers: { ...CORS, "Content-Type": "application/json" } });

const SB_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SB_SRV = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const SB_ANON = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return rep({ erreur: "Méthode non autorisée." }, 405);
  if (!SB_URL || !SB_SRV) return rep({ erreur: "Configuration serveur incomplète." }, 500);

  const auth = req.headers.get("Authorization") ?? "";
  if (!auth.startsWith("Bearer ")) return rep({ erreur: "Connexion requise." }, 401);
  let cible: unknown;
  try { cible = (await req.json())?.user; } catch { return rep({ erreur: "Requête illisible." }, 400); }
  if (typeof cible !== "string" || !UUID.test(cible)) return rep({ erreur: "Compte invalide." }, 400);

  /* Le contrôle se fait avec l'identité de l'appelant, jamais avec la clé de service. */
  const v = await fetch(`${SB_URL}/rest/v1/rpc/admin_verifier_suppression`, {
    method: "POST",
    headers: { apikey: SB_ANON || SB_SRV, Authorization: auth, "Content-Type": "application/json" },
    body: JSON.stringify({ p_user: cible }),
  });
  const verif = await v.json().catch(() => null);
  if (!v.ok) return rep({ erreur: verif?.message || "Suppression refusée." }, v.status === 401 ? 401 : 403);

  const moi = await fetch(`${SB_URL}/auth/v1/user`, { headers: { apikey: SB_SRV, Authorization: auth } });
  const admin = moi.ok ? (await moi.json())?.id : null;
  if (typeof admin !== "string") return rep({ erreur: "Connexion requise." }, 401);

  const r = await fetch(`${SB_URL}/auth/v1/admin/users/${cible}`, {
    method: "DELETE",
    headers: { apikey: SB_SRV, Authorization: `Bearer ${SB_SRV}` },
  });
  if (!r.ok) return rep({ erreur: "Suppression impossible.", detail: (await r.text()).slice(0, 200) }, 502);
  await r.text();

  const j = await fetch(`${SB_URL}/rest/v1/admin_journal`, {
    method: "POST",
    headers: { apikey: SB_SRV, Authorization: `Bearer ${SB_SRV}`, "Content-Type": "application/json", Prefer: "return=minimal" },
    body: JSON.stringify({ admin, action: "suppression", compte: cible, pseudo: verif?.pseudo ?? null, email: verif?.email ?? null }),
  });
  await j.text();
  return rep({ ok: true, journal: j.ok });
});
