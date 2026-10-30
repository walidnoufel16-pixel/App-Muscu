"use client";

import { tr } from "@/lib/i18n";
import { useRouter } from "next/navigation";
import { ArrowRightIcon, CaretRightIcon, CheckIcon, PlusIcon, SparkleIcon } from "@phosphor-icons/react";
import { useState } from "react";
import { Drawer, DrawerContent, DrawerDescription, DrawerTitle } from "@/components/ui/drawer";
import { musclesDe } from "@/lib/logic/core";
import { Segmente } from "./segmente";
import { toast } from "sonner";
import { EX } from "@/lib/data/exercices";
import { FAMILLES_STREET, MATERIEL_STREET, niveauConseille, PROGRAMMES_STREET, testARefaire, type ProgrammeStreet } from "@/lib/data/street";
import { jourDe } from "@/lib/logic/historique";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useRepere } from "@/lib/store";
import { useBrouillon } from "@/lib/brouillon";
import { AVANT } from "@/lib/nav";
import { LigneExercice } from "./ligne-exercice";
import { Vignette } from "./exercice-carte";

/* Test d'entrée : tractions, pompes, dips et squats au maximum, une fois ; il conseille un
   niveau et revient toutes les 6 semaines pour mesurer les progrès. */
function TestEntree() {
  const muter = useRepere((s) => s.muter);
  const tests = useRepere((s) => s.etat.A.testsStreet);
  const dernier = tests?.at(-1), avant = tests?.at(-2);
  const [ouvert, setOuvert] = useState(false);
  const [v, setV] = useState({ tr: "", po: "", di: "", sq: "" });
  const [auj] = useState(() => jourDe(Date.now()));
  const champs: [keyof typeof v, string][] = [["tr", tr("Tractions")], ["po", tr("Pompes")], ["di", tr("Dips")], ["sq", tr("Squats")]];
  const ok = champs.every(([k]) => v[k] !== "");
  const valider = () => {
    const t = { d: auj, tr: +v.tr, po: +v.po, di: +v.di, sq: +v.sq };
    muter((E) => { E.A.testsStreet = [...(E.A.testsStreet || []), t].slice(-12); });
    const p = PROGRAMMES_STREET.find((x) => x.niv === niveauConseille(t))!;
    toast.success(tr("Niveau conseillé : {nom}", { nom: p.nom }));
    setOuvert(false); setV({ tr: "", po: "", di: "", sq: "" });
  };
  return (
    <div className="rounded-[22px] bg-plate p-4 text-plate-foreground">
      <div className="text-[11.5px] font-semibold tracking-[0.12em] uppercase opacity-80">{tr("Test d'entrée")}</div>
      {dernier ? (
        <>
          <div className="mt-1 grid grid-cols-4 gap-1.5 text-center">
            {champs.map(([k, n]) => (
              <div key={k} className="rounded-xl bg-white/12 py-1.5">
                <div className="num text-[20px] font-bold">{dernier[k]}</div>
                <div className="text-[11px] opacity-85">{n}</div>
                {avant && dernier[k] !== avant[k] && <div className="text-[10.5px] font-semibold opacity-90">{dernier[k] > avant[k] ? "+" : ""}{dernier[k] - avant[k]}</div>}
              </div>
            ))}
          </div>
          <p className="mt-2 text-[13px] opacity-90">{testARefaire(dernier, auj) ? tr("6 semaines depuis ton dernier test : refais-le pour mesurer tes progrès.") : tr("Prochain test dans 6 semaines, après ta semaine légère.")}</p>
        </>
      ) : (
        <p className="mt-1 text-[14px] leading-relaxed opacity-90">{tr("Fais une fois ton maximum en tractions, pompes, dips et squats : Repère te conseille le bon niveau.")}</p>
      )}
      <button onClick={() => setOuvert(true)} className="mt-3 inline-flex h-10 items-center gap-2 rounded-full bg-white px-4 text-[14px] font-semibold text-[#2346c4] active:scale-[.97]">
        {dernier ? tr("Refaire le test") : tr("Faire le test")}<ArrowRightIcon className="size-4" weight="bold" />
      </button>
      <Drawer open={ouvert} onOpenChange={setOuvert} repositionInputs={false}>
        <DrawerContent>
          <div className="px-5 pt-2 pb-[max(env(safe-area-inset-bottom),20px)]">
            <DrawerTitle className="text-[20px] font-bold">{tr("Test d'entrée")}</DrawerTitle>
            <DrawerDescription className="mt-0.5 text-[13.5px] text-muted-foreground">{tr("Échauffe-toi, puis une série au maximum de chaque, en répétitions propres, avec 3 minutes de repos entre deux. 0 si tu n'y arrives pas encore.")}</DrawerDescription>
            <div className="mt-4 grid grid-cols-2 gap-2">
              {champs.map(([k, n]) => (
                <label key={k} className="text-[13px] font-medium text-muted-foreground">{n}
                  <Input inputMode="numeric" value={v[k]} onChange={(e) => setV({ ...v, [k]: e.target.value.replace(/\D/g, "").slice(0, 3) })} placeholder="0" className="num mt-1 h-12 rounded-2xl text-center text-[22px] font-bold text-foreground" />
                </label>
              ))}
            </div>
            <Button variant="plate" size="xl" className="mt-4 w-full" disabled={!ok} onClick={valider}>{tr("Voir mon niveau")}</Button>
          </div>
        </DrawerContent>
      </Drawer>
    </div>
  );
}

