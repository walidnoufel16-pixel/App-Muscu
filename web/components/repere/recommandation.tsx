"use client";

/* « Ma recommandation du jour » : ce qui a été travaillé ces derniers jours, puis la séance conseillée
   (lib/logic/recommandation.ts). Dans Mes séances, « Créer cette séance » ouvre l'assistant avec ces
   muscles cochés ; dans l'assistant, « Appliquer » les coche sur place. « Écarter un groupe » retire
   une zone des recommandations (par exemple les jambes, pour qui fait un autre sport) ; c'est mémorisé. */
import { loc, tr } from "@/lib/i18n";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { Route } from "next";
import { ArrowRightIcon, CheckIcon } from "@phosphor-icons/react";
import { dateDe, decaler, jourDe } from "@/lib/logic/historique";
import { lister, nomGroupe, phrase, nomZone, recommander, ZONES_ECARTABLES, type ZoneEcartable } from "@/lib/logic/recommandation";
import { useRepere } from "@/lib/store";
import { AVANT } from "@/lib/nav";
import { tactile } from "@/lib/repos";
import { cn } from "@/lib/utils";

const nomJour = (d: string, auj: string) =>
  d === auj ? tr("Aujourd'hui")
  : d === decaler(auj, -1) ? tr("Hier")
  : d === decaler(auj, -2) ? tr("Avant-hier")
  : dateDe(d).toLocaleDateString(loc(), { weekday: "short" }).replace(".", "");

export function Recommandation({ onAppliquer, className }: { onAppliquer?: (m: string[]) => void; className?: string }) {
  const router = useRouter();
  const H = useRepere((s) => s.etat.HIST);
  const ecartes = useRepere((s) => s.etat.A.recoSans);
  const muter = useRepere((s) => s.muter);
  const [auj] = useState(() => jourDe(Date.now()));
  const [i, setI] = useState(0);
  const [reglage, setReglage] = useState(false);
  const r = useMemo(() => recommander(H || [], auj, ecartes || []), [H, auj, ecartes]);
  if (!r) return null;

  const basculer = (z: ZoneEcartable) => {
    tactile(6);
    setI(0);
    muter((E) => {
      const l = E.A.recoSans || [];
      E.A.recoSans = l.includes(z) ? l.filter((x) => x !== z) : [...l, z];
    });
  };
  const ouvrir = (m: string[]) => {
    if (onAppliquer) { tactile(8); onAppliquer(m); return; }
    router.push(`/entrainement/assistant?m=${m.join(",")}` as Route, AVANT);
  };

  const p = r.type === "seance" ? r.propositions[i % r.propositions.length] : undefined;
  const plein = r.type === "seance";
  const nbEcartes = ecartes?.length || 0;

  return (
    <section className={cn("rounded-[22px] p-4", plein ? "bg-[linear-gradient(160deg,var(--plate),color-mix(in_oklab,var(--plate)_78%,black))] text-plate-foreground" : "bg-card", className)}>
      <div className={cn("text-[11px] font-bold tracking-[0.12em] uppercase", plein ? "opacity-75" : "text-plate-ink dark:text-plate")}>{tr("Ma recommandation du jour")}</div>

      {r.faits.length > 0 && !onAppliquer && (
        <div className="mt-2.5 flex flex-wrap gap-1.5">
          {r.faits.map((f) => (
            <span key={f.d} className={cn("rounded-full px-2.5 py-1 text-[12.5px] font-semibold", plein ? "bg-black/[.13]" : "bg-accent")}>
              {nomJour(f.d, auj)} · {f.groupes.slice(0, 4).map(nomGroupe).join(", ")}
            </span>
          ))}
        </div>
      )}

      {p ? (
        <>
          <h2 className={cn("font-extrabold leading-tight tracking-[-0.01em]", onAppliquer ? "mt-2 text-[19px]" : "mt-3 text-[22px]")}>
            {onAppliquer ? p.nom : tr("Je te recommande : {s}", { s: p.nom.toLowerCase() })}
          </h2>
          <p className="mt-1 text-[13.5px] leading-snug opacity-85">{phrase(p.muscles.map(nomGroupe))} · {p.raison}</p>
          <div className="mt-3.5 flex gap-2">
            <button onClick={() => ouvrir(p.muscles)} className="flex h-11 flex-1 items-center justify-center gap-1.5 rounded-full bg-white text-[14.5px] font-semibold text-[#0a0a0c] active:scale-[.98]">
              {onAppliquer ? tr("Appliquer") : tr("Créer cette séance")}{!onAppliquer && <ArrowRightIcon className="size-4" weight="bold" />}
            </button>
            {r.propositions.length > 1 && (
              <button onClick={() => { tactile(6); setI((x) => x + 1); }} className="h-11 rounded-full border-[1.5px] border-black/30 px-4 text-[14px] font-semibold active:scale-[.98]">
                {tr("Autre idée")}
              </button>
            )}
          </div>
        </>
      ) : (
        <>
          <h2 className="mt-3 text-[21px] leading-tight font-extrabold tracking-[-0.01em]">
            {r.type === "fait" ? tr("Séance faite aujourd'hui") : tr("Repos ou cardio léger")}
          </h2>
          <p className="mt-1 text-[13.5px] leading-snug text-muted-foreground">
            {r.type === "fait" ? tr("Ton corps récupère : c'est pendant le repos que les muscles se construisent.") : tr("Tes muscles récupèrent encore de tes dernières séances : c'est pendant le repos qu'ils se construisent.")}
            {r.demain && <> {tr("Demain : {s}.", { s: r.demain.nom.toLowerCase() })}</>}
          </p>
          {r.type === "repos" && (
            <div className="mt-3.5 flex gap-2">
              <button onClick={() => router.push("/entrainement/assistant?type=cardio" as Route, AVANT)} className="flex h-11 flex-1 items-center justify-center rounded-full bg-plate text-[14.5px] font-semibold text-plate-foreground active:scale-[.98]">
                {tr("Cardio doux")}
              </button>
              {r.demain && (
                <button onClick={() => ouvrir(r.demain!.muscles)} className="h-11 rounded-full border-[1.5px] border-border px-4 text-[14px] font-semibold active:scale-[.98]">
                  {tr("Séance quand même")}
                </button>
              )}
            </div>
          )}
        </>
      )}

      <button onClick={() => setReglage((x) => !x)} className={cn("mt-3 text-[12.5px] font-semibold underline-offset-2 hover:underline", plein ? "opacity-75" : "text-muted-foreground")}>
        {nbEcartes ? tr("Écartés : {a}", { a: lister((ecartes || []).map(nomZone)).toLowerCase() }) : tr("Écarter un groupe")}
      </button>
      {reglage && (
        <div className="mt-2">
          <p className={cn("mb-2 text-[12.5px] leading-snug", plein ? "opacity-80" : "text-muted-foreground")}>
            {tr("Oxa ne te les recommandera plus, par exemple si un autre sport les fait déjà travailler.")}
          </p>
          <div className="flex flex-wrap gap-1.5">
            {ZONES_ECARTABLES.map((z) => {
              const on = !!ecartes?.includes(z);
              return (
                <button key={z} onClick={() => basculer(z)} aria-pressed={on}
                  className={cn("flex h-8 items-center gap-1 rounded-full px-3 text-[13px] font-semibold active:scale-[.97]",
                    on ? "bg-[#0a0a0c] text-white" : plein ? "bg-white/70 text-[#0a0a0c]" : "bg-accent")}>
                  {on && <CheckIcon className="size-3.5" weight="bold" />}{nomZone(z)}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}
