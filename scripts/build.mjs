// Build de Repère : copie public/ dans dist/ et prépare le déploiement.
//  1. Le cache du service worker prend le hash du commit : chaque déploiement
//     invalide l'ancien cache, sans incrémenter de numéro à la main.
//  2. La liste des fichiers mis en cache est générée depuis le disque :
//     toutes les images sont disponibles hors ligne, sans oubli possible.
//  3. SUPABASE_URL et SUPABASE_KEY (variables d'environnement Render)
//     remplacent les valeurs par défaut écrites dans index.html.
// Aucune dépendance : Node seul suffit.

import { cpSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { execSync } from "node:child_process";
import { join, relative, sep } from "node:path";

const RACINE = new URL("..", import.meta.url).pathname;
const SRC = join(RACINE, "public");
const DIST = join(RACINE, "dist");

function version() {
  if (process.env.RENDER_GIT_COMMIT) return process.env.RENDER_GIT_COMMIT.slice(0, 8);
  try { return execSync("git rev-parse --short=8 HEAD", { cwd: RACINE, stdio: ["ignore", "pipe", "ignore"] }).toString().trim(); }
  catch { return "dev-" + Date.now().toString(36); }
}

function fichiers(dir) {
  return readdirSync(dir).flatMap((n) => {
    const p = join(dir, n);
    return statSync(p).isDirectory() ? fichiers(p) : [p];
  });
}

function remplace(texte, motif, valeur, quoi) {
  if (!motif.test(texte)) throw new Error(`Motif introuvable : ${quoi}`);
  return texte.replace(motif, valeur);
}

rmSync(DIST, { recursive: true, force: true });
cpSync(SRC, DIST, { recursive: true });

const v = version();

/* ---------- service worker ---------- */
const aCacher = fichiers(DIST)
  .map((p) => "./" + relative(DIST, p).split(sep).join("/"))
  .filter((p) => p !== "./sw.js" && !p.endsWith(".txt"))
  .sort();
const swChemin = join(DIST, "sw.js");
let sw = readFileSync(swChemin, "utf8");
sw = remplace(sw, /^const C='[^']*';$/m, `const C='repere-${v}';`, "nom du cache");
sw = remplace(sw, /^const ASSETS=\[.*\];$/m, `const ASSETS=${JSON.stringify(["./", ...aCacher])};`, "liste ASSETS");
writeFileSync(swChemin, sw);

/* ---------- configuration Supabase ---------- */
const htmlChemin = join(DIST, "index.html");
let html = readFileSync(htmlChemin, "utf8");
const url = process.env.SUPABASE_URL?.trim();
const cle = process.env.SUPABASE_KEY?.trim();
if (url) {
  if (!/^https:\/\/[a-z0-9-]+\.supabase\.co\/?$/.test(url)) throw new Error("SUPABASE_URL invalide : " + url);
  html = remplace(html, /^const SB_URL = '[^']*';$/m, `const SB_URL = '${url}';`, "SB_URL");
}
if (cle) {
  if (!/^(sb_publishable_[A-Za-z0-9_-]+|eyJ[A-Za-z0-9._-]+)$/.test(cle)) throw new Error("SUPABASE_KEY invalide (clé publishable attendue)");
  if (cle.startsWith("eyJ")) {
    const role = JSON.parse(Buffer.from(cle.split(".")[1] || "", "base64url").toString() || "{}").role;
    if (role !== "anon") throw new Error("SUPABASE_KEY n'est pas une clé publique : ne jamais l'exposer côté client");
  }
  html = remplace(html, /^const SB_KEY = '[^']*';$/m, `const SB_KEY = '${cle}';`, "SB_KEY");
}
writeFileSync(htmlChemin, html);

console.log(`Build ${v} : ${aCacher.length} fichiers mis en cache, Supabase ${url || "(valeur par défaut)"}`);
