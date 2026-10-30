// ============================================================
//  Repère — rappels après quelques jours sans séance (fonction Edge "rappels")
//  - Appel du cron (en-tête x-cle) toutes les heures : à 18 h (Paris), envoie à chaque
//    appareil inscrit le rappel dû (logique.ts), au plus un par niveau.
//  - Appel de l'app (jeton de l'utilisateur, { essai: true }) juste après l'inscription :
//    une notification de confirmation sur ses appareils, pour vérifier que tout marche.
//  Clés VAPID (tirées au premier passage) et clé du cron : Vault, via rappels_cles()
//  (service_role seulement).
// ============================================================
import webpush from "npm:web-push@3.6.7";
import { derniereActivite, rappelDu, type Sauvegarde } from "./logique.ts";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const rep = (o: unknown, s = 200) =>
  new Response(JSON.stringify(o), { status: s, headers: { ...CORS, "Content-Type": "application/json" } });

const SB_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SB_SRV = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const srv = { apikey: SB_SRV, Authorization: `Bearer ${SB_SRV}`, "Content-Type": "application/json" };
const rpc = async (f: string, corps: unknown = {}) => {
  const r = await fetch(`${SB_URL}/rest/v1/rpc/${f}`, { method: "POST", headers: srv, body: JSON.stringify(corps) });
  if (!r.ok) throw new Error(`${f} : ${r.status} ${(await r.text()).slice(0, 200)}`);
  return r.json();
};
const table = (filtre: string, init: RequestInit) => fetch(`${SB_URL}/rest/v1/rappels?${filtre}`, { ...init, headers: { ...srv, Prefer: "return=minimal" } }).then((r) => r.text());

/* jour et heure à Paris */
const paris = (ts: number) => new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Paris", year: "numeric", month: "2-digit", day: "2-digit" }).format(ts);
const heureParis = () => +new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/Paris", hour: "2-digit", hourCycle: "h23" }).format(Date.now());

type Ligne = { endpoint: string; user_id: string; abonnement: webpush.PushSubscription; langue: string; niveau: number; ref: string | null; etat: Sauvegarde };

/* envoie ; un appareil désinscrit (404/410) est retiré de la table */
async function envoyer(l: Pick<Ligne, "endpoint" | "abonnement">, message: { titre: string; corps: string; url: string; tag: string }) {
  try {
    await webpush.sendNotification(l.abonnement, JSON.stringify(message), { TTL: 6 * 3600, urgency: "normal" });
    return true;
  } catch (e) {
    const code = (e as { statusCode?: number }).statusCode;
    if (code === 404 || code === 410) await table(`endpoint=eq.${encodeURIComponent(l.endpoint)}`, { method: "DELETE" });
    else console.error("envoi", code, String(e).slice(0, 200));
    return false;
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return rep({ erreur: "Méthode non autorisée." }, 405);
  if (!SB_URL || !SB_SRV) return rep({ erreur: "Configuration serveur incomplète." }, 500);

  let cles = await rpc("rappels_cles") as Record<string, string> | null;
  /* premier passage : les clés VAPID sont tirées ici et rangées dans le Vault */
  if (!cles?.rappels_vapid_prive) {
    const k = webpush.generateVAPIDKeys();
    await rpc("rappels_enregistrer_vapid", { p_public: k.publicKey, p_prive: k.privateKey });
    cles = await rpc("rappels_cles") as Record<string, string> | null;
  }
  if (!cles?.rappels_vapid_prive || !cles.rappels_vapid_public || !cles.rappels_cle) return rep({ erreur: "Clés absentes." }, 500);
  webpush.setVapidDetails("https://repere-soz5.onrender.com", cles.rappels_vapid_public, cles.rappels_vapid_prive);
  const corps = await req.json().catch(() => ({})) as { essai?: boolean; force?: boolean };

  /* --- appel du cron --- */
  const cle = req.headers.get("x-cle");
  if (cle) {
    if (cle !== cles.rappels_cle) return rep({ erreur: "Clé invalide." }, 401);
    if (!corps.force && heureParis() !== 18) return rep({ ok: true, ignore: "hors 18 h" });
    const auj = paris(Date.now()), lignes = await rpc("rappels_a_traiter") as Ligne[];
    let envoyes = 0;
    for (const l of lignes) {
      const der = derniereActivite(l.etat, paris);
      /* une séance depuis le dernier rappel : on repart de zéro */
      const deja = der && l.ref === der ? l.niveau : 0;
      const r = rappelDu(l.etat, auj, deja, l.langue, paris);
      if (!r) {
        if (der !== l.ref && l.niveau) await table(`endpoint=eq.${encodeURIComponent(l.endpoint)}`, { method: "PATCH", body: JSON.stringify({ niveau: 0, ref: der }) });
        continue;
      }
      if (await envoyer(l, { titre: r.titre, corps: r.corps, url: r.url, tag: "rappel" })) {
        envoyes++;
        await table(`endpoint=eq.${encodeURIComponent(l.endpoint)}`, { method: "PATCH", body: JSON.stringify({ niveau: r.niveau, ref: der, envoye: new Date().toISOString() }) });
      }
    }
    return rep({ ok: true, abonnes: lignes.length, envoyes });
  }

  /* --- essai depuis l'app : l'identité vient du jeton --- */
  const auth = req.headers.get("Authorization") ?? "";
  if (!corps.essai || !auth.startsWith("Bearer ")) return rep({ erreur: "Connexion requise." }, 401);
  const u = await fetch(`${SB_URL}/auth/v1/user`, { headers: { apikey: SB_SRV, Authorization: auth } });
  if (!u.ok) { await u.text(); return rep({ erreur: "Connexion requise." }, 401); }
  const { id } = await u.json();
  if (typeof id !== "string") return rep({ erreur: "Connexion requise." }, 401);
  const r = await fetch(`${SB_URL}/rest/v1/rappels?user_id=eq.${id}&select=endpoint,abonnement,langue`, { headers: srv });
  const miens = (await r.json()) as Ligne[];
  let envoyes = 0;
  for (const l of miens) {
    const en = l.langue === "en";
    if (await envoyer(l, {
      titre: en ? "Reminders are on" : "Rappels activés",
      corps: en ? "We'll give you a nudge after a few days without a workout." : "On te fera signe après quelques jours sans séance.",
      url: "/entrainement/", tag: "essai",
    })) envoyes++;
  }
  return rep({ ok: true, envoyes });
});
