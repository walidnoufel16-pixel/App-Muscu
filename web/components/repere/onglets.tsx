"use client";

/* Onglets horizontaux d'une rubrique : en pastilles quand ils sont nombreux (muscles, zones),
   soulignés quand ils sont peu (street, course). L'onglet choisi reste visible en faisant défiler. */
import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

export function Onglets<T extends string>({ options, valeur, onChange, style = "pastilles", label }: {
  options: { v: T; n: string }[]; valeur: T; onChange: (v: T) => void; style?: "pastilles" | "soulignes"; label: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    ref.current?.querySelector<HTMLElement>('[aria-selected="true"]')?.scrollIntoView({ block: "nearest", inline: "center" });
  }, [valeur]);
  return (
    <div ref={ref} role="tablist" aria-label={label}
      className={cn("no-scrollbar -mx-4 flex overflow-x-auto px-4", style === "pastilles" ? "gap-1.5" : "gap-5 border-b border-border/80")}>
      {options.map((o) => {
        const on = o.v === valeur;
        return (
          <button key={o.v} role="tab" aria-selected={on} onClick={() => onChange(o.v)}
            className={cn("shrink-0 text-[14px] font-semibold transition-colors",
              style === "pastilles"
                ? cn("h-9 rounded-full border px-3.5", on ? "border-foreground bg-foreground text-background" : "border-border bg-card text-muted-foreground")
                : cn("-mb-px border-b-[3px] pt-1 pb-2.5", on ? "border-plate text-foreground" : "border-transparent text-muted-foreground"))}>
            {o.n}
          </button>
        );
      })}
    </div>
  );
}
