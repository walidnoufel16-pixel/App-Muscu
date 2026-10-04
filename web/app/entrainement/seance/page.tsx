"use client";

/* Une séance, en plein écran : la même pour le plan (semaine et séance en cours
   dans l'état) et pour une séance libre (?l=index). La barre d'onglets s'efface. */
import { Suspense, useMemo, useState, ViewTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckIcon, HeartbeatIcon, InfoIcon, PencilSimpleIcon, PlayIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Drawer, DrawerContent, DrawerDescription, DrawerTitle } from "@/components/ui/drawer";
import { EnTete } from "@/components/repere/en-tete";
import { Retour } from "@/components/repere/retour";
import { ExerciceCarte, Vignette } from "@/components/repere/exercice-carte";
import { FicheExercice, type FicheOuverte } from "@/components/repere/fiche-exercice";
import { Collation, Echauffement, Remplacer } from "@/components/repere/seance-vues";
import { Segmente } from "@/components/repere/segmente";
import { TableauSeries } from "@/components/repere/tableau-series";
import { CarteSport } from "@/components/repere/carte-sport";
import { EX } from "@/lib/data/exercices";
import { AXES } from "@/lib/data/referentiels";
import {
  alternativesDe, baseRPE, ctxLibre, ctxPlan, curId, espacementDe, key, musclesDe, nomPat, noRPE, rirTxt, rpeOf, sportsChoisis, titreSeance, typeSeance, week,
} from "@/lib/logic/core";
import { objCollation } from "@/lib/logic/assistant";
import * as act from "@/lib/logic/actions";
import type { BlocCardio, Journal } from "@/lib/logic/types";
import type { Route } from "next";
import { dureeTotale as dureeSeance, minutesBloc, ordre } from "@/lib/logic/combinee";
import { FORMATS, MACHINES } from "@/lib/logic/cardio";
import { ICONE_FORMAT } from "@/components/repere/reglages-cardio";
import { useRepere } from "@/lib/store";
import { AVANT } from "@/lib/nav";
import { useBrouillon } from "@/lib/brouillon";
import { tactile } from "@/lib/repos";
import { enchainer } from "@/lib/enchainement";
import { usePremiereVisite } from "@/lib/entree";
import { cn } from "@/lib/utils";

type Partie = 0 | 1 | 2;

/* Habillage commun : retour, titre, avancement, parties de la séance. */
function Cadre({
  surtitre, titre, actions, faits, total, sect, setSect, children, entete,
}: {
  surtitre: React.ReactNode; titre: string; actions?: React.ReactNode; faits: number; total: number;
  sect: Partie; setSect: (p: Partie) => void; children: React.ReactNode; entete?: React.ReactNode;
}) {
  return (
    <>
      <EnTete surtitre={surtitre} titre={titre} gauche={<Retour repli="/entrainement" />} actions={actions}>
        {entete}
        {total > 0 && (
          <div className="mt-3 flex items-center gap-3" aria-label={`${faits} exercice${faits > 1 ? "s" : ""} terminé${faits > 1 ? "s" : ""} sur ${total}`}>
            <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
              <span className="block h-full rounded-full bg-plate transition-[width] duration-500 ease-out" style={{ width: (faits / total) * 100 + "%" }} />
            </span>
            <span className="num text-[14px] font-semibold text-muted-foreground">{faits} / {total}</span>
          </div>
        )}
      </EnTete>
      <div className="px-4 pb-3">
        <Segmente label="Parties de la séance" valeur={sect} onChange={setSect} options={[{ v: 0, n: "Échauffement" }, { v: 1, n: "Séance" }, { v: 2, n: "Collation" }]} />
      </div>
      {children}
    </>
  );
}

function Muscles({ ids }: { ids: string[] }) {
  return (
    <div className="mt-3 flex flex-wrap gap-1.5">
      {musclesDe(ids).map((m) => <span key={m} className="rounded-full bg-card px-2.5 py-1 text-[12.5px] font-medium">{m}</span>)}
    </div>
  );
}

