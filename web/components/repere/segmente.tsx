"use client";

import { cn } from "@/lib/utils";

/* Contrôle segmenté façon iOS. */
export function Segmente<T extends string | number>({
  options, valeur, onChange, className, label,
}: {
  options: { v: T; n: React.ReactNode }[];
  valeur: T;
  onChange: (v: T) => void;
  className?: string;
  label?: string;
}) {
  return (
    <div role="tablist" aria-label={label} className={cn("grid auto-cols-fr grid-flow-col gap-1 rounded-[14px] bg-muted p-1", className)}>
      {options.map((o) => (
        <button
          key={String(o.v)}
          role="tab"
          aria-selected={valeur === o.v}
          onClick={() => onChange(o.v)}
          className={cn(
            "h-9 rounded-[10px] px-2 text-[13.5px] font-medium transition-[background-color,color,box-shadow] duration-150",
            valeur === o.v ? "bg-card text-foreground shadow-[0_1px_3px_rgba(0,0,0,.12)]" : "text-muted-foreground hover:text-foreground",
          )}
        >
          {o.n}
        </button>
      ))}
    </div>
  );
}
