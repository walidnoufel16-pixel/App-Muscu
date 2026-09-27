// ============================================================
//  Repère — génération du cycle par IA (fonction Edge "generer")
//  Secret requis : ANTHROPIC_API_KEY (Edge Functions → Secrets)
//  Secrets optionnels : QUOTA_PAR_UTILISATEUR (défaut 5 / jour),
//                       QUOTA_TOTAL (défaut 150 / jour, tous comptes confondus)
// ============================================================

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
/* Aucun texte renvoyé à l'app ne doit pouvoir former une balise HTML. */
const sansBalise = (t: unknown) => String(t ?? "").replace(/[<>]/g, "");
/* Coupe au dernier point plutôt qu'au caractère près, pour ne pas laisser
   de phrase inachevée à l'écran.                                          */
function coupe(t: unknown, max: number) {
  const s = sansBalise(t).trim();
  if (s.length <= max) return s;
  const tronc = s.slice(0, max);
  const fin = Math.max(tronc.lastIndexOf(". "), tronc.lastIndexOf(" ! "), tronc.lastIndexOf(" ? "));
  return fin > max * 0.5 ? tronc.slice(0, fin + 1) : tronc.slice(0, tronc.lastIndexOf(" ")) + "…";
}
const rep = (o: unknown, s = 200) =>
  new Response(JSON.stringify(o), { status: s, headers: { ...CORS, "Content-Type": "application/json" } });

/* Bibliothèque fermée : l'IA ne peut choisir QUE dans cette liste.
   eq  0 machine/poulie · 1 barre · 2 haltères · 3 poids du corps
   ch  kg | lest | aucune | temps | dist                              */
