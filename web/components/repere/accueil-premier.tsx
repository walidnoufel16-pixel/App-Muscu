"use client";

/* Accueil d'un nouveau compte, à la place de la visite. D'abord « Tu as déjà ton programme ? »
   (docs/produit/mode-suivi) : mode Suivi, pas de questions, on arrive sur sa première séance à noter
   (composeur, « Comme dans ton carnet ») ; mode Guidé, la suite : bienvenue, le profil sportif une question
   par écran (le même que Profil, pas le questionnaire Oxa Plan), « Tu t'es entraîné ces dernières
   48 h ? » (les muscles comptent dans la récupération, sans fausse séance dans l'historique), puis
   la fin : muscles prêts, et une première séance qui en tient compte (ou repos). Une seule fois ;
   « Plus tard » le referme (le profil reste à compléter dans Profil). */
import { tp, tr } from "@/lib/i18n";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { Route } from "next";
import { create } from "zustand";
import { CaretLeftIcon } from "@phosphor-icons/react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { useRepere } from "@/lib/store";
import { AVANT } from "@/lib/nav";
import { preparerApercu, useBrouillon } from "@/lib/brouillon";
import { noter } from "@/lib/mesure";
import { tactile } from "@/lib/repos";
import { cn } from "@/lib/utils";
import { decaler, jourDe } from "@/lib/logic/historique";
import { effortsEndurance, etatGroupes, GROUPES, nomMuscle, nomZone, phrase, ZONES_ECARTABLES, nombre, basculerZone, ecartesDe, type MuscleRecup } from "@/lib/logic/recommandation";
import { recoPour } from "@/lib/logic/agenda";
import { EditeurProfil, profilMinimal, type Ligne } from "./profil-sportif";
import { MonMateriel } from "./mon-materiel";
import { modeLienNote, sourceNotee } from "@/lib/source";
import { useGuideAutorise } from "@/lib/fonctionnalites";
import type { Mode } from "@/lib/logic/mode";
import { LogoTuile } from "./logo";
import type { Connu } from "@/lib/logic/types";

export const useAccueil = create<{ ouvert: boolean }>(() => ({ ouvert: false }));

const QUESTIONS: (Ligne | "materiel")[] = ["sexe", "age", "corps", "objectif", "niveau", "rythme", "materiel", "gene", "prio", "sport"];
/* les muscles qu'on peut déclarer (ceux que suit la récupération, sans avant-bras ni adducteurs) */
const MUSCLES: MuscleRecup[] = [...GROUPES, "tra", "lom"];
/* les fessiers ne sont pas suivis à part : ils comptent avec les ischios (hip thrust, pont, soulevé roumain) */
const nom = (g: MuscleRecup) => (g === "isc" ? tr("Ischios et fessiers") : nomMuscle(g));

