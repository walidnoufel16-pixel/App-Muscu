/* Rappels après quelques jours sans séance (notifications Web Push).
   L'appareil s'inscrit auprès de Supabase (rappels_abonner) ; la fonction Edge « rappels »
   décide chaque jour à 18 h s'il faut écrire (supabase/functions/rappels/logique.ts).
   Sur iPhone, les notifications ne marchent qu'avec l'app installée sur l'écran d'accueil. */
import { langue } from "@/lib/i18n";
import { sb, SB_KEY, SB_URL } from "@/lib/supabase";

const PROPOSE = "repere.rappels.propose";

export type EtatRappels = "actif" | "inactif" | "refuse" | "installer" | "indispo";

const ios = () => /iPhone|iPad|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
const installee = () => matchMedia("(display-mode: standalone)").matches || (navigator as { standalone?: boolean }).standalone === true;
const pris = () => typeof window !== "undefined" && "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;

const abonnement = async () => (await navigator.serviceWorker.getRegistration())?.pushManager.getSubscription() ?? null;

export async function etatRappels(): Promise<EtatRappels> {
  if (typeof window === "undefined") return "indispo";
  if (!pris()) return ios() && !installee() ? "installer" : "indispo";
  if (Notification.permission === "denied") return "refuse";
  return Notification.permission === "granted" && (await abonnement()) ? "actif" : "inactif";
}

/* base64url → octets, pour applicationServerKey */
const octets = (b64: string) => {
  const s = atob(b64.replace(/-/g, "+").replace(/_/g, "/") + "=".repeat((4 - (b64.length % 4)) % 4));
  return Uint8Array.from(s, (c) => c.charCodeAt(0));
};

async function inscrire(sub: PushSubscription) {
  const c = await sb();
  if (!c) throw new Error("hors ligne");
  const { error } = await c.rpc("rappels_abonner", { p_abonnement: sub.toJSON(), p_langue: langue() });
  if (error) throw error;
}

/** Demande la permission, inscrit l'appareil et envoie une notification de confirmation. */
export async function activerRappels(): Promise<EtatRappels> {
  noterPropose();
  if (!pris()) return etatRappels();
  if ((await Notification.requestPermission()) !== "granted") return etatRappels();
  const reg = await navigator.serviceWorker.ready;
  let sub = await reg.pushManager.getSubscription();
  if (!sub) {
    /* clé publique VAPID (la privée reste dans le Vault Supabase) */
    const c = await sb(), { data: cle } = (await c?.rpc("rappels_vapid_public")) ?? { data: null };
    if (typeof cle !== "string" || !cle) throw new Error("clé absente");
    sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: octets(cle) });
  }
  await inscrire(sub);
  /* la notification de confirmation vérifie toute la chaîne ; son échec ne bloque rien */
  const c = await sb(), { data } = (await c?.auth.getSession()) ?? { data: null };
  if (data?.session) fetch(SB_URL.replace(/\/$/, "") + "/functions/v1/rappels", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: "Bearer " + data.session.access_token, apikey: SB_KEY },
    body: JSON.stringify({ essai: true }),
  }).catch(() => {});
  return "actif";
}

export async function couperRappels(): Promise<EtatRappels> {
  const sub = await abonnement();
  if (sub) {
    const c = await sb();
    await c?.rpc("rappels_desabonner", { p_endpoint: sub.endpoint });
    await sub.unsubscribe();
  }
  return etatRappels();
}

/** Au démarrage : un appareil déjà inscrit se ré-inscrit (compte ou langue qui a changé). */
export async function resynchroniserRappels() {
  if (!pris() || Notification.permission !== "granted") return;
  const sub = await abonnement();
  if (sub) await inscrire(sub).catch(() => {});
}

/* La proposition en fin de séance ne vient qu'une fois. */
export const dejaPropose = () => { try { return !!localStorage.getItem(PROPOSE); } catch { return true; } };
export const noterPropose = () => { try { localStorage.setItem(PROPOSE, String(Date.now())); } catch {} };
