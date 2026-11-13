"use client";

/* Séance guidée (maquette validée le 13 novembre 2026) : choix des muscles, bandeau du gabarit,
   cases vides et feuille « Choisir pour la case ». Tout vit dans le composeur. */
import { useState } from "react";
import { CaretRightIcon, InfoIcon, PlusIcon, SparkleIcon } from "@phosphor-icons/react";
import { tr } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Drawer, DrawerContent, DrawerDescription, DrawerTitle } from "@/components/ui/drawer";
import { EX } from "@/lib/data/exercices";
import { MUSC, PAT2MUSC } from "@/lib/data/referentiels";
import { avisMuscles } from "@/lib/logic/avis-seance";
import { autresDuMuscle, candidatsCase, compte, type CaseG, type Gabarit } from "@/lib/logic/gabarit";
import { effortsEndurance } from "@/lib/logic/recommandation";
import { roleDe } from "@/lib/logic/roles";
import type { RoleEx } from "@/lib/logic/types";
import { useRepere } from "@/lib/store";
import { tactile } from "@/lib/repos";
import { cn } from "@/lib/utils";
import { LigneExercice } from "./ligne-exercice";
import { nomRole, pourquoiRole } from "./role-exercice";
import { Segmente } from "./segmente";
import { SchemaCorps } from "./schema-corps";

export const nomMuscle = (k: string) => MUSC.find((g) => g.k === k)?.n ?? k;
/* « Complément · Dos » */
export const nomCase = (c: CaseG) => `${nomRole(c.ro)} · ${nomMuscle(c.k)}`;
const SOUS_BLOC: Record<RoleEx, () => string> = {
  b: () => tr("les gros mouvements, en premier"),
  c: () => tr("un autre angle, un peu moins lourd"),
  i: () => tr("un seul muscle, plus léger"),
  g: () => tr("abdos et bas du dos, pour finir"),
};

/* « Quels muscles aujourd'hui ? » : l'état vide d'« Exercice par exercice ». Les muscles se
   choisissent sur le corps (comme dans l'assistant) ou en liste, puis le matériel, avant de
   préparer les cases. */
export function ChoixMuscles({ initial, jour, onPreparer, autre, jamais, materiel }: { initial: string[]; jour: string; onPreparer: (m: string[]) => void; autre: { n: string; f: () => void }; jamais?: () => void; materiel?: React.ReactNode }) {
  const etat = useRepere((s) => s.etat);
  const [m, setM] = useState(initial);
  const [vue, setVue] = useState<"corps" | "liste">("corps");
  const bascule = (k: string) => { tactile(6); setM((l) => (l.includes(k) ? l.filter((x) => x !== k) : [...l, k])); };
  /* un muscle qui récupère encore : on le dit, sans bloquer */
  const recup = avisMuscles(m, { H: etat.HIST, auj: jour, efforts: effortsEndurance(etat.SORTIES, etat.CARDIO, etat.A.avant) }).find((a) => a.id === "recup");
  return (
    <div className="flex flex-col gap-3 rounded-[20px] border border-border/80 bg-card p-4">
      <div>
        <h3 className="text-[18px] font-bold">{tr("Quels muscles aujourd'hui ?")}</h3>
        <p className="mt-1 text-[13.5px] leading-snug text-muted-foreground">{tr("Oxa te prépare les cases à remplir : quoi faire en premier, quoi pour finir. Tu choisis les exercices.")}</p>
      </div>
      <Segmente label={tr("Mode de sélection")} valeur={vue} onChange={setVue} options={[{ v: "corps", n: tr("Sur le corps") }, { v: "liste", n: tr("Liste") }]} />
      {vue === "corps" ? (
        <SchemaCorps
          actif={(r) => !!(r.p && PAT2MUSC[r.p])}
          choisi={(r) => !!(r.p && m.includes(PAT2MUSC[r.p]))}
          onToucher={(r) => r.p && bascule(PAT2MUSC[r.p])}
          legende={tr("Touche un muscle pour le cocher")}
        />
      ) : (
        <div className="flex flex-wrap gap-1.5">
          {MUSC.map((g) => (
            <button key={g.k} aria-pressed={m.includes(g.k)} onClick={() => bascule(g.k)}
              className={cn("h-10 rounded-full border px-4 text-[14px] font-medium transition-colors", m.includes(g.k) ? "border-foreground bg-foreground text-background" : "border-border bg-background")}>
              {g.n}
            </button>
          ))}
        </div>
      )}
      <p className={cn("px-1 text-[14px] font-medium", !m.length && "text-muted-foreground")}>{m.length ? m.map(nomMuscle).join(" · ") : tr("Aucun muscle choisi pour l'instant.")}</p>
      {recup && <p className="text-[12.5px] leading-snug text-muted-foreground">{recup.titre} {recup.texte}</p>}
      {/* le matériel, avant de préparer les cases : les suggestions en dépendent */}
      {materiel}
      <Button variant="plate" size="lg" className="rounded-full" disabled={!m.length} onClick={() => { tactile(10); onPreparer(m); }}>{tr("Préparer mes cases")}</Button>
      <button onClick={autre.f} className="h-10 text-[14px] font-semibold text-muted-foreground">{autre.n}</button>
      {/* un coach, ou qui préfère la page blanche : plus de cases, Profil les rétablit */}
      {jamais && <button onClick={() => { tactile(6); jamais(); }} className="-mt-2 h-9 text-[12.5px] font-medium text-muted-foreground underline underline-offset-2">{tr("Ne plus me proposer les cases")}</button>}
    </div>
  );
}

