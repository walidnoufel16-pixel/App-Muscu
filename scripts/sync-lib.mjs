// Recopie la bibliothèque d'exercices de l'app (EX et PAT dans public/index.html)
// dans la fonction Edge generer (LIB et SCHEMAS), pour que l'IA connaisse
// exactement les mêmes exercices que l'app. À relancer après toute modification
// de EX, puis redéployer generer. Sans dépendance : Node seul suffit.
//
//   node scripts/sync-lib.mjs           réécrit supabase/functions/generer/index.ts
//   node scripts/sync-lib.mjs --check   échoue si les deux listes divergent

import { readFileSync, writeFileSync } from "node:fs";

const RACINE = new URL("..", import.meta.url).pathname;
const HTML = RACINE + "public/index.html";
const FN = RACINE + "supabase/functions/generer/index.ts";

/* Extrait un littéral objet `const NOM={...};` du HTML et l'évalue (données pures). */
function objet(src, nom) {
  const debut = src.indexOf(`const ${nom}={`);
  if (debut < 0) throw new Error(`${nom} introuvable dans index.html`);
  let i = src.indexOf("{", debut), prof = 0;
  for (; i < src.length; i++) {
    if (src[i] === "{") prof++;
    if (src[i] === "}" && --prof === 0) break;
  }
  return Function(`"use strict";return (${src.slice(src.indexOf("{", debut), i + 1)})`)();
}

const html = readFileSync(HTML, "utf8");
const EX = objet(html, "EX");
const PAT = objet(html, "PAT");

const q = (s) => JSON.stringify(s);
const lib = Object.entries(EX).map(([id, e]) => {
  for (const champ of ["n", "pat", "eq", "ch"]) if (e[champ] === undefined) throw new Error(`${id} : champ ${champ} manquant`);
  if (!PAT[e.pat]) throw new Error(`${id} : schéma ${e.pat} inconnu`);
  return `  {id:${q(id)},nom:${q(e.n)},pat:${q(e.pat)},eq:${e.eq},ch:${q(e.ch)}},`;
});
const minuscule = (s) => s.charAt(0).toLowerCase() + s.slice(1);
const schemas = Object.entries(PAT).map(([k, v]) => `${k}: ${q(minuscule(v))}`);

const blocLib = `const LIB = [\n${lib.join("\n")}\n];`;
const blocSchemas = `const SCHEMAS: Record<string, string> = {\n  ${schemas.join(", ")},\n};`;

const fn = readFileSync(FN, "utf8");
const neuf = fn
  .replace(/const LIB = \[\n[\s\S]*?\n\];/, blocLib)
  .replace(/const SCHEMAS: Record<string, string> = \{\n[\s\S]*?\n\};/, blocSchemas);
if (neuf === fn && !fn.includes(blocLib)) throw new Error("Blocs LIB ou SCHEMAS introuvables dans generer/index.ts");

if (process.argv.includes("--check")) {
  if (neuf !== fn) { console.error("generer/index.ts n'est pas à jour : lance node scripts/sync-lib.mjs"); process.exit(1); }
  console.log(`Bibliothèques synchronisées : ${lib.length} exercices.`);
} else {
  writeFileSync(FN, neuf);
  console.log(`generer/index.ts mis à jour : ${lib.length} exercices, ${schemas.length} schémas.`);
}
