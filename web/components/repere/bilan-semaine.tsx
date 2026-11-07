"use client";

/* Bilan de la semaine écoulée, le lundi et le mardi en tête de Progrès : un anneau (séances faites
   sur l'objectif), trois faits au plus, et le détail en feuille (séries par muscle, records,
   protéines seulement si elles ont été notées). Logique : lib/logic/bilan-semaine.ts. */
import { loc, tr } from "@/lib/i18n";
import { useMemo, useState } from "react";
import { CaretRightIcon, ChartBarIcon, ShareNetworkIcon, TargetIcon, TrophyIcon } from "@phosphor-icons/react";
import { toast } from "sonner";
import { Drawer, DrawerContent, DrawerDescription, DrawerTitle } from "@/components/ui/drawer";
import { EX } from "@/lib/data/exercices";
import { MUSC } from "@/lib/data/referentiels";
import { bilanSemaine, jourDuBilan } from "@/lib/logic/bilan-semaine";
import { nomGroupe, type Groupe } from "@/lib/logic/recommandation";
import { nb } from "@/lib/logic/core";
import { objectifProteines } from "@/lib/logic/nutrition";
import { useRepere } from "@/lib/store";
import { tactile } from "@/lib/repos";
import { ORANGE } from "./recuperation";

/* noms courts (Pecs, Ischios…) dans la liste, comme la feuille Récupération : rien n'est tronqué */
const nomM = (k: string) => MUSC.find((g) => g.k === k)?.n ?? k;
const court = (d: string) => new Date(d + "T12:00").toLocaleDateString(loc(), { day: "numeric", month: "short" });

function Anneau({ v, max }: { v: number; max: number }) {
  const r = 26, c = 2 * Math.PI * r, p = Math.min(1, max ? v / max : 0);
  return (
    <span className="relative grid size-16 shrink-0 place-items-center">
      <svg viewBox="0 0 64 64" className="absolute inset-0 -rotate-90" aria-hidden>
        <circle cx="32" cy="32" r={r} fill="none" stroke="color-mix(in oklab, var(--plate) 22%, transparent)" strokeWidth="9" />
        <circle cx="32" cy="32" r={r} fill="none" stroke="var(--plate)" strokeWidth="9" strokeLinecap="round" strokeDasharray={`${c * p} ${c}`} />
      </svg>
      <span className="num text-[16px] font-bold">{v}/{max}</span>
    </span>
  );
}

