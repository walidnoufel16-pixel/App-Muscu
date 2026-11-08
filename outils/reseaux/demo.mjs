/* Compte de démonstration pour les captures de contenu : un pratiquant fictif, « Alex », 3 séances
   par semaine (poussée, tirage, jambes) depuis 6 semaines, en double progression (8 → 12
   répétitions, puis le palier suivant). Aucune donnée réelle.
   Usage : node outils/reseaux/demo.mjs 2026-11-09 > /tmp/pack/etat-demo.json
   La date est « aujourd'hui » dans les captures (prends un lundi : le bilan de la semaine s'affiche,
   et la semaine précédente est complète). Injection : localStorage « palier.state.v1 » = ce JSON,
   « palier.pseudo.v1 » = "Alex", « repere.visite » = "1".
   Aussi rempli : Repas (questionnaire, semaine, budget), protéines notées sur 2 semaines, deux tests
   street, un plan 10 km en 4e semaine avec ses sorties (relevés dans l'app, voir plus bas). */
const auj = process.argv[2] || new Date().toISOString().slice(0, 10);
const jour = (d, n) => { const x = new Date(d + "T12:00"); x.setDate(x.getDate() + n); return x.toISOString().slice(0, 10); };
const lundi = (() => { const x = new Date(auj + "T12:00"); x.setDate(x.getDate() - ((x.getDay() + 6) % 7)); return x.toISOString().slice(0, 10); })();

/* [id, séries, répétitions visées r, charge de départ, palier, repos] : fourchette r à r+2, comme l'app */
const SEANCES = [
  { nom: "Pecs · Épaules · Triceps", j: 0, min: 55, ex: [["dc", 3, 10, 37.5, 2.5, "2 min"], ["dhi", 3, 10, 18, 2, "90 s"], ["dm", 3, 10, 32.5, 2.5, "2 min"], ["el", 3, 13, 8, 1, "60 s"], ["tricor", 3, 10, 20, 2.5, "60 s"]] },
  { nom: "Dos · Biceps", j: 2, min: 50, ex: [["tp", 3, 10, 50, 2.5, "90 s"], ["rw", 3, 10, 45, 2.5, "2 min"], ["fp", 3, 13, 15, 2.5, "60 s"], ["curlb", 3, 10, 22.5, 2.5, "90 s"]] },
  { nom: "Jambes", j: 4, min: 60, ex: [["sq", 3, 8, 75, 2.5, "3 min"], ["rm", 3, 10, 65, 2.5, "2 min"], ["lext", 3, 10, 35, 2.5, "60 s"], ["lc", 3, 10, 27.5, 2.5, "60 s"], ["mol", 3, 13, 55, 5, "60 s"]] },
];

const r1 = (v, r) => Math.round(v * (1 + r / 30) * 10) / 10;
const HIST = [];
const etatEx = {}; // id → { v, r }
for (let sem = 6; sem >= 1; sem--) {
  for (let i = 0; i < SEANCES.length; i++) {
    const S = SEANCES[i], d = jour(lundi, -7 * sem + S.j);
    const ex = {}, det = [];
    let ser = 0, vol = 0;
    for (const [id, n, rmin, v0, pal] of S.ex) {
      const rmax = rmin + 2;
      const e = (etatEx[id] ??= { v: v0, r: rmin });
      /* les séries : la dernière parfois une répétition de moins, sauf la semaine passée (toutes au max, pour la hausse) */
      const s = Array.from({ length: n }, (_, k) => [e.v, Math.max(rmin, e.r - (sem > 1 && k === n - 1 && e.r > rmin && e.r < rmax ? 1 : 0))]);
      if (sem === 1) s.forEach((x) => (x[1] = rmax));
      const reps = Math.min(...s.map((x) => x[1]));
      ex[id] = [r1(e.v, reps), Math.round(s.reduce((a, [v, r]) => a + v * r, 0)), e.v, reps, n];
      det.push({ id, s });
      ser += n; vol += ex[id][1];
      /* double progression : +1 répétition par séance, au max on ajoute le palier et on repart au min */
      if (s.every((x) => x[1] >= rmax)) { e.v = Math.round((e.v + pal) * 10) / 10; e.r = rmin; } else e.r = Math.min(rmax, e.r + 1);
    }
    HIST.push({ d, s: "L|" + i, nom: S.nom, ex, det, min: S.min, ser, vol });
  }
}

