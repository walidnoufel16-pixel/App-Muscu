"use client";

import { useState } from "react";
import { CaretDownIcon, InfoIcon, XIcon } from "@phosphor-icons/react";
import { tr } from "@/lib/i18n";
import { tactile } from "@/lib/repos";
import type { RoleEx } from "@/lib/logic/types";
import { cn } from "@/lib/utils";

/* Place d'un exercice dans une séance : pourquoi il vient à ce moment-là (phrases revues par le coach). */
const ROLES: Record<RoleEx, { n: () => string; pourquoi: () => string }> = {
  b: { n: () => tr("Base"), pourquoi: () => tr("Plusieurs muscles à la fois, la charge la plus lourde : à faire en premier, quand tu es frais.") },
  c: { n: () => tr("Complément"), pourquoi: () => tr("Un autre mouvement lourd pour le même muscle, sous un autre angle : après la base.") },
  i: { n: () => tr("Isolation"), pourquoi: () => tr("Un seul muscle, une charge plus légère : pour finir le travail.") },
  g: { n: () => tr("Gainage"), pourquoi: () => tr("Abdos et bas du dos : en fin de séance, pour ne pas les fatiguer avant.") },
};
export const nomRole = (ro: RoleEx) => ROLES[ro].n();
export const pourquoiRole = (ro: RoleEx) => ROLES[ro].pourquoi();

/* L'étiquette se touche pour lire sa phrase ; posée dans le bouton qui déplie la carte, elle ne le déclenche pas. */
export function EtiquetteRole({ ro, ouvert, onToggle, className }: { ro?: RoleEx; ouvert?: boolean; onToggle?: () => void; className?: string }) {
  if (!ro || !ROLES[ro]) return null;
  const basculer = (ev: React.SyntheticEvent) => { ev.stopPropagation(); ev.preventDefault(); tactile(4); onToggle?.(); };
  return (
    <span
      role={onToggle ? "button" : undefined} tabIndex={onToggle ? 0 : undefined} aria-expanded={onToggle ? !!ouvert : undefined}
      aria-label={onToggle ? tr("{n} : pourquoi à cette place", { n: nomRole(ro) }) : undefined}
      onClick={onToggle ? basculer : undefined} onKeyDown={onToggle ? (ev) => { if (ev.key === "Enter" || ev.key === " ") basculer(ev); } : undefined}
      className={cn("inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[10.5px] font-semibold", ouvert ? "bg-foreground text-background" : "bg-muted text-muted-foreground", onToggle && "cursor-pointer active:scale-95", className)}
    >
      {nomRole(ro)}{onToggle && <InfoIcon className="size-3" weight="bold" />}
    </span>
  );
}

/* la phrase de l'étiquette, sous l'en-tête de la carte, avec de quoi la refermer */
export function PourquoiRole({ ro, onFermer, className }: { ro?: RoleEx; onFermer?: () => void; className?: string }) {
  if (!ro || !ROLES[ro]) return null;
  return (
    <div className={cn("animate-in fade-in-0 flex items-start gap-2 rounded-xl bg-muted/70 px-3 py-2 text-[12.5px] leading-snug", className)}>
      <p className="flex-1 text-muted-foreground"><span className="font-semibold text-foreground">{nomRole(ro)}</span>{" · "}{pourquoiRole(ro)}</p>
      {onFermer && (
        <button onClick={(ev) => { ev.stopPropagation(); onFermer(); }} aria-label={tr("Fermer")} className="-m-1 grid size-6 shrink-0 place-items-center text-muted-foreground"><XIcon className="size-3.5" weight="bold" /></button>
      )}
    </div>
  );
}

/* Une explication repliée : « ⓘ Pourquoi 14 kg ? », touchée pour la lire. */
export function Pourquoi({ titre, children, className }: { titre: string; children: React.ReactNode; className?: string }) {
  const [vu, setVu] = useState(false);
  return (
    <div className={className}>
      <button onClick={() => { tactile(4); setVu(!vu); }} aria-expanded={vu} className="flex items-center gap-1.5 text-[13px] font-semibold text-plate-ink dark:text-plate">
        <InfoIcon className="size-4" />{titre}<CaretDownIcon className={cn("size-3.5 transition-transform", vu && "rotate-180")} weight="bold" />
      </button>
      {vu && <p className="animate-in fade-in-0 mt-1 pl-5.5 text-[13px] leading-snug text-muted-foreground">{children}</p>}
    </div>
  );
}
