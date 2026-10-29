"use client";

import { tr } from "@/lib/i18n";
import { ChoixLangue } from "@/components/repere/choix-langue";
import { EnTete } from "@/components/repere/en-tete";
import { Bannieres, ParMuscle } from "@/components/repere/rubriques";
import { EX } from "@/lib/data/exercices";
import { ROUTINES_SOIN } from "@/lib/data/soin";

/* Exercices : une rangée « Par muscle », puis une grande bannière par rubrique. */
export default function PageExercices() {
  const n = Object.keys(EX).length;
  return (
    <>
      <EnTete surtitre={tr("Bibliothèque · {n} exercices", { n })} titre={tr("Exercices")} actions={<ChoixLangue />} />
      <div className="flex flex-col gap-6 px-4">
        <ParMuscle />
        <section>
          <h2 className="eyebrow mb-2 px-1">{tr("Rubriques")}</h2>
          <Bannieres compte={{ corps: tr("{n} exercices", { n }), soin: tr("{n} routines", { n: ROUTINES_SOIN.length }) }} />
        </section>
      </div>
    </>
  );
}
