"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowsClockwiseIcon, CaretLeftIcon, WarningIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { EnTete } from "@/components/repere/en-tete";
import { confirmer, dire } from "@/components/repere/confirmer";
import { ACC } from "@/lib/data/referentiels";
import { groupes } from "@/lib/logic/core";
import { choixDef, recap, txtRefus, volReel } from "@/lib/logic/questionnaire";
import { genererCycle } from "@/lib/generer";
import { useRepere } from "@/lib/store";
import { ARRIERE, AVANT } from "@/lib/nav";
import { cn } from "@/lib/utils";

export default function PageSynthese() {
  const router = useRouter();
  const { etat, muter } = useRepere();
  const [enCours, setEnCours] = useState(false);
  const P = etat.PLAN, gen = !!P?.plan;
  const titre = (gen && P!.plan!.titre) || "Ton plan";
  const intro = (gen && P!.plan!.intro) || "Voici ce que j'ai retenu de tes réponses et la façon dont le cycle est construit. Rien ici ne prétend connaître ton passé : tout vient de ce que tu viens de déclarer.";
  const choix: [string, string][] = gen && P!.plan!.choix?.length ? P!.plan!.choix!.map((c) => [c.titre, c.texte]) : choixDef(etat);
  const vol = volReel(etat), max = Math.max(1, ...Object.values(vol));

  const basculeAcc = (i: number) =>
    muter((E) => {
      const aucun = ACC.length, s = (E.A.acc || []).filter((x) => x !== aucun), j = s.indexOf(i);
      if (j < 0) s.push(i); else s.splice(j, 1);
      E.A.acc = s.length ? s.sort() : [aucun];
    });

  const regen = async () => {
    if (!(await confirmer({ titre: "Régénérer ton cycle ?", texte: "Tes séances déjà validées seront conservées.", ok: "Régénérer" }))) return;
    setEnCours(true);
    const r = await genererCycle(etat.A, true, () => {});
    setEnCours(false);
    if (r.erreur) { dire("Génération impossible", r.erreur); return; }
    muter((E) => { E.PLAN = r.plan; E.FINI = true; });
    if (r.avertissement) dire("Cycle incomplet", r.avertissement);
  };

  return (
    <>
      <EnTete
        surtitre="Ce qu'on va faire"
        titre={titre}
        gauche={<Button variant="ghost" size="sm" className="-ml-2 text-[15px]" onClick={() => router.push("/plan", ARRIERE)}><CaretLeftIcon className="size-5" />Mon plan</Button>}
      >
        <p className="mt-2 text-[15px] leading-relaxed text-muted-foreground">{intro}</p>
      </EnTete>

      <div className="flex flex-col gap-6 px-4 pb-6">
        <section className="overflow-hidden rounded-[22px] bg-card">
          <h2 className="eyebrow px-4 pt-4 pb-2">Ce que j&apos;ai retenu</h2>
          {recap(etat).map(([k, v]) => (
            <div key={k} className="flex items-baseline justify-between gap-4 border-t border-border/60 px-4 py-2.5 text-[14px]">
              <span className="text-muted-foreground">{k}</span>
              <span className="text-right font-medium">{v}</span>
            </div>
          ))}
        </section>

        <section>
          <h2 className="eyebrow mb-2 px-1">Matériel en plus</h2>
          <div className="flex gap-1.5">
            {ACC.map(([, n], i) => {
              const on = (etat.A.acc || []).includes(i);
              return (
                <button key={n} onClick={() => basculeAcc(i)} aria-pressed={on} className={cn("h-9 rounded-full border px-3.5 text-[13.5px] font-medium", on ? "border-foreground bg-foreground text-background" : "border-border bg-card")}>
                  + {n}
                </button>
              );
            })}
          </div>
          <p className="mt-2 px-1 text-[12.5px] text-muted-foreground">Pris en compte tout de suite par les alternatives et l&apos;exploration, et par l&apos;IA à la prochaine régénération.</p>
        </section>

        {gen && P?.notes?.refus?.length ? (
          <div className="flex gap-3 rounded-[20px] bg-plate-soft p-4 text-[13.5px] leading-relaxed">
            <WarningIcon className="mt-0.5 size-4 shrink-0 text-plate-ink" />
            {txtRefus(P.notes.refus)}
          </div>
        ) : null}

        <section className="rounded-[22px] bg-card p-4">
          <div className="mb-3 flex items-baseline justify-between">
            <h2 className="eyebrow">Séries par semaine</h2>
            <span className="text-[11.5px] text-muted-foreground">hors séance bonus</span>
          </div>
          <div className="flex flex-col gap-2.5">
            {groupes(etat.A).map((g) => {
              const v = vol[g] ?? 0, off = (etat.A.exclus || []).includes(g);
              return (
                <div key={g}>
                  <div className="mb-1 flex items-baseline justify-between text-[13.5px]">
                    <span className={cn("font-medium", off && "text-muted-foreground")}>{g}</span>
                    <span className="num text-[16px] font-bold">{off ? <span className="font-sans text-[12.5px] font-medium text-muted-foreground">écarté</span> : v}</span>
                  </div>
                  <div className="flex gap-[3px]">
                    {Array.from({ length: max }, (_, i) => (
                      <span key={i} className={cn("h-2 flex-1 rounded-[2px]", i < v ? "bg-foreground" : "bg-muted")} />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
          <p className="mt-3 text-[11.5px] text-muted-foreground">Calculé sur les séances de ton cycle, pas estimé.</p>
        </section>

        <section>
          <h2 className="eyebrow mb-2 px-1">Trois choix que j&apos;ai faits</h2>
          <div className="flex flex-col gap-2">
            {choix.map(([t, x], i) => (
              <div key={i} className="flex gap-3.5 rounded-[20px] bg-card p-4">
                <span className={cn("num grid size-9 shrink-0 place-items-center rounded-[10px] text-[17px] font-bold", i === 0 ? "bg-plate text-plate-foreground" : "bg-foreground text-background")}>{String(i + 1).padStart(2, "0")}</span>
                <div>
                  <h3 className="text-[15.5px] font-semibold">{t}</h3>
                  <p className="mt-1 text-[14px] leading-relaxed text-muted-foreground">{x}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <div className="flex flex-col gap-2">
          <Button variant="plate" size="xl" onClick={() => router.push("/plan", ARRIERE)}>Voir mes séances</Button>
          <Button variant="soft" size="lg" className="rounded-xl" disabled={enCours} onClick={regen}>
            <ArrowsClockwiseIcon className={cn(enCours && "animate-spin")} />{enCours ? "Génération en cours…" : "Régénérer mon cycle avec les mêmes réponses"}
          </Button>
          <Button variant="ghost" onClick={() => router.push("/questionnaire", AVANT)}>Modifier mes réponses</Button>
        </div>
      </div>
    </>
  );
}
