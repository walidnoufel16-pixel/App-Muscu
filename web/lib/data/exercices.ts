/* Généré depuis l'ancienne app (public/index.html) — ne pas éditer à la main sans relancer les tests de parité. */
import type { Exercice } from "./types";
import { langue } from "@/lib/i18n";
import EX_EN from "@/lib/i18n/exercices.en.json";

/* 231 exercices — photos free-exercise-db (domaine public) dans public/img/.
   Les textes des fiches (exécution, erreurs, progression) sont à part, dans
   public/data/fiches.json, chargés seulement à l'ouverture d'une fiche. */
export const EX: Record<string, Exercice> = {
 "dc": {
  "n": "Développé couché barre",
  "m": "Pectoraux, triceps",
  "img": "Barbell_Bench_Press_-_Medium_Grip",
  "pat": "ph",
  "pat2": "ec",
  "eq": 1,
  "ch": "kg",
  "d": 60,
  "cap": 8
 },
 "dh": {
  "n": "Développé couché haltères",
  "m": "Pectoraux, triceps",
  "img": "Dumbbell_Bench_Press",
  "pat": "ph",
  "pat2": "ec",
  "eq": 2,
  "ch": "kg",
  "d": 22
 },
 "pomp": {
  "n": "Pompes",
  "m": "Pectoraux, triceps",
  "img": "Pushups",
  "pat": "ph",
  "pat2": "ec",
  "eq": 3,
  "ch": "aucune",
  "d": 12
 },
 "dip": {
  "n": "Dips",
  "m": "Pectoraux bas, triceps",
  "img": "Dips_-_Chest_Version",
  "pat": "ph",
  "pat2": "ec",
  "eq": 3,
  "ch": "lest",
  "d": 0
 },
 "dm": {
  "n": "Développé militaire",
  "m": "Épaules, triceps",
  "img": "Standing_Military_Press",
  "pat": "pv",
  "pat2": "ec",
  "eq": 1,
  "ch": "kg",
  "d": 35
 },
 "dmh": {
  "n": "Développé épaules haltères",
  "m": "Épaules, triceps",
  "img": "Dumbbell_Shoulder_Press",
  "pat": "pv",
  "pat2": "ec",
  "eq": 2,
  "ch": "kg",
  "d": 16
 },
 "pv3": {
  "n": "Pompes en appui vertical",
  "m": "Épaules, triceps",
  "img": "Handstand_Push-Ups",
  "pat": "pv",
  "pat2": "ec",
  "eq": 3,
  "ch": "aucune",
  "d": 6
 },
 "tr": {
  "n": "Tractions pronation",
  "m": "Dos, biceps",
  "img": "Pullups",
  "pat": "tv",
  "pat2": "fc",
  "eq": 3,
  "ch": "lest",
  "d": 5,
  "bt": 1
 },
 "tp": {
  "n": "Tirage vertical à la poulie",
  "m": "Dos, biceps",
  "img": "Wide-Grip_Lat_Pulldown",
  "pat": "tv",
  "pat2": "fc",
  "eq": 0,
  "ch": "kg",
  "d": 55
 },
 "rw": {
  "n": "Rowing barre",
  "m": "Dos, arrière d'épaule",
  "img": "Bent_Over_Barbell_Row",
  "pat": "th",
  "pat2": "fc",
  "eq": 1,
  "ch": "kg",
  "d": 50
 },
 "rh": {
  "n": "Rowing haltère un bras",
  "m": "Dos, arrière d'épaule, biceps",
  "img": "One-Arm_Dumbbell_Row",
  "pat": "th",
  "pat2": "fc",
  "eq": 2,
  "ch": "kg",
  "d": 26
 },
 "ra": {
  "n": "Rowing australien",
  "m": "Dos, arrière d'épaule, biceps",
  "img": "Inverted_Row",
  "pat": "th",
  "pat2": "fc",
  "eq": 3,
  "ch": "aucune",
  "d": 12
 },
 "sq": {
  "n": "Squat barre",
  "m": "Quadriceps, fessiers",
  "img": "Barbell_Squat",
  "pat": "eg",
  "pat2": "fh",
  "eq": 1,
  "ch": "kg",
  "d": 80,
  "capDeb": 8
 },
 "pr": {
  "n": "Presse à cuisses",
  "m": "Quadriceps, fessiers",
  "img": "Leg_Press",
  "pat": "eg",
  "pat2": "fh",
  "eq": 0,
  "ch": "kg",
  "d": 120
 },
 "fe": {
  "n": "Fentes haltères",
  "m": "Quadriceps, fessiers",
  "img": "Dumbbell_Lunges",
  "pat": "eg",
  "pat2": "fh",
  "eq": 2,
  "ch": "kg",
  "d": 14
 },
 "rm": {
  "n": "Soulevé de terre roumain",
  "m": "Ischio-jambiers, fessiers",
  "img": "Romanian_Deadlift",
  "pat": "fh",
  "pat2": "lo",
  "eq": 1,
  "ch": "kg",
  "d": 70
 },
 "ht": {
  "n": "Hip thrust barre",
  "m": "Fessiers",
  "img": "Barbell_Hip_Thrust",
  "pat": "fh",
  "pat2": "eg",
  "eq": 1,
  "ch": "kg",
  "d": 60
 },
 "el": {
  "n": "Élévations latérales",
  "m": "Épaules, faisceau moyen",
  "img": "Side_Lateral_Raise",
  "pat": "ep",
  "pat2": "tra",
  "eq": 2,
  "ch": "kg",
  "d": 8
 },
 "fp": {
  "soin": "epaules",
  "n": "Face pull",
  "m": "Arrière d'épaule, rotateurs",
  "img": "Face_Pull",
  "pat": "re",
  "pat2": "tra",
  "eq": 0,
  "ch": "kg",
  "d": 25
 },
 "cu": {
  "n": "Curl haltères incliné",
  "m": "Biceps",
  "img": "Incline_Dumbbell_Curl",
  "pat": "fc",
  "pat2": "avb",
  "eq": 2,
  "ch": "kg",
  "d": 12
 },
 "tri": {
  "n": "Extensions à la poulie",
  "m": "Triceps",
  "img": "Triceps_Pushdown",
  "pat": "ec",
  "eq": 0,
  "ch": "kg",
  "d": 25
 },
 "gai": {
  "n": "Gainage ventral",
  "m": "Abdominaux, lombaires",
  "img": "Plank",
  "pat": "ae",
  "pat2": "ft",
  "eq": 3,
  "ch": "temps",
  "d": 45
 },
 "rj": {
  "n": "Relevés de jambes suspendu",
  "m": "Abdominaux, fléchisseurs",
  "img": "Hanging_Leg_Raise",
  "pat": "ft",
  "pat2": "ae",
  "eq": 3,
  "ch": "aucune",
  "d": 10,
  "bt": 1
 },
 "lom": {
  "n": "Extensions lombaires au banc",
  "m": "Lombaires, fessiers",
  "img": "Hyperextensions_Back_Extensions",
  "pat": "lo",
  "pat2": "fh",
  "eq": 3,
  "ch": "lest",
  "d": 0
 },
 "ram": {
  "n": "Rameur, intervalles",
  "m": "Cardio, chaîne postérieure",
  "img": "Rowing_Stationary",
  "pat": "ca",
  "eq": 0,
  "ch": "dist",
  "d": 250
 },
 "hip": {
  "soin": "hanches",
  "n": "Étirement des fléchisseurs de hanche",
  "m": "Hanches, psoas",
  "img": "Kneeling_Hip_Flexor",
  "pat": "mo",
  "eq": 3,
  "ch": "temps",
  "d": 45
 },
 "tho": {
  "soin": "dos",
  "n": "Étirement du chat",
  "m": "Haut du dos, mobilité",
  "img": "Cat_Stretch",
  "pat": "mo",
  "eq": 3,
  "ch": "aucune",
  "d": 10
 },
 "dci": {
  "n": "Développé incliné barre",
  "m": "Haut des pectoraux, épaules",
  "img": "Barbell_Incline_Bench_Press_-_Medium_Grip",
  "pat": "ph",
  "pat2": "ec",
  "eq": 1,
  "ch": "kg",
  "d": 45,
  "cap": 8
 },
 "dhi": {
  "n": "Développé incliné haltères",
  "m": "Haut des pectoraux, épaules",
  "img": "Incline_Dumbbell_Press",
  "pat": "ph",
  "pat2": "ec",
  "eq": 2,
  "ch": "kg",
  "d": 18
 },
 "ecart": {
  "n": "Écarté à la poulie",
  "m": "Pectoraux",
  "img": "Cable_Crossover",
  "pat": "ph",
  "eq": 0,
  "ch": "kg",
  "d": 15
 },
 "arn": {
  "n": "Développé Arnold",
  "m": "Épaules, faisceaux antérieur et moyen",
  "img": "Arnold_Dumbbell_Press",
  "pat": "pv",
  "pat2": "ec",
  "eq": 2,
  "ch": "kg",
  "d": 12
 },
 "trs": {
  "n": "Tractions supination",
  "m": "Dos, biceps",
  "img": "Chin-Up",
  "pat": "tv",
  "pat2": "fc",
  "eq": 3,
  "ch": "lest",
  "d": 5,
  "bt": 1
 },
 "tpn": {
  "n": "Tirage poulie prise serrée",
  "m": "Dos, biceps",
  "img": "V-Bar_Pulldown",
  "pat": "tv",
  "pat2": "fc",
  "eq": 0,
  "ch": "kg",
  "d": 50
 },
 "tps": {
  "n": "Tirage horizontal à la poulie",
  "m": "Dos, arrière d'épaule",
  "img": "Seated_Cable_Rows",
  "pat": "th",
  "pat2": "fc",
  "eq": 0,
  "ch": "kg",
  "d": 45
 },
 "rw2": {
  "n": "Rowing deux haltères",
  "m": "Dos, arrière d'épaule",
  "img": "Bent_Over_Two-Dumbbell_Row",
  "pat": "th",
  "pat2": "fc",
  "eq": 2,
  "ch": "kg",
  "d": 20
 },
 "fb": {
  "n": "Fentes barre",
  "m": "Quadriceps, fessiers",
  "img": "Barbell_Lunge",
  "pat": "eg",
  "pat2": "fh",
  "eq": 1,
  "ch": "kg",
  "d": 30
 },
 "lext": {
  "n": "Leg extension",
  "m": "Quadriceps",
  "img": "Leg_Extensions",
  "pat": "eg",
  "eq": 0,
  "ch": "kg",
  "d": 40
 },
 "sqf": {
  "n": "Squat avant",
  "m": "Quadriceps, fessiers, gainage",
  "img": "Front_Barbell_Squat",
  "pat": "eg",
  "pat2": "fh",
  "eq": 1,
  "ch": "kg",
  "d": 50
 },
 "lc": {
  "n": "Leg curl allongé",
  "m": "Ischio-jambiers",
  "img": "Lying_Leg_Curls",
  "pat": "fh",
  "eq": 0,
  "ch": "kg",
  "d": 30
 },
 "gm": {
  "n": "Good morning",
  "m": "Ischio-jambiers, lombaires",
  "img": "Good_Morning",
  "pat": "fh",
  "pat2": "lo",
  "eq": 1,
  "ch": "kg",
  "d": 30
 },
 "sdt": {
  "n": "Soulevé de terre",
  "m": "Chaîne postérieure complète",
  "img": "Barbell_Deadlift",
  "pat": "fh",
  "pat2": "lo",
  "eq": 1,
  "ch": "kg",
  "d": 80,
  "cap": 8
 },
 "elf": {
  "n": "Élévations frontales",
  "m": "Épaules, faisceau antérieur",
  "img": "Front_Dumbbell_Raise",
  "pat": "ep",
  "pat2": "pv",
  "eq": 2,
  "ch": "kg",
  "d": 8
 },
 "rmf": {
  "n": "Oiseau à la machine",
  "m": "Arrière d'épaule",
  "img": "Reverse_Machine_Flyes",
  "pat": "re",
  "pat2": "tra",
  "eq": 0,
  "ch": "kg",
  "d": 20
 },
 "rot": {
  "soin": "epaules",
  "n": "Rotation externe haltère",
  "m": "Coiffe des rotateurs",
  "img": "External_Rotation",
  "pat": "re",
  "eq": 2,
  "ch": "kg",
  "d": 4
 },
 "curlb": {
  "n": "Curl barre",
  "m": "Biceps",
  "img": "Barbell_Curl",
  "pat": "fc",
  "pat2": "avb",
  "eq": 1,
  "ch": "kg",
  "d": 25
 },
 "mart": {
  "n": "Curl marteau",
  "m": "Biceps, brachial",
  "img": "Alternate_Hammer_Curl",
  "pat": "fc",
  "pat2": "avb",
  "eq": 2,
  "ch": "kg",
  "d": 12
 },
 "pup": {
  "n": "Curl au pupitre",
  "m": "Biceps",
  "img": "Preacher_Curl",
  "pat": "fc",
  "pat2": "avb",
  "eq": 1,
  "ch": "kg",
  "d": 20
 },
 "dipt": {
  "n": "Dips prise serrée",
  "m": "Triceps",
  "img": "Dips_-_Triceps_Version",
  "pat": "ec",
  "pat2": "ph",
  "eq": 3,
  "ch": "lest",
  "d": 0
 },
 "nuq": {
  "n": "Extension nuque à la corde",
  "m": "Triceps, chef long",
  "img": "Cable_Rope_Overhead_Triceps_Extension",
  "pat": "ec",
  "eq": 0,
  "ch": "kg",
  "d": 20
 },
 "bdips": {
  "n": "Dips sur banc",
  "m": "Triceps",
  "img": "Bench_Dips",
  "pat": "ec",
  "pat2": "ph",
  "eq": 3,
  "ch": "aucune",
  "d": 12
 },
 "plat": {
  "n": "Gainage latéral",
  "m": "Obliques, stabilisateurs",
  "img": "Side_Bridge",
  "pat": "ae",
  "pat2": "ft",
  "eq": 3,
  "ch": "temps",
  "d": 30
 },
 "crp": {
  "n": "Crunch à la poulie",
  "m": "Abdominaux",
  "img": "Cable_Crunch",
  "pat": "ft",
  "pat2": "ae",
  "eq": 0,
  "ch": "kg",
  "d": 25
 },
 "cr": {
  "n": "Crunch au sol",
  "m": "Abdominaux",
  "img": "Crunches",
  "pat": "ft",
  "eq": 3,
  "ch": "aucune",
  "d": 15
 },
 "sup": {
  "n": "Superman",
  "m": "Lombaires, fessiers",
  "img": "Superman",
  "pat": "lo",
  "pat2": "fh",
  "eq": 3,
  "ch": "temps",
  "d": 20
 },
 "corde": {
  "n": "Corde à sauter",
  "m": "Cardio, mollets",
  "img": "Rope_Jumping",
  "pat": "ca",
  "eq": 3,
  "ch": "temps",
  "d": 60
 },
 "enf": {
  "soin": "dos",
  "n": "Posture de l'enfant",
  "m": "Dos, hanches",
  "img": "Childs_Pose",
  "pat": "mo",
  "eq": 3,
  "ch": "temps",
  "d": 60
 },
 "mol": {
  "n": "Mollets debout",
  "m": "Mollets, gastrocnémiens",
  "img": "Standing_Calf_Raises",
  "pat": "mol",
  "eq": 0,
  "ch": "kg",
  "d": 60
 },
 "molA": {
  "n": "Mollets assis",
  "m": "Soléaire",
  "img": "Seated_Calf_Raise",
  "pat": "mol",
  "eq": 0,
  "ch": "kg",
  "d": 40
 },
 "molP": {
  "soin": "chevilles",
  "n": "Mollets au poids du corps",
  "m": "Mollets",
  "img": "Rocking_Standing_Calf_Raise",
  "pat": "mol",
  "eq": 3,
  "ch": "aucune",
  "d": 20
 },
 "shr": {
  "n": "Shrugs barre",
  "m": "Trapèzes supérieurs",
  "img": "Barbell_Shrug",
  "pat": "tra",
  "eq": 1,
  "ch": "kg",
  "d": 60
 },
 "shrH": {
  "n": "Shrugs haltères",
  "m": "Trapèzes supérieurs",
  "img": "Dumbbell_Shrug",
  "pat": "tra",
  "eq": 2,
  "ch": "kg",
  "d": 24
 },
 "tir": {
  "n": "Rowing menton",
  "m": "Trapèzes, épaules",
  "img": "Upright_Barbell_Row",
  "pat": "tra",
  "pat2": "ep",
  "eq": 1,
  "ch": "kg",
  "d": 30
 },
 "poi": {
  "n": "Curl de poignets",
  "m": "Avant-bras, fléchisseurs",
  "img": "Palms-Up_Barbell_Wrist_Curl_Over_A_Bench",
  "pat": "avb",
  "eq": 1,
  "ch": "kg",
  "d": 15
 },
 "poiI": {
  "n": "Curl de poignets inversé",
  "m": "Avant-bras, extenseurs",
  "img": "Palms-Down_Wrist_Curl_Over_A_Bench",
  "pat": "avb",
  "eq": 1,
  "ch": "kg",
  "d": 8
 },
 "ferm": {
  "n": "Marche du fermier",
  "m": "Avant-bras, gainage, trapèzes",
  "img": "Farmers_Walk",
  "pat": "avb",
  "pat2": "tra",
  "eq": 2,
  "ch": "kg",
  "d": 24
 },
 "add": {
  "n": "Adducteurs à la machine",
  "m": "Adducteurs",
  "img": "Thigh_Adductor",
  "pat": "add",
  "eq": 0,
  "ch": "kg",
  "d": 40
 },
 "sumo": {
  "n": "Squat sumo haltère",
  "m": "Adducteurs, fessiers",
  "img": "Plie_Dumbbell_Squat",
  "pat": "add",
  "pat2": "eg",
  "eq": 2,
  "ch": "kg",
  "d": 20
 },
 "molh": {
  "n": "Mollets debout haltères",
  "m": "Mollets",
  "img": "Standing_Dumbbell_Calf_Raise",
  "pat": "mol",
  "eq": 2,
  "ch": "kg",
  "d": 20
 },
 "molp": {
  "n": "Mollets à la presse",
  "m": "Mollets",
  "img": "Calf_Press_On_The_Leg_Press_Machine",
  "pat": "mol",
  "eq": 0,
  "ch": "kg",
  "d": 60
 },
 "mol1": {
  "n": "Mollets sur une jambe",
  "m": "Mollets",
  "img": "Calf_Raise_On_A_Dumbbell",
  "pat": "mol",
  "eq": 3,
  "ch": "lest",
  "d": 0
 },
 "elp": {
  "n": "Élévations latérales à la poulie",
  "m": "Épaules, faisceau latéral",
  "img": "Cable_Seated_Lateral_Raise",
  "pat": "ep",
  "eq": 0,
  "ch": "kg",
  "d": 5
 },
 "scap": {
  "n": "Élévations en Y",
  "m": "Épaules, faisceau latéral et avant",
  "img": "Dumbbell_Scaption",
  "pat": "ep",
  "pat2": "pv",
  "eq": 2,
  "ch": "kg",
  "d": 4
 },
 "dbug": {
  "n": "Dead bug",
  "m": "Abdominaux profonds, gainage",
  "img": "Dead_Bug",
  "pat": "ae",
  "pat2": "ft",
  "eq": 3,
  "ch": "aucune",
  "d": 0
 },
 "pal": {
  "n": "Pallof press",
  "m": "Gainage anti-rotation, obliques",
  "img": "Pallof_Press",
  "pat": "ae",
  "pat2": "ft",
  "eq": 0,
  "ch": "kg",
  "d": 10
 },
 "rkp": {
  "n": "Soulevé de terre partiel",
  "m": "Lombaires, trapèzes, fessiers",
  "img": "Rack_Pulls",
  "pat": "lo",
  "pat2": "fh",
  "eq": 1,
  "ch": "kg",
  "d": 70,
  "cap": 8
 },
 "lomsol": {
  "n": "Extensions lombaires au sol",
  "m": "Lombaires, fessiers",
  "img": "Hyperextensions_With_No_Hyperextension_Bench",
  "pat": "lo",
  "pat2": "fh",
  "eq": 3,
  "ch": "aucune",
  "d": 0
 },
 "tirp": {
  "n": "Rowing menton à la poulie",
  "m": "Trapèzes, épaules",
  "img": "Upright_Cable_Row",
  "pat": "tra",
  "pat2": "ep",
  "eq": 0,
  "ch": "kg",
  "d": 20
 },
 "poih": {
  "n": "Curl de poignets haltères",
  "m": "Avant-bras, fléchisseurs",
  "img": "Seated_Dumbbell_Palms-Up_Wrist_Curl",
  "pat": "avb",
  "eq": 2,
  "ch": "kg",
  "d": 6
 },
 "poiinv": {
  "soin": "poignets",
  "n": "Curl de poignets inversé haltères",
  "m": "Avant-bras, extenseurs",
  "img": "Palms-Down_Dumbbell_Wrist_Curl_Over_A_Bench",
  "pat": "avb",
  "eq": 2,
  "ch": "kg",
  "d": 4
 },
 "addsol": {
  "n": "Élévations de jambe au sol",
  "m": "Adducteurs, hanche",
  "img": "Side_Leg_Raises",
  "pat": "add",
  "eq": 3,
  "ch": "aucune",
  "d": 0
 },
 "sqlat": {
  "n": "Squat latéral barre",
  "m": "Adducteurs, quadriceps, fessiers",
  "img": "Barbell_Side_Split_Squat",
  "pat": "add",
  "pat2": "eg",
  "eq": 1,
  "ch": "kg",
  "d": 30
 },
 "ois": {
  "n": "Oiseau haltères",
  "m": "Épaules arrière, trapèzes",
  "img": "Reverse_Flyes",
  "pat": "re",
  "pat2": "tra",
  "eq": 2,
  "ch": "kg",
  "d": 6
 },
 "crinv": {
  "n": "Crunch inversé",
  "m": "Abdominaux, bas",
  "img": "Reverse_Crunch",
  "pat": "ft",
  "eq": 3,
  "ch": "aucune",
  "d": 0
 },
 "russ": {
  "n": "Russian twist",
  "m": "Obliques, gainage en rotation",
  "img": "Russian_Twist",
  "pat": "ft",
  "pat2": "ae",
  "eq": 3,
  "ch": "aucune",
  "d": 0
 },
 "pont": {
  "n": "Pont fessier au sol",
  "m": "Fessiers, ischio-jambiers",
  "img": "Butt_Lift_Bridge",
  "pat": "fh",
  "eq": 3,
  "ch": "aucune",
  "d": 0
 },
 "pont1": {
  "n": "Pont fessier une jambe",
  "m": "Fessiers, ischio-jambiers",
  "img": "Single_Leg_Glute_Bridge",
  "pat": "fh",
  "eq": 3,
  "ch": "aucune",
  "d": 0
 },
 "kick": {
  "n": "Kickback à la poulie",
  "m": "Fessiers",
  "img": "One-Legged_Cable_Kickback",
  "pat": "fh",
  "eq": 0,
  "ch": "kg",
  "d": 5
 },
 "pth": {
  "n": "Pull through à la poulie",
  "m": "Fessiers, ischio-jambiers",
  "img": "Pull_Through",
  "pat": "fh",
  "eq": 0,
  "ch": "kg",
  "d": 25
 },
 "bul": {
  "n": "Fentes bulgares haltères",
  "m": "Quadriceps, fessiers",
  "img": "Split_Squat_with_Dumbbells",
  "pat": "eg",
  "pat2": "fh",
  "eq": 2,
  "ch": "kg",
  "d": 12
 },
 "mont": {
  "n": "Montées sur banc haltères",
  "m": "Quadriceps, fessiers",
  "img": "Dumbbell_Step_Ups",
  "pat": "eg",
  "pat2": "fh",
  "eq": 2,
  "ch": "kg",
  "d": 10
 },
 "sqpc": {
  "n": "Squat au poids du corps",
  "m": "Quadriceps, fessiers",
  "img": "Bodyweight_Squat",
  "pat": "eg",
  "pat2": "fh",
  "eq": 3,
  "ch": "aucune",
  "d": 0
 },
 "fepc": {
  "n": "Fentes marchées",
  "m": "Quadriceps, fessiers",
  "img": "Bodyweight_Walking_Lunge",
  "pat": "eg",
  "pat2": "fh",
  "eq": 3,
  "ch": "aucune",
  "d": 0
 },
 "bfront": {
  "n": "Barre au front",
  "m": "Triceps",
  "img": "Lying_Triceps_Press",
  "pat": "ec",
  "eq": 1,
  "ch": "kg",
  "d": 20
 },
 "extnh": {
  "n": "Extension nuque haltère",
  "m": "Triceps, chef long",
  "img": "Seated_Triceps_Press",
  "pat": "ec",
  "eq": 2,
  "ch": "kg",
  "d": 12
 },
 "kickt": {
  "n": "Kickback triceps haltère",
  "m": "Triceps",
  "img": "Tricep_Dumbbell_Kickback",
  "pat": "ec",
  "eq": 2,
  "ch": "kg",
  "d": 6
 },
 "curlp": {
  "n": "Curl à la poulie",
  "m": "Biceps",
  "img": "Standing_Biceps_Cable_Curl",
  "pat": "fc",
  "pat2": "avb",
  "eq": 0,
  "ch": "kg",
  "d": 20
 },
 "dmm": {
  "n": "Développé épaules machine",
  "m": "Épaules, triceps",
  "img": "Machine_Shoulder_Military_Press",
  "pat": "pv",
  "pat2": "ec",
  "eq": 0,
  "ch": "kg",
  "d": 25
 },
 "velo": {
  "n": "Vélo, intervalles",
  "m": "Cardio, jambes",
  "img": "Bicycling_Stationary",
  "pat": "ca",
  "eq": 0,
  "ch": "temps",
  "d": 0
 },
 "scappu": {
  "n": "Tractions scapulaires",
  "m": "Trapèzes, épaules arrière",
  "img": "Scapular_Pull-Up",
  "pat": "tra",
  "pat2": "re",
  "eq": 3,
  "ch": "aucune",
  "d": 0,
  "bt": 1
 },
 "pompe": {
  "n": "Pompes pieds surélevés",
  "m": "Pectoraux haut, épaules, triceps",
  "img": "Push-Ups_With_Feet_Elevated",
  "pat": "ph",
  "pat2": "pv",
  "eq": 3,
  "ch": "lest",
  "d": 0
 },
 "pecdk": {
  "n": "Pec deck (butterfly)",
  "m": "Pectoraux",
  "img": "Butterfly",
  "pat": "ph",
  "eq": 0,
  "ch": "kg",
  "d": 35
 },
 "chpm": {
  "n": "Chest press à la machine",
  "m": "Pectoraux, triceps",
  "img": "Leverage_Chest_Press",
  "pat": "ph",
  "pat2": "ec",
  "eq": 0,
  "ch": "kg",
  "d": 40
 },
 "ecah": {
  "n": "Écarté haltères",
  "m": "Pectoraux",
  "img": "Dumbbell_Flyes",
  "pat": "ph",
  "eq": 2,
  "ch": "kg",
  "d": 10
 },
 "ecai": {
  "n": "Écarté incliné haltères",
  "m": "Haut des pectoraux",
  "img": "Incline_Dumbbell_Flyes",
  "pat": "ph",
  "eq": 2,
  "ch": "kg",
  "d": 8
 },
 "ecab": {
  "n": "Écarté poulie basse",
  "m": "Haut des pectoraux",
  "img": "Low_Cable_Crossover",
  "pat": "ph",
  "eq": 0,
  "ch": "kg",
  "d": 6
 },
 "rwapp": {
  "n": "Rowing buste appuyé haltères",
  "m": "Dos, arrière d'épaule",
  "img": "Dumbbell_Incline_Row",
  "pat": "th",
  "pat2": "re",
  "eq": 2,
  "ch": "kg",
  "d": 16
 },
 "tbar": {
  "n": "Rowing T-bar",
  "m": "Dos, épaisseur",
  "img": "T-Bar_Row_with_Handle",
  "pat": "th",
  "pat2": "lo",
  "eq": 1,
  "ch": "kg",
  "d": 30
 },
 "rwm": {
  "n": "Rowing à la machine",
  "m": "Dos",
  "img": "Leverage_Iso_Row",
  "pat": "th",
  "eq": 0,
  "ch": "kg",
  "d": 40
 },
 "tbt": {
  "n": "Tirage bras tendus à la poulie",
  "m": "Grand dorsal",
  "img": "Straight-Arm_Pulldown",
  "pat": "tv",
  "eq": 0,
  "ch": "kg",
  "d": 20
 },
 "pull": {
  "n": "Pull-over haltère",
  "m": "Grand dorsal, pectoraux",
  "img": "Bent-Arm_Dumbbell_Pullover",
  "pat": "tv",
  "pat2": "ph",
  "eq": 2,
  "ch": "kg",
  "d": 14
 },
 "oisp": {
  "n": "Oiseau à la poulie",
  "m": "Arrière d'épaule",
  "img": "Cable_Rear_Delt_Fly",
  "pat": "re",
  "eq": 0,
  "ch": "kg",
  "d": 4
 },
 "pp": {
  "n": "Push press",
  "m": "Épaules, triceps, jambes",
  "img": "Push_Press",
  "pat": "pv",
  "pat2": "ec",
  "eq": 1,
  "ch": "kg",
  "d": 40
 },
 "dcs": {
  "n": "Développé couché prise serrée",
  "m": "Triceps, pectoraux",
  "img": "Close-Grip_Barbell_Bench_Press",
  "pat": "ec",
  "pat2": "ph",
  "eq": 1,
  "ch": "kg",
  "d": 45,
  "cap": 8
 },
 "dipm": {
  "n": "Dips à la machine",
  "m": "Triceps, pectoraux",
  "img": "Dip_Machine",
  "pat": "ec",
  "pat2": "ph",
  "eq": 0,
  "ch": "kg",
  "d": 40
 },
 "curlc": {
  "n": "Curl concentré",
  "m": "Biceps",
  "img": "Concentration_Curls",
  "pat": "fc",
  "eq": 2,
  "ch": "kg",
  "d": 10
 },
 "martc": {
  "n": "Curl marteau à la corde",
  "m": "Biceps, avant-bras",
  "img": "Cable_Hammer_Curls_-_Rope_Attachment",
  "pat": "fc",
  "pat2": "avb",
  "eq": 0,
  "ch": "kg",
  "d": 20
 },
 "zott": {
  "n": "Curl Zottman",
  "m": "Biceps, avant-bras",
  "img": "Zottman_Curl",
  "pat": "fc",
  "pat2": "avb",
  "eq": 2,
  "ch": "kg",
  "d": 8
 },
 "hack": {
  "n": "Hack squat",
  "m": "Quadriceps, fessiers",
  "img": "Hack_Squat",
  "pat": "eg",
  "pat2": "fh",
  "eq": 0,
  "ch": "kg",
  "d": 60
 },
 "smith": {
  "n": "Squat à la Smith machine",
  "m": "Quadriceps, fessiers",
  "img": "Smith_Machine_Squat",
  "pat": "eg",
  "pat2": "fh",
  "eq": 0,
  "ch": "kg",
  "d": 50
 },
 "gob": {
  "n": "Goblet squat",
  "m": "Quadriceps, fessiers",
  "img": "Goblet_Squat",
  "pat": "eg",
  "pat2": "fh",
  "eq": 2,
  "ou": "kb",
  "ch": "kg",
  "d": 16
 },
 "rmh": {
  "n": "Soulevé de terre roumain haltères",
  "m": "Ischio-jambiers, fessiers",
  "img": "Stiff-Legged_Dumbbell_Deadlift",
  "pat": "fh",
  "pat2": "lo",
  "eq": 2,
  "ch": "kg",
  "d": 20
 },
 "sdts": {
  "n": "Soulevé de terre sumo",
  "m": "Fessiers, adducteurs, ischio-jambiers, quadriceps",
  "img": "Sumo_Deadlift",
  "pat": "fh",
  "pat2": "add",
  "eq": 1,
  "ch": "kg",
  "d": 70,
  "cap": 8
 },
 "trap": {
  "n": "Soulevé de terre à la trap bar",
  "m": "Fessiers, quadriceps, dos",
  "img": "Trap_Bar_Deadlift",
  "pat": "fh",
  "pat2": "eg",
  "eq": 0,
  "ch": "kg",
  "d": 70,
  "cap": 8
 },
 "abd": {
  "n": "Abducteurs à la machine",
  "m": "Moyen fessier",
  "img": "Thigh_Abductor",
  "pat": "fh",
  "eq": 0,
  "ch": "kg",
  "d": 40
 },
 "nord": {
  "n": "Nordic curl",
  "m": "Ischio-jambiers",
  "img": "Natural_Glute_Ham_Raise",
  "pat": "fh",
  "eq": 3,
  "ch": "aucune",
  "d": 0
 },
 "roue": {
  "n": "Roue abdominale",
  "m": "Abdominaux, gainage",
  "img": "Ab_Roller",
  "pat": "ae",
  "pat2": "ft",
  "eq": 3,
  "ch": "aucune",
  "d": 0
 },
 "rgen": {
  "n": "Relevés de genoux aux barres",
  "m": "Abdominaux, fléchisseurs de hanche",
  "img": "Knee_Hip_Raise_On_Parallel_Bars",
  "pat": "ft",
  "eq": 3,
  "ch": "aucune",
  "d": 0
 },
 "mclimb": {
  "n": "Mountain climbers",
  "m": "Gainage, cardio",
  "img": "Mountain_Climbers",
  "pat": "ae",
  "pat2": "ca",
  "eq": 3,
  "ch": "temps",
  "d": 30
 },
 "ellip": {
  "n": "Vélo elliptique",
  "m": "Cardio, corps entier",
  "img": "Elliptical_Trainer",
  "pat": "ca",
  "eq": 0,
  "ch": "temps",
  "d": 0
 },
 "stair": {
  "n": "Stairmaster",
  "m": "Cardio, fessiers, quadriceps",
  "img": "Stairmaster",
  "pat": "ca",
  "pat2": "eg",
  "eq": 0,
  "ch": "temps",
  "d": 0
 },
 "tapis": {
  "n": "Course sur tapis",
  "m": "Cardio, jambes",
  "img": "Running_Treadmill",
  "pat": "ca",
  "eq": 0,
  "ch": "temps",
  "d": 0
 },
 "wgs": {
  "soin": "hanches",
  "n": "World's greatest stretch",
  "m": "Hanches, dos, épaules",
  "img": "Worlds_Greatest_Stretch",
  "pat": "mo",
  "eq": 3,
  "ch": "aucune",
  "d": 5
 },
 "ischs": {
  "soin": "hanches",
  "n": "Étirement des ischio-jambiers",
  "m": "Ischio-jambiers",
  "img": "Hamstring_Stretch",
  "pat": "mo",
  "eq": 3,
  "ch": "temps",
  "d": 45
 },
 "kbsw": {
  "n": "Swing kettlebell à un bras",
  "m": "Fessiers, ischio-jambiers, cardio",
  "img": "One-Arm_Kettlebell_Swings",
  "pat": "fh",
  "pat2": "ca",
  "eq": 3,
  "acc": "kb",
  "ch": "kg",
  "d": 12
 },
 "kbfs": {
  "n": "Front squat deux kettlebells",
  "m": "Quadriceps, fessiers, gainage",
  "img": "Front_Squats_With_Two_Kettlebells",
  "pat": "eg",
  "pat2": "fh",
  "eq": 3,
  "acc": "kb",
  "ch": "kg",
  "d": 12
 },
 "kbsdt1": {
  "n": "Soulevé de terre une jambe kettlebell",
  "m": "Ischio-jambiers, fessiers, équilibre",
  "img": "Kettlebell_One-Legged_Deadlift",
  "pat": "fh",
  "pat2": "lo",
  "eq": 3,
  "acc": "kb",
  "ch": "kg",
  "d": 12
 },
 "kbdm": {
  "n": "Développé militaire deux kettlebells",
  "m": "Épaules, triceps",
  "img": "Two-Arm_Kettlebell_Military_Press",
  "pat": "pv",
  "pat2": "ec",
  "eq": 3,
  "acc": "kb",
  "ch": "kg",
  "d": 12
 },
 "kbfp": {
  "n": "Floor press kettlebell",
  "m": "Pectoraux, triceps",
  "img": "One-Arm_Kettlebell_Floor_Press",
  "pat": "ph",
  "pat2": "ec",
  "eq": 3,
  "acc": "kb",
  "ch": "kg",
  "d": 12
 },
 "kbrw": {
  "n": "Rowing kettlebell un bras",
  "m": "Dos, arrière d'épaule",
  "img": "One-Arm_Kettlebell_Row",
  "pat": "th",
  "pat2": "re",
  "eq": 3,
  "acc": "kb",
  "ch": "kg",
  "d": 16
 },
 "kbhp": {
  "n": "Tirage menton sumo kettlebell",
  "m": "Trapèzes, épaules, fessiers",
  "img": "Kettlebell_Sumo_High_Pull",
  "pat": "tra",
  "pat2": "fh",
  "eq": 3,
  "acc": "kb",
  "ch": "kg",
  "d": 16
 },
 "kbtgu": {
  "n": "Turkish get-up",
  "m": "Gainage, épaules, corps entier",
  "img": "Kettlebell_Turkish_Get-Up_Squat_style",
  "pat": "ae",
  "pat2": "pv",
  "eq": 3,
  "acc": "kb",
  "ch": "kg",
  "d": 8
 },
 "kbwm": {
  "n": "Windmill kettlebell",
  "m": "Obliques, épaules, hanches",
  "img": "Kettlebell_Windmill",
  "pat": "ae",
  "pat2": "mo",
  "eq": 3,
  "acc": "kb",
  "ch": "kg",
  "d": 8
 },
 "kbthr": {
  "n": "Thruster kettlebell",
  "m": "Jambes, épaules, cardio",
  "img": "Kettlebell_Thruster",
  "pat": "pv",
  "pat2": "eg",
  "eq": 3,
  "acc": "kb",
  "ch": "kg",
  "d": 12
 },
 "elpa": {
  "soin": "epaules",
  "n": "Écartés bras tendus à l'élastique",
  "m": "Arrière d'épaule, haut du dos",
  "img": "Band_Pull_Apart",
  "pat": "re",
  "pat2": "tra",
  "eq": 3,
  "acc": "el",
  "ch": "aucune",
  "d": 0
 },
 "elrot": {
  "soin": "epaules",
  "n": "Rotation externe à l'élastique",
  "m": "Coiffe des rotateurs, arrière d'épaule",
  "img": "External_Rotation_with_Band",
  "pat": "re",
  "eq": 3,
  "acc": "el",
  "ch": "aucune",
  "d": 0
 },
 "eldm": {
  "n": "Développé épaules à l'élastique",
  "m": "Épaules, triceps",
  "img": "Shoulder_Press_-_With_Bands",
  "pat": "pv",
  "pat2": "ec",
  "eq": 3,
  "acc": "el",
  "ch": "aucune",
  "d": 0
 },
 "elel": {
  "n": "Élévations latérales à l'élastique",
  "m": "Épaules, faisceau latéral",
  "img": "Lateral_Raise_-_With_Bands",
  "pat": "ep",
  "eq": 3,
  "acc": "el",
  "ch": "aucune",
  "d": 0
 },
 "elec": {
  "n": "Écarté à l'élastique",
  "m": "Pectoraux",
  "img": "Cross_Over_-_With_Bands",
  "pat": "ph",
  "eq": 3,
  "acc": "el",
  "ch": "aucune",
  "d": 0
 },
 "elsq": {
  "n": "Squat à l'élastique",
  "m": "Quadriceps, fessiers",
  "img": "Squats_-_With_Bands",
  "pat": "eg",
  "pat2": "fh",
  "eq": 3,
  "acc": "el",
  "ch": "aucune",
  "d": 0
 },
 "elgm": {
  "n": "Good morning à l'élastique",
  "m": "Ischio-jambiers, lombaires",
  "img": "Band_Good_Morning",
  "pat": "fh",
  "pat2": "lo",
  "eq": 3,
  "acc": "el",
  "ch": "aucune",
  "d": 0
 },
 "elpt": {
  "n": "Pull through à l'élastique",
  "m": "Fessiers, ischio-jambiers",
  "img": "Band_Good_Morning_Pull_Through",
  "pat": "fh",
  "eq": 3,
  "acc": "el",
  "ch": "aucune",
  "d": 0
 },
 "elmw": {
  "n": "Monster walk",
  "m": "Moyen fessier",
  "img": "Monster_Walk",
  "pat": "fh",
  "pat2": "add",
  "eq": 3,
  "acc": "el",
  "ch": "aucune",
  "d": 0
 },
 "eladd": {
  "n": "Adducteurs à l'élastique",
  "m": "Adducteurs",
  "img": "Band_Hip_Adductions",
  "pat": "add",
  "eq": 3,
  "acc": "el",
  "ch": "aucune",
  "d": 0
 },
 "elmol": {
  "n": "Mollets à l'élastique",
  "m": "Mollets",
  "img": "Calf_Raises_-_With_Bands",
  "pat": "mol",
  "eq": 3,
  "acc": "el",
  "ch": "aucune",
  "d": 0
 },
 "elrm": {
  "n": "Rowing menton à l'élastique",
  "m": "Trapèzes, épaules",
  "img": "Upright_Row_-_With_Bands",
  "pat": "tra",
  "pat2": "ep",
  "eq": 3,
  "acc": "el",
  "ch": "aucune",
  "d": 0
 },
 "eltr": {
  "n": "Tractions assistées à l'élastique",
  "m": "Dos, biceps",
  "img": "Band_Assisted_Pull-Up",
  "pat": "tv",
  "pat2": "fc",
  "eq": 3,
  "acc": "el",
  "ch": "aucune",
  "d": 0
 },
 "curlh": {
  "n": "Curl haltères",
  "m": "Biceps",
  "img": "Dumbbell_Bicep_Curl",
  "pat": "fc",
  "pat2": "avb",
  "eq": 2,
  "ch": "kg",
  "d": 10
 },
 "curlez": {
  "n": "Curl barre EZ",
  "m": "Biceps",
  "img": "EZ-Bar_Curl",
  "pat": "fc",
  "pat2": "avb",
  "eq": 1,
  "ch": "kg",
  "d": 20
 },
 "spid": {
  "n": "Spider curl",
  "m": "Biceps",
  "img": "Spider_Curl",
  "pat": "fc",
  "eq": 1,
  "ch": "kg",
  "d": 15
 },
 "pupp": {
  "n": "Curl pupitre à la poulie",
  "m": "Biceps",
  "img": "Cable_Preacher_Curl",
  "pat": "fc",
  "eq": 0,
  "ch": "kg",
  "d": 15
 },
 "pupm": {
  "n": "Curl pupitre à la machine",
  "m": "Biceps",
  "img": "Machine_Preacher_Curls",
  "pat": "fc",
  "eq": 0,
  "ch": "kg",
  "d": 20
 },
 "curlinv": {
  "n": "Curl barre en pronation",
  "m": "Avant-bras, brachial, biceps",
  "img": "Reverse_Barbell_Curl",
  "pat": "fc",
  "pat2": "avb",
  "eq": 1,
  "ch": "kg",
  "d": 15
 },
 "drag": {
  "n": "Drag curl",
  "m": "Biceps",
  "img": "Drag_Curl",
  "pat": "fc",
  "eq": 1,
  "ch": "kg",
  "d": 20
 },
 "martx": {
  "n": "Curl marteau croisé",
  "m": "Biceps, brachial, avant-bras",
  "img": "Cross_Body_Hammer_Curl",
  "pat": "fc",
  "pat2": "avb",
  "eq": 2,
  "ch": "kg",
  "d": 10
 },
 "tricor": {
  "n": "Extensions poulie à la corde",
  "m": "Triceps",
  "img": "Triceps_Pushdown_-_Rope_Attachment",
  "pat": "ec",
  "eq": 0,
  "ch": "kg",
  "d": 20
 },
 "skull": {
  "n": "Barre au front EZ",
  "m": "Triceps",
  "img": "EZ-Bar_Skullcrusher",
  "pat": "ec",
  "eq": 1,
  "ch": "kg",
  "d": 20
 },
 "extdb": {
  "n": "Extension nuque debout haltère",
  "m": "Triceps, chef long",
  "img": "Standing_Dumbbell_Triceps_Extension",
  "pat": "ec",
  "eq": 2,
  "ch": "kg",
  "d": 14
 },
 "pompt": {
  "n": "Pompes prise serrée",
  "m": "Triceps, pectoraux",
  "img": "Push-Ups_-_Close_Triceps_Position",
  "pat": "ec",
  "pat2": "ph",
  "eq": 3,
  "ch": "aucune",
  "d": 10
 },
 "trim": {
  "n": "Extension triceps à la machine",
  "m": "Triceps",
  "img": "Machine_Triceps_Extension",
  "pat": "ec",
  "eq": 0,
  "ch": "kg",
  "d": 25
 },
 "trinv": {
  "n": "Extensions poulie en supination",
  "m": "Triceps",
  "img": "Reverse_Grip_Triceps_Pushdown",
  "pat": "ec",
  "eq": 0,
  "ch": "kg",
  "d": 15
 },
 "bfronth": {
  "n": "Barre au front haltères",
  "m": "Triceps",
  "img": "Lying_Dumbbell_Tricep_Extension",
  "pat": "ec",
  "eq": 2,
  "ch": "kg",
  "d": 8
 },
 "elskull": {
  "n": "Barre au front à l'élastique",
  "m": "Triceps",
  "img": "Band_Skull_Crusher",
  "pat": "ec",
  "eq": 3,
  "acc": "el",
  "ch": "aucune",
  "d": 0
 },
 "dcd": {
  "n": "Développé décliné barre",
  "m": "Pectoraux bas, triceps",
  "img": "Decline_Barbell_Bench_Press",
  "pat": "ph",
  "pat2": "ec",
  "eq": 1,
  "ch": "kg",
  "d": 50,
  "cap": 8
 },
 "dhd": {
  "n": "Développé décliné haltères",
  "m": "Pectoraux bas, triceps",
  "img": "Decline_Dumbbell_Bench_Press",
  "pat": "ph",
  "pat2": "ec",
  "eq": 2,
  "ch": "kg",
  "d": 20
 },
 "dcsm": {
  "n": "Développé couché à la Smith",
  "m": "Pectoraux, triceps",
  "img": "Smith_Machine_Bench_Press",
  "pat": "ph",
  "pat2": "ec",
  "eq": 0,
  "ch": "kg",
  "d": 50
 },
 "dcism": {
  "n": "Développé incliné à la Smith",
  "m": "Haut des pectoraux, épaules",
  "img": "Smith_Machine_Incline_Bench_Press",
  "pat": "ph",
  "pat2": "ec",
  "eq": 0,
  "ch": "kg",
  "d": 40
 },
 "chpi": {
  "n": "Chest press incliné à la machine",
  "m": "Haut des pectoraux, épaules",
  "img": "Leverage_Incline_Chest_Press",
  "pat": "ph",
  "pat2": "ec",
  "eq": 0,
  "ch": "kg",
  "d": 35
 },
 "pompl": {
  "n": "Pompes prise large",
  "m": "Pectoraux, épaules",
  "img": "Push-Up_Wide",
  "pat": "ph",
  "pat2": "ec",
  "eq": 3,
  "ch": "aucune",
  "d": 12
 },
 "pompi": {
  "n": "Pompes inclinées",
  "m": "Pectoraux bas, triceps",
  "img": "Incline_Push-Up",
  "pat": "ph",
  "pat2": "ec",
  "eq": 3,
  "ch": "aucune",
  "d": 12
 },
 "ecpb": {
  "n": "Écarté poulie sur banc",
  "m": "Pectoraux",
  "img": "Flat_Bench_Cable_Flyes",
  "pat": "ph",
  "eq": 0,
  "ch": "kg",
  "d": 8
 },
 "ecpi": {
  "n": "Écarté poulie incliné",
  "m": "Haut des pectoraux",
  "img": "Incline_Cable_Flye",
  "pat": "ph",
  "eq": 0,
  "ch": "kg",
  "d": 6
 },
 "eldc": {
  "n": "Développé couché à l'élastique",
  "m": "Pectoraux, triceps",
  "img": "Bench_Press_-_With_Bands",
  "pat": "ph",
  "pat2": "ec",
  "eq": 3,
  "acc": "el",
  "ch": "aucune",
  "d": 0
 },
 "dhn": {
  "n": "Développé haltères prise neutre",
  "m": "Pectoraux, triceps",
  "img": "Dumbbell_Bench_Press_with_Neutral_Grip",
  "pat": "ph",
  "pat2": "ec",
  "eq": 2,
  "ch": "kg",
  "d": 20
 },
 "dmsm": {
  "n": "Développé épaules à la Smith",
  "m": "Épaules, triceps",
  "img": "Smith_Machine_Overhead_Shoulder_Press",
  "pat": "pv",
  "pat2": "ec",
  "eq": 0,
  "ch": "kg",
  "d": 30
 },
 "dmhd": {
  "n": "Développé épaules haltères debout",
  "m": "Épaules, triceps, gainage",
  "img": "Standing_Dumbbell_Press",
  "pat": "pv",
  "pat2": "ec",
  "eq": 2,
  "ch": "kg",
  "d": 14
 },
 "elfp": {
  "n": "Élévations frontales à la poulie",
  "m": "Épaules, faisceau antérieur",
  "img": "Front_Cable_Raise",
  "pat": "ep",
  "eq": 0,
  "ch": "kg",
  "d": 8
 },
 "oisc": {
  "n": "Tirage corde arrière d'épaule",
  "m": "Arrière d'épaule, trapèzes",
  "img": "Cable_Rope_Rear-Delt_Rows",
  "pat": "re",
  "pat2": "tra",
  "eq": 0,
  "ch": "kg",
  "d": 15
 },
 "oisi": {
  "n": "Oiseau allongé sur banc incliné",
  "m": "Arrière d'épaule",
  "img": "Dumbbell_Lying_Rear_Lateral_Raise",
  "pat": "re",
  "eq": 2,
  "ch": "kg",
  "d": 5
 },
 "eli": {
  "n": "Élévation latérale sur banc incliné",
  "m": "Épaules, faisceau moyen",
  "img": "One-Arm_Incline_Lateral_Raise",
  "pat": "ep",
  "eq": 2,
  "ch": "kg",
  "d": 6
 },
 "cuban": {
  "soin": "epaules",
  "n": "Cuban press",
  "m": "Coiffe des rotateurs, épaules",
  "img": "Cuban_Press",
  "pat": "re",
  "pat2": "pv",
  "eq": 2,
  "ch": "kg",
  "d": 4
 },
 "rotp": {
  "soin": "epaules",
  "n": "Rotation externe à la poulie",
  "m": "Coiffe des rotateurs",
  "img": "External_Rotation_with_Cable",
  "pat": "re",
  "eq": 0,
  "ch": "kg",
  "d": 4
 },
 "kbdma": {
  "n": "Développé kettlebell alterné",
  "m": "Épaules, triceps",
  "img": "Alternating_Kettlebell_Press",
  "pat": "pv",
  "pat2": "ec",
  "eq": 3,
  "acc": "kb",
  "ch": "kg",
  "d": 12
 },
 "eloi": {
  "n": "Oiseau à l'élastique",
  "m": "Arrière d'épaule, haut du dos",
  "img": "Back_Flyes_-_With_Bands",
  "pat": "re",
  "pat2": "tra",
  "eq": 3,
  "acc": "el",
  "ch": "aucune",
  "d": 0
 },
 "tpsu": {
  "n": "Tirage poulie en supination",
  "m": "Dos, biceps",
  "img": "Underhand_Cable_Pulldowns",
  "pat": "tv",
  "pat2": "fc",
  "eq": 0,
  "ch": "kg",
  "d": 45
 },
 "tp1": {
  "n": "Tirage vertical un bras",
  "m": "Grand dorsal, biceps",
  "img": "One_Arm_Lat_Pulldown",
  "pat": "tv",
  "pat2": "fc",
  "eq": 0,
  "ch": "kg",
  "d": 20
 },
 "tbtc": {
  "n": "Tirage bras tendus à la corde",
  "m": "Grand dorsal",
  "img": "Rope_Straight-Arm_Pulldown",
  "pat": "tv",
  "eq": 0,
  "ch": "kg",
  "d": 15
 },
 "tps1": {
  "n": "Tirage horizontal un bras",
  "m": "Dos, arrière d'épaule",
  "img": "Seated_One-arm_Cable_Pulley_Rows",
  "pat": "th",
  "pat2": "fc",
  "eq": 0,
  "ch": "kg",
  "d": 20
 },
 "rwsu": {
  "n": "Rowing barre en supination",
  "m": "Dos, biceps",
  "img": "Reverse_Grip_Bent-Over_Rows",
  "pat": "th",
  "pat2": "fc",
  "eq": 1,
  "ch": "kg",
  "d": 40
 },
 "rwhm": {
  "n": "Rowing haut à la machine",
  "m": "Dos, arrière d'épaule",
  "img": "Leverage_High_Row",
  "pat": "th",
  "pat2": "tv",
  "eq": 0,
  "ch": "kg",
  "d": 40
 },
 "tbarp": {
  "n": "Rowing T-bar buste appuyé",
  "m": "Dos, épaisseur",
  "img": "Lying_T-Bar_Row",
  "pat": "th",
  "eq": 0,
  "ch": "kg",
  "d": 40
 },
 "kbrw2": {
  "n": "Rowing deux kettlebells",
  "m": "Dos, arrière d'épaule",
  "img": "Two-Arm_Kettlebell_Row",
  "pat": "th",
  "pat2": "fc",
  "eq": 3,
  "acc": "kb",
  "ch": "kg",
  "d": 12
 },
 "seal": {
  "n": "Rowing barre sur banc incliné",
  "m": "Dos, arrière d'épaule",
  "img": "Incline_Bench_Pull",
  "pat": "th",
  "pat2": "re",
  "eq": 1,
  "ch": "kg",
  "d": 30
 },
 "landr": {
  "n": "Rowing landmine un bras",
  "m": "Dos, arrière d'épaule",
  "img": "Bent_Over_One-Arm_Long_Bar_Row",
  "pat": "th",
  "pat2": "fc",
  "eq": 1,
  "ch": "kg",
  "d": 20
 },
 "sqh": {
  "n": "Squat haltères",
  "m": "Quadriceps, fessiers",
  "img": "Dumbbell_Squat",
  "pat": "eg",
  "pat2": "fh",
  "eq": 2,
  "ch": "kg",
  "d": 14
 },
 "ferh": {
  "n": "Fentes arrière haltères",
  "m": "Quadriceps, fessiers",
  "img": "Dumbbell_Rear_Lunge",
  "pat": "eg",
  "pat2": "fh",
  "eq": 2,
  "ch": "kg",
  "d": 12
 },
 "montb": {
  "n": "Montées sur banc barre",
  "m": "Quadriceps, fessiers",
  "img": "Barbell_Step_Ups",
  "pat": "eg",
  "pat2": "fh",
  "eq": 1,
  "ch": "kg",
  "d": 30
 },
 "lext1": {
  "n": "Leg extension une jambe",
  "m": "Quadriceps",
  "img": "Single-Leg_Leg_Extension",
  "pat": "eg",
  "eq": 0,
  "ch": "kg",
  "d": 15
 },
 "sql": {
  "n": "Squat pieds larges",
  "m": "Quadriceps, fessiers, adducteurs",
  "img": "Wide_Stance_Barbell_Squat",
  "pat": "eg",
  "pat2": "add",
  "eq": 1,
  "ch": "kg",
  "d": 60
 },
 "lcas": {
  "n": "Leg curl assis",
  "m": "Ischio-jambiers",
  "img": "Seated_Leg_Curl",
  "pat": "fh",
  "eq": 0,
  "ch": "kg",
  "d": 35
 },
 "lcd": {
  "n": "Leg curl debout",
  "m": "Ischio-jambiers",
  "img": "Standing_Leg_Curl",
  "pat": "fh",
  "eq": 0,
  "ch": "kg",
  "d": 15
 },
 "revhyp": {
  "n": "Reverse hyperextension",
  "m": "Fessiers, lombaires, ischio-jambiers",
  "img": "Reverse_Hyperextension",
  "pat": "lo",
  "pat2": "fh",
  "eq": 0,
  "ch": "kg",
  "d": 10
 },
 "kickpc": {
  "n": "Kickback au sol",
  "m": "Fessiers",
  "img": "Glute_Kickback",
  "pat": "fh",
  "eq": 3,
  "ch": "aucune",
  "d": 15
 },
 "addp": {
  "n": "Adducteurs à la poulie",
  "m": "Adducteurs",
  "img": "Cable_Hip_Adduction",
  "pat": "add",
  "eq": 0,
  "ch": "kg",
  "d": 10
 },
 "bulsm": {
  "n": "Fente fixe à la Smith",
  "m": "Quadriceps, fessiers",
  "img": "Smith_Single-Leg_Split_Squat",
  "pat": "eg",
  "pat2": "fh",
  "eq": 0,
  "ch": "kg",
  "d": 30
 },
 "molah": {
  "n": "Mollets assis haltère",
  "m": "Soléaire",
  "img": "Dumbbell_Seated_One-Leg_Calf_Raise",
  "pat": "mol",
  "eq": 2,
  "ch": "kg",
  "d": 16
 },
 "molab": {
  "n": "Mollets assis barre",
  "m": "Soléaire",
  "img": "Barbell_Seated_Calf_Raise",
  "pat": "mol",
  "eq": 1,
  "ch": "kg",
  "d": 30
 },
 "shrp": {
  "n": "Shrugs à la poulie",
  "m": "Trapèzes supérieurs",
  "img": "Cable_Shrugs",
  "pat": "tra",
  "eq": 0,
  "ch": "kg",
  "d": 40
 },
 "tirh": {
  "n": "Rowing menton haltères",
  "m": "Trapèzes, épaules",
  "img": "Standing_Dumbbell_Upright_Row",
  "pat": "tra",
  "pat2": "ep",
  "eq": 2,
  "ch": "kg",
  "d": 10
 },
 "situp": {
  "n": "Sit-up",
  "m": "Abdominaux, fléchisseurs de hanche",
  "img": "Sit-Up",
  "pat": "ft",
  "eq": 3,
  "ch": "aucune",
  "d": 15
 },
 "crm": {
  "n": "Crunch à la machine",
  "m": "Abdominaux",
  "img": "Ab_Crunch_Machine",
  "pat": "ft",
  "eq": 0,
  "ch": "kg",
  "d": 30
 },
 "crinvp": {
  "n": "Crunch inversé à la poulie",
  "m": "Abdominaux, bas",
  "img": "Cable_Reverse_Crunch",
  "pat": "ft",
  "eq": 0,
  "ch": "kg",
  "d": 10
 },
 "flh": {
  "n": "Flexion latérale haltère",
  "m": "Obliques",
  "img": "Dumbbell_Side_Bend",
  "pat": "ft",
  "pat2": "ae",
  "eq": 2,
  "ch": "kg",
  "d": 16
 },
 "buch": {
  "n": "Bûcheron à la poulie",
  "m": "Obliques, gainage en rotation",
  "img": "Standing_Cable_Wood_Chop",
  "pat": "ft",
  "pat2": "ae",
  "eq": 0,
  "ch": "kg",
  "d": 10
 },
 "crd": {
  "n": "Crunch décliné",
  "m": "Abdominaux",
  "img": "Decline_Crunch",
  "pat": "ft",
  "eq": 3,
  "ch": "aucune",
  "d": 12
 },
 "rjb": {
  "n": "Relevés de jambes sur banc",
  "m": "Abdominaux, bas",
  "img": "Flat_Bench_Lying_Leg_Raise",
  "pat": "ft",
  "eq": 3,
  "ch": "aucune",
  "d": 12
 },
 "crx": {
  "n": "Crunch croisé",
  "m": "Obliques, abdominaux",
  "img": "Cross-Body_Crunch",
  "pat": "ft",
  "eq": 3,
  "ch": "aucune",
  "d": 12
 },
 "velocr": {
  "n": "Crunch vélo",
  "m": "Abdominaux, obliques",
  "img": "Air_Bike",
  "pat": "ft",
  "eq": 3,
  "ch": "aucune",
  "d": 20
 },
 "jack": {
  "n": "Jackknife",
  "m": "Abdominaux",
  "img": "Jackknife_Sit-Up",
  "pat": "ft",
  "eq": 3,
  "ch": "aucune",
  "d": 10
 },
 "crobl": {
  "n": "Crunch oblique au sol",
  "m": "Obliques",
  "img": "Oblique_Crunches_-_On_The_Floor",
  "pat": "ft",
  "eq": 3,
  "ch": "aucune",
  "d": 15
 },
 "talons": {
  "n": "Touchers de talons",
  "m": "Obliques",
  "img": "Alternate_Heel_Touchers",
  "pat": "ft",
  "eq": 3,
  "ch": "aucune",
  "d": 20
 },
 "tuck": {
  "n": "Leg tucks assis",
  "m": "Abdominaux",
  "img": "Seated_Leg_Tucks",
  "pat": "ft",
  "eq": 3,
  "ch": "aucune",
  "d": 15
 },
 "rintel": {
  "n": "Rotation interne à l'élastique",
  "m": "Coiffe des rotateurs, subscapulaire",
  "img": "Internal_Rotation_with_Band",
  "pat": "soin",
  "eq": 3,
  "acc": "el",
  "ch": "aucune",
  "d": 15,
  "soin": "epaules"
 },
 "rintp": {
  "n": "Rotation interne à la poulie",
  "m": "Coiffe des rotateurs, subscapulaire",
  "img": "Cable_Internal_Rotation",
  "pat": "soin",
  "eq": 0,
  "ch": "kg",
  "d": 4,
  "soin": "epaules"
 },
 "oisrot": {
  "n": "Oiseau avec rotation externe",
  "m": "Arrière d'épaule, coiffe des rotateurs",
  "img": "Reverse_Flyes_With_External_Rotation",
  "pat": "soin",
  "eq": 2,
  "ch": "kg",
  "d": 2,
  "soin": "epaules"
 },
 "cbras": {
  "n": "Cercles de bras",
  "m": "Épaules, mobilité",
  "img": "Arm_Circles",
  "pat": "soin",
  "eq": 3,
  "ch": "aucune",
  "d": 15,
  "soin": "epaules"
 },
 "batep": {
  "n": "Passage d'épaules au bâton",
  "m": "Épaules, pectoraux, mobilité",
  "img": "Chest_And_Front_Of_Shoulder_Stretch",
  "pat": "soin",
  "eq": 3,
  "ch": "aucune",
  "d": 10,
  "soin": "epaules"
 },
 "tdm": {
  "n": "Étirement d'épaules au bâton dans le dos",
  "m": "Avant d'épaule, pectoraux",
  "img": "Round_The_World_Shoulder_Stretch",
  "pat": "soin",
  "eq": 3,
  "ch": "temps",
  "d": 30,
  "soin": "epaules"
 },
 "bcrois": {
  "n": "Bras croisé devant la poitrine",
  "m": "Arrière d'épaule",
  "img": "Side_Wrist_Pull",
  "pat": "soin",
  "eq": 3,
  "ch": "temps",
  "d": 30,
  "soin": "epaules"
 },
 "chq": {
  "n": "Cercles de hanche à quatre pattes",
  "m": "Hanches, fessiers",
  "img": "Hip_Circles_prone",
  "pat": "soin",
  "eq": 3,
  "ch": "aucune",
  "d": 10,
  "soin": "hanches"
 },
 "chd": {
  "n": "Cercles de hanche debout",
  "m": "Hanches, mobilité",
  "img": "Standing_Hip_Circles",
  "pat": "soin",
  "eq": 3,
  "ch": "aucune",
  "d": 10,
  "soin": "hanches"
 },
 "groin": {
  "n": "Groiners",
  "m": "Adducteurs, fléchisseurs de hanche",
  "img": "Groiners",
  "pat": "soin",
  "eq": 3,
  "ch": "aucune",
  "d": 8,
  "soin": "hanches"
 },
 "fig4": {
  "n": "Étirement du fessier en figure 4",
  "m": "Fessiers, piriforme",
  "img": "Ankle_On_The_Knee",
  "pat": "soin",
  "eq": 3,
  "ch": "temps",
  "d": 30,
  "soin": "hanches"
 },
 "addet": {
  "n": "Étirement des adducteurs allongé",
  "m": "Adducteurs",
  "img": "Side_Lying_Groin_Stretch",
  "pat": "soin",
  "eq": 3,
  "ch": "temps",
  "d": 30,
  "soin": "hanches"
 },
 "flexd": {
  "n": "Étirement des fléchisseurs debout",
  "m": "Psoas, quadriceps",
  "img": "Standing_Hip_Flexors",
  "pat": "soin",
  "eq": 3,
  "ch": "temps",
  "d": 30,
  "soin": "hanches"
 },
 "hext": {
  "n": "Extension de hanche à l'élastique",
  "m": "Fessiers",
  "img": "Hip_Extension_with_Bands",
  "pat": "soin",
  "eq": 3,
  "acc": "el",
  "ch": "aucune",
  "d": 12,
  "soin": "hanches"
 },
 "hflex": {
  "n": "Flexion de hanche à l'élastique",
  "m": "Psoas, fléchisseurs de hanche",
  "img": "Hip_Flexion_with_Band",
  "pat": "soin",
  "eq": 3,
  "acc": "el",
  "ch": "aucune",
  "d": 12,
  "soin": "hanches"
 },
 "bascp": {
  "n": "Bascule du bassin vers le pont",
  "m": "Lombaires, fessiers, mobilité du bassin",
  "img": "Pelvic_Tilt_Into_Bridge",
  "pat": "soin",
  "eq": 3,
  "ch": "aucune",
  "d": 10,
  "soin": "dos"
 },
 "gpoit": {
  "n": "Genoux à la poitrine",
  "m": "Lombaires, fessiers",
  "img": "Hug_Knees_To_Chest",
  "pat": "soin",
  "eq": 3,
  "ch": "temps",
  "d": 30,
  "soin": "dos"
 },
 "croix": {
  "n": "Croix de fer allongée",
  "m": "Lombaires, hanches, rotation",
  "img": "Iron_Crosses_stretch",
  "pat": "soin",
  "eq": 3,
  "ch": "aucune",
  "d": 8,
  "soin": "dos"
 },
 "torsal": {
  "n": "Torsion allongée",
  "m": "Lombaires, fessiers, obliques",
  "img": "Knee_Across_The_Body",
  "pat": "soin",
  "eq": 3,
  "ch": "temps",
  "d": 30,
  "soin": "dos"
 },
 "cgen": {
  "n": "Cercles de genoux",
  "m": "Genoux, mobilité",
  "img": "Knee_Circles",
  "pat": "soin",
  "eq": 3,
  "ch": "aucune",
  "d": 10,
  "soin": "genoux"
 },
 "sqas": {
  "n": "Mini-squat contrôlé",
  "m": "Quadriceps, genoux",
  "img": "Sit_Squats",
  "pat": "soin",
  "eq": 3,
  "ch": "aucune",
  "d": 12,
  "soin": "genoux"
 },
 "quadet": {
  "n": "Étirement des quadriceps allongé",
  "m": "Quadriceps",
  "img": "On_Your_Side_Quad_Stretch",
  "pat": "soin",
  "eq": 3,
  "ch": "temps",
  "d": 30,
  "soin": "genoux"
 },
 "cchev": {
  "n": "Cercles de chevilles",
  "m": "Chevilles, mobilité",
  "img": "Ankle_Circles",
  "pat": "soin",
  "eq": 3,
  "ch": "aucune",
  "d": 10,
  "soin": "chevilles"
 },
 "molmur": {
  "n": "Étirement du mollet au mur",
  "m": "Mollets, gastrocnémiens",
  "img": "Calf_Stretch_Hands_Against_Wall",
  "pat": "soin",
  "eq": 3,
  "ch": "temps",
  "d": 30,
  "soin": "chevilles"
 },
 "sole": {
  "n": "Étirement du soléaire et du tendon d'Achille",
  "m": "Soléaire, tendon d'Achille",
  "img": "Standing_Soleus_And_Achilles_Stretch",
  "pat": "soin",
  "eq": 3,
  "ch": "temps",
  "d": 30,
  "soin": "chevilles"
 },
 "cpoi": {
  "n": "Cercles de poignets",
  "m": "Poignets, mobilité",
  "img": "Wrist_Circles",
  "pat": "soin",
  "eq": 3,
  "ch": "aucune",
  "d": 10,
  "soin": "poignets"
 },
 "avbet": {
  "n": "Étirement des avant-bras à genoux",
  "m": "Fléchisseurs du poignet",
  "img": "Kneeling_Forearm_Stretch",
  "pat": "soin",
  "eq": 3,
  "ch": "temps",
  "d": 30,
  "soin": "poignets"
 },
 "mentp": {
  "n": "Menton vers la poitrine",
  "m": "Nuque, haut du dos",
  "img": "Chin_To_Chest_Stretch",
  "pat": "soin",
  "eq": 3,
  "ch": "temps",
  "d": 20,
  "soin": "nuque"
 },
 "nuqinc": {
  "n": "Inclinaison de la nuque",
  "m": "Trapèzes supérieurs, nuque",
  "img": "Side_Neck_Stretch",
  "pat": "soin",
  "eq": 3,
  "ch": "temps",
  "d": 20,
  "soin": "nuque"
 },
 "hdos": {
  "n": "Étirement du haut du dos",
  "m": "Haut du dos, rhomboïdes",
  "img": "Upper_Back_Stretch",
  "pat": "soin",
  "eq": 3,
  "ch": "temps",
  "d": 30,
  "soin": "nuque"
 },
 "rotbu": {
  "n": "Rotation du buste debout",
  "m": "Haut du dos, rotation thoracique",
  "img": "Middle_Back_Stretch",
  "pat": "soin",
  "eq": 3,
  "ch": "aucune",
  "d": 10,
  "soin": "nuque"
 },
 "trneg": {
  "n": "Tractions négatives",
  "m": "Dos, biceps",
  "img": "Pullups",
  "pat": "tv",
  "pat2": "fc",
  "eq": 3,
  "ch": "aucune",
  "d": 0,
  "bt": 1,
  "horsIA": 1
 },
 "mup": {
  "n": "Muscle-up",
  "m": "Dos, biceps, triceps, épaules",
  "img": "Muscle_Up",
  "pat": "tv",
  "pat2": "ec",
  "eq": 3,
  "ch": "aucune",
  "d": 0,
  "bt": 1,
  "horsIA": 1
 },
 "tr1": {
  "n": "Traction à un bras",
  "m": "Dos, biceps",
  "img": "One_Arm_Chin-Up",
  "pat": "tv",
  "pat2": "fc",
  "eq": 3,
  "ch": "aucune",
  "d": 0,
  "bt": 1,
  "horsIA": 1
 },
 "hpike": {
  "n": "Relevés de jambes jusqu'à la barre",
  "m": "Abdominaux, fléchisseurs de hanche",
  "img": "Hanging_Pike",
  "pat": "ft",
  "eq": 3,
  "ch": "aucune",
  "d": 0,
  "bt": 1,
  "horsIA": 1
 },
 "pomp1": {
  "n": "Pompe à un bras",
  "m": "Pectoraux, triceps, gainage",
  "img": "Single-Arm_Push-Up",
  "pat": "ph",
  "pat2": "ec",
  "eq": 3,
  "ch": "aucune",
  "d": 0,
  "horsIA": 1
 },
 "pompp": {
  "n": "Pompes plyométriques",
  "m": "Pectoraux, triceps, explosivité",
  "img": "Plyo_Push-up",
  "pat": "ph",
  "pat2": "ec",
  "eq": 3,
  "ch": "aucune",
  "d": 0,
  "horsIA": 1
 },
 "pompgl": {
  "n": "Pompe et gainage latéral",
  "m": "Pectoraux, obliques",
  "img": "Push_Up_to_Side_Plank",
  "pat": "ph",
  "pat2": "ae",
  "eq": 3,
  "ch": "aucune",
  "d": 0,
  "horsIA": 1
 },
 "splsq": {
  "n": "Split squat au poids du corps",
  "m": "Quadriceps, fessiers",
  "img": "Split_Squats",
  "pat": "eg",
  "pat2": "fh",
  "eq": 3,
  "ch": "aucune",
  "d": 0,
  "horsIA": 1
 },
 "jsq": {
  "n": "Squat sauté",
  "m": "Quadriceps, fessiers, explosivité",
  "img": "Freehand_Jump_Squat",
  "pat": "eg",
  "pat2": "fh",
  "eq": 3,
  "ch": "aucune",
  "d": 0,
  "horsIA": 1
 },
 "ktj": {
  "n": "Sauts genoux-poitrine",
  "m": "Jambes, explosivité",
  "img": "Knee_Tuck_Jump",
  "pat": "eg",
  "eq": 3,
  "ch": "aucune",
  "d": 0,
  "horsIA": 1
 },
 "trxrow": {
  "n": "Tirage TRX",
  "m": "Dos, biceps",
  "img": "Suspended_Row",
  "pat": "th",
  "pat2": "fc",
  "eq": 3,
  "acc": "trx",
  "ch": "aucune",
  "d": 0,
  "horsIA": 1
 },
 "trxrows": {
  "n": "Rowing inversé aux sangles",
  "m": "Dos, biceps, arrière d'épaule",
  "img": "Inverted_Row_with_Straps",
  "pat": "th",
  "pat2": "re",
  "eq": 3,
  "acc": "trx",
  "ch": "aucune",
  "d": 0,
  "horsIA": 1
 },
 "trxpu": {
  "n": "Pompes TRX",
  "m": "Pectoraux, triceps, gainage",
  "img": "Suspended_Push-Up",
  "pat": "ph",
  "pat2": "ae",
  "eq": 3,
  "acc": "trx",
  "ch": "aucune",
  "d": 0,
  "horsIA": 1
 },
 "trxfly": {
  "n": "Écarté TRX",
  "m": "Pectoraux, épaules",
  "img": "Suspended_Push-Up",
  "pat": "ph",
  "eq": 3,
  "acc": "trx",
  "ch": "aucune",
  "d": 0,
  "horsIA": 1
 },
 "trxy": {
  "n": "Y-raise TRX",
  "m": "Arrière d'épaule, trapèzes",
  "img": "Band_Pull_Apart",
  "pat": "re",
  "pat2": "tra",
  "eq": 3,
  "acc": "trx",
  "ch": "aucune",
  "d": 0,
  "horsIA": 1
 },
 "trxt": {
  "n": "T-raise TRX",
  "m": "Arrière d'épaule, haut du dos",
  "img": "Reverse_Flyes",
  "pat": "re",
  "pat2": "th",
  "eq": 3,
  "acc": "trx",
  "ch": "aucune",
  "d": 0,
  "horsIA": 1
 },
 "trxfp": {
  "n": "Face pull TRX",
  "m": "Arrière d'épaule, rotateurs",
  "img": "Face_Pull",
  "pat": "re",
  "eq": 3,
  "acc": "trx",
  "ch": "aucune",
  "d": 0,
  "horsIA": 1
 },
 "trxcu": {
  "n": "Curl biceps TRX",
  "m": "Biceps",
  "img": "Inverted_Row_with_Straps",
  "pat": "fc",
  "eq": 3,
  "acc": "trx",
  "ch": "aucune",
  "d": 0,
  "horsIA": 1
 },
 "trxtri": {
  "n": "Extension triceps TRX",
  "m": "Triceps",
  "img": "Body_Tricep_Press",
  "pat": "ec",
  "eq": 3,
  "acc": "trx",
  "ch": "aucune",
  "d": 0,
  "horsIA": 1
 },
 "trxsq": {
  "n": "Squat TRX",
  "m": "Quadriceps, fessiers",
  "img": "Bodyweight_Squat",
  "pat": "eg",
  "pat2": "fh",
  "eq": 3,
  "acc": "trx",
  "ch": "aucune",
  "d": 0,
  "horsIA": 1
 },
 "trxpis": {
  "n": "Pistol squat TRX",
  "m": "Quadriceps, fessiers, équilibre",
  "img": "Kettlebell_Pistol_Squat",
  "pat": "eg",
  "pat2": "fh",
  "eq": 3,
  "acc": "trx",
  "ch": "aucune",
  "d": 0,
  "horsIA": 1
 },
 "trxss": {
  "n": "Fente bulgare TRX",
  "m": "Quadriceps, fessiers",
  "img": "Suspended_Split_Squat",
  "pat": "eg",
  "pat2": "fh",
  "eq": 3,
  "acc": "trx",
  "ch": "aucune",
  "d": 0,
  "horsIA": 1
 },
 "trxlc": {
  "n": "Leg curl TRX",
  "m": "Ischio-jambiers, fessiers",
  "img": "Ball_Leg_Curl",
  "pat": "fh",
  "eq": 3,
  "acc": "trx",
  "ch": "aucune",
  "d": 0,
  "horsIA": 1
 },
 "trxhb": {
  "n": "Pont fessier TRX",
  "m": "Fessiers, ischio-jambiers",
  "img": "Single_Leg_Glute_Bridge",
  "pat": "fh",
  "eq": 3,
  "acc": "trx",
  "ch": "aucune",
  "d": 0,
  "horsIA": 1
 },
 "trxfo": {
  "n": "Fallout TRX",
  "m": "Abdominaux, épaules",
  "img": "Suspended_Fallout",
  "pat": "ae",
  "pat2": "ft",
  "eq": 3,
  "acc": "trx",
  "ch": "aucune",
  "d": 0,
  "horsIA": 1
 },
 "trxpl": {
  "n": "Gainage TRX",
  "m": "Abdominaux, lombaires",
  "img": "Plank",
  "pat": "ae",
  "pat2": "ft",
  "eq": 3,
  "acc": "trx",
  "ch": "temps",
  "d": 30,
  "horsIA": 1
 },
 "trxkt": {
  "n": "Genoux-poitrine TRX",
  "m": "Abdominaux",
  "img": "Suspended_Reverse_Crunch",
  "pat": "ft",
  "pat2": "ae",
  "eq": 3,
  "acc": "trx",
  "ch": "aucune",
  "d": 0,
  "horsIA": 1
 },
 "trxpk": {
  "n": "Pike TRX",
  "m": "Abdominaux, épaules",
  "img": "Hanging_Pike",
  "pat": "ft",
  "pat2": "ae",
  "eq": 3,
  "acc": "trx",
  "ch": "aucune",
  "d": 0,
  "horsIA": 1
 },
 "trxmc": {
  "n": "Mountain climber TRX",
  "m": "Abdominaux, cardio",
  "img": "Mountain_Climbers",
  "pat": "ae",
  "pat2": "ca",
  "eq": 3,
  "acc": "trx",
  "ch": "aucune",
  "d": 0,
  "horsIA": 1
 }
};

/* Noms et muscles d'origine, en français : la logique qui lit ces textes (zones
   sensibles, groupes musculaires) s'appuie toujours sur eux, quelle que soit la langue. */
export const EX_FR: Record<string, { n: string; m: string }> = Object.fromEntries(Object.entries(EX).map(([k, v]) => [k, { n: v.n, m: v.m }]));
/* En anglais, noms et muscles affichés sont remplacés au chargement (la langue ne change qu'en rechargeant l'app). */
if (langue() === "en") for (const [k, [n, m]] of Object.entries(EX_EN as Record<string, string[]>)) if (EX[k]) Object.assign(EX[k], { n, m });
