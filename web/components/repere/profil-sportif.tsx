"use client";

/* « Mon profil sportif » (Profil) : sexe, âge, taille et poids, objectif, niveau, séances par semaine
   et durée, muscles prioritaires, autres sports. Les réponses vont dans les champs du questionnaire
   Oxa Plan (A.sexe, A.profil, A.objectif, A.regularite, A.objHebdo, A.duree, A.prio, A.sport) :
   une seule source pour les séances, la nutrition et le programme.
   Aussi : la mise en route en 3 questions (première séance créée) et la ligne « Calculée pour ». */
import { tr } from "@/lib/i18n";
import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Route } from "next";
import { CalendarDotsIcon, CaretRightIcon, CrosshairIcon, GaugeIcon, GenderIntersexIcon, MinusIcon, PersonSimpleRunIcon, PlusIcon, RulerIcon, CakeIcon, StarIcon, GearSixIcon } from "@phosphor-icons/react";
import { Drawer, DrawerContent, DrawerDescription, DrawerTitle } from "@/components/ui/drawer";
import { BLESN, SPORTS } from "@/lib/data/referentiels";
import { groupes } from "@/lib/logic/core";
import { jourDe } from "@/lib/logic/historique";
import { poidsDe } from "@/lib/logic/nutrition";
import { useRepere } from "@/lib/store";
import { AVANT } from "@/lib/nav";
import { tactile } from "@/lib/repos";
import { cn } from "@/lib/utils";
import type { Reponses } from "@/lib/logic/types";

/* ---------------- libellés ---------------- */
export const OBJECTIFS = () => [
  { v: 0, n: tr("Prendre du muscle"), c: tr("muscle"), d: tr("Volume et surcharge progressive") },
  { v: 1, n: tr("Gagner en force"), c: tr("force"), d: tr("Charges lourdes, séries courtes") },
  { v: 2, n: tr("M'affiner"), c: tr("affiner"), d: tr("Garder le muscle en perdant du gras") },
  { v: 3, n: tr("Rester en forme"), c: tr("forme"), d: tr("Entretien, sans forcer") },
];
/* niveau : trois choix, rangés dans A.regularite (questionnaire : 0 et 1 = reprise, 2 = régulier, 3 = confirmé) */
export const NIVEAUX = () => [
  { v: 1, n: tr("Je débute ou je reprends"), c: tr("débutant"), d: tr("Moins de 6 mois de pratique régulière") },
  { v: 2, n: tr("Régulier"), c: tr("régulier"), d: tr("1 à 2 séances par semaine depuis 6 mois") },
  { v: 3, n: tr("Confirmé"), c: tr("confirmé"), d: tr("3 séances ou plus par semaine depuis plus d'un an") },
];
export const niveauDe = (A: Reponses) => (A.regularite == null ? null : A.regularite <= 1 ? 1 : A.regularite);
const SEXES = () => [{ v: 0, n: tr("Homme") }, { v: 1, n: tr("Femme") }, { v: 2, n: tr("Je préfère ne pas répondre") }];
const DUREES_H = [30, 45, 60];

const majuscule = (t?: string) => (t ? t.charAt(0).toUpperCase() + t.slice(1) : "");

/** Le profil sportif est-il assez rempli pour des séances sur mesure ? */
export const profilMinimal = (A: Reponses) => A.objectif != null && A.regularite != null && A.objHebdo != null;

/** « régulier · muscle · 45 min » */
export function resumeCalcul(A: Reponses, duree?: number) {
  const n = niveauDe(A), o = A.objectif;
  return [n != null ? NIVEAUX().find((x) => x.v === n)?.c : null, o != null ? OBJECTIFS()[o]?.c : null, tr("{n} min", { n: duree ?? A.duree ?? 45 })].filter(Boolean).join(" · ");
}