export function AccueilPremier({ onFin }: { onFin: (etape: number) => void }) {
  /* monté par AppShell à la place de l'app : ouvert jusqu'à « Plus tard » ou la fin */
  useEffect(() => { useAccueil.setState({ ouvert: true }); }, []);
  /* 0 bienvenue ; 1 à 9 le profil ; 10 les 48 h ; 11 la fin */
  const [etape, setEtape] = useState(0);
  const muter = useRepere((s) => s.muter);
  /* « Comment as-tu connu Oxa ? », entre la bienvenue et le profil : seulement si aucun lien ?src= ne l'a dit */
  const [demander] = useState(() => !sourceNotee() && !useRepere.getState().etat.A.connu);
  const [connu, setConnu] = useState(false);
  /* « Tu as déjà ton programme ? » : tant que le mode n'est pas choisi */
  const [question, setQuestion] = useState(() => !useRepere.getState().etat.A.mode);
  const [suivi, setSuivi] = useState(false);
  const autorise = useGuideAutorise();
  const fermer = () => {
    onFin(etape);
    /* pas terminé : il ne se rouvre plus tout seul, la carte d'Entraînement y ramène */
    muter((E) => { if (!E.A.accueil) E.A.accueilPasse = true; });
    useAccueil.setState({ ouvert: false });
  };
  /* mode Suivi : pas de questions, sa première séance à écrire exercice par exercice
     (sans le guide « Quels muscles aujourd'hui ? » : il a son programme) */
  const router = useRouter();
  const premiereSeance = () => {
    useBrouillon.getState().setLibre({ nom: "", ex: [], idx: null, premiere: true });
    fermer();
    router.push("/entrainement/composer" as Route, AVANT);
  };
  /* verrou : compte sans accès au mode Guidé, il n'a que Suivi (et le gardera tant que l'admin n'ouvre pas le Guidé) */
  const choisir = (m: Mode, verrou = false) => {
    noter("chemin_choisi", { c: m });
    muter((E) => { E.A.mode = m; if (verrou) E.A.suiviSeul = true; });
    setQuestion(false);
    if (m === "guide") return;
    /* « Comment as-tu connu Oxa ? » reste posée, puis la première séance */
    if (demander) { setSuivi(true); setConnu(true); } else premiereSeance();
  };
  /* nouveau compte sans le mode Guidé : pas de question, la première séance du mode Suivi */
  const auto = useRef(false);
  useEffect(() => {
    if (!question || autorise || auto.current) return;
    auto.current = true;
    choisir("suivi", true);
  });
  return (
    <Dialog open onOpenChange={(o) => !o && fermer()}>
      <DialogContent showCloseButton={false}
        className="flex h-dvh data-[state=open]:animate-none max-h-dvh w-screen max-w-none flex-col gap-0 rounded-none border-0 bg-background p-0 sm:max-w-none">
        <div className="mx-auto flex w-full max-w-[480px] flex-1 flex-col overflow-y-auto overscroll-contain px-5 pt-[max(env(safe-area-inset-top),20px)] pb-[max(env(safe-area-inset-bottom),16px)]">
          {/* la question seulement si le mode Guidé est ouvert pour ce compte ; sinon, Suivi directement */}
          {question && autorise && <ChoixMode choisir={choisir} />}
          {!question && etape === 0 && !connu && <Bienvenue suivant={() => (demander ? setConnu(true) : setEtape(1))} plusTard={fermer} />}
          {!question && etape === 0 && connu && <Source suivant={() => { if (suivi) { premiereSeance(); return; } setConnu(false); setEtape(1); }} />}
          {etape >= 1 && etape <= QUESTIONS.length && <Question i={etape} suivant={() => setEtape(etape + 1)} retour={() => setEtape(etape - 1)} />}
          {etape === QUESTIONS.length + 1 && <Avant48 suivant={() => setEtape(etape + 1)} retour={() => setEtape(etape - 1)} />}
          {etape === QUESTIONS.length + 2 && <Fin fermer={fermer} />}
        </div>
      </DialogContent>
    </Dialog>
  );
}

const Progression = ({ i }: { i: number }) => (
  <div className="mb-4 flex gap-1" aria-hidden>
    {Array.from({ length: QUESTIONS.length }, (_, k) => <i key={k} className={cn("h-1 flex-1 rounded-full", k < i ? "bg-plate" : "bg-muted")} />)}
  </div>
);

function Bas({ ok = true, libelle, onOk, second, onSecond }: { ok?: boolean; libelle: string; onOk: () => void; second: React.ReactNode; onSecond: () => void }) {
  return (
    <div className="sticky bottom-0 mt-auto bg-background pt-4">
      <button disabled={!ok} onClick={() => { tactile(8); onOk(); }} className="h-12 w-full rounded-full bg-plate text-[16px] font-semibold text-plate-foreground active:scale-[.98] disabled:opacity-40">{libelle}</button>
      <button onClick={() => { tactile(5); onSecond(); }} className="mt-1 flex w-full items-center justify-center gap-0.5 py-2.5 text-[14px] font-medium text-muted-foreground">{second}</button>
    </div>
  );
}

