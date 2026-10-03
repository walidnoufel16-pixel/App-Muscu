"use client";

/* Cardio guidé : préparation (format, machine, niveau, durées), puis minuteur
   plein écran. Départ rapide (?f=format) ou séance enregistrée (?s=index).
   Le temps est calculé à partir de l'heure de départ et des pauses : il reste
   juste après un passage en arrière-plan. */
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ArrowRightIcon, PauseIcon, PlayIcon, SkipForwardIcon, XIcon } from "@phosphor-icons/react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EnTete } from "@/components/repere/en-tete";
import { Retour } from "@/components/repere/retour";
import { confirmer } from "@/components/repere/confirmer";
import { ICONE_FORMAT, mmss, ReglagesCardio, type ChoixCardio } from "@/components/repere/reglages-cardio";
import {
  bilanCardio, changements, construireSeance, dureeTotale, FORMATS, niveauDe, nomSeanceCardio, ORDRE_FORMATS, ou, reglagesDe,
  type FormatCardio, type Phase, type TypePhase,
} from "@/lib/logic/cardio";
import { useRepere } from "@/lib/store";
import { useCelebrer } from "@/lib/celebrer";
import { useRepos } from "@/lib/repos";
import { couper, decompte, fin as sonFin, preparer, programmer, type Bip } from "@/lib/sons";
import { cn } from "@/lib/utils";

const NOM_PHASE: Record<TypePhase, string> = { echauf: "Échauffement", effort: "Effort", recup: "Récupération", pause: "Pause", continu: "Endurance", calme: "Retour au calme" };

/* ---------------- préparation ---------------- */
function Cardio() {
  const q = useSearchParams();
  const etat = useRepere((s) => s.etat);
  const muter = useRepere((s) => s.muter);
  const iS = q.get("s") != null ? Number(q.get("s")) : null;
  const enregistree = iS != null ? etat.SEANCES_CARDIO?.[iS] : undefined;
  const f0 = (ORDRE_FORMATS as string[]).includes(q.get("f") || "") ? (q.get("f") as FormatCardio) : "fractionne";
  const derniere = etat.CARDIO?.at(-1)?.m;
  const [choix, setChoix] = useState<ChoixCardio>(() => {
    if (enregistree) return { f: enregistree.f, m: enregistree.m, n: enregistree.n, r: enregistree.r };
    const n = niveauDe(etat.A.regularite);
    const m = f0 === "emom" ? (derniere === "corde" ? "corde" : "pdc") : derniere && derniere !== "pdc" ? derniere : "tapis";
    return { f: f0, m, n, r: reglagesDe(f0, n) };
  });
  const [course, setCourse] = useState<Course | null>(null);
  const [nom, setNom] = useState(enregistree?.nom ?? "");
  const phases = useMemo(() => construireSeance(choix.f, choix.m, choix.r), [choix]);
  const titre = (enregistree && nom.trim()) || enregistree?.nom || nomSeanceCardio(choix.f, choix.m);
  const modifiee = !!enregistree && (nom.trim() !== enregistree.nom || JSON.stringify({ f: enregistree.f, m: enregistree.m, n: enregistree.n, r: enregistree.r }) !== JSON.stringify(choix));

  if (iS != null && !enregistree)
    return (
      <>
        <EnTete titre="Séance introuvable" gauche={<Retour repli="/entrainement" />} />
        <p className="px-5 text-[15px] text-muted-foreground">Cette séance cardio n&apos;existe plus sur ce téléphone.</p>
      </>
    );

  if (course) return <Minuteur phases={phases} titre={titre} choix={choix} course={course} setCourse={setCourse} />;

  const I = ICONE_FORMAT[choix.f];
  return (
    <>
      <EnTete surtitre={<span className="flex items-center gap-1.5"><I className="size-3.5" weight="fill" />Cardio · {FORMATS[choix.f].nom}</span>} titre={titre} gauche={<Retour repli="/entrainement" />} />
      <div className="px-4 pb-32">
        {enregistree && (
          <section className="mb-6">
            <h2 className="eyebrow mb-2 px-1">Nom de la séance</h2>
            <Input value={nom} onChange={(e) => setNom(e.target.value)} maxLength={60} className="h-12 rounded-2xl bg-card text-[16px]" aria-label="Nom de la séance" />
          </section>
        )}
        <ReglagesCardio choix={choix} onChange={setChoix} avecFormat={!enregistree} />
        {modifiee && (
          <Button variant="soft" size="lg" className="mt-4 w-full rounded-xl" onClick={() => { muter((E) => { const s = E.SEANCES_CARDIO![iS!]; Object.assign(s, choix, { nom: nom.trim().slice(0, 60) || s.nom }); }); toast.success("Séance enregistrée"); }}>
            Enregistrer ces réglages dans la séance
          </Button>
        )}
      </div>
      <div className="fixed inset-x-0 bottom-[max(env(safe-area-inset-bottom),14px)] z-30 mx-auto max-w-[480px] px-4">
        <Button
          variant="plate" size="xl" className="w-full"
          onClick={() => { preparer(); setCourse({ debut: Date.now(), pause: null, cumulPause: 0, saut: 0 }); }}
        >
          Démarrer · {Math.round(dureeTotale(phases) / 60)} min<ArrowRightIcon />
        </Button>
      </div>
    </>
  );
}

