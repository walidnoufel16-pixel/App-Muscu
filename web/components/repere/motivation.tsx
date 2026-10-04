"use client";

/* Régularité et badges : la carte « semaines d'affilée », la grille des badges,
   et la célébration quand un badge tombe. */
import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  BarbellIcon, CaretRightIcon, FlameIcon, HandWavingIcon, HeartbeatIcon, LockIcon, MinusIcon, MountainsIcon, PlusIcon, ShieldCheckIcon, StarIcon,
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Drawer, DrawerContent, DrawerDescription, DrawerTitle } from "@/components/ui/drawer";
import { BADGES, nouveaux, objectifHebdo, serie, stats, type Badge } from "@/lib/logic/motivation";
import { jourDe } from "@/lib/logic/historique";
import { gerbe, useCelebrer } from "@/lib/celebrer";
import { useRepere } from "@/lib/store";
import { AVANT } from "@/lib/nav";
import { cn } from "@/lib/utils";

const ICONES = { etoile: StarIcon, flamme: FlameIcon, haltere: BarbellIcon, poids: MountainsIcon, coeur: HeartbeatIcon } as const;
export function IconeBadge({ b, on, className }: { b: Badge; on: boolean; className?: string }) {
  const I = ICONES[b.icone as keyof typeof ICONES] || StarIcon;
  return (
    <span className={cn("relative grid place-items-center rounded-full", on ? "bg-plate text-plate-foreground shadow-[0_8px_20px_-10px_var(--plate)]" : "bg-muted text-muted-foreground/60", className)}>
      <I className="size-[46%]" weight={on ? "fill" : "regular"} />
      {!on && <LockIcon className="absolute -right-0.5 -bottom-0.5 size-[34%] rounded-full bg-card p-[2px] text-muted-foreground" weight="fill" />}
    </span>
  );
}

const pluriel = (n: number, s: string) => `${n} ${s}${n > 1 ? "s" : ""}`;

/* Carte « Ma régularité » : la série en cours, les séances de la semaine, le joker. */
export function CarteRegularite({ lien = false, reglable = false }: { lien?: boolean; reglable?: boolean }) {
  const router = useRouter();
  const etat = useRepere((s) => s.etat);
  const muter = useRepere((s) => s.muter);
  const [auj] = useState(() => jourDe(Date.now()));
  const S = useMemo(() => serie(etat.HIST || [], etat.CARDIO || [], objectifHebdo(etat.A), auj), [etat.HIST, etat.CARDIO, etat.A, auj]);
  const fait = S.cetteSemaine >= S.objectif;
  const contenu = (
    <>
      <span className={cn("grid size-12 shrink-0 place-items-center rounded-2xl", S.semaines ? "bg-[#ff7a1a]/12 text-[#ff7a1a]" : "bg-muted text-muted-foreground")}>
        <FlameIcon className={cn("size-7", S.semaines && "animate-[battre_2.4s_ease-in-out_infinite] motion-reduce:animate-none")} weight={S.semaines ? "fill" : "regular"} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[16px] leading-tight font-semibold">
          {S.semaines ? `${pluriel(S.semaines, "semaine")} d'affilée` : "Lance ta série cette semaine"}
        </span>
        <span className="mt-1 flex items-center gap-1" aria-label={`${S.cetteSemaine} séance(s) sur ${S.objectif} cette semaine`}>
          {Array.from({ length: Math.max(S.objectif, Math.min(S.cetteSemaine, 7)) }, (_, i) => (
            <i key={i} className={cn("h-1.5 w-5 rounded-full", i < S.cetteSemaine ? (i < S.objectif ? "bg-plate" : "bg-success") : "bg-muted")} />
          ))}
          <span className="ml-1 text-[12px] text-muted-foreground">{fait ? "objectif atteint" : `${S.cetteSemaine}/${S.objectif} cette semaine`}</span>
        </span>
      </span>
      {lien && <CaretRightIcon className="size-4 shrink-0 text-muted-foreground" />}
    </>
  );
  return (
    <div className="overflow-hidden rounded-[20px] border border-border/80 bg-card">
      {lien ? (
        <button onClick={() => router.push("/progres", AVANT)} className="flex w-full items-center gap-3 p-3.5 text-left active:bg-muted">{contenu}</button>
      ) : (
        <div className="flex items-center gap-3 p-3.5">{contenu}</div>
      )}
      {reglable && (
        <div className="flex items-center gap-3 border-t border-border/70 px-3.5 py-2.5">
          <span className="flex-1 text-[13px] leading-snug text-muted-foreground">
            <span className="flex items-center gap-1 font-medium text-foreground"><ShieldCheckIcon className="size-4 text-success" weight="fill" />{S.jokerDispo ? "Joker du mois disponible" : "Joker du mois utilisé"}</span>
            Une semaine manquée par mois ne casse pas ta série.{S.record > S.semaines ? ` Record : ${pluriel(S.record, "semaine")}.` : ""}
          </span>
          <span className="flex items-center gap-1 rounded-full bg-muted p-1" aria-label="Objectif de séances par semaine">
            <button aria-label="Objectif : moins" disabled={S.objectif <= 1} onClick={() => muter((E) => { E.A.objHebdo = S.objectif - 1; })} className="grid size-7 place-items-center rounded-full bg-card disabled:opacity-40"><MinusIcon className="size-3.5" weight="bold" /></button>
            <span className="num w-12 text-center text-[15px] font-bold leading-none">{S.objectif}<span className="block text-[9.5px] font-medium text-muted-foreground">/ sem.</span></span>
            <button aria-label="Objectif : plus" disabled={S.objectif >= 6} onClick={() => muter((E) => { E.A.objHebdo = S.objectif + 1; })} className="grid size-7 place-items-center rounded-full bg-card disabled:opacity-40"><PlusIcon className="size-3.5" weight="bold" /></button>
          </span>
        </div>
      )}
    </div>
  );
}

