"use client";

/* Réglages d'une séance cardio, communs au bloc du composeur, à l'assistant et à l'écran de
   préparation : un résumé avec la frise de la séance, puis machine, style, durée et intensité ;
   les durées au pas près restent à portée, repliées. */
import { tr } from "@/lib/i18n";
import { useState } from "react";
import { CaretDownIcon, FireIcon, HeartbeatIcon, LightningIcon, MinusIcon, MountainsIcon, PlusIcon, RepeatIcon, StairsIcon, TimerIcon, TriangleIcon, WaveSineIcon } from "@phosphor-icons/react";
import { Segmente } from "./segmente";
import { Vignette } from "./exercice-carte";
import {
  construireSeance, dureeTotale, FAMILLES, FORMATS, MACHINES, machinesDe, reglagesPour, resumeCardio,
  type FormatCardio, type Machine, type Niveau, type Phase, type Reglages,
} from "@/lib/logic/cardio";
import { tactile } from "@/lib/repos";
import { cn } from "@/lib/utils";

export const ICONE_FORMAT: Record<FormatCardio, typeof TimerIcon> = {
  fractionne: WaveSineIcon, tabata: LightningIcon, emom: TimerIcon, endurance: HeartbeatIcon,
  norvegien: FireIcon, trente: RepeatIcon, pyramide: TriangleIcon, cote: MountainsIcon, paliers: StairsIcon,
};

export const mmss = (s: number) => `${Math.floor(s / 60)}:${String(Math.round(s % 60)).padStart(2, "0")}`;
const enMin = (s: number) => (s % 60 ? mmss(s) : `${s / 60} min`);

export type ChoixCardio = { f: FormatCardio; m: Machine; n: Niveau; r: Reglages };

/* Champs réglables selon le format : [clé, libellé, pas, min, max, affichage]. */
type Champ = [keyof Reglages, string, number, number, number, (v: number) => string];
const CHAMPS: Record<FormatCardio, Champ[]> = {
  fractionne: [["effort", tr("Effort"), 15, 15, 300, mmss], ["recup", tr("Récupération"), 15, 15, 300, mmss], ["tours", tr("Tours"), 1, 2, 20, String]],
  tabata: [["blocs", tr("Blocs de 8 tours"), 1, 1, 6, String], ["pauseBlocs", tr("Pause entre blocs"), 15, 30, 180, mmss]],
  emom: [["tours", tr("Minutes"), 1, 4, 30, String], ["reps", tr("Répétitions par minute"), 1, 4, 30, String]],
  endurance: [["duree", tr("Durée"), 5, 10, 90, (v) => `${v} min`]],
  norvegien: [["effort", tr("Effort"), 30, 120, 300, mmss], ["recup", tr("Récupération"), 30, 60, 240, mmss], ["tours", tr("Tours"), 1, 2, 6, String]],
  trente: [["tours", tr("Tours par bloc"), 1, 4, 20, String], ["blocs", tr("Blocs"), 1, 1, 4, String], ["pauseBlocs", tr("Pause entre blocs"), 15, 30, 240, mmss]],
  pyramide: [["effort", tr("Pas de la pyramide"), 15, 15, 60, mmss], ["tours", tr("Marches jusqu'au sommet"), 1, 2, 6, String], ["recup", tr("Récupération"), 15, 15, 180, mmss]],
  cote: [["effort", tr("Sprint"), 5, 10, 60, mmss], ["recup", tr("Récupération"), 15, 30, 180, mmss], ["tours", tr("Sprints"), 1, 3, 15, String]],
  paliers: [["duree", tr("Durée"), 3, 12, 90, (v) => `${v} min`], ["tours", tr("Paliers"), 1, 2, 5, String]],
};
const COMMUNS: Champ[] = [["echauf", tr("Échauffement"), 60, 0, 600, enMin], ["calme", tr("Retour au calme"), 60, 0, 600, enMin]];

const DUREES = [10, 15, 20, 30, 45];
const INTENSITES: [string, string][] = [[tr("Tranquille"), tr("récup longue")], [tr("Soutenu"), tr("équilibré")], [tr("Costaud"), tr("efforts longs")]];

