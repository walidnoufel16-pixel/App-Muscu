"use client";

/* Préparation course à pied : questionnaire (dans « Créer une séance pour moi »),
   carte sur Entraînement, et feuille de saisie d'une sortie. */
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRightIcon, CaretRightIcon, PauseCircleIcon, PersonSimpleRunIcon, WarningIcon } from "@phosphor-icons/react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Drawer, DrawerContent, DrawerDescription, DrawerTitle } from "@/components/ui/drawer";
import { Segmente } from "./segmente";
import { confirmer } from "./confirmer";
import {
  adapter, allures, allureTxt, avertissement, calendrier, chronoTxt, DISTANCES, enPause, estimation, genererPlan, joursAvantCourse, semaineDe, seancesRenfo,
  tempsPrevu, vdotDe, NOMS_PHASE, type ObjectifCourse, type PlanCourse, type SeanceCourse,
} from "@/lib/logic/course";
import { dispoDeclare } from "@/lib/logic/core";
import { decaler, jourDe, lundiDe } from "@/lib/logic/historique";
import { Barres } from "./graphes";
import { useRepere } from "@/lib/store";
import { useCelebrer } from "@/lib/celebrer";
import { ARRIERE, AVANT, remplacement } from "@/lib/nav";
import { tactile } from "@/lib/repos";
import { cn } from "@/lib/utils";

const REFS = [{ km: 5, n: "5 km" }, { km: 10, n: "10 km" }, { km: 21.0975, n: "Semi" }];
const champ = "h-12 w-full rounded-xl border bg-background px-3 text-center text-[18px] font-semibold outline-none focus:border-plate num";

