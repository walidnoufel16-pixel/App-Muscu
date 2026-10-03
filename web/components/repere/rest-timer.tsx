"use client";

import { useEffect, useState } from "react";
import { MinusIcon, PlusIcon, XIcon } from "@phosphor-icons/react";
import { useRepos } from "@/lib/repos";
import { cn } from "@/lib/utils";

/* Chiffre qui défile : chaque caractère est remonté (key) quand il change, et glisse depuis le haut. */
function Defile({ texte }: { texte: string }) {
  return (
    <span className="inline-flex overflow-hidden">
      {texte.split("").map((ch, i) => (
        <span key={i + ch} className={cn("inline-block", ch !== ":" && "animate-[defiler_.28s_cubic-bezier(.2,.9,.25,1)]")}>
          {ch}
        </span>
      ))}
    </span>
  );
}

/* Anneau qui se vide pendant le repos. */
function Anneau({ part, alerte }: { part: number; alerte: boolean }) {
  const R = 19, C = 2 * Math.PI * R;
  return (
    <svg viewBox="0 0 44 44" className={cn("size-11 shrink-0 -rotate-90", alerte && "animate-[battre_1s_ease-in-out_infinite]")} aria-hidden>
      <circle cx="22" cy="22" r={R} fill="none" strokeWidth="4" className="stroke-background/15" />
      <circle
        cx="22" cy="22" r={R} fill="none" strokeWidth="4" strokeLinecap="round"
        className="stroke-plate transition-[stroke-dashoffset] duration-300 ease-linear"
        strokeDasharray={C} strokeDashoffset={C * (1 - part)}
      />
    </svg>
  );
}

/* Barre flottante du repos : anneau, grand chiffre condensé, passer.
   Un toucher sur le chiffre déplie les réglages ±15 s. */
export function RestTimer({ avecOnglets }: { avecOnglets: boolean }) {
  const { fin, total, fini, ajuster, arreter, terminer } = useRepos();
  const [maintenant, setMaintenant] = useState(0);
  const [deplie, setDeplie] = useState(false);
  useEffect(() => {
    if (!fin) return;
    const pas = () => { const t = Date.now(); setMaintenant(t); if (t >= fin) terminer(); };
    const raf = requestAnimationFrame(pas);
    const t = setInterval(pas, 250);
    return () => { clearInterval(t); cancelAnimationFrame(raf); };
  }, [fin, terminer]);

  const reste = fin ? Math.max(0, Math.min(total, Math.ceil((fin - (maintenant || fin - total * 1000)) / 1000))) : 0;
  const alerte = !!fin && reste > 0 && reste <= 3;
  /* 3, 2, 1 : une petite vibration à chaque seconde */
  useEffect(() => { if (alerte) try { navigator.vibrate?.(14); } catch {} }, [alerte, reste]);

  if (!fin && !fini) return null;
  const part = fin && total ? reste / total : 0;
  return (
    <div
      role="timer"
      aria-live="polite"
      className={cn(
        "fixed inset-x-0 z-40 mx-auto max-w-[480px] px-3 animate-in slide-in-from-bottom-4 fade-in-0 duration-300",
        avecOnglets ? "bottom-[calc(max(env(safe-area-inset-bottom),10px)+76px)]" : "bottom-[max(env(safe-area-inset-bottom),12px)]",
      )}
    >
      <div
        className={cn(
          "overflow-hidden rounded-[22px] border shadow-[0_12px_32px_-12px_rgba(0,0,0,.45)] transition-colors duration-300",
          fini ? "animate-[eclat_.9s_ease-out] border-plate bg-plate text-plate-foreground" : "border-border bg-foreground text-background",
        )}
      >
        <div className="flex items-center gap-3 px-3.5 py-2.5">
          {!fini && <Anneau part={part} alerte={alerte} />}
          <button
            onClick={() => !fini && setDeplie((d) => !d)}
            aria-expanded={deplie}
            aria-label={fini ? "Repos terminé" : "Régler le repos"}
            className="min-w-0 flex-1 text-left"
          >
            <div className={cn("text-[11px] font-medium tracking-[0.12em] uppercase", fini ? "opacity-80" : "opacity-60")}>
              {fini ? "Repos terminé" : alerte ? "Prépare-toi" : "Repos"}
            </div>
            <div className={cn("num text-[34px] leading-none font-bold", alerte && "text-plate", fini && "animate-[pop_.5s_cubic-bezier(.3,1.6,.5,1)]")}>
              {fini ? "C'est reparti" : <Defile texte={`${Math.floor(reste / 60)}:${String(reste % 60).padStart(2, "0")}`} />}
            </div>
          </button>
          {!fini && (
            <button onClick={arreter} className="flex h-10 items-center gap-1.5 rounded-full bg-plate px-3.5 text-sm font-semibold text-plate-foreground active:scale-95">
              Passer <XIcon className="size-3.5" />
            </button>
          )}
        </div>
        {/* réglages : la barre s'agrandit en douceur */}
        <div className={cn("grid transition-[grid-template-rows] duration-300 ease-out", deplie && !fini ? "grid-rows-[1fr]" : "grid-rows-[0fr]")}>
          <div className="overflow-hidden">
            <div className="flex gap-2 px-3.5 pb-3">
              <button onClick={() => ajuster(-15)} className="flex h-10 flex-1 items-center justify-center gap-1.5 rounded-full bg-background/12 text-sm font-semibold active:scale-95" aria-label="Retirer 15 secondes">
                <MinusIcon className="size-4" /> 15 s
              </button>
              <button onClick={() => ajuster(15)} className="flex h-10 flex-1 items-center justify-center gap-1.5 rounded-full bg-background/12 text-sm font-semibold active:scale-95" aria-label="Ajouter 15 secondes">
                <PlusIcon className="size-4" /> 15 s
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