function Bienvenue({ suivant, plusTard }: { suivant: () => void; plusTard: () => void }) {
  const pseudo = useRepere((s) => s.pseudo);
  const etapes = [
    [tr("Ton profil sportif"), tr("{n} questions · 1 min", { n: QUESTIONS.length })],
    [tr("Tes dernières 48 h"), tr("pour savoir quels muscles sont prêts")],
    [tr("Ta première séance"), tr("ou du repos, selon ta récupération")],
  ];
  return (
    <>
      <div className="eyebrow mt-6 text-plate-ink dark:text-plate">{tr("Bienvenue")}</div>
      <DialogTitle className="mt-1 text-[28px] leading-tight font-black tracking-[-0.02em]">{pseudo ? tr("Bienvenue sur Oxa, {p}", { p: pseudo }) : tr("Bienvenue sur Oxa")}</DialogTitle>
      <DialogDescription className="mt-1.5 text-[15px] text-muted-foreground">{tr("Pour des séances à ta mesure, Oxa doit d'abord te connaître.")}</DialogDescription>
      <ol className="mt-5 flex flex-col gap-2">
        {etapes.map(([t, d], k) => (
          <li key={t} className="flex animate-[monter_.45s_ease-out_both] items-center gap-3 rounded-2xl bg-card p-3" style={{ animationDelay: 80 + k * 70 + "ms" }}>
            <span className="num grid size-10 shrink-0 place-items-center rounded-[12px] bg-plate-soft text-[16px] font-bold text-plate-ink dark:text-plate">{k + 1}</span>
            <span className="min-w-0"><span className="block text-[15px] font-semibold">{t}</span><span className="block text-[12.5px] text-muted-foreground">{d}</span></span>
          </li>
        ))}
      </ol>
      <Bas libelle={tr("Commencer · 1 min")} onOk={suivant} second={tr("Plus tard")} onSecond={plusTard} />
    </>
  );
}

/* « Tu as déjà ton programme ? » : mode Suivi ou mode Guidé (changeable dans Profil). Un lien
   ?mode=suivi (réseaux) présélectionne le mode Suivi. */
function ChoixMode({ choisir }: { choisir: (m: Mode) => void }) {
  const [m, setM] = useState<Mode | null>(() => modeLienNote());
  const options: { v: Mode; badge: string; titre: string; texte: string }[] = [
    { v: "suivi", badge: tr("Mode Suivi"), titre: tr("Oui, je veux suivre mes séances"), texte: tr("Tu notes tes séries. Oxa garde ta charge d'avant, ton max, ta récup et tes progrès.") },
    { v: "guide", badge: tr("Mode Guidé"), titre: tr("Non, guide-moi"), texte: tr("Quelques questions, puis Oxa te prépare tes séances selon ta récup et ton matériel.") },
  ];
  return (
    <>
      <div className="mt-3 flex items-center gap-2.5"><LogoTuile className="size-10" /><span className="text-[17px] font-bold">Oxa</span></div>
      <DialogTitle className="mt-8 text-[30px] leading-[1.1] font-extrabold tracking-[-0.02em]">{tr("Tu as déjà ton programme ?")}</DialogTitle>
      <DialogDescription className="mt-2.5 text-[15px] leading-snug text-muted-foreground">{tr("Oxa s'adapte à toi. Tu pourras changer à tout moment dans Profil.")}</DialogDescription>
      <div role="radiogroup" aria-label={tr("Mode")} className="mt-6 flex flex-col gap-3">
        {options.map((o, k) => (
          <button key={o.v} role="radio" aria-checked={m === o.v} data-mode={o.v} onClick={() => { tactile(5); setM(o.v); }}
            className={cn("animate-[monter_.45s_ease-out_both] rounded-[20px] border-[2.5px] bg-card p-[18px] text-left active:scale-[.99]", m === o.v ? "border-plate" : "border-transparent")}
            style={{ animationDelay: 60 + k * 70 + "ms" }}>
            <span className={cn("inline-block rounded-full px-2.5 py-1 text-[11px] font-extrabold tracking-[0.04em] uppercase", m === o.v ? "bg-plate text-plate-foreground" : "bg-muted text-muted-foreground")}>{o.badge}</span>
            <span className="mt-2.5 block text-[19px] leading-tight font-extrabold">{o.titre}</span>
            <span className="mt-1.5 block text-[14px] leading-snug text-muted-foreground">{o.texte}</span>
          </button>
        ))}
      </div>
      <div className="sticky bottom-0 mt-auto bg-background pt-4">
        <button disabled={!m} onClick={() => { if (m) { tactile(8); choisir(m); } }} className="h-12 w-full rounded-full bg-plate text-[16px] font-semibold text-plate-foreground active:scale-[.98] disabled:opacity-40">{tr("Continuer")}</button>
      </div>
    </>
  );
}

