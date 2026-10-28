/* « Ma salle » : les machines et postes qu'on trouve en salle. Chacun regroupe les
   exercices qui en ont besoin ; une machine absente fait disparaître ses exercices
   des listes et des séances composées. `img` : exercice dont la photo illustre le poste ;
   sans lui, photo Unsplash (lib/medias.ts) ou icône. Un poste sans exercice est une
   machine déclarée seulement, en attendant ses exercices. */
import { langue, tr } from "@/lib/i18n";

export type Poste = { id: string; n: string; zone: string; img?: string; ex: string[] };

/* Zones dans l'ordre d'affichage. `type` : matériel du filtre dont elles dépendent (m0 machines, m1 barre). */
export const ZONES_SALLE: { k: string; n: string; type: "m0" | "m1" }[] = [
  { k: "poly", n: "Postes polyvalents", type: "m0" },
  { k: "jambes", n: "Jambes", type: "m0" },
  { k: "haut", n: "Poitrine et épaules", type: "m0" },
  { k: "dos", n: "Dos", type: "m0" },
  { k: "bras", n: "Bras et tronc", type: "m0" },
  { k: "cardio", n: "Cardio", type: "m0" },
  { k: "barre", n: "Postes à barre", type: "m1" },
];

export const POSTES: Poste[] = [
  { id: "poulie", n: "Poulies (vis-à-vis)", zone: "poly", img: "ecart", ex: ["fp", "tri", "ecart", "nuq", "crp", "elp", "pal", "tirp", "kick", "pth", "curlp", "ecab", "tbt", "oisp", "martc", "pupp", "tricor", "trinv", "ecpb", "ecpi", "elfp", "oisc", "rotp", "tbtc", "addp", "shrp", "crinvp", "buch", "rintp"] },
  { id: "smith", n: "Smith machine", zone: "poly", img: "smith", ex: ["smith", "dcsm", "dcism", "dmsm", "bulsm"] },
  { id: "bancreg", n: "Banc réglable", zone: "poly", ex: [] },
  { id: "functr", n: "Functional trainer", zone: "poly", ex: [] },
  { id: "presse", n: "Presse à cuisses", zone: "jambes", img: "pr", ex: ["pr", "molp"] },
  { id: "hack", n: "Hack squat", zone: "jambes", img: "hack", ex: ["hack"] },
  { id: "legext", n: "Leg extension", zone: "jambes", img: "lext", ex: ["lext", "lext1"] },
  { id: "legcurl", n: "Leg curl", zone: "jambes", img: "lc", ex: ["lc", "lcas", "lcd"] },
  { id: "addabd", n: "Adducteurs et abducteurs", zone: "jambes", img: "add", ex: ["add", "abd"] },
  { id: "mollets", n: "Machine à mollets", zone: "jambes", img: "mol", ex: ["mol", "molA"] },
  { id: "revhyp", n: "Reverse hyperextension", zone: "jambes", img: "revhyp", ex: ["revhyp"] },
  { id: "ghd", n: "Banc à ischios (GHD)", zone: "jambes", ex: [] },
  { id: "pendule", n: "Pendulum squat", zone: "jambes", ex: [] },
  { id: "beltsq", n: "Belt squat", zone: "jambes", ex: [] },
  { id: "hipthr", n: "Machine hip thrust", zone: "jambes", ex: [] },
  { id: "fessiers", n: "Machine à fessiers", zone: "jambes", ex: [] },
  { id: "mollass", n: "Mollets assis", zone: "jambes", ex: [] },
  { id: "chest", n: "Chest press", zone: "haut", img: "chpm", ex: ["chpm", "chpi"] },
  { id: "pecdeck", n: "Pec deck (butterfly)", zone: "haut", img: "pecdk", ex: ["pecdk", "rmf"] },
  { id: "epaules", n: "Développé épaules machine", zone: "haut", img: "dmm", ex: ["dmm"] },
  { id: "dipsass", n: "Dips assistés", zone: "haut", img: "dipm", ex: ["dipm"] },
  { id: "devinc", n: "Développé incliné machine", zone: "haut", ex: [] },
  { id: "latm", n: "Élévations latérales machine", zone: "haut", ex: [] },
  { id: "tirvert", n: "Tirage vertical", zone: "dos", img: "tp", ex: ["tp", "tpn", "tpsu", "tp1"] },
  { id: "tirhor", n: "Tirage horizontal assis", zone: "dos", img: "tps", ex: ["tps", "tps1"] },
  { id: "rowing", n: "Rowing machine", zone: "dos", img: "rwm", ex: ["rwm", "rwhm"] },
  { id: "tbarp", n: "T-bar buste appuyé", zone: "dos", img: "tbarp", ex: ["tbarp"] },
  { id: "pullover", n: "Pull-over machine", zone: "dos", ex: [] },
  { id: "pupm", n: "Pupitre à biceps machine", zone: "bras", img: "pupm", ex: ["pupm"] },
  { id: "trim", n: "Machine à triceps", zone: "bras", img: "trim", ex: ["trim"] },
  { id: "crm", n: "Machine à abdos", zone: "bras", img: "crm", ex: ["crm"] },
  { id: "chaise", n: "Chaise romaine", zone: "bras", ex: [] },
  { id: "rameur", n: "Rameur", zone: "cardio", img: "ram", ex: ["ram"] },
  { id: "velo", n: "Vélo", zone: "cardio", img: "velo", ex: ["velo"] },
  { id: "ellip", n: "Elliptique", zone: "cardio", img: "ellip", ex: ["ellip"] },
  { id: "stair", n: "Stairmaster", zone: "cardio", img: "stair", ex: ["stair"] },
  { id: "tapis", n: "Tapis de course", zone: "cardio", img: "tapis", ex: ["tapis"] },
  { id: "airbike", n: "Air bike", zone: "cardio", ex: [] },
  { id: "velosa", n: "Vélo semi-allongé", zone: "cardio", ex: [] },
  { id: "traineau", n: "Traîneau", zone: "cardio", ex: [] },
  { id: "rack", n: "Rack à squat", zone: "barre", img: "sq", ex: ["sq", "sqf", "dm", "fb", "gm", "sql", "sqlat", "pp", "rkp"] },
  { id: "banc", n: "Banc de développé", zone: "barre", img: "dc", ex: ["dc", "dci", "dcd", "dcs", "seal", "ht", "montb", "bfront", "spid", "molab"] },
  { id: "pupitre", n: "Pupitre à biceps", zone: "barre", img: "pup", ex: ["pup"] },
  { id: "ez", n: "Barre EZ", zone: "barre", img: "curlez", ex: ["curlez", "skull"] },
  { id: "trapbar", n: "Trap bar", zone: "barre", img: "trap", ex: ["trap"] },
  { id: "landmine", n: "Landmine", zone: "barre", img: "landr", ex: ["landr", "tbar"] },
];

/* Poste exigé par chaque exercice. */
export const POSTE_DE: Record<string, string> = Object.fromEntries(POSTES.flatMap((p) => p.ex.map((o) => [o, p.id])));

if (langue() === "en") {
  ZONES_SALLE.forEach((z) => (z.n = tr(z.n)));
  POSTES.forEach((p) => (p.n = tr(p.n)));
}
