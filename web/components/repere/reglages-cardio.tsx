"use client";

/* Réglages d'une séance cardio, communs à l'écran de préparation et à l'assistant :
   format, machine, niveau, puis durées ajustables au pas près. */
import { HeartbeatIcon, LightningIcon, MinusIcon, PlusIcon, TimerIcon, WaveSineIcon } from "@phosphor-icons/react";
import { Segmente } from "./segmente";
import { Vignette } from "./exercice-carte";
import {
  construireSeance, dureeTotale, FORMATS, MACHINES, machinesDe, NIVEAUX, ORDRE_FORMATS, reglagesDe,
  type FormatCardio, type Machine, type Niveau, type Reglages,
} from "@/lib/logic/cardio";
import { tactile } from "@/lib/repos";
import { cn } from "@/lib/utils";

export const ICONE_FORMAT: Record<FormatCardio, typeof TimerIcon> = {
  fractionne: WaveSineIcon, tabata: LightningIcon, emom: TimerIcon, endurance: HeartbeatIcon,
};

export const mmss = (s: number) => `${Math.floor(s / 60)}:${String(Math.round(s % 60)).padStart(2, "0")}`;
const enMin = (s: number) => (s % 60 ? mmss(s) : `${s / 60} min`);

export type ChoixCardio = { f: FormatCardio; m: Machine; n: Niveau; r: Reglages };

/* Champs réglables selon le format : [clé, libellé, pas, min, max, affichage]. */
type Champ = [keyof Reglages, string, number, number, number, (v: number) => string];
const CHAMPS: Record<FormatCardio, Champ[]> = {
  fractionne: [["effort", "Effort", 15, 15, 300, mmss], ["recup", "Récupération", 15, 15, 300, mmss], ["tours", "Tours", 1, 2, 20, String]],
  tabata: [["blocs", "Blocs de 8 tours", 1, 1, 6, String], ["pauseBlocs", "Pause entre blocs", 15, 30, 180, mmss]],
  emom: [["tours", "Minutes", 1, 4, 30, String], ["reps", "Répétitions par minute", 1, 4, 30, String]],
  endurance: [["duree", "Durée", 5, 10, 90, (v) => `${v} min`]],
};
const COMMUNS: Champ[] = [["echauf", "Échauffement", 60, 0, 600, enMin], ["calme", "Retour au calme", 60, 0, 600, enMin]];

export function ReglagesCardio({ choix, onChange, avecFormat = true }: { choix: ChoixCardio; onChange: (c: ChoixCardio) => void; avecFormat?: boolean }) {
  const { f, m, n, r } = choix;
  const total = dureeTotale(construireSeance(f, m, r));
  const machines = machinesDe(f);
  const changerFormat = (g: FormatCardio) => {
    tactile(6);
    onChange({ f: g, m: machinesDe(g).includes(m) ? m : machinesDe(g)[0], n, r: reglagesDe(g, n) });
  };
  return (
    <div className="flex flex-col gap-6">
      {avecFormat && (
        <section>
          <h2 className="eyebrow mb-2 px-1">Format</h2>
          <div className="grid grid-cols-2 gap-2">
            {ORDRE_FORMATS.map((g) => {
              const I = ICONE_FORMAT[g], on = g === f;
              return (
                <button
                  key={g} aria-pressed={on} onClick={() => changerFormat(g)}
                  className={cn("flex flex-col items-start gap-1.5 rounded-[18px] border p-3.5 text-left transition-colors", on ? "border-plate bg-plate text-plate-foreground" : "border-border/80 bg-card")}
                >
                  <I className="size-5" weight={on ? "fill" : "regular"} />
                  <span className="text-[15px] font-semibold">{FORMATS[g].nom}</span>
                  <span className={cn("text-[12px] leading-snug", on ? "opacity-85" : "text-muted-foreground")}>{FORMATS[g].court}</span>
                </button>
              );
            })}
          </div>
          <p className="mt-2 px-1 text-[13px] leading-relaxed text-muted-foreground">{FORMATS[f].texte}</p>
        </section>
      )}

      <section>
        <h2 className="eyebrow mb-2 px-1">Matériel</h2>
        <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
          {machines.map((k) => {
            const on = k === m, ex = MACHINES[k].ex;
            return (
              <button
                key={k} aria-pressed={on} onClick={() => { tactile(5); onChange({ ...choix, m: k }); }}
                className={cn("flex w-[92px] shrink-0 flex-col items-center gap-1.5 rounded-[18px] border p-2 pb-2.5 transition-colors", on ? "border-plate bg-plate-soft" : "border-border/80 bg-card")}
              >
                {ex ? <Vignette id={ex} className="size-[74px] rounded-[13px]" /> : <span className="size-[74px] rounded-[13px] bg-muted" />}
                <span className={cn("text-center text-[12px] leading-tight font-medium", on && "text-plate-ink")}>{MACHINES[k].nom}</span>
              </button>
            );
          })}
        </div>
      </section>

      <section>
        <h2 className="eyebrow mb-2 px-1">Niveau</h2>
        <Segmente label="Niveau" valeur={n} onChange={(v) => onChange({ ...choix, n: v, r: reglagesDe(f, v) })} options={NIVEAUX.map((x, i) => ({ v: i as Niveau, n: x }))} />
      </section>

      <section>
        <div className="mb-2 flex items-baseline justify-between px-1">
          <h2 className="eyebrow">Durées</h2>
          <span className="text-[13px] text-muted-foreground">Total <b className="num text-[17px] text-foreground">{Math.round(total / 60)} min</b></span>
        </div>
        <div className="overflow-hidden rounded-[20px] border border-border/80 bg-card">
          {[...CHAMPS[f], ...COMMUNS].map(([k, lib, pas, min, max, aff]) => (
            <div key={k} className="flex items-center gap-3 border-t border-border/70 px-4 py-2.5 first:border-t-0">
              <span className="flex-1 text-[14.5px] font-medium">{lib}</span>
              <button aria-label={`${lib} : moins`} disabled={r[k] <= min} onClick={() => { tactile(4); onChange({ ...choix, r: { ...r, [k]: Math.max(min, r[k] - pas) } }); }} className="grid size-9 place-items-center rounded-full bg-muted active:scale-90 disabled:opacity-35">
                <MinusIcon className="size-4" weight="bold" />
              </button>
              <span className="num w-[58px] text-center text-[20px] font-bold">{aff(r[k])}</span>
              <button aria-label={`${lib} : plus`} disabled={r[k] >= max} onClick={() => { tactile(4); onChange({ ...choix, r: { ...r, [k]: Math.min(max, r[k] + pas) } }); }} className="grid size-9 place-items-center rounded-full bg-muted active:scale-90 disabled:opacity-35">
                <PlusIcon className="size-4" weight="bold" />
              </button>
            </div>
          ))}
        </div>
        <p className="mt-2 px-1 text-[12.5px] leading-relaxed text-muted-foreground">
          {f === "endurance"
            ? MACHINES[m].continu
            : <>À l&apos;effort : {MACHINES[m].effort} En récupération : {MACHINES[m].recup.charAt(0).toLowerCase() + MACHINES[m].recup.slice(1)}</>}
        </p>
      </section>
    </div>
  );
}
