"use client";

/* Préparation course à pied : questionnaire (dans « Créer une séance pour moi »),
   carte sur Entraînement, rubrique Course de l'onglet Exercices, et feuille de saisie d'une sortie. */
import { loc, tr } from "@/lib/i18n";
import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { Route } from "next";
import { ArrowRightIcon, CaretDownIcon, CaretRightIcon, PauseCircleIcon, PersonSimpleRunIcon, WarningIcon } from "@phosphor-icons/react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Drawer, DrawerContent, DrawerDescription, DrawerTitle } from "@/components/ui/drawer";
import { Segmente } from "./segmente";
import { confirmer } from "./confirmer";
import {
  adapter, allureHyrox, allures, allureTxt, ATELIERS, avertissement, calendrier, chronoPrevu, chronoTxt, DISTANCES, enPause, estimation, genererPlan, joursAvantCourse, nomsRenfo,
  decalerCle, modifierPlan, semaineDe, seancesRenfo, seancesRenfoHyrox, tempsAteliers, vdotDe, NOMS_PHASE, type ObjectifCourse, type PlanCourse, type SeanceCourse,
} from "@/lib/logic/course";
import { dispoDeclare, nb } from "@/lib/logic/core";
import { decaler, jourDe, lundiDe } from "@/lib/logic/historique";
import { Barres } from "./graphes";
import { useRepere } from "@/lib/store";
import { useCelebrer } from "@/lib/celebrer";
import { ARRIERE, AVANT, remplacement } from "@/lib/nav";
import { tactile } from "@/lib/repos";
import { cn } from "@/lib/utils";

const REFS = [{ km: 5, n: tr("5 km") }, { km: 10, n: tr("10 km") }, { km: 21.0975, n: tr("Semi") }];
const champ = "h-12 w-full rounded-xl border bg-background px-3 text-center text-[18px] font-semibold outline-none focus:border-plate num";

