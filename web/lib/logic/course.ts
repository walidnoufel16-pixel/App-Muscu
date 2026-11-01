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

export type Allures = { facile: number; marathon: number; semi: number; dix: number; seuil: number; vma: number };
/** Allures d'entraînement en secondes par kilomètre. */
export function allures(V: number): Allures {
  return {
    facile: Math.round(allurePct(V, 0.68)),
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
export function genererPlan(p: PlanCourse): SemaineCourse[] {
  const P = PROFILS[p.obj], deb = estDebutant(p), V = vdotDe(p), A = allures(V);
  const N = Math.max(1, Math.round((dateDe(lundiDe(p.date)).getTime() - dateDe(p.debut).getTime()) / (7 * 864e5)) + 1);
  const T = Math.min(N - 1, p.obj === "marathon" && N < 14 ? 2 : P.affutage); // semaines d'affûtage, semaine de course comprise
  const B = Math.max(1, N - T); // semaines de construction
  const debut = P.long[deb ? 0 : 1], pic = P.pic[deb ? 0 : 1];
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

  const S: SemaineCourse[] = [];
  for (let k = 0; k < N; k++) {
    const lundi = decaler(p.debut, 7 * k), aff = k >= B, derniere = k === N - 1;
    const phase: PhaseCourse = derniere ? "course" : aff ? "affutage" : k < B * 0.4 ? "fondation" : k < B * 0.75 ? "developpement" : "specifique";
    const allegee = !aff && k > 0 && k % cycle === cycle - 1 && k < B - 1;
    const coef = Math.min(1, p.ajust[k] ?? 1);
    const pic2 = longs[B - 1] ?? pic;
    let long = aff ? pic2 * (derniere ? 0 : [0.75, 0.6, 0.5][k - B] ?? 0.5) : longs[k];
    long = Math.round(long * coef * 2) / 2;
    const footMin = arr5(Math.min(deb ? 45 : 60, Math.max(25, (long * 0.45 * A.facile) / 60)) * (aff ? 0.8 : 1) * coef);
    const footing = (n = 1): SeanceCourse => ({
      type: "footing", titre: n > 1 ? tr("Footing de récupération") : tr("Footing"), min: n > 1 ? arr5(footMin * 0.8) : footMin, allure: A.facile,
      detail: tr("{a} min en endurance, à {a1} environ. Tu dois pouvoir parler en phrases.", { a: n > 1 ? arr5(footMin * 0.8) : footMin, a1: allureTxt(A.facile) }),
      phases: [ph("continu", (n > 1 ? arr5(footMin * 0.8) : footMin) * 60, allureTxt(A.facile), tr("Allure facile : tu peux parler en phrases."))],
    });

    /* séance de qualité selon la phase */
    /* Hyrox : course puis atelier, tour après tour ; le nombre de tours et la dose montent avec les phases */
    const ateliers = (): SeanceCourse => {
      const fort = coef < 1 || allegee;
      const [n, km, part] = phase === "fondation" ? [4, 0.5, 0.5] : phase === "developpement" ? [fort ? 4 : 6, 1, 0.75] : phase === "specifique" ? [fort ? 6 : 8, 1, 1] : [4, 1, 0.5];
      const choix = n === 8 ? ATELIERS : ATELIERS.filter((_, i) => (n === 6 ? i !== (k % 4) && i !== 4 + (k % 4) : i % 2 === k % 2));
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
      if (hyrox && !deuxieme && phase !== "course") return ateliers();
      if (phase === "course") {
        const ph2 = fractionne(3, 60, 120, raceAllure, tr("Rappel d'allure"), 900, 300);
        return { type: "allure", titre: tr("Rappel d'allure"), min: 26, allure: raceAllure, phases: ph2, detail: tr("Footing de 15 min, puis 3 × 1 min à ton allure de course ({a}). Rien de plus : tu gardes tes forces.", { a: allureTxt(raceAllure) }) };
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
      const avecAllure = p.obj === "marathon" && phase === "specifique" && !allegee;
      const kmAllure = avecAllure ? Math.round(long * 0.3) : 0;
      const min = Math.round((long * A.facile) / 60);
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
      const deuxQ = p.jours >= 5 && (phase === "developpement" || phase === "specifique") && !allegee && coef >= 1;
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
  return S;
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
