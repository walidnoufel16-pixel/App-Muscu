"use client";

/* Une rubrique de la bibliothèque (musculation, street, course, soin), ouverte depuis sa bannière
   dans Exercices. Ses onglets naviguent dans la rubrique : un muscle, une partie du street ou de
   la course, une zone de soin. */
import { tr } from "@/lib/i18n";
import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { EnTete } from "@/components/repere/en-tete";
import { Retour } from "@/components/repere/retour";
import { Bibliotheque } from "@/components/repere/bibliotheque";
import { FicheExercice, type FicheOuverte } from "@/components/repere/fiche-exercice";
import { MaterielRepliable } from "@/components/repere/filtre-materiel";
import { Onglets } from "@/components/repere/onglets";
import { nomRubrique, ORDRE_ZONES, RUBRIQUES, type Rubrique } from "@/components/repere/rubriques";
import { useZonesASoigner, VueSoin } from "@/components/repere/soin";
import { VueStreet, type OngletStreet } from "@/components/repere/street";
import { VueCourse } from "@/components/repere/course";
import { selDeclare, avecSalle } from "@/lib/logic/core";
import { ZONES } from "@/lib/data/referentiels";
import { useRepere } from "@/lib/store";
import { useBrouillon } from "@/lib/brouillon";
import { remplacement, useOngletsExercices } from "@/lib/nav";
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
  const v = (RUBRIQUES as string[]).includes(q.get("v") ?? "") ? (q.get("v") as Rubrique) : "corps";
  const A = useRepere((s) => s.etat.A);
  const { sel: selB, setSel } = useBrouillon();
  /* sans choix de matériel : celui du Profil, pour voir tout de suite des exercices */
  const sel = avecSalle(selB ?? selDeclare(A), A);
  const sensibles = useZonesASoigner();
  const [fiche, setFiche] = useState<FicheOuverte | null>(null);
  const ouvrir = (id: string) => setFiche({ id, idx: -1, pres: [3, 10, tr("90 s")], libelle: tr("bibliothèque") });

  /* les onglets de la rubrique ; le choisi vient de l'adresse, sinon du dernier ouvert, sinon le premier */
  const options: { v: string; n: string }[] =
    v === "corps" ? ORDRE_ZONES.map((z) => ({ v: z, n: ZONES[z] }))
    : v === "street" ? [{ v: "programmes", n: tr("Programmes") }, { v: "mesure", n: tr("Sur mesure") }, { v: "familles", n: tr("Familles") }]
    : v === "course" ? [{ v: "plan", n: tr("Mon plan") }, { v: "seances", n: tr("Les séances") }]
    : ZONES_SOIN.map(([z]) => ({ v: z, n: zonesSoinCourt()[z] }));
  const memo = useOngletsExercices((s) => s[v]);
  const valide = (o: string | null | undefined) => (o && options.some((x) => x.v === o) ? o : null);
  const onglet = valide(q.get("o")) ?? valide(q.get("z")) ?? valide(memo) ?? (v === "soin" ? valide(sensibles[0]) : null) ?? options[0].v;
  const changer = (o: string) => {
    useOngletsExercices.setState({ [v]: o });
    remplacement();
    router.replace(`/exercices/rubrique?v=${v}&o=${o}` as Route);
  };
  /* Musculation : la zone est l'onglet, le type de mouvement se choisit dessous */
  const [pat, setPat] = useState<string | null>(null);
  const zone = v === "corps" ? { z: onglet, p: pat } : null;

  return (
    <>
      <EnTete surtitre={tr("Exercices")} titre={nomRubrique(v)} gauche={<Retour repli="/exercices" />} />
      <div className="flex flex-col gap-4 px-4">
        <Onglets label={nomRubrique(v)} options={options} valeur={onglet} onChange={(o) => { setPat(null); changer(o); }} style={v === "street" || v === "course" ? "soulignes" : "pastilles"} />
        {v === "corps" ? (
          <>
            <MaterielRepliable sel={sel} declare={selDeclare(A)} onChange={setSel} />
            <Bibliotheque sel={sel} zone={zone} setZone={(z) => setPat(z?.p ?? null)} onFiche={ouvrir} schema={false} />
          </>
        ) : v === "street" ? <VueStreet onFiche={ouvrir} onglet={onglet as OngletStreet} />
          : v === "course" ? <VueCourse onglet={onglet as "plan" | "seances"} />
          : <VueSoin onFiche={ouvrir} zone={onglet as ZoneSoin} />}
      </div>
      <FicheExercice fiche={fiche} onClose={() => setFiche(null)} />
    </>
  );
}
