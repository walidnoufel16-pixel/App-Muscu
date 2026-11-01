"use client";

/* Une rubrique d'Entraînement, ouverte depuis sa bannière. Ses onglets naviguent dans la rubrique :
   la semaine ou tout le programme, un muscle, une partie du street ou de la course, une zone de soin.
   Séance libre n'a pas d'onglets : Mes séances, le corps humain, puis créer, composer, importer. */
import { tr } from "@/lib/i18n";
import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { EnTete } from "@/components/repere/en-tete";
import { Retour } from "@/components/repere/retour";
import { FicheExercice, type FicheOuverte } from "@/components/repere/fiche-exercice";
import { Onglets } from "@/components/repere/onglets";
import { nomRubrique, RUBRIQUES, type Rubrique } from "@/components/repere/rubriques";
import { useZonesASoigner, VueSoin } from "@/components/repere/soin";
import { VueStreet, type OngletStreet } from "@/components/repere/street";
import { VueCourse } from "@/components/repere/course";
import { useRepere } from "@/lib/store";
import { AVANT, remplacement, useOngletsExercices } from "@/lib/nav";
import { CreerSeance, MesSeances } from "@/components/repere/mes-seances";
import { CorpsDuJour } from "@/components/repere/corps-du-jour";
import { Hero, MaSemaine, ToutLeProgramme } from "@/components/repere/programme-vues";
import { ProgrammeBientot } from "@/components/repere/bientot";
import { useProgrammeActif } from "@/lib/fonctionnalites";
import { ZONES_SOIN, type ZoneSoin } from "@/lib/data/soin";
import type { Route } from "next";

export default function PageRubrique() {
  return <Suspense><Contenu /></Suspense>;
}

/* onglets courts pour les zones de soin (le nom complet est dans la carte de routine) */
const zonesSoinCourt = (): Record<ZoneSoin, string> => ({
  epaules: tr("Épaules"), hanches: tr("Hanches"), dos: tr("Bas du dos"), genoux: tr("Genoux"), chevilles: tr("Chevilles"), poignets: tr("Poignets"), nuque: tr("Nuque"),
});

function Contenu() {
  const q = useSearchParams(), router = useRouter();
  const v = (RUBRIQUES as string[]).includes(q.get("v") ?? "") ? (q.get("v") as Rubrique) : "libre";
  const sensibles = useZonesASoigner();
  const prog = useProgrammeActif();
  const plan = useRepere((s) => s.etat.FINI || !!s.etat.PLAN);
  const aDesSeances = useRepere((s) => !!s.etat.SEANCES.length || !!s.etat.SEANCES_CARDIO?.length);
  const [fiche, setFiche] = useState<FicheOuverte | null>(null);
  const ouvrir = (id: string) => setFiche({ id, idx: -1, pres: [3, 10, tr("90 s")], libelle: tr("bibliothèque") });

  /* les onglets de la rubrique ; le choisi vient de l'adresse, sinon du dernier ouvert, sinon le premier */
  const options: { v: string; n: string }[] =
    v === "libre" ? []
    : v === "programme" ? (prog && plan ? [{ v: "semaine", n: tr("Ma semaine") }, { v: "tout", n: tr("Tout le programme") }] : [])
    : v === "street" ? [{ v: "programmes", n: tr("Programmes") }, { v: "familles", n: tr("Familles") }]
    : v === "course" ? []
    : ZONES_SOIN.map(([z]) => ({ v: z, n: zonesSoinCourt()[z] }));
  const memo = useOngletsExercices((s) => s[v]);
  const valide = (o: string | null | undefined) => (o && options.some((x) => x.v === o) ? o : null);
  const onglet = valide(q.get("o")) ?? valide(memo) ?? (v === "soin" ? valide(sensibles[0]) : null) ?? options[0]?.v ?? "";
  const changer = (o: string) => {
    useOngletsExercices.setState({ [v]: o });
    remplacement();
    router.replace(`/entrainement/rubrique?v=${v}&o=${o}` as Route);
  };

  return (
    <>
      <EnTete titre={nomRubrique(v)} gauche={<Retour repli="/entrainement" />} />
      <div className="flex flex-col gap-4 px-4 pb-6">
        {options.length > 0 && <Onglets label={nomRubrique(v)} options={options} valeur={onglet} onChange={changer} style={v === "soin" ? "pastilles" : "soulignes"} />}
        {v === "libre" ? (
          <div className="flex flex-col gap-6 pb-20">
            {/* tes séances d'abord ; le corps pour en créer une sur les muscles touchés ; puis les trois façons de faire */}
            {aDesSeances && <MesSeances />}
            <CorpsDuJour titre={aDesSeances ? tr("Ou travaille autre chose aujourd'hui ?") : tr("Qu'est-ce que tu travailles aujourd'hui ?")} />
            <CreerSeance />
          </div>
        ) : v === "programme" ? (
          !prog ? <ProgrammeBientot />
          : !plan ? (
            <Hero
              surtitre={`Oxa Plan · ${tr("8 semaines")}`}
              titre={tr("Construis ton programme")}
              texte={tr("Une douzaine de questions sur ton objectif, ton matériel et ton rythme : Oxa prépare huit semaines de séances et fait monter l'effort semaine après semaine.")}
              bouton={tr("Commencer le questionnaire")}
              onClick={() => router.push("/questionnaire", AVANT)}
            />
          ) : onglet === "tout" ? <ToutLeProgramme /> : <MaSemaine />
        ) : v === "street" ? <VueStreet onFiche={ouvrir} onglet={onglet as OngletStreet} />
          : v === "course" ? <VueCourse />
          : <VueSoin onFiche={ouvrir} zone={onglet as ZoneSoin} />}
      </div>
      <FicheExercice fiche={fiche} onClose={() => setFiche(null)} />
    </>
  );
}
