"use client";

/* Les 3 assiettes d'un plat, selon l'objectif (fiche recette de l'onglet Repas ; maquette validée
   le 16 novembre 2026). Même plat pour tous : chacun prend la colonne de son objectif. Les
   fractions et le classement des ingrédients viennent de lib/logic/assiette.ts. */
import { tr } from "@/lib/i18n";
import { assietteDe, FRACTIONS, PART_PLAT, protParAssiette, texteFraction, type Objectif } from "@/lib/logic/assiette";
import { emojiDe } from "@/lib/data/aliments";
import { nomAliment } from "@/lib/logic/repas";
import type { Recette } from "@/lib/data/recettes";
import { cn } from "@/lib/utils";

const OBJECTIFS: { o: Objectif; n: () => string }[] = [
  { o: "muscle", n: () => tr("Prise de muscle") },
  { o: "seche", n: () => tr("Sèche") },
  { o: "forme", n: () => tr("Garder la forme") },
];
const C = { l: "var(--aliment-legumes)", p: "var(--aliment-proteines)", f: "var(--aliment-feculents)", plat: "var(--aliment-plat)" };

type Part = { v: number; c: string; e: string };
/** Une assiette vue de dessus : le premier secteur part de midi vers la gauche (les légumes),
    les suivants de midi vers la droite. Une assiette normale est dessinée à 84 %. */
function Assiette({ parts, grande, taille = 72 }: { parts: Part[]; grande: boolean; taille?: number }) {
  const pt = (a: number, r = 41) => [50 + r * Math.cos((a * Math.PI) / 180), 50 + r * Math.sin((a * Math.PI) / 180)];
  const secteur = (a1: number, a2: number, c: string, e: string, k: number) => {
    const [x1, y1] = pt(a1), [x2, y2] = pt(a2), [xe, ye] = pt((a1 + a2) / 2, 24);
    const plein = a2 - a1 >= 359.9;
    return (
      <g key={k}>
        {plein ? <circle cx="50" cy="50" r="41" fill={c} /> : <path d={`M50,50 L${x1},${y1} A41,41 0 ${a2 - a1 > 180 ? 1 : 0} 1 ${x2},${y2} Z`} fill={c} className="stroke-[var(--bord-assiette)]" strokeWidth="2" strokeLinejoin="round" />}
        <text x={plein ? 50 : xe} y={(plein ? 50 : ye) + 4} textAnchor="middle" fontSize="11">{e}</text>
      </g>
    );
  };
  const [a, ...reste] = parts;
  let cur = -90;
  const morceaux = [secteur(-90 - 360 * a.v, -90, a.c, a.e, 0), ...reste.map((p, k) => { const s = secteur(cur, cur + 360 * p.v, p.c, p.e, k + 1); cur += 360 * p.v; return s; })];
  return (
    <svg viewBox="0 0 100 100" width={taille} height={taille} aria-hidden className="[--bord-assiette:#ffffff] dark:[--bord-assiette:#26262d]">
      <g transform={grande ? undefined : "translate(50 50) scale(.84) translate(-50 -50)"}>
        <circle cx="50" cy="50" r="49.5" className="fill-[var(--bord-assiette)] stroke-border" strokeWidth="1" />
        {morceaux}
      </g>
    </svg>
  );
}

type Ligne = { nom: string; cat: string; c: string; fr: (o: Objectif) => number; reste?: boolean };

