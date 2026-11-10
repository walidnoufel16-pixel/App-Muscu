/* La séance construite pour un profil : une seule fonction pour l'assistant (« Créer une séance
   pour moi »), l'aperçu de l'agenda et le bouton « Autre » du composeur, pour qu'elles donnent la
   même chose : niveau, muscles prioritaires, exercices habituels, zones à ménager, lombaires qui
   récupèrent (pas de soulevé de terre lourd), séance dense en 30 min. */
import { chargeLombaires, construireSeance, hasardDe, musclesPrioritaires } from "./assistant";
import { zonesActives, zonesDe } from "./forme";
import { prioNoms } from "./questionnaire";
import { effortsEndurance, etatGroupes } from "./recommandation";
import type { Etat, ExLibre } from "./types";

export function seancePour(E: Etat, m: string[], duree: number, obj: number, sel: string[], jour: string, rnd?: () => number): ExLibre[] {
  const A = E.A, H = E.HIST || [], zones = zonesActives(A);
  const habitudes = new Set(H.slice(-12).flatMap((l) => Object.keys(l.ex)));
  const lombaires = !etatGroupes(H, jour, effortsEndurance(E.SORTIES, E.CARDIO, A.avant)).lom.recupere;
  return construireSeance(m, duree, obj, sel, rnd ?? hasardDe(`${jour}|${m.join(",")}|${duree}|${obj}|${sel.join(",")}`),
    (o) => zonesDe(o, zones).length > 0 || (lombaires && chargeLombaires(o)), A.regularite,
    { prio: musclesPrioritaires(prioNoms(A)), habitudes, dense: duree === 30 });
}
