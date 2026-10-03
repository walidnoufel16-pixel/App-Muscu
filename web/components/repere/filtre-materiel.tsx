"use client";

import { TYPES } from "@/lib/data/referentiels";
import { cn } from "@/lib/utils";

/* Matériel disponible : chaque type se coche indépendamment. */
export function FiltreMateriel({ sel, onChange, declare }: { sel: string[]; onChange: (s: string[]) => void; declare: string[] }) {
  const trie = (l: string[]) => l.slice().sort().join();
  const perso = trie(sel) !== trie(declare);
  return (
    <div>
      <div className="mb-2 flex items-baseline justify-between">
        <span className="eyebrow">Matériel disponible</span>
        {perso && (
          <button onClick={() => onChange(declare)} className="text-[12.5px] font-medium text-muted-foreground hover:text-foreground">
            Mon matériel déclaré
          </button>
        )}
      </div>
      <div className="flex flex-wrap gap-1.5">
        {TYPES.map(([t, n]) => {
          const on = sel.includes(t);
          return (
            <button
              key={t}
              aria-pressed={on}
              onClick={() => onChange(on ? sel.filter((x) => x !== t) : [...sel, t])}
              className={cn(
                "h-9 rounded-full border px-3.5 text-[13.5px] font-medium transition-colors",
                on ? "border-foreground bg-foreground text-background" : "border-border bg-card text-muted-foreground",
              )}
            >
              {n}
            </button>
          );
        })}
      </div>
      {!sel.length && <p className="mt-2 text-[12.5px] text-muted-foreground">Sélectionne au moins un matériel pour voir des exercices.</p>}
    </div>
  );
}
