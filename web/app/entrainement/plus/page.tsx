"use client";

/* Plus d'entraînements : tout ce qui n'est pas la musculation, rangé hors de l'accueil.
   Le bouton punaise épingle un entraînement sur l'accueil. */
import { tr } from "@/lib/i18n";
import { EnTete } from "@/components/repere/en-tete";
import { Retour } from "@/components/repere/retour";
import { AUTRES, LigneAutre } from "@/components/repere/plus-entrainements";
import { ProgrammeBientot } from "@/components/repere/bientot";
import { useProgrammeActif } from "@/lib/fonctionnalites";

export default function PagePlus() {
  const prog = useProgrammeActif();
  return (
    <>
      <EnTete titre={tr("Plus d'entraînements")} gauche={<Retour repli="/entrainement" />} />
      <div className="flex flex-col gap-2 px-4 pb-24">
        <p className="mb-1 px-1 text-[14px] leading-snug text-muted-foreground">{tr("D'autres façons de t'entraîner avec Oxa. Ta récupération et ton agenda suivent partout.")}</p>
        {AUTRES.map((a) => <LigneAutre key={a} a={a} epingle />)}
        <p className="mt-2 px-1 text-[12.5px] leading-snug text-muted-foreground">{tr("Tu en utilises un souvent ? Touche la punaise : il apparaît sur ton accueil.")}</p>
        {!prog && <ProgrammeBientot className="mt-3" />}
      </div>
    </>
  );
}
