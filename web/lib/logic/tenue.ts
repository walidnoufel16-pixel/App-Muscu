/* Exercice tenu en durée (gainage, étirements) : 10 s pour se mettre en place avant le chrono ;
   tenu côté par côté, 5 s pour changer de côté entre la gauche et la droite. */
export const PREPA = 10, CHANGE = 5;

/** Temps tenu (par côté) d'après le temps écoulé du chrono, préparation comprise.
    Côté par côté, c'est le côté le moins tenu qui compte ; arrêté avant le côté droit, la gauche. */
export function tempsTenu(cible: number, ecoule: number, cote?: boolean) {
  const gauche = Math.min(cible, ecoule - PREPA);
  if (!cote) return Math.max(1, Math.round(gauche));
  const droite = Math.min(cible, ecoule - PREPA - cible - CHANGE);
  return Math.max(1, Math.round(droite > 0 ? Math.min(gauche, droite) : gauche));
}
