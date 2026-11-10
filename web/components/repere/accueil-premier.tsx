"use client";

/* Accueil d'un nouveau compte, à la place de la visite : bienvenue, le profil sportif une question
   par écran (le même que Profil, pas le questionnaire Oxa Plan), « Tu t'es entraîné ces dernières
   48 h ? » (les muscles comptent dans la récupération, sans fausse séance dans l'historique), puis
   la fin : muscles prêts, et une première séance qui en tient compte (ou repos). Une seule fois ;
   « Plus tard » le referme (le profil reste à compléter dans Profil). */
import { tp, tr } from "@/lib/i18n";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { Route } from "next";
import { create } from "zustand";
import { CaretLeftIcon } from "@phosphor-icons/react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { useRepere } from "@/lib/store";
import { AVANT } from "@/lib/nav";
import { tactile } from "@/lib/repos";
import { cn } from "@/lib/utils";
import { decaler, jourDe } from "@/lib/logic/historique";
import { effortsEndurance, etatGroupes, GROUPES, nomMuscle, nomZone, phrase, ZONES_ECARTABLES, basculerZone, ecartesDe, type MuscleRecup } from "@/lib/logic/recommandation";
import { recoPour } from "@/lib/logic/agenda";
import { EditeurProfil, profilMinimal, type Ligne } from "./profil-sportif";
import { MonMateriel } from "./mon-materiel";

export const useAccueil = create<{ ouvert: boolean }>(() => ({ ouvert: false }));

const QUESTIONS: (Ligne | "materiel")[] = ["sexe", "age", "corps", "objectif", "niveau", "rythme", "materiel", "prio", "sport"];
/* les muscles qu'on peut déclarer (ceux que suit la récupération, sans avant-bras ni adducteurs) */
const MUSCLES: MuscleRecup[] = [...GROUPES, "tra", "lom"];
/* les fessiers ne sont pas suivis à part : ils comptent avec les ischios (hip thrust, pont, soulevé roumain) */
const nom = (g: MuscleRecup) => (g === "isc" ? tr("Ischios et fessiers") : nomMuscle(g));

export function AccueilPremier({ onFin }: { onFin: (etape: number) => void }) {
  /* monté par AppShell à la place de l'app : ouvert jusqu'à « Plus tard » ou la fin */
  useEffect(() => { useAccueil.setState({ ouvert: true }); }, []);
  /* 0 bienvenue ; 1 à 9 le profil ; 10 les 48 h ; 11 la fin */
  const [etape, setEtape] = useState(0);
  const muter = useRepere((s) => s.muter);
  const fermer = () => {
    onFin(etape);
    /* pas terminé : il ne se rouvre plus tout seul, la carte d'Entraînement y ramène */
    muter((E) => { if (!E.A.accueil) E.A.accueilPasse = true; });
    useAccueil.setState({ ouvert: false });
  };
  return (
    <Dialog open onOpenChange={(o) => !o && fermer()}>
      <DialogContent showCloseButton={false}
        className="flex h-dvh data-[state=open]:animate-none max-h-dvh w-screen max-w-none flex-col gap-0 rounded-none border-0 bg-background p-0 sm:max-w-none">
        <div className="mx-auto flex w-full max-w-[480px] flex-1 flex-col overflow-y-auto overscroll-contain px-5 pt-[max(env(safe-area-inset-top),20px)] pb-[max(env(safe-area-inset-bottom),16px)]">
          {etape === 0 && <Bienvenue suivant={() => setEtape(1)} plusTard={fermer} />}
          {etape >= 1 && etape <= QUESTIONS.length && <Question i={etape} suivant={() => setEtape(etape + 1)} retour={() => setEtape(etape - 1)} />}
          {etape === QUESTIONS.length + 1 && <Avant48 suivant={() => setEtape(etape + 1)} retour={() => setEtape(etape - 1)} />}
          {etape === QUESTIONS.length + 2 && <Fin fermer={fermer} />}
        </div>
      </DialogContent>
    </Dialog>
  );
}

const Progression = ({ i }: { i: number }) => (
  <div className="mb-4 flex gap-1" aria-hidden>
    {Array.from({ length: QUESTIONS.length + 1 }, (_, k) => <i key={k} className={cn("h-1 flex-1 rounded-full", k < i ? "bg-plate" : "bg-muted")} />)}
  </div>
);