export const CONNUS: { k: Exclude<Connu, "passe">; n: () => string; ic: string }[] = [
  { k: "tiktok", n: () => "TikTok", ic: "🎵" },
  { k: "insta", n: () => "Instagram", ic: "📸" },
  { k: "ami", n: () => tr("Un ami ou un proche"), ic: "👥" },
  { k: "yt", n: () => "YouTube", ic: "▶️" },
  { k: "google", n: () => tr("Recherche Google"), ic: "🔍" },
  { k: "autre", n: () => tr("Autre"), ic: "✏️" },
];

function Source({ suivant }: { suivant: () => void }) {
  const muter = useRepere((s) => s.muter);
  const [c, setC] = useState<Connu | null>(null);
  const [txt, setTxt] = useState("");
  const garder = (k: Connu) => {
    muter((E) => { E.A.connu = k; const t = txt.trim().slice(0, 60); if (k === "autre" && t) E.A.connuTxt = t; else delete E.A.connuTxt; });
    suivant();
  };
  return (
    <>
      <Progression i={0} />
      <div className="eyebrow px-1">{tr("Question rapide · facultative")}</div>
      <DialogTitle className="mt-2 px-1 text-[22px] leading-tight font-extrabold">{tr("Comment as-tu connu Oxa ?")}</DialogTitle>
      <DialogDescription className="mt-0.5 mb-3 px-1 text-[13.5px] text-muted-foreground">{tr("Ça nous aide à savoir où parler d'Oxa. Une seule réponse.")}</DialogDescription>
      <div role="radiogroup" className="flex flex-col gap-2">
        {CONNUS.map((o) => (
          <button key={o.k} role="radio" aria-checked={c === o.k} onClick={() => { tactile(5); setC(o.k); }}
            className={cn("flex items-center gap-3 rounded-2xl border-2 bg-card px-3.5 py-3 text-left text-[15.5px] font-semibold active:scale-[.99]", c === o.k ? "border-plate bg-plate-soft" : "border-transparent")}>
            <span className="grid size-[34px] shrink-0 place-items-center rounded-[10px] bg-plate-soft text-[17px]" aria-hidden>{o.ic}</span>
            {o.n()}
            <span className={cn("ml-auto grid size-[22px] place-items-center rounded-full border-2 text-[12px] text-plate-foreground", c === o.k ? "border-plate bg-plate" : "border-border")}>{c === o.k && "✓"}</span>
          </button>
        ))}
        {c === "autre" && (
          <input value={txt} onChange={(e) => setTxt(e.target.value)} maxLength={60} placeholder={tr("Où ça ? (facultatif)")} aria-label={tr("Où ça ? (facultatif)")}
            className="h-12 rounded-2xl border-2 border-plate bg-card px-3.5 text-[15px] outline-none" />
        )}
      </div>
      <Bas ok={!!c} libelle={tr("Suivant")} onOk={() => c && garder(c)} second={tr("Passer cette question")} onSecond={() => garder("passe")} />
    </>
  );
}

function Question({ i, suivant, retour }: { i: number; suivant: () => void; retour: () => void }) {
  const A = useRepere((s) => s.etat.A);
  const muter = useRepere((s) => s.muter);
  const k = QUESTIONS[i - 1];
  /* objectif, niveau et rythme règlent les séances : il faut une réponse */
  const ok = k === "objectif" ? A.objectif != null : k === "niveau" ? A.regularite != null : k === "rythme" ? A.objHebdo != null : true;
  const valider = () => {
    /* rien d'inventé : âge, taille, poids, sports et muscles prioritaires restent vides tant qu'on n'y a
       pas touché (pas de fausse pesée) ; seule la durée affichée, 45 min, vaut réponse */
    if (k === "rythme") muter((E) => { E.A.duree ??= 45; });
    suivant();
  };
  return (
    <>
      <Progression i={i} />
      <div className="eyebrow px-1">{tr("{i} / {n} · Profil sportif", { i, n: QUESTIONS.length })}</div>
      {k === "materiel" ? (
        <>
          <DialogTitle className="mt-2 px-1 text-[22px] font-extrabold">{tr("Ton matériel")}</DialogTitle>
          <DialogDescription className="mt-0.5 mb-3 px-1 text-[13.5px] text-muted-foreground">{tr("Oxa ne te propose que des exercices faisables là où tu t'entraînes.")}</DialogDescription>
          <MonMateriel />
        </>
      ) : <EditeurProfil k={k} />}
      <Bas ok={ok} libelle={tr("Suivant")} onOk={valider} second={<><CaretLeftIcon className="size-3.5" weight="bold" />{tr("Retour")}</>} onSecond={retour} />
    </>
  );
}

