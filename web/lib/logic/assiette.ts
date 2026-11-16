/* L'assiette d'un plat selon l'objectif (onglet Repas, décisions du 16 novembre 2026, vérifiées
   par le coach nutrition) : chaque plat (déjeuner, dîner) est rangé en protéines, féculents et
   légumes d'après ses ingrédients, et servi en fractions de l'assiette.
   - Prise de muscle : ⅓ protéines · ⅓ féculents · ⅓ légumes, grande assiette (≈ 28 cm).
   - Sèche : ⅓ protéines · ¼ féculents · le reste en légumes, assiette normale (≈ 24 cm) : plus de
     protéines en déficit pour garder le muscle (ISSN 2017, Helms 2014), jamais sans féculent.
   - Garder la forme : ¼ · ¼ · ½, assiette normale (assiette santé, Harvard 2011, PNNS).
   Trois types de plat :
   - « separe » : protéines, féculents et légumes se servent à part ;
   - « mijote » : chili, curry, dahl… servis avec un riz ou un pain à côté : le mijoté tient la
     place des protéines, le riz ou le pain celle des féculents, un accompagnement de légumes le reste ;
   - « complet » : tout est mélangé : l'assiette se partage entre le plat et un accompagnement de
     légumes, sauf si le plat est déjà riche en légumes (≥ 40 % du poids cru).
   Règles : légumineuses et laitages riches (skyr, cottage, fromage blanc, feta ou mozzarella en
   portion) en protéines ; coulis de tomate et oignon en légumes ; maïs en féculents ; avocat,
   pesto, houmous, lait de coco, crème et yaourt en sauce comptent en « gras » ; parmesan et
   emmental râpés en garniture. Logique pure. */
import { ALIM } from "@/lib/data/aliments";
import { RECETTES, type Recette } from "@/lib/data/recettes";

export type Objectif = "muscle" | "seche" | "forme";
export type TypePlat = "separe" | "mijote" | "complet";
export type Part = { p: number; f: number; l: number };

/** Fractions de l'assiette (protéines, féculents, légumes) et taille, par objectif. */
export const FRACTIONS: Record<Objectif, Part & { grande: boolean }> = {
  muscle: { p: 1 / 3, f: 1 / 3, l: 1 / 3, grande: true },
  seche: { p: 1 / 3, f: 1 / 4, l: 5 / 12, grande: false },
  forme: { p: 1 / 4, f: 1 / 4, l: 1 / 2, grande: false },
};
/** Plat complet : la part du plat (le reste en accompagnement de légumes). */
export const PART_PLAT: Record<Objectif, number> = { muscle: 3 / 4, seche: 2 / 3, forme: 2 / 3 };

const LEGUMINEUSES = new Set(["haricots_rouges", "lentilles_corail", "lentilles", "pois_chiches", "edamame"]);
const LAITAGES_PROT = new Set(["skyr", "cottage", "fromage_blanc"]);
const FROMAGES_PORTION = new Set(["feta", "mozza"]);
const GRAS = new Set(["avocat", "pesto", "houmous", "lait_coco", "creme", "yaourt", "beurre"]);
const GARNITURE = new Set(["parmesan", "emmental"]);
const PAS_LEGUME = new Set(["ail", "gingembre", "herbes"]);
export type Role = "p" | "f" | "l" | "gras" | "garniture" | null;

/** Le rôle d'un ingrédient dans l'assiette (null : assaisonnement, fruit…). */
export function roleDe(id: string, g: number): Role {
  const a = ALIM[id];
  if (!a) return null;
  if (GRAS.has(id)) return "gras";
  if (GARNITURE.has(id)) return "garniture";
  if (LEGUMINEUSES.has(id) || LAITAGES_PROT.has(id)) return "p";
  if (FROMAGES_PORTION.has(id)) return g >= 40 ? "p" : "garniture";
  if (id === "mais") return "f";
  if (id === "passata") return "l";
  if (a.ray === "prot") return "p";
  if (a.ray === "fec") return "f";
  if (a.ray === "leg") return PAS_LEGUME.has(id) ? null : "l";
  return null;
}

