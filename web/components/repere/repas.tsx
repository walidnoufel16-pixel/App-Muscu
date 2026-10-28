"use client";

/* Partie Repas : préférences, besoins du jour, cartes et fiche de recette.
   La logique est dans lib/logic/repas.ts. */
import { langue, tr } from "@/lib/i18n";
import { useState } from "react";
import { MagnifyingGlassIcon } from "@phosphor-icons/react";
import { ArrowsClockwiseIcon, BowlFoodIcon, CaretDownIcon, CaretRightIcon, CheckIcon, ClockIcon, CookieIcon, HandPalmIcon, MinusIcon, PlusIcon, SunHorizonIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Drawer, DrawerContent, DrawerDescription, DrawerTitle } from "@/components/ui/drawer";
import type { Moment, Recette } from "@/lib/data/recettes";
import {
  ALLERGIES, alimentsParRayon, allergenesDe, chercherAliments, CULTES, EMOJIS_RAYON, estPerso, MATERIELS, nouvelAliment, macros, mains, nomAliment, nomRecette, NOM_CRENEAU, portion, prefsDe, quantite, regimeDe, REGIMES, TEMPS, type Besoins,
} from "@/lib/logic/repas";
import type { AlimentPerso, CreneauRepas, PrefsRepas } from "@/lib/logic/types";
import { emojiDe, RAYONS } from "@/lib/data/aliments";
import { useRepere } from "@/lib/store";
import { auteurRecette, imgRecette } from "@/lib/medias";
import { coutRecette, euros } from "@/lib/logic/budget";
import { tactile } from "@/lib/repos";
import { cn } from "@/lib/utils";

const puce = (on: boolean) => cn("h-9 rounded-full border px-3.5 text-[13.5px] font-medium transition-colors", on ? "border-foreground bg-foreground text-background" : "border-border bg-card text-muted-foreground");
const EN = () => langue() === "en";

