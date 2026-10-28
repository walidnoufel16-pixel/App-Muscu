/* Budget des courses : prix des aliments (référence ou prix de l'utilisateur), coût d'une recette,
   estimation de la liste de courses en fourchette, échanges de recettes moins chères et
   ajustement de la semaine au budget. Logique pure.
   Deux façons de compter la liste : ce qu'on paie en caisse (emballages entiers, par défaut)
   ou ce que la semaine consomme. */
import { langue } from "@/lib/i18n";
import { ALIM } from "@/lib/data/aliments";
import { FOURCHETTE, PRIX } from "@/lib/data/prix";
import { RECETTES, type Recette } from "@/lib/data/recettes";
import { listeCourses, macros, planSemaine, portion, recettesPour, type Besoins, type CaseSemaine } from "./repas";
import type { ArticleLibre, CreneauRepas, PrefsRepas, SemaineRepas } from "./types";

type Perso = Record<string, number> | undefined;

/** Prix au kilo d'un aliment : celui de l'utilisateur s'il l'a corrigé, sinon la référence. */
export const prixKg = (id: string, perso?: Perso): number | undefined => perso?.[id] ?? PRIX[id]?.[0];
/** Emballage courant, en grammes (500 pour un paquet de pâtes). */
export const emballage = (id: string): number | undefined => PRIX[id]?.[1];

/** Coût de `g` grammes d'un aliment : la quantité consommée, ou en emballages entiers. */
export function coutAliment(id: string, g: number, caisse = false, perso?: Perso) {
  const k = prixKg(id, perso);
  if (k == null || g <= 0) return 0;
  const pack = emballage(id) ?? g;
  /* 505 g pour un paquet de 500 g : un seul paquet */
  const q = caisse ? Math.max(1, Math.ceil(g / pack - 0.05)) * pack : g;
  return (k * q) / 1000;
}

/** Coût de `f` portions d'une recette (ce qu'elle consomme ; sel, huile et épices non comptés). */
export function coutRecette(r: Recette, f = 1, perso?: Perso) {
  let t = 0;
  for (const [id, g] of r.ing) if (ALIM[id] && ALIM[id].ray !== "base") t += coutAliment(id, g * f, false, perso);
  return t;
}

