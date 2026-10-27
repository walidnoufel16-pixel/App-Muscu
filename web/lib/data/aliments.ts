/* Aliments de base de la partie Repas : valeurs pour 100 g (produit cru sauf mention),
   d'après la table de composition nutritionnelle CIQUAL (ANSES, licence ouverte Etalab),
   arrondies. Format compact :
   [id, nom, nom anglais, rayon, kcal, protéines, glucides, lipides, marques, unité?]
   Marques : a = d'origine animale (non vegan), v = viande, p = poisson ou fruits de mer,
   l = lait / lactose, g = gluten, o = œuf, c = fruits à coque, r = arachide,
   h = porc (ni halal ni casher), k = fruits de mer (pas casher),
   b = de base (sel, huile, épices… : supposé dans tous les placards, jamais sur la liste).
   Unité : [nom, nom anglais, grammes] pour ce qui se compte (œufs, bananes, tranches…). */

export type Rayon = "prot" | "lait" | "fec" | "leg" | "fru" | "epi" | "base";
export type Aliment = {
  id: string; n: string; en: string; ray: Rayon;
  kcal: number; p: number; g: number; l: number;
  m: string; u?: [string, string, number];
};

type Ligne = [string, string, string, Rayon, number, number, number, number, string, ([string, string, number])?];