/* ---------------- questionnaire ---------------- */
export function QuestionnaireCourse() {
  const router = useRouter();
  const etat = useRepere((s) => s.etat);
  const muter = useRepere((s) => s.muter);
  const [auj] = useState(() => jourDe(Date.now()));
  const params = useSearchParams(), objUrl = params.get("obj"), modif = params.get("modif") === "1";
  /* ?modif=1 : le formulaire s'ouvre avec les réglages du plan en cours, pour les changer */
  const [ex] = useState(() => (modif ? etat.COURSE : null));
  const r0 = ex?.ref, sec0 = r0?.sec ?? 0;
  const [obj, setObj] = useState<ObjectifCourse>(ex?.obj ?? (objUrl === "hyrox" || objUrl === "10k" || objUrl === "marathon" ? objUrl : "semi"));
  const [cat, setCat] = useState<"h" | "f">(ex?.cat ?? "h");
  const [salle, setSalle] = useState(ex?.salle ?? (etat.A.materiel ?? 0) === 0);
  const hyrox = obj === "hyrox";
  const [date, setDate] = useState(() => ex?.date ?? decaler(auj, 7 * 14));
  const [debutant, setDebutant] = useState(!!ex && !r0);
  const [refKm, setRefKm] = useState(r0?.km ?? 10);
  const [h, setH] = useState(sec0 >= 3600 ? String(Math.floor(sec0 / 3600)) : ""), [m, setM] = useState(r0 ? String(Math.floor((sec0 % 3600) / 60)) : ""), [s, setS] = useState(r0 ? String(Math.round(sec0 % 60)).padStart(2, "0") : "");
  const [jours, setJours] = useState(ex?.jours ?? 4);
  const [renfo, setRenfo] = useState(ex?.renfo ?? 1);
  const sec = (+h || 0) * 3600 + (+m || 0) * 60 + (+s || 0);
  const ref = debutant || sec < 600 ? null : { km: refKm, sec };
  const cal = calendrier(obj, date, auj);
  const alerte = date > auj ? avertissement(obj, ref, cal.dispo) : tr("Choisis une date de course à venir.");
  const V = vdotDe({ ref }), A = allures(V), prevu = chronoPrevu(obj, V);
  const peut = date > decaler(auj, 6) && (debutant || sec >= 600);

  /* renfo : les séances manquantes rejoignent « Mes séances » ; rien n'en est retiré */
  const ajouterRenfos = (E: typeof etat) =>
    (hyrox ? seancesRenfoHyrox : seancesRenfo)((id) => dispoDeclare(E.A, id)).slice(0, renfo).forEach((r, i) => {
      if (!E.SEANCES.some((x) => nomsRenfo(obj, i as 0 | 1).includes(x.nom))) E.SEANCES.push({ nom: r.nom, ex: r.ex });
    });

  const enregistrer = () => {
    if (!ex) return;
    tactile(10);
    muter((E) => {
      if (!E.COURSE) return;
      const { plan, decalage } = modifierPlan(E.COURSE, { obj, date, debut: cal.debut, jours, renfo, ref, ...(hyrox ? { cat, salle } : {}) });
      E.COURSE = plan;
      /* les sorties du plan suivent leur semaine du calendrier */
      if (decalage) for (const o of E.SORTIES || []) { const c = decalerCle(o.s, decalage); if (c) o.s = c; else delete o.s; }
      ajouterRenfos(E);
    });
    toast.success(tr("Plan modifié"), { description: tr("{semaines} semaines jusqu'au jour J.", { semaines: cal.semaines }) });
    router.back();
  };

  const creer = async () => {
    if (ex) return enregistrer();
    if (etat.COURSE && !(await confirmer({ titre: tr("Remplacer ta préparation en cours ?"), texte: tr("Ton plan {a} sera remplacé. Tes sorties déjà notées restent dans ton historique.", { a: DISTANCES[etat.COURSE.obj].nom.toLowerCase() }), ok: tr("Remplacer") }))) return;
    tactile(10);
    const plan: PlanCourse = { obj, date, debut: cal.debut, jours, renfo, ref, pauses: [], ajust: {}, cree: auj, ...(hyrox ? { cat, salle } : {}) };
    muter((E) => {
      E.COURSE = plan;
      /* séances de renfo (coureur ou Hyrox) : ajoutées une fois à « Mes séances » (groupe Musculation) */
      ajouterRenfos(E);
    });
    toast.success(tr("Plan {a} créé : {semaines} semaines", { a: hyrox ? "Hyrox" : DISTANCES[obj].nom.toLowerCase(), semaines: cal.semaines }));
    remplacement();
    router.replace("/entrainement/course", AVANT);
  };

  return (
    <>
      <div className="flex flex-col gap-6 px-4 pb-28">
        <section>
          <div className="eyebrow mb-2 px-1">{tr("Ta course")}</div>
          <Segmente label={tr("Distance")} valeur={obj} onChange={setObj} options={(Object.keys(DISTANCES) as ObjectifCourse[]).map((o) => ({ v: o, n: o === "semi" ? tr("Semi") : DISTANCES[o].nom }))} />
          {hyrox && (
            <div className="mt-3 rounded-[20px] bg-[#0a0a0c] p-3.5 text-white">
              <b className="text-[15px]">{tr("Le format Hyrox")}</b>
              <p className="mt-0.5 text-[12.5px] text-white/70">{tr("8 × 1 km de course, chaque km suivi d'un atelier.")}</p>
              <ol className="mt-2.5 grid grid-cols-2 gap-1.5">
                {ATELIERS.map((a, i) => (
                  <li key={a.k} className="rounded-[10px] bg-white/10 px-2.5 py-1.5 text-[12px] leading-tight">
                    <b className="mr-1 text-[#2dd4bf]">{i + 1}</b>{a.nom} {a.unite === "reps" ? `× ${a.dose}` : `${a.dose} m`}
                  </li>
                ))}
              </ol>
            </div>
          )}
          <label className="mt-3 flex items-center justify-between gap-3 rounded-2xl border bg-card px-4 py-3 text-[15px]">
            {tr("Date de la course")}
            <input type="date" aria-label={tr("Date de la course")} value={date} min={decaler(auj, 7)} onChange={(e) => e.target.value && setDate(e.target.value)} className="rounded-lg border bg-background px-2 py-1.5 text-[15px]" />
          </label>
        </section>

        {hyrox && (
          <section>
            <div className="eyebrow mb-2 px-1">{tr("Catégorie")}</div>
            <Segmente label={tr("Catégorie")} valeur={cat} onChange={setCat} options={[{ v: "h", n: tr("Open hommes") }, { v: "f", n: tr("Open femmes") }]} />
            <p className="mt-2 px-1 text-[12.5px] leading-snug text-muted-foreground">
              {cat === "h" ? tr("Charges des consignes : wall ball 6 kg, farmer's carry 2 × 24 kg, sac 20 kg.") : tr("Charges des consignes : wall ball 4 kg, farmer's carry 2 × 16 kg, sac 10 kg.")}
            </p>
            <div className="eyebrow mt-5 mb-2 px-1">{tr("Machines")}</div>
            <Segmente label={tr("Machines")} valeur={salle ? 1 : 0} onChange={(v) => setSalle(v === 1)} options={[{ v: 1, n: tr("En salle") }, { v: 0, n: tr("Sans machines") }]} />
            <p className="mt-2 px-1 text-[12.5px] leading-snug text-muted-foreground">
              {salle ? tr("SkiErg, traîneau et rameur dans les séances, comme le jour J.") : tr("Chaque machine (SkiErg, traîneau, rameur) est remplacée par un exercice sans matériel de salle.")}
            </p>
          </section>
        )}

        <section>
          <div className="eyebrow mb-2 px-1">{hyrox ? tr("Ton niveau en course") : tr("Ton niveau")}</div>
          <Segmente label={tr("Niveau")} valeur={debutant ? 1 : 0} onChange={(v) => setDebutant(v === 1)} options={[{ v: 0, n: tr("J'ai un chrono récent") }, { v: 1, n: tr("Je débute") }]} />
          {!debutant ? (
            <div className="mt-3 rounded-2xl border bg-card p-3.5">
              <div className="mb-2 text-[13px] text-muted-foreground">{tr("Ton meilleur temps des 3 derniers mois, sur :")}</div>
              <Segmente label={tr("Distance du chrono")} valeur={refKm} onChange={setRefKm} options={REFS.map((r) => ({ v: r.km, n: r.n }))} />
              <div className="mt-3 grid grid-cols-3 items-end gap-2">
                {refKm > 10 && <label className="text-center text-[12px] text-muted-foreground"><input inputMode="numeric" aria-label={tr("Heures")} placeholder="1" value={h} onChange={(e) => setH(e.target.value.replace(/\D/g, "").slice(0, 1))} className={champ} />{tr("h")}</label>}
                <label className={cn("text-center text-[12px] text-muted-foreground", refKm <= 10 && "col-start-1")}><input inputMode="numeric" aria-label={tr("Minutes")} placeholder="50" value={m} onChange={(e) => setM(e.target.value.replace(/\D/g, "").slice(0, 3))} className={champ} />{tr("min")}</label>
                <label className="text-center text-[12px] text-muted-foreground"><input inputMode="numeric" aria-label={tr("Secondes")} placeholder="00" value={s} onChange={(e) => setS(e.target.value.replace(/\D/g, "").slice(0, 2))} className={champ} />{tr("s")}</label>
              </div>
            </div>
          ) : (
            <p className="mt-2 px-1 text-[13px] leading-snug text-muted-foreground">{tr("Le plan part de footings courts et monte doucement. Tes allures se préciseront dès tes premières sorties.")}</p>
          )}
        </section>

        <section>
          <div className="eyebrow mb-2 px-1">{hyrox ? tr("Séances par semaine") : tr("Sorties par semaine")}</div>
          <Segmente label={tr("Sorties par semaine")} valeur={jours} onChange={setJours} options={[3, 4, 5].map((j) => ({ v: j, n: hyrox ? `${j}` : `${j} sorties` }))} />
        </section>
        <section>
          <div className="eyebrow mb-2 px-1">{hyrox ? tr("Renfo Hyrox") : tr("Renforcement du coureur")}</div>
          <Segmente label={tr("Renforcement")} valeur={renfo} onChange={setRenfo} options={[{ v: 0, n: tr("Aucun") }, { v: 1, n: tr("1 par semaine") }, { v: 2, n: tr("2 par semaine") }]} />
          <p className="mt-2 px-1 text-[12.5px] leading-snug text-muted-foreground">{hyrox
            ? tr("35 min de force pour les ateliers : fentes, port de charges, thrusters, squat, rowing. Elles arrivent dans Mes séances.")
            : tr("25 min de mollets, fessiers, ischios et gainage : c'est ce qui protège le plus des blessures quand on le fait régulièrement.")}</p>
        </section>

        <section className="rounded-[24px] border border-plate/40 bg-plate-soft/60 p-4">
          <div className="flex items-baseline justify-between">
            <h2 className="text-[17px] font-bold">{tr("Ton plan")}</h2>
            <span className="text-[13px] text-muted-foreground"><b className="num text-[16px] text-foreground">{cal.semaines}</b>{" "}{tr("semaines")}</span>
          </div>
          {cal.debut > auj && <p className="mt-1 text-[13px] text-muted-foreground">{tr("Il démarre le lundi {a}. D'ici là, 2 ou 3 footings faciles par semaine.", { a: new Date(cal.debut + "T12:00").toLocaleDateString(loc(), { day: "numeric", month: "long" }) })}</p>}
          <div className="mt-3 grid grid-cols-2 gap-2 text-[13px]">
            <div className="rounded-xl bg-card p-2.5"><div className="text-muted-foreground">{tr("Chrono estimé")}</div><div className="num text-[19px] font-bold">{chronoTxt(prevu)}</div></div>
            {hyrox ? (
              <>
                <div className="rounded-xl bg-card p-2.5"><div className="text-muted-foreground">{tr("Allure Hyrox")}</div><div className="num text-[19px] font-bold">{allureTxt(allureHyrox(A))}</div></div>
                <div className="rounded-xl bg-card p-2.5"><div className="text-muted-foreground">{tr("Ateliers")}</div><div className="num text-[19px] font-bold">≈ {Math.round(tempsAteliers(V) / 60)} min</div></div>
              </>
            ) : <div className="rounded-xl bg-card p-2.5"><div className="text-muted-foreground">{tr("Seuil")}</div><div className="num text-[19px] font-bold">{allureTxt(A.seuil)}</div></div>}
            <div className="rounded-xl bg-card p-2.5"><div className="text-muted-foreground">{tr("Footing")}</div><div className="num text-[19px] font-bold">{allureTxt(A.facile)}</div></div>
            {!hyrox && <div className="rounded-xl bg-card p-2.5"><div className="text-muted-foreground">{tr("Fractionné")}</div><div className="num text-[19px] font-bold">{allureTxt(A.vma)}</div></div>}
          </div>
          {alerte && <p className="mt-3 flex gap-2 rounded-xl bg-amber-500/12 p-2.5 text-[12.5px] leading-snug"><WarningIcon className="mt-0.5 size-4 shrink-0 text-amber-600" weight="fill" />{alerte}</p>}
        </section>
      </div>
      <div className="fixed inset-x-0 bottom-[max(env(safe-area-inset-bottom),14px)] z-30 mx-auto max-w-[480px] px-4">
        <Button variant="plate" size="xl" className="w-full" disabled={!peut} onClick={creer}>{ex ? tr("Enregistrer les modifications") : tr("Créer mon plan")}{!ex && <ArrowRightIcon />}</Button>
      </div>
    </>
  );
}

