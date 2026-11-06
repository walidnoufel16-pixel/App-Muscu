"use client";

/* Récupération : une ligne sous la semaine (deux petites silhouettes, les muscles prêts, ceux au
   repos), le détail en feuille (corps de face et de dos, délai par muscle, séance avec les muscles
   prêts). Turquoise : prêt ; orange système : en récupération. Calcul : etatGroupes (recommandation). */
import { tr } from "@/lib/i18n";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { Route } from "next";
import { CaretRightIcon } from "@phosphor-icons/react";
import { Drawer, DrawerContent, DrawerDescription, DrawerTitle } from "@/components/ui/drawer";
import { CORPS, CORPS_F, CORPS_VB, CORPS_VB_F } from "@/lib/data/corps";
import { PAT2MUSC } from "@/lib/data/referentiels";
import { etatGroupes, GROUPES, nomGroupe, type EtatGroupe, type Groupe } from "@/lib/logic/recommandation";
import { useRepere } from "@/lib/store";
import { AVANT } from "@/lib/nav";
import { tactile } from "@/lib/repos";

export const ORANGE = "#ff9f0a";
/* les muscles qu'on propose de travailler (mollets et abdos se récupèrent en un jour, on ne les cite pas en tête) */
const EN_TETE: Groupe[] = ["pec", "dos", "epa", "qua", "isc", "bic", "tri"];

function Corps({ cote, E, h }: { cote: "front" | "back"; E: Record<Groupe, EtatGroupe>; h: number }) {
  const femme = useRepere((s) => s.etat.A.sexe === 1);
  const couleur = (p?: string) => {
    const g = p && (PAT2MUSC[p] as Groupe);
    if (!g || !E[g]) return "color-mix(in oklab, var(--foreground) 10%, transparent)";
    return E[g].recupere ? "var(--plate)" : ORANGE;
  };
  return (
    <svg viewBox={(femme ? CORPS_VB_F : CORPS_VB)[cote]} style={{ height: h }} className="w-auto" aria-hidden>
      {(femme ? CORPS_F : CORPS)[cote].map((r) => (
        <path key={r.i} d={r.d} style={{ fill: couleur(r.p) }} className="stroke-card [stroke-width:1.2px] [vector-effect:non-scaling-stroke]" />
      ))}
    </svg>
  );
}

const delai = (e: EtatGroupe) => (e.reste === 1 ? tr("demain") : tr("dans {n} jours", { n: e.reste }));

/** La ligne sous la semaine, et sa feuille. Rien sans séance sur les 14 derniers jours. */
export function LigneRecuperation({ auj }: { auj: string }) {
  const router = useRouter();
  const H = useRepere((s) => s.etat.HIST);
  const E = useMemo(() => etatGroupes(H || [], auj), [H, auj]);
  const [ouvert, setOuvert] = useState(false);
  if (GROUPES.every((g) => !E[g].dernier)) return null;
  const prets = EN_TETE.filter((g) => E[g].recupere), repos = GROUPES.filter((g) => !E[g].recupere);
  const bientot = repos.length ? Math.min(...repos.map((g) => E[g].reste)) : 0;
  const tri = [...GROUPES].sort((a, b) => E[b].reste - E[a].reste);
  const lancer = () => {
    tactile(10); setOuvert(false);
    router.push(`/entrainement/assistant?m=${prets.join(",")}` as Route, AVANT);
  };
  return (
    <>
      <button onClick={() => { tactile(5); setOuvert(true); }} className="flex items-center gap-3 rounded-[20px] bg-card py-2 pr-3 pl-2 text-left active:scale-[.99]">
        <span className="flex shrink-0 items-center"><Corps cote="front" E={E} h={60} /><Corps cote="back" E={E} h={60} /></span>
        <span className="min-w-0 flex-1 leading-tight">
          <span className="block text-[11px] font-semibold tracking-[0.08em] text-muted-foreground uppercase">{tr("Récupération")}</span>
          <span className="mt-0.5 block truncate text-[14.5px] font-semibold">
            {prets.length === EN_TETE.length ? tr("Tous tes muscles sont prêts") : prets.length ? tr("Prêts : {l}", { l: prets.map(nomGroupe).join(", ").toLowerCase() }) : tr("Tes muscles récupèrent")}
          </span>
          {repos.length > 0 && (
            <span className="block truncate text-[12.5px] text-muted-foreground">
              {repos.map(nomGroupe).join(", ")} · {bientot === 1 ? tr("prêts demain") : tr("prêts dans {n} jours", { n: bientot })}
            </span>
          )}
        </span>
        <CaretRightIcon className="size-4 shrink-0 text-muted-foreground" />
      </button>

      <Drawer open={ouvert} onOpenChange={setOuvert}>
        <DrawerContent className="max-h-[92dvh]">
          <div className="overflow-y-auto overscroll-contain px-5 pb-[max(env(safe-area-inset-bottom),20px)]">
            <DrawerTitle className="mt-2 text-[22px] font-bold">{tr("Récupération")}</DrawerTitle>
            <DrawerDescription className="text-[13px] text-muted-foreground">{tr("D'après tes séances des 14 derniers jours.")}</DrawerDescription>
            <div className="mt-3 flex justify-center gap-2"><Corps cote="front" E={E} h={190} /><Corps cote="back" E={E} h={190} /></div>
            <div className="mt-2 flex justify-center gap-4 text-[12px] text-muted-foreground">
              <span className="flex items-center gap-1.5"><i className="size-2.5 rounded-full bg-plate" />{tr("prêt")}</span>
              <span className="flex items-center gap-1.5"><i className="size-2.5 rounded-full" style={{ background: ORANGE }} />{tr("en récupération")}</span>
            </div>
            <ul className="mt-3 overflow-hidden rounded-[18px] bg-card">
              {tri.map((g) => (
                <li key={g} className="flex items-center gap-3 border-t border-border/60 px-3.5 py-2.5 first:border-t-0">
                  <span className="size-2.5 shrink-0 rounded-full" style={{ background: E[g].recupere ? "var(--plate)" : ORANGE }} />
                  <span className="flex-1 text-[15px]">{nomGroupe(g)}</span>
                  <span className="text-[13.5px] text-muted-foreground">
                    {!E[g].recupere ? delai(E[g]) : !E[g].dernier || E[g].jours >= 7 ? tr("prêt · pas travaillé depuis 7 j+") : tr("prêt")}
                  </span>
                </li>
              ))}
            </ul>
            {prets.length > 0 && (
              <button onClick={lancer} className="mt-4 h-12 w-full rounded-full bg-plate text-[16px] font-semibold text-plate-foreground active:scale-[.98]">
                {tr("Séance avec les muscles prêts")}
              </button>
            )}
          </div>
        </DrawerContent>
      </Drawer>
    </>
  );
}