/* Ajoute les séances d'un niveau à Mes séances (groupe Street workout), sans doublon,
   puis ouvre la première. */
export function useAjouterProgramme() {
  const router = useRouter();
  const muter = useRepere((s) => s.muter);
  return (p: ProgrammeStreet) => {
    const ajoutees = p.seances.filter((s) => !useRepere.getState().etat.SEANCES.some((x) => x.street === `${p.niv}-${s.k}`)).length;
    muter((E) => {
      p.seances.forEach((s) => {
        const cle = `${p.niv}-${s.k}`;
        if (!E.SEANCES.some((x) => x.street === cle)) E.SEANCES.push({ nom: `${s.k} · ${s.nom}`, ex: s.ex.map((e) => ({ ...e })), street: cle });
      });
    });
    if (ajoutees) toast.success(tr("Programme {nom} : {n} séances ajoutées à Mes séances", { nom: p.nom, n: ajoutees }));
    const i = useRepere.getState().etat.SEANCES.findIndex((x) => x.street === `${p.niv}-A`);
    router.push(`/entrainement/seance?l=${i}`, AVANT);
  };
}

function CarteProgramme({ p, onFiche, conseille }: { p: ProgrammeStreet; onFiche: (id: string) => void; conseille: boolean }) {
  const ajouter = useAjouterProgramme();
  const deja = useRepere((s) => p.seances.every((x) => s.etat.SEANCES.some((y) => y.street === `${p.niv}-${x.k}`)));
  const [apercu, setApercu] = useState<string | null>(null); // séance montrée sans être ajoutée
  return (
    <div className={cn("rounded-[22px] border bg-card p-3.5", conseille ? "border-plate ring-2 ring-plate/25" : "border-border/80")}>
      {conseille && <div className="mb-2 inline-flex rounded-full bg-plate px-2.5 py-0.5 text-[11.5px] font-semibold text-plate-foreground">{tr("Conseillé d'après ton test")}</div>}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-[17px] font-bold tracking-[-0.01em]">{p.nom}</div>
          <p className="mt-0.5 text-[13px] leading-snug text-muted-foreground">{p.but}</p>
        </div>
        <span className="shrink-0 rounded-full bg-plate-soft px-2.5 py-1 text-[11.5px] font-semibold text-plate-ink">{tr("{n} séances / sem.", { n: p.seances.length })}</span>
      </div>
      <dl className="mt-2.5 grid grid-cols-3 gap-1.5 text-[11.5px] leading-tight">
        {[[tr("Pour"), p.pour], [tr("Objectif"), p.objectif], [tr("Répétitions"), p.fourchette]].map(([t, v]) => (
          <div key={t} className="rounded-xl bg-muted/70 px-2 py-1.5"><dt className="text-muted-foreground">{t}</dt><dd className="mt-0.5 font-semibold">{v}</dd></div>
        ))}
      </dl>
      <ol className="mt-3 flex flex-col gap-0.5">
        {p.seances.map((s) => (
          <li key={s.k}>
            <button onClick={() => setApercu(s.k)} aria-label={tr("Voir la séance {k} · {nom}", { k: s.k, nom: s.nom })} className="-mx-1.5 flex w-[calc(100%+12px)] items-center gap-2.5 rounded-xl px-1.5 py-1 text-left active:bg-muted">
              <span className="flex -space-x-2.5">{s.ex.slice(0, 3).map((e) => <Vignette key={e.id} id={e.id} className="size-8 rounded-[9px] ring-2 ring-card" />)}</span>
              <span className="min-w-0 flex-1 truncate text-[13.5px]"><b className="font-semibold">{s.k}</b>{" · "}{s.nom}</span>
              <span className="text-[12px] text-muted-foreground">{tr("{n} exos", { n: s.ex.length })}</span>
              <CaretRightIcon className="size-4 shrink-0 text-muted-foreground" />
            </button>
          </li>
        ))}
      </ol>
      <button onClick={() => ajouter(p)} className="mt-3 flex h-11 w-full items-center justify-center gap-2 rounded-full bg-plate text-[14.5px] font-semibold text-plate-foreground active:scale-[.98]">
        {deja ? <CheckIcon className="size-4" weight="bold" /> : <PlusIcon className="size-4" weight="bold" />}
        {deja ? tr("Dans Mes séances · ouvrir la séance A") : tr("Ajouter à mes séances")}
      </button>
      <ApercuProgramme p={p} k={apercu} setK={setApercu} deja={deja} onAjouter={() => { setApercu(null); ajouter(p); }} onFiche={onFiche} />
    </div>
  );
}