/* ---------------- carte sur Entraînement ---------------- */
export function CarteCourse() {
  const router = useRouter();
  const etat = useRepere((s) => s.etat);
  const [auj] = useState(() => jourDe(Date.now()));
  const P = useMemo(() => (etat.COURSE ? genererPlan(etat.COURSE) : null), [etat.COURSE]);
  if (!etat.COURSE || !P) return null;
  const c = etat.COURSE, J = joursAvantCourse(c, auj);
  if (J < -7) return null;
  const k = semaineDe(c, auj, P.length), S = P[k], sorties = etat.SORTIES || [];
  const prochaine = S.seances.findIndex((x, j) => x.type !== "renfo" && !sorties.some((o) => o.s === `${k}|${j}`));
  const pause = enPause(c), avant = auj < c.debut;
  return (
    <button onClick={() => router.push("/entrainement/course", AVANT)} className="flex w-full items-center gap-3 rounded-[20px] border border-border/80 bg-card p-3.5 text-left active:bg-muted">
      <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-plate-soft text-plate-ink">
        {pause ? <PauseCircleIcon className="size-7" weight="fill" /> : <PersonSimpleRunIcon className="size-7" weight="fill" />}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[16px] leading-tight font-semibold">{DISTANCES[c.obj].nom} · {J > 0 ? tr(J === 1 ? "J-1" : "J-{n}", { n: J }) : J === 0 ? tr("c'est aujourd'hui") : tr("terminé")}</span>
        <span className="block truncate text-[12.5px] text-muted-foreground">
          {pause ? tr("Plan en pause") : avant ? tr("Le plan démarre lundi") : tr("Semaine {a}/{length} · {a1}{a2}", { a: k + 1, length: P.length, a1: NOMS_PHASE[S.phase], a2: prochaine >= 0 ? tr(" · prochaine : {a}", { a: S.seances[prochaine].titre.toLowerCase() }) : tr(" · semaine bouclée") })}
        </span>
      </span>
      <CaretRightIcon className="size-4 shrink-0 text-muted-foreground" />
    </button>
  );
}

