"use client";

/* Bandeau « Read in English? » sur une page en français, seulement si le navigateur n'est pas en
   français ; « Non merci » le cache pour de bon. Pas de redirection automatique (déconseillé pour Google). */
import { useState, useSyncExternalStore } from "react";
import { XIcon } from "@phosphor-icons/react";

const CLE = "repere.blog.anglais-non";

function aProposer() {
  try {
    const fr = (navigator.languages?.length ? navigator.languages : [navigator.language]).some((x) => x?.toLowerCase().startsWith("fr"));
    return !fr && !localStorage.getItem(CLE);
  } catch { return false; }
}

export function ProposerAnglais({ href }: { href: string }) {
  /* lu au chargement dans le navigateur (jamais au build) : langue du navigateur et « Non merci » déjà dit */
  const propose = useSyncExternalStore(() => () => {}, aProposer, () => false);
  const [ferme, setFerme] = useState(false);
  if (!propose || ferme) return null;
  const non = () => { try { localStorage.setItem(CLE, "1"); } catch {} setFerme(true); };
  return (
    <div lang="en" className="fixed inset-x-0 bottom-[max(env(safe-area-inset-bottom),14px)] z-40 mx-auto flex max-w-[440px] items-center gap-2 px-4">
      <a href={href} hrefLang="en" className="flex flex-1 items-center justify-between rounded-2xl bg-[#0a0a0c] px-4 py-3 text-[15px] font-semibold text-white shadow-lg">
        Read in English? <span className="text-[#2dd4bf]">English →</span>
      </a>
      <button onClick={non} aria-label="No thanks" className="grid size-12 place-items-center rounded-2xl bg-[#0a0a0c] text-white shadow-lg"><XIcon className="size-5" weight="bold" /></button>
    </div>
  );
}
