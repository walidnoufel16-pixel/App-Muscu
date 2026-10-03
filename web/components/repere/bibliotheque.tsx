"use client";

import { useMemo } from "react";
import { MagnifyingGlassIcon } from "@phosphor-icons/react";
import { Input } from "@/components/ui/input";
import { SchemaCorps } from "./schema-corps";
import { LigneExercice } from "./ligne-exercice";
import { EX } from "@/lib/data/exercices";
import { PAT2GRP, PATN, ZONES } from "@/lib/data/referentiels";
import { exoFiltre, nomPat } from "@/lib/logic/core";
import { exosDe, exosZone, patsZone, sansAccent } from "@/lib/logic/assistant";
import { cn } from "@/lib/utils";

/* Bibliothèque par le corps : un toucher choisit un muscle, la pastille « Tout » élargit au groupe. */
export function Bibliotheque({
  sel, zone, setZone, pris, onAjouter, onFiche,
}: {
  sel: string[]; zone: { z: string; p: string | null } | null; setZone: (z: { z: string; p: string | null } | null) => void;
  pris?: (o: string) => boolean; onAjouter?: (o: string) => void; onFiche: (o: string) => void;
}) {
  const l = zone ? (zone.p ? exosDe(zone.p, sel) : exosZone(zone.z, sel)) : [];
  const pats = zone ? patsZone(zone.z, sel) : [];
  return (
    <div className="flex flex-col gap-3">
      <SchemaCorps
        actif={(r) => !!r.z && exosZone(r.z, sel).length > 0}
        choisi={(r) => !!zone && r.z === zone.z && (!zone.p || r.p === zone.p)}
        onToucher={(r) => {
          const cible = r.p && exosDe(r.p, sel).length ? r.p : null;
          if (zone && zone.z === r.z && zone.p === cible) setZone(null);
          else setZone({ z: r.z!, p: cible });
        }}
        legende="Touche une zone"
      />
      {zone ? (
        <div>
          <div className="mb-2 flex items-baseline justify-between px-1">
            <h3 className="text-[19px] font-bold">{zone.p ? PATN[zone.p] || nomPat(zone.p) : ZONES[zone.z]}</h3>
            <span className="text-[12.5px] text-muted-foreground">{l.length} exercice{l.length > 1 ? "s" : ""}</span>
          </div>
          {pats.length > 1 && (
            <div className="no-scrollbar -mx-4 mb-2 flex gap-1.5 overflow-x-auto px-4">
              <button onClick={() => setZone({ z: zone.z, p: null })} className={cn("h-8 shrink-0 rounded-full border px-3 text-[13px] font-medium", !zone.p ? "border-foreground bg-foreground text-background" : "border-border bg-card")}>
                Tout
              </button>
              {pats.map((p) => (
                <button key={p} onClick={() => setZone({ z: zone.z, p })} className={cn("h-8 shrink-0 rounded-full border px-3 text-[13px] font-medium", zone.p === p ? "border-foreground bg-foreground text-background" : "border-border bg-card")}>
                  {nomPat(p)}
                </button>
              ))}
            </div>
          )}
          <div className="flex flex-col gap-1.5">
            {l.map((o) => <LigneExercice key={o} id={o} pris={pris?.(o)} onOuvrir={() => onFiche(o)} onAjouter={onAjouter ? () => onAjouter(o) : undefined} />)}
          </div>
        </div>
      ) : (
        <p className="text-center text-[13.5px] text-muted-foreground">Touche une partie du corps pour voir les exercices.</p>
      )}
    </div>
  );
}

export function ListeRecherche({ sel, q, setQ, pris, onAjouter, onFiche }: { sel: string[]; q: string; setQ: (s: string) => void; pris?: (o: string) => boolean; onAjouter?: (o: string) => void; onFiche: (o: string) => void }) {
  const groupes = useMemo(() => {
    const f = sansAccent(q.trim()), g: Record<string, string[]> = {};
    Object.keys(EX).filter((o) => exoFiltre(o, sel)).forEach((o) => {
      if (f && !sansAccent(EX[o].n + " " + EX[o].m).split(/[^a-z0-9]+/).some((m) => m.startsWith(f))) return;
      const k = PAT2GRP[EX[o].pat] || "Cardio et mobilité";
      (g[k] = g[k] || []).push(o);
    });
    return g;
  }, [q, sel]);
  return (
    <div className="flex flex-col gap-3">
      <div className="relative">
        <MagnifyingGlassIcon className="absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Rechercher un exercice…" className="h-11 rounded-2xl bg-card pl-10 text-[15px]" />
      </div>
      {Object.keys(groupes).length ? Object.entries(groupes).map(([g, l]) => (
        <div key={g}>
          <div className="eyebrow mb-1.5 px-1">{g}</div>
          <div className="flex flex-col gap-1.5">
            {l.map((o) => <LigneExercice key={o} id={o} pris={pris?.(o)} onOuvrir={() => onFiche(o)} onAjouter={onAjouter ? () => onAjouter(o) : undefined} />)}
          </div>
        </div>
      )) : <p className="text-center text-[13.5px] text-muted-foreground">Aucun exercice ne commence par ça.</p>}
    </div>
  );
}
