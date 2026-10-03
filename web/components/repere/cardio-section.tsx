"use client";

/* Section Cardio d'Entraînement : départ rapide d'un des quatre formats,
   et le cardio des sept derniers jours. */
import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Route } from "next";
import { CaretRightIcon } from "@phosphor-icons/react";
import { construireSeance, dureeTotale, FORMATS, niveauDe, ORDRE_FORMATS, reglagesDe } from "@/lib/logic/cardio";
import { useRepere } from "@/lib/store";
import { AVANT } from "@/lib/nav";
import { ICONE_FORMAT } from "./reglages-cardio";

const JOURS = ["dimanche", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"];
const quand = (ts: number, maintenant: number) => {
  const j = Math.floor((new Date(maintenant).setHours(0, 0, 0, 0) - new Date(ts).setHours(0, 0, 0, 0)) / 864e5);
  return j <= 0 ? "aujourd'hui" : j === 1 ? "hier" : j < 7 ? JOURS[new Date(ts).getDay()] : new Date(ts).toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
};

export function SectionCardio() {
  const router = useRouter();
  const A = useRepere((s) => s.etat.A);
  const histo = useRepere((s) => s.etat.CARDIO) || [];
  const n = niveauDe(A.regularite);
  const [maintenant] = useState(() => Date.now());
  const semaine = histo.filter((h) => maintenant - h.ts < 7 * 864e5);
  const minutes = semaine.reduce((s, h) => s + h.min, 0);
  const derniere = histo.at(-1);
  return (
    <section>
      <div className="mb-2 flex items-baseline justify-between px-1">
        <h2 className="eyebrow">Cardio</h2>
        {derniere && (
          <span className="text-[12px] text-muted-foreground">
            {minutes > 0 ? <><b className="num text-[14px] text-foreground">{minutes} min</b> sur 7 jours · </> : null}dernière : {FORMATS[derniere.f].nom.toLowerCase()}, {quand(derniere.ts, maintenant)}
          </span>
        )}
      </div>
      <div className="no-scrollbar -mx-4 flex snap-x gap-2.5 overflow-x-auto px-4 pb-1">
        {ORDRE_FORMATS.map((f) => {
          const I = ICONE_FORMAT[f];
          const min = Math.round(dureeTotale(construireSeance(f, f === "emom" ? "pdc" : "tapis", reglagesDe(f, n))) / 60);
          return (
            <button
              key={f}
              onClick={() => router.push(`/entrainement/cardio?f=${f}` as Route, AVANT)}
              className="flex w-[148px] shrink-0 snap-start flex-col items-start gap-2 rounded-[20px] border border-border/80 bg-card p-3.5 text-left active:scale-[.98]"
            >
              <span className="grid size-9 place-items-center rounded-[11px] bg-plate-soft text-plate-ink"><I className="size-5" weight="fill" /></span>
              <span className="text-[15px] leading-tight font-semibold">{FORMATS[f].nom}</span>
              <span className="text-[12px] leading-snug text-muted-foreground">{FORMATS[f].court}</span>
              <span className="mt-auto flex w-full items-center justify-between pt-1 text-[12.5px] font-medium text-plate-ink">
                <span className="num text-[15px]">{min} min</span><CaretRightIcon className="size-3.5" weight="bold" />
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
