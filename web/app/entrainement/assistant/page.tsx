"use client";

import { CalculePour, MiseEnRoute, profilMinimal } from "@/components/repere/profil-sportif";
import { prioNoms } from "@/lib/logic/questionnaire";
import { tr } from "@/lib/i18n";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { ReglagesCardio, type ChoixCardio } from "@/components/repere/reglages-cardio";
import { QuestionnaireCourse } from "@/components/repere/course";
import { construireSeance as construireCardio, dureeTotale as dureeTotaleCardio, niveauDe, nomSeanceCardio, reglagesDe } from "@/lib/logic/cardio";
import { nouveauBloc } from "@/lib/logic/combinee";
import { preparer } from "@/lib/sons";
import type { Route } from "next";
import { Button } from "@/components/ui/button";
import { EnTete } from "@/components/repere/en-tete";
import { SchemaCorps } from "@/components/repere/schema-corps";
import { FiltreMateriel } from "@/components/repere/filtre-materiel";
import { MATERIEL_STREET, OUTILS_STREET } from "@/lib/data/street";
import { Segmente } from "@/components/repere/segmente";
import { BibliothequeMuscles } from "@/components/repere/bibliotheque-muscles";
import { dire } from "@/components/repere/confirmer";
import { DUREES, FULLBODY, MUSC, OBJS, PAT2MUSC } from "@/lib/data/referentiels";
import { avecSalle, selDeclare } from "@/lib/logic/core";
import { construireSeance, musclesPrioritaires, nomSeance } from "@/lib/logic/assistant";
import { zonesActives, zonesDe } from "@/lib/logic/forme";
import { useRepere } from "@/lib/store";
import { ARRIERE, AVANT, remplacement, revenirA } from "@/lib/nav";
import { Retour } from "@/components/repere/retour";
import { useBrouillon } from "@/lib/brouillon";
import { lienRubrique } from "@/components/repere/rubriques";
import { tactile } from "@/lib/repos";
import { cn } from "@/lib/utils";
import { Recommandation } from "@/components/repere/recommandation";
import { avisMuscles } from "@/lib/logic/avis-seance";
import { jourDe } from "@/lib/logic/historique";

/* Ce que les exercices d'un muscle font travailler au passage (muscles secondaires des mouvements de base). */
const INDIRECTS: Record<string, string[]> = {
  pec: ["tri", "epa"],
  dos: ["bic", "avb", "tra", "lom"],
  epa: ["tri", "tra"],
  qua: ["add", "mol"],
  isc: ["lom", "add"],
  abd: ["lom"],
  bic: ["avb"],
};

export default function PageAssistant() {
  return (
    <Suspense>
      <Assistant />
    </Suspense>
  );
}