function Avant48({ suivant, retour }: { suivant: () => void; retour: () => void }) {
  const muter = useRepere((s) => s.muter);
  const [auj] = useState(() => jourDe(Date.now()));
  const [quand, setQuand] = useState<0 | 1 | 2>(0);
  const [m, setM] = useState<MuscleRecup[]>([]);
  const terminer = () => {
    muter((E) => {
      if (quand) E.A.avant = { d: decaler(auj, -quand), m: [...m] }; else delete E.A.avant;
      E.A.accueil = true;
      if (profilMinimal(E.A)) E.A.miseEnRoute = true;
    });
    suivant();
  };
  return (
    <>
      <Progression i={QUESTIONS.length + 1} />
      <div className="eyebrow px-1">{tr("Dernière question · Avant Oxa")}</div>
      <DialogTitle className="mt-2 px-1 text-[22px] leading-tight font-extrabold">{tr("Tu t'es entraîné ces dernières 48 h ?")}</DialogTitle>
      <DialogDescription className="mt-0.5 px-1 text-[13.5px] text-muted-foreground">{tr("Oxa en tient compte pour ne pas te faire retravailler des muscles qui récupèrent.")}</DialogDescription>
      <div role="radiogroup" className="mt-4 flex rounded-2xl bg-card p-1">
        {([[0, tr("Non")], [1, tr("Hier")], [2, tr("Avant-hier")]] as const).map(([v, n]) => (
          <button key={v} role="radio" aria-checked={quand === v} onClick={() => { tactile(5); setQuand(v); }}
            className={cn("h-10 flex-1 rounded-xl text-[14.5px] font-semibold", quand === v ? "bg-foreground text-background" : "text-muted-foreground")}>{n}</button>
        ))}
      </div>
      {quand > 0 && (
        <>
          <div className="mt-5 px-1 text-[13px] font-bold">{tr("Quels muscles ?")}</div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {MUSCLES.map((g) => {
              const on = m.includes(g);
              return (
                <button key={g} aria-pressed={on} onClick={() => { tactile(5); setM((l) => (on ? l.filter((x) => x !== g) : [...l, g])); }}
                  className={cn("h-9 rounded-full border-[1.5px] px-3.5 text-[14px] font-semibold", on ? "border-foreground bg-foreground text-background" : "border-border")}>{nom(g)}</button>
              );
            })}
          </div>
        </>
      )}
      <Bas ok={!quand || m.length > 0} libelle={tr("Terminer")} onOk={terminer} second={<><CaretLeftIcon className="size-3.5" weight="bold" />{tr("Retour")}</>} onSecond={retour} />
    </>
  );
}

