"use client";

/* Admin › Vue d'ensemble : « Comment va Oxa » sur une période (maquette validée le 18 novembre 2026).
   Visiteurs, visite guidée, sources et rubriques : mesure anonyme (admin_vue, sans lien avec un compte).
   Testeurs et séances : comptes (admin_utilisateurs), sans l'admin ni ses comptes de test. */
import { CONNUS } from "./accueil-premier";
import { tr } from "@/lib/i18n";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { Route } from "next";
import { CaretRightIcon } from "@phosphor-icons/react";
import { analysesErreurs, entonnoirAdmin, mesureAdmin, vueAdmin, type EntonnoirAdmin, type VueAdmin } from "@/lib/admin";
import { aRegarder } from "@/lib/logic/erreurs";
import { parMode } from "@/lib/logic/mode";
import { aFaitUneSeance, court, etapesEntonnoir, inscritsSurPeriode, jourIso, nomSource, pl, sourcesLisibles, surPeriode, TOUT, vueTesteurs, type CompteAdmin, type StatsAdmin } from "@/lib/logic/admin";
import { jourDe } from "@/lib/logic/historique";
import { tactile } from "@/lib/repos";
import { cn } from "@/lib/utils";
import { nomRubrique, RUBRIQUES, type Rubrique } from "./rubriques";

const PERIODES: [number, () => string][] = [[1, () => tr("Aujourd'hui")], [7, () => tr("7 jours")], [30, () => tr("30 jours")], [TOUT, () => tr("Tout")]];
const AUTRES_RUBRIQUES: Record<string, () => string> = { plus: () => tr("Plus d'entraînements"), cardio: () => tr("Cardio"), defis: () => tr("Défis") };
const nomR = (r: string) => (RUBRIQUES.includes(r as Rubrique) ? nomRubrique(r as Rubrique) : AUTRES_RUBRIQUES[r]?.() ?? r);

