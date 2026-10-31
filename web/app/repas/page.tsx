"use client";

/* Oxa Meal : trois onglets qui répondent chacun à une question, sans onglet à l'intérieur.
   - Aujourd'hui : mes besoins, mes protéines, trois idées ; le type de journée en pastille.
   - Ma semaine : le budget en une ligne, la semaine jour par jour, et la liste de courses
     qui s'ouvre en grand (bouton fixe en bas). Les réglages de la semaine et du budget sont
     dans une feuille (« Paramétrer »).
   - Recettes : un seul rang de filtres, dont « Mon frigo » (ce que j'ai déjà).
   Les préférences s'ouvrent depuis la roue de l'en-tête. Module en orange : une nuance par onglet. Première ouverture : le questionnaire. */
import { tr } from "@/lib/i18n";
import { Suspense, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ArrowsClockwiseIcon, BarbellIcon, CaretDownIcon, CaretRightIcon, CouchIcon, GearSixIcon, MinusIcon, PencilSimpleIcon, PlusIcon, ShareNetworkIcon, ShoppingCartIcon, SlidersHorizontalIcon, XIcon } from "@phosphor-icons/react";
import { toast } from "sonner";
import { ChoixLangue } from "@/components/repere/choix-langue";
import { EnTete } from "@/components/repere/en-tete";
import { Segmente } from "@/components/repere/segmente";
import { CarteProteines } from "@/components/repere/proteines";
import { AccueilRepas, BoutonAutre, ChampBudget, ChoixAliments, CarteBesoins, CarteRecette, Coche, FicheRecette, FormPrefs, Prudence } from "@/components/repere/repas";
import { Button } from "@/components/ui/button";
import { Drawer, DrawerContent, DrawerDescription, DrawerTitle } from "@/components/ui/drawer";
import type { Recette } from "@/lib/data/recettes";
import { jourDe } from "@/lib/logic/historique";
import { emojiDe } from "@/lib/data/aliments";
import {
  autreRecette, EMOJIS_RAYON, avecCeQueJai, besoins, CRENEAUX, listeCourses, nomAliment, nomRecette, NOM_CRENEAU, planSemaine, prefsDe, quantite, R, recettesPour, semaineParDefaut, suggestions, texteCourses,
} from "@/lib/logic/repas";
import { ajuster, appliquer, coutsParJour, echanges, emballage, estimer, estimerSemaine, euros, petitBudget, prixKg, type Estimation } from "@/lib/logic/budget";
import { PRIX } from "@/lib/data/prix";
import type { ArticleLibre, CreneauRepas, PrefsRepas, SemaineRepas } from "@/lib/logic/types";
import { useRepere } from "@/lib/store";
import { useVueRepas, type VueRepas } from "@/lib/nav";
import { tactile } from "@/lib/repos";
import { cn } from "@/lib/utils";

const puce = (on: boolean) => cn("h-8 shrink-0 rounded-full border px-3 text-[13px] font-medium transition-colors", on ? "border-foreground bg-foreground text-background" : "border-border bg-card text-muted-foreground");
type Besoins = ReturnType<typeof besoins>;

function Repas() {
  const etat = useRepere((s) => s.etat), muter = useRepere((s) => s.muter);
  const p = prefsDe(etat.A);
  const vue = useVueRepas((s) => s.vue);
  const [auj] = useState(() => jourDe(Date.now()));
  /* jour de séance : déjà entraîné aujourd'hui, sinon au choix */
  const actif = (etat.HIST || []).some((l) => l.d === auj) || (etat.CARDIO || []).some((c) => jourDe(c.ts) === auj);
  const [seance, setSeance] = useState(actif);
  const b = besoins(etat, seance);
  const kcal = !!p.kcal;
  const params = useSearchParams(), lien = params.get("r");
  const [fiche, setFiche] = useState<{ r: Recette; c?: CreneauRepas } | null>(() => (lien && R[lien] ? { r: R[lien] } : null));
  /* le questionnaire, rouvert depuis la roue de l'en-tête ou depuis le menu (?prefs=1) */
  const [brouillon, setBrouillon] = useState<PrefsRepas | null>(() => (params.get("prefs") && p.fait ? p : null));
  const majPrefs = (q: PrefsRepas) => muter((E) => { E.A.repas = { ...q, fait: true }; });

  return (
    <div className="theme-repas">
      <EnTete
        surtitre={tr("Repas")} titre="Oxa Meal"
        actions={(
          <span className="flex items-center gap-1.5">
            {p.fait && (
              <button onClick={() => { tactile(6); setBrouillon(p); }} aria-label={tr("Préférences repas")}
                className="grid size-8 place-items-center rounded-full bg-muted active:scale-95">
                <GearSixIcon className="size-[18px]" weight="bold" />
              </button>
            )}
            <ChoixLangue />
          </span>
        )}
      />
      {!p.fait ? <AccueilRepas /> : (
        <div className="flex flex-col gap-3 px-4">
          <Segmente label={tr("Rubrique repas")} valeur={vue} onChange={(v: VueRepas) => { tactile(4); useVueRepas.setState({ vue: v }); }}
            options={[{ v: "jour", n: tr("Aujourd'hui"), t: "#f7b14a" }, { v: "semaine", n: tr("Ma semaine"), t: "#f08a24" }, { v: "recettes", n: tr("Recettes"), t: "#e2611c" }]} />
          {vue === "jour" && <Jour p={p} seance={seance} setSeance={setSeance} b={b} kcal={kcal} auj={auj} ouvrir={(r, c) => setFiche({ r, c })} />}
          {vue === "semaine" && <Semaine p={p} b={b} kcal={kcal} ouvrir={(r, c) => setFiche({ r, c })} />}
          {vue === "recettes" && <Recettes p={p} b={b} kcal={kcal} majPrefs={majPrefs} ouvrir={(r) => setFiche({ r })} />}
          <Prudence />
        </div>
      )}
      <FicheRecette r={fiche?.r ?? null} c={fiche?.c} b={b} kcal={kcal} pers0={vue === "semaine" ? p.pers ?? 1 : 1} onClose={() => setFiche(null)} />
      {/* grande feuille qui défile : pas de repositionnement au clavier (sur iPhone, elle remontait
          hors de l'écran et cachait le champ en cours de saisie) ; c'est la page qui fait défiler le champ */}
      <Drawer open={!!brouillon} onOpenChange={(o) => !o && setBrouillon(null)} repositionInputs={false}>
        <DrawerContent className="theme-repas max-h-[92dvh]">
          {brouillon && (
            <div className="overflow-y-auto overscroll-contain px-4 pb-[max(env(safe-area-inset-bottom),20px)]">
              <DrawerTitle className="mt-2 px-1 text-[22px] font-bold">{tr("Préférences repas")}</DrawerTitle>
              <DrawerDescription className="mt-1 mb-4 px-1 text-[13.5px] text-muted-foreground">{tr("Les recettes proposées en tiennent compte partout.")}</DrawerDescription>
              <FormPrefs p={brouillon} onChange={setBrouillon} />
              <Button variant="plate" size="lg" className="mt-5 w-full rounded-xl" onClick={() => { tactile(10); majPrefs(brouillon); setBrouillon(null); }}>{tr("Enregistrer")}</Button>
            </div>
          )}
        </DrawerContent>
      </Drawer>
    </div>
  );
}