/* ---------------- petits éléments ---------------- */
function Choix<T extends number>({ l, v, onChange }: { l: { v: T; n: string; d?: string }[]; v: T | null | undefined; onChange: (v: T) => void }) {
  return (
    <div className="mt-3 flex flex-col gap-2">
      {l.map((x) => (
        <button key={x.v} onClick={() => { tactile(6); onChange(x.v); }} aria-pressed={v === x.v}
          className={cn("flex items-center gap-3 rounded-2xl border-2 bg-card px-3.5 py-3 text-left", v === x.v ? "border-plate" : "border-transparent")}>
          <span className="min-w-0 flex-1">
            <span className="block text-[15.5px] font-semibold">{x.n}</span>
            {x.d && <span className="block text-[12.5px] text-muted-foreground">{x.d}</span>}
          </span>
          <span className={cn("size-[22px] shrink-0 rounded-full", v === x.v ? "border-[7px] border-plate" : "border-2 border-border")} />
        </button>
      ))}
    </div>
  );
}
function Pastilles<T extends number>({ l, actif, onToggle }: { l: { v: T; n: string }[]; actif: (v: T) => boolean; onToggle: (v: T) => void }) {
  return (
    <div className="mt-2 flex flex-wrap gap-1.5">
      {l.map((x) => (
        <button key={x.v} onClick={() => { tactile(5); onToggle(x.v); }} aria-pressed={actif(x.v)}
          className={cn("h-9 rounded-full border-[1.5px] px-3.5 text-[14px] font-semibold", actif(x.v) ? "border-foreground bg-foreground text-background" : "border-border")}>
          {x.n}
        </button>
      ))}
    </div>
  );
}
function Compteur({ label, v, unite, pas, min, max, onChange }: { label: string; v: number; unite: string; pas: number; min: number; max: number; onChange: (v: number) => void }) {
  const borne = (x: number) => Math.min(max, Math.max(min, Math.round(x * 10) / 10));
  return (
    <div className="mt-2 flex items-center justify-between rounded-2xl bg-card p-2.5 pl-4">
      <span className="text-[15px] font-semibold">{label}</span>
      <span className="flex items-center gap-2">
        <button aria-label={tr("{l} moins", { l: label })} onClick={() => onChange(borne(v - pas))} className="grid size-10 place-items-center rounded-full bg-muted active:scale-90"><MinusIcon className="size-4" /></button>
        <span className="flex w-24 items-baseline justify-center gap-1">
          <input value={v} inputMode="decimal" aria-label={label} className="num w-14 bg-transparent text-center text-[26px] font-bold outline-none"
            onChange={(e) => { const x = parseFloat(e.target.value.replace(",", ".")); if (!isNaN(x)) onChange(Math.min(max, Math.max(0, x))); }} />
          <span className="text-[13px] text-muted-foreground">{unite}</span>
        </span>
        <button aria-label={tr("{l} plus", { l: label })} onClick={() => onChange(borne(v + pas))} className="grid size-10 place-items-center rounded-full bg-muted active:scale-90"><PlusIcon className="size-4" /></button>
      </span>
    </div>
  );
}

/* ---------------- Profil › Mon profil sportif ---------------- */
export type Ligne = "sexe" | "age" | "corps" | "objectif" | "niveau" | "rythme" | "gene" | "prio" | "sport";
type LigneProfil = { k: Ligne; icone: React.ReactNode; fond: string; n: string; v: string | null };

function GroupeLignes({ l, ouvrir }: { l: LigneProfil[]; ouvrir: (k: Ligne) => void }) {
  return (
    <div className="overflow-hidden rounded-[18px] bg-card">
      {l.map((x) => (
        <button key={x.k} onClick={() => { tactile(5); ouvrir(x.k); }} className="flex w-full items-center gap-3 border-b border-border/70 px-3.5 py-2.5 text-left last:border-b-0 active:bg-muted">
          <span className="grid size-7 shrink-0 place-items-center rounded-lg text-white" style={{ background: x.fond }}>{x.icone}</span>
          <span className="shrink-0 text-[15px]">{x.n}</span>
          <span className={cn("ml-auto min-w-0 truncate text-right text-[14px]", x.v ? "text-muted-foreground" : "font-semibold text-plate-ink dark:text-plate")}>{x.v ?? tr("À compléter")}</span>
          <CaretRightIcon className="size-3.5 shrink-0 text-muted-foreground" />
        </button>
      ))}
    </div>
  );
}

