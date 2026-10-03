"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CaretLeftIcon, PencilSimpleIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { EnTete } from "@/components/repere/en-tete";
import { ExerciceCarte } from "@/components/repere/exercice-carte";
import { FicheExercice, type FicheOuverte } from "@/components/repere/fiche-exercice";
import { Collation, Echauffement } from "@/components/repere/seance-vues";
import { Segmente } from "@/components/repere/segmente";
import { TableauSeries } from "@/components/repere/tableau-series";
import { EX } from "@/lib/data/exercices";
import { ctxLibre, musclesDe, noRPE, rirTxt, typeSeance } from "@/lib/logic/core";
import { dureeEstimee, objCollation } from "@/lib/logic/assistant";
import * as act from "@/lib/logic/actions";
import { useRepere } from "@/lib/store";
import { ARRIERE, AVANT } from "@/lib/nav";
import { useBrouillon } from "@/lib/brouillon";
import { tactile } from "@/lib/repos";

function Seance() {
  const router = useRouter();
  const i = Number(useSearchParams().get("i") ?? -1);
  const { etat, muter } = useRepere();
  const setLibre = useBrouillon((s) => s.setLibre);
  const [sect, setSect] = useState<0 | 1 | 2>(1);
  const [ouvert, setOuvert] = useState<string | null>(null);
  const [fiche, setFiche] = useState<FicheOuverte | null>(null);
  const S = etat.SEANCES[i];

  if (!S)
    return (
      <div className="p-8 text-center text-muted-foreground">
        Séance introuvable. <Button variant="link" onClick={() => router.push("/seances", ARRIERE)}>Retour</Button>
      </div>
    );

  const faux = { t: S.nom, x: S.ex.map((e) => [e.id, e.s, e.r, e.p, 0] as [string, number, number, string, number]) };
  const modifier = () => { setLibre({ ...structuredClone(S), idx: i }); router.push("/seances/composer", AVANT); };

  return (
    <>
      <EnTete
        surtitre={`Séance libre · ${S.ex.length} exercices · environ ${dureeEstimee(S.ex)} min`}
        titre={S.nom}
        gauche={<Button variant="ghost" size="sm" className="-ml-2 text-[15px]" onClick={() => router.push("/seances", ARRIERE)}><CaretLeftIcon className="size-5" />Séances</Button>}
        actions={<Button variant="ghost" size="sm" className="text-[15px]" onClick={modifier}><PencilSimpleIcon className="size-4" />Modifier</Button>}
      >
        <div className="mt-2 flex flex-wrap gap-1.5">
          {musclesDe(S.ex.map((e) => e.id)).map((m) => <span key={m} className="rounded-full bg-card px-2.5 py-1 text-[12.5px] font-medium">{m}</span>)}
        </div>
      </EnTete>
      <div className="px-4 pb-3">
        <Segmente label="Parties de la séance" valeur={sect} onChange={setSect} options={[{ v: 0, n: "Échauffement" }, { v: 1, n: "Séance" }, { v: 2, n: "Collation" }]} />
      </div>
      {sect === 0 && <Echauffement type={typeSeance(faux)} onFiche={(id) => setFiche({ id, idx: -1, pres: [1, 10, "—"], libelle: "échauffement" })} />}
      {sect === 2 && <Collation obj={objCollation(etat.A, S)} onChanger={(o) => muter((E) => { E.SEANCES[i].colObj = o; })} />}
      {sect === 1 && (
        <div className="flex flex-col gap-2.5 px-4">
          {S.ex.map((e, j) => {
            const c = ctxLibre(etat, i, j);
            if (!c) return null;
            const x = EX[e.id], L = etat.LOG[c.k], r = noRPE(e.id) ? 0 : 8;
            const prescr = x.ch === "temps" ? `${e.s} × ${e.r}s` : x.ch === "dist" ? `${e.s} × ${e.r}m` : `${e.s} × ${e.r}`;
            return (
              <ExerciceCarte
                key={c.k}
                num={j + 1} id={e.id} prescr={prescr} repos={e.p} rpe={r} L={L} n={e.s} ouvert={ouvert === c.k}
                onToggle={() => { tactile(5); setOuvert(ouvert === c.k ? null : c.k); }}
                onFiche={() => setFiche({ id: e.id, idx: -1, pres: [e.s, e.r, e.p], libelle: "séance libre", rpe: r || undefined })}
                onTout={() => { tactile(12); muter((E) => act.toutCocher(E, c)); }}
              >
                <TableauSeries c={c} rpe={r} onReplier={() => setOuvert(null)} />
              </ExerciceCarte>
            );
          })}
          <p className="px-2 pt-1 text-center text-[12.5px] text-muted-foreground">
            Effort visé <b className="font-semibold text-foreground">RPE 8</b> : {rirTxt(8)} à la fin de chaque série.
          </p>
        </div>
      )}
      <FicheExercice fiche={fiche} onClose={() => setFiche(null)} />
    </>
  );
}

export default function PageSeance() {
  return (
    <Suspense>
      <Seance />
    </Suspense>
  );
}