/* ---------------- préférences ---------------- */
export function FormPrefs({ p, onChange }: { p: PrefsRepas; onChange: (p: PrefsRepas) => void }) {
  const bascule = (l: string[], x: string) => (l.includes(x) ? l.filter((y) => y !== x) : [...l, x]);
  const liste = (l: string[], vide: string) => (l.length ? l.join(", ") : vide);
  const nomAllergie = (k: string) => ALLERGIES.find((x) => x[0] === k)?.[1] ?? k;
  const nomMat = (k: string) => MATERIELS.find((x) => x[0] === k)?.[1] ?? k;
  return (
    <div className="flex flex-col gap-2">
      <Groupe titre={tr("1 · Ton régime")} resume={REGIMES[p.regime]}>
        {REGIMES.map((n, i) => <button key={n} aria-pressed={p.regime === i} onClick={() => onChange({ ...p, regime: i })} className={puce(p.regime === i)}>{n}</button>)}
      </Groupe>
      <Groupe titre={tr("2 · Halal ou casher")} resume={CULTES[p.culte ?? 0]}>
        {CULTES.map((n, i) => <button key={n} aria-pressed={(p.culte ?? 0) === i} onClick={() => onChange({ ...p, culte: i })} className={puce((p.culte ?? 0) === i)}>{n}</button>)}
        {(p.culte ?? 0) > 0 && <p className="mt-1 w-full text-[12.5px] leading-relaxed text-muted-foreground">{p.culte === 1 ? tr("Sans porc. Pour la viande, choisis-la certifiée halal.") : tr("Sans porc ni fruits de mer, et jamais viande et laitage dans le même plat. Pour la viande, choisis-la certifiée casher.")}</p>}
      </Groupe>
      <Groupe titre={tr("3 · Allergies ou intolérances")} resume={liste(p.allergies.map(nomAllergie), tr("Aucune"))}>
        {ALLERGIES.map(([k, n]) => <button key={k} aria-pressed={p.allergies.includes(k)} onClick={() => onChange({ ...p, allergies: bascule(p.allergies, k) })} className={puce(p.allergies.includes(k))}>{n}</button>)}
      </Groupe>
      <Groupe titre={tr("4 · Ce que tu n'aimes pas")} resume={liste(p.exclus.map(nomAliment), tr("Rien"))}>
        <ChoixAliments replie choisis={p.exclus} perso={p.perso ?? []}
          onBasculer={(id) => onChange({ ...p, exclus: bascule(p.exclus, id) })}
          onAjouter={(a) => onChange({ ...p, perso: [...(p.perso ?? []), a], exclus: [...p.exclus, a.id] })}
        />
      </Groupe>
      <Groupe titre={tr("5 · Temps de cuisine en semaine")} resume={TEMPS[p.temps ?? 2]}>
        {TEMPS.map((n, i) => <button key={n} aria-pressed={p.temps === i} onClick={() => onChange({ ...p, temps: i })} className={puce(p.temps === i)}>{n}</button>)}
      </Groupe>
      <Groupe titre={tr("6 · Ton matériel")} resume={liste(p.mat.map(nomMat), tr("Aucun"))}>
        {MATERIELS.map(([k, n]) => <button key={k} aria-pressed={p.mat.includes(k)} onClick={() => onChange({ ...p, mat: bascule(p.mat, k) })} className={puce(p.mat.includes(k))}>{n}</button>)}
      </Groupe>
      <Groupe titre={tr("7 · Ton budget courses")} resume={p.budget ? tr("{e} par semaine", { e: euros(p.budget) }) : tr("Pas de budget")}>
        <button aria-pressed={!p.budget} onClick={() => onChange({ ...p, budget: undefined })} className={puce(!p.budget)}>{tr("Pas de budget")}</button>
        {[30, 50, 70, 100].map((x) => <button key={x} aria-pressed={p.budget === x} onClick={() => onChange({ ...p, budget: x })} className={puce(p.budget === x)}>{euros(x)}</button>)}
        <ChampBudget v={p.budget} onChange={(budget) => onChange({ ...p, budget })} />
        <p className="mt-1 w-full text-[12.5px] leading-relaxed text-muted-foreground">{tr("Pour la liste de courses de la semaine. L'app estime ce qu'elle coûte et te propose des recettes moins chères si tu dépasses.")}</p>
      </Groupe>
      <label className="mt-2 flex items-center justify-between gap-3 rounded-2xl bg-card px-4 py-3 text-[14.5px]">
        <span>
          <span className="block font-medium">{tr("Afficher les calories")}</span>
          <span className="block text-[12.5px] text-muted-foreground">{tr("kcal, glucides et lipides en plus des protéines")}</span>
        </span>
        <input type="checkbox" checked={!!p.kcal} onChange={(e) => onChange({ ...p, kcal: e.target.checked })} className="size-5 accent-[var(--plate)]" />
      </label>
    </div>
  );
}
/* Une question repliable : le titre, la réponse résumée, et les choix une fois ouverte.
   Chacune s'ouvre et se ferme librement. */
function Groupe({ titre, resume, children }: { titre: string; resume: string; children: React.ReactNode }) {
  const [ouvert, setOuvert] = useState(false);
  return (
    <section className="overflow-hidden rounded-[18px] bg-card" aria-label={titre}>
      <button onClick={() => { tactile(4); setOuvert((o) => !o); }} aria-expanded={ouvert} className="flex w-full items-center gap-3 px-4 py-3.5 text-left">
        <span className="min-w-0 flex-1">
          <span className="block text-[15px] font-semibold">{titre}</span>
          <span className="block truncate text-[13px] text-muted-foreground">{resume}</span>
        </span>
        <CaretDownIcon className={cn("size-4 shrink-0 text-muted-foreground transition-transform duration-200", ouvert && "rotate-180")} />
      </button>
      {ouvert && <div className="flex flex-wrap gap-1.5 px-4 pb-4">{children}</div>}
    </section>
  );
}

/* Choix d'aliments : une loupe, les rayons (repliables ou non), chaque aliment avec son emoji,
   et l'ajout d'un aliment qui manque (gardé dans les préférences, badge « perso »). */
