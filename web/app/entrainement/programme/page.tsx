"use client";

/* Programme : les huit semaines (on choisit celle qu'on suit), les séances de
   la semaine choisie, puis la synthèse de ce que Repère a construit. */
import { tr } from "@/lib/i18n";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { EnTete } from "@/components/repere/en-tete";
import { Retour } from "@/components/repere/retour";
import { titreProgramme } from "@/components/repere/synthese";
import { ToutLeProgramme } from "@/components/repere/programme-vues";
import { useRepere } from "@/lib/store";
import { useProgrammeActif } from "@/lib/fonctionnalites";
import { AVANT } from "@/lib/nav";


export default function PageProgramme() {
  const router = useRouter();
  /* programme sur 8 semaines mis de côté : retour aux séances libres */
  const prog = useProgrammeActif();
  useEffect(() => { if (!prog) router.replace("/entrainement"); }, [prog, router]);
  const etat = useRepere((s) => s.etat);
  const plan = etat.FINI || !!etat.PLAN;

  if (!plan)
    return (
      <>
        <EnTete titre={tr("Programme")} gauche={<Retour repli="/entrainement" />} />
        <div className="flex flex-col gap-3 px-5">
          <p className="text-[15px] leading-relaxed text-muted-foreground">{tr("Tu n'as pas encore de programme. Une douzaine de questions suffisent pour le construire.")}</p>
          <Button variant="plate" size="xl" onClick={() => router.push("/questionnaire", AVANT)}>{tr("Construire mon programme")}</Button>
        </div>
      </>
    );

  return (
    <>
      <EnTete surtitre={tr("Huit semaines")} titre={titreProgramme(etat.PLAN)} gauche={<Retour repli="/entrainement" />} />
      <div className="px-4 pb-6"><ToutLeProgramme /></div>
    </>
  );
}
