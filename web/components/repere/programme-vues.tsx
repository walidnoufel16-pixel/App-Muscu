"use client";

/* Programme sur 8 semaines : la carte « séance du jour » (en tête d'Entraînement), la semaine
   en cours et le programme complet (onglets de la rubrique Programme). */
import { pluriel, tr } from "@/lib/i18n";
import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { ArrowRightIcon, CaretRightIcon, CheckIcon, PersonSimpleRunIcon, StarIcon, TrophyIcon } from "@phosphor-icons/react";
import { LogoDisque } from "./logo";
import { FriseSemaines } from "./seance-vues";
import { Synthese } from "./synthese";
import { baseRPE, curId, musclesDe, titreSeance, week, wkDone } from "@/lib/logic/core";
import type { SeanceSemaine } from "@/lib/logic/types";
import { useRepere } from "@/lib/store";
import { AVANT } from "@/lib/nav";
import { cn } from "@/lib/utils";

type Jour = SeanceSemaine;
const nomJour = (p: Jour, i: number) => (p.b ? tr("Bonus") : p.sportOnly ? tr("Ton sport") : tr("Séance {a}", { a: i + 1 }));

/** Le programme de la semaine : la séance du jour (celle ouverte en dernier si elle n'est pas finie, sinon la première à faire). */
export function useProgramme() {
  const etat = useRepere((s) => s.etat);
  const muter = useRepere((s) => s.muter);
  const router = useRouter();
  const W = useMemo(() => week(etat), [etat]);
  const plan = etat.FINI || !!etat.PLAN;
  const { wk } = etat;
  const socle = W.map((p, j) => (!p.b && !p.sportOnly ? j : -1)).filter((j) => j >= 0);
  const jour = plan ? (socle.includes(etat.day) && !wkDone(etat, wk, etat.day, W) ? etat.day : socle.find((j) => !wkDone(etat, wk, j, W)) ?? null) : null;
  const faites = socle.filter((j) => wkDone(etat, wk, j, W)).length;
  const ouvrir = (d: number) => { muter((E) => { E.day = d; }); router.push("/entrainement/seance", AVANT); };
  return { W, plan, wk, socle, jour, faites, ouvrir };
}

/* Grand bandeau noir : l'action du moment. Le disque du logo en filigrane. */
export function Hero({ surtitre, titre, texte, bouton, onClick, icone }: { surtitre: string; titre: string; texte: string; bouton: string; onClick: () => void; icone?: React.ReactNode }) {
  return (
    <div className="relative isolate overflow-hidden rounded-[26px] bg-bandeau p-5 text-bandeau-foreground shadow-[0_18px_40px_-22px_var(--bandeau)]">
      <LogoDisque className="pointer-events-none absolute -right-10 -bottom-12 -z-10 size-52 text-white/[.13]" />
      <div className="flex items-center gap-2 text-[11.5px] font-semibold tracking-[0.12em] uppercase opacity-80">{icone}{surtitre}</div>
      <h2 className="mt-2 text-[26px] leading-[1.1] font-bold tracking-[-0.02em] text-balance">{titre}</h2>
      <p className="mt-2 max-w-[34ch] text-[14px] leading-relaxed opacity-85">{texte}</p>
      <button onClick={onClick} className="mt-4 inline-flex h-11 items-center gap-2 rounded-full bg-white px-5 text-[15px] font-semibold text-[#0a0a0c] shadow-sm active:scale-[.97]">
        {bouton}<ArrowRightIcon className="size-4" weight="bold" />
      </button>
    </div>
  );
}

/** Carte du programme en tête d'Entraînement : la séance du jour, la semaine bouclée, le cycle terminé, ou rien sans programme. */
export function CarteProgrammeDuJour() {
  const router = useRouter();
  const etat = useRepere((s) => s.etat);
  const muter = useRepere((s) => s.muter);
  const { W, plan, wk, jour, ouvrir } = useProgramme();
  if (!plan) return null;
  if (jour != null) {
    const S = W[jour], ids = (S.x || []).map((e, i) => curId(etat, wk, jour, i, e[0], W));
    const entamee = ids.some((_, i) => etat.LOG[`${wk}|${jour}|${i}`]?.series?.some((s) => s.ok));
    return (
      <Hero
        surtitre={tr("Programme · semaine {a} · {b}", { a: wk + 1, b: nomJour(S, jour) })}
        titre={titreSeance(S.t)}
        texte={tr("{a} · {length} exercices", { a: musclesDe(ids).slice(0, 4).join(", "), length: ids.length })}
        bouton={entamee ? tr("Reprendre") : tr("Commencer")}
        onClick={() => ouvrir(jour)}
      />
    );
  }
  return wk < 7 ? (
    <Hero
      surtitre={tr("Semaine {a} terminée", { a: wk + 1 })}
      titre={tr("Bravo, semaine bouclée")}
      texte={tr("L'effort visé passe à RPE {a} la semaine prochaine. Tes charges suivent automatiquement.", { a: baseRPE(wk + 1) })}
      bouton={tr("Passer à la semaine {a}", { a: wk + 2 })}
      icone={<TrophyIcon className="size-5" weight="fill" />}
      onClick={() => muter((E) => { E.wk = wk + 1; E.day = 0; })}
    />
  ) : (
    <Hero
      surtitre={tr("Cycle terminé")}
      titre={tr("Huit semaines, bouclées")}
      texte={tr("Tu peux revoir chaque semaine dans le programme, ou en construire un nouveau depuis ton profil.")}
      bouton={tr("Voir le programme")}
      icone={<TrophyIcon className="size-5" weight="fill" />}
      onClick={() => router.push("/entrainement/programme", AVANT)}
    />
  );
}