export function ChoixAliments({ choisis, perso, onBasculer, onAjouter, replie = false }: { choisis: string[]; perso: AlimentPerso[]; onBasculer: (id: string) => void; onAjouter: (a: AlimentPerso) => void; replie?: boolean }) {
  const [q, setQ] = useState("");
  const [ajout, setAjout] = useState(false);
  const pastille = (id: string) => (
    <button key={id} aria-pressed={choisis.includes(id)} onClick={() => { tactile(4); onBasculer(id); }} className={cn(puce(choisis.includes(id)), "inline-flex items-center gap-1.5")}>
      <span aria-hidden>{emojiDe(id)}</span>{nomAliment(id)}
      {estPerso(id) && <span className="rounded-full bg-plate-soft px-1.5 text-[10.5px] font-semibold text-plate-ink">{tr("perso")}</span>}
    </button>
  );
  const trouves = chercherAliments(q, perso);
  return (
    <div className="flex w-full flex-col gap-2">
      <div className="relative">
        <MagnifyingGlassIcon className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={tr("Rechercher un aliment…")} aria-label={tr("Rechercher un aliment…")} className="h-10 w-full rounded-xl bg-muted pr-3 pl-9 text-[14.5px] outline-none focus:ring-2 focus:ring-plate" />
      </div>
      {q.trim() ? (
        <div className="flex flex-wrap gap-1.5">
          {trouves.map(pastille)}
          {!trouves.length && <p className="px-1 text-[13px] text-muted-foreground">{tr("Rien trouvé : ajoute-le ci-dessous.")}</p>}
        </div>
      ) : alimentsParRayon(perso).map((ray) => replie ? (
        <SousGroupe key={ray.k} titre={EN() ? ray.en : ray.n} n={ray.l.filter((id) => choisis.includes(id)).length}>{ray.l.map(pastille)}</SousGroupe>
      ) : (
        <section key={ray.k}>
          <h3 className="eyebrow mb-1.5 px-1">{EN() ? ray.en : ray.n}</h3>
          <div className="flex flex-wrap gap-1.5">{ray.l.map(pastille)}</div>
        </section>
      ))}
      {ajout ? <FormAliment nom0={q} existants={perso} onAnnuler={() => setAjout(false)} onValider={(a) => { onAjouter(a); setAjout(false); setQ(""); }} />
        : <button onClick={() => setAjout(true)} className="flex items-center gap-1.5 self-start rounded-full px-2 py-1.5 text-[14px] font-semibold text-plate-ink"><PlusIcon className="size-4" weight="bold" />{tr("Ajouter un aliment")}</button>}
    </div>
  );
}

/* Petit formulaire : nom, rayon, emoji. */
function FormAliment({ nom0, existants, onValider, onAnnuler }: { nom0: string; existants: AlimentPerso[]; onValider: (a: AlimentPerso) => void; onAnnuler: () => void }) {
  const [n, setN] = useState(nom0);
  const [ray, setRay] = useState("leg");
  const [e, setE] = useState(EMOJIS_RAYON.leg[0]);
  const rayons = RAYONS.filter((x) => x.k !== "base");
  return (
    <div className="rounded-[16px] border border-plate/40 bg-card p-3" role="group" aria-label={tr("Nouvel aliment")}>
      <input value={n} onChange={(x) => setN(x.target.value)} placeholder={tr("Nom de l'aliment")} aria-label={tr("Nom de l'aliment")} maxLength={40} className="h-10 w-full rounded-xl bg-muted px-3 text-[15px] outline-none focus:ring-2 focus:ring-plate" />
      <div className="mt-2 flex flex-wrap gap-1.5">
        {rayons.map((x) => <button key={x.k} aria-pressed={ray === x.k} onClick={() => { setRay(x.k); setE(EMOJIS_RAYON[x.k][0]); }} className={cn(puce(ray === x.k), "h-8 px-3 text-[12.5px]")}>{EN() ? x.en : x.n}</button>)}
      </div>
      <div className="mt-2 flex flex-wrap gap-1">
        {EMOJIS_RAYON[ray].map((x) => <button key={x} aria-pressed={e === x} aria-label={x} onClick={() => setE(x)} className={cn("grid size-9 place-items-center rounded-xl text-[19px]", e === x ? "bg-plate-soft ring-2 ring-plate" : "bg-muted")}>{x}</button>)}
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <Button variant="soft" size="sm" className="rounded-xl" onClick={onAnnuler}>{tr("Annuler")}</Button>
        <Button variant="plate" size="sm" className="rounded-xl" disabled={n.trim().length < 2} onClick={() => onValider(nouvelAliment(n, ray, e, existants))}>{tr("Ajouter")}</Button>
      </div>
    </div>
  );
}

