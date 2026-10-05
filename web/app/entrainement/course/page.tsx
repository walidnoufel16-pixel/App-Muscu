"use client";

/* Préparation course : le plan semaine par semaine (sans paramètre), ou une séance
   (?s=semaine|séance) avec son minuteur guidé et la saisie de la sortie. */
import { Suspense, useMemo, useState } from "react";
import type { Route } from "next";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowRightIcon, BarbellIcon, CaretDownIcon, CaretRightIcon, CheckIcon, FlagCheckeredIcon, PauseIcon, PencilSimpleIcon, PersonSimpleRunIcon, PlayIcon, TimerIcon, TrashIcon,
} from "@phosphor-icons/react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { EnTete } from "@/components/repere/en-tete";
import { Retour, useRetour } from "@/components/repere/retour";
import { confirmer } from "@/components/repere/confirmer";
import { Minuteur, departCourse, preparer, type Course } from "@/components/repere/minuteur";
import { SaisieSortie } from "@/components/repere/course";
import { mmss } from "@/components/repere/reglages-cardio";
import {
  allures, allureDe, allureTxt, chronoTxt, DISTANCES, enPause, genererPlan, joursAvantCourse, NOMS_PHASE, reprendre, semaineDe, tempsPrevu, vdotDe,
  type SeanceCourse, type SemaineCourse, type Sortie, type TypeSeance,
} from "@/lib/logic/course";
import { dureeTotale } from "@/lib/logic/cardio";
import { decaler, jourDe } from "@/lib/logic/historique";
import { useRepere } from "@/lib/store";
import { AVANT } from "@/lib/nav";
import { tactile } from "@/lib/repos";
import { cn } from "@/lib/utils";

const ICONES: Record<TypeSeance, typeof PersonSimpleRunIcon> = {
  footing: PersonSimpleRunIcon, lignes: PersonSimpleRunIcon, longue: PersonSimpleRunIcon, seuil: TimerIcon, vma: TimerIcon, allure: TimerIcon, course: FlagCheckeredIcon, renfo: BarbellIcon,
};
const court = (j: string) => new Date(j + "T12:00").toLocaleDateString("fr-FR", { day: "numeric", month: "short" }).replace(".", "");
const kmTxt = (km: number) => String(Math.round(km * 10) / 10).replace(".", ",");

export default function PageCourse() {
  return <Suspense><Preparation /></Suspense>;
}

function Preparation() {
  const s = useSearchParams().get("s");
  return s ? <Seance cle={s} /> : <Plan />;
}

/* séance de renfo faite cette semaine-là ? (historique de la séance libre « Renfo coureur ») */
function useRenfo() {
  const etat = useRepere((x) => x.etat);
  return (S: SemaineCourse, r: 0 | 1) => {
    const nom = r === 0 ? "Renfo coureur A" : "Renfo coureur B", idx = etat.SEANCES.findIndex((x) => x.nom === nom);
    const fin = decaler(S.lundi, 6);
    return { idx, faite: idx >= 0 && (etat.HIST || []).some((l) => l.s === `L|${idx}` && l.d >= S.lundi && l.d <= fin) };
  };
}