const LIB = [
  {id:"dc",nom:"Développé couché barre",pat:"ph",eq:1,ch:"kg"},
  {id:"dh",nom:"Développé couché haltères",pat:"ph",eq:2,ch:"kg"},
  {id:"pomp",nom:"Pompes",pat:"ph",eq:3,ch:"aucune"},
  {id:"dip",nom:"Dips",pat:"ph",eq:3,ch:"lest"},
  {id:"dm",nom:"Développé militaire",pat:"pv",eq:1,ch:"kg"},
  {id:"dmh",nom:"Développé épaules haltères",pat:"pv",eq:2,ch:"kg"},
  {id:"pv3",nom:"Pompes en appui vertical",pat:"pv",eq:3,ch:"aucune"},
  {id:"tr",nom:"Tractions pronation",pat:"tv",eq:3,ch:"lest"},
  {id:"tp",nom:"Tirage vertical à la poulie",pat:"tv",eq:0,ch:"kg"},
  {id:"rw",nom:"Rowing barre",pat:"th",eq:1,ch:"kg"},
  {id:"rh",nom:"Rowing haltère un bras",pat:"th",eq:2,ch:"kg"},
  {id:"ra",nom:"Rowing australien",pat:"th",eq:3,ch:"aucune"},
  {id:"sq",nom:"Squat barre",pat:"eg",eq:1,ch:"kg"},
  {id:"pr",nom:"Presse à cuisses",pat:"eg",eq:0,ch:"kg"},
  {id:"fe",nom:"Fentes haltères",pat:"eg",eq:2,ch:"kg"},
  {id:"rm",nom:"Soulevé de terre roumain",pat:"fh",eq:1,ch:"kg"},
  {id:"ht",nom:"Hip thrust barre",pat:"fh",eq:1,ch:"kg"},
  {id:"el",nom:"Élévations latérales",pat:"ep",eq:2,ch:"kg"},
  {id:"fp",nom:"Face pull",pat:"re",eq:0,ch:"kg"},
  {id:"cu",nom:"Curl haltères incliné",pat:"fc",eq:2,ch:"kg"},
  {id:"tri",nom:"Extensions à la poulie",pat:"ec",eq:0,ch:"kg"},
  {id:"gai",nom:"Gainage ventral",pat:"ae",eq:3,ch:"temps"},
  {id:"rj",nom:"Relevés de jambes suspendu",pat:"ft",eq:3,ch:"aucune"},
  {id:"lom",nom:"Extensions lombaires au banc",pat:"lo",eq:3,ch:"lest"},
  {id:"ram",nom:"Rameur, intervalles",pat:"ca",eq:0,ch:"dist"},
  {id:"hip",nom:"Étirement des fléchisseurs de hanche",pat:"mo",eq:3,ch:"temps"},
  {id:"tho",nom:"Étirement du chat",pat:"mo",eq:3,ch:"aucune"},
  {id:"dci",nom:"Développé incliné barre",pat:"ph",eq:1,ch:"kg"},
  {id:"dhi",nom:"Développé incliné haltères",pat:"ph",eq:2,ch:"kg"},
  {id:"ecart",nom:"Écarté à la poulie",pat:"ph",eq:0,ch:"kg"},
  {id:"arn",nom:"Développé Arnold",pat:"pv",eq:2,ch:"kg"},
  {id:"trs",nom:"Tractions supination",pat:"tv",eq:3,ch:"lest"},
  {id:"tpn",nom:"Tirage poulie prise serrée",pat:"tv",eq:0,ch:"kg"},
  {id:"tps",nom:"Tirage horizontal à la poulie",pat:"th",eq:0,ch:"kg"},
  {id:"rw2",nom:"Rowing deux haltères",pat:"th",eq:2,ch:"kg"},
  {id:"fb",nom:"Fentes barre",pat:"eg",eq:1,ch:"kg"},
  {id:"lext",nom:"Leg extension",pat:"eg",eq:0,ch:"kg"},
  {id:"sqf",nom:"Squat avant",pat:"eg",eq:1,ch:"kg"},
  {id:"lc",nom:"Leg curl allongé",pat:"fh",eq:0,ch:"kg"},
  {id:"gm",nom:"Good morning",pat:"fh",eq:1,ch:"kg"},
  {id:"sdt",nom:"Soulevé de terre",pat:"fh",eq:1,ch:"kg"},
  {id:"elf",nom:"Élévations frontales",pat:"ep",eq:2,ch:"kg"},
  {id:"rmf",nom:"Oiseau à la machine",pat:"re",eq:0,ch:"kg"},
  {id:"rot",nom:"Rotation externe haltère",pat:"re",eq:2,ch:"kg"},
  {id:"curlb",nom:"Curl barre",pat:"fc",eq:1,ch:"kg"},
  {id:"mart",nom:"Curl marteau",pat:"fc",eq:2,ch:"kg"},
  {id:"pup",nom:"Curl au pupitre",pat:"fc",eq:1,ch:"kg"},
  {id:"dipt",nom:"Dips prise serrée",pat:"ec",eq:3,ch:"lest"},
  {id:"nuq",nom:"Extension nuque à la corde",pat:"ec",eq:0,ch:"kg"},
  {id:"bdips",nom:"Dips sur banc",pat:"ec",eq:3,ch:"aucune"},
  {id:"plat",nom:"Gainage latéral",pat:"ae",eq:3,ch:"temps"},
  {id:"crp",nom:"Crunch à la poulie",pat:"ft",eq:0,ch:"kg"},
  {id:"cr",nom:"Crunch au sol",pat:"ft",eq:3,ch:"aucune"},
  {id:"sup",nom:"Superman",pat:"lo",eq:3,ch:"temps"},
  {id:"corde",nom:"Corde à sauter",pat:"ca",eq:3,ch:"temps"},
  {id:"enf",nom:"Posture de l'enfant",pat:"mo",eq:3,ch:"temps"},
];
const IDS = new Set(LIB.map((x) => x.id));
const PARID: Record<string, typeof LIB[0]> = Object.fromEntries(LIB.map((x) => [x.id, x]));

