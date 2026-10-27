/* Partie Repas : besoins du jour, portions, recettes compatibles, « avec ce que j'ai »,
   semaine de repas et liste de courses. Logique pure.
   Démarche : un besoin estimé une fois (Mifflin-St Jeor × activité réelle, ajusté à l'objectif),
   traduit en portions faciles (méthode de la main) ; les recettes sont mises à la portion de
   chacun d'après les protéines visées pour ce repas. */
import { langue, tr } from "@/lib/i18n";
import { ALIM, emojiDe, PERSO_EMOJI, RAYONS, type Rayon } from "@/lib/data/aliments";
import { RECETTES, type Moment, type Recette } from "@/lib/data/recettes";
import { objectifProteines, poidsDe } from "./nutrition";
import type { AlimentPerso, ArticleLibre, CreneauRepas, Etat, PrefsRepas, Reponses, SemaineRepas } from "./types";

export const R: Record<string, Recette> = Object.fromEntries(RECETTES.map((r) => [r.id, r]));
const en = () => langue() === "en";
export const nomRecette = (r: Recette) => (en() ? r.en : r.n);
/* aliments ajoutés par l'utilisateur : noms et rayons, tenus à jour à chaque lecture des préférences */
const PERSO: Record<string, AlimentPerso> = {};
function majPerso(l: AlimentPerso[] = []) {
  for (const a of l) { PERSO[a.id] = a; PERSO_EMOJI[a.id] = a.e; }
}
export const estPerso = (id: string) => id.startsWith("perso:");
export const nomAliment = (id: string) => (en() ? ALIM[id]?.en : ALIM[id]?.n) ?? PERSO[id]?.n ?? id;
/** « 🥦 Brocoli » */
export const avecEmoji = (id: string) => `${emojiDe(id)} ${nomAliment(id)}`;

/* ---------------- préférences ---------------- */
export const REGIMES = [tr("Omnivore"), tr("Pescétarien"), tr("Végétarien"), tr("Vegan")];
export const CULTES = [tr("Aucun"), tr("Halal"), tr("Casher")];
export const ALLERGIES: [string, string][] = [["l", tr("Lactose")], ["g", tr("Gluten")], ["o", tr("Œufs")], ["c", tr("Fruits à coque")], ["r", tr("Arachide")], ["p", tr("Poisson et fruits de mer")]];
export const TEMPS = [tr("15 min max"), tr("30 min max"), tr("Pas de limite")];
export const MATERIELS: [string, string][] = [["plaques", tr("Plaques")], ["four", tr("Four")], ["micro", tr("Micro-ondes")], ["mixeur", tr("Mixeur")]];
export function prefsDe(A: Reponses): PrefsRepas {
  const p: PrefsRepas = { regime: 0, allergies: [], exclus: [], temps: 2, mat: ["plaques", "four", "micro", "mixeur"], pers: 1, stock: [], perso: [], ...(A.repas || {}) };
  majPerso(p.perso);
  return p;
}
/** Un aliment ajouté par l'utilisateur, avec un identifiant tiré de son nom. */
export function nouvelAliment(n: string, ray: string, e: string, existants: AlimentPerso[] = []): AlimentPerso {
  const base = "perso:" + n.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40);
  let id = base, k = 2;
  while (existants.some((a) => a.id === id)) id = `${base}-${k++}`;
  return { id, n: n.trim().slice(0, 40), ray, e };
}
/** Emojis proposés pour un aliment ajouté, d'après le rayon. */
export const EMOJIS_RAYON: Record<string, string[]> = {
  leg: ["🥬", "🥦", "🥕", "🧅", "🫑", "🍆", "🥒", "🌽"], fru: ["🍎", "🍐", "🍑", "🍓", "🍇", "🍍", "🍒", "🥝"],
  prot: ["🍗", "🥩", "🐟", "🦐", "🥚", "🧊", "🦃", "🥓"], lait: ["🥛", "🧀", "🥣", "🧈", "🍦", "🥤", "🍶", "🧋"],
  fec: ["🍞", "🍚", "🍝", "🥔", "🌾", "🥐", "🫓", "🥯"], epi: ["🫙", "🥫", "🍯", "🍫", "🥜", "🧂", "🌶️", "🫒"],
  autre: ["🛒", "🧻", "🧽", "🧴", "🥤", "☕", "🍵", "🍪"],
};

