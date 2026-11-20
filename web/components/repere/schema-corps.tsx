"use client";

import { tr } from "@/lib/i18n";
import { useState } from "react";
import { CORPS, CORPS_F, CORPS_VB, CORPS_VB_F } from "@/lib/data/corps";
import { useRepere } from "@/lib/store";
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
  /* Intensité de 0 à 1 par région (carte du volume) ; une région choisie reste en plein. */
  teinte?: (r: { z?: string; p?: string }) => number;
}) {
  const [cote, setCote] = useState<"front" | "back">("front");
  /* silhouette féminine si l'utilisatrice l'a choisie (Profil), sinon masculine : mêmes zones */
  const sexe = useRepere((s) => s.etat.A.sexe);
  const femme = sexe === 1;
  const regions = (femme ? CORPS_F : CORPS)[cote];
  /* jamais choisi : on demande avant d'afficher un corps qui ne serait peut-être pas le bon */
  if (sexe == null) return <ChoixSilhouette />;
  return (
    <div className="rounded-[24px] border border-border/80 bg-card p-3">
      <Segmente
        label={tr("Côté du corps")}
        valeur={cote}
        onChange={setCote}
        options={[{ v: "front", n: tr("De face") }, { v: "back", n: tr("De dos") }]}
      />
      <svg viewBox={(femme ? CORPS_VB_F : CORPS_VB)[cote]} data-silhouette={femme ? "femme" : "homme"} className="mx-auto mt-2 block max-h-[58vh] w-full touch-manipulation" role="img" aria-label={tr("Schéma du corps")}>
        {regions.map((r) => {
          const on = actif(r), sel = on && choisi(r), t = teinte?.(r) ?? 0;
          return (
            <path
              key={r.i}
              d={r.d}
              style={teinte && t > 0 && !sel ? { fill: `color-mix(in oklab, var(--feu) ${Math.round(25 + t * 75)}%, transparent)` } : undefined}
              className={cn(
                "stroke-card transition-[fill] duration-200 [stroke-linejoin:round] [stroke-width:1.5px] [vector-effect:non-scaling-stroke]",
                sel ? "animate-[muscle_.45s_ease-out] fill-feu" : on ? "fill-foreground/35" : "fill-foreground/10",
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
      {/* l'auteur du schéma est cité dans les crédits (Profil › Crédits, lib/medias.ts) */}
      {legende && <p className="mt-1 text-center text-[11px] text-muted-foreground">{legende}</p>}
    </div>
  );
}

/* Le corps à afficher, demandé une fois (il remplit Profil › Sexe) : un corps d'homme par défaut
   n'aurait pas de sens pour une femme. La raison est donnée, et on sait où le changer. */
export function ChoixSilhouette() {
  const muter = useRepere((s) => s.muter);
  const choisir = (v: 0 | 1) => muter((E) => { E.A.sexe = v; });
  return (
    <div className="rounded-[24px] border border-border/80 bg-card p-4">
      <h3 className="text-[17px] leading-snug font-bold">{tr("Sur quel corps afficher tes muscles ?")}</h3>
      <p className="mt-1 text-[13px] leading-snug text-muted-foreground">{tr("Les muscles ne se dessinent pas pareil sur une silhouette de femme et d'homme. Ton choix sert aussi au calcul de ta dépense d'énergie et de tes portions dans Repas.")}</p>
      <div className="mt-3 grid grid-cols-2 gap-2">
        {([[1, tr("Femme")], [0, tr("Homme")]] as const).map(([v, n]) => (
          <button key={v} onClick={() => choisir(v)} className="h-14 rounded-[16px] border-2 border-border bg-background text-[15.5px] font-bold active:scale-[.98] active:border-plate">{n}</button>
        ))}
      </div>
      <p className="mt-2 text-center text-[12px] text-muted-foreground">{tr("Modifiable à tout moment dans Profil › Sexe.")}</p>
    </div>
  );
}
