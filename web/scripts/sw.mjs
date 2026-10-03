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
  .filter((p) => p !== "/sw.js" && !p.endsWith(".txt") && !p.endsWith(".map"))
  .map((p) => p.replace(/index\.html$/, ""))
  .sort();
const sw = `/* Repère — service worker généré (scripts/sw.mjs). */
const C = "repere-${v}";
const ASSETS = ${JSON.stringify(liste)};
self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(C).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys().then((k) => Promise.all(k.filter((x) => x !== C).map((x) => caches.delete(x)))).then(() => self.clients.claim()));
});
/* Pages : réseau d'abord, cache en secours. Le reste : cache d'abord. */
self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET" || new URL(req.url).origin !== location.origin) return;
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
