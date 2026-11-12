"use client";

/* Accueil d'Entraînement : la semaine en anneaux et la série, la séance du jour en grand (prévue,
   faite, sinon la proposition d'Oxa), trois raccourcis pour créer une séance, « À venir » et
   l'accès à l'écran Agenda. Les feuilles (un jour, programmer, nouvelle séance) : agenda.tsx. */
import { loc, tp, tr } from "@/lib/i18n";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { Route } from "next";
import { BellIcon, CheckIcon, FlameIcon, ListBulletsIcon, PencilSimpleIcon, PersonSimpleRunIcon, PlayIcon, MoonIcon, PlusIcon, SparkleIcon, UserCircleIcon, CaretRightIcon } from "@phosphor-icons/react";
import { useAccueil } from "./accueil-premier";
import { useEnCours } from "./seance-en-cours";
import { feuilleDuJour, initiales, nomPrevu, sousTitre, useLancer, type Feuille } from "./agenda";
import { decaler, lundiDe } from "@/lib/logic/historique";
import { familleDe, joursAgenda, tombeLe, type JourAgenda, type Prevu } from "@/lib/logic/agenda";
import { avecSorties } from "@/lib/logic/course";
import { objectifHebdo, serie } from "@/lib/logic/motivation";
import { imgEx, imgExGrand } from "@/lib/medias";
import { EX } from "@/lib/data/exercices";
import { musclesRecommandes, type Proposition } from "@/lib/logic/recommandation";
import { seancePour } from "@/lib/logic/generer-seance";
import { dureeEstimee } from "@/lib/logic/assistant";
import { avecSalle, selDeclare } from "@/lib/logic/core";
import { preparerApercu, useBrouillon } from "@/lib/brouillon";
import { useProgrammeActif } from "@/lib/fonctionnalites";
import { recoPour } from "@/lib/logic/agenda";
import { useRepere } from "@/lib/store";
import { AVANT } from "@/lib/nav";
import { tactile } from "@/lib/repos";
import { cn } from "@/lib/utils";
import type { Etat } from "@/lib/logic/types";

const RUN = "#c2622a";

/* ---------------- photos ---------------- */
type Photo = { grand: string; petite: string };
const photo = (nom: string): Photo => ({ grand: `/img/grand/${nom}.avif`, petite: `/img/${nom}.avif` });
const photoEx = (ids: string[]): Photo | null => {
  const id = ids.find((x) => EX[x]?.img);
  return id ? { grand: imgExGrand(id), petite: imgEx(id) } : null;
};
const PHOTO_SEANCE = photo("Bent_Over_Barbell_Row_0"), PHOTO_CARDIO = photo("Bicycling_Stationary_0");

function photoPrevu(E: Etat, p: Prevu): Photo {
  const q = p.quoi;
  if (q.t === "course") return photo("rubrique-run");
  if (q.t === "cardio") return PHOTO_CARDIO;
  if (q.t === "libre") {
    const s = E.SEANCES[q.i]?.nom === p.nom ? E.SEANCES[q.i] : E.SEANCES.find((x) => x.nom === p.nom);
    return (s && photoEx(s.ex.map((e) => e.id))) || PHOTO_SEANCE;
  }
  return PHOTO_SEANCE;
}

