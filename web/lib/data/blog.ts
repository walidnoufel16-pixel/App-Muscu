/* Blog Oxa (référencement Google) : des articles publics, lisibles sans compte, chacun avec un
   lien vers la fonction de l'app qui va avec. En français seulement. Les programmes et les
   progressions sont lus dans les données de l'app (lib/data/street.ts, exercices.ts) pour rester
   identiques à ce qu'elle propose. Anciennement « guides » (/guides renvoie ici). */
import { EX } from "./exercices";
import { FAMILLES_STREET, PROGRAMMES_STREET } from "./street";
import { auteurRecette, imgExGrand, imgRecette } from "@/lib/medias";
import { BLOG_EN, type Texte } from "./blog-en";

export type Bloc = { h: string; p?: string[]; liste?: string[]; tableau?: { titre: string; lignes: string[] }[] };
export type Categorie = "Street" | "Course" | "Muscu" | "Nutrition";
export const CATEGORIES: Categorie[] = ["Street", "Course", "Muscu", "Nutrition"];
export type Langue = "fr" | "en";
/** Nom affiché d'une catégorie (les catégories restent en français dans les données). */
export const nomCategorie = (c: Categorie, l: Langue) => (l === "en" ? { Street: "Calisthenics", Course: "Running", Muscu: "Strength", Nutrition: "Nutrition" }[c] : c);
export type Article = {
  slug: string; titre: string; description: string; intro: string; blocs: Bloc[]; cta: string; lien: string;
  type: "guide" | "article"; // guide : les essentiels, fixes (/guides) ; article : le blog, qui s'enrichit (/blog)
  categorie: Categorie; date: string; // AAAA-MM-JJ
  couverture: string; // photo (public/img, ou Unsplash)
  credit?: { nom: string; lien: string }; // photographe (photos Unsplash)
};

const nom = (id: string) => EX[id]?.n ?? id;
const fondations = PROGRAMMES_STREET.find((p) => p.niv === "debutant")!;
const tirage = FAMILLES_STREET.find((f) => f.k === "tirage")!.ex;

/* photo Unsplash d'une recette en couverture, avec son photographe */
const recette = (id: string) => ({ couverture: imgRecette(id, "large")!, credit: auteurRecette(id)! });

