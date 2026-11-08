"use client";

/* Muscles ciblés par un exercice, en miniature à droite du titre de la fiche : le corps de face et de
   dos, le muscle principal en turquoise vif, les secondaires en turquoise foncé (musclesCibles), le
   reste du corps clair en thème sombre et sombre en thème clair. La toucher l'ouvre en grand, sur
   fond noir, avec le nom des muscles (comme une machine de Ma salle). Rien pour un exercice sans zone
   (cardio, mobilité, soin). */
import { tr } from "@/lib/i18n";
import { useState } from "react";
import { XIcon } from "@phosphor-icons/react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { EX } from "@/lib/data/exercices";
import { CORPS, CORPS_F, CORPS_VB, CORPS_VB_F } from "@/lib/data/corps";
import { musclesCibles } from "@/lib/logic/muscles-cibles";
import { tactile } from "@/lib/repos";

/* principal : le turquoise vif de la marque, qui attire l'œil ; secondaires : un turquoise plus foncé */
const PRINCIPAL = "var(--plate)";
const SECONDAIRE = "color-mix(in oklab, var(--plate) 55%, black)";
const NEUTRE = "color-mix(in oklab, var(--foreground) 72%, var(--background))";
/* en grand, toujours sur fond noir : corps clair */
const NEUTRE_NOIR = "rgb(255 255 255 / 0.78)";

type Zone = (typeof CORPS.front)[number];

function Silhouettes({ id, femme, h, neutre, trait }: { id: string; femme?: boolean; h: number | string; neutre: string; trait: string }) {
  const C = femme ? CORPS_F : CORPS, VB = femme ? CORPS_VB_F : CORPS_VB, M = musclesCibles(id)!;
  const couleur = (r: Zone) => (M.principal(r) ? PRINCIPAL : M.secondaire(r) ? SECONDAIRE : neutre);
  return (
    <>
      {(["front", "back"] as const).map((cote) => (
        <svg key={cote} viewBox={VB[cote]} style={{ height: h }} className="w-auto">
          {C[cote].map((r) => (
            <path key={r.i} d={r.d} style={{ fill: couleur(r), stroke: trait }} className="[stroke-width:1px] [vector-effect:non-scaling-stroke]" />
          ))}
        </svg>
      ))}
    </>
  );
}

/** Noms des zones touchées (« Pectoraux », « Triceps »…), sans doublon, dans l'ordre du schéma. */
const nomsDe = (femme: boolean | undefined, test: (z: Zone) => boolean) => {
  const C = femme ? CORPS_F : CORPS;
  return [...new Set(C.front.concat(C.back).filter((z) => z.n && test(z)).map((z) => tr(z.n!.split(",")[0])))];
};

export function CorpsMuscles({ id, femme, h = 92 }: { id: string; femme?: boolean; h?: number }) {
  const [grand, setGrand] = useState(false);
  const x = EX[id];
  const C = femme ? CORPS_F : CORPS;
  if (!x || !C.front.concat(C.back).some((r) => r.p === x.pat)) return null;
  const M = musclesCibles(id)!;
  const principaux = nomsDe(femme, M.principal), secondaires = nomsDe(femme, M.secondaire);
  return (
    <>
      <button type="button" onClick={() => { tactile(5); setGrand(true); }} aria-label={tr("Muscles ciblés : voir en grand")}
        className="flex shrink-0 gap-0.5 rounded-xl active:scale-95">
        <Silhouettes id={id} femme={femme} h={h} neutre={NEUTRE} trait="var(--background)" />
      </button>
      <Dialog open={grand} onOpenChange={setGrand}>
        <DialogContent showCloseButton={false} onClick={() => setGrand(false)}
          className="flex h-dvh max-h-dvh w-screen max-w-none flex-col items-center justify-center gap-4 rounded-none border-0 bg-black/95 p-4 text-white shadow-none sm:max-w-none">
          <DialogTitle className="sr-only">{tr("Muscles ciblés")}</DialogTitle>
          <DialogDescription className="sr-only">{tr("Schéma du corps en grand. Touche la croix pour le fermer.")}</DialogDescription>
          <button onClick={(e) => { e.stopPropagation(); setGrand(false); }} aria-label={tr("Fermer")} autoFocus
            className="absolute top-[max(env(safe-area-inset-top),14px)] right-4 grid size-11 place-items-center rounded-full bg-white/15 text-white backdrop-blur active:scale-90">
            <XIcon className="size-5" weight="bold" />
          </button>
          <p className="text-center text-[18px] font-semibold">{x.n}</p>
          <span className="flex max-w-full justify-center gap-3">
            <Silhouettes id={id} femme={femme} h="min(56dvh, 70vw)" neutre={NEUTRE_NOIR} trait="black" />
          </span>
          <div className="flex flex-col items-center gap-1.5 text-center text-[14.5px]">
            <span><i className="mr-2 inline-block size-3 rounded-full align-[-1px]" style={{ background: PRINCIPAL }} />{tr("Principal")}{" · "}<span className="text-white/75">{principaux.join(", ")}</span></span>
            {secondaires.length > 0 && (
              <span><i className="mr-2 inline-block size-3 rounded-full align-[-1px]" style={{ background: SECONDAIRE }} />{tr("Secondaires")}{" · "}<span className="text-white/75">{secondaires.join(", ")}</span></span>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
