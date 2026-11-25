import { modeDuLien, type Mode } from "@/lib/logic/mode";

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

/* Le mode promis par le lien (?mode=suivi, docs/produit/mode-suivi) : retenu sur l'appareil pour
   présélectionner ce mode à la question d'arrivée « Tu as déjà ton programme ? ». */
const CLE_MODE = "repere.mode.lien";
export function noterModeLien() {
  try {
    const m = modeDuLien(location.search);
    if (m) localStorage.setItem(CLE_MODE, m);
  } catch {}
}
export const modeLienNote = (): Mode | null => { try { const m = localStorage.getItem(CLE_MODE); return m === "suivi" || m === "guide" ? m : null; } catch { return null; } };
