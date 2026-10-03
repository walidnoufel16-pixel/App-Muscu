"use client";

import { useRef, useState } from "react";
import { TrashIcon } from "@phosphor-icons/react";
import { tactile } from "@/lib/repos";
import { cn } from "@/lib/utils";

const LARG = 96;

/* Balayage vers la gauche : révèle « Supprimer ». Au-delà de la moitié de la
   largeur, la suppression est demandée directement. Le geste vertical reste
   libre pour faire défiler la page. */
export function LigneBalayable({ children, onSupprimer, label }: { children: React.ReactNode; onSupprimer: () => void; label: string }) {
  const [dx, setDx] = useState(0);
  const [glisse, setGlisse] = useState(false);
  const [loin, setLoin] = useState(false);
  const ouvert = useRef(false);
  const bloque = useRef(false);
  const ligne = useRef<HTMLDivElement>(null);

  const debut = (ev: React.PointerEvent) => {
    const x0 = ev.clientX, y0 = ev.clientY, base = ouvert.current ? -LARG : 0, larg = ligne.current?.offsetWidth || 300;
    let mode: "h" | "v" | null = null, d = base;
    const bouge = (e: PointerEvent) => {
      const ddx = e.clientX - x0, ddy = e.clientY - y0;
      if (!mode) {
        if (Math.abs(ddx) < 8 && Math.abs(ddy) < 8) return;
        mode = Math.abs(ddx) > Math.abs(ddy) ? "h" : "v";
        if (mode === "h") setGlisse(true);
      }
      if (mode !== "h") return;
      e.preventDefault();
      d = Math.min(0, base + ddx);
      setDx(d);
      setLoin(-d > larg * 0.5);
    };
    const fin = () => {
      document.removeEventListener("pointermove", bouge);
      document.removeEventListener("pointerup", fin);
      document.removeEventListener("pointercancel", fin);
      setGlisse(false);
      setLoin(false);
      if (mode !== "h") {
        if (ouvert.current) { bloque.current = true; setTimeout(() => (bloque.current = false), 350); ouvert.current = false; setDx(0); }
        return;
      }
      bloque.current = true;
      setTimeout(() => (bloque.current = false), 350);
      if (-d > larg * 0.5) { ouvert.current = false; setDx(0); tactile(15); onSupprimer(); }
      else if (-d > LARG / 2) { ouvert.current = true; setDx(-LARG); tactile(8); }
      else { ouvert.current = false; setDx(0); }
    };
    document.addEventListener("pointermove", bouge, { passive: false });
    document.addEventListener("pointerup", fin);
    document.addEventListener("pointercancel", fin);
  };

  return (
    <div className={cn("relative overflow-hidden rounded-[20px] select-none", (glisse || dx < 0) && "bg-destructive")}>
      {(glisse || dx < 0) && (
        <button
          onClick={onSupprimer}
          aria-label={"Supprimer " + label}
          className={cn("absolute inset-y-0 right-0 flex flex-col items-center justify-center gap-1 text-[12px] font-semibold text-white transition-[width] duration-150", loin ? "w-full" : "w-24")}
        >
          <TrashIcon className="size-5" />
          Supprimer
        </button>
      )}
      <div
        ref={ligne}
        onPointerDown={debut}
        onClickCapture={(e) => { if (bloque.current) { e.stopPropagation(); e.preventDefault(); } }}
        style={{ transform: `translateX(${dx}px)` }}
        className={cn("relative z-[1] touch-pan-y", !glisse && "transition-transform duration-200")}
      >
        {children}
      </div>
    </div>
  );
}
