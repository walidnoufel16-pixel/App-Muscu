"use client";

/* Entraînement : en tête, « Mon agenda » (deux semaines de séances faites et prévues, et la
   séance du jour), puis une bannière par rubrique. */
import { tr } from "@/lib/i18n";
import { ChoixLangue } from "@/components/repere/choix-langue";
import { EnTete } from "@/components/repere/en-tete";
import { Reprise } from "@/components/repere/motivation";
import { MonAgenda } from "@/components/repere/agenda";
import { ProgrammeBientot } from "@/components/repere/bientot";
import { Bannieres, type Rubrique } from "@/components/repere/rubriques";
import { useProgramme } from "@/components/repere/programme-vues";
import { useRepere } from "@/lib/store";
import { usePremiereVisite } from "@/lib/entree";
import { cn } from "@/lib/utils";
import { useProgrammeActif } from "@/lib/fonctionnalites";

export default function PageEntrainement() {
  const etat = useRepere((s) => s.etat);
  const premiere = usePremiereVisite();
  /* programme sur 8 semaines : ouvert compte par compte */
  const prog = useProgrammeActif();
  const { plan, wk, socle, faites } = useProgramme();
  const enProgramme = prog && plan;
  const habitue = enProgramme || !!etat.SEANCES.length || !!etat.HIST?.length || !!etat.CARDIO?.length || !!etat.COURSE;

  const rubriques: Rubrique[] = ["libre", ...(prog ? (["programme"] as const) : []), "street", "course", "soin"];
  const detailProgramme = enProgramme && !etat.FINI ? tr("Semaine {a} sur 8 · {b} séance{c} sur {d}", { a: wk + 1, b: faites, c: faites > 1 ? "s" : "", d: socle.length }) : undefined;

  return (
    <>
      <EnTete
        surtitre={enProgramme && !etat.FINI ? tr("Semaine {a} sur 8", { a: wk + 1 }) : habitue ? tr("Ton entraînement") : tr("Bienvenue")}
        titre={tr("Entraînement")}
        actions={<ChoixLangue />}
      />
      <div className={cn("flex flex-col gap-3 px-4", premiere && "entree")}>
        {/* deux semaines de séances (faites et prévues), et la séance du jour */}
        <MonAgenda />
        <Reprise />
        <section className="mt-4">
          <h2 className="eyebrow mb-2 px-1">{habitue ? tr("Rubriques") : tr("Par où commencer")}</h2>
          <Bannieres rubriques={rubriques} texte={enProgramme ? {} : { programme: tr("Construis ton programme : une douzaine de questions, puis huit semaines de séances.") }} detail={detailProgramme ? { programme: detailProgramme } : {}} />
        </section>
        {!prog && <ProgrammeBientot className="mt-1" />}
      </div>
    </>
  );
}
