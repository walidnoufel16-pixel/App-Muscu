/* Préparation course à pied (10 km, semi-marathon, marathon) et Hyrox. Logique pure.
   - Allures : méthode VDOT de Jack Daniels, à partir d'un chrono récent.
   - Plan : fondation → développement → spécifique → affûtage, 80 % en endurance
     facile, sortie longue +10 % au plus par semaine, une semaine allégée sur quatre.
   - Séances numérotées dans la semaine (comme le programme de musculation), pas datées.
   - Adaptation : une sortie « trop dure » ou une douleur allège la semaine suivante ;
     une pause (maladie, blessure) allège la reprise. La date de course ne bouge pas.
   - Hyrox : 8 × (1 km de course + 1 atelier). Même plan de course, mais la séance de qualité
     principale devient « Course + ateliers », des tours qui montent jusqu'à la simulation. */
import { tr } from "@/lib/i18n";
import { dateDe, decaler, jourDe, lundiDe } from "./historique";
import { dureeTotale, type Phase } from "./cardio";
import type { ExLibre, HistoCardio } from "./types";

export type ObjectifCourse = "10k" | "semi" | "marathon" | "hyrox";
export type PlanCourse = {
  obj: ObjectifCourse;
  date: string; // jour de la course, AAAA-MM-JJ
  debut: string; // lundi de la première semaine du plan
  jours: number; // sorties par semaine (3 à 5)
  renfo: number; // séances de renforcement du coureur par semaine (0 à 2)
  ref: { km: number; sec: number } | null; // chrono de référence (null : je débute)
  pauses: { de: string; a?: string }[];
  ajust: Record<number, number>; // semaine → coefficient de volume (adaptation)
  cree: string;
  cat?: "h" | "f"; // Hyrox : catégorie Open hommes ou femmes (charges des ateliers)
  salle?: boolean; // Hyrox : accès aux machines (SkiErg, traîneau, rameur), sinon les remplaçants
  marche?: boolean; // ne court pas encore 30 min d'affilée : course-marche les premières semaines
  jsem?: number[]; // jours des sorties dans la semaine (0 = lundi … 6 = dimanche), posées dans l'agenda
};
/** Une sortie faite : `s` = « semaine|séance » si elle correspond à une séance du plan. */
export type Sortie = { d: string; km: number; sec: number; rpe: number; douleur?: boolean; s?: string; course?: boolean };

export const DISTANCES: Record<ObjectifCourse, { nom: string; km: number; court: string }> = {
  "10k": { nom: tr("10 km"), km: 10, court: tr("10 km") },
  semi: { nom: tr("Semi-marathon"), km: 21.0975, court: "semi" },
  marathon: { nom: tr("Marathon"), km: 42.195, court: "marathon" },
  hyrox: { nom: "Hyrox", km: 8, court: "Hyrox" },
};

/* ---------------- allures (Daniels) ---------------- */
const vo2 = (v: number) => -4.6 + 0.182258 * v + 0.000104 * v * v; // v en m/min
const fracMax = (t: number) => 0.8 + 0.1894393 * Math.exp(-0.012778 * t) + 0.2989558 * Math.exp(-0.1932605 * t); // t en min
/** VDOT d'une performance (distance en km, temps en secondes). */
export function vdot(km: number, sec: number) {
  const t = sec / 60, v = (km * 1000) / t;
  return vo2(v) / fracMax(t);
}
/** Vitesse (m/min) qui correspond à une consommation d'oxygène donnée. */
const vitesse = (o2: number) => (-0.182258 + Math.sqrt(0.182258 ** 2 + 4 * 0.000104 * (o2 + 4.6))) / (2 * 0.000104);
/** Allure (s/km) à un pourcentage du VDOT. */
export const allurePct = (V: number, pct: number) => 60000 / vitesse(V * pct);
/** Temps prévu sur une distance pour un VDOT donné (recherche par dichotomie). */
export function tempsPrevu(V: number, km: number) {
  let a = km * 120, b = km * 1200; // entre 2 et 20 min/km
  for (let i = 0; i < 60; i++) { const m = (a + b) / 2; if (vdot(km, m) > V) a = m; else b = m; }
  return Math.round((a + b) / 2);
}
/** Prédiction de Riegel : temps sur une autre distance. */
export const riegel = (km1: number, sec1: number, km2: number) => Math.round(sec1 * Math.pow(km2 / km1, 1.06));

export type Allures = { facile: number; facileMin: number; facileMax: number; marathon: number; semi: number; dix: number; seuil: number; vma: number };
/** Allures d'entraînement en secondes par kilomètre. */
export function allures(V: number): Allures {
  return {
    facile: Math.round(allurePct(V, 0.68)),
    facileMin: Math.round(allurePct(V, 0.72)), // plage d'endurance : du plus vif…
    facileMax: Math.round(allurePct(V, 0.62)), // …au plus lent
    marathon: Math.round(tempsPrevu(V, 42.195) / 42.195),
    semi: Math.round(tempsPrevu(V, 21.0975) / 21.0975),
    dix: Math.round(tempsPrevu(V, 10) / 10),
    seuil: Math.round(allurePct(V, 0.88)),
    vma: Math.round(allurePct(V, 0.975)),
  };
}
export const VDOT_DEBUTANT = 30; // environ 30 min au 5 km
export const vdotDe = (p: Pick<PlanCourse, "ref">) => (p.ref ? Math.max(20, Math.min(80, vdot(p.ref.km, p.ref.sec))) : VDOT_DEBUTANT);
export const allureTxt = (s: number) => `${Math.floor(s / 60)}:${String(Math.round(s % 60)).padStart(2, "0")} /km`;
/** Plage d'endurance : « 5:35 – 6:10 » (sans l'unité). */
export const plageFacile = (A: Pick<Allures, "facileMin" | "facileMax">) => `${allureTxt(A.facileMin).replace(" /km", "")} – ${allureTxt(A.facileMax).replace(" /km", "")}`;
export const chronoTxt = (s: number) => {
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), x = Math.round(s % 60);
  return h ? `${h} h ${String(m).padStart(2, "0")}` : `${m} min ${String(x).padStart(2, "0")}`;
};

/* ---------------- Hyrox ---------------- */
/** Les 8 ateliers d'un Hyrox, dans l'ordre. `sec` : temps d'un débutant à la dose de course ;
    `charge` : Open hommes / Open femmes ; `sans` : à faire sans la machine (pas de salle). */
