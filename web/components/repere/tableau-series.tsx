"use client";

import { Pourquoi } from "./role-exercice";
import { loc, tr } from "@/lib/i18n";
import { ConseilZone } from "./forme";
import { useCallback, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { CheckIcon, PlayIcon, PlusIcon, TrophyIcon, XIcon } from "@phosphor-icons/react";
import { departCourse, Minuteur, preparer, type Course } from "./minuteur";
import type { Phase } from "@/lib/logic/cardio";
import { CHANGE, PREPA, tempsTenu } from "@/lib/logic/tenue";
import { EX } from "@/lib/data/exercices";
import { LESTABLE } from "@/lib/data/referentiels";
import { fmtMax, fmtSerie, journalActif, maxV, nb, okDe, secondesDe, seriesDe, type Ctx } from "@/lib/logic/core";
import * as act from "@/lib/logic/actions";
import type { Journal, Serie } from "@/lib/logic/types";
import { useRepere } from "@/lib/store";
import { tactile, useRepos } from "@/lib/repos";
import { estRecord } from "@/lib/logic/records";
import { gerbe, mouvementReduit, seanceDe, useCelebrer } from "@/lib/celebrer";
import { cn } from "@/lib/utils";

const RESSENTIS = [tr("Facile"), tr("Juste"), tr("Trop dur")];
const CONSEIL = [
  [tr("Trop facile pour l'effort visé."), tr("La fois suivante, Oxa monte la charge d'un cran : c'est la règle de surcharge.")],
  [tr("Exactement la cible."), tr("Oxa garde la progression prévue.")],
  [tr("Au-dessus de la cible."), tr("La fois suivante, Oxa redescend d'un cran.")],
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
      className="num h-11 w-full min-w-0 rounded-[10px] border border-champ-bord bg-champ text-center text-[22px] font-bold outline-none transition-colors focus:border-plate focus:bg-background focus:ring-2 focus:ring-plate"
    />
  );
}

/* Exercice tenu en durée : 10 s pour se mettre en place, puis la durée de la série. Tenu côté par
   côté (gainage latéral, étirements d'un côté) : la durée vaut pour chaque côté, le chrono enchaîne
   le côté gauche, 5 s pour changer de côté, puis le côté droit. */
const phasesChrono = (nom: string, cible: number, cote?: boolean): Phase[] => cote ? [
  { type: "pause", titre: tr("Prépare-toi"), duree: PREPA, rpe: "", consigne: tr("Mets-toi en position côté gauche : {nom}", { nom }) },
  { type: "effort", titre: tr("Côté gauche"), duree: cible, rpe: "", consigne: nom },
  { type: "pause", titre: tr("Change de côté"), duree: CHANGE, rpe: "", consigne: tr("Passe sur l'autre côté : {nom}", { nom }) },
  { type: "effort", titre: tr("Côté droit"), duree: cible, rpe: "", consigne: nom },
] : [
  { type: "pause", titre: tr("Prépare-toi"), duree: PREPA, rpe: "", consigne: tr("Mets-toi en position : {nom}", { nom }) },
  { type: "effort", titre: tr("Tiens"), duree: cible, rpe: "", consigne: nom },
];

/* Les séries affichées : celles du journal, sinon la proposition (lest du dernier passage s'il y en avait). */
function seriesAffichees(c: Ctx, L: Journal | undefined): Serie[] {
  const x = EX[c.id], dbl = ["kg", "lest"].includes(x.ch);
  const lestable = !dbl && LESTABLE.has(c.id), avecLest = lestable && (L ? !!L.lest : !!c.prev?.lest);
  const Pp = c.prev?.series || [];
  return L
    ? seriesDe(structuredClone(L), c.n)
    : Array.from({ length: c.n }, (_, n) => ({ ...c.base, lest: avecLest ? +((Pp[n] || Pp[Pp.length - 1] || ({} as Serie)).lest ?? 0) || 0 : undefined }));
}

/* Valider (ou décocher) la série n : journal, repos, record. Partagé par le tableau et la barre du bas. */
/* superset : `o.enchaine` (le nom du second exercice) titre le repos, `o.onValide` ouvre l'autre exercice */
/* `o.attendre` (un RPE à noter) : l'exercice tout juste terminé reste ouvert sur la question du ressenti ;
   c'est la réponse (« Continuer ») qui passe à la suite */