export function ProfilSportif() {
  const A = useRepere((s) => s.etat.A);
  const [ouv, setOuv] = useState<Ligne | null>(null);
  const p = A.profil || {}, kg = poidsDe(A);
  const G = groupes(A), prio = (A.prio || []).filter((i) => i < G.length);
  const sports = (A.sport || []).filter((i) => i > 0 && SPORTS[i]);
  const lignes: LigneProfil[] = [
    { k: "sexe", icone: <GenderIntersexIcon className="size-4" weight="bold" />, fond: "#5e5ce6", n: tr("Sexe"), v: A.sexe != null ? SEXES()[A.sexe]?.n ?? null : null },
    { k: "age", icone: <CakeIcon className="size-4" weight="bold" />, fond: "#ff9f0a", n: tr("Âge"), v: p["Âge"] ? tr("{n} ans", { n: p["Âge"] }) : null },
    { k: "corps", icone: <RulerIcon className="size-4" weight="bold" />, fond: "#30b0c7", n: tr("Taille et poids"), v: p["Taille"] && kg ? `${p["Taille"]} cm · ${String(kg).replace(".", ",")} kg` : null },
    { k: "objectif", icone: <CrosshairIcon className="size-4" weight="bold" />, fond: "#0fb5a3", n: tr("Objectif"), v: A.objectif != null ? OBJECTIFS()[A.objectif]?.n ?? null : null },
    { k: "niveau", icone: <GaugeIcon className="size-4" weight="bold" />, fond: "#34c759", n: tr("Niveau"), v: majuscule(NIVEAUX().find((x) => x.v === niveauDe(A))?.c) || null },
    { k: "rythme", icone: <CalendarDotsIcon className="size-4" weight="bold" />, fond: "#ff375f", n: tr("Séances par semaine"), v: A.objHebdo != null ? `${A.objHebdo} · ${tr("{n} min", { n: (A.duree as number) ?? 45 })}` : null },
    { k: "prio", icone: <StarIcon className="size-4" weight="fill" />, fond: "#bf5af2", n: tr("Muscles prioritaires"), v: A.prio ? (prio.length ? prio.map((i) => tr(G[i])).join(", ") : tr("Aucun")) : null },
    { k: "sport", icone: <PersonSimpleRunIcon className="size-4" weight="bold" />, fond: "#ff6b2c", n: tr("Autres sports"), v: A.sport ? (sports.length ? sports.map((i) => tr(SPORTS[i].n)).join(", ") : tr("Aucun")) : null },
  ];
  const faits = lignes.filter((l) => l.v).length;
  return (
    <section id="sportif" className="scroll-mt-20">
      <h3 className="eyebrow mb-2 px-1">{tr("Mon profil sportif")}</h3>
      <GroupeLignes l={lignes.slice(0, 3)} ouvrir={setOuv} />
      <div className="mt-2.5"><GroupeLignes l={lignes.slice(3)} ouvrir={setOuv} /></div>
      <div className="mt-2.5 flex items-center gap-2.5 px-1 text-[12.5px] text-muted-foreground">
        {tr("Profil complété")}
        <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted"><i className="block h-full rounded-full bg-plate" style={{ width: `${(faits / lignes.length) * 100}%` }} /></span>
        {faits}/{lignes.length}
      </div>
      <p className="mt-1.5 px-1 text-[12.5px] leading-snug text-muted-foreground">{tr("Sert à calibrer tes séances (volume, répétitions, charges), tes besoins en protéines et en énergie, et Oxa Plan.")}</p>

      <Drawer open={!!ouv} onOpenChange={(o) => !o && setOuv(null)}>
        <DrawerContent className="max-h-[92dvh]">
          <div className="overflow-y-auto overscroll-contain px-4 pb-[max(env(safe-area-inset-bottom),20px)]">
            {ouv && <EditeurProfil k={ouv} />}
            <button onClick={() => setOuv(null)} className="mt-5 h-12 w-full rounded-full bg-plate text-[15.5px] font-semibold text-plate-foreground active:scale-[.98]">{tr("Enregistrer")}</button>
          </div>
        </DrawerContent>
      </Drawer>
    </section>
  );
}

