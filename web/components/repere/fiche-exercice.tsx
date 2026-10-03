"use client";

import { useRef, useState } from "react";
import { ArrowsLeftRightIcon, CaretLeftIcon, CaretRightIcon } from "@phosphor-icons/react";
import { Drawer, DrawerContent, DrawerDescription, DrawerTitle } from "@/components/ui/drawer";
import { EX } from "@/lib/data/exercices";
import { histo, nb, nomPat, noRPE, rirTxt, UNITE } from "@/lib/logic/core";
import { useRepere } from "@/lib/store";
import { useFiche } from "@/lib/fiches";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { imgEx, sourceEx } from "@/lib/medias";
import { variantesDe } from "@/lib/logic/variantes";
import { musclesDe } from "@/lib/logic/core";
import { Vignette } from "./exercice-carte";

export type FicheOuverte = {
  id: string;
  idx: number; // position dans la séance du plan, -1 hors plan
  pres: [number, number, string];
  libelle: string; // « principal », « accessoire », « séance libre »
  rpe?: number;
  onRemplacer?: () => void;
};

/* Photos départ / fin : elles alternent en fondu pour suggérer le mouvement. */
function Duo({ id }: { id: string }) {
  const [anime, setAnime] = useState(true);
  return (
    <div className="relative">
      <div className={cn("relative grid overflow-hidden rounded-[22px] bg-muted", anime ? "aspect-[3/2]" : "grid-cols-2 gap-px")}>
        {[0, 1].map((n) => (
          <figure
            key={n}
            className={cn("relative m-0", anime && "absolute inset-0", anime && n === 1 && "animate-[duo_2.4s_ease-in-out_infinite]")}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={imgEx(id, n as 0 | 1)} alt={`${EX[id].n}, ${n ? "fin" : "départ"}`} className="size-full object-cover" />
            {!anime && (
              <figcaption className="absolute bottom-2 left-2 rounded-md bg-background/85 px-1.5 py-0.5 text-[10.5px] font-medium tracking-wide uppercase backdrop-blur">
                {n ? "Fin" : "Départ"}
              </figcaption>
            )}
          </figure>
        ))}
      </div>
      <button
        onClick={() => setAnime((a) => !a)}
        className="absolute right-2.5 bottom-2.5 rounded-full bg-background/85 px-3 py-1.5 text-[12px] font-semibold backdrop-blur active:scale-95"
      >
        {anime ? "Côte à côte" : "Animer"}
      </button>
    </div>
  );
}

export function FicheExercice({ fiche, onClose }: { fiche: FicheOuverte | null; onClose: () => void }) {
  return (
    <Drawer open={!!fiche} onOpenChange={(o) => !o && onClose()}>
      <DrawerContent className="max-h-[92dvh]">
        {fiche && EX[fiche.id] && <Contenu key={fiche.id + "|" + fiche.idx} fiche={fiche} />}
      </DrawerContent>
    </Drawer>
  );
}

/* Contenu de la fiche. Toucher une variante l'affiche à la place, dans la même
   feuille ; « Retour à … » remonte d'un cran. Ce qui est propre à la séance
   (prescription, RPE, remplacement) ne concerne que l'exercice d'origine. */
