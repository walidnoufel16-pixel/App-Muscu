/* Image de partage du site (web/public/og.jpg, 1200 × 630) : le logo, la promesse et une capture de
   l'app dans un téléphone. Refaite le 26 novembre 2026 pour le mode Suivi (les nouveaux comptes n'ont
   que lui : jamais « séance prête » ni « coach », voir docs/reseaux/README.md).
   Usage : node outils/og.mjs <capture 390 × 844 de l'app, ×2 ou ×3>   (depuis la racine du dépôt)
   La capture : par exemple l'accueil du mode Suivi (CAPTURES=… node tests/e2e/mode-suivi.mjs dans web/,
   fichier 3-accueil-suivi.png). */
import { createRequire } from "node:module";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
const racine = fileURLToPath(new URL("..", import.meta.url));
const { chromium } = createRequire(racine + "web/package.json")("@playwright/test");
const capture = process.argv[2];
if (!capture) { console.error("Usage : node outils/og.mjs <capture.png>"); process.exit(1); }
const b64 = (f) => readFileSync(f).toString("base64");
const ecran = `data:image/png;base64,${b64(capture)}`;
const logo = `data:image/png;base64,${b64(racine + "web/public/icon-192.png")}`;

const html = `<html><head><meta charset="utf-8"><style>
*{margin:0;box-sizing:border-box}
body{width:1200px;height:630px;overflow:hidden;font-family:Inter,system-ui,sans-serif;background:radial-gradient(120% 120% at 0% 0%,#1d1d22,#0a0a0c 60%);color:#f5f5f7;position:relative}
.marque{position:absolute;left:72px;top:64px;display:flex;align-items:center;gap:18px;font-size:30px;font-weight:600}
.marque img{width:64px;height:64px;border-radius:15px}
h1{position:absolute;left:72px;top:180px;font-size:70px;line-height:1.04;font-weight:900;letter-spacing:-2px}
h1 span{display:block;color:#2dd4bf}
.bas{position:absolute;left:72px;bottom:66px;width:680px;font-size:26px;line-height:1.3;font-weight:600;opacity:.92}
.tel{position:absolute;right:64px;top:96px;width:330px;height:714px;border-radius:52px;background:#0a0a0c;border:3px solid #1f3b37;box-shadow:0 30px 80px rgba(0,0,0,.6),0 0 0 9px #141417;overflow:hidden}
.tel img{width:100%;display:block}
</style></head><body>
<div class="marque"><img src="${logo}">Oxa</div>
<h1>Note tes séances.<span>Oxa garde le fil.</span></h1>
<div class="bas">Tes charges, ton max, ta récup, tes progrès · gratuit</div>
<div class="tel"><img src="${ecran}"></div>
</body></html>`;

const b = await chromium.launch({ executablePath: process.env.CHROMIUM || "/opt/pw-browsers/chromium" });
const pg = await b.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
await pg.setContent(html);
await pg.waitForTimeout(400);
await pg.screenshot({ path: racine + "web/public/og.jpg", type: "jpeg", quality: 88 });
await b.close();
console.log("web/public/og.jpg");
