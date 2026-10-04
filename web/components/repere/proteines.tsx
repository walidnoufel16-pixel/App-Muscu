"use client";

/* Protéines du jour : un anneau, et une feuille pour ajouter en un geste. */
import { useState } from "react";
import { CaretRightIcon, EggIcon, MinusIcon, PlusIcon } from "@phosphor-icons/react";
import { Drawer, DrawerContent, DrawerDescription, DrawerTitle } from "@/components/ui/drawer";
import { ajouterProt, ALIMENTS, objectifProteines, poidsDe, protDuJour } from "@/lib/logic/nutrition";
import { jourDe } from "@/lib/logic/historique";
import { useRepere } from "@/lib/store";
import { tactile } from "@/lib/repos";
import { cn } from "@/lib/utils";

export function CarteProteines({ accueil = false }: { accueil?: boolean }) {
  const A = useRepere((s) => s.etat.A);
  const muter = useRepere((s) => s.muter);
  const [auj] = useState(() => jourDe(Date.now()));
  const [ouvert, setOuvert] = useState(false);
  if (accueil && A.protOff) return null;
  const obj = objectifProteines(A), g = protDuJour(A, auj), p = Math.min(1, g / obj);
  const ajouter = (n: number) => { tactile(n > 0 ? 8 : 5); muter((E) => ajouterProt(E.A, auj, n)); };
  return (
    <>
      <button onClick={() => setOuvert(true)} className="flex w-full items-center gap-3 rounded-[20px] border border-border/80 bg-card p-3.5 text-left active:bg-muted">
        <span className="relative grid size-12 shrink-0 place-items-center rounded-full" style={{ background: `conic-gradient(var(--success) ${p * 360}deg, var(--muted) 0)` }}>
          <span className="grid size-[38px] place-items-center rounded-full bg-card"><EggIcon className="size-5 text-success" weight="fill" /></span>
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-[16px] leading-tight font-semibold">
            <span className="num text-[19px]">{g}</span><span className="text-muted-foreground"> / {obj} g</span> de protéines
          </span>
          <span className="block text-[12.5px] text-muted-foreground">{g >= obj ? "Objectif du jour atteint" : "Touche pour ajouter un repas"}</span>
        </span>
        <CaretRightIcon className="size-4 shrink-0 text-muted-foreground" />
      </button>
      <Drawer open={ouvert} onOpenChange={setOuvert}>
        <DrawerContent>
          <div className="max-h-[80vh] overflow-y-auto px-5 pt-2 pb-[max(env(safe-area-inset-bottom),20px)]">
            <DrawerTitle className="text-[20px] font-bold">Protéines aujourd&apos;hui</DrawerTitle>
            <DrawerDescription className="mt-0.5 text-[13px] text-muted-foreground">
              {poidsDe(A) ? `Objectif calculé sur ton poids (${poidsDe(A)} kg) et ton objectif.` : "Note ton poids dans Progrès pour un objectif sur mesure."} Pas de calories à compter.
            </DrawerDescription>
            <div className="mt-4 flex items-center justify-center gap-4">
              <button aria-label="Retirer 10 g" onClick={() => ajouter(-10)} disabled={!g} className="grid size-11 place-items-center rounded-full bg-muted disabled:opacity-40"><MinusIcon className="size-5" weight="bold" /></button>
              <span className="text-center">
                <span className="num block text-[44px] leading-none font-bold">{g}<span className="text-[20px] text-muted-foreground"> g</span></span>
                <span className="text-[12.5px] text-muted-foreground">sur {obj} g</span>
              </span>
              <button aria-label="Ajouter 10 g" onClick={() => ajouter(10)} className="grid size-11 place-items-center rounded-full bg-success text-white"><PlusIcon className="size-5" weight="bold" /></button>
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-success transition-[width] duration-300" style={{ width: p * 100 + "%" }} /></div>
            <h3 className="eyebrow mt-5 mb-2">Ajouter un aliment</h3>
            <div className="grid grid-cols-2 gap-1.5">
              {ALIMENTS.map((a) => (
                <button key={a.n} onClick={() => ajouter(a.g)} className="flex items-center justify-between gap-2 rounded-2xl border bg-card px-3 py-2.5 text-left active:scale-[.98]">
                  <span className="min-w-0">
                    <span className="block truncate text-[13.5px] font-medium">{a.n}</span>
                    <span className="block text-[11.5px] text-muted-foreground">{a.q}</span>
                  </span>
                  <span className="num shrink-0 text-[15px] font-bold text-success">+{a.g}</span>
                </button>
              ))}
            </div>
            <div className="mt-4 flex items-center justify-between gap-3 rounded-2xl bg-muted/60 px-3.5 py-2.5">
              <span className="text-[13.5px]">Objectif par jour</span>
              <span className="flex items-center gap-1">
                <button aria-label="Objectif : moins" onClick={() => muter((E) => { E.A.protObj = Math.max(40, obj - 5); })} className="grid size-8 place-items-center rounded-full bg-card"><MinusIcon className="size-3.5" weight="bold" /></button>
                <span className="num w-14 text-center text-[16px] font-bold">{obj} g</span>
                <button aria-label="Objectif : plus" onClick={() => muter((E) => { E.A.protObj = Math.min(300, obj + 5); })} className="grid size-8 place-items-center rounded-full bg-card"><PlusIcon className="size-3.5" weight="bold" /></button>
              </span>
            </div>
            <label className="mt-2 flex items-center justify-between gap-3 px-1 py-2 text-[13.5px]">
              Afficher sur l&apos;écran Entraînement
              <input type="checkbox" checked={!A.protOff} onChange={(e) => muter((E) => { E.A.protOff = !e.target.checked; })} className={cn("size-5 accent-[var(--plate)]")} />
            </label>
          </div>
        </DrawerContent>
      </Drawer>
    </>
  );
}