export type Atelier = { k: string; nom: string; dose: number; unite: "m" | "reps"; sec: number; charge?: [string, string]; sans?: string; conseil: string };
export const ATELIERS: Atelier[] = [
  { k: "ski", nom: "SkiErg", dose: 1000, unite: "m", sec: 300, sans: tr("Tirage à l'élastique bras tendus, ou burpees"), conseil: tr("Tire avec tout le corps : bras, puis buste et genoux qui plient. Rythme régulier.") },
  { k: "push", nom: tr("Poussée de traîneau"), dose: 50, unite: "m", sec: 240, charge: ["152 kg", "102 kg"], sans: tr("Fentes marchées, ou pousser contre un mur par blocs de 30 s"), conseil: tr("Bras tendus, buste penché, petits pas rapides : ce sont les jambes qui poussent.") },
  { k: "pull", nom: tr("Tirage de traîneau"), dose: 50, unite: "m", sec: 300, charge: ["103 kg", "78 kg"], sans: tr("Rowing haltère ou élastique, 3 × 12 de chaque côté"), conseil: tr("Main sur main, dos droit, recule d'un pas quand la corde est ramenée.") },
  { k: "burpee", nom: tr("Burpees sautés"), dose: 80, unite: "m", sec: 360, conseil: tr("Des sauts moyens mais sans t'arrêter vont plus vite que de grands sauts entrecoupés de pauses.") },
  { k: "row", nom: tr("Rameur"), dose: 1000, unite: "m", sec: 300, sans: tr("Squats sautés et jumping jacks en alternance"), conseil: tr("Jambes, puis buste, puis bras ; le retour se fait dans l'ordre inverse, sans te presser.") },
  { k: "farmer", nom: "Farmer's carry", dose: 200, unite: "m", sec: 150, charge: ["2 × 24 kg", "2 × 16 kg"], conseil: tr("Épaules basses, gainage serré, pas rapides. Pose les charges avant de lâcher, pas après.") },
  { k: "lunge", nom: tr("Fentes avec sac"), dose: 100, unite: "m", sec: 300, charge: ["20 kg", "10 kg"], sans: tr("Fentes marchées, avec des haltères ou un sac à dos chargé"), conseil: tr("Genou arrière qui frôle le sol à chaque pas, buste droit, sac sur les épaules.") },
  { k: "wall", nom: "Wall balls", dose: 100, unite: "reps", sec: 420, charge: ["6 kg", "4 kg"], sans: tr("Thrusters avec haltères ou kettlebell, ou squats sautés"), conseil: tr("Squat complet puis lancer dans le même élan. Découpe en séries de 10 à 15 avant d'être cramé.") },
];
/** Allure de course d'un Hyrox : celle du 10 km, plus 30 s/km (les ateliers fatiguent les jambes). */
export const allureHyrox = (A: Allures) => A.dix + 30;
/** Temps des 8 ateliers à la dose de course (celui d'un débutant, moins 15 % pour un coureur entraîné),
    plus les passages d'une zone à l'autre (environ 45 s par atelier). */
export const tempsAteliers = (V: number) => Math.round(ATELIERS.reduce((s, a) => s + a.sec, 0) * (V < 38 ? 1 : 0.85) + 8 * 45);
/** Chrono prévu sur la distance visée (pour un Hyrox : 8 km de course et les ateliers). */
export function chronoPrevu(obj: ObjectifCourse, V: number) {
  if (obj === "hyrox") return Math.round(8 * allureHyrox(allures(V)) + tempsAteliers(V));
  return tempsPrevu(V, DISTANCES[obj].km);
}
/** Allure du jour J selon l'objectif. */
export const allureCourse = (obj: ObjectifCourse, A: Allures) => (obj === "10k" ? A.dix : obj === "semi" ? A.semi : obj === "hyrox" ? allureHyrox(A) : A.marathon);
const doseTxt = (a: Atelier, part: number) => {
  const d = a.unite === "reps" ? Math.round((a.dose * part) / 5) * 5 : Math.round((a.dose * part) / (a.dose >= 1000 ? 250 : 10)) * (a.dose >= 1000 ? 250 : 10);
  return a.unite === "reps" ? `× ${d}` : `${d} m`;
};
/** Consigne d'un atelier : la dose (et la charge de sa catégorie), ou son remplaçant sans machine. */
export function consigneAtelier(a: Atelier, part: number, p: Pick<PlanCourse, "cat" | "salle">) {
  const machine = a.k === "ski" || a.k === "push" || a.k === "pull" || a.k === "row";
  if (machine && p.salle === false && a.sans) return { titre: a.nom, dose: tr("{a} min", { a: Math.max(1, Math.round((a.sec * part) / 60)) }), texte: tr("Sans machine : {a}.", { a: a.sans }) };
  /* traîneaux : charge réduite (70 %) tant que la dose n'est pas celle de la course */
  const ch = a.charge?.[p.cat === "f" ? 1 : 0], traineau = a.k === "push" || a.k === "pull";
  const charge = ch ? ` · ${traineau && part < 1 ? `${Math.round((parseInt(ch) * 0.7) / 5) * 5} kg` : ch}` : "";
  return { titre: a.nom, dose: doseTxt(a, part) + charge, texte: a.conseil };
}

/* ---------------- périodisation ---------------- */
type Profil = { nmin: number; nmax: number; affutage: number; long: [number, number]; pic: [number, number] };
/* long / pic : [débutant, confirmé], en km */
const PROFILS: Record<ObjectifCourse, Profil> = {
  "10k": { nmin: 6, nmax: 12, affutage: 1, long: [6, 8], pic: [12, 15] },
  semi: { nmin: 8, nmax: 16, affutage: 2, long: [8, 10], pic: [18, 21] },
  marathon: { nmin: 10, nmax: 20, affutage: 3, long: [11, 14], pic: [28, 32] },
  hyrox: { nmin: 8, nmax: 12, affutage: 2, long: [6, 8], pic: [10, 12] },
};
export const estDebutant = (p: Pick<PlanCourse, "ref">) => vdotDe(p) < 38;

/** Lundi de départ et nombre de semaines, selon la date de course (plafonné à la durée utile). */
export function calendrier(obj: ObjectifCourse, date: string, auj: string) {
  const P = PROFILS[obj], lundiCourse = lundiDe(date), lundiAuj = lundiDe(auj);
  const dispo = Math.round((dateDe(lundiCourse).getTime() - dateDe(lundiAuj).getTime()) / (7 * 864e5)) + 1;
  const n = Math.max(1, Math.min(P.nmax, dispo));
  return { debut: decaler(lundiCourse, -7 * (n - 1)), semaines: n, court: dispo < P.nmin, dispo };
}

export type TypeSeance = "footing" | "lignes" | "longue" | "seuil" | "vma" | "allure" | "course" | "renfo" | "hyrox";
export type SeanceCourse = {
  type: TypeSeance;
  titre: string;
  detail: string;
  min: number; // durée estimée
  km?: number;
  allure?: number; // allure principale (s/km)
  phases?: Phase[]; // séance guidée au minuteur
  renfo?: 0 | 1; // laquelle des deux séances de renforcement
  tours?: { km: number; atelier: string }[]; // Hyrox : course puis atelier, tour par tour
  test?: boolean; // test 5 km : on note le chrono du test seul, il recale les allures
};
export type PhaseCourse = "fondation" | "developpement" | "specifique" | "affutage" | "course";
export type SemaineCourse = { k: number; lundi: string; phase: PhaseCourse; allegee: boolean; long: number; seances: SeanceCourse[] };
export const NOMS_PHASE: Record<PhaseCourse, string> = {
  fondation: tr("Fondation"), developpement: tr("Développement"), specifique: tr("Allure spécifique"), affutage: tr("Affûtage"), course: tr("Semaine de course"),
};

