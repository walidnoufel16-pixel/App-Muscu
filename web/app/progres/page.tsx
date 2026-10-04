"use client";

/* Progrès : ce que l'entraînement a changé, en un coup d'œil.
   Tout vient de l'historique (HIST) et du cardio (CARDIO), rien n'est envoyé ailleurs. */
import { Suspense, useEffect, useMemo, useState } from "react";
import { ArrowDownIcon, ArrowUpIcon, CaretDownIcon, CaretRightIcon, ChartLineUpIcon, ScalesIcon, SparkleIcon, TrophyIcon } from "@phosphor-icons/react";
import { useRouter, useSearchParams } from "next/navigation";
import { LogoDisque } from "@/components/repere/logo";
import { moisPrecedent, recap } from "@/lib/logic/recap";
import { AVANT } from "@/lib/nav";
import { EnTete } from "@/components/repere/en-tete";
import { Barres, Calendrier, Courbe } from "@/components/repere/graphes";
import { SchemaCorps } from "@/components/repere/schema-corps";
import { CarteRegularite, GrilleBadges } from "@/components/repere/motivation";
import { Button } from "@/components/ui/button";
import { Drawer, DrawerContent, DrawerDescription, DrawerTitle } from "@/components/ui/drawer";
import { EX } from "@/lib/data/exercices";
import { PAT2MUSC } from "@/lib/data/referentiels";
import { FORMATS } from "@/lib/logic/cardio";
import { nb } from "@/lib/logic/core";
import {
  activite, courbe, dateDe, decaler, exercicesFaits, jourDe, lundiDe, nomMuscle, records, semaines, seriesParMuscle, type LigneHist,
} from "@/lib/logic/historique";
import { useRepere } from "@/lib/store";
import { usePremiereVisite } from "@/lib/entree";
import { cn } from "@/lib/utils";

const court = (j: string) => dateDe(j).toLocaleDateString("fr-FR", { day: "numeric", month: "short" }).replace(".", "");
const long = (j: string) => dateDe(j).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });
const kg = (v: number) => (v >= 10000 ? nb(Math.round(v / 100) / 10) + " t" : Math.round(v).toLocaleString("fr-FR") + " kg");

export default function PageProgres() {
  return <Suspense><Progres /></Suspense>;
}

function Progres() {
  const etat = useRepere((s) => s.etat);
  const premiere = usePremiereVisite();
  const H = useMemo(() => etat.HIST || [], [etat.HIST]);
  const C = useMemo(() => etat.CARDIO || [], [etat.CARDIO]);
  const [auj] = useState(() => jourDe(Date.now()));
  const [jour, setJour] = useState<string | null>(null);

  if (!H.length && !C.length)
    return (
      <>
        <EnTete surtitre="Ton évolution" titre="Progrès" />
        <div className={cn("px-4", premiere && "entree")}>
          <div className="rounded-[24px] border border-dashed border-border bg-card p-6 text-center">
            <ChartLineUpIcon className="mx-auto size-10 text-plate" weight="duotone" />
            <h2 className="mt-3 text-[19px] font-bold">Ta première séance remplira cet écran</h2>
            <p className="mx-auto mt-1.5 max-w-[32ch] text-[14px] leading-relaxed text-muted-foreground">
              Chaque série validée s&apos;ajoute ici : tes charges, tes records, le volume de chaque muscle et ta régularité.
            </p>
          </div>
        </div>
      </>
    );

  return (
    <>
      <EnTete surtitre="Ton évolution" titre="Progrès" />
      <div className={cn("flex flex-col gap-6 px-4", premiere && "entree")}>
        <CetteSemaine H={H} C={C} auj={auj} />
        <Bilans auj={auj} />
        <Section titre="Régularité">
          <div className="flex flex-col gap-2">
            <CarteRegularite reglable />
            <Activite H={H} C={C} auj={auj} onJour={setJour} />
          </div>
        </Section>
        <Section titre="Muscles travaillés · 7 derniers jours">
          <Muscles H={H} auj={auj} />
        </Section>
        <Records H={H} />
        <GrilleBadges />
        <Section titre="Ma progression par exercice">
          <ParExercice H={H} />
        </Section>
        <Section titre="Poids du corps">
          <Poids />
        </Section>
        {C.length > 0 && (
          <Section titre="Cardio · minutes par semaine">
            <Cardio H={H} C={C} auj={auj} />
          </Section>
        )}
      </div>
      <DetailJour jour={jour} onClose={() => setJour(null)} H={H} C={C} />
    </>
  );
}

