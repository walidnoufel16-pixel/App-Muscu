"use client";

/* Option cycle menstruel : réglage dans le profil, rappel de la phase dans le check-in. */
import { useEffect, useState } from "react";
import { DropIcon, LockSimpleIcon } from "@phosphor-icons/react";
import { phaseDe, useCycle } from "@/lib/cycle";
import { jourDe } from "@/lib/logic/historique";
import { cn } from "@/lib/utils";

export function useCycleCharge() {
  const charger = useCycle((s) => s.charger);
  useEffect(() => { charger(); }, [charger]);
  return useCycle((s) => s.c);
}

export function ReglageCycle() {
  const c = useCycleCharge();
  const ecrire = useCycle((s) => s.ecrire);
  const [auj] = useState(() => jourDe(Date.now()));
  const actif = !!c?.actif, p = c && actif ? phaseDe(c, auj) : null;
  return (
    <div className="overflow-hidden rounded-[22px] bg-card">
      <label className="flex items-center justify-between gap-3 px-4 py-3">
        <span>
          <span className="block text-[15px] font-medium">Adapter à mon cycle</span>
          <span className="block text-[12.5px] text-muted-foreground">Facultatif · désactivé par défaut</span>
        </span>
        <input type="checkbox" aria-label="Adapter à mon cycle" checked={actif}
          onChange={(e) => ecrire(e.target.checked ? { actif: true, debut: c?.debut || auj, duree: c?.duree || 28 } : null)}
          className="size-5 accent-[var(--plate)]" />
      </label>
      {actif && c && (
        <div className="flex flex-col gap-2 border-t border-border/60 px-4 py-3">
          <label className="flex items-center justify-between gap-3 text-[14px]">
            Début des dernières règles
            <input type="date" value={c.debut} max={auj} onChange={(e) => e.target.value && ecrire({ ...c, debut: e.target.value })}
              className="h-10 rounded-xl border bg-background px-2 text-[15px]" />
          </label>
          <label className="flex items-center justify-between gap-3 text-[14px]">
            Durée moyenne du cycle
            <select value={c.duree} onChange={(e) => ecrire({ ...c, duree: +e.target.value })} className="h-10 rounded-xl border bg-background px-2 text-[15px]">
              {Array.from({ length: 16 }, (_, i) => 21 + i).map((d) => <option key={d} value={d}>{d} jours</option>)}
            </select>
          </label>
          {p && <p className="text-[13px]"><b>Aujourd&apos;hui : {p.nom.toLowerCase()}</b> (jour {p.jour})</p>}
        </div>
      )}
      <p className="flex gap-1.5 border-t border-border/60 px-4 py-2.5 text-[12px] leading-snug text-muted-foreground">
        <LockSimpleIcon className="mt-0.5 size-3.5 shrink-0" weight="fill" />
        Ces informations restent uniquement sur ce téléphone : elles ne sont jamais envoyées ni synchronisées avec ton compte.
      </p>
    </div>
  );
}

/* Rappel discret de la phase et d'un conseil, présenté comme une option, pas une règle. */
export function PhaseDuJour({ className }: { className?: string }) {
  const c = useCycleCharge();
  const [auj] = useState(() => jourDe(Date.now()));
  const p = c?.actif ? phaseDe(c, auj) : null;
  if (!p) return null;
  return (
    <p className={cn("flex gap-2 rounded-xl bg-[#d94b8a]/10 px-3 py-2 text-[12.5px] leading-snug", className)}>
      <DropIcon className="mt-0.5 size-4 shrink-0 text-[#d94b8a]" weight="fill" />
      <span><b>{p.nom}</b> (jour {p.jour}) · {p.conseil}</span>
    </p>
  );
}
