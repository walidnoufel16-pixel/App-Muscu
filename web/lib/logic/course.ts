/* Préparation course à pied (10 km, semi-marathon, marathon). Logique pure.
   - Allures : méthode VDOT de Jack Daniels, à partir d'un chrono récent.
   - Plan : fondation → développement → spécifique → affûtage, 80 % en endurance
     facile, sortie longue +10 % au plus par semaine, une semaine allégée sur quatre.
   - Séances numérotées dans la semaine (comme le programme de musculation), pas datées.
   - Adaptation : une sortie « trop dure » ou une douleur allège la semaine suivante ;
     une pause (maladie, blessure) allège la reprise. La date de course ne bouge pas. */
import { dateDe, decaler, jourDe, lundiDe } from "./historique";
import type { Phase } from "./cardio";
import type { ExLibre, HistoCardio } from "./types";

export type ObjectifCourse = "10k" | "semi" | "marathon";
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
};
/** Une sortie faite : `s` = « semaine|séance » si elle correspond à une séance du plan. */
export type Sortie = { d: string; km: number; sec: number; rpe: number; douleur?: boolean; s?: string; course?: boolean };

export const DISTANCES: Record<ObjectifCourse, { nom: string; km: number; court: string }> = {
  "10k": { nom: "10 km", km: 10, court: "10 km" },
  semi: { nom: "Semi-marathon", km: 21.0975, court: "semi" },
  marathon: { nom: "Marathon", km: 42.195, court: "marathon" },
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

/* ---------------- périodisation ---------------- */
type Profil = { nmin: number; nmax: number; affutage: number; long: [number, number]; pic: [number, number] };
/* long / pic : [débutant, confirmé], en km */
const PROFILS: Record<ObjectifCourse, Profil> = {
  "10k": { nmin: 6, nmax: 12, affutage: 1, long: [6, 8], pic: [12, 15] },
  semi: { nmin: 8, nmax: 16, affutage: 2, long: [8, 10], pic: [18, 21] },
  marathon: { nmin: 10, nmax: 20, affutage: 3, long: [11, 14], pic: [28, 32] },
};
export const estDebutant = (p: Pick<PlanCourse, "ref">) => vdotDe(p) < 38;

/** Lundi de départ et nombre de semaines, selon la date de course (plafonné à la durée utile). */
export function calendrier(obj: ObjectifCourse, date: string, auj: string) {
  const P = PROFILS[obj], lundiCourse = lundiDe(date), lundiAuj = lundiDe(auj);
  const dispo = Math.round((dateDe(lundiCourse).getTime() - dateDe(lundiAuj).getTime()) / (7 * 864e5)) + 1;
  const n = Math.max(1, Math.min(P.nmax, dispo));
  return { debut: decaler(lundiCourse, -7 * (n - 1)), semaines: n, court: dispo < P.nmin, dispo };
}

export type TypeSeance = "footing" | "lignes" | "longue" | "seuil" | "vma" | "allure" | "course" | "renfo";
export type SeanceCourse = {
  type: TypeSeance;
  titre: string;
  detail: string;
  min: number; // durée estimée
  km?: number;
  allure?: number; // allure principale (s/km)
  phases?: Phase[]; // séance guidée au minuteur
  renfo?: 0 | 1; // laquelle des deux séances de renforcement
};
export type PhaseCourse = "fondation" | "developpement" | "specifique" | "affutage" | "course";
export type SemaineCourse = { k: number; lundi: string; phase: PhaseCourse; allegee: boolean; long: number; seances: SeanceCourse[] };
export const NOMS_PHASE: Record<PhaseCourse, string> = {
  fondation: "Fondation", developpement: "Développement", specifique: "Allure spécifique", affutage: "Affûtage", course: "Semaine de course",
};

const arr5 = (m: number) => Math.max(5, Math.round(m / 5) * 5);
const ph = (type: Phase["type"], duree: number, rpe: string, consigne?: string, tour?: number, tours?: number, titre?: string): Phase =>
  ({ type, duree: Math.round(duree), rpe, consigne, tour, tours, titre });

/** Séance de fractionné guidée : échauffement, répétitions, retour au calme. */
function fractionne(n: number, effort: number, recup: number, allure: number, nom: string, echauf = 900, calme = 600): Phase[] {
  const P: Phase[] = [ph("echauf", echauf, "Footing facile", "Footing tranquille, puis 3 accélérations progressives.")];
  for (let t = 1; t <= n; t++) {
    P.push(ph("effort", effort, allureTxt(allure), `${nom} : tiens ${allureTxt(allure)}, régulier du début à la fin.`, t, n));
    if (t < n) P.push(ph("recup", recup, "Trot", "Trottine ou marche, laisse le souffle revenir.", t, n));
  }
  P.push(ph("calme", calme, "Footing facile", "Footing très lent pour finir."));
  return P;
}

/** Plan complet, semaine par semaine. */
export function genererPlan(p: PlanCourse): SemaineCourse[] {
  const P = PROFILS[p.obj], deb = estDebutant(p), V = vdotDe(p), A = allures(V);
  const N = Math.max(1, Math.round((dateDe(lundiDe(p.date)).getTime() - dateDe(p.debut).getTime()) / (7 * 864e5)) + 1);
  const T = Math.min(N - 1, p.obj === "marathon" && N < 14 ? 2 : P.affutage); // semaines d'affûtage, semaine de course comprise
  const B = Math.max(1, N - T); // semaines de construction
  const debut = P.long[deb ? 0 : 1], pic = P.pic[deb ? 0 : 1];
  const raceAllure = p.obj === "10k" ? A.dix : p.obj === "semi" ? A.semi : A.marathon;

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
      type: "footing", titre: n > 1 ? "Footing de récupération" : "Footing", min: n > 1 ? arr5(footMin * 0.8) : footMin, allure: A.facile,
      detail: `${n > 1 ? arr5(footMin * 0.8) : footMin} min en endurance, à ${allureTxt(A.facile)} environ. Tu dois pouvoir parler en phrases.`,
      phases: [ph("continu", (n > 1 ? arr5(footMin * 0.8) : footMin) * 60, allureTxt(A.facile), "Allure facile : tu peux parler en phrases.")],
    });

    /* séance de qualité selon la phase */
    const q = (deuxieme: boolean): SeanceCourse => {
      const prog = B > 1 ? Math.min(1, k / (B - 1)) : 1, fort = coef < 1 || allegee;
      if (phase === "course") {
        const ph2 = fractionne(3, 60, 120, raceAllure, "Rappel d'allure", 900, 300);
        return { type: "allure", titre: "Rappel d'allure", min: 26, allure: raceAllure, phases: ph2, detail: `Footing de 15 min, puis 3 × 1 min à ton allure de course (${allureTxt(raceAllure)}). Rien de plus : tu gardes tes forces.` };
      }
      if (phase === "fondation" || (deuxieme && phase !== "specifique")) {
        const n = 6;
        const P2: Phase[] = [ph("continu", footMin * 60, allureTxt(A.facile), "Footing facile.")];
        for (let t = 1; t <= n; t++) {
          P2.push(ph("effort", 20, "Vite et relâché", "Accélération progressive, foulée souple, sans sprinter.", t, n, "Ligne droite"));
          if (t < n) P2.push(ph("recup", 60, "Marche", "Marche ou trottine.", t, n));
        }
        return { type: "lignes", titre: "Footing + lignes droites", min: footMin + 8, allure: A.facile, phases: P2, detail: `${footMin} min faciles, puis 6 accélérations de 20 s (récupération 1 min). Elles apprennent à courir vite sans se fatiguer.` };
      }
      if (phase === "affutage") {
        const n = p.obj === "10k" ? 4 : 2, eff = p.obj === "10k" ? 180 : p.obj === "semi" ? 480 : 600;
        return { type: "allure", titre: "Affûtage à allure course", min: Math.round((900 + 600 + n * eff + (n - 1) * 120) / 60), allure: raceAllure, phases: fractionne(n, eff, 120, raceAllure, "Allure course"),
          detail: `${n} × ${Math.round(eff / 60)} min à ton allure de course (${allureTxt(raceAllure)}), récupération 2 min. Le volume baisse, l'intensité reste.` };
      }
      if (phase === "specifique" && !deuxieme) {
        if (p.obj === "marathon") {
          const n = 2, eff = Math.round((12 + 8 * prog) * (fort ? 0.8 : 1)) * 60;
          return { type: "seuil", titre: "Seuil long", min: Math.round((1500 + n * eff + 180) / 60), allure: A.seuil, phases: fractionne(n, eff, 180, A.seuil, "Seuil"),
            detail: `2 × ${eff / 60} min au seuil (${allureTxt(A.seuil)}), récupération 3 min. « Confortablement difficile » : tu peux dire quelques mots.` };
        }
        const n = p.obj === "10k" ? Math.round(4 + 2 * prog) : 3, eff = p.obj === "10k" ? 240 : Math.round((10 + 5 * prog) * (fort ? 0.8 : 1)) * 60;
        return { type: "allure", titre: "Allure spécifique", min: Math.round((1500 + n * eff + (n - 1) * 120) / 60), allure: raceAllure, phases: fractionne(n, eff, 120, raceAllure, "Allure course"),
          detail: `${n} × ${Math.round(eff / 60)} min à ton allure de course (${allureTxt(raceAllure)}), récupération 2 min.` };
      }
      /* développement (et 2e séance en spécifique) : seuil et VMA en alternance */
      if ((k % 2 === 0) !== deuxieme) {
        const n = 2, eff = Math.round((8 + 6 * prog) * (fort ? 0.8 : 1)) * 60;
        return { type: "seuil", titre: "Seuil", min: Math.round((1500 + n * eff + 120) / 60), allure: A.seuil, phases: fractionne(n, eff, 120, A.seuil, "Seuil"),
          detail: `2 × ${eff / 60} min au seuil (${allureTxt(A.seuil)}), récupération 2 min. « Confortablement difficile » : tu peux dire quelques mots.` };
      }
      const n = Math.round((4 + 2 * prog) * (fort ? 0.8 : 1));
      return { type: "vma", titre: "Fractionné", min: Math.round((1500 + n * 180 + (n - 1) * 120) / 60), allure: A.vma, phases: fractionne(n, 180, 120, A.vma, "Fractionné"),
        detail: `${n} × 3 min à ${allureTxt(A.vma)}, récupération 2 min en trottinant. Dur, mais régulier : la dernière doit ressembler à la première.` };
    };

    const longue = (): SeanceCourse => {
      const avecAllure = p.obj === "marathon" && phase === "specifique" && !allegee;
      const kmAllure = avecAllure ? Math.round(long * 0.3) : 0;
      const min = Math.round((long * A.facile) / 60);
      return {
        type: "longue", titre: "Sortie longue", km: long, min, allure: A.facile,
        detail: avecAllure
          ? `${long} km, dont les ${kmAllure} derniers à allure marathon (${allureTxt(A.marathon)}). Le reste très facile. Bois et teste ton ravitaillement.`
          : `${long} km très faciles (${allureTxt(A.facile)} ou plus lent). Le but est le temps passé debout, pas la vitesse.`,
        phases: [ph("continu", min * 60, allureTxt(A.facile), "Très facile. Bois régulièrement.")],
      };
    };

    const seances: SeanceCourse[] = [];
    if (derniere) {
      seances.push(footing(), q(false));
      if (p.jours >= 4) seances.push({ ...footing(2), titre: "Footing de veille", min: 20, detail: "20 min très faciles la veille ou l'avant-veille, avec 3 lignes droites.", phases: [ph("continu", 1200, allureTxt(A.facile), "Très facile.")] });
      const prevu = tempsPrevu(V, DISTANCES[p.obj].km);
      seances.push({ type: "course", titre: `Jour J : ${DISTANCES[p.obj].nom}`, km: DISTANCES[p.obj].km, min: Math.round(prevu / 60), allure: raceAllure,
        detail: `Pars à ${allureTxt(raceAllure + 5)} sur les premiers kilomètres, puis cale-toi sur ${allureTxt(raceAllure)}. Chrono visé : ${chronoTxt(prevu)}.` });
    } else {
      const deuxQ = p.jours >= 5 && (phase === "developpement" || phase === "specifique") && !allegee && coef >= 1;
      const corps: SeanceCourse[] = [q(false), footing()];
      if (deuxQ) corps.push(q(true));
      while (corps.length < p.jours - 1) corps.push(footing(2));
      if (!aff || k < N - 1) corps.push(longue());
      seances.push(...corps.slice(0, Math.max(2, p.jours)));
    }
    /* renforcement du coureur, loin des séances dures (placé après les footings) ; pas en semaine de course */
    if (!derniere) for (let r = 0; r < Math.min(2, p.renfo); r++) seances.push({ type: "renfo", titre: "Renfo du coureur", renfo: r as 0 | 1, min: 25, detail: r === 0
      ? "Mollets, fessiers, ischios et gainage : 25 min qui protègent tendons et genoux. À placer un jour facile, pas la veille d'une séance dure."
      : "Force des jambes : charges modérées, mouvements lents et contrôlés. Un jour facile, pas la veille de la sortie longue." });
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
  if (s.douleur) { p.ajust[k + 1] = Math.min(p.ajust[k + 1] ?? 1, 0.8); return "Douleur notée : la semaine prochaine est allégée de 20 %. Si elle persiste, fais une pause et consulte."; }
  if (s.rpe >= 9) { p.ajust[k + 1] = Math.min(p.ajust[k + 1] ?? 1, 0.9); return "Séance très dure : la semaine prochaine est allégée de 10 % pour bien récupérer."; }
  return null;
}
/** Reprise après une pause : volume réduit selon la durée de l'arrêt. Renvoie le message à afficher. */
export function reprendre(p: PlanCourse, auj: string, N: number): string {
  const der = p.pauses.at(-1);
  if (!der || der.a) return "";
  der.a = auj;
  const jours = Math.round((dateDe(auj).getTime() - dateDe(der.de).getTime()) / 864e5), k = semaineDe(p, auj, N);
  if (jours < 4) return "Reprise : le plan continue normalement.";
  const c1 = jours >= 14 ? 0.6 : jours >= 7 ? 0.7 : 0.85, c2 = jours >= 14 ? 0.8 : 0.9;
  p.ajust[k] = Math.min(p.ajust[k] ?? 1, c1);
  p.ajust[k + 1] = Math.min(p.ajust[k + 1] ?? 1, c2);
  const reste = N - 1 - k;
  return `Reprise après ${jours} jours : cette semaine est réduite à ${Math.round(c1 * 100)} %, la suivante à ${Math.round(c2 * 100)} %.` +
    (jours >= 21 && reste < 6 ? " Avec si peu de temps avant la course, vise plutôt de finir que le chrono." : "");
}