export function VueEnsemble({ L, S, exclus, avecMoi, plus }: { L: CompteAdmin[]; S: StatsAdmin; exclus: string[]; avecMoi: boolean; plus: React.ReactNode }) {
  const router = useRouter();
  const [jours, setJours] = useState(30);
  const [V, setV] = useState<VueAdmin | null>(null);
  const [err, setErr] = useState("");
  const [auj] = useState(() => jourDe(Date.now()));
  useEffect(() => {
    let vivant = true;
    vueAdmin(jours, avecMoi).then((v) => vivant && (setV(v), setErr(""))).catch((e) => vivant && setErr((e as Error).message));
    return () => { vivant = false; };
  }, [jours, avecMoi]);
  /* erreurs à regarder : ni bruit connu, ni analysées (lib/logic/erreurs.ts) */
  const [nbErr, setNbErr] = useState<number | null>(null);
  useEffect(() => {
    Promise.all([mesureAdmin(), analysesErreurs()]).then(([m, a]) => setNbErr(aRegarder(m.erreurs, a))).catch(() => setNbErr(null));
  }, []);
  const T = useMemo(() => vueTesteurs(L, avecMoi ? [] : exclus, jours, auj), [L, exclus, avecMoi, jours, auj]);
  const aller = (q: string) => () => { tactile(5); router.push(`/admin?${q}` as Route); };
  const sans = T.inscrits - T.inscritsAvecSeance;
  /* tout suit la période ; la ligne « sur 7 jours » n'a de sens que sur 30 jours ou tout */
  const tout = jours === TOUT, sur7 = jours > 7;
  const dont7 = (n: number) => (sur7 ? tr("dont {n} sur 7 jours", { n }) : "");
  const avis = useMemo(() => (S.avis ?? []).filter((a) => surPeriode(a.cree, jours, auj)), [S.avis, jours, auj]);
  return (
    <>
      <div className="flex gap-1.5">
        {PERIODES.map(([j, n]) => (
          <button key={j} onClick={() => { tactile(4); setJours(j); }} aria-pressed={jours === j}
            className={cn("rounded-full px-3.5 py-1.5 text-[13.5px] font-semibold", jours === j ? "bg-foreground text-background" : "bg-card text-muted-foreground")}>{n()}</button>
        ))}
      </div>
      {err && <p className="rounded-2xl bg-card p-4 text-[13.5px] text-destructive">{err}</p>}

      <div className="grid grid-cols-2 gap-2">
        <Cle v={V?.visiteurs} n={tr("visiteurs")} d={V ? dont7(V.visiteurs7) : ""} />
        <Cle v={tout ? T.total : T.inscrits} n={tout ? tr("testeurs") : tr("nouveaux testeurs")} d={tout ? dont7(T.nouveaux7) : tr("{n} au total", { n: T.total })} onClick={aller("v=u")} />
        <Cle v={T.seances} n={tr("séances terminées")} d={dont7(T.seances7)} />
        <Cle v={nbErr ?? undefined} n={nbErr === 1 ? tr("erreur à regarder") : tr("erreurs à regarder")} d={nbErr == null ? "" : nbErr ? tr("voir l'onglet Technique") : tr("tout va bien")} alerte={!!nbErr} onClick={aller("v=m")} />
      </div>

      <Entonnoir jours={jours} avecMoi={avecMoi} />
      {/* les comptes ne sont pas reliés aux appareils (mesure anonyme) : à part, sous l'entonnoir */}
      <button onClick={aller("v=u&f=seance")} className="-mt-1 flex items-center gap-1.5 rounded-[18px] bg-card px-4 py-3 text-left text-[14px] leading-snug active:scale-[.99]">
        <span className="min-w-0 flex-1">
          {!T.inscrits ? tr("Aucun nouveau compte sur la période.")
            : <>{tr("Comptes créés : {n}, dont {m} avec au moins une séance.", { n: T.inscrits, m: T.inscritsAvecSeance })}{sans > 0 && <b className="text-amber-600 dark:text-amber-300"> {sans === 1 ? tr("1 n'a encore jamais fait de séance.") : tr("{n} n'ont encore jamais fait de séance.", { n: sans })}</b>}</>}
        </span>
        <CaretRightIcon className="size-3.5 shrink-0 text-muted-foreground" />
      </button>

      <section className="rounded-[22px] bg-card p-4">
        <h2 className="eyebrow mb-1">{tr("D'où ils viennent")}</h2>
        {V?.sources.length ? sourcesLisibles(V.sources).map(([n, v]) => <Ligne key={n} n={n} v={String(v)} />)
          : <p className="text-[13.5px] text-muted-foreground">{tr("Pas encore de données.")}</p>}
        <p className="mt-2 text-[12.5px] text-muted-foreground">{tr("Ajoute ?src=tiktok (ou insta, yt…) au lien que tu publies.")}</p>
      </section>

      <ParMode L={inscritsSurPeriode(L, avecMoi ? [] : exclus, jours, auj)} tout={tout} />

      <Declares L={inscritsSurPeriode(L, avecMoi ? [] : exclus, jours, auj)} tout={tout} />

      <section className="rounded-[22px] bg-card p-4">
        <h2 className="eyebrow mb-1">{tr("Ce qu'ils ouvrent le plus")}</h2>
        {V?.rubriques.length ? V.rubriques.map((r) => <Ligne key={r.rubrique} n={nomR(r.rubrique)} v={r.appareils === 1 ? tr("1 personne") : tr("{n} personnes", { n: r.appareils })} />)
          : <p className="text-[13.5px] text-muted-foreground">{tr("Pas encore de données.")}</p>}
      </section>

      <section className="rounded-[22px] bg-card p-4">
        <h2 className="eyebrow mb-1">{tr("Avis des testeurs · {n}", { n: avis.length })}</h2>
        {/* les 50 derniers avis viennent du serveur (admin_stats), filtrés ici sur la période */}
        {avis.length ? avis.slice(0, 20).map((a, i) => (
          <div key={i} className="border-t border-border/60 py-2 text-[14px] first:border-t-0">
            <p className="leading-snug">{a.texte}</p>
            <p className="mt-0.5 text-[12.5px] text-muted-foreground">{a.pseudo || "—"} · {jourIso(a.cree) ? court(jourIso(a.cree)!) : "—"}{a.seances ? ` · ${pl(a.seances, tr("séance"))}` : ""}</p>
          </div>
        )) : <p className="text-[13.5px] text-muted-foreground">{tout ? tr("Aucun avis pour l'instant.") : tr("Aucun avis sur la période.")}</p>}
      </section>

      <details className="group rounded-[22px] bg-card p-4">
        <summary className="flex cursor-pointer list-none items-center justify-between text-[15px] font-semibold">
          {tr("Plus de chiffres, depuis le début")}<CaretRightIcon className="size-4 text-muted-foreground transition-transform group-open:rotate-90" />
        </summary>
        <p className="mt-1 text-[12.5px] text-muted-foreground">{tr("Ne suit pas la période choisie. Exercices les plus faits, objectifs, matériel, défis, séances par semaine (tous les comptes).")}</p>
        <div className="mt-3 flex flex-col gap-4">{plus}</div>
      </details>
    </>
  );
}

