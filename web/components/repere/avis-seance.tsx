"use client";

/* « L'avis d'Oxa » dans le composeur : les conseils de lib/logic/avis-seance.ts, deux à la fois,
   chacun avec son bouton (retirer, ajouter, déplacer, ajuster) et « Ignorer » (pour cette séance). */
import { tr } from "@/lib/i18n";
import { useMemo, useState } from "react";
import { CheckIcon, MinusIcon, PlusIcon } from "@phosphor-icons/react";
import { appliquerAvis, avisSeance, type ActionAvis } from "@/lib/logic/avis-seance";
import { jourDe } from "@/lib/logic/historique";
import { zonesActives } from "@/lib/logic/forme";
import type { SeanceLibre } from "@/lib/logic/types";
import { useRepere } from "@/lib/store";
import { useBrouillon } from "@/lib/brouillon";
import { tactile } from "@/lib/repos";
import { cn } from "@/lib/utils";

export function AvisSeance({ L, sel }: { L: SeanceLibre; sel: string[] }) {
  const A = useRepere((s) => s.etat.A), H = useRepere((s) => s.etat.HIST);
  const majLibre = useBrouillon((s) => s.majLibre);
  const [auj] = useState(() => jourDe(Date.now()));
  const [ignores, setIgnores] = useState<string[]>([]);
  const [tout, setTout] = useState(false);
  const liste = useMemo(() => avisSeance(L, { A, H, sel, zones: zonesActives(A), auj }).filter((a) => !ignores.includes(a.id)), [L, A, H, sel, auj, ignores]);
  if (!liste.length) return null;
  const vus = tout ? liste : liste.slice(0, 2);

  const appliquer = (a: ActionAvis) => { tactile(10); majLibre((l) => appliquerAvis(l, a, A.objectif)); };

  return (
    <section className="rounded-[20px] bg-plate-soft p-3.5" aria-label={tr("L'avis d'Oxa")}>
      <div className="flex items-center gap-2 text-[11px] font-bold tracking-[0.12em] text-plate-ink uppercase dark:text-plate">
        <span className="grid size-6 place-items-center rounded-full bg-plate-ink text-white dark:bg-plate dark:text-[#0a0a0c]"><CheckIcon className="size-3.5" weight="bold" /></span>
        {tr("L'avis d'Oxa")}
      </div>
      {vus.map((a, k) => (
        <div key={a.id} className={cn("mt-3", k > 0 && "border-t border-plate/20 pt-3")}>
          <p className="text-[14px] leading-snug"><b className="font-bold">{a.titre}</b> {a.texte}</p>
          <div className="mt-2 flex flex-wrap items-center gap-1">
            {a.action && a.bouton && (
              <button onClick={() => appliquer(a.action!)}
                className={cn("flex min-h-9 items-center gap-1 rounded-full px-3.5 py-1.5 text-left text-[13.5px] font-semibold active:scale-[.98]",
                  a.action.t === "retirer" ? "border border-border bg-card text-destructive" : "bg-plate text-plate-foreground")}>
                {a.action.t === "retirer" ? <MinusIcon className="size-3.5 shrink-0" weight="bold" /> : a.action.t === "ajouter" ? <PlusIcon className="size-3.5 shrink-0" weight="bold" /> : null}
                {a.bouton}
              </button>
            )}
            <button onClick={() => { tactile(4); setIgnores((l) => [...l, a.id]); }} className="px-2 py-1.5 text-[13px] font-semibold text-muted-foreground">{tr("Ignorer")}</button>
          </div>
        </div>
      ))}
      {liste.length > 2 && (
        <button onClick={() => setTout((x) => !x)} className="mt-3 text-[13px] font-semibold text-plate-ink underline-offset-2 hover:underline dark:text-plate">
          {tout ? tr("Moins de conseils") : liste.length - 2 > 1 ? tr("Voir les {n} autres conseils", { n: liste.length - 2 }) : tr("Voir l'autre conseil")}
        </button>
      )}
    </section>
  );
}