function Section({ titre, children, action }: { titre: string; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <section>
      <div className="mb-2 flex items-baseline justify-between px-1">
        <h2 className="eyebrow">{titre}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}
const Carte = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <div className={cn("rounded-[20px] border border-border/80 bg-card p-4", className)}>{children}</div>
);

/* Écart en % avec la semaine d'avant (rien si la semaine d'avant était vide). */
function Ecart({ v, avant }: { v: number; avant: number }) {
  if (!avant) return null;
  const p = Math.round(((v - avant) / avant) * 100);
  if (!p) return <span className="text-[11.5px] text-muted-foreground">=</span>;
  return (
    <span className={cn("inline-flex items-center gap-0.5 text-[11.5px] font-semibold", p > 0 ? "text-success" : "text-muted-foreground")}>
      {p > 0 ? <ArrowUpIcon className="size-3" weight="bold" /> : <ArrowDownIcon className="size-3" weight="bold" />}{Math.abs(p)} %
    </span>
  );
}

function CetteSemaine({ H, C, auj }: { H: LigneHist[]; C: NonNullable<ReturnType<typeof useRepere.getState>["etat"]["CARDIO"]>; auj: string }) {
  const [a, b] = semaines(H, C, 2, auj);
  const cases = [
    { n: "séances", v: b.seances, a: a.seances, f: (x: number) => String(x) },
    { n: "soulevés", v: b.vol, a: a.vol, f: kg },
    { n: "séries", v: b.ser, a: a.ser, f: (x: number) => String(x) },
    { n: "min de cardio", v: b.cardio, a: a.cardio, f: (x: number) => String(Math.round(x)) },
  ];
  return (
    <section>
      <h2 className="eyebrow mb-2 px-1">Cette semaine</h2>
      <div className="grid grid-cols-2 gap-2">
        {cases.map((c, i) => (
          <div key={c.n} className="animate-[monter_.45s_ease-out_both] rounded-[18px] border border-border/80 bg-card p-3.5" style={{ animationDelay: i * 60 + "ms" }}>
            <div className="num text-[28px] leading-none font-bold">{c.f(c.v)}</div>
            <div className="mt-1 flex items-center justify-between gap-1">
              <span className="text-[12.5px] font-medium text-muted-foreground">{c.n}</span>
              <Ecart v={c.v} avant={c.a} />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function Activite({ H, C, auj, onJour }: { H: LigneHist[]; C: Parameters<typeof activite>[1]; auj: string; onJour: (j: string) => void }) {
  const act = useMemo(() => activite(H, C), [H, C]);
  const debut = decaler(lundiDe(auj), -7 * 11);
  const jours = Array.from({ length: 84 }, (_, i) => decaler(debut, i));
  const actifs = jours.filter((j) => act.has(j)).length;
  return (
    <Carte>
      <Calendrier jours={jours} etat={(j) => act.get(j)} onJour={onJour} aujourdhui={auj} />
      <div className="mt-3 flex items-center justify-between text-[12px] text-muted-foreground">
        <span><b className="num text-[15px] text-foreground">{actifs}</b> jours d&apos;entraînement</span>
        <span className="flex items-center gap-3">
          <span className="flex items-center gap-1"><i className="size-2.5 rounded-[3px] bg-plate" />Muscu</span>
          <span className="flex items-center gap-1"><i className="size-2.5 rounded-[3px] bg-success" />Cardio</span>
        </span>
      </div>
    </Carte>
  );
}

/* Repère courant : 10 à 20 séries par muscle et par semaine pour progresser. */
function Muscles({ H, auj }: { H: LigneHist[]; auj: string }) {
  const parM = useMemo(() => seriesParMuscle(H, decaler(auj, -6), auj), [H, auj]);
  const liste = Object.entries(parM).sort((a, b) => b[1] - a[1]);
  const teinte = (r: { p?: string }) => { const m = r.p && PAT2MUSC[r.p]; return m && parM[m] ? Math.min(1, parM[m] / 16) : 0; };
  if (!liste.length) return <Carte><p className="text-[14px] text-muted-foreground">Aucune série de musculation ces 7 derniers jours.</p></Carte>;
  return (
    <div className="flex flex-col gap-2">
      <SchemaCorps actif={() => false} choisi={() => false} onToucher={() => {}} teinte={teinte} legende="Plus c'est foncé, plus le muscle a travaillé" />
      <Carte className="flex flex-col gap-2.5">
        {liste.map(([m, n]) => (
          <div key={m}>
            <div className="flex justify-between text-[13.5px]"><span className="font-medium">{nomMuscle(m)}</span><span className="num text-[15px] font-semibold">{n} <span className="text-[12px] font-normal text-muted-foreground">séries</span></span></div>
            <div className="relative mt-1 h-1.5 overflow-hidden rounded-full bg-muted">
              <div className="h-full origin-left animate-[remplir_.7s_ease-out_both] rounded-full bg-plate" style={{ width: Math.min(100, (n / 20) * 100) + "%" }} />
              <span className="absolute inset-y-0 left-1/2 w-px bg-foreground/30" aria-hidden />
            </div>
          </div>
        ))}
        <p className="text-[11.5px] leading-snug text-muted-foreground">Le trait marque 10 séries : entre 10 et 20 séries par semaine, un muscle progresse bien.</p>
      </Carte>
    </div>
  );
}

function Records({ H }: { H: LigneHist[] }) {
  const R = useMemo(() => records(H), [H]);
  const [tout, setTout] = useState(false);
  if (!R.length) return null;
  const vus = tout ? R.slice(0, 40) : R.slice(0, 5);
  return (
    <Section titre={`Records · ${R.length}`} action={R.length > 5 && (
      <button onClick={() => setTout(!tout)} className="text-[13px] font-semibold text-plate-ink">{tout ? "Moins" : "Voir tout"}</button>
    )}>
      <div className="overflow-hidden rounded-[20px] border border-border/80 bg-card">
        {vus.map((r, i) => {
          const x = EX[r.id];
          return (
            <div key={r.d + r.id} className={cn("flex items-center gap-3 px-4 py-2.5", i && "border-t border-border/70")}>
              <span className="grid size-9 shrink-0 place-items-center rounded-full bg-plate-soft text-plate-ink"><TrophyIcon className="size-[18px]" weight="fill" /></span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[14.5px] font-medium">{x?.n || r.id}</span>
                <span className="block text-[12px] text-muted-foreground">
                  {court(r.d)} · {x?.ch === "kg" ? `${nb(r.max)} kg × ${r.reps}` : x?.ch === "aucune" || x?.ch === "lest" ? (r.max ? `+${nb(r.max)} kg × ${r.reps}` : `${r.reps} reps`) : x?.ch === "temps" ? `${r.max} s` : `${nb(r.max)} m`}
                </span>
              </span>
              {x?.ch === "kg" && r.rm > 0 && <span className="num text-right text-[17px] font-bold">{nb(Math.round(r.rm))}<span className="block text-[10px] font-medium text-muted-foreground">1RM est.</span></span>}
            </div>
          );
        })}
      </div>
    </Section>
  );
}

function ParExercice({ H }: { H: LigneHist[] }) {
  const faits = useMemo(() => exercicesFaits(H).filter((e) => EX[e.id]), [H]);
  /* ?ex= : ouvert depuis la fiche d'un exercice */
  const q = useSearchParams().get("ex");
  const [id, setId] = useState<string | null>(q && EX[q] ? q : null);
  const [choix, setChoix] = useState(false);
  useEffect(() => {
    if (q) requestAnimationFrame(() => document.getElementById("par-exercice")?.scrollIntoView({ block: "center" }));
  }, [q]);
  const courant = id ?? (faits.find((e) => EX[e.id].ch === "kg" && e.n > 1) || faits[0])?.id;
  const pts = useMemo(() => (courant ? courbe(H, courant) : []), [H, courant]);
  if (!courant) return <Carte><p className="text-[14px] text-muted-foreground">Fais une séance pour voir ta progression.</p></Carte>;
  const x = EX[courant], rm = x.ch === "kg" && pts.some((p) => p.rm > 0);
  const pdc = (x.ch === "aucune" || x.ch === "lest") && !pts.some((q) => q.max > 0); // poids du corps sans lest : on suit les répétitions
  const val = (p: (typeof pts)[number]) => (rm ? p.rm : pdc ? p.reps : p.max);
  const unite = pdc ? "reps" : rm || x.ch === "kg" || x.ch === "lest" || x.ch === "aucune" ? "kg" : x.ch === "temps" ? "s" : x.ch === "dist" ? "m" : "";
  const premier = pts[0] ? val(pts[0]) : 0, dernier = pts.length ? val(pts[pts.length - 1]) : 0;
  return (
    <Carte className="p-0">
      <button id="par-exercice" onClick={() => setChoix(true)} className="flex w-full items-center gap-2 px-4 pt-3.5 text-left">
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[16px] font-semibold">{x.n}</span>
          <span className="block text-[12px] text-muted-foreground">{rm ? "1RM estimé (formule d'Epley)" : "Meilleure série"} · {pts.length} séance{pts.length > 1 ? "s" : ""}</span>
        </span>
        <span className="flex items-center gap-1 rounded-full bg-muted px-3 py-1.5 text-[12.5px] font-semibold">Changer<CaretDownIcon className="size-3.5" /></span>
      </button>
      <div className="px-2 pt-2" key={courant}>
        <Courbe points={pts.map((p) => ({ x: court(p.d), y: val(p), info: court(p.d) }))} unite={unite} />
      </div>
      {pts.length > 1 && (
        <div className="grid grid-cols-3 border-t border-border/70 text-center">
          {[["Début", premier], ["Aujourd'hui", dernier], ["Progrès", dernier - premier]].map(([n, v], i) => (
            <div key={n as string} className={cn("py-2.5", i && "border-l border-border/70")}>
              <div className={cn("num text-[19px] font-bold", i === 2 && (v as number) > 0 && "text-success")}>{i === 2 && (v as number) > 0 ? "+" : ""}{nb(Math.round((v as number) * 10) / 10)}</div>
              <div className="text-[11px] text-muted-foreground">{n} · {unite}</div>
            </div>
          ))}
        </div>
      )}
      <Drawer open={choix} onOpenChange={setChoix}>
        <DrawerContent>
          <DrawerTitle className="px-5 pt-2 text-[19px] font-bold">Choisir un exercice</DrawerTitle>
          <DrawerDescription className="px-5 text-[13px] text-muted-foreground">Les exercices que tu as déjà faits</DrawerDescription>
          <div className="mt-2 max-h-[60vh] overflow-y-auto px-2 pb-[max(env(safe-area-inset-bottom),16px)]">
            {faits.map((e) => (
              <button key={e.id} onClick={() => { setId(e.id); setChoix(false); }}
                className={cn("flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left active:bg-muted", e.id === courant && "bg-plate-soft")}>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[15px] font-medium">{EX[e.id].n}</span>
                  <span className="block text-[12px] text-muted-foreground">{e.n} séance{e.n > 1 ? "s" : ""} · dernière le {court(e.dernier)}</span>
                </span>
                <CaretRightIcon className="size-4 text-muted-foreground" />
              </button>
            ))}
          </div>
        </DrawerContent>
      </Drawer>
    </Carte>
  );
}

/* Poids du corps : on part du poids déclaré au questionnaire, puis chaque pesée s'ajoute (une par jour). */
function Poids() {
  const A = useRepere((s) => s.etat.A);
  const muter = useRepere((s) => s.muter);
  const P = (Array.isArray(A.poids) ? A.poids : []) as [string, number][];
  const dernier = P.at(-1)?.[1] ?? A.profil?.["Poids"];
  const [v, setV] = useState("");
  const enregistrer = () => {
    const n = Math.round(parseFloat(v.replace(",", ".")) * 10) / 10;
    if (!(n >= 30 && n <= 300)) return;
    const auj = jourDe(Date.now());
    muter((E) => {
      const l = ((Array.isArray(E.A.poids) ? E.A.poids : []) as [string, number][]).filter((p) => p[0] !== auj);
      l.push([auj, n]);
      E.A.poids = l.slice(-120);
      E.A.profil = { ...(E.A.profil || {}), Poids: Math.round(n) };
    });
    setV("");
  };
  return (
    <Carte>
      {P.length > 1 && <div className="-mx-2 mb-3"><Courbe points={P.map(([d, p]) => ({ x: court(d), y: p }))} unite="kg" hauteur={130} /></div>}
      <div className="flex items-center gap-2">
        <ScalesIcon className="size-5 shrink-0 text-muted-foreground" />
        <input
          inputMode="decimal"
          value={v}
          onChange={(e) => setV(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && enregistrer()}
          placeholder={dernier ? `Dernier : ${nb(dernier)} kg` : "Ton poids, en kg"}
          aria-label="Poids du jour en kg"
          className="h-11 min-w-0 flex-1 rounded-xl border bg-background px-3 text-[16px] outline-none focus:border-plate"
        />
        <Button variant="plate" className="h-11 rounded-xl" onClick={enregistrer} disabled={!v.trim()}>Noter</Button>
      </div>
    </Carte>
  );
}

function Cardio({ H, C, auj }: { H: LigneHist[]; C: Parameters<typeof semaines>[1]; auj: string }) {
  const S = semaines(H, C, 12, auj);
  const par = new Map<string, number>();
  for (const c of C) par.set(c.f, (par.get(c.f) || 0) + 1);
  const top = [...par].sort((a, b) => b[1] - a[1]).slice(0, 3);
  return (
    <Carte>
      <Barres valeurs={S.map((s) => ({ x: court(s.lundi), y: Math.round(s.cardio) }))} unite="min" couleur="var(--success)" />
      {top.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {top.map(([f, n]) => (
            <span key={f} className="rounded-full bg-success-soft px-2.5 py-1 text-[12px] font-medium">{FORMATS[f as keyof typeof FORMATS]?.nom || f} · {n}</span>
          ))}
        </div>
      )}
    </Carte>
  );
}

function DetailJour({ jour, onClose, H, C }: { jour: string | null; onClose: () => void; H: LigneHist[]; C: Parameters<typeof activite>[1] }) {
  const lignes = jour ? H.filter((l) => l.d === jour) : [];
  const cardio = jour ? C.filter((c) => jourDe(c.ts) === jour) : [];
  return (
    <Drawer open={!!jour} onOpenChange={(o) => !o && onClose()}>
      <DrawerContent>
        {jour && (
          <div className="max-h-[75vh] overflow-y-auto px-5 pt-2 pb-[max(env(safe-area-inset-bottom),20px)]">
            <DrawerTitle className="text-[20px] font-bold first-letter:uppercase">{long(jour)}</DrawerTitle>
            <DrawerDescription className="sr-only">Séances de ce jour</DrawerDescription>
            {lignes.map((l) => (
              <div key={l.s} className="mt-3 rounded-2xl border bg-card p-3.5">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="truncate text-[16px] font-semibold">{l.nom}</span>
                  <span className="shrink-0 text-[12.5px] text-muted-foreground">{l.ser} séries{l.vol ? " · " + kg(l.vol) : ""}{l.min ? ` · ${l.min} min` : ""}</span>
                </div>
                <ul className="mt-2 flex flex-col gap-1">
                  {Object.entries(l.ex).map(([id, p]) => {
                    const x = EX[id];
                    return (
                      <li key={id} className="flex justify-between gap-2 text-[13.5px]">
                        <span className="truncate">{x?.n || id}</span>
                        <span className="num shrink-0 text-[14px] text-muted-foreground">
                          {p[4]} × {x?.ch === "kg" ? `${nb(p[2])} kg × ${p[3]}` : x?.ch === "temps" ? `${p[2]} s` : x?.ch === "dist" ? `${p[2]} m` : `${p[3]} reps${p[2] ? ` +${nb(p[2])} kg` : ""}`}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
            {cardio.map((c, i) => (
              <div key={i} className="mt-3 flex items-center justify-between rounded-2xl border bg-card p-3.5">
                <span className="truncate text-[15px] font-semibold">{c.nom}</span>
                <span className="text-[12.5px] text-muted-foreground">{Math.round(c.min)} min · RPE {c.effort}</span>
              </div>
            ))}
          </div>
        )}
      </DrawerContent>
    </Drawer>
  );
}

/* Bilans à partager : le mois écoulé, et l'année en décembre et en janvier. */
function Bilans({ auj }: { auj: string }) {
  const router = useRouter();
  const etat = useRepere((s) => s.etat);
  const ids = [moisPrecedent(auj), ...(auj.slice(5, 7) === "12" ? [auj.slice(0, 4)] : auj.slice(5, 7) === "01" ? [String(+auj.slice(0, 4) - 1)] : [])];
  const liste = ids.map((id) => recap(etat, id)).filter((r): r is NonNullable<typeof r> => !!r && r.seances > 0);
  if (!liste.length) return null;
  return (
    <div className="flex flex-col gap-2">
      {liste.map((r) => (
        <button key={r.p.id} onClick={() => router.push(`/progres/bilan?p=${r.p.id}` as "/progres/bilan", AVANT)}
          className="relative isolate flex items-center gap-3 overflow-hidden rounded-[20px] bg-gradient-to-br from-[#3b67f5] to-[#1b36a0] p-4 text-left text-white active:scale-[.99]">
          <LogoDisque className="pointer-events-none absolute -right-8 -bottom-10 -z-10 size-36 text-white/10" />
          <SparkleIcon className="size-7 shrink-0" weight="fill" />
          <span className="min-w-0 flex-1">
            <span className="block text-[17px] font-bold first-letter:uppercase">{r.p.annee ? `Ton année ${r.p.nom}` : `Ton bilan de ${r.p.nom.split(" ")[0]}`}</span>
            <span className="block text-[13px] opacity-85">{r.seances} séances{r.tonnes >= 1 ? ` · ${nb(Math.round(r.tonnes * 10) / 10)} t soulevées` : ""} · à partager</span>
          </span>
          <CaretRightIcon className="size-4 shrink-0 opacity-80" />
        </button>
      ))}
    </div>
  );
}
