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
import { derniereActivite, rappelDu, rappelsAgenda, seancePrevueBientot, type Sauvegarde } from "./logique.ts";

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

/* Alerte des admins : une notification par nouvelle erreur, 10 par jour au plus, puis une seule
   « d'autres erreurs ». La toucher ouvre l'Admin. */
const MAX_ALERTES = 10;
const navigateurCourt = (ua: string) => {
  const app = /CriOS|Chrome/.test(ua) ? "Chrome" : /FxiOS|Firefox/.test(ua) ? "Firefox" : /Safari/.test(ua) ? "Safari" : "Navigateur";
  const os = /iPhone|iPad/.test(ua) ? "iPhone" : /Android/.test(ua) ? "Android" : /Mac OS/.test(ua) ? "Mac" : /Windows/.test(ua) ? "Windows" : "";
  return [app, os].filter(Boolean).join(" ");
};
async function alerterErreurs() {
  const r = await rpc("erreurs_a_signaler") as { deja: number; erreurs: { message: string; page: string; navigateur: string }[]; appareils: Pick<Ligne, "endpoint" | "abonnement">[] };
  let envoyes = 0, n = r.deja;
  for (const e of r.erreurs) {
    n++;
    if (n > MAX_ALERTES + 1) break;
    const msg = n === MAX_ALERTES + 1
      ? { titre: "⚠️ Erreurs Oxa", corps: "D'autres erreurs sont arrivées aujourd'hui : voir l'Admin.", url: "/admin/", tag: "erreurs-plus" }
      : { titre: "⚠️ Erreur Oxa", corps: [e.message.slice(0, 110), e.page || "/", navigateurCourt(e.navigateur)].join(" · "), url: "/admin/", tag: `erreur-${Date.now()}-${n}` };
    for (const a of r.appareils) if (await envoyer(a, msg)) envoyes++;
  }
  return { ok: true, erreurs: r.erreurs.length, appareils: r.appareils.length, envoyes };
}

/* Nouveau testeur (compte confirmé, déclencheur sur auth.users) : on prévient les admins. */
async function alerterTesteurs() {
  const r = await rpc("testeurs_a_signaler") as { nouveaux: number; total: number; appareils: Pick<Ligne, "endpoint" | "abonnement">[] };
  if (!r.nouveaux) return { ok: true, nouveaux: 0 };
  const msg = r.nouveaux === 1
    ? { titre: "🎉 Nouveau testeur Oxa", corps: `C'est le ${r.total}ᵉ testeur.`, url: "/admin/", tag: `testeur-${Date.now()}` }
    : { titre: "🎉 Nouveaux testeurs Oxa", corps: `${r.nouveaux} de plus, ${r.total} au total.`, url: "/admin/", tag: `testeur-${Date.now()}` };
  let envoyes = 0;
  for (const a of r.appareils) if (await envoyer(a, msg)) envoyes++;
  return { ok: true, nouveaux: r.nouveaux, total: r.total, envoyes };
}

/* ---------------- e-mail de bienvenue des testeurs (Resend) ----------------
   Un seul e-mail, aux comptes confirmés à partir du 18/11/2026 à 12 h (Paris) : public.testeurs
   (bienvenue = false). La case est cochée avant l'envoi (jamais deux e-mails), et décochée si
   Resend refuse, pour réessayer au passage suivant du cron. Sans clé RESEND_API_KEY : rien. */
const RESEND = Deno.env.get("RESEND_API_KEY") ?? "";
const DEBUT_BIENVENUE = "2026-11-18T11:00:00Z";
const BIENVENUE_OBJET = "Bienvenue dans la communauté des testeurs Oxa 💪";
const BIENVENUE_LIGNES = [
  "Salut !",
  "Merci d'avoir rejoint la communauté des testeurs d'Oxa. Ton avis va vraiment compter pour la suite.",
  "Pour bien démarrer : ouvre Oxa, choisis ton objectif, et lance la séance du jour. Oxa s'occupe des exercices, des charges et des temps de repos.",
  "Un bug, une idée, un truc qui t'agace ? Réponds simplement à cet e-mail, je lis tout.",
  "À très vite à la salle,",
];
const bienvenueHtml = () => `<!doctype html><html lang="fr"><body style="margin:0;padding:0;background:#f2f2f4">
<div style="max-width:520px;margin:0 auto;padding:32px 20px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#111;font-size:16px;line-height:1.55">
<div style="background:#fff;border-radius:18px;padding:28px 24px">
${BIENVENUE_LIGNES.map((l) => `<p style="margin:0 0 14px">${l}</p>`).join("\n")}
<p style="margin:0">L'équipe Oxa · <a href="https://oxafit.app/?src=mail-bienvenue" style="color:#0b8f80;font-weight:600;text-decoration:none">oxafit.app</a></p>
</div></div></body></html>`;
const bienvenueTexte = () => [...BIENVENUE_LIGNES, "L'équipe Oxa · oxafit.app"].join("\n\n");

