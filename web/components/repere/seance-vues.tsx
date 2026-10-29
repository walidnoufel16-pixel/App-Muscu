"use client";

import { pluriel, tr } from "@/lib/i18n";
import { CarteProteines } from "./proteines";
import { useState } from "react";
import { CaretRightIcon, ClockIcon, LightbulbIcon, MagnifyingGlassPlusIcon, XIcon } from "@phosphor-icons/react";
import { Drawer, DrawerContent, DrawerDescription, DrawerTitle } from "@/components/ui/drawer";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Duo } from "./fiche-exercice";
import { EX } from "@/lib/data/exercices";
import { COLLATION, ECHAUF, OBJS } from "@/lib/data/referentiels";
import { baseRPE, nomPat } from "@/lib/logic/core";
import { echauffementDe } from "@/lib/logic/echauffement";
import { cn } from "@/lib/utils";
import { Vignette } from "./exercice-carte";
import { EchauffementSoin } from "./soin";
import Link from "next/link";
import type { Route } from "next";
import { useRepere } from "@/lib/store";
import { macros, nomRecette, prefsDe, recettesPour } from "@/lib/logic/repas";
import { VignetteRecette } from "./repas";

/* ---------------- frise des 8 semaines : des disques qui se remplissent ---------------- */
export function FriseSemaines({ wk, avancement, onChoisir }: { wk: number; avancement: { faites: number; total: number }[]; onChoisir: (w: number) => void }) {
  const PALIER: Record<number, string> = { 7: "bg-rpe7", 8: "bg-rpe8", 9: "bg-rpe9" };
  return (
    <div className="no-scrollbar -mx-5 mt-4 flex gap-2 overflow-x-auto px-5 pb-1" role="tablist" aria-label={tr("Semaines du cycle")}>
      {avancement.map(({ faites, total }, i) => {
        const sel = i === wk, plein = total > 0 && faites === total, pct = total ? faites / total : 0;
        return (
          <button
            key={i}
            role="tab"
            aria-selected={sel}
            aria-label={tr("Semaine {a}, {faites} séance{a1} sur {total}", { a: i + 1, faites, a1: pluriel(faites) ? "s" : "", total })}
            onClick={() => onChoisir(i)}
            className={cn(
              "relative flex w-[54px] shrink-0 flex-col items-center gap-1.5 rounded-2xl border py-2.5 transition-colors",
              sel ? "border-foreground bg-foreground text-background" : "border-border/70 bg-card",
            )}
          >
            {/* disque : un anneau qui se remplit avec les séances faites */}
            <span
              className="disque relative grid size-8 place-items-center rounded-full"
              style={{
                "--p": pct, animationDelay: i * 70 + "ms",
                background: `conic-gradient(var(--plate) calc(var(--p) * 360deg), ${sel ? "rgba(255,255,255,.18)" : "var(--muted)"} 0)`,
              } as React.CSSProperties}
            >
              <span className={cn("num grid size-[24px] place-items-center rounded-full text-[15px] font-bold", sel ? "bg-foreground" : "bg-card", plein && !sel && "bg-plate text-plate-foreground")}>
                {i + 1}
              </span>
            </span>
            <span className={cn("h-1 w-5 rounded-full", PALIER[baseRPE(i)])} title={`RPE ${baseRPE(i)}`} />
          </button>
        );
      })}
    </div>
  );
}

