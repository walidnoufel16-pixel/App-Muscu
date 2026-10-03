"use client";

import { useState } from "react";
import { CaretRightIcon, ClockIcon, LightbulbIcon } from "@phosphor-icons/react";
import { Drawer, DrawerContent, DrawerDescription, DrawerTitle } from "@/components/ui/drawer";
import { EX } from "@/lib/data/exercices";
import { COLLATION, ECHAUF, OBJS } from "@/lib/data/referentiels";
import { baseRPE, nomPat } from "@/lib/logic/core";
import { cn } from "@/lib/utils";
import { Vignette } from "./exercice-carte";

/* ---------------- frise des 8 semaines : des disques qui se remplissent ---------------- */
export function FriseSemaines({ wk, avancement, onChoisir }: { wk: number; avancement: { faites: number; total: number }[]; onChoisir: (w: number) => void }) {
  const PALIER: Record<number, string> = { 7: "bg-rpe7", 8: "bg-rpe8", 9: "bg-rpe9" };
  return (
    <div className="no-scrollbar -mx-5 mt-4 flex gap-2 overflow-x-auto px-5 pb-1" role="tablist" aria-label="Semaines du cycle">
      {avancement.map(({ faites, total }, i) => {
        const sel = i === wk, plein = total > 0 && faites === total, pct = total ? faites / total : 0;
        return (
          <button
            key={i}
            role="tab"
            aria-selected={sel}
            aria-label={`Semaine ${i + 1}, ${faites} séance${faites > 1 ? "s" : ""} sur ${total}`}
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
export function Echauffement({ type, onFiche }: { type: "haut" | "bas" | "bonus"; onFiche: (id: string) => void }) {
  const e = ECHAUF[type] || ECHAUF.haut;
  return (
    <div className="px-4">
      <div className="mb-3 flex items-center gap-2 rounded-2xl bg-card px-4 py-3 text-[14px]">
        <ClockIcon className="size-4 text-muted-foreground" />
        <span><b className="font-semibold">Environ {e.d}</b> avant de toucher aux charges</span>
        <span className="ml-auto text-[12.5px] text-muted-foreground">{e.l.length} étapes</span>
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
                    <span className="flex-1 text-[13.5px] font-medium">Voir le mouvement</span>
                    <CaretRightIcon className="size-4 text-muted-foreground" />
                  </button>
                )}
              </div>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}

/* ---------------- collation ---------------- */
const ILLU = (n: string) => {
  const t = n.toLowerCase();
  return /prot/.test(t) ? "🍗" : /légume/.test(t) ? "🥦" : /fruit/.test(t) ? "🍌" : /sel/.test(t) ? "🧂" : /eau/.test(t) ? "💧" : /glucide|féculent/.test(t) ? "🍚" : /repas/.test(t) ? "🍽️" : "🥗";
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
      <p className="mt-3 px-1 text-[12px] leading-relaxed text-muted-foreground">
        Ces repères sont généraux et ne remplacent pas l&apos;avis d&apos;un professionnel. Si tu as un suivi médical ou un rapport compliqué à l&apos;alimentation, parles-en à un médecin ou à un diététicien.
      </p>
    </div>
  );
}

/* ---------------- remplacer un exercice ----------------
   Un toucher sur un mouvement le sélectionne ; `actions` rend alors les
   boutons de portée (pour aujourd'hui, pour toujours) sous la ligne. Sans
   `actions`, le toucher remplace directement. */
export function Remplacer({
  ouvert, onClose, titre, sousTitre, liste, courant, onChoisir, actions, pied,
}: {
  ouvert: boolean; onClose: () => void; titre: string; sousTitre: string;
  liste: string[]; courant?: string;
  onChoisir?: (o: string) => void;
  actions?: (o: string) => React.ReactNode;
  pied?: React.ReactNode;
}) {
  const [sel, setSel] = useState<string | null>(null);
  return (
    <Drawer open={ouvert} onOpenChange={(o) => { if (!o) { setSel(null); onClose(); } }}>
      <DrawerContent className="max-h-[88dvh]">
        <div className="overflow-y-auto overscroll-contain px-4 pb-[max(env(safe-area-inset-bottom),20px)]">
          <div className="eyebrow mt-2">{sousTitre}</div>
          <DrawerTitle className="mt-1 mb-1 text-[24px] leading-tight font-bold tracking-[-0.02em]">{titre}</DrawerTitle>
          <DrawerDescription className="mb-3 text-[13.5px] text-muted-foreground">
            Même muscle, compatible avec ton matériel. Remplacer ne change ni tes séries ni ton effort visé.
          </DrawerDescription>
          <div className="flex flex-col gap-1.5">
            {liste.map((o) => {
              const cur = o === courant, choisi = sel === o;
              return (
                <div key={o} className={cn("overflow-hidden rounded-[18px] border bg-card transition-colors", cur || choisi ? "border-plate" : "border-border/80")}>
                  <button
                    disabled={cur}
                    onClick={() => (actions ? setSel(choisi ? null : o) : onChoisir?.(o))}
                    className="flex w-full items-center gap-3 p-2.5 text-left disabled:cursor-default"
                  >
                    <Vignette id={o} className="size-12 rounded-[12px]" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[15px] font-semibold">{EX[o].n}</span>
                      <span className="block truncate text-[12.5px] text-muted-foreground">{EX[o].m}</span>
                    </span>
                    {cur ? (
                      <span className="rounded-full bg-plate px-2.5 py-1 text-[11.5px] font-semibold text-plate-foreground">En cours</span>
                    ) : (
                      <CaretRightIcon className={cn("size-4 text-muted-foreground transition-transform", choisi && "rotate-90")} />
                    )}
                  </button>
                  {choisi && actions && <div className="grid grid-cols-2 gap-2 px-2.5 pb-2.5 animate-in fade-in-0 duration-150">{actions(o)}</div>}
                </div>
              );
            })}
          </div>
          {pied}
          <p className="mt-3 text-center text-[11.5px] text-muted-foreground">
            {liste.length} mouvement{liste.length > 1 ? "s" : ""} · {nomPat(EX[liste[0]]?.pat || "")}
          </p>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
