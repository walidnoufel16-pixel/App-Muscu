"use client";

import { CheckIcon, PlusIcon } from "@phosphor-icons/react";
import { EX } from "@/lib/data/exercices";
import { Vignette } from "./exercice-carte";
import { cn } from "@/lib/utils";

/* Ligne de bibliothèque : le corps ouvre la fiche, le bouton ajoute. */
export function LigneExercice({ id, onOuvrir, onAjouter, pris }: { id: string; onOuvrir: () => void; onAjouter?: () => void; pris?: boolean }) {
  const x = EX[id];
  return (
    <div className={cn("flex items-center rounded-[18px] border border-border/80 bg-card transition-opacity", pris && "opacity-50")}>
      <button onClick={onOuvrir} className="flex min-w-0 flex-1 items-center gap-3 p-2.5 text-left">
        <Vignette id={id} className="size-12 rounded-[12px]" />
        <span className="min-w-0">
          <span className="block truncate text-[15px] font-semibold">{x.n}</span>
          <span className="block truncate text-[12.5px] text-muted-foreground">{x.m}</span>
        </span>
      </button>
      {onAjouter && (
        <button
          onClick={onAjouter}
          disabled={pris}
          aria-label={pris ? "Déjà dans ta séance" : "Ajouter " + x.n}
          className="mr-2.5 grid size-9 shrink-0 place-items-center rounded-full bg-muted text-foreground active:scale-90 disabled:bg-transparent"
        >
          {pris ? <CheckIcon className="size-4" weight="bold" /> : <PlusIcon className="size-4" weight="bold" />}
        </button>
      )}
    </div>
  );
}
