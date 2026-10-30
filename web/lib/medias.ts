/* Toutes les images de l'app passent par ici, avec leur crédit.
   Le jour où un pack sous licence remplace les démonstrations, il suffit
   d'ajouter sa source ci-dessous et de l'associer aux exercices concernés :
   les écrans n'ont pas à changer. */
import { tr } from "@/lib/i18n";
import { EX } from "@/lib/data/exercices";
import { POSTES } from "@/lib/data/salle";

export type Source = { nom: string; licence: string; lien: string; mention: string };

export const SOURCES = {
  fedb: {
    nom: "free-exercise-db",
    licence: tr("Domaine public (Unlicense)"),
    lien: "https://github.com/yuhonas/free-exercise-db",
    mention: tr("Illustrations · free-exercise-db · domaine public · retouche Repère"),
  },
  /* photos de la base d'exercices wger, une par auteur (licence CC BY-SA : auteur cité) */
  wgerWakanda: {
    nom: "wakanda90 · wger",
    licence: "CC BY-SA 4.0",
    lien: "https://wger.de/en/exercise/456/view",
    mention: tr("Photo · wakanda90 sur wger · CC BY-SA 4.0 · retouche Repère"),
  },
} satisfies Record<string, Source>;

export type CleSource = keyof typeof SOURCES;

/* Source des démonstrations de chaque exercice (free-exercise-db, sauf celles-ci). */
const SOURCE_EX: Partial<Record<string, CleSource>> = { pistol: "wgerWakanda" };
export const sourceEx = (id: string): Source => SOURCES[SOURCE_EX[id] ?? "fedb"];

/** Photo de démonstration : 0 = départ, 1 = fin. */
export const imgEx = (id: string, n: 0 | 1 = 0) => `/img/${EX[id]?.img}_${n}.avif`;
/** La même en grand (850 px au lieu de 420), pour l'afficher à pleine largeur (scripts/photos-grand.mjs).
    Gardée sur le téléphone quand on la regarde ; hors connexion sans elle, on reprend la petite. */
export const imgExGrand = (id: string, n: 0 | 1 = 0) => `/img/grand/${EX[id]?.img}_${n}.avif`;

/* Photos Unsplash des machines sans exercice illustré (Ma salle). Règles d'Unsplash :
   l'image s'affiche depuis leurs serveurs (jamais copiée dans public/) et son
   photographe est cité dans Crédits, avec un lien vers son profil. */
const UTM = "?utm_source=repere&utm_medium=referral";
const PHOTOS_POSTES: Record<string, { img: string; auteur: string; profil: string }> = {
  bancreg: { img: "photo-1735647134600-fd2b75fba36d", auteur: "LIFE FIT", profil: "lifefitinda1" },
  functr: { img: "photo-1591940806652-c400764a8da8", auteur: "Andrew Valdivia", profil: "donovan_valdivia" },
  ghd: { img: "photo-1591940808747-05d59b31a299", auteur: "Andrew Valdivia", profil: "donovan_valdivia" },
  chaise: { img: "photo-1434656742621-5c4a7d73d0e7", auteur: "Scott Webb", profil: "scottwebb" },
  airbike: { img: "photo-1685633224623-7551691bb604", auteur: "Ambitious Studio* | Rick Barrett", profil: "weareambitious" },
  velosa: { img: "photo-1637714102098-6514a99eefd3", auteur: "Intenza Fitness", profil: "intenzafitness" },
  traineau: { img: "photo-1751456357786-68c278e9063c", auteur: "TSquared Lab", profil: "tsquaredlab" },
};

/* Photos sous licence libre (Creative Commons), copiées dans public/img, recadrées au carré. */
const PHOTOS_LIBRES: Record<string, { auteur: string; licence: string; lien: string }> = {
  mollass: { auteur: "DakilAuctioneers", licence: "CC BY 2.0", lien: "https://www.flickr.com/photos/29694550@N06/19507914228" },
  devinc: { auteur: "Aliva Sahoo", licence: "CC BY-SA 4.0", lien: "https://commons.wikimedia.org/w/index.php?curid=179972402" },
  latm: { auteur: "Aliva Sahoo", licence: "CC BY-SA 4.0", lien: "https://commons.wikimedia.org/w/index.php?curid=179972398" },
};

