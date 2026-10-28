// Service worker généré après `next build` : précache tout out/ (pages, JS,
// polices, photos) pour un fonctionnement hors ligne complet. Le nom du cache
// prend le hash du commit : chaque déploiement remplace l'ancien cache.
import { readdirSync, statSync, writeFileSync } from "node:fs";
import { join, relative, sep } from "node:path";
import { execSync } from "node:child_process";

const OUT = new URL("../out/", import.meta.url).pathname;
const fichiers = (d) => readdirSync(d).flatMap((n) => { const p = join(d, n); return statSync(p).isDirectory() ? fichiers(p) : [p]; });
let v = process.env.RENDER_GIT_COMMIT?.slice(0, 8);
if (!v) try { v = execSync("git rev-parse --short=8 HEAD").toString().trim(); } catch { v = "dev-" + Date.now().toString(36); }
const liste = fichiers(OUT)
  .map((p) => "/" + relative(OUT, p).split(sep).join("/"))
  /* les photos en grand (≈ 19 Mo) ne sont pas mises en cache d'avance : gardées quand on les regarde */
  /* ni le moteur du scanner (≈ 1 Mo, il faut de toute façon le réseau pour trouver un produit) */
  .filter((p) => p !== "/sw.js" && !p.endsWith(".txt") && !p.endsWith(".map") && !p.startsWith("/img/grand/") && !p.startsWith("/zxing/"))
  .map((p) => p.replace(/index\.html$/, ""))
  .sort();
const sw = `/* Repère — service worker généré (scripts/sw.mjs). */
const C = "repere-${v}";
const ASSETS = ${JSON.stringify(liste)};
/* une nouvelle version s'installe puis attend : l'app propose « Recharger » (components/repere/mise-a-jour.tsx) */
self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(C).then((c) => c.addAll(ASSETS)));
});
self.addEventListener("message", (e) => { if (e.data === "activer") self.skipWaiting(); });
/* les photos Unsplash gardées pour le hors-ligne (lib/photos-hors-ligne.ts) survivent aux mises à jour */
const PHOTOS = "repere-photos";
self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys().then((k) => Promise.all(k.filter((x) => x !== C && x !== PHOTOS).map((x) => caches.delete(x)))).then(() => self.clients.claim()));
});
/* Pages : réseau d'abord, cache en secours. Le reste : cache d'abord. */
self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  /* photos Unsplash : la copie gardée d'abord, sinon le réseau (et on la garde au passage) */
  if (new URL(req.url).hostname === "images.unsplash.com") {
    e.respondWith(caches.open(PHOTOS).then((c) => c.match(req.url, { ignoreVary: true }).then((r) => r || fetch(req.url, { mode: "cors" }).then((res) => {
      if (res.ok) c.put(req.url, res.clone());
      return res;
    }))));
    return;
  }
  if (new URL(req.url).origin !== location.origin) return;
  /* photos d'exercices en grand : gardées avec les photos Unsplash, elles survivent aux mises à jour */
  if (new URL(req.url).pathname.startsWith("/img/grand/")) {
    e.respondWith(caches.open(PHOTOS).then((c) => c.match(req).then((r) => r || fetch(req).then((res) => {
      if (res.ok) c.put(req, res.clone());
      return res;
    }))));
    return;
  }
  if (req.mode === "navigate") {
    e.respondWith(fetch(req).then((r) => { const c = r.clone(); caches.open(C).then((x) => x.put(req, c)); return r; })
      .catch(() => caches.match(req, { ignoreSearch: true }).then((r) => r || caches.match("/"))));
    return;
  }
  e.respondWith(caches.match(req, { ignoreSearch: true }).then((r) => r || fetch(req).then((res) => {
    if (res.ok) { const c = res.clone(); caches.open(C).then((x) => x.put(req, c)); }
    return res;
  })));
});
`;
writeFileSync(join(OUT, "sw.js"), sw);
console.log(`sw.js : cache repere-${v}, ${liste.length} fichiers`);
