"use client";

import { tr } from "@/lib/i18n";
import type { RoleEx } from "@/lib/logic/types";
import { cn } from "@/lib/utils";

/* Place d'un exercice dans une séance construite par Oxa : pourquoi il vient à ce moment-là. */
const ROLES: Record<RoleEx, { n: () => string; pourquoi: () => string }> = {
  b: { n: () => tr("Base"), pourquoi: () => tr("Exercice qui fait travailler plusieurs muscles à la fois : le plus lourd, on le fait en premier, quand tu es frais.") },
  c: { n: () => tr("Complément"), pourquoi: () => tr("Un autre mouvement de base pour le même muscle, sous un autre angle, un peu moins lourd : il vient après les exercices de base.") },
  i: { n: () => tr("Isolation"), pourquoi: () => tr("Un seul muscle travaillé, avec une charge plus légère : il finit le travail une fois les gros exercices faits.") },
  g: { n: () => tr("Gainage"), pourquoi: () => tr("En fin de séance : les abdos et le bas du dos tiennent ton corps pendant les autres exercices, on ne les fatigue pas avant.") },
};

export const nomRole = (ro: RoleEx) => ROLES[ro].n();
export const pourquoiRole = (ro: RoleEx) => ROLES[ro].pourquoi();

export function EtiquetteRole({ ro, className }: { ro?: RoleEx; className?: string }) {
  if (!ro || !ROLES[ro]) return null;
  return <span className={cn("shrink-0 rounded-full bg-plate-soft px-2 py-0.5 text-[10.5px] font-semibold text-plate-ink dark:text-plate", className)}>{nomRole(ro)}</span>;
}

/* l'explication, dans la carte dépliée */
export function PourquoiRole({ ro, className }: { ro?: RoleEx; className?: string }) {
  if (!ro || !ROLES[ro]) return null;
  return (
    <p className={cn("text-[12.5px] leading-snug text-muted-foreground", className)}>
      <span className="font-semibold text-plate-ink dark:text-plate">{nomRole(ro)}</span>{" · "}{pourquoiRole(ro)}
    </p>
  );
}
