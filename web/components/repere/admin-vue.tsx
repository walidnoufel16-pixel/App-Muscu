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
import { analysesErreurs, mesureAdmin, vueAdmin, type VueAdmin } from "@/lib/admin";
import { aRegarder } from "@/lib/logic/erreurs";
import { court, jourIso, pl, sourcesLisibles, vueTesteurs, type CompteAdmin, type StatsAdmin } from "@/lib/logic/admin";
import { jourDe } from "@/lib/logic/historique";
import { tactile } from "@/lib/repos";
import { cn } from "@/lib/utils";
import { nomRubrique, RUBRIQUES, type Rubrique } from "./rubriques";

const PERIODES: [number, () => string][] = [[7, () => tr("7 jours")], [30, () => tr("30 jours")], [3650, () => tr("Tout")]];
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
  const max = Math.max(1, V?.visiteurs ?? 0, T.inscrits);
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
        <Cle v={V?.visiteurs} n={tr("visiteurs")} d={V ? tr("{n} cette semaine", { n: V.visiteurs7 }) : ""} />
        <Cle v={T.total} n={tr("testeurs")} d={tr("+{n} cette semaine", { n: T.nouveaux7 })} onClick={aller("v=u")} />
        <Cle v={T.seances} n={tr("séances terminées")} d={tr("{n} cette semaine", { n: T.seances7 })} />
        <Cle v={nbErr ?? undefined} n={nbErr === 1 ? tr("erreur à regarder") : tr("erreurs à regarder")} d={nbErr == null ? "" : nbErr ? tr("voir l'onglet Technique") : tr("tout va bien")} alerte={!!nbErr} onClick={aller("v=m")} />
      </div>

      <section className="rounded-[22px] bg-card p-4" aria-label={tr("Le parcours d'un visiteur")}>
        <h2 className="eyebrow mb-2">{tr("Le parcours d'un visiteur")}</h2>
        <Etape n={V?.visiteurs ?? 0} texte={tr("ont ouvert Oxa")} max={max} />
        <Etape n={V?.visite ?? 0} texte={tr("ont fini la visite guidée")} max={max} />
        <Etape n={T.inscrits} texte={tr("ont créé un compte")} max={max} onClick={aller("v=u")} />
        <Etape n={T.inscritsAvecSeance} texte={tr("ont fait au moins une séance")} max={max} onClick={aller("v=u&f=seance")} />
        <p className="mt-2 text-[14px] leading-snug">
          {!T.inscrits ? tr("Aucun nouveau testeur sur la période.")
            : sans ? <>{tr("Sur {n} testeurs, ", { n: T.inscrits })}<b className="text-amber-600 dark:text-amber-300">{sans === 1 ? tr("1 n'a encore jamais fait de séance") : tr("{n} n'ont encore jamais fait de séance", { n: sans })}</b>{tr(". C'est l'étape à travailler.")}</>
            : tr("Tous les testeurs de la période ont fait au moins une séance.")}
        </p>
      </section>

      <section className="rounded-[22px] bg-card p-4">
        <h2 className="eyebrow mb-1">{tr("D'où ils viennent")}</h2>
        {V?.sources.length ? sourcesLisibles(V.sources).map(([n, v]) => <Ligne key={n} n={n} v={String(v)} />)
          : <p className="text-[13.5px] text-muted-foreground">{tr("Pas encore de données.")}</p>}
        <p className="mt-2 text-[12.5px] text-muted-foreground">{tr("Ajoute ?src=tiktok (ou insta, yt…) au lien que tu publies.")}</p>
      </section>

      <Declares L={L.filter((c) => !exclus.includes(c.id))} />

      <section className="rounded-[22px] bg-card p-4">
        <h2 className="eyebrow mb-1">{tr("Ce qu'ils ouvrent le plus")}</h2>
        {V?.rubriques.length ? V.rubriques.map((r) => <Ligne key={r.rubrique} n={nomR(r.rubrique)} v={r.appareils === 1 ? tr("1 personne") : tr("{n} personnes", { n: r.appareils })} />)
          : <p className="text-[13.5px] text-muted-foreground">{tr("Pas encore de données.")}</p>}
      </section>

      <section className="rounded-[22px] bg-card p-4">
        <h2 className="eyebrow mb-1">{tr("Avis des testeurs · {n}", { n: S.avis?.length ?? 0 })}</h2>
        {S.avis?.length ? S.avis.slice(0, 20).map((a, i) => (
          <div key={i} className="border-t border-border/60 py-2 text-[14px] first:border-t-0">
            <p className="leading-snug">{a.texte}</p>
            <p className="mt-0.5 text-[12.5px] text-muted-foreground">{a.pseudo || "—"} · {jourIso(a.cree) ? court(jourIso(a.cree)!) : "—"}{a.seances ? ` · ${pl(a.seances, tr("séance"))}` : ""}</p>
          </div>
        )) : <p className="text-[13.5px] text-muted-foreground">{tr("Aucun avis pour l'instant.")}</p>}
      </section>

      <details className="group rounded-[22px] bg-card p-4">
        <summary className="flex cursor-pointer list-none items-center justify-between text-[15px] font-semibold">
          {tr("Plus de chiffres")}<CaretRightIcon className="size-4 text-muted-foreground transition-transform group-open:rotate-90" />
        </summary>
        <p className="mt-1 text-[12.5px] text-muted-foreground">{tr("Exercices les plus faits, objectifs, matériel, défis, séances par semaine (tous les comptes).")}</p>
        <div className="mt-3 flex flex-col gap-4">{plus}</div>
      </details>
    </>
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