/* Feuille réutilisable : titre, texte, contenu qui défile. */
function Feuille({ ouvert, onClose, titre, texte, children, pied }: { ouvert: boolean; onClose: () => void; titre: string; texte?: string; children: React.ReactNode; pied?: React.ReactNode }) {
  return (
    <Drawer open={ouvert} onOpenChange={(o) => !o && onClose()} repositionInputs={false}>
      <DrawerContent className="theme-repas max-h-[92dvh]">
        <div className="flex min-h-0 flex-col">
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-4">
            <DrawerTitle className="mt-2 px-1 text-[22px] font-bold">{titre}</DrawerTitle>
            {texte ? <DrawerDescription className="mt-1 mb-3 px-1 text-[13.5px] text-muted-foreground">{texte}</DrawerDescription> : <DrawerDescription className="sr-only">{titre}</DrawerDescription>}
            {children}
          </div>
          {pied && <div className="shrink-0 border-t border-border/60 px-4 pt-3 pb-[max(env(safe-area-inset-bottom),16px)]">{pied}</div>}
        </div>
      </DrawerContent>
    </Drawer>
  );
}

/* ---------------- aujourd'hui ---------------- */
function Jour({ p, seance, setSeance, b, kcal, auj, ouvrir }: { p: PrefsRepas; seance: boolean; setSeance: (s: boolean) => void; b: Besoins; kcal: boolean; auj: string; ouvrir: (r: Recette, c: CreneauRepas) => void }) {
  const [decal, setDecal] = useState<Partial<Record<CreneauRepas, number>>>({});
  const s = suggestions(p, auj, seance, decal);
  return (
    <>
      {/* le type de journée : deviné (séance faite aujourd'hui), touché pour l'inverser */}
      <button onClick={() => { tactile(5); setSeance(!seance); }} aria-label={tr("Type de journée : {t}. Changer", { t: seance ? tr("Jour de séance") : tr("Jour de repos") })}
        className="flex w-fit items-center gap-2 rounded-full bg-card py-1.5 pr-3 pl-2.5 text-[13.5px] font-semibold active:scale-[.97]">
        {seance ? <BarbellIcon className="size-4 text-plate-ink" weight="bold" /> : <CouchIcon className="size-4 text-plate-ink" weight="bold" />}
        {seance ? tr("Jour de séance") : tr("Jour de repos")}
      </button>
      <CarteBesoins b={b} kcal={kcal} />
      <CarteProteines />
      <h2 className="mt-2 px-1 text-[19px] font-bold">{tr("Idées pour aujourd'hui")}</h2>
      {(["matin", "dejeuner", "collation"] as CreneauRepas[]).map((c) => s[c] && (
        <CarteRecette key={c} r={s[c]!} c={c === "dejeuner" ? undefined : c} b={b} kcal={kcal} onOuvrir={() => ouvrir(s[c]!, c)}
          droite={<BoutonAutre label={tr("Une autre idée : {c}", { c: NOM_CRENEAU[c] })} onClick={() => setDecal((d) => ({ ...d, [c]: (d[c] ?? 0) + 1 }))} />}
          sous={c === "dejeuner" ? <span className="eyebrow mt-1 block">{tr("Déjeuner ou dîner")}</span> : undefined}
        />
      ))}
    </>
  );
}