type Enchainement = { enchaine?: string; onValide?: () => void; attendre?: boolean; garder?: () => void };
function validerSerie(c: Ctx, n: number, s: Serie, bouton: HTMLElement, onFini?: () => void, o: Enchainement = {}) {
  const avant = useRepere.getState().etat.LOG, L = journalActif(avant[c.k]);
  const fini = !!avant[c.k]?.done, rec = !(L && okDe(L, s)) && estRecord(avant, c.id, c.k, s);
  let valide = false;
  useRepere.getState().muter((E) => { valide = act.serOk(E, c, n); });
  if (valide) {
    useCelebrer.getState().marquerDebut(seanceDe(c.k));
    useRepos.getState().lancer(secondesDe(c.repos), o.enchaine ? tr("Enchaîne · {n}", { n: o.enchaine }) : undefined);
    if (rec) {
      useCelebrer.getState().ajouterRecord(seanceDe(c.k));
      const b = bouton.getBoundingClientRect();
      gerbe(b.left + b.width / 2, b.top + b.height / 2);
      try { navigator.vibrate?.([14, 60, 28]); } catch {}
    } else tactile(12);
  } else tactile(6);
  const termine = !fini && !!useRepere.getState().etat.LOG[c.k]?.done;
  if (termine && o.attendre) { o.garder?.(); return { valide, rec }; }
  if (valide) o.onValide?.();
  if (termine) onFini?.();
  return { valide, rec };
}

/* Mode séance : la série à faire de l'exercice ouvert, validée d'un toucher, en barre fixe en bas.
   Elle laisse la place au minuteur de repos ; pas de barre pour un exercice tenu en durée (son
   chrono se lance dans le tableau). */
export function BarreSerie({ c, onFini, etiquette, rpe = 0, ...o }: { c: Ctx | null; onFini?: () => void; etiquette?: string; rpe?: number } & Enchainement) {
  const fin = useRepos((s) => s.fin), finiRepos = useRepos((s) => s.fini);
  const brut = useRepere((s) => (c ? s.etat.LOG[c.k] : undefined));
  if (!c || fin || finiRepos) return null;
  const x = EX[c.id], L = journalActif(brut);
  if (!x || x.ch === "temps" || L?.done) return null;
  const S = seriesAffichees(c, L), n = S.findIndex((t) => !(L && okDe(L, t)));
  if (n < 0) return null;
  const unite = x.ch === "kg" ? " kg" : x.ch === "lest" ? tr(" kg de lest") : "";
  const quoi = (["kg", "lest"].includes(x.ch) ? `${nb(S[n].v)}${unite} × ${S[n].reps}` : fmtSerie(x, S[n]) + (x.ch === "aucune" ? tr(" réps") : "")) + (x.cote ? tr(" / côté") : "");
  return (
    <div className="fixed inset-x-0 bottom-[max(env(safe-area-inset-bottom),12px)] z-30 mx-auto max-w-[480px] px-3 animate-in slide-in-from-bottom-4 fade-in-0 duration-300">
      {/* noire en clair ; en sombre, une carte surélevée plutôt qu'un bloc blanc qui éblouit */}
      <div className="flex items-center gap-3 rounded-[24px] border border-transparent bg-[#0a0a0c] py-2.5 pr-2.5 pl-[18px] text-[#f5f5f7] shadow-[0_14px_30px_-12px_rgba(0,0,0,.5)] dark:border-border dark:bg-[#26262d]">
        <div className="min-w-0 flex-1">
          <div className="truncate text-[12.5px] font-medium text-[#f5f5f7]/70">{etiquette && `${etiquette} · `}{tr("Série {a}/{b}", { a: n + 1, b: S.length })} · {x.n}</div>
          <div className="num truncate text-[28px] leading-[1.05] font-bold">{quoi}</div>
        </div>
        <button
          onClick={(e) => validerSerie(c, n, S[n], e.currentTarget, onFini, { ...o, attendre: rpe > 0 })}
          className="flex h-[52px] shrink-0 items-center gap-1.5 rounded-full bg-plate px-5 text-[16px] font-bold text-plate-foreground active:scale-95"
        >
          <CheckIcon className="size-[18px]" weight="bold" />{tr("Valider")}
        </button>
      </div>
    </div>
  );
}

