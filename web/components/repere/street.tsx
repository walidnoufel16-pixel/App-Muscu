"use client";

import { tr } from "@/lib/i18n";
import { useRouter } from "next/navigation";
import { CaretRightIcon, CheckIcon, PlusIcon, SparkleIcon } from "@phosphor-icons/react";
import { useState } from "react";
import { Drawer, DrawerContent, DrawerDescription, DrawerTitle } from "@/components/ui/drawer";
import { musclesDe } from "@/lib/logic/core";
import { Segmente } from "./segmente";
import { toast } from "sonner";
import { EX } from "@/lib/data/exercices";
import { FAMILLES_STREET, MATERIEL_STREET, PROGRAMMES_STREET, type ProgrammeStreet } from "@/lib/data/street";
import { useRepere } from "@/lib/store";
import { useBrouillon } from "@/lib/brouillon";
import { AVANT } from "@/lib/nav";
import { LigneExercice } from "./ligne-exercice";
import { Vignette } from "./exercice-carte";

/* Ajoute les trois séances d'un niveau à Mes séances (groupe Street workout), sans doublon,
   puis ouvre la première. */
export function useAjouterProgramme() {
  const router = useRouter();
  const muter = useRepere((s) => s.muter);
  return (p: ProgrammeStreet) => {
    const ajoutees = p.seances.filter((s) => !useRepere.getState().etat.SEANCES.some((x) => x.street === `${p.niv}-${s.k}`)).length;
    muter((E) => {
      p.seances.forEach((s) => {
        const cle = `${p.niv}-${s.k}`;
        if (!E.SEANCES.some((x) => x.street === cle)) E.SEANCES.push({ nom: `${s.k} · ${s.nom}`, ex: s.ex.map((e) => ({ ...e })), street: cle });
      });
    });
    if (ajoutees) toast.success(tr("Programme {nom} : {n} séances ajoutées à Mes séances", { nom: p.nom, n: ajoutees }));
    const i = useRepere.getState().etat.SEANCES.findIndex((x) => x.street === `${p.niv}-A`);
    router.push(`/entrainement/seance?l=${i}`, AVANT);
  };
}

function CarteProgramme({ p, onFiche }: { p: ProgrammeStreet; onFiche: (id: string) => void }) {
  const ajouter = useAjouterProgramme();
  const deja = useRepere((s) => p.seances.every((x) => s.etat.SEANCES.some((y) => y.street === `${p.niv}-${x.k}`)));
  const [apercu, setApercu] = useState<string | null>(null); // séance montrée sans être ajoutée
  return (
    <div className="rounded-[22px] border border-border/80 bg-card p-3.5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-[17px] font-bold tracking-[-0.01em]">{p.nom}</div>
          <p className="mt-0.5 text-[13px] leading-snug text-muted-foreground">{p.but}</p>
        </div>
        <span className="shrink-0 rounded-full bg-plate-soft px-2.5 py-1 text-[11.5px] font-semibold text-plate-ink">{tr("3 séances / sem.")}</span>
      </div>
      <ol className="mt-3 flex flex-col gap-0.5">
        {p.seances.map((s) => (
          <li key={s.k}>
            <button onClick={() => setApercu(s.k)} aria-label={tr("Voir la séance {k} · {nom}", { k: s.k, nom: s.nom })} className="-mx-1.5 flex w-[calc(100%+12px)] items-center gap-2.5 rounded-xl px-1.5 py-1 text-left active:bg-muted">
              <span className="flex -space-x-2.5">{s.ex.slice(0, 3).map((e) => <Vignette key={e.id} id={e.id} className="size-8 rounded-[9px] ring-2 ring-card" />)}</span>
              <span className="min-w-0 flex-1 truncate text-[13.5px]"><b className="font-semibold">{s.k}</b>{" · "}{s.nom}</span>
              <span className="text-[12px] text-muted-foreground">{tr("{n} exos", { n: s.ex.length })}</span>
              <CaretRightIcon className="size-4 shrink-0 text-muted-foreground" />
            </button>
          </li>
        ))}
      </ol>
      <button onClick={() => ajouter(p)} className="mt-3 flex h-11 w-full items-center justify-center gap-2 rounded-full bg-plate text-[14.5px] font-semibold text-plate-foreground active:scale-[.98]">
        {deja ? <CheckIcon className="size-4" weight="bold" /> : <PlusIcon className="size-4" weight="bold" />}
        {deja ? tr("Dans Mes séances · ouvrir la séance A") : tr("Ajouter à mes séances")}
      </button>
      <ApercuProgramme p={p} k={apercu} setK={setApercu} deja={deja} onAjouter={() => { setApercu(null); ajouter(p); }} onFiche={onFiche} />
    </div>
  );
}

