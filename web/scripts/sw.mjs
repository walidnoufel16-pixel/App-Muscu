// Service worker généré après `next build` : précache tout out/ (pages, JS,
// polices, photos) pour un fonctionnement hors ligne complet. Le nom du cache
// prend le hash du commit : chaque déploiement remplace l'ancien cache.
import { readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
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
/* empreinte de chaque photo en grand : une photo refaite change d'empreinte, la copie gardée
   sur le téléphone est alors remplacée (sans retélécharger celles qui n'ont pas changé) */
const GRAND = Object.fromEntries(fichiers(join(OUT, "img/grand")).map((p) => [
  "/" + relative(OUT, p).split(sep).join("/"), createHash("sha1").update(readFileSync(p)).digest("hex").slice(0, 8),
]));
const sw = `/* Repère — service worker généré (scripts/sw.mjs). */
const C = "repere-${v}";
const ASSETS = ${JSON.stringify(liste)};
const GRAND = ${JSON.stringify(GRAND)};
const cleGrand = (chemin) => chemin + "?v=" + (GRAND[chemin] || "");
/* une nouvelle version s'installe puis attend : l'app propose « Recharger » (components/repere/mise-a-jour.tsx) */
self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(C).then((c) => c.addAll(ASSETS)));
});
self.addEventListener("message", (e) => { if (e.data === "activer") self.skipWaiting(); });
/* les photos Unsplash gardées pour le hors-ligne (lib/photos-hors-ligne.ts) survivent aux mises à jour */
const PHOTOS = "repere-photos";
self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys().then((k) => Promise.all(k.filter((x) => x !== C && x !== PHOTOS).map((x) => caches.delete(x))))
    /* photos en grand refaites depuis la version d'avant : l'ancienne copie part */
    .then(() => caches.open(PHOTOS)).then((c) => c.keys().then((l) => Promise.all(l.filter((r) => {
      const u = new URL(r.url);
      return u.pathname.startsWith("/img/grand/") && u.pathname + u.search !== cleGrand(u.pathname);
    }).map((r) => c.delete(r)))))
    .then(() => self.clients.claim()));
});
/* rappels après quelques jours sans séance (supabase/functions/rappels) */
self.addEventListener("push", (e) => {
  let m = {};
  try { m = e.data ? e.data.json() : {}; } catch {}
  e.waitUntil(self.registration.showNotification(m.titre || "Repère", {
    body: m.corps || "", tag: m.tag || "rappel", icon: "/icon-192.png", badge: "/icon-192.png", data: { url: m.url || "/entrainement/" },
  }));
});
self.addEventListener("notificationclick", (e) => {
  e.notification.close();
  const url = new URL((e.notification.data && e.notification.data.url) || "/", location.origin).href;
  e.waitUntil(self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((l) => {
    const ouverte = l.find((c) => new URL(c.url).origin === location.origin);
    return ouverte ? ouverte.focus().then((c) => c.navigate(url)).catch(() => self.clients.openWindow(url)) : self.clients.openWindow(url);
  }));
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
  /* photos d'exercices en grand : gardées avec les photos Unsplash, elles survivent aux mises à jour
     tant qu'elles n'ont pas été refaites (empreinte dans la clé) */
  if (new URL(req.url).pathname.startsWith("/img/grand/")) {
    const cle = cleGrand(new URL(req.url).pathname);
    e.respondWith(caches.open(PHOTOS).then((c) => c.match(cle).then((r) => r || fetch(req, { cache: "no-cache" }).then((res) => {
      if (res.ok) c.put(cle, res.clone());
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
