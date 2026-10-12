"use client";

import { tr } from "@/lib/i18n";
import { useState } from "react";
import { EnTete } from "@/components/repere/en-tete";
import { Bibliotheque, ListeRecherche } from "@/components/repere/bibliotheque";
import { FicheExercice, type FicheOuverte } from "@/components/repere/fiche-exercice";
import { FiltreMateriel } from "@/components/repere/filtre-materiel";
import { Segmente } from "@/components/repere/segmente";
import { selDeclare } from "@/lib/logic/core";
import { useRepere } from "@/lib/store";
import { useBrouillon } from "@/lib/brouillon";

export default function PageExercices() {
  const A = useRepere((s) => s.etat.A);
  const { sel: selB, setSel } = useBrouillon();
  const sel = selB ?? selDeclare(A);
  const [vue, setVue] = useState<"corps" | "liste">("corps");
  const [zone, setZone] = useState<{ z: string; p: string | null } | null>(null);
  const [q, setQ] = useState("");
  const [fiche, setFiche] = useState<FicheOuverte | null>(null);
  const ouvrir = (id: string) => setFiche({ id, idx: -1, pres: [3, 10, tr("90 s")], libelle: tr("bibliothèque") });
  return (
    <>
      <EnTete surtitre={tr("Bibliothèque · 231 exercices")} titre={tr("Exercices")} />
      <div className="flex flex-col gap-3 px-4">
        <FiltreMateriel sel={sel} declare={selDeclare(A)} onChange={setSel} />
        <Segmente label={tr("Affichage")} valeur={vue} onChange={setVue} options={[{ v: "corps", n: tr("Par le corps") }, { v: "liste", n: tr("Liste") }]} />
        {vue === "corps"
          ? <Bibliotheque sel={sel} zone={zone} setZone={setZone} onFiche={ouvrir} />
          : <ListeRecherche sel={sel} q={q} setQ={setQ} onFiche={ouvrir} />}
      </div>
      <FicheExercice fiche={fiche} onClose={() => setFiche(null)} />
    </>
  );
}
