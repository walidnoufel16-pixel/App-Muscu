/* Produits du commerce pour le suivi des protéines : trouvés par code-barres (Open Food Facts) ou par
   leur nom (recherche de Wger, qui reprend les produits d'Open Food Facts : la recherche d'Open Food
   Facts elle-même est souvent indisponible). Une fois choisi, un produit est gardé dans le compte
   (A.produits) : il resservira sans réseau. Valeurs pour 100 g, données ODbL d'Open Food Facts. */
import type { Produit } from "./types";

const OFF = "https://world.openfoodfacts.org/api/v2/product/";
const WGER = "https://wger.de/api/v2/ingredient/";
type Fetch = typeof fetch;

/** Code-barres EAN-13, EAN-8 ou UPC-A dont la clé de contrôle est juste. */
export function codeValide(s: string) {
  const c = s.replace(/\s/g, "");
  if (!/^(\d{8}|\d{12}|\d{13})$/.test(c)) return false;
  const d = c.split("").map(Number), cle = d.pop()!;
  const somme = d.reverse().reduce((t, x, i) => t + x * (i % 2 === 0 ? 3 : 1), 0);
  return (10 - (somme % 10)) % 10 === cle;
}

const nombre = (x: unknown) => {
  const n = typeof x === "string" ? parseFloat(x) : typeof x === "number" ? x : NaN;
  return Number.isFinite(n) ? n : undefined;
};
const arrondi = (x: number | undefined) => (x == null ? undefined : Math.round(x * 10) / 10);
const propre = (s: unknown) => (typeof s === "string" ? s.trim().replace(/\s+/g, " ") : "");

/** Produit d'une réponse Open Food Facts (api/v2/product), ou null sans protéines connues. */
export function depuisOFF(json: unknown): Produit | null {
  const r = json as { status?: number; product?: Record<string, unknown> & { nutriments?: Record<string, unknown> } };
  const x = r?.product;
  if (!x || r.status === 0) return null;
  const n = x.nutriments ?? {}, p = nombre(n["proteins_100g"]);
  const nom = propre(x.product_name_fr) || propre(x.product_name);
  if (p == null || !nom) return null;
  const portion = nombre(x.serving_quantity);
  return {
    code: propre(x.code) || undefined, n: nom.slice(0, 60), marque: propre(x.brands).split(",")[0].trim().slice(0, 30) || undefined,
    p: arrondi(p)!, kcal: arrondi(nombre(n["energy-kcal_100g"])), g: arrondi(nombre(n["carbohydrates_100g"])), l: arrondi(nombre(n["fat_100g"])),
    portion: portion && portion > 0 && portion < 2000 ? Math.round(portion) : undefined,
  };
}

/** Produit d'un résultat de recherche Wger (ingredient), ou null sans protéines connues. */
export function depuisWger(x: Record<string, unknown>): Produit | null {
  const p = nombre(x.protein), nom = propre(x.name);
  if (p == null || !nom) return null;
  return {
    code: propre(x.code) || undefined, n: nom.slice(0, 60), marque: propre(x.brand).split(",")[0].trim().slice(0, 30) || undefined,
    p: arrondi(p)!, kcal: arrondi(nombre(x.energy)), g: arrondi(nombre(x.carbohydrates)), l: arrondi(nombre(x.fat)),
  };
}

/* requête avec délai maximal : pas de réseau = erreur, l'écran le dit */
async function lire(url: string, f: Fetch, ms = 10000) {
  const ctrl = new AbortController(), t = setTimeout(() => ctrl.abort(), ms);
  try {
    const r = await f(url, { signal: ctrl.signal });
    if (!r.ok) throw new Error("http " + r.status);
    return await r.json();
  } finally {
    clearTimeout(t);
  }
}

/** Produit d'un code-barres, ou null s'il n'est pas dans Open Food Facts (ou sans protéines). */
export async function produitParCode(code: string, f: Fetch = fetch) {
  const c = code.replace(/\s/g, "");
  const champs = "code,product_name,product_name_fr,brands,serving_quantity,nutriments";
  return depuisOFF(await lire(`${OFF}${c}.json?fields=${champs}`, f));
}

/** Produits dont le nom contient la recherche (produits vendus en France d'abord), sans doublons. */
export async function chercherProduits(q: string, f: Fetch = fetch): Promise<Produit[]> {
  const t = q.trim();
  if (t.length < 2) return [];
  const json = await lire(`${WGER}?format=json&language=12&limit=25&name__search=${encodeURIComponent(t)}`, f, 15000);
  const vus = new Set<string>(), out: Produit[] = [];
  for (const x of (json?.results ?? []) as Record<string, unknown>[]) {
    const p = depuisWger(x);
    if (!p) continue;
    const cle = cleProduit(p);
    if (vus.has(cle)) continue;
    vus.add(cle); out.push(p);
  }
  return out.slice(0, 15);
}

const cleProduit = (p: Produit) => p.code || `${p.n}|${p.marque ?? ""}`.toLowerCase();

/** Protéines (g, arrondies) pour une quantité en grammes. */
export const protDe = (p: Produit, g: number) => Math.round((p.p * g) / 100);

/** Garde un produit en tête de « Mes produits » (sans doublon, 30 au plus). */
export function garderProduit(l: Produit[] = [], p: Produit) {
  const k = cleProduit(p);
  return [p, ...l.filter((x) => cleProduit(x) !== k)].slice(0, 30);
}
