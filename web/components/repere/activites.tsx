"use client";

/* Autres activités dans l'agenda (maquette validée le 14 novembre 2026) : foot, padel, vélo…
   Déclarées pour un jour passé, aujourd'hui ou à venir, avec leur durée, leur intensité et les
   muscles qu'elles sollicitent ; ces muscles comptent comme pas prêts le temps de récupérer
   (lib/logic/recommandation.ts, effortsEndurance) et Oxa évite les jambes la veille d'une activité
   qui les sollicite (lib/logic/agenda.ts, recoPour). */
import { useState } from "react";
import { toast } from "sonner";
import { tr } from "@/lib/i18n";
import { ACTIVITES, activite, joursRecup } from "@/lib/data/activites";
import { nouvelId } from "@/lib/logic/agenda";
import { decaler } from "@/lib/logic/historique";
import { nomMuscle, type MuscleRecup } from "@/lib/logic/recommandation";
import type { Activite } from "@/lib/logic/types";
import { useRepere } from "@/lib/store";
import { tactile } from "@/lib/repos";
import { cn } from "@/lib/utils";
import { DrawerDescription, DrawerTitle } from "@/components/ui/drawer";
import { jourCourt, jourLong, maj } from "./agenda";

const DUREES = [30, 45, 60, 90, 120];
const INTENSITES = () => [tr("Tranquille"), tr("Normale"), tr("À fond")];
const MUSCLES: MuscleRecup[] = ["qua", "isc", "mol", "add", "abd", "lom", "pec", "dos", "epa", "bic", "tri", "avb"];
export const texteDuree = (min: number) => (min < 60 ? tr("{n} min", { n: min }) : min % 60 ? tr("{h} h {m}", { h: Math.floor(min / 60), m: min % 60 }) : tr("{h} h", { h: min / 60 }));
/** « Foot · 1 h 30 · normale » */
export const texteActivite = (a: Activite) => [activite(a.sp)?.n() ?? tr("Activité"), texteDuree(a.min), INTENSITES()[a.int].toLowerCase()].join(" · ");
const puce = (on: boolean) => cn("rounded-full px-3.5 py-2 text-[13.5px] font-semibold active:scale-[.97]", on ? "bg-plate text-plate-foreground" : "border border-border/80 bg-card");

/** Dans « Programmer » : pourquoi déclarer une autre activité, et les sports (ceux du profil d'abord). */
export function SectionActivites({ onChoisir }: { onChoisir: (sp: string) => void }) {
  const sports = useRepere((s) => s.etat.A.sport) || [];
  const liste = [...ACTIVITES].sort((a, b) => +(b.q != null && sports.includes(b.q)) - +(a.q != null && sports.includes(a.q)));
  return (
    <section className="mt-4">
      <h3 className="eyebrow mb-0.5 px-1">{tr("Tu fais aussi un autre sport ?")}</h3>
      <p className="mb-2 px-1 text-[12.5px] leading-snug text-muted-foreground">
        {tr("Un match de foot, une sortie vélo, un cours de boxe… Ajoute-le ici : Oxa saura quels muscles il a fatigués et ne te les fera pas retravailler avant qu'ils aient récupéré.")}
      </p>
      <div className="flex flex-wrap gap-1.5">
        {liste.map((a) => (
          <button key={a.id} onClick={() => { tactile(6); onChoisir(a.id); }} className={puce(false)}>
            <span aria-hidden className="mr-1">{a.e}</span>{a.n()}
          </button>
        ))}
      </div>
    </section>
  );
}