const SCHEMAS: Record<string, string> = {
  ph: "poussée horizontale", pv: "poussée verticale", tv: "tirage vertical", th: "tirage horizontal",
  eg: "dominante quadriceps", fh: "dominante ischio-fessiers", ep: "épaule latérale", re: "rotation externe",
  fc: "flexion de coude", ec: "extension de coude", ae: "anti-extension", ft: "flexion du tronc",
  lo: "extension lombaire", ca: "cardio", mo: "mobilité",
};
const OBJ = ["prendre du muscle","gagner en force","m'affiner et perdre du gras","rester en forme"];
const REG = ["pas entraîné depuis 6 mois","entraînement par périodes","1 à 2 fois par semaine","3 fois par semaine ou plus"];
const MAT = ["salle complète","home gym (barre, rack, banc)","haltères seuls","poids du corps"];
const BLESS = ["épaules","bas du dos","genoux","coudes ou poignets"];
const AXES = ["points faibles","souffle et condition physique","mobilité et récupération"];
const SEXE = ["homme","femme","non précisé"];
const CATS: Record<number, string> = { 3: "poids du corps", 2: "haltères", 1: "barre", 0: "machines et poulies" };
const GRP2PAT: Record<string, string[]> = {
  "Pectoraux": ["ph"], "Dos": ["tv", "th"], "Épaules": ["pv", "ep", "re"], "Bras": ["fc", "ec"],
  "Quadriceps": ["eg"], "Fessiers et ischio-jambiers": ["fh"], "Abdominaux et lombaires": ["ae", "ft", "lo"],
};
const patsExclus = (A: any): Set<string> => {
  const s = new Set<string>();
  (A?.exclus || []).forEach((g: string) => (GRP2PAT[g] || []).forEach((p) => s.add(p)));
  return s;
};

const CIBLE: Record<number, [number, number][]> = {
  /* [reprise, régulier] selon le nombre de séances socle : 2, 3 ou 4 */
  2: [[5, 8], [8, 11]], 3: [[6, 10], [11, 14]], 4: [[7, 11], [12, 16]],
};
const SYSTEME = (mat: number, seances: number, reprise: boolean) => { const vol = (CIBLE[seances] || CIBLE[3])[reprise ? 0 : 1]; return `Tu es un préparateur physique qui construit des programmes de musculation en français.

BIBLIOTHÈQUE AUTORISÉE (aucun autre exercice n'existe) :
${LIB.filter((x) => x.eq >= mat).map((x) => `- ${x.id} : ${x.nom} [${SCHEMAS[x.pat]}, ${x.ch}]`).join("\n")}

RÈGLES DE CONSTRUCTION, non négociables :
1. Découpage haut du corps / bas du corps en alternance : séance 1 haut, séance 2 bas, etc.
2. Chaque séance contient 5 à 7 exercices, dont 2 ou 3 principaux (o:1) placés en premier, puis des accessoires (o:0). Vise 18 à 24 séries au total par séance, ce qui représente environ 60 à 70 minutes repos compris.
3. Les exercices PRINCIPAUX sont identiques entre la séance A et la séance B d'un même segment : ce sont eux qui portent la progression sur 8 semaines. Seuls les accessoires diffèrent.
4. Les accessoires des séances A et B d'un même segment travaillent des schémas moteurs DIFFÉRENTS, pour couvrir tous les axes sur la semaine.
5. Volume hebdomadaire par grand groupe travaillé : ${vol[0]} à ${vol[1]} séries. Cette fourchette tient compte du nombre de séances déclarées : ne cherche pas à la dépasser en allongeant les séances, ni à rester en dessous en les raccourcissant.
6. Séries entre 2 et 5. Répétitions entre 4 et 15 pour kg/lest/aucune, 20 à 60 pour temps (secondes), 200 à 500 pour dist (mètres).
7. Repos : "3 min" ou "2 min 30" sur les principaux lourds, "90 s" ou "60 s" sur les accessoires, "45 s" sur l'isolation.
8. La séance bonus dure 30 minutes, 2 à 3 exercices, et suit l'axe demandé.
9. Aucune charge en kilos : le cycle fonctionne au RPE, géré ailleurs.

RESPECT DU PROFIL :
- Blessure épaules : évite la poussée verticale lourde et les dips ; privilégie les haltères, ajoute de la rotation externe.
- Blessure bas du dos : évite rw, rm, sdt, gm ; privilégie rh, ht, pr, tps.
- Blessure genoux : réduis la dominante quadriceps, privilégie la dominante hanche et l'unilatéral léger.
- Blessure coudes ou poignets : évite les dips et les poussées barre lourdes.
- Respecte les préférences de matériel par groupe. Si l'une bride nettement l'objectif, tu peux passer outre en l'expliquant dans un choix.
- Priorités déclarées : ajoute 2 à 4 séries hebdomadaires dessus, retire ailleurs.
- GROUPES EXCLUS : aucun exercice du schéma correspondant. Leur volume va aux groupes prioritaires, ou à parts égales sinon. Maximum 20 séries par groupe. Explique-le dans un choix.
- Sport extérieur : réduis le volume des jambes s'il les sollicite, du dos s'il s'agit d'escalade.

LA SYNTHÈSE :
Tu n'as AUCUN historique d'entraînement, seulement les déclarations de la personne. N'invente jamais de chiffre sur son passé : ni séries actuelles, ni durée de plateau, ni progrès constatés.
"choix" contient TROIS décisions structurantes prises pour CE profil, chacune avec sa raison, en citant ses réponses. Deuxième personne, présent, sans jargon. Chaque texte fait 2 à 3 phrases maximum.

Ta réponse commence par une accolade ouvrante et se termine par une accolade fermante. Aucune phrase avant ni après, aucune balise de code.
Clés : t=titre, i=intro, c=choix, x=texte, f=focus, ex=exercices, id, s=séries, r=répétitions, p=repos, o=rôle.

{"plan":{"t":"...","i":"...","c":[{"t":"...","x":"..."},{"t":"...","x":"..."},{"t":"...","x":"..."}]},
"seances":[{"t":"Haut du corps A","f":"...","ex":[{"id":"dc","s":4,"r":6,"p":"2 min 30","o":1}]}],
"bonus":{"t":"...","f":"...","ex":[{"id":"cu","s":3,"r":12,"p":"60 s","o":0}]}}`; };