function Contenu({ fiche }: { fiche: FicheOuverte }) {
  const etat = useRepere((s) => s.etat);
  const [pile, setPile] = useState<string[]>([]);
  const defile = useRef<HTMLDivElement>(null);
  const id = pile.at(-1) ?? fiche.id, origine = !pile.length;
  const e = EX[id];
  const t = useFiche(id);
  const lignes = histo(etat, id, origine ? fiche.idx : -1);
  const max = Math.max(1, ...lignes.map((l) => l.v));
  const u = UNITE[e.ch];
  const variantes = variantesDe(etat.A, id);
  const aller = (p: string[]) => { setPile(p); defile.current?.scrollTo({ top: 0 }); };
  const prec = pile.length > 1 ? pile[pile.length - 2] : fiche.id;
  return (
    <div ref={defile} className="overflow-y-auto overscroll-contain px-5 pb-[max(env(safe-area-inset-bottom),20px)]">
      {!origine && (
        <button onClick={() => aller(pile.slice(0, -1))} className="mt-1 -ml-1 flex items-center gap-0.5 text-[14.5px] font-medium text-plate-ink">
          <CaretLeftIcon className="size-4" weight="bold" />Retour à {EX[prec].n.toLowerCase()}
        </button>
      )}
      <div className="pt-2">
        <Duo key={id} id={id} />
        <p className="mt-1.5 text-center text-[10.5px] text-muted-foreground">{sourceEx(id).mention}</p>
      </div>
      <div className="eyebrow mt-4">{e.m} · {nomPat(e.pat)}</div>
      <DrawerTitle className="mt-1 text-[26px] leading-tight font-bold tracking-[-0.02em]">{e.n}</DrawerTitle>
      <DrawerDescription className="sr-only">Fiche de l&apos;exercice</DrawerDescription>

      {origine && (
        <>
          <div className="mt-3 flex flex-wrap gap-1.5">
            <span className="num rounded-full bg-foreground px-3 py-1 text-[15px] font-bold text-background">{fiche.pres[0]} × {fiche.pres[1]}</span>
            <span className="rounded-full bg-muted px-3 py-1 text-[13px] font-medium">repos {fiche.pres[2]}</span>
            <span className="rounded-full bg-muted px-3 py-1 text-[13px] font-medium">{fiche.libelle}</span>
          </div>
          {fiche.rpe && !noRPE(id) ? (
            <div className="mt-3 flex items-center gap-3 rounded-2xl border bg-card p-3">
              <span className="num text-[28px] leading-none font-bold text-plate-ink">RPE {fiche.rpe}</span>
              <span className="text-[13.5px] leading-snug text-muted-foreground">{rirTxt(fiche.rpe)} à la fin de la série</span>
            </div>
          ) : null}
          {fiche.onRemplacer && (
            <button onClick={fiche.onRemplacer} className="mt-2 flex w-full items-center gap-3 rounded-2xl border bg-card p-3 text-left active:scale-[.99]">
              <ArrowsLeftRightIcon className="size-5 text-muted-foreground" />
              <span className="flex-1">
                <span className="block text-[15px] font-semibold">Exercice alternatif</span>
                <span className="block text-[12.5px] text-muted-foreground">Même muscle, compatible avec ton matériel</span>
              </span>
              <CaretRightIcon className="size-4 text-muted-foreground" />
            </button>
          )}
        </>
      )}

      <Bloc titre="Ton historique">
        {lignes.length ? (
          <div className="flex flex-col gap-1.5">
            {lignes.map((l, i) => (
              <div key={i} className="grid grid-cols-[44px_1fr_auto] items-center gap-3">
                <span className="num text-[14px] font-semibold text-muted-foreground">{l.label}</span>
                <span className="h-2 overflow-hidden rounded-full bg-muted">
                  <span className="block h-full rounded-full bg-plate" style={{ width: Math.max(6, (l.v / max) * 100) + "%" }} />
                </span>
                <span className="num text-[15px] font-semibold">
                  {nb(l.v)} {u}{["kg", "lest"].includes(e.ch) ? ` × ${l.reps}` : ""}{l.lest ? ` +${nb(l.lest)} kg` : ""}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-[14px] text-muted-foreground">Rien d&apos;enregistré pour l&apos;instant sur cet exercice.</p>
        )}
      </Bloc>
      {t ? (
        <>
          <Bloc titre="Exécution"><p className="text-[15px] leading-relaxed">{t.e}</p></Bloc>
          <Bloc titre="Erreurs fréquentes">
            <ul className="flex flex-col gap-2">
              {t.err.map((x, i) => (
                <li key={i} className="flex gap-2.5 text-[15px] leading-relaxed">
                  <span className="mt-2.5 size-1.5 shrink-0 rounded-full bg-destructive" />
                  {x}
                </li>
              ))}
            </ul>
          </Bloc>
          <Bloc titre="Comment progresser">
            <p className="rounded-2xl bg-plate-soft p-3.5 text-[15px] leading-relaxed">{t.p}</p>
          </Bloc>
        </>
      ) : (
        <div className="mt-6 flex flex-col gap-2" aria-busy="true">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-24 w-full" />
        </div>
      )}

      {variantes.length > 0 && (
        <Bloc titre="Variantes">
          <div className="overflow-hidden rounded-2xl border bg-card">
            {variantes.map((v) => (
              <button key={v.id} onClick={() => aller([...pile, v.id])} className="flex w-full items-center gap-3 border-t border-border/70 p-2.5 text-left first:border-t-0 active:bg-muted">
                <Vignette id={v.id} className="size-12 rounded-[12px]" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[15px] font-semibold">{EX[v.id].n}</span>
                  <span className="block truncate text-[12.5px] text-muted-foreground">
                    {v.materiel}{musclesDe([v.id]).length ? " · " + musclesDe([v.id]).join(", ") : ""}
                  </span>
                  {!v.dispo && <span className="block text-[11.5px] font-medium text-muted-foreground/80">autre matériel</span>}
                </span>
                <CaretRightIcon className="size-4 text-muted-foreground" />
              </button>
            ))}
          </div>
        </Bloc>
      )}

    </div>
  );
}

function Bloc({ titre, children }: { titre: string; children: React.ReactNode }) {
  return (
    <section className="mt-6">
      <h3 className="eyebrow mb-2.5">{titre}</h3>
      {children}
    </section>
  );
}