export function ReglagesCardio({ choix, onChange, avecFormat = true }: { choix: ChoixCardio; onChange: (c: ChoixCardio) => void; avecFormat?: boolean }) {
  const { f, m, n, r } = choix;
  const [detail, setDetail] = useState(false);
  const phases = construireSeance(f, m, r), total = dureeTotale(phases), minutes = Math.round(total / 60);
  const machines = machinesDe(f);
  const famille = FAMILLES.find((x) => x.formats.includes(f)) ?? FAMILLES[0];
  /* durées proposées : celles que le format atteint à 2 minutes près */
  const durees = DUREES.filter((d) => Math.abs(dureeTotale(construireSeance(f, m, reglagesPour(f, n, d, r))) / 60 - d) <= 2);
  const dureeChoisie = durees.reduce<number | null>((b, d) => (Math.abs(d - total / 60) <= 2 && (b == null || Math.abs(d - total / 60) < Math.abs(b - total / 60)) ? d : b), null);
  const changerFormat = (g: FormatCardio) => {
    tactile(6);
    onChange({ f: g, m: machinesDe(g).includes(m) ? m : machinesDe(g)[0], n, r: reglagesPour(g, n, minutes) });
  };
  return (
    <div className="flex flex-col gap-6">
      <section className="rounded-[22px] bg-card p-4" aria-label={tr("Résumé")}>
        <div className="flex items-baseline justify-between gap-3">
          <b className="truncate text-[17px]">{FORMATS[f].nom} · {MACHINES[m].nom}</b>
          <span className="shrink-0 text-[13px] font-semibold text-muted-foreground"><b className="num text-[28px] font-extrabold tracking-[-0.02em] text-foreground">{minutes}</b>{" "}{tr("min")}</span>
        </div>
        <Frise phases={phases} />
        <p className="mt-2 text-[13.5px] text-muted-foreground">{resumeCardio(f, r)}</p>
      </section>

      <section>
        <h2 className="eyebrow mb-2 px-1">{tr("1 · Sur quoi ?")}</h2>
        <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
          {machines.map((k) => {
            const on = k === m, ex = MACHINES[k].ex;
            return (
              <button key={k} aria-pressed={on} onClick={() => { tactile(5); onChange({ ...choix, m: k }); }} className="flex w-[76px] shrink-0 flex-col items-center gap-1.5">
                {ex ? <Vignette id={ex} className={cn("size-[72px] rounded-[16px] border-2", on ? "border-plate" : "border-transparent")} /> : <span className="size-[72px] rounded-[16px] bg-muted" />}
                <span className={cn("text-center text-[12px] leading-tight font-medium", on && "text-plate-ink")}>{MACHINES[k].nom}</span>
              </button>
            );
          })}
        </div>
      </section>

      {avecFormat && (
        <section>
          <h2 className="eyebrow mb-2 px-1">{tr("2 · Quel style ?")}</h2>
          <Segmente label={tr("Style")} valeur={famille.nom} onChange={(nom) => { const fam = FAMILLES.find((x) => x.nom === nom)!; if (fam !== famille) changerFormat(fam.formats[0]); }} options={FAMILLES.map((x) => ({ v: x.nom, n: x.nom }))} />
          <div className="no-scrollbar -mx-4 mt-2.5 flex gap-2 overflow-x-auto px-4 pb-1">
            {famille.formats.map((g) => {
              const I = ICONE_FORMAT[g], on = g === f;
              return (
                <button key={g} aria-pressed={on} onClick={() => changerFormat(g)} className={cn("flex h-10 shrink-0 items-center gap-1.5 rounded-full border px-3.5 text-[14px] font-medium transition-colors", on ? "border-foreground bg-foreground text-background" : "border-border bg-card")}>
                  <I className="size-4" weight={on ? "fill" : "regular"} />{FORMATS[g].nom}
                </button>
              );
            })}
          </div>
          <p className="mt-2 px-1 text-[13px] leading-relaxed text-muted-foreground">{FORMATS[f].texte}</p>
        </section>
      )}

      <section>
        <h2 className="eyebrow mb-2 px-1">{avecFormat ? tr("3 · Combien de temps ?") : tr("2 · Combien de temps ?")}</h2>
        <div className="flex gap-2">
          {durees.map((d) => {
            const on = d === dureeChoisie;
            return (
              <button key={d} aria-pressed={on} aria-label={tr("{d} minutes", { d })} onClick={() => { tactile(5); onChange({ ...choix, r: reglagesPour(f, n, d, r) }); }}
                className={cn("flex h-[52px] flex-1 flex-col items-center justify-center rounded-2xl border bg-card transition-colors", on ? "border-2 border-plate bg-plate-soft text-plate-ink" : "border-border")}>
                <span className="num text-[17px] leading-none font-bold">{d}</span>
                <span className="text-[10.5px] font-medium text-muted-foreground">{tr("min")}</span>
              </button>
            );
          })}
        </div>
      </section>

      <section>
        <h2 className="eyebrow mb-2 px-1">{avecFormat ? tr("4 · À quelle intensité ?") : tr("3 · À quelle intensité ?")}</h2>
        <div className="grid grid-cols-3 gap-2">
          {INTENSITES.map(([nom, sous], i) => {
            const on = i === n;
            return (
              <button key={nom} aria-pressed={on} onClick={() => { tactile(5); onChange({ ...choix, n: i as Niveau, r: reglagesPour(f, i as Niveau, minutes) }); }}
                className={cn("rounded-2xl border bg-card px-2 py-2.5 text-center transition-colors", on ? "border-2 border-plate bg-plate-soft" : "border-border")}>
                <b className="block text-[14px]">{nom}</b>
                <span className="text-[11.5px] text-muted-foreground">{sous}</span>
              </button>
            );
          })}
        </div>
      </section>

      <section className="overflow-hidden rounded-[20px] bg-card">
        <button onClick={() => setDetail((o) => !o)} aria-expanded={detail} className="flex w-full items-center gap-3 px-4 py-3.5 text-left">
          <span className="flex-1 text-[15px] font-medium">{tr("Ajuster les durées en détail")}</span>
          <CaretDownIcon className={cn("size-4 shrink-0 text-muted-foreground transition-transform", detail && "rotate-180")} />
        </button>
        {detail && (
          <>
            {[...CHAMPS[f], ...COMMUNS].map(([k, lib, pas, min, max, aff]) => (
              <div key={k} className="flex items-center gap-3 border-t border-border/70 px-4 py-2.5">
                <span className="flex-1 text-[14.5px] font-medium">{lib}</span>
                <button aria-label={tr("{lib} : moins", { lib })} disabled={r[k] <= min} onClick={() => { tactile(4); onChange({ ...choix, r: { ...r, [k]: Math.max(min, r[k] - pas) } }); }} className="grid size-9 place-items-center rounded-full bg-muted active:scale-90 disabled:opacity-35">
                  <MinusIcon className="size-4" weight="bold" />
                </button>
                <span className="num w-[58px] text-center text-[20px] font-bold">{aff(r[k])}</span>
                <button aria-label={tr("{lib} : plus", { lib })} disabled={r[k] >= max} onClick={() => { tactile(4); onChange({ ...choix, r: { ...r, [k]: Math.min(max, r[k] + pas) } }); }} className="grid size-9 place-items-center rounded-full bg-muted active:scale-90 disabled:opacity-35">
                  <PlusIcon className="size-4" weight="bold" />
                </button>
              </div>
            ))}
            <p className="border-t border-border/70 px-4 py-3 text-[12.5px] leading-relaxed text-muted-foreground">
              {f === "endurance"
                ? MACHINES[m].continu
                : <>{tr("À l'effort :")}{" "}{MACHINES[m].effort}{" "}{tr("En récupération :")}{" "}{MACHINES[m].recup.charAt(0).toLowerCase() + MACHINES[m].recup.slice(1)}</>}
            </p>
          </>
        )}
      </section>
    </div>
  );
}

