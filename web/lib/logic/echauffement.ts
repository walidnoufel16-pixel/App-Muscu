/* Échauffement construit à partir des exercices de la séance : mise en route, mobilité des
   zones travaillées, activation des mouvements principaux, puis séries d'approche sur le
   premier exercice chargé. L'effort se dit en clair, sans nombre de répétitions : chacun
   s'arrête bien avant que ça devienne dur. */
import { tr } from "@/lib/i18n";
import { EX } from "@/lib/data/exercices";
import { estSoin } from "@/lib/data/soin";
import type { Etape } from "@/lib/data/types";

type Famille = "pousse" | "tire" | "cuisses" | "hanches" | "tronc";
const FAMILLE: Record<string, Famille> = {
  ph: "pousse", pv: "pousse", ep: "pousse", ec: "pousse",
  tv: "tire", th: "tire", re: "tire", fc: "tire", tra: "tire", avb: "tire",
  eg: "cuisses", add: "cuisses", mol: "cuisses",
  fh: "hanches", lo: "hanches",
  ae: "tronc", ft: "tronc",
};

/* [étape, minutes] */
type Pas = [Etape, number];
const FACILE = () => tr("Effort facile : arrête-toi bien avant que ça devienne dur.");
const TRES_FACILE = () => tr("Effort très facile : tu pourrais en faire deux fois plus.");

const MOBILITE: Record<Famille, () => Pas[]> = {
  pousse: () => [[[tr("Étirement du chat"), tr("1 min"), "tho", tr("À quatre pattes, arrondis puis creuse lentement le dos en respirant. Ça libère le haut du dos avant les poussées.")], 1]],
  tire: () => [[[tr("Cercles de bras"), tr("1 min"), "cbras", tr("Petits cercles puis de plus en plus grands, vers l'avant puis vers l'arrière.")], 1]],
  cuisses: () => [[[tr("Fléchisseurs de hanche"), tr("30 s par côté"), "hip", tr("Un genou au sol, avance doucement le bassin sans cambrer. Une hanche ouverte laisse le squat descendre.")], 1]],
  hanches: () => [[[tr("Cercles de hanche"), tr("1 min"), "chq", tr("À quatre pattes, de grands cercles lents avec chaque genou.")], 1]],
  tronc: () => [[[tr("Étirement du chat"), tr("1 min"), "tho", tr("À quatre pattes, arrondis puis creuse lentement le dos en respirant.")], 1]],
};

const ACTIVATION: Record<Famille, (pv: boolean) => Pas> = {
  pousse: (pv) => pv
    ? [[tr("Développé très léger"), tr("2 × 30 s"), null, tr("Barre à vide, haltères très légers ou simplement les bras, au-dessus de la tête. {e}", { e: TRES_FACILE() })], 2]
    : [[tr("Pompes d'activation"), tr("2 × 30 s"), "pompi", tr("Mains sur un banc, ou au sol si c'est facile pour toi, en descendant lentement. {e}", { e: FACILE() })], 2],
  tire: () => [[tr("Face pull léger"), tr("2 × 30 s"), "fp", tr("Poulie ou élastique très léger, coudes hauts, omoplates serrées. {e}", { e: TRES_FACILE() })], 2],
  cuisses: () => [[tr("Squats d'activation"), tr("2 × 30 s"), "sqpc", tr("Au poids du corps, à une profondeur confortable ; tiens-toi à un support si besoin. {e}", { e: FACILE() })], 2],
  hanches: () => [[tr("Pont fessier"), tr("2 × 30 s"), "pont", tr("Au sol, monte les hanches et serre les fessiers une seconde en haut. {e}", { e: FACILE() })], 2],
  tronc: () => [[tr("Dead bug"), tr("1 min"), "dbug", tr("Bas du dos collé au sol, allonge lentement le bras et la jambe opposés. {e}", { e: FACILE() })], 1],
};

/** Étapes et durée totale (en minutes) de l'échauffement d'une séance. */
export function echauffementDe(ids: string[]): { min: number; l: Etape[] } {
  const muscu = ids.filter((id) => EX[id] && !estSoin(id) && FAMILLE[EX[id].pat]);
  const pas: Pas[] = [];
  if (!muscu.length) {
    /* séance de soin ou de cardio : une mise en route douce suffit */
    pas.push([[tr("Mise en route"), tr("3 min"), null, tr("Marche, vélo ou mouvements amples des bras et des jambes. Effort très facile : juste de quoi te réchauffer.")], 3]);
    return fin(pas);
  }
  pas.push([[tr("Mise en route"), tr("5 min"), null, tr("Rameur, vélo, corde à sauter ou marche rapide. Effort facile : tu peux parler sans être essoufflé, et tu commences à avoir chaud.")], 5]);

  /* les deux familles de mouvements les plus présentes, à égalité dans l'ordre de la séance */
  const n = new Map<Famille, number>();
  muscu.forEach((id) => { const f = FAMILLE[EX[id].pat]; n.set(f, (n.get(f) ?? 0) + 1); });
  const ordre = [...n.keys()];
  const principales = ordre.sort((a, b) => n.get(b)! - n.get(a)! || ordre.indexOf(a) - ordre.indexOf(b)).slice(0, 2);

  const vus = new Set<string | null>();
  for (const f of principales) for (const p of MOBILITE[f]()) if (!vus.has(p[0][2])) { vus.add(p[0][2]); pas.push(p); }
  const pv = muscu.some((id) => EX[id].pat === "pv") && !muscu.some((id) => EX[id].pat === "ph");
  for (const f of principales) pas.push(ACTIVATION[f](pv));

  /* séries d'approche : sur le premier exercice chargé, sinon une série facile du premier exercice */
  const charge = muscu.find((id) => EX[id].ch === "kg" || EX[id].ch === "lest");
  if (charge) pas.push([[tr("Séries d'approche"), tr("3 min"), charge, tr("Sur « {nom} » : 2 ou 3 séries de plus en plus lourdes avant ta première vraie série. Toutes restent faciles : peu de répétitions, aucune fatigue.", { nom: EX[charge].n })], 3]);
  else pas.push([[tr("Série d'approche"), tr("1 min"), muscu[0], tr("Une série courte de « {nom} », dans une version plus facile si besoin. {e}", { nom: EX[muscu[0]].n, e: TRES_FACILE() })], 1]);
  return fin(pas);
}

const fin = (pas: Pas[]) => ({ min: pas.reduce((s, p) => s + p[1], 0), l: pas.map((p) => p[0]) });
