"use client";

/* Une séance déjà faite, relue depuis Progrès : les mêmes cartes que pendant l'entraînement
   (photo, muscles, séries une à une), rangées par parties, sans rien de modifiable. */
import { tr } from "@/lib/i18n";
import { useState } from "react";
import { CaretDownIcon, CheckIcon, CrosshairIcon, HeartbeatIcon } from "@phosphor-icons/react";
import { EX } from "@/lib/data/exercices";
import { estSoin } from "@/lib/data/soin";
import { musclesDe, nb, resumeDe } from "@/lib/logic/core";
import { detailDe, type LigneHist } from "@/lib/logic/historique";
import type { Partie } from "@/lib/logic/combinee";
import type { HistoCardio, Journal } from "@/lib/logic/types";
import { FORMATS, MACHINES } from "@/lib/logic/cardio";
import { useRepere } from "@/lib/store";
import { Vignette } from "./exercice-carte";
import { TitrePartie } from "./parties";
import { cn } from "@/lib/utils";

const UNITE: Record<string, string> = { kg: "kg", lest: tr("kg de lest"), aucune: "", temps: "s", dist: "m" };

export function SeanceLue({ l, cardio }: { l: LigneHist; cardio: HistoCardio[] }) {
  const etat = useRepere((s) => s.etat);
  const det = detailDe(etat, l);
  /* parties dans l'ordre où elles apparaissent ; le cardio de la séance à sa place dans la séance enregistrée */
  const partie = (id: string): Partie => (estSoin(id) ? "soin" : EX[id]?.pat === "ca" ? "cardio" : "muscu");
  const S = l.s.startsWith("L|") ? etat.SEANCES[+l.s.slice(2)] : undefined;
  const ordre: Partie[] = [];
  const noter = (p: Partie) => { if (!ordre.includes(p)) ordre.push(p); };
  const blocAvant = !!S?.blocs?.length && S.blocs.every((b) => b.apres === 0);
  if (cardio.length && blocAvant) noter("cardio");
  det.forEach((x) => noter(partie(x.id)));
  if (cardio.length) noter("cardio");
  const plusieurs = ordre.length > 1;
  let num = 0;
  return (
    <section className="mt-3" aria-label={l.nom}>
      <div className="mb-2 flex items-baseline justify-between gap-2 px-1">
        <h3 className="truncate text-[18px] font-bold">{l.nom}</h3>
        <span className="shrink-0 text-[12.5px] text-muted-foreground">{tr("{ser} séries{a}{a1}", { ser: l.ser, a: "", a1: l.min ? tr(" · {min} min", { min: l.min }) : "" })}</span>
      </div>
      <div className="flex flex-col gap-2">
        {ordre.map((p) => (
          <div key={p} className="flex flex-col gap-2">
            {plusieurs && <TitrePartie p={p} />}
            {p === "cardio" && cardio.map((c, i) => <CarteCardioLue key={"c" + i} c={c} />)}
            {det.filter((x) => partie(x.id) === p).map((x, i) => <CarteLue key={x.id + i} id={x.id} L={x.L} num={++num} />)}
          </div>
        ))}
      </div>
    </section>
  );
}

/* Carte d'exercice en lecture : repliée, le résumé des séries ; dépliée, chaque série. */
function CarteLue({ id, L, num }: { id: string; L: Journal; num: number }) {
  const [ouvert, setOuvert] = useState(false);
  const x = EX[id], mus = musclesDe([id]);
  return (
    <div className="overflow-hidden rounded-[20px] border border-plate/60 bg-card">
      <button onClick={() => setOuvert((o) => !o)} aria-expanded={ouvert} className="flex w-full items-center gap-3.5 p-3 text-left">
        <Vignette id={id} num={num} fait />
        <span className="flex min-w-0 flex-1 flex-col gap-1">
          <span className="truncate text-[16px] leading-tight font-semibold tracking-[-0.01em]">{x.n}</span>
          {mus.length > 0 && (
            <span className="flex items-center gap-1.5 truncate text-[12.5px] font-medium text-muted-foreground">
              <CrosshairIcon className="size-3.5 shrink-0 text-plate-ink" />{mus.join(" · ")}
            </span>
          )}
          <span className="truncate text-[12.5px] font-medium text-foreground/80">{resumeDe(L, x, UNITE[x.ch])}</span>
        </span>
        <CaretDownIcon className={cn("size-5 shrink-0 text-muted-foreground transition-transform duration-200", ouvert && "rotate-180")} />
      </button>
      {ouvert && (
        <ol className="border-t border-border/70 px-4 py-2" aria-label={tr("Séries de {n}", { n: x.n })}>
          {L.series.map((s, i) => (
            <li key={i} className="flex items-center gap-3 py-1.5 text-[14.5px]">
              <span className="num w-6 text-muted-foreground">{i + 1}</span>
              <span className="num flex-1 font-semibold">{serieLue(x.ch, s)}</span>
              <CheckIcon className="size-4 text-plate" weight="bold" aria-label={tr("validée")} />
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

function CarteCardioLue({ c }: { c: HistoCardio }) {
  return (
    <div className="flex items-center gap-3.5 rounded-[20px] border border-plate/40 bg-plate-soft p-3">
      <span className="grid size-14 shrink-0 place-items-center rounded-[14px] bg-card text-plate"><HeartbeatIcon className="size-7" weight="fill" /></span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[16px] font-semibold">{c.run ? c.nom : FORMATS[c.f]?.nom || c.nom}</span>
        <span className="block truncate text-[12.5px] text-muted-foreground">{dureeCardio(c)}{!c.run && MACHINES[c.m] ? " · " + MACHINES[c.m].nom : ""}</span>
      </span>
    </div>
  );
}

/** Une série, comme dans le tableau de la séance : « 10 kg × 10 », « 12 répétitions +5 kg », « 45 s ». */
function serieLue(ch: string, s: { v: number; reps: number; lest?: number }) {
  const lest = +(s.lest ?? 0) > 0 ? ` +${nb(s.lest!)} kg` : "";
  if (ch === "kg") return `${nb(s.v)} kg × ${s.reps}`;
  if (ch === "lest") return `+${nb(s.v)} kg × ${s.reps}`;
  if (ch === "temps") return `${nb(s.v)} s${lest}`;
  if (ch === "dist") return `${nb(s.v)} m`;
  return tr("{n} répétitions", { n: s.v }) + lest;
}

/** « 15 min, dont 10 min d'effort » (le temps d'effort est en secondes). */
export const dureeCardio = (c: HistoCardio) =>
  c.effort && !c.run && Math.round(c.effort / 60) < Math.round(c.min)
    ? tr("{a} min, dont {b} min d'effort", { a: Math.round(c.min), b: Math.max(1, Math.round(c.effort / 60)) })
    : tr("{a} min", { a: Math.round(c.min) });