function Fin({ fermer }: { fermer: () => void }) {
  const etat = useRepere((s) => s.etat);
  const muter = useRepere((s) => s.muter);
  const router = useRouter();
  const [auj] = useState(() => jourDe(Date.now()));
  const efforts = useMemo(() => effortsEndurance(etat.SORTIES, etat.CARDIO, etat.A.avant, etat.ACTIVITES), [etat]);
  const E = useMemo(() => etatGroupes(etat.HIST || [], auj, efforts), [etat, auj, efforts]);
  const r = useMemo(() => recoPour(etat, auj), [etat, auj]);
  /* les muscles écartés n'apparaissent ni prêts ni en récupération */
  const exclus = new Set(ecartesDe(etat.A.recoSans).flatMap((z) => (z === "bras" ? ["bic", "tri"] : [z]))), vus = GROUPES.filter((g) => !exclus.has(g));
  const recup = vus.filter((g) => !E[g].recupere), prets = vus.filter((g) => E[g].recupere);
  const p = r.type === "seance" ? r.propositions[0] : undefined;
  const aller = (url: string) => { tactile(10); fermer(); router.push(url as Route, AVANT); };
  const raison = recup.length
    ? tp(nombre(recup), "{m} récupère encore. Construite avec ton matériel.", "{m} récupèrent encore. Construite avec ton matériel.", { m: phrase(recup.map(nom)) })
    : tr("Construite avec ton matériel, à ton niveau.");
  return (
    <>
      <div className="eyebrow mt-6 text-plate-ink dark:text-plate">{tr("Profil prêt")}</div>
      <DialogTitle className="mt-1 text-[26px] leading-tight font-black tracking-[-0.02em]">{tr("Aujourd'hui, tes muscles")}</DialogTitle>
      <DialogDescription className="sr-only">{tr("Les muscles prêts et ta première séance.")}</DialogDescription>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {recup.length ? (
          <>
            {prets.map((g) => <span key={g} className="rounded-full bg-plate-soft px-2.5 py-1 text-[12.5px] font-bold text-plate-ink dark:text-plate">{nom(g)} · {tr("prêt")}</span>)}
            {recup.map((g) => <span key={g} className="rounded-full bg-[#fff1e6] px-2.5 py-1 text-[12.5px] font-bold text-[#b45309] dark:bg-[#3a2410] dark:text-[#fb923c]">{nom(g)} · {tr("récupère")}</span>)}
          </>
        ) : <span className="rounded-full bg-plate-soft px-3 py-1 text-[13px] font-bold text-plate-ink dark:text-plate">{tr("Tous prêts")}</span>}
      </div>

      <section className="mt-4 rounded-[22px] bg-[linear-gradient(160deg,var(--plate),color-mix(in_oklab,var(--plate)_78%,black))] p-4 text-plate-foreground">
        <div className="text-[11px] font-bold tracking-[0.12em] uppercase opacity-75">{tr("Ta première séance")}</div>
        {p ? (
          <>
            <h2 className="mt-1.5 text-[21px] leading-tight font-extrabold">{p.nom}</h2>
            <p className="mt-1 text-[13.5px] leading-snug opacity-85">{raison}</p>
            <button onClick={() => aller(preparerApercu(etat, p.muscles, p.nom, auj) ? "/entrainement/composer" : `/entrainement/assistant?m=${p.muscles.join(",")}`)} className="mt-3.5 h-11 w-full rounded-full bg-white text-[14.5px] font-semibold text-[#0a0a0c] active:scale-[.98]">{tr("Voir la séance")}</button>
          </>
        ) : (
          <>
            <h2 className="mt-1.5 text-[21px] leading-tight font-extrabold">{tr("Repos aujourd'hui")}</h2>
            <p className="mt-1 text-[13.5px] leading-snug opacity-85">{r.pause ?? tr("Tes muscles récupèrent : c'est pendant le repos qu'ils se construisent.")}{r.demain && <> {tr("Demain : {s}.", { s: r.demain.nom.toLowerCase() })}</>}</p>
            <div className="mt-3.5 flex gap-2">
              <button onClick={() => aller("/entrainement/assistant?type=cardio&format=endurance")} className="h-11 flex-1 rounded-full bg-white text-[14.5px] font-semibold text-[#0a0a0c] active:scale-[.98]">{tr("Cardio doux")}</button>
              {r.demain && <button onClick={() => aller(`/entrainement/assistant?jour=${decaler(auj, 1)}&m=${r.demain!.muscles.join(",")}`)} className="h-11 flex-1 rounded-full border-[1.5px] border-black/30 text-[14px] font-semibold active:scale-[.98]">{tr("Programmer demain")}</button>}
            </div>
          </>
        )}
      </section>
      {/* des muscles qu'on ne veut pas travailler : la proposition change tout de suite (aussi dans Profil) */}
      <div className="mt-4 px-1 text-[13px] font-bold">{tr("Des muscles à ne pas travailler ?")}</div>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {ZONES_ECARTABLES.map((z) => {
          const on = ecartesDe(etat.A.recoSans).includes(z);
          return (
            <button key={z} aria-pressed={on} onClick={() => { tactile(5); muter((E) => { E.A.recoSans = basculerZone(E.A.recoSans, z); }); }}
              className={cn("flex h-9 items-center gap-1 rounded-full border-[1.5px] px-3.5 text-[14px] font-semibold", on ? "border-foreground bg-foreground text-background line-through decoration-2" : "border-border")}>
              {nomZone(z)}
            </button>
          );
        })}
      </div>
      <button onClick={() => aller("/entrainement/assistant")} className="mt-4 h-12 w-full rounded-2xl bg-card text-[15px] font-semibold active:scale-[.99]">{tr("Je choisis mes muscles")}</button>
      <button onClick={() => { tactile(5); fermer(); }} className="mt-auto py-3 text-[14px] font-medium text-muted-foreground">{tr("Plus tard")}</button>
    </>
  );
}