/* ---------------- questionnaire ---------------- */
export function QuestionnaireCourse() {
  const router = useRouter();
  const etat = useRepere((s) => s.etat);
  const muter = useRepere((s) => s.muter);
  const [auj] = useState(() => jourDe(Date.now()));
  const [obj, setObj] = useState<ObjectifCourse>("semi");
  const [date, setDate] = useState(() => decaler(auj, 7 * 14));
  const [debutant, setDebutant] = useState(false);
  const [refKm, setRefKm] = useState(10);
  const [h, setH] = useState(""), [m, setM] = useState(""), [s, setS] = useState("");
  const [jours, setJours] = useState(4);
  const [renfo, setRenfo] = useState(1);
  const sec = (+h || 0) * 3600 + (+m || 0) * 60 + (+s || 0);
  const ref = debutant || sec < 600 ? null : { km: refKm, sec };
  const cal = calendrier(obj, date, auj);
  const alerte = date > auj ? avertissement(obj, ref, cal.dispo) : "Choisis une date de course à venir.";
  const V = vdotDe({ ref }), A = allures(V), prevu = tempsPrevu(V, DISTANCES[obj].km);
  const peut = date > decaler(auj, 6) && (debutant || sec >= 600);

  const creer = async () => {
    if (etat.COURSE && !(await confirmer({ titre: "Remplacer ta préparation en cours ?", texte: `Ton plan ${DISTANCES[etat.COURSE.obj].nom.toLowerCase()} sera remplacé. Tes sorties déjà notées restent dans ton historique.`, ok: "Remplacer" }))) return;
    tactile(10);
    const plan: PlanCourse = { obj, date, debut: cal.debut, jours, renfo, ref, pauses: [], ajust: {}, cree: auj };
    muter((E) => {
      E.COURSE = plan;
      /* séances de renfo du coureur : ajoutées une fois à « Mes séances » (groupe Musculation) */
      seancesRenfo((id) => dispoDeclare(E.A, id)).slice(0, renfo).forEach((r) => { if (!E.SEANCES.some((x) => x.nom === r.nom)) E.SEANCES.push({ nom: r.nom, ex: r.ex }); });
    });
    toast.success(`Plan ${DISTANCES[obj].nom.toLowerCase()} créé : ${cal.semaines} semaines`);
    remplacement();
    router.replace("/entrainement/course", AVANT);
  };

  return (
    <>
      <div className="flex flex-col gap-6 px-4 pb-28">
        <section>
          <div className="eyebrow mb-2 px-1">Ta course</div>
          <Segmente label="Distance" valeur={obj} onChange={setObj} options={(Object.keys(DISTANCES) as ObjectifCourse[]).map((o) => ({ v: o, n: DISTANCES[o].nom }))} />
          <label className="mt-3 flex items-center justify-between gap-3 rounded-2xl border bg-card px-4 py-3 text-[15px]">
            Date de la course
            <input type="date" aria-label="Date de la course" value={date} min={decaler(auj, 7)} onChange={(e) => e.target.value && setDate(e.target.value)} className="rounded-lg border bg-background px-2 py-1.5 text-[15px]" />
          </label>
        </section>

        <section>
          <div className="eyebrow mb-2 px-1">Ton niveau</div>
          <Segmente label="Niveau" valeur={debutant ? 1 : 0} onChange={(v) => setDebutant(v === 1)} options={[{ v: 0, n: "J'ai un chrono récent" }, { v: 1, n: "Je débute" }]} />
          {!debutant ? (
            <div className="mt-3 rounded-2xl border bg-card p-3.5">
              <div className="mb-2 text-[13px] text-muted-foreground">Ton meilleur temps des 3 derniers mois, sur :</div>
              <Segmente label="Distance du chrono" valeur={refKm} onChange={setRefKm} options={REFS.map((r) => ({ v: r.km, n: r.n }))} />
              <div className="mt-3 grid grid-cols-3 items-end gap-2">
                {refKm > 10 && <label className="text-center text-[12px] text-muted-foreground"><input inputMode="numeric" aria-label="Heures" placeholder="1" value={h} onChange={(e) => setH(e.target.value.replace(/\D/g, "").slice(0, 1))} className={champ} />h</label>}
                <label className={cn("text-center text-[12px] text-muted-foreground", refKm <= 10 && "col-start-1")}><input inputMode="numeric" aria-label="Minutes" placeholder="50" value={m} onChange={(e) => setM(e.target.value.replace(/\D/g, "").slice(0, 3))} className={champ} />min</label>
                <label className="text-center text-[12px] text-muted-foreground"><input inputMode="numeric" aria-label="Secondes" placeholder="00" value={s} onChange={(e) => setS(e.target.value.replace(/\D/g, "").slice(0, 2))} className={champ} />s</label>
              </div>
            </div>
          ) : (
            <p className="mt-2 px-1 text-[13px] leading-snug text-muted-foreground">Le plan part de footings courts et monte doucement. Tes allures se préciseront dès tes premières sorties.</p>
          )}
        </section>

        <section>
          <div className="eyebrow mb-2 px-1">Sorties par semaine</div>
          <Segmente label="Sorties par semaine" valeur={jours} onChange={setJours} options={[3, 4, 5].map((j) => ({ v: j, n: `${j} sorties` }))} />
        </section>
        <section>
          <div className="eyebrow mb-2 px-1">Renforcement du coureur</div>
          <Segmente label="Renforcement" valeur={renfo} onChange={setRenfo} options={[{ v: 0, n: "Aucun" }, { v: 1, n: "1 par semaine" }, { v: 2, n: "2 par semaine" }]} />
          <p className="mt-2 px-1 text-[12.5px] leading-snug text-muted-foreground">25 min de mollets, fessiers, ischios et gainage : c&apos;est ce qui protège le plus des blessures quand on le fait régulièrement.</p>
        </section>

        <section className="rounded-[24px] border border-plate/40 bg-plate-soft/60 p-4">
          <div className="flex items-baseline justify-between">
            <h2 className="text-[17px] font-bold">Ton plan</h2>
            <span className="text-[13px] text-muted-foreground"><b className="num text-[16px] text-foreground">{cal.semaines}</b> semaines</span>
          </div>
          {cal.debut > auj && <p className="mt-1 text-[13px] text-muted-foreground">Il démarre le lundi {new Date(cal.debut + "T12:00").toLocaleDateString("fr-FR", { day: "numeric", month: "long" })}. D&apos;ici là, 2 ou 3 footings faciles par semaine.</p>}
          <div className="mt-3 grid grid-cols-2 gap-2 text-[13px]">
            <div className="rounded-xl bg-card p-2.5"><div className="text-muted-foreground">Chrono estimé</div><div className="num text-[19px] font-bold">{chronoTxt(prevu)}</div></div>
            <div className="rounded-xl bg-card p-2.5"><div className="text-muted-foreground">Footing</div><div className="num text-[19px] font-bold">{allureTxt(A.facile)}</div></div>
            <div className="rounded-xl bg-card p-2.5"><div className="text-muted-foreground">Seuil</div><div className="num text-[19px] font-bold">{allureTxt(A.seuil)}</div></div>
            <div className="rounded-xl bg-card p-2.5"><div className="text-muted-foreground">Fractionné</div><div className="num text-[19px] font-bold">{allureTxt(A.vma)}</div></div>
          </div>
          {alerte && <p className="mt-3 flex gap-2 rounded-xl bg-amber-500/12 p-2.5 text-[12.5px] leading-snug"><WarningIcon className="mt-0.5 size-4 shrink-0 text-amber-600" weight="fill" />{alerte}</p>}
        </section>
      </div>
      <div className="fixed inset-x-0 bottom-[max(env(safe-area-inset-bottom),14px)] z-30 mx-auto max-w-[480px] px-4">
        <Button variant="plate" size="xl" className="w-full" disabled={!peut} onClick={creer}>Créer mon plan<ArrowRightIcon /></Button>
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
        <span className="block text-[16px] leading-tight font-semibold">{DISTANCES[c.obj].nom} · {J > 0 ? `J-${J}` : J === 0 ? "c'est aujourd'hui" : "terminé"}</span>
        <span className="block truncate text-[12.5px] text-muted-foreground">
          {pause ? "Plan en pause" : avant ? "Le plan démarre lundi" : `Semaine ${k + 1}/${P.length} · ${NOMS_PHASE[S.phase]}${prochaine >= 0 ? ` · prochaine : ${S.seances[prochaine].titre.toLowerCase()}` : " · semaine bouclée"}`}
        </span>
      </span>
      <CaretRightIcon className="size-4 shrink-0 text-muted-foreground" />
    </button>
  );
}