/* ---------- cache : un profil identique ne se régénère jamais deux fois ---------- */
const SB_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SB_SRV = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const cacheDispo = () => !!(SB_URL && SB_SRV);
const enTetes = { apikey: SB_SRV, Authorization: `Bearer ${SB_SRV}`, "Content-Type": "application/json" };

/* ---------- identité et quotas : seul un vrai compte (même anonyme) peut générer ---------- */
const QUOTA_USER = Number(Deno.env.get("QUOTA_PAR_UTILISATEUR") ?? 5);
const QUOTA_TOTAL = Number(Deno.env.get("QUOTA_TOTAL") ?? 150);

/* La passerelle accepte aussi la clé publique : on vérifie ici que le jeton
   appartient bien à un utilisateur Supabase Auth.                          */
async function utilisateur(req: Request): Promise<string | null> {
  const auth = req.headers.get("Authorization") ?? "";
  if (!auth.startsWith("Bearer ") || !SB_URL || !SB_SRV) return null;
  try {
    const r = await fetch(`${SB_URL}/auth/v1/user`, { headers: { apikey: SB_SRV, Authorization: auth } });
    if (!r.ok) { await r.text(); return null; }
    const u = await r.json();
    return typeof u?.id === "string" ? u.id : null;
  } catch { return null; }
}
async function consommerQuota(uid: string): Promise<boolean> {
  const r = await fetch(`${SB_URL}/rest/v1/rpc/consommer_quota`, {
    method: "POST", headers: enTetes,
    body: JSON.stringify({ p_user: uid, p_max_user: QUOTA_USER, p_max_total: QUOTA_TOTAL }),
  });
  if (!r.ok) throw new Error("quota illisible (" + r.status + ")");
  return (await r.json()) === true;
}

async function empreinte(texte: string) {
  const h = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(texte));
  return [...new Uint8Array(h)].map((b) => b.toString(16).padStart(2, "0")).join("").slice(0, 40);
}

