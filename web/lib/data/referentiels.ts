/* Généré depuis l'ancienne app (public/index.html) — ne pas éditer à la main sans relancer les tests de parité. */
import type { Seance, Etape, Collation, Sport, MuscleAss } from "./types";

export const PLATE: [string, number][] = [
 [
  "#1B4FA8",
  30
 ],
 [
  "#EFC429",
  26
 ],
 [
  "#2E7D4F",
  22
 ],
 [
  "#EFF1EC",
  18
 ],
 [
  "#C0392B",
  15
 ]
];
export const SPORTS: Sport[] = [
 {
  "n": "Non, aucun",
  "d": "Uniquement la musculation"
 },
 {
  "n": "Course à pied ou trail",
  "cardio": 1,
  "jambes": 2
 },
 {
  "n": "Vélo ou spinning",
  "cardio": 1,
  "jambes": 2
 },
 {
  "n": "Natation",
  "cardio": 1,
  "jambes": 1,
  "epaules": 1
 },
 {
  "n": "Sports collectifs",
  "d": "Football, rugby, basket, handball",
  "cardio": 1,
  "jambes": 2
 },
 {
  "n": "Sports de raquette",
  "d": "Tennis, padel, badminton, squash",
  "cardio": 1,
  "jambes": 2,
  "epaules": 1
 },
 {
  "n": "Sports de combat",
  "d": "Boxe, judo, MMA, lutte",
  "cardio": 1,
  "jambes": 1,
  "epaules": 1
 },
 {
  "n": "Escalade",
  "d": "Bloc ou voie",
  "jambes": 1,
  "tirage": 1
 },
 {
  "n": "Danse ou fitness collectif",
  "cardio": 1,
  "jambes": 1
 },
 {
  "n": "Crossfit ou training fonctionnel",
  "cardio": 1,
  "jambes": 2,
  "muscu": 1
 },
 {
  "n": "Yoga, pilates ou stretching",
  "leger": 1
 }
];
export const PAT: Record<string, string> = {
 "ph": "Poussée horizontale",
 "pv": "Poussée verticale",
 "tv": "Tirage vertical",
 "th": "Tirage horizontal",
 "eg": "Dominante quadriceps",
 "fh": "Dominante ischio-fessiers",
 "ep": "Épaule latérale",
 "re": "Rotation externe",
 "fc": "Flexion de coude",
 "ec": "Extension de coude",
 "ae": "Anti-extension",
 "ft": "Flexion du tronc",
 "lo": "Extension lombaire",
 "ca": "Cardio",
 "mo": "Mobilité",
 "mol": "Mollets",
 "tra": "Trapèzes",
 "avb": "Avant-bras et prise",
 "add": "Adducteurs"
};
export const PATN: Record<string, string> = {
 "ph": "Pectoraux",
 "pv": "Épaules, devant",
 "tv": "Dos, largeur",
 "th": "Dos, épaisseur",
 "eg": "Cuisses, avant",
 "fh": "Fessiers et ischios",
 "ep": "Épaules, côté",
 "re": "Épaules, arrière",
 "fc": "Biceps",
 "ec": "Triceps",
 "ae": "Gainage",
 "ft": "Abdominaux",
 "lo": "Lombaires",
 "ca": "Cardio",
 "mo": "Mobilité",
 "mol": "Mollets",
 "tra": "Trapèzes",
 "avb": "Avant-bras",
 "add": "Adducteurs"
};
export const PAT2GRP: Record<string, string> = {
 "ph": "Pectoraux",
 "pv": "Épaules",
 "ep": "Épaules",
 "re": "Épaules",
 "tv": "Dos",
 "th": "Dos",
 "eg": "Quadriceps",
 "fh": "Fessiers et ischio-jambiers",
 "fc": "Bras",
 "ec": "Bras",
 "ae": "Abdominaux et lombaires",
 "ft": "Abdominaux et lombaires",
 "lo": "Abdominaux et lombaires",
 "mol": "Mollets",
 "tra": "Trapèzes",
 "avb": "Avant-bras",
 "add": "Adducteurs"
};
export const GROUPES: Record<"h" | "f" | "n", string[]> = {
 "h": [
  "Pectoraux",
  "Dos",
  "Épaules",
  "Bras",
  "Quadriceps",
  "Fessiers et ischio-jambiers",
  "Abdominaux et lombaires"
 ],
 "f": [
  "Fessiers et ischio-jambiers",
  "Abdominaux et lombaires",
  "Quadriceps",
  "Dos",
  "Épaules",
  "Bras",
  "Pectoraux"
 ],
 "n": [
  "Dos",
  "Pectoraux",
  "Fessiers et ischio-jambiers",
  "Quadriceps",
  "Épaules",
  "Bras",
  "Abdominaux et lombaires"
 ]
};
export const MATCATS: [number, string][] = [
 [
  3,
  "Poids du corps"
 ],
 [
  2,
  "Haltères"
 ],
 [
  1,
  "Barre"
 ],
 [
  0,
  "Machines et poulies"
 ]
];
export const ACC: [string, string, number][] = [
 [
  "kb",
  "Kettlebell",
  4
 ],
 [
  "el",
  "Élastiques",
  5
 ]
];
export const AXES: string[] = [
 "Points faibles",
 "Souffle et condition physique",
 "Mobilité et récupération"
];
export const ZONES: Record<string, string> = {
 "jambes": "Jambes",
 "fessiers": "Fessiers",
 "pectoraux": "Pectoraux",
 "dos": "Dos",
 "epaules": "Épaules",
 "bras": "Bras",
 "tronc": "Tronc et abdominaux"
};
export const ZPATS: Record<string, string[]> = {
 "jambes": [
  "eg",
  "fh",
  "mol",
  "add",
  "mo"
 ],
 "fessiers": [
  "fh"
 ],
 "pectoraux": [
  "ph"
 ],
 "dos": [
  "tv",
  "th",
  "tra",
  "lo"
 ],
 "epaules": [
  "pv",
  "ep",
  "re"
 ],
 "bras": [
  "fc",
  "ec",
  "avb"
 ],
 "tronc": [
  "ft",
  "ae"
 ]
};
export const SOCLE: Seance[] = [
 {
  "t": "Haut du corps A",
  "f": "Force sur les poussées, axes antérieur et triceps",
  "dur": "60 min",
  "sp": [
   0,
   "Première séance du cycle. Place-la où tu veux dans ta semaine."
  ],
  "x": [
   [
    "dc",
    4,
    6,
    "2 min 30",
    1
   ],
   [
    "tr",
    4,
    6,
    "2 min",
    1
   ],
   [
    "dm",
    3,
    8,
    "2 min",
    1
   ],
   [
    "el",
    3,
    12,
    "60 s",
    0
   ],
   [
    "tri",
    3,
    12,
    "60 s",
    0
   ]
  ]
 },
 {
  "t": "Bas du corps A",
  "f": "Dominante quadriceps, unilatéral, anti-extension",
  "dur": "60 min",
  "sport": 1,
  "sp": [
   1,
   "Tu peux l'enchaîner dès le lendemain de la séance 1 : elle ne touche pas les mêmes muscles. Espacer n'apporte rien ici."
  ],
  "x": [
   [
    "sq",
    4,
    6,
    "3 min",
    1
   ],
   [
    "rm",
    3,
    8,
    "2 min",
    1
   ],
   [
    "fe",
    3,
    10,
    "90 s",
    0
   ],
   [
    "gai",
    3,
    45,
    "60 s",
    0
   ]
  ]
 },
 {
  "t": "Haut du corps B",
  "f": "Volume sur les tirages, axes postérieur et biceps",
  "dur": "60 min",
  "sp": [
   0,
   "Laisse au moins un jour plein après la séance 1, qui travaillait déjà le haut du corps. Un seul jour après la séance 2 suffit."
  ],
  "x": [
   [
    "dc",
    3,
    10,
    "2 min",
    1
   ],
   [
    "tr",
    4,
    8,
    "2 min",
    1
   ],
   [
    "rw",
    4,
    8,
    "2 min",
    1
   ],
   [
    "fp",
    3,
    15,
    "45 s",
    0
   ],
   [
    "cu",
    3,
    12,
    "60 s",
    0
   ]
  ]
 },
 {
  "t": "Bas du corps B",
  "f": "Dominante ischio-fessiers, flexion et extension du tronc",
  "dur": "60 min",
  "sport": 2,
  "sp": [
   0,
   "Un jour plein après la séance 2. En revanche elle peut suivre directement la séance 3."
  ],
  "x": [
   [
    "rm",
    4,
    8,
    "2 min",
    1
   ],
   [
    "sq",
    3,
    8,
    "2 min 30",
    1
   ],
   [
    "ht",
    3,
    10,
    "90 s",
    0
   ],
   [
    "rj",
    3,
    10,
    "60 s",
    0
   ],
   [
    "lom",
    3,
    12,
    "60 s",
    0
   ]
  ]
 }
];
export const BONUS: Seance[] = [
 {
  "b": 1,
  "t": "Points faibles · Bras",
  "f": "Tu as placé les bras en priorité",
  "dur": "30 min",
  "sp": [
   1,
   "Aucune contrainte. Elle peut se coller à n'importe quelle séance, ou disparaître de la semaine."
  ],
  "x": [
   [
    "cu",
    3,
    12,
    "60 s",
    0
   ],
   [
    "tri",
    3,
    15,
    "60 s",
    0
   ],
   [
    "el",
    3,
    15,
    "45 s",
    0
   ]
  ]
 },
 {
  "b": 1,
  "t": "Souffle et condition",
  "f": "Intervalles courts et gainage",
  "dur": "30 min",
  "sp": [
   1,
   "Aucune contrainte, sauf une : évite de la coller juste avant une séance de jambes."
  ],
  "x": [
   [
    "ram",
    8,
    250,
    "90 s",
    0
   ],
   [
    "gai",
    3,
    45,
    "60 s",
    0
   ]
  ]
 },
 {
  "b": 1,
  "t": "Mobilité et récupération",
  "f": "Hanches, épaules, haut du dos",
  "dur": "30 min",
  "sp": [
   1,
   "Aucune contrainte. Elle est même utile le lendemain d'une grosse séance ou de ta pratique sportive."
  ],
  "x": [
   [
    "hip",
    3,
    45,
    "30 s",
    0
   ],
   [
    "tho",
    2,
    10,
    "30 s",
    0
   ],
   [
    "fp",
    3,
    15,
    "45 s",
    0
   ]
  ]
 }
];
export const VARIANTES: Record<string, string[]> = {
 "dc": [
  "dhi",
  "dh",
  "dci"
 ],
 "dh": [
  "dhi",
  "dc",
  "dci"
 ],
 "dci": [
  "dh",
  "dhi",
  "dc"
 ],
 "dhi": [
  "dh",
  "dc",
  "dci"
 ],
 "pomp": [
  "pompe",
  "dip"
 ],
 "pompe": [
  "pomp",
  "dip"
 ],
 "dip": [
  "pompe",
  "pomp"
 ],
 "chpm": [
  "dh",
  "pecdk"
 ],
 "dm": [
  "arn",
  "dmh",
  "pp"
 ],
 "dmh": [
  "arn",
  "dm",
  "dmm"
 ],
 "arn": [
  "dmh",
  "dm"
 ],
 "pp": [
  "dm",
  "dmh"
 ],
 "dmm": [
  "dmh",
  "arn"
 ],
 "tr": [
  "trs",
  "tp"
 ],
 "trs": [
  "tr",
  "tp"
 ],
 "tp": [
  "tpn",
  "trs"
 ],
 "tpn": [
  "tp",
  "tr"
 ],
 "rw": [
  "rh",
  "tbar",
  "rw2"
 ],
 "rh": [
  "rw2",
  "rwapp",
  "rw"
 ],
 "rw2": [
  "rh",
  "rwapp"
 ],
 "rwapp": [
  "rh",
  "rw2"
 ],
 "tbar": [
  "rw",
  "rh"
 ],
 "tps": [
  "rwm",
  "rh"
 ],
 "rwm": [
  "tps",
  "rh"
 ],
 "ra": [
  "tr",
  "trs"
 ],
 "sq": [
  "sqf",
  "hack",
  "bul",
  "gob"
 ],
 "sqf": [
  "sq",
  "hack"
 ],
 "hack": [
  "pr",
  "sq",
  "bul"
 ],
 "pr": [
  "hack",
  "bul",
  "fe"
 ],
 "gob": [
  "bul",
  "fe",
  "mont"
 ],
 "bul": [
  "fe",
  "mont",
  "gob"
 ],
 "fe": [
  "bul",
  "fb",
  "mont"
 ],
 "fb": [
  "fe",
  "bul"
 ],
 "smith": [
  "sq",
  "hack"
 ],
 "rm": [
  "rmh",
  "sdt",
  "gm"
 ],
 "rmh": [
  "rm",
  "kbsdt1"
 ],
 "sdt": [
  "trap",
  "rm",
  "sdts"
 ],
 "sdts": [
  "sdt",
  "trap"
 ],
 "trap": [
  "sdt",
  "rm"
 ],
 "ht": [
  "pth",
  "rmh",
  "pont1"
 ],
 "gm": [
  "rm",
  "rmh"
 ],
 "dcd": [
  "dhd",
  "dc"
 ],
 "dhd": [
  "dcd",
  "dh"
 ],
 "dcsm": [
  "dc",
  "dh"
 ],
 "dcism": [
  "dci",
  "dhi"
 ],
 "chpi": [
  "dhi",
  "chpm"
 ],
 "dhn": [
  "dh",
  "dhi"
 ],
 "pompl": [
  "pomp",
  "pompe"
 ],
 "pompi": [
  "pomp",
  "pompl"
 ],
 "dmsm": [
  "dmm",
  "dmh"
 ],
 "dmhd": [
  "dmh",
  "arn"
 ],
 "kbdma": [
  "kbdm"
 ],
 "tpsu": [
  "tp",
  "tpn"
 ],
 "tp1": [
  "tp",
  "tpsu"
 ],
 "rwsu": [
  "rw",
  "rh"
 ],
 "seal": [
  "rwapp",
  "rw"
 ],
 "tbarp": [
  "tbar",
  "rwapp"
 ],
 "landr": [
  "rh",
  "tbar"
 ],
 "kbrw2": [
  "kbrw"
 ],
 "rwhm": [
  "rwm",
  "tps"
 ],
 "sqh": [
  "gob",
  "bul"
 ],
 "sql": [
  "sq",
  "sqf"
 ],
 "bulsm": [
  "bul",
  "hack"
 ],
 "montb": [
  "mont",
  "bul"
 ],
 "ferh": [
  "fe",
  "bul"
 ]
};
export const ECHAUF: Record<string, { d: string; l: Etape[] }> = {
 "haut": {
  "d": "17 minutes",
  "l": [
   [
    "Mise en route générale",
    "5 min",
    null,
    "Rameur, vélo ou corde à sauter, à allure facile. Tu dois transpirer légèrement tout en pouvant encore tenir une conversation."
   ],
   [
    "Étirement du chat",
    "2 min",
    "tho",
    "Deux séries de dix allers-retours lents. C'est ce qui débloque le haut du dos, sans quoi l'épaule compense sur les poussées."
   ],
   [
    "Cercles d'épaules",
    "2 min",
    null,
    "Bras tendus sur les côtés, dix cercles vers l'avant puis dix vers l'arrière, en augmentant l'amplitude à chaque tour."
   ],
   [
    "Face pull très léger",
    "3 min",
    "fp",
    "Deux séries de quinze, avec une charge dérisoire. On réveille l'arrière d'épaule avant de charger les poussées."
   ],
   [
    "Pompes au poids du corps",
    "3 min",
    "pomp",
    "Deux séries de dix, en descendant lentement. Met les pectoraux et les triceps en température."
   ],
   [
    "Gainage court",
    "2 min",
    "gai",
    "Deux fois trente secondes. Verrouille le tronc avant de passer aux charges."
   ]
  ]
 },
 "bas": {
  "d": "18 minutes",
  "l": [
   [
    "Mise en route générale",
    "5 min",
    null,
    "Vélo ou marche rapide en côte. L'objectif est d'élever la température, pas de fatiguer les jambes."
   ],
   [
    "Fléchisseurs de hanche",
    "4 min",
    "hip",
    "Deux fois quarante-cinq secondes de chaque côté. Une hanche fermée devant est la cause la plus fréquente d'un squat qui ne descend pas."
   ],
   [
    "Mobilité de cheville",
    "3 min",
    null,
    "Genou fléchi vers l'avant, pied à plat, dix poussées lentes par jambe contre un mur. Détermine à quel point tes talons resteront au sol."
   ],
   [
    "Ponts fessiers",
    "3 min",
    null,
    "Deux séries de quinze au sol, en marquant une seconde en haut. Réveille les fessiers, qui restent souvent endormis en position assise."
   ],
   [
    "Squats au poids du corps",
    "3 min",
    null,
    "Deux séries de dix, en descendant plus bas qu'à la charge. On installe l'amplitude avant d'ajouter des kilos."
   ]
  ]
 },
 "bonus": {
  "d": "8 minutes",
  "l": [
   [
    "Mise en route générale",
    "4 min",
    null,
    "Allure facile, juste de quoi élever la température."
   ],
   [
    "Mobilité générale",
    "2 min",
    "tho",
    "Une série lente, sur le haut du dos et les hanches."
   ],
   [
    "Activation",
    "2 min",
    null,
    "Quelques répétitions à vide du premier mouvement de la séance."
   ]
  ]
 }
};
export const COLLATION: Record<number, Collation> = {
 "0": {
  "t": "Après une séance de prise de muscle",
  "i": "Dans les deux heures qui suivent, vise un vrai repas plutôt qu'un en-cas. La fenêtre magique de trente minutes est un mythe : c'est le total de la journée qui compte.",
  "l": [
   [
    "Une source de protéines",
    "Environ la taille de ta paume : blanc de poulet, poisson, œufs, fromage blanc ou lentilles avec du riz."
   ],
   [
    "Des glucides en quantité",
    "Riz, pâtes, pommes de terre, pain complet. C'est ce qui reconstitue l'énergie du muscle et permet la séance suivante."
   ],
   [
    "Un fruit",
    "Banane, pomme ou fruits rouges, pour les micronutriments et le sucre rapide."
   ],
   [
    "De l'eau",
    "Un demi-litre au minimum, davantage si tu as beaucoup transpiré."
   ]
  ],
  "n": "Prendre du muscle demande de manger un peu plus que ce que tu dépenses. Si la balance ne bouge pas du tout sur trois semaines, c'est là qu'il faut regarder avant de changer le programme."
 },
 "1": {
  "t": "Après une séance de force",
  "i": "Les séances lourdes coûtent plus au système nerveux qu'au muscle. La récupération se joue autant dans le sommeil que dans l'assiette.",
  "l": [
   [
    "Une source de protéines",
    "Environ la taille de ta paume : steak haché, cuisse de poulet, thon, deux à trois œufs, fromage blanc ou tofu. À chaque repas de la journée plutôt qu'en une seule fois."
   ],
   [
    "Des glucides",
    "Riz, semoule, pâtes, pommes de terre, pain. Ne les réduis pas les jours lourds : c'est le carburant des séries courtes et intenses."
   ],
   [
    "Du sel et de l'eau",
    "Une séance longue fait perdre beaucoup de sodium. Un repas normalement salé suffit à compenser."
   ]
  ],
  "n": "Le sommeil pèse plus lourd que n'importe quelle collation pour progresser en force. Sept à neuf heures, autant que possible."
 },
 "2": {
  "t": "Après une séance en période d'affinement",
  "i": "L'objectif est de garder ton muscle pendant que tu perds du gras. La protéine devient la priorité, et le volume alimentaire aide à ne pas avoir faim.",
  "l": [
   [
    "Une source de protéines, sans négocier",
    "Blanc de poulet, dinde, poisson blanc, crevettes, œufs, fromage blanc 0 %, skyr, ou lentilles et pois chiches. C'est elle qui protège le muscle en déficit, à privilégier sur tout le reste."
   ],
   [
    "Des légumes en volume",
    "Courgette, brocoli, haricots verts, chou, salade, poivrons, champignons. Ils remplissent l'estomac pour très peu de calories, ce qui rend le déficit tenable."
   ],
   [
    "Des glucides mesurés",
    "Pas de suppression, mais une portion plus modeste : une poignée de riz, une tranche de pain complet ou une pomme de terre moyenne."
   ],
   [
    "De l'eau",
    "La sensation de faim est souvent de la soif mal interprétée."
   ]
  ],
  "n": "Perdre plus de cinq cents grammes par semaine fait généralement perdre du muscle avec le gras. Plus lent est plus sûr."
 },
 "3": {
  "t": "Après une séance d'entretien",
  "i": "Rien de particulier à prévoir. Ton prochain repas normal fait très bien l'affaire.",
  "l": [
   [
    "Ton repas habituel",
    "Avec une source de protéines dedans, ce qui est souvent le cas sans y penser : viande, poisson, œufs, fromage blanc, lentilles ou pois chiches."
   ],
   [
    "Un féculent dans l'assiette",
    "Riz, pâtes, pommes de terre, pain, semoule. C'est ce qui remet l'énergie du muscle en place pour la séance suivante."
   ],
   [
    "De l'eau",
    "Le seul vrai réflexe à prendre après une séance."
   ]
  ],
  "n": "L'entretien ne demande aucune stratégie alimentaire. La régularité des séances fait tout le travail."
 }
};
export const MUSC: MuscleAss[] = [
 {
  "k": "pec",
  "n": "Pectoraux",
  "pats": [
   "ph"
  ],
  "g": 1
 },
 {
  "k": "dos",
  "n": "Dos",
  "pats": [
   "tv",
   "th"
  ],
  "g": 1
 },
 {
  "k": "epa",
  "n": "Épaules",
  "pats": [
   "pv",
   "ep",
   "re"
  ],
  "g": 0.8
 },
 {
  "k": "bic",
  "n": "Biceps",
  "pats": [
   "fc"
  ],
  "g": 0.5
 },
 {
  "k": "tri",
  "n": "Triceps",
  "pats": [
   "ec"
  ],
  "g": 0.5
 },
 {
  "k": "qua",
  "n": "Quadriceps",
  "pats": [
   "eg"
  ],
  "g": 1
 },
 {
  "k": "isc",
  "n": "Fessiers et ischios",
  "pats": [
   "fh"
  ],
  "g": 1
 },
 {
  "k": "mol",
  "n": "Mollets",
  "pats": [
   "mol"
  ],
  "g": 0.4
 },
 {
  "k": "abd",
  "n": "Abdos",
  "pats": [
   "ae",
   "ft"
  ],
  "g": 0.5
 },
 {
  "k": "tra",
  "n": "Trapèzes",
  "pats": [
   "tra"
  ],
  "g": 0.4
 },
 {
  "k": "avb",
  "n": "Avant-bras",
  "pats": [
   "avb"
  ],
  "g": 0.4
 },
 {
  "k": "add",
  "n": "Adducteurs",
  "pats": [
   "add"
  ],
  "g": 0.4
 },
 {
  "k": "lom",
  "n": "Lombaires",
  "pats": [
   "lo"
  ],
  "g": 0.4
 }
];
export const PAT2MUSC: Record<string, string> = {
 "ph": "pec",
 "tv": "dos",
 "th": "dos",
 "tra": "tra",
 "lo": "lom",
 "pv": "epa",
 "ep": "epa",
 "re": "epa",
 "fc": "bic",
 "ec": "tri",
 "avb": "avb",
 "eg": "qua",
 "fh": "isc",
 "add": "add",
 "mol": "mol",
 "ae": "abd",
 "ft": "abd"
};
export const FULLBODY: string[] = [
 "pec",
 "dos",
 "epa",
 "qua",
 "isc",
 "abd"
];
export const OBJS: string[] = [
 "Prendre du muscle",
 "Gagner en force",
 "M'affiner",
 "Rester en forme"
];
export const DUREES: [number, number][] = [
 [
  30,
  10
 ],
 [
  45,
  15
 ],
 [
  60,
  20
 ]
];
export const MUSCLES: [RegExp, string][] = ([
 [
  "pector",
  "Pectoraux"
 ],
 [
  "épaule|rotateur|coiffe|faisceau",
  "Épaules"
 ],
 [
  "triceps",
  "Triceps"
 ],
 [
  "biceps|brachial",
  "Biceps"
 ],
 [
  "trapèze",
  "Trapèzes"
 ],
 [
  "dorsal|dos",
  "Dos"
 ],
 [
  "lombaire",
  "Lombaires"
 ],
 [
  "quadri",
  "Quadriceps"
 ],
 [
  "ischio|chaîne post",
  "Ischio-jambiers"
 ],
 [
  "fessier",
  "Fessiers"
 ],
 [
  "mollet|soléaire|gastroc",
  "Mollets"
 ],
 [
  "adducteur",
  "Adducteurs"
 ],
 [
  "abdo|oblique|gainage",
  "Abdominaux"
 ],
 [
  "avant-bras|fléchisseurs$|extenseurs",
  "Avant-bras"
 ],
 [
  "hanche|psoas",
  "Hanches"
 ],
 [
  "cardio",
  "Cardio"
 ],
 [
  "jambes",
  "Jambes"
 ]
] as [string, string][]).map(([r, n]) => [new RegExp(r), n] as [RegExp, string]);
export const OBJN: string[] = [
 "Prendre du muscle",
 "Gagner en force",
 "M'affiner et perdre du gras",
 "Rester en forme"
];
export const REGN: string[] = [
 "Reprise complète",
 "Entraînement par périodes",
 "1 à 2 fois par semaine",
 "3 fois par semaine ou plus"
];
export const MATN: string[] = [
 "Salle complète",
 "Home gym",
 "Haltères seuls",
 "Poids du corps"
];
export const BLESN: string[] = [
 "Épaules",
 "Bas du dos",
 "Genoux",
 "Coudes ou poignets"
];
export const LESTABLE = new Set<string>([
 "russ",
 "cr",
 "crinv",
 "rj",
 "rgen",
 "dbug",
 "pomp",
 "bdips",
 "ra",
 "pont",
 "pont1",
 "sqpc",
 "fepc",
 "molP",
 "lomsol",
 "addsol",
 "gai",
 "plat",
 "sup",
 "pompl",
 "pompt",
 "kickpc",
 "situp",
 "crd",
 "rjb",
 "tuck"
]);
export const PAS_REPOS: string[] = [
 "30 s",
 "45 s",
 "60 s",
 "90 s",
 "2 min",
 "2 min 30",
 "3 min",
 "4 min"
];
export const HAUT = new Set<string>([
 "ph",
 "pv",
 "tv",
 "th",
 "ep",
 "re",
 "fc",
 "ec"
]);
export const BAS = new Set<string>([
 "eg",
 "fh"
]);
export const TYPES: [string, string][] = [
 [
  "m3",
  "Poids du corps"
 ],
 [
  "m2",
  "Haltères"
 ],
 [
  "m1",
  "Barre"
 ],
 [
  "m0",
  "Machines"
 ],
 [
  "kb",
  "Kettlebell"
 ],
 [
  "el",
  "Élastiques"
 ]
];