/* Les articles écrits pour le blog (après les quatre guides d'origine). */
const NOUVEAUX: Article[] = [
  {
    slug: "preparer-premier-hyrox",
    type: "guide",
    categorie: "Course", date: "2026-11-01", couverture: "/img/grand/hyrox-traineau.avif",
    titre: "Hyrox : comment préparer ton premier Hyrox (plan débutant)",
    description: "Le format Hyrox expliqué, les 8 ateliers et leurs charges, combien de semaines pour se préparer, une semaine type et les erreurs qui coûtent cher le jour J.",
    intro: "8 kilomètres de course, coupés par 8 ateliers : c'est tout le Hyrox. La course fitness qui remplit les halls d'expo partout dans le monde est accessible à n'importe qui de régulier, à condition de s'y préparer de la bonne façon. Un premier Hyrox se boucle en général entre 1 h 15 et 1 h 45. Voici comment y arriver sans te cramer.",
    blocs: [
      {
        h: "Le format",
        p: ["Tu cours 1 km, tu fais un atelier, tu repars courir, et ainsi de suite huit fois. L'ordre est toujours le même. Charges de la catégorie Open (hommes / femmes) :"],
        liste: [
          "1. SkiErg : 1000 m",
          "2. Poussée de traîneau : 50 m (152 / 102 kg, traîneau compris)",
          "3. Tirage de traîneau : 50 m (103 / 78 kg)",
          "4. Burpees sautés en longueur : 80 m",
          "5. Rameur : 1000 m",
          "6. Farmer's carry : 200 m (2 × 24 / 2 × 16 kg)",
          "7. Fentes avec sac : 100 m (20 / 10 kg)",
          "8. Wall balls : 100 répétitions (6 / 4 kg)",
        ],
      },
      { h: "Combien de temps pour se préparer ?", p: ["Compte 8 à 12 semaines si tu cours déjà un peu et que tu fais de la musculation. Si tu pars de zéro en course à pied, prends plutôt 12 semaines, et commence par trois sorties faciles par semaine avant d'ajouter les ateliers.", "La course pèse plus de la moitié du temps total : c'est elle qu'il faut construire en premier. Les ateliers s'apprennent vite, les kilomètres non."] },
      {
        h: "Une semaine type",
        liste: [
          "Une séance « course + ateliers » : 4 à 8 tours d'un kilomètre suivi d'un atelier. C'est la séance clé, elle t'habitue à courir avec les jambes lourdes.",
          "Deux footings faciles, à une allure où tu peux parler.",
          "Une séance de seuil ou de fractionné, pour la vitesse.",
          "Une ou deux séances de force : fentes, squat, soulevé de terre roumain, rowing, port de charges.",
        ],
        p: ["Monte progressivement : quatre tours de 500 m au début, six tours ensuite, puis une simulation complète trois à quatre semaines avant le jour J. La dernière semaine, on allège."],
      },
      {
        h: "Les erreurs qui coûtent cher",
        liste: [
          "Partir trop vite sur le premier kilomètre : l'adrénaline te le fait payer au traîneau.",
          "Négliger la course au profit des ateliers.",
          "Faire les 100 wall balls d'un bloc : découpe en séries de 10 à 15 dès le début, avant d'être à bout.",
          "Ne jamais s'entraîner à enchaîner course et atelier : c'est la transition qui surprend le plus.",
          "Découvrir le traîneau le jour J : son poids et la surface changent tout, teste-le en salle.",
        ],
      },
      { h: "Pas de SkiErg ni de traîneau dans ta salle ?", p: ["Pas grave pour te préparer. Tirage à l'élastique ou burpees à la place du SkiErg, fentes marchées ou poussée contre un mur à la place du traîneau, thrusters ou squats sautés à la place des wall balls. Essaie quand même de trouver une salle équipée pour une ou deux séances avant la course."] },
    ],
    cta: "Crée ton plan Hyrox dans Oxa : séances course + ateliers, charges de ta catégorie et remplaçants sans machine",
    lien: "/entrainement/assistant/?type=course&obj=hyrox&src=blog-hyrox",
  },
  {
    slug: "creatine-a-quoi-ca-sert",
    type: "article",
    categorie: "Nutrition", date: "2026-10-30", ...recette("shaker-banane"),
    titre: "Créatine : à quoi ça sert vraiment, combien en prendre, est-ce sans danger ?",
    description: "Ce que fait la créatine, la dose qui fonctionne (3 à 5 g par jour), ce qu'on sait sur les reins, les cheveux et la rétention d'eau, et pour qui elle a un intérêt.",
    intro: "C'est le complément le plus étudié du sport, et l'un des seuls dont l'effet est reconnu par l'Autorité européenne de sécurité des aliments (EFSA). Ce n'est pas pour autant un raccourci : elle aide à faire un peu plus de travail à l'entraînement, c'est tout. Voici ce qu'il faut savoir avant d'en acheter.",
    blocs: [
      { h: "Ce qu'elle fait", p: ["La créatine est stockée dans les muscles sous forme de phosphocréatine, une réserve d'énergie pour les efforts très courts et intenses : une série de musculation, un sprint, un saut. En augmentant cette réserve, elle permet de faire une ou deux répétitions de plus ou de mieux récupérer entre les efforts.", "L'EFSA reconnaît qu'elle améliore les performances lors d'efforts brefs, intenses et répétés, à partir de 3 g par jour. Sur des semaines, ce petit surplus de travail peut se traduire par un peu plus de force et de masse musculaire. Elle n'aide pas l'endurance pure, comme un footing."] },
      {
        h: "Combien en prendre",
        liste: [
          "3 à 5 g de créatine monohydrate par jour, tous les jours, à n'importe quelle heure. La forme monohydrate est la plus étudiée et la moins chère : les autres formes n'ont pas montré mieux.",
          "La phase de charge (20 g par jour pendant une semaine) n'est pas obligatoire : avec 3 à 5 g par jour, les réserves sont pleines au bout de 3 à 4 semaines.",
          "Pas besoin de cycles ni de pauses.",
        ],
      },
      {
        h: "Les idées reçues",
        liste: [
          "« Ça abîme les reins » : chez les personnes en bonne santé, aux doses recommandées, les études n'ont pas montré d'effet néfaste. En cas de maladie rénale, demande l'avis de ton médecin avant toute chose.",
          "« Ça fait perdre les cheveux » : cette crainte vient d'une seule petite étude de 2009 sur une hormone, jamais confirmée, et qui n'a pas mesuré de chute de cheveux.",
          "« Ça fait gonfler » : la balance peut prendre 1 à 2 kg les premières semaines, de l'eau stockée dans le muscle, pas sous la peau.",
          "« C'est du dopage » : non, la créatine n'est pas interdite et se trouve naturellement dans la viande et le poisson.",
        ],
      },
      { h: "Pour qui ?", p: ["Elle a un intérêt pour qui fait de la musculation, du street workout ou des sports à efforts répétés et s'entraîne déjà régulièrement. Elle ne remplace ni l'entraînement, ni le sommeil, ni assez de protéines. Elle n'est pas conseillée avant 18 ans, et en cas de grossesse ou de traitement, demande l'avis d'un professionnel de santé. Choisis un produit qui indique sa composition, idéalement contrôlé contre le dopage."] },
    ],
    cta: "Ce qui fait vraiment la différence, c'est la régularité : Oxa construit tes séances et suit ta progression",
    lien: "/?src=blog-creatine",
  },
  {
    slug: "combien-de-proteines-par-jour",
    type: "article",
    categorie: "Nutrition", date: "2026-10-28", ...recette("omelette-epinards"),
    titre: "Combien de protéines par jour pour prendre du muscle ?",
    description: "Le besoin réel en protéines quand on fait de la musculation, comment les répartir dans la journée, et combien en apportent les aliments du quotidien.",
    intro: "Les protéines sont la matière première du muscle, mais il n'est pas utile d'en manger des quantités énormes. Il y a une fourchette qui marche, au-delà de laquelle on ne gagne plus rien. Voici comment la calculer pour toi.",
    blocs: [
      { h: "Le bon chiffre", p: ["Pour la population générale, l'ANSES recommande environ 0,83 g de protéines par kilo de poids et par jour. Quand on fait de la musculation pour prendre du muscle, les études situent le besoin autour de 1,6 g par kilo et par jour ; au-delà de 2,2 g, il n'y a plus de bénéfice mesurable.", "Exemple : pour 70 kg, vise environ 110 g de protéines par jour. Pour 60 kg, environ 95 g."] },
      {
        h: "Les répartir dans la journée",
        liste: [
          "Trois ou quatre prises de 20 à 40 g, plutôt qu'un énorme repas le soir.",
          "Une prise dans les heures qui suivent la séance, sans chercher la minute près : la « fenêtre anabolique » est bien plus large qu'on le dit.",
          "Une collation protéinée si tu n'atteins pas ton total avec les repas : fromage blanc, skyr, œufs durs.",
        ],
      },
      {
        h: "Combien en apportent les aliments courants",
        liste: [
          "100 g de blanc de poulet cuit : environ 30 g",
          "100 g de thon en boîte : environ 25 g",
          "2 gros œufs : environ 13 g",
          "150 g de skyr ou de fromage blanc : 12 à 15 g",
          "100 g de tofu ferme : 12 à 15 g",
          "200 g de lentilles cuites : environ 18 g",
          "60 g de flocons d'avoine : environ 8 g",
        ],
      },
      { h: "Et les poudres ?", p: ["Une poudre de protéines n'est qu'un aliment pratique, pas une obligation. Elle peut dépanner pour atteindre ton total, mais des œufs, du fromage blanc, des légumineuses et un peu de viande ou de poisson font aussi bien, souvent pour moins cher. Pense aussi aux calories : sans manger assez au total, même avec beaucoup de protéines, le muscle progresse mal."] },
    ],
    cta: "Suis tes protéines du jour dans Oxa : scanne tes produits, l'app compte pour toi",
    lien: "/?src=blog-proteines",
  },
  {
    slug: "entrainement-hybride-muscu-course",
    type: "article",
    categorie: "Muscu", date: "2026-10-25", couverture: "/img/grand/course-relais.avif",
    titre: "Entraînement hybride : muscu et course dans la même semaine sans se cramer",
    description: "Faire de la musculation et de la course à pied ensemble : l'effet d'interférence, comment placer les séances, et deux semaines types selon ta priorité.",
    intro: "Être fort et endurant à la fois : c'est l'idée de l'entraînement hybride, popularisé par le Hyrox. On a longtemps dit que courir faisait perdre du muscle. En réalité, avec un peu d'organisation, les deux se complètent très bien.",
    blocs: [
      { h: "L'effet d'interférence, en vrai", p: ["Les études montrent qu'un gros volume d'endurance peut freiner un peu la prise de force et de muscle, surtout dans les jambes. Mais l'effet reste modeste quand la course est surtout facile et que les séances sont bien placées. Pour la plupart des gens, faire les deux donne de meilleurs résultats sur la santé et la forme qu'un seul des deux."] },
      {
        h: "Les règles qui changent tout",
        liste: [
          "80 % de ta course en endurance facile : tu dois pouvoir parler. Les séances dures se limitent à une ou deux par semaine.",
          "Si muscu et course tombent le même jour, laisse au moins 6 heures entre les deux, ou commence par ta priorité.",
          "Pas de séance de jambes lourde la veille d'une séance de course dure, ni l'inverse.",
          "Monte le volume de course doucement : 10 % de plus par semaine au maximum.",
          "Mange et dors en conséquence : deux types d'entraînement, c'est plus de dépense.",
        ],
      },
      {
        h: "Deux semaines types",
        tableau: [
          { titre: "Priorité muscle (3 muscu + 2 courses)", lignes: ["Lundi : muscu haut du corps", "Mardi : footing facile 30 à 40 min", "Mercredi : muscu jambes", "Vendredi : muscu corps entier", "Dimanche : sortie longue facile"] },
          { titre: "Priorité course (2 muscu + 3 courses)", lignes: ["Lundi : muscu corps entier", "Mardi : fractionné ou seuil", "Jeudi : footing facile + muscu haut du corps", "Samedi : footing facile", "Dimanche : sortie longue"] },
        ],
      },
      { h: "Et la séance combinée ?", p: ["Quand le temps manque, une séance qui enchaîne musculation et bloc cardio fonctionne aussi : la musculation d'abord si tu veux surtout gagner en force, le cardio d'abord si tu prépares une course. Garde-la pour les semaines chargées plutôt que d'en faire la règle."] },
    ],
    cta: "Combine tes séances dans Oxa : muscu, course et séance combinée au même endroit",
    lien: "/entrainement/assistant/?type=mixte&src=blog-hybride",
  },
];