/* Le plan de la séance (design v2) : une carte blanche comme toutes les cartes de l'app ; durée,
   composition (rôles absents masqués), « Compléter les N cases vides », puis Pourquoi · Vider · Sans cases. */
export function BandeauGabarit({ g, vides, onModifier, onDuree, onCompleter, onVider, onSans }: { g: Gabarit; vides: number[]; onModifier: () => void; onDuree: (d: number) => void; onCompleter: () => void; onVider: () => void; onSans: () => void }) {
  const [vu, setVu] = useState(false);
  const n = compte(g.cases), roles = (["b", "c", "i", "g"] as RoleEx[]).filter((r) => n[r]);
  const lien = "inline-flex h-11 items-center px-2 text-[13.5px] font-semibold text-muted-foreground active:opacity-70";
  return (
    <section aria-label={tr("Ton plan de séance")} className="flex flex-col gap-3 rounded-[20px] border border-border/80 bg-card px-3.5 pt-3.5 shadow-[0_1px_2px_rgb(10_10_12/0.05)]">
      <div className="flex items-center gap-2">
        <h2 className="titre min-w-0 flex-1 text-[18px] leading-tight">{tr("Ton plan")} · <span className="num text-[20px]">{g.cases.length}</span> {tr("exercices")}</h2>
        <button onClick={onModifier} className="-my-2.5 -mr-1.5 inline-flex h-11 shrink-0 items-center px-1.5 text-[14px] font-semibold text-plate-ink dark:text-plate">{tr("Muscles")}</button>
      </div>
      <Segmente label={tr("Durée de la séance")} valeur={g.d} onChange={(d) => { tactile(6); onDuree(d); }} options={[30, 45, 60].map((d) => ({ v: d, n: tr("{a} min", { a: d }) }))} />
      <p className="text-[14px] leading-snug text-muted-foreground">
        {roles.map((r, k) => <span key={r}>{k > 0 && " · "}<b className="num text-[19px] font-bold text-foreground">{n[r]}</b> {nomRole(r)}</span>)}
      </p>
      {vides.length > 0 && (
        <Button variant="soft" className="h-11 w-full rounded-full bg-plate-soft text-[15px] font-bold text-plate-ink dark:text-plate" onClick={onCompleter}>
          <SparkleIcon weight="fill" />{tr(vides.length > 1 ? "Compléter les {n} cases vides" : "Compléter la case vide", { n: vides.length })}
        </Button>
      )}
      {vu && <p className="animate-in fade-in-0 text-[13px] leading-snug text-muted-foreground">{tr("Ce sont les cases qu'Oxa remplirait pour ces muscles, ton niveau et cette durée : chaque grand muscle commence par une Base, puis un autre angle, puis l'isolation. Rien n'est obligatoire : les cases vides disparaissent quand tu enregistres.")}</p>}
      <div className="-mx-3.5 flex items-center border-t border-border/70 px-2 whitespace-nowrap">
        <button onClick={() => { tactile(4); setVu(!vu); }} aria-expanded={vu} className={cn(lien, "gap-1.5")}><InfoIcon className="size-4" />{tr("Pourquoi ces cases ?")}</button>
        <span className="flex-1" />
        {vides.length < g.cases.length && <button onClick={onVider} className={lien}>{tr("Vider")}</button>}
        {/* cette fois sans cases : les exercices choisis restent, les cases vides disparaissent */}
        <button onClick={() => { tactile(6); onSans(); }} className={lien}>{tr("Sans cases")}</button>
      </div>
    </section>
  );
}

export function TitreBloc({ ro, n }: { ro: RoleEx; n: number }) {
  return (
    <div className="mt-2 flex items-baseline gap-2 px-1 first:mt-0">
      <h4 className="titre text-[19px]">{nomRole(ro)}</h4>
      <span className="num text-[17px] font-semibold text-muted-foreground">{n}</span>
      <span className="truncate text-[13.5px] text-muted-foreground">{SOUS_BLOC[ro]()}</span>
    </div>
  );
}

