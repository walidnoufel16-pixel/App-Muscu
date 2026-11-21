"use client";

/* Visite de la séance (20/11/2026) : à la première séance lancée sur l'appareil, 5 bulles posées sur
   la vraie séance, pour qu'on n'ait rien à deviner : noter sa série, la valider (le repos démarre),
   ajuster le repos, remplacer un exercice, ouvrir sa fiche. Un repère absent (exercice sans
   alternative, séance déjà finie…) est sauté. Une seule fois (repere.visite.seance) ; « Passer »
   l'arrête ; menu ☰ › « Revoir la visite de la séance » la remet pour la prochaine séance. */
import { tr } from "@/lib/i18n";
import { useEffect, useState } from "react";
import { Bulle, useVisite, type BulleDef } from "./visite";

const CLE = "repere.visite.seance";
const vue = () => { try { return !!localStorage.getItem(CLE); } catch { return true; } };
const marquer = () => { try { localStorage.setItem(CLE, String(Date.now())); } catch {} };
/** Elle se remontrera au début de la prochaine séance. */
export const revoirVisiteSeance = () => { try { localStorage.removeItem(CLE); } catch {} };

const BULLES: BulleDef[] = [
  { cible: "seance-serie", k: () => tr("Ta séance"), t: () => tr("Note ta série"), d: () => tr("Oxa propose la charge et les répétitions. Touche un chiffre pour mettre ce que tu fais vraiment.") },
  { cible: "seance-valider", k: () => tr("Ta séance"), t: () => tr("Valide-la"), d: () => tr("Une fois la série faite, coche-la : le minuteur de repos se lance tout seul.") },
  { cible: "seance-repos", k: () => tr("Ta séance"), t: () => tr("Ajuste ton repos"), d: () => tr("Pendant le repos, touche le chiffre du minuteur pour ajouter ou retirer 15 s, ou passe-le si tu es prêt.") },
  { cible: "seance-remplacer", k: () => tr("Ta séance"), t: () => tr("Remplace un exercice"), d: () => tr("Machine prise ou matériel absent ? Oxa te propose un exercice pour le même muscle, sans changer tes séries.") },
  { cible: "seance-fiche", k: () => tr("Ta séance"), t: () => tr("Regarde comment faire"), d: () => tr("Touche la photo : la fiche montre le mouvement, l'animation départ et fin, et les conseils.") },
];

export function VisiteSeance() {
  const [i, setI] = useState<number | null>(null);
  /* jamais par-dessus la visite générale */
  const general = useVisite((s) => s.etape !== null);
  useEffect(() => {
    if (vue() || general) return;
    /* le temps que la séance s'affiche */
    const t = setTimeout(() => setI(0), 900);
    return () => clearTimeout(t);
  }, [general]);
  if (i == null || i >= BULLES.length) return null;
  const fin = () => { marquer(); setI(null); };
  const suivant = () => (i + 1 >= BULLES.length ? fin() : setI(i + 1));
  return (
    <Bulle key={i} b={BULLES[i]} i={i + 1} total={BULLES.length} onSuivant={suivant} onPasser={fin}
      bouton={i + 1 === BULLES.length ? tr("C'est parti") : undefined} />
  );
}