/* Aperçu d'un programme, séance par séance, sans rien ajouter à Mes séances. */
function ApercuProgramme({ p, k, setK, deja, onAjouter, onFiche }: { p: ProgrammeStreet; k: string | null; setK: (k: string | null) => void; deja: boolean; onAjouter: () => void; onFiche: (id: string) => void }) {
  const s = p.seances.find((x) => x.k === k);
  return (
    <Drawer open={!!s} onOpenChange={(o) => !o && setK(null)}>
      <DrawerContent className="max-h-[92dvh]">
        {s && (
          <div className="flex min-h-0 flex-col">
            <div className="px-5 pt-2">
              <DrawerTitle className="text-[20px] font-bold">{tr("Programme {nom}", { nom: p.nom.toLowerCase() })}</DrawerTitle>
              <DrawerDescription className="mt-0.5 text-[13px] text-muted-foreground">{tr("Séance {k} · {nom}", { k: s.k, nom: s.nom })}</DrawerDescription>
              <Segmente className="mt-3" label={tr("Séance")} valeur={s.k} onChange={setK} options={p.seances.map((x) => ({ v: x.k, n: x.k }))} />
            </div>
            <ol className="mt-3 flex min-h-0 flex-col gap-1.5 overflow-y-auto px-4 pb-3" aria-label={tr("Exercices de la séance {k}", { k: s.k })}>
              {s.ex.map((e, i) => {
                const x = EX[e.id];
                if (!x) return null;
                const prescr = x.ch === "temps" ? `${e.s} × ${e.r} s` : x.ch === "dist" ? `${e.s} × ${e.r} m` : `${e.s} × ${e.r}`;
                return (
                  <li key={e.id + i}>
                    <button onClick={() => onFiche(e.id)} className="flex w-full items-center gap-3 rounded-[18px] border border-border/80 bg-card p-2.5 text-left active:scale-[.99]">
                      <Vignette id={e.id} num={i + 1} className="size-14" />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[15px] font-semibold">{x.n}</span>
                        <span className="block truncate text-[12.5px] text-muted-foreground">{musclesDe([e.id]).join(" · ")}</span>
                        <span className="num block text-[14px] font-semibold text-foreground/80">{prescr}<span className="font-sans text-[12px] font-normal text-muted-foreground">{" "}{tr("· repos {repos}", { repos: e.p })}</span></span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ol>
            <div className="border-t border-border/70 px-4 pt-3 pb-[max(env(safe-area-inset-bottom),16px)]">
              <button onClick={onAjouter} className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-plate text-[15px] font-semibold text-plate-foreground active:scale-[.98]">
                {deja ? <CheckIcon className="size-4" weight="bold" /> : <PlusIcon className="size-4" weight="bold" />}
                {deja ? tr("Dans Mes séances · ouvrir la séance A") : tr("Ajouter le programme à mes séances")}
              </button>
            </div>
          </div>
        )}
      </DrawerContent>
    </Drawer>
  );
}

/* Onglet « Street » de la bibliothèque : programmes par niveau, séance sur mesure, familles d'exercices. */
export type OngletStreet = "programmes" | "mesure" | "familles";

export function VueStreet({ onFiche, onglet }: { onFiche: (id: string) => void; onglet: OngletStreet }) {
  const router = useRouter();
  const setSel = useBrouillon((s) => s.setSel);
  const surMesure = () => { setSel(MATERIEL_STREET); router.push("/entrainement/assistant", AVANT); };
  const dernier = useRepere((s) => s.etat.A.testsStreet?.at(-1));
  const conseil = dernier ? niveauConseille(dernier) : null;
  if (onglet === "programmes")
    return (
      <section aria-label={tr("Programmes street workout")} className="flex flex-col gap-2.5">
        <TestEntree />
        {PROGRAMMES_STREET.map((p) => <CarteProgramme key={p.niv} p={p} onFiche={onFiche} conseille={p.niv === conseil} />)}
        <div className="rounded-[18px] bg-plate-soft p-3.5 text-[13px] leading-relaxed">
          <b className="font-semibold">{tr("Comment progresser")}</b>
          <ul className="mt-1 flex list-disc flex-col gap-1 pl-4">
            <li>{tr("Chaque exercice a une fourchette de répétitions. Quand toutes tes séries atteignent le haut de la fourchette, passe à la variante suivante de sa famille (indiquée dans sa fiche).")}</li>
            <li>{tr("Enchaîne le tirage et la poussée de la séance, puis récupère : la séance tient en 40 à 50 minutes.")}</li>
            <li>{tr("Toutes les 5 à 6 semaines, fais une semaine légère (moitié des séries), puis refais le test.")}</li>
          </ul>
        </div>
      </section>
    );
  if (onglet === "mesure")
    return (
      <div className="rounded-[22px] bg-plate p-5 text-plate-foreground">
        <SparkleIcon className="size-8" weight="fill" />
        <h3 className="mt-2 text-[22px] leading-tight font-bold">{tr("Une séance street sur mesure")}</h3>
        <p className="mt-1.5 text-[14px] leading-relaxed opacity-90">{tr("Tu choisis les muscles et la durée, Repère compose avec le poids du corps et la barre.")}</p>
        <button onClick={surMesure} className="mt-4 inline-flex h-11 items-center gap-2 rounded-full bg-white px-5 text-[15px] font-semibold text-[#2346c4] active:scale-[.97]">
          {tr("Composer ma séance")}<ArrowRightIcon className="size-4" weight="bold" />
        </button>
      </div>
    );
  return (
    <div className="flex flex-col gap-6">
      <p className="rounded-[18px] bg-plate-soft p-3.5 text-[13.5px] leading-relaxed">
        {tr("Chaque famille est rangée de la variante la plus facile à la plus dure : quand tu atteins le haut de ta fourchette de répétitions, passe à l'étape suivante.")}
      </p>
      {FAMILLES_STREET.map((f) => (
        <section key={f.k} aria-label={f.n}>
          <h3 className="mb-2 px-1 text-[19px] font-bold">{f.n}</h3>
          <div className="flex flex-col gap-1.5">
            {f.ex.filter((o) => EX[o]).map((o, i) => (
              <div key={o} className="flex items-center gap-2">
                <span className="num w-5 shrink-0 text-center text-[13px] font-bold text-muted-foreground">{i + 1}</span>
                <div className="min-w-0 flex-1"><LigneExercice id={o} onOuvrir={() => onFiche(o)} /></div>
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