/* ---------------- rubrique Course de l'onglet Exercices ---------------- */
const SORTIES_PLAN: [string, string][] = [
  [tr("Footing"), tr("En endurance, à une allure où tu peux parler. La base de 80 % de ton plan.")],
  [tr("Lignes droites"), tr("Quelques accélérations de 20 s après un footing, pour courir vite sans te fatiguer.")],
  [tr("Seuil"), tr("Des blocs de quelques minutes à une allure soutenue mais tenable.")],
  [tr("Fractionné"), tr("Des efforts courts et rapides, pour faire monter ta vitesse.")],
  [tr("Sortie longue"), tr("La plus longue de la semaine, en douceur. Elle augmente de 10 % au plus d'une semaine à l'autre.")],
  [tr("Allure spécifique"), tr("Des blocs à ton allure du jour J, pour qu'elle devienne naturelle.")],
  [tr("Renfo du coureur"), tr("25 minutes de renforcement pour courir mieux et éviter les blessures.")],
  [tr("Course + ateliers"), tr("Hyrox : des tours de course suivis d'un atelier (SkiErg, traîneau, burpees, wall balls…), jusqu'à la simulation complète.")],
];

/** Rubrique Course : ton plan s'il y en a un, sinon de quoi en préparer un ; les séances qu'il contient. */
export function VueCourse() {
  const router = useRouter();
  const etat = useRepere((s) => s.etat);
  const [auj] = useState(() => jourDe(Date.now()));
  const enCours = !!etat.COURSE && joursAvantCourse(etat.COURSE, auj) >= -7;
  return (
    <div className="flex flex-col gap-5">
      {enCours ? (
        <section className="flex flex-col gap-2">
          <h3 className="px-1 text-[19px] font-bold">{tr("Ton plan")}</h3>
          <CarteCourse />
        </section>
      ) : (
        <div className="rounded-[22px] bg-bandeau p-5 text-bandeau-foreground">
          <PersonSimpleRunIcon className="size-8" weight="fill" />
          <h3 className="mt-2 text-[22px] leading-tight font-bold">{tr("Prépare une course")}</h3>
          <p className="mt-1.5 text-[14px] leading-relaxed opacity-90">{tr("10 km, semi-marathon, marathon ou Hyrox : un plan jusqu'au jour J, avec tes allures calculées sur ton niveau.")}</p>
          <button onClick={() => router.push("/entrainement/assistant?type=course" as Route, AVANT)} className="mt-4 inline-flex h-11 items-center gap-2 rounded-full bg-white px-5 text-[15px] font-semibold text-[#0a0a0c] active:scale-[.97]">
            {tr("Créer mon plan")}<ArrowRightIcon className="size-4" weight="bold" />
          </button>
        </div>
      )}
      {/* les types de séances d'un plan : à déplier, plutôt qu'un onglet à part */}
      <details className="group rounded-[20px] bg-card">
        <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-3.5 text-[15px] font-semibold">
          {tr("Les séances d'un plan")}
          <CaretDownIcon className="size-4 text-muted-foreground transition-transform group-open:rotate-180" />
        </summary>
        <p className="mx-3 mb-2 rounded-[14px] bg-plate-soft p-3 text-[13px] leading-relaxed">{tr("Les séances qu'un plan enchaîne jusqu'au jour J.")}</p>
        <ul className="flex flex-col gap-1.5 px-3 pb-3">
          {SORTIES_PLAN.map(([n, d]) => (
            <li key={n} className="flex items-start gap-3 rounded-[18px] bg-card p-3">
              <span className="grid size-9 shrink-0 place-items-center rounded-[11px] bg-plate-soft text-plate-ink"><PersonSimpleRunIcon className="size-5" weight="fill" /></span>
              <span className="min-w-0">
                <span className="block text-[15px] font-semibold">{n}</span>
                <span className="block text-[12.5px] leading-snug text-muted-foreground">{d}</span>
              </span>
            </li>
          ))}
        </ul>
      </details>
    </div>
  );
}

