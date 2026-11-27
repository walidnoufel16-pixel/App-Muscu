/* Admin › Visiteurs (27/11/2026) : la lecture des événements anonymes d'un appareil (admin_visiteurs,
   admin_visiteur, migration 20261127180000_suivi_visiteurs.sql) en phrases. Réservé à l'admin, en
   français seulement. Logique pure. */

export type ProprietesEv = Record<string, string | number | boolean>;
export type EvenementVisiteur = { nom: string; props: ProprietesEv | null; h: string };
export type ResumeVisiteur = {
  appareil: string; premier: string; dernier: string; jours: number; ecrans: number; temps: number; clics: number;
  formulaire: boolean; compte: boolean; prete: boolean; serie: boolean; seances: number;
  ouverture: ProprietesEv | null; dernier_ecran: string | null;
};

const ECRANS: [RegExp, string][] = [
  [/^\/bienvenue\/accueil$/, "Page d'accueil (vitrine)"],
  [/^\/bienvenue\/compte$/, "Formulaire d'inscription"],
  [/^\/bienvenue\/(recup|code)$/, "Retrouver son compte"],
  [/^\/bienvenue\/confirmer$/, "Confirmer son adresse"],
  [/^\/bienvenue$/, "Bienvenue"],
  [/^\/?$/, "Démarrage"],
  [/^\/entrainement$/, "Accueil Séances"],
  [/^\/entrainement\/composer$/, "Création de séance"],
  [/^\/entrainement\/seance$/, "Séance en cours"],
  [/^\/entrainement\/rubrique$/, "Mes séances"],
  [/^\/entrainement\/assistant$/, "Choix des muscles"],
  [/^\/entrainement\/agenda$/, "Agenda"],
  [/^\/entrainement\//, "Entraînement"],
  [/^\/repas$/, "Repas"],
  [/^\/progres/, "Progrès"],
  [/^\/profil$/, "Profil"],
  [/^\/compte$/, "Compte"],
  [/^\/exercices$/, "Exercices"],
  [/^\/(en\/)?blog/, "Blog"],
  [/^\/(en\/)?guides/, "Guides"],
  [/^\/questionnaire$/, "Questionnaire Oxa Plan"],
  [/^\/admin/, "Admin"],
];
/** Le nom d'un écran d'après son adresse (l'adresse elle-même s'il n'est pas connu). */
export const nomEcran = (p: string | null | undefined) => (p ? ECRANS.find(([r]) => r.test(p))?.[1] ?? p : "—");

/** « 42 s », « 3 min 05 », « 1 h 12 » */
export function duree(s: number): string {
  if (!Number.isFinite(s) || s < 60) return `${Math.max(0, Math.round(s || 0))} s`;
  if (s < 3600) return `${Math.floor(s / 60)} min ${String(Math.round(s % 60)).padStart(2, "0")}`;
  return `${Math.floor(s / 3600)} h ${String(Math.floor((s % 3600) / 60)).padStart(2, "0")}`;
}

const APPAREILS: Record<string, string> = { iphone: "iPhone", ipad: "iPad", android: "Android", tablette: "Tablette Android", ordinateur: "Ordinateur" };
/** D'où il vient et sur quoi : « TikTok · iPhone · app installée ». */
export function provenance(o: ProprietesEv | null | undefined): string {
  if (!o) return "Provenance inconnue";
  const src = o.src ? String(o.src) : o.ref ? String(o.ref) : "Accès direct";
  const l = [src.charAt(0).toUpperCase() + src.slice(1)];
  if (o.dev) l.push(APPAREILS[String(o.dev)] ?? String(o.dev));
  if (o.app === true) l.push("app installée");
  return l.join(" · ");
}

/** Jusqu'où il est allé : la dernière étape franchie du parcours d'arrivée. */
export function etapeVisiteur(v: Pick<ResumeVisiteur, "formulaire" | "compte" | "prete" | "serie" | "seances">): { n: number; texte: string } {
  if (v.seances >= 2) return { n: 6, texte: `${v.seances} séances terminées` };
  if (v.seances === 1) return { n: 5, texte: "Séance terminée" };
  if (v.serie) return { n: 4, texte: "Première série notée" };
  if (v.prete) return { n: 3, texte: "Séance créée" };
  if (v.compte) return { n: 2, texte: "Compte créé" };
  if (v.formulaire) return { n: 1, texte: "Formulaire ouvert, pas de compte" };
  return { n: 0, texte: "Parti sans s'inscrire" };
}

/** Une ligne du parcours : ce qui s'est passé, en clair. */
export function phraseEvenement(e: EvenementVisiteur): { texte: string; detail?: string; fort?: boolean } {
  const p = e.props ?? {};
  switch (e.nom) {
    case "ouverture": return { texte: p.nouveau ? "Première visite" : "Revient sur l'app", detail: provenance(p), fort: true };
    case "ecran": return { texte: nomEcran(String(p.p ?? "")), detail: [duree(Number(p.s) || 0), p.dfl != null && Number(p.dfl) < 100 ? `défilé ${p.dfl} %` : null].filter(Boolean).join(" · ") };
    case "clic": return { texte: `Touche « ${p.l ?? "?"} »`, detail: nomEcran(String(p.p ?? "")) };
    case "compte_cree": return { texte: "Compte créé", detail: p.mail ? "avec une adresse e-mail" : "sans adresse e-mail", fort: true };
    case "chemin_choisi": return { texte: "Parcours choisi", detail: String(p.c ?? "") };
    case "visite_finie": return { texte: "Visite guidée terminée" };
    case "seance_prete": return { texte: "Séance créée", fort: true };
    case "seance_programmee": return { texte: "Séance programmée", detail: p.j != null ? `dans ${p.j} j` : undefined };
    case "premiere_serie": return { texte: "Première série notée", fort: true };
    case "seance_terminee": return { texte: "Séance terminée", fort: true };
    case "seance_arretee": return { texte: "Séance arrêtée" };
    case "rubrique_ouverte": return { texte: "Rubrique ouverte", detail: String(p.r ?? "") };
    case "plan_genere": return { texte: "Programme Oxa Plan créé", fort: true };
    case "repas_note": return { texte: "Repas noté" };
    default: return { texte: e.nom };
  }
}
