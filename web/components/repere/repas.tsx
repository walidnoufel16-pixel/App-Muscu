"use client";

/* Partie Repas : préférences, besoins du jour, cartes et fiche de recette.
   La logique est dans lib/logic/repas.ts. */
import { langue, tr } from "@/lib/i18n";
import { useState } from "react";
import { ArrowsClockwiseIcon, BowlFoodIcon, CaretRightIcon, CheckIcon, ClockIcon, CookieIcon, HandPalmIcon, MinusIcon, PlusIcon, SunHorizonIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Drawer, DrawerContent, DrawerDescription, DrawerTitle } from "@/components/ui/drawer";
import type { Moment, Recette } from "@/lib/data/recettes";
import {
  ALLERGIES, allergenesDe, MATERIELS, macros, mains, nomAliment, nomRecette, NOM_CRENEAU, portion, prefsDe, quantite, regimeDe, REGIMES, TEMPS, type Besoins,
} from "@/lib/logic/repas";
import type { CreneauRepas, PrefsRepas } from "@/lib/logic/types";
import { useRepere } from "@/lib/store";
import { tactile } from "@/lib/repos";
import { cn } from "@/lib/utils";

const puce = (on: boolean) => cn("h-9 rounded-full border px-3.5 text-[13.5px] font-medium transition-colors", on ? "border-foreground bg-foreground text-background" : "border-border bg-card text-muted-foreground");
const EN = () => langue() === "en";

/* ---------------- préférences ---------------- */
export function FormPrefs({ p, onChange }: { p: PrefsRepas; onChange: (p: PrefsRepas) => void }) {
  const bascule = (l: string[], x: string) => (l.includes(x) ? l.filter((y) => y !== x) : [...l, x]);
  const evitables = ["poulet", "boeuf", "porc", "saumon", "thon", "crevettes", "oeuf", "tofu", "champignons", "poivron", "avocat", "lentilles", "pois_chiches", "fromage_blanc", "skyr", "whey"];
  return (
    <div className="flex flex-col gap-5">
      <Groupe titre={tr("1 · Ton régime")}>
        {REGIMES.map((n, i) => <button key={n} aria-pressed={p.regime === i} onClick={() => onChange({ ...p, regime: i })} className={puce(p.regime === i)}>{n}</button>)}
      </Groupe>
      <Groupe titre={tr("2 · Allergies ou intolérances")}>
        {ALLERGIES.map(([k, n]) => <button key={k} aria-pressed={p.allergies.includes(k)} onClick={() => onChange({ ...p, allergies: bascule(p.allergies, k) })} className={puce(p.allergies.includes(k))}>{n}</button>)}
      </Groupe>
      <Groupe titre={tr("3 · Ce que tu n'aimes pas")}>
        {evitables.map((id) => <button key={id} aria-pressed={p.exclus.includes(id)} onClick={() => onChange({ ...p, exclus: bascule(p.exclus, id) })} className={puce(p.exclus.includes(id))}>{nomAliment(id)}</button>)}
      </Groupe>
      <Groupe titre={tr("4 · Temps de cuisine en semaine")}>
        {TEMPS.map((n, i) => <button key={n} aria-pressed={p.temps === i} onClick={() => onChange({ ...p, temps: i })} className={puce(p.temps === i)}>{n}</button>)}
      </Groupe>
      <Groupe titre={tr("5 · Ton matériel")}>
        {MATERIELS.map(([k, n]) => <button key={k} aria-pressed={p.mat.includes(k)} onClick={() => onChange({ ...p, mat: bascule(p.mat, k) })} className={puce(p.mat.includes(k))}>{n}</button>)}
      </Groupe>
      <label className="flex items-center justify-between gap-3 rounded-2xl bg-card px-4 py-3 text-[14.5px]">
        <span>
          <span className="block font-medium">{tr("Afficher les calories")}</span>
          <span className="block text-[12.5px] text-muted-foreground">{tr("kcal, glucides et lipides en plus des protéines")}</span>
        </span>
        <input type="checkbox" checked={!!p.kcal} onChange={(e) => onChange({ ...p, kcal: e.target.checked })} className="size-5 accent-[var(--plate)]" />
      </label>
    </div>
  );
}
function Groupe({ titre, children }: { titre: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="eyebrow mb-2 px-1">{titre}</h2>
      <div className="flex flex-wrap gap-1.5">{children}</div>
    </section>
  );
}