/* ---------------- saisie d'une sortie ---------------- */
const RESSENTIS = [{ v: 4, n: tr("Facile") }, { v: 7, n: tr("Juste") }, { v: 9, n: tr("Trop dur") }];
export function SaisieSortie({ ouvert, onClose, seance, cle, dureeMin }: {
  ouvert: boolean; onClose: () => void; seance?: SeanceCourse; cle?: string; dureeMin?: number;
}) {
  const router = useRouter();
  const muter = useRepere((s) => s.muter);
  const [km, setKm] = useState(""), [min, setMin] = useState(dureeMin ? String(dureeMin) : ""), [sec, setSec] = useState("");
  const [rpe, setRpe] = useState<number | null>(null);
  const [douleur, setDouleur] = useState(false);
  const d = parseFloat(km.replace(",", ".")) || 0, t = (+min || 0) * 60 + (+sec || 0);
  const ok = d > 0 && d < 300 && t >= 60 && rpe != null;
  const valider = () => {
    if (!ok) return;
    tactile(12);
    let msg: string | null = null;
    const auj = jourDe(Date.now());
    muter((E) => {
      (E.SORTIES ??= []).push({ d: auj, km: Math.round(d * 100) / 100, sec: t, rpe: rpe!, ...(douleur ? { douleur: true } : {}), ...(cle ? { s: cle } : {}), ...(seance?.type === "course" ? { course: true } : {}) });
      if (E.COURSE && cle) msg = adapter(E.COURSE, +cle.split("|")[0], { rpe: rpe!, douleur });
    });
    if (seance?.type === "course") {
      /* jour J : le bilan de toute la préparation */
      const E = useRepere.getState().etat, debut = E.COURSE?.debut ?? "", prepa = (E.SORTIES || []).filter((x) => x.d >= debut);
      useCelebrer.getState().montrerBilan({
        titre: tr("{a} bouclé !", { a: seance.titre.replace("Jour J : ", "") }),
        cases: [
          { n: tr("minutes de course"), v: Math.round(t / 60) },
          { n: tr("km de course"), v: Math.round(d) },
          { n: tr("sorties de préparation"), v: prepa.length },
          { n: tr("km de préparation"), v: Math.round(prepa.reduce((n, x) => n + x.km, 0)), accent: true },
        ],
      });
    } else toast.success(tr("Sortie notée : {a} km à {a1}", { a: nb(Math.round(d * 10) / 10), a1: allureTxt(t / d) }), msg ? { description: msg, duration: 6000 } : undefined);
    onClose();
    if (seance?.type === "course") router.replace("/entrainement/course", ARRIERE);
  };
  return (
    <Drawer open={ouvert} onOpenChange={(o) => !o && onClose()} repositionInputs={false}>
      <DrawerContent>
        <div className="px-5 pt-2 pb-[max(env(safe-area-inset-bottom),20px)]">
          <DrawerTitle className="text-[20px] font-bold">{seance ? seance.titre : tr("Noter une sortie")}</DrawerTitle>
          <DrawerDescription className="mt-0.5 text-[13px] text-muted-foreground">{tr("Distance et temps de ta montre ou de Strava.")}</DrawerDescription>
          <div className="mt-4 grid grid-cols-3 gap-2">
            <label className="text-center text-[12px] text-muted-foreground"><input inputMode="decimal" aria-label={tr("Distance en km")} placeholder="8,5" value={km} onChange={(e) => setKm(e.target.value.replace(/[^\d.,]/g, "").slice(0, 6))} className={champ} />{tr("km")}</label>
            <label className="text-center text-[12px] text-muted-foreground"><input inputMode="numeric" aria-label={tr("Durée, minutes")} placeholder="45" value={min} onChange={(e) => setMin(e.target.value.replace(/\D/g, "").slice(0, 3))} className={champ} />{tr("min")}</label>
            <label className="text-center text-[12px] text-muted-foreground"><input inputMode="numeric" aria-label={tr("Durée, secondes")} placeholder="00" value={sec} onChange={(e) => setSec(e.target.value.replace(/\D/g, "").slice(0, 2))} className={champ} />{tr("s")}</label>
          </div>
          {d > 0 && t >= 60 && <p className="mt-2 text-center text-[13px] text-muted-foreground">{tr("Allure :")}{" "}<b className="num text-[15px] text-foreground">{allureTxt(t / d)}</b></p>}
          <div className="mt-4 mb-1 text-[12.5px] font-medium text-muted-foreground">{tr("Ressenti")}</div>
          <div role="radiogroup" aria-label={tr("Ressenti")} className="grid grid-cols-3 gap-1.5">
            {RESSENTIS.map((r) => (
              <button key={r.v} role="radio" aria-checked={rpe === r.v} onClick={() => setRpe(r.v)}
                className={cn("h-11 rounded-xl border text-[14px] font-medium", rpe === r.v ? "border-plate bg-plate-soft text-plate-ink" : "bg-background")}>{r.n}</button>
            ))}
          </div>
          <label className="mt-3 flex items-center justify-between gap-3 rounded-xl border bg-card px-3.5 py-3 text-[14px]">
            {tr("Une douleur pendant ou après ?")}
            <input type="checkbox" aria-label={tr("Douleur")} checked={douleur} onChange={(e) => setDouleur(e.target.checked)} className="size-5 accent-[var(--plate)]" />
          </label>
          <Button variant="plate" size="xl" className="mt-4 w-full" disabled={!ok} onClick={valider}>{tr("Enregistrer la sortie")}</Button>
        </div>
      </DrawerContent>
    </Drawer>
  );
}