/** Photo d'un poste de « Ma salle » : celle de son exercice, sinon une photo libre ou Unsplash, sinon rien (icône). */
export const imgPoste = (p: { id: string; img?: string }) => {
  if (p.img) return imgEx(p.img);
  if (PHOTOS_LIBRES[p.id]) return `/img/poste-${p.id}.avif`;
  const ph = PHOTOS_POSTES[p.id];
  return ph && `https://images.unsplash.com/${ph.img}?w=360&h=360&fit=crop&auto=format&q=70`;
};
/** La même photo en grand, sans recadrage, pour la voir en plein écran. */
export const imgPosteGrand = (p: { id: string; img?: string }) => {
  if (p.img) return imgExGrand(p.img);
  if (PHOTOS_LIBRES[p.id]) return `/img/poste-${p.id}-grand.avif`;
  const ph = PHOTOS_POSTES[p.id];
  return ph && `https://images.unsplash.com/${ph.img}?w=1080&fit=max&auto=format&q=75`;
};
/** Qui a fait la photo d'un poste, pour la mention sous la photo en grand. */
export const creditPoste = (p: { id: string; img?: string }): { nom: string; lien: string; licence: string } | undefined => {
  if (p.img) { const s = sourceEx(p.img); return { nom: s.nom, lien: s.lien, licence: s.licence }; }
  if (PHOTOS_LIBRES[p.id]) { const ph = PHOTOS_LIBRES[p.id]; return { nom: ph.auteur, lien: ph.lien, licence: ph.licence }; }
  const ph = PHOTOS_POSTES[p.id];
  return ph && { nom: tr("{n} sur Unsplash", { n: ph.auteur }), lien: `https://unsplash.com/@${ph.profil}${UTM}`, licence: tr("Licence Unsplash") };
};