/* Seules les réponses qui changent réellement le programme entrent dans la signature. */
async function signature(A: any) {
  const prefs = Object.keys(A.prefs || {}).sort()
    .map((k) => k + ":" + [...(A.prefs[k] || [])].sort().join(","))
    .filter((s) => !s.endsWith(":")).join("|");
  const brut = JSON.stringify({
    o: A.objectif, r: A.regularite, s: A.socle, a: A.axe, m: A.materiel, x: A.sexe,
    b: [...(A.blessure || [])].sort(), e: [...(A.exclus || [])].sort(),
    p: [...(A.prioNoms || [])].sort(), sp: A.sportNom ?? null, sf: A.sportFreq ?? null,
    ac: A.actuelNom ?? null, prefs,
  });
  return empreinte(brut);
}
async function lireCache(sig: string) {
  if (!cacheDispo()) return null;
  try {
    const r = await fetch(`${SB_URL}/rest/v1/plans_cache?signature=eq.${sig}&select=plan`, { headers: enTetes });
    if (!r.ok) return null;
    const l = await r.json();
    return Array.isArray(l) && l[0]?.plan ? l[0].plan : null;
  } catch { return null; }
}
async function ecrireCache(sig: string, plan: any) {
  if (!cacheDispo()) return;
  try {
    await fetch(`${SB_URL}/rest/v1/plans_cache`, {
      method: "POST",
      headers: { ...enTetes, Prefer: "resolution=merge-duplicates" },
      body: JSON.stringify({ signature: sig, plan }),
    });
  } catch { /* le cache est un confort, jamais un blocage */ }
}

/* Les seules charges que l'app demande (questionnaire, étape « Tes charges actuelles »). */
const CHARGES_CONNUES = new Set(["Développé couché", "Squat", "Soulevé de terre"]);

function profil(A: any) {
  const p: string[] = [];
  p.push(`Objectif : ${OBJ[A.objectif] ?? "?"}.`);
  p.push(`Régularité des 6 derniers mois : ${REG[A.regularite] ?? "?"}.`);
  p.push(`Nombre de séances socle demandées : ${2 + (A.socle ?? 2)}.`);
  p.push(`Axe de la séance bonus : ${AXES[A.axe] ?? "?"}.`);
  p.push(`Matériel : ${MAT[A.materiel] ?? "?"}.`);
  p.push(`Sexe : ${SEXE[A.sexe] ?? "non précisé"}.`);
  if (A.sportNom) p.push(`Sport pratiqué : ${A.sportNom}, ${["une","deux","trois"][A.sportFreq ?? 0]} fois par semaine.`);
  else p.push("Aucun autre sport.");
  const b = (A.blessure ?? []).map((i: number) => BLESS[i]).filter(Boolean);
  p.push(b.length ? `Blessures ou gênes : ${b.join(", ")}.` : "Aucune blessure signalée.");
  if (A.exclus?.length) p.push(`Groupes que la personne NE VEUT PAS travailler : ${A.exclus.join(", ")}. Interdiction absolue de les programmer.`);
  if (A.prefs && Object.keys(A.prefs).length) {
    const l = Object.entries(A.prefs)
      .filter(([, v]: any) => v.length)
      .map(([g, v]: any) => `${g} : ${v.map((c: number) => CATS[c]).join(" ou ")}`);
    if (l.length) p.push(`Préférences de matériel : ${l.join(" ; ")}.`);
  }
  if (A.prioNoms?.length) p.push(`Groupes prioritaires : ${A.prioNoms.join(", ")}.`);
  if (A.actuelNom) p.push(`Entraînement actuel : ${A.actuelNom}.`);
  /* Ces champs n'entrent pas dans la signature du cache : on n'y laisse passer
     que des nombres, pour qu'aucun texte libre n'atteigne le modèle par là.   */
  if (A.charges && typeof A.charges === "object") {
    const c = Object.entries(A.charges)
      .filter(([k, v]) => CHARGES_CONNUES.has(k) && typeof v === "number" && Number.isFinite(v) && v >= 0 && v <= 500);
    if (c.length) p.push(`Charges de référence : ${c.map(([k, v]) => `${k} ${v} kg`).join(", ")}.`);
  }
  const num = (v: unknown, min: number, max: number) => {
    const n = Number(v);
    return Number.isFinite(n) && n >= min && n <= max ? Math.round(n) : null;
  };
  if (A.profil && typeof A.profil === "object") {
    const age = num(A.profil["Âge"], 10, 100), taille = num(A.profil["Taille"], 100, 250), poids = num(A.profil["Poids"], 25, 300);
    const l = [age !== null && `âge ${age} ans`, taille !== null && `taille ${taille} cm`, poids !== null && `poids ${poids} kg`].filter(Boolean);
    if (l.length) p.push(`Profil : ${l.join(", ")}.`);
  }
  return p.join("\n");
}