/* ---------------- Progrès : course à pied ---------------- */
export function SectionCourse() {
  const etat = useRepere((x) => x.etat);
  const [auj] = useState(() => jourDe(Date.now()));
  const [libre, setLibre] = useState(false);
  const S = etat.SORTIES || [], c = etat.COURSE;
  if (!S.length && !c) return null;
  const lundi = lundiDe(auj);
  const semaines = Array.from({ length: 12 }, (_, i) => decaler(lundi, -7 * (11 - i)));
  const parSem = semaines.map((l) => S.filter((x) => x.d >= l && x.d <= decaler(l, 6)).reduce((n, x) => n + x.km, 0));
  const recentes = S.filter((x) => x.d >= decaler(auj, -28));
  const kmR = recentes.reduce((n, x) => n + x.km, 0), secR = recentes.reduce((n, x) => n + x.sec, 0);
  const longue = S.reduce((m, x) => Math.max(m, x.km), 0);
  const est = c ? estimation(c, S, auj) : null;
  const kmTxt = (v: number) => nb(Math.round(v * 10) / 10);
  return (
    <section>
      <div className="mb-2 flex items-baseline justify-between px-1">
        <h2 className="eyebrow">{tr("Course à pied")}</h2>
        <button onClick={() => setLibre(true)} className="text-[13px] font-semibold text-plate-ink">{tr("Noter une sortie")}</button>
      </div>
      <div className="rounded-[20px] border border-border/80 bg-card p-4">
        <div className="grid grid-cols-3 gap-2 text-center">
          {[[kmTxt(parSem[11]), tr("km cette semaine")], [kmTxt(longue), tr("km, plus longue")], [kmR ? allureTxt(secR / kmR).replace(" /km", "") : "–", tr("allure (4 sem.)")]].map(([v, n]) => (
            <div key={n}><div className="num text-[22px] leading-tight font-bold">{v}</div><div className="text-[11px] text-muted-foreground">{n}</div></div>
          ))}
        </div>
        <div className="mt-3"><Barres valeurs={semaines.map((l, i) => ({ x: new Date(l + "T12:00").toLocaleDateString(loc(), { day: "numeric", month: "short" }).replace(".", ""), y: Math.round(parSem[i] * 10) / 10 }))} unite="km" couleur="var(--feu)" /></div>
        {c && est && (
          <div className="mt-3 flex items-center justify-between gap-3 rounded-xl bg-plate-soft px-3.5 py-2.5">
            <span className="text-[13px] leading-snug">
              {tr("Chrono estimé au")}{" "}{c.obj === "hyrox" ? "Hyrox" : DISTANCES[c.obj].nom.toLowerCase()}
              <span className="block text-[11.5px] text-muted-foreground">{est.depuis ? tr("d'après ta sortie du {a}", { a: new Date(est.depuis.d + "T12:00").toLocaleDateString(loc(), { day: "numeric", month: "long" }) }) : tr("d'après ton chrono de référence")}</span>
            </span>
            <b className="num shrink-0 text-[22px]">{chronoTxt(est.sec)}</b>
          </div>
        )}
      </div>
      <SaisieSortie key={libre ? "o" : "f"} ouvert={libre} onClose={() => setLibre(false)} />
    </section>
  );
}
