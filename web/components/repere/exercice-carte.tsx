"use client";

import { tr } from "@/lib/i18n";
import { useState } from "react";
import { ArrowsLeftRightIcon, BarbellIcon, CaretDownIcon, CheckIcon, CrosshairIcon, InfoIcon, ArrowUpIcon, ArrowDownIcon } from "@phosphor-icons/react";
import { EX } from "@/lib/data/exercices";
import { musclesDe, nb, okDe, resumeDe } from "@/lib/logic/core";
import { EtiquetteZone } from "./forme";
import { EtiquetteRole, PourquoiRole } from "./role-exercice";
import type { Journal, RoleEx } from "@/lib/logic/types";
import { useCelebrer } from "@/lib/celebrer";
import { cn } from "@/lib/utils";

import { imgEx } from "@/lib/medias";

const UNITE_RESUME: Record<string, string> = { kg: "kg", lest: tr("kg de lest"), aucune: "", temps: "s", dist: "m" };

/* Vignette photo d'un exercice, avec repli discret si l'image manque. */
export function Vignette({ id, num, fait, trace, className }: { id: string; num?: number; fait?: boolean; trace?: boolean; className?: string }) {
  return (
    <span className={cn("relative block size-14 shrink-0 overflow-hidden rounded-[14px] bg-muted", className)}>
      {/* exercice encore sans photo : une icône à la place */}
      {EX[id]?.img ? (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img
          src={imgEx(id)}
          alt=""
          loading="lazy"
          className={cn("size-full object-cover transition-opacity", fait && "opacity-70")}
          onError={(e) => (e.currentTarget.style.visibility = "hidden")}
        />
      ) : <BarbellIcon className="absolute inset-0 m-auto size-1/2 text-muted-foreground/60" />}
      {num != null && (
        <span className="num absolute top-1 left-1 grid h-5 min-w-5 place-items-center rounded-md bg-background/85 px-1 text-[12px] font-bold backdrop-blur">
          {num}
        </span>
      )}
      {fait && (
        <span className={cn("absolute right-1 bottom-1 grid size-5 place-items-center rounded-full bg-plate text-plate-foreground ring-2 ring-card", trace && "animate-[pop_.5s_cubic-bezier(.3,1.6,.5,1)]")}>
          {trace ? (
            /* la coche se dessine d'un trait */
            <svg viewBox="0 0 16 16" className="size-3" aria-hidden>
              <path d="M3.5 8.5l3 3 6-7" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" pathLength={1} className="[stroke-dasharray:1] animate-[tracer_.42s_.12s_ease-out_both]" />
            </svg>
          ) : (
            <CheckIcon className="size-3" weight="bold" />
          )}
        </span>
      )}
    </span>
  );
}

/* Avancement affiché sur la carte fermée. */
export function EtatCarte({ L, id, n }: { L?: Journal; id: string; n: number }) {
  if (!L) return null;
  const x = EX[id];
  if (L.done) return <span className="truncate text-[12.5px] font-medium text-foreground/80">{resumeDe(L, x, UNITE_RESUME[x.ch])}</span>;
  const ok = (L.series || []).filter((s) => okDe(L, s)).length;
  if (!ok) return null;
  return (
    <span className="flex items-center gap-2 text-[12.5px] text-muted-foreground">
      <span className="h-1.5 w-14 overflow-hidden rounded-full bg-muted">
        <span className="block h-full rounded-full bg-plate" style={{ width: (ok / n) * 100 + "%" }} />
      </span>
      {ok} / {n}{" "}{tr("séries")}
    </span>
  );
}

