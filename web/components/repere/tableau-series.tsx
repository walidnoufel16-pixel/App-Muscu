"use client";

import { useCallback, useState } from "react";
import { CheckIcon, PlusIcon, XIcon } from "@phosphor-icons/react";
import { EX } from "@/lib/data/exercices";
import { LESTABLE } from "@/lib/data/referentiels";
import { fmtSerie, maxV, nb, okDe, secondesDe, seriesDe, type Ctx } from "@/lib/logic/core";
import * as act from "@/lib/logic/actions";
import type { Journal, Serie } from "@/lib/logic/types";
import { useRepere } from "@/lib/store";
import { tactile, useRepos } from "@/lib/repos";
import { estRecord } from "@/lib/logic/records";
import { gerbe, mouvementReduit, seanceDe, useCelebrer } from "@/lib/celebrer";
import { cn } from "@/lib/utils";

const RESSENTIS = ["Facile", "Juste", "Trop dur"];
const CONSEIL = [
  ["Trop facile pour l'effort visé.", "La fois suivante, monte la charge : c'est la règle de surcharge."],
  ["Exactement la cible.", "Garde cette charge, l'effort visé montera tout seul."],
  ["Au-dessus de la cible.", "Redescends d'un cran la fois suivante."],
];

/* Champ numérique : texte local pendant la saisie, validé à la sortie. */
function Champ({ valeur, onValide, label, mode, depuis }: { valeur: string; onValide: (v: string) => void; label: string; mode: "decimal" | "numeric"; depuis: number }) {
  /* Monté avec key={valeur} : une valeur venue d'ailleurs (report sur les séries suivantes) réinitialise le champ.
     Ce remontage fait « rouler » le chiffre, sauf à l'ouverture de la carte. */
  const [t, setT] = useState(valeur);
  const rouler = useCallback((el: HTMLInputElement | null) => {
    if (el && performance.now() - depuis > 500 && !mouvementReduit())
      el.animate([{ transform: "translateY(-40%)", opacity: 0 }, { transform: "none", opacity: 1 }], { duration: 280, easing: "cubic-bezier(.2,.9,.25,1.15)" });
  }, [depuis]);
  return (
    <input
      ref={rouler}
      value={t}
      inputMode={mode}
      enterKeyHint="next"
      aria-label={label}
      onFocus={(e) => e.currentTarget.select()}
      onChange={(e) => setT(e.target.value)}
      onBlur={() => { if (t !== valeur) onValide(t); }}
      onKeyDown={(e) => { if (e.key === "Enter") e.currentTarget.blur(); }}
      className="num h-10 w-full min-w-0 rounded-[10px] bg-muted text-center text-[19px] font-semibold outline-none transition-colors focus:bg-background focus:ring-2 focus:ring-plate"
    />
  );
}

