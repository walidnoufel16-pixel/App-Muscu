"use client";

import { tr } from "@/lib/i18n";
import { useRouter } from "next/navigation";
import { CaretRightIcon, FirstAidKitIcon, PlayIcon } from "@phosphor-icons/react";
import { EX } from "@/lib/data/exercices";
import { AVERTISSEMENT_SOIN, routineDe, ROUTINES_SOIN, SOIN_DE_BLESSURE, ZONES_SOIN, type RoutineSoin, type ZoneSoin } from "@/lib/data/soin";
import { zonesActives } from "@/lib/logic/forme";
import { useRepere } from "@/lib/store";
import { AVANT } from "@/lib/nav";
import { lienRubrique } from "./rubriques";
import { LigneExercice } from "./ligne-exercice";
import { Vignette } from "./exercice-carte";

/** Durée d'une routine en minutes : séries × (effort + repos), plus le temps de s'installer. */
export function minutesRoutine(r: RoutineSoin) {
  const sec = r.ex.reduce((t, e) => {
    const effort = EX[e.id]?.ch === "temps" ? e.r : e.r * 3, repos = (parseInt(e.p) || 0) * (/min/.test(e.p) ? 60 : 1);
    return t + e.s * (effort + repos) + 20;
  }, 0);
  return Math.max(5, Math.round(sec / 60));
}

/** Lance une routine : retrouvée dans Mes séances si elle y est déjà, sinon ajoutée (groupe Soin), puis ouverte. */
export function useLancerRoutine() {
  const router = useRouter();
  const muter = useRepere((s) => s.muter);
  return (z: ZoneSoin) => {
    const r = routineDe(z);
    let i = useRepere.getState().etat.SEANCES.findIndex((s) => s.soin === z);
    if (i < 0) {
      muter((E) => { E.SEANCES.push({ nom: r.nom, ex: r.ex.map((e) => ({ ...e })), soin: z }); });
      i = useRepere.getState().etat.SEANCES.length - 1;
    }
    router.push(`/entrainement/seance?l=${i}`, AVANT);
  };
}

/** Carte d'une routine : nom, durée, aperçu des exercices, bouton pour démarrer. */
export function CarteRoutine({ r, titre, compacte }: { r: RoutineSoin; titre?: string; compacte?: boolean }) {
  const lancer = useLancerRoutine();
  return (
    <button onClick={() => lancer(r.z)} className="flex w-full items-center gap-3 rounded-[20px] border border-border/80 bg-card p-3 text-left active:scale-[0.99]">
      <span className="flex -space-x-3">
        {r.ex.slice(0, compacte ? 2 : 3).map((e) => <Vignette key={e.id} id={e.id} className="size-11 rounded-[12px] ring-2 ring-card" />)}
      </span>
      <span className="min-w-0 flex-1">
        <span className="line-clamp-2 text-[16px] leading-tight font-semibold tracking-[-0.01em]">{titre ?? r.nom}</span>
        <span className="mt-0.5 block truncate text-[12.5px] text-muted-foreground">{tr("{n} exercices · environ {m} min", { n: r.ex.length, m: minutesRoutine(r) })}</span>
      </span>
      <span className="grid size-9 shrink-0 place-items-center rounded-full bg-plate text-plate-foreground" aria-hidden><PlayIcon className="size-4" weight="fill" /></span>
    </button>
  );
}

/** Rubrique « Soin & mobilité » de la bibliothèque : la zone choisie (un onglet par zone), routine en tête. */
export function VueSoin({ onFiche, zone }: { onFiche: (id: string) => void; zone: ZoneSoin }) {
  const nom = ZONES_SOIN.find(([z]) => z === zone)?.[1] ?? "";
  return (
    <section aria-label={nom} className="flex flex-col gap-2">
      <CarteRoutine r={routineDe(zone)} titre={tr("Routine · {nom}", { nom: routineDe(zone).nom })} />
      <div className="flex flex-col gap-1.5">
        {Object.keys(EX).filter((o) => EX[o].soin === zone).map((o) => <LigneExercice key={o} id={o} onOuvrir={() => onFiche(o)} />)}
      </div>
      <p className="mt-2 px-1 text-[12.5px] leading-relaxed text-muted-foreground">{tr(AVERTISSEMENT_SOIN)}</p>
    </section>
  );
}

/** Zones de soin à proposer : gênes déclarées et douleur du jour. */
export function useZonesASoigner(): ZoneSoin[] {
  const A = useRepere((s) => s.etat.A);
  return [...new Set(zonesActives(A).map((i) => SOIN_DE_BLESSURE[i]).filter(Boolean))];
}

/** Accueil : la routine de la zone sensible en une carte, le reste dans Exercices › Soin. */
export function SectionSoin() {
  const router = useRouter();
  const zones = useZonesASoigner();
  const routines = () => router.push(lienRubrique("soin"), AVANT);
  return (
    <section>
      <div className="mb-2 flex items-baseline justify-between px-1">
        <h2 className="eyebrow">{zones.length ? tr("Pour ta zone sensible") : tr("Soin & mobilité")}</h2>
        <button onClick={routines} className="text-[13px] font-medium text-plate-ink">{tr("Toutes les routines")}</button>
      </div>
      {zones.length > 0 ? (
        <div className="flex flex-col gap-2">
          {zones.map((z) => <CarteRoutine key={z} r={routineDe(z)} titre={tr("Ta routine {nom}", { nom: routineDe(z).nom.toLowerCase() })} compacte />)}
        </div>
      ) : (
        <button onClick={routines} className="flex w-full items-center gap-3 rounded-[20px] bg-card p-3.5 text-left active:scale-[0.99]">
          <span className="grid size-11 shrink-0 place-items-center rounded-[12px] bg-plate-soft text-plate-ink"><FirstAidKitIcon className="size-6" weight="fill" /></span>
          <span className="min-w-0 flex-1">
            <span className="block text-[16px] font-semibold">{tr("Soin & mobilité")}</span>
            <span className="block text-[12.5px] text-muted-foreground">{tr("{n} routines courtes, une par zone du corps", { n: ROUTINES_SOIN.length })}</span>
          </span>
          <CaretRightIcon className="size-4 shrink-0 text-muted-foreground" />
        </button>
      )}
    </section>
  );
}

/** Échauffement de la séance : la routine de la zone sensible, en option. */
export function EchauffementSoin({ onFiche }: { onFiche: (id: string) => void }) {
  const zones = useZonesASoigner();
  if (!zones.length) return null;
  return (
    <div className="rounded-[22px] bg-plate-soft p-3.5">
      <p className="flex items-center gap-1.5 text-[14px] font-semibold text-plate-ink"><FirstAidKitIcon className="size-4" weight="fill" />{tr("En option, pour ta zone sensible")}</p>
      <p className="mt-1 text-[12.5px] text-muted-foreground">{tr("Deux ou trois de ces exercices avant de charger, en douceur.")}</p>
      {zones.map((z) => (
        <div key={z} className="mt-2.5">
          <div className="mb-1.5 px-1 text-[12.5px] font-medium">{routineDe(z).nom}</div>
          <div className="flex flex-col gap-1.5">
            {routineDe(z).ex.slice(0, 3).map((e) => <LigneExercice key={e.id} id={e.id} onOuvrir={() => onFiche(e.id)} />)}
          </div>
        </div>
      ))}
    </div>
  );
}