const arr5 = (m: number) => Math.max(5, Math.round(m / 5) * 5);
const ph = (type: Phase["type"], duree: number, rpe: string, consigne?: string, tour?: number, tours?: number, titre?: string): Phase =>
  ({ type, duree: Math.round(duree), rpe, consigne, tour, tours, titre });

/** Séance de fractionné guidée : échauffement, répétitions, retour au calme. */
function fractionne(n: number, effort: number, recup: number, allure: number, nom: string, echauf = 900, calme = 600): Phase[] {
  const P: Phase[] = [ph("echauf", echauf, tr("Footing facile"), tr("Footing tranquille, puis 3 accélérations progressives."))];
  for (let t = 1; t <= n; t++) {
    P.push(ph("effort", effort, allureTxt(allure), tr("{nom} : tiens {a}, régulier du début à la fin.", { nom, a: allureTxt(allure) }), t, n));
    if (t < n) P.push(ph("recup", recup, tr("Trot"), tr("Trottine ou marche, laisse le souffle revenir."), t, n));
  }
  P.push(ph("calme", calme, tr("Footing facile"), tr("Footing très lent pour finir.")));
  return P;
}

/** Plan complet, semaine par semaine. */
export function genererPlan(p: PlanCourse, V = vdotDe(p)): SemaineCourse[] {
  const P = PROFILS[p.obj], deb = estDebutant(p), A = allures(V);
  const N = Math.max(1, Math.round((dateDe(lundiDe(p.date)).getTime() - dateDe(p.debut).getTime()) / (7 * 864e5)) + 1);
  const T = Math.min(N - 1, p.obj === "marathon" && N < 14 ? 2 : P.affutage); // semaines d'affûtage, semaine de course comprise
  const B = Math.max(1, N - T); // semaines de construction
  /* sortie longue plafonnée en temps (2 h 30 pour un débutant, 3 h sinon : au-delà, la fatigue
     coûte plus qu'elle ne rapporte ; Daniels, Pfitzinger) */
  const capKm = Math.floor(((deb ? 150 : 180) * 60) / A.facile);
  const debut = Math.min(P.long[deb ? 0 : 1], capKm), pic = Math.min(P.pic[deb ? 0 : 1], capKm);
  const raceAllure = allureCourse(p.obj, A);
  const hyrox = p.obj === "hyrox";

  /* sortie longue : rampe vers le pic, +10 % au plus, une semaine allégée sur quatre (sur trois pour un débutant) */
  const longs: number[] = [];
  let prec = debut;
  const cycle = deb ? 3 : 4;
  for (let k = 0; k < B; k++) {
    const allegee = k > 0 && k % cycle === cycle - 1 && k < B - 1;
    if (allegee) { longs.push(Math.round(prec * 0.75)); continue; }
    const cible = B === 1 ? pic : debut + ((pic - debut) * k) / (B - 1);
    const l = k === 0 ? debut : Math.min(cible, Math.max(prec, prec * 1.1));
    prec = Math.round(l * 2) / 2;
    longs.push(prec);
  }

  /* le test 5 km : la première semaine allégée (on est frais, le chrono est juste), après au moins
     3 semaines d'entraînement, sur un plan d'au moins 8 semaines */
  let finFondation = -1;
  if (N >= 8) for (let k = 2; k < B - 1 && finFondation < 0; k++) if (k % cycle === cycle - 1) finFondation = k;

  const S: SemaineCourse[] = [];
  for (let k = 0; k < N; k++) {
    const lundi = decaler(p.debut, 7 * k), aff = k >= B, derniere = k === N - 1;
    const phase: PhaseCourse = derniere ? "course" : aff ? "affutage" : k < B * 0.4 ? "fondation" : k < B * 0.75 ? "developpement" : "specifique";
    const allegee = !aff && k > 0 && k % cycle === cycle - 1 && k < B - 1;
    const coef = Math.min(1, p.ajust[k] ?? 1);
    const pic2 = longs[B - 1] ?? pic;
    /* affûtage : la sortie longue baisse franchement (10 km et semi : 60 % du pic dès la 1re semaine) */
    const paliers = p.obj === "semi" || p.obj === "10k" ? [0.6, 0.5, 0.5] : [0.75, 0.6, 0.5];
    let long = aff ? pic2 * (derniere ? 0 : paliers[k - B] ?? 0.5) : longs[k];
    long = Math.round(long * coef * 2) / 2;
    /* en affûtage, les footings suivent le pic (×0,8) et non la sortie longue raccourcie : le volume baisse sans s'effondrer */
    const footMin = arr5(Math.min(deb ? 45 : 60, Math.max(25, ((aff ? pic2 * 0.8 : long) * 0.45 * A.facile) / 60)) * (aff ? 0.8 : 1) * coef);
    /* course-marche (« je ne cours pas encore 30 min ») : 1 min de course / 1 min de marche, puis la part
       de course monte chaque semaine ; course continue à partir de la 7e semaine */
    const RATIO = [60, 90, 120, 180, 240, 360];
    const marche = !!p.marche && k < RATIO.length;
    const courseMarche = (minutes: number, titre: string): SeanceCourse => {
      const run = RATIO[k], walk = 60, n = Math.max(4, Math.round((minutes * 60) / (run + walk)));
      const P2: Phase[] = [ph("echauf", 300, tr("Marche rapide"), tr("5 min de marche rapide pour te mettre en route."))];
      for (let t = 1; t <= n; t++) {
        P2.push(ph("effort", run, tr("Course très facile"), tr("Cours tout doucement : tu dois pouvoir parler."), t, n, tr("Course")));
        if (t < n) P2.push(ph("recup", walk, tr("Marche"), tr("Marche d'un bon pas, le souffle revient."), t, n));
      }
      P2.push(ph("calme", 300, tr("Marche"), tr("5 min de marche pour finir.")));
      const min = Math.round(dureeTotale(P2) / 60);
      return { type: "footing", titre, min, allure: A.facile, phases: P2,
        detail: tr("{n} × {a} de course très facile, {b} de marche entre chaque. La part de course monte chaque semaine : course continue dès la 7e semaine.", { n, a: run >= 60 ? tr("{m} min", { m: String(run / 60).replace(".", ",") }) : `${run} s`, b: "1 min" }) };
    };
    const footing = (n = 1): SeanceCourse => marche ? courseMarche(Math.min(30, footMin), n > 1 ? tr("Course-marche de récupération") : tr("Course-marche")) : ({
      type: "footing", titre: n > 1 ? tr("Footing de récupération") : tr("Footing"), min: n > 1 ? arr5(footMin * 0.8) : footMin, allure: A.facile,
      detail: tr("{a} min en endurance, entre {a1} /km. Tu dois pouvoir parler en phrases ; un jour de fatigue, plus lent, c'est très bien.", { a: n > 1 ? arr5(footMin * 0.8) : footMin, a1: plageFacile(A) }),
      phases: [ph("continu", (n > 1 ? arr5(footMin * 0.8) : footMin) * 60, allureTxt(A.facile), tr("Allure facile : tu peux parler en phrases."))],
    });

    /* séance de qualité selon la phase */
    /* Hyrox : course puis atelier, tour après tour ; le nombre de tours et la dose montent avec les phases */
    const ateliers = (): SeanceCourse => {
      const fort = coef < 1 || allegee;
      /* développement : 4, puis 5, puis 6 tours de 1 km (des marches entre les 500 m de fondation et la simulation) */
      const dev = (k - B * 0.4) / (B * 0.35), nDev = fort || dev < 0.34 ? 4 : dev < 0.67 ? 5 : 6;
      const [n, km, part] = phase === "fondation" ? [4, 0.5, 0.5] : phase === "developpement" ? [nDev, 1, 0.75] : phase === "specifique" ? [fort ? 6 : 8, 1, 1] : [4, 1, 0.5];
      const choix = n === 8 ? ATELIERS
        : n === 5 ? ATELIERS.filter((_, i) => (((i - k) % 8) + 8) % 8 < 5)
        : ATELIERS.filter((_, i) => (n === 6 ? i !== (k % 4) && i !== 4 + (k % 4) : i % 2 === k % 2));
      const tours = choix.map((a, t) => {
        const dose = phase === "specifique" && n === 8 && t < 4 ? 0.5 : part; // simulation : la 1re moitié allégée
        return { a, km, c: consigneAtelier(a, dose, p), dose };
      });
      const P2: Phase[] = [ph("echauf", 600, tr("Footing facile"), tr("Footing tranquille, puis 3 accélérations progressives."))];
      tours.forEach((t, i) => {
        const cible = Math.round(km * raceAllure);
        P2.push({ ...ph("effort", cible, allureTxt(raceAllure), tr("Cours {a} à {a1}. Touche « Km fini » à l'arrivée.", { a: km < 1 ? "500 m" : "1 km", a1: allureTxt(raceAllure) }), i + 1, tours.length, tr("Course · {a}", { a: km < 1 ? "500 m" : "1 km" })), libre: tr("Km fini") });
        P2.push({ ...ph("effort", Math.round(t.a.sec * t.dose * (deb ? 1 : 0.8)), t.c.dose, t.c.texte, i + 1, tours.length, t.c.titre), libre: tr("Atelier fini") });
      });
      P2.push(ph("calme", 300, tr("Marche"), tr("Marche puis trottine très lentement.")));
      const min = Math.round(dureeTotale(P2) / 60);
      return {
        type: "hyrox", titre: tr("Course + ateliers"), min, allure: raceAllure, phases: P2,
        tours: tours.map((t) => ({ km: t.km, atelier: `${t.c.titre} ${t.c.dose}` })),
        detail: n === 8
          ? tr("Simulation : 8 tours de 1 km à {a} suivis d'un atelier, les 4 premiers ateliers à mi-dose. Garde de la marge sur les premiers kilomètres.", { a: allureTxt(raceAllure) })
          : tr("{n} tours : {km} à {a}, puis un atelier. Enchaîne sans t'arrêter ; c'est l'enchaînement course-atelier qui s'entraîne ici.", { n, km: km < 1 ? "500 m" : "1 km", a: allureTxt(raceAllure) }),
      };
    };

    const q = (deuxieme: boolean): SeanceCourse => {
      const prog = B > 1 ? Math.min(1, k / (B - 1)) : 1, fort = coef < 1 || allegee;
      /* course-marche : pas encore de séance de qualité, d'abord tenir 30 min */
      if (marche && phase !== "course") return footing();
      if (hyrox && !deuxieme && phase !== "course") return ateliers();
      if (phase === "course") {
        const ph2 = fractionne(3, 60, 120, raceAllure, tr("Rappel d'allure"), 900, 300);
        return { type: "allure", titre: tr("Rappel d'allure"), min: 26, allure: raceAllure, phases: ph2, detail: tr("Footing de 15 min, puis 3 × 1 min à ton allure de course ({a}). Rien de plus : tu gardes tes forces.", { a: allureTxt(raceAllure) }) };
      }
      /* première semaine allégée : test 5 km, qui recale les allures (vdotActuel) */
      if (!deuxieme && !hyrox && k === finFondation && deb) {
        /* débutant : pas de 5 km à fond, mais 30 min à allure régulière ; la distance parcourue recale les allures */
        const P2: Phase[] = [
          ph("echauf", 600, tr("Footing facile"), tr("Footing tranquille pour te mettre en route.")),
          { ...ph("effort", 1800, tr("Régulier, soutenu"), tr("30 min à une allure que tu peux tenir jusqu'au bout, sans finir épuisé."), 1, 1, tr("Test 30 min")), libre: tr("Arrivée") },
          ph("calme", 300, tr("Marche"), tr("Marche puis trottine très lentement.")),
        ];
        return { type: "allure", titre: tr("Test 30 min"), min: 45, allure: A.facile, phases: P2, test: true,
          detail: tr("10 min d'échauffement, puis 30 min à allure régulière et soutenue. Note ensuite la distance et le temps du test seul : Oxa recale tes allures sur ta forme du moment.") };
      }
      if (!deuxieme && !hyrox && k === finFondation) {
        const prevu = tempsPrevu(V, 5);
        const P2: Phase[] = [
          ph("echauf", 900, tr("Footing facile"), tr("Footing tranquille, puis 3 accélérations progressives.")),
          { ...ph("effort", prevu, tr("À fond, régulier"), tr("5 km le plus vite possible, en partant prudemment : le 1er km ne doit pas être le plus rapide."), 1, 1, tr("Test 5 km")), libre: tr("Arrivée") },
          ph("calme", 600, tr("Footing facile"), tr("Footing très lent pour finir.")),
        ];
        return { type: "allure", titre: tr("Test 5 km"), min: Math.round((1500 + prevu) / 60), allure: Math.round(prevu / 5), phases: P2, test: true,
          detail: tr("15 min d'échauffement, puis 5 km à fond et réguliers (vise environ {a}). Note ensuite la distance et le temps du test seul : Oxa recale tes allures sur ta forme du moment.", { a: chronoTxt(prevu) }) };
      }
      if ((phase === "fondation" && !deuxieme && k % 2 === 1) && !hyrox) {
        /* côtes courtes : la force du coureur, sans le stress des intervalles sur le plat */
        const n = deb ? 8 : 10;
        const avant = Math.max(15, footMin - 10);
        const P2: Phase[] = [ph("continu", avant * 60, allureTxt(A.facile), tr("Footing facile jusqu'au pied d'une côte."))];
        for (let t = 1; t <= n; t++) {
          P2.push(ph("effort", 30, tr("Montée dynamique"), tr("Monte vite mais relâché : buste droit, petits pas, bras actifs."), t, n, tr("Côte")));
          if (t < n) P2.push(ph("recup", 90, tr("Redescente"), tr("Redescends en trottinant ou en marchant."), t, n));
        }
        return { type: "lignes", titre: tr("Footing + côtes"), min: avant + Math.round((n * 120 - 90) / 60), allure: A.facile, phases: P2,
          detail: tr("{footMin} min faciles, puis {n} montées de 30 s dans une côte (6 à 8 %), retour en trottinant. Elles construisent la force et la foulée.", { footMin: avant, n }) };
      }
      if (phase === "fondation" || (deuxieme && phase !== "specifique")) {
        const n = 6;
        const P2: Phase[] = [ph("continu", footMin * 60, allureTxt(A.facile), tr("Footing facile."))];
        for (let t = 1; t <= n; t++) {
          P2.push(ph("effort", 20, tr("Vite et relâché"), tr("Accélération progressive, foulée souple, sans sprinter."), t, n, tr("Ligne droite")));
          if (t < n) P2.push(ph("recup", 60, tr("Marche"), tr("Marche ou trottine."), t, n));
        }
        return { type: "lignes", titre: tr("Footing + lignes droites"), min: footMin + 8, allure: A.facile, phases: P2, detail: tr("{footMin} min faciles, puis 6 accélérations de 20 s (récupération 1 min). Elles apprennent à courir vite sans se fatiguer.", { footMin }) };
      }
      if (phase === "affutage") {
        const n = p.obj === "10k" ? 4 : 2, eff = p.obj === "10k" ? 180 : p.obj === "semi" ? 480 : 600;
        return { type: "allure", titre: tr("Affûtage à allure course"), min: Math.round((900 + 600 + n * eff + (n - 1) * 120) / 60), allure: raceAllure, phases: fractionne(n, eff, 120, raceAllure, tr("Allure course")),
          detail: tr("{n} × {a} min à ton allure de course ({a1}), récupération 2 min. Le volume baisse, l'intensité reste.", { n, a: Math.round(eff / 60), a1: allureTxt(raceAllure) }) };
      }
      if (phase === "specifique" && !deuxieme) {
        if (p.obj === "marathon") {
          const n = 2, eff = Math.round((12 + 8 * prog) * (fort ? 0.8 : 1)) * 60;
          return { type: "seuil", titre: tr("Seuil long"), min: Math.round((1500 + n * eff + 180) / 60), allure: A.seuil, phases: fractionne(n, eff, 180, A.seuil, tr("Seuil")),
            detail: tr("2 × {a} min au seuil ({a1}), récupération 3 min. « Confortablement difficile » : tu peux dire quelques mots.", { a: eff / 60, a1: allureTxt(A.seuil) }) };
        }
        const n = p.obj === "10k" ? Math.round(4 + 2 * prog) : 3, eff = p.obj === "10k" ? 240 : Math.round((10 + 5 * prog) * (fort ? 0.8 : 1)) * 60;
        return { type: "allure", titre: tr("Allure spécifique"), min: Math.round((1500 + n * eff + (n - 1) * 120) / 60), allure: raceAllure, phases: fractionne(n, eff, 120, raceAllure, tr("Allure course")),
          detail: tr("{n} × {a} min à ton allure de course ({a1}), récupération 2 min.", { n, a: Math.round(eff / 60), a1: allureTxt(raceAllure) }) };
      }
      /* développement (et 2e séance en spécifique) : seuil et VMA en alternance */
      if ((k % 2 === 0) !== deuxieme) {
        const n = 2, eff = Math.round((8 + 6 * prog) * (fort ? 0.8 : 1)) * 60;
        return { type: "seuil", titre: tr("Seuil"), min: Math.round((1500 + n * eff + 120) / 60), allure: A.seuil, phases: fractionne(n, eff, 120, A.seuil, tr("Seuil")),
          detail: tr("2 × {a} min au seuil ({a1}), récupération 2 min. « Confortablement difficile » : tu peux dire quelques mots.", { a: eff / 60, a1: allureTxt(A.seuil) }) };
      }
      const n = Math.round((4 + 2 * prog) * (fort ? 0.8 : 1));
      return { type: "vma", titre: tr("Fractionné"), min: Math.round((1500 + n * 180 + (n - 1) * 120) / 60), allure: A.vma, phases: fractionne(n, 180, 120, A.vma, tr("Fractionné")),
        detail: tr("{n} × 3 min à {a}, récupération 2 min en trottinant. Dur, mais régulier : la dernière doit ressembler à la première.", { n, a: allureTxt(A.vma) }) };
    };

    const longue = (): SeanceCourse => {
      if (marche) return courseMarche(Math.min(40, Math.round((long * A.facile) / 60)), tr("Sortie longue en course-marche"));
      const avecAllure = p.obj === "marathon" && phase === "specifique" && !allegee;
      const kmAllure = avecAllure ? Math.round(long * 0.3) : 0;
      const min = Math.round((long * A.facile) / 60);
      /* 10 km et semi : finir à l'allure du semi apprend à tenir l'allure fatigué */
      if ((p.obj === "semi" || p.obj === "10k") && phase === "specifique" && !allegee && coef >= 1) {
        const kmF = Math.min(p.obj === "semi" ? 5 : 3, Math.max(2, Math.round(long * 0.25))), debutK = long - kmF;
        const sec = debutK * A.facile + kmF * A.semi;
        return {
          type: "longue", titre: tr("Sortie longue, fin rapide"), km: long, min: Math.round(sec / 60), allure: A.facile,
          detail: tr("{long} km : les {a} premiers très faciles ({b}), puis les {c} derniers à allure semi ({d}). Finis fort mais en contrôle.", { long, a: debutK, b: allureTxt(A.facile), c: kmF, d: allureTxt(A.semi) }),
          phases: [ph("continu", Math.round(debutK * A.facile), allureTxt(A.facile), tr("Très facile. Bois régulièrement.")), ph("effort", Math.round(kmF * A.semi), allureTxt(A.semi), tr("Les {c} derniers km à allure semi : régulier, en contrôle.", { c: kmF }), 1, 1, tr("Fin rapide"))],
        };
      }
      return {
        type: "longue", titre: tr("Sortie longue"), km: long, min, allure: A.facile,
        detail: avecAllure
          ? tr("{long} km, dont les {kmAllure} derniers à allure marathon ({a}). Le reste très facile. Bois et teste ton ravitaillement.", { long, kmAllure, a: allureTxt(A.marathon) })
          : tr("{long} km très faciles ({a} ou plus lent). Le but est le temps passé debout, pas la vitesse.", { long, a: allureTxt(A.facile) }),
        phases: [ph("continu", min * 60, allureTxt(A.facile), tr("Très facile. Bois régulièrement."))],
      };
    };

    const seances: SeanceCourse[] = [];
    if (derniere) {
      seances.push(footing(), q(false));
      if (p.jours >= 4) seances.push({ ...footing(2), titre: tr("Footing de veille"), min: 20, detail: tr("20 min très faciles la veille ou l'avant-veille, avec 3 lignes droites."), phases: [ph("continu", 1200, allureTxt(A.facile), tr("Très facile."))] });
      const prevu = chronoPrevu(p.obj, V);
      seances.push({ type: "course", titre: tr("Jour J : {nom}", { nom: DISTANCES[p.obj].nom }), km: DISTANCES[p.obj].km, min: Math.round(prevu / 60), allure: raceAllure,
        detail: hyrox
          ? tr("Pars à {a} sur les premiers kilomètres : les ateliers coûtent plus qu'on ne croit. Découpe les wall balls en séries courtes. Chrono visé : {a1}.", { a: allureTxt(raceAllure + 10), a1: chronoTxt(prevu) })
          : tr("Pars à {a} sur les premiers kilomètres, puis cale-toi sur {a1}. Chrono visé : {a2}.", { a: allureTxt(raceAllure + 5), a1: allureTxt(raceAllure), a2: chronoTxt(prevu) }) });
    } else {
      /* deux séances de qualité dans la semaine : à 5 sorties, et pas pour un débutant (la 5e reste facile) */
      const deuxQ = p.jours >= 5 && !deb && (phase === "developpement" || phase === "specifique") && !allegee && coef >= 1;
      const corps: SeanceCourse[] = [q(false), footing()];
      if (deuxQ) corps.push(q(true));
      while (corps.length < p.jours - 1) corps.push(footing(2));
      if (!aff || k < N - 1) corps.push(longue());
      seances.push(...corps.slice(0, Math.max(2, p.jours)));
    }
    /* renforcement du coureur, loin des séances dures (placé après les footings) ; pas en semaine de course */
    if (!derniere) for (let r = 0; r < Math.min(2, p.renfo); r++) seances.push(hyrox
      ? { type: "renfo", titre: tr(r === 0 ? "Renfo Hyrox A" : "Renfo Hyrox B"), renfo: r as 0 | 1, min: 35, detail: r === 0
        ? tr("Fentes, port de charges, thrusters, burpees sautés et gainage : la force qui sert dans les ateliers. Un jour sans séance dure.")
        : tr("Squat, soulevé de terre roumain, rowing et traîneau : les jambes et le dos qui poussent et tirent. Pas la veille de « Course + ateliers ».") }
      : { type: "renfo", titre: tr("Renfo du coureur"), renfo: r as 0 | 1, min: 25, detail: r === 0
        ? tr("Mollets, fessiers, ischios et gainage : 25 min qui protègent tendons et genoux. À placer un jour facile, pas la veille d'une séance dure.")
        : tr("Force des jambes : charges modérées, mouvements lents et contrôlés. Un jour facile, pas la veille de la sortie longue.") });
    S.push({ k, lundi, phase, allegee: allegee || coef < 1, long, seances });
  }
  lisserVolume(S, A);
  return S;
}

