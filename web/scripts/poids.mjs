// Poids JavaScript chargé à l'ouverture de chaque écran (somme des <script src>
// de la page exportée), brut et compressé gzip — pour mesurer avant/après.
import { readFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { join } from "node:path";
import { gzipSync } from "node:zlib";
const OUT = new URL("../out/", import.meta.url).pathname;
const pages = [];
const parcours = (d, r = "") => readdirSync(d).forEach((n) => {
  const p = join(d, n);
  if (statSync(p).isDirectory()) { if (n !== "_next") parcours(p, r + "/" + n); }
  else if (n === "index.html") pages.push([r || "/", p]);
});
parcours(OUT);
for (const [route, f] of pages.sort()) {
  const html = readFileSync(f, "utf8");
  const srcs = [...new Set([...html.matchAll(/<script[^>]+src="([^"]+)"/g)].map((m) => m[1]))];
  let brut = 0, gz = 0;
  for (const s of srcs) { const p = join(OUT, s); if (!existsSync(p)) continue; const b = readFileSync(p); brut += b.length; gz += gzipSync(b).length; }
  console.log(route.padEnd(22), String(Math.round(brut / 1024)).padStart(5), "Ko brut", String(Math.round(gz / 1024)).padStart(5), "Ko gzip");
}
