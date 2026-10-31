"use client";

import { tr } from "@/lib/i18n";
import { useEffect, ViewTransition } from "react";
import { resynchroniserRappels } from "@/lib/rappels";
import { noterSource } from "@/lib/source";
import { usePathname } from "next/navigation";
import { useRepere } from "@/lib/store";
import { TabBar } from "./tab-bar";
import { MenuLateral } from "./menu-lateral";
import { Installer } from "./installer";
import { RestTimer } from "./rest-timer";
import { Confirmateur } from "./confirmer";
import { Bilan } from "./bilan";
import { SurveillantBadges } from "./motivation";
import { LogoDisque } from "./logo";
import { usePile, useSens } from "@/lib/nav";
import { suivreHistorique } from "@/lib/suivi";
import { suivreDefis } from "@/lib/defis";
import { useVerifierAccesProgramme } from "@/lib/fonctionnalites";
import { memoriserPhotosAuRepos } from "@/lib/photos-hors-ligne";
import { MiseAJour } from "./mise-a-jour";

/* Démarre l'app une fois (session Supabase, état local) et pose la barre
   d'onglets. Les écrans plein écran (accueil, questionnaire) et les tâches
   en cours (une séance, l'assistant, le composeur) s'en passent. */
const SANS_ONGLETS = ["/", "/questionnaire", "/bienvenue", "/entrainement/seance", "/entrainement/assistant", "/entrainement/composer", "/entrainement/cardio", "/entrainement/course", "/progres/bilan", "/admin", "/admin/fiche"];
const glisse = (sens: string | null) => ({ "nav-forward": "nav-forward", "nav-back": "nav-back", default: sens ?? "none" });

export function AppShell({ children }: { children: React.ReactNode }) {
  const pret = useRepere((s) => s.pret);
  const demarrer = useRepere((s) => s.demarrer);
  const chemin = usePathname().replace(/(.)\/$/, "$1");
  const sens = useSens((s) => s.sens);

  useEffect(() => {
    noterSource(); suivreHistorique(); suivreDefis(); demarrer();
    /* appareil inscrit aux rappels : remis au nom du compte et de la langue actuels */
    const t = setTimeout(resynchroniserRappels, 8000);
    return () => clearTimeout(t);
  }, [demarrer]);
  /* programme sur 8 semaines : ouvert compte par compte par l'admin */
  useVerifierAccesProgramme();
  /* Pile des écrans (bouton retour) ; le sens d'un retour ne sert qu'une fois. */
  useEffect(() => {
    usePile.getState().noter(chemin + location.search);
    useSens.setState({ sens: null });
  }, [chemin]);
  /* Mode hors ligne : service worker généré au build (scripts/sw.mjs), enregistré par MiseAJour. */
  useEffect(() => {
    /* photos des recettes et des machines (Unsplash) gardées sur le téléphone */
    memoriserPhotosAuRepos();
  }, []);

  /* guides publics (référencement) : lisibles tout de suite, sans attendre l'app ni ses onglets */
  if (chemin.startsWith("/guides")) return <div className="mx-auto min-h-dvh w-full max-w-[480px]">{children}</div>;
  if (!pret)
    return (
      <div className="grid min-h-dvh place-items-center">
        <div className="flex flex-col items-center gap-3 text-muted-foreground">
          <LogoDisque accent className="size-12 animate-pulse" />
          <span className="eyebrow">{tr("Repère")}</span>
        </div>
      </div>
    );

  const onglets = !SANS_ONGLETS.includes(chemin);
  return (
    <div className="mx-auto min-h-dvh w-full max-w-[480px]">
      <main className={onglets ? "pb-[calc(env(safe-area-inset-bottom)+96px)]" : ""}>
        {/* Chaque écran entre et sort en glissant selon le sens de la navigation
            (lib/nav.ts) ; sans sens donné (onglets, bouton retour du système), il change d'un coup, comme sur iOS. */}
        <ViewTransition key={chemin} enter={glisse(sens)} exit={glisse(sens)} default="none">
          <div>{children}</div>
        </ViewTransition>
      </main>
      <RestTimer avecOnglets={onglets} />
      {onglets && <TabBar />}
      {onglets && <Installer />}
      {onglets && <MenuLateral />}
      {/* le bandeau de mise à jour attend qu'on quitte une tâche en cours (séance, composeur…) */}
      <MiseAJour visible={onglets} />
      <Confirmateur />
      <Bilan />
      <SurveillantBadges />
      {/* app de test (repere-test) : impossible à confondre avec la vraie */}
      {process.env.NEXT_PUBLIC_APP_TEST === "1" && (
        <span className="pointer-events-none fixed top-[max(env(safe-area-inset-top),6px)] left-1/2 z-[60] -translate-x-1/2 rounded-full bg-orange-500 px-2.5 py-0.5 text-[10.5px] font-bold tracking-[0.08em] text-white uppercase shadow">
          {tr("Version test")}
        </span>
      )}
    </div>
  );
}