/* ---------------- saisie d'une sortie ---------------- */
const RESSENTIS = [{ v: 4, n: "Facile" }, { v: 7, n: "Juste" }, { v: 9, n: "Trop dur" }];
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
        titre: `${seance.titre.replace("Jour J : ", "")} bouclé !`,
        cases: [
          { n: "minutes de course", v: Math.round(t / 60) },
          { n: "km de course", v: Math.round(d) },
          { n: "sorties de préparation", v: prepa.length },
          { n: "km de préparation", v: Math.round(prepa.reduce((n, x) => n + x.km, 0)), accent: true },
        ],
      });
    } else toast.success(`Sortie notée : ${String(Math.round(d * 10) / 10).replace(".", ",")} km à ${allureTxt(t / d)}`, msg ? { description: msg, duration: 6000 } : undefined);
    onClose();
    if (seance?.type === "course") router.replace("/entrainement/course", ARRIERE);
  };
  return (
    <Drawer open={ouvert} onOpenChange={(o) => !o && onClose()} repositionInputs={false}>
      <DrawerContent>
        <div className="px-5 pt-2 pb-[max(env(safe-area-inset-bottom),20px)]">
          <DrawerTitle className="text-[20px] font-bold">{seance ? seance.titre : "Noter une sortie"}</DrawerTitle>
          <DrawerDescription className="mt-0.5 text-[13px] text-muted-foreground">Distance et temps de ta montre ou de Strava.</DrawerDescription>
          <div className="mt-4 grid grid-cols-3 gap-2">
            <label className="text-center text-[12px] text-muted-foreground"><input inputMode="decimal" aria-label="Distance en km" placeholder="8,5" value={km} onChange={(e) => setKm(e.target.value.replace(/[^\d.,]/g, "").slice(0, 6))} className={champ} />km</label>
            <label className="text-center text-[12px] text-muted-foreground"><input inputMode="numeric" aria-label="Durée, minutes" placeholder="45" value={min} onChange={(e) => setMin(e.target.value.replace(/\D/g, "").slice(0, 3))} className={champ} />min</label>
            <label className="text-center text-[12px] text-muted-foreground"><input inputMode="numeric" aria-label="Durée, secondes" placeholder="00" value={sec} onChange={(e) => setSec(e.target.value.replace(/\D/g, "").slice(0, 2))} className={champ} />s</label>
          </div>
          {d > 0 && t >= 60 && <p className="mt-2 text-center text-[13px] text-muted-foreground">Allure : <b className="num text-[15px] text-foreground">{allureTxt(t / d)}</b></p>}
          <div className="mt-4 mb-1 text-[12.5px] font-medium text-muted-foreground">Ressenti</div>
          <div role="radiogroup" aria-label="Ressenti" className="grid grid-cols-3 gap-1.5">
            {RESSENTIS.map((r) => (
              <button key={r.v} role="radio" aria-checked={rpe === r.v} onClick={() => setRpe(r.v)}
                className={cn("h-11 rounded-xl border text-[14px] font-medium", rpe === r.v ? "border-plate bg-plate-soft text-plate-ink" : "bg-background")}>{r.n}</button>
            ))}
          </div>
          <label className="mt-3 flex items-center justify-between gap-3 rounded-xl border bg-card px-3.5 py-3 text-[14px]">
            Une douleur pendant ou après ?
            <input type="checkbox" aria-label="Douleur" checked={douleur} onChange={(e) => setDouleur(e.target.checked)} className="size-5 accent-[var(--plate)]" />
          </label>
          <Button variant="plate" size="xl" className="mt-4 w-full" disabled={!ok} onClick={valider}>Enregistrer la sortie</Button>
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
  const kmTxt = (v: number) => String(Math.round(v * 10) / 10).replace(".", ",");
  return (
    <section>
      <div className="mb-2 flex items-baseline justify-between px-1">
        <h2 className="eyebrow">Course à pied</h2>
        <button onClick={() => setLibre(true)} className="text-[13px] font-semibold text-plate-ink">Noter une sortie</button>
      </div>
      <div className="rounded-[20px] border border-border/80 bg-card p-4">
        <div className="grid grid-cols-3 gap-2 text-center">
          {[[kmTxt(parSem[11]), "km cette semaine"], [kmTxt(longue), "km, plus longue"], [kmR ? allureTxt(secR / kmR).replace(" /km", "") : "–", "allure (4 sem.)"]].map(([v, n]) => (
            <div key={n}><div className="num text-[22px] leading-tight font-bold">{v}</div><div className="text-[11px] text-muted-foreground">{n}</div></div>
          ))}
        </div>
        <div className="mt-3"><Barres valeurs={semaines.map((l, i) => ({ x: new Date(l + "T12:00").toLocaleDateString("fr-FR", { day: "numeric", month: "short" }).replace(".", ""), y: Math.round(parSem[i] * 10) / 10 }))} unite="km" couleur="var(--plate)" /></div>
        {c && est && (
          <div className="mt-3 flex items-center justify-between gap-3 rounded-xl bg-plate-soft px-3.5 py-2.5">
            <span className="text-[13px] leading-snug">
              Chrono estimé au {DISTANCES[c.obj].nom.toLowerCase()}
              <span className="block text-[11.5px] text-muted-foreground">{est.depuis ? `d'après ta sortie du ${new Date(est.depuis.d + "T12:00").toLocaleDateString("fr-FR", { day: "numeric", month: "long" })}` : "d'après ton chrono de référence"}</span>
            </span>
            <b className="num shrink-0 text-[22px]">{chronoTxt(est.sec)}</b>
          </div>
        )}
      </div>
      <SaisieSortie key={libre ? "o" : "f"} ouvert={libre} onClose={() => setLibre(false)} />
    </section>
  );
}
