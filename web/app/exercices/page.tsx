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
import { useBrouillon } from "@/lib/brouillon";
import { useVueExercices, type VueExercices } from "@/lib/nav";

export default function PageExercices() {
  const A = useRepere((s) => s.etat.A);
  const { sel: selB, setSel } = useBrouillon();
  const sel = avecSalle(selB ?? selDeclare(A), A);
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
        <Segmente label={tr("Affichage")} valeur={vue} onChange={setVue} options={[{ v: "corps", n: tr("Corps") }, { v: "liste", n: tr("Liste") }, { v: "soin", n: tr("Soin") }, { v: "street", n: tr("Street") }]} />
        {vue === "corps" ? <Bibliotheque sel={sel} zone={zone} setZone={setZone} onFiche={ouvrir} />
          : vue === "liste" ? <ListeRecherche sel={sel} q={q} setQ={setQ} onFiche={ouvrir} />
          : vue === "soin" ? <VueSoin onFiche={ouvrir} />
          : <VueStreet onFiche={ouvrir} />}
      </div>
      <FicheExercice fiche={fiche} onClose={() => setFiche(null)} />
    </>
  );
}
