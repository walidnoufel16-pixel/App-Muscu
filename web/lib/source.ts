/* D'où vient un nouvel utilisateur : l'étiquette ?src=… du lien qui l'a amené (tiktok, insta,
   ami…), retenue sur l'appareil à la première visite et envoyée avec la sauvegarde (etats.source).
   La première étiquette reste : un lien ouvert plus tard ne la remplace pas. */
const CLE = "repere.source";

export function noterSource() {
  try {
    const s = new URLSearchParams(location.search).get("src")?.toLowerCase();
    if (s && /^[a-z0-9_-]{1,24}$/.test(s) && !localStorage.getItem(CLE)) localStorage.setItem(CLE, s);
  } catch {}
}

export const sourceNotee = () => { try { return localStorage.getItem(CLE) || null; } catch { return null; } };
