// Recopie la bibliothèque d'exercices de l'app (EX et PAT dans web/lib/data/)
// dans la fonction Edge generer (LIB et SCHEMAS), pour que l'IA connaisse
// exactement les mêmes exercices que l'app. À relancer après toute modification
// de EX, puis redéployer generer. Sans dépendance : Node seul suffit.
//
//   node scripts/sync-lib.mjs           réécrit supabase/functions/generer/index.ts
//   node scripts/sync-lib.mjs --check   échoue si les deux listes divergent

import { readFileSync, writeFileSync } from "node:fs";

const RACINE = new URL("..", import.meta.url).pathname;
const DATA = RACINE + "web/lib/data/";
const FN = RACINE + "supabase/functions/generer/index.ts";

/* Extrait un littéral objet `export const NOM: Type = {...};` d'un fichier de données et l'évalue (données pures). */
function objet(src, nom) {
  const debut = src.search(new RegExp(`export const ${nom}\\b[^=]*= \\{`));
  if (debut < 0) throw new Error(`${nom} introuvable dans web/lib/data`);
  let i = src.indexOf("{", debut), prof = 0;
  for (; i < src.length; i++) {
    if (src[i] === "{") prof++;
    if (src[i] === "}" && --prof === 0) break;
  }
  return Function(`"use strict";return (${src.slice(src.indexOf("{", debut), i + 1)})`)();
}

const EX = objet(readFileSync(DATA + "exercices.ts", "utf8"), "EX");
const PAT = objet(readFileSync(DATA + "referentiels.ts", "utf8"), "PAT");

const q = (s) => JSON.stringify(s);
const lib = Object.entries(EX).map(([id, e]) => {
  for (const champ of ["n", "pat", "eq", "ch"]) if (e[champ] === undefined) throw new Error(`${id} : champ ${champ} manquant`);
  if (!PAT[e.pat]) throw new Error(`${id} : schéma ${e.pat} inconnu`);
  /* acc : matériel en plus exigé (kb, el) · ou : matériel en plus qui suffit aussi */
  const plus = (e.acc ? `,acc:${q(e.acc)}` : "") + (e.ou ? `,ou:${q(e.ou)}` : "");
  return `  {id:${q(id)},nom:${q(e.n)},pat:${q(e.pat)},eq:${e.eq},ch:${q(e.ch)}${plus}},`;
});
const minuscule = (s) => s.charAt(0).toLowerCase() + s.slice(1);
const schemas = Object.entries(PAT).map(([k, v]) => `${k}: ${q(minuscule(v))}`);

const blocLib = `const LIB: Exo[] = [\n${lib.join("\n")}\n];`;
const blocSchemas = `const SCHEMAS: Record<string, string> = {\n  ${schemas.join(", ")},\n};`;

const fn = readFileSync(FN, "utf8");
const neuf = fn
  .replace(/const LIB: Exo\[\] = \[\n[\s\S]*?\n\];/, blocLib)
  .replace(/const SCHEMAS: Record<string, string> = \{\n[\s\S]*?\n\};/, blocSchemas);
if (neuf === fn && !fn.includes(blocLib)) throw new Error("Blocs LIB ou SCHEMAS introuvables dans generer/index.ts");

if (process.argv.includes("--check")) {
  if (neuf !== fn) { console.error("generer/index.ts n'est pas à jour : lance node scripts/sync-lib.mjs"); process.exit(1); }
  console.log(`Bibliothèques synchronisées : ${lib.length} exercices.`);
} else {
  writeFileSync(FN, neuf);
  console.log(`generer/index.ts mis à jour : ${lib.length} exercices, ${schemas.length} schémas.`);
}
