"use client";

/* Bandeau « Séance en cours · Reprendre », au-dessus de la barre d'onglets, tant qu'une séance libre
   commencée n'est pas rangée dans Progrès : on peut consulter Repas ou Progrès pendant le repos, et y
   revenir d'un geste (lib/logic/agenda.ts › seancesEnCours). */
import { noter } from "@/lib/mesure";
import { tp, tr } from "@/lib/i18n";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { Route } from "next";
import { ArrowRightIcon, StopCircleIcon, XIcon } from "@phosphor-icons/react";
import { seancesEnCours } from "@/lib/logic/agenda";
import { jourEnCours } from "@/lib/logic/historique";
import { arreterSeance } from "@/lib/logic/actions";
import { useRepere } from "@/lib/store";
import { useCelebrer } from "@/lib/celebrer";
import { AVANT } from "@/lib/nav";
import { tactile } from "@/lib/repos";
import { confirmer } from "./confirmer";

/** Les séances en cours, recalculées chaque minute (elles expirent au bout de 6 heures). */
export function useEnCours() {
  const LOG = useRepere((s) => s.etat.LOG), SEANCES = useRepere((s) => s.etat.SEANCES);
  const [t, setT] = useState(() => Date.now());
  useEffect(() => { const id = setInterval(() => setT(Date.now()), 60_000); return () => clearInterval(id); }, []);
  return seancesEnCours({ LOG, SEANCES }, t);
}

/** Arrêter une séance commencée par erreur (après confirmation) : ses séries validées s'effacent et
    rien n'entre dans Progrès. Renvoie vrai si elle a été arrêtée. */
export async function arreter(s: string, nom: string) {
  const d = jourEnCours(useRepere.getState().etat, s);
  if (!d) return false;
  const ok = await confirmer({
    titre: tr("Arrêter « {nom} » ?", { nom }),
    texte: tr("Les séries validées de cette séance sont effacées et rien n'est ajouté à Progrès. Tes séances enregistrées restent telles quelles."),
    ok: tr("Arrêter la séance"), non: tr("Continuer"), danger: true,
  });
  if (!ok) return false;
  tactile(12);
  useRepere.getState().muter((E) => arreterSeance(E, d, s));
  noter("seance_arretee", { r: s.startsWith("L|") ? "libre" : "plan" });
  useCelebrer.getState().oublier(s);
  return true;
}

/** Bouton discret en bas d'une séance commencée : « Arrêter la séance ». */
export function BoutonArreter({ s, nom, onArretee }: { s: string; nom: string; onArretee: () => void }) {
  const enCours = useRepere((st) => !!jourEnCours(st.etat, s));
  if (!enCours) return null;
  return (
    <button onClick={async () => { if (await arreter(s, nom)) onArretee(); }}
      className="mx-auto flex items-center gap-1.5 px-3 py-2 text-[14px] font-semibold text-destructive active:opacity-70">
      <StopCircleIcon className="size-[18px]" weight="bold" />{tr("Arrêter la séance")}
    </button>
  );
}

export function BandeauSeance() {
  const router = useRouter();
  const c = useEnCours()[0];
  if (!c) return null;
  return (
    <div className="fixed inset-x-0 bottom-[calc(env(safe-area-inset-bottom)+86px)] z-30 mx-auto flex w-[calc(100%-32px)] max-w-[448px] items-center rounded-full bg-plate text-plate-foreground shadow-lg">
      <button onClick={() => { tactile(8); router.push(`/entrainement/seance?l=${c.i}` as Route, AVANT); }}
        className="flex min-w-0 flex-1 items-center gap-3 py-2 pl-4 text-left active:opacity-85">
        <span className="relative flex size-2.5 shrink-0"><span className="absolute inline-flex size-full animate-ping rounded-full bg-current opacity-60" /><span className="relative inline-flex size-2.5 rounded-full bg-current" /></span>
        <span className="min-w-0 flex-1 leading-tight">
          <span className="block text-[11px] font-bold tracking-[0.08em] uppercase opacity-80">{tr("Séance en cours")}</span>
          <span className="block truncate text-[14.5px] font-semibold">{c.nom} · {tp(c.series, "{n} série", "{n} séries")}</span>
        </span>
        <span className="flex h-9 shrink-0 items-center gap-1 rounded-full bg-white px-3.5 text-[14px] font-bold text-[#0a0a0c]">{tr("Reprendre")}<ArrowRightIcon className="size-4" weight="bold" /></span>
      </button>
      <button aria-label={tr("Arrêter la séance")} onClick={() => void arreter(c.s, c.nom)} className="mr-1 ml-0.5 grid size-9 shrink-0 place-items-center rounded-full active:bg-white/15">
        <XIcon className="size-[18px]" weight="bold" />
      </button>
    </div>
  );
}