/** Le plan proposé est-il raisonnable ? Message d'alerte sinon. */
export function avertissement(obj: ObjectifCourse, ref: PlanCourse["ref"], semainesDispo: number): string | null {
  const P = PROFILS[obj], deb = !ref || vdotDe({ ref }) < 38;
  if (semainesDispo < 2) return "La course est dans moins de deux semaines : il est trop tard pour une préparation, fais des footings faciles et garde de la fraîcheur.";
  if (obj === "marathon" && deb && semainesDispo < 16) return "Un premier marathon demande au moins 16 semaines quand on débute. Le plan sera prudent ; un semi-marathon serait plus sûr à cette échéance.";
  if (semainesDispo < P.nmin) return `Préparation courte (${semainesDispo} semaines au lieu de ${P.nmin} au moins) : le plan reste prudent, vise de finir plutôt qu'un chrono.`;
  return null;
}

/** Séance du plan déjà faite ? */
export const faite = (S: Sortie[], k: number, j: number) => S.some((x) => x.s === `${k}|${j}`);
/** Allure d'une sortie, en s/km. */
export const allureDe = (s: Pick<Sortie, "km" | "sec">) => (s.km > 0 ? s.sec / s.km : 0);
export const aujourdhui = () => jourDe(Date.now());

/* ---------------- renforcement du coureur ---------------- */
/** Séances de renforcement : A sans matériel (mollets, fessiers, ischios, gainage), B avec haltères si on en a. */
export function seancesRenfo(dispo: (id: string) => boolean): { nom: string; ex: ExLibre[] }[] {
  const A: ExLibre[] = [
    { id: "mol1", s: 3, r: 12, p: "60 s" }, { id: "pont1", s: 3, r: 10, p: "60 s" }, { id: "fepc", s: 3, r: 10, p: "60 s" },
    { id: "nord", s: 3, r: 5, p: "90 s" }, { id: "plat", s: 3, r: 30, p: "45 s" },
  ];
  const avecHalteres: ExLibre[] = [
    { id: "rmh", s: 3, r: 8, p: "90 s" }, { id: "bul", s: 3, r: 8, p: "90 s" }, { id: "molh", s: 3, r: 15, p: "60 s" }, { id: "gai", s: 3, r: 40, p: "45 s" },
  ];
  const sansMateriel: ExLibre[] = [
    { id: "sqpc", s: 3, r: 15, p: "60 s" }, { id: "pont", s: 3, r: 15, p: "60 s" }, { id: "mol1", s: 3, r: 15, p: "60 s" }, { id: "gai", s: 3, r: 40, p: "45 s" },
  ];
  const B = avecHalteres.every((e) => dispo(e.id)) ? avecHalteres : sansMateriel;
  return [{ nom: "Renfo coureur A", ex: A }, { nom: "Renfo coureur B", ex: B }];
}

/** Le cardio guidé et les sorties de course, ensemble : pour compter séances, minutes et régularité. */
export const avecSorties = (C: HistoCardio[] = [], S: Sortie[] = []): HistoCardio[] => [
  ...C,
  ...S.map((s) => ({ nom: "Course à pied", f: "endurance" as const, m: "tapis" as const, min: Math.round(s.sec / 60), effort: s.sec, ts: new Date(s.d + "T12:00").getTime(), run: true })),
];