/** Première ouverture : les 5 questions, puis la partie Repas. */
export function AccueilRepas() {
  const A = useRepere((s) => s.etat.A), muter = useRepere((s) => s.muter);
  const [p, setP] = useState(() => prefsDe(A));
  return (
    <div className="flex flex-col gap-5 px-4">
      <div className="rounded-[22px] bg-plate-soft p-4">
        <p className="text-[16px] font-semibold text-plate-ink">{tr("Des repas pensés pour ton entraînement")}</p>
        <p className="mt-1 text-[13.5px] leading-relaxed text-muted-foreground">{tr("Cinq réponses, et je te propose des recettes à ta portion, avec ou sans ce que tu as déjà, et la liste de courses qui va avec.")}</p>
      </div>
      <FormPrefs p={p} onChange={setP} />
      <Button variant="plate" size="xl" className="w-full" onClick={() => { tactile(10); muter((E) => { E.A.repas = { ...p, fait: true }; }); }}>{tr("C'est parti")}</Button>
      <Prudence />
    </div>
  );
}

export function Prudence() {
  return <p className="px-2 text-center text-[11.5px] leading-relaxed text-muted-foreground">{tr("Des repères généraux, pas un avis médical. En cas de pathologie, de grossesse ou de trouble alimentaire, parles-en à un médecin ou à un diététicien.")}</p>;
}

