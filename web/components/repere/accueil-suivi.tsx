"use client";

/* Accueil du mode Suivi (docs/produit/mode-suivi, maquette 3-accueil-suivi.png) : la semaine et la
   récupération (comme en Guidé), Mes séances (« Commencer » sur la prochaine, « Dernière fois jeudi ·
   squat 80 × 10 »), « + Nouvelle séance », puis le corps pour composer une séance par muscles. Ni séance proposée, ni rubriques : Repas, Street,
   Course et la création automatique restent dans le menu (☰). */
import { loc, tr } from "@/lib/i18n";
import { useMemo } from "react";
import { useRouter } from "next/navigation";
import type { Route } from "next";
import { CaretRightIcon, PlusIcon } from "@phosphor-icons/react";
import { Vignette } from "./exercice-carte";
import { SemaineAnneaux } from "./accueil-entrainement";
import { LigneRecuperation } from "./recuperation";
import { CorpsDuJour } from "./corps-du-jour";
import { lienRubrique } from "./rubriques";
import type { Feuille } from "./agenda";
import { EX } from "@/lib/data/exercices";
import { nb } from "@/lib/logic/core";
import { dateDe } from "@/lib/logic/historique";
import { derniereFois, prochaineSeance, quandRelatif, seancesSuivies } from "@/lib/logic/mode";
import { useBrouillon } from "@/lib/brouillon";
import { useRepere } from "@/lib/store";
import { AVANT } from "@/lib/nav";
import { tactile } from "@/lib/repos";
import { cn } from "@/lib/utils";

/** « Dernière fois jeudi · squat barre 80 × 10 », ou « Pas encore faite ». */
function texteDerniere(E: Parameters<typeof derniereFois>[0], i: number, auj: string, detail: boolean) {
  const f = derniereFois(E, i);
  if (!f) return tr("Pas encore faite");
  const q = quandRelatif(f.d, auj);
  const jour = q === "auj" ? tr("aujourd'hui") : q === "hier" ? tr("hier")
    : typeof q === "number" ? dateDe(f.d).toLocaleDateString(loc(), { weekday: "long" })
    : tr("le {d}", { d: dateDe(f.d).toLocaleDateString(loc(), { day: "numeric", month: "short" }).replace(".", "") });
  const ex = detail && f.ex ? ` · ${(EX[f.ex.id]?.n || "").toLowerCase()} ${nb(f.ex.v)} × ${f.ex.reps}` : "";
  return tr("Dernière fois {j}", { j: jour }) + ex;
}