function Assistant() {
  const router = useRouter();
  const A = useRepere((s) => s.etat.A);
  const muter = useRepere((s) => s.muter);
  /* Deux catégories à part : musculation (muscles, puis composeur) ou cardio (format, machine, durées). */
  const typeUrl = useSearchParams().get("type");
  /* venu de la rubrique Course : la préparation d'une course seulement */
  const courseSeule = typeUrl === "course";
  /* venu de « Modifier mon plan » : le même questionnaire, prérempli */
  const modifUrl = useSearchParams().get("modif") === "1", modif = courseSeule && modifUrl;
  /* venu du street workout (onglet Sur mesure) : le matériel du street seulement, pas de séance combinée */
  const street = useSearchParams().get("street") === "1";
  const [type, setType] = useState<"muscu" | "cardio" | "mixte" | "exercices" | "course">(typeUrl === "cardio" || typeUrl === "mixte" || typeUrl === "exercices" || typeUrl === "course" ? typeUrl : "muscu");
  const [choix, setChoix] = useState<ChoixCardio>(() => { const n = niveauDe(A.regularite); return { f: "fractionne", m: "tapis", n, r: reglagesDe("fractionne", n) }; });
  const [nomCardio, setNomCardio] = useState("");
  /* Enregistrer la séance cardio ; avec `demarrer`, son minuteur s'ouvre aussitôt (à la place de l'assistant). */
  const creerCardio = (demarrer = false) => {
    const nom = nomCardio.trim().slice(0, 60) || nomSeanceCardio(choix.f, choix.m);
    const i = useRepere.getState().etat.SEANCES_CARDIO?.length ?? 0;
    muter((E) => { (E.SEANCES_CARDIO ??= []).push({ nom, ...choix }); });
    toast.success(tr("« {nom} » ajoutée à tes séances cardio", { nom }));
    if (demarrer) { preparer(); remplacement(); router.replace(`/entrainement/cardio?s=${i}&go=1` as Route, AVANT); return; }
    revenirA("/entrainement/rubrique", () => router.replace(lienRubrique("libre"), ARRIERE));
  };
  const { sel: selB, setSel, setLibre } = useBrouillon();
  const sel = street ? (selB ?? MATERIEL_STREET).filter((t) => OUTILS_STREET.includes(t)) : avecSalle(selB ?? [], A);
  /* muscles touchés sur le corps d'Entraînement : déjà cochés */
  const mUrl = useSearchParams().get("m");
  const [m, setM] = useState<string[]>(() => (mUrl ? mUrl.split(",").filter((k) => MUSC.some((g) => g.k === k)) : []));
  const [vue, setVue] = useState<"corps" | "liste">("corps");
  /* durée habituelle et objectif du profil sportif (Profil) */
  const [d, setD] = useState(() => (typeof A.duree === "number" && [30, 45, 60].includes(A.duree) ? A.duree : 45));
  const [obj, setObj] = useState<number | null>(A.objectif ?? null);
  /* première séance créée avec un profil vide : 3 questions, une seule fois */
  const [miseEnRoute, setMiseEnRoute] = useState(() => !street && !courseSeule && !A.miseEnRoute && !profilMinimal(A));

  const bascule = (k: string) => { tactile(6); setM((l) => (l.includes(k) ? l.filter((x) => x !== k) : [...l, k])); };
  const noms = m.map((k) => MUSC.find((g) => g.k === k)!.n);
  /* muscles travaillés au passage par les exercices des muscles cochés (affichés en clair) */
  const avec = MUSC.filter((g) => !m.includes(g.k) && m.some((k) => INDIRECTS[k]?.includes(g.k)));
  /* suggestion d'Oxa sur le choix des muscles ; « Non merci » suit la séance jusque dans le composeur */
  const H = useRepere((s) => s.etat.HIST);
  const [auj] = useState(() => jourDe(Date.now()));
  const [refus, setRefus] = useState<string[]>([]);
  const suggestion = street ? undefined : avisMuscles(m, { H, auj }).find((x) => !refus.includes(x.id));
  const budget = Math.round((DUREES.find((x) => x[0] === d) || DUREES[1])[1] / 3);
  const peut = m.length > 0 && obj != null && sel.some((t) => !t.startsWith("x:"));

  const creer = (commencer = false) => {
    if (obj == null) return;
    const zones = zonesActives(A);
    const H = useRepere.getState().etat.HIST || [], habitudes = new Set(H.slice(-12).flatMap((l) => Object.keys(l.ex)));
    const ex = construireSeance(m, d, obj, sel, Math.random, (o) => zonesDe(o, zones).length > 0, A.regularite, { prio: musclesPrioritaires(prioNoms(A)), habitudes, dense: d === 30 });
    if (!ex.length) { dire(tr("Pas d'exercice disponible"), tr("Aucun exercice ne correspond à ces muscles avec le matériel coché. Ajoute du matériel ou choisis d'autres muscles.")); return; }
    /* combinée : le bloc cardio arrive à la fin, sans échauffement ; il se déplace ensuite dans le composeur */
    const blocs = type === "mixte" ? [{ ...nouveauBloc(ex.length, choix.f, choix.m, choix.n), r: { ...choix.r, echauf: 0 } }] : undefined;
    const seance = { nom: nomSeance(m) + (blocs ? tr(" + cardio") : ""), ex, obj, gen: { m: [...m], d, obj }, ...(blocs ? { blocs } : {}), ...(refus.length ? { avisIgnores: [...refus] } : {}) };
    /* « Créer et commencer » : enregistrée dans Mes séances et lancée tout de suite */
    if (commencer) {
      const i = useRepere.getState().etat.SEANCES.length;
      muter((E) => { E.SEANCES.push(seance); });
      preparer(); remplacement();
      router.replace(`/entrainement/seance?l=${i}` as Route, AVANT);
      return;
    }
    setLibre({ ...seance, idx: null });
    router.push("/entrainement/composer", AVANT);
  };

  return (
    <>
      {/* préparation de course : l'en-tête en photo est dans le questionnaire (il suit la course choisie) */}
      {!courseSeule && <EnTete
        surtitre={courseSeule ? tr("Course") : street ? tr("Street workout") : tr("Créer ma séance")}
        titre={courseSeule ? (modif ? tr("Modifier mon plan") : tr("Prépare une course")) : tr("Créer une séance pour moi")}
        gauche={<Retour repli="/entrainement" />}
      >
        <p className="mt-2 text-[15px] leading-relaxed text-muted-foreground">
          {type === "muscu"
            ? tr("Choisis ce que tu veux travailler : Oxa te propose une séance, que tu modifies ensuite comme tu veux.")
            : type === "mixte"
              ? tr("De la musculation et un bloc cardio dans la même séance. Le bloc se place où tu veux : avant, entre deux exercices ou à la fin.")
              : type === "course"
                ? (modif ? tr("Change tes réglages : tes sorties notées, tes pauses et ta progression sont gardées.") : tr("Un plan de préparation pour ta course ou ton Hyrox : allures calculées sur ton niveau, montée progressive, affûtage avant le jour J, et renfo."))
                : type === "exercices"
                  ? tr("Tous les exercices, muscle par muscle, avec ton matériel. Touche un exercice pour voir sa fiche.")
                  : tr("Une séance guidée : Oxa annonce chaque effort et chaque récupération, avec un signal sonore.")}
        </p>
        {/* street : pas de séance combinée (muscu en salle + bloc cardio) */}
        {!courseSeule && <Segmente label={tr("Catégorie")} className="mt-4" valeur={type} onChange={setType} options={[{ v: "muscu", n: tr("Muscu") }, { v: "cardio", n: tr("Cardio") }, ...(street ? [] : [{ v: "mixte" as const, n: tr("Combinée") }]), { v: "exercices", n: tr("Exercices") }]} />}
      </EnTete>}
      <MiseEnRoute ouvert={miseEnRoute && (type === "muscu" || type === "mixte")} onFin={() => { setMiseEnRoute(false); const o = useRepere.getState().etat.A.objectif; if (o != null) setObj(o); }} />

      {type === "course" ? (
        <QuestionnaireCourse />
      ) : type === "exercices" ? (
        <div className="px-4 pb-10">{street ? <BibliothequeMuscles outils={OUTILS_STREET} depart={MATERIEL_STREET} /> : <BibliothequeMuscles />}</div>
      ) : type === "cardio" ? (
        <>
          <div className="flex flex-col gap-6 px-4 pb-28">
            <ReglagesCardio choix={choix} onChange={setChoix} />
            <section>
              <h2 className="eyebrow mb-2 px-1">{tr("Nom de la séance")}</h2>
              <Input value={nomCardio} onChange={(e) => setNomCardio(e.target.value)} maxLength={60} placeholder={nomSeanceCardio(choix.f, choix.m)} className="h-12 rounded-2xl bg-card text-[16px]" />
            </section>
          </div>
          <div className="fixed inset-x-0 bottom-[max(env(safe-area-inset-bottom),14px)] z-30 mx-auto max-w-[480px] px-4">
            <div className="flex gap-2">
              <Button variant="soft" size="xl" className="flex-1 border border-border/80 bg-card" onClick={() => creerCardio()}>{tr("Enregistrer")}</Button>
              <Button variant="plate" size="xl" className="flex-[1.4]" onClick={() => creerCardio(true)}>{tr("Créer et démarrer")}</Button>
            </div>
          </div>
        </>
      ) : (
      <>
      {/* de la place sous le dernier bloc : le bouton fixe « Créer ma séance » ne cache rien */}
      <div className="flex flex-col gap-6 px-4 pb-36">
        {!street && <CalculePour duree={d} objectif={obj} />}
        {type === "muscu" && !street && !mUrl && <Recommandation onAppliquer={setM} />}
        <section>
          <div className="mb-2 flex items-baseline justify-between px-1">
            <span className="eyebrow">{tr("Muscles{a}", { a: m.length ? ` · ${m.length}` : "" })}</span>
            <span className="flex gap-3 text-[13px] font-medium">
              <button onClick={() => setM([...FULLBODY])} className="text-foreground">{tr("Full body")}</button>
              {m.length > 0 && <button onClick={() => setM([])} className="text-muted-foreground">{tr("Tout décocher")}</button>}
            </span>
          </div>
          <Segmente
            label={tr("Mode de sélection")}
            className="mb-2"
            valeur={vue}
            onChange={setVue}
            options={[{ v: "corps", n: tr("Sur le corps") }, { v: "liste", n: tr("Liste") }]}
          />
          {vue === "corps" ? (
            <SchemaCorps
              actif={(r) => !!(r.p && PAT2MUSC[r.p])}
              choisi={(r) => !!(r.p && m.includes(PAT2MUSC[r.p]))}
              teinte={(r) => (r.p && avec.some((g) => g.k === PAT2MUSC[r.p!]) ? 0.3 : 0)}
              onToucher={(r) => r.p && bascule(PAT2MUSC[r.p])}
              legende={tr("Touche un muscle pour le cocher")}
            />
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {MUSC.map((g) => {
                const on = m.includes(g.k), indirect = avec.includes(g);
                return (
                  <button
                    key={g.k}
                    aria-pressed={on}
                    onClick={() => bascule(g.k)}
                    className={cn("h-10 rounded-full border px-4 text-[14px] font-medium transition-colors", on ? "border-plate bg-plate text-plate-foreground" : indirect ? "border-plate/50 bg-plate-soft" : "border-border bg-card")}
                  >
                    {g.n}
                  </button>
                );
              })}
            </div>
          )}
          <p className={cn("mt-2 px-1 text-[14px] font-medium", !noms.length && "text-muted-foreground")}>
            {noms.length ? noms.join(" · ") : tr("Aucun muscle choisi pour l'instant.")}
          </p>
          {avec.length > 0 && (
            <p className="mt-1 flex items-start gap-2 px-1 text-[12.5px] leading-snug text-muted-foreground">
              <i className="mt-[3px] size-3 shrink-0 rounded-[4px] bg-[color-mix(in_oklab,var(--feu)_47%,transparent)]" />
              {tr("En clair, travaillés au passage : {a}. Touche-les pour leur donner leurs propres exercices.", { a: avec.map((g) => g.n.toLowerCase()).join(", ") })}
            </p>
          )}
          {suggestion && (
            <div className={cn("mt-3 rounded-[18px] p-3.5", suggestion.alerte ? "bg-amber-500/12" : "bg-plate-soft")}>
              <div className={cn("text-[11px] font-bold tracking-[0.12em] uppercase", suggestion.alerte ? "text-amber-700 dark:text-amber-400" : "text-plate-ink dark:text-plate")}>
                {suggestion.alerte ? tr("À savoir") : tr("Oxa te suggère")}
              </div>
              <p className="mt-1.5 text-[14px] leading-snug"><b className="font-bold">{suggestion.titre}</b> {suggestion.texte}</p>
              <div className="mt-2.5 flex flex-wrap items-center gap-1">
                {suggestion.ajouter && (
                  <button onClick={() => { tactile(8); setM((l) => [...l, ...suggestion.ajouter!.filter((k) => !l.includes(k))]); }}
                    className="flex min-h-9 items-center rounded-full bg-plate px-3.5 py-1.5 text-[13.5px] font-semibold text-plate-foreground active:scale-[.98]">
                    {tr("+ Ajouter : {a}", { a: suggestion.ajouter.map((k) => MUSC.find((g) => g.k === k)!.n.toLowerCase()).join(", ") })}
                  </button>
                )}
                <button onClick={() => { tactile(4); setRefus((l) => [...l, suggestion.id]); }} className={cn("px-2 py-1.5 text-[13px] font-semibold", suggestion.alerte ? "text-foreground" : "text-muted-foreground")}>
                  {suggestion.alerte ? tr("J'ai compris") : tr("Non merci")}
                </button>
              </div>
            </div>
          )}
          {m.length > budget && (
            <p className="mt-1 px-1 text-[12.5px] leading-snug text-muted-foreground">{tr("Beaucoup de muscles pour {d} minutes : un exercice par muscle, avec moins de séries sur les petits groupes. Tu pourras ajuster ensuite.", { d })}</p>
          )}
        </section>

        <section>
          <FiltreMateriel sel={sel} declare={street ? MATERIEL_STREET : selDeclare(A)} types={street ? OUTILS_STREET : undefined} onChange={(s) => setSel(s)} />
        </section>

        <section>
          <div className="eyebrow mb-2 px-1">{tr("Durée")}</div>
          <Segmente label={tr("Durée")} valeur={d} onChange={setD} options={DUREES.map(([x]) => ({ v: x, n: `${x} min` }))} />
        </section>

        <section>
          <div className="eyebrow mb-2 px-1">{tr("Objectif de la séance")}</div>
          <div className="grid grid-cols-2 gap-1.5">
            {OBJS.map((o, i) => (
              <button
                key={o}
                aria-pressed={obj === i}
                onClick={() => setObj(i)}
                className={cn("h-11 rounded-2xl border text-[14px] font-medium transition-colors", obj === i ? "border-foreground bg-foreground text-background" : "border-border bg-card")}
              >
                {o}
              </button>
            ))}
          </div>
          {obj == null && <p className="mt-2 px-1 text-[12.5px] text-muted-foreground">{tr("Choisis un objectif : il règle les répétitions, les repos et la collation.")}</p>}
        </section>

        {type === "mixte" && (
          <section className="rounded-[24px] border border-plate/40 bg-plate-soft/60 p-4">
            <div className="mb-3 flex items-baseline justify-between">
              <h2 className="text-[17px] font-bold">{tr("Bloc cardio")}</h2>
              <span className="text-[13px] text-muted-foreground">{tr("Total ≈")}{" "}<b className="num text-[16px] text-foreground">{d + Math.round(dureeTotaleCardio(construireCardio(choix.f, choix.m, { ...choix.r, echauf: 0 })) / 60)}{" "}{tr("min")}</b></span>
            </div>
            <ReglagesCardio choix={choix} onChange={setChoix} />
            <p className="mt-3 text-[12.5px] leading-relaxed text-muted-foreground">{tr("Il est placé à la fin, sans échauffement puisque la musculation t'aura chauffé. Dans le composeur, tu le déplaces où tu veux.")}</p>
          </section>
        )}
      </div>

      <div className="fixed inset-x-0 bottom-[max(env(safe-area-inset-bottom),14px)] z-30 mx-auto max-w-[480px] px-4">
        <div className="flex gap-2">
          <Button variant="outline" size="xl" className="flex-1 bg-background" disabled={!peut} onClick={() => creer()}>
            {tr("Ajuster")}
          </Button>
          <Button variant="plate" size="xl" className="flex-[1.6]" disabled={!peut} onClick={() => creer(true)}>
            {tr("Créer et commencer")}
          </Button>
        </div>
      </div>
      </>
      )}
    </>
  );
}