/* Mode Suivi ou Guidé (docs/produit/mode-suivi) : comptes de la période, et part de ceux qui ont
   fait au moins une séance. Les comptes d'avant le réglage comptent en Guidé. */
function ParMode({ L, tout }: { L: CompteAdmin[]; tout: boolean }) {
  const M = useMemo(() => parMode(L, aFaitUneSeance), [L]);
  return (
    <section className="rounded-[22px] bg-card p-4">
      <h2 className="eyebrow mb-1">{tout ? tr("Par mode") : tr("Par mode · comptes créés sur la période")}</h2>
      {M.map((x) => (
        <Ligne key={x.m} n={x.m === "suivi" ? tr("Mode Suivi") : tr("Mode Guidé")}
          v={x.comptes ? tr("{n} comptes · {p} % avec une séance", { n: x.comptes, p: x.part }) : tr("aucun compte")} />
      ))}
    </section>
  );
}

function Cle({ v, n, d, onClick, alerte }: { v?: number; n: string; d: string; onClick?: () => void; alerte?: boolean }) {
  const Corps = onClick ? "button" : "div";
  return (
    <Corps onClick={onClick} className={cn("relative rounded-[18px] bg-card px-4 py-3 text-left", onClick && "active:scale-[.98]")}>
      {onClick && <CaretRightIcon className="absolute top-3.5 right-3 size-3.5 text-muted-foreground" />}
      <span className="num block text-[30px] leading-tight font-extrabold">{v ?? "…"}</span>
      <span className="block text-[13px] text-muted-foreground">{n}</span>
      <span className={cn("block text-[12.5px] font-semibold", alerte ? "text-destructive" : "text-plate-ink dark:text-plate")}>{d}</span>
    </Corps>
  );
}

/* L'entonnoir des nouveaux visiteurs (appareils apparus sur la période), filtrable par source.
   Une étape n'exige pas la précédente : on peut lancer une séance sans remplir le profil. */