/* ---------------- recettes ---------------- */
const marques = (r: Recette) => r.ing.map(([id]) => ALIM[id]?.m || "").join("");
/** Régime d'une recette, déduit de ses ingrédients : 0 viande · 1 poisson · 2 végétarien · 3 vegan. */
export function regimeDe(r: Recette) {
  const m = marques(r);
  return m.includes("v") ? 0 : m.includes("p") ? 1 : m.includes("a") ? 2 : 3;
}
export const allergenesDe = (r: Recette) => ALLERGIES.map(([k]) => k).filter((k) => marques(r).includes(k));

/** Halal : sans porc. Casher : sans porc ni fruits de mer, et jamais viande et laitage ensemble. */
export function conformeCulte(r: Recette, culte = 0) {
  const m = marques(r);
  if (culte >= 1 && m.includes("h")) return false;
  if (culte === 2 && (m.includes("k") || (m.includes("v") && m.includes("l")))) return false;
  return true;
}
export function compatible(r: Recette, p: PrefsRepas) {
  if (regimeDe(r) < p.regime) return false;
  if (!conformeCulte(r, p.culte)) return false;
  if (p.allergies.some((a) => marques(r).includes(a))) return false;
  if (r.ing.some(([id]) => p.exclus.includes(id))) return false;
  if (r.min > [15, 30, Infinity][p.temps ?? 2]) return false;
  return r.mat.every((m) => p.mat.includes(m));
}
export const recettesPour = (p: PrefsRepas) => RECETTES.filter((r) => compatible(r, p));

export type Macros = { kcal: number; p: number; g: number; l: number };
/** Valeurs d'une recette pour `f` portions (calculées à partir des aliments). */
export function macros(r: Recette, f = 1): Macros {
  const t = { kcal: 0, p: 0, g: 0, l: 0 };
  for (const [id, g] of r.ing) {
    const a = ALIM[id];
    if (!a) continue;
    t.kcal += (a.kcal * g * f) / 100; t.p += (a.p * g * f) / 100; t.g += (a.g * g * f) / 100; t.l += (a.l * g * f) / 100;
  }
  return { kcal: Math.round(t.kcal), p: Math.round(t.p), g: Math.round(t.g), l: Math.round(t.l) };
}

/* ---------------- besoins ---------------- */
/** Part des besoins du jour par moment (un jour de séance, la collation compte plus). */
const PART: Record<CreneauRepas, [number, number]> = { matin: [0.25, 0.25], dejeuner: [0.35, 0.3], diner: [0.3, 0.3], collation: [0.1, 0.15] };
export const part = (c: CreneauRepas, seance: boolean) => PART[c][seance ? 1 : 0];
export const creneauDe = (m: Moment): CreneauRepas => (m === "matin" ? "matin" : m === "collation" ? "collation" : "dejeuner");

export type Besoins = { kcal: number; p: number; g: number; l: number; seance: boolean };
/** Jours d'activité des 7 derniers jours (musculation, cardio, course). */
export function joursActifs(E: Etat, auj = Date.now()) {
  const jours = new Set<string>();
  const iso = (t: number) => new Date(t).toISOString().slice(0, 10);
  const depuis = iso(auj - 6 * 864e5);
  for (const l of E.HIST || []) if (l.d >= depuis) jours.add(l.d);
  for (const c of E.CARDIO || []) if (iso(c.ts) >= depuis) jours.add(iso(c.ts));
  for (const s of (E.SORTIES || []) as { d?: string }[]) if (s.d && s.d >= depuis) jours.add(s.d);
  return jours.size;
}
/** Besoins du jour : énergie (Mifflin-St Jeor × activité), protéines (objectif de l'app),
    lipides (≥ 0,8 g/kg), le reste en glucides. Ajusté à l'objectif, jamais sous 1,1 × le métabolisme de base. */
