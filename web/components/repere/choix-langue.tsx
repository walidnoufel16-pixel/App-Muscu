"use client";

import { changerLangue, langue, tr, type Langue } from "@/lib/i18n";
import { useRepere } from "@/lib/store";
import { cn } from "@/lib/utils";

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
    <svg viewBox="0 0 3 2" className="h-[14px] w-[21px] rounded-[3px]" aria-hidden>
      <rect width="1" height="2" fill="#002654" />
      <rect x="1" width="1" height="2" fill="#fff" />
      <rect x="2" width="1" height="2" fill="#ce1126" />
    </svg>
  ) : (
    <svg viewBox="0 0 60 40" className="h-[14px] w-[21px] rounded-[3px]" aria-hidden>
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

/** Bascule français / anglais, en haut des quatre onglets. */
export function ChoixLangue() {
  const changer = useChangerLangue(), courante = langue();
  return (
    <div role="group" aria-label={tr("Langue")} className="flex items-center gap-0.5 rounded-full bg-muted p-0.5">
      {(["fr", "en"] as Langue[]).map((l) => (
        <button
          key={l}
          onClick={() => changer(l)}
          aria-pressed={courante === l}
          aria-label={l === "fr" ? "Français" : "English"}
          className={cn("grid h-7 w-9 place-items-center rounded-full transition-[background-color,opacity] active:scale-95",
            courante === l ? "bg-card shadow-sm" : "opacity-45")}
        >
          <Drapeau l={l} />
        </button>
      ))}
    </div>
  );
}