/* ---------------- recettes ---------------- */
type Filtre = "tout" | "frigo" | "matin" | "repas" | "collation" | "rapide" | "batch" | "budget" | "post";
function Recettes({ p, b, kcal, majPrefs, ouvrir }: { p: PrefsRepas; b: Besoins; kcal: boolean; majPrefs: (p: PrefsRepas) => void; ouvrir: (r: Recette) => void }) {
  const [f, setF] = useState<Filtre>("tout");
  const [frigo, setFrigo] = useState(false);
  const stock = useMemo(() => p.stock ?? [], [p.stock]);
  const corr = useMemo(() => avecCeQueJai(p, stock), [p, stock]);
  const FILTRES: [Filtre, string][] = [["tout", tr("Tout")], ["matin", tr("Petit-déjeuner")], ["repas", tr("Plats")], ["collation", tr("Collations et desserts")], ["rapide", tr("Rapide")], ["post", tr("Après la séance")], ["budget", tr("Petit budget")], ["batch", tr("Batch cooking")]];
  /* « Petit budget » : le tiers le moins cher de chaque moment, d'après les prix ; les desserts vont avec les collations */
  const liste = recettesPour(p).filter((r) => f === "tout" || f === "frigo" || r.m === f || (f === "collation" && r.t.includes("dessert" as never)) || (f === "budget" ? petitBudget(r, p.prix) : r.t.includes(f as never)));
  const choisir = (k: Filtre) => { tactile(4); setF(k); if (k === "frigo" && !stock.length) setFrigo(true); };
  return (
    <>
      <div className="no-scrollbar -mx-4 flex gap-1.5 overflow-x-auto px-4">
        <button aria-pressed={f === "frigo"} onClick={() => choisir("frigo")}
          className={cn(puce(f === "frigo"), f !== "frigo" && "border-plate/50 bg-plate-soft text-plate-ink")}>
          🧊 {tr("Mon frigo")}{stock.length > 0 && ` (${stock.length})`}
        </button>
        {FILTRES.map(([k, n]) => <button key={k} aria-pressed={f === k} onClick={() => choisir(k)} className={puce(f === k)}>{n}</button>)}
      </div>
      {f === "frigo" ? (
        <>
          <button onClick={() => { tactile(5); setFrigo(true); }} className="flex items-center gap-3 rounded-[18px] bg-card px-4 py-3 text-left active:opacity-80">
            <span className="min-w-0 flex-1">
              <span className="block text-[14.5px] font-semibold">{stock.length ? tr("{n} aliments dans mon frigo", { n: stock.length }) : tr("Mon frigo est vide")}</span>
              <span className="block truncate text-[12.5px] text-muted-foreground">{stock.length ? stock.slice(0, 6).map((id) => `${emojiDe(id)} ${nomAliment(id).toLowerCase()}`).join(", ") : tr("Touche ce que tu as : je te dis ce que tu peux cuisiner.")}</span>
            </span>
            <PencilSimpleIcon className="size-4 shrink-0 text-muted-foreground" weight="bold" />
          </button>
          {stock.length > 0 && (
            <div className="flex flex-col gap-2">
              {corr.slice(0, 15).map(({ r, manque }) => (
                <CarteRecette key={r.id} r={r} b={b} kcal={kcal} onOuvrir={() => ouvrir(r)}
                  sous={<span className={cn("mt-1 block truncate text-[12.5px] font-medium", manque.length ? "text-muted-foreground" : "text-success")}>{manque.length ? tr("Il te manque : {l}", { l: manque.map((id) => `${emojiDe(id)} ${nomAliment(id).toLowerCase()}`).join(", ") }) : tr("Tu as tout")}</span>}
                />
              ))}
            </div>
          )}
        </>
      ) : (
        <>
          <p className="px-1 text-[12.5px] text-muted-foreground">{tr(liste.length > 1 ? "{n} recettes pour toi" : "{n} recette pour toi", { n: liste.length })}</p>
          <div className="flex flex-col gap-2">{liste.map((r) => <CarteRecette key={r.id} r={r} b={b} kcal={kcal} onOuvrir={() => ouvrir(r)} />)}</div>
        </>
      )}
      <Feuille ouvert={frigo} onClose={() => setFrigo(false)} titre={tr("Mon frigo")}
        texte={tr("Touche ce que tu as dans ton frigo et tes placards : sel, huile et épices sont comptés d'office. Ta liste de courses le retire aussi.")}
        pied={(
          <div className="flex gap-2">
            {stock.length > 0 && <Button variant="soft" size="lg" className="rounded-xl" onClick={() => majPrefs({ ...p, stock: [] })}>{tr("Tout décocher")}</Button>}
            <Button variant="plate" size="lg" className="flex-1 rounded-xl" onClick={() => { tactile(8); setFrigo(false); setF("frigo"); }}>{tr("Voir ce que je peux cuisiner")}</Button>
          </div>
        )}>
        <ChoixAliments choisis={stock} perso={p.perso ?? []}
          onBasculer={(id) => majPrefs({ ...p, stock: stock.includes(id) ? stock.filter((x) => x !== id) : [...stock, id] })}
          onAjouter={(a) => majPrefs({ ...p, perso: [...(p.perso ?? []), a], stock: [...stock, a.id] })}
        />
      </Feuille>
    </>
  );
}

