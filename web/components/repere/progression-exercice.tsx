"use client";

/* Progrès › Ma progression par exercice (maquette A validée le 14 novembre 2026) : tes vraies séries
   plutôt qu'un 1RM estimé. Une barre par séance (les 8 dernières) avec la meilleure série au-dessus,
   « De 8 kg × 11 à 12 kg × 7 », trois vues (charge, volume, force estimée) et ce qu'Oxa proposera la
   prochaine fois, calculé par la même règle que la séance (propositionLibre). */
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ArrowUpRightIcon, CaretDownIcon, CaretRightIcon, SparkleIcon } from "@phosphor-icons/react";
import { loc, pluriel, tr } from "@/lib/i18n";
import { EX } from "@/lib/data/exercices";
import { courbe, dateDe, exercicesFaits, type LigneHist } from "@/lib/logic/historique";
import { nb, propositionLibre } from "@/lib/logic/core";
import type { Etat, ExLibre } from "@/lib/logic/types";
import { useRepere } from "@/lib/store";
import { Drawer, DrawerContent, DrawerDescription, DrawerTitle } from "@/components/ui/drawer";
import { tactile } from "@/lib/repos";
import { cn } from "@/lib/utils";

const court = (j: string) => dateDe(j).toLocaleDateString(loc(), { day: "numeric", month: "short" }).replace(".", "");
type Vue = "charge" | "volume" | "force";
type Point = ReturnType<typeof courbe>[number];

/** Ce qu'Oxa proposera la prochaine fois sur cet exercice chargé : la ligne d'une séance enregistrée
    qui le contient (séries, répétitions, objectif), sinon la dernière fois qu'il a été fait. */
export function prochaineFois(E: Etat, id: string, dernier?: Point): { v: number; reps: number; t?: string } | null {
  const x = EX[id];
  if (!x || x.ch !== "kg") return null;
  let e: ExLibre | undefined, obj: number | undefined;
  for (const S of E.SEANCES) {
    const f = S.ex.find((z) => z.id === id);
    if (f) { e = f; obj = S.obj ?? S.gen?.obj; break; }
  }
  e ??= { id, s: dernier?.ser || 3, r: dernier?.reps || 10, p: "90 s" };
  const p = propositionLibre(E, e, { obj: obj ?? E.A.objectif ?? undefined, k: "P|progres|0" });
  return p && p.base.v > 0 ? { v: p.base.v, reps: p.base.reps, t: p.why } : null;
}

/** Durée lisible entre deux jours : « 11 jours », « 3 semaines », « 2 mois ». */
function duree(d1: string, d2: string) {
  const j = Math.round((dateDe(d2).getTime() - dateDe(d1).getTime()) / 864e5);
  if (j < 14) return j <= 1 ? tr("1 jour") : tr("{n} jours", { n: j });
  if (j < 60) { const s = Math.round(j / 7); return tr("{n} semaines", { n: s }); }
  return tr("{n} mois", { n: Math.round(j / 30) });
}

