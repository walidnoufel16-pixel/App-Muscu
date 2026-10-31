/* Guides publics (référencement Google) : quatre questions que se posent les débutants, avec un
   lien vers l'app. En français seulement. Les programmes et les progressions sont lus dans les
   données de l'app (lib/data/street.ts, exercices.ts) pour rester identiques à ce qu'elle propose. */
import { EX } from "./exercices";
import { FAMILLES_STREET, PROGRAMMES_STREET } from "./street";

export type Bloc = { h: string; p?: string[]; liste?: string[]; tableau?: { titre: string; lignes: string[] }[] };
export type Guide = { slug: string; titre: string; description: string; intro: string; blocs: Bloc[]; cta: string; lien: string };

const nom = (id: string) => EX[id]?.n ?? id;
const fondations = PROGRAMMES_STREET.find((p) => p.niv === "debutant")!;
const tirage = FAMILLES_STREET.find((f) => f.k === "tirage")!.ex;

export const GUIDES: Guide[] = [
  {
    slug: "programme-street-workout-debutant",
    titre: "Programme street workout débutant : 3 séances par semaine",
    description: "Un programme de street workout pour débuter : 3 séances corps entier par semaine, au poids du corps et à la barre de traction, pour ta première traction, tes premiers dips et des pompes propres.",
    intro: `Tu débutes le street workout ? Inutile d'enchaîner les figures vues sur Instagram : la base, ce sont trois séances corps entier par semaine, avec des exercices que tu peux vraiment réussir et faire progresser. Voici le programme « ${fondations.nom} » d'Oxa, pensé pour ${fondations.pour.toLowerCase()}.`,
    blocs: [
      { h: "L'objectif", p: [`${fondations.but} À la fin du cycle : ${fondations.objectif.toLowerCase()}.`] },
      {
        h: "Les trois séances",
        p: ["Fais-les dans l'ordre, avec au moins un jour de repos entre deux (par exemple lundi, mercredi, vendredi). Les chiffres sont des séries × répétitions (ou secondes pour le gainage)."],
        tableau: fondations.seances.map((s) => ({ titre: `Séance ${s.k} · ${s.nom}`, lignes: s.ex.map((e) => `${nom(e.id)} : ${e.s} × ${e.r}${EX[e.id]?.ch === "temps" ? " s" : ""}, repos ${e.p}`) })),
      },
      {
        h: "Comment progresser",
        liste: [
          `Reste dans la fourchette de ${fondations.fourchette.toLowerCase()} : quand toutes tes séries atteignent le haut, passe à la variante plus dure du même mouvement.`,
          "Garde une ou deux répétitions en réserve : la technique d'abord, l'échec ne fait pas progresser plus vite.",
          "Toutes les 5 à 6 semaines, fais une semaine plus légère (moitié des séries), puis refais ton test de niveau.",
        ],
      },
      { h: "Et si c'est trop facile ?", p: ["Oxa propose un test d'entrée (tractions, pompes, dips et squats au maximum) qui te place dans le bon niveau : Fondations, Force ou Figures."] },
    ],
    cta: "Fais le test de niveau dans Oxa",
    lien: "/?src=guide-street",
  },
  {
    slug: "premiere-traction",
    titre: "Réussir sa première traction : la progression étape par étape",
    description: "Tu n'arrives pas encore à faire une traction ? La progression complète, de la suspension à la barre à la traction stricte, avec combien de temps rester à chaque étape.",
    intro: "La traction est le mouvement roi du street workout, et le plus frustrant au début : zéro répétition, c'est normal. La bonne nouvelle, c'est qu'il existe une échelle d'exercices qui mène à la première traction, généralement en 6 à 12 semaines avec 2 à 3 séances par semaine.",
    blocs: [
      {
        h: "L'échelle, de la plus facile à la plus dure",
        liste: tirage.slice(0, 7).map((id, i) => `${i + 1}. ${nom(id)}`),
        p: ["Tu passes à l'étape suivante quand tu réussis 3 séries propres dans le haut de la fourchette (par exemple 3 × 8). Pas avant : sauter une étape, c'est souvent stagner ensuite."],
      },
      {
        h: "Les trois exercices clés",
        liste: [
          `${nom("susp")} : 3 × 20 à 60 secondes. Tu construis la prise et tu habitues tes épaules à porter ton poids.`,
          `${nom("ra")} : 3 × 8 à 12, sous une barre basse. C'est le même mouvement que la traction, à l'horizontale ; plus tes pieds avancent, plus c'est dur.`,
          `${nom("trneg")} : 3 × 3 à 5. Monte en t'aidant (une chaise, un saut), puis descends en 3 à 5 secondes. La phase qui construit le plus de force.`,
        ],
      },
      {
        h: "Les erreurs qui retardent tout",
        liste: [
          "Faire des demi-tractions : descends bras tendus à chaque répétition.",
          "S'entraîner tous les jours : les muscles du dos et des bras progressent pendant le repos.",
          "Oublier les omoplates : tire-les vers le bas avant de plier les bras (les tractions scapulaires apprennent ce geste).",
        ],
      },
    ],
    cta: "Suis la progression dans Oxa",
    lien: "/?src=guide-traction",
  },
  {
    slug: "seance-full-body-sans-materiel",
    titre: "Séance full body sans matériel : 30 minutes à la maison",
    description: "Une séance complète au poids du corps, sans aucun matériel : jambes, pectoraux, dos, abdos, en 30 minutes. Avec les variantes pour débuter ou corser.",
    intro: "Pas de salle, pas de matériel ? Ton poids du corps suffit pour travailler tout le corps, à condition de choisir les bons exercices et de les faire progresser. Voici une séance de 30 minutes à faire 2 à 3 fois par semaine.",
    blocs: [
      {
        h: "La séance",
        p: ["Échauffe-toi 5 minutes (rotations des épaules et des hanches, squats légers), puis enchaîne les exercices avec 60 à 90 secondes de repos entre les séries."],
        tableau: [{
          titre: "3 séries de chaque",
          lignes: [
            `${nom("sqpc")} : 3 × 15`,
            `${nom("pomp")} : 3 × 8 à 12 (sur les genoux ou les mains surélevées si c'est trop dur)`,
            `${nom("fepc")} : 3 × 10 par jambe`,
            `${nom("pont")} : 3 × 15`,
            `${nom("sup")} : 3 × 12, pour le bas du dos`,
            `${nom("gai")} : 3 × 30 à 45 secondes`,
          ],
        }],
      },
      {
        h: "Faire progresser la séance",
        liste: [
          "Quand toutes tes séries passent facilement, ajoute 2 répétitions ou 10 secondes.",
          "Puis passe à une variante plus dure : pompes pieds surélevés, squat sauté, pont fessier sur une jambe.",
          "Le dos travaille peu sans barre : une barre de traction de porte (une vingtaine d'euros) ouvre les tractions et le rowing australien.",
        ],
      },
    ],
    cta: "Crée ta séance sur mesure dans Oxa",
    lien: "/?src=guide-fullbody",
  },
  {
    slug: "repas-prise-de-muscle-petit-budget",
    titre: "Repas prise de muscle petit budget : manger assez de protéines sans se ruiner",
    description: "Combien de protéines pour prendre du muscle, quels aliments sont les moins chers par gramme de protéines, et une journée type à petit budget.",
    intro: "Prendre du muscle ne demande pas de poudres ni de produits chers. Il faut surtout assez de protéines chaque jour, assez de calories, et de la régularité. Avec quelques aliments simples, c'est faisable avec un budget serré.",
    blocs: [
      { h: "Combien de protéines ?", p: ["Les études situent le besoin autour de 1,6 g de protéines par kilo de poids de corps et par jour pour qui s'entraîne en musculation (jusqu'à 2,2 g sans bénéfice net au-delà). Pour 70 kg, cela fait environ 110 g par jour, à répartir sur 3 ou 4 repas."] },
      {
        h: "Les sources de protéines les moins chères",
        liste: [
          "Œufs : complets, faciles, parmi les moins chers au gramme de protéines.",
          "Lentilles, pois chiches, haricots secs : très bon marché, à associer à des céréales (riz, pâtes, pain).",
          "Fromage blanc et skyr en grand pot : riches en protéines, pratiques en collation.",
          "Thon et sardines en boîte, blanc de poulet en gros conditionnement, steak haché 5 % surgelé.",
          "Flocons d'avoine et lait : un petit-déjeuner complet pour quelques dizaines de centimes.",
        ],
      },
      {
        h: "Une journée type",
        liste: [
          "Petit-déjeuner : flocons d'avoine, lait, une banane.",
          "Déjeuner : riz, lentilles, œufs durs, légumes.",
          "Collation : fromage blanc et une poignée de fruits secs.",
          "Dîner : pâtes, thon ou poulet, légumes, un peu d'huile d'olive.",
        ],
      },
      { h: "Planifier pour dépenser moins", p: ["Cuisiner en grande quantité deux fois par semaine et acheter en gros conditionnement fait la plus grosse différence. Oxa prépare tes repas de la semaine selon ton budget, avec la liste de courses et le coût estimé de chaque jour."] },
    ],
    cta: "Planifie tes repas avec ton budget dans Oxa",
    lien: "/?src=guide-repas",
  },
];

export const guide = (slug: string) => GUIDES.find((g) => g.slug === slug);
