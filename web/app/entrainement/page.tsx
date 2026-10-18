"use client";

/* Entraînement : la réponse à « qu'est-ce que je fais aujourd'hui ? » en haut,
   puis la semaine du programme, puis les séances libres. */
import { pluriel, tr } from "@/lib/i18n";
import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { ArrowRightIcon, CaretRightIcon, CheckIcon, StarIcon, TrophyIcon, PersonSimpleRunIcon } from "@phosphor-icons/react";
import { ChoixLangue } from "@/components/repere/choix-langue";
import { EnTete } from "@/components/repere/en-tete";
import { MesSeances } from "@/components/repere/mes-seances";
import { SectionSoin } from "@/components/repere/soin";
import { CarteRegularite, Reprise } from "@/components/repere/motivation";
import { CarteProteines } from "@/components/repere/proteines";
import { CarteCourse } from "@/components/repere/course";
import { LogoDisque } from "@/components/repere/logo";
import { baseRPE, curId, musclesDe, titreSeance, week, wkDone } from "@/lib/logic/core";
import type { SeanceSemaine } from "@/lib/logic/types";
import { useRepere } from "@/lib/store";
import { AVANT } from "@/lib/nav";
import { usePremiereVisite } from "@/lib/entree";
import { cn } from "@/lib/utils";
import { useProgrammeActif } from "@/lib/fonctionnalites";
import { ProgrammeBientot } from "@/components/repere/bientot";

type Jour = SeanceSemaine;
const nomJour = (p: Jour, i: number) => (p.b ? tr("Bonus") : p.sportOnly ? tr("Ton sport") : tr("Séance {a}", { a: i + 1 }));

export default function PageEntrainement() {
  const router = useRouter();
  const etat = useRepere((s) => s.etat);
  const muter = useRepere((s) => s.muter);
  const premiere = usePremiereVisite();
  const W = useMemo(() => week(etat), [etat]);
  /* programme sur 8 semaines mis de côté : séances libres seulement */
  const prog = useProgrammeActif();
  const plan = prog && (etat.FINI || !!etat.PLAN);
  const { wk } = etat;
  const socle = W.map((p, j) => (!p.b && !p.sportOnly ? j : -1)).filter((j) => j >= 0);
  const faites = socle.filter((j) => wkDone(etat, wk, j, W)).length;
  /* séance du jour : celle qu'on a ouverte en dernier si elle n'est pas finie, sinon la première à faire */
  const jour = plan ? (socle.includes(etat.day) && !wkDone(etat, wk, etat.day, W) ? etat.day : socle.find((j) => !wkDone(etat, wk, j, W)) ?? null) : null;

  const ouvrir = (d: number) => { muter((E) => { E.day = d; }); router.push("/entrainement/seance", AVANT); };

  return (
    <>
      <EnTete
        surtitre={plan ? <>{tr("Semaine")}{" "}{wk + 1}{" "}{tr("sur 8 · effort visé")}{" "}<span className="num text-[13px]">{tr("RPE")}{" "}{baseRPE(wk)}</span></> : tr("Séances à la carte")}
        titre={tr("Entraînement")}
        actions={<ChoixLangue />}
      />
      <div className={cn("flex flex-col gap-6 px-4", premiere && "entree")}>
        {!prog ? (
          <ProgrammeBientot />
        ) : !plan ? (
          <Hero
            surtitre={tr("Programme sur 8 semaines")}
            titre={tr("Construis ton programme")}
            texte={tr("Une douzaine de questions sur ton objectif, ton matériel et ton rythme : Repère prépare huit semaines de séances et fait monter l'effort semaine après semaine.")}
            bouton={tr("Commencer le questionnaire")}
            onClick={() => router.push("/questionnaire", AVANT)}
          />
        ) : jour != null ? (
          <HeroSeance etatJour={jour} W={W} onClick={() => ouvrir(jour)} />
        ) : wk < 7 ? (
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
        )}

        <Reprise />
        {(plan || !!etat.HIST?.length || !!etat.CARDIO?.length || !!etat.COURSE) && (
          <div className="flex flex-col gap-2">
            <CarteCourse />
            <CarteRegularite lien />
            <CarteProteines accueil />
          </div>
        )}

        <SectionSoin />

        <section>
          <h2 className="eyebrow mb-2 px-1">{tr("Mes séances")}</h2>
          <MesSeances />
        </section>

        {plan && (
          <section>
            <h2 className="eyebrow mb-2 px-1">{tr("Ma semaine")}</h2>
            <div className="overflow-hidden rounded-[20px] border border-border/80 bg-card">
              <button onClick={() => router.push("/entrainement/programme", AVANT)} className="flex w-full items-center gap-3 px-4 py-3 text-left active:bg-muted">
                <span className="grid size-9 shrink-0 place-items-center rounded-full" style={{ background: `conic-gradient(var(--plate) ${(socle.length ? faites / socle.length : 0) * 360}deg, var(--muted) 0)` }}>
                  <span className="num grid size-[27px] place-items-center rounded-full bg-card text-[16px] font-bold">{wk + 1}</span>
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[15px] font-semibold">{tr("Semaine {a} sur 8", { a: wk + 1 })}</span>
                  <span className="block text-[12.5px] text-muted-foreground">{tr("{faites} séance{a} sur {length} · voir le programme complet", { faites, a: pluriel(faites) ? "s" : "", length: socle.length })}</span>
                </span>
                <CaretRightIcon className="size-4 text-muted-foreground" />
              </button>
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
            </div>
          </section>
        )}
      </div>
    </>
  );
}