function Bas({ ok = true, libelle, onOk, second, onSecond }: { ok?: boolean; libelle: string; onOk: () => void; second: React.ReactNode; onSecond: () => void }) {
  return (
    <div className="sticky bottom-0 mt-auto bg-background pt-4">
      <button disabled={!ok} onClick={() => { tactile(8); onOk(); }} className="h-12 w-full rounded-full bg-plate text-[16px] font-semibold text-plate-foreground active:scale-[.98] disabled:opacity-40">{libelle}</button>
      <button onClick={() => { tactile(5); onSecond(); }} className="mt-1 flex w-full items-center justify-center gap-0.5 py-2.5 text-[14px] font-medium text-muted-foreground">{second}</button>
    </div>
  );
}

function Bienvenue({ suivant, plusTard }: { suivant: () => void; plusTard: () => void }) {
  const pseudo = useRepere((s) => s.pseudo);
  const etapes = [
    [tr("Ton profil sportif"), tr("9 questions · 1 min")],
    [tr("Tes dernières 48 h"), tr("pour savoir quels muscles sont prêts")],
    [tr("Ta première séance"), tr("ou du repos, selon ta récupération")],
  ];
  return (
    <>
      <div className="eyebrow mt-6 text-plate-ink dark:text-plate">{tr("Bienvenue")}</div>
      <DialogTitle className="mt-1 text-[28px] leading-tight font-black tracking-[-0.02em]">{pseudo ? tr("Bienvenue sur Oxa, {p}", { p: pseudo }) : tr("Bienvenue sur Oxa")}</DialogTitle>
      <DialogDescription className="mt-1.5 text-[15px] text-muted-foreground">{tr("Pour des séances à ta mesure, Oxa doit d'abord te connaître.")}</DialogDescription>
      <ol className="mt-5 flex flex-col gap-2">
        {etapes.map(([t, d], k) => (
          <li key={t} className="flex animate-[monter_.45s_ease-out_both] items-center gap-3 rounded-2xl bg-card p-3" style={{ animationDelay: 80 + k * 70 + "ms" }}>
            <span className="num grid size-10 shrink-0 place-items-center rounded-[12px] bg-plate-soft text-[16px] font-bold text-plate-ink dark:text-plate">{k + 1}</span>
            <span className="min-w-0"><span className="block text-[15px] font-semibold">{t}</span><span className="block text-[12.5px] text-muted-foreground">{d}</span></span>
          </li>
        ))}
      </ol>
      <Bas libelle={tr("Commencer · 1 min")} onOk={suivant} second={tr("Plus tard")} onSecond={plusTard} />
    </>
  );
}

function Question({ i, suivant, retour }: { i: number; suivant: () => void; retour: () => void }) {
  const A = useRepere((s) => s.etat.A);
  const muter = useRepere((s) => s.muter);
  const k = QUESTIONS[i - 1];
  /* objectif, niveau et rythme règlent les séances : il faut une réponse */
  const ok = k === "objectif" ? A.objectif != null : k === "niveau" ? A.regularite != null : k === "rythme" ? A.objHebdo != null : true;
  const valider = () => {
    /* rien d'inventé : âge, taille, poids, sports et muscles prioritaires restent vides tant qu'on n'y a
       pas touché (pas de fausse pesée) ; seule la durée affichée, 45 min, vaut réponse */
    if (k === "rythme") muter((E) => { E.A.duree ??= 45; });
    suivant();
  };
  return (
    <>
      <Progression i={i} />
      <div className="eyebrow px-1">{tr("{i} / {n} · Profil sportif", { i, n: QUESTIONS.length })}</div>
      {k === "materiel" ? (
        <>
          <DialogTitle className="mt-2 px-1 text-[22px] font-extrabold">{tr("Ton matériel")}</DialogTitle>
          <DialogDescription className="mt-0.5 mb-3 px-1 text-[13.5px] text-muted-foreground">{tr("Oxa ne te propose que des exercices faisables là où tu t'entraînes.")}</DialogDescription>
          <MonMateriel />
        </>
      ) : <EditeurProfil k={k} />}
      <Bas ok={ok} libelle={tr("Suivant")} onOk={valider} second={<><CaretLeftIcon className="size-3.5" weight="bold" />{tr("Retour")}</>} onSecond={retour} />
    </>
  );
}