/* Une case vide : touchée, elle ouvre la feuille de choix. */
export function CaseVide({ c, exemples, onClick }: { c: CaseG; exemples: string[]; onClick: () => void }) {
  return (
    <button onClick={() => { tactile(6); onClick(); }} className="flex items-center gap-3 rounded-[18px] border-[1.5px] border-dashed border-muted-foreground/50 p-3 text-left active:scale-[.99]">
      <span className="grid size-10 shrink-0 place-items-center rounded-full border border-border bg-card"><PlusIcon className="size-4" weight="bold" /></span>
      <span className="min-w-0">
        <span className="block text-[15px] font-semibold">{nomCase(c)}</span>
        {exemples.length > 0 && <span className="block truncate text-[12.5px] text-muted-foreground">{exemples.map((o) => EX[o].n).join(", ")}…</span>}
      </span>
    </button>
  );
}

/* « Choisir pour la case » : la suggestion d'Oxa, les autres exercices du même rôle, puis ceux des
   autres rôles. Après un choix, la feuille passe à la case vide suivante (onChoisir le décide). */
export function FeuilleCase({ g, i, rang, total, sel, sug, pris, onChoisir, onFiche, onClose }: {
  g: Gabarit; i: number | null; rang: number; total: number; sel: string[]; sug?: string; pris: (o: string) => boolean;
  onChoisir: (id: string) => void; onFiche: (id: string) => void; onClose: () => void;
}) {
  const [tout, setTout] = useState(false);
  const c = i != null ? g.cases[i] : null;
  const autres = c ? candidatsCase(c, sel, pris).filter((o) => o !== sug) : [];
  const ailleurs = c && tout ? autresDuMuscle(c, sel, pris) : [];
  const choisir = (o: string) => { tactile(8); setTout(false); onChoisir(o); };
  return (
    <Drawer open={!!c} onOpenChange={(o) => { if (!o) { setTout(false); onClose(); } }} repositionInputs={false}>
      <DrawerContent className="h-[88dvh] max-h-[88dvh]">
        {c && (
          <>
            <div className="flex items-start gap-3 px-5 pt-2">
              <div className="min-w-0 flex-1">
                <p className="text-[12px] font-semibold text-muted-foreground">{tr("Case {a} sur {b} à remplir", { a: rang, b: total })}</p>
                <DrawerTitle className="text-[21px] font-bold">{nomCase(c)}</DrawerTitle>
              </div>
              <Button variant="soft" className="shrink-0 rounded-full px-4" onClick={() => { setTout(false); onClose(); }}>{tr("Terminé")}</Button>
            </div>
            <DrawerDescription className="px-5 pt-1 text-[13.5px] leading-snug text-muted-foreground">{pourquoiRole(c.ro)}</DrawerDescription>
            <div className="mt-3 flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto overscroll-contain px-4 pb-[max(env(safe-area-inset-bottom),20px)]">
              {sug && (
                <section className="flex flex-col gap-1.5">
                  <h4 className="eyebrow px-1">{tr("Suggestion d'Oxa")}</h4>
                  <div className="rounded-[20px] ring-2 ring-foreground/80">
                    <LigneExercice id={sug} ro={roleDe(sug, c.k)} onOuvrir={() => onFiche(sug)} onAjouter={() => choisir(sug)} />
                  </div>
                </section>
              )}
              {autres.length > 0 && (
                <section className="flex flex-col gap-1.5">
                  <h4 className="eyebrow px-1">{tr("Autres choix · {n}", { n: autres.length })}</h4>
                  {autres.map((o) => <LigneExercice key={o} id={o} ro={roleDe(o, c.k)} onOuvrir={() => onFiche(o)} onAjouter={() => choisir(o)} />)}
                </section>
              )}
              {!sug && !autres.length && <p className="px-1 text-[13.5px] text-muted-foreground">{tr("Aucun exercice pour cette case avec ce matériel.")}</p>}
              {!tout ? (
                <button onClick={() => setTout(true)} className="flex items-center gap-1 self-start px-1 text-[14px] font-semibold text-plate-ink dark:text-plate">
                  {tr("Voir tous les exercices : {m}", { m: nomMuscle(c.k).toLowerCase() })}<CaretRightIcon className="size-3.5" weight="bold" />
                </button>
              ) : ailleurs.length > 0 && (
                <section className="flex flex-col gap-1.5">
                  <h4 className="eyebrow px-1">{tr("Autres rôles · ils vont dans leur bloc")}</h4>
                  {ailleurs.map((o) => <LigneExercice key={o} id={o} ro={roleDe(o, c.k)} onOuvrir={() => onFiche(o)} onAjouter={() => choisir(o)} />)}
                </section>
              )}
            </div>
          </>
        )}
      </DrawerContent>
    </Drawer>
  );
}
