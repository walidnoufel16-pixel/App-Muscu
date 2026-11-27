// Photos d'exercices venues de Pexels (27/11/2026, choisies par Walid) : des photos en portrait,
// alors que l'app les montre en 3:2 (fiche) et au carré (vignette). Un recadrage couperait la tête
// ou les pieds : la photo entière est posée au centre, sur un fond flou et assombri tiré d'elle-même
// (comme les fentes bulgares). Originaux réduits à 2000 px dans medias/pexels (<id>.jpg).
// Le squat barre (sportive petite, au loin) est déjà recadré en 3:2 autour d'elle dans medias/pexels :
// il remplit l'image, sans fond flou.
// Sortie : public/img/ex-<id>.avif (850 px) et public/img/grand/ex-<id>.avif (1275 px).
// Usage : node scripts/photos-pexels.mjs [id …]   (sans id : toutes)
import { readdirSync } from "node:fs";
import sharp from "sharp";

const SRC = new URL("../medias/pexels/", import.meta.url).pathname;
const IMG = new URL("../public/img/", import.meta.url).pathname;
const seuls = process.argv.slice(2);
const ids = readdirSync(SRC).filter((f) => f.endsWith(".jpg")).map((f) => f.slice(0, -4)).filter((id) => !seuls.length || seuls.includes(id));

async function composer(id, W, H) {
  const src = SRC + id + ".jpg";
  const fond = await sharp(src).resize(W, H, { fit: "cover" }).blur(28).modulate({ brightness: 0.55, saturation: 0.8 }).toBuffer();
  const avant = await sharp(src).resize(W, H, { fit: "inside" }).toBuffer({ resolveWithObject: true });
  return sharp(fond).composite([{ input: avant.data, left: Math.round((W - avant.info.width) / 2), top: Math.round((H - avant.info.height) / 2) }]);
}
for (const id of ids) {
  await (await composer(id, 850, 567)).avif({ quality: 58, effort: 6 }).toFile(`${IMG}ex-${id}.avif`);
  await (await composer(id, 1275, 850)).avif({ quality: 62, effort: 6 }).toFile(`${IMG}grand/ex-${id}.avif`);
}
console.log(`${ids.length} photos Pexels prêtes`);
