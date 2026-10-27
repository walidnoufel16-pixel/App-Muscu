"use client";

/* Repas : aujourd'hui (besoins, suggestions), recettes (toutes, ou avec ce que j'ai),
   courses (semaine de repas et liste). Première ouverture : cinq questions. */
import { tr } from "@/lib/i18n";
import { Suspense, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { MinusIcon, PlusIcon, ShareNetworkIcon } from "@phosphor-icons/react";
import { toast } from "sonner";
import { ChoixLangue } from "@/components/repere/choix-langue";
import { EnTete } from "@/components/repere/en-tete";
import { Segmente } from "@/components/repere/segmente";
import { CarteProteines } from "@/components/repere/proteines";
import { AccueilRepas, BoutonAutre, resumePrefs, CarteBesoins, CarteRecette, Coche, FicheRecette, FormPrefs, Prudence } from "@/components/repere/repas";
import { Button } from "@/components/ui/button";
import { Drawer, DrawerContent, DrawerDescription, DrawerTitle } from "@/components/ui/drawer";
import type { Recette } from "@/lib/data/recettes";
import { jourDe } from "@/lib/logic/historique";
import {
  alimentsParRayon, autreRecette, avecCeQueJai, besoins, CRENEAUX, listeCourses, nomAliment, NOM_CRENEAU, planSemaine, prefsDe, R, recettesPour, semaineParDefaut, suggestions, texteCourses,
} from "@/lib/logic/repas";
import type { CreneauRepas, PrefsRepas, SemaineRepas } from "@/lib/logic/types";
import { useRepere } from "@/lib/store";
import { useVueRepas, type VueRepas } from "@/lib/nav";
import { tactile } from "@/lib/repos";
import { cn } from "@/lib/utils";

const puce = (on: boolean) => cn("h-8 shrink-0 rounded-full border px-3 text-[13px] font-medium transition-colors", on ? "border-foreground bg-foreground text-background" : "border-border bg-card text-muted-foreground");

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
  /* le questionnaire, rouvert depuis la carte « Mes préférences » ou depuis Profil (?prefs=1) */
  const [brouillon, setBrouillon] = useState<PrefsRepas | null>(() => (params.get("prefs") && p.fait ? p : null));
  const majPrefs = (q: PrefsRepas) => muter((E) => { E.A.repas = { ...q, fait: true }; });

  return (
    <>
      <EnTete
        surtitre={tr("Nutrition")} titre={tr("Repas")}
        actions={<ChoixLangue />}
      />
      {!p.fait ? <AccueilRepas /> : (
        <div className="flex flex-col gap-3 px-4">
          <Segmente label={tr("Rubrique repas")} valeur={vue} onChange={(v: VueRepas) => useVueRepas.setState({ vue: v })} options={[{ v: "jour", n: tr("Aujourd'hui") }, { v: "recettes", n: tr("Recettes") }, { v: "courses", n: tr("Courses") }]} />
          <section className="flex items-center gap-3 rounded-[18px] bg-card px-4 py-3" aria-label={tr("Mes préférences")}>
            <span className="min-w-0 flex-1">
              <span className="block text-[14.5px] font-semibold">{tr("Mes préférences")}</span>
              <span className="block truncate text-[12.5px] text-muted-foreground">{resumePrefs(p)}</span>
            </span>
            <Button variant="soft" size="sm" className="rounded-full" onClick={() => { tactile(6); setBrouillon(p); }}>{tr("Modifier")}</Button>
          </section>
          {vue === "jour" && <Jour p={p} seance={seance} setSeance={setSeance} b={b} kcal={kcal} auj={auj} ouvrir={(r, c) => setFiche({ r, c })} />}
          {vue === "recettes" && <Recettes p={p} b={b} kcal={kcal} majPrefs={majPrefs} ouvrir={(r) => setFiche({ r })} />}
          {vue === "courses" && <Courses p={p} b={b} kcal={kcal} ouvrir={(r, c) => setFiche({ r, c })} />}
          <Prudence />
        </div>
      )}
      <FicheRecette r={fiche?.r ?? null} c={fiche?.c} b={b} kcal={kcal} pers0={vue === "courses" ? p.pers ?? 1 : 1} onClose={() => setFiche(null)} />
      <Drawer open={!!brouillon} onOpenChange={(o) => !o && setBrouillon(null)}>
        <DrawerContent className="max-h-[92dvh]">
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
    </>
  );
}

