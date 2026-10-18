/* Traduction anglaise : chaque texte passé à tr() ou tp() dans le code a son
   entrée dans lib/i18n/en.json, avec les mêmes variables {…}. */
import { afterEach, describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";
import ts from "typescript";
import EN from "@/lib/i18n/en.json";
import { _fixerLangue, rang, tp, tr } from "@/lib/i18n";
import { nb } from "@/lib/logic/core";
import EX_EN from "@/lib/i18n/exercices.en.json";
import { EX } from "@/lib/data/exercices";
import { CORPS, CORPS_F } from "@/lib/data/corps";
import * as R from "@/lib/data/referentiels";
import { AVERTISSEMENT_SOIN, ROUTINES_SOIN, ZONES_SOIN } from "@/lib/data/soin";

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
  it("chaque exercice et chaque fiche existent en anglais", () => {
    const en = EX_EN as Record<string, string[]>;
    expect(Object.keys(EX).filter((k) => !en[k] || en[k].length !== 2 || !en[k][0] || !en[k][1])).toEqual([]);
    const fr = JSON.parse(fs.readFileSync(path.join(RACINE, "public/data/fiches.json"), "utf8"));
    const fen = JSON.parse(fs.readFileSync(path.join(RACINE, "public/data/fiches.en.json"), "utf8"));
    expect(Object.keys(fr).filter((k) => !fen[k] || fen[k].err.length !== fr[k].err.length || !fen[k].e || !fen[k].p)).toEqual([]);
  });
  it("chaque texte des référentiels a sa traduction", () => {
    const l: (string | undefined)[] = [];
    R.SPORTS.forEach((s) => l.push(s.n, s.d));
    [R.PAT, R.PATN, R.PAT2GRP, R.ZONES].forEach((o) => l.push(...Object.values(o)));
    l.push(...Object.values(R.GROUPES).flat(), ...R.AXES, ...R.OBJS, ...R.OBJN, ...R.REGN, ...R.MATN, ...R.BLESN);
    [R.MATCATS, R.TYPES, R.MUSCLES, R.ACC].forEach((x) => x.forEach((y) => l.push(y[1] as string)));
    R.MUSC.forEach((m) => l.push(m.n));
    [...R.SOCLE, ...R.BONUS].forEach((s) => l.push(s.t, s.f, s.dur, s.sp?.[1]));
    Object.values(R.ECHAUF).forEach((e) => { l.push(e.d); e.l.forEach((x) => l.push(x[0], x[1], x[3])); });
    Object.values(R.COLLATION).forEach((c) => { l.push(c.t, c.i, c.n); c.l.forEach((x) => l.push(...x)); });
    [...Object.values(CORPS), ...Object.values(CORPS_F)].forEach((c) => c.forEach((r) => l.push(r.n)));
    ZONES_SOIN.forEach((z) => l.push(z[1]));
    ROUTINES_SOIN.forEach((r) => l.push(r.nom, r.but));
    l.push(AVERTISSEMENT_SOIN);
    expect([...new Set(l.filter((x): x is string => !!x && /[a-z]/i.test(x) && !(x in DICO)))]).toEqual([]);
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
