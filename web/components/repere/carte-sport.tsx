"use client";

import { SPORTS } from "@/lib/data/referentiels";
import { aTrait, freqDe, maxTrait, sportsChoisis, sportsInfo, sportsTotal } from "@/lib/logic/core";
import { useRepere } from "@/lib/store";

/* Ton sport : ce n'est pas une séance, c'est une charge dont le cycle tient compte. */
export function CarteSport() {
  const A = useRepere((s) => s.etat.A);
  const L = sportsInfo(A), li: string[] = [], j = maxTrait(A, "jambes"), tot = sportsTotal(A);
  if (aTrait(A, "muscu")) li.push("Une de tes pratiques contient déjà de la musculation : le volume du socle est réduit pour ne pas compter deux fois le même travail.");
  if (j >= 2 || tot >= 4) li.push("Le volume hebdomadaire des jambes est calculé à 12 séries au lieu de 15.");
  else if (j) li.push("Le volume des jambes est légèrement réduit.");
  if (aTrait(A, "tirage")) li.push("Le volume de dos et de biceps est allégé : l'escalade les sollicite déjà lourdement.");
  if (aTrait(A, "epaules")) li.push("Le travail d'arrière d'épaule et de rotateurs est renforcé, parce que tes pratiques tirent beaucoup sur l'avant.");
  if (aTrait(A, "cardio")) li.push("L'axe cardio a été écarté du bonus : tes pratiques couvrent déjà le souffle.");
  if (aTrait(A, "leger") && L.length === 1) li.push("Ta pratique coûte peu en récupération : le programme n'a rien retiré, et l'axe mobilité y ferait doublon.");
  if (j) li.push("Le travail lombaire est renforcé, souvent sollicité par tes pratiques sans jamais y être renforcé.");
  if (tot >= 4) li.push("Avec " + tot + " séances extérieures par semaine, la récupération devient ton facteur limitant avant le volume.");
  return (
    <div className="px-4">
      <div className="rounded-[24px] bg-foreground p-5 text-background">
        <div className="eyebrow !text-background/60">Hors musculation</div>
        <h2 className="mt-1 text-[24px] leading-tight font-bold">{L.map((s) => s.n).join(" · ")}</h2>
        <p className="mt-2 text-[14px] leading-relaxed text-background/75">
          Ce ne sont pas des séances que l&apos;app te donne, ce sont des charges dont elle tient compte. Tu as déclaré {tot} séance{tot > 1 ? "s" : ""} par semaine en dehors de la musculation.
        </p>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {sportsChoisis(A).map((i) => (
            <span key={i} className="rounded-full bg-background/12 px-3 py-1 text-[13px]">{SPORTS[i].n} · {freqDe(A, i) + 1}× / sem.</span>
          ))}
        </div>
      </div>
      <h3 className="eyebrow mt-5 mb-2 px-1">Ce que ça change dans ton cycle</h3>
      <ul className="flex flex-col gap-2">
        {li.map((t, i) => (
          <li key={i} className="flex gap-3 rounded-[18px] border border-border/80 bg-card p-3.5 text-[14px] leading-relaxed">
            <span className="mt-2 size-1.5 shrink-0 rounded-full bg-plate" />
            {t}
          </li>
        ))}
      </ul>
    </div>
  );
}
