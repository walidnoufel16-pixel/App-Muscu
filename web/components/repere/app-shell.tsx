"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { useRepere } from "@/lib/store";
import { TabBar } from "./tab-bar";
import { RestTimer } from "./rest-timer";

/* Démarre l'app une fois (session Supabase, état local) et pose la barre
   d'onglets. Les écrans plein écran (questionnaire, accueil) s'en passent. */
const SANS_ONGLETS = ["/", "/questionnaire/", "/bienvenue/"];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pret = useRepere((s) => s.pret);
  const demarrer = useRepere((s) => s.demarrer);
  const chemin = usePathname();

  useEffect(() => { demarrer(); }, [demarrer]);

  if (!pret)
    return (
      <div className="grid min-h-dvh place-items-center">
        <div className="flex flex-col items-center gap-3 text-muted-foreground">
          <div className="size-10 animate-pulse rounded-full bg-plate/80" />
          <span className="eyebrow">Repère</span>
        </div>
      </div>
    );

  const onglets = !SANS_ONGLETS.includes(chemin);
  return (
    <div className="mx-auto min-h-dvh w-full max-w-[480px]">
      <main className={onglets ? "pb-[calc(env(safe-area-inset-bottom)+96px)]" : ""}>{children}</main>
      <RestTimer avecOnglets={onglets} />
      {onglets && <TabBar />}
    </div>
  );
}