function Etape({ n, texte, max, onClick }: { n: number; texte: string; max: number; onClick?: () => void }) {
  const Corps = onClick ? "button" : "div";
  return (
    <Corps onClick={onClick} className="block w-full py-1.5 text-left">
      <span className="flex items-center gap-1.5 text-[14.5px]"><b className="num text-[17px]">{n}</b> {texte}{onClick && <CaretRightIcon className="size-3.5 text-muted-foreground" />}</span>
      <span className="mt-1 block h-2 overflow-hidden rounded-full bg-muted"><i className="block h-full rounded-full bg-plate" style={{ width: `${Math.round((n / max) * 100)}%` }} /></span>
    </Corps>
  );
}

const Ligne = ({ n, v }: { n: string; v: string }) => (
  <div className="flex items-baseline justify-between gap-3 border-t border-border/60 py-2 text-[14.5px] first:border-t-0">
    <span className="min-w-0 truncate">{n}</span><span className="num shrink-0 text-muted-foreground">{v}</span>
  </div>
);

/* « Comment as-tu connu Oxa ? » (questionnaire d'accueil, quand aucun lien ?src= ne le disait) : réponses
   des comptes, nombre de « passé » et détail de « Autre » */
function Declares({ L }: { L: CompteAdmin[] }) {
  const R = L.map((c) => c.etat?.A).filter((A) => A?.connu);
  const n = (k: string) => R.filter((A) => A!.connu === k).length;
  const lignes = CONNUS.map((o) => ({ n: o.n(), v: n(o.k) })).filter((x) => x.v).sort((a, b) => b.v - a.v);
  const autres = R.filter((A) => A!.connu === "autre" && A!.connuTxt).map((A) => A!.connuTxt!);
  return (
    <section className="rounded-[22px] bg-card p-4">
      <h2 className="eyebrow mb-1">{tr("Comment ils ont connu Oxa · {n}", { n: R.length - n("passe") })}</h2>
      {lignes.length ? lignes.map((x) => <Ligne key={x.n} n={x.n} v={String(x.v)} />)
        : <p className="text-[13.5px] text-muted-foreground">{tr("Pas encore de réponse.")}</p>}
      {autres.length > 0 && <p className="mt-2 text-[13.5px]"><b>{tr("Autre :")}</b> {autres.slice(0, 30).join(" · ")}</p>}
      <p className="mt-2 text-[12.5px] text-muted-foreground">{tr("Déclaré au questionnaire d'accueil, quand aucun lien ne le disait · {n} passé", { n: n("passe") })}</p>
    </section>
  );
}