/* ---------------- besoins du jour ---------------- */
const CRENEAUX_JOUR: CreneauRepas[] = ["matin", "dejeuner", "diner", "collation"];
export function CarteBesoins({ b, kcal }: { b: Besoins; kcal: boolean }) {
  const fmt = (x: number) => String(x).replace(".", EN() ? "." : ",");
  return (
    <section className="rounded-[22px] bg-card p-4" aria-label={tr("Tes besoins du jour")}>
      <h2 className="text-[17px] font-bold">{tr("Tes besoins du jour")}</h2>
      <div className="mt-3 grid grid-cols-3 gap-2">
        <Chiffre v={b.p} u={tr("g")} n={tr("protéines")} accent />
        {kcal ? (
          <>
            <Chiffre v={b.kcal} u="" n={tr("kcal")} />
            <Chiffre v={b.g} u={tr("g")} n={tr("glucides · {l} g lipides", { l: b.l })} />
          </>
        ) : (
          <>
            <Chiffre v={4} u="" n={tr("repas, dont une collation")} />
            <Chiffre v={2} u="" n={tr("poings de légumes par repas")} />
          </>
        )}
      </div>
      <h3 className="eyebrow mt-4 mb-1.5 flex items-center gap-1.5"><HandPalmIcon className="size-3.5" weight="fill" />{tr("Dans ton assiette, à la main")}</h3>
      <table className="w-full text-[13.5px]">
        <thead>
          <tr className="text-[11px] leading-tight text-muted-foreground">
            <th className="pb-1.5 text-left font-medium" />
            <th className="pb-1.5 font-medium">{tr("Paumes de protéines")}</th>
            <th className="pb-1.5 font-medium">{tr("Poings de féculents")}</th>
            <th className="pb-1.5 font-medium">{tr("Pouces de gras")}</th>
          </tr>
        </thead>
        <tbody>
          {CRENEAUX_JOUR.map((c) => {
            const m = mains(b, c);
            return (
              <tr key={c} className="border-t border-border/60">
                <th scope="row" className="py-2 text-left font-medium">{NOM_CRENEAU[c]}</th>
                <td className="num text-center text-[16px] font-bold text-plate-ink">{fmt(m.paumes)}</td>
                <td className="num text-center text-[16px] font-bold">{fmt(m.poings)}</td>
                <td className="num text-center text-[16px] font-bold">{fmt(m.pouces)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <p className="mt-2 text-[12px] leading-relaxed text-muted-foreground">{b.seance ? tr("Jour de séance : un peu plus de féculents, surtout au repas d'avant et à la collation d'après.") : tr("Jour de repos : un peu moins de féculents, plus de légumes et de bonnes graisses.")}</p>
    </section>
  );
}
function Chiffre({ v, u, n, accent }: { v: number; u: string; n: string; accent?: boolean }) {
  return (
    <div className={cn("rounded-2xl p-3", accent ? "bg-plate-soft" : "bg-muted/60")}>
      <div className={cn("num text-[24px] leading-none font-bold", accent && "text-plate-ink")}>{v}<span className="text-[14px]">{u && " " + u}</span></div>
      <div className="mt-1 text-[11.5px] leading-snug text-muted-foreground">{n}</div>
    </div>
  );
}

/* ---------------- recettes ---------------- */
const ICONE: Record<Moment, typeof BowlFoodIcon> = { matin: SunHorizonIcon, repas: BowlFoodIcon, collation: CookieIcon };
const TEINTE: Record<Moment, string> = { matin: "from-amber-200 to-orange-300 dark:from-amber-700/60 dark:to-orange-800/60", repas: "from-emerald-200 to-teal-300 dark:from-emerald-700/60 dark:to-teal-800/60", collation: "from-rose-200 to-pink-300 dark:from-rose-700/60 dark:to-pink-800/60" };

/** Vignette d'une recette : sa photo, ou en attendant une pastille colorée selon le moment. */
export function VignetteRecette({ r, className }: { r: Recette; className?: string }) {
  const I = ICONE[r.m];
  // eslint-disable-next-line @next/next/no-img-element -- export statique : photo locale déjà optimisée (AVIF)
  if (r.img) return <img src={r.img} alt="" className={cn("object-cover", className)} />;
  return <span aria-hidden className={cn("grid place-items-center bg-gradient-to-br", TEINTE[r.m], className)}><I className="size-1/2 text-white/90" weight="fill" /></span>;
}

export function CarteRecette({ r, b, c, kcal, onOuvrir, droite, sous }: { r: Recette; b: Besoins; c?: CreneauRepas; kcal: boolean; onOuvrir: () => void; droite?: React.ReactNode; sous?: React.ReactNode }) {
  const f = portion(r, b, c), m = macros(r, f);
  return (
    <div className="flex items-center gap-3 rounded-[20px] bg-card p-2.5 pr-3">
      <button onClick={onOuvrir} className="flex min-w-0 flex-1 items-center gap-3 text-left active:opacity-80">
        <VignetteRecette r={r} className="size-16 shrink-0 rounded-[14px]" />
        <span className="min-w-0 flex-1">
          {c && <span className="eyebrow block">{NOM_CRENEAU[c]}</span>}
          <span className="block truncate text-[15.5px] leading-tight font-semibold">{nomRecette(r)}</span>
          <span className="mt-1 flex items-center gap-2 text-[12.5px] text-muted-foreground">
            <span className="flex items-center gap-1"><ClockIcon className="size-3.5" />{tr("{n} min", { n: r.min })}</span>
            <span className="font-semibold text-plate-ink">{tr("{p} g de protéines", { p: m.p })}</span>
            {kcal && <span>{m.kcal}{" "}{tr("kcal")}</span>}
          </span>
          {sous}
        </span>
      </button>
      {droite ?? <CaretRightIcon className="size-4 shrink-0 text-muted-foreground" />}
    </div>
  );
}

/** Fiche d'une recette, à la portion de la personne ; le nombre de personnes se règle. */
export function FicheRecette({ r, b, c, kcal, pers0 = 1, onClose }: { r: Recette | null; b: Besoins; c?: CreneauRepas; kcal: boolean; pers0?: number; onClose: () => void }) {
  return (
    <Drawer open={!!r} onOpenChange={(o) => !o && onClose()}>
      <DrawerContent className="max-h-[94dvh]">{r && <Fiche key={r.id} r={r} b={b} c={c} kcal={kcal} pers0={pers0} />}</DrawerContent>
    </Drawer>
  );
}
function Fiche({ r, b, c, kcal, pers0 }: { r: Recette; b: Besoins; c?: CreneauRepas; kcal: boolean; pers0: number }) {
  const [pers, setPers] = useState(pers0);
  const f = portion(r, b, c), m = macros(r, f);
  const reg = regimeDe(r), alg = allergenesDe(r);
  return (
    <div className="overflow-y-auto overscroll-contain px-4 pb-[max(env(safe-area-inset-bottom),20px)]">
      <VignetteRecette r={r} className="mt-2 h-40 w-full rounded-[22px]" />
      <DrawerTitle className="mt-3 px-1 text-[23px] leading-tight font-bold tracking-[-0.01em]">{nomRecette(r)}</DrawerTitle>
      <DrawerDescription className="mt-1 px-1 text-[13.5px] text-muted-foreground">
        {tr("{n} min", { n: r.min })} · {reg > 0 ? REGIMES[reg] : tr("Avec viande")}{alg.length ? " · " + tr("Contient : {l}", { l: alg.map((k) => ALLERGIES.find((x) => x[0] === k)![1].toLowerCase()).join(", ") }) : ""}
      </DrawerDescription>
      <div className="mt-3 grid grid-cols-4 gap-1.5 text-center">
        <Macro v={m.p} n={tr("protéines")} accent />
        {kcal ? <><Macro v={m.g} n={tr("glucides")} /><Macro v={m.l} n={tr("lipides")} /><Macro v={m.kcal} n={tr("kcal")} u="" /></> : <span className="col-span-3 self-center px-2 text-left text-[12.5px] leading-snug text-muted-foreground">{tr("Pour une portion à ta mesure (×{f} la recette de base).", { f: String(f).replace(".", EN() ? "." : ",") })}</span>}
      </div>
      <div className="mt-5 flex items-center justify-between px-1">
        <h3 className="text-[17px] font-bold">{tr("Ingrédients")}</h3>
        <span className="flex items-center gap-1.5">
          <button aria-label={tr("Une personne de moins")} disabled={pers <= 1} onClick={() => setPers(pers - 1)} className="grid size-8 place-items-center rounded-full bg-muted disabled:opacity-35"><MinusIcon className="size-3.5" weight="bold" /></button>
          <span className="w-20 text-center text-[13.5px] font-medium">{tr(pers > 1 ? "{n} personnes" : "{n} personne", { n: pers })}</span>
          <button aria-label={tr("Une personne de plus")} disabled={pers >= 8} onClick={() => setPers(pers + 1)} className="grid size-8 place-items-center rounded-full bg-muted disabled:opacity-35"><PlusIcon className="size-3.5" weight="bold" /></button>
        </span>
      </div>
      <ul className="mt-2 overflow-hidden rounded-[18px] bg-card" aria-label={tr("Ingrédients")}>
        {r.ing.map(([id, g]) => (
          <li key={id} className="flex items-baseline justify-between gap-3 border-t border-border/60 px-4 py-2.5 text-[14.5px] first:border-t-0">
            <span>{nomAliment(id)}</span>
            <span className="num shrink-0 font-semibold">{quantite(id, g * f * pers)}</span>
          </li>
        ))}
      </ul>
      <h3 className="mt-5 px-1 text-[17px] font-bold">{tr("Préparation")}</h3>
      <ol className="mt-2 flex flex-col gap-2">
        {(EN() ? r.ee : r.e).map((t, i) => (
          <li key={i} className="flex gap-3 rounded-[18px] bg-card p-3.5 text-[14.5px] leading-relaxed">
            <span className="num text-[20px] leading-none font-bold text-plate-ink">{i + 1}</span>
            <span>{t}</span>
          </li>
        ))}
      </ol>
      <div className="mt-4 rounded-[18px] bg-plate-soft p-3.5">
        <p className="text-[12px] font-semibold tracking-[0.08em] text-plate-ink uppercase">{tr("Le mot du nutritionniste")}</p>
        <p className="mt-1 text-[14px] leading-relaxed">{EN() ? r.noteEn : r.note}</p>
      </div>
    </div>
  );
}
function Macro({ v, n, u, accent }: { v: number; n: string; u?: string; accent?: boolean }) {
  return (
    <div className={cn("rounded-2xl py-2.5", accent ? "bg-plate-soft" : "bg-card")}>
      <div className={cn("num text-[20px] leading-none font-bold", accent && "text-plate-ink")}>{v}<span className="text-[12px]">{u ?? " g"}</span></div>
      <div className="mt-1 text-[11px] text-muted-foreground">{n}</div>
    </div>
  );
}

/** Bouton « une autre » des suggestions et de la semaine. */
export function BoutonAutre({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button onClick={() => { tactile(6); onClick(); }} aria-label={label} className="grid size-10 shrink-0 place-items-center rounded-full bg-muted text-muted-foreground active:scale-90">
      <ArrowsClockwiseIcon className="size-[18px]" weight="bold" />
    </button>
  );
}

/** Case à cocher ronde de la liste de courses. */
export function Coche({ on }: { on: boolean }) {
  return <span className={cn("grid size-6 shrink-0 place-items-center rounded-full border-2", on ? "border-plate bg-plate text-plate-foreground" : "border-border")}>{on && <CheckIcon className="size-3.5" weight="bold" />}</span>;
}

