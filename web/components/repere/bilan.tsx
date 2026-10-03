"use client";

import { useCallback } from "react";
import { TrophyIcon } from "@phosphor-icons/react";
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
            <Button variant="plate" size="xl" className="mt-6 w-full" onClick={fermer}>Terminer</Button>
          </div>
        )}
      </DrawerContent>
    </Drawer>
  );
}
