/* Partie Repas : besoins du jour, portions, recettes compatibles, « avec ce que j'ai »,
   semaine de repas et liste de courses. Logique pure.
   Démarche : un besoin estimé une fois (Mifflin-St Jeor × activité réelle, ajusté à l'objectif),
   traduit en portions faciles (méthode de la main) ; les recettes sont mises à la portion de
   chacun d'après les protéines visées pour ce repas. */
import { langue, tr } from "@/lib/i18n";
import { ALIM, emojiDe, PERSO_EMOJI, RAYONS, type Rayon } from "@/lib/data/aliments";
import { RECETTES, type Moment, type Recette } from "@/lib/data/recettes";
import { objectifProteines, poidsDe, poidsReference } from "./nutrition";
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
export const ALLERGIES: [string, string][] = [["l", tr("Lactose")], ["g", tr("Gluten")], ["o", tr("Œufs")], ["c", tr("Fruits à coque")], ["r", tr("Arachide")], ["p", tr("Poisson et fruits de mer")], ["s", tr("Soja")], ["e", tr("Sésame")], ["u", tr("Moutarde")], ["y", tr("Céleri")]];
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

export type Besoins = { kcal: number; p: number; g: number; l: number; seance: boolean; ajustement?: string; eau?: number; seche?: boolean };
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
/* ---------------- dépense d'une séance ----------------
   MET nets (au-dessus du repos) × poids × durée : musculation 4, cardio 6, course (≈ 1 kcal/kg/km). */
const iso = (t: number) => { const d = new Date(t), z = (n: number) => String(n).padStart(2, "0"); return `${d.getFullYear()}-${z(d.getMonth() + 1)}-${z(d.getDate())}`; };
export function depenseSeances(E: Etat, kg: number, jour = iso(Date.now())) {
  let kcal = 0, endurance = 0;
  for (const l of E.HIST || []) if (l.d === jour) kcal += 4 * kg * ((l.min || 45) / 60);
  for (const c of E.CARDIO || []) if (iso(c.ts) === jour) { kcal += 6 * kg * (c.min / 60); endurance += c.min; }
  for (const s of (E.SORTIES || []) as { d?: string; km?: number; sec?: number }[]) if (s.d === jour) { kcal += kg * (s.km || 0); endurance += (s.sec || 0) / 60; }
  return { kcal, endurance };
}

/* ---------------- ajustement au poids ----------------
   Tendance sur les 21 derniers jours, par régression linéaire sur au moins 4 pesées étalées sur
   10 jours ou plus : un litre d'eau en plus un jour ne fait plus changer la cible. En sèche on vise
   −0,5 à −1 % du poids par semaine, en prise de muscle +0,1 à +0,5 %. */
export function ajustementPoids(A: Reponses, auj = Date.now()): { kcal: number; texte?: string } {
  const P = ((A.poids as [string, number][]) || []).filter(([d, p]) => Date.parse(d) >= auj - 21 * 864e5 && p > 0);
  if (P.length < 4) return { kcal: 0 };
  const t0 = Date.parse(P[0][0]), xs = P.map(([d]) => (Date.parse(d) - t0) / 864e5), ys = P.map(([, p]) => p);
  if (xs[xs.length - 1] < 10) return { kcal: 0 };
  const mx = xs.reduce((a, b) => a + b, 0) / xs.length, my = ys.reduce((a, b) => a + b, 0) / ys.length;
  const vx = xs.reduce((s, x) => s + (x - mx) ** 2, 0);
  if (!vx) return { kcal: 0 };
  const pente = xs.reduce((s, x, i) => s + (x - mx) * (ys[i] - my), 0) / vx;
  const parSemaine = ((pente * 7) / my) * 100;
  const fmt = (x: number) => (x > 0 ? "+" : "") + x.toFixed(1).replace(".", ",");
  if (A.objectif === 2) {
    if (parSemaine > -0.25) return { kcal: -150, texte: tr("Ton poids bouge peu ({a} % par semaine) : −150 kcal pour avancer.", { a: fmt(parSemaine) }) };
    if (parSemaine < -1) return { kcal: 150, texte: tr("Tu perds vite ({a} % par semaine) : +150 kcal pour garder ton muscle.", { a: fmt(parSemaine) }) };
  }
  if (A.objectif === 0) {
    if (parSemaine < 0.1) return { kcal: 150, texte: tr("Ton poids ne monte pas ({a} % par semaine) : +150 kcal pour construire.", { a: fmt(parSemaine) }) };
    if (parSemaine > 0.5) return { kcal: -100, texte: tr("Tu prends vite ({a} % par semaine) : −100 kcal pour limiter le gras.", { a: fmt(parSemaine) }) };
  }
  return { kcal: 0 };
}

