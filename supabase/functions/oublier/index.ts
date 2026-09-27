// ============================================================
//  Repère — suppression définitive du compte (fonction Edge "oublier")
//  Appelée par l'app quand l'utilisateur efface tout : supprime son entrée
//  dans auth.users. Les tables liées suivent (on delete cascade / set null).
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

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return rep({ erreur: "Méthode non autorisée." }, 405);
  if (!SB_URL || !SB_SRV) return rep({ erreur: "Configuration serveur incomplète." }, 500);

  /* L'identité vient du jeton : on ne supprime jamais que son propre compte. */
  const auth = req.headers.get("Authorization") ?? "";
  if (!auth.startsWith("Bearer ")) return rep({ erreur: "Connexion requise." }, 401);
  const u = await fetch(`${SB_URL}/auth/v1/user`, { headers: { apikey: SB_SRV, Authorization: auth } });
  if (!u.ok) { await u.text(); return rep({ erreur: "Connexion requise." }, 401); }
  const { id } = await u.json();
  if (typeof id !== "string") return rep({ erreur: "Connexion requise." }, 401);

  const r = await fetch(`${SB_URL}/auth/v1/admin/users/${id}`, {
    method: "DELETE",
    headers: { apikey: SB_SRV, Authorization: `Bearer ${SB_SRV}` },
  });
  if (!r.ok) return rep({ erreur: "Suppression impossible.", detail: (await r.text()).slice(0, 200) }, 502);
  await r.text();
  return rep({ ok: true });
});