/* Tableau des séries façon Hevy / Strong : # · précédent · valeurs · ✓. */
export function TableauSeries({ c, rpe, onReplier, onFini }: { c: Ctx; rpe: number; onReplier: () => void; onFini?: () => void }) {
  const L: Journal | undefined = useRepere((s) => s.etat.LOG[c.k]);
  const muter = useRepere((s) => s.muter);
  const lancer = useRepos((s) => s.lancer);
  const [depuis] = useState(() => performance.now());
  const [vient, setVient] = useState<number | null>(null); // série qui vient d'être validée
  const [records, setRecords] = useState<number[]>([]);

  const valider = (n: number, s: Serie, bouton: HTMLElement) => {
    const avant = useRepere.getState().etat.LOG;
    const fini = !!avant[c.k]?.done, rec = !(L && okDe(L, s)) && estRecord(avant, c.id, c.k, s);
    let valide = false;
    muter((E) => { valide = act.serOk(E, c, n); });
    setVient(valide ? n : null);
    setRecords((r) => (valide && rec ? [...r, n] : r.filter((x) => x !== n)));
    if (valide) {
      useCelebrer.getState().marquerDebut(seanceDe(c.k));
      lancer(secondesDe(c.repos));
      if (rec) {
        useCelebrer.getState().ajouterRecord(seanceDe(c.k));
        const b = bouton.getBoundingClientRect();
        gerbe(b.left + b.width / 2, b.top + b.height / 2);
        try { navigator.vibrate?.([14, 60, 28]); } catch {}
      } else tactile(12);
    } else tactile(6);
    if (!fini && useRepere.getState().etat.LOG[c.k]?.done) onFini?.();
  };
  const x = EX[c.id], dbl = ["kg", "lest"].includes(x.ch);
  const lestable = !dbl && LESTABLE.has(c.id), avecLest = lestable && (L ? !!L.lest : !!c.prev?.lest);
  const Pp = c.prev?.series || [];
  const S: Serie[] = L
    ? seriesDe(structuredClone(L), c.n)
    : Array.from({ length: c.n }, (_, n) => ({ ...c.base, lest: avecLest ? +((Pp[n] || Pp[Pp.length - 1] || ({} as Serie)).lest ?? 0) || 0 : undefined }));
  const tete = { kg: "kg", lest: "lest", aucune: "réps", temps: "sec", dist: "m" }[x.ch];
  const P2 = c.prev?.series?.length ? c.prev.series : c.prev ? [{ v: maxV(c.prev), reps: c.prev.reps ?? 0 }] : [];
  const why = L ? L.why : c.why, done = !!L?.done;
  const cols = dbl || avecLest ? "grid-cols-[22px_minmax(0,1.25fr)_minmax(0,1fr)_minmax(0,1fr)_40px]" : "grid-cols-[22px_minmax(0,1.25fr)_minmax(0,1.4fr)_40px]";

  return (
    <div className="px-3 pb-3">
      {why && <p className="mx-1 mb-2 text-[13px] leading-snug text-muted-foreground">{why}</p>}
      <div className={cn("grid items-center gap-x-2 px-1 pb-1.5 text-[10.5px] font-medium tracking-[0.1em] text-muted-foreground uppercase", cols)}>
        <span>#</span>
        <span>Précédent</span>
        <span className="text-center">{tete}</span>
        {(dbl || avecLest) && <span className="text-center">{dbl ? "réps" : "+ kg"}</span>}
        <span />
      </div>
      <div className="flex flex-col gap-1">
        {S.map((s, n) => {
          const ok = !!L && okDe(L, s), record = ok && records.includes(n);
          return (
            <div key={n} className={cn("relative isolate grid items-center gap-x-2 overflow-hidden rounded-xl px-1 py-1", cols)}>
              {/* fond jaune : il se remplit de gauche à droite quand on valide */}
              {ok && <span aria-hidden className={cn("absolute inset-0 -z-10 origin-left bg-plate-soft", vient === n && "animate-[remplir_.42s_cubic-bezier(.2,.8,.2,1)]")} />}
              <span className={cn("num text-center text-[15px] font-bold transition-colors", ok ? "text-foreground" : "text-muted-foreground")}>{n + 1}</span>
              {record ? (
                <span className="inline-flex w-fit animate-[pop_.5s_cubic-bezier(.3,1.6,.5,1)] items-center rounded-full bg-plate px-2 py-0.5 text-[11px] font-bold tracking-wide text-plate-foreground uppercase">
                  Record
                </span>
              ) : (
                <span className="truncate text-[13px] text-muted-foreground">{fmtSerie(x, P2[n] || P2[P2.length - 1])}</span>
              )}
              <Champ depuis={depuis} key={"v" + s.v} valeur={nb(s.v)} mode="decimal" label={`${tete} série ${n + 1}`} onValide={(v) => muter((E) => act.serVal(E, c, n, "v", v))} />
              {dbl && <Champ depuis={depuis} key={"r" + s.reps} valeur={String(s.reps)} mode="numeric" label={`répétitions série ${n + 1}`} onValide={(v) => muter((E) => act.serVal(E, c, n, "reps", v))} />}
              {!dbl && avecLest && <Champ depuis={depuis} key={"l" + s.lest} valeur={nb(+(s.lest ?? 0) || 0)} mode="decimal" label={`lest série ${n + 1}`} onValide={(v) => muter((E) => act.serVal(E, c, n, "lest", v))} />}
              <button
                onClick={(e) => valider(n, s, e.currentTarget)}
                aria-label={`${ok ? "Décocher" : "Valider"} la série ${n + 1}`}
                aria-pressed={ok}
                className={cn(
                  "grid size-10 place-items-center rounded-full border-2 transition-[background-color,border-color,color] duration-200 active:scale-90",
                  ok ? "border-plate bg-plate text-plate-foreground" : "border-border text-transparent hover:text-muted-foreground",
                  vient === n && "animate-[pop_.45s_cubic-bezier(.3,1.6,.5,1)]",
                )}
              >
                <CheckIcon className="size-[18px]" weight="bold" />
              </button>
            </div>
          );
        })}
      </div>

      {lestable && (
        <button
          onClick={() => muter((E) => (avecLest ? act.retirerLest(E, c) : act.ajouterLest(E, c)))}
          className="mt-2 ml-1 inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-[13px] font-medium text-muted-foreground hover:text-foreground"
        >
          {avecLest ? <XIcon className="size-3.5" /> : <PlusIcon className="size-3.5" />}
          {avecLest ? "Retirer le lest" : "Ajouter un lest (disque, haltère…)"}
        </button>
      )}

      {done && (
        <div className="mt-3 rounded-2xl bg-muted/70 p-3">
          {rpe > 0 && (
            <>
              <div className="mb-2 text-[13px] font-medium">C&apos;était comment pour un RPE {rpe} ?</div>
              <div className="grid grid-cols-3 gap-1 rounded-xl bg-background p-1">
                {RESSENTIS.map((f, j) => (
                  <button
                    key={f}
                    onClick={() => { tactile(); muter((E) => act.setFeel(E, c.k, j)); }}
                    aria-pressed={L?.feel === j}
                    className={cn(
                      "h-9 rounded-lg text-[13px] font-medium transition-colors",
                      L?.feel === j ? "bg-foreground text-background shadow-sm" : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {f}
                  </button>
                ))}
              </div>
              {L?.feel != null && (
                <p className="mt-2 text-[13px] leading-snug text-muted-foreground">
                  <b className="font-semibold text-foreground">{CONSEIL[L.feel][0]}</b> {CONSEIL[L.feel][1]}
                </p>
              )}
            </>
          )}
          <button onClick={onReplier} className="mt-2 w-full rounded-lg py-1.5 text-[13px] font-medium text-muted-foreground hover:text-foreground">
            Replier
          </button>
        </div>
      )}
    </div>
  );
}