/* Grille des badges, obtenus d'abord ; un badge touché montre sa progression. */
export function GrilleBadges() {
  const etat = useRepere((s) => s.etat);
  const st = useMemo(() => stats(etat), [etat]);
  const [vu, setVu] = useState<Badge | null>(null);
  const notes = (etat.A.badges || {}) as Record<string, string>;
  const tries = [...BADGES].sort((a, b) => +(b.valeur(st) >= b.cible) - +(a.valeur(st) >= a.cible));
  const n = BADGES.filter((b) => b.valeur(st) >= b.cible).length;
  return (
    <section>
      <div className="mb-2 flex items-baseline justify-between px-1">
        <h2 className="eyebrow">Badges · {n} sur {BADGES.length}</h2>
      </div>
      <div className="grid grid-cols-4 gap-x-2 gap-y-3 rounded-[20px] border border-border/80 bg-card p-3.5">
        {tries.map((b) => {
          const on = b.valeur(st) >= b.cible;
          return (
            <button key={b.id} onClick={() => setVu(b)} className="flex flex-col items-center gap-1 text-center active:scale-95">
              <IconeBadge b={b} on={on} className="size-12" />
              <span className={cn("line-clamp-2 text-[10.5px] leading-tight font-medium", !on && "text-muted-foreground")}>{b.nom}</span>
            </button>
          );
        })}
      </div>
      <Drawer open={!!vu} onOpenChange={(o) => !o && setVu(null)}>
        <DrawerContent>
          {vu && (() => {
            const v = vu.valeur(st), on = v >= vu.cible;
            return (
              <div className="px-5 pt-3 pb-[max(env(safe-area-inset-bottom),20px)] text-center">
                <IconeBadge b={vu} on={on} className="mx-auto size-20 animate-[medaille_.7s_cubic-bezier(.3,1.5,.5,1)_both]" />
                <div className="eyebrow mt-4">{vu.famille}</div>
                <DrawerTitle className="mt-1 text-[24px] font-bold">{vu.nom}</DrawerTitle>
                <DrawerDescription className="mt-1 text-[15px] text-muted-foreground">{vu.texte}</DrawerDescription>
                {on ? (
                  <p className="mt-4 text-[14px] font-medium text-success">Obtenu{notes[vu.id] ? " le " + new Date(notes[vu.id]).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" }) : ""}</p>
                ) : (
                  <div className="mt-4">
                    <div className="h-2 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-plate" style={{ width: Math.min(100, (v / vu.cible) * 100) + "%" }} /></div>
                    <p className="mt-1.5 text-[13px] text-muted-foreground">{Math.floor(v * 10) / 10 === Math.floor(v) ? Math.floor(v) : (Math.floor(v * 10) / 10).toLocaleString("fr-FR")} sur {vu.cible.toLocaleString("fr-FR")}</p>
                  </div>
                )}
              </div>
            );
          })()}
        </DrawerContent>
      </Drawer>
    </section>
  );
}

/* Veille : quand un badge tombe, on le note et on le fête (après le bilan, jamais au milieu d'une séance).
   La toute première fois, les badges déjà mérités sont notés sans fête. */
export function SurveillantBadges() {
  const etat = useRepere((s) => s.etat);
  const muter = useRepere((s) => s.muter);
  const bilan = useCelebrer((s) => s.bilan);
  const [fete, setFete] = useState<Badge[]>([]);
  const st = useMemo(() => stats(etat), [etat]);
  const notes = etat.A.badges as Record<string, string> | undefined;
  const neufs = useMemo(() => nouveaux(st, notes || {}), [st, notes]);
  useEffect(() => {
    if (!neufs.length) return;
    const date = new Date().toISOString().slice(0, 10);
    muter((E) => { E.A.badges = { ...((E.A.badges as Record<string, string>) || {}), ...Object.fromEntries(neufs.map((b) => [b.id, date])) }; });
    if (notes) queueMicrotask(() => setFete((f) => [...f, ...neufs]));
  }, [neufs, notes, muter]);
  /* pendant une séance, on ne coupe pas l'effort : la fête attend le bilan, ou la sortie de la séance */
  const chemin = usePathname();
  const enSeance = /\/entrainement\/(seance|cardio)/.test(chemin);
  const [apresBilan, setApresBilan] = useState(false);
  const [bilanPrec, setBilanPrec] = useState(bilan);
  if (bilan !== bilanPrec) { setBilanPrec(bilan); if (bilanPrec && !bilan) setApresBilan(true); }
  if (!fete.length && apresBilan) setApresBilan(false);
  const b = !bilan && (!enSeance || apresBilan) ? fete[0] : undefined;
  useEffect(() => {
    if (!b) return;
    const t = setTimeout(() => gerbe(innerWidth / 2, innerHeight * 0.55), 350);
    try { navigator.vibrate?.([14, 60, 28]); } catch {}
    return () => clearTimeout(t);
  }, [b]);
  return (
    <Drawer open={!!b} onOpenChange={(o) => !o && setFete((f) => f.slice(1))}>
      <DrawerContent>
        {b && (
          <div className="px-5 pt-4 pb-[max(env(safe-area-inset-bottom),20px)] text-center">
            <IconeBadge b={b} on className="mx-auto size-24 animate-[medaille_.8s_cubic-bezier(.3,1.5,.5,1)_both]" />
            <div className="eyebrow mt-5 animate-[monter_.5s_.15s_ease-out_both]">Nouveau badge</div>
            <DrawerTitle className="mt-1 animate-[monter_.5s_.22s_ease-out_both] text-[26px] font-bold tracking-[-0.02em]">{b.nom}</DrawerTitle>
            <DrawerDescription className="mt-1 animate-[monter_.5s_.3s_ease-out_both] text-[15px] text-muted-foreground">{b.texte}</DrawerDescription>
            <Button variant="plate" size="xl" className="mt-6 w-full" onClick={() => setFete((f) => f.slice(1))}>Super</Button>
          </div>
        )}
      </DrawerContent>
    </Drawer>
  );
}

/* Après dix jours sans séance : un mot pour reprendre en douceur, jamais un reproche. */
export function Reprise() {
  const etat = useRepere((s) => s.etat);
  const [auj] = useState(() => Date.now());
  const derniers = [...(etat.HIST || []).map((l) => new Date(l.d + "T12:00").getTime()), ...(etat.CARDIO || []).map((c) => c.ts)];
  if (!derniers.length) return null;
  const jours = Math.floor((auj - Math.max(...derniers)) / 864e5);
  if (jours < 10) return null;
  return (
    <div className="flex gap-3 rounded-[20px] border border-success/30 bg-success-soft p-3.5">
      <HandWavingIcon className="size-6 shrink-0 text-success" weight="fill" />
      <span className="text-[13.5px] leading-snug">
        <b className="block text-[15px]">Content de te revoir</b>
        {jours} jours de pause, ça arrive. Pour cette première séance, garde 1 ou 2 répétitions de plus en réserve : tes charges reviendront vite.
      </span>
    </div>
  );
}
