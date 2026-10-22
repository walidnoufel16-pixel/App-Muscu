"use client";

import { tr } from "@/lib/i18n";
import { useState } from "react";
import { ChoixLangue } from "@/components/repere/choix-langue";
import { EnTete } from "@/components/repere/en-tete";
import { Bibliotheque, ListeRecherche } from "@/components/repere/bibliotheque";
import { FicheExercice, type FicheOuverte } from "@/components/repere/fiche-exercice";
import { FiltreMateriel } from "@/components/repere/filtre-materiel";
import { Segmente } from "@/components/repere/segmente";
import { selDeclare, avecSalle } from "@/lib/logic/core";
import { useRepere } from "@/lib/store";
import { EX } from "@/lib/data/exercices";
import { VueSoin } from "@/components/repere/soin";
import { VueStreet } from "@/components/repere/street";
import { VueCourse } from "@/components/repere/course";
import { Input } from "@/components/ui/input";
import { MagnifyingGlassIcon } from "@phosphor-icons/react";
import { useBrouillon } from "@/lib/brouillon";
import { useVueExercices, type VueExercices } from "@/lib/nav";

export default function PageExercices() {
  const A = useRepere((s) => s.etat.A);
  const { sel: selB, setSel } = useBrouillon();
  const sel = avecSalle(selB ?? [], A);
  const vue = useVueExercices((s) => s.vue);
  const setVue = (v: VueExercices) => useVueExercices.setState({ vue: v });
  const [zone, setZone] = useState<{ z: string; p: string | null } | null>(null);
  const [q, setQ] = useState("");
  const [fiche, setFiche] = useState<FicheOuverte | null>(null);
  const ouvrir = (id: string) => setFiche({ id, idx: -1, pres: [3, 10, tr("90 s")], libelle: tr("bibliothèque") });
  return (
    <>
      <EnTete surtitre={tr("Bibliothèque · {n} exercices", { n: Object.keys(EX).length })} titre={tr("Exercices")} actions={<ChoixLangue />} />
      <div className="flex flex-col gap-3 px-4">
        <FiltreMateriel sel={sel} declare={selDeclare(A)} onChange={setSel} />
        <Segmente label={tr("Rubrique")} valeur={vue} onChange={setVue} options={[{ v: "corps", n: tr("Corps") }, { v: "street", n: tr("Street") }, { v: "course", n: tr("Course") }, { v: "soin", n: tr("Soin") }]} />
        {vue === "corps" ? (
          <>
            {/* la loupe : un nom tapé remplace le schéma par la liste */}
            <div className="relative">
              <MagnifyingGlassIcon className="absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder={tr("Rechercher un exercice…")} aria-label={tr("Rechercher un exercice…")} className="h-11 rounded-2xl bg-card pl-10 text-[15px]" />
            </div>
            {q.trim() ? <ListeRecherche sel={sel} q={q} setQ={setQ} onFiche={ouvrir} sansChamp /> : <Bibliotheque sel={sel} zone={zone} setZone={setZone} onFiche={ouvrir} />}
          </>
        ) : vue === "street" ? <VueStreet onFiche={ouvrir} />
          : vue === "course" ? <VueCourse />
          : <VueSoin onFiche={ouvrir} />}
      </div>
      <FicheExercice fiche={fiche} onClose={() => setFiche(null)} />
    </>
  );
}
