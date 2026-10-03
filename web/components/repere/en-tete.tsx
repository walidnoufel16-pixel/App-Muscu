"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

/* Grand titre façon iOS : il se réduit dans une barre fine et translucide
   dès qu'il sort de l'écran. */
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
  const ref = useRef<HTMLHeadingElement>(null);
  const [replie, setReplie] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setReplie(!e.isIntersecting), { rootMargin: "-44px 0px 0px 0px" });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <>
      <div
        className={cn(
          "safe-top sticky top-0 z-30 border-b transition-[background-color,border-color] duration-200",
          replie ? "border-border/70 bg-background/90 backdrop-blur-xl" : "border-transparent bg-transparent",
        )}
      >
        <div className="flex h-11 items-center gap-2 px-4">
          <div className="flex min-w-0 flex-1 items-center">{gauche}</div>
          <div
            className={cn(
              "pointer-events-none absolute left-1/2 max-w-[60%] -translate-x-1/2 truncate text-[15px] font-semibold transition-opacity duration-200",
              replie ? "opacity-100" : "opacity-0",
            )}
            aria-hidden
          >
            {titre}
          </div>
          <div className="flex shrink-0 items-center gap-1">{actions}</div>
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