const NOMS_ETAPES = { ouverture: () => tr("ouvrent Oxa pour la première fois"), visite: () => tr("finissent la visite guidée"), chemin: () => tr("choisissent un chemin"), prete: () => tr("voient leur séance prête"), agit: () => tr("programment une séance ou font une série"), seance: () => tr("terminent une séance"), deux: () => tr("terminent une 2e séance") };
const NOMS_CHEMINS: Record<string, () => string> = { oxa: () => tr("Oxa prépare"), compose: () => tr("Je compose"), decouvrir: () => tr("Découvrir"), suivi: () => tr("Mode Suivi"), guide: () => tr("Mode Guidé") };
function Entonnoir({ jours, avecMoi }: { jours: number; avecMoi: boolean }) {
  const [src, setSrc] = useState<string | null>(null);
  const [chemin, setChemin] = useState<string | null>(null);
  const [E, setE] = useState<EntonnoirAdmin | null>(null);
  const [err, setErr] = useState("");
  useEffect(() => {
    let vivant = true;
    entonnoirAdmin(jours, avecMoi, src, chemin).then((e) => vivant && (setE(e), setErr(""))).catch((e) => vivant && setErr((e as Error).message));
    return () => { vivant = false; };
  }, [jours, avecMoi, src, chemin]);
  const { etapes, perte } = etapesEntonnoir(E?.etapes ?? { ouverture: 0, seance: 0, deux: 0 });
  const max = Math.max(1, etapes[0].n);
  const sources = E?.sources ?? [], chemins = E?.chemins ?? [];
  return (
    <section className="rounded-[22px] bg-card p-4" aria-label={tr("Entonnoir des nouveaux visiteurs")}>
      <h2 className="eyebrow mb-1">{tr("Entonnoir des nouveaux visiteurs")}</h2>
      <p className="mb-2 text-[12.5px] leading-snug text-muted-foreground">{tr("Les appareils arrivés sur la période, et jusqu'où ils sont allés.")}</p>
      {chemins.length > 0 && (
        <div className="no-scrollbar -mx-4 mb-1.5 flex gap-1.5 overflow-x-auto px-4">
          {[null, ...chemins.map((x) => x.chemin)].map((k) => (
            <button key={k ?? "*"} onClick={() => { tactile(4); setChemin(k); }} aria-pressed={chemin === k}
              className={cn("h-8 shrink-0 rounded-full px-3 text-[13px] font-semibold whitespace-nowrap", chemin === k ? "bg-foreground text-background" : "bg-muted text-muted-foreground")}>
              {k == null ? tr("Tous les chemins") : NOMS_CHEMINS[k]?.() ?? k}
            </button>
          ))}
        </div>
      )}
      {sources.length > 1 && (
        <div className="no-scrollbar -mx-4 mb-2 flex gap-1.5 overflow-x-auto px-4">
          {[null, ...sources.map((x) => x.source)].map((k) => (
            <button key={k ?? "*"} onClick={() => { tactile(4); setSrc(k); }} aria-pressed={src === k}
              className={cn("h-8 shrink-0 rounded-full px-3 text-[13px] font-semibold whitespace-nowrap", src === k ? "bg-foreground text-background" : "bg-muted text-muted-foreground")}>
              {k == null ? tr("Toutes les sources") : nomSource(k)}
            </button>
          ))}
        </div>
      )}
      {err ? <p className="text-[13.5px] text-destructive">{err}</p> : etapes.map((x, i) => (
        <div key={x.k} className="py-1.5">
          {i > 0 && x.passage != null && (
            <span className={cn("mb-1 block text-[12px] font-semibold", perte === i ? "text-amber-600 dark:text-amber-300" : "text-muted-foreground")}>
              ↓ {tr("{p} % de l'étape d'avant", { p: x.passage })}{perte === i ? " · " + tr("la plus grosse perte") : ""}
            </span>
          )}
          <span className="flex items-baseline gap-1.5 text-[14.5px]"><b className="num text-[17px]">{x.n}</b> {NOMS_ETAPES[x.k]()}{i > 0 && etapes[0].n > 0 && <span className="num ml-auto text-[12.5px] text-muted-foreground">{x.part} %</span>}</span>
          <span className="mt-1 block h-2 overflow-hidden rounded-full bg-muted"><i className={cn("block h-full rounded-full", perte === i ? "bg-amber-500" : "bg-plate")} style={{ width: `${Math.round((x.n / max) * 100)}%` }} /></span>
        </div>
      ))}
      {E && !etapes[0].n && <p className="mt-1 text-[13.5px] text-muted-foreground">{tr("Aucun nouveau visiteur sur la période.")}</p>}
    </section>
  );
}

const Ligne = ({ n, v }: { n: string; v: string }) => (
  <div className="flex items-baseline justify-between gap-3 border-t border-border/60 py-2 text-[14.5px] first:border-t-0">
    <span className="min-w-0 truncate">{n}</span><span className="num shrink-0 text-muted-foreground">{v}</span>
  </div>
);

/* « Comment as-tu connu Oxa ? » (questionnaire d'accueil, quand aucun lien ?src= ne le disait) : réponses
   des comptes, nombre de « passé » et détail de « Autre » */
/* Réponses des comptes créés sur la période (même règle que « Comptes créés »). */
function Declares({ L, tout }: { L: CompteAdmin[]; tout: boolean }) {
  const R = L.map((c) => c.etat?.A).filter((A) => A?.connu);
  const n = (k: string) => R.filter((A) => A!.connu === k).length;
  const lignes = CONNUS.map((o) => ({ n: o.n(), v: n(o.k) })).filter((x) => x.v).sort((a, b) => b.v - a.v);
  const autres = R.filter((A) => A!.connu === "autre" && A!.connuTxt).map((A) => A!.connuTxt!);
  return (
    <section className="rounded-[22px] bg-card p-4">
      <h2 className="eyebrow mb-1">{tr("Comment ils ont connu Oxa · {n}", { n: R.length - n("passe") })}</h2>
      {lignes.length ? lignes.map((x) => <Ligne key={x.n} n={x.n} v={String(x.v)} />)
        : <p className="text-[13.5px] text-muted-foreground">{tout ? tr("Pas encore de réponse.") : tr("Aucune réponse sur la période.")}</p>}
      {autres.length > 0 && <p className="mt-2 text-[13.5px]"><b>{tr("Autre :")}</b> {autres.slice(0, 30).join(" · ")}</p>}
      <p className="mt-2 text-[12.5px] text-muted-foreground">{tr("Déclaré au questionnaire d'accueil, quand aucun lien ne le disait · {n} passé", { n: n("passe") })}</p>
    </section>
  );
}