/* Le type de chaque plat : relu plat par plat avec le coach nutrition (le reste est « séparé »). */
const MIJOTES = ["chili-con-carne", "curry-pois-chiches", "dahl-lentilles", "soupe-lentilles", "dinde-curry-coco", "chili-vegan", "oeufs-cocotte", "chili-tempeh-express"];
const COMPLETS = ["bolognaise-lentilles", "wok-boeuf", "salade-thon", "gratin-pates-poulet", "risotto-champignons", "omelette-pdt", "pizza-tortilla", "salade-quinoa-feta",
  "gnocchis-poulet-pesto", "butternut-lentilles", "riz-saute-oeuf", "nouilles-tofu-wok", "salade-pois-chiches-haricots", "dal-tofu-micro", "pates-thon-micro", "tofu-legumes-four"];
/** Plats servis en bol (pas de fractions d'assiette). */
export const EN_BOL = new Set(["soupe-lentilles"]);

export function typeDe(r: Recette): TypePlat {
  return MIJOTES.includes(r.id) ? "mijote" : COMPLETS.includes(r.id) ? "complet" : "separe";
}

/* L'accompagnement de légumes proposé, selon le plat (coach nutrition) ; vinaigrette huile et citron. */
const ACCOMP: [RegExp, string][] = [
  [/chili|tacos|wrap|soupe/, "Crudités (carotte râpée, chou) ou salade verte"],
  [/curry|dahl|dal-/, "Concombre et tomate au citron, ou épinards vapeur"],
  [/pates|gratin|risotto|gnocchis|bolognaise|pizza/, "Salade verte ou haricots verts"],
  [/riz-saute|nouilles|wok/, "Brocoli vapeur"],
  [/./, "Salade verte, ou légumes vapeur"],
];

export type Assiette = {
  id: string; type: TypePlat; bol: boolean;
  p: string[]; f: string[]; l: string[]; gras: string[]; garniture: string[];
  /** part de légumes dans le poids cru du plat (hors assaisonnement) */
  partLegumes: number;
  /** accompagnement de légumes à ajouter (absent : le plat en a assez) */
  accomp?: string;
  /** pas de féculent : « + pain ou quinoa » en prise de muscle */
  sansFeculent: boolean;
};

/** Range un plat : ingrédients par rôle (du plus lourd au plus léger), type, accompagnement. */
export function assietteDe(r: Recette): Assiette {
  const par: Record<string, [string, number][]> = { p: [], f: [], l: [], gras: [], garniture: [] };
  let total = 0, leg = 0;
  for (const [id, g] of r.ing) {
    const ro = roleDe(id, g);
    if (!ro) continue;
    par[ro].push([id, g]);
    if (ro !== "garniture") total += g;
    if (ro === "l") leg += g;
  }
  const tri = (l: [string, number][]) => l.sort((a, b) => b[1] - a[1]).map(([id]) => id);
  const type = typeDe(r), partLegumes = total ? leg / total : 0;
  /* un accompagnement quand le plat manque de légumes : toujours pour un mijoté ; pour un plat
     complet sous 40 % de légumes (en poids cru), sauf s'il a déjà sa salade ; pour un plat séparé,
     sous 130 g de légumes par part */
  /* une salade composée, ou un plat qui a déjà sa salade : rien à ajouter */
  const aSalade = r.ing.some(([id]) => id === "salade") || r.id.startsWith("salade-");
  const manque = type === "mijote" || (type === "complet" ? partLegumes < 0.4 && !aSalade : leg < 130);
  const accomp = manque ? ACCOMP.find(([re]) => re.test(r.id))![1] : undefined;
  return {
    id: r.id, type, bol: EN_BOL.has(r.id),
    p: tri(par.p), f: tri(par.f), l: tri(par.l), gras: tri(par.gras), garniture: tri(par.garniture),
    partLegumes, accomp, sansFeculent: !par.f.length,
  };
}

/** Les plats (déjeuner, dîner) concernés par l'assiette. */
export const PLATS = () => RECETTES.filter((r) => r.m === "repas");