/** Une question du profil sportif (feuille de Profil, accueil d'un nouveau compte). */
export function EditeurProfil({ k }: { k: Ligne }) {
  const A = useRepere((s) => s.etat.A);
  const muter = useRepere((s) => s.muter);
  const maj = (f: (A: Reponses) => void) => muter((E) => f(E.A));
  const p = A.profil || {}, kg = poidsDe(A);
  const G = groupes(A), prio = (A.prio || []).filter((i) => i < G.length);
  const sports = (A.sport || []).filter((i) => i > 0 && SPORTS[i]);
  return (
    <>
            {k === "sexe" && <>
              <DrawerTitle className="mt-2 px-1 text-[22px] font-extrabold">{tr("Sexe")}</DrawerTitle>
              <DrawerDescription className="mt-0.5 px-1 text-[13.5px] text-muted-foreground">{tr("Sert au calcul de ta dépense d'énergie, au schéma du corps et à la répartition du volume.")}</DrawerDescription>
              <Choix l={SEXES()} v={A.sexe} onChange={(v) => maj((a) => { a.sexe = v; })} />
            </>}
            {k === "age" && <>
              <DrawerTitle className="mt-2 px-1 text-[22px] font-extrabold">{tr("Âge")}</DrawerTitle>
              <DrawerDescription className="mt-0.5 px-1 text-[13.5px] text-muted-foreground">{tr("Sert au calcul de ta dépense d'énergie et de tes besoins en protéines.")}</DrawerDescription>
              <Compteur label={tr("Âge")} v={p["Âge"] ?? 30} unite={tr("ans")} pas={1} min={12} max={99} onChange={(v) => maj((a) => { a.profil = { ...(a.profil || {}), "Âge": v }; })} />
            </>}
            {k === "corps" && <>
              <DrawerTitle className="mt-2 px-1 text-[22px] font-extrabold">{tr("Taille et poids")}</DrawerTitle>
              <DrawerDescription className="mt-0.5 px-1 text-[13.5px] text-muted-foreground">{tr("Ton poids s'ajoute aussi à ta courbe dans Progrès.")}</DrawerDescription>
              <Compteur label={tr("Taille")} v={p["Taille"] ?? (A.sexe === 1 ? 165 : 177)} unite="cm" pas={1} min={120} max={230} onChange={(v) => maj((a) => { a.profil = { ...(a.profil || {}), Taille: v }; })} />
              <Compteur label={tr("Poids")} v={kg ?? 70} unite="kg" pas={0.5} min={30} max={250} onChange={(v) => maj((a) => {
                a.profil = { ...(a.profil || {}), Poids: v };
                const j = jourDe(Date.now()), l = ((a.poids as [string, number][]) || []).filter(([d]) => d !== j);
                a.poids = [...l, [j, v]].slice(-120);
              })} />
            </>}
            {k === "objectif" && <>
              <DrawerTitle className="mt-2 px-1 text-[22px] font-extrabold">{tr("Ton objectif")}</DrawerTitle>
              <DrawerDescription className="mt-0.5 px-1 text-[13.5px] text-muted-foreground">{tr("Un seul. Il règle les répétitions, le repos et tes besoins en protéines.")}</DrawerDescription>
              <Choix l={OBJECTIFS()} v={A.objectif} onChange={(v) => maj((a) => { a.objectif = v; })} />
            </>}
            {k === "niveau" && <>
              <DrawerTitle className="mt-2 px-1 text-[22px] font-extrabold">{tr("Ton niveau")}</DrawerTitle>
              <DrawerDescription className="mt-0.5 px-1 text-[13.5px] text-muted-foreground">{tr("Sur les six derniers mois. C'est ce qui règle le volume que ton corps encaisse aujourd'hui.")}</DrawerDescription>
              <Choix l={NIVEAUX()} v={niveauDe(A)} onChange={(v) => maj((a) => { a.regularite = v; })} />
            </>}
            {k === "rythme" && <>
              <DrawerTitle className="mt-2 px-1 text-[22px] font-extrabold">{tr("Ton rythme")}</DrawerTitle>
              <DrawerDescription className="mt-0.5 px-1 text-[13.5px] text-muted-foreground">{tr("Ton objectif de séances par semaine (il compte pour ta série) et la durée habituelle d'une séance.")}</DrawerDescription>
              <div className="mt-3 px-1 text-[13px] font-bold">{tr("Séances par semaine")}</div>
              <Pastilles l={[1, 2, 3, 4, 5, 6].map((v) => ({ v, n: String(v) }))} actif={(v) => A.objHebdo === v} onToggle={(v) => maj((a) => { a.objHebdo = v; })} />
              <div className="mt-4 px-1 text-[13px] font-bold">{tr("Durée d'une séance")}</div>
              <Pastilles l={DUREES_H.map((v) => ({ v, n: tr("{n} min", { n: v }) }))} actif={(v) => ((A.duree as number) ?? 45) === v} onToggle={(v) => maj((a) => { a.duree = v; })} />
            </>}
            {k === "gene" && <>
              <DrawerTitle className="mt-2 px-1 text-[22px] font-extrabold">{tr("Une zone à ménager ?")}</DrawerTitle>
              <DrawerDescription className="mt-0.5 px-1 text-[13.5px] text-muted-foreground">{tr("Une gêne ou une ancienne blessure : Oxa évite les mouvements qui la chargent. Une vraie douleur se montre à un médecin.")}</DrawerDescription>
              <Pastilles l={[{ v: -1, n: tr("Rien") }, ...BLESN.slice(0, 4).map((z, i) => ({ v: i, n: majuscule(tr(z)) }))]}
                actif={(v) => (v === -1 ? !!A.blessure && !(A.blessure || []).length : (A.blessure || []).includes(v))}
                onToggle={(v) => maj((a) => { if (v === -1) { a.blessure = []; return; } const l = (a.blessure || []).filter((i) => i < 4); a.blessure = l.includes(v) ? l.filter((i) => i !== v) : [...l, v].sort(); })} />
            </>}
            {k === "prio" && <>
              <DrawerTitle className="mt-2 px-1 text-[22px] font-extrabold">{tr("Muscles prioritaires")}</DrawerTitle>
              <DrawerDescription className="mt-0.5 px-1 text-[13.5px] text-muted-foreground">{tr("Deux au maximum, sinon plus rien n'est prioritaire.")}</DrawerDescription>
              <Pastilles l={G.map((g, i) => ({ v: i, n: tr(g) }))} actif={(v) => prio.includes(v)}
                onToggle={(v) => maj((a) => { const l = (a.prio || []).filter((i) => i < G.length); a.prio = l.includes(v) ? l.filter((i) => i !== v) : [...l, v].slice(-2); })} />
            </>}
            {k === "sport" && <>
              <DrawerTitle className="mt-2 px-1 text-[22px] font-extrabold">{tr("Autres sports")}</DrawerTitle>
              <DrawerDescription className="mt-0.5 px-1 text-[13.5px] text-muted-foreground">{tr("Trois au maximum. Ils comptent dans tes besoins en énergie et dans Oxa Plan, qui allège le volume concerné.")}</DrawerDescription>
              <Pastilles l={[{ v: 0, n: tr("Aucun") }, ...SPORTS.map((s, i) => ({ v: i, n: s.n })).slice(1)]} actif={(v) => (v === 0 ? !!A.sport && !sports.length : sports.includes(v))}
                onToggle={(v) => maj((a) => { if (v === 0) { a.sport = [0]; return; } const l = (a.sport || []).filter((i) => i > 0); a.sport = l.includes(v) ? (l.length > 1 ? l.filter((i) => i !== v) : [0]) : [...l, v].slice(-3); })} />
            </>}
    </>
  );
}

