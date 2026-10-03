// Build de Repère pour Render (réglage inchangé : « node scripts/build.mjs »,
// dossier publié « dist »). L'app est désormais l'app Next.js de web/ :
//  1. installe ses dépendances et lance son export statique (web/out) ;
//  2. SUPABASE_URL et SUPABASE_KEY (variables Render) sont transmises au build
//     sous les noms NEXT_PUBLIC_*, après vérification ;
//  3. copie web/out dans dist/.
// Le service worker (web/scripts/sw.mjs) prend le hash du commit : chaque
// déploiement invalide l'ancien cache, y compris celui de l'ancienne app.

import { cpSync, rmSync } from "node:fs";
import { execSync } from "node:child_process";
import { join } from "node:path";

const RACINE = new URL("..", import.meta.url).pathname;
const WEB = join(RACINE, "web");
const DIST = join(RACINE, "dist");

const url = process.env.SUPABASE_URL?.trim();
const cle = process.env.SUPABASE_KEY?.trim();
if (url && !/^https:\/\/[a-z0-9-]+\.supabase\.co\/?$/.test(url)) throw new Error("SUPABASE_URL invalide : " + url);
if (cle) {
  if (!/^(sb_publishable_[A-Za-z0-9_-]+|eyJ[A-Za-z0-9._-]+)$/.test(cle)) throw new Error("SUPABASE_KEY invalide (clé publishable attendue)");
  if (cle.startsWith("eyJ")) {
    const role = JSON.parse(Buffer.from(cle.split(".")[1] || "", "base64url").toString() || "{}").role;
    if (role !== "anon") throw new Error("SUPABASE_KEY n'est pas une clé publique : ne jamais l'exposer côté client");
  }
}
const env = { ...process.env, NEXT_TELEMETRY_DISABLED: "1" };
if (url) env.NEXT_PUBLIC_SUPABASE_URL = url;
if (cle) env.NEXT_PUBLIC_SUPABASE_KEY = cle;

execSync("npm ci --no-audit --no-fund && npm run build", { cwd: WEB, stdio: "inherit", env });
rmSync(DIST, { recursive: true, force: true });
cpSync(join(WEB, "out"), DIST, { recursive: true });
console.log(`Build terminé : web/out copié dans dist/, Supabase ${url || "(valeur par défaut)"}`);