/* ---------------- séance du plan ---------------- */
function SeancePlan() {
  const etat = useRepere((s) => s.etat);
  const muter = useRepere((s) => s.muter);
  const premiere = usePremiereVisite();
  const [sect, setSect] = useState<Partie>(1);
  const [ouvert, setOuvert] = useState<string | null>(null);
  const [fiche, setFiche] = useState<FicheOuverte | null>(null);
  const [remp, setRemp] = useState<number | null>(null);
  const [reperes, setReperes] = useState(false);
  const W = useMemo(() => week(etat), [etat]);
  const { wk } = etat;
  const day = etat.day < W.length ? etat.day : 0;
  const S = W[day];
  if (!S) return <Introuvable />;

  const ids = (S.x || []).map((e, i) => curId(etat, wk, day, i, e[0], W));
  const cles = (S.x || []).map((_, j) => key(wk, day, j));
  const faits = cles.filter((k) => etat.LOG[k]?.done).length;

  const ouvrirFiche = (i: number) => {
    const e = S.x![i], id = ids[i], alts = alternativesDe(etat.A, id);
    setFiche({
      id, idx: i, pres: [e[1], e[2], e[3]], libelle: e[4] ? "principal" : "accessoire",
      rpe: noRPE(id) ? undefined : rpeOf(etat.A, wk, id, e[4]),
      onRemplacer: alts.length > 1 && !etat.LOG[key(wk, day, i)]?.done ? () => { setFiche(null); setRemp(i); } : undefined,
    });
  };
  const rempIdx = remp ?? 0, rempOrig = S.x?.[rempIdx]?.[0];
  const rempCur = remp != null && rempOrig ? curId(etat, wk, day, rempIdx, rempOrig, W) : undefined;
  const kRemp = key(wk, day, rempIdx), permRemp = day + "|" + rempIdx;
  const nom = S.b ? "Bonus" : S.sportOnly ? "Ton sport" : `Séance ${day + 1}`;

  return (
    <Cadre
      surtitre={<>{nom} · semaine {wk + 1} · <span className="num text-[13px]">RPE {baseRPE(wk)}</span></>}
      titre={S.sportOnly ? "Ton sport" : titreSeance(S.t)}
      faits={faits} total={S.sportOnly ? 0 : cles.length}
      sect={sect} setSect={setSect}
      actions={<Button variant="ghost" size="icon" aria-label="Repères de placement" onClick={() => setReperes(true)}><InfoIcon className="size-5" /></Button>}
      entete={!S.sportOnly && <Muscles ids={ids} />}
    >
      {S.sportOnly ? (
        <CarteSport />
      ) : (
        <>
          {sect === 0 && <Echauffement type={typeSeance(S)} onFiche={(id) => setFiche({ id, idx: -1, pres: [1, 10, "—"], libelle: "échauffement" })} />}
          {sect === 2 && <Collation obj={etat.A.objectif ?? 0} />}
          {sect === 1 && (
            <div className={cn("flex flex-col gap-2.5 px-4", premiere && "entree")}>
              {(S.x || []).map((e, i) => {
                const c = ctxPlan(etat, i, W)!, x = EX[c.id], k = c.k, L: Journal | undefined = etat.LOG[k];
                const r = noRPE(c.id) ? 0 : rpeOf(etat.A, wk, c.id, e[4]);
                const prescr = x.ch === "temps" ? `${e[1]} × ${e[2]}s` : x.ch === "dist" ? `${e[1]} × ${e[2]}m` : `${e[1]} × ${e[2]}`;
                const badge = etat.SWAP[k] ? "aujourd'hui" : etat.SWAPP[day + "|" + i] ? "remplacé" : undefined;
                const fini = () => enchainer({ k, cles, titre: titreSeance(S.t), setOuvert });
                return (
                  <ExerciceCarte
                    key={k} ancre={k}
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
      )}

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
              <Button variant="soft" onClick={() => { muter((E) => act.swap(E, rempIdx, o, rempOrig, "jour")); setRemp(null); }}>Pour aujourd&apos;hui</Button>
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
              {S.b ? <Repere titre="Séance bonus" texte={`Axée sur ${(AXES[etat.A.axe ?? 0] || "").toLowerCase()}. Elle ajoute du volume, mais aucune règle de progression n'en dépend. La sauter ne décale rien.`} /> : null}
              {S.sport === 1 && sportsChoisis(etat.A).length ? <Repere titre="Tes sports" texte="Séance la plus lourde sur les jambes. Garde au moins un jour plein entre elle et ta pratique." /> : null}
            </div>
          </div>
        </DrawerContent>
      </Drawer>
    </Cadre>
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

/* ---------------- séance libre ---------------- */
function SeanceLibre({ i }: { i: number }) {
  const router = useRouter();
  const { etat, muter } = useRepere();
  const setLibre = useBrouillon((s) => s.setLibre);
  const premiere = usePremiereVisite();
  const [sect, setSect] = useState<Partie>(1);
  const [ouvert, setOuvert] = useState<string | null>(null);
  const [fiche, setFiche] = useState<FicheOuverte | null>(null);
  const [maintenant] = useState(() => Date.now());
  const S = etat.SEANCES[i];
  if (!S) return <Introuvable />;

  const faux = { t: S.nom, x: S.ex.map((e) => [e.id, e.s, e.r, e.p, 0] as [string, number, number, string, number]) };
  const cles = S.ex.map((_, m) => ctxLibre(etat, i, m)?.k).filter((q): q is string => !!q);
  /* un bloc cardio est fait s'il a été joué aujourd'hui */
  const blocFait = (id: string) => (etat.CARDIO || []).some((h) => h.ref === id && new Date(h.ts).toDateString() === new Date(maintenant).toDateString());
  const blocs = S.blocs || [];
  const faits = cles.filter((k) => etat.LOG[k]?.done).length + blocs.filter((b) => blocFait(b.id)).length;
  const modifier = () => { setLibre({ ...structuredClone(S), idx: i }); router.push("/entrainement/composer", AVANT); };

  return (
    <Cadre
      surtitre={`${blocs.length ? "Séance combinée" : "Séance libre"} · ${S.ex.length} exercice${S.ex.length > 1 ? "s" : ""}${blocs.length ? ` + ${blocs.length} cardio` : ""} · environ ${dureeSeance(S)} min`}
      titre={S.nom}
      faits={faits} total={cles.length + blocs.length}
      sect={sect} setSect={setSect}
      actions={<Button variant="ghost" size="sm" className="text-[15px] text-plate-ink" onClick={modifier}><PencilSimpleIcon className="size-4" />Modifier</Button>}
      entete={
        <>
          <ViewTransition name={`vignettes-${i}`} share="morph" default="none">
            <span className="mt-3 flex -space-x-4">
              {S.ex.slice(0, 3).map((e) => EX[e.id] && <Vignette key={e.id} id={e.id} className="size-16 rounded-[16px] ring-[3px] ring-background" />)}
            </span>
          </ViewTransition>
          <Muscles ids={S.ex.map((e) => e.id)} />
        </>
      }
    >
      {sect === 0 && <Echauffement type={typeSeance(faux)} onFiche={(id) => setFiche({ id, idx: -1, pres: [1, 10, "—"], libelle: "échauffement" })} />}
      {sect === 2 && <Collation obj={objCollation(etat.A, S)} onChanger={(o) => muter((E) => { E.SEANCES[i].colObj = o; })} />}
      {sect === 1 && (
        <div className={cn("flex flex-col gap-2.5 px-4", premiere && "entree")}>
          {ordre(S).map((el) => {
            if (el.t === "bloc") return <BlocSeance key={el.b.id} b={el.b} fait={blocFait(el.b.id)} onLancer={() => router.push(`/entrainement/cardio?l=${i}&b=${el.b.id}` as Route, AVANT)} />;
            const e = el.e, j = el.i;
            const c = ctxLibre(etat, i, j);
            if (!c) return null;
            const x = EX[e.id], L = etat.LOG[c.k], r = noRPE(e.id) ? 0 : 8;
            const fini = () => enchainer({ k: c.k, cles, titre: S.nom, setOuvert });
            const prescr = x.ch === "temps" ? `${e.s} × ${e.r}s` : x.ch === "dist" ? `${e.s} × ${e.r}m` : `${e.s} × ${e.r}`;
            return (
              <ExerciceCarte
                key={c.k} ancre={c.k}
                num={j + 1} id={e.id} prescr={prescr} repos={e.p} rpe={r} L={L} n={e.s} ouvert={ouvert === c.k}
                onToggle={() => { tactile(5); setOuvert(ouvert === c.k ? null : c.k); }}
                onFiche={() => setFiche({ id: e.id, idx: -1, pres: [e.s, e.r, e.p], libelle: "séance libre", rpe: r || undefined })}
                onTout={() => { tactile(12); muter((E) => act.toutCocher(E, c)); if (!L?.done && useRepere.getState().etat.LOG[c.k]?.done) fini(); }}
              >
                <TableauSeries c={c} rpe={r} onReplier={() => setOuvert(null)} onFini={fini} />
              </ExerciceCarte>
            );
          })}
          <p className="px-2 pt-1 text-center text-[12.5px] text-muted-foreground">
            Effort visé <b className="font-semibold text-foreground">RPE 8</b> : {rirTxt(8)} à la fin de chaque série.
          </p>
        </div>
      )}
      <FicheExercice fiche={fiche} onClose={() => setFiche(null)} />
    </Cadre>
  );
}

function Introuvable() {
  return (
    <>
      <EnTete titre="Séance introuvable" gauche={<Retour repli="/entrainement" />} />
      <p className="px-5 text-[15px] text-muted-foreground">Cette séance n&apos;existe plus sur ce téléphone.</p>
    </>
  );
}

function Seance() {
  const l = useSearchParams().get("l");
  return l != null ? <SeanceLibre i={Number(l)} /> : <SeancePlan />;
}

export default function PageSeance() {
  return (
    <Suspense>
      <Seance />
    </Suspense>
  );
}

/* Bloc cardio dans une séance combinée : il se lance dans le minuteur cardio. */
function BlocSeance({ b, fait, onLancer }: { b: BlocCardio; fait: boolean; onLancer: () => void }) {
  const I = ICONE_FORMAT[b.f];
  return (
    <div className={cn("flex items-center gap-3.5 rounded-[20px] border p-3", fait ? "border-plate/60 bg-card" : "border-plate/40 bg-plate-soft")}>
      <span className="grid size-14 shrink-0 place-items-center rounded-[14px] bg-plate text-plate-foreground"><I className="size-7" weight="fill" /></span>
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="flex items-center gap-1.5 text-[11px] font-semibold tracking-[0.1em] text-plate-ink uppercase"><HeartbeatIcon className="size-3.5" weight="fill" />Bloc cardio</span>
        <span className="truncate text-[16px] font-semibold tracking-[-0.01em]">{FORMATS[b.f].nom}</span>
        <span className="truncate text-[12.5px] text-muted-foreground">{MACHINES[b.m].nom} · {minutesBloc(b)} min{fait ? " · fait aujourd'hui" : ""}</span>
      </span>
      {fait ? (
        <span className="grid size-9 place-items-center rounded-full bg-plate text-plate-foreground" aria-label="Fait aujourd'hui"><CheckIcon className="size-4" weight="bold" /></span>
      ) : (
        <Button variant="plate" size="sm" className="rounded-full px-4" onClick={onLancer}><PlayIcon weight="fill" />Lancer</Button>
      )}
    </div>
  );
}
