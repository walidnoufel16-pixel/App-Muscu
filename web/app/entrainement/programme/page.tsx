"use client";

/* Programme : les huit semaines (on choisit celle qu'on suit), les séances de
   la semaine choisie, puis la synthèse de ce que Repère a construit. */
import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { CaretRightIcon, CheckIcon, PersonSimpleRunIcon, StarIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { EnTete } from "@/components/repere/en-tete";
import { Retour } from "@/components/repere/retour";
import { FriseSemaines } from "@/components/repere/seance-vues";
import { Synthese, titreProgramme } from "@/components/repere/synthese";
import { baseRPE, titreSeance, week, wkDone } from "@/lib/logic/core";
import { useRepere } from "@/lib/store";
import { AVANT } from "@/lib/nav";
import { cn } from "@/lib/utils";


export default function PageProgramme() {
  const router = useRouter();
  const etat = useRepere((s) => s.etat);
  const muter = useRepere((s) => s.muter);
  const W = useMemo(() => week(etat), [etat]);
  const plan = etat.FINI || !!etat.PLAN;
  const { wk } = etat;

  if (!plan)
    return (
      <>
        <EnTete titre="Programme" gauche={<Retour repli="/entrainement" />} />
        <div className="flex flex-col gap-3 px-5">
          <p className="text-[15px] leading-relaxed text-muted-foreground">Tu n&apos;as pas encore de programme. Une douzaine de questions suffisent pour le construire.</p>
          <Button variant="plate" size="xl" onClick={() => router.push("/questionnaire", AVANT)}>Construire mon programme</Button>
        </div>
      </>
    );

  const socle = W.map((p, j) => (!p.b && !p.sportOnly ? j : -1)).filter((j) => j >= 0);
  const avancement = Array.from({ length: 8 }, (_, w) => ({ faites: socle.filter((j) => wkDone(etat, w, j, W)).length, total: socle.length }));
  const ouvrir = (d: number) => { muter((E) => { E.day = d; }); router.push("/entrainement/seance", AVANT); };

  return (
    <>
      <EnTete surtitre="Huit semaines" titre={titreProgramme(etat.PLAN)} gauche={<Retour repli="/entrainement" />}>
        <FriseSemaines wk={wk} avancement={avancement} onChoisir={(w) => muter((E) => { E.wk = w; })} />
      </EnTete>
      <div className="flex flex-col gap-8 px-4 pb-6">
        <section>
          <h2 className="eyebrow mb-2 px-1">Semaine {wk + 1} · effort visé <span className="num text-[13px]">RPE {baseRPE(wk)}</span></h2>
          <div className="overflow-hidden rounded-[20px] border border-border/80 bg-card">
            {W.map((p, i) => {
              const fait = wkDone(etat, wk, i, W);
              return (
                <button key={i} onClick={() => ouvrir(i)} className="flex w-full items-center gap-3 border-t border-border/70 px-4 py-3 text-left first:border-t-0 active:bg-muted">
                  <span className={cn("num grid size-8 shrink-0 place-items-center rounded-[10px] text-[15px] font-bold", fait ? "bg-plate text-plate-foreground" : "bg-muted text-muted-foreground")}>
                    {fait ? <CheckIcon className="size-4" weight="bold" /> : p.b ? <StarIcon className="size-4" /> : p.sportOnly ? <PersonSimpleRunIcon className="size-4" /> : i + 1}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[15px] font-medium">{p.sportOnly ? "Ton sport" : titreSeance(p.t)}</span>
                    <span className="block text-[12.5px] text-muted-foreground">
                      {p.b ? "Séance bonus, facultative" : p.sportOnly ? "Ta pratique, comptée dans le cycle" : `Séance ${i + 1} · ${(p.x || []).length} exercices`}{fait ? " · faite" : ""}
                    </span>
                  </span>
                  <CaretRightIcon className="size-4 text-muted-foreground" />
                </button>
              );
            })}
          </div>
        </section>
        <section>
          <h2 className="eyebrow mb-3 px-1">Ce qu&apos;on va faire</h2>
          <Synthese />
        </section>
      </div>
    </>
  );
}
