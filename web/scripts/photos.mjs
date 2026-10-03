// Retraitement des photos de démonstration : traitement « Studio ».
// Les murs rouges des photos d'origine (free-exercise-db) deviennent un gris
// anthracite, les autres couleurs sont calmées, puis tout est exporté en AVIF.
// Source : medias/originaux/*.jpg → public/img/*.avif. À relancer seulement si
// le traitement change : node scripts/photos.mjs
import { readdirSync, mkdirSync, statSync } from "node:fs";
import sharp from "sharp";

const SRC = new URL("../medias/originaux/", import.meta.url).pathname;
const OUT = new URL("../public/img/", import.meta.url).pathname;
mkdirSync(OUT, { recursive: true });

async function studio(fichier) {
  const { data, info } = await sharp(fichier).normalise({ lower: 1, upper: 99 }).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const n = info.width * info.height, ch = info.channels, out = Buffer.alloc(n * 3);
  for (let i = 0; i < n; i++) {
    const r = data[i * ch] / 255, g = data[i * ch + 1] / 255, b = data[i * ch + 2] / 255;
    const mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn;
    let h = 0;
    if (d) h = (mx === r ? ((g - b) / d + 6) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4) * 60;
    // proximité du rouge pur (teinte ≈ 2°), pondérée par la saturation : la peau, plus orangée, est épargnée
    const rouge = Math.max(0, 1 - Math.min(Math.abs(h - 2), 360 - Math.abs(h - 2)) / 16) * Math.min(1, d * 3);
    const k = 0.62 * (1 - 0.92 * rouge), sombre = 1 - 0.35 * rouge;
    const gr = 0.3 * r + 0.59 * g + 0.11 * b;
    for (const [c, v] of [[0, r], [1, g], [2, b]]) out[i * 3 + c] = Math.max(0, Math.min(255, (gr + (v - gr) * k) * sombre * 255));
  }
  return sharp(out, { raw: { width: info.width, height: info.height, channels: 3 } }).linear(1.06, -4).sharpen({ sigma: 0.8 });
}

let avant = 0, apres = 0;
const liste = readdirSync(SRC).filter((f) => f.endsWith(".jpg"));
for (const f of liste) {
  const dest = OUT + f.replace(/\.jpg$/, ".avif");
  await (await studio(SRC + f)).avif({ quality: 52, effort: 6 }).toFile(dest);
  avant += statSync(SRC + f).size; apres += statSync(dest).size;
}
console.log(`${liste.length} photos : ${(avant / 1048576).toFixed(1)} Mo en JPEG → ${(apres / 1048576).toFixed(1)} Mo en AVIF`);