/* Photos Unsplash des recettes (partie Repas), mêmes règles que celles des machines. */
const PHOTOS_RECETTES: Record<string, { img: string; auteur: string; profil: string }> = {
  "porridge-prot": { img: "photo-1587708062699-8553e1b270ba", auteur: "Ellie Ellien", profil: "ellienelie" },
  "omelette-epinards": { img: "photo-1677844592730-ce9c936d8f1a", auteur: "Bakd&Raw by Karolin Baitinger", profil: "bakdandraw" },
  "skyr-bowl": { img: "photo-1640458348210-6c46cc136f18", auteur: "Kate Mishchankova", profil: "katemi" },
  "pancakes-avoine": { img: "photo-1606149186228-4e5ac94a742e", auteur: "Eiliv Aceron", profil: "shootdelicious" },
  "overnight-oats": { img: "photo-1541809570-cce873416d94", auteur: "Ella Olsson", profil: "ellaolsson" },
  "tartines-oeuf-avocat": { img: "photo-1687276287139-88f7333c8ca4", auteur: "Imad 786", profil: "imad8321" },
  "smoothie-vert": { img: "photo-1639428134482-c14811a73e41", auteur: "Maja Vujic", profil: "majavujic87" },
  "brouillade-tofu": { img: "photo-1738306118397-51ecebd87fd5", auteur: "Raynil Kumar BS", profil: "raynilkumar" },
  "muffins-oeufs": { img: "photo-1518310532637-f5225f94f3c3", auteur: "Kaitlyn Chow", profil: "kaitlynraeann" },
  "fromage-blanc-granola": { img: "photo-1658935007074-39816bd8b47e", auteur: "Oksana Zub", profil: "oxanamiles" },
  "wrap-matin": { img: "photo-1707528903761-f63b970bd612", auteur: "Inna Safa", profil: "innasafa" },
  "pain-perdu-prot": { img: "photo-1484723091739-30a097e8f929", auteur: "Joseph Gonzalez", profil: "miracletwentyone" },
  "porridge-vegan": { img: "photo-1573688886153-76daa1aff29c", auteur: "Jakub Durian", profil: "jakubdurian" },
  "tartines-tofu-houmous": { img: "photo-1515041761709-f9fc96e04cd3", auteur: "Anna Pelzer", profil: "annapelzer" },
  "poulet-riz-brocoli": { img: "photo-1605291566628-6f0c7f5b9453", auteur: "logan jeffrey", profil: "foodjetsexpress" },
  "saumon-patate-douce": { img: "photo-1622453282363-0a957232df65", auteur: "George Serb", profil: "georgeserb" },
  "chili-con-carne": { img: "photo-1666819632298-fe15dc7d4c34", auteur: "Leanna Myers", profil: "myerslk88" },
  "bolognaise-lentilles": { img: "photo-1622973536968-3ead9e780960", auteur: "Homescreenify", profil: "homescreenify" },
  "curry-pois-chiches": { img: "photo-1731328351443-ea233d9b8037", auteur: "Benoit Roy", profil: "beroy" },
  "buddha-bowl": { img: "photo-1623428187969-5da2dcea5ebf", auteur: "Sonny Mauricio", profil: "northernstatemedia" },
  "wok-boeuf": { img: "photo-1666613710166-91a0cb67fad9", auteur: "Batkhuyag Enkhtuvshin", profil: "batkhuyag" },
  "cabillaud-puree": { img: "photo-1622123268092-d99ea535491e", auteur: "Stefan Schauberger", profil: "wuf2018" },
  "poke-saumon": { img: "photo-1604259596863-57153177d40b", auteur: "Miu Sua", profil: "phanhfank" },
  "dahl-lentilles": { img: "photo-1596560314766-08c0c6890024", auteur: "Kalyani Akella", profil: "mekalluakella" },
  "tacos-dinde": { img: "photo-1627564803215-ad55bad5c5ea", auteur: "montatip lilitsanong", profil: "montatip" },
  "salade-thon": { img: "photo-1604909052743-94e838986d24", auteur: "Farhad Ibrahimzade", profil: "ferhadd" },
  "gratin-pates-poulet": { img: "photo-1586032340517-0475038cee18", auteur: "micheile henderson", profil: "micheile" },
  "steak-haricots-pdt": { img: "photo-1695390837115-408e49a2041e", auteur: "Payam Moin Afshari", profil: "panevesht" },
  "risotto-champignons": { img: "photo-1662114757324-fb95be6dceaf", auteur: "Yu Hosoi", profil: "yu_grino" },
  "tofu-legumes-four": { img: "photo-1617307744152-60bf7d1da3f8", auteur: "Lottie Griffiths", profil: "lottiegriffiths" },
  "couscous-poulet": { img: "photo-1607116685391-29c9e9726561", auteur: "Karolina Kołodziejczak", profil: "rabbit_in_blue" },
  "omelette-pdt": { img: "photo-1639669794539-952631b44515", auteur: "blackieshoot", profil: "blackieshoot" },
  "crevettes-ail-riz": { img: "photo-1736618848691-2d3d0249997c", auteur: "Lucas Cipriano", profil: "lucasccipriano" },
  "soupe-lentilles": { img: "photo-1620791144170-8a443bf37a33", auteur: "Max Griss", profil: "grissphoto" },
  "porc-moutarde": { img: "photo-1570654265967-bdf0aa5078ad", auteur: "Kristina Petrick", profil: "dayinmydreams" },
  "pizza-tortilla": { img: "photo-1588315029754-2dd089d39a1a", auteur: "Kelvin T", profil: "gogofoto" },
  "burger-maison": { img: "photo-1661529515642-fef696c86f64", auteur: "Theo Crazzolara", profil: "theocrazzolara" },
  "salade-quinoa-feta": { img: "photo-1762631882502-c16fa08c9e14", auteur: "joe boshra", profil: "joestudios" },
  "gnocchis-poulet-pesto": { img: "photo-1710532767830-177d374589c9", auteur: "Luke Tokaryk", profil: "lukelukeluke" },
  "dinde-curry-coco": { img: "photo-1588166524941-3bf61a9c41db", auteur: "charlesdeluvio", profil: "charlesdeluvio" },
  "sardines-tartines": { img: "photo-1654171570628-e7a4602f56ad", auteur: "Chris Curry", profil: "chriscurry92" },
  "chili-vegan": { img: "photo-1591266798549-32fa7cd32f45", auteur: "micheile henderson", profil: "micheile" },
  "wrap-poulet-houmous": { img: "photo-1626700051175-6818013e1d4f", auteur: "Max Griss", profil: "grissphoto" },
  "butternut-lentilles": { img: "photo-1643978887361-8a1d580c89f4", auteur: "Filipp Romanovski", profil: "filipp_roman_photography" },
  "oeufs-cocotte": { img: "photo-1682622110419-b671026a4536", auteur: "Alex Bayev", profil: "alexbayev" },
  "riz-saute-oeuf": { img: "photo-1748286993010-73db79cf6fbb", auteur: "Dmytro Glazunov", profil: "d_glazun0v" },
  "shaker-banane": { img: "photo-1740637372899-e27569049917", auteur: "Elena Leya", profil: "foodistika" },
  "galettes-cacahuete": { img: "photo-1676976198284-e94a1de93e96", auteur: "Kashish Lamba", profil: "drunkenchimp" },
  "skyr-fruits": { img: "photo-1595787572590-545171362a1c", auteur: "Julian Hochgesang", profil: "julianhochgesang" },
  "oeufs-durs-crudites": { img: "photo-1570639518322-96c1d2f28f86", auteur: "Aris Dwiyanto", profil: "arisdwiy" },
  "cottage-fruits": { img: "photo-1611575330633-551252bafad7", auteur: "Nataliya Melnychuk", profil: "natinati" },
  "energy-balls": { img: "photo-1596723455658-72ebb0d12edd", auteur: "Abbie Whiddett", profil: "abbiew" },
  "tartine-jambon": { img: "photo-1612182062808-9929a1873b3e", auteur: "Jaqueline Pelzer", profil: "jaqui123456" },
  "pomme-amandes": { img: "photo-1568702846914-96b305d2aaeb", auteur: "an_vision", profil: "anvision" },
  "lait-chocolat": { img: "photo-1553909489-ec2175ef3f52", auteur: "Mae Mu", profil: "picoftasty" },
  "yaourt-grec-miel": { img: "photo-1589963465859-7b5c846d79af", auteur: "Mahbod Akhzami", profil: "mahbodakhzami" },
  "smoothie-mangue": { img: "photo-1623065422902-30a2d299bbe4", auteur: "Julia Zyablova", profil: "foyu" },
  "edamame-tofu": { img: "photo-1544519685-86ccb2dab444", auteur: "Yoav Aziz", profil: "yoavaziz" },
  "mug-cake": { img: "photo-1609521631190-554ad604e687", auteur: "Hanna Balan", profil: "fu_psi" },
  "cheesecake-verrine": { img: "photo-1635197026346-2c1904434c10", auteur: "Jana Ohajdova", profil: "jankao" },
  "pudding-chia": { img: "photo-1629180050285-7c56c6671f19", auteur: "Helen Van", profil: "uynnha" },
  "pomme-four": { img: "photo-1559057833-5290188ac9ef", auteur: "David B Townsend", profil: "dbtownsend" },
  "banane-glacee": { img: "photo-1749863438325-ec3ae343b014", auteur: "Elvira Syamsir", profil: "vira_yanar" },
};