/* ---------------- la semaine en anneaux ---------------- */
function Anneau({ j, enCours }: { j: JourAgenda; enCours?: boolean }) {
  const f = j.fait[0], p = j.prevus[0], run = (f?.famille ?? (p && familleDe(p.quoi))) === "course";
  /* séance commencée : l'anneau se remplit à moitié */
  if (enCours && !f)
    return (
      <svg viewBox="0 0 32 32" className="size-8 -rotate-90" aria-hidden>
        <circle cx="16" cy="16" r="13" fill="none" strokeWidth="2.6" stroke="currentColor" className="text-foreground/[.12]" />
        <circle cx="16" cy="16" r="13" fill="none" strokeWidth="2.6" stroke="var(--plate)" strokeDasharray="41 82" strokeLinecap="round" />
      </svg>
    );
  if (f)
    return (
      <span className="grid size-8 place-items-center rounded-full text-white" style={{ background: run ? RUN : "var(--plate)" }}>
        {run ? <PersonSimpleRunIcon className="size-4" weight="bold" /> : <CheckIcon className="size-4 text-plate-foreground" weight="bold" />}
      </span>
    );
  return (
    <svg viewBox="0 0 32 32" className="size-8" aria-hidden>
      <circle cx="16" cy="16" r="13" fill="none" strokeWidth="2.6"
        stroke={p ? (run ? RUN : "var(--plate)") : "currentColor"} strokeDasharray={p ? "4.2 3.4" : undefined}
        className={p ? undefined : j.manques.length ? "text-foreground/25" : "text-foreground/[.12]"} />
    </svg>
  );
}

