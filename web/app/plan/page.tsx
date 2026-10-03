"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { CheckIcon, InfoIcon, SparkleIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Drawer, DrawerContent, DrawerDescription, DrawerTitle } from "@/components/ui/drawer";
import { EnTete } from "@/components/repere/en-tete";
import { ExerciceCarte } from "@/components/repere/exercice-carte";
import { FicheExercice, type FicheOuverte } from "@/components/repere/fiche-exercice";
import { Collation, Echauffement, FriseSemaines, Remplacer } from "@/components/repere/seance-vues";
import { Segmente } from "@/components/repere/segmente";
import { TableauSeries } from "@/components/repere/tableau-series";
import { CarteSport } from "@/components/repere/carte-sport";
import { EX } from "@/lib/data/exercices";
import { AXES } from "@/lib/data/referentiels";
import {
  alternativesDe, baseRPE, ctxPlan, curId, espacementDe, key, musclesDe, nomPat, noRPE, rirTxt, rpeOf, sportsChoisis, titreSeance, typeSeance, week, wkDone,
} from "@/lib/logic/core";
import * as act from "@/lib/logic/actions";
import { useRepere } from "@/lib/store";
import { AVANT_T } from "@/lib/nav";
import { tactile } from "@/lib/repos";
import { enchainer } from "@/lib/enchainement";
import { usePremiereVisite } from "@/lib/entree";
import { cn } from "@/lib/utils";

