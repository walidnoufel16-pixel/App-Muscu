/* Compte de démonstration pour les captures de contenu : un pratiquant fictif, « Alex », 3 séances
   par semaine (poussée, tirage, jambes) depuis 6 semaines, en double progression (8 → 12
   répétitions, puis le palier suivant). Aucune donnée réelle.
   Usage : node outils/reseaux/demo.mjs 2026-11-09 > /tmp/pack/etat-demo.json
   La date est « aujourd'hui » dans les captures (prends un lundi : le bilan de la semaine s'affiche,
   et la semaine précédente est complète). Injection : localStorage « palier.state.v1 » = ce JSON,
   « palier.pseudo.v1 » = "Alex", « repere.visite » = "1". */
const auj = process.argv[2] || new Date().toISOString().slice(0, 10);
const jour = (d, n) => { const x = new Date(d + "T12:00"); x.setDate(x.getDate() + n); return x.toISOString().slice(0, 10); };
const lundi = (() => { const x = new Date(auj + "T12:00"); x.setDate(x.getDate() - ((x.getDay() + 6) % 7)); return x.toISOString().slice(0, 10); })();

/* [id, séries, répétitions visées r, charge de départ, palier, repos] : fourchette r à r+2, comme l'app */
const SEANCES = [
  { nom: "Pecs · Épaules · Triceps", j: 0, min: 55, ex: [["dc", 3, 10, 57.5, 2.5, "2 min"], ["dhi", 3, 10, 18, 2, "90 s"], ["dm", 3, 10, 32.5, 2.5, "2 min"], ["el", 3, 13, 8, 1, "60 s"], ["tricor", 3, 10, 20, 2.5, "60 s"]] },
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

const etat = {
  A: { acc: [0, 1], axe: 0, trx: false, prio: [0, 1], sexe: 0, barre: true, socle: 0, sport: [], actuel: 3, langue: "fr", materiel: 0, objHebdo: 3, objectif: 0, regularite: 2, sportFreq: {}, protOff: true },
  ts: Date.parse(auj + "T08:00"), wk: 0, day: 0, FINI: true,
  LOG: {}, HIST, PLAN: null, SWAP: {}, SWAPP: {}, AGENDA: [], CARDIO: [], COURSE: null, SORTIES: [], SEANCES_CARDIO: [],
  SEANCES: SEANCES.map((S) => ({ nom: S.nom, obj: 0, ex: S.ex.map(([id, s, r, , , p]) => ({ id, s, r, p })) })),
};
process.stdout.write(JSON.stringify(etat));
