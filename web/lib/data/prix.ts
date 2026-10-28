/* Prix de référence des aliments de la partie Repas, pour estimer le budget des courses.
   Prix moyens en supermarché en France (marque distributeur), arrondis : une estimation,
   pas le prix d'un magasin donné. À revoir une fois par an.
   Format : [prix au kilo (ou au litre) en euros, emballage courant en grammes].
   L'emballage sert au calcul « en caisse » : on n'achète pas 180 g de pâtes mais un paquet de 500 g.
   Les produits de base (sel, huile, épices…) n'ont pas de prix : ils ne vont jamais sur la liste. */

export const PRIX: Record<string, [number, number]> = {
  /* viandes, poissons, œufs, protéines végétales */
  poulet: [13, 400], dinde: [12, 400], hache5: [13, 250], boeuf: [25, 300], porc: [16, 500],
  jambon: [14, 160], saumon: [28, 250], cabillaud: [26, 260], thon: [15, 112], crevettes: [25, 200],
  sardines: [14, 95], oeuf: [6.5, 300], blanc_oeuf: [5, 500], tofu: [9, 200], tempeh: [16, 200], tofu_fume: [11, 200],

  /* produits laitiers et alternatives */
  skyr: [4, 450], fromage_blanc: [2.8, 500], yaourt_grec: [4.5, 500], yaourt: [2, 500], lait: [1, 1000],
  lait_soja: [1.8, 1000], cottage: [6.5, 200], mozza: [9, 125], feta: [12, 200], emmental: [9, 200],
  parmesan: [22, 100], ricotta: [8, 250], whey: [25, 1000], proteine_vege: [30, 1000], beurre: [10, 250], creme: [4.5, 200],

  /* féculents et légumineuses */
  riz: [2.8, 1000], riz_complet: [3, 1000], pates: [1.6, 500], pates_comp: [2.2, 500], quinoa: [9, 500],
  semoule: [3, 500], avoine: [2.5, 500], pain_complet: [4.5, 500], pain_mie: [4, 500], tortilla: [5, 360],
  pdt: [1.6, 2500], patate_douce: [3.2, 1000], lentilles_corail: [4.5, 500], lentilles: [3.6, 500],
  pois_chiches: [3, 265], haricots_rouges: [3, 250], galettes_riz: [10, 130], farine: [1.1, 1000],
  nouilles_riz: [6, 400], gnocchis: [4, 500],

  /* légumes */
  brocoli: [3.5, 500], courgette: [2.5, 200], poivron: [4, 150], tomate: [3, 120], tomates_cerises: [7, 250],
  oignon: [2, 100], ail: [8, 50], carotte: [1.5, 1000], epinards: [8, 300], haricots_verts: [4, 500],
  champignons: [5, 250], salade: [4, 250], concombre: [3, 300], avocat: [8, 150], poireau: [3, 150],
  chou_fleur: [3.5, 800], petits_pois: [3.5, 1000], mais: [4, 285], legumes_wok: [4.5, 750],
  butternut: [2.5, 1200], gingembre: [10, 100], herbes: [30, 30],

  /* fruits */
  citron: [4, 100], banane: [2, 120], pomme: [2.8, 150], fruits_rouges: [8, 500], orange: [2.5, 150],
  kiwi: [5, 75], mangue: [5, 400], dattes: [9, 250], raisins_secs: [7, 250],

  /* épicerie */
  cacahuete: [8, 350], amandes: [16, 200], noix: [20, 200], chia: [12, 250], miel: [10, 250],
  sirop_erable: [25, 250], chocolat: [14, 100], cacao: [12, 250], lait_coco: [5, 400], passata: [2, 500],
  houmous: [9, 200], pesto: [15, 190], curry_pate: [25, 100],
};

/* Écart de prix selon le magasin : du hard-discount au supermarché de centre-ville. */
export const FOURCHETTE: [number, number] = [0.85, 1.2];
