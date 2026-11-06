/* Lance les scénarios e2e les uns après les autres (plusieurs partagent un port) et rend un code
   d'erreur si l'un échoue. Usage : node tests/e2e/tous.mjs [nom…]   (sans nom : la suite SUITE).
   Prérequis : `npm run build` (dossier out/) et Playwright avec Chromium. */
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

/* Scénarios tenus à jour avec l'interface actuelle : ils bloquent la CI. */
export const SUITE = ["menu", "navigation", "arreter", "visite", "agenda-reco", "cloture", "horsligne", "minuit", "relecture-en"];

const ici = dirname(fileURLToPath(import.meta.url));
const noms = process.argv.slice(2).length ? process.argv.slice(2) : SUITE;
const bilan = [];
for (const n of noms) {
  const t0 = Date.now();
  const r = spawnSync(process.execPath, [join(ici, n + ".mjs")], { encoding: "utf8", timeout: 240_000, env: process.env });
  const sortie = (r.stdout || "") + (r.stderr || "");
  const echecs = sortie.split("\n").filter((l) => l.startsWith("ÉCHEC"));
  const ok = r.status === 0 && !echecs.length;
  bilan.push({ n, ok, s: Math.round((Date.now() - t0) / 1000) });
  console.log(`${ok ? "OK  " : "ÉCHEC"} ${n} (${bilan.at(-1).s} s)`);
  if (!ok) console.log(sortie.split("\n").filter((l) => /ÉCHEC|Error|waiting for|\.mjs:\d+/.test(l)).slice(0, 8).map((l) => "      " + l).join("\n"));
}
const ko = bilan.filter((b) => !b.ok);
console.log(`\n${bilan.length - ko.length}/${bilan.length} scénarios verts`);
process.exit(ko.length ? 1 : 0);