export default function PagePlan() {
  const etat = useRepere((s) => s.etat);
  const muter = useRepere((s) => s.muter);
  const [sect, setSect] = useState<0 | 1 | 2>(1);
  const [ouvert, setOuvert] = useState<string | null>(null);
  const [fiche, setFiche] = useState<FicheOuverte | null>(null);
  const [remp, setRemp] = useState<number | null>(null);
  const [reperes, setReperes] = useState(false);
  const premiere = usePremiereVisite();

  const W = useMemo(() => week(etat), [etat]);
  const { wk } = etat;
  const day = etat.day < W.length ? etat.day : 0;
  const S = W[day];
  const socle = W.map((p, j) => (!p.b && !p.sportOnly ? j : -1)).filter((j) => j >= 0);
  const avancement = Array.from({ length: 8 }, (_, w) => ({ faites: socle.filter((j) => wkDone(etat, w, j, W)).length, total: socle.length }));

  if (!etat.FINI && !etat.PLAN)
    return (
      <>
        <EnTete surtitre="Programme sur 8 semaines" titre="Mon plan" />
        <div className="px-5">
          <div className="rounded-[24px] border bg-card p-5">
            <SparkleIcon className="size-6 text-plate-ink" />
            <h2 className="mt-3 text-[20px] leading-tight font-bold">Ton cycle n&apos;est pas encore construit</h2>
            <p className="mt-2 text-[14.5px] leading-relaxed text-muted-foreground">
              Une douzaine de questions sur ton objectif, ton matériel et ton rythme : Repère construit huit semaines de séances, puis ajuste l&apos;effort semaine après semaine.
            </p>
            <Button asChild variant="plate" size="xl" className="mt-5 w-full">
              <Link href="/questionnaire" transitionTypes={AVANT_T}>Construire mon programme</Link>
            </Button>
            <Button asChild variant="ghost" className="mt-1 w-full">
              <Link href="/seances" transitionTypes={AVANT_T}>Plutôt une séance à la carte</Link>
            </Button>
          </div>
        </div>
      </>
    );

  const choisirSemaine = (w: number) => { setOuvert(null); muter((E) => { E.wk = w; }); };
  const choisirJour = (d: number) => { setOuvert(null); setSect(1); muter((E) => { E.day = d; }); };

  /* ----- fiche et remplacement ----- */
  const ouvrirFiche = (i: number) => {
    const e = S.x![i], id = curId(etat, wk, day, i, e[0], W), alts = alternativesDe(etat.A, id);
    setFiche({
      id, idx: i, pres: [e[1], e[2], e[3]], libelle: e[4] ? "principal" : "accessoire",
      rpe: noRPE(id) ? undefined : rpeOf(etat.A, wk, id, e[4]),
      onRemplacer: alts.length > 1 && !etat.LOG[key(wk, day, i)]?.done ? () => { setFiche(null); setRemp(i); } : undefined,
    });
  };
  const rempIdx = remp ?? 0;
  const rempOrig = S?.x?.[rempIdx]?.[0];
  const rempCur = remp != null && rempOrig ? curId(etat, wk, day, rempIdx, rempOrig, W) : undefined;
  const kRemp = key(wk, day, rempIdx), permRemp = day + "|" + rempIdx;

  return (
    <>
      <EnTete
        surtitre={<>Semaine {wk + 1} · effort visé <span className="num text-[13px]">RPE {baseRPE(wk)}</span></>}
        titre="Mon plan"
        actions={
          <>
            <Button asChild variant="ghost" size="sm" className="text-[14px]"><Link href="/plan/synthese" transitionTypes={AVANT_T}>Synthèse</Link></Button>
            <Button variant="ghost" size="icon" aria-label="Repères de placement" onClick={() => setReperes(true)}>
              <InfoIcon className="size-5" />
            </Button>
          </>
        }
      >
        <FriseSemaines wk={wk} avancement={avancement} onChoisir={choisirSemaine} />
      </EnTete>

      {/* séances de la semaine */}
      <div className="no-scrollbar flex gap-1.5 overflow-x-auto px-5 pb-3">
        {W.map((p, i) => {
          const fait = wkDone(etat, wk, i, W), sel = i === day;
          return (
            <button
              key={i}
              onClick={() => choisirJour(i)}
              aria-pressed={sel}
              className={cn(
                "flex h-9 shrink-0 items-center gap-1.5 rounded-full border px-3.5 text-[13.5px] font-medium transition-colors",
                sel ? "border-foreground bg-foreground text-background" : "border-border bg-card text-foreground/80",
                p.b && !sel && "border-dashed",
              )}
            >
              {fait && <CheckIcon className={cn("size-3.5", sel ? "text-plate" : "text-plate-ink")} weight="bold" />}
              {p.b ? "Bonus" : p.sportOnly ? "Ton sport" : `Séance ${i + 1}`}
            </button>
          );
        })}
      </div>

      {S?.sportOnly ? (
        <CarteSport />
      ) : S ? (
        <>
          <div className="px-5 pb-3">
            <h2 className="text-[22px] leading-tight font-bold tracking-[-0.015em]">{titreSeance(S.t)}</h2>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {musclesDe((S.x || []).map((e, i) => curId(etat, wk, day, i, e[0], W))).map((m) => (
                <span key={m} className="rounded-full bg-card px-2.5 py-1 text-[12.5px] font-medium">{m}</span>
              ))}
            </div>
          </div>
          <div className="px-4 pb-3">
            <Segmente
              label="Parties de la séance"
              valeur={sect}
              onChange={setSect}
              options={[{ v: 0, n: "Échauffement" }, { v: 1, n: "Séance" }, { v: 2, n: "Collation" }]}
            />
          </div>

          {sect === 0 && (
            <Echauffement
              type={typeSeance(S)}
              onFiche={(id) => setFiche({ id, idx: -1, pres: [1, 10, "—"], libelle: "échauffement" })}
            />
          )}
          {sect === 2 && <Collation obj={etat.A.objectif ?? 0} />}
          {sect === 1 && (
            <div className={cn("flex flex-col gap-2.5 px-4", premiere && "entree")}>
              {(S.x || []).map((e, i, tous) => {
                const c = ctxPlan(etat, i, W)!, x = EX[c.id], k = c.k, L = etat.LOG[k];
                const r = noRPE(c.id) ? 0 : rpeOf(etat.A, wk, c.id, e[4]);
                const prescr = x.ch === "temps" ? `${e[1]} × ${e[2]}s` : x.ch === "dist" ? `${e[1]} × ${e[2]}m` : `${e[1]} × ${e[2]}`;
                const badge = etat.SWAP[k] ? "aujourd'hui" : etat.SWAPP[day + "|" + i] ? "remplacé" : undefined;
                const fini = () => enchainer({ k, cles: tous.map((_, j) => key(wk, day, j)), titre: titreSeance(S.t), setOuvert });
                return (
                  <ExerciceCarte
                    key={k}
                    ancre={k}
                    num={i + 1} id={c.id} prescr={prescr} repos={e[3]} rpe={r} role={e[4]} badge={badge}
                    L={L} n={e[1]} ouvert={ouvert === k}
                    onToggle={() => { tactile(5); setOuvert(ouvert === k ? null : k); }}
                    onFiche={() => ouvrirFiche(i)}
                    onRemplacer={L?.done ? undefined : () => setRemp(i)}
                    onTout={() => { tactile(12); muter((E) => act.toutCocher(E, c)); if (!L?.done && useRepere.getState().etat.LOG[k]?.done) fini(); }}
                  >
                    <TableauSeries c={c} rpe={r} onReplier={() => setOuvert(null)} onFini={fini} />
                  </ExerciceCarte>
                );
              })}
              <p className="px-2 pt-1 text-center text-[12.5px] leading-relaxed text-muted-foreground">
                Effort visé <b className="font-semibold text-foreground">RPE {baseRPE(wk)}</b> : {rirTxt(baseRPE(wk))} à la fin de chaque série.
              </p>
            </div>
          )}
        </>
      ) : null}

      <FicheExercice fiche={fiche} onClose={() => setFiche(null)} />

      {rempOrig && (
        <Remplacer
          ouvert={remp != null}
          onClose={() => setRemp(null)}
          titre={rempCur ? EX[rempCur].n : ""}
          sousTitre={rempCur ? `Remplacer · ${nomPat(EX[rempCur].pat)}` : ""}
          liste={rempCur ? alternativesDe(etat.A, rempCur) : []}
          courant={rempCur}
          actions={(o) => (
            <>
              <Button variant="soft" onClick={() => { muter((E) => act.swap(E, rempIdx, o, rempOrig, "jour")); setRemp(null); }}>
                Pour aujourd&apos;hui
              </Button>
              <Button onClick={() => { muter((E) => act.swap(E, rempIdx, o, rempOrig, "tjs")); setRemp(null); }}>Pour toujours</Button>
            </>
          )}
          pied={
            etat.SWAP[kRemp] || etat.SWAPP[permRemp] ? (
              <Button variant="ghost" className="mt-2 w-full" onClick={() => { muter((E) => act.swap(E, rempIdx, rempOrig, rempOrig, "reset")); setRemp(null); }}>
                Revenir à {EX[rempOrig].n.toLowerCase()}
              </Button>
            ) : null
          }
        />
      )}

      <Drawer open={reperes} onOpenChange={setReperes}>
        <DrawerContent>
          <div className="px-5 pb-[max(env(safe-area-inset-bottom),24px)]">
            <DrawerTitle className="mt-2 text-[22px] font-bold">Repères de placement</DrawerTitle>
            <DrawerDescription className="sr-only">Quand placer cette séance dans ta semaine</DrawerDescription>
            <div className="mt-4 flex flex-col gap-3">
              <Repere titre="Quand la placer" texte={espacementDe(W, day)[1]} />
              {S?.b ? <Repere titre="Séance bonus" texte={`Axée sur ${(AXES[etat.A.axe ?? 0] || "").toLowerCase()}. Elle ajoute du volume, mais aucune règle de progression n'en dépend. La sauter ne décale rien.`} /> : null}
              {S?.sport === 1 && sportsChoisis(etat.A).length ? <Repere titre="Tes sports" texte="Séance la plus lourde sur les jambes. Garde au moins un jour plein entre elle et ta pratique." /> : null}
            </div>
          </div>
        </DrawerContent>
      </Drawer>
    </>
  );
}

function Repere({ titre, texte }: { titre: string; texte: string }) {
  if (!texte) return null;
  return (
    <div className="rounded-2xl bg-muted/70 p-3.5">
      <div className="text-[14px] font-semibold">{titre}</div>
      <p className="mt-1 text-[14px] leading-relaxed text-muted-foreground">{texte}</p>
    </div>
  );
}