export function besoins(E: Etat, seance: boolean): Besoins {
  const A = E.A, kg = poidsDe(A) ?? 70, sexe = A.sexe ?? 2;
  const cm = A.profil?.["Taille"] ?? (sexe === 1 ? 165 : 177), age = A.profil?.["Âge"] ?? 30;
  const base = 10 * kg + 6.25 * cm - 5 * age + (sexe === 0 ? 5 : sexe === 1 ? -161 : -78);
  const nap = Math.min(1.75, 1.4 + 0.05 * joursActifs(E)) * (seance ? 1.08 : 0.97);
  const objectif = [1.1, 1.05, 0.85, 1][A.objectif ?? 3] ?? 1;
  const kcal = Math.max(base * 1.1, base * nap * objectif);
  const p = objectifProteines(A), l = Math.max(0.8 * kg, (0.27 * kcal) / 9), g = Math.max(2 * kg, (kcal - p * 4 - l * 9) / 4);
  const r5 = (x: number) => Math.round(x / 5) * 5;
  return { kcal: Math.round(kcal / 10) * 10, p, g: r5(g), l: r5(l), seance };
}

/** Méthode de la main pour un repas : paumes de protéines (~25 g), poings de féculents
    (~30 g de glucides), pouces de matières grasses (~8 g), poings de légumes. */
export function mains(b: Besoins, c: CreneauRepas) {
  const s = part(c, b.seance), demi = (x: number) => Math.max(0.5, Math.round(x * 2) / 2);
  return { paumes: demi((b.p * s) / 25), poings: demi((b.g * s) / 30), pouces: demi((b.l * s) / 8), legumes: c === "dejeuner" || c === "diner" ? 2 : c === "matin" ? 0.5 : 0 };
}

/** Portions d'une recette pour une personne : de quoi atteindre les protéines visées à ce repas
    (entre ¾ et 1¾ de la recette de base, par quarts ; les desserts restent à une portion). */
export function portion(r: Recette, b: Besoins, c: CreneauRepas = creneauDe(r.m)) {
  if (r.t.includes("dessert")) return 1;
  const vise = b.p * part(c, b.seance), a = macros(r).p || 1;
  const [mn, mx] = r.m === "collation" ? [0.75, 1.5] : [0.75, 1.75];
  return Math.min(mx, Math.max(mn, Math.round((vise / a) * 4) / 4));
}

/* ---------------- quantités affichées ---------------- */
const LIQUIDES = new Set(["lait", "lait_soja", "lait_coco"]);
/** « 2 œufs », « 150 g », « 250 ml », « 1 c. à soupe »… */
export function quantite(id: string, g: number, entier = false): string {
  const a = ALIM[id];
  if (!a) return `${Math.round(g)} g`;
  if (id === "sel_poivre") return tr("à ton goût");
  if (id === "huile" || id === "moutarde" || id === "vinaigre" || id === "sauce_soja" || id === "miel" || id === "sirop_erable") {
    if (g < 7) return tr("1 c. à café");
    const n = Math.max(1, Math.round(g / 10));
    return tr(n > 1 ? "{n} c. à soupe" : "{n} c. à soupe", { n });
  }
  if (a.ray === "base" && g <= 5) return tr("1 c. à café");
  if (a.u) {
    const n = g / a.u[2];
    if (n >= 0.75 || id === "oeuf" || id === "ail") {
      /* liste de courses : on achète des unités entières */
      const k = entier ? Math.max(1, Math.ceil(n - 0.1)) : Math.max(id === "oeuf" || id === "ail" ? 1 : 0.5, Math.round(n * 2) / 2);
      const nom = en() ? a.u[1] : a.u[0];
      return `${String(k).replace(".", en() ? "." : ",")} ${k > 1 ? pluriel(nom) : nom}`;
    }
  }
  const unite = LIQUIDES.has(id) ? "ml" : "g";
  if (g >= 1000) return `${(Math.round(g / 100) / 10).toString().replace(".", en() ? "." : ",")} ${unite === "ml" ? "l" : "kg"}`;
  return `${g >= 20 ? Math.round(g / 5) * 5 : Math.round(g)} ${unite}`;
}
/* « steak haché » → « steaks hachés », « patty » → « patties » */
const pluriel = (n: string) => n.split(" ").map((w) => (w.length < 3 || /[sxz]$/.test(w) ? w : en() && /[^aeiou]y$/.test(w) ? w.slice(0, -1) + "ies" : w + (w.endsWith("au") ? "x" : "s"))).join(" ");

