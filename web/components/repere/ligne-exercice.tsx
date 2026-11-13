"use client";

import { tr } from "@/lib/i18n";
import { CheckIcon, PlusIcon } from "@phosphor-icons/react";
import { EX } from "@/lib/data/exercices";
import { Vignette } from "./exercice-carte";
import { EtiquetteRole } from "./role-exercice";
import type { RoleEx } from "@/lib/logic/types";
import { cn } from "@/lib/utils";

/* Ligne de bibliothèque : le corps ouvre la fiche, le bouton ajoute ; `ro` : son rôle (Base, Complément…). */
export function LigneExercice({ id, onOuvrir, onAjouter, pris, ro }: { id: string; onOuvrir: () => void; onAjouter?: () => void; pris?: boolean; ro?: RoleEx }) {
  const x = EX[id];
  return (
    <div className={cn("flex items-center rounded-[18px] border border-border/80 bg-card transition-opacity", pris && "opacity-50")}>
      <button onClick={onOuvrir} className="flex min-w-0 flex-1 items-center gap-3 p-2.5 text-left">
        <Vignette id={id} className="size-12 rounded-[12px]" />
        <span className="min-w-0">
          {/* le nom en entier (deux lignes au plus) ; l'étiquette passe sur la ligne des muscles */}
          <span className="line-clamp-2 text-[15px] leading-tight font-semibold">{x.n}</span>
          <span className="flex min-w-0 items-center gap-1.5 text-[12.5px] text-muted-foreground"><span className="min-w-0 truncate">{x.m}</span><EtiquetteRole ro={ro} /></span>
        </span>
      </button>
      {onAjouter && (
        <button
          onClick={onAjouter}
          disabled={pris}
          aria-label={pris ? tr("Déjà dans ta séance") : tr("Ajouter ") + x.n}
          className="mr-2.5 grid size-9 shrink-0 place-items-center rounded-full bg-muted text-foreground active:scale-90 disabled:bg-transparent"
        >
          {pris ? <CheckIcon className="size-4" weight="bold" /> : <PlusIcon className="size-4" weight="bold" />}
        </button>
      )}
    </div>
  );
}