/** Déclarer (ou modifier) une activité : le jour, la durée, l'intensité, les muscles sollicités. */
export function FeuilleActivite({ d: d0, sp, id, auj, fermer }: { d: string; sp?: string; id?: string; auj: string; fermer: () => void }) {
  const muter = useRepere((s) => s.muter);
  const existante = useRepere((s) => (id ? s.etat.ACTIVITES?.find((a) => a.id === id) : undefined));
  const sport = activite(existante?.sp ?? sp ?? "autre")!;
  const [d, setD] = useState(existante?.d ?? d0);
  const [min, setMin] = useState(existante?.min ?? 60);
  const [int, setInt] = useState<0 | 1 | 2>(existante?.int ?? 1);
  const [m, setM] = useState<string[]>(existante?.m ?? sport.m);
  const jours = Array.from({ length: 17 }, (_, k) => decaler(auj, k - 3));
  const nomJour = (x: string) => (x === auj ? tr("Aujourd'hui") : x === decaler(auj, -1) ? tr("Hier") : x === decaler(auj, 1) ? tr("Demain") : maj(jourCourt(x)));
  const pret = decaler(d, joursRecup(int, min));
  const jambes = m.includes("qua") || m.includes("isc");
  const enregistrer = () => {
    tactile(12);
    muter((E) => {
      E.ACTIVITES ??= [];
      const a: Activite = { id: id ?? nouvelId(), d, sp: sport.id, min, int, m };
      const i = E.ACTIVITES.findIndex((x) => x.id === a.id);
      if (i >= 0) E.ACTIVITES[i] = a; else E.ACTIVITES.push(a);
    });
    toast.success(id ? tr("Activité modifiée") : tr("Ajoutée à l'agenda : {n}", { n: sport.n() }), { description: maj(jourLong(d)) });
    fermer();
  };
  return (
    <>
      <div className="mt-2 flex items-center gap-2.5 px-1">
        <span aria-hidden className="text-[30px] leading-none">{sport.e}</span>
        <span>
          <DrawerTitle className="text-[22px] font-extrabold">{sport.n()}</DrawerTitle>
          <DrawerDescription className="text-[13.5px] text-muted-foreground">{maj(jourLong(d))}</DrawerDescription>
        </span>
      </div>

      <h3 className="eyebrow mt-4 mb-1.5 px-1">{tr("Quand")}</h3>
      <div className="no-scrollbar -mx-4 flex gap-1.5 overflow-x-auto px-4 pb-1">
        {jours.map((x) => <button key={x} onClick={() => { tactile(4); setD(x); }} className={cn(puce(x === d), "shrink-0")}>{nomJour(x)}</button>)}
      </div>

      <h3 className="eyebrow mt-3 mb-1.5 px-1">{tr("Durée")}</h3>
      <div className="flex flex-wrap gap-1.5">
        {DUREES.map((x) => <button key={x} onClick={() => { tactile(4); setMin(x); }} className={puce(x === min)}>{texteDuree(x)}</button>)}
      </div>

      <h3 className="eyebrow mt-3 mb-1.5 px-1">{tr("Intensité")}</h3>
      <div className="flex flex-wrap gap-1.5">
        {INTENSITES().map((t, k) => <button key={t} onClick={() => { tactile(4); setInt(k as 0 | 1 | 2); }} className={puce(k === int)}>{t}</button>)}
      </div>

      <h3 className="eyebrow mt-3 px-1">{tr("Muscles sollicités")}</h3>
      <p className="mb-1.5 px-1 text-[12.5px] text-muted-foreground">{sport.m.length ? tr("Proposés pour ce sport, touche pour corriger.") : tr("Touche les muscles que cette activité fait travailler.")}</p>
      <div className="flex flex-wrap gap-1.5">
        {MUSCLES.map((g) => (
          <button key={g} aria-pressed={m.includes(g)} onClick={() => { tactile(4); setM((l) => (l.includes(g) ? l.filter((x) => x !== g) : [...l, g])); }} className={puce(m.includes(g))}>{nomMuscle(g)}</button>
        ))}
      </div>

      {m.length > 0 && (
        <div className="mt-4 rounded-2xl bg-amber-500/12 px-3.5 py-3 text-[13.5px] leading-snug">
          <b className="text-amber-700 dark:text-amber-300">{tr("Ces muscles seront prêts à nouveau {j}.", { j: jourLong(pret) })}</b>
          <span className="mt-0.5 block text-muted-foreground">
            {tr("D'ici là, Oxa ne te les proposera pas.")}{jambes && int > 0 && d >= auj ? " " + tr("Et pas de jambes lourdes la veille.") : ""}
          </span>
        </div>
      )}

      <button onClick={enregistrer} className="mt-4 h-13 w-full rounded-full bg-plate text-[16px] font-bold text-plate-foreground active:scale-[.98]">
        {id ? tr("Enregistrer") : tr("Ajouter à l'agenda")}
      </button>
      {id && (
        <button onClick={() => { muter((E) => { E.ACTIVITES = (E.ACTIVITES || []).filter((a) => a.id !== id); }); toast(tr("Activité retirée de l'agenda")); fermer(); }}
          className="mt-2 w-full py-2 text-[14px] font-semibold text-destructive">{tr("Retirer de l'agenda")}</button>
      )}
    </>
  );
}

/** Dans la feuille d'un jour : les activités déclarées, chacune modifiable. */
export function ActivitesDuJour({ act, onModifier }: { act: Activite[]; onModifier: (id: string) => void }) {
  return act.map((a) => {
    const s = activite(a.sp);
    return (
      <div key={a.id} className="mt-4">
        <div className="px-1 text-[11px] font-bold tracking-[0.12em] text-amber-700 uppercase dark:text-amber-300">{tr("Autre activité")}</div>
        <button onClick={() => { tactile(6); onModifier(a.id); }} className="mt-1 flex w-full items-center gap-3 rounded-2xl bg-muted/60 p-3 text-left active:scale-[.99]">
          <span aria-hidden className="text-[24px] leading-none">{s?.e}</span>
          <span className="min-w-0 flex-1">
            <span className="block text-[16px] font-bold">{s?.n() ?? tr("Activité")}</span>
            <span className="block text-[12.5px] text-muted-foreground">{[texteDuree(a.min), INTENSITES()[a.int].toLowerCase(), a.m.map((g) => nomMuscle(g as MuscleRecup)).join(", ")].filter(Boolean).join(" · ")}</span>
          </span>
          <span className="text-[13px] font-semibold text-plate-ink dark:text-plate">{tr("Modifier")}</span>
        </button>
      </div>
    );
  });
}