function Avant48({ suivant, retour }: { suivant: () => void; retour: () => void }) {
  const muter = useRepere((s) => s.muter);
  const [auj] = useState(() => jourDe(Date.now()));
  const [quand, setQuand] = useState<0 | 1 | 2>(0);
  const [m, setM] = useState<MuscleRecup[]>([]);
  const terminer = () => {
    muter((E) => {
      if (quand) E.A.avant = { d: decaler(auj, -quand), m: [...m] }; else delete E.A.avant;
      E.A.accueil = true;
      if (profilMinimal(E.A)) E.A.miseEnRoute = true;
    });
    suivant();
  };
  return (
    <>
      <Progression i={QUESTIONS.length + 1} />
      <div className="eyebrow px-1">{tr("Dernière question · Avant Oxa")}</div>
      <DialogTitle className="mt-2 px-1 text-[22px] leading-tight font-extrabold">{tr("Tu t'es entraîné ces dernières 48 h ?")}</DialogTitle>
      <DialogDescription className="mt-0.5 px-1 text-[13.5px] text-muted-foreground">{tr("Oxa en tient compte pour ne pas te faire retravailler des muscles qui récupèrent.")}</DialogDescription>
      <div role="radiogroup" className="mt-4 flex rounded-2xl bg-card p-1">
        {([[0, tr("Non")], [1, tr("Hier")], [2, tr("Avant-hier")]] as const).map(([v, n]) => (
          <button key={v} role="radio" aria-checked={quand === v} onClick={() => { tactile(5); setQuand(v); }}
            className={cn("h-10 flex-1 rounded-xl text-[14.5px] font-semibold", quand === v ? "bg-foreground text-background" : "text-muted-foreground")}>{n}</button>
        ))}
      </div>
      {quand > 0 && (
        <>
          <div className="mt-5 px-1 text-[13px] font-bold">{tr("Quels muscles ?")}</div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {MUSCLES.map((g) => {
              const on = m.includes(g);
              return (
                <button key={g} aria-pressed={on} onClick={() => { tactile(5); setM((l) => (on ? l.filter((x) => x !== g) : [...l, g])); }}
                  className={cn("h-9 rounded-full border-[1.5px] px-3.5 text-[14px] font-semibold", on ? "border-foreground bg-foreground text-background" : "border-border")}>{nom(g)}</button>
              );
            })}
          </div>
        </>
      )}
      <Bas ok={!quand || m.length > 0} libelle={tr("Terminer")} onOk={terminer} second={<><CaretLeftIcon className="size-3.5" weight="bold" />{tr("Retour")}</>} onSecond={retour} />
    </>
  );
}

