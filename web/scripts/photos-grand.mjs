// Photos de démonstration en grand (850 px) pour la fiche d'exercice et la photo en grand de
// Ma salle : medias/originaux/ n'a que des copies en 420 px, trop petites à pleine largeur.
// Les originaux en 850 px sont repris du dépôt free-exercise-db (domaine public), traités comme
// les autres (scripts/photos.mjs, traitement « Studio ») et écrits dans public/img/grand/.
// Pas mis en cache d'avance par le service worker : gardés sur le téléphone quand on les regarde.
// À relancer seulement si de nouvelles photos arrivent : node scripts/photos-grand.mjs
import { existsSync, mkdirSync, mkdtempSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { execFileSync } from "node:child_process";

const ORIG = new URL("../medias/originaux/", import.meta.url).pathname;
const OUT = new URL("../public/img/grand/", import.meta.url).pathname;
const DEPOT = "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/";
mkdirSync(OUT, { recursive: true });

const tmp = mkdtempSync(join(tmpdir(), "photos-grand-"));
const liste = readdirSync(ORIG).filter((f) => f.endsWith(".jpg") && !existsSync(OUT + f.replace(/\.jpg$/, ".avif")));
let ok = 0;
for (let i = 0; i < liste.length; i += 8) {
  await Promise.all(liste.slice(i, i + 8).map(async (f) => {
    const [, nom, n] = f.match(/^(.*)_(\d)\.jpg$/) ?? [];
    if (!nom) return;
    const r = await fetch(`${DEPOT}${encodeURIComponent(nom)}/${n}.jpg`);
    if (!r.ok) return console.warn(`introuvable : ${f} (${r.status})`);
    writeFileSync(join(tmp, f), Buffer.from(await r.arrayBuffer()));
    ok++;
  }));
}
console.log(`${ok} originaux en 850 px téléchargés`);
execFileSync("node", [new URL("./photos.mjs", import.meta.url).pathname], { stdio: "inherit", env: { ...process.env, PHOTOS_SRC: tmp + "/", PHOTOS_OUT: OUT } });
rmSync(tmp, { recursive: true, force: true });