async function envoyerBienvenue(email: string) {
  const r = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${RESEND}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: "L'équipe Oxa <bonjour@oxafit.app>", to: [email], reply_to: "oxafitapp@gmail.com", subject: BIENVENUE_OBJET, text: bienvenueTexte(), html: bienvenueHtml() }),
  });
  if (!r.ok) { console.error("bienvenue", r.status, (await r.text()).slice(0, 200)); return false; }
  await r.text();
  return true;
}
const emailDe = async (id: string): Promise<string | null> => {
  const r = await fetch(`${SB_URL}/auth/v1/admin/users/${id}`, { headers: srv });
  if (!r.ok) { await r.text(); return null; }
  return ((await r.json()) as { email?: string }).email ?? null;
};
const testeurs = (filtre: string, init: RequestInit = {}) => fetch(`${SB_URL}/rest/v1/testeurs?${filtre}`, { ...init, headers: { ...srv, Prefer: "return=representation" } }).then((r) => r.json());

async function accueillirTesteurs() {
  if (!RESEND) return { bienvenue: 0, ignore: "pas de clé Resend" };
  const liste = await testeurs(`bienvenue=eq.false&confirme=gte.${DEBUT_BIENVENUE}&select=user_id&limit=20`) as { user_id: string }[];
  let n = 0;
  for (const t of liste) {
    const email = await emailDe(t.user_id);
    if (!email) continue;
    const pris = await testeurs(`user_id=eq.${t.user_id}&bienvenue=eq.false`, { method: "PATCH", body: JSON.stringify({ bienvenue: true }) }) as unknown[];
    if (!pris.length) continue;
    if (await envoyerBienvenue(email)) n++;
    else await testeurs(`user_id=eq.${t.user_id}`, { method: "PATCH", body: JSON.stringify({ bienvenue: false }) });
  }
  return { bienvenue: n };
}
/* Essai : l'e-mail de bienvenue envoyé aux seuls admins. */
async function essaiBienvenue() {
  if (!RESEND) return { ok: false, erreur: "pas de clé Resend" };
  const admins = await fetch(`${SB_URL}/rest/v1/admins?select=user_id`, { headers: srv }).then((r) => r.json()) as { user_id: string }[];
  let n = 0;
  for (const a of admins) { const e = await emailDe(a.user_id); if (e && await envoyerBienvenue(e)) n++; }
  return { ok: n > 0, envoyes: n };
}

