"use client";

import { useEffect, useState } from "react";
import { Minus, Plus, X } from "lucide-react";
import { useRepos } from "@/lib/repos";
import { cn } from "@/lib/utils";

/* Barre flottante du repos : un grand chiffre condensé, ±15 s, passer. */
export function RestTimer({ avecOnglets }: { avecOnglets: boolean }) {
  const { fin, total, fini, ajuster, arreter, terminer } = useRepos();
  const [maintenant, setMaintenant] = useState(0);
  useEffect(() => {
    if (!fin) return;
    const pas = () => { const t = Date.now(); setMaintenant(t); if (t >= fin) terminer(); };
    const raf = requestAnimationFrame(pas);
    const t = setInterval(pas, 250);
    return () => { clearInterval(t); cancelAnimationFrame(raf); };
  }, [fin, terminer]);

  if (!fin && !fini) return null;
  const reste = fin ? Math.max(0, Math.min(total, Math.ceil((fin - (maintenant || fin - total * 1000)) / 1000))) : 0;
  const pct = fin ? 100 - (reste / total) * 100 : 100;
  return (
    <div
      role="timer"
      aria-live="polite"
      className={cn(
        "fixed inset-x-0 z-40 mx-auto max-w-[480px] px-3 animate-in slide-in-from-bottom-4 fade-in-0 duration-200",
        avecOnglets ? "bottom-[calc(max(env(safe-area-inset-bottom),10px)+76px)]" : "bottom-[max(env(safe-area-inset-bottom),12px)]",
      )}
    >
      <div
        className={cn(
          "relative overflow-hidden rounded-[20px] border shadow-[0_12px_32px_-12px_rgba(0,0,0,.45)]",
          fini ? "border-plate bg-plate text-plate-foreground" : "border-border bg-foreground text-background",
        )}
      >
        <div className="flex items-center gap-3 px-4 py-2.5">
          <div className="min-w-0 flex-1">
            <div className={cn("text-[11px] font-medium tracking-[0.12em] uppercase", fini ? "opacity-80" : "opacity-60")}>
              {fini ? "Repos terminé" : "Repos"}
            </div>
            <div className="num text-[34px] leading-none font-bold">
              {fini ? "C'est reparti" : `${Math.floor(reste / 60)}:${String(reste % 60).padStart(2, "0")}`}
            </div>
          </div>
          {!fini && (
            <>
              <button onClick={() => ajuster(-15)} className="grid size-10 place-items-center rounded-full bg-background/12 active:scale-95" aria-label="Retirer 15 secondes">
                <Minus className="size-4" />
              </button>
              <button onClick={() => ajuster(15)} className="grid size-10 place-items-center rounded-full bg-background/12 active:scale-95" aria-label="Ajouter 15 secondes">
                <Plus className="size-4" />
              </button>
              <button onClick={arreter} className="flex h-10 items-center gap-1.5 rounded-full bg-plate px-3.5 text-sm font-semibold text-plate-foreground active:scale-95">
                Passer <X className="size-3.5" />
              </button>
            </>
          )}
        </div>
        {!fini && (
          <div className="absolute inset-x-0 bottom-0 h-[3px] bg-background/10">
            <div className="h-full bg-plate transition-[width] duration-300 ease-linear" style={{ width: pct + "%" }} />
          </div>
        )}
      </div>
    </div>
  );
}