/* Aperçu d'un programme, séance par séance, sans rien ajouter à Mes séances. */
function ApercuProgramme({ p, k, setK, deja, onAjouter, onFiche }: { p: ProgrammeStreet; k: string | null; setK: (k: string | null) => void; deja: boolean; onAjouter: () => void; onFiche: (id: string) => void }) {
  const s = p.seances.find((x) => x.k === k);
  return (
    <Drawer open={!!s} onOpenChange={(o) => !o && setK(null)}>
      <DrawerContent className="max-h-[92dvh]">
        {s && (
          <div className="flex min-h-0 flex-col">
            <div className="px-5 pt-2">
              <DrawerTitle className="text-[20px] font-bold">{tr("Programme {nom}", { nom: p.nom.toLowerCase() })}</DrawerTitle>
              <DrawerDescription className="mt-0.5 text-[13px] text-muted-foreground">{tr("Séance {k} · {nom}", { k: s.k, nom: s.nom })}</DrawerDescription>
              <Segmente className="mt-3" label={tr("Séance")} valeur={s.k} onChange={setK} options={p.seances.map((x) => ({ v: x.k, n: x.k }))} />
            </div>
            <ol className="mt-3 flex min-h-0 flex-col gap-1.5 overflow-y-auto px-4 pb-3" aria-label={tr("Exercices de la séance {k}", { k: s.k })}>
              {s.ex.map((e, i) => {
                const x = EX[e.id];
                if (!x) return null;
                const prescr = x.ch === "temps" ? `${e.s} × ${e.r} s` : x.ch === "dist" ? `${e.s} × ${e.r} m` : `${e.s} × ${e.r}`;
                return (
                  <li key={e.id + i}>
                    <button onClick={() => onFiche(e.id)} className="flex w-full items-center gap-3 rounded-[18px] border border-border/80 bg-card p-2.5 text-left active:scale-[.99]">
                      <Vignette id={e.id} num={i + 1} className="size-14" />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[15px] font-semibold">{x.n}</span>
                        <span className="block truncate text-[12.5px] text-muted-foreground">{musclesDe([e.id]).join(" · ")}</span>
                        <span className="num block text-[14px] font-semibold text-foreground/80">{prescr}<span className="font-sans text-[12px] font-normal text-muted-foreground">{" "}{tr("· repos {repos}", { repos: e.p })}</span></span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ol>
            <div className="border-t border-border/70 px-4 pt-3 pb-[max(env(safe-area-inset-bottom),16px)]">
              <button onClick={onAjouter} className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-plate text-[15px] font-semibold text-plate-foreground active:scale-[.98]">
                {deja ? <CheckIcon className="size-4" weight="bold" /> : <PlusIcon className="size-4" weight="bold" />}
                {deja ? tr("Dans Mes séances · ouvrir la séance A") : tr("Ajouter le programme à mes séances")}
              </button>
            </div>
          </div>
        )}
      </DrawerContent>
    </Drawer>
  );
}

/* Onglet « Street » de la bibliothèque : programmes par niveau, séance sur mesure, familles d'exercices. */
export function VueStreet({ onFiche }: { onFiche: (id: string) => void }) {
  const router = useRouter();
  const setSel = useBrouillon((s) => s.setSel);
  const surMesure = () => { setSel(MATERIEL_STREET); router.push("/entrainement/assistant", AVANT); };
  return (
    <div className="flex flex-col gap-6">
      <p className="rounded-[18px] bg-plate-soft p-3.5 text-[13.5px] leading-relaxed">
        {tr("Poids du corps et barre de traction. Choisis ton niveau : trois séances par semaine, à enchaîner A, B, C. Chaque famille d'exercices est rangée de la variante la plus facile à la plus dure.")}
      </p>
      <section aria-label={tr("Programmes street workout")}>
        <h3 className="mb-2 px-1 text-[19px] font-bold">{tr("Programmes")}</h3>
        <div className="flex flex-col gap-2.5">
          {PROGRAMMES_STREET.map((p) => <CarteProgramme key={p.niv} p={p} onFiche={onFiche} />)}
          <button onClick={surMesure} className="flex w-full items-center gap-3 rounded-[20px] border border-dashed border-border bg-card/60 p-3.5 text-left active:scale-[.99]">
            <span className="grid size-10 place-items-center rounded-full bg-plate-soft text-plate"><SparkleIcon className="size-5" weight="fill" /></span>
            <span className="min-w-0 flex-1">
              <span className="block text-[15px] font-semibold">{tr("Une séance street sur mesure")}</span>
              <span className="block text-[12.5px] text-muted-foreground">{tr("Tu choisis les muscles et la durée, Repère compose avec le poids du corps et la barre.")}</span>
            </span>
          </button>
        </div>
      </section>
      {FAMILLES_STREET.map((f) => (
        <section key={f.k} aria-label={f.n}>
          <h3 className="mb-2 px-1 text-[19px] font-bold">{f.n}</h3>
          <div className="flex flex-col gap-1.5">
            {f.ex.filter((o) => EX[o]).map((o) => <LigneExercice key={o} id={o} onOuvrir={() => onFiche(o)} />)}
          </div>
        </section>
      ))}
    </div>
  );
}