/* ---------------- aujourd'hui ---------------- */
function Jour({ p, seance, setSeance, b, kcal, auj, ouvrir }: { p: PrefsRepas; seance: boolean; setSeance: (s: boolean) => void; b: ReturnType<typeof besoins>; kcal: boolean; auj: string; ouvrir: (r: Recette, c: CreneauRepas) => void }) {
  const [decal, setDecal] = useState<Partial<Record<CreneauRepas, number>>>({});
  const s = suggestions(p, auj, seance, decal);
  return (
    <>
      <Segmente label={tr("Type de journée")} valeur={seance ? 1 : 0} onChange={(v) => setSeance(v === 1)} options={[{ v: 1, n: tr("Jour de séance") }, { v: 0, n: tr("Jour de repos") }]} />
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
type Filtre = "tout" | "matin" | "repas" | "collation" | "rapide" | "batch" | "budget" | "post" | "dessert";
function Recettes({ p, b, kcal, majPrefs, ouvrir }: { p: PrefsRepas; b: ReturnType<typeof besoins>; kcal: boolean; majPrefs: (p: PrefsRepas) => void; ouvrir: (r: Recette) => void }) {
  const [mode, setMode] = useState<"toutes" | "stock">("toutes");
  const [f, setF] = useState<Filtre>("tout");
  const FILTRES: [Filtre, string][] = [["tout", tr("Tout")], ["matin", tr("Petit-déjeuner")], ["repas", tr("Plats")], ["collation", tr("Collations")], ["rapide", tr("Rapide")], ["batch", tr("Batch cooking")], ["budget", tr("Petit budget")], ["post", tr("Après la séance")], ["dessert", tr("Desserts")]];
  const liste = recettesPour(p).filter((r) => f === "tout" || r.m === f || r.t.includes(f as never));
  const stock = useMemo(() => p.stock ?? [], [p.stock]);
  const corr = useMemo(() => avecCeQueJai(p, stock), [p, stock]);
  return (
    <>
      <Segmente label={tr("Recettes")} valeur={mode} onChange={setMode} options={[{ v: "toutes", n: tr("Toutes") }, { v: "stock", n: tr("Avec ce que j'ai") }]} />
      {mode === "toutes" ? (
        <>
          <div className="no-scrollbar -mx-4 flex gap-1.5 overflow-x-auto px-4">
            {FILTRES.map(([k, n]) => <button key={k} aria-pressed={f === k} onClick={() => setF(k)} className={puce(f === k)}>{n}</button>)}
          </div>
          <p className="px-1 text-[12.5px] text-muted-foreground">{tr(liste.length > 1 ? "{n} recettes pour toi" : "{n} recette pour toi", { n: liste.length })}</p>
          <div className="flex flex-col gap-2">{liste.map((r) => <CarteRecette key={r.id} r={r} b={b} kcal={kcal} onOuvrir={() => ouvrir(r)} />)}</div>
        </>
      ) : (
        <>
          <p className="px-1 text-[13.5px] text-muted-foreground">{tr("Touche ce que tu as dans ton frigo et tes placards : sel, huile et épices sont comptés d'office.")}</p>
          {alimentsParRayon().map((ray) => (
            <section key={ray.k}>
              <h3 className="eyebrow mb-1.5 px-1">{tr(ray.n)}</h3>
              <div className="flex flex-wrap gap-1.5">
                {ray.l.map((id) => {
                  const on = stock.includes(id);
                  return <button key={id} aria-pressed={on} onClick={() => { tactile(4); majPrefs({ ...p, stock: on ? stock.filter((x) => x !== id) : [...stock, id] }); }} className={puce(on)}>{nomAliment(id)}</button>;
                })}
              </div>
            </section>
          ))}
          {stock.length > 0 && <button onClick={() => majPrefs({ ...p, stock: [] })} className="self-start px-1 text-[13px] font-medium text-muted-foreground">{tr("Tout décocher")}</button>}
          <h2 className="mt-2 px-1 text-[19px] font-bold">{tr("Ce que tu peux cuisiner")}</h2>
          {!stock.length ? <p className="px-1 text-[13.5px] text-muted-foreground">{tr("Coche au moins un aliment.")}</p> : (
            <div className="flex flex-col gap-2">
              {corr.slice(0, 15).map(({ r, manque }) => (
                <CarteRecette key={r.id} r={r} b={b} kcal={kcal} onOuvrir={() => ouvrir(r)}
                  sous={<span className={cn("mt-1 block truncate text-[12.5px] font-medium", manque.length ? "text-muted-foreground" : "text-success")}>{manque.length ? tr("Il te manque : {l}", { l: manque.map((id) => nomAliment(id).toLowerCase()).join(", ") }) : tr("Tu as tout")}</span>}
                />
              ))}
            </div>
          )}
        </>
      )}
    </>
  );
}

/* ---------------- courses ---------------- */
const JOURS = [tr("Lundi"), tr("Mardi"), tr("Mercredi"), tr("Jeudi"), tr("Vendredi"), tr("Samedi"), tr("Dimanche")];
function Courses({ p, b, kcal, ouvrir }: { p: PrefsRepas; b: ReturnType<typeof besoins>; kcal: boolean; ouvrir: (r: Recette, c: CreneauRepas) => void }) {
  const A = useRepere((s) => s.etat.A), muter = useRepere((s) => s.muter);
  const S: SemaineRepas = { ...semaineParDefaut(), ...(A.semaine || {}) };
  const maj = (f: (s: SemaineRepas) => SemaineRepas) => muter((E) => { E.A.semaine = f({ ...semaineParDefaut(), ...(E.A.semaine || {}) }); });
  const cases = planSemaine(p, S), pers = p.pers ?? 1;
  const liste = listeCourses(cases, b, pers, p.stock ?? []);
  const nbArticles = liste.reduce((n, r) => n + r.l.length, 0), restants = liste.reduce((n, r) => n + r.l.filter((x) => !S.coches.includes(x.id)).length, 0);
  const partager = async () => {
    const texte = tr("Liste de courses Repère") + "\n\n" + texteCourses(liste, S.coches);
    tactile(8);
    try {
      if (navigator.share) await navigator.share({ title: tr("Liste de courses"), text: texte });
      else { await navigator.clipboard.writeText(texte); toast(tr("Liste copiée")); }
    } catch {}
  };
  return (
    <>
      <section className="rounded-[22px] bg-card p-4" aria-label={tr("Ma semaine de repas")}>
        <h2 className="text-[17px] font-bold">{tr("Ma semaine de repas")}</h2>
        <div className="mt-3 flex items-center justify-between gap-3">
          <span className="text-[14px]">{tr("Nombre de jours")}</span>
          <Compteur v={S.jours} min={1} max={7} onChange={(v) => maj((s) => ({ ...s, jours: v, choix: {} }))} label={tr("jours")} />
        </div>
        <div className="mt-2 flex items-center justify-between gap-3">
          <span className="text-[14px]">{tr("Personnes")}</span>
          <Compteur v={pers} min={1} max={8} onChange={(v) => muter((E) => { E.A.repas = { ...prefsDe(E.A), pers: v }; })} label={tr("personnes")} />
        </div>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {CRENEAUX.map((c) => {
            const on = S.creneaux.includes(c);
            return <button key={c} aria-pressed={on} onClick={() => maj((s) => ({ ...s, creneaux: on ? s.creneaux.filter((x) => x !== c) : CRENEAUX.filter((x) => x === c || s.creneaux.includes(x)), choix: {} }))} className={puce(on)}>{NOM_CRENEAU[c]}</button>;
          })}
        </div>
        <Button variant="soft" size="lg" className="mt-3 w-full rounded-xl" onClick={() => { tactile(8); maj((s) => ({ ...s, graine: s.graine + 1, choix: {}, coches: [] })); }}>{tr("Proposer une autre semaine")}</Button>
      </section>

      {Array.from({ length: S.jours }, (_, j) => {
        const du = cases.filter((k) => k.jour === j);
        if (!du.length) return null;
        return (
          <section key={j} aria-label={JOURS[j]}>
            <h3 className="eyebrow mb-1.5 px-1">{JOURS[j]}</h3>
            <div className="flex flex-col gap-1.5">
              {du.map((k) => (
                <CarteRecette key={k.c} r={k.r} c={k.c} b={b} kcal={kcal} onOuvrir={() => ouvrir(k.r, k.c)}
                  sous={k.reste ? <span className="mt-1 block text-[12.5px] font-medium text-plate-ink">{tr("Les restes du dîner d'hier")}</span> : undefined}
                  droite={k.reste ? <span className="size-10" /> : <BoutonAutre label={tr("Changer : {j}, {c}", { j: JOURS[j], c: NOM_CRENEAU[k.c] })} onClick={() => maj((s) => ({ ...s, choix: { ...s.choix, [`${j}|${k.c}`]: autreRecette(p, cases, k).id } }))} />}
                />
              ))}
            </div>
          </section>
        );
      })}

      <section className="mt-2" aria-label={tr("Liste de courses")}>
        <div className="mb-2 flex items-baseline justify-between px-1">
          <h2 className="text-[19px] font-bold">{tr("Liste de courses")}</h2>
          <span className="text-[12.5px] text-muted-foreground">{tr("{n} sur {t} à prendre", { n: restants, t: nbArticles })}</span>
        </div>
        {(p.stock?.length ?? 0) > 0 && <p className="mb-2 px-1 text-[12.5px] text-muted-foreground">{tr("Sans ce que tu as déjà coché dans « Avec ce que j'ai ».")}</p>}
        <div className="flex flex-col gap-3">
          {liste.map((ray) => (
            <div key={ray.k} className="overflow-hidden rounded-[20px] bg-card">
              <h3 className="eyebrow px-4 pt-3 pb-1">{ray.n}</h3>
              {ray.l.map((x) => {
                const on = S.coches.includes(x.id);
                return (
                  <button key={x.id} aria-pressed={on} onClick={() => { tactile(5); maj((s) => ({ ...s, coches: on ? s.coches.filter((y) => y !== x.id) : [...s.coches, x.id] })); }}
                    className="flex w-full items-center gap-3 border-t border-border/60 px-4 py-2.5 text-left first:border-t-0">
                    <Coche on={on} />
                    <span className={cn("flex-1 text-[14.5px]", on && "text-muted-foreground line-through")}>{nomAliment(x.id)}</span>
                    <span className={cn("num shrink-0 text-[14px] font-semibold", on && "text-muted-foreground")}>{x.texte}</span>
                  </button>
                );
              })}
            </div>
          ))}
        </div>
        <Button variant="plate" size="lg" className="mt-3 w-full rounded-xl" onClick={partager}><ShareNetworkIcon weight="bold" />{tr("Partager la liste")}</Button>
      </section>
    </>
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
