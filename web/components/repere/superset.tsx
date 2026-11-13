"use client";

/* Supersets (objectif « M'affiner ») et explication de l'objectif (maquette validée le 13 novembre
   2026). Un superset : deux exercices de muscles opposés enchaînés sans repos, le repos vient
   après le second. */
import { useState } from "react";
import { CaretDownIcon, InfoIcon } from "@phosphor-icons/react";
import { tr } from "@/lib/i18n";
import { OBJS } from "@/lib/data/referentiels";
import type { Element } from "@/lib/logic/combinee";
import { tactile } from "@/lib/repos";
import { cn } from "@/lib/utils";

/* Le cadre qui réunit les deux exercices d'un superset. */
export function CadreSuperset({ children, sous, onSeparer }: { children: React.ReactNode; sous?: string; onSeparer?: () => void }) {
  return (
    <div role="group" aria-label={tr("Superset")} className="flex flex-col gap-1.5 rounded-[22px] border-2 border-plate bg-plate-soft/40 p-1.5">
      <div className="flex items-center gap-2 px-2 pt-0.5">
        <span className="text-[11.5px] font-extrabold tracking-[0.06em] text-plate-ink uppercase dark:text-plate">{tr("Superset")}</span>
        <span className="min-w-0 flex-1 truncate text-[12.5px] text-muted-foreground">{sous ?? tr("enchaîne les deux, repos après le second")}</span>
        {onSeparer && <button onClick={() => { tactile(6); onSeparer(); }} className="shrink-0 text-[12.5px] font-semibold text-muted-foreground">{tr("Séparer")}</button>}
      </div>
      {children}
    </div>
  );
}

/** Rend une suite d'éléments en réunissant les deux exercices de chaque superset dans un cadre. */
export function avecSupersets(el: Element[], carte: (x: Element) => React.ReactNode, cadre: (a: Extract<Element, { t: "ex" }>, enfants: React.ReactNode) => React.ReactNode) {
  const out: React.ReactNode[] = [];
  for (let k = 0; k < el.length; k++) {
    const x = el[k], y = el[k + 1];
    if (x.t === "ex" && x.e.sup && y?.t === "ex") { out.push(cadre(x, <>{carte(x)}{carte(y)}</>)); k++; }
    else out.push(carte(x));
  }
  return out;
}

/** Le partenaire d'un exercice dans son superset (indice dans la séance), ou -1. */
export const partenaire = (ex: { sup?: 1 }[], j: number) => (ex[j]?.sup && ex[j + 1] ? j + 1 : j > 0 && ex[j - 1]?.sup ? j - 1 : -1);

/* Ce que change chaque objectif, en quelques lignes (objectif : indice dans OBJS). */
const EFFETS: (() => { reps: string; repos: string; plus?: [string, string]; texte: string })[] = [
  () => ({ reps: tr("8 sur les gros mouvements, 10 à 12 ensuite"), repos: tr("1 à 2 min 30"), texte: tr("Assez lourd pour progresser, assez de séries pour faire grossir le muscle.") }),
  () => ({ reps: tr("5 sur les gros mouvements, 4 séries"), repos: tr("2 à 3 min"), plus: [tr("Exercices"), tr("à la barre ou à la machine quand c'est possible")], texte: tr("On vise la charge : moins d'exercices tiennent dans la séance.") }),
  () => ({ reps: tr("10 à 15, une charge que tu tiens"), repos: tr("courts : 45 s à 1 min 30"), plus: [tr("Supersets"), tr("deux exercices de muscles opposés enchaînés sans repos")], texte: tr("Plus de travail dans le même temps, le cœur reste haut.") }),
  () => ({ reps: tr("10 à 12"), repos: tr("1 à 2 min"), texte: tr("Un travail complet, sans chercher la charge maximale.") }),
];

/** « ⓘ Ce que change « M'affiner » », replié ; déplié : répétitions, repos, et ce qui est propre à l'objectif. */
export function EffetObjectif({ obj, debutant, className }: { obj?: number | null; debutant?: boolean; className?: string }) {
  const [vu, setVu] = useState(false);
  if (obj == null || !EFFETS[obj]) return null;
  const e = EFFETS[obj]();
  const lignes: [string, string][] = [[tr("Répétitions"), debutant ? tr("8 à 12 tant que tu débutes") : e.reps], [tr("Repos"), e.repos], ...(e.plus && !(obj === 2 && debutant) ? [e.plus] : [])];
  return (
    <div className={cn(vu && "rounded-[18px] bg-card p-3.5", className)}>
      <button onClick={() => { tactile(4); setVu(!vu); }} aria-expanded={vu} className="flex items-center gap-1.5 px-1 text-[13px] font-semibold text-plate-ink dark:text-plate">
        <InfoIcon className="size-4" />{tr("Ce que change « {o} »", { o: tr(OBJS[obj]) })}<CaretDownIcon className={cn("size-3.5 transition-transform", vu && "rotate-180")} weight="bold" />
      </button>
      {vu && (
        <div className="animate-in fade-in-0 mt-2.5 flex flex-col gap-2 px-1">
          {lignes.map(([t, v]) => (
            <div key={t} className="flex items-baseline gap-3 text-[13.5px]"><span className="w-[84px] shrink-0 text-[12px] font-bold text-muted-foreground">{t}</span><span>{v}</span></div>
          ))}
          <p className="border-t border-border/70 pt-2 text-[12.5px] leading-snug text-muted-foreground">{e.texte} {tr("Les muscles et l'ordre des exercices ne changent pas.")}</p>
        </div>
      )}
    </div>
  );
}