/** Photo d'une recette : carrée (listes) ou large (fiche). Sans photo : rien, la vignette garde sa pastille. */
export const imgRecette = (id: string, format: "carre" | "large" = "carre") => {
  const ph = PHOTOS_RECETTES[id];
  return ph && `https://images.unsplash.com/${ph.img}?${format === "carre" ? "w=240&h=240" : "w=1080&h=540&crop=entropy"}&fit=crop&auto=format&q=70`;
};
/** Photographe d'une recette, pour la mention sous la photo. */
export const auteurRecette = (id: string) => {
  const ph = PHOTOS_RECETTES[id];
  return ph && { nom: ph.auteur, lien: `https://unsplash.com/@${ph.profil}${UTM}` };
};

/** Toutes les photos servies par Unsplash (recettes, machines, petites et grandes) : l'app les
    garde sur le téléphone pour les montrer hors connexion (lib/photos-hors-ligne.ts). */
export const photosDistantes = () => [
  ...Object.keys(PHOTOS_RECETTES).flatMap((id) => [imgRecette(id, "carre")!, imgRecette(id, "large")!]),
  ...POSTES.filter((p) => !p.img && PHOTOS_POSTES[p.id]).flatMap((p) => [imgPoste(p)!, imgPosteGrand(p)!]),
];

/* Tout ce que l'app emprunte, pour la page Compte › Crédits. */
export const CREDITS: { quoi: string; nom: string; licence: string; lien: string }[] = [
  ...Object.values(SOURCES).map((s) => ({ quoi: tr("Photos des exercices"), nom: s.nom, licence: s.licence, lien: s.lien })),
  ...POSTES.filter((p) => PHOTOS_POSTES[p.id]).map((p) => {
    const ph = PHOTOS_POSTES[p.id];
    return { quoi: tr("Photo · {n}", { n: p.n }), nom: tr("{n} sur Unsplash", { n: ph.auteur }), licence: tr("Licence Unsplash"), lien: `https://unsplash.com/@${ph.profil}${UTM}` };
  }),
  ...POSTES.filter((p) => PHOTOS_LIBRES[p.id]).map((p) => {
    const ph = PHOTOS_LIBRES[p.id];
    return { quoi: tr("Photo recadrée · {n}", { n: p.n }), nom: ph.auteur, licence: ph.licence, lien: ph.lien };
  }),
  /* chaque photographe est nommé sous sa photo, dans la fiche de la recette */
  { quoi: tr("Photos des recettes"), nom: tr("{n} photographes d'Unsplash, cités sous chaque photo", { n: new Set(Object.values(PHOTOS_RECETTES).map((ph) => ph.profil)).size }), licence: tr("Licence Unsplash"), lien: `https://unsplash.com/${UTM}` },
  { quoi: tr("Valeurs des produits (protéines)"), nom: tr("Open Food Facts, recherche par nom via wger"), licence: "ODbL", lien: "https://world.openfoodfacts.org" },
  { quoi: tr("Schéma du corps"), nom: tr("react-native-body-highlighter, Hicham Elabbassi"), licence: "MIT", lien: "https://github.com/HichamELBSI/react-native-body-highlighter" },
  { quoi: tr("Icônes"), nom: tr("Phosphor Icons"), licence: "MIT", lien: "https://phosphoricons.com" },
  { quoi: tr("Polices"), nom: tr("Geist (Vercel) · Barlow Condensed (Jeremy Tribby)"), licence: tr("SIL Open Font License"), lien: "https://vercel.com/font" },
];
