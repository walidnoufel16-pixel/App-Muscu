"use client";

import { useEffect, ViewTransition } from "react";
import { usePathname } from "next/navigation";
import { useRepere } from "@/lib/store";
import { TabBar } from "./tab-bar";
import { RestTimer } from "./rest-timer";
import { Confirmateur } from "./confirmer";
import { Bilan } from "./bilan";
import { LogoDisque } from "./logo";
import { usePile, useSens } from "@/lib/nav";

/* Démarre l'app une fois (session Supabase, état local) et pose la barre
   d'onglets. Les écrans plein écran (accueil, questionnaire) et les tâches
   en cours (une séance, l'assistant, le composeur) s'en passent. */
const SANS_ONGLETS = ["/", "/questionnaire", "/bienvenue", "/entrainement/seance", "/entrainement/assistant", "/entrainement/composer", "/entrainement/cardio"];
const glisse = (sens: string | null) => ({ "nav-forward": "nav-forward", "nav-back": "nav-back", default: sens ?? "none" });

export function AppShell({ children }: { children: React.ReactNode }) {
  const pret = useRepere((s) => s.pret);
  const demarrer = useRepere((s) => s.demarrer);
  const chemin = usePathname().replace(/(.)\/$/, "$1");
  const sens = useSens((s) => s.sens);

  useEffect(() => { demarrer(); }, [demarrer]);
  /* Pile des écrans (bouton retour) ; le sens d'un retour ne sert qu'une fois. */
  useEffect(() => {
    usePile.getState().noter(chemin + location.search);
    useSens.setState({ sens: null });
  }, [chemin]);
  /* Mode hors ligne : service worker généré au build (scripts/sw.mjs). */
  useEffect(() => {
    if (process.env.NODE_ENV === "production" && "serviceWorker" in navigator) navigator.serviceWorker.register("/sw.js").catch(() => {});
  }, []);

  if (!pret)
    return (
      <div className="grid min-h-dvh place-items-center">
        <div className="flex flex-col items-center gap-3 text-muted-foreground">
          <LogoDisque accent className="size-12 animate-pulse" />
          <span className="eyebrow">Repère</span>
        </div>
      </div>
    );

  const onglets = !SANS_ONGLETS.includes(chemin);
  return (
    <div className="mx-auto min-h-dvh w-full max-w-[480px]">
      <main className={onglets ? "pb-[calc(env(safe-area-inset-bottom)+96px)]" : ""}>
        {/* Chaque écran entre et sort en glissant selon le sens de la navigation
            (lib/nav.ts) ; sans sens donné (onglets, bouton retour du système), il change sans animation. */}
        <ViewTransition key={chemin} enter={glisse(sens)} exit={glisse(sens)} default="none">
          <div>{children}</div>
        </ViewTransition>
      </main>
      <RestTimer avecOnglets={onglets} />
      {onglets && <TabBar />}
      <Confirmateur />
      <Bilan />
    </div>
  );
}