/** Besoins du jour : métabolisme de base (Mifflin-St Jeor) × activité habituelle, plus la dépense des
    séances du jour (faites, sinon une séance de ta durée habituelle) ; ajustés à l'objectif et à la
    tendance de ton poids ; jamais sous la disponibilité énergétique minimale (30 kcal/kg de masse maigre).
    Protéines : objectif de l'app. Glucides selon l'entraînement (2 g/kg au repos, 3 un jour de séance,
    5 après une heure d'endurance), lipides ≥ 0,8 g/kg (jusqu'à 0,6 s'il faut de la place). */
export function besoins(E: Etat, seance: boolean): Besoins {
  const A = E.A, kg = poidsDe(A) ?? 70, sexe = A.sexe ?? 2;
  const cm = A.profil?.["Taille"] ?? (sexe === 1 ? 165 : 177), age = A.profil?.["Âge"] ?? 30;
  const base = 10 * kg + 6.25 * cm - 5 * age + (sexe === 0 ? 5 : sexe === 1 ? -161 : -78);
  /* activité hors séances : selon le rythme de la semaine (séances notées ou objectif déclaré) */
  const rythme = Math.min(6, Math.max(joursActifs(E), (A.objHebdo as number) ?? 0));
  const napRepos = Math.min(1.55, 1.3 + 0.03 * rythme);
  const fait = depenseSeances(E, kg);
  const seanceKcal = seance ? Math.max(fait.kcal, 4 * kg * (((A.duree as number) ?? 45) / 60)) : fait.kcal;
  /* Garde-fous : pas de déficit avant 18 ans (croissance) ni sous un IMC de 18,5 (risque de
     carence et de troubles alimentaires). On reste alors au maintien et on le dit. */
  const imc = kg / (cm / 100) ** 2, prudence = age < 18 || imc < 18.5;
  const obj = A.objectif ?? 3, sansDeficit = prudence && obj === 2;
  const objectif = sansDeficit ? 1 : ([1.1, 1.05, 0.85, 1][obj] ?? 1);
  const adjBrut = ajustementPoids(A);
  const adj = prudence
    ? { kcal: Math.max(0, adjBrut.kcal), texte: sansDeficit ? tr("Pas de déficit proposé ici : avant 18 ans ou avec un poids déjà bas, perdre du poids se décide avec un médecin ou un diététicien. Les repas visent ton maintien.") : adjBrut.kcal > 0 ? adjBrut.texte : undefined }
    : adjBrut;
  /* Masse grasse estimée par l'IMC (Deurenberg, 1991), bornée : la masse maigre d'une
     personne en surpoids n'est plus surestimée, donc le plancher ne crée plus de surplus. */
  const h = sexe === 0 ? 1 : sexe === 1 ? 0 : 0.5;
  const gras = Math.min(0.5, Math.max(0.08, (1.2 * imc + 0.23 * Math.max(age, 18) - 10.8 * h - 5.4) / 100));
  const masseMaigre = kg * (1 - gras);
  const kcal = Math.max(base * 1.1, 30 * masseMaigre + seanceKcal, (base * napRepos + seanceKcal) * objectif + adj.kcal);
  /* glucides : 2 g/kg au repos, 3 un jour de séance, puis selon la durée d'endurance (5 g/kg à 1 h,
     +2 par heure en plus, 10 au plus) sans marche d'escalier à 59 / 60 minutes */
  const hEnd = fait.endurance / 60, gkg = hEnd >= 1 ? Math.min(10, 5 + 2 * (hEnd - 1)) : seance || hEnd > 0 ? Math.max(3, 2 + 3 * hEnd) : 2;
  const p = objectifProteines(A), gMin = gkg * kg;
  /* lipides : jamais sous 20 % de l'énergie (ACSM 2016) */
  const lMin = Math.max(0.6 * kg, (0.2 * kcal) / 9);
  let l = Math.max(0.8 * kg, (0.27 * kcal) / 9), g = (kcal - p * 4 - l * 9) / 4;
  if (g < gMin) { l = Math.max(lMin, (kcal - p * 4 - gMin * 4) / 9); g = Math.max(gMin, (kcal - p * 4 - l * 9) / 4); }
  const r5 = (x: number) => Math.round(x / 5) * 5, total = Math.max(kcal, p * 4 + r5(l) * 9 + r5(g) * 4);
  /* eau : 35 ml/kg, plus 0,5 l par heure de sport */
  const minutes = (seance ? Math.max(((A.duree as number) ?? 45), 0) : 0) + fait.endurance;
  const eau = Math.round((35 * poidsReference(A, kg) + (minutes / 60) * 500) / 100) * 100;
  return { kcal: Math.round(total / 10) * 10, p, g: r5(g), l: r5(l), seance, eau, seche: objectif < 1, ...(adj.texte ? { ajustement: adj.texte } : {}) };
}

/** Méthode de la main pour un repas : paumes de protéines (~25 g), poings de féculents
    (~30 g de glucides), pouces de matières grasses (~8 g), poings de légumes. */