/* Tableau des séries façon Hevy / Strong : # · précédent · valeurs · (chrono) · ✓. */
export function TableauSeries({ c, rpe, onReplier, onFini, ...o }: { c: Ctx; rpe: number; onReplier: () => void; onFini?: () => void } & Enchainement) {
  const L: Journal | undefined = journalActif(useRepere((s) => s.etat.LOG[c.k]));
  const muter = useRepere((s) => s.muter);
  const [depuis] = useState(() => performance.now());
  const [vient, setVient] = useState<number | null>(null); // série qui vient d'être validée
  const [records, setRecords] = useState<number[]>([]);
  const [chrono, setChrono] = useState<{ n: number; s: Serie; course: Course } | null>(null);
  const boutons = useRef<Record<number, HTMLElement | null>>({});

  const valider = (n: number, s: Serie, bouton: HTMLElement) => {
    const { valide, rec } = validerSerie(c, n, s, bouton, onFini, { ...o, attendre: rpe > 0 });
    setVient(valide ? n : null);
    setRecords((r) => (valide && rec ? [...r, n] : r.filter((x) => x !== n)));
  };
  const x = EX[c.id], dbl = ["kg", "lest"].includes(x.ch);
  const lestable = !dbl && LESTABLE.has(c.id), avecLest = lestable && (L ? !!L.lest : !!c.prev?.lest);
  const S = seriesAffichees(c, L);
  const tete = { kg: "kg", lest: "lest", aucune: x.cote ? tr("réps / côté") : tr("réps"), temps: x.cote ? tr("sec / côté") : "sec", dist: "m" }[x.ch];
  const P2 = c.prev?.series?.length ? c.prev.series : c.prev ? [{ v: maxV(c.prev), reps: c.prev.reps ?? 0 }] : [];
  const why = L ? L.why : c.why, done = !!L?.done;
  const temps = x.ch === "temps";
  const cols = dbl || avecLest
    ? (temps ? "grid-cols-[22px_minmax(0,1.25fr)_minmax(0,1fr)_minmax(0,1fr)_44px_44px]" : "grid-cols-[22px_minmax(0,1.25fr)_minmax(0,1fr)_minmax(0,1fr)_44px]")
    : (temps ? "grid-cols-[22px_minmax(0,1.25fr)_minmax(0,1.4fr)_44px_44px]" : "grid-cols-[22px_minmax(0,1.25fr)_minmax(0,1.4fr)_44px]");
  /* fin du chrono : le temps tenu est inscrit dans la série, qui est validée */
  const finChrono = (n: number, s: Serie, e: number) => {
    const tenu = tempsTenu(s.v, e, !!x.cote);
    muter((E) => act.serVal(E, c, n, "v", String(tenu)));
    const el = boutons.current[n];
    if (el) valider(n, { ...s, v: tenu }, el);
  };

  return (
    <div className="px-3 pb-3">
      <ConseilZone id={c.id} />
      {why && (
        <Pourquoi titre={x.ch === "kg" && (!L || +(S[0]?.v ?? 0) === +c.base.v) ? tr("Pourquoi {v} kg ?", { v: nb(c.base.v) }) : tr("Pourquoi cette proposition ?")} className="mx-1 mb-2">{why}</Pourquoi>
      )}
      {/* ton max sur l'exercice, quand il dépasse ce que montre « Précédent » */}
      {c.max && (
        <p className="mx-1 mb-2 inline-flex items-center gap-1.5 rounded-full bg-plate-soft px-3 py-1 text-[13px] font-semibold text-plate-ink dark:text-plate">
          <TrophyIcon className="size-4 shrink-0" weight="fill" />
          {tr("Ton record : {a}", { a: fmtMax(c.id, c.max) })}
          <span className="font-medium text-muted-foreground">· {tr("le {d}", { d: new Date(c.max.d + "T12:00").toLocaleDateString(loc(), { day: "numeric", month: "short" }).replace(".", "") })}</span>
        </p>
      )}
      <div className={cn("grid items-center gap-x-2 px-1 pb-1.5 text-[11px] font-semibold tracking-[0.1em] text-muted-foreground uppercase", cols)}>
        <span>#</span>
        <span>{tr("Précédent")}</span>
        <span className="text-center">{tete}</span>
        {(dbl || avecLest) && <span className="text-center">{dbl ? (x.cote ? tr("réps / côté") : tr("réps")) : tr("+ kg")}</span>}
        {temps && <span />}
        <span />
      </div>
      <div className="flex flex-col gap-1.5">
        {S.map((s, n) => {
          const ok = !!L && okDe(L, s), record = ok && records.includes(n);
          /* la série à faire : la première qui n'est pas cochée, cerclée pour qu'on la trouve d'un coup d'œil */
          const prochaine = !done && n === S.findIndex((t) => !(L && okDe(L, t)));
          return (
            <div key={n} aria-current={prochaine ? "step" : undefined} className={cn("relative isolate grid items-center gap-x-2 overflow-hidden rounded-xl px-1 py-1", cols)}>
              {/* fond jaune : il se remplit de gauche à droite quand on valide */}
              {ok && <span aria-hidden className={cn("absolute inset-0 -z-10 origin-left bg-plate-soft", vient === n && "animate-[remplir_.42s_cubic-bezier(.2,.8,.2,1)]")} />}
              <span className={cn("num text-center text-[18px] font-bold transition-colors", prochaine ? "text-plate-ink dark:text-plate" : "text-foreground")}>{n + 1}</span>
              {record ? (
                <span className="inline-flex w-fit animate-[pop_.5s_cubic-bezier(.3,1.6,.5,1)] items-center rounded-full bg-plate px-2 py-0.5 text-[11px] font-bold tracking-wide text-plate-foreground uppercase">
                  {tr("Record")}
                </span>
              ) : (
                <span className="num truncate text-[16px] font-semibold text-muted-foreground">{fmtSerie(x, P2[n] || P2[P2.length - 1])}</span>
              )}
              <Champ depuis={depuis} key={"v" + s.v} valeur={nb(s.v)} mode="decimal" label={tr("{tete} série {a}", { tete, a: n + 1 })} onValide={(v) => muter((E) => act.serVal(E, c, n, "v", v))} />
              {dbl && <Champ depuis={depuis} key={"r" + s.reps} valeur={String(s.reps)} mode="numeric" label={tr("répétitions série {a}", { a: n + 1 })} onValide={(v) => muter((E) => act.serVal(E, c, n, "reps", v))} />}
              {!dbl && avecLest && <Champ depuis={depuis} key={"l" + s.lest} valeur={nb(+(s.lest ?? 0) || 0)} mode="decimal" label={tr("lest série {a}", { a: n + 1 })} onValide={(v) => muter((E) => act.serVal(E, c, n, "lest", v))} />}
              {temps && (ok ? <span /> : (
                <button
                  onClick={() => { preparer(); setChrono({ n, s: { ...s, v: +s.v > 0 ? +s.v : 30 }, course: departCourse() }); }}
                  aria-label={tr("Lancer le chrono de la série {a}", { a: n + 1 })}
                  className="grid size-11 place-items-center rounded-full bg-plate-soft text-plate-ink active:scale-90"
                >
                  <PlayIcon className="size-[17px]" weight="fill" />
                </button>
              ))}
              <button
                ref={(el) => { boutons.current[n] = el; }}
                onClick={(e) => valider(n, s, e.currentTarget)}
                aria-label={tr("{a} la série {a1}", { a: ok ? tr("Décocher") : tr("Valider"), a1: n + 1 })}
                aria-pressed={ok}
                className={cn(
                  "grid size-11 place-items-center rounded-full border-2 transition-[background-color,border-color,color] duration-200 active:scale-90",
                  ok ? "border-plate bg-plate text-plate-foreground" : prochaine ? "border-[2.5px] border-plate-ink text-transparent hover:text-plate-ink dark:border-plate" : "border-champ-bord text-transparent hover:text-muted-foreground",
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
          {avecLest ? tr("Retirer le lest") : tr("Ajouter un lest (disque, haltère…)")}
        </button>
      )}

      {done && (
        <div className="mt-3 rounded-2xl bg-muted/70 p-3">
          {rpe > 0 && (
            <>
              <div className="mb-2 text-[13px] font-medium">{tr("C'était comment pour un RPE {rpe} ?", { rpe })}</div>
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
          {/* la suite (exercice suivant, ou le bilan après le dernier) : quand on a répondu, ou pour passer */}
          {onFini && rpe > 0 ? (
            <div className="mt-2 flex gap-2">
              <button onClick={onReplier} className="h-10 flex-1 rounded-lg text-[13px] font-medium text-muted-foreground hover:text-foreground">{tr("Replier")}</button>
              <button onClick={() => { tactile(8); onFini(); }} className={cn("h-10 flex-[1.4] rounded-full text-[14px] font-semibold active:scale-[.98]", L?.feel != null ? "bg-plate text-plate-foreground" : "bg-background text-foreground")}>
                {L?.feel != null ? tr("Continuer") : tr("Passer")}
              </button>
            </div>
          ) : (
            <button onClick={onReplier} className="mt-2 w-full rounded-lg py-1.5 text-[13px] font-medium text-muted-foreground hover:text-foreground">
              {tr("Replier")}
            </button>
          )}
        </div>
      )}
      {chrono && createPortal(
        <Minuteur
          phases={phasesChrono(x.n, chrono.s.v, !!x.cote)} titre={tr("Série {a}", { a: chrono.n + 1 })}
          course={chrono.course} setCourse={(co) => setChrono((ch) => (co && ch ? { ...ch, course: co } : null))}
          seuil={PREPA + 1} arret={{ titre: tr("Arrêter le chrono ?"), texte: tr("Le temps tenu est inscrit dans la série.") }}
          onFin={(e) => finChrono(chrono.n, chrono.s, e)}
        />,
        document.body,
      )}
    </div>
  );
}