/* Repas : les réponses telles que l'app les enregistre après le questionnaire (relevées dans le
   navigateur) : omnivore, rien d'exclu, 30 min max en semaine, tout le matériel, 100 € de courses.
   La semaine reste celle par défaut (5 jours, déjeuner et dîner) : environ 87 € en caisse, le budget
   est tenu (avec 50 €, l'écran l'affichait en rouge, dépassé). */
const REPAS = { regime: 0, allergies: [], exclus: [], temps: 1, mat: ["plaques", "four", "micro", "mixeur"], pers: 1, stock: [], perso: [], budget: 100, fait: true };
const SEMAINE = { jours: 5, creneaux: ["dejeuner", "diner"], graine: 1, choix: {}, coches: [] };

/* Protéines notées (g par jour) : objectif 150 g (76 kg × 2 g/kg, objectif muscle) ; la semaine passée
   tenue 5 jours sur 7 (≥ 90 %), et le matin du jour, petit-déjeuner noté. */
const PROT = [128, 141, 150, 118, 155, 132, 104, 152, 138, 160, 121, 147, 135, 98];
const prot = Object.fromEntries(PROT.map((g, i) => [jour(lundi, -14 + i), g]));
if (auj >= lundi) prot[auj] = 42;

/* Street workout : deux tests d'entrée à 4 semaines d'écart (niveau conseillé : Force). */
const testsStreet = [
  { d: jour(lundi, -49), tr: 3, po: 22, di: 6, sq: 32 },
  { d: jour(lundi, -21), tr: 6, po: 28, di: 10, sq: 40 },
];

/* Course : plan 10 km créé dans l'app il y a 3 semaines (chrono de référence 52:40 sur 10 km,
   3 sorties par semaine, sans renfo), course le dimanche de la 6e semaine qui suit. Les sorties
   des 3 premières semaines sont faites (« semaine|séance »), en endurance : elles ne changent pas les allures. */
const COURSE = { obj: "10k", date: jour(lundi, 41), debut: jour(lundi, -21), jours: 3, renfo: 0, ref: { km: 10, sec: 3160 }, pauses: [], ajust: {}, cree: jour(lundi, -21) };
/* [km, secondes, ressenti] par séance : footing + lignes droites, footing, sortie longue */
const SORTIES = [
  [[5, 1990, 4], [3.8, 1500, 4], [6, 2390, 5]],
  [[5.2, 2060, 4], [4, 1580, 4], [6.5, 2580, 5]],
  [[4.5, 1780, 4], [3.6, 1420, 3], [5, 1980, 4]],
].flatMap((sem, k) => sem.map(([km, sec, rpe], j) => ({ d: jour(lundi, -21 + 7 * k + [1, 3, 6][j]), km, sec, rpe, s: `${k}|${j}` })));

const etat = {
  A: {
    acc: [0, 1], axe: 0, trx: false, prio: [0, 1], sexe: 0, barre: true, socle: 0, sport: [], actuel: 3, langue: "fr", materiel: 0, objHebdo: 3, objectif: 0, regularite: 2, sportFreq: {}, protOff: true,
    profil: { "Âge": 29, Taille: 178, Poids: 76 }, repas: REPAS, semaine: SEMAINE, prot, testsStreet,
  },
  ts: Date.parse(auj + "T08:00"), wk: 0, day: 0, FINI: true,
  LOG: {}, HIST, PLAN: null, SWAP: {}, SWAPP: {}, AGENDA: [], CARDIO: [], COURSE, SORTIES, SEANCES_CARDIO: [],
  SEANCES: SEANCES.map((S) => ({ nom: S.nom, obj: 0, ex: S.ex.map(([id, s, r, , , p]) => ({ id, s, r, p })) })),
};
process.stdout.write(JSON.stringify(etat));