/* ---------------- mise en route : 3 questions, une seule fois ---------------- */
export function MiseEnRoute({ ouvert, onFin }: { ouvert: boolean; onFin: () => void }) {
  const A = useRepere((s) => s.etat.A);
  const muter = useRepere((s) => s.muter);
  const [o, setO] = useState<number | null>(A.objectif ?? null);
  const [n, setN] = useState<number | null>(niveauDe(A));
  const [h, setH] = useState<number | null>((A.objHebdo as number) ?? null);
  const finir = (garder: boolean) => {
    muter((E) => {
      E.A.miseEnRoute = true;
      if (garder) { if (o != null) E.A.objectif = o; if (n != null) E.A.regularite = n; if (h != null) E.A.objHebdo = h; }
    });
    onFin();
  };
  return (
    <Drawer open={ouvert} onOpenChange={(x) => !x && finir(false)}>
      <DrawerContent>
        <div className="px-4 pb-[max(env(safe-area-inset-bottom),20px)]">
          <DrawerTitle className="mt-2 px-1 text-[22px] leading-tight font-extrabold">{tr("3 questions pour des séances à ta mesure")}</DrawerTitle>
          <DrawerDescription className="mt-1 px-1 text-[13.5px] text-muted-foreground">{tr("Moins de 20 secondes. Tu pourras tout changer dans Profil.")}</DrawerDescription>
          <div className="mt-4 px-1 text-[13px] font-bold">{tr("Ton objectif")}</div>
          <Pastilles l={OBJECTIFS().map((x) => ({ v: x.v, n: x.n }))} actif={(v) => o === v} onToggle={setO} />
          <div className="mt-4 px-1 text-[13px] font-bold">{tr("Ton niveau")}</div>
          <Pastilles l={[{ v: 1, n: tr("Je débute") }, { v: 2, n: tr("Régulier") }, { v: 3, n: tr("Confirmé") }]} actif={(v) => n === v} onToggle={setN} />
          <div className="mt-4 px-1 text-[13px] font-bold">{tr("Séances par semaine")}</div>
          <Pastilles l={[1, 2, 3, 4, 5].map((v) => ({ v, n: v === 5 ? "5+" : String(v) }))} actif={(v) => h === v} onToggle={setH} />
          <button disabled={o == null || n == null || h == null} onClick={() => { tactile(10); finir(true); }}
            className="mt-5 h-12 w-full rounded-full bg-plate text-[15.5px] font-semibold text-plate-foreground active:scale-[.98] disabled:opacity-50">{tr("C'est parti")}</button>
          <button onClick={() => finir(false)} className="mt-1 w-full py-2.5 text-[14px] font-medium text-muted-foreground">{tr("Plus tard")}</button>
        </div>
      </DrawerContent>
    </Drawer>
  );
}

/* ---------------- « Calculée pour : régulier · muscle · 45 min » ---------------- */
export function CalculePour({ duree, objectif }: { duree: number; objectif: number | null }) {
  const A = useRepere((s) => s.etat.A);
  const router = useRouter();
  return (
    <div className="flex items-center gap-2 rounded-2xl bg-plate-soft px-3 py-2.5 text-[13px] font-semibold text-plate-ink dark:text-plate">
      <GearSixIcon className="size-4 shrink-0" weight="fill" />
      <span className="min-w-0 flex-1 truncate">{tr("Calculée pour : {a}", { a: resumeCalcul({ ...A, objectif: objectif ?? A.objectif }, duree) })}</span>
      <button onClick={() => router.push("/profil#sportif" as Route, AVANT)} className="shrink-0 underline underline-offset-2">{tr("modifier")}</button>
    </div>
  );
}