/* ---------------- ma semaine ---------------- */
const JOURS = [tr("Lundi"), tr("Mardi"), tr("Mercredi"), tr("Jeudi"), tr("Vendredi"), tr("Samedi"), tr("Dimanche")];
function Semaine({ p, b, kcal, ouvrir }: { p: PrefsRepas; b: Besoins; kcal: boolean; ouvrir: (r: Recette, c: CreneauRepas) => void }) {
  const A = useRepere((s) => s.etat.A), muter = useRepere((s) => s.muter);
  const S: SemaineRepas = { ...semaineParDefaut(), ...(A.semaine || {}) };
  const maj = (f: (s: SemaineRepas) => SemaineRepas) => muter((E) => { E.A.semaine = f({ ...semaineParDefaut(), ...(E.A.semaine || {}) }); });
  const cases = planSemaine(p, S), pers = p.pers ?? 1;
  const liste = listeCourses(cases, b, pers, p.stock ?? []);
  const articles = S.articles ?? [];
  const est = estimer(liste, articles, !p.conso, p.prix);
  const majPrefs = (f: (q: PrefsRepas) => PrefsRepas) => muter((E) => { E.A.repas = f(prefsDe(E.A)); });
  const [reglages, setReglages] = useState(false);
  const [courses, setCourses] = useState(false);
  const [prixDe, setPrixDe] = useState<string | null>(null);
  /* jours dépliés : repliés par défaut, la semaine se lit d'un coup d'œil (jour, repas, coût) */
  const [ouverts, setOuverts] = useState<number[]>([]);
  const parJour = coutsParJour(cases, b, pers, S.jours, p.stock ?? [], p.prix);
  const joursPlanifies = Array.from({ length: S.jours }, (_, j) => j).filter((j) => cases.some((k) => k.jour === j));
  const nbArticles = liste.reduce((n, r) => n + r.l.length, 0) + articles.length;
  const restants = liste.reduce((n, r) => n + r.l.filter((x) => !S.coches.includes(x.id)).length, 0) + articles.filter((a) => !S.coches.includes(a.id)).length;
  const budget = p.budget, part = budget ? est.total / budget : 0;
  const etatBudget = !budget ? null : part > 1 ? "depasse" : part > 0.9 ? "limite" : "ok";
  const resume = [tr(S.jours > 1 ? "{n} jours" : "{n} jour", { n: S.jours }), tr(pers > 1 ? "{n} personnes" : "{n} personne", { n: pers })].join(" · ");
  return (
    <>
      {/* le budget en une ligne : touché, il ouvre les réglages de la semaine */}
      <button onClick={() => { tactile(5); setReglages(true); }} className="rounded-[22px] bg-card p-4 text-left active:opacity-85" aria-label={tr("Paramétrer ma semaine et mon budget")}>
        <span className="flex items-start gap-3">
          <span className="min-w-0 flex-1">
            <span className="flex items-baseline gap-2">
              <span className="num text-[30px] leading-none font-bold">{"≈ " + euros(est.total)}</span>
              {budget && <span className="text-[14px] text-muted-foreground">{tr("sur {e}", { e: euros(budget) })}</span>}
            </span>
            <span className="mt-1.5 block text-[13px] text-muted-foreground">{resume} · {p.conso ? tr("consommé") : tr("en caisse")}</span>
          </span>
          <span className="flex shrink-0 items-center gap-1 rounded-full bg-muted px-3 py-1.5 text-[13px] font-semibold"><SlidersHorizontalIcon className="size-4" weight="bold" />{tr("Paramétrer")}</span>
        </span>
        {budget ? (
          <>
            <span className="mt-3 block h-2 overflow-hidden rounded-full bg-muted" role="meter" aria-valuemin={0} aria-valuemax={budget} aria-valuenow={Math.round(est.total)} aria-label={tr("Part du budget utilisée")}>
              <span className={cn("block h-full rounded-full transition-[width] duration-500", etatBudget === "depasse" ? "bg-destructive" : etatBudget === "limite" ? "bg-amber-500" : "bg-success")} style={{ width: `${Math.min(100, part * 100)}%` }} />
            </span>
            <span className={cn("mt-1.5 block text-[13px] font-medium", etatBudget === "depasse" ? "text-destructive" : etatBudget === "limite" ? "text-amber-600 dark:text-amber-400" : "text-success")}>
              {etatBudget === "depasse" ? tr("{e} au-dessus de ton budget · voir les échanges", { e: euros(est.total - budget) }) : tr("Il te reste environ {e}", { e: euros(budget - est.total) })}
            </span>
          </>
        ) : <span className="mt-2 block text-[13px] font-medium text-plate-ink">{tr("Fixer un budget pour la semaine")}</span>}
      </button>

      {joursPlanifies.length > 0 && (
        <div className="mt-1 flex items-baseline justify-between px-1">
          <h2 className="text-[17px] font-bold">{tr("Jour par jour")}</h2>
          <button onClick={() => { tactile(8); maj((s) => ({ ...s, graine: s.graine + 1, choix: {}, coches: [] })); }} className="flex items-center gap-1 text-[13px] font-semibold text-plate-ink">
            <ArrowsClockwiseIcon className="size-3.5" weight="bold" />{tr("Autre semaine")}
          </button>
        </div>
      )}
      {joursPlanifies.map((j) => {
        const du = cases.filter((k) => k.jour === j), ouvert = ouverts.includes(j);
        return (
          <section key={j} aria-label={JOURS[j]} className="overflow-hidden rounded-[20px] bg-card">
            <button onClick={() => { tactile(4); setOuverts((o) => (o.includes(j) ? o.filter((x) => x !== j) : [...o, j])); }} aria-expanded={ouvert}
              className="flex w-full items-center gap-3 px-4 py-3 text-left active:bg-muted">
              <span className="min-w-0 flex-1">
                <span className="flex items-baseline gap-2">
                  <span className="text-[15.5px] font-semibold">{JOURS[j]}</span>
                  <span className="text-[12.5px] text-muted-foreground">{du.length > 1 ? tr("{n} repas", { n: du.length }) : tr("1 repas")}</span>
                </span>
                {!ouvert && <span className="block truncate text-[12.5px] text-muted-foreground">{du.map((k) => nomRecette(k.r)).join(" · ")}</span>}
              </span>
              <span className="num shrink-0 text-[15px] font-bold" aria-label={tr("Environ {e} ce jour-là", { e: euros(parJour[j]) })}>{"≈ " + euros(parJour[j])}</span>
              <CaretDownIcon className={cn("size-4 shrink-0 text-muted-foreground transition-transform duration-200", ouvert && "rotate-180")} />
            </button>
            {ouvert && (
              <div className="flex flex-col gap-1.5 bg-muted/40 p-1.5">
                {du.map((k) => (
                  <CarteRecette key={k.c} r={k.r} c={k.c} b={b} kcal={kcal} onOuvrir={() => ouvrir(k.r, k.c)}
                    sous={k.reste ? <span className="mt-1 block text-[12.5px] font-medium text-plate-ink">{tr("Les restes du dîner d'hier")}</span> : undefined}
                    droite={k.reste ? <span className="size-10" /> : <BoutonAutre label={tr("Changer : {j}, {c}", { j: JOURS[j], c: NOM_CRENEAU[k.c] })} onClick={() => maj((s) => ({ ...s, choix: { ...s.choix, [`${j}|${k.c}`]: autreRecette(p, cases, k).id } }))} />}
                  />
                ))}
              </div>
            )}
          </section>
        );
      })}
      {joursPlanifies.length > 0 && (
        <p className="px-1 text-[12px] leading-relaxed text-muted-foreground">
          {pers > 1 ? tr("Coût de ce que les repas de chaque jour consomment, pour {n} personnes. En caisse, les paquets entiers font un peu plus.", { n: pers }) : tr("Coût de ce que les repas de chaque jour consomment. En caisse, les paquets entiers font un peu plus.")}
        </p>
      )}
      {/* place pour le bouton fixe de la liste de courses */}
      <div className="h-20" aria-hidden />

      {/* la liste de courses, toujours à portée de pouce, au-dessus de la barre d'onglets */}
      <div className="fixed inset-x-0 bottom-[calc(max(env(safe-area-inset-bottom),10px)+82px)] z-40 mx-auto max-w-[480px] px-4">
        <button onClick={() => { tactile(8); setCourses(true); }}
          className="flex h-14 w-full items-center justify-center gap-2 rounded-full bg-plate px-5 text-[15px] font-semibold text-plate-foreground shadow-[0_12px_28px_-10px_var(--plate)] active:scale-[.98]">
          <ShoppingCartIcon className="size-5" weight="bold" />
          <span className="truncate">{restants < nbArticles ? tr("Ma liste de courses · {n} sur {t}", { n: restants, t: nbArticles }) : tr("Ma liste de courses · {n} articles", { n: nbArticles })}</span>
          <CaretRightIcon className="size-4 shrink-0" weight="bold" />
        </button>
      </div>

      <Feuille ouvert={reglages} onClose={() => setReglages(false)} titre={tr("Ma semaine et mon budget")}>
        <ReglagesSemaine p={p} S={S} b={b} est={est} maj={maj} majPrefs={majPrefs} />
      </Feuille>
      <Feuille ouvert={courses} onClose={() => setCourses(false)} titre={tr("Liste de courses")}
        texte={tr("{n} sur {t} à prendre", { n: restants, t: nbArticles }) + ((p.stock?.length ?? 0) > 0 ? " · " + tr("sans ce qui est déjà dans ton frigo") : "")}
        pied={<ListePartager liste={liste} S={S} total={est.total} />}>
        <ListeCourses p={p} S={S} liste={liste} est={est} maj={maj} setPrixDe={setPrixDe} />
      </Feuille>
      {/* hors de la feuille de la liste : une feuille ne s'ouvre pas dans une autre */}
      <PrixAliment id={prixDe} p={p} onClose={() => setPrixDe(null)} onChange={(id, kg) => majPrefs((q) => {
        const prix = { ...(q.prix ?? {}) };
        if (kg == null) delete prix[id]; else prix[id] = kg;
        return { ...q, prix };
      })} />
    </>
  );
}

