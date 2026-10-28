/* Photos Unsplash hors connexion. Elles restent servies par Unsplash (leurs règles), mais l'app en
   garde une copie sur le téléphone, dans un cache à part qui survit aux mises à jour de l'app :
   le service worker (scripts/sw.mjs) la sert d'abord, et le réseau seulement s'il en manque une.
   Une fois par session, en ligne et au repos, on télécharge celles qui manquent (≈ 3 Mo la première
   fois, rien ensuite) et on retire celles qui ne servent plus. Rien en mode « économie de données ». */
import { photosDistantes } from "@/lib/medias";

/** Nom du cache, partagé avec le service worker. */
export const CACHE_PHOTOS = "repere-photos";

let fait = false;

export async function memoriserPhotos() {
  if (fait || typeof window === "undefined" || !("caches" in window) || !navigator.onLine) return;
  if ((navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData) return;
  fait = true;
  try {
    const cache = await caches.open(CACHE_PHOTOS), voulues = new Set(photosDistantes());
    for (const req of await cache.keys()) if (!voulues.has(req.url)) await cache.delete(req);
    const manquantes: string[] = [];
    for (const url of voulues) if (!(await cache.match(url, { ignoreVary: true }))) manquantes.push(url);
    /* quatre à la fois, pour ne pas gêner l'app */
    const suivante = async (): Promise<void> => {
      const url = manquantes.shift();
      if (!url || !navigator.onLine) return;
      try {
        const r = await fetch(url, { mode: "cors", cache: "force-cache" });
        if (r.ok) await cache.put(url, r);
      } catch {}
      return suivante();
    };
    await Promise.all([suivante(), suivante(), suivante(), suivante()]);
  } catch {
    fait = false;
  }
}

/** Lance la mise en mémoire quand l'app est au repos (quelques secondes après l'ouverture). */
export function memoriserPhotosAuRepos() {
  if (typeof window === "undefined") return;
  const lancer = () => void memoriserPhotos();
  const ric = (window as Window & { requestIdleCallback?: (f: () => void, o?: { timeout: number }) => number }).requestIdleCallback;
  setTimeout(() => (ric ? ric(lancer, { timeout: 10000 }) : lancer()), 4000);
  /* revenu en ligne après un démarrage hors connexion */
  window.addEventListener("online", lancer, { once: true });
}
