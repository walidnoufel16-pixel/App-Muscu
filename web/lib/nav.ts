"use client";

/* Navigation : sens des transitions de page et pile des écrans visités.
   - On s'enfonce dans l'app : l'écran glisse vers la gauche (AVANT).
   - On revient : il glisse vers la droite. Le retour passe par l'historique
     (router.back) pour ramener exactement d'où l'on vient ; comme une
     navigation d'historique ne porte pas de type de transition, le sens est
     posé juste avant dans `useSens` et lu par la transition de l'AppShell. */
import { tr } from "@/lib/i18n";
import { create } from "zustand";

export const AVANT = { transitionTypes: ["nav-forward"] };
export const ARRIERE = { transitionTypes: ["nav-back"] };
export const AVANT_T = ["nav-forward"];

export const useSens = create<{ sens: "nav-back" | null }>(() => ({ sens: null }));

/* Écrans visités, du plus ancien au plus récent : sert au libellé et au
   comportement du bouton retour. */
type Pile = { pile: string[]; remplace: boolean; noter: (p: string) => void };
export const usePile = create<Pile>((set, get) => ({
  pile: [],
  remplace: false,
  noter(p) {
    const l = get().pile;
    if (get().remplace) { set({ pile: [...l.slice(0, -1), p], remplace: false }); return; }
    if (l[l.length - 1] === p) return;
    if (l[l.length - 2] === p) set({ pile: l.slice(0, -1) }); // retour
    else set({ pile: [...l.slice(-19), p] });
  },
}));

/* À appeler juste avant un router.replace : l'écran courant est remplacé dans la pile, pas empilé. */
export const remplacement = () => usePile.setState({ remplace: true });

const TITRES: [RegExp, string][] = [
  [/^\/entrainement\/programme/, tr("Programme")],
  [/^\/entrainement\/rubrique\?v=libre/, tr("Séance libre")],
  [/^\/entrainement\/rubrique\?v=programme/, tr("Programme")],
  [/^\/entrainement\/rubrique\?v=street/, tr("Street workout")],
  [/^\/entrainement\/rubrique\?v=course/, tr("Course")],
  [/^\/entrainement\/rubrique\?v=soin/, tr("Soin & mobilité")],
  [/^\/entrainement\/seance/, tr("Séance")],
  [/^\/entrainement\/assistant/, tr("Créer une séance")],
  [/^\/entrainement\/composer/, tr("Composer")],
  [/^\/entrainement\/cardio/, tr("Cardio")],
  [/^\/entrainement\/course/, tr("Course")],
  [/^\/entrainement/, tr("Entraînement")],
  [/^\/progres\/bilan/, tr("Bilan")],
  [/^\/progres/, tr("Progrès")],
  [/^\/profil/, tr("Profil")],
  [/^\/admin\/fiche/, tr("Fiche")],
  [/^\/admin/, tr("Admin")],
];
export const titreDe = (chemin: string) => TITRES.find(([r]) => r.test(chemin))?.[1] ?? tr("Retour");

/* Revenir jusqu'à un écran déjà visité (par exemple Entraînement après avoir
   créé une séance via l'assistant puis le composeur), en remontant l'historique
   d'autant de pas qu'il faut. Sinon, le remplacer par `repli`. */
export function revenirA(chemin: string, remplacer: () => void) {
  const pile = usePile.getState().pile;
  const i = pile.map((p) => p.split("?")[0]).lastIndexOf(chemin);
  if (i < 0 || i === pile.length - 1) { remplacer(); return; }
  useSens.setState({ sens: "nav-back" });
  const pas = pile.length - 1 - i;
  /* la pile reprend là où on revient : l'écran d'arrivée est déjà en haut, `noter` ne l'empile pas une seconde fois */
  usePile.setState({ pile: pile.slice(0, i + 1) });
  requestAnimationFrame(() => history.go(-pas));
}

/* Position de défilement de la page d'accueil de chaque onglet, le temps de la session :
   comme sur iOS, on retrouve un onglet là où on l'avait laissé. */
const positions: Record<string, number> = {};
export const noterPosition = (chemin: string, y: number) => { positions[chemin] = y; };
export const oublierPosition = (chemin: string) => { delete positions[chemin]; };
export const positionDe = (chemin: string): number | undefined => positions[chemin];

/* Dernier onglet ouvert dans chaque rubrique d'Entraînement (muscle, zone de soin…), le temps de la session. */
export const useOngletsExercices = create<Record<string, string>>(() => ({}));


/* Vue de l'onglet Repas : aujourd'hui (par défaut), recettes, courses. */
export type VueRepas = "jour" | "recettes" | "courses";
export const useVueRepas = create<{ vue: VueRepas }>(() => ({ vue: "jour" }));

/* Menu latéral (☰) et les feuilles qu'il ouvre ailleurs : import d'une séance, installation de l'app. */
export const useMenu = create<{ ouvert: boolean; importer: boolean; installer: boolean }>(() => ({ ouvert: false, importer: false, installer: false }));
