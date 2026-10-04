"use client";

import { useState } from "react";
import { CORPS, CORPS_VB } from "@/lib/data/corps";
import { Segmente } from "./segmente";
import { cn } from "@/lib/utils";

/* Schéma anatomique — tracés react-native-body-highlighter (Hicham Elabbassi), licence MIT.
   `actif(r)` dit si une région est touchable, `choisi(r)` si elle est surlignée. */
export function SchemaCorps({
  actif, choisi, onToucher, legende, teinte,
}: {
  actif: (r: { z?: string; p?: string }) => boolean;
  choisi: (r: { z?: string; p?: string }) => boolean;
  onToucher: (r: { z?: string; p?: string; n?: string }) => void;
  legende?: string;
  /* Intensité de 0 à 1 par région (carte du volume) ; remplace `choisi`. */
  teinte?: (r: { z?: string; p?: string }) => number;
}) {
  const [cote, setCote] = useState<"front" | "back">("front");
  const regions = CORPS[cote];
  return (
    <div className="rounded-[24px] border border-border/80 bg-card p-3">
      <Segmente
        label="Côté du corps"
        valeur={cote}
        onChange={setCote}
        options={[{ v: "front", n: "De face" }, { v: "back", n: "De dos" }]}
      />
      <svg viewBox={CORPS_VB[cote]} className="mx-auto mt-2 block max-h-[58vh] w-full touch-manipulation" role="img" aria-label="Schéma du corps">
        {regions.map((r) => {
          const on = actif(r), sel = on && choisi(r), t = teinte?.(r) ?? 0;
          return (
            <path
              key={r.i}
              d={r.d}
              style={teinte && t > 0 ? { fill: `color-mix(in oklab, var(--plate) ${Math.round(25 + t * 75)}%, transparent)` } : undefined}
              className={cn(
                "stroke-card transition-[fill] duration-200 [stroke-linejoin:round] [stroke-width:1.5px] [vector-effect:non-scaling-stroke]",
                sel ? "animate-[muscle_.45s_ease-out] fill-plate" : on ? "fill-foreground/35" : "fill-foreground/10",
              )}
            />
          );
        })}
        {/* tracés transparents élargis : cible tactile plus grande sans changer le dessin */}
        {regions.filter((r) => actif(r)).map((r) => (
          <path
            key={r.i + "-hit"}
            d={r.d}
            onClick={() => onToucher(r)}
            className="cursor-pointer fill-transparent stroke-transparent [stroke-width:12px] [vector-effect:non-scaling-stroke]"
          >
            {r.n && <title>{r.n}</title>}
          </path>
        ))}
      </svg>
      <p className="mt-1 text-center text-[10.5px] text-muted-foreground">{legende ? legende + " · " : ""}Schéma : body-highlighter, Hicham Elabbassi — MIT</p>
    </div>
  );
}