/* ---------------- le plan ---------------- */
function Plan() {
  const router = useRouter();
  const etat = useRepere((x) => x.etat);
  const muter = useRepere((x) => x.muter);
  const retour = useRetour("/entrainement");
  const renfo = useRenfo();
  const [auj] = useState(() => jourDe(Date.now()));
  const [ouverte, setOuverte] = useState<number | null>(null);
  const [libre, setLibre] = useState(false);
  const c = etat.COURSE;
  const P = useMemo(() => (c ? genererPlan(c) : []), [c]);
  if (!c || !P.length)
    return (
      <>
        <EnTete titre="Préparation course" gauche={<Retour repli="/entrainement" />} />
        <div className="px-4">
          <p className="text-[15px] text-muted-foreground">Aucune préparation en cours.</p>
          <Button variant="plate" size="lg" className="mt-4 w-full rounded-xl" onClick={() => router.push("/entrainement/assistant?type=course" as Route, AVANT)}>Préparer une course</Button>
        </div>
      </>
    );
  const S = etat.SORTIES || [];
  const k = semaineDe(c, auj, P.length), J = joursAvantCourse(c, auj), V = vdotDe(c), A = allures(V), pause = enPause(c);
  const faite = (kk: number, j: number) => S.find((x) => x.s === `${kk}|${j}`);

  const basculerPause = () => {
    tactile(10);
    if (pause) {
      let msg = "";
      muter((E) => { if (E.COURSE) msg = reprendre(E.COURSE, auj, P.length); });
      toast.success("Plan repris", { description: msg, duration: 6000 });
    } else {
      muter((E) => { E.COURSE?.pauses.push({ de: auj }); });
      toast("Plan en pause", { description: "Soigne-toi. À la reprise, le volume sera réduit." });
    }
  };
  const supprimer = async () => {
    if (!(await confirmer({ titre: "Supprimer la préparation ?", texte: "Le plan disparaît ; tes sorties notées restent dans ton historique.", ok: "Supprimer", danger: true }))) return;
    muter((E) => { E.COURSE = null; });
    retour();
  };

  return (
    <>
      <EnTete
        surtitre={`${DISTANCES[c.obj].nom} · ${new Date(c.date + "T12:00").toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })}`}
        titre={J > 0 ? `J-${J}` : J === 0 ? "C'est aujourd'hui" : "Course passée"}
        gauche={<Retour repli="/entrainement" />}
      />
      <div className="flex flex-col gap-5 px-4 pb-10">
        <div className="grid grid-cols-2 gap-2">
          {[["Chrono estimé", chronoTxt(tempsPrevu(V, DISTANCES[c.obj].km))], ["Allure course", allureTxt(c.obj === "10k" ? A.dix : c.obj === "semi" ? A.semi : A.marathon)], ["Footing", allureTxt(A.facile)], ["Seuil", allureTxt(A.seuil)]].map(([n, v]) => (
            <div key={n} className="rounded-[18px] border border-border/80 bg-card p-3">
              <div className="text-[12px] text-muted-foreground">{n}</div>
              <div className="num text-[22px] leading-tight font-bold">{v}</div>
            </div>
          ))}
        </div>

        {pause ? (
          <div className="rounded-[20px] border border-amber-500/40 bg-amber-500/10 p-4">
            <b className="text-[15px]">Plan en pause depuis le {court(c.pauses.at(-1)!.de)}</b>
            <p className="mt-1 text-[13px] leading-snug">Prends le temps de guérir. À la reprise, le volume repart plus bas pendant deux semaines.</p>
            <Button variant="plate" size="lg" className="mt-3 w-full rounded-xl" onClick={basculerPause}><PlayIcon weight="fill" />Reprendre le plan</Button>
          </div>
        ) : null}

        <section>
          <div className="mb-2 flex items-baseline justify-between px-1">
            <h2 className="eyebrow">{auj < c.debut ? `Démarre le ${court(c.debut)}` : `Semaine ${k + 1} sur ${P.length} · ${NOMS_PHASE[P[k].phase]}`}</h2>
            {P[k].allegee && <span className="text-[12px] font-semibold text-success">semaine allégée</span>}
          </div>
          <div className="overflow-hidden rounded-[20px] border border-border/80 bg-card">
            {P[k].seances.map((x, j) => {
              const I = ICONES[x.type], f = x.type === "renfo" ? renfo(P[k], x.renfo!).faite : !!faite(k, j);
              return (
                <button key={j} disabled={pause} onClick={() => router.push(`/entrainement/course?s=${k}|${j}` as Route, AVANT)}
                  className={cn("flex w-full items-center gap-3 px-4 py-3 text-left active:bg-muted disabled:opacity-50", j && "border-t border-border/70")}>
                  <span className={cn("grid size-9 shrink-0 place-items-center rounded-[11px]", f ? "bg-plate text-plate-foreground" : "bg-muted text-muted-foreground")}>
                    {f ? <CheckIcon className="size-4" weight="bold" /> : <I className="size-[18px]" weight="fill" />}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[15px] font-semibold">{x.titre}</span>
                    <span className="block truncate text-[12.5px] text-muted-foreground">{resume(x)}</span>
                  </span>
                  <CaretRightIcon className="size-4 text-muted-foreground" />
                </button>
              );
            })}
          </div>
          <div className="mt-2 grid grid-cols-2 gap-2">
            <Button variant="soft" className="h-11 rounded-xl border border-border/80 bg-card" onClick={() => setLibre(true)}><PencilSimpleIcon />Sortie libre</Button>
            {!pause && <Button variant="soft" className="h-11 rounded-xl border border-border/80 bg-card" onClick={basculerPause}><PauseIcon weight="fill" />Mettre en pause</Button>}
          </div>
        </section>

        <section>
          <h2 className="eyebrow mb-2 px-1">Tout le plan</h2>
          <div className="overflow-hidden rounded-[20px] border border-border/80 bg-card">
            {P.map((W) => {
              const ouv = ouverte === W.k, fait = W.seances.filter((x, j) => x.type !== "renfo" && faite(W.k, j)).length, total = W.seances.filter((x) => x.type !== "renfo").length;
              return (
                <div key={W.k} className={cn(W.k && "border-t border-border/70", W.k === k && "bg-plate-soft/40")}>
                  <button onClick={() => setOuverte(ouv ? null : W.k)} aria-expanded={ouv} className="flex w-full items-center gap-3 px-4 py-2.5 text-left">
                    <span className="num w-7 text-[17px] font-bold text-muted-foreground">{W.k + 1}</span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-[14px] font-medium">{NOMS_PHASE[W.phase]}{W.allegee ? " · allégée" : ""}</span>
                      <span className="block text-[12px] text-muted-foreground">{court(W.lundi)} · {W.long ? `sortie longue ${kmTxt(W.long)} km` : "course"}{W.k <= k ? ` · ${fait}/${total} faites` : ""}</span>
                    </span>
                    <CaretDownIcon className={cn("size-4 text-muted-foreground transition-transform", ouv && "rotate-180")} />
                  </button>
                  {ouv && (
                    <ul className="flex flex-col gap-1 px-4 pb-3 pl-14">
                      {W.seances.map((x, j) => <li key={j} className="text-[13px]"><b className="font-semibold">{x.titre}</b> <span className="text-muted-foreground">· {resume(x)}</span></li>)}
                    </ul>
                  )}
                </div>
              );
            })}
          </div>
        </section>
        <p className="px-2 text-center text-[12px] leading-relaxed text-muted-foreground">
          80 % de ton entraînement est facile : c&apos;est voulu. Les séances sont numérotées, fais-les dans l&apos;ordre aux jours qui t&apos;arrangent, en évitant deux séances dures d&apos;affilée.
        </p>
        <Button variant="ghost" className="text-destructive" onClick={supprimer}><TrashIcon />Supprimer la préparation</Button>
      </div>
      <SaisieSortie key={libre ? "o" : "f"} ouvert={libre} onClose={() => setLibre(false)} />
    </>
  );
}

