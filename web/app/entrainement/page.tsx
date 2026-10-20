"use client";

/* Entraînement : la réponse à « qu'est-ce que je fais aujourd'hui ? » en une carte,
   deux tuiles (régularité, protéines), Mes séances, puis le soin de la zone sensible. */
import { tp, tr } from "@/lib/i18n";
import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { ArrowRightIcon, ChartLineUpIcon, SparkleIcon, StarIcon, TrophyIcon } from "@phosphor-icons/react";
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
import { dureeTotale as dureeSeance } from "@/lib/logic/combinee";

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
      {/* Une seule chose importante en haut, puis des blocs compacts. */}
      <div className={cn("flex flex-col gap-7 px-4", premiere && "entree")}>
        <div className="flex flex-col gap-3">
          {!prog ? (
            <HeroLibre />
          ) : !plan ? (
            <Hero
              surtitre={tr("Programme sur 8 semaines")}
              titre={tr("Construis ton programme")}
              texte={tr("Une douzaine de questions sur ton objectif, ton matériel et ton rythme : Repère prépare huit semaines de séances et fait monter l'effort semaine après semaine.")}
              bouton={tr("Commencer le questionnaire")}
              onClick={() => router.push("/questionnaire", AVANT)}
            />
          ) : jour != null ? (
            <HeroSeance etatJour={jour} W={W} onClick={() => ouvrir(jour)} semaine={<PointsSemaine W={W} jour={jour} />} />
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
            <>
              <div className="grid grid-cols-2 gap-3">
                <CarteRegularite tuile />
                {etat.A.protOff ? <TuileVide /> : <CarteProteines tuile />}
              </div>
              <CarteCourse />
            </>
          )}
        </div>

        <MesSeances />

        <SectionSoin />

        {!prog && <ProgrammeBientot ligne />}
      </div>
    </>
  );
}

/* Sans protéines affichées : la tuile de régularité garde sa moitié, l'autre mène aux Progrès. */
function TuileVide() {
  const router = useRouter();
  return (
    <button onClick={() => router.push("/progres", AVANT)} className="flex min-h-[124px] flex-col justify-between rounded-[22px] bg-card p-3.5 text-left active:scale-[.98]">
      <ChartLineUpIcon className="size-7 text-plate" />
      <span className="text-[13px] leading-snug font-medium">{tr("Tes records et ton volume")}</span>
    </button>
  );
}

/* La semaine du programme en points, dans la carte du jour : faite, prochaine, à faire, bonus. */
function PointsSemaine({ W, jour }: { W: Jour[]; jour: number }) {
  const router = useRouter();
  const etat = useRepere((s) => s.etat);
  return (
    <button onClick={() => router.push("/entrainement/programme", AVANT)} aria-label={tr("Voir le programme de la semaine")} className="flex items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-2 active:scale-95">
      {W.map((p, i) => {
        const fait = wkDone(etat, etat.wk, i, W);
        return p.b ? (
          <StarIcon key={i} className={cn("size-3.5", fait ? "text-white" : "text-white/55")} weight={fait ? "fill" : "bold"} />
        ) : (
          <i key={i} className={cn("size-2.5 rounded-full", fait ? "bg-white" : i === jour ? "bg-white/70 ring-2 ring-white/40" : "bg-white/30")} />
        );
      })}
    </button>
  );
}

/* Sans programme : la prochaine séance libre (celle qui suit la dernière faite), ou de quoi créer la première. */
function HeroLibre() {
  const router = useRouter();
  const etat = useRepere((s) => s.etat);
  const libres = etat.SEANCES.map((_, i) => i).filter((i) => !etat.SEANCES[i].soin && etat.SEANCES[i].ex.length);
  if (!libres.length)
    return (
      <Hero
        surtitre={tr("Pour commencer")}
        titre={tr("Crée ta première séance")}
        texte={tr("Choisis les muscles et la durée : Repère compose la séance avec ton matériel.")}
        bouton={tr("Créer une séance pour moi")}
        icone={<SparkleIcon className="size-4" weight="fill" />}
        onClick={() => router.push("/entrainement/assistant", AVANT)}
      />
    );
  const derniere = [...(etat.HIST || [])].reverse().find((h) => h.s.startsWith("L|") && libres.includes(+h.s.slice(2)));
  const k = derniere ? libres.indexOf(+derniere.s.slice(2)) : -1;
  const i = libres[(k + 1) % libres.length], S = etat.SEANCES[i];
  return (
    <Hero
      surtitre={tr("Ta prochaine séance · environ {m} min", { m: dureeSeance(S) })}
      titre={S.nom}
      texte={`${musclesDe(S.ex.map((e) => e.id)).slice(0, 4).join(", ")} · ${tp(S.ex.length, "{n} exercice", "{n} exercices")}`}
      bouton={tr("Commencer")}
      onClick={() => router.push(`/entrainement/seance?l=${i}`, AVANT)}
    />
  );
}

/* Grande carte cobalt : l'action du moment. Le disque du logo en filigrane. */
function Hero({ surtitre, titre, texte, bouton, onClick, icone, semaine }: { surtitre: string; titre: string; texte: string; bouton: string; onClick: () => void; icone?: React.ReactNode; semaine?: React.ReactNode }) {
  return (
    <div className="relative isolate overflow-hidden rounded-[26px] bg-plate p-5 text-plate-foreground shadow-[0_18px_40px_-22px_var(--plate)]">
      <LogoDisque className="pointer-events-none absolute -right-10 -bottom-12 -z-10 size-52 text-white/[.13]" />
      <div className="flex items-center gap-2 text-[11.5px] font-semibold tracking-[0.12em] uppercase opacity-80">{icone}{surtitre}</div>
      <h2 className="mt-2 text-[26px] leading-[1.1] font-bold tracking-[-0.02em] text-balance">{titre}</h2>
      <p className="mt-2 max-w-[34ch] text-[14px] leading-relaxed opacity-85">{texte}</p>
      <div className="mt-4 flex items-center justify-between gap-3">
        <button onClick={onClick} className="inline-flex h-11 items-center gap-2 rounded-full bg-white px-5 text-[15px] font-semibold text-[#2346c4] shadow-sm active:scale-[.97]">
          {bouton}<ArrowRightIcon className="size-4" weight="bold" />
        </button>
        {semaine}
      </div>
    </div>
  );
}

function HeroSeance({ etatJour: d, W, onClick, semaine }: { etatJour: number; W: Jour[]; onClick: () => void; semaine?: React.ReactNode }) {
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
      semaine={semaine}
    />
  );
}