/* Garde-fou : tout ce qui sort de la bibliothèque ou des bornes est corrigé ici. */
function valider(plan: any, A: any): any {
  const mat = A.materiel ?? 0;
  const nb = 2 + (A.socle ?? 2);
  const refus: string[] = [];
  const exclus = patsExclus(A);
  const nettoieEx = (e: any) => {
    if (!e || !IDS.has(e.id)) { refus.push(sansBalise(e?.id).slice(0, 20) + " : inconnu"); return null; }
    e = { ...e, series: e.s ?? e.series, reps: e.r ?? e.reps, repos: e.p ?? e.repos, role: e.o ?? e.role };
    const x = PARID[e.id];
    if (x.eq < mat) { refus.push(e.id + " : matériel indisponible"); return null; }
    if (exclus.has(x.pat)) { refus.push(e.id + " : groupe exclu"); return null; }
    const max = x.ch === "temps" ? 90 : x.ch === "dist" ? 800 : 30;
    const min = x.ch === "temps" ? 15 : x.ch === "dist" ? 100 : 3;
    return {
      id: e.id,
      series: Math.min(6, Math.max(1, Math.round(+e.series || 3))),
      reps: Math.min(max, Math.max(min, Math.round(+e.reps || (x.ch === "temps" ? 45 : x.ch === "dist" ? 250 : 10)))),
      repos: typeof e.repos === "string" && e.repos.length < 12 ? sansBalise(e.repos) : "90 s",
      role: e.role ? 1 : 0,
    };
  };
  const nettoieSeance = (s: any) => {
    const x = (s?.ex || s?.exercices || []).map(nettoieEx).filter(Boolean).slice(0, 8);
    if (x.length < 2) return null;      // une séance d'un seul exercice n'a pas de sens
    return { titre: coupe(s.t || s.titre || "Séance", 40),
             focus: coupe(s.f || s.focus, 120), exercices: x };
  };
  /* Tolérance : mieux vaut un cycle légèrement incomplet que le repli sur les règles.
     On n'abandonne que s'il reste moins de deux séances exploitables.            */
  const seances = (plan?.seances || []).map(nettoieSeance).filter(Boolean).slice(0, nb);
  if (seances.length < 2)
    return { echec: `${seances.length} séance(s) exploitable(s), il en faut au moins 2`,
             refus, recu: (plan?.seances || []).length };

  const bonus = nettoieSeance(plan?.bonus);   // facultative : l'app s'en passe

  const DEF = [
    { titre: "Des mouvements principaux figés", texte: "Les mêmes exercices reviennent de la première à la dernière semaine. Sans cette stabilité, impossible de mesurer ta progression." },
    { titre: "C'est l'effort qui monte", texte: "RPE 7 sur les semaines 1 et 2, RPE 8 jusqu'à la cinquième, RPE 9 ensuite. Le nombre de séries, lui, ne bouge pas." },
    { titre: "Tu choisis tes charges", texte: "Aucun kilo ne t'est imposé : tu vises un niveau d'effort et tu ajustes toi-même la charge qui t'y amène." },
  ];
  const c = (plan?.plan?.c || plan?.plan?.choix || []).slice(0, 3).map((x: any) => ({
    titre: coupe(x?.t || x?.titre, 90),
    texte: coupe(x?.x || x?.texte, 420),
  })).filter((x: any) => x.titre && x.texte);
  let k = 0;
  while (c.length < 3) c.push(DEF[k++]);

  /* Contrôle de volume : on compte ce que le programme produit réellement. */
  const G: Record<string, string> = { ph: "Pectoraux", tv: "Dos", th: "Dos", tra: "Dos", lo: "Dos",
    pv: "Épaules", ep: "Épaules", re: "Épaules", fc: "Bras", ec: "Bras", avb: "Bras",
    eg: "Quadriceps", fh: "Fessiers et ischio-jambiers", add: "Quadriceps",
    ft: "Abdominaux et lombaires", ae: "Abdominaux et lombaires", mol: "Mollets" };
  const vol: Record<string, number> = {};
  seances.forEach((s: any) => s.exercices.forEach((e: any) => {
    const g = G[PARID[e.id].pat]; if (g) vol[g] = (vol[g] || 0) + e.series;
  }));
  const cible = (CIBLE[nb] || CIBLE[3])[(A.regularite ?? 3) <= 1 ? 0 : 1];
  const faibles = Object.keys(vol).filter((g) => vol[g] < cible[0]);

  return { ok: true,
    plan: {
      titre: coupe(plan?.plan?.t || plan?.plan?.titre || "Ton plan", 40),
      intro: coupe(plan?.plan?.i || plan?.plan?.intro, 340),
      choix: c,
    },
    seances, bonus: bonus ?? undefined,
    notes: { demandees: nb, retenues: seances.length, bonus: !!bonus, refus: refus.slice(0, 12),
             exercices: seances.reduce((n: number, s: any) => n + s.exercices.length, 0),
             volume: vol, cible, faibles },
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return rep({ erreur: "Méthode non autorisée." }, 405);

  const uid = await utilisateur(req);
  if (!uid) return rep({ erreur: "Connexion requise." }, 401);

  const cle = Deno.env.get("ANTHROPIC_API_KEY");
  if (!cle) return rep({ erreur: "Le secret ANTHROPIC_API_KEY n'est pas défini dans le projet Supabase." }, 500);

  let A: any;
  try { A = await req.json(); } catch { return rep({ erreur: "Requête illisible." }, 400); }

  /* Un profil déjà rencontré est renvoyé instantanément, sans appel payant. */
  const t0 = Date.now();
  const sig = await signature(A);
  let cacheOK = false;
  if (cacheDispo()) {
    try {
      const test = await fetch(`${SB_URL}/rest/v1/plans_cache?select=signature&limit=1`, { headers: enTetes });
      cacheOK = test.ok;
      if (!test.ok) await test.text();
    } catch { cacheOK = false; }
  }
  /* Une régénération forcée ne touche jamais le cache partagé : elle est rangée
     sous une signature propre à l'utilisateur, où ses tentatives suivantes
     (cacheSeul) viennent la chercher.                                         */
  const sigCache = A.forcer ? "u" + (await empreinte(sig + ":" + uid)).slice(1) : sig;
  if (cacheOK && (!A.forcer || A.cacheSeul)) {
    const cache = await lireCache(sigCache);
    if (cache) return rep({ plan: cache, cache: true, cache_dispo: true, ms: Date.now() - t0, signature: sigCache });
  }
  /* Deuxième tentative du navigateur : on ne relance pas une génération payante,
     on répond aussitôt pour qu'il retente une fois le cache rempli.             */
  if (A.cacheSeul) return rep({ erreur: "Pas encore en cache.", diagnostic: { cache_dispo: cacheOK, signature: sig } }, 404);

  /* Au-delà du cache, chaque génération coûte : elle est décomptée du quota. */
  try {
    if (!(await consommerQuota(uid)))
      return rep({ erreur: `Limite de ${QUOTA_USER} générations par jour atteinte, réessaie demain.` }, 429);
  } catch (e) {
    return rep({ erreur: "Génération momentanément indisponible : " + (e as Error).message }, 503);
  }

  try {
    const MODELE = "claude-haiku-4-5-20251001";
    /* La réflexion interne est active par défaut sur ce modèle : elle consommait
       plus de 6000 jetons de sortie et tronquait le JSON. On la désactive, ce qui
       autorise du même coup l'amorçage de la réponse, interdit quand elle tourne. */
    const appel = (amorce: boolean, reflexion: boolean, plafond: number) => {
      const messages: any[] = [{ role: "user", content: "Construis le cycle pour ce profil :\n\n" + profil(A) }];
      if (amorce) messages.push({ role: "assistant", content: "{" });
      const corps: any = {
        model: MODELE,
        max_tokens: plafond,
        system: SYSTEME(A.materiel ?? 0, 2 + (A.socle ?? 2), (A.regularite ?? 3) <= 1),
        messages,
      };
      if (!reflexion) corps.thinking = { type: "disabled" };
      const ac = new AbortController();
      setTimeout(() => ac.abort(), 55000);    // 55 s par tentative
      return fetch("https://api.anthropic.com/v1/messages", {
        method: "POST", signal: ac.signal,
        headers: { "content-type": "application/json", "x-api-key": cle, "anthropic-version": "2023-06-01" },
        body: JSON.stringify(corps),
      });
    };

    /* Cascade : on ne bascule sur la réflexion, lente et coûteuse, qu'en dernier
       recours. Chaque échec est mémorisé pour pouvoir être affiché.              */
    const plan_b: Array<[string, boolean, boolean, number]> = [
      ["réflexion coupée + amorçage", true,  false, 5000],
      ["réflexion coupée, sans amorçage", false, false, 5000],
      ["réflexion laissée active", false, true, 12000],
    ];
    let r: Response | null = null, amorce = false;
    const journal: string[] = [];
    for (const [nom, am, refl, plaf] of plan_b) {
      const t1 = Date.now();
      try {
        const essai = await appel(am, refl, plaf);
        if (essai.ok) { r = essai; amorce = am; journal.push(`${nom} : ok en ${Date.now() - t1} ms`); break; }
        journal.push(`${nom} : ${essai.status} — ${(await essai.text()).slice(0, 160)}`);
      } catch (e) {
        journal.push(`${nom} : interrompu après ${Date.now() - t1} ms (${(e as Error).name})`);
      }
    }
    if (!r) return rep({ erreur: "Anthropic n'a pas répondu.", diagnostic: { modele: MODELE, tentatives: journal } }, 502);
    const d = await r.json();
    const blocs = Array.isArray(d.content) ? d.content : [];
    let txt = blocs.filter((b: any) => b && b.type === "text").map((b: any) => b.text || "").join("").trim();
    txt = txt.replace(/^```(?:json)?/i, "").replace(/```$/, "").trim();
    if (amorce && txt && !txt.startsWith("{")) txt = "{" + txt;   // l'amorçage n'est pas renvoyé par l'API

    const i = txt.indexOf("{"), j = txt.lastIndexOf("}");
    if (i < 0 || j <= i) {
      return rep({ erreur: "Aucun JSON dans la réponse du modèle.", diagnostic: {
        modele: d.model ?? null, amorcage: amorce, reflexion: (d.usage?.output_tokens_details?.thinking_tokens ?? 0), stop_reason: d.stop_reason ?? null, blocs: blocs.map((b: any) => b?.type),
        longueur: txt.length, debut: txt.slice(0, 400), fin: txt.slice(-200), usage: d.usage ?? null } }, 502);
    }
    let obj: any;
    try { obj = JSON.parse(txt.slice(i, j + 1)); }
    catch (err) {
      return rep({ erreur: "JSON invalide, réponse probablement tronquée.", diagnostic: {
        stop_reason: d.stop_reason ?? null, detail: String(err).slice(0, 200),
        reflexion: (d.usage?.output_tokens_details?.thinking_tokens ?? 0),
        longueur: txt.length, fin: txt.slice(-300), usage: d.usage ?? null } }, 502);
    }
    const v = valider(obj, A);
    void journal;
    if (!v?.ok) {
      return rep({ erreur: "Programme refusé par la validation.", diagnostic: {
        raison: v?.echec ?? "inconnue", exercices_refuses: (v?.refus ?? []).slice(0, 12),
        cles_recues: Object.keys(obj || {}), stop_reason: d.stop_reason ?? null } }, 502);
    }
    const { ok: _ok, ...plan } = v;
    await ecrireCache(sigCache, plan);
    return rep({ plan, usage: d.usage ?? null, cache: false, cache_dispo: cacheOK,
                 ms: Date.now() - t0, tentatives: journal, signature: sig });
  } catch (e) {
    return rep({ erreur: "Génération impossible : " + (e as Error).message }, 500);
  }
});
