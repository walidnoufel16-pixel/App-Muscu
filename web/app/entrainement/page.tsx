"use client";

/* Entraînement : en tête, ce qu'il y a à faire (la séance du jour du programme, sinon ta
   prochaine séance libre), ta régularité et tes protéines ; puis une bannière par rubrique.
   Juste après l'inscription, il n'y a que les bannières, Séance libre en premier. */
import { tr } from "@/lib/i18n";
import { useRouter } from "next/navigation";
import { ChartLineUpIcon } from "@phosphor-icons/react";
import { ChoixLangue } from "@/components/repere/choix-langue";
import { EnTete } from "@/components/repere/en-tete";
import { CarteRegularite, Reprise } from "@/components/repere/motivation";
import { CarteProteines } from "@/components/repere/proteines";
import { CarteCourse } from "@/components/repere/course";
import { ProgrammeBientot } from "@/components/repere/bientot";
import { Bannieres, type Rubrique } from "@/components/repere/rubriques";
import { CarteProgrammeDuJour, Hero, useProgramme } from "@/components/repere/programme-vues";
import { musclesDe } from "@/lib/logic/core";
import { dureeTotale as dureeSeance } from "@/lib/logic/combinee";
import { prochaineLibre } from "@/lib/logic/prochaine";
import { useRepere } from "@/lib/store";
import { AVANT } from "@/lib/nav";
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
        {enProgramme ? <CarteProgrammeDuJour /> : <ProchaineLibre />}
        <Reprise />
        {habitue && (
          <>
            <div className="grid grid-cols-2 gap-3">
              <CarteRegularite tuile />
              {etat.A.protOff ? <TuileVide /> : <CarteProteines tuile />}
            </div>
            <CarteCourse />
          </>
        )}
        <section className="mt-4">
          <h2 className="eyebrow mb-2 px-1">{habitue ? tr("Rubriques") : tr("Par où commencer")}</h2>
          <Bannieres rubriques={rubriques} texte={enProgramme ? {} : { programme: tr("Construis ton programme : une douzaine de questions, puis huit semaines de séances.") }} detail={detailProgramme ? { programme: detailProgramme } : {}} />
        </section>
        {!prog && <ProgrammeBientot className="mt-1" />}
      </div>
    </>
  );
}

/* Sans programme : la séance libre à faire (une jamais faite, sinon la plus ancienne). */
function ProchaineLibre() {
  const router = useRouter();
  const etat = useRepere((s) => s.etat);
  const i = prochaineLibre(etat.SEANCES, etat.HIST);
  if (i == null) return null;
  const s = etat.SEANCES[i], ids = s.ex.map((e) => e.id);
  return (
    <Hero
      surtitre={tr("Ta prochaine séance")}
      titre={s.nom}
      texte={tr("{length} exercices · environ {a} min · {b}", { length: s.ex.length, a: dureeSeance(s), b: musclesDe(ids).slice(0, 3).join(", ") })}
      bouton={tr("Commencer")}
      onClick={() => router.push(`/entrainement/seance?l=${i}`, AVANT)}
    />
  );
}

/* Sans protéines affichées : la tuile de régularité garde sa moitié, l'autre mène aux Progrès. */
function TuileVide() {
  const router = useRouter();
  return (
    <button onClick={() => router.push("/progres", AVANT)} className="flex min-h-[124px] flex-col justify-between rounded-[22px] bg-card p-3.5 text-left active:scale-[.98]">
      <ChartLineUpIcon className="size-7 text-plate" />
      <span className="text-[13px] leading-snug font-medium">{tr("Tes records et ton volume")}</span>
    </button>
  );
}