/** Onglet « Ma semaine » : la semaine en cours, séance par séance. */
export function MaSemaine() {
  const etat = useRepere((s) => s.etat);
  const { W, wk, socle, jour, faites, ouvrir } = useProgramme();
  return (
    <section className="overflow-hidden rounded-[20px] bg-card">
      <div className="flex items-center gap-3 px-4 py-3">
        <span className="grid size-9 shrink-0 place-items-center rounded-full" style={{ background: `conic-gradient(var(--feu) ${(socle.length ? faites / socle.length : 0) * 360}deg, var(--muted) 0)` }}>
          <span className="num grid size-[27px] place-items-center rounded-full bg-card text-[16px] font-bold">{wk + 1}</span>
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-[15px] font-semibold">{tr("Semaine {a} sur 8", { a: wk + 1 })}</span>
          <span className="block text-[12.5px] text-muted-foreground">{tr("{faites} séance{a} sur {length}", { faites, a: pluriel(faites) ? "s" : "", length: socle.length })}{" "}{tr("· effort visé")}{" "}<span className="num">{tr("RPE")}{" "}{baseRPE(wk)}</span></span>
        </span>
      </div>
      {W.map((p, i) => {
        const fait = wkDone(etat, wk, i, W);
        return (
          <button key={i} onClick={() => ouvrir(i)} className="flex w-full items-center gap-3 border-t border-border/70 px-4 py-2.5 text-left active:bg-muted">
            <span className={cn("num grid size-8 shrink-0 place-items-center rounded-[10px] text-[15px] font-bold", fait ? "bg-plate text-plate-foreground" : "bg-muted text-muted-foreground")}>
              {fait ? <CheckIcon className="size-4" weight="bold" /> : p.b ? <StarIcon className="size-4" /> : p.sportOnly ? <PersonSimpleRunIcon className="size-4" /> : i + 1}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[14.5px] font-medium">{nomJour(p, i)}{!p.sportOnly && <span className="text-muted-foreground"> · {titreSeance(p.t)}</span>}</span>
              <span className="block text-[12px] text-muted-foreground">{fait ? tr("faite") : p.b ? tr("facultative") : p.sportOnly ? tr("ta pratique") : i === jour ? tr("la prochaine") : tr("à faire")}</span>
            </span>
            <CaretRightIcon className="size-4 text-muted-foreground" />
          </button>
        );
      })}
    </section>
  );
}

/** Onglet « Tout le programme » (et page Programme) : les huit semaines, la semaine choisie, la synthèse. */
export function ToutLeProgramme({ frise = true }: { frise?: boolean }) {
  const etat = useRepere((s) => s.etat);
  const muter = useRepere((s) => s.muter);
  const { W, wk, socle, ouvrir } = useProgramme();
  const avancement = Array.from({ length: 8 }, (_, w) => ({ faites: socle.filter((j) => wkDone(etat, w, j, W)).length, total: socle.length }));
  return (
    <div className="flex flex-col gap-8">
      {frise && <FriseSemaines wk={wk} avancement={avancement} onChoisir={(w) => muter((E) => { E.wk = w; })} />}
      <section>
        <h2 className="eyebrow mb-2 px-1">{tr("Semaine")}{" "}{wk + 1}{" "}{tr("· effort visé")}{" "}<span className="num text-[13px]">{tr("RPE")}{" "}{baseRPE(wk)}</span></h2>
        <div className="overflow-hidden rounded-[20px] border border-border/80 bg-card">
          {W.map((p, i) => {
            const fait = wkDone(etat, wk, i, W);
            return (
              <button key={i} onClick={() => ouvrir(i)} className="flex w-full items-center gap-3 border-t border-border/70 px-4 py-3 text-left first:border-t-0 active:bg-muted">
                <span className={cn("num grid size-8 shrink-0 place-items-center rounded-[10px] text-[15px] font-bold", fait ? "bg-plate text-plate-foreground" : "bg-muted text-muted-foreground")}>
                  {fait ? <CheckIcon className="size-4" weight="bold" /> : p.b ? <StarIcon className="size-4" /> : p.sportOnly ? <PersonSimpleRunIcon className="size-4" /> : i + 1}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[15px] font-medium">{p.sportOnly ? tr("Ton sport") : titreSeance(p.t)}</span>
                  <span className="block text-[12.5px] text-muted-foreground">
                    {p.b ? tr("Séance bonus, facultative") : p.sportOnly ? tr("Ta pratique, comptée dans le cycle") : tr("Séance {a} · {length} exercices", { a: i + 1, length: (p.x || []).length })}{fait ? tr(" · faite") : ""}
                  </span>
                </span>
                <CaretRightIcon className="size-4 text-muted-foreground" />
              </button>
            );
          })}
        </div>
      </section>
      <section>
        <h2 className="eyebrow mb-3 px-1">{tr("Ce qu'on va faire")}</h2>
        <Synthese />
      </section>
    </div>
  );
}
