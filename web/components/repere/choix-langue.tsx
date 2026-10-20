"use client";

import { changerLangue, langue, tr, type Langue } from "@/lib/i18n";
import { useRepere } from "@/lib/store";
import { cn } from "@/lib/utils";
import { useEffect, useRef, useState } from "react";
import { CaretDownIcon, CheckIcon } from "@phosphor-icons/react";

/** Change la langue : notée dans le compte (envoyée tout de suite, l'app se recharge). */
export function useChangerLangue() {
  const { user, muter, pousser } = useRepere();
  return async (l: Langue) => {
    if (l === langue()) return;
    muter((E) => { E.A.langue = l; });
    if (user) await pousser();
    changerLangue(l);
  };
}

/* Drapeaux dessinés (les émojis drapeaux ne s'affichent pas partout). */
const Drapeau = ({ l }: { l: Langue }) =>
  l === "fr" ? (
    <svg viewBox="0 0 3 2" className="h-4 w-6 rounded-[3px]" shapeRendering="crispEdges" aria-hidden>
      <rect width="1" height="2" fill="#002654" />
      <rect x="1" width="1" height="2" fill="#fff" />
      <rect x="2" width="1" height="2" fill="#ce1126" />
    </svg>
  ) : (
    <svg viewBox="0 0 60 40" className="h-4 w-6 rounded-[3px]" aria-hidden>
      <clipPath id="drapeau-gb"><rect width="60" height="40" /></clipPath>
      <g clipPath="url(#drapeau-gb)">
        <rect width="60" height="40" fill="#012169" />
        <path d="M0 0l60 40M60 0L0 40" stroke="#fff" strokeWidth="8" />
        <path d="M0 0l60 40M60 0L0 40" stroke="#c8102e" strokeWidth="3" />
        <path d="M30 0v40M0 20h60" stroke="#fff" strokeWidth="12" />
        <path d="M30 0v40M0 20h60" stroke="#c8102e" strokeWidth="7" />
      </g>
    </svg>
  );

const NOMS: Record<Langue, string> = { fr: "Français", en: "English" };

/** Liste déroulante de la langue, en haut des quatre onglets. */
export function ChoixLangue() {
  const changer = useChangerLangue(), courante = langue();
  const [ouvert, setOuvert] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!ouvert) return;
    const dehors = (e: PointerEvent) => { if (!ref.current?.contains(e.target as Node)) setOuvert(false); };
    const echap = (e: KeyboardEvent) => { if (e.key === "Escape") setOuvert(false); };
    document.addEventListener("pointerdown", dehors);
    document.addEventListener("keydown", echap);
    return () => { document.removeEventListener("pointerdown", dehors); document.removeEventListener("keydown", echap); };
  }, [ouvert]);
  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOuvert((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={ouvert}
        aria-label={tr("Langue : {nom}", { nom: NOMS[courante] })}
        className="flex h-8 items-center gap-1.5 rounded-full bg-muted pr-2 pl-2.5 text-[12.5px] font-semibold active:scale-95"
      >
        <Drapeau l={courante} />
        {courante.toUpperCase()}
        <CaretDownIcon className={cn("size-3 text-muted-foreground transition-transform", ouvert && "rotate-180")} weight="bold" />
      </button>
      {ouvert && (
        <div role="menu" aria-label={tr("Langue")} className="absolute top-full right-0 z-50 mt-1.5 w-44 origin-top-right animate-[pop_.18s_ease-out] rounded-2xl border border-border/70 bg-card p-1 shadow-[0_12px_32px_-12px_rgba(0,0,0,.35)]">
          {(["fr", "en"] as Langue[]).map((l) => (
            <button
              key={l}
              role="menuitemradio"
              aria-checked={courante === l}
              onClick={() => { setOuvert(false); changer(l); }}
              className="flex h-10 w-full items-center gap-2.5 rounded-xl px-2.5 text-left text-[14.5px] active:bg-muted"
            >
              <Drapeau l={l} />
              <span className="flex-1">{NOMS[l]}</span>
              {courante === l && <CheckIcon className="size-4 text-plate" weight="bold" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
