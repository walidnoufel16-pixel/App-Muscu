/* Traduction anglaise : chaque texte passé à tr() ou tp() dans le code a son
   entrée dans lib/i18n/en.json, avec les mêmes variables {…}. */
import { afterEach, describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";
import ts from "typescript";
import EN from "@/lib/i18n/en.json";
import { _fixerLangue, rang, tp, tr } from "@/lib/i18n";
import { nb } from "@/lib/logic/core";

const RACINE = path.resolve(__dirname, "..");
const DICO = EN as Record<string, string>;

/** Textes littéraux passés à tr()/tp() dans app/, components/ et lib/. */
function textes() {
  const out: { t: string; ou: string }[] = [];
  const lire = (f: string) => {
    const src = fs.readFileSync(f, "utf8");
    if (!/\b(tr|tp)\(/.test(src)) return;
    const sf = ts.createSourceFile(f, src, ts.ScriptTarget.Latest, true, f.endsWith("x") ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
    const visite = (n: ts.Node) => {
      if (ts.isCallExpression(n) && ts.isIdentifier(n.expression) && (n.expression.text === "tr" || n.expression.text === "tp")) {
        const args = n.expression.text === "tr" ? n.arguments.slice(0, 1) : n.arguments.slice(1, 3);
        for (const a of args) {
          const ou = `${path.relative(RACINE, f)}:${sf.getLineAndCharacterOfPosition(n.getStart()).line + 1}`;
          if (ts.isStringLiteral(a) || ts.isNoSubstitutionTemplateLiteral(a)) out.push({ t: a.text, ou });
          else if (ts.isConditionalExpression(a)) for (const b of [a.whenTrue, a.whenFalse]) if (ts.isStringLiteral(b)) out.push({ t: b.text, ou });
        }
      }
      ts.forEachChild(n, visite);
    };
    visite(sf);
  };
  const parcourir = (d: string) => {
    for (const f of fs.readdirSync(d)) {
      const p = path.join(d, f);
      if (fs.statSync(p).isDirectory()) parcourir(p);
      else if (/\.tsx?$/.test(f) && !p.includes(`lib${path.sep}i18n`)) lire(p);
    }
  };
  ["app", "components", "lib"].forEach((d) => parcourir(path.join(RACINE, d)));
  return out;
}
const vars = (s: string) => [...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort();

describe("traduction anglaise", () => {
  afterEach(() => _fixerLangue("fr"));
  const T = textes();

  it("le code utilise bien tr()", () => expect(T.length).toBeGreaterThan(1000));
  it("chaque texte a sa traduction", () => {
    const manque = [...new Set(T.filter((x) => !(x.t in DICO)).map((x) => `${x.ou}  ${x.t}`))];
    if (process.env.DUMP) fs.writeFileSync(process.env.DUMP, JSON.stringify(manque, null, 1));
    expect(manque).toEqual([]);
  });
  it("mêmes variables des deux côtés", () => {
    const diff = Object.entries(DICO).filter(([fr, en]) => vars(fr).join() !== vars(en).join()).map(([fr]) => fr);
    expect(diff).toEqual([]);
  });
  it("aucune traduction vide ni accentuée", () => {
    const mauvais = Object.entries(DICO).filter(([, en]) => !en.trim() || /[àâçéèêëîïôûùœ]/i.test(en.replace(/Repère|REPÈRE/g, "")));
    if (process.env.DUMP) fs.writeFileSync(process.env.DUMP + ".2", JSON.stringify(mauvais, null, 1));
    expect(mauvais.map(([fr]) => fr)).toEqual([]);
  });
  it("tr, tp, nb et rang selon la langue", () => {
    expect(tr("Semaine {n}", { n: 3 })).toBe("Semaine 3");
    expect(tp(0, "{n} jour", "{n} jours")).toBe("0 jour");
    expect(nb(2.5)).toBe("2,5");
    expect(rang(1)).toBe("1er");
    _fixerLangue("en");
    expect(tr("Tout effacer")).not.toBe("Tout effacer");
    expect(tr("texte absent du dictionnaire")).toBe("texte absent du dictionnaire");
    expect(tp(0, "{n} jour", "{n} jours")).toBe("0 days");
    expect(tp(1, "{n} jour", "{n} jours")).toBe("1 day");
    expect(nb(2.5)).toBe("2.5");
    expect([1, 2, 3, 4, 11, 22].map(rang)).toEqual(["1st", "2nd", "3rd", "4th", "11th", "22nd"]);
  });
});