/* Frise de la séance : chaque phase à sa durée, l'effort en plein, la récupération en clair. */
function Frise({ phases }: { phases: Phase[] }) {
  return (
    <>
      <div className="mt-3 flex h-[30px] items-end gap-[2px]" aria-hidden>
        {phases.map((p, i) => (
          <span key={i} style={{ flex: p.duree }} className={cn("min-w-[2px] rounded-[4px]",
            p.type === "effort" ? "h-full bg-plate" : p.type === "continu" ? "h-[70%] bg-plate" : p.type === "recup" || p.type === "pause" ? "h-[45%] bg-plate/35" : "h-[30%] bg-muted-foreground/30")} />
        ))}
      </div>
      <div className="mt-2 flex flex-wrap gap-x-3.5 gap-y-1 text-[11.5px] text-muted-foreground">
        <span className="flex items-center gap-1.5"><i className="size-2 rounded-[2px] bg-muted-foreground/30" />{tr("Mise en route et retour au calme")}</span>
        <span className="flex items-center gap-1.5"><i className="size-2 rounded-[2px] bg-plate" />{tr("Effort")}</span>
        {phases.some((p) => p.type === "recup" || p.type === "pause") && <span className="flex items-center gap-1.5"><i className="size-2 rounded-[2px] bg-plate/35" />{tr("Récupération")}</span>}
      </div>
    </>
  );
}
