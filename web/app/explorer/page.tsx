"use client";

import { useState } from "react";
import { EnTete } from "@/components/repere/en-tete";
import { Bibliotheque, ListeRecherche } from "@/components/repere/bibliotheque";
import { FicheExercice, type FicheOuverte } from "@/components/repere/fiche-exercice";
import { FiltreMateriel } from "@/components/repere/filtre-materiel";
import { Segmente } from "@/components/repere/segmente";
import { selDeclare } from "@/lib/logic/core";
import { useRepere } from "@/lib/store";
import { useBrouillon } from "@/lib/brouillon";

export default function PageExplorer() {
  const A = useRepere((s) => s.etat.A);
  const { sel: selB, setSel } = useBrouillon();
  const sel = selB ?? selDeclare(A);
  const [vue, setVue] = useState<"corps" | "liste">("corps");
  const [zone, setZone] = useState<{ z: string; p: string | null } | null>(null);
  const [q, setQ] = useState("");
  const [fiche, setFiche] = useState<FicheOuverte | null>(null);
  const ouvrir = (id: string) => setFiche({ id, idx: -1, pres: [3, 10, "90 s"], libelle: "bibliothèque" });
  return (
    <>
      <EnTete surtitre="Bibliothèque · 231 exercices" titre="Explorer" />
      <div className="flex flex-col gap-3 px-4">
        <FiltreMateriel sel={sel} declare={selDeclare(A)} onChange={setSel} />
        <Segmente label="Affichage" valeur={vue} onChange={setVue} options={[{ v: "corps", n: "Par le corps" }, { v: "liste", n: "Liste" }]} />
        {vue === "corps"
          ? <Bibliotheque sel={sel} zone={zone} setZone={setZone} onFiche={ouvrir} />
          : <ListeRecherche sel={sel} q={q} setQ={setQ} onFiche={ouvrir} />}
      </div>
      <FicheExercice fiche={fiche} onClose={() => setFiche(null)} />
    </>
  );
}
