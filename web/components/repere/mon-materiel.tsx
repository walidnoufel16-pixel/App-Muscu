"use client";

import { tr } from "@/lib/i18n";
import { ACC, MATN } from "@/lib/data/referentiels";
import { barreDeclaree } from "@/lib/logic/core";
import { useRepere } from "@/lib/store";
import { cn } from "@/lib/utils";
import { LienSalle } from "./ma-salle";

/* Profil › Mon matériel : ce que tu as sous la main, utilisé par défaut dans
   Exercices, « Créer une séance pour moi » et le composeur. */
export function MonMateriel() {
  const A = useRepere((s) => s.etat.A);
  const muter = useRepere((s) => s.muter);
  const mat = A.materiel ?? 0;
  const puce = (on: boolean) => cn("h-9 rounded-full border px-3.5 text-[13.5px] font-medium transition-colors", on ? "border-foreground bg-foreground text-background" : "border-border bg-card text-muted-foreground");
  return (
    <div className="flex flex-col gap-3 rounded-[22px] bg-card p-4">
      <div>
        <div className="mb-2 text-[14.5px] text-muted-foreground">{tr("Où tu t'entraînes")}</div>
        <div role="radiogroup" aria-label={tr("Où tu t'entraînes")} className="flex flex-wrap gap-1.5">
          {MATN.map((n, i) => (
            <button key={i} role="radio" aria-checked={mat === i} onClick={() => muter((E) => { E.A.materiel = i; })} className={puce(mat === i)}>{tr(n)}</button>
          ))}
        </div>
      </div>
      <div>
        <div className="mb-2 text-[14.5px] text-muted-foreground">{tr("En plus")}</div>
        <div className="flex flex-wrap gap-1.5">
          <button aria-pressed={barreDeclaree(A)} onClick={() => muter((E) => { E.A.barre = !barreDeclaree(E.A); })} className={puce(barreDeclaree(A))}>{tr("Barre de traction")}</button>
          {ACC.map(([k, n], i) => {
            const on = (A.acc || []).includes(i);
            return (
              <button key={k} aria-pressed={on} onClick={() => muter((E) => { const l = E.A.acc || []; E.A.acc = on ? l.filter((x) => x !== i) : [...l, i]; })} className={puce(on)}>{n}</button>
            );
          })}
        </div>
      </div>
      {mat <= 1 && <LienSalle className="bg-muted/60" types={mat === 0 ? ["m0", "m1"] : ["m1"]} />}
    </div>
  );
}
