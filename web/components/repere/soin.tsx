"use client";

import { tr } from "@/lib/i18n";
import { useRouter } from "next/navigation";
import { FirstAidKitIcon, PlayIcon } from "@phosphor-icons/react";
import { EX } from "@/lib/data/exercices";
import { AVERTISSEMENT_SOIN, routineDe, ROUTINES_SOIN, SOIN_DE_BLESSURE, ZONES_SOIN, type RoutineSoin, type ZoneSoin } from "@/lib/data/soin";
import { zonesActives } from "@/lib/logic/forme";
import { useRepere } from "@/lib/store";
import { AVANT } from "@/lib/nav";
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

/** Onglet « Soin & mobilité » de la bibliothèque : une section par zone, routine en tête. */
export function VueSoin({ onFiche }: { onFiche: (id: string) => void }) {
  const ids = Object.keys(EX);
  return (
    <div className="flex flex-col gap-6">
      <p className="rounded-[18px] bg-plate-soft p-3.5 text-[13.5px] leading-relaxed">
        {tr("Mobilité et rééducation légère, rangées par zone. Chaque zone a sa routine prête à lancer.")}{" "}
        <span className="text-muted-foreground">{tr(AVERTISSEMENT_SOIN)}</span>
      </p>
      {ZONES_SOIN.map(([z, nom]) => (
        <section key={z} aria-label={nom}>
          <h3 className="mb-2 px-1 text-[19px] font-bold">{nom}</h3>
          <CarteRoutine r={routineDe(z)} titre={tr("Routine · {nom}", { nom: routineDe(z).nom })} />
          <div className="mt-2 flex flex-col gap-1.5">
            {ids.filter((o) => EX[o].soin === z).map((o) => <LigneExercice key={o} id={o} onOuvrir={() => onFiche(o)} />)}
          </div>
        </section>
      ))}
    </div>
  );
}

/** Zones de soin à proposer : gênes déclarées et douleur du jour. */
export function useZonesASoigner(): ZoneSoin[] {
  const A = useRepere((s) => s.etat.A);
  return [...new Set(zonesActives(A).map((i) => SOIN_DE_BLESSURE[i]).filter(Boolean))];
}

/** Accueil : routines suggérées pour les zones sensibles, puis toutes les routines. */
export function SectionSoin() {
  const zones = useZonesASoigner();
  return (
    <section>
      <h2 className="eyebrow mb-2 px-1">{tr("Soin & mobilité")}</h2>
      {zones.length > 0 && (
        <div className="mb-2 flex flex-col gap-2">
          {zones.map((z) => (
            <div key={z} className="rounded-[22px] bg-plate-soft p-2">
              <p className="flex items-center gap-1.5 px-2 pt-1 pb-2 text-[13px] font-medium text-plate-ink">
                <FirstAidKitIcon className="size-4" weight="fill" />{tr("Pour ta zone sensible")}
              </p>
              <CarteRoutine r={routineDe(z)} titre={tr("Ta routine {nom}", { nom: routineDe(z).nom.toLowerCase() })} compacte />
            </div>
          ))}
        </div>
      )}
      <div className="-mx-4 flex snap-x gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none]">
        {ROUTINES_SOIN.filter((r) => !zones.includes(r.z)).map((r) => (
          <div key={r.z} className="w-[80%] shrink-0 snap-start"><CarteRoutine r={r} compacte /></div>
        ))}
      </div>
      <p className="mt-2 px-1 text-[12px] text-muted-foreground">{tr(AVERTISSEMENT_SOIN)}</p>
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
