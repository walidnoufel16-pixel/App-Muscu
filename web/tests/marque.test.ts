/* La marque est Oxa : aucun texte affiché ne doit encore dire « Repère » (les commentaires du code
   et le nom commun « repère » — « Repère de population », « Repères de placement » — restent). */
import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";
import EN from "@/lib/i18n/en.json";

const RACINE = path.resolve(__dirname, "..");
const NOM_COMMUN = /Repères? de (population|placement)/g;

function sources(d: string): string[] {
  return fs.readdirSync(d).flatMap((f) => {
    const p = path.join(d, f);
    return fs.statSync(p).isDirectory() ? (f === "i18n" ? [] : sources(p)) : /\.tsx?$/.test(f) ? [p] : [];
  });
}

describe("marque Oxa", () => {
  it("aucune chaîne du code n'affiche « Repère »", () => {
    const restes: string[] = [];
    for (const f of ["app", "components", "lib"].flatMap((d) => sources(path.join(RACINE, d)))) {
      /* commentaires retirés, puis on cherche dans ce qui reste (chaînes et texte JSX) */
      const src = fs.readFileSync(f, "utf8").replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:])\/\/.*$/gm, "$1").replace(NOM_COMMUN, "");
      src.split("\n").forEach((l, i) => { if (/Repère|REPÈRE/.test(l)) restes.push(`${path.relative(RACINE, f)}:${i + 1}`); });
    }
    expect(restes).toEqual([]);
  });
  it("ni dans les traductions anglaises", () => {
    const restes = Object.entries(EN as Record<string, string>).filter(([fr, en]) => /Repère|REPÈRE/.test(fr.replace(NOM_COMMUN, "")) || /Repère|Repere/i.test(en));
    expect(restes.map(([fr]) => fr)).toEqual([]);
  });
});