export function mains(b: Besoins, c: CreneauRepas) {
  const s = part(c, b.seance), demi = (x: number) => Math.max(0.5, Math.round(x * 2) / 2);
  return { paumes: demi((b.p * s) / 25), poings: demi((b.g * s) / 30), pouces: demi((b.l * s) / 8), legumes: c === "dejeuner" || c === "diner" ? 2 : c === "matin" ? 0.5 : 0 };
}

/** Portions d'une recette pour une personne : de quoi couvrir l'énergie visée à ce repas, en
    montant jusqu'à +25 % s'il le faut pour atteindre 90 % des protéines visées (entre ¾ et 1¾ de
    la recette de base, par quarts ; les desserts restent à une portion). */
export function portion(r: Recette, b: Besoins, c: CreneauRepas = creneauDe(r.m)) {
  if (r.t.includes("dessert")) return 1;
  const s = part(c, b.seance), m = macros(r);
  const fKcal = (b.kcal * s) / (m.kcal || 1), fProt = (b.p * s) / (m.p || 1);
  /* en sèche, la règle des protéines ne peut ajouter que 10 % d'énergie (sinon le déficit s'efface) ;
     le reste des protéines vient du complément proposé (protManquantes) */
  const f = fKcal * m.p >= 0.9 * b.p * s ? fKcal : Math.min(fProt * 0.9, fKcal * (b.seche ? 1.1 : 1.25));
  const [mn, mx] = r.m === "collation" ? [0.5, 1.5] : [0.5, 2];
  return Math.min(mx, Math.max(mn, Math.round(f * 4) / 4));
}

/** Ce qui manque en protéines à un repas, une fois la portion choisie (0 si la cible est tenue) :
    de quoi proposer un complément (skyr, œufs, whey…). */
export function protManquantes(r: Recette, b: Besoins, c: CreneauRepas = creneauDe(r.m)) {
  if (r.t.includes("dessert")) return 0;
  const manque = b.p * part(c, b.seance) - macros(r, portion(r, b, c)).p;
  return manque >= 8 ? Math.round(manque / 5) * 5 : 0;
}

/** Ce qui manque en glucides à un repas (jours d'endurance surtout : les recettes sont riches en
    protéines, on n'agrandit pas toute l'assiette) : de quoi proposer un féculent en plus. */
export function glucManquants(r: Recette, b: Besoins, c: CreneauRepas = creneauDe(r.m)) {
  if (r.t.includes("dessert")) return 0;
  const manque = b.g * part(c, b.seance) - macros(r, portion(r, b, c)).g;
  return manque >= 25 ? Math.round(manque / 5) * 5 : 0;
}
/** Féculents pesés secs : la fiche le précise (80 g de riz sec ≈ 240 g cuit). */
export const SEC = new Set(["riz", "riz_complet", "pates", "pates_comp", "quinoa", "semoule", "lentilles", "lentilles_corail", "nouilles_riz", "avoine"]);

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

/** Une recette par créneau (petit-déjeuner, déjeuner, dîner, collation) ; `decal` fait tourner un créneau. */
export function suggestions(p: PrefsRepas, jour: string, seance: boolean, decal: Partial<Record<CreneauRepas, number>> = {}) {
  const ok = recettesPour(p), r: Partial<Record<CreneauRepas, Recette>> = {};
  const pour = (c: CreneauRepas, l: Recette[]) => { if (l.length) r[c] = l[(decal[c] ?? 0) % l.length]; };
  pour("matin", melanger(ok.filter((x) => x.m === "matin"), jour + "m", (x) => x.id));
  pour("dejeuner", melanger(ok.filter((x) => x.m === "repas"), jour + "d", (x) => x.id));
  /* dîner : un autre plat que le déjeuner */
  const plats = melanger(ok.filter((x) => x.m === "repas"), jour + "s", (x) => x.id);
  pour("diner", plats.filter((x) => x.id !== r.dejeuner?.id).length ? plats.filter((x) => x.id !== r.dejeuner?.id) : plats);
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
/** Quantités additionnées sur la semaine (ta portion + une portion de base par autre personne), rangées par rayon,
    sans les produits de base ni ce qui est déjà en stock. Les restes ne s'achètent pas deux fois :
    la recette du dîner est comptée pour deux repas. */
export function listeCourses(cases: CaseSemaine[], b: Besoins, pers: number, stock: string[]) {
  const tot: Record<string, number> = {}, s = new Set(stock);
  for (const k of cases) {
    if (k.reste) continue;
    /* ta portion ajustée, et une portion de base pour chacun des autres */
    const f = (portion(k.r, b, k.c) + Math.max(0, pers - 1)) * (cases.some((x) => x.reste && x.r.id === k.r.id && x.jour === k.jour + 1) ? 2 : 1);
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