/** Budget de la semaine saisi à la main, en euros (vide : pas de budget). */
export function ChampBudget({ v, onChange, className }: { v?: number; onChange: (v: number | undefined) => void; className?: string }) {
  const [t, setT] = useState(v ? String(v) : "");
  const valider = () => { const x = Math.round(parseFloat(t.replace(",", "."))); onChange(x > 0 ? Math.min(x, 2000) : undefined); };
  return (
    <span className={cn("flex h-9 items-center gap-1.5 rounded-full border border-border bg-card pr-3 pl-1", className)}>
      <input inputMode="numeric" value={t} onChange={(e) => setT(e.target.value.replace(/[^\d.,]/g, ""))} onBlur={valider} onKeyDown={(e) => e.key === "Enter" && (e.currentTarget as HTMLInputElement).blur()}
        onFocus={(e) => { const el = e.currentTarget; setTimeout(() => el.scrollIntoView({ block: "center", behavior: "smooth" }), 350); }}
        placeholder={tr("Autre")} aria-label={tr("Budget en euros par semaine")} className="num h-7 w-16 rounded-full bg-muted px-2.5 text-center text-[14px] font-semibold outline-none focus:ring-2 focus:ring-plate" />
      <span className="text-[13px] text-muted-foreground">{tr("€ / semaine")}</span>
    </span>
  );
}

/* Sous-catégorie de « Ce que tu n'aimes pas » (légumes, fruits…), repliable elle aussi. */
function SousGroupe({ titre, n, children }: { titre: string; n: number; children: React.ReactNode }) {
  const [ouvert, setOuvert] = useState(false);
  return (
    <div className="rounded-[14px] bg-muted/60">
      <button onClick={() => { tactile(4); setOuvert((o) => !o); }} aria-expanded={ouvert} className="flex w-full items-center gap-2 px-3.5 py-2.5 text-left">
        <span className="flex-1 text-[14px] font-medium">{titre}</span>
        {n > 0 && <span className="num rounded-full bg-plate px-2 text-[12px] font-bold text-plate-foreground">{n}</span>}
        <CaretDownIcon className={cn("size-3.5 text-muted-foreground transition-transform duration-200", ouvert && "rotate-180")} />
      </button>
      {ouvert && <div className="flex flex-wrap gap-1.5 px-3.5 pb-3">{children}</div>}
    </div>
  );
}

/** « Végétarien · halal · sans lactose · 30 min max » */
export function resumePrefs(p: PrefsRepas) {
  const sans = p.allergies.map((k) => ALLERGIES.find((x) => x[0] === k)?.[1].toLowerCase()).filter(Boolean);
  return [REGIMES[p.regime], p.culte ? CULTES[p.culte].toLowerCase() : "", sans.length ? tr("sans {l}", { l: sans.join(", ") }) : "", TEMPS[p.temps ?? 2]].filter(Boolean).join(" · ");
}

