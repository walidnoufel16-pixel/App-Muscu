"use client";

import { tr } from "@/lib/i18n";
import { TYPES } from "@/lib/data/referentiels";
import { useState } from "react";
import { HandPointingIcon } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import { LienSalle } from "./ma-salle";

/* Matériel disponible : rien de coché au départ, chaque type se coche indépendamment
   (« Mon matériel déclaré » remet celui du Profil en un geste). */
/* `types` : les seuls matériels proposés (street workout), tous par défaut. */
export function FiltreMateriel({ sel, onChange, declare, types }: { sel: string[]; onChange: (s: string[]) => void; declare: string[]; types?: string[] }) {
  const trie = (l: string[]) => l.slice().sort().join();
  const perso = trie(sel) !== trie(declare);
  return (
    <div>
      <div className="mb-2 flex items-baseline justify-between">
        <span className="eyebrow">{tr("Matériel disponible")}</span>
        {perso && (
          <button onClick={() => onChange(declare)} className="text-[12.5px] font-medium text-muted-foreground hover:text-foreground">
            {tr("Mon matériel déclaré")}
          </button>
        )}
      </div>
      <div className="flex flex-wrap gap-1.5">
        {TYPES.filter(([t]) => !types || types.includes(t)).map(([t, n]) => {
          const on = sel.includes(t);
          return (
            <button
              key={t}
              aria-pressed={on}
              onClick={() => onChange(on ? sel.filter((x) => x !== t) : [...sel, t])}
              className={cn(
                "h-9 rounded-full border px-3.5 text-[13.5px] font-medium transition-colors",
                on ? "border-foreground bg-foreground text-background" : "border-border bg-card text-muted-foreground",
              )}
            >
              {n}
            </button>
          );
        })}
      </div>
      {/* machines ou barre cochées : on précise ce que la salle propose */}
      {(sel.includes("m0") || sel.includes("m1")) && <LienSalle className="mt-2" types={["m0", "m1"].filter((t) => sel.includes(t))} />}
      {!sel.some((t) => !t.startsWith("x:")) && (
        <p role="status" className="mt-2.5 flex animate-[eclat_1.1s_ease-out_2] items-center gap-2 rounded-2xl bg-plate-soft px-3.5 py-3 text-[14px] font-semibold text-plate-ink">
          <HandPointingIcon className="size-5 shrink-0 -rotate-12" weight="fill" />{tr("Sélectionne au moins un matériel pour voir des exercices.")}
        </p>
      )}
    </div>
  );
}

/* Le matériel retenu en une ligne, et « Modifier » pour le changer sur place (composeur, Remplacer). */
export function MaterielRepliable({ sel, onChange, declare, className }: { sel: string[]; onChange: (s: string[]) => void; declare: string[]; className?: string }) {
  const [ouvert, setOuvert] = useState(false);
  const noms = TYPES.filter(([t]) => sel.includes(t)).map(([, n]) => n);
  return (
    <div className={className}>
      {ouvert ? (
        <>
          <FiltreMateriel sel={sel} onChange={onChange} declare={declare} />
          <button onClick={() => setOuvert(false)} className="mt-2 text-[13px] font-semibold text-plate-ink">{tr("Fermer")}</button>
        </>
      ) : (
        <button onClick={() => setOuvert(true)} className="flex w-full items-center gap-3 rounded-2xl border border-border bg-card px-3.5 py-2.5 text-left">
          <span className="min-w-0 flex-1">
            <span className="eyebrow block">{tr("Matériel disponible")}</span>
            <span className="block truncate text-[13.5px] text-muted-foreground">{noms.length ? noms.join(", ") : tr("Aucun matériel coché")}</span>
          </span>
          <span className="text-[13px] font-semibold text-plate-ink">{tr("Modifier")}</span>
        </button>
      )}
    </div>
  );
}