function Fin({ fermer }: { fermer: () => void }) {
  const etat = useRepere((s) => s.etat);
  const muter = useRepere((s) => s.muter);
  const router = useRouter();
  const [auj] = useState(() => jourDe(Date.now()));
  const efforts = useMemo(() => effortsEndurance(etat.SORTIES, etat.CARDIO, etat.A.avant), [etat]);
  const E = useMemo(() => etatGroupes(etat.HIST || [], auj, efforts), [etat, auj, efforts]);
  const r = useMemo(() => recoPour(etat, auj), [etat, auj]);
  /* les muscles écartés n'apparaissent ni prêts ni en récupération */
  const exclus = new Set(ecartesDe(etat.A.recoSans).flatMap((z) => (z === "bras" ? ["bic", "tri"] : [z]))), vus = GROUPES.filter((g) => !exclus.has(g));
  const recup = vus.filter((g) => !E[g].recupere), prets = vus.filter((g) => E[g].recupere);
  const p = r.type === "seance" ? r.propositions[0] : undefined;
  const aller = (url: string) => { tactile(10); fermer(); router.push(url as Route, AVANT); };
  const raison = recup.length
    ? tp(recup.length, "{m} récupère encore. Construite avec ton matériel.", "{m} récupèrent encore. Construite avec ton matériel.", { m: phrase(recup.map(nom)) })
    : tr("Construite avec ton matériel, à ton niveau.");
  return (
    <>
      <div className="eyebrow mt-6 text-plate-ink dark:text-plate">{tr("Profil prêt")}</div>
      <DialogTitle className="mt-1 text-[26px] leading-tight font-black tracking-[-0.02em]">{tr("Aujourd'hui, tes muscles")}</DialogTitle>
      <DialogDescription className="sr-only">{tr("Les muscles prêts et ta première séance.")}</DialogDescription>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {recup.length ? (
          <>
            {prets.map((g) => <span key={g} className="rounded-full bg-plate-soft px-2.5 py-1 text-[12.5px] font-bold text-plate-ink dark:text-plate">{nom(g)} · {tr("prêt")}</span>)}
            {recup.map((g) => <span key={g} className="rounded-full bg-[#fff1e6] px-2.5 py-1 text-[12.5px] font-bold text-[#b45309] dark:bg-[#3a2410] dark:text-[#fb923c]">{nom(g)} · {tr("récupère")}</span>)}
          </>
        ) : <span className="rounded-full bg-plate-soft px-3 py-1 text-[13px] font-bold text-plate-ink dark:text-plate">{tr("Tous prêts")}</span>}
      </div>

      <section className="mt-4 rounded-[22px] bg-[linear-gradient(160deg,var(--plate),color-mix(in_oklab,var(--plate)_78%,black))] p-4 text-plate-foreground">
        <div className="text-[11px] font-bold tracking-[0.12em] uppercase opacity-75">{tr("Ta première séance")}</div>
        {p ? (
          <>
            <h2 className="mt-1.5 text-[21px] leading-tight font-extrabold">{p.nom}</h2>
            <p className="mt-1 text-[13.5px] leading-snug opacity-85">{raison}</p>
            <button onClick={() => aller(`/entrainement/assistant?m=${p.muscles.join(",")}`)} className="mt-3.5 h-11 w-full rounded-full bg-white text-[14.5px] font-semibold text-[#0a0a0c] active:scale-[.98]">{tr("Voir la séance")}</button>
          </>
        ) : (
          <>
            <h2 className="mt-1.5 text-[21px] leading-tight font-extrabold">{tr("Repos aujourd'hui")}</h2>
            <p className="mt-1 text-[13.5px] leading-snug opacity-85">{r.pause ?? tr("Tes muscles récupèrent : c'est pendant le repos qu'ils se construisent.")}{r.demain && <> {tr("Demain : {s}.", { s: r.demain.nom.toLowerCase() })}</>}</p>
            <div className="mt-3.5 flex gap-2">
              <button onClick={() => aller("/entrainement/assistant?type=cardio")} className="h-11 flex-1 rounded-full bg-white text-[14.5px] font-semibold text-[#0a0a0c] active:scale-[.98]">{tr("Cardio doux")}</button>
              {r.demain && <button onClick={() => aller(`/entrainement/assistant?jour=${decaler(auj, 1)}&m=${r.demain!.muscles.join(",")}`)} className="h-11 flex-1 rounded-full border-[1.5px] border-black/30 text-[14px] font-semibold active:scale-[.98]">{tr("Programmer demain")}</button>}
            </div>
          </>
        )}
      </section>
      {/* des muscles qu'on ne veut pas travailler : la proposition change tout de suite (aussi dans Profil) */}
      <div className="mt-4 px-1 text-[13px] font-bold">{tr("Des muscles à ne pas travailler ?")}</div>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {ZONES_ECARTABLES.map((z) => {
          const on = ecartesDe(etat.A.recoSans).includes(z);
          return (
            <button key={z} aria-pressed={on} onClick={() => { tactile(5); muter((E) => { E.A.recoSans = basculerZone(E.A.recoSans, z); }); }}
              className={cn("flex h-9 items-center gap-1 rounded-full border-[1.5px] px-3.5 text-[14px] font-semibold", on ? "border-foreground bg-foreground text-background line-through decoration-2" : "border-border")}>
              {nomZone(z)}
            </button>
          );
        })}
      </div>
      <button onClick={() => aller("/entrainement/assistant")} className="mt-4 h-12 w-full rounded-2xl bg-card text-[15px] font-semibold active:scale-[.99]">{tr("Je choisis mes muscles")}</button>
      <button onClick={() => { tactile(5); fermer(); }} className="mt-auto py-3 text-[14px] font-medium text-muted-foreground">{tr("Plus tard")}</button>
    </>
  );
}