/** Première ouverture : les questions, puis la partie Repas. */
export function AccueilRepas() {
  const A = useRepere((s) => s.etat.A), muter = useRepere((s) => s.muter);
  const [p, setP] = useState(() => prefsDe(A));
  return (
    <div className="flex flex-col gap-5 px-4">
      <div className="rounded-[22px] bg-plate-soft p-4">
        <p className="text-[16px] font-semibold text-plate-ink">{tr("Des repas pensés pour ton entraînement")}</p>
        <p className="mt-1 text-[13.5px] leading-relaxed text-muted-foreground">{tr("Quelques réponses, et je te propose des recettes à ta portion, avec ou sans ce que tu as déjà, et la liste de courses qui va avec, au prix estimé.")}</p>
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

/** Vignette d'une recette : sa photo, ou une pastille colorée selon le moment (pas de photo, hors ligne, image bloquée). */
export function VignetteRecette({ r, className, large }: { r: Recette; className?: string; large?: boolean }) {
  const I = ICONE[r.m];
  /* en grand : le bandeau, sinon la vignette (souvent déjà gardée hors connexion), sinon la pastille */
  const sources = (r.img ? [r.img] : large ? [imgRecette(r.id, "large"), imgRecette(r.id, "carre")] : [imgRecette(r.id, "carre")]).filter(Boolean) as string[];
  const [rate, setRate] = useState(0);
  // eslint-disable-next-line @next/next/no-img-element -- export statique : pas d'optimisation d'image Next
  if (rate < sources.length) return <img key={sources[rate]} src={sources[rate]} alt="" loading="lazy" onError={() => setRate((x) => x + 1)} className={cn("bg-muted object-cover", className)} />;
  return <span aria-hidden className={cn("grid place-items-center bg-gradient-to-br", TEINTE[r.m], className)}><I className="size-1/2 text-white/90" weight="fill" /></span>;
}

export function CarteRecette({ r, b, c, kcal, onOuvrir, droite, sous }: { r: Recette; b: Besoins; c?: CreneauRepas; kcal: boolean; onOuvrir: () => void; droite?: React.ReactNode; sous?: React.ReactNode }) {
  const f = portion(r, b, c), m = macros(r, f);
  const perso = useRepere((s) => s.etat.A.repas?.prix);
  return (
    <div className="flex items-center gap-3 rounded-[20px] bg-card p-2.5 pr-3">
      <button onClick={onOuvrir} className="flex min-w-0 flex-1 items-center gap-3 text-left active:opacity-80">
        <VignetteRecette r={r} className="size-16 shrink-0 rounded-[14px]" />
        <span className="min-w-0 flex-1">
          {c && <span className="eyebrow block">{NOM_CRENEAU[c]}</span>}
          <span className="block truncate text-[15.5px] leading-tight font-semibold">{nomRecette(r)}</span>
          <span className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[12.5px] text-muted-foreground">
            <span className="flex items-center gap-1"><ClockIcon className="size-3.5" />{tr("{n} min", { n: r.min })}</span>
            <span className="font-semibold text-plate-ink">{tr("{p} g de protéines", { p: m.p })}</span>
            {kcal && <span>{m.kcal}{" "}{tr("kcal")}</span>}
            <span aria-label={tr("Environ {e} la portion", { e: euros(coutRecette(r, f, perso)) })}>{"≈ " + euros(coutRecette(r, f, perso))}</span>
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
      <DrawerContent className="theme-repas max-h-[94dvh]">{r && <Fiche key={r.id} r={r} b={b} c={c} kcal={kcal} pers0={pers0} />}</DrawerContent>
    </Drawer>
  );
}
function Fiche({ r, b, c, kcal, pers0 }: { r: Recette; b: Besoins; c?: CreneauRepas; kcal: boolean; pers0: number }) {
  const [pers, setPers] = useState(pers0);
  const f = portion(r, b, c), m = macros(r, f);
  const reg = regimeDe(r), alg = allergenesDe(r);
  const pr = prefsDe(useRepere((s) => s.etat.A)), culte = pr.culte ?? 0, prixPerso = pr.prix;
  return (
    <div className="overflow-y-auto overscroll-contain px-4 pb-[max(env(safe-area-inset-bottom),20px)]">
      <VignetteRecette r={r} large className="mt-2 h-40 w-full rounded-[22px]" />
      {auteurRecette(r.id) && (
        <p className="mt-1 px-1 text-right text-[11px] text-muted-foreground">
          {tr("Photo : ")}<a href={auteurRecette(r.id)!.lien} target="_blank" rel="noreferrer" className="underline underline-offset-2">{auteurRecette(r.id)!.nom}</a>{tr(" sur ")}<a href="https://unsplash.com/?utm_source=repere&utm_medium=referral" target="_blank" rel="noreferrer" className="underline underline-offset-2">Unsplash</a>
        </p>
      )}
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
            <span><span aria-hidden className="mr-2">{emojiDe(id)}</span>{nomAliment(id)}</span>
            <span className="num shrink-0 font-semibold">{quantite(id, g * f * pers)}</span>
          </li>
        ))}
      </ul>
      <p className="mt-2 px-1 text-[12.5px] text-muted-foreground">
        {pers > 1 ? tr("Coût estimé : environ {e} pour {n} personnes, prix moyens en supermarché.", { e: euros(coutRecette(r, f * pers, prixPerso)), n: pers }) : tr("Coût estimé : environ {e} la portion, prix moyens en supermarché.", { e: euros(coutRecette(r, f, prixPerso)) })}
      </p>
      {culte > 0 && reg === 0 && <p className="mt-2 px-1 text-[12.5px] text-muted-foreground">{culte === 1 ? tr("Prends une viande certifiée halal.") : tr("Prends une viande certifiée casher.")}</p>}
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