/* ---------------- échauffement ---------------- */
/* Construit à partir des exercices de la séance ; la séance bonus du programme garde le sien. */
export function Echauffement({ ids, bonus = false, onFiche, avecSoin = true }: { ids: string[]; bonus?: boolean; onFiche: (id: string) => void; avecSoin?: boolean }) {
  const e = bonus ? ECHAUF.bonus : (({ min, l }) => ({ d: tr("{n} minutes", { n: min }), l }))(echauffementDe(ids));
  return (
    <div className="px-4">
      <div className="mb-3 flex items-center gap-2 rounded-2xl bg-card px-4 py-3 text-[14px]">
        <ClockIcon className="size-4 text-muted-foreground" />
        <span><b className="font-semibold">{tr("Environ {d}", { d: e.d })}</b>{" "}{tr("avant de toucher aux charges")}</span>
        <span className="ml-auto text-[12.5px] text-muted-foreground">{tr("{length} étapes", { length: e.l.length })}</span>
      </div>
      <ol className="relative flex flex-col gap-2">
        {e.l.map(([n, d, id, t], k) => (
          <li key={k} className="relative rounded-[20px] border border-border/80 bg-card p-4">
            <div className="flex items-baseline gap-3">
              <span className="num text-[22px] leading-none font-bold text-plate-ink">{k + 1}</span>
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-2">
                  <b className="text-[15.5px] font-semibold">{n}</b>
                  <span className="shrink-0 text-[12.5px] text-muted-foreground">{d}</span>
                </div>
                <p className="mt-1 text-[14px] leading-relaxed text-muted-foreground">{t}</p>
                {id && EX[id] && (
                  <button onClick={() => onFiche(id)} className="mt-2.5 flex w-full items-center gap-3 rounded-xl bg-muted p-1.5 pr-3 text-left active:scale-[.99]">
                    <Vignette id={id} className="size-10 rounded-[10px]" />
                    <span className="flex-1 text-[13.5px] font-medium">{tr("Voir le mouvement")}</span>
                    <CaretRightIcon className="size-4 text-muted-foreground" />
                  </button>
                )}
              </div>
            </div>
          </li>
        ))}
      </ol>
      {avecSoin && <div className="mt-3"><EchauffementSoin onFiche={onFiche} /></div>}
    </div>
  );
}