/* ---------------- suggestions du jour ---------------- */
/* hachage stable : la même suggestion pour un jour donné, une autre avec « ↻ » */
const hache = (s: string) => { let h = 2166136261; for (const c of s) h = Math.imul(h ^ c.charCodeAt(0), 16777619); return h >>> 0; };
const melanger = <T,>(l: T[], graine: string, cle: (x: T) => string) => l.slice().sort((a, b) => hache(graine + cle(a)) - hache(graine + cle(b)));

/** Une recette par créneau (petit-déjeuner, déjeuner ou dîner, collation) ; `decal` fait tourner un créneau. */
export function suggestions(p: PrefsRepas, jour: string, seance: boolean, decal: Partial<Record<CreneauRepas, number>> = {}) {
  const ok = recettesPour(p), r: Partial<Record<CreneauRepas, Recette>> = {};
  const pour = (c: CreneauRepas, l: Recette[]) => { if (l.length) r[c] = l[(decal[c] ?? 0) % l.length]; };
  pour("matin", melanger(ok.filter((x) => x.m === "matin"), jour + "m", (x) => x.id));
  pour("dejeuner", melanger(ok.filter((x) => x.m === "repas"), jour + "d", (x) => x.id));
  /* collation : avant / après la séance un jour d'entraînement, sinon plutôt légère */
  const col = ok.filter((x) => x.m === "collation" && !x.t.includes("dessert"));
  const prio = seance ? col.filter((x) => x.t.includes("post") || x.t.includes("pre")) : col;
  pour("collation", melanger(prio.length ? prio : col, jour + "c", (x) => x.id));
  return r;
}

/* ---------------- « avec ce que j'ai » ---------------- */
export type Correspondance = { r: Recette; ont: number; total: number; manque: string[] };
/** Recettes classées par part d'ingrédients déjà là (les produits de base ne comptent pas). */
export function avecCeQueJai(p: PrefsRepas, stock: string[]): Correspondance[] {
  const s = new Set(stock);
  return recettesPour(p)
    .map((r) => {
      const utiles = r.ing.map(([id]) => id).filter((id) => ALIM[id]?.ray !== "base");
      const manque = utiles.filter((id) => !s.has(id));
      return { r, ont: utiles.length - manque.length, total: utiles.length, manque };
    })
    .filter((c) => c.ont > 0)
    .sort((a, b) => b.ont / b.total - a.ont / a.total || a.manque.length - b.manque.length || a.r.min - b.r.min);
}
/** Aliments proposés dans « Avec ce que j'ai », par rayon (sans les produits de base). */
export const alimentsParRayon = (perso: AlimentPerso[] = []) =>
  RAYONS.filter((x) => x.k !== "base")
    .map((x) => ({ ...x, l: [...Object.values(ALIM).filter((a) => a.ray === x.k).map((a) => a.id), ...perso.filter((a) => a.ray === x.k).map((a) => a.id)] }))
    .filter((x) => x.l.length);
