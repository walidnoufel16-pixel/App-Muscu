"use client";

/* Navigation : sens des transitions de page et pile des écrans visités.
   - On s'enfonce dans l'app : l'écran glisse vers la gauche (AVANT).
   - On revient : il glisse vers la droite. Le retour passe par l'historique
     (router.back) pour ramener exactement d'où l'on vient ; comme une
     navigation d'historique ne porte pas de type de transition, le sens est
     posé juste avant dans `useSens` et lu par la transition de l'AppShell. */
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
  [/^\/entrainement\/programme/, "Programme"],
  [/^\/entrainement\/seance/, "Séance"],
  [/^\/entrainement\/assistant/, "Créer une séance"],
  [/^\/entrainement\/composer/, "Composer"],
  [/^\/entrainement\/cardio/, "Cardio"],
  [/^\/entrainement\/course/, "Course"],
  [/^\/entrainement/, "Entraînement"],
  [/^\/exercices/, "Exercices"],
  [/^\/progres\/bilan/, "Bilan"],
  [/^\/progres/, "Progrès"],
  [/^\/profil/, "Profil"],
  [/^\/admin\/fiche/, "Fiche"],
  [/^\/admin/, "Admin"],
];
export const titreDe = (chemin: string) => TITRES.find(([r]) => r.test(chemin))?.[1] ?? "Retour";

/* Revenir jusqu'à un écran déjà visité (par exemple Entraînement après avoir
   créé une séance via l'assistant puis le composeur), en remontant l'historique
   d'autant de pas qu'il faut. Sinon, le remplacer par `repli`. */
export function revenirA(chemin: string, remplacer: () => void) {
  const pile = usePile.getState().pile;
  const i = pile.map((p) => p.split("?")[0]).lastIndexOf(chemin);
  if (i < 0 || i === pile.length - 1) { remplacer(); return; }
  useSens.setState({ sens: "nav-back" });
  const pas = pile.length - 1 - i;
  requestAnimationFrame(() => history.go(-pas));
}
