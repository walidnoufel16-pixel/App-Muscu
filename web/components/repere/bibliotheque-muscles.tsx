"use client";

/* La bibliothèque d'exercices par muscle : un onglet par zone du corps, la liste tout de suite
   (matériel du Profil par défaut, modifiable sur une ligne), les types de mouvement dessous.
   Toucher un exercice ouvre sa fiche. Dans « Créer une séance pour moi » › Exercices. */
import { tr } from "@/lib/i18n";
import { useState } from "react";
import { Bibliotheque } from "./bibliotheque";
import { FicheExercice, type FicheOuverte } from "./fiche-exercice";
import { MaterielRepliable } from "./filtre-materiel";
import { Onglets } from "./onglets";
import { selDeclare, avecSalle } from "@/lib/logic/core";
import { ZONES } from "@/lib/data/referentiels";
import { useRepere } from "@/lib/store";
import { useBrouillon } from "@/lib/brouillon";
import { useOngletsExercices } from "@/lib/nav";

const ORDRE_ZONES = ["pectoraux", "dos", "epaules", "bras", "jambes", "fessiers", "tronc"];

export function BibliothequeMuscles() {
  const A = useRepere((s) => s.etat.A);
  const { sel: selB, setSel } = useBrouillon();
  /* sans choix de matériel : celui du Profil, pour voir tout de suite des exercices */
  const sel = avecSalle(selB ?? selDeclare(A), A);
  /* l'app retient le dernier muscle ouvert, le temps de la session */
  const memo = useOngletsExercices((s) => s.muscles);
  const zone = memo && ZONES[memo] ? memo : ORDRE_ZONES[0];
  const [pat, setPat] = useState<string | null>(null);
  const [fiche, setFiche] = useState<FicheOuverte | null>(null);
  return (
    <div className="flex flex-col gap-4">
      <Onglets label={tr("Muscles")} options={ORDRE_ZONES.map((z) => ({ v: z, n: ZONES[z] }))} valeur={zone}
        onChange={(z) => { setPat(null); useOngletsExercices.setState({ muscles: z }); }} />
      <MaterielRepliable sel={sel} declare={selDeclare(A)} onChange={setSel} />
      <Bibliotheque sel={sel} zone={{ z: zone, p: pat }} setZone={(z) => setPat(z?.p ?? null)} schema={false}
        onFiche={(id) => setFiche({ id, idx: -1, pres: [3, 10, tr("90 s")], libelle: tr("bibliothèque") })} />
      <FicheExercice fiche={fiche} onClose={() => setFiche(null)} />
    </div>
  );
}