/** Minutes de course d'une semaine (sans le renforcement). */
export const minutesSemaine = (W: SemaineCourse) => W.seances.reduce((t, x) => t + (x.type === "renfo" ? 0 : x.min), 0);

/* Pas plus de +10 % d'une vraie semaine à la suivante (une semaine allégée ne compte pas comme
   référence) : on raccourcit les footings, jamais la qualité ni la sortie longue. */
function lisserVolume(S: SemaineCourse[], A: Allures) {
  let ref = 0;
  for (const W of S) {
    if (W.allegee || W.phase === "affutage" || W.phase === "course") continue;
    const vol = minutesSemaine(W);
    if (ref > 0 && vol > ref * 1.1) {
      let trop = vol - ref * 1.1;
      const foots = W.seances.filter((x) => x.type === "footing");
      for (const x of foots.sort((a, b) => b.min - a.min)) {
        if (trop <= 0) break;
        const nouveau = Math.max(20, arr5(x.min - trop));
        if (nouveau >= x.min) continue;
        trop -= x.min - nouveau;
        x.min = nouveau;
        x.detail = tr("{a} min en endurance, entre {a1} /km. Tu dois pouvoir parler en phrases ; un jour de fatigue, plus lent, c'est très bien.", { a: nouveau, a1: plageFacile(A) });
        x.phases = [ph("continu", nouveau * 60, allureTxt(A.facile), tr("Allure facile : tu peux parler en phrases."))];
      }
      /* puis la partie footing des séances « lignes droites » et « côtes » (15 min au moins) */
      for (const x of W.seances.filter((y) => y.type === "lignes" && y.phases?.[0]?.type === "continu")) {
        if (trop <= 0) break;
        const avant = Math.round(x.phases![0].duree / 60), nouveau = Math.max(15, arr5(avant - trop));
        if (nouveau >= avant) continue;
        trop -= avant - nouveau;
        x.min -= avant - nouveau;
        x.phases![0] = { ...x.phases![0], duree: nouveau * 60 };
        x.detail = x.detail.replace(String(avant), String(nouveau));
      }
      /* Hyrox : la simulation passe avant la sortie longue, qui cède le reste (jusqu'à -25 %) */
      const longue = W.seances.find((y) => y.type === "longue");
      if (trop > 0 && longue?.km && W.seances.some((y) => y.type === "hyrox")) {
        const km = Math.max(longue.km * 0.75, Math.round(((longue.min - trop) * 60 / A.facile) * 2) / 2);
        if (km < longue.km) {
          const min = Math.round((km * A.facile) / 60);
          trop -= longue.min - min;
          Object.assign(longue, { km, min, detail: tr("{long} km très faciles ({a} ou plus lent). Le but est le temps passé debout, pas la vitesse.", { long: km, a: allureTxt(A.facile) }),
            phases: [ph("continu", min * 60, allureTxt(A.facile), tr("Très facile. Bois régulièrement."))] });
          W.long = km;
        }
      }
    }
    ref = minutesSemaine(W);
  }
}

