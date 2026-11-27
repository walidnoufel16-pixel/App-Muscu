"use client";

/* Première séance du mode Suivi (27/11/2026) : un écran plein, sans feuille par-dessus ni question
   en route. On touche ses muscles, les exercices les plus courants de chacun s'affichent (avec le
   matériel du Profil), on coche les siens ; « Commencer » lance la séance. Rien n'est proposé
   d'office : c'est sa séance. Les séries, répétitions et repos partent d'une valeur par défaut,
   réglables avant (« Régler séries et repos ») ou pendant la séance. */
import { tr } from "@/lib/i18n";
import { useState } from "react";
import { CaretDownIcon, CheckIcon, HandPointingIcon, InfoIcon, MagnifyingGlassIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { EnTete } from "./en-tete";
import { Retour } from "./retour";
import { Vignette } from "./exercice-carte";
import { ListeRecherche, parRole } from "./bibliotheque";
import { exosParMuscle } from "./bibliotheque-muscles";
import { EX } from "@/lib/data/exercices";
import { MUSC, TYPES } from "@/lib/data/referentiels";
import { exoFiltre } from "@/lib/logic/core";
import { tactile } from "@/lib/repos";
import { cn } from "@/lib/utils";

/** Les muscles proposés, dans l'ordre d'une salle (les petits groupes restent dans la recherche). */
export const MUSCLES_PREMIERE = ["pec", "dos", "epa", "bic", "tri", "qua", "isc", "mol", "abd"] as const;

/* Les exercices les plus courants en salle, du plus au moins fréquent, par muscle. */
export const COURANTS: Record<string, string[]> = {
  pec: ["dc", "dh", "dci", "dhi", "chpm", "pecdk", "ecart", "pomp", "dip"],
  dos: ["tr", "tp", "rw", "rh", "tps", "rwm", "ra", "trs"],
  epa: ["dm", "dmh", "el", "dmm", "elp", "ois", "rmf", "arn"],
  bic: ["curlb", "curlh", "mart", "pup", "curlp", "curlez", "curlel"],
  tri: ["tri", "tricor", "bfront", "dipt", "nuq", "dcs", "bdips"],
  qua: ["sq", "pr", "lext", "hack", "bul", "fe", "gob", "sqpc"],
  isc: ["rm", "ht", "lc", "sdt", "lcas", "rmh", "pont"],
  mol: ["mol", "molp", "molh", "mol1"],
  abd: ["gai", "cr", "crp", "rj", "plat", "roue", "crinv"],
};
const MAX = 6;

/** Les exercices d'un muscle avec ce matériel : d'abord les courants (6 au plus, complétés par les
    autres s'il en manque), puis le reste. */
export function exosCourants(k: string, sel: string[]) {
  const tous = parRole(exosParMuscle([k], sel)[0]?.l ?? [], k).flatMap((g) => g.ids);
  const courants = (COURANTS[k] ?? []).filter((o) => exoFiltre(o, sel) && tous.includes(o));
  const debut = [...courants, ...tous.filter((o) => !courants.includes(o))].slice(0, MAX);
  return { debut, reste: tous.filter((o) => !debut.includes(o)) };
}

const nomDe = (k: string) => MUSC.find((g) => g.k === k)?.n ?? k;

export function PremiereSeance({ sel, setSel, muscles, setMuscles, pris, basculer, ajouter, onFiche, nb, onCommencer, onDetail }: {
  /* le matériel coché (celui du Profil au départ) */
  sel: string[];
  setSel: (s: string[]) => void;
  muscles: string[];
  setMuscles: (m: string[]) => void;
  pris: (o: string) => boolean;
  basculer: (o: string) => void;
  ajouter: (o: string) => void;
  onFiche: (o: string) => void;
  nb: number;
  onCommencer: () => void;
  onDetail: () => void;
}) {
  const [ouverts, setOuverts] = useState<string[]>([]);
  const [chercher, setChercher] = useState(false);
  const [q, setQ] = useState("");
  const toucher = (k: string) => { tactile(6); setMuscles(muscles.includes(k) ? muscles.filter((x) => x !== k) : [...muscles, k]); };
  const choisis = MUSCLES_PREMIERE.filter((k) => muscles.includes(k));
  return (
    <>
      <EnTete surtitre={tr("Ta première séance")} titre={tr("Crée ta séance")} gauche={<Retour repli="/entrainement" />} />
      <div className="flex flex-col gap-4 px-4 pb-44">
        <p className="-mt-2 px-1 text-[15px] leading-snug text-muted-foreground">{tr("Ton matériel, tes muscles, puis coche tes exercices.")}</p>
        {/* le matériel d'abord, en entier : les exercices proposés en dépendent */}
        <h2 className="px-1 text-[19px] font-bold">{tr("Choisis ton matériel disponible")}</h2>
        <div role="group" aria-label={tr("Matériel disponible")} className="-mt-2 flex flex-wrap gap-2">
          {TYPES.map(([t, n]) => {
            const on = sel.includes(t);
            return (
              <button key={t} aria-pressed={on} onClick={() => { tactile(6); setSel(on ? sel.filter((x) => x !== t) : [...sel, t]); }}
                className={cn("flex h-10 items-center gap-1.5 rounded-full border-[1.5px] px-3.5 text-[14.5px] font-semibold active:scale-[.97]", on ? "border-foreground bg-foreground text-background" : "border-border bg-card")}>
                {on && <CheckIcon className="size-3.5" weight="bold" />}{tr(n)}
              </button>
            );
          })}
        </div>
        <h2 className="mt-2 px-1 text-[19px] font-bold">{tr("Tu travailles quoi ?")}</h2>
        <div role="group" aria-label={tr("Muscles")} className="-mt-2 flex flex-wrap gap-2">
          {MUSCLES_PREMIERE.map((k) => {
            const on = muscles.includes(k);
            return (
              <button key={k} aria-pressed={on} onClick={() => toucher(k)}
                className={cn("h-11 rounded-full border-[1.5px] px-4 text-[15px] font-semibold active:scale-[.97]", on ? "border-plate bg-plate text-plate-foreground" : "border-border bg-card")}>
                {nomDe(k)}
              </button>
            );
          })}
        </div>

        {!sel.some((t) => !t.startsWith("x:")) ? (
          <p className="flex items-center gap-2 rounded-2xl bg-plate-soft px-3.5 py-3 text-[14px] font-semibold text-plate-ink dark:text-plate">
            <HandPointingIcon className="size-5 shrink-0 -rotate-12" weight="fill" />{tr("Sélectionne au moins un matériel pour voir des exercices.")}
          </p>
        ) : !choisis.length && (
          <p className="flex items-center gap-2 rounded-2xl bg-plate-soft px-3.5 py-3 text-[14px] font-semibold text-plate-ink dark:text-plate">
            <HandPointingIcon className="size-5 shrink-0 -rotate-12" weight="fill" />{tr("Touche un muscle pour voir ses exercices.")}
          </p>
        )}

        {choisis.map((k) => {
          const { debut, reste } = exosCourants(k, sel);
          const tout = ouverts.includes(k);
          const liste = tout ? [...debut, ...reste] : debut;
          return (
            <section key={k} aria-label={nomDe(k)} className="flex flex-col gap-1.5">
              <h2 className="px-1 text-[19px] font-bold">{nomDe(k)}</h2>
              {liste.map((o) => <LigneCoche key={o} id={o} on={pris(o)} onBasculer={() => { tactile(8); basculer(o); }} onFiche={() => onFiche(o)} />)}
              {!debut.length && <p className="px-1 text-[13.5px] text-muted-foreground">{tr("Aucun exercice avec ce matériel.")}</p>}
              {reste.length > 0 && (
                <button onClick={() => { tactile(5); setOuverts(tout ? ouverts.filter((x) => x !== k) : [...ouverts, k]); }}
                  className="flex items-center gap-1 self-start px-1 py-1.5 text-[14px] font-semibold text-plate-ink dark:text-plate">
                  {tout ? tr("Moins d'exercices") : tr("Voir les {n} autres", { n: reste.length })}
                  <CaretDownIcon className={cn("size-3.5 transition-transform", tout && "rotate-180")} weight="bold" />
                </button>
              )}
            </section>
          );
        })}

        {chercher ? (
          <section aria-label={tr("Chercher un exercice")} className="flex flex-col gap-2">
            <h2 className="px-1 text-[19px] font-bold">{tr("Chercher un exercice")}</h2>
            <ListeRecherche sel={sel} q={q} setQ={setQ} pris={pris} onAjouter={ajouter} onFiche={onFiche} />
          </section>
        ) : (
          <button onClick={() => { tactile(5); setChercher(true); }} className="flex h-12 items-center justify-center gap-2 rounded-2xl border border-dashed border-border bg-card/60 text-[15px] font-semibold active:scale-[.99]">
            <MagnifyingGlassIcon className="size-4.5" weight="bold" />{tr("Chercher un autre exercice")}
          </button>
        )}
      </div>

      <div className="fixed inset-x-0 bottom-0 z-30 mx-auto max-w-[480px] bg-background px-4 pt-3 pb-[max(env(safe-area-inset-bottom),14px)] shadow-[0_-10px_14px_-6px_var(--background)]">
        <Button variant="plate" size="xl" className="w-full" disabled={!nb} onClick={() => { tactile(10); onCommencer(); }}>
          {nb ? (nb > 1 ? tr("Commencer · {n} exercices", { n: nb }) : tr("Commencer · 1 exercice")) : tr("Coche au moins un exercice")}
        </Button>
        <button disabled={!nb} onClick={() => { tactile(5); onDetail(); }}
          className="mt-1 h-10 w-full rounded-full text-[14.5px] font-semibold text-plate-ink disabled:opacity-40 dark:text-plate">{tr("Régler séries et repos avant")}</button>
      </div>
    </>
  );
}

/* Une ligne d'exercice à cocher : toute la ligne coche ; le « i » ouvre la fiche. */
function LigneCoche({ id, on, onBasculer, onFiche }: { id: string; on: boolean; onBasculer: () => void; onFiche: () => void }) {
  const x = EX[id];
  if (!x) return null;
  return (
    <div className={cn("flex items-center rounded-[18px] border-2 bg-card transition-colors", on ? "border-plate" : "border-transparent")}>
      <button role="checkbox" aria-checked={on} onClick={onBasculer} className="flex min-w-0 flex-1 items-center gap-3 p-2.5 text-left">
        <Vignette id={id} className="size-12 rounded-[12px]" />
        <span className="min-w-0 flex-1">
          <span className="line-clamp-2 text-[15px] leading-tight font-semibold">{x.n}</span>
          <span className="block truncate text-[12.5px] text-muted-foreground">{x.m}</span>
        </span>
        <span aria-hidden className={cn("grid size-7 shrink-0 place-items-center rounded-full border-2", on ? "border-plate bg-plate text-plate-foreground" : "border-border")}>
          {on && <CheckIcon className="size-4" weight="bold" />}
        </span>
      </button>
      <button onClick={onFiche} aria-label={tr("Fiche de {n}", { n: x.n })} className="grid size-11 shrink-0 place-items-center text-muted-foreground">
        <InfoIcon className="size-5" />
      </button>
    </div>
  );
}