/* Carte d'exercice repliable, commune au plan et aux séances libres. */
export function ExerciceCarte({
  ancre, num, id, prescr, repos, rpe, role, ro, badge, variation = 0, L, n, ouvert, onToggle, onFiche, onRemplacer, onTout, children,
}: {
  ancre: string; num: number; id: string; prescr: string; repos: string; rpe?: number; role?: number; badge?: string;
  /** séance construite par Oxa : base, complément, isolation ou gainage (l'ordre expliqué) */
  ro?: RoleEx;
  /** charge proposée moins celle de la dernière fois (kg) : « ↑ 2,5 kg » ou « ↓ allégé » ; rien si elle ne bouge pas */
  variation?: number;
  L?: Journal; n: number; ouvert: boolean;
  onToggle: () => void; onFiche: () => void; onRemplacer?: () => void; onTout: () => void;
  children?: React.ReactNode;
}) {
  const x = EX[id], fait = !!L?.done, mus = musclesDe([id]);
  const celebre = useCelebrer((s) => s.fini === ancre);
  const [vuRole, setVuRole] = useState(false);
  return (
    <div
      id={"ex-" + ancre}
      data-ex={id}
      className={cn(
        "scroll-mt-3 overflow-hidden rounded-[20px] bg-card shadow-[0_1px_2px_rgb(10_10_12/0.05)] transition-[border-color,box-shadow] duration-200",
        celebre && "animate-[eclat_.9s_ease-out]",
        /* l'exercice en cours : un cadre net (turquoise foncé, 5,5:1), sans halo */
        ouvert && !fait ? "border-2 border-plate-ink dark:border-plate" : "border border-border/80",
      )}
    >
      {/* fait et replié : une ligne, lisible (pas d'opacité) */}
      {fait && !ouvert ? (
        <button onClick={onToggle} aria-expanded={false} className="flex h-[52px] w-full items-center gap-2.5 pr-1.5 pl-2.5 text-left">
          <span className="grid size-7 shrink-0 place-items-center rounded-full bg-plate text-plate-foreground"><CheckIcon className="size-3.5" weight="bold" /></span>
          <span className="min-w-0 flex-1 truncate text-[15px] font-semibold">{x.n}</span>
          <span className="num text-[16px] font-semibold text-muted-foreground">{prescr}</span>
          <span className="grid h-11 w-9 place-items-center"><CaretDownIcon className="size-4 text-muted-foreground" /></span>
        </button>
      ) : (
      <div className="flex items-center gap-3.5 p-3">
        {/* la photo ouvre la fiche ; le reste de la carte déplie les séries */}
        <button onClick={onFiche} aria-label={tr("Fiche : {n}", { n: x.n })} className="shrink-0 rounded-[14px] active:scale-95">
          <Vignette id={id} num={num} fait={fait} trace={celebre} />
        </button>
        <button onClick={onToggle} aria-expanded={ouvert} className="flex min-w-0 flex-1 items-center gap-3.5 text-left">
        <span className="flex min-w-0 flex-1 flex-col gap-1">
          {/* le nom d'abord, en entier (deux lignes au plus) ; les étiquettes passent sur la ligne des muscles */}
          {ouvert && !fait && <span className="eyebrow text-plate-ink dark:text-plate">{tr("En cours")}</span>}
          <span className={cn("titre line-clamp-2 leading-[1.12]", ouvert ? "text-[19px]" : "text-[17px]")}>{x.n}</span>
          <span className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-[12.5px] font-medium text-muted-foreground">
            {mus.length > 0 && <><CrosshairIcon className="size-3.5 shrink-0 text-plate-ink" /><span className="min-w-0 truncate">{mus.join(" · ")}</span></>}
            {badge && <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-[10.5px] font-medium text-muted-foreground">{badge}</span>}
            <EtiquetteRole ro={ro} ouvert={vuRole} onToggle={() => setVuRole(!vuRole)} />
            <EtiquetteZone id={id} />
          </span>
          {L && (L.done || L.series?.some((s) => s.ok)) ? (
            <EtatCarte L={L} id={id} n={n} />
          ) : (
            <span className="num text-[15px] font-semibold tracking-wide text-foreground/80">
              {prescr} <span className="font-sans text-[12.5px] font-normal text-muted-foreground">{tr("· repos {repos}", { repos })}</span>
              {variation > 0 && <span className="ml-1.5 inline-flex items-center gap-0.5 font-sans text-[12.5px] font-semibold text-plate-ink dark:text-plate"><ArrowUpIcon className="size-3" weight="bold" />{tr("{v} kg", { v: nb(variation) })}</span>}
              {variation < 0 && <span className="ml-1.5 inline-flex items-center gap-0.5 font-sans text-[12.5px] font-semibold text-muted-foreground"><ArrowDownIcon className="size-3" weight="bold" />{tr("allégé")}</span>}
            </span>
          )}
        </span>
        <CaretDownIcon className={cn("size-5 shrink-0 text-muted-foreground transition-transform duration-200", ouvert && "rotate-180")} />
        </button>
      </div>
      )}
      {vuRole && <PourquoiRole ro={ro} onFermer={() => setVuRole(false)} className="mx-3 mb-3 -mt-1" />}

      {ouvert && (
        <div className="animate-in fade-in-0 slide-in-from-top-1 duration-200">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-border/70 px-4 py-2.5 text-[12.5px] text-muted-foreground">
            {role !== undefined && (
              <span className="inline-flex items-center gap-1.5 font-medium text-foreground">
                <span className={cn("size-2 rounded-full", role ? "bg-foreground" : "bg-muted-foreground/60")} />
                {role ? tr("Principal") : tr("Accessoire")}
              </span>
            )}
            {!!rpe && <span>{tr("Effort")}{" "}<b className="num text-[14px] text-foreground">{tr("RPE")}{" "}{rpe}</b></span>}
            <span>{tr("Repos")}{" "}<b className="font-semibold text-foreground">{repos}</b></span>
          </div>
          {children}
          <div className={cn("grid border-t border-border/70", onRemplacer ? "grid-cols-3" : "grid-cols-2")}>
            <OutilBtn onClick={onFiche} icone={<InfoIcon className="size-5" />} label={tr("Fiche")} />
            {onRemplacer && <OutilBtn onClick={onRemplacer} icone={<ArrowsLeftRightIcon className="size-5" />} label={tr("Remplacer")} />}
            <OutilBtn onClick={onTout} icone={<CheckIcon className="size-5" weight="bold" />} label={fait ? tr("Tout décocher") : tr("Tout valider")} accent />
          </div>
        </div>
      )}
    </div>
  );
}

function OutilBtn({ onClick, icone, label, accent }: { onClick: () => void; icone: React.ReactNode; label: string; accent?: boolean }) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center gap-1 border-r border-border/70 py-2.5 text-[12px] font-medium last:border-r-0 active:bg-muted"
    >
      <span className={accent ? "text-plate-ink" : "text-muted-foreground"}>{icone}</span>
      {label}
    </button>
  );
}