const LISTE: Article[] = [
  {
    slug: "programme-street-workout-debutant",
    type: "guide",
    categorie: "Street", date: "2026-10-12", couverture: "/img/grand/rubrique-street.avif",
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
    type: "guide",
    categorie: "Street", date: "2026-10-14", couverture: imgExGrand("tr", 1),
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
    type: "guide",
    categorie: "Muscu", date: "2026-10-16", couverture: imgExGrand("pomp", 0),
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
    type: "guide",
    categorie: "Nutrition", date: "2026-10-18", ...recette("bolognaise-lentilles"),
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
  ...NOUVEAUX,
];

/** Les articles, du plus récent au plus ancien. */
export const ARTICLES: Article[] = [...LISTE].sort((a, b) => b.date.localeCompare(a.date));
/** Textes d'un article dans une langue (l'anglais est dans lib/data/blog-en.ts, rangé sous l'identifiant français). */
export const texte = (a: Article, l: Langue): Texte => (l === "en" ? BLOG_EN[a.slug] : a);
/** Adresse d'un article dans une langue. */
export const adresse = (a: Article, l: Langue) => `${l === "en" ? "/en" : ""}/${a.type === "guide" ? "guides" : "blog"}/${texte(a, l).slug}/`;
export const article = (slug: string, l: Langue = "fr", type?: Article["type"]) => ARTICLES.find((a) => texte(a, l).slug === slug && (!type || a.type === type));
/** Les guides, dans l'ordre de lecture conseillé (du plus récent au plus ancien ne veut rien dire pour eux). */
const ORDRE_GUIDES = ["preparer-premier-hyrox", "programme-street-workout-debutant", "premiere-traction", "seance-full-body-sans-materiel", "repas-prise-de-muscle-petit-budget"];
export const GUIDES = ORDRE_GUIDES.map((s) => ARTICLES.find((a) => a.slug === s)!).filter(Boolean);
/** Les articles du blog, du plus récent au plus ancien. */
export const BILLETS = ARTICLES.filter((a) => a.type === "article");
/** Minutes de lecture (environ 200 mots par minute). */
export function tempsLecture(a0: Article, l: Langue = "fr") {
  const a = texte(a0, l);
  const texteBrut = [a.intro, ...a.blocs.flatMap((b) => [b.h, ...(b.p ?? []), ...(b.liste ?? []), ...(b.tableau ?? []).flatMap((t) => [t.titre, ...t.lignes])])].join(" ");
  return Math.max(1, Math.round(texteBrut.split(/\s+/).filter(Boolean).length / 200));
}
/** Deux articles à lire ensuite : de la même catégorie d'abord, puis les plus récents. */
export function aLireAussi(slug: string, n = 2, l: Langue = "fr") {
  const a = article(slug, l);
  const autres = ARTICLES.filter((x) => x !== a);
  return [...autres.filter((x) => x.categorie === a?.categorie), ...autres.filter((x) => x.categorie !== a?.categorie)].slice(0, n);
}
/** Date lisible : « 12 oct. 2026 », « 12 Oct 2026 ». */
export const dateTxt = (d: string, l: Langue = "fr") => new Date(d + "T12:00").toLocaleDateString(l === "en" ? "en-GB" : "fr-FR", { day: "numeric", month: "short", year: "numeric" });
