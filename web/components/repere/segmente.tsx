"use client";

import { cn } from "@/lib/utils";

/* Contrôle segmenté façon iOS. Une option peut porter sa teinte (`t`) : l'onglet choisi prend alors
   cette couleur, texte foncé (les nuances d'orange d'Oxa Meal). */
export function Segmente<T extends string | number>({
  options, valeur, onChange, className, label,
}: {
  options: { v: T; n: React.ReactNode; t?: string }[];
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
          style={valeur === o.v && o.t ? { background: o.t, color: "#1a1106" } : undefined}
          className={cn(
            "h-9 rounded-[10px] px-2 text-[13.5px] font-medium transition-[background-color,color,box-shadow] duration-150",
            valeur === o.v ? cn("bg-card text-foreground shadow-[0_1px_3px_rgba(0,0,0,.12)]", o.t && "font-semibold")  : "text-muted-foreground hover:text-foreground",
          )}
        >
          {o.n}
        </button>
      ))}
    </div>
  );
}