/* comparaison en temps constant (la clé du cron ne fuit pas par le temps de réponse) */
function egal(a: string, b: string) {
  const x = new TextEncoder().encode(a), y = new TextEncoder().encode(b);
  let d = x.length ^ y.length;
  for (let i = 0; i < Math.max(x.length, y.length); i++) d |= (x[i] ?? 0) ^ (y[i] ?? 0);
  return d === 0;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return rep({ erreur: "Méthode non autorisée." }, 405);
  if (!SB_URL || !SB_SRV) return rep({ erreur: "Configuration serveur incomplète." }, 500);
  /* ni clé du cron ni jeton : refusé avant de lire le Vault */
  if (!req.headers.get("x-cle") && !(req.headers.get("Authorization") ?? "").startsWith("Bearer ")) return rep({ erreur: "Connexion requise." }, 401);

  let cles = await rpc("rappels_cles") as Record<string, string> | null;
  /* premier passage : les clés VAPID sont tirées ici et rangées dans le Vault */
  if (!cles?.rappels_vapid_prive) {
    const k = webpush.generateVAPIDKeys();
    await rpc("rappels_enregistrer_vapid", { p_public: k.publicKey, p_prive: k.privateKey });
    cles = await rpc("rappels_cles") as Record<string, string> | null;
  }
  if (!cles?.rappels_vapid_prive || !cles.rappels_vapid_public || !cles.rappels_cle) return rep({ erreur: "Clés absentes." }, 500);
  webpush.setVapidDetails("https://repere-soz5.onrender.com", cles.rappels_vapid_public, cles.rappels_vapid_prive);
  const corps = await req.json().catch(() => ({})) as { essai?: boolean; force?: boolean; alerte_erreurs?: boolean; nouveau_testeur?: boolean; essai_bienvenue?: boolean };

  /* --- appel du cron --- */
  const cle = req.headers.get("x-cle");
  if (cle) {
    if (!egal(cle, cles.rappels_cle)) return rep({ erreur: "Clé invalide." }, 401);
    /* une nouvelle erreur dans le journal (déclencheur sur public.erreurs) : on prévient les admins */
    if (corps.alerte_erreurs) return rep(await alerterErreurs());
    if (corps.nouveau_testeur) return rep({ ...(await alerterTesteurs()), ...(await accueillirTesteurs()) });
    if (corps.essai_bienvenue) return rep(await essaiBienvenue());
    /* à chaque passage du cron : un e-mail de bienvenue resté en échec est retenté */
    await accueillirTesteurs().catch((e) => console.error("bienvenue", String(e).slice(0, 200)));
    const auj = paris(Date.now()), heure = heureParis(), lignes = await rpc("rappels_a_traiter") as Ligne[];
    let envoyes = 0, agenda = 0;
    /* toutes les heures : les rappels des séances programmées dans « Mon agenda » */
    for (const l of lignes)
      for (const r of rappelsAgenda(l.etat, auj, heure, l.langue, paris))
        if (await envoyer(l, { titre: r.titre, corps: r.corps, url: r.url, tag: "agenda-" + r.id })) agenda++;
    /* à 18 h seulement : le rappel après quelques jours sans séance */
    if (!corps.force && heure !== 18) return rep({ ok: true, agenda, ignore: "hors 18 h" });
    for (const l of lignes) {
      if (seancePrevueBientot(l.etat, auj)) continue;
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
    return rep({ ok: true, abonnes: lignes.length, envoyes, agenda });
  }

  /* --- essai depuis l'app : l'identité vient du jeton --- */
  const auth = req.headers.get("Authorization") ?? "";
  if (!corps.essai || !auth.startsWith("Bearer ")) return rep({ erreur: "Connexion requise." }, 401);
  const u = await fetch(`${SB_URL}/auth/v1/user`, { headers: { apikey: SB_SRV, Authorization: auth } });
  if (!u.ok) { await u.text(); return rep({ erreur: "Connexion requise." }, 401); }
  const { id } = await u.json();
  if (typeof id !== "string") return rep({ erreur: "Connexion requise." }, 401);
  /* l'essai ne part que vers l'appareil inscrit le plus récemment, et au plus une fois par minute */
  const r = await fetch(`${SB_URL}/rest/v1/rappels?user_id=eq.${id}&select=endpoint,abonnement,langue,envoye&order=cree.desc&limit=1`, { headers: srv });
  const miens = (await r.json()) as (Ligne & { envoye: string | null })[];
  if (miens[0]?.envoye && Date.now() - Date.parse(miens[0].envoye) < 60_000) return rep({ ok: true, envoyes: 0, attente: true });
  let envoyes = 0;
  for (const l of miens) {
    const en = l.langue === "en";
    if (await envoyer(l, {
      titre: en ? "Reminders are on" : "Rappels activés",
      corps: en ? "We'll give you a nudge after a few days without a workout." : "On te fera signe après quelques jours sans séance.",
      url: "/entrainement/", tag: "essai",
    })) {
      envoyes++;
      await table(`endpoint=eq.${encodeURIComponent(l.endpoint)}`, { method: "PATCH", body: JSON.stringify({ envoye: new Date().toISOString() }) });
    }
  }
  return rep({ ok: true, envoyes });
});