/** Semaine en cours (0 avant le début, N-1 après la course). */
export function semaineDe(p: PlanCourse, auj: string, N: number) {
  const k = Math.floor((dateDe(auj).getTime() - dateDe(p.debut).getTime()) / (7 * 864e5));
  return Math.max(0, Math.min(N - 1, k));
}
export const joursAvantCourse = (p: PlanCourse, auj: string) => Math.round((dateDe(p.date).getTime() - dateDe(auj).getTime()) / 864e5);
export const enPause = (p: PlanCourse) => !!p.pauses.at(-1) && !p.pauses.at(-1)!.a;

/* ---------------- adaptation ---------------- */
/** Après une sortie : trop dure ou douleur → la semaine suivante est allégée. Renvoie le message à afficher. */
export function adapter(p: PlanCourse, k: number, s: Pick<Sortie, "rpe" | "douleur">): string | null {
  if (s.douleur) { p.ajust[k + 1] = Math.min(p.ajust[k + 1] ?? 1, 0.8); return tr("Douleur notée : la semaine prochaine est allégée de 20 %. Si elle persiste, fais une pause et consulte."); }
  if (s.rpe >= 9) { p.ajust[k + 1] = Math.min(p.ajust[k + 1] ?? 1, 0.9); return tr("Séance très dure : la semaine prochaine est allégée de 10 % pour bien récupérer."); }
  return null;
}
/** Reprise après une pause : volume réduit selon la durée de l'arrêt. Renvoie le message à afficher. */
export function reprendre(p: PlanCourse, auj: string, N: number): string {
  const der = p.pauses.at(-1);
  if (!der || der.a) return "";
  der.a = auj;
  const jours = Math.round((dateDe(auj).getTime() - dateDe(der.de).getTime()) / 864e5), k = semaineDe(p, auj, N);
  if (jours < 4) return tr("Reprise : le plan continue normalement.");
  const c1 = jours >= 14 ? 0.6 : jours >= 7 ? 0.7 : 0.85, c2 = jours >= 14 ? 0.8 : 0.9;
  p.ajust[k] = Math.min(p.ajust[k] ?? 1, c1);
  p.ajust[k + 1] = Math.min(p.ajust[k + 1] ?? 1, c2);
  const reste = N - 1 - k;
  return tr("Reprise après {jours} jours : cette semaine est réduite à {a} %, la suivante à {a1} %.", { jours, a: Math.round(c1 * 100), a1: Math.round(c2 * 100) }) +
    (jours >= 21 && reste < 6 ? tr(" Avec si peu de temps avant la course, vise plutôt de finir que le chrono.") : "");
}

