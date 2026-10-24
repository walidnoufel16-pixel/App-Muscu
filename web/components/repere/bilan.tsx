"use client";

import { loc, pluriel, tr } from "@/lib/i18n";
import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { ChartLineUpIcon, FlameIcon, TrophyIcon } from "@phosphor-icons/react";
import { ajouterAuSuivi } from "@/lib/suivi";
import { tactile } from "@/lib/repos";
import { useRepere } from "@/lib/store";
import { jourDe } from "@/lib/logic/historique";
import { objectifHebdo, serie } from "@/lib/logic/motivation";
import { avecSorties } from "@/lib/logic/course";
import { Button } from "@/components/ui/button";
import { Drawer, DrawerContent, DrawerDescription, DrawerTitle } from "@/components/ui/drawer";
import { mouvementReduit, useCelebrer } from "@/lib/celebrer";
import { cn } from "@/lib/utils";

/* Chiffre qui monte de 0 à sa valeur, sans re-rendu React (on écrit directement dans le nœud). */
function Compteur({ valeur, delai = 0 }: { valeur: number; delai?: number }) {
  const fmt = (v: number) => Math.round(v).toLocaleString(loc());
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
  const router = useRouter();
  /* séance libre : on la range dans le suivi, elle repart vierge */
  const libre = bilan?.s?.startsWith("L|") ? +bilan.s.slice(2) : null;
  const suivre = () => { tactile(12); ajouterAuSuivi(libre!); fermer(); router.push("/progres"); };
  const stats = !bilan ? [] : bilan.cases ? bilan.cases : [
        { n: tr("exercices"), v: bilan.exercices },
        { n: tr("séries validées"), v: bilan.series },
        ...(bilan.minutes != null ? [{ n: tr("minutes"), v: bilan.minutes }] : []),
        { n: tr(pluriel(bilan.records) ? "records battus" : "record battu"), v: bilan.records, accent: bilan.records > 0 },
      ];
  return (
    <Drawer open={!!bilan} onOpenChange={(o) => !o && fermer()}>
      <DrawerContent>
        {bilan && (
          <div className="px-5 pt-3 pb-[max(env(safe-area-inset-bottom),20px)] text-center">
            <div className="mx-auto grid size-20 animate-[medaille_.8s_cubic-bezier(.3,1.5,.5,1)_both] place-items-center rounded-full bg-plate text-plate-foreground shadow-[0_12px_40px_-10px_var(--plate)]">
              <TrophyIcon className="size-10" weight="fill" />
            </div>
            <div className="eyebrow mt-5 animate-[monter_.5s_.15s_ease-out_both]">{tr("Séance terminée")}</div>
            <DrawerTitle className="mt-1 animate-[monter_.5s_.22s_ease-out_both] text-[26px] leading-tight font-bold tracking-[-0.02em]">{bilan.titre}</DrawerTitle>
            <DrawerDescription className="sr-only">{tr("Bilan de la séance")}</DrawerDescription>
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
            <Suite />
            {libre != null ? (
              <>
                <Button variant="plate" size="xl" className="mt-6 w-full" onClick={suivre}><ChartLineUpIcon weight="bold" />{tr("Ajouter à mon suivi")}</Button>
                <p className="mt-2 text-[12.5px] text-muted-foreground">{tr("Elle s'enregistre dans Progrès et repart à zéro pour la prochaine fois.")}</p>
                <button onClick={fermer} className="mt-2 w-full py-2 text-[14px] font-medium text-muted-foreground">{tr("Plus tard")}</button>
              </>
            ) : <Button variant="plate" size="xl" className="mt-6 w-full" onClick={fermer}>{tr("Terminer")}</Button>}
          </div>
        )}
      </DrawerContent>
    </Drawer>
  );
}

/* Sous le bilan : la semaine en cours. */
function Suite() {
  const etat = useRepere((x) => x.etat);
  const [auj] = useState(() => jourDe(Date.now()));
  const H = etat.HIST || [];
  const S = serie(H, avecSorties(etat.CARDIO, etat.SORTIES), objectifHebdo(etat.A), auj);
  return (
    <div className="mt-3 flex flex-col gap-1.5 text-left">
      <div className="flex animate-[monter_.5s_.78s_ease-out_both] items-center gap-2.5 rounded-2xl bg-muted/60 px-3.5 py-2.5 text-[13.5px]">
        <FlameIcon className="size-4 shrink-0 text-[#ff7a1a]" weight="fill" />
        <span>{S.cetteSemaine >= S.objectif
          ? <><b>{tr("Objectif de la semaine atteint")}</b>{S.semaines > 1 ? tr(" · {semaines} semaines d'affilée", { semaines: S.semaines }) : ""}</>
          : <><b>{tr("{cetteSemaine} séance{a} sur {objectif}", { cetteSemaine: S.cetteSemaine, a: pluriel(S.cetteSemaine) ? "s" : "", objectif: S.objectif })}</b>{" "}{tr("cette semaine")}</>}</span>
      </div>
    </div>
  );
}