const L: Ligne[] = [
  /* viandes, poissons, œufs, protéines végétales */
  ["poulet", "Blanc de poulet", "Chicken breast", "prot", 115, 24, 0, 1.8, "av"],
  ["dinde", "Escalope de dinde", "Turkey cutlet", "prot", 108, 24, 0, 1.2, "av"],
  ["hache5", "Steak haché 5 %", "5% ground beef", "prot", 125, 21, 0, 5, "av", ["steak haché", "patty", 125]],
  ["boeuf", "Rumsteck", "Beef rump steak", "prot", 130, 22, 0, 4.5, "av"],
  ["porc", "Filet mignon de porc", "Pork tenderloin", "prot", 120, 22, 0, 3.5, "avh"],
  ["jambon", "Jambon blanc", "Cooked ham", "prot", 115, 20, 1, 3.5, "avh", ["tranche", "slice", 40]],
  ["saumon", "Pavé de saumon", "Salmon fillet", "prot", 200, 20, 0, 13, "ap", ["pavé", "fillet", 125]],
  ["cabillaud", "Dos de cabillaud", "Cod fillet", "prot", 80, 18, 0, 0.7, "ap", ["dos", "fillet", 130]],
  ["thon", "Thon au naturel", "Canned tuna in water", "prot", 115, 26, 0, 1, "ap", ["boîte", "can", 112]],
  ["crevettes", "Crevettes cuites décortiquées", "Cooked peeled prawns", "prot", 95, 21, 0, 1.2, "apk"],
  ["sardines", "Sardines à l'huile", "Sardines in oil", "prot", 210, 25, 0, 12, "ap", ["boîte", "can", 95]],
  ["oeuf", "Œufs", "Eggs", "prot", 140, 12.5, 0.7, 10, "ao", ["œuf", "egg", 50]],
  ["blanc_oeuf", "Blancs d'œufs", "Egg whites", "prot", 47, 10.5, 0.7, 0.2, "ao"],
  ["tofu", "Tofu ferme", "Firm tofu", "prot", 130, 13, 2, 8, ""],
  ["tempeh", "Tempeh", "Tempeh", "prot", 190, 19, 9, 10, ""],
  ["tofu_fume", "Tofu fumé", "Smoked tofu", "prot", 150, 16, 2, 9, ""],

  /* produits laitiers et alternatives */
  ["skyr", "Skyr nature", "Plain skyr", "lait", 63, 11, 4, 0.2, "al"],
  ["fromage_blanc", "Fromage blanc 3 %", "Fromage blanc (3% fat)", "lait", 75, 7, 4, 3, "al"],
  ["yaourt_grec", "Yaourt grec", "Greek yogurt", "lait", 120, 6, 4, 9, "al"],
  ["yaourt", "Yaourt nature", "Plain yogurt", "lait", 61, 4.3, 5.5, 1.5, "al", ["pot", "pot", 125]],
  ["lait", "Lait demi-écrémé", "Semi-skimmed milk", "lait", 46, 3.3, 4.8, 1.6, "al"],
  ["lait_soja", "Boisson au soja", "Soy drink", "lait", 40, 3.5, 1.5, 2, ""],
  ["cottage", "Cottage cheese", "Cottage cheese", "lait", 98, 11, 3, 4.3, "al"],
  ["mozza", "Mozzarella", "Mozzarella", "lait", 240, 18, 1, 18, "al", ["boule", "ball", 125]],
  ["feta", "Feta", "Feta", "lait", 260, 14, 1, 21, "al"],
  ["emmental", "Emmental râpé", "Grated Emmental", "lait", 380, 28, 0, 30, "al"],
  ["parmesan", "Parmesan", "Parmesan", "lait", 400, 33, 0, 29, "al"],
  ["ricotta", "Ricotta", "Ricotta", "lait", 140, 10, 3, 10, "al"],
  ["whey", "Protéine en poudre (whey)", "Whey protein powder", "lait", 380, 78, 8, 5, "al", ["dose", "scoop", 30]],
  ["proteine_vege", "Protéine végétale en poudre", "Plant protein powder", "lait", 370, 75, 6, 6, "", ["dose", "scoop", 30]],
  ["beurre", "Beurre", "Butter", "lait", 740, 0.7, 0.7, 82, "al"],
  ["creme", "Crème fraîche légère", "Light crème fraîche", "lait", 160, 3, 4, 15, "al"],

  /* féculents, céréales, légumineuses */
  ["riz", "Riz basmati", "Basmati rice", "fec", 350, 8, 77, 0.8, ""],
  ["riz_complet", "Riz complet", "Brown rice", "fec", 350, 7.5, 72, 2.7, ""],
  ["pates", "Pâtes", "Pasta", "fec", 355, 12.5, 71, 1.5, "g"],
  ["pates_comp", "Pâtes complètes", "Wholewheat pasta", "fec", 350, 13, 64, 2.5, "g"],
  ["quinoa", "Quinoa", "Quinoa", "fec", 360, 14, 60, 6, ""],
  ["semoule", "Semoule complète", "Wholewheat couscous", "fec", 360, 12.5, 72, 1.5, "g"],
  ["avoine", "Flocons d'avoine", "Rolled oats", "fec", 370, 13, 58, 7, "g"],
  ["pain_complet", "Pain complet", "Wholemeal bread", "fec", 245, 9, 43, 3, "g", ["tranche", "slice", 35]],
  ["pain_mie", "Pain de mie complet", "Wholemeal sandwich bread", "fec", 255, 9, 45, 4, "g", ["tranche", "slice", 25]],
  ["tortilla", "Tortillas de blé", "Wheat tortillas", "fec", 300, 8.5, 50, 7, "g", ["tortilla", "tortilla", 60]],
  ["pdt", "Pommes de terre", "Potatoes", "fec", 80, 2, 17, 0.1, ""],
  ["patate_douce", "Patate douce", "Sweet potato", "fec", 86, 1.6, 20, 0.1, ""],
  ["lentilles_corail", "Lentilles corail", "Red lentils", "fec", 340, 24, 50, 1.5, ""],
  ["lentilles", "Lentilles vertes", "Green lentils", "fec", 330, 24, 48, 1.5, ""],
  ["pois_chiches", "Pois chiches (conserve)", "Chickpeas (canned)", "fec", 120, 7, 15, 2.5, ""],
  ["haricots_rouges", "Haricots rouges (conserve)", "Kidney beans (canned)", "fec", 105, 7.5, 14, 0.6, ""],
  ["galettes_riz", "Galettes de riz", "Rice cakes", "fec", 380, 8, 80, 2.8, "", ["galette", "cake", 9]],
  ["farine", "Farine de blé", "Wheat flour", "fec", 345, 10, 72, 1.3, "g"],
  ["nouilles_riz", "Nouilles de riz", "Rice noodles", "fec", 360, 6, 80, 0.6, ""],
  ["gnocchis", "Gnocchis", "Gnocchi", "fec", 150, 3.5, 32, 0.4, "g"],

  /* légumes (crus) */
  ["brocoli", "Brocoli", "Broccoli", "leg", 34, 2.8, 3, 0.4, ""],
  ["courgette", "Courgette", "Courgette", "leg", 17, 1.2, 2, 0.3, "", ["courgette", "courgette", 200]],
  ["poivron", "Poivron", "Bell pepper", "leg", 25, 0.9, 4.5, 0.3, "", ["poivron", "pepper", 150]],
  ["tomate", "Tomates", "Tomatoes", "leg", 18, 0.9, 3, 0.2, "", ["tomate", "tomato", 120]],
  ["tomates_cerises", "Tomates cerises", "Cherry tomatoes", "leg", 20, 0.9, 3.5, 0.2, ""],
  ["oignon", "Oignon", "Onion", "leg", 40, 1.2, 7, 0.2, "", ["oignon", "onion", 100]],
  ["ail", "Ail", "Garlic", "leg", 130, 6, 24, 0.5, "", ["gousse", "clove", 5]],
  ["carotte", "Carottes", "Carrots", "leg", 36, 0.8, 7, 0.2, "", ["carotte", "carrot", 100]],
  ["epinards", "Épinards", "Spinach", "leg", 23, 2.9, 1.4, 0.4, ""],
  ["haricots_verts", "Haricots verts", "Green beans", "leg", 30, 2, 4.5, 0.2, ""],
  ["champignons", "Champignons de Paris", "Button mushrooms", "leg", 22, 3, 0.5, 0.3, ""],
  ["salade", "Salade verte", "Lettuce", "leg", 14, 1.3, 1.5, 0.2, ""],
  ["concombre", "Concombre", "Cucumber", "leg", 13, 0.7, 2, 0.1, "", ["concombre", "cucumber", 300]],
  ["avocat", "Avocat", "Avocado", "leg", 200, 1.9, 1.8, 20, "", ["avocat", "avocado", 150]],
  ["poireau", "Poireau", "Leek", "leg", 29, 1.6, 4.6, 0.3, "", ["poireau", "leek", 150]],
  ["chou_fleur", "Chou-fleur", "Cauliflower", "leg", 27, 2, 3, 0.3, ""],
  ["petits_pois", "Petits pois (surgelés)", "Garden peas (frozen)", "leg", 80, 5.5, 10, 0.5, ""],
  ["mais", "Maïs (conserve)", "Sweetcorn (canned)", "leg", 100, 3, 16, 1.5, ""],
  ["legumes_wok", "Légumes pour wok (surgelés)", "Stir-fry vegetables (frozen)", "leg", 35, 2, 5, 0.3, ""],
  ["butternut", "Courge butternut", "Butternut squash", "leg", 40, 1, 8, 0.1, ""],
  ["gingembre", "Gingembre frais", "Fresh ginger", "leg", 80, 1.8, 16, 0.75, ""],
  ["herbes", "Herbes fraîches (persil, coriandre, basilic)", "Fresh herbs (parsley, coriander, basil)", "leg", 40, 3, 5, 0.8, ""],
  ["citron", "Citron", "Lemon", "fru", 30, 0.7, 3, 0.3, "", ["citron", "lemon", 100]],

  /* fruits */
  ["banane", "Bananes", "Bananas", "fru", 90, 1.1, 20, 0.3, "", ["banane", "banana", 120]],
  ["pomme", "Pommes", "Apples", "fru", 53, 0.3, 12, 0.2, "", ["pomme", "apple", 150]],
  ["fruits_rouges", "Fruits rouges (surgelés)", "Mixed berries (frozen)", "fru", 45, 1, 8, 0.4, ""],
  ["orange", "Oranges", "Oranges", "fru", 45, 0.9, 9, 0.2, "", ["orange", "orange", 150]],
  ["kiwi", "Kiwis", "Kiwis", "fru", 60, 1, 12, 0.6, "", ["kiwi", "kiwi", 75]],
  ["mangue", "Mangue", "Mango", "fru", 65, 0.6, 14, 0.4, ""],
  ["dattes", "Dattes", "Dates", "fru", 280, 2.3, 65, 0.4, "", ["datte", "date", 8]],
  ["raisins_secs", "Raisins secs", "Raisins", "fru", 300, 3, 68, 0.5, ""],

  /* épicerie */
  ["cacahuete", "Beurre de cacahuète", "Peanut butter", "epi", 600, 25, 14, 50, "r"],
  ["amandes", "Amandes", "Almonds", "epi", 600, 25, 7, 52, "c"],
  ["noix", "Cerneaux de noix", "Walnuts", "epi", 690, 15, 7, 65, "c"],
  ["chia", "Graines de chia", "Chia seeds", "epi", 490, 17, 8, 31, ""],
  ["miel", "Miel", "Honey", "epi", 320, 0.4, 81, 0, "a"],
  ["sirop_erable", "Sirop d'érable", "Maple syrup", "epi", 260, 0, 67, 0, ""],
  ["chocolat", "Chocolat noir 70 %", "70% dark chocolate", "epi", 570, 8, 33, 42, ""],
  ["cacao", "Cacao non sucré", "Unsweetened cocoa", "epi", 380, 20, 15, 20, ""],
  ["lait_coco", "Lait de coco léger", "Light coconut milk", "epi", 120, 1, 2.5, 11, ""],
  ["passata", "Coulis de tomate", "Tomato passata", "epi", 30, 1.5, 5, 0.2, ""],
  ["houmous", "Houmous", "Hummus", "epi", 300, 7.5, 13, 24, ""],
  ["pesto", "Pesto", "Pesto", "epi", 450, 5, 6, 45, "alc"],
  ["sauce_soja", "Sauce soja", "Soy sauce", "base", 60, 8, 6, 0, "bg"],
  ["curry_pate", "Pâte de curry", "Curry paste", "epi", 120, 2, 12, 7, ""],

  /* de base : supposé dans tous les placards */
  ["huile", "Huile d'olive", "Olive oil", "base", 900, 0, 0, 100, "b"],
  ["epices", "Épices (paprika, cumin, curry…)", "Spices (paprika, cumin, curry…)", "base", 300, 12, 40, 10, "b"],
  ["sel_poivre", "Sel et poivre", "Salt and pepper", "base", 0, 0, 0, 0, "b"],
  ["moutarde", "Moutarde", "Mustard", "base", 150, 7, 5, 11, "b"],
  ["vinaigre", "Vinaigre balsamique", "Balsamic vinegar", "base", 100, 0.5, 17, 0, "b"],
  ["bouillon", "Bouillon cube", "Stock cube", "base", 250, 10, 20, 15, "b"],
  ["cannelle", "Cannelle", "Cinnamon", "base", 250, 4, 50, 1.2, "b"],
  ["levure", "Levure chimique", "Baking powder", "base", 100, 0, 25, 0, "b"],
  ["vanille", "Vanille", "Vanilla", "base", 290, 0, 13, 0, "b"],
];

export const ALIM: Record<string, Aliment> = Object.fromEntries(
  L.map(([id, n, en, ray, kcal, p, g, l, m, u]) => [id, { id, n, en, ray, kcal, p, g, l, m, u }]),
);

/* Rayons, dans l'ordre d'un magasin et de la liste de courses. */
export const RAYONS: { k: Rayon; n: string; en: string }[] = [
  { k: "leg", n: "Légumes", en: "Vegetables" },
  { k: "fru", n: "Fruits", en: "Fruit" },
  { k: "prot", n: "Viandes, poissons, œufs, tofu", en: "Meat, fish, eggs, tofu" },
  { k: "lait", n: "Produits laitiers", en: "Dairy" },
  { k: "fec", n: "Féculents et légumineuses", en: "Starches and pulses" },
  { k: "epi", n: "Épicerie", en: "Pantry" },
  { k: "base", n: "De base", en: "Staples" },
];