export function ProgressionExercice({ H, id, setId }: { H: LigneHist[]; id: string | null; setId: (id: string) => void }) {
  const E = useRepere((s) => s.etat);
  const faits = useMemo(() => exercicesFaits(H).filter((e) => EX[e.id]), [H]);
  const [tous, setTous] = useState(false);
  const [vue, setVue] = useState<Vue>("charge");
  /* ?ex= : ouvert depuis la fiche d'un exercice */
  const q = useSearchParams().get("ex");
  useEffect(() => {
    if (q) requestAnimationFrame(() => document.getElementById("par-exercice")?.scrollIntoView({ block: "center" }));
  }, [q]);
  const courant = id ?? (faits.find((e) => EX[e.id].ch === "kg" && e.n > 1) || faits[0])?.id;
  const pts = useMemo(() => (courant ? courbe(H, courant) : []), [H, courant]);
  const suite = useMemo(() => (courant ? prochaineFois(E, courant, pts.at(-1)) : null), [E, courant, pts]);
  if (!courant) return <div className="rounded-[22px] bg-card p-4 text-[14px] text-muted-foreground">{tr("Fais une séance pour voir ta progression.")}</div>;

  const x = EX[courant], kg = x.ch === "kg", lest = x.ch === "lest" && pts.some((p) => p.max > 0);
  const pdc = (x.ch === "aucune" || x.ch === "lest") && !lest; // poids du corps sans lest : on suit les répétitions
  const v = kg ? vue : "charge";
  /* la meilleure série d'une séance, telle qu'on l'a faite */
  const serie = (p: Point) => kg ? `${nb(p.max)} × ${p.reps}` : lest ? `+${nb(p.max)} × ${p.reps}` : pdc ? tr("{n} réps", { n: p.reps }) : x.ch === "temps" ? `${p.max} s` : `${nb(p.max)} m`;
  const serieLongue = (p: Point) => kg ? `${nb(p.max)} kg × ${p.reps}` : lest ? `+${nb(p.max)} kg × ${p.reps}` : serie(p);
  const val = (p: Point) => v === "volume" ? p.vol : v === "force" ? p.rm : pdc ? p.reps : p.max;
  const etiquette = (p: Point) => v === "volume" ? `${nb(Math.round(p.vol))} kg` : v === "force" ? `${nb(Math.round(p.rm * 10) / 10)} kg` : serie(p);
  const vus = pts.slice(-8), haut = Math.max(...vus.map(val), 1);
  const premier = pts[0], dernier = pts.at(-1)!;
  const gain = kg || lest ? dernier.max - premier.max : pdc ? dernier.reps - premier.reps : dernier.max - premier.max;
  const unite = kg || lest ? " kg" : pdc ? " " + tr("réps") : x.ch === "temps" ? " s" : " m";
  const progres = gain > 0 || (gain === 0 && (kg || lest) && dernier.reps > premier.reps);

  return (
    <div id="par-exercice">
      {/* les exercices faits, du plus récent au plus ancien ; « Tous » ouvre la liste complète */}
      <div className="no-scrollbar -mx-4 mb-2.5 flex gap-1.5 overflow-x-auto px-4">
        {faits.slice(0, 8).map((e) => (
          <button key={e.id} onClick={() => { tactile(4); setId(e.id); }}
            className={cn("shrink-0 rounded-full px-3.5 py-2 text-[13.5px] font-semibold", e.id === courant ? "bg-plate text-plate-foreground" : "border border-border/80 bg-card")}>
            {EX[e.id].n}
          </button>
        ))}
        {faits.length > 8 && (
          <button onClick={() => setTous(true)} className="flex shrink-0 items-center gap-1 rounded-full border border-border/80 bg-card px-3.5 py-2 text-[13.5px] font-semibold">
            {tr("Tous")}<CaretDownIcon className="size-3.5" />
          </button>
        )}
      </div>

      <div className="rounded-[22px] border border-border/80 bg-card p-4">
        <div className="titre text-[21px] leading-tight">{x.n}</div>
        <div className="text-[13px] text-muted-foreground">
          {v === "volume" ? tr("Le poids total soulevé à chaque séance") : v === "force" ? tr("1RM estimé (formule d'Epley) à chaque séance") : tr("Ta meilleure série à chaque séance")}
          {" · "}{tr("{n} séance{a}", { n: pts.length, a: pluriel(pts.length) ? "s" : "" })}
        </div>

        {/* une barre par séance, la dernière en couleur */}
        <div className="mt-4 flex h-[210px] items-end gap-2" role="img" aria-label={tr("Tes séances : {l}", { l: vus.map((p) => `${court(p.d)} ${etiquette(p)}`).join(", ") })}>
          {vus.map((p, i) => {
            const fin = i === vus.length - 1;
            return (
              <div key={p.d} className="flex min-w-0 flex-1 flex-col items-center justify-end gap-1.5">
                <span className={cn("num truncate text-[14px] font-bold", fin && "text-plate-ink dark:text-plate")}>{etiquette(p)}</span>
                <span className={cn("w-full max-w-[40px] rounded-t-[10px] rounded-b-[4px] transition-[height] duration-500", fin ? "bg-plate" : "bg-muted dark:bg-white/14")} style={{ height: Math.max(8, Math.round((150 * val(p)) / haut)) }} />
                <span className="truncate text-[11.5px] text-muted-foreground">{court(p.d)}</span>
              </div>
            );
          })}
        </div>

        {pts.length > 1 && (
          <div className="mt-3.5 flex items-center gap-2.5 rounded-[16px] bg-plate-soft/60 p-3 dark:bg-plate/12">
            <ArrowUpRightIcon className={cn("size-5 shrink-0", progres ? "text-plate-ink dark:text-plate" : "rotate-90 text-muted-foreground")} weight="bold" />
            <span className="text-[14px] leading-snug">
              {tr("De")} <b className="num text-[16px]">{serieLongue(premier)}</b> {tr("à")} <b className="num text-[16px] text-plate-ink dark:text-plate">{serieLongue(dernier)}</b>
              <span className="block text-[12.5px] text-muted-foreground">
                {gain > 0 ? tr("+{g} en {d}", { g: nb(Math.round(gain * 10) / 10) + unite, d: duree(premier.d, dernier.d) }) : tr("en {d}", { d: duree(premier.d, dernier.d) })}
              </span>
            </span>
          </div>
        )}

        {kg && (
          <div className="mt-3 flex gap-1.5" role="radiogroup" aria-label={tr("Ce que montrent les barres")}>
            {([["charge", tr("Charge")], ["volume", tr("Volume")], ["force", tr("Force estimée")]] as [Vue, string][]).map(([k, n]) => (
              <button key={k} role="radio" aria-checked={vue === k} onClick={() => { tactile(4); setVue(k); }}
                className={cn("rounded-full px-3 py-1.5 text-[12.5px] font-semibold", vue === k ? "bg-foreground text-background" : "border border-border text-muted-foreground")}>
                {n}
              </button>
            ))}
          </div>
        )}
      </div>

      {suite && (
        <div className="mt-2.5 flex items-start gap-3 rounded-[18px] border border-border/80 bg-card p-3.5">
          <span className="grid size-9 shrink-0 place-items-center rounded-full bg-plate-soft text-plate-ink dark:bg-plate/15 dark:text-plate"><SparkleIcon className="size-4" weight="fill" /></span>
          <span className="min-w-0 text-[14px] leading-snug">
            <b>{tr("Prochaine fois")}</b> · {tr("Oxa te proposera")} <b className="num text-[16px]">{nb(suite.v)} kg × {suite.reps}</b>
            {suite.t && <span className="mt-0.5 block text-[12.5px] text-muted-foreground">{suite.t}</span>}
          </span>
        </div>
      )}

      <Drawer open={tous} onOpenChange={setTous}>
        <DrawerContent>
          <DrawerTitle className="px-5 pt-2 text-[19px] font-bold">{tr("Choisir un exercice")}</DrawerTitle>
          <DrawerDescription className="px-5 text-[13px] text-muted-foreground">{tr("Les exercices que tu as déjà faits")}</DrawerDescription>
          <div className="mt-2 max-h-[60vh] overflow-y-auto px-2 pb-[max(env(safe-area-inset-bottom),16px)]">
            {faits.map((e) => (
              <button key={e.id} onClick={() => { setId(e.id); setTous(false); }}
                className={cn("flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left active:bg-muted", e.id === courant && "bg-plate-soft")}>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[15px] font-medium">{EX[e.id].n}</span>
                  <span className="block text-[12px] text-muted-foreground">{tr("{n} séance{a} · dernière le {a1}", { n: e.n, a: pluriel(e.n) ? "s" : "", a1: court(e.dernier) })}</span>
                </span>
                <CaretRightIcon className="size-4 text-muted-foreground" />
              </button>
            ))}
          </div>
        </DrawerContent>
      </Drawer>
    </div>
  );
}
