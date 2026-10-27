"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { BoutonMenu, estRacine } from "./menu-lateral";

/* Grand titre façon iOS : la barre prend un fond translucide dès que la page défile,
   et le titre s'y réduit quand le grand titre sort de l'écran. */
export function EnTete({
  surtitre, titre, actions, gauche, children, className,
}: {
  surtitre?: React.ReactNode;
  titre: React.ReactNode;
  actions?: React.ReactNode;
  gauche?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
}) {
  const chemin = usePathname();
  const ref = useRef<HTMLHeadingElement>(null);
  const [replie, setReplie] = useState(false);
  const [fond, setFond] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setReplie(!e.isIntersecting), { rootMargin: "-44px 0px 0px 0px" });
    io.observe(el);
    /* le fond paraît dès que la page défile : rien ne passe sous l'heure sans fond */
    const defile = () => setFond(window.scrollY > 4);
    defile();
    window.addEventListener("scroll", defile, { passive: true });
    return () => { io.disconnect(); window.removeEventListener("scroll", defile); };
  }, []);
  return (
    <>
      {/* Barre fixe (et non « sticky ») : sur iPhone, le contenu d'une barre sticky est dessiné flou.
          Une cale de même hauteur garde la place dans la page. */}
      <div className="safe-top" aria-hidden><div className="h-11" /></div>
      <div className="safe-top fixed inset-x-0 top-0 z-30 mx-auto max-w-[480px]">
        {/* Le flou est sur une couche à part, derrière le contenu : sur iPhone, ce qui est
            à l'intérieur d'un élément flouté (backdrop-filter) est dessiné en basse résolution. */}
        <div
          aria-hidden
          data-fond
          className={cn(
            "pointer-events-none absolute inset-0 border-b border-border/70 bg-background/90 backdrop-blur-xl transition-opacity duration-200",
            fond ? "opacity-100" : "opacity-0",
          )}
        />
        {/* retour à gauche, actions à droite, de même largeur : le titre réduit est centré sur l'écran (tronqué plutôt que chevauchant) */}
        <div className="relative grid h-11 grid-cols-[minmax(max-content,1fr)_minmax(0,auto)_minmax(max-content,1fr)] items-center gap-2 px-4">
          <div className="flex min-w-0 items-center">{gauche ?? (estRacine(chemin) ? <BoutonMenu /> : null)}</div>
          <div
            className={cn(
              "pointer-events-none truncate text-center text-[15px] font-semibold transition-opacity duration-200",
              replie ? "opacity-100" : "opacity-0",
            )}
            aria-hidden
          >
            {titre}
          </div>
          <div className="flex shrink-0 items-center justify-end gap-1">{actions}</div>
        </div>
      </div>
      <header className={cn("px-5 pt-1 pb-3", className)}>
        {surtitre && <div className="eyebrow mb-1">{surtitre}</div>}
        <h1 ref={ref} className="text-[32px] leading-[1.05] font-bold tracking-[-0.02em] text-balance">
          {titre}
        </h1>
        {children}
      </header>
    </>
  );
}