/** Le plan proposé est-il raisonnable ? Message d'alerte sinon. */
export function avertissement(obj: ObjectifCourse, ref: PlanCourse["ref"], semainesDispo: number): string | null {
  const P = PROFILS[obj], deb = !ref || vdotDe({ ref }) < 38;
  if (semainesDispo < 2) return tr("La course est dans moins de deux semaines : il est trop tard pour une préparation, fais des footings faciles et garde de la fraîcheur.");
  if (obj === "marathon" && deb && semainesDispo < 16) return tr("Un premier marathon demande au moins 16 semaines quand on débute. Le plan sera prudent ; un semi-marathon serait plus sûr à cette échéance.");
  if (semainesDispo < P.nmin) return tr("Préparation courte ({semainesDispo} semaines au lieu de {nmin} au moins) : le plan reste prudent, vise de finir plutôt qu'un chrono.", { semainesDispo, nmin: P.nmin });
  return null;
}

/* ---------------- modification d'un plan en cours ---------------- */
export type ReglagesPlan = Pick<PlanCourse, "obj" | "date" | "debut" | "jours" | "renfo" | "ref" | "cat" | "salle" | "marche" | "jsem">;
/** Nouveaux réglages d'un plan en cours : pauses, allègements et date de création sont gardés.
    `decalage` : semaines à ajouter aux numéros de semaine (sorties, allègements) quand le début bouge,
    pour qu'une semaine du calendrier garde ses séances faites. */