/** Aliments dont un mot commence par la recherche (sans accents). */
export function chercherAliments(q: string, perso: AlimentPerso[] = []) {
  const f = q.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  if (!f) return [];
  const ids = [...Object.values(ALIM).filter((a) => a.ray !== "base").map((a) => a.id), ...perso.map((a) => a.id)];
  return ids.filter((id) => nomAliment(id).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").split(/[^a-z0-9]+/).some((m) => m.startsWith(f)));
}

/* ---------------- semaine de repas ---------------- */
export const CRENEAUX: CreneauRepas[] = ["matin", "dejeuner", "diner", "collation"];
export const NOM_CRENEAU: Record<CreneauRepas, string> = { matin: tr("Petit-déjeuner"), dejeuner: tr("Déjeuner"), diner: tr("Dîner"), collation: tr("Collation") };
export const semaineParDefaut = (): SemaineRepas => ({ jours: 5, creneaux: ["dejeuner", "diner"], graine: 1, choix: {}, coches: [] });

export type CaseSemaine = { jour: number; c: CreneauRepas; r: Recette; reste: boolean };
/** Compose la semaine : pas deux fois le même plat tant qu'il en reste ; un plat « batch »
    du dîner revient en restes au déjeuner du lendemain ; les choix faits à la main sont gardés. */
export function planSemaine(p: PrefsRepas, S: SemaineRepas): CaseSemaine[] {
  const ok = recettesPour(p), pris = new Set<string>(), cases: CaseSemaine[] = [];
  const pool = (c: CreneauRepas) => melanger(ok.filter((x) => (c === "matin" ? x.m === "matin" : c === "collation" ? x.m === "collation" && !x.t.includes("dessert") : x.m === "repas")), `s${S.graine}${c}`, (x) => x.id);
  const pools = Object.fromEntries(CRENEAUX.map((c) => [c, pool(c)])) as Record<CreneauRepas, Recette[]>;
  let restes: Recette | null = null;
  for (let j = 0; j < S.jours; j++) {
    for (const c of CRENEAUX) {
      if (!S.creneaux.includes(c)) continue;
      const choisi = S.choix[`${j}|${c}`];
      let r: Recette | undefined, reste = false;
      if (choisi && R[choisi]) r = R[choisi];
      else if (c === "dejeuner" && restes) { r = restes; reste = true; }
      else {
        const l = pools[c];
        r = l.find((x) => !pris.has(x.id)) ?? l[(j * 7 + CRENEAUX.indexOf(c)) % Math.max(1, l.length)];
      }
      if (c === "dejeuner") restes = null;
      if (!r) continue;
      if (!reste) pris.add(r.id);
      if (c === "diner" && !reste && r.t.includes("batch") && S.creneaux.includes("dejeuner") && j + 1 < S.jours) restes = r;
      cases.push({ jour: j, c, r, reste });
    }
  }
  return cases;
}
/** Une autre recette pour une case (la suivante du même type qui n'est pas déjà dans la semaine). */
export function autreRecette(p: PrefsRepas, cases: CaseSemaine[], k: CaseSemaine) {
  const deja = new Set(cases.map((x) => x.r.id));
  const l = recettesPour(p).filter((x) => (k.c === "matin" ? x.m === "matin" : k.c === "collation" ? x.m === "collation" : x.m === "repas"));
  const i = l.findIndex((x) => x.id === k.r.id);
  for (let d = 1; d <= l.length; d++) { const x = l[(i + d) % l.length]; if (!deja.has(x.id)) return x; }
  return l[(i + 1) % l.length] ?? k.r;
}

/* ---------------- liste de courses ---------------- */
export type LigneCourses = { id: string; g: number; texte: string };
/** Quantités additionnées sur la semaine (portions de chacun × personnes), rangées par rayon,
    sans les produits de base ni ce qui est déjà en stock. Les restes ne s'achètent pas deux fois :
    la recette du dîner est comptée pour deux repas. */
export function listeCourses(cases: CaseSemaine[], b: Besoins, pers: number, stock: string[]) {
  const tot: Record<string, number> = {}, s = new Set(stock);
  for (const k of cases) {
    if (k.reste) continue;
    const f = portion(k.r, b, k.c) * pers * (cases.some((x) => x.reste && x.r.id === k.r.id && x.jour === k.jour + 1) ? 2 : 1);
    for (const [id, g] of k.r.ing) if (ALIM[id] && ALIM[id].ray !== "base" && !s.has(id)) tot[id] = (tot[id] || 0) + g * f;
  }
  return RAYONS.filter((x) => x.k !== "base")
    .map((x) => ({ k: x.k as Rayon, n: en() ? x.en : x.n, l: Object.keys(tot).filter((id) => ALIM[id].ray === x.k).sort((a, c) => nomAliment(a).localeCompare(nomAliment(c))).map((id) => ({ id, g: tot[id], texte: quantite(id, Math.ceil(tot[id] / 5) * 5, true) })) }))
    .filter((x) => x.l.length);
}
/** Liste en texte, pour la feuille de partage du téléphone. */
export function texteCourses(l: ReturnType<typeof listeCourses>, coches: string[], articles: ArticleLibre[] = []) {
  const libres = articles.filter((a) => !coches.includes(a.id)).map((a) => `• ${a.e} ${a.n}${a.q ? " — " + a.q : ""}`);
  const rayons = l.map((r) => `${r.n}\n` + r.l.filter((x) => !coches.includes(x.id)).map((x) => `• ${avecEmoji(x.id)} — ${x.texte}`).join("\n"));
  return [...(libres.length ? [`${tr("Mes articles")}\n${libres.join("\n")}`] : []), ...rayons].join("\n\n");
}
