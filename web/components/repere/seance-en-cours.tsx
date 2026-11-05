"use client";

/* Bandeau « Séance en cours · Reprendre », au-dessus de la barre d'onglets, tant qu'une séance libre
   commencée n'est pas rangée dans Progrès : on peut consulter Repas ou Progrès pendant le repos, et y
   revenir d'un geste (lib/logic/agenda.ts › seancesEnCours). */
import { tp, tr } from "@/lib/i18n";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { Route } from "next";
import { ArrowRightIcon } from "@phosphor-icons/react";
import { seancesEnCours } from "@/lib/logic/agenda";
import { useRepere } from "@/lib/store";
import { AVANT } from "@/lib/nav";
import { tactile } from "@/lib/repos";

/** Les séances en cours, recalculées chaque minute (elles expirent au bout de 6 heures). */
export function useEnCours() {
  const LOG = useRepere((s) => s.etat.LOG), SEANCES = useRepere((s) => s.etat.SEANCES);
  const [t, setT] = useState(() => Date.now());
  useEffect(() => { const id = setInterval(() => setT(Date.now()), 60_000); return () => clearInterval(id); }, []);
  return seancesEnCours({ LOG, SEANCES }, t);
}

export function BandeauSeance() {
  const router = useRouter();
  const c = useEnCours()[0];
  if (!c) return null;
  return (
    <button onClick={() => { tactile(8); router.push(`/entrainement/seance?l=${c.i}` as Route, AVANT); }}
      className="fixed inset-x-0 bottom-[calc(env(safe-area-inset-bottom)+86px)] z-30 mx-auto flex w-[calc(100%-32px)] max-w-[448px] items-center gap-3 rounded-full bg-plate py-2 pr-2 pl-4 text-left text-plate-foreground shadow-lg active:scale-[.98]">
      <span className="relative flex size-2.5 shrink-0"><span className="absolute inline-flex size-full animate-ping rounded-full bg-current opacity-60" /><span className="relative inline-flex size-2.5 rounded-full bg-current" /></span>
      <span className="min-w-0 flex-1 leading-tight">
        <span className="block text-[11px] font-bold tracking-[0.08em] uppercase opacity-80">{tr("Séance en cours")}</span>
        <span className="block truncate text-[14.5px] font-semibold">{c.nom} · {tp(c.series, "{n} série", "{n} séries")}</span>
      </span>
      <span className="flex h-9 shrink-0 items-center gap-1 rounded-full bg-white px-3.5 text-[14px] font-bold text-[#0a0a0c]">{tr("Reprendre")}<ArrowRightIcon className="size-4" weight="bold" /></span>
    </button>
  );
}