export function SemaineAnneaux({ auj, setF }: { auj: string; setF: (f: Feuille) => void }) {
  const etat = useRepere((s) => s.etat);
  const J = useMemo(() => joursAgenda(etat, lundiDe(auj), auj, 7), [etat, auj]);
  const ec = useEnCours(), enCours = new Set(ec.map((c) => c.d)), cles = ec.map((c) => `${c.d}|${c.s}`).join(",");
  /* la série ne compte pas une séance en cours */
  const S = useMemo(() => serie((etat.HIST || []).filter((l) => !cles.split(",").includes(`${l.d}|${l.s}`)), avecSorties(etat.CARDIO, etat.SORTIES), objectifHebdo(etat.A), auj), [etat.HIST, etat.CARDIO, etat.SORTIES, etat.A, auj, cles]);
  const ini = initiales();
  return (
    <section aria-label={tr("Cette semaine")} className="rounded-[20px] bg-card px-2.5 pt-2.5 pb-2">
      <div className="mb-1.5 flex items-center justify-between gap-2 px-1 text-[13px]">
        <span className="flex items-center gap-1.5 font-semibold">
          <FlameIcon className={cn("size-4", S.semaines ? "text-[#ff7a1a]" : "text-muted-foreground")} weight={S.semaines ? "fill" : "regular"} />
          {S.semaines ? tr("{a} d'affilée", { a: tp(S.semaines, "{n} semaine", "{n} semaines") }) : tr("Lance ta régularité cette semaine")}
        </span>
        <span className="shrink-0 text-muted-foreground">{tr("{c} sur {o} cette semaine", { c: S.cetteSemaine, o: S.objectif })}</span>
      </div>
      <div className="flex justify-between">
        {J.map((j, i) => {
          const f = feuilleDuJour(j, auj);
          return (
            <button key={j.d} disabled={!f} onClick={() => { if (f) { tactile(5); setF(f); } }}
              aria-label={`${ini[i]} ${+j.d.slice(8)}${j.fait.length ? " · " + tr("fait") : j.prevus.length ? " · " + tr("prévu") : ""}`}
              className="flex w-11 flex-col items-center gap-1 active:scale-95">
              <span className={cn("text-[10.5px] font-semibold uppercase", j.d === auj ? "text-foreground" : "text-muted-foreground")}>{ini[i]}</span>
              <Anneau j={j} enCours={enCours.has(j.d)} />
              <span className={cn("num grid h-[18px] min-w-[20px] place-items-center rounded-full px-1 text-[11.5px] font-bold", j.d === auj ? "bg-foreground text-background" : j.d < auj ? "text-muted-foreground" : "")}>{+j.d.slice(8)}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}

/* ---------------- la séance du jour ---------------- */
type Action = { label: string; icone?: React.ReactNode; onClick: () => void };

/* `second.texte` : un bouton avec son libellé (sinon une icône ronde) ; `pied` : une ligne sous les
   boutons (« Ignorer aujourd'hui ») ; `long` : le sous-titre sur deux lignes */
function Hero({ ph, tag, titre, sous, principal, second, pied, long }: { ph: Photo; tag: React.ReactNode; titre: string; sous?: string; principal: Action; second?: Action & { texte?: boolean }; pied?: React.ReactNode; long?: boolean }) {
  return (
    <section className={cn("relative isolate overflow-hidden rounded-[24px] bg-[#111] text-white", pied || long ? "h-[252px]" : "h-[212px]")}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img key={ph.grand} src={ph.grand} alt="" className="absolute inset-0 -z-10 size-full object-cover"
        onError={(e) => { if (!e.currentTarget.src.endsWith(ph.petite)) e.currentTarget.src = ph.petite; else e.currentTarget.style.visibility = "hidden"; }} />
      <span aria-hidden className="absolute inset-0 -z-10 bg-[linear-gradient(180deg,rgba(0,0,0,.1)_0%,rgba(0,0,0,.35)_35%,rgba(0,0,0,.85)_85%)]" />
      <div className="absolute inset-x-3.5 bottom-3.5">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-2 py-0.5 text-[10.5px] font-bold tracking-[0.08em] uppercase backdrop-blur-md">{tag}</span>
        <h2 className="mt-1.5 truncate text-[24px] leading-[1.1] font-extrabold tracking-[-0.02em] text-balance">{titre}</h2>
        {sous && <p className={cn("mt-0.5 text-[13.5px] leading-snug text-white/85", long ? "line-clamp-2" : "truncate")}>{sous}</p>}
        <div className="mt-3 flex gap-2">
          <button onClick={() => { tactile(10); principal.onClick(); }} className="flex h-[46px] flex-1 items-center justify-center gap-2 rounded-full bg-white text-[15.5px] font-bold text-[#0a0a0c] active:scale-[.98]">
            {principal.icone}{principal.label}
          </button>
          {second && (second.texte ? (
            <button onClick={() => { tactile(6); second.onClick(); }}
              className="h-[46px] shrink-0 rounded-full bg-white/20 px-4 text-[14.5px] font-semibold backdrop-blur-md active:scale-[.98]">
              {second.label}
            </button>
          ) : (
            <button onClick={() => { tactile(6); second.onClick(); }} aria-label={second.label} title={second.label}
              className="grid size-[46px] shrink-0 place-items-center rounded-full bg-white/20 backdrop-blur-md active:scale-95">
              {second.icone}
            </button>
          ))}
        </div>
        {pied}
      </div>
    </section>
  );
}

/* La carte du jour : une séance en cours, prévue ou faite aujourd'hui. Rien sinon : on crée ou on
   choisit une séance en touchant un jour (menu du jour, FeuilleNouvelle dans agenda.tsx). */
export function CarteDuJour({ auj, setF }: { auj: string; setF: (f: Feuille) => void }) {
  const etat = useRepere((s) => s.etat);
  const router = useRouter();
  const lancer = useLancer();
  const enCours = useEnCours();
  const prog = useProgrammeActif();
  const j = useMemo(() => joursAgenda(etat, auj, auj, 1)[0], [etat, auj]);

  /* une séance commencée et pas encore terminée */
  const c = enCours.find((x) => x.d === auj);
  if (c) {
    const S = etat.SEANCES[c.i];
    return (
      <Hero ph={(S && photoEx(S.ex.map((e) => e.id))) || PHOTO_SEANCE} tag={<><span className="size-2 animate-pulse rounded-full bg-white" />{tr("Séance en cours")}</>} titre={c.nom}
        sous={tp(c.series, "{n} série validée", "{n} séries validées") + " · " + tr("tes séries sont gardées, reprends où tu en étais.")}
        principal={{ label: tr("Reprendre"), icone: <PlayIcon className="size-4" weight="fill" />, onClick: () => router.push(`/entrainement/seance?l=${c.i}` as Route, AVANT) }} />
    );
  }

  /* une séance prévue aujourd'hui */
  const p = j.prevus[0];
  if (p)
    return (
      <Hero ph={photoPrevu(etat, p)} tag={tr("Aujourd'hui · prévue")} titre={nomPrevu(p)} sous={sousTitre(etat, p)}
        principal={{ label: tr("Commencer"), icone: <PlayIcon className="size-4" weight="fill" />, onClick: () => lancer(etat, p) }}
        second={{ label: tr("Voir et modifier"), icone: <PencilSimpleIcon className="size-5" />, onClick: () => setF({ m: "jour", d: auj }) }} />
    );

  /* déjà faite aujourd'hui */
  const f = j.fait[0];
  if (f) {
    const l = f.famille === "muscu" ? (etat.HIST || []).find((x) => x.d === auj && x.nom === f.nom) : undefined;
    const ph = f.famille === "course" ? photo("rubrique-run") : f.famille === "cardio" ? PHOTO_CARDIO : (l && photoEx(Object.keys(l.ex))) || PHOTO_SEANCE;
    return (
      <Hero ph={ph} tag={<><CheckIcon className="size-3.5" weight="bold" />{tr("Aujourd'hui · faite")}</>} titre={f.nom}
        sous={tr("Bravo. Ton corps récupère : c'est pendant le repos que les muscles se construisent.")}
        principal={{ label: tr("Programmer la suivante"), onClick: () => setF({ m: "nouvelle", d: prochainLibre(etat, auj) }) }}
        second={{ label: tr("Voir la séance"), icone: <ListBulletsIcon className="size-5" />, onClick: () => setF({ m: "jour", d: auj }) }} />
    );
  }

  /* aucune séance jamais faite : un seul chemin guidé vers la première (full body conseillé, déjà
     coché dans l'assistant). La carte disparaît dès la première séance validée. */
  if (!(etat.HIST || []).length) {
    const r0 = recoPour(etat, auj), q0 = r0.propositions[0] ?? r0.autres?.[0] ?? r0.demain;
    const m = musclesRecommandes(r0) ?? [];
    return (
      <>
        <Hero ph={photo("Barbell_Deadlift_0")} tag={<><SparkleIcon className="size-3.5" weight="fill" />{tr("Pour commencer")}</>} titre={tr("Ta première séance")}
          sous={tr("Conseillée par Oxa selon ta récupération, avec ton matériel.")}
          principal={{ label: tr("Voir ma première séance"), onClick: () => router.push((preparerApercu(etat, m, q0?.nom ?? tr("Ta première séance"), auj) ? "/entrainement/composer" : `/entrainement/assistant${m.length ? `?m=${m.join(",")}` : ""}`) as Route, AVANT) }} />
        {/* questionnaire d'accueil passé : on peut y revenir tant qu'il n'est pas terminé */}
        {!etat.A.accueil && (
          <button onClick={() => { tactile(6); useAccueil.setState({ ouvert: true }); }}
            className="mt-2 flex w-full items-center gap-3 rounded-2xl bg-plate-soft px-3.5 py-3 text-left active:scale-[.99]">
            <UserCircleIcon className="size-6 shrink-0 text-plate-ink dark:text-plate" weight="fill" />
            <span className="min-w-0 flex-1">
              <span className="block text-[14.5px] font-semibold">{tr("Complète ton profil sportif")}</span>
              <span className="block text-[12.5px] text-muted-foreground">{tr("1 min pour des séances à ta mesure")}</span>
            </span>
            <CaretRightIcon className="size-4 shrink-0 text-muted-foreground" />
          </button>
        )}
      </>
    );
  }
  /* rien de prévu ni de fait aujourd'hui : la séance du jour d'Oxa (ou le repos que le rythme impose) ;
     pas pendant un programme Oxa Plan, qui a sa propre séance du jour (sa tuile) */
  if (prog && (etat.PLAN || etat.FINI)) return null;
  return <CarteReco auj={auj} />;
}

/* La séance du jour proposée par Oxa : « Voir la séance » ouvre l'aperçu (composeur : Commencer,
   Modifier, Enregistrer), « Autre idée » passe à la suivante. Jour de repos (rythme, récupération) :
   Cardio doux ou « Séance quand même ». « Ignorer aujourd'hui » masque la carte jusqu'à demain
   (sur ce téléphone). */
const CLE_IGNORE = "repere.reco.ignoree";
function CarteReco({ auj }: { auj: string }) {
  const etat = useRepere((s) => s.etat);
  const router = useRouter();
  const setLibre = useBrouillon((s) => s.setLibre);
  const [k, setK] = useState(0);
  const [ignoree, setIgnoree] = useState(() => { try { return localStorage.getItem(CLE_IGNORE) === auj; } catch { return false; } });
  const r = useMemo(() => recoPour(etat, auj, auj), [etat, auj]);
  const A = etat.A, duree = typeof A.duree === "number" && [30, 45, 60].includes(A.duree) ? A.duree : 45, obj = A.objectif ?? 0;
  const p = r.propositions.length ? r.propositions[k % r.propositions.length] : undefined;
  const ex = useMemo(() => (p ? seancePour(etat, p.muscles, duree, obj, avecSalle(selDeclare(A), A), auj) : []), [etat, p, duree, obj, A, auj]);
  if (ignoree || r.type === "fait") return null;
  const ignorer = () => { tactile(5); try { localStorage.setItem(CLE_IGNORE, auj); } catch {} setIgnoree(true); };
  const pied = <button onClick={ignorer} className="mt-2 w-full text-center text-[12.5px] font-medium text-white/75">{tr("Ignorer aujourd'hui")}</button>;
  const voir = (q: Proposition) => {
    const l = q === p ? ex : seancePour(etat, q.muscles, duree, obj, avecSalle(selDeclare(A), A), auj);
    setLibre({ nom: q.nom, ex: l, obj, gen: { m: [...q.muscles], d: duree, obj }, idx: null });
    router.push("/entrainement/composer", AVANT);
  };
  if (p)
    return (
      <Hero ph={photoEx(ex.map((e) => e.id)) || PHOTO_SEANCE} tag={<><SparkleIcon className="size-3.5" weight="fill" />{tr("Ta séance du jour")}</>} titre={p.nom} long
        sous={`${p.raison} · ${tp(ex.length, "{n} exercice", "{n} exercices")} · ${tr("environ {a} min", { a: dureeEstimee(ex) })}`}
        principal={{ label: tr("Voir la séance"), icone: <PlayIcon className="size-4" weight="fill" />, onClick: () => voir(p) }}
        second={r.propositions.length > 1 ? { label: tr("Autre idée"), texte: true, onClick: () => setK((x) => x + 1) } : undefined}
        pied={pied} />
    );
  const quandMeme = r.autres?.[0] ?? r.demain;
  return (
    <Hero ph={PHOTO_CARDIO} tag={<><MoonIcon className="size-3.5" weight="fill" />{tr("Repos aujourd'hui")}</>} titre={tr("Récupère")} long
      sous={(r.pause ?? tr("Tes muscles récupèrent encore de tes dernières séances.")) + (r.demain ? " " + tr("Demain : {s}.", { s: r.demain.nom.toLowerCase() }) : "")}
      principal={{ label: tr("Cardio doux"), onClick: () => router.push("/entrainement/assistant?type=cardio&format=endurance" as Route, AVANT) }}
      second={quandMeme ? { label: tr("Séance quand même"), texte: true, onClick: () => voir(quandMeme) } : undefined}
      pied={pied} />
  );
}

/** Le jour sur lequel s'ouvre « Programmer une séance » (le « + », « Programmer », « Programmer la
    suivante ») : aujourd'hui si rien n'y est prévu ni fait, sinon demain. */
export function prochainLibre(E: Etat, auj: string) {
  const j = joursAgenda(E, auj, auj, 1)[0];
  return j && !j.fait.length && !j.prevus.length ? auj : decaler(auj, 1);
}

/* ---------------- à venir ---------------- */
export function AVenir({ auj, setF }: { auj: string; setF: (f: Feuille) => void }) {
  const etat = useRepere((s) => s.etat);
  const router = useRouter();
  const l = useMemo(() => {
    const out: { p: Prevu; d: string }[] = [];
    for (let k = 1; k <= 28 && out.length < 4; k++) {
      const d = decaler(auj, k);
      for (const p of etat.AGENDA || []) if (tombeLe(p, d)) out.push({ p, d });
    }
    return out.slice(0, 4);
  }, [etat.AGENDA, auj]);
  const jour = (d: string) => new Date(d + "T12:00").toLocaleDateString(loc(), { weekday: "long", day: "numeric" });

  return (
    <section>
      <div className="mb-2 flex items-baseline justify-between px-1">
        <h2 className="text-[20px] font-extrabold tracking-[-0.015em]">{tr("À venir")}</h2>
        <button onClick={() => router.push("/entrainement/agenda" as Route, AVANT)} className="text-[15px] font-semibold text-plate-ink dark:text-plate">{tr("Agenda")}</button>
      </div>
      {l.length ? (
        <div className="no-scrollbar -mx-4 flex gap-2.5 overflow-x-auto px-4 pb-1">
          {l.map(({ p, d }) => (
            <button key={p.id + d} onClick={() => { tactile(5); setF({ m: "jour", d }); }} className="w-[160px] shrink-0 rounded-[16px] bg-card px-3 py-2.5 text-left active:scale-[.98]">
              <span className={cn("block text-[11.5px] font-bold tracking-[0.04em] uppercase", familleDe(p.quoi) !== "course" && "text-plate-ink dark:text-plate")}
                style={familleDe(p.quoi) === "course" ? { color: RUN } : undefined}>{jour(d)}</span>
              <span className="mt-0.5 flex items-center gap-1 truncate text-[15px] font-bold">{p.quoi.t === "reco" && <SparkleIcon className="size-3.5 shrink-0 text-plate" weight="fill" />}<span className="truncate">{nomPrevu(p)}</span></span>
              <span className="mt-0.5 flex items-center gap-1 text-[12.5px] text-muted-foreground">
                {p.rappel && <BellIcon className="size-3.5 shrink-0" weight="fill" />}
                <span className="truncate">{p.rappel ? (p.rappel.veille ? tr("la veille à {h} h", { h: p.rappel.h }) : tr("à {h} h", { h: p.rappel.h })) : (sousTitre(etat, p) ?? (p.hebdo ? tr("chaque semaine") : ""))}</span>
              </span>
            </button>
          ))}
          <button onClick={() => { tactile(6); setF({ m: "nouvelle", d: prochainLibre(etat, auj) }); }} className="flex w-[110px] shrink-0 flex-col items-center justify-center gap-0.5 rounded-[16px] border-[1.5px] border-dashed border-plate/50 text-[14px] font-semibold text-plate-ink dark:text-plate">
            <PlusIcon className="size-5" weight="bold" />{tr("Programmer")}
          </button>
        </div>
      ) : (
        <button onClick={() => { tactile(6); setF({ m: "nouvelle", d: prochainLibre(etat, auj) }); }} className="flex w-full items-center justify-center gap-1.5 rounded-[16px] border-[1.5px] border-dashed border-plate/50 py-3 text-[14.5px] font-semibold text-plate-ink dark:text-plate">
          <PlusIcon className="size-4" weight="bold" />{tr("Programmer une séance")}
        </button>
      )}
    </section>
  );
}