export function CarteBilanSemaine({ auj }: { auj: string }) {
  const H = useRepere((s) => s.etat.HIST);
  const A = useRepere((s) => s.etat.A);
  const b = useMemo(() => (jourDuBilan(auj) ? bilanSemaine(H || [], A, auj, objectifProteines(A)) : null), [H, A, auj]);
  const [ouvert, setOuvert] = useState(false);
  if (!b) return null;
  const titre = b.tenu ? tr("Objectif tenu") : tp2(b.seances, b.objectif);
  const partager = async () => {
    tactile(8);
    const t = tr("Ma semaine sur Oxa : {s} séance(s) sur {o}{r}.", {
      s: b.seances, o: b.objectif,
      r: b.records.length ? tr(", {n} record(s) battu(s)", { n: b.records.length }) : "",
    });
    try {
      if (navigator.share) await navigator.share({ text: t, url: location.origin });
      else { await navigator.clipboard.writeText(t); toast.success(tr("Copié")); }
    } catch { /* partage annulé */ }
  };
  return (
    <>
      <button onClick={() => { tactile(5); setOuvert(true); }} aria-label={tr("Ta semaine")} className="block w-full rounded-[22px] bg-card p-4 text-left active:scale-[.99]">
        <span className="flex items-center justify-between">
          <span className="text-[11px] font-semibold tracking-[0.08em] text-muted-foreground uppercase">{tr("Ta semaine · {a} – {b}", { a: court(b.lundi), b: court(b.dimanche) })}</span>
          <CaretRightIcon className="size-4 text-muted-foreground" />
        </span>
        <span className="mt-2 flex items-center gap-4">
          <Anneau v={b.seances} max={b.objectif} />
          <span className="min-w-0 flex-1">
            <span className="block text-[19px] leading-tight font-bold">{titre}</span>
            <span className="block text-[13px] text-muted-foreground">{b.tenu ? tr("Ta série de semaines continue.") : tr("Une nouvelle semaine commence.")}</span>
          </span>
        </span>
        <span className="mt-3 flex flex-col gap-2 border-t border-border/60 pt-3 text-[14px]">
          {b.records[0] && (
            <span className="flex items-center gap-2.5"><TrophyIcon className="size-[18px] shrink-0 text-plate-ink dark:text-plate" weight="fill" />
              <span className="min-w-0 truncate"><b className="font-semibold">{tr("Record")}</b> · {EX[b.records[0].id]?.n}{b.records.length > 1 ? " " + tr("et {n} autre(s)", { n: b.records.length - 1 }) : ""}</span></span>
          )}
          {b.plusTravaille && (
            <span className="flex items-center gap-2.5"><ChartBarIcon className="size-[18px] shrink-0 text-plate-ink dark:text-plate" weight="fill" />
              <span className="min-w-0 truncate"><b className="font-semibold">{tr("Le plus travaillé")}</b> · {tr("{m}, {n} séries", { m: nomM(b.plusTravaille.k).toLowerCase(), n: nb(Math.round(b.plusTravaille.n)) })}</span></span>
          )}
          {b.aTravailler && (
            <span className="flex items-center gap-2.5"><TargetIcon className="size-[18px] shrink-0" style={{ color: ORANGE }} weight="fill" />
              <span className="min-w-0 truncate"><b className="font-semibold">{tr("Cette semaine")}</b> · {tr("un peu de {m}", { m: nomM(b.aTravailler.k).toLowerCase() })}</span></span>
          )}
        </span>
      </button>

      <Drawer open={ouvert} onOpenChange={setOuvert}>
        <DrawerContent className="max-h-[92dvh]">
          <div className="overflow-y-auto overscroll-contain px-5 pb-[max(env(safe-area-inset-bottom),20px)]">
            <DrawerTitle className="mt-2 text-[22px] font-bold">{tr("Ta semaine")}</DrawerTitle>
            <DrawerDescription className="text-[13px] text-muted-foreground">{tr("Du {a} au {b}", { a: court(b.lundi), b: court(b.dimanche) })}</DrawerDescription>
            <h3 className="mt-4 mb-2 text-[12.5px] font-semibold tracking-[0.04em] text-muted-foreground uppercase">{tr("Séries par muscle · cible {n}", { n: b.cible })}</h3>
            <div className="flex flex-col gap-2 rounded-[18px] bg-card p-3.5">
              {b.parMuscle.map(({ k, n }) => (
                <div key={k} className="flex items-center gap-3 text-[14px]">
                  <span className="w-[92px] shrink-0 truncate">{nomGroupe(k as Groupe)}</span>
                  <span className="relative h-2 flex-1 overflow-hidden rounded-full bg-muted">
                    <span className="absolute inset-y-0 left-0 rounded-full bg-plate" style={{ width: `${Math.min(100, (n / b.cible) * 100)}%`, opacity: n >= b.cible ? 1 : 0.55 }} />
                  </span>
                  <span className="num w-7 text-right font-semibold">{nb(Math.round(n))}</span>
                </div>
              ))}
            </div>
            {b.records.length > 0 && (
              <>
                <h3 className="mt-4 mb-2 text-[12.5px] font-semibold tracking-[0.04em] text-muted-foreground uppercase">{tr("Records")}</h3>
                <ul className="overflow-hidden rounded-[18px] bg-card">
                  {b.records.slice(0, 6).map((r, i) => (
                    <li key={i} className="flex items-center justify-between gap-3 border-t border-border/60 px-3.5 py-2.5 text-[14.5px] first:border-t-0">
                      <span className="min-w-0 truncate">{EX[r.id]?.n}</span>
                      <span className="num shrink-0 font-semibold">{r.max ? tr("{v} kg", { v: nb(r.max) }) : tr("{n} rép.", { n: r.reps })}</span>
                    </li>
                  ))}
                </ul>
              </>
            )}
            {b.protJours != null && (
              <p className="mt-4 rounded-[18px] bg-card px-3.5 py-3 text-[14.5px]">{tr("Protéines : objectif atteint {n} jour(s) sur 7", { n: b.protJours })}</p>
            )}
            <button onClick={partager} className="mt-4 flex h-12 w-full items-center justify-center gap-2 rounded-full bg-card text-[15px] font-semibold active:scale-[.98]">
              <ShareNetworkIcon className="size-4" />{tr("Partager ma semaine")}
            </button>
          </div>
        </DrawerContent>
      </Drawer>
    </>
  );
}

const tp2 = (s: number, o: number) => tr("{s} séance(s) sur {o}", { s, o });