function resume(x: SeanceCourse) {
  if (x.type === "renfo") return "25 min · mollets, fessiers, gainage";
  if (x.type === "course") return `${kmTxt(x.km!)} km · objectif ${allureTxt(x.allure!)}`;
  if (x.type === "longue") return `${kmTxt(x.km!)} km · environ ${x.min} min`;
  return `${x.min} min${x.allure ? ` · ${allureTxt(x.allure)}` : ""}`;
}

/* ---------------- une séance ---------------- */
function Seance({ cle }: { cle: string }) {
  const router = useRouter();
  const etat = useRepere((x) => x.etat);
  const renfo = useRenfo();
  const [course, setCourse] = useState<Course | null>(null);
  const [saisie, setSaisie] = useState<number | null>(null); // durée proposée (min), ou 0
  const c = etat.COURSE;
  const P = useMemo(() => (c ? genererPlan(c) : []), [c]);
  const [k, j] = cle.split("|").map(Number);
  const W = P[k], x = W?.seances[j];
  if (!c || !x)
    return (
      <>
        <EnTete titre="Séance introuvable" gauche={<Retour repli="/entrainement/course" />} />
        <p className="px-5 text-[15px] text-muted-foreground">Cette séance n&apos;existe plus dans ton plan.</p>
      </>
    );
  const fait: Sortie | undefined = (etat.SORTIES || []).find((o) => o.s === cle);
  if (course && x.phases)
    return <Minuteur phases={x.phases} titre={x.titre} course={course} setCourse={setCourse} onFin={(e) => setSaisie(Math.max(1, Math.round(e / 60)))} />;
  const I = ICONES[x.type];
  const r = x.type === "renfo" ? renfo(W, x.renfo!) : null;
  return (
    <>
      <EnTete surtitre={`Semaine ${k + 1} · ${NOMS_PHASE[W.phase]}`} titre={x.titre} gauche={<Retour repli="/entrainement/course" />} />
      <div className="flex flex-col gap-4 px-4 pb-32">
        <div className="flex gap-3 rounded-[20px] border border-border/80 bg-card p-4">
          <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-plate-soft text-plate-ink"><I className="size-6" weight="fill" /></span>
          <p className="text-[15px] leading-relaxed">{x.detail}</p>
        </div>
        {fait && (
          <div className="flex items-center gap-3 rounded-[18px] bg-success-soft p-3.5 text-[14px]">
            <CheckIcon className="size-5 text-success" weight="bold" />
            <span>Faite le {court(fait.d)} : <b>{kmTxt(fait.km)} km</b> en {mmss(fait.sec)} · {allureTxt(allureDe(fait))}</span>
          </div>
        )}
        {r?.faite && <div className="flex items-center gap-3 rounded-[18px] bg-success-soft p-3.5 text-[14px]"><CheckIcon className="size-5 text-success" weight="bold" />Faite cette semaine.</div>}
        {x.phases && x.phases.length > 1 && (
          <section>
            <h2 className="eyebrow mb-2 px-1">Déroulé · {Math.round(dureeTotale(x.phases) / 60)} min</h2>
            <ol className="overflow-hidden rounded-[20px] border border-border/80 bg-card">
              {regrouper(x.phases).map((g, i) => (
                <li key={i} className={cn("flex items-baseline justify-between gap-3 px-4 py-2.5 text-[14px]", i && "border-t border-border/70")}>
                  <span className="font-medium">{g.n}</span>
                  <span className="num shrink-0 text-[15px] text-muted-foreground">{g.v}</span>
                </li>
              ))}
            </ol>
          </section>
        )}
        <p className="px-2 text-center text-[12px] leading-relaxed text-muted-foreground">
          Lance le minuteur pour être guidé (signal sonore à chaque changement), ou cours avec ta montre puis note ta sortie.
        </p>
      </div>
      <div className="fixed inset-x-0 bottom-[max(env(safe-area-inset-bottom),14px)] z-30 mx-auto flex max-w-[480px] gap-2 px-4">
        {x.type === "renfo" ? (
          <Button variant="plate" size="xl" className="w-full" disabled={!r || r.idx < 0} onClick={() => router.push(`/entrainement/seance?l=${r!.idx}` as Route, AVANT)}>
            Ouvrir la séance de renfo<ArrowRightIcon />
          </Button>
        ) : (
          <>
            <Button variant="soft" size="xl" className="flex-1 border border-border/80 bg-card" onClick={() => setSaisie(0)}>Noter</Button>
            {x.phases && <Button variant="plate" size="xl" className="flex-[1.6]" onClick={() => { preparer(); setCourse(departCourse()); }}><PlayIcon weight="fill" />Minuteur · {Math.round(dureeTotale(x.phases) / 60)} min</Button>}
          </>
        )}
      </div>
      <SaisieSortie key={saisie ?? "f"} ouvert={saisie !== null} onClose={() => setSaisie(null)} seance={x} cle={cle} dureeMin={saisie || undefined} />
    </>
  );
}

/* « 6 × 3 min à 4:05 /km · récup 2 min » plutôt que 11 lignes */
function regrouper(P: NonNullable<SeanceCourse["phases"]>) {
  const out: { n: string; v: string }[] = [];
  const efforts = P.filter((p) => p.type === "effort"), recup = P.find((p) => p.type === "recup");
  for (const p of P) {
    if (p.type === "echauf") out.push({ n: "Échauffement", v: mmss(p.duree) });
    if (p.type === "continu") out.push({ n: p.titre ?? "Footing", v: `${mmss(p.duree)} · ${p.rpe}` });
  }
  if (efforts.length) out.push({ n: `${efforts.length} × ${efforts[0].titre ?? "effort"}${recup ? `, récup ${mmss(recup.duree)}` : ""}`, v: `${mmss(efforts[0].duree)} · ${efforts[0].rpe}` });
  const calme = P.find((p) => p.type === "calme");
  if (calme) out.push({ n: "Retour au calme", v: mmss(calme.duree) });
  return out;
}

