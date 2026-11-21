/* Mode démonstration (visites guidées « Ta séance » et « Créer ta séance » lancées depuis le menu) :
   l'app fonctionne normalement, mais en bac à sable. Pendant la démo, rien n'est écrit sur le
   téléphone ni envoyé au compte, rien n'est mesuré ; à la sortie, l'état d'avant revient tel quel.
   Si l'app est fermée pendant la démo, il n'y a rien à nettoyer : rien n'a été enregistré. */
let actif = false;
export const enDemo = () => actif;
export const marquerDemo = (v: boolean) => { actif = v; };