export function modifierPlan(a: PlanCourse, r: ReglagesPlan): { plan: PlanCourse; decalage: number } {
  const decalage = Math.round((dateDe(a.debut).getTime() - dateDe(r.debut).getTime()) / (7 * 864e5));
  const ajust: Record<number, number> = {};
  for (const [k, v] of Object.entries(a.ajust)) if (+k + decalage >= 0) ajust[+k + decalage] = v;
  const plan: PlanCourse = { ...a, ...r, ajust, pauses: a.pauses, cree: a.cree };
  if (r.obj !== "hyrox") { delete plan.cat; delete plan.salle; }
  if (!plan.marche) delete plan.marche;
  return { plan, decalage };
}
/** Clé « semaine|séance » d'une sortie après décalage du plan (null : la semaine n'existe plus). */
export function decalerCle(cle: string | undefined, decalage: number): string | null | undefined {
  if (!cle || !decalage) return cle;
  const [k, j] = cle.split("|").map(Number);
  return k + decalage >= 0 ? `${k + decalage}|${j}` : null;
}

/** Séance du plan déjà faite ? */
export const faite = (S: Sortie[], k: number, j: number) => S.some((x) => x.s === `${k}|${j}`);
/** Allure d'une sortie, en s/km. */
export const allureDe = (s: Pick<Sortie, "km" | "sec">) => (s.km > 0 ? s.sec / s.km : 0);
export const aujourdhui = () => jourDe(Date.now());

/* ---------------- renforcement du coureur ---------------- */
/** Séances de renforcement : A sans matériel (mollets, fessiers, ischios, gainage), B avec haltères si on en a. */
/** Noms des deux séances de renfo dans chaque langue : une séance créée en français est retrouvée en anglais, et inversement. */
export const NOMS_RENFO = [["Renfo coureur A", "Runner strength A"], ["Renfo coureur B", "Runner strength B"]];
export const NOMS_RENFO_HYROX = [["Renfo Hyrox A", "Hyrox strength A"], ["Renfo Hyrox B", "Hyrox strength B"]];
/** Noms de la séance de renfo r selon l'objectif du plan. */
export const nomsRenfo = (obj: ObjectifCourse | undefined, r: 0 | 1) => (obj === "hyrox" ? NOMS_RENFO_HYROX : NOMS_RENFO)[r];
/** Renfo Hyrox : A (ateliers : fentes, port de charges, thrusters, burpees, gainage) et B (force : squat, roumain, rowing, traîneau),
    chacun adapté au matériel déclaré. */
