"use client";

import { tr } from "@/lib/i18n";
import { useMemo } from "react";
import { BarbellIcon, FirstAidKitIcon, MagnifyingGlassIcon } from "@phosphor-icons/react";
import { estSoin, SOIN_DE_ZONE, type ZoneSoin } from "@/lib/data/soin";
import { Input } from "@/components/ui/input";
import { SchemaCorps } from "./schema-corps";
import { LigneExercice } from "./ligne-exercice";
import { EX } from "@/lib/data/exercices";
import { PAT2GRP, PATN, ZONES } from "@/lib/data/referentiels";
import { exoFiltre, nomPat } from "@/lib/logic/core";
import { exosDe, exosZone, patsZone, sansAccent } from "@/lib/logic/assistant";
import { cn } from "@/lib/utils";

/* Bibliothèque par le corps : sous le schéma, tous les exercices du matériel coché, par groupe ;
   un toucher réduit la liste à un muscle (la pastille « Tout » élargit au groupe), avec en
   dessous les exercices de soin & mobilité de la zone. */
export function Bibliotheque({
  sel, zone, setZone, pris, onAjouter, onFiche,
}: {
  sel: string[]; zone: { z: string; p: string | null } | null; setZone: (z: { z: string; p: string | null } | null) => void;
  pris?: (o: string) => boolean; onAjouter?: (o: string) => void; onFiche: (o: string) => void;
}) {
  /* deux catégories : musculation, puis soin & mobilité de la zone touchée */
  const l = (zone ? (zone.p ? exosDe(zone.p, sel) : exosZone(zone.z, sel)) : []).filter((o) => !estSoin(o));
  const soins = zone ? Object.keys(EX).filter((o) => estSoin(o) && (SOIN_DE_ZONE[zone.z] || []).includes(EX[o].soin as ZoneSoin) && exoFiltre(o, sel)) : [];
  const pats = zone ? patsZone(zone.z, sel).filter((p) => exosDe(p, sel).some((o) => !estSoin(o))) : [];
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
        legende={tr("Touche un muscle pour filtrer")}
      />
      {zone ? (
        <div className="flex flex-col gap-5">
          <section aria-label={tr("Musculation")}>
            <div className="mb-2 flex items-baseline justify-between px-1">
              <h3 className="flex items-center gap-2 text-[19px] font-bold"><BarbellIcon className="size-5 text-plate" weight="fill" />{tr("Musculation")}</h3>
              <span className="text-[12.5px] text-muted-foreground">{zone.p ? PATN[zone.p] || nomPat(zone.p) : ZONES[zone.z]} · {l.length}</span>
            </div>
            {pats.length > 1 && (
              <div className="no-scrollbar -mx-4 mb-2 flex gap-1.5 overflow-x-auto px-4">
                <button onClick={() => setZone({ z: zone.z, p: null })} className={cn("h-8 shrink-0 rounded-full border px-3 text-[13px] font-medium", !zone.p ? "border-foreground bg-foreground text-background" : "border-border bg-card")}>
                  {tr("Tout")}
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
              {!l.length && <p className="px-1 text-[13.5px] text-muted-foreground">{tr("Aucun exercice avec ce matériel.")}</p>}
            </div>
          </section>
          {soins.length > 0 && (
            <section aria-label={tr("Soin & mobilité")}>
              <div className="mb-2 flex items-baseline justify-between px-1">
                <h3 className="flex items-center gap-2 text-[19px] font-bold"><FirstAidKitIcon className="size-5 text-plate" weight="fill" />{tr("Soin & mobilité")}</h3>
                <span className="text-[12.5px] text-muted-foreground">{soins.length}</span>
              </div>
              <div className="flex flex-col gap-1.5">
                {soins.map((o) => <LigneExercice key={o} id={o} pris={pris?.(o)} onOuvrir={() => onFiche(o)} onAjouter={onAjouter ? () => onAjouter(o) : undefined} />)}
              </div>
            </section>
          )}
        </div>
      ) : (
        <ListeGroupes groupes={groupesDe(sel, "")} pris={pris} onAjouter={onAjouter} onFiche={onFiche} />
      )}
    </div>
  );
}

/* Les exercices du matériel coché dont un mot commence par `q`, par groupe musculaire. */
function groupesDe(sel: string[], q: string) {
  const f = sansAccent(q.trim()), g: Record<string, string[]> = {};
  Object.keys(EX).filter((o) => exoFiltre(o, sel)).forEach((o) => {
    if (f && !sansAccent(EX[o].n + " " + EX[o].m).split(/[^a-z0-9]+/).some((m) => m.startsWith(f))) return;
    const k = PAT2GRP[EX[o].pat] || (EX[o].pat === "soin" ? tr("Soin & mobilité") : tr("Cardio et mobilité"));
    (g[k] = g[k] || []).push(o);
  });
  return g;
}

function ListeGroupes({ groupes, pris, onAjouter, onFiche }: { groupes: Record<string, string[]>; pris?: (o: string) => boolean; onAjouter?: (o: string) => void; onFiche: (o: string) => void }) {
  return (
    <div className="flex flex-col gap-4">
      {Object.entries(groupes).map(([g, l]) => (
        <section key={g} aria-label={tr(g)}>
          <div className="mb-1.5 flex items-baseline justify-between px-1">
            <h3 className="eyebrow">{tr(g)}</h3>
            <span className="text-[12.5px] text-muted-foreground">{l.length}</span>
          </div>
          <div className="flex flex-col gap-1.5">
            {l.map((o) => <LigneExercice key={o} id={o} pris={pris?.(o)} onOuvrir={() => onFiche(o)} onAjouter={onAjouter ? () => onAjouter(o) : undefined} />)}
          </div>
        </section>
      ))}
    </div>
  );
}

export function ListeRecherche({ sel, q, setQ, pris, onAjouter, onFiche }: { sel: string[]; q: string; setQ: (s: string) => void; pris?: (o: string) => boolean; onAjouter?: (o: string) => void; onFiche: (o: string) => void }) {
  const groupes = useMemo(() => groupesDe(sel, q), [q, sel]);
  return (
    <div className="flex flex-col gap-3">
      <div className="relative">
        <MagnifyingGlassIcon className="absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder={tr("Rechercher un exercice…")} className="h-11 rounded-2xl bg-card pl-10 text-[15px]" />
      </div>
      {Object.keys(groupes).length ? <ListeGroupes groupes={groupes} pris={pris} onAjouter={onAjouter} onFiche={onFiche} />
        : <p className="text-center text-[13.5px] text-muted-foreground">{tr("Aucun exercice ne commence par ça.")}</p>}
    </div>
  );
}