/* Réglages de la semaine (jours, personnes, repas) et du budget, dans une feuille. */
function ReglagesSemaine({ p, S, b, est, maj, majPrefs }: { p: PrefsRepas; S: SemaineRepas; b: Besoins; est: Estimation; maj: (f: (s: SemaineRepas) => SemaineRepas) => void; majPrefs: (f: (q: PrefsRepas) => PrefsRepas) => void }) {
  const muter = useRepere((s) => s.muter), pers = p.pers ?? 1;
  return (
    <div className="flex flex-col gap-3">
      <section className="rounded-[20px] bg-card p-4" aria-label={tr("Ma semaine de repas")}>
        <div className="flex items-center justify-between gap-3">
          <span className="text-[14.5px]">{tr("Nombre de jours")}</span>
          <Compteur v={S.jours} min={1} max={7} onChange={(v) => maj((s) => ({ ...s, jours: v, choix: {} }))} label={tr("jours")} />
        </div>
        <div className="mt-2 flex items-center justify-between gap-3">
          <span className="text-[14.5px]">{tr("Personnes")}</span>
          <Compteur v={pers} min={1} max={8} onChange={(v) => muter((E) => { E.A.repas = { ...prefsDe(E.A), pers: v }; })} label={tr("personnes")} />
        </div>
        <h3 className="eyebrow mt-4 mb-1.5">{tr("Repas à prévoir")}</h3>
        <div className="flex flex-wrap gap-1.5">
          {CRENEAUX.map((c) => {
            const on = S.creneaux.includes(c);
            return <button key={c} aria-pressed={on} onClick={() => maj((s) => ({ ...s, creneaux: on ? s.creneaux.filter((x) => x !== c) : CRENEAUX.filter((x) => x === c || s.creneaux.includes(x)), choix: {} }))} className={puce(on)}>{NOM_CRENEAU[c]}</button>;
          })}
        </div>
      </section>
      <CarteBudget p={p} S={S} b={b} est={est} majPrefs={majPrefs} majSemaine={(s) => maj(() => s)} />
    </div>
  );
}

/* Bouton « Partager la liste », en pied de la feuille. */
function ListePartager({ liste, S, total }: { liste: ReturnType<typeof listeCourses>; S: SemaineRepas; total: number }) {
  const partager = async () => {
    const texte = tr("Liste de courses Oxa") + "\n\n" + texteCourses(liste, S.coches, S.articles) + "\n\n" + tr("Budget estimé : environ {e}", { e: euros(total) });
    tactile(8);
    try {
      if (navigator.share) await navigator.share({ title: tr("Liste de courses"), text: texte });
      else { await navigator.clipboard.writeText(texte); toast(tr("Liste copiée")); }
    } catch {}
  };
  return <Button variant="plate" size="lg" className="w-full rounded-xl" onClick={partager}><ShareNetworkIcon weight="bold" />{tr("Partager la liste")}</Button>;
}

