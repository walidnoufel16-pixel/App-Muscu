"use client";

/* « Plus d'entraînements » (maquette validée le 14 novembre 2026, option A) : l'accueil reste centré
   sur la musculation ; Oxa Street, Oxa Run, Soin & mobilité, le cardio et les défis sont rangés
   dans un écran à part. Chacun peut être épinglé : il apparaît alors sur l'accueil. */
import type { Route } from "next";
import { useRouter } from "next/navigation";
import { CaretRightIcon, PushPinIcon, TrophyIcon } from "@phosphor-icons/react";
import { tr } from "@/lib/i18n";
import { noter } from "@/lib/mesure";
import { AVANT } from "@/lib/nav";
import { tactile } from "@/lib/repos";
import { useRepere } from "@/lib/store";
import { cn } from "@/lib/utils";
import { lienRubrique, Photo } from "./rubriques";

export type Autre = "street" | "course" | "soin" | "cardio" | "defis";
export const AUTRES: Autre[] = ["street", "course", "soin", "cardio", "defis"];

/* Les univers de marque (Oxa Street, Oxa Run) ne se traduisent pas. */
const DEF: Record<Autre, { nom: () => string; texte: () => string; lien: Route; photo?: string; fond: string }> = {
  street: { nom: () => "Oxa Street", texte: () => tr("Poids du corps et barre, programmes par niveau"), lien: lienRubrique("street"), photo: "rubrique-street", fond: "var(--street)" },
  course: { nom: () => "Oxa Run", texte: () => tr("10 km, semi, marathon ou Hyrox : un plan jusqu'au jour J"), lien: lienRubrique("course"), photo: "rubrique-run", fond: "#9a4a1c" },
  soin: { nom: () => tr("Soin & mobilité"), texte: () => tr("Routines courtes par zone, pour bouger sans douleur"), lien: lienRubrique("soin"), photo: "seance-soin", fond: "#5d6b55" },
  cardio: { nom: () => tr("Cardio"), texte: () => tr("Fractionné ou endurance, seul ou dans une séance combinée"), lien: "/entrainement/assistant?type=cardio" as Route, photo: "seance-cardio", fond: "#9f1239" },
  defis: { nom: () => tr("Défis"), texte: () => tr("Un objectif à plusieurs, entre amis"), lien: "/progres#defis" as Route, fond: "#b45309" },
};

/** Les entraînements épinglés sur l'accueil (dans l'ordre de la liste). */
export function useEpingles(): Autre[] {
  const e = useRepere((s) => s.etat.A.epingles);
  return AUTRES.filter((a) => e?.includes(a));
}

function Vignette({ a }: { a: Autre }) {
  const d = DEF[a];
  return (
    <span className="relative grid size-14 shrink-0 place-items-center overflow-hidden rounded-[14px] text-white" style={{ background: d.fond }}>
      {d.photo ? <Photo nom={d.photo} className="absolute inset-0 size-full" /> : <TrophyIcon className="size-7" weight="fill" />}
    </span>
  );
}

/** Une ligne : vignette, nom, phrase ; sur l'écran « Plus d'entraînements », le bouton pour l'épingler. */
export function LigneAutre({ a, epingle }: { a: Autre; epingle?: boolean }) {
  const router = useRouter();
  const muter = useRepere((s) => s.muter);
  const pris = useEpingles().includes(a);
  const d = DEF[a];
  const basculer = () => {
    tactile(6);
    muter((E) => { const l = (E.A.epingles ?? []).filter((x) => x !== a); E.A.epingles = pris ? l : [...l, a]; });
  };
  return (
    <div className="flex items-center gap-1 rounded-[20px] border border-border/80 bg-card pr-1.5">
      <button data-visite={`autre-${a}`} onClick={() => { noter("rubrique_ouverte", { r: a }); router.push(d.lien, AVANT); }}
        className="flex min-w-0 flex-1 items-center gap-3 p-2.5 text-left">
        <Vignette a={a} />
        <span className="min-w-0 flex-1">
          <span className="titre block text-[17px] leading-tight">{d.nom()}</span>
          <span className="mt-0.5 block text-[12.5px] leading-snug text-muted-foreground">{d.texte()}</span>
        </span>
        {!epingle && <CaretRightIcon className="size-4 shrink-0 text-muted-foreground" />}
      </button>
      {epingle && (
        <button onClick={basculer} aria-pressed={pris} aria-label={pris ? tr("Retirer {n} de l'accueil", { n: d.nom() }) : tr("Épingler {n} sur l'accueil", { n: d.nom() })}
          className={cn("grid size-11 shrink-0 place-items-center rounded-full", pris ? "bg-plate-soft text-plate-ink dark:text-plate" : "text-muted-foreground")}>
          <PushPinIcon className="size-5" weight={pris ? "fill" : "regular"} />
        </button>
      )}
    </div>
  );
}

/** Les deux entrées du bas de l'accueil : Mes séances, puis Plus d'entraînements. */
export function EntreesAccueil() {
  const router = useRouter();
  const n = useRepere((s) => s.etat.SEANCES.filter((x) => !x.auto).length + (s.etat.SEANCES_CARDIO?.length ?? 0));
  const ligne = (cle: string, nom: string, texte: string, lien: Route, accent?: boolean) => (
    <button data-visite={cle} onClick={() => { noter("rubrique_ouverte", { r: cle.replace("rubrique-", "") }); router.push(lien, AVANT); }}
      className={cn("flex w-full items-center gap-3 rounded-[20px] border bg-card px-4 py-3 text-left active:bg-muted", accent ? "border-[1.5px] border-plate" : "border-border/80")}>
      <span className="min-w-0 flex-1">
        <span className="block text-[15.5px] font-bold">{nom}</span>
        <span className="block truncate text-[12.5px] text-muted-foreground">{texte}</span>
      </span>
      <CaretRightIcon className={cn("size-4 shrink-0", accent ? "text-plate-ink dark:text-plate" : "text-muted-foreground")} weight={accent ? "bold" : "regular"} />
    </button>
  );
  return (
    <div className="flex flex-col gap-2">
      {ligne("rubrique-libre", tr("Mes séances"), n === 1 ? tr("1 enregistrée") : n ? tr("{n} enregistrées", { n }) : tr("Crée ta séance, ou parcours les exercices"), lienRubrique("libre"))}
      {ligne("rubrique-plus", tr("Plus d'entraînements"), tr("Street, course, Hyrox, mobilité, cardio, défis"), "/entrainement/plus" as Route, true)}
    </div>
  );
}
