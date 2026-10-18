"use client";

import { tr } from "@/lib/i18n";
import { useRouter } from "next/navigation";
import { CheckIcon, PlusIcon, SparkleIcon } from "@phosphor-icons/react";
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

function CarteProgramme({ p }: { p: ProgrammeStreet }) {
  const ajouter = useAjouterProgramme();
  const deja = useRepere((s) => p.seances.every((x) => s.etat.SEANCES.some((y) => y.street === `${p.niv}-${x.k}`)));
  return (
    <div className="rounded-[22px] border border-border/80 bg-card p-3.5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-[17px] font-bold tracking-[-0.01em]">{p.nom}</div>
          <p className="mt-0.5 text-[13px] leading-snug text-muted-foreground">{p.but}</p>
        </div>
        <span className="shrink-0 rounded-full bg-plate-soft px-2.5 py-1 text-[11.5px] font-semibold text-plate-ink">{tr("3 séances / sem.")}</span>
      </div>
      <ol className="mt-3 flex flex-col gap-1.5">
        {p.seances.map((s) => (
          <li key={s.k} className="flex items-center gap-2.5">
            <span className="flex -space-x-2.5">{s.ex.slice(0, 3).map((e) => <Vignette key={e.id} id={e.id} className="size-8 rounded-[9px] ring-2 ring-card" />)}</span>
            <span className="min-w-0 flex-1 truncate text-[13.5px]"><b className="font-semibold">{s.k}</b>{" · "}{s.nom}</span>
            <span className="text-[12px] text-muted-foreground">{tr("{n} exos", { n: s.ex.length })}</span>
          </li>
        ))}
      </ol>
      <button onClick={() => ajouter(p)} className="mt-3 flex h-11 w-full items-center justify-center gap-2 rounded-full bg-plate text-[14.5px] font-semibold text-plate-foreground active:scale-[.98]">
        {deja ? <CheckIcon className="size-4" weight="bold" /> : <PlusIcon className="size-4" weight="bold" />}
        {deja ? tr("Dans Mes séances · ouvrir la séance A") : tr("Ajouter à mes séances")}
      </button>
    </div>
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
          {PROGRAMMES_STREET.map((p) => <CarteProgramme key={p.niv} p={p} />)}
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
