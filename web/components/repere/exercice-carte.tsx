"use client";

import { ArrowsLeftRightIcon, CaretDownIcon, CheckIcon, CrosshairIcon, InfoIcon } from "@phosphor-icons/react";
import { EX } from "@/lib/data/exercices";
import { musclesDe, okDe, resumeDe } from "@/lib/logic/core";
import { EtiquetteZone } from "./forme";
import type { Journal } from "@/lib/logic/types";
import { useCelebrer } from "@/lib/celebrer";
import { cn } from "@/lib/utils";

import { imgEx } from "@/lib/medias";

const UNITE_RESUME: Record<string, string> = { kg: "kg", lest: "kg de lest", aucune: "", temps: "s", dist: "m" };

/* Vignette photo d'un exercice, avec repli discret si l'image manque. */
export function Vignette({ id, num, fait, trace, className }: { id: string; num?: number; fait?: boolean; trace?: boolean; className?: string }) {
  return (
    <span className={cn("relative block size-14 shrink-0 overflow-hidden rounded-[14px] bg-muted", className)}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={imgEx(id)}
        alt=""
        loading="lazy"
        className={cn("size-full object-cover transition-opacity", fait && "opacity-70")}
        onError={(e) => (e.currentTarget.style.visibility = "hidden")}
      />
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
      {ok} / {n} séries
    </span>
  );
}

/* Carte d'exercice repliable, commune au plan et aux séances libres. */
export function ExerciceCarte({
  ancre, num, id, prescr, repos, rpe, role, badge, L, n, ouvert, onToggle, onFiche, onRemplacer, onTout, children,
}: {
  ancre: string; num: number; id: string; prescr: string; repos: string; rpe?: number; role?: number; badge?: string;
  L?: Journal; n: number; ouvert: boolean;
  onToggle: () => void; onFiche: () => void; onRemplacer?: () => void; onTout: () => void;
  children?: React.ReactNode;
}) {
  const x = EX[id], fait = !!L?.done, mus = musclesDe([id]);
  const celebre = useCelebrer((s) => s.fini === ancre);
  return (
    <div
      id={"ex-" + ancre}
      data-ex={id}
      className={cn(
        "scroll-mt-3 overflow-hidden rounded-[20px] border bg-card transition-[border-color,box-shadow] duration-200",
        celebre && "animate-[eclat_.9s_ease-out]",
        fait ? "border-plate/60" : "border-border/80",
        ouvert && "shadow-[0_10px_30px_-18px_rgba(0,0,0,.35)]",
      )}
    >
      <div className="flex items-center gap-3.5 p-3">
        {/* la photo ouvre la fiche ; le reste de la carte déplie les séries */}
        <button onClick={onFiche} aria-label={`Fiche : ${x.n}`} className="shrink-0 rounded-[14px] active:scale-95">
          <Vignette id={id} num={num} fait={fait} trace={celebre} />
        </button>
        <button onClick={onToggle} aria-expanded={ouvert} className="flex min-w-0 flex-1 items-center gap-3.5 text-left">
        <span className="flex min-w-0 flex-1 flex-col gap-1">
          <span className="flex items-center gap-2">
            <span className="truncate text-[16px] leading-tight font-semibold tracking-[-0.01em]">{x.n}</span>
            {badge && <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-[10.5px] font-medium text-muted-foreground">{badge}</span>}
            <EtiquetteZone id={id} />
          </span>
          {mus.length > 0 && (
            <span className="flex items-center gap-1.5 truncate text-[12.5px] font-medium text-muted-foreground">
              <CrosshairIcon className="size-3.5 shrink-0 text-plate-ink" />
              {mus.join(" · ")}
            </span>
          )}
          {L && (L.done || L.series?.some((s) => s.ok)) ? (
            <EtatCarte L={L} id={id} n={n} />
          ) : (
            <span className="num text-[15px] font-semibold tracking-wide text-foreground/80">
              {prescr} <span className="font-sans text-[12.5px] font-normal text-muted-foreground">· repos {repos}</span>
            </span>
          )}
        </span>
        <CaretDownIcon className={cn("size-5 shrink-0 text-muted-foreground transition-transform duration-200", ouvert && "rotate-180")} />
        </button>
      </div>

      {ouvert && (
        <div className="animate-in fade-in-0 slide-in-from-top-1 duration-200">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-border/70 px-4 py-2.5 text-[12.5px] text-muted-foreground">
            {role !== undefined && (
              <span className="inline-flex items-center gap-1.5 font-medium text-foreground">
                <span className={cn("size-2 rounded-full", role ? "bg-foreground" : "bg-muted-foreground/60")} />
                {role ? "Principal" : "Accessoire"}
              </span>
            )}
            {!!rpe && <span>Effort <b className="num text-[14px] text-foreground">RPE {rpe}</b></span>}
            <span>Repos <b className="font-semibold text-foreground">{repos}</b></span>
          </div>
          {children}
          <div className="grid grid-cols-3 border-t border-border/70">
            <OutilBtn onClick={onFiche} icone={<InfoIcon className="size-5" />} label="Fiche" />
            {onRemplacer ? (
              <OutilBtn onClick={onRemplacer} icone={<ArrowsLeftRightIcon className="size-5" />} label="Remplacer" />
            ) : (
              <span />
            )}
            <OutilBtn onClick={onTout} icone={<CheckIcon className="size-5" weight="bold" />} label={fait ? "Tout décocher" : "Tout valider"} accent />
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