export function AccueilSuivi({ auj, setF }: { auj: string; setF: (f: Feuille) => void }) {
  const router = useRouter();
  const etat = useRepere((s) => s.etat);
  const setLibre = useBrouillon((s) => s.setLibre);
  const liste = useMemo(() => seancesSuivies(etat), [etat]);
  const p = useMemo(() => prochaineSeance(etat, liste), [etat, liste]);
  const autres = liste.filter((i) => i !== p);
  const ouvrir = (i: number) => { tactile(8); router.push(`/entrainement/seance?l=${i}` as Route, AVANT); };
  const nouvelle = () => { tactile(6); setLibre({ nom: "", ex: [], idx: null }); router.push("/entrainement/composer", AVANT); };
  const debutant = !etat.HIST?.length && !etat.CARDIO?.length && !etat.SORTIES?.length;

  const vignettes = (i: number, grand: boolean) => (
    <span className="flex shrink-0 -space-x-3">
      {etat.SEANCES[i].ex.slice(0, 3).map((e) => EX[e.id] && <Vignette key={e.id} id={e.id} className={cn("rounded-[12px] ring-2 ring-card", grand ? "size-11" : "size-10")} />)}
    </span>
  );

  return (
    <>
      {!debutant && <SemaineAnneaux auj={auj} setF={setF} />}
      {/* la récupération, comme en Guidé */}
      {!debutant && <LigneRecuperation auj={auj} />}

      <section aria-label={tr("Mes séances")} className="mt-1 flex flex-col gap-2">
        <h2 className="eyebrow px-1">{tr("Mes séances")}</h2>
        {p == null ? (
          <button onClick={nouvelle} className="rounded-[20px] border-2 border-dashed border-plate/60 bg-card/60 p-5 text-left active:scale-[.99]">
            <span className="block text-[17px] font-bold">{tr("Écris ta première séance")}</span>
            <span className="mt-1 block text-[13.5px] leading-snug text-muted-foreground">{tr("Comme dans ton carnet : tes exercices, tes séries, tes répétitions. Pendant la séance, Oxa te propose ta charge.")}</span>
          </button>
        ) : (
          <div data-seance-prochaine className="rounded-[20px] border-2 border-plate bg-card p-3">
            <button onClick={() => ouvrir(p)} className="flex w-full items-center gap-3 text-left">
              {vignettes(p, true)}
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[16.5px] font-bold tracking-[-0.01em]">{etat.SEANCES[p].nom}</span>
                <span className="block truncate text-[12.5px] text-muted-foreground">{texteDerniere(etat, p, auj, true)}</span>
              </span>
            </button>
            <button onClick={() => ouvrir(p)} className="mt-2.5 h-11 w-full rounded-full bg-plate text-[15.5px] font-semibold text-plate-foreground active:scale-[.98]">{tr("Commencer")}</button>
          </div>
        )}
        {autres.map((i) => (
          <button key={i + etat.SEANCES[i].nom} onClick={() => ouvrir(i)} className="flex items-center gap-3 rounded-[20px] bg-card p-3 text-left active:scale-[.99]">
            {vignettes(i, false)}
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[15.5px] font-semibold tracking-[-0.01em]">{etat.SEANCES[i].nom}</span>
              <span className="block truncate text-[12.5px] text-muted-foreground">{texteDerniere(etat, i, auj, false)}</span>
            </span>
            <CaretRightIcon className="size-4 shrink-0 text-muted-foreground" />
          </button>
        ))}
        <div className="flex items-center justify-between px-1 pt-0.5">
          <button onClick={nouvelle} className="flex items-center gap-1.5 py-1.5 text-[14.5px] font-semibold text-plate-ink dark:text-plate">
            <PlusIcon className="size-4" weight="bold" />{tr("Nouvelle séance")}
          </button>
          {/* partager une séance, en importer une avec un code : dans la liste complète */}
          <button onClick={() => { tactile(5); router.push(lienRubrique("libre"), AVANT); }} className="flex items-center gap-0.5 py-1.5 text-[13.5px] font-medium text-muted-foreground">
              {tr("Partager, importer")}<CaretRightIcon className="size-3.5" />
          </button>
        </div>
      </section>

      {/* le corps : toucher des muscles propose leurs exercices pour composer sa séance */}
      <div className="mt-3"><CorpsDuJour titre={liste.length ? tr("Envie d'autre chose ? Choisis tes muscles du jour") : tr("Qu'est-ce que tu travailles aujourd'hui ?")} /></div>
    </>
  );
}

/** Comptes d'avant le réglage (mode jamais choisi, donc Guidé) : une seule carte, sur l'accueil,
    qui propose le mode Suivi. Elle disparaît dès qu'on répond. */
export function CarteModeSuivi() {
  const montrer = useRepere((s) => !s.etat.A.mode && !s.etat.A.carteSuivi);
  const muter = useRepere((s) => s.muter);
  if (!montrer) return null;
  const repondre = (suivi: boolean) => { tactile(suivi ? 10 : 5); muter((E) => { E.A.carteSuivi = true; E.A.mode = suivi ? "suivi" : "guide"; }); };
  return (
    <section aria-label={tr("Mode Suivi")} className="rounded-[20px] border-2 border-plate/70 bg-card p-4">
      <span className="inline-block rounded-full bg-plate px-2.5 py-1 text-[11px] font-extrabold tracking-[0.04em] text-plate-foreground uppercase">{tr("Nouveau · Mode Suivi")}</span>
      <h2 className="mt-2 text-[17px] leading-tight font-bold">{tr("Tu as déjà ton programme ?")}</h2>
      <p className="mt-1 text-[13.5px] leading-snug text-muted-foreground">{tr("En mode Suivi, tu notes tes séances sans séance proposée. Oxa garde ta charge d'avant, ton max, ta récup et tes progrès. Tes données restent les mêmes.")}</p>
      <div className="mt-3 flex gap-2">
        <button onClick={() => repondre(false)} className="h-10 flex-1 rounded-full bg-muted text-[14px] font-semibold text-muted-foreground active:scale-[.98]">{tr("Rester en Guidé")}</button>
        <button onClick={() => repondre(true)} className="h-10 flex-[1.4] rounded-full bg-plate text-[14px] font-semibold text-plate-foreground active:scale-[.98]">{tr("Passer en Suivi")}</button>
      </div>
      <p className="mt-2 text-center text-[12px] text-muted-foreground">{tr("Tu pourras changer à tout moment dans Profil.")}</p>
    </section>
  );
}
