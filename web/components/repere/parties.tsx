"use client";

/* Titre d'une partie de séance (soin & mobilité, musculation, cardio), dans le composeur
   (avec les flèches pour la monter ou la descendre) et pendant la séance. */
import { tr } from "@/lib/i18n";
import { ArrowDownIcon, ArrowUpIcon, BarbellIcon, FirstAidKitIcon, HeartbeatIcon } from "@phosphor-icons/react";
import type { Partie } from "@/lib/logic/combinee";

export const NOM_PARTIE: Record<Partie, string> = {
  soin: tr("Soin & mobilité"),
  muscu: tr("Musculation"),
  cardio: tr("Cardio"),
};
const ICONE: Record<Partie, typeof BarbellIcon> = { soin: FirstAidKitIcon, muscu: BarbellIcon, cardio: HeartbeatIcon };

export function TitrePartie({ p, n, haut, bas }: { p: Partie; n?: number; haut?: () => void; bas?: () => void }) {
  const I = ICONE[p];
  return (
    <div className="mt-2 flex items-center gap-2 px-1 first:mt-0" data-titre-partie={p}>
      <span className="grid size-7 place-items-center rounded-[9px] bg-plate-soft text-plate-ink"><I className="size-4" weight="fill" /></span>
      <h3 className="flex-1 text-[16px] font-bold">{NOM_PARTIE[p]}{n != null && <span className="ml-1.5 text-[13px] font-medium text-muted-foreground">{n}</span>}</h3>
      {(haut || bas) && (
        <span className="flex gap-1">
          <button onClick={haut} disabled={!haut} aria-label={tr("Monter la partie {nom}", { nom: NOM_PARTIE[p] })} className="grid size-8 place-items-center rounded-full bg-muted disabled:opacity-30 active:scale-95"><ArrowUpIcon className="size-4" weight="bold" /></button>
          <button onClick={bas} disabled={!bas} aria-label={tr("Descendre la partie {nom}", { nom: NOM_PARTIE[p] })} className="grid size-8 place-items-center rounded-full bg-muted disabled:opacity-30 active:scale-95"><ArrowDownIcon className="size-4" weight="bold" /></button>
        </span>
      )}
    </div>
  );
}