/* La liste de courses à cocher au magasin : mes articles, puis les rayons ; le prix se corrige. */
function ListeCourses({ p, S, liste, est, maj, setPrixDe }: { p: PrefsRepas; S: SemaineRepas; liste: ReturnType<typeof listeCourses>; est: Estimation; maj: (f: (s: SemaineRepas) => SemaineRepas) => void; setPrixDe: (id: string) => void }) {
  const articles = S.articles ?? [];
  const cocher = (id: string) => { tactile(5); maj((s) => ({ ...s, coches: s.coches.includes(id) ? s.coches.filter((y) => y !== id) : [...s.coches, id] })); };
  return (
    <div className="flex flex-col gap-3">
      {/* articles ajoutés à la main */}
      <div className="overflow-hidden rounded-[20px] bg-card" aria-label={tr("Mes articles")} role="group">
        {articles.length > 0 && <h3 className="eyebrow px-4 pt-3 pb-1">{tr("Mes articles")}</h3>}
        {articles.map((a) => {
          const on = S.coches.includes(a.id);
          return (
            <div key={a.id} className="flex items-center gap-3 border-t border-border/60 px-4 py-2.5 first:border-t-0">
              <button aria-pressed={on} onClick={() => cocher(a.id)} className="flex flex-1 items-center gap-3 text-left">
                <Coche on={on} />
                <span aria-hidden className="text-[18px]">{a.e}</span>
                <span className={cn("flex-1 text-[14.5px]", on && "text-muted-foreground line-through")}>{a.n}</span>
                {a.q && <span className={cn("num shrink-0 text-[14px] font-semibold", on && "text-muted-foreground")}>{a.q}</span>}
                {a.prix != null && <span className="num shrink-0 text-[12.5px] text-muted-foreground">{euros(a.prix)}</span>}
              </button>
              <button aria-label={tr("Retirer {n}", { n: a.n })} onClick={() => { tactile(6); maj((s) => ({ ...s, articles: (s.articles ?? []).filter((x) => x.id !== a.id), coches: s.coches.filter((y) => y !== a.id) })); }} className="grid size-8 place-items-center rounded-full text-muted-foreground active:bg-muted"><XIcon className="size-4" weight="bold" /></button>
            </div>
          );
        })}
        <AjoutArticle onAjouter={(a) => maj((s) => ({ ...s, articles: [...(s.articles ?? []), a] }))} />
      </div>
      {liste.map((ray) => (
        <div key={ray.k} className="overflow-hidden rounded-[20px] bg-card">
          <h3 className="eyebrow px-4 pt-3 pb-1">{ray.n}</h3>
          {ray.l.map((x) => {
            const on = S.coches.includes(x.id);
            return (
              <div key={x.id} className="flex items-center gap-2 border-t border-border/60 pr-2 first:border-t-0">
                <button aria-pressed={on} onClick={() => cocher(x.id)} className="flex min-w-0 flex-1 items-center gap-3 py-2.5 pl-4 text-left">
                  <Coche on={on} />
                  <span aria-hidden className="text-[18px]">{emojiDe(x.id)}</span>
                  <span className={cn("min-w-0 flex-1 text-[14.5px]", on && "text-muted-foreground line-through")}>{nomAliment(x.id)}</span>
                  <span className={cn("num shrink-0 text-[14px] font-semibold", on && "text-muted-foreground")}>{x.texte}</span>
                </button>
                {/* prix estimé : touché, il se corrige au prix de son magasin */}
                <button onClick={() => { tactile(5); setPrixDe(x.id); }} aria-label={tr("Prix de {n} : environ {e}. Modifier", { n: nomAliment(x.id), e: euros(est.lignes[x.id] ?? 0) })}
                  className={cn("num w-[4.25rem] shrink-0 rounded-lg px-1.5 py-1 text-right text-[12.5px] underline decoration-dotted underline-offset-4 active:bg-muted", p.prix?.[x.id] != null ? "font-semibold text-plate-ink" : "text-muted-foreground")}>
                  {euros(est.lignes[x.id] ?? 0)}
                </button>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}

/* ---------------- budget ---------------- */
/* Carte « Budget des courses » : estimation de la liste (fourchette selon le magasin), en caisse
   ou consommée, jauge face au budget de la semaine, et des échanges de recettes si ça dépasse. */
function CarteBudget({ p, S, b, est, majPrefs, majSemaine }: { p: PrefsRepas; S: SemaineRepas; b: ReturnType<typeof besoins>; est: Estimation; majPrefs: (f: (q: PrefsRepas) => PrefsRepas) => void; majSemaine: (s: SemaineRepas) => void }) {
  const budget = p.budget, part = budget ? est.total / budget : 0;
  const etat = !budget ? null : part > 1 ? "depasse" : part > 0.9 ? "limite" : "ok";
  const props = etat && etat !== "ok" ? echanges(p, S, b, 3) : [];
  const ajusterSemaine = () => {
    tactile(10);
    const s = ajuster(p, S, b), apres = estimerSemaine(p, s, b).total;
    majSemaine(s);
    toast(apres <= budget! ? tr("Semaine ajustée : environ {a} au lieu de {b}.", { a: euros(apres), b: euros(est.total) }) : tr("Après ajustement, ta semaine coûte encore environ {a}. Tu peux retirer un repas ou augmenter ton budget.", { a: euros(apres) }));
  };
  return (
    <section className="mt-2 rounded-[22px] bg-card p-4" aria-label={tr("Budget des courses")}>
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-[17px] font-bold">{tr("Budget des courses")}</h2>
        <span className="text-[12px] text-muted-foreground">{tr("Prix moyens estimés")}</span>
      </div>
      <p className="mt-2 flex items-baseline gap-2">
        <span className="num text-[34px] leading-none font-bold">{"≈ " + euros(est.total)}</span>
        {budget && <span className="text-[14px] text-muted-foreground">{tr("sur {e}", { e: euros(budget) })}</span>}
      </p>
      <p className="mt-1 text-[12.5px] text-muted-foreground">{tr("Entre {a} et {b} selon le magasin.", { a: euros(est.bas), b: euros(est.haut) })}</p>

      {budget ? (
        <>
          <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-muted" role="meter" aria-valuemin={0} aria-valuemax={budget} aria-valuenow={Math.round(est.total)} aria-label={tr("Part du budget utilisée")}>
            <div className={cn("h-full rounded-full transition-[width] duration-500", etat === "depasse" ? "bg-destructive" : etat === "limite" ? "bg-amber-500" : "bg-success")} style={{ width: `${Math.min(100, part * 100)}%` }} />
          </div>
          <p className={cn("mt-1.5 text-[13px] font-medium", etat === "depasse" ? "text-destructive" : etat === "limite" ? "text-amber-600 dark:text-amber-400" : "text-success")}>
            {etat === "depasse" ? tr("{e} au-dessus de ton budget", { e: euros(est.total - budget) }) : tr("Il te reste environ {e}", { e: euros(budget - est.total) })}
          </p>
        </>
      ) : null}
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <span className="text-[13.5px]">{tr("Mon budget")}</span>
        <ChampBudget key={budget ?? 0} v={budget} onChange={(v) => majPrefs((q) => ({ ...q, budget: v }))} />
      </div>

      <div className="mt-3">
        <Segmente label={tr("Façon de compter")} valeur={p.conso ? "conso" : "caisse"} onChange={(v) => majPrefs((q) => ({ ...q, conso: v === "conso" }))}
          options={[{ v: "caisse", n: tr("En caisse") }, { v: "conso", n: tr("Consommé") }]} />
        <p className="mt-1.5 px-1 text-[12px] leading-relaxed text-muted-foreground">
          {p.conso ? tr("Seulement ce que les repas de la semaine utilisent : le reste des paquets te servira plus tard.") : tr("Paquets entiers : ce que tu paies vraiment au magasin.")}
        </p>
      </div>

      {props.length > 0 && (
        <div className="mt-4">
          <h3 className="eyebrow mb-1.5">{tr("Pour alléger la note")}</h3>
          <ul className="flex flex-col gap-1.5">
            {props.map((e) => (
              <li key={`${e.k.jour}|${e.k.c}`} className="flex items-center gap-3 rounded-2xl bg-muted/60 px-3 py-2.5">
                <span className="min-w-0 flex-1 text-[13px] leading-snug">
                  <span className="block text-[11.5px] font-medium text-muted-foreground">{JOURS[e.k.jour]} · {NOM_CRENEAU[e.k.c]}</span>
                  <span className="block truncate text-muted-foreground line-through">{nomRecette(e.k.r)}</span>
                  <span className="block truncate font-semibold">{nomRecette(e.vers)}</span>
                </span>
                <span className="num shrink-0 text-[13px] font-bold text-success">{"−" + euros(e.gain)}</span>
                <Button variant="soft" size="sm" className="shrink-0 rounded-full" onClick={() => { tactile(8); majSemaine(appliquer(S, e)); }}>{tr("Échanger")}</Button>
              </li>
            ))}
          </ul>
          {etat === "depasse" && <Button variant="plate" size="lg" className="mt-2 w-full rounded-xl" onClick={ajusterSemaine}>{tr("Ajuster ma semaine au budget")}</Button>}
        </div>
      )}

      <details className="group mt-4">
        <summary className="flex cursor-pointer list-none items-center justify-between text-[13.5px] font-medium">
          {tr("Détail par rayon")}
          <span className="text-muted-foreground transition-transform group-open:rotate-180">▾</span>
        </summary>
        <ul className="mt-2 flex flex-col">
          {est.rayons.map((r) => (
            <li key={r.k} className="flex justify-between border-t border-border/60 py-1.5 text-[13.5px] first:border-t-0"><span>{r.n}</span><span className="num font-semibold">{euros(r.total)}</span></li>
          ))}
          {est.libres > 0 && <li className="flex justify-between border-t border-border/60 py-1.5 text-[13.5px]"><span>{tr("Mes articles")}</span><span className="num font-semibold">{euros(est.libres)}</span></li>}
        </ul>
        <p className="mt-2 text-[11.5px] leading-relaxed text-muted-foreground">{tr("Prix moyens en supermarché en France, marque distributeur. Touche le prix d'un article de la liste pour mettre celui de ton magasin.")}</p>
      </details>
    </section>
  );
}

/* Prix d'un aliment chez soi : on saisit le prix d'un paquet courant, l'app en tire le prix au kilo. */
function PrixAliment({ id, p, onClose, onChange }: { id: string | null; p: PrefsRepas; onClose: () => void; onChange: (id: string, kg: number | undefined) => void }) {
  const pack = id ? emballage(id) ?? 1000 : 1000;
  const actuel = id ? ((prixKg(id, p.prix) ?? 0) * pack) / 1000 : 0;
  const [t, setT] = useState("");
  const valeur = parseFloat(t.replace(",", "."));
  return (
    <Drawer open={!!id} onOpenChange={(o) => { if (!o) { setT(""); onClose(); } }}>
      <DrawerContent className="theme-repas">
        {id && (
          <div className="px-4 pb-[max(env(safe-area-inset-bottom),20px)]">
            <DrawerTitle className="mt-2 px-1 text-[21px] font-bold">{emojiDe(id)} {nomAliment(id)}</DrawerTitle>
            <DrawerDescription className="mt-1 px-1 text-[13.5px] text-muted-foreground">
              {tr("Prix moyen : environ {e} pour {q}.", { e: euros(((PRIX[id]?.[0] ?? 0) * pack) / 1000), q: quantite(id, pack, true) })}
            </DrawerDescription>
            <label className="mt-4 flex items-center gap-3 rounded-2xl bg-card px-4 py-3">
              <span className="flex-1 text-[14.5px]">{tr("Chez toi, pour {q}", { q: quantite(id, pack, true) })}</span>
              <input autoFocus inputMode="decimal" value={t} onChange={(e) => setT(e.target.value.replace(/[^\d.,]/g, ""))} placeholder={String(Math.round(actuel * 100) / 100).replace(".", ",")}
                aria-label={tr("Prix en euros")} className="num h-10 w-24 rounded-xl bg-muted px-3 text-right text-[16px] font-semibold outline-none focus:ring-2 focus:ring-plate" />
              <span className="text-[14px] text-muted-foreground">€</span>
            </label>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <Button variant="soft" size="lg" className="rounded-xl" disabled={p.prix?.[id] == null} onClick={() => { tactile(6); onChange(id, undefined); setT(""); onClose(); }}>{tr("Prix moyen")}</Button>
              <Button variant="plate" size="lg" className="rounded-xl" disabled={!(valeur > 0)} onClick={() => { tactile(8); onChange(id, Math.round((valeur / pack) * 1000 * 100) / 100); setT(""); onClose(); }}>{tr("Enregistrer")}</Button>
            </div>
          </div>
        )}
      </DrawerContent>
    </Drawer>
  );
}
/* « + Ajouter un article » : nom, quantité libre, emoji. */
function AjoutArticle({ onAjouter }: { onAjouter: (a: ArticleLibre) => void }) {
  const [ouvert, setOuvert] = useState(false);
  const [n, setN] = useState(""), [q, setQ] = useState(""), [e, setE] = useState("🛒"), [px, setPx] = useState("");
  if (!ouvert) return <button onClick={() => setOuvert(true)} className="flex w-full items-center gap-2 border-t border-border/60 px-4 py-3 text-left text-[14.5px] font-semibold text-plate-ink first:border-t-0"><PlusIcon className="size-4" weight="bold" />{tr("Ajouter un article")}</button>;
  const valider = () => {
    if (n.trim().length < 2) return;
    tactile(8);
    const prix = parseFloat(px.replace(",", "."));
    onAjouter({ id: "art:" + Date.now().toString(36), n: n.trim().slice(0, 40), q: q.trim().slice(0, 20), e, ...(prix > 0 ? { prix: Math.round(prix * 100) / 100 } : {}) });
    setN(""); setQ(""); setE("🛒"); setPx(""); setOuvert(false);
  };
  return (
    <div className="border-t border-border/60 p-3 first:border-t-0" role="group" aria-label={tr("Nouvel article")}>
      <div className="flex gap-2">
        <input value={n} onChange={(x) => setN(x.target.value)} onKeyDown={(x) => x.key === "Enter" && valider()} placeholder={tr("Article")} aria-label={tr("Article")} className="h-10 min-w-0 flex-1 rounded-xl bg-muted px-3 text-[15px] outline-none focus:ring-2 focus:ring-plate" />
        <input value={q} onChange={(x) => setQ(x.target.value)} onKeyDown={(x) => x.key === "Enter" && valider()} placeholder={tr("Quantité")} aria-label={tr("Quantité")} className="h-10 w-20 rounded-xl bg-muted px-3 text-[15px] outline-none focus:ring-2 focus:ring-plate" />
        <input value={px} inputMode="decimal" onChange={(x) => setPx(x.target.value.replace(/[^\d.,]/g, ""))} onKeyDown={(x) => x.key === "Enter" && valider()} placeholder={tr("Prix €")} aria-label={tr("Prix en euros (facultatif)")} className="h-10 w-20 rounded-xl bg-muted px-3 text-[15px] outline-none focus:ring-2 focus:ring-plate" />
      </div>
      <div className="mt-2 flex flex-wrap gap-1">
        {EMOJIS_RAYON.autre.concat(EMOJIS_RAYON.leg.slice(0, 4), EMOJIS_RAYON.fru.slice(0, 4)).map((x) => <button key={x} aria-pressed={e === x} aria-label={x} onClick={() => setE(x)} className={cn("grid size-9 place-items-center rounded-xl text-[19px]", e === x ? "bg-plate-soft ring-2 ring-plate" : "bg-muted")}>{x}</button>)}
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <Button variant="soft" size="sm" className="rounded-xl" onClick={() => setOuvert(false)}>{tr("Annuler")}</Button>
        <Button variant="plate" size="sm" className="rounded-xl" disabled={n.trim().length < 2} onClick={valider}>{tr("Ajouter")}</Button>
      </div>
    </div>
  );
}

function Compteur({ v, min, max, onChange, label }: { v: number; min: number; max: number; onChange: (v: number) => void; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <button aria-label={tr("{l} : moins", { l: label })} disabled={v <= min} onClick={() => onChange(v - 1)} className="grid size-8 place-items-center rounded-full bg-muted disabled:opacity-35"><MinusIcon className="size-3.5" weight="bold" /></button>
      <span className="num w-8 text-center text-[17px] font-bold">{v}</span>
      <button aria-label={tr("{l} : plus", { l: label })} disabled={v >= max} onClick={() => onChange(v + 1)} className="grid size-8 place-items-center rounded-full bg-muted disabled:opacity-35"><PlusIcon className="size-3.5" weight="bold" /></button>
    </span>
  );
}

export default function PageRepas() {
  return (
    <Suspense>
      <Repas />
    </Suspense>
  );
}
