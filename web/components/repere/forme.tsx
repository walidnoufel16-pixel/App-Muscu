"use client";

/* Forme du jour : trois touches avant la séance, la charge proposée suit.
   Facultatif : « Passer » la masque pour la journée. */
import { useState } from "react";
import { BatteryMediumIcon, WarningIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { PhaseDuJour } from "./cycle";
import { BLESN } from "@/lib/data/referentiels";
import { formeDuJour, NOMS_NIVEAU, niveau, nomZone, QUESTIONS_FORME, zonesActives, zonesDe, type Forme } from "@/lib/logic/forme";
import { jourDe } from "@/lib/logic/historique";
import { useRepere } from "@/lib/store";
import { tactile } from "@/lib/repos";
import { cn } from "@/lib/utils";

const ZONES = BLESN.slice(0, 4);

export function FormeDuJour({ cles }: { cles: string[] }) {
  const etat = useRepere((s) => s.etat);
  const muter = useRepere((s) => s.muter);
  const [t] = useState(() => Date.now());
  const auj = jourDe(t), f = formeDuJour(etat.A, t);
  const entamee = cles.some((k) => etat.LOG[k]?.series?.some((s) => s.ok));
  const [ouvert, setOuvert] = useState(false);
  const [rep, setRep] = useState<Partial<Forme>>(() => f || { douleur: [] });
  if (!f && (entamee || etat.A.formePassee === auj) && !ouvert) return null;

  if (f && !ouvert) {
    const n = niveau(f);
    return (
      <button onClick={() => { setRep(f); setOuvert(true); }} className="flex items-center gap-2.5 rounded-2xl border border-border/80 bg-card px-3.5 py-2.5 text-left active:bg-muted">
        <BatteryMediumIcon className={cn("size-5 shrink-0", n < 0 ? "text-amber-500" : "text-success")} weight="fill" />
        <span className="min-w-0 flex-1 text-[13.5px]">
          Forme du jour <b>{NOMS_NIVEAU[n]}</b>
          {n !== 0 && <span className="text-muted-foreground"> · charges ajustées</span>}
          {!!f.douleur?.length && <span className="text-muted-foreground"> · {f.douleur.map(nomZone).join(", ").toLowerCase()} à ménager</span>}
        </span>
        <span className="text-[12.5px] font-semibold text-plate-ink">Modifier</span>
      </button>
    );
  }

  const complet = QUESTIONS_FORME.every((q) => typeof rep[q.k] === "number");
  const valider = () => {
    if (!complet) return;
    tactile(10);
    muter((E) => { E.A.forme = { d: auj, sommeil: rep.sommeil!, energie: rep.energie!, courbatures: rep.courbatures!, douleur: rep.douleur || [] }; });
    setOuvert(false);
  };
  return (
    <div className="animate-[monter_.4s_ease-out_both] rounded-[20px] border border-border/80 bg-card p-4">
      <div className="flex items-baseline justify-between">
        <h3 className="text-[16px] font-semibold">Comment tu te sens ?</h3>
        <button onClick={() => { muter((E) => { E.A.formePassee = auj; }); setOuvert(false); }} className="text-[13px] font-medium text-muted-foreground">Passer</button>
      </div>
      <PhaseDuJour className="mt-2" />
      <p className="mt-2 text-[12.5px] leading-snug text-muted-foreground">Les charges proposées s&apos;adaptent à ta forme du jour{entamee ? " (pour les exercices pas encore commencés)" : ""}.</p>
      <div className="mt-3 flex flex-col gap-2.5">
        {QUESTIONS_FORME.map((q) => (
          <div key={q.k}>
            <div className="mb-1 text-[12.5px] font-medium text-muted-foreground">{q.q}</div>
            <div role="radiogroup" aria-label={q.q} className="grid grid-cols-3 gap-1.5">
              {q.o.map((o, i) => (
                <button key={o} role="radio" aria-checked={rep[q.k] === i} onClick={() => { tactile(5); setRep({ ...rep, [q.k]: i }); }}
                  className={cn("h-10 rounded-xl border text-[13.5px] font-medium transition-colors", rep[q.k] === i ? "border-plate bg-plate-soft text-plate-ink" : "bg-background")}>
                  {o}
                </button>
              ))}
            </div>
          </div>
        ))}
        <div>
          <div className="mb-1 text-[12.5px] font-medium text-muted-foreground">Une douleur aujourd&apos;hui ?</div>
          <div className="flex flex-wrap gap-1.5">
            {ZONES.map((z, i) => {
              const on = rep.douleur?.includes(i);
              return (
                <button key={z} aria-pressed={on} onClick={() => setRep({ ...rep, douleur: on ? rep.douleur!.filter((x) => x !== i) : [...(rep.douleur || []), i] })}
                  className={cn("rounded-full border px-3 py-1.5 text-[13px] font-medium", on ? "border-amber-500 bg-amber-500/12 text-amber-700 dark:text-amber-300" : "bg-background")}>
                  {z}
                </button>
              );
            })}
          </div>
        </div>
      </div>
      <Button variant="plate" size="lg" className="mt-4 w-full rounded-xl" disabled={!complet} onClick={valider}>C&apos;est parti</Button>
    </div>
  );
}

/* Étiquette « À ménager » sur un exercice qui sollicite une zone sensible. */
export function useZones(id: string) {
  const A = useRepere((s) => s.etat.A);
  const [t] = useState(() => Date.now());
  return zonesDe(id, zonesActives(A, t));
}
export function EtiquetteZone({ id }: { id: string }) {
  const z = useZones(id);
  if (!z.length) return null;
  return (
    <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-amber-500/14 px-2 py-0.5 text-[10.5px] font-semibold text-amber-700 dark:text-amber-300" title={"À ménager : " + z.map(nomZone).join(", ")}>
      <WarningIcon className="size-3" weight="fill" />À ménager
    </span>
  );
}
export function ConseilZone({ id }: { id: string }) {
  const z = useZones(id);
  if (!z.length) return null;
  return (
    <p className="mx-1 mb-2 flex gap-1.5 rounded-xl bg-amber-500/10 px-2.5 py-2 text-[12.5px] leading-snug">
      <WarningIcon className="mt-0.5 size-3.5 shrink-0 text-amber-600" weight="fill" />
      <span><b>{z.map(nomZone).join(", ")}</b> : charge modérée, amplitude sans douleur. Si ça tire, arrête ou remplace l&apos;exercice.</span>
    </p>
  );
}

/* Profil : modifier ses zones sensibles sans refaire le questionnaire. */
export function ReglageZones() {
  const A = useRepere((s) => s.etat.A);
  const muter = useRepere((s) => s.muter);
  const z = (A.blessure || []).filter((i) => i < 4);
  return (
    <div className="flex flex-wrap gap-1.5">
      {ZONES.map((n, i) => {
        const on = z.includes(i);
        return (
          <button key={n} aria-pressed={on} onClick={() => muter((E) => { E.A.blessure = on ? z.filter((x) => x !== i) : [...z, i].sort(); })}
            className={cn("rounded-full border px-3 py-1.5 text-[13px] font-medium", on ? "border-amber-500 bg-amber-500/12 text-amber-700 dark:text-amber-300" : "bg-background")}>
            {n}
          </button>
        );
      })}
    </div>
  );
}
