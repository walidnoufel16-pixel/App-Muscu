"use client";

import { tr } from "@/lib/i18n";
import { CalendarDotsIcon } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

/* Programme sur 8 semaines : visible mais grisé, il reviendra plus tard. */
export function ProgrammeBientot({ className, ligne = false }: { className?: string; ligne?: boolean }) {
  /* en bas de l'accueil : une ligne discrète */
  if (ligne)
    return (
      <div aria-disabled="true" className={cn("flex items-center gap-2.5 rounded-[18px] bg-muted/50 px-3.5 py-3 text-[13px] text-muted-foreground", className)}>
        <CalendarDotsIcon className="size-5 shrink-0" />
        <span className="min-w-0 flex-1">{tr("Programme sur 8 semaines")}</span>
        <span className="shrink-0 rounded-full bg-background px-2.5 py-1 text-[11.5px] font-semibold whitespace-nowrap">{tr("Bientôt disponible")}</span>
      </div>
    );
  return (
    <div aria-disabled="true" className={cn("rounded-[26px] border border-dashed border-border bg-muted/60 p-5 text-muted-foreground", className)}>
      <div className="flex items-center justify-between gap-2">
        <span className="flex items-center gap-2 text-[11.5px] font-semibold tracking-[0.12em] uppercase"><CalendarDotsIcon className="size-4" />{tr("Programme sur 8 semaines")}</span>
        <span className="shrink-0 rounded-full bg-background px-2.5 py-1 text-[11.5px] font-semibold whitespace-nowrap">{tr("Bientôt disponible")}</span>
      </div>
      <p className="mt-2 text-[14px] leading-relaxed">{tr("Un cycle complet qui fait monter l'effort semaine après semaine arrive plus tard. Pour l'instant, place aux séances libres : compose les tiennes ou laisse Repère les créer.")}</p>
    </div>
  );
}