/* ---------------- minuteur ---------------- */
type Course = { debut: number; pause: number | null; cumulPause: number; saut: number };
const ecouleDe = (c: Course, t: number) => (t - c.debut - c.cumulPause - (c.pause ? t - c.pause : 0)) / 1000 + c.saut;

/* Bips à venir : décompte 3-2-1 et signal à chaque changement de phase, mi-parcours en endurance. */
function bipsDe(P: Phase[], ecoule: number): Bip[] {
  const b: Bip[] = [];
  const ch = changements(P);
  ch.forEach((t, i) => {
    const dans = t - ecoule;
    if (dans <= 0) return;
    if (P[i].duree >= 8) b.push(...decompte(dans).filter((x) => x.dans > 0));
    b.push(...(i === ch.length - 1 ? [...sonFin(dans), { dans: dans + 0.44, f: 1760 }] : sonFin(dans)));
  });
  let s = 0;
  for (const p of P) { if (p.type === "continu" && s + p.duree / 2 > ecoule) b.push({ dans: s + p.duree / 2 - ecoule, f: 1100, d: 0.3 }); s += p.duree; }
  return b;
}

function Minuteur({ phases, titre, choix, course, setCourse }: { phases: Phase[]; titre: string; choix: ChoixCardio; course: Course; setCourse: (c: Course | null) => void }) {
  const muter = useRepere((s) => s.muter);
  const [maintenant, setMaintenant] = useState(course.debut);
  const termine = useRef(false);
  const verrou = useRef<{ release: () => Promise<void> } | null>(null);
  const total = dureeTotale(phases);
  const ecoule = Math.max(0, ecouleDe(course, maintenant));
  const o = ou(phases, ecoule);

  /* Fin de séance (ou arrêt) : historique, bilan, retour à la préparation. */
  const finir = (fin: number) => {
    if (termine.current) return;
    termine.current = true;
    couper("cardio");
    const e = Math.min(total, Math.max(0, ecouleDe(course, fin)));
    setCourse(null);
    if (e < 60) return;
    const b = bilanCardio(phases, e);
    muter((E) => { (E.CARDIO ??= []).push({ nom: titre, f: choix.f, m: choix.m, min: b.minutes, effort: b.effort, ts: Date.now() }); });
    try { navigator.vibrate?.([180, 90, 180]); } catch {}
    useCelebrer.getState().montrerBilan({
      titre,
      cases: [
        { n: "minutes", v: b.minutes },
        choix.f === "endurance" ? { n: "minutes en endurance", v: Math.round(b.effort / 60) } : { n: "minutes à l'effort", v: Math.round(b.effort / 60) },
        ...(choix.f === "endurance" ? [] : [{ n: "tours d'effort", v: b.tours }]),
        { n: "séances cardio sur 7 jours", v: (useRepere.getState().etat.CARDIO || []).filter((h) => Date.now() - h.ts < 7 * 864e5).length, accent: true },
      ],
    });
  };

  /* horloge : rafraîchie 4 fois par seconde, et à la fin */
  useEffect(() => {
    if (course.pause) return;
    const pas = () => {
      const t = Date.now();
      setMaintenant(t);
      if (ecouleDe(course, t) >= total) finir(t);
    };
    const raf = requestAnimationFrame(pas);
    const id = setInterval(pas, 250);
    return () => { clearInterval(id); cancelAnimationFrame(raf); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [course, total]);

  /* sons : reprogrammés au départ, à la reprise et quand on passe une phase */
  useEffect(() => {
    if (course.pause) { couper("cardio"); return; }
    programmer("cardio", bipsDe(phases, ecouleDe(course, Date.now())));
    return () => couper("cardio");
  }, [course, phases]);

  /* vibration à chaque changement de phase */
  const iPrec = useRef(o.i);
  useEffect(() => {
    if (o.i !== iPrec.current) { iPrec.current = o.i; try { navigator.vibrate?.(o.phase?.type === "effort" ? [70, 50, 70] : 90); } catch {} }
  }, [o.i, o.phase?.type]);

  /* écran allumé pendant la séance */
  useEffect(() => {
    const prendre = async () => {
      try { verrou.current = await (navigator as Navigator & { wakeLock?: { request: (t: "screen") => Promise<{ release: () => Promise<void> }> } }).wakeLock?.request("screen") ?? null; } catch {}
    };
    prendre();
    const vis = () => { if (document.visibilityState === "visible") prendre(); };
    document.addEventListener("visibilitychange", vis);
    useRepos.getState().arreter(); // pas de minuteur de repos par-dessus
    return () => { document.removeEventListener("visibilitychange", vis); verrou.current?.release().catch(() => {}); };
  }, []);

  const p = o.phase;
  const effort = p?.type === "effort";
  const R = 118, C = 2 * Math.PI * R, part = p ? o.reste / p.duree : 0;
  const pause = () => {
    preparer();
    const t = Date.now();
    setCourse(course.pause ? { ...course, pause: null, cumulPause: course.cumulPause + (t - course.pause) } : { ...course, pause: t });
  };
  const passer = () => { if (p) setCourse({ ...course, saut: course.saut + o.reste + 0.01 }); };
  /* Arrêter : le chrono se fige le temps de confirmer, et reprend si on renonce. */
  const arreter = async () => {
    const t = Date.now(), avant = course;
    if (!avant.pause) setCourse({ ...avant, pause: t });
    const ok = await confirmer({ titre: "Arrêter la séance ?", texte: ecoule >= 60 ? "Ce que tu as fait jusqu'ici est enregistré." : "Moins d'une minute : rien ne sera enregistré.", ok: "Arrêter" });
    if (ok) finir(avant.pause ?? t);
    else setCourse(avant.pause ? avant : { ...avant, cumulPause: avant.cumulPause + (Date.now() - t) });
  };

  return (
    <div
      className={cn(
        "fixed inset-0 z-50 mx-auto flex max-w-[480px] flex-col px-5 pt-[max(env(safe-area-inset-top),14px)] pb-[max(env(safe-area-inset-bottom),18px)] transition-colors duration-500",
        effort ? "bg-plate text-plate-foreground" : "bg-background text-foreground",
      )}
      role="timer"
      aria-live="polite"
    >
      <div className="flex h-11 items-center justify-between">
        <button onClick={arreter} className={cn("flex items-center gap-1 rounded-full px-3 py-1.5 text-[14px] font-semibold", effort ? "bg-white/15" : "bg-muted")}>
          <XIcon className="size-4" weight="bold" />Arrêter
        </button>
        <span className={cn("truncate px-2 text-[13px] font-medium", effort ? "opacity-80" : "text-muted-foreground")}>{titre}</span>
        <span className="num min-w-[56px] text-right text-[17px] font-bold">
          {p?.tour ? `${p.tour} / ${p.tours}` : ""}
        </span>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center gap-5">
        {p?.blocs && p.blocs > 1 && <span className={cn("eyebrow", effort && "text-white/80")}>Bloc {p.bloc} sur {p.blocs}</span>}
        <div className="relative grid place-items-center">
          <svg viewBox="0 0 260 260" className="size-[min(78vw,300px)] -rotate-90" aria-hidden>
            <circle cx="130" cy="130" r={R} fill="none" strokeWidth="14" className={effort ? "stroke-white/20" : "stroke-muted"} />
            <circle
              cx="130" cy="130" r={R} fill="none" strokeWidth="14" strokeLinecap="round"
              className={cn("transition-[stroke-dashoffset] duration-300 ease-linear", effort ? "stroke-white" : p?.type === "recup" || p?.type === "pause" ? "stroke-muted-foreground" : "stroke-plate")}
              strokeDasharray={C} strokeDashoffset={C * (1 - part)}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <span key={o.i} className="animate-[pop_.45s_cubic-bezier(.3,1.6,.5,1)] text-[22px] font-bold tracking-[-0.01em]">{p ? NOM_PHASE[p.type] : "Terminé"}</span>
            <span className={cn("num text-[78px] leading-none font-bold", !effort && o.reste <= 3 && "text-plate")}>{mmss(Math.ceil(o.reste))}</span>
            {p && <span className={cn("mt-1 rounded-full px-2.5 py-0.5 text-[12.5px] font-semibold", effort ? "bg-white/15" : "bg-muted text-muted-foreground")}>{p.rpe}</span>}
          </div>
        </div>
        {p?.consigne && <p className={cn("max-w-[30ch] text-center text-[17px] leading-snug font-medium", !effort && "text-foreground/85")}>{p.consigne}</p>}
        {o.suivante && (
          <p className={cn("text-[14px]", effort ? "opacity-80" : "text-muted-foreground")}>
            Ensuite : <b className="font-semibold">{NOM_PHASE[o.suivante.type]}</b> · {mmss(o.suivante.duree)}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <span className={cn("num w-11 text-[15px] font-semibold", effort ? "opacity-80" : "text-muted-foreground")}>{mmss(Math.floor(ecoule))}</span>
          <span className={cn("h-1.5 flex-1 overflow-hidden rounded-full", effort ? "bg-white/20" : "bg-muted")}>
            <span className={cn("block h-full rounded-full", effort ? "bg-white" : "bg-plate")} style={{ width: o.progression * 100 + "%" }} />
          </span>
          <span className={cn("num w-11 text-right text-[15px] font-semibold", effort ? "opacity-80" : "text-muted-foreground")}>{mmss(total)}</span>
        </div>
        <div className="flex items-center justify-center gap-6">
          <span className="size-14" />
          <button
            onClick={pause}
            aria-label={course.pause ? "Reprendre" : "Pause"}
            className={cn("grid size-20 place-items-center rounded-full shadow-lg active:scale-95", effort ? "bg-white text-[#2346c4]" : "bg-plate text-plate-foreground")}
          >
            {course.pause ? <PlayIcon className="size-8" weight="fill" /> : <PauseIcon className="size-8" weight="fill" />}
          </button>
          <button onClick={passer} aria-label="Passer la phase" className={cn("grid size-14 place-items-center rounded-full active:scale-95", effort ? "bg-white/15" : "bg-muted")}>
            <SkipForwardIcon className="size-6" weight="fill" />
          </button>
        </div>
      </div>
      {course.pause && <p className="absolute inset-x-0 top-[calc(max(env(safe-area-inset-top),14px)+52px)] text-center text-[13px] font-semibold tracking-[0.12em] uppercase opacity-70">En pause</p>}
    </div>
  );
}

export default function PageCardio() {
  return (
    <Suspense>
      <Cardio />
    </Suspense>
  );
}