/** « 1,80 € » ou « €1.80 » ; au-delà de 20 €, sans centimes. */
export function euros(x: number) {
  const en = langue() === "en";
  return new Intl.NumberFormat(en ? "en-GB" : "fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: x >= 20 ? 0 : 2, minimumFractionDigits: x >= 20 ? 0 : 2 }).format(x);
}

export type Estimation = {
  total: number; bas: number; haut: number;
  rayons: { k: string; n: string; total: number }[];
  /* coût de chaque ligne de la liste */
  lignes: Record<string, number>;
  libres: number;
};
/** Estimation de la liste : total, fourchette selon le magasin, détail par rayon et par ligne.
    La fourchette ne porte que sur les prix de référence : ceux de l'utilisateur et des articles sont exacts. */
export function estimer(liste: ReturnType<typeof listeCourses>, articles: ArticleLibre[] = [], caisse = true, perso?: Perso): Estimation {
  const lignes: Record<string, number> = {};
  let ref = 0, exact = 0;
  const rayons = liste.map((r) => {
    let t = 0;
    for (const x of r.l) {
      const c = coutAliment(x.id, x.g, caisse, perso);
      lignes[x.id] = c; t += c;
      if (perso?.[x.id] != null) exact += c; else ref += c;
    }
    return { k: r.k, n: r.n, total: t };
  });
  const libres = articles.reduce((s, a) => s + (a.prix ?? 0), 0);
  exact += libres;
  return { total: ref + exact, bas: ref * FOURCHETTE[0] + exact, haut: ref * FOURCHETTE[1] + exact, rayons, lignes, libres };
}

/** Estimation de la semaine telle qu'elle est planifiée. */
export function estimerSemaine(p: PrefsRepas, S: SemaineRepas, b: Besoins) {
  const liste = listeCourses(planSemaine(p, S), b, p.pers ?? 1, p.stock ?? []);
  return estimer(liste, S.articles, !p.conso, p.prix);
}

/* même type de recette que la case (comme dans planSemaine) */
const memeType = (c: CreneauRepas) => (x: Recette) => (c === "matin" ? x.m === "matin" : c === "collation" ? x.m === "collation" && !x.t.includes("dessert") : x.m === "repas");
const avecChoix = (S: SemaineRepas, k: CaseSemaine, r: Recette): SemaineRepas => ({ ...S, choix: { ...S.choix, [`${k.jour}|${k.c}`]: r.id } });

export type Echange = { k: CaseSemaine; vers: Recette; gain: number };
/* Pour chaque repas, les `parRepas` recettes compatibles les moins chères du même type, pas déjà
   dans la semaine, avec au moins 85 % des protéines ; le gain est mesuré sur la liste entière
   (une recette remplacée peut en déplacer une autre). */
function candidats(p: PrefsRepas, S: SemaineRepas, b: Besoins, parRepas: number): Echange[] {
  const cases = planSemaine(p, S), deja = new Set(cases.map((x) => x.r.id));
  const avant = estimerSemaine(p, S, b).total, ok = recettesPour(p), tous: Echange[] = [];
  for (const k of cases) {
    if (k.reste) continue;
    const f = portion(k.r, b, k.c), cout = coutRecette(k.r, f, p.prix), prot = macros(k.r, f).p;
    const moinsCheres = ok
      .filter((x) => memeType(k.c)(x) && !deja.has(x.id) && macros(x, portion(x, b, k.c)).p >= 0.85 * prot)
      .map((x) => ({ x, c: coutRecette(x, portion(x, b, k.c), p.prix) }))
      .filter((y) => y.c < cout - 0.2)
      .sort((a, z) => a.c - z.c)
      .slice(0, parRepas);
    for (const { x } of moinsCheres) {
      const gain = avant - estimerSemaine(p, avecChoix(S, k, x), b).total;
      if (gain >= 0.5) tous.push({ k, vers: x, gain });
    }
  }
  return tous.sort((a, z) => z.gain - a.gain);
}
/** Échanges proposés pour alléger la liste : meilleurs gains d'abord, jamais deux fois la même
    recette proposée ni deux fois le même repas. */
export function echanges(p: PrefsRepas, S: SemaineRepas, b: Besoins, n = 3): Echange[] {
  const out: Echange[] = [], vers = new Set<string>(), repas = new Set<string>();
  for (const e of candidats(p, S, b, 3)) {
    const cle = `${e.k.jour}|${e.k.c}`;
    if (vers.has(e.vers.id) || repas.has(cle)) continue;
    vers.add(e.vers.id); repas.add(cle); out.push(e);
    if (out.length === n) break;
  }
  return out;
}
export const appliquer = (S: SemaineRepas, e: Echange) => avecChoix(S, e.k, e.vers);

/** « Ajuster ma semaine au budget » : tant que la liste dépasse le budget, remplace le repas dont
    la recette la moins chère fait gagner le plus. Rend la semaine ajustée (peut rester au-dessus
    si rien ne suffit). */
export function ajuster(p: PrefsRepas, S: SemaineRepas, b: Besoins): SemaineRepas {
  let s = S;
  for (let i = 0; i < 25 && p.budget && estimerSemaine(p, s, b).total > p.budget; i++) {
    const e = candidats(p, s, b, 1)[0];
    if (!e) break;
    s = appliquer(s, e);
  }
  return s;
}

/** Recette « petit budget » : dans le tiers le moins cher de son moment (petit-déjeuner, plat, collation),
    la portion de base. Un seuil fixe ne garderait que des collations. */
export function petitBudget(r: Recette, perso?: Perso) {
  const couts = RECETTES.filter((x) => x.m === r.m).map((x) => coutRecette(x, 1, perso)).sort((a, z) => a - z);
  return coutRecette(r, 1, perso) <= couts[Math.floor((couts.length - 1) / 3)];
}