export function AssiettesObjectif({ r, mineur = false }: { r: Recette; mineur?: boolean }) {
  const a = assietteDe(r);
  if (a.bol)
    return (
      <section className="mt-4 rounded-[18px] bg-card p-4" aria-label={tr("Ton assiette, selon ton objectif")}>
        <h3 className="titre text-[17px]">{tr("Ton assiette, selon ton objectif")}</h3>
        <p className="mt-1 text-[13.5px] leading-snug text-muted-foreground">
          {tr("Se sert en bol, avec du pain : un grand bol et deux tranches en prise de muscle, un bol normal et une tranche sinon. À côté : {a}.", { a: (a.accomp ?? "").toLowerCase() })}
        </p>
      </section>
    );
  const noms = (l: string[]) => l.slice(0, 2).map(nomAliment).join(", ") + (l.length > 2 ? "…" : "");
  const e1 = (l: string[], defaut: string) => (l[0] ? emojiDe(l[0]) : defaut);
  let lignes: Ligne[], parts: (o: Objectif) => Part[];
  if (a.type === "complet") {
    const part = (o: Objectif) => (a.accomp ? PART_PLAT[o] : 1);
    lignes = [{ nom: tr("Le plat"), cat: tr("tout est mélangé"), c: C.plat, fr: part }];
    if (a.accomp) lignes.push({ nom: tr("Légumes à côté"), cat: a.accomp, c: C.l, fr: (o) => 1 - PART_PLAT[o] });
    parts = (o) => (a.accomp ? [{ v: 1 - PART_PLAT[o], c: C.l, e: "🥗" }, { v: PART_PLAT[o], c: C.plat, e: emojiDe(a.p[0]) }] : [{ v: 1, c: C.plat, e: emojiDe(a.p[0]) }]);
  } else {
    const mijote = a.type === "mijote";
    lignes = [
      mijote ? { nom: tr("Légumes à côté"), cat: a.accomp ?? "", c: C.l, fr: (o) => FRACTIONS[o].l, reste: true }
        : { nom: noms(a.l), cat: tr("légumes"), c: C.l, fr: (o) => FRACTIONS[o].l, reste: true },
      { nom: mijote ? tr("Le plat mijoté") : noms(a.p), cat: mijote ? tr("protéines et sauce") : tr("protéines"), c: C.p, fr: (o) => FRACTIONS[o].p },
      { nom: a.sansFeculent ? tr("Pain ou quinoa, à ajouter") : noms(a.f), cat: tr("féculents"), c: C.f, fr: (o) => FRACTIONS[o].f },
    ];
    parts = (o) => [
      { v: FRACTIONS[o].l, c: C.l, e: mijote ? "🥗" : e1(a.l, "🥗") },
      { v: FRACTIONS[o].p, c: C.p, e: e1(a.p, "🍗") },
      { v: FRACTIONS[o].f, c: C.f, e: a.sansFeculent ? "🍞" : e1(a.f, "🍚") },
    ];
  }
  const prot = protParAssiette(r, a);
  const grille = "grid grid-cols-[minmax(0,1.3fr)_repeat(3,minmax(0,1fr))] gap-1.5";
  const fraction = (l: Ligne, o: Objectif) => (l.reste && o === "seche" ? <span className="text-[12.5px]">{tr("le reste")}</span> : texteFraction(l.fr(o)) || "—");
  return (
    <section className="mt-4 rounded-[18px] bg-card p-4" aria-label={tr("Ton assiette, selon ton objectif")}>
      <h3 className="titre text-[17px]">{tr("Ton assiette, selon ton objectif")}</h3>
      <p className="mt-0.5 text-[12.5px] text-muted-foreground">{tr("Même plat pour tous : prends la colonne de ton objectif.")}</p>
      <div className={cn(grille, "mt-3 items-end")}>
        <span />
        {OBJECTIFS.map(({ o, n }) => (
          <div key={o} className="flex flex-col items-center text-center">
            <Assiette parts={parts(o)} grande={FRACTIONS[o].grande} />
            <span className="mt-1 text-[11.5px] leading-tight font-semibold">{n()}</span>
            <span className="text-[11px] text-muted-foreground">{FRACTIONS[o].grande ? tr("grande assiette") : tr("assiette normale")}</span>
          </div>
        ))}
      </div>
      <div className="mt-2">
        {lignes.map((l) => (
          <div key={l.cat} className={cn(grille, "items-center border-t border-border/60 py-2")}>
            <span className="flex min-w-0 items-center gap-2">
              <span aria-hidden className="size-3 shrink-0 rounded-[4px]" style={{ background: l.c }} />
              <span className="min-w-0">
                <span className="block text-[13.5px] leading-tight font-semibold">{l.nom}</span>
                <span className="block text-[11px] leading-snug text-muted-foreground">{l.cat}</span>
              </span>
            </span>
            {OBJECTIFS.map(({ o }) => <span key={o} className="text-center text-[18px] font-semibold">{fraction(l, o)}</span>)}
          </div>
        ))}
        <div className={cn(grille, "items-center border-t border-border/60 pt-2")}>
          <span className="text-[11.5px] leading-tight text-muted-foreground">{tr("Protéines par assiette")}</span>
          {OBJECTIFS.map(({ o }) => <span key={o} className="text-center text-[11.5px] text-muted-foreground">≈ <b className="num text-[15px] text-foreground">{prot[o]}</b> {tr("g")}</span>)}
        </div>
      </div>
      {a.type === "separe" && a.accomp && <p className="mt-2 text-[12.5px] leading-snug">{tr("Pas assez de légumes dans la recette : complète avec {a}.", { a: a.accomp.toLowerCase() })}</p>}
      {a.gras.length > 0 && <p className="mt-2 text-[12.5px] leading-snug text-muted-foreground">{tr("Gras : {l}, en petite quantité (environ une cuillère à soupe).", { l: a.gras.map(nomAliment).join(", ").toLowerCase() })}</p>}
      <p className="mt-2 text-[12px] leading-snug text-muted-foreground">
        {tr("Grande assiette ≈ 28 cm, normale ≈ 24 cm. Remplis d'abord les légumes.")}{!mineur && " " + tr("En sèche, ressers-toi en légumes seulement.")}
      </p>
    </section>
  );
}