/* Grande carte cobalt : l'action du moment. Le disque du logo en filigrane. */
function Hero({ surtitre, titre, texte, bouton, onClick, icone }: { surtitre: string; titre: string; texte: string; bouton: string; onClick: () => void; icone?: React.ReactNode }) {
  return (
    <div className="relative isolate overflow-hidden rounded-[26px] bg-plate p-5 text-plate-foreground shadow-[0_18px_40px_-22px_var(--plate)]">
      <LogoDisque className="pointer-events-none absolute -right-10 -bottom-12 -z-10 size-52 text-white/[.13]" />
      <div className="flex items-center gap-2 text-[11.5px] font-semibold tracking-[0.12em] uppercase opacity-80">{icone}{surtitre}</div>
      <h2 className="mt-2 text-[26px] leading-[1.1] font-bold tracking-[-0.02em] text-balance">{titre}</h2>
      <p className="mt-2 max-w-[34ch] text-[14px] leading-relaxed opacity-85">{texte}</p>
      <button onClick={onClick} className="mt-4 inline-flex h-11 items-center gap-2 rounded-full bg-white px-5 text-[15px] font-semibold text-[#2346c4] shadow-sm active:scale-[.97]">
        {bouton}<ArrowRightIcon className="size-4" weight="bold" />
      </button>
    </div>
  );
}

function HeroSeance({ etatJour: d, W, onClick }: { etatJour: number; W: Jour[]; onClick: () => void }) {
  const etat = useRepere((s) => s.etat);
  const S = W[d], ids = (S.x || []).map((e, i) => curId(etat, etat.wk, d, i, e[0], W));
  const entamee = ids.some((_, i) => etat.LOG[`${etat.wk}|${d}|${i}`]?.series?.some((s) => s.ok));
  return (
    <Hero
      surtitre={tr("Séance du jour · {a}{a1}", { a: nomJour(S, d), a1: S.dur ? " · " + S.dur : "" })}
      titre={titreSeance(S.t)}
      texte={tr("{a} · {length} exercices", { a: musclesDe(ids).slice(0, 4).join(", "), length: ids.length })}
      bouton={entamee ? tr("Reprendre") : tr("Commencer")}
      onClick={onClick}
    />
  );
}
