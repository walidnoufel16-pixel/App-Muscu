"use client";

/* Une rubrique de la bibliothèque (musculation, street, course, soin), ouverte depuis l'accueil
   d'Exercices. Les onglets du haut passent d'une rubrique à l'autre sans revenir en arrière. */
import { tr } from "@/lib/i18n";
import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { EnTete } from "@/components/repere/en-tete";
import { Retour } from "@/components/repere/retour";
import { Bibliotheque } from "@/components/repere/bibliotheque";
import { FicheExercice, type FicheOuverte } from "@/components/repere/fiche-exercice";
import { FiltreMateriel } from "@/components/repere/filtre-materiel";
import { lienRubrique, nomRubrique, RUBRIQUES, type Rubrique } from "@/components/repere/rubriques";
import { VueSoin } from "@/components/repere/soin";
import { VueStreet } from "@/components/repere/street";
import { VueCourse } from "@/components/repere/course";
import { selDeclare, avecSalle } from "@/lib/logic/core";
import { ZONES } from "@/lib/data/referentiels";
import { useRepere } from "@/lib/store";
import { useBrouillon } from "@/lib/brouillon";
import { remplacement } from "@/lib/nav";
import { cn } from "@/lib/utils";

export default function PageRubrique() {
  return <Suspense><Contenu /></Suspense>;
}

function Contenu() {
  const q = useSearchParams(), router = useRouter();
  const v = (RUBRIQUES as string[]).includes(q.get("v") ?? "") ? (q.get("v") as Rubrique) : "corps";
  const z = q.get("z");
  const A = useRepere((s) => s.etat.A);
  const { sel: selB, setSel } = useBrouillon();
  /* venu de « Par muscle » : le matériel du Profil, pour voir tout de suite des exercices */
  const sel = avecSalle(selB ?? (z ? selDeclare(A) : []), A);
  const [zone, setZone] = useState<{ z: string; p: string | null } | null>(z && ZONES[z] ? { z, p: null } : null);
  const [fiche, setFiche] = useState<FicheOuverte | null>(null);
  const ouvrir = (id: string) => setFiche({ id, idx: -1, pres: [3, 10, tr("90 s")], libelle: tr("bibliothèque") });
  const changer = (r: Rubrique) => { if (r === v) return; remplacement(); router.replace(lienRubrique(r)); window.scrollTo(0, 0); };
  return (
    <>
      <EnTete surtitre={tr("Exercices")} titre={nomRubrique(v)} gauche={<Retour repli="/exercices" />} />
      <div className="flex flex-col gap-4 px-4">
        <div role="tablist" aria-label={tr("Rubrique")} className="no-scrollbar -mx-4 flex gap-1.5 overflow-x-auto px-4">
          {RUBRIQUES.map((r) => (
            <button key={r} role="tab" aria-selected={r === v} onClick={() => changer(r)}
              className={cn("h-9 shrink-0 rounded-full border px-3.5 text-[13.5px] font-semibold", r === v ? "border-foreground bg-foreground text-background" : "border-border bg-card text-muted-foreground")}>
              {nomRubrique(r)}
            </button>
          ))}
        </div>
        {v === "corps" ? (
          <>
            <FiltreMateriel sel={sel} declare={selDeclare(A)} onChange={setSel} />
            <Bibliotheque sel={sel} zone={zone} setZone={setZone} onFiche={ouvrir} />
          </>
        ) : v === "street" ? <VueStreet onFiche={ouvrir} />
          : v === "course" ? <VueCourse />
          : <VueSoin onFiche={ouvrir} />}
      </div>
      <FicheExercice fiche={fiche} onClose={() => setFiche(null)} />
    </>
  );
}
