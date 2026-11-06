"use client";

/* Entraînement : la semaine en anneaux, la séance du jour en grand, trois raccourcis pour créer,
   « À venir » (et l'écran Agenda), puis les rubriques en mosaïque. Le bouton + ouvre « Nouvelle
   séance ». Oxa Plan ne s'ouvre que par sa rubrique. */
import { AvatarProfil } from "@/components/repere/avatar-profil";
import { loc, tr } from "@/lib/i18n";
import { useState } from "react";
import { PlusIcon } from "@phosphor-icons/react";
import { EnTete } from "@/components/repere/en-tete";
import { Reprise } from "@/components/repere/motivation";
import { FeuillesAgenda, type Feuille } from "@/components/repere/agenda";
import { AVenir, CarteDuJour, Raccourcis, SemaineAnneaux } from "@/components/repere/accueil-entrainement";
import { FeuilleImport } from "@/components/repere/mes-seances";
import { ProgrammeBientot } from "@/components/repere/bientot";
import { Mosaique, type Rubrique } from "@/components/repere/rubriques";
import { useProgramme } from "@/components/repere/programme-vues";
import { jourDe } from "@/lib/logic/historique";
import { useRepere } from "@/lib/store";
import { usePremiereVisite } from "@/lib/entree";
import { tactile } from "@/lib/repos";
import { cn } from "@/lib/utils";
import { useProgrammeActif } from "@/lib/fonctionnalites";
import { LigneRecuperation } from "@/components/repere/recuperation";

export default function PageEntrainement() {
  const etat = useRepere((s) => s.etat);
  const premiere = usePremiereVisite();
  const [auj] = useState(() => jourDe(Date.now()));
  const [f, setF] = useState<Feuille | null>(null);
  /* programme sur 8 semaines : ouvert compte par compte, accessible par sa rubrique seulement */
  const prog = useProgrammeActif();
  const { plan, wk, socle, faites } = useProgramme();
  const enProgramme = prog && plan;
  /* nouvel utilisateur : ni séance faite ni séance programmée, pas de semaine à montrer */
  const debutant = !etat.HIST?.length && !etat.CARDIO?.length && !etat.SORTIES?.length && !etat.AGENDA?.length;

  const rubriques: Rubrique[] = ["libre", ...(prog ? (["programme"] as const) : []), "street", "course", "soin"];
  const detail = enProgramme && !etat.FINI ? { programme: tr("Semaine {a} sur 8 · {b}/{c}", { a: wk + 1, b: faites, c: socle.length }) } : {};
  const date = new Date(auj + "T12:00").toLocaleDateString(loc(), { weekday: "long", day: "numeric", month: "long" });

  return (
    <>
      <EnTete
        surtitre={debutant ? tr("Bienvenue") : date}
        titre={tr("Entraînement")}
        actions={
          <>
            <AvatarProfil />
            <button aria-label={tr("Nouvelle séance")} onClick={() => { tactile(8); setF({ m: "nouvelle", d: auj }); }}
              className="ml-1 grid size-9 place-items-center rounded-full bg-plate text-plate-foreground active:scale-95">
              <PlusIcon className="size-5" weight="bold" />
            </button>
          </>
        }
      />
      <div className={cn("flex flex-col gap-3 px-4", premiere && "entree")}>
        {!debutant && <SemaineAnneaux auj={auj} setF={setF} />}
        {!debutant && <LigneRecuperation auj={auj} />}
        <CarteDuJour auj={auj} setF={setF} />
        <Reprise />
        <Raccourcis />
        <div className="mt-2"><AVenir auj={auj} setF={setF} /></div>
        <section className="mt-2">
          <h2 className="mb-2 px-1 text-[20px] font-extrabold tracking-[-0.015em]">{debutant ? tr("Par où commencer") : tr("Explorer")}</h2>
          <Mosaique rubriques={rubriques} detail={detail} />
        </section>
        {!prog && <ProgrammeBientot className="mt-1" />}
      </div>
      <FeuillesAgenda f={f} setF={setF} auj={auj} />
      <FeuilleImport />
    </>
  );
}