/* ---------------- collation ---------------- */
const ILLU = (n: string) => {
  const t = n.toLowerCase();
  return /prot/.test(t) ? "🍗" : /légume|vegetable/.test(t) ? "🥦" : /fruit/.test(t) ? "🍌" : /\bsel\b|salt/.test(t) ? "🧂" : /\beau\b|water/.test(t) ? "💧" : /glucide|féculent|carb|starch/.test(t) ? "🍚" : /repas|meal/.test(t) ? "🍽️" : "🥗";
};
export function Collation({ obj, onChanger }: { obj: number; onChanger?: (o: number) => void }) {
  const c = COLLATION[obj] || COLLATION[0];
  return (
    <div className="px-4">
      {onChanger && (
        <div className="no-scrollbar -mx-4 mb-3 flex gap-1.5 overflow-x-auto px-4">
          {OBJS.map((o, i) => (
            <button
              key={o}
              onClick={() => onChanger(i)}
              aria-pressed={obj === i}
              className={cn("h-8 shrink-0 rounded-full border px-3 text-[13px] font-medium", obj === i ? "border-foreground bg-foreground text-background" : "border-border bg-card text-muted-foreground")}
            >
              {o}
            </button>
          ))}
        </div>
      )}
      <div className="mb-2"><CarteProteines /></div>
      <div className="rounded-[22px] bg-card p-4">
        <h3 className="text-[19px] leading-tight font-bold tracking-[-0.01em]">{c.t}</h3>
        <p className="mt-1.5 text-[14px] leading-relaxed text-muted-foreground">{c.i}</p>
      </div>
      <div className="mt-2 flex flex-col gap-2">
        {c.l.map(([n, t]) => (
          <div key={n} className="flex gap-3 rounded-[20px] border border-border/80 bg-card p-3.5">
            <span className="grid size-11 shrink-0 place-items-center rounded-[14px] bg-muted text-[22px]" aria-hidden>{ILLU(n)}</span>
            <div>
              <div className="text-[15px] font-semibold">{n}</div>
              <p className="mt-0.5 text-[13.5px] leading-relaxed text-muted-foreground">{t}</p>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-2 flex gap-3 rounded-[20px] bg-plate-soft p-3.5">
        <LightbulbIcon className="mt-0.5 size-5 shrink-0 text-plate-ink" />
        <p className="text-[14px] leading-relaxed">{c.n}</p>
      </div>
      <IdeesRecettes />
      <p className="mt-3 px-1 text-[12px] leading-relaxed text-muted-foreground">
        {tr("Ces repères sont généraux et ne remplacent pas l'avis d'un professionnel. Si tu as un suivi médical ou un rapport compliqué à l'alimentation, parles-en à un médecin ou à un diététicien.")}
      </p>
    </div>
  );
}

/* Deux recettes pour après la séance (selon les préférences repas), vers l'onglet Repas. */
function IdeesRecettes() {
  const A = useRepere((x) => x.etat.A);
  const p = prefsDe(A);
  const l = recettesPour(p).filter((r) => r.t.includes("post")).slice(0, 2);
  if (!l.length) return null;
  return (
    <section className="mt-4" aria-label={tr("Idées de recettes")}>
      <h3 className="eyebrow mb-2 px-1">{tr("Idées de recettes pour après")}</h3>
      <div className="flex flex-col gap-1.5">
        {l.map((r) => (
          <Link key={r.id} href={`/repas?r=${r.id}` as Route} className="flex items-center gap-3 rounded-[18px] bg-card p-2.5 pr-3 active:opacity-80">
            <VignetteRecette r={r} className="size-12 shrink-0 rounded-[12px]" />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[14.5px] font-semibold">{nomRecette(r)}</span>
              <span className="block text-[12.5px] text-muted-foreground">{tr("{n} min · {p} g de protéines", { n: r.min, p: macros(r).p })}</span>
            </span>
            <CaretRightIcon className="size-4 text-muted-foreground" />
          </Link>
        ))}
      </div>
    </section>
  );
}

/* ---------------- remplacer un exercice ----------------
   Un toucher sur un mouvement le sélectionne ; `actions` rend alors les
   boutons de portée (pour aujourd'hui, pour toujours) sous la ligne. Sans
   `actions`, le toucher remplace directement. Toucher la photo montre le
   mouvement en grand avant de choisir. */
export function Remplacer({
  ouvert, onClose, titre, sousTitre, liste, courant, onChoisir, actions, pied, entete,
}: {
  ouvert: boolean; onClose: () => void; titre: string; sousTitre: string;
  liste: string[]; courant?: string;
  onChoisir?: (o: string) => void;
  actions?: (o: string) => React.ReactNode;
  pied?: React.ReactNode;
  entete?: React.ReactNode; // au-dessus de la liste (ex. le matériel, pour élargir les propositions)
}) {
  const [sel, setSel] = useState<string | null>(null);
  const [vu, setVu] = useState<string | null>(null);
  return (
    <Drawer open={ouvert} onOpenChange={(o) => { if (!o) { setSel(null); setVu(null); onClose(); } }}>
      <DrawerContent className="max-h-[88dvh]">
        <div className="overflow-y-auto overscroll-contain px-4 pb-[max(env(safe-area-inset-bottom),20px)]">
          <div className="eyebrow mt-2">{sousTitre}</div>
          <DrawerTitle className="mt-1 mb-1 text-[24px] leading-tight font-bold tracking-[-0.02em]">{titre}</DrawerTitle>
          <DrawerDescription className="mb-3 text-[13.5px] text-muted-foreground">
            {tr("Même muscle, compatible avec ton matériel. Remplacer ne change ni tes séries ni ton effort visé.")}
          </DrawerDescription>
          {entete}
          <div className="flex flex-col gap-1.5">
            {liste.map((o) => {
              const cur = o === courant, choisi = sel === o;
              return (
                <div key={o} className={cn("overflow-hidden rounded-[18px] border bg-card transition-colors", cur || choisi ? "border-plate" : "border-border/80")}>
                  <div className="flex items-center">
                  <button onClick={() => setVu(o)} aria-label={tr("Voir {n} en grand", { n: EX[o].n })} className="relative shrink-0 py-2.5 pl-2.5 active:scale-95">
                    <Vignette id={o} className="size-12 rounded-[12px]" />
                    <MagnifyingGlassPlusIcon className="absolute right-0.5 bottom-2 size-4 rounded-full bg-background/90 p-0.5" weight="bold" />
                  </button>
                  <button
                    disabled={cur}
                    onClick={() => (actions ? setSel(choisi ? null : o) : onChoisir?.(o))}
                    className="flex min-w-0 flex-1 items-center gap-3 p-2.5 pl-3 text-left disabled:cursor-default"
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[15px] font-semibold">{EX[o].n}</span>
                      <span className="block truncate text-[12.5px] text-muted-foreground">{EX[o].m}</span>
                    </span>
                    {cur ? (
                      <span className="rounded-full bg-plate px-2.5 py-1 text-[11.5px] font-semibold text-plate-foreground">{tr("En cours")}</span>
                    ) : (
                      <CaretRightIcon className={cn("size-4 text-muted-foreground transition-transform", choisi && "rotate-90")} />
                    )}
                  </button>
                  </div>
                  {choisi && actions && <div className="grid grid-cols-2 gap-2 px-2.5 pb-2.5 animate-in fade-in-0 duration-150">{actions(o)}</div>}
                </div>
              );
            })}
          </div>
          {pied}
          <p className="mt-3 text-center text-[11.5px] text-muted-foreground">{tr("{length} mouvement{a} · {a1}", { length: liste.length, a: pluriel(liste.length) ? "s" : "", a1: nomPat(EX[liste[0]]?.pat || "") })}</p>
        </div>
        <Apercu id={vu} courant={vu === courant} onClose={() => setVu(null)}
          onChoisir={(o) => { setVu(null); if (actions) setSel(o); else onChoisir?.(o); }} actions={actions} />
      </DrawerContent>
    </Drawer>
  );
}

/* Le mouvement en grand (départ et fin), et le choix sur place. Avec `actions`
   (pour aujourd'hui, pour toujours), ce sont elles qui valident. */
function Apercu({ id, courant, onClose, onChoisir, actions }: {
  id: string | null; courant: boolean; onClose: () => void; onChoisir: (o: string) => void; actions?: (o: string) => React.ReactNode;
}) {
  return (
    <Dialog open={!!id} onOpenChange={(o) => !o && onClose()}>
      <DialogContent showCloseButton={false} className="w-[calc(100vw-24px)] max-w-[456px] gap-0 rounded-[26px] p-3 pb-[max(env(safe-area-inset-bottom),12px)]">
        {id && (
          <>
            <div className="relative">
              <Duo id={id} />
              <button onClick={onClose} aria-label={tr("Fermer")} autoFocus
                className="absolute top-2.5 right-2.5 grid size-9 place-items-center rounded-full bg-background/85 backdrop-blur active:scale-90">
                <XIcon className="size-4" weight="bold" />
              </button>
            </div>
            <DialogTitle className="mt-3 px-1 text-[20px] leading-tight font-bold">{EX[id].n}</DialogTitle>
            <DialogDescription className="mt-0.5 px-1 text-[13.5px] text-muted-foreground">{EX[id].m}</DialogDescription>
            <div className="mt-3">
              {courant ? (
                <Button variant="soft" size="lg" className="w-full rounded-xl" onClick={onClose}>{tr("C'est l'exercice en cours")}</Button>
              ) : actions ? (
                <div className="grid grid-cols-2 gap-2">{actions(id)}</div>
              ) : (
                <Button variant="plate" size="lg" className="w-full rounded-xl" onClick={() => onChoisir(id)}>{tr("Choisir cet exercice")}</Button>
              )}
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
