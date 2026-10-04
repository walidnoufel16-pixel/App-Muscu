"use client";

import { useCallback, useState } from "react";
import { ArrowDownIcon, ArrowUpIcon, FlameIcon, TrophyIcon } from "@phosphor-icons/react";
import { useRepere } from "@/lib/store";
import { jourDe } from "@/lib/logic/historique";
import { objectifHebdo, serie } from "@/lib/logic/motivation";
import { Button } from "@/components/ui/button";
import { Drawer, DrawerContent, DrawerDescription, DrawerTitle } from "@/components/ui/drawer";
import { mouvementReduit, useCelebrer } from "@/lib/celebrer";
import { cn } from "@/lib/utils";

/* Chiffre qui monte de 0 à sa valeur, sans re-rendu React (on écrit directement dans le nœud). */
function Compteur({ valeur, delai = 0 }: { valeur: number; delai?: number }) {
  const fmt = (v: number) => Math.round(v).toLocaleString("fr-FR");
  const monter = useCallback((el: HTMLSpanElement | null) => {
    if (!el) return;
    if (mouvementReduit() || valeur === 0) { el.textContent = fmt(valeur); return; }
    const duree = 900, t0 = performance.now() + delai;
    const pas = (t: number) => {
      const e = Math.min(1, Math.max(0, (t - t0) / duree));
      el.textContent = fmt(valeur * (1 - Math.pow(1 - e, 3)));
      if (e < 1) requestAnimationFrame(pas);
    };
    requestAnimationFrame(pas);
  }, [valeur, delai]);
  return <span ref={monter}>0</span>;
}

/* Fin de séance : un bilan qui se compte sous tes yeux. */
export function Bilan() {
  const bilan = useCelebrer((s) => s.bilan);
  const fermer = useCelebrer((s) => s.fermerBilan);
  const stats = !bilan ? [] : bilan.cases ? bilan.cases : [
        bilan.volume > 0 ? { n: "kg soulevés", v: bilan.volume } : { n: "exercices", v: bilan.exercices },
        { n: "séries validées", v: bilan.series },
        bilan.minutes != null ? { n: "minutes", v: bilan.minutes } : { n: "exercices", v: bilan.exercices },
        { n: bilan.records > 1 ? "records battus" : "record battu", v: bilan.records, accent: bilan.records > 0 },
      ];
  return (
    <Drawer open={!!bilan} onOpenChange={(o) => !o && fermer()}>
      <DrawerContent>
        {bilan && (
          <div className="px-5 pt-3 pb-[max(env(safe-area-inset-bottom),20px)] text-center">
            <div className="mx-auto grid size-20 animate-[medaille_.8s_cubic-bezier(.3,1.5,.5,1)_both] place-items-center rounded-full bg-plate text-plate-foreground shadow-[0_12px_40px_-10px_var(--plate)]">
              <TrophyIcon className="size-10" weight="fill" />
            </div>
            <div className="eyebrow mt-5 animate-[monter_.5s_.15s_ease-out_both]">Séance terminée</div>
            <DrawerTitle className="mt-1 animate-[monter_.5s_.22s_ease-out_both] text-[26px] leading-tight font-bold tracking-[-0.02em]">{bilan.titre}</DrawerTitle>
            <DrawerDescription className="sr-only">Bilan de la séance</DrawerDescription>
            <div className="mt-6 grid grid-cols-2 gap-2">
              {stats.map((s, i) => (
                <div
                  key={s.n}
                  className={cn("animate-[monter_.5s_ease-out_both] rounded-2xl border p-3.5 text-left", s.accent ? "border-plate bg-plate-soft" : "bg-card")}
                  style={{ animationDelay: 300 + i * 80 + "ms" }}
                >
                  <div className="num text-[34px] leading-none font-bold"><Compteur valeur={s.v} delai={350 + i * 80} /></div>
                  <div className="mt-1 text-[12.5px] font-medium text-muted-foreground">{s.n}</div>
                </div>
              ))}
            </div>
            <Suite s={bilan.s} />
            <Button variant="plate" size="xl" className="mt-6 w-full" onClick={fermer}>Terminer</Button>
          </div>
        )}
      </DrawerContent>
    </Drawer>
  );
}

/* Sous le bilan : la comparaison avec la dernière fois et la semaine en cours. */
function Suite({ s }: { s?: string }) {
  const etat = useRepere((x) => x.etat);
  const [auj] = useState(() => jourDe(Date.now()));
  const H = etat.HIST || [];
  const ici = s ? H.find((l) => l.d === auj && l.s === s) : undefined;
  const avant = s ? H.filter((l) => l.s === s && l.d < auj && l.vol > 0).at(-1) : undefined;
  const S = serie(H, etat.CARDIO || [], objectifHebdo(etat.A), auj);
  const p = ici && avant && ici.vol > 0 ? Math.round(((ici.vol - avant.vol) / avant.vol) * 100) : null;
  const date = avant && new Date(avant.d + "T12:00").toLocaleDateString("fr-FR", { day: "numeric", month: "long" });
  return (
    <div className="mt-3 flex flex-col gap-1.5 text-left">
      {p !== null && (
        <div className="flex animate-[monter_.5s_.7s_ease-out_both] items-center gap-2.5 rounded-2xl bg-muted/60 px-3.5 py-2.5 text-[13.5px]">
          {p >= 0 ? <ArrowUpIcon className="size-4 shrink-0 text-success" weight="bold" /> : <ArrowDownIcon className="size-4 shrink-0 text-muted-foreground" weight="bold" />}
          <span><b className={p > 0 ? "text-success" : ""}>{p > 0 ? "+" : ""}{p} % de tonnage</b> par rapport au {date}</span>
        </div>
      )}
      <div className="flex animate-[monter_.5s_.78s_ease-out_both] items-center gap-2.5 rounded-2xl bg-muted/60 px-3.5 py-2.5 text-[13.5px]">
        <FlameIcon className="size-4 shrink-0 text-[#ff7a1a]" weight="fill" />
        <span>{S.cetteSemaine >= S.objectif
          ? <><b>Objectif de la semaine atteint</b>{S.semaines > 1 ? ` · ${S.semaines} semaines d'affilée` : ""}</>
          : <><b>{S.cetteSemaine} séance{S.cetteSemaine > 1 ? "s" : ""} sur {S.objectif}</b> cette semaine</>}</span>
      </div>
    </div>
  );
}