export function seancesRenfoHyrox(dispo: (id: string) => boolean): { nom: string; ex: ExLibre[] }[] {
  const un = (ids: string[]) => ids.find(dispo) ?? ids[ids.length - 1];
  const A: ExLibre[] = [
    { id: un(["fe", "fepc"]), s: 3, r: 12, p: tr("90 s") },
    { id: un(["ferm", "fepc"]), s: 3, r: 40, p: tr("90 s") },
    { id: un(["kbthr", "gob", "jsq"]), s: 3, r: 12, p: tr("90 s") },
    { id: "burpsl", s: 3, r: 8, p: tr("90 s") },
    { id: "gai", s: 3, r: 45, p: tr("45 s") },
  ];
  const B: ExLibre[] = [
    { id: un(["sq", "gob", "sqpc"]), s: 4, r: 8, p: tr("2 min") },
    { id: un(["rm", "rmh", "pont"]), s: 3, r: 10, p: tr("90 s") },
    { id: un(["rw", "rw2", "ra"]), s: 3, r: 10, p: tr("90 s") },
    { id: un(["trpush", "fsaut"]), s: 4, r: 20, p: tr("2 min") },
  ];
  return [{ nom: tr(NOMS_RENFO_HYROX[0][0]), ex: A }, { nom: tr(NOMS_RENFO_HYROX[1][0]), ex: B }];
}
export function seancesRenfo(dispo: (id: string) => boolean): { nom: string; ex: ExLibre[] }[] {
  const A: ExLibre[] = [
    { id: "mol1", s: 3, r: 12, p: tr("60 s") }, { id: "pont1", s: 3, r: 10, p: tr("60 s") }, { id: "fepc", s: 3, r: 10, p: tr("60 s") },
    { id: "nord", s: 3, r: 5, p: tr("90 s") }, { id: "plat", s: 3, r: 30, p: tr("45 s") },
  ];
  const avecHalteres: ExLibre[] = [
    { id: "rmh", s: 3, r: 8, p: tr("90 s") }, { id: "bul", s: 3, r: 8, p: tr("90 s") }, { id: "molh", s: 3, r: 15, p: tr("60 s") }, { id: "gai", s: 3, r: 40, p: tr("45 s") },
  ];
  const sansMateriel: ExLibre[] = [
    { id: "sqpc", s: 3, r: 15, p: tr("60 s") }, { id: "pont", s: 3, r: 15, p: tr("60 s") }, { id: "mol1", s: 3, r: 15, p: tr("60 s") }, { id: "gai", s: 3, r: 40, p: tr("45 s") },
  ];
  const B = avecHalteres.every((e) => dispo(e.id)) ? avecHalteres : sansMateriel;
  return [{ nom: tr(NOMS_RENFO[0][0]), ex: A }, { nom: tr(NOMS_RENFO[1][0]), ex: B }];
}

/** Le cardio guidé et les sorties de course, ensemble : pour compter séances, minutes et régularité. */
export const avecSorties = (C: HistoCardio[] = [], S: Sortie[] = []): HistoCardio[] => [
  ...C,
  ...S.map((s) => ({ nom: tr("Course à pied"), f: "endurance" as const, m: "tapis" as const, min: Math.round(s.sec / 60), effort: s.sec, ts: new Date(s.d + "T12:00").getTime(), run: true })),
];

/** Forme du moment : le VDOT de référence, relevé par les sorties soutenues des 8 dernières semaines
    (au moins 5 km, ressenti « juste » ou plus, test 5 km compris). Jamais plus de +3, jamais de baisse :
    une sortie ratée ne doit pas ralentir tout le plan. */
export function vdotActuel(p: PlanCourse, S: Sortie[] = [], auj: string): number {
  const V0 = vdotDe(p), depuis = decaler(auj, -56);
  let V = V0;
  for (const s of S) {
    if (s.d < depuis || s.d > auj || s.km < 5 || s.rpe < 7 || s.sec <= 0) continue;
    V = Math.max(V, Math.min(V0 + 3, vdot(s.km, s.sec)));
  }
  return Math.round(V * 10) / 10;
}

/** Gain de forme raisonnable sur une préparation : environ +1 VDOT par 6 semaines de construction,
    plafonné à +2,5 (+4 en débutant, qui progresse plus vite). */
export function gainVdot(p: Pick<PlanCourse, "obj" | "ref">, semaines: number) {
  const P = PROFILS[p.obj], construction = Math.max(0, semaines - P.affutage);
  return Math.min(estDebutant(p) ? 4 : 2.5, Math.round((construction / 6) * 10) / 10);
}
/** Chrono visé en fin de plan. */
export const objectifChrono = (p: Pick<PlanCourse, "obj" | "ref">, semaines: number, V = vdotDe(p)) => chronoPrevu(p.obj, Math.max(V, vdotDe(p) + gainVdot(p, semaines)));

/** Chrono estimé sur la distance visée : le plan (chrono de référence), amélioré par les sorties
    soutenues récentes (au moins 5 km, ressenti « juste » ou plus) via la formule de Riegel. */
export function estimation(p: PlanCourse, S: Sortie[], auj: string): { sec: number; depuis?: Sortie } {
  const km = DISTANCES[p.obj].km, V0 = vdotDe(p);
  let best = { sec: chronoPrevu(p.obj, V0) } as { sec: number; depuis?: Sortie };
  const depuis = decaler(auj, -56);
  for (const s of S) {
    if (s.d < depuis || s.km < 5 || s.rpe < 7 || s.sec <= 0) continue;
    /* Hyrox : la sortie donne l'allure 10 km ; les ateliers restent ceux du niveau de départ */
    const t = p.obj === "hyrox" ? Math.round(8 * (riegel(s.km, s.sec, 10) / 10 + 20) + tempsAteliers(V0)) : riegel(s.km, s.sec, km);
    if (t < best.sec) best = { sec: t, depuis: s };
  }
  return best;
}

/* ---------------- course et musculation sur un seul calendrier ---------------- */
/** Jours proposés pour n sorties : la sortie longue le dimanche, jamais deux jours durs collés. */
export function joursParDefaut(n: number): number[] {
  return n <= 3 ? [1, 3, 6] : n === 4 ? [1, 3, 5, 6] : [0, 1, 3, 4, 6];
}

/** Les dates des sorties du plan : chaque semaine, la sortie longue le dernier jour choisi, les
    autres dans l'ordre du plan (la séance de qualité en premier) sur les jours d'avant ; le jour J
    à sa date. Le renforcement n'est pas posé (il se fait un jour facile, au choix). */
export function datesDuPlan(p: PlanCourse, S: SemaineCourse[] = genererPlan(p)): { d: string; cle: string; nom: string }[] {
  const js = [...new Set(p.jsem?.length ? p.jsem : joursParDefaut(p.jours))].sort((a, b) => a - b);
  const out: { d: string; cle: string; nom: string }[] = [];
  for (const W of S) {
    const runs = W.seances.map((x, j) => ({ x, j })).filter(({ x }) => x.type !== "renfo");
    const longue = runs.find(({ x }) => x.type === "longue"), autres = runs.filter((r) => r !== longue && r.x.type !== "course");
    const jours = [...js];
    if (longue) out.push({ d: decaler(W.lundi, jours.pop()!), cle: `${W.k}|${longue.j}`, nom: longue.x.titre });
    autres.forEach((r, i) => { if (i < jours.length) out.push({ d: decaler(W.lundi, jours[i]), cle: `${W.k}|${r.j}`, nom: r.x.titre }); });
    for (const r of runs) if (r.x.type === "course") out.push({ d: p.date, cle: `${W.k}|${r.j}`, nom: r.x.titre });
  }
  return out.sort((a, b) => a.d.localeCompare(b.d));
}
