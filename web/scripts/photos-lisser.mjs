// Contre l'effet « pixelisé » des démonstrations (27/11/2026) : les JPEG d'origine (free-exercise-db)
// ont des blocs de compression, que le traitement « Studio » (scripts/photos.mjs) puis l'AVIF faisaient
// ressortir en quadrillage sur les murs unis, surtout en grand dans la fiche. On lisse légèrement les
// photos déjà traitées (sans repartir des originaux : leurs couleurs restent celles de l'app), on
// redonne un peu de netteté et on réencode un peu plus fin (qualité 60 en petit, 70 en grand).
// Ne traite que les démonstrations (noms de medias/originaux), ni les photos Pixabay ni les machines.
// À ne lancer qu'une fois : node scripts/photos-lisser.mjs [petit|grand]
import { readdirSync, renameSync, statSync } from "node:fs";
import sharp from "sharp";

const ORIG = new URL("../medias/originaux/", import.meta.url).pathname;
const IMG = new URL("../public/img/", import.meta.url).pathname;
const quoi = process.argv[2] || "petit";
const dossier = quoi === "grand" ? IMG + "grand/" : IMG, qualite = quoi === "grand" ? 70 : 60;

const noms = readdirSync(ORIG).filter((f) => f.endsWith(".jpg")).map((f) => f.replace(/\.jpg$/, ".avif"));
let avant = 0, apres = 0, n = 0;
for (const f of noms) {
  const src = dossier + f;
  try { statSync(src); } catch { continue; }
  avant += statSync(src).size;
  await sharp(src).blur(0.7).sharpen({ sigma: 0.5 }).avif({ quality: qualite, effort: 6 }).toFile(src + ".tmp");
  renameSync(src + ".tmp", src);
  apres += statSync(src).size; n++;
}
console.log(`${quoi} : ${n} photos lissées, ${(avant / 1048576).toFixed(1)} Mo → ${(apres / 1048576).toFixed(1)} Mo`);
