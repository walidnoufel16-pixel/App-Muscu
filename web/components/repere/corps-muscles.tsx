"use client";

/* Muscles ciblés par un exercice, en miniature à droite du titre de la fiche : le corps de face et de
   dos, le muscle principal en couleur foncée, les secondaires en couleur claire (musclesCibles), le
   reste du corps clair en thème sombre et sombre en thème clair. Rien pour un exercice sans zone
   (cardio, mobilité, soin). */
import { tr } from "@/lib/i18n";
import { EX } from "@/lib/data/exercices";
import { CORPS, CORPS_F, CORPS_VB, CORPS_VB_F } from "@/lib/data/corps";
import { musclesCibles } from "@/lib/logic/muscles-cibles";

const PRINCIPAL = "color-mix(in oklab, var(--plate) 55%, black)";
const SECONDAIRE = "var(--plate)";
const NEUTRE = "color-mix(in oklab, var(--foreground) 72%, var(--background))";

export function CorpsMuscles({ id, femme, h = 92 }: { id: string; femme?: boolean; h?: number }) {
  const x = EX[id];
  const C = femme ? CORPS_F : CORPS, VB = femme ? CORPS_VB_F : CORPS_VB;
  if (!x || !C.front.concat(C.back).some((r) => r.p === x.pat)) return null;
  const M = musclesCibles(id)!;
  const couleur = (r: (typeof C.front)[number]) => (M.principal(r) ? PRINCIPAL : M.secondaire(r) ? SECONDAIRE : NEUTRE);
  return (
    <span className="flex shrink-0 gap-0.5" role="img" aria-label={tr("Muscles ciblés")}>
      {(["front", "back"] as const).map((cote) => (
        <svg key={cote} viewBox={VB[cote]} style={{ height: h }} className="w-auto">
          {C[cote].map((r) => (
            <path key={r.i} d={r.d} style={{ fill: couleur(r) }} className="stroke-background [stroke-width:1px] [vector-effect:non-scaling-stroke]" />
          ))}
        </svg>
      ))}
    </span>
  );
}
