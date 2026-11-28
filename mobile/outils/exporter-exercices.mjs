/* Copie le catalogue des exercices du site (web/lib/data/exercices.ts) vers l'appli mobile
   (assets/exercices.json), en ne gardant que ce que l'appli lit : nom, muscles, type de charge, mouvement, matériel et charge
   de départ, soin (exercice de Soin & mobilité) ; et les textes des fiches (web/public/data/fiches.json).
   À relancer après chaque changement du catalogue : node outils/exporter-exercices.mjs */
import { copyFileSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ici = dirname(fileURLToPath(import.meta.url));
const src = readFileSync(join(ici, "../../web/lib/data/exercices.ts"), "utf8");
const debut = src.indexOf("{", src.indexOf("export const EX:"));
const fin = src.indexOf("\n};", debut);
const EX = JSON.parse(src.slice(debut, fin + 2));
const sortie = Object.fromEntries(Object.entries(EX).map(([id, e]) => [id, { n: e.n, m: e.m, ch: e.ch, pat: e.pat, ...(e.pat2 ? { pat2: e.pat2 } : {}), eq: e.eq, d: e.d, ...(e.soin ? { soin: 1 } : {}) }]));
writeFileSync(join(ici, "../assets/exercices.json"), JSON.stringify(sortie) + "\n");
console.log(`${Object.keys(sortie).length} exercices exportés`);
/* textes des fiches (exécution, erreurs fréquentes, comment progresser), tels quels */
copyFileSync(join(ici, "../../web/public/data/fiches.json"), join(ici, "../assets/fiches.json"));
/* les silhouettes du corps (web/lib/data/corps.ts, tracés react-native-body-highlighter, MIT) pour la
   récupération : homme et femme, face et dos, chaque zone avec son mouvement (p) */
const corps = readFileSync(join(ici, "../../web/lib/data/corps.ts"), "utf8");
const objet = (nom) => {
  const d = corps.indexOf("{", corps.indexOf(`export const ${nom}:`));
  return JSON.parse(corps.slice(d, finObjet(d)));
};
function finObjet(d) {
  let n = 0;
  for (let i = d; i < corps.length; i++) {
    if (corps[i] === "{") n++;
    else if (corps[i] === "}" && --n === 0) return i + 1;
  }
  throw new Error("corps.ts illisible");
}
const zones = (R) => Object.fromEntries(Object.entries(R).map(([c, l]) => [c, l.map((r) => (r.p ? { d: r.d, p: r.p } : { d: r.d }))]));
writeFileSync(join(ici, "../assets/corps.json"), JSON.stringify({
  homme: { vb: objet("CORPS_VB"), ...zones(objet("CORPS")) },
  femme: { vb: objet("CORPS_VB_F"), ...zones(objet("CORPS_F")) },
}) + "\n");
