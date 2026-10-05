"use client";

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
import { Segmente } from "@/components/repere/segmente";
import { dire } from "@/components/repere/confirmer";
import { DUREES, FULLBODY, MUSC, OBJS, PAT2MUSC } from "@/lib/data/referentiels";
import { selDeclare } from "@/lib/logic/core";
import { construireSeance, nomSeance } from "@/lib/logic/assistant";
import { zonesActives, zonesDe } from "@/lib/logic/forme";
import { useRepere } from "@/lib/store";
import { ARRIERE, AVANT, remplacement, revenirA } from "@/lib/nav";
import { Retour } from "@/components/repere/retour";
import { useBrouillon } from "@/lib/brouillon";
import { tactile } from "@/lib/repos";
import { cn } from "@/lib/utils";

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
  const [type, setType] = useState<"muscu" | "cardio" | "mixte" | "course">(typeUrl === "cardio" || typeUrl === "mixte" || typeUrl === "course" ? typeUrl : "muscu");
  const [choix, setChoix] = useState<ChoixCardio>(() => { const n = niveauDe(A.regularite); return { f: "fractionne", m: "tapis", n, r: reglagesDe("fractionne", n) }; });
  const [nomCardio, setNomCardio] = useState("");
  /* Enregistrer la séance cardio ; avec `demarrer`, son minuteur s'ouvre aussitôt (à la place de l'assistant). */
  const creerCardio = (demarrer = false) => {
    const nom = nomCardio.trim().slice(0, 60) || nomSeanceCardio(choix.f, choix.m);
    const i = useRepere.getState().etat.SEANCES_CARDIO?.length ?? 0;
    muter((E) => { (E.SEANCES_CARDIO ??= []).push({ nom, ...choix }); });
    toast.success(`« ${nom} » ajoutée à tes séances cardio`);
    if (demarrer) { preparer(); remplacement(); router.replace(`/entrainement/cardio?s=${i}&go=1` as Route, AVANT); return; }
    revenirA("/entrainement", () => router.replace("/entrainement", ARRIERE));
  };
  const { sel: selB, setSel, setLibre } = useBrouillon();
  const sel = selB ?? selDeclare(A);
  const [m, setM] = useState<string[]>([]);
  const [vue, setVue] = useState<"corps" | "liste">("corps");
  const [d, setD] = useState(45);
  const [obj, setObj] = useState<number | null>(A.objectif ?? null);

  const bascule = (k: string) => { tactile(6); setM((l) => (l.includes(k) ? l.filter((x) => x !== k) : [...l, k])); };
  const noms = m.map((k) => MUSC.find((g) => g.k === k)!.n);
  const budget = Math.round((DUREES.find((x) => x[0] === d) || DUREES[1])[1] / 3);
  const peut = m.length > 0 && obj != null && sel.length > 0;

  const creer = () => {
    if (obj == null) return;
    const zones = zonesActives(A);
    const ex = construireSeance(m, d, obj, sel, Math.random, (o) => zonesDe(o, zones).length > 0);
    if (!ex.length) { dire("Pas d'exercice disponible", "Aucun exercice ne correspond à ces muscles avec le matériel coché. Ajoute du matériel ou choisis d'autres muscles."); return; }
    /* combinée : le bloc cardio arrive à la fin, sans échauffement ; il se déplace ensuite dans le composeur */
    const blocs = type === "mixte" ? [{ ...nouveauBloc(ex.length, choix.f, choix.m, choix.n), r: { ...choix.r, echauf: 0 } }] : undefined;
    setLibre({ nom: nomSeance(m) + (blocs ? " + cardio" : ""), ex, idx: null, obj, gen: { m: [...m], d, obj }, ...(blocs ? { blocs } : {}) });
    router.push("/entrainement/composer", AVANT);
  };

  return (
    <>
      <EnTete
        surtitre="Séance sur mesure"
        titre="Créer une séance pour moi"
        gauche={<Retour repli="/entrainement" />}
      >
        <p className="mt-2 text-[15px] leading-relaxed text-muted-foreground">
          {type === "muscu"
            ? "Choisis ce que tu veux travailler : Repère te propose une séance, que tu modifies ensuite comme tu veux."
            : type === "mixte"
              ? "De la musculation et un bloc cardio dans la même séance. Le bloc se place où tu veux : avant, entre deux exercices ou à la fin."
              : type === "course"
                ? "Un plan de préparation pour ta course : allures calculées sur ton niveau, montée progressive, affûtage avant le jour J, et renfo du coureur."
                : "Une séance guidée : Repère annonce chaque effort et chaque récupération, avec un signal sonore."}
        </p>
        <Segmente label="Catégorie" className="mt-4" valeur={type} onChange={setType} options={[{ v: "muscu", n: "Muscu" }, { v: "cardio", n: "Cardio" }, { v: "mixte", n: "Combinée" }, { v: "course", n: "Course" }]} />
      </EnTete>

      {type === "course" ? (
        <QuestionnaireCourse />
      ) : type === "cardio" ? (
        <>
          <div className="flex flex-col gap-6 px-4 pb-28">
            <ReglagesCardio choix={choix} onChange={setChoix} />
            <section>
              <h2 className="eyebrow mb-2 px-1">Nom de la séance</h2>
              <Input value={nomCardio} onChange={(e) => setNomCardio(e.target.value)} maxLength={60} placeholder={nomSeanceCardio(choix.f, choix.m)} className="h-12 rounded-2xl bg-card text-[16px]" />
            </section>
          </div>
          <div className="fixed inset-x-0 bottom-[max(env(safe-area-inset-bottom),14px)] z-30 mx-auto max-w-[480px] px-4">
            <div className="flex gap-2">
              <Button variant="soft" size="xl" className="flex-1 border border-border/80 bg-card" onClick={() => creerCardio()}>Enregistrer</Button>
              <Button variant="plate" size="xl" className="flex-[1.4]" onClick={() => creerCardio(true)}>Créer et démarrer</Button>
            </div>
          </div>
        </>
      ) : (
      <>
      <div className="flex flex-col gap-6 px-4 pb-24">
        <section>
          <div className="mb-2 flex items-baseline justify-between px-1">
            <span className="eyebrow">Muscles{m.length ? ` · ${m.length}` : ""}</span>
            <span className="flex gap-3 text-[13px] font-medium">
              <button onClick={() => setM([...FULLBODY])} className="text-foreground">Full body</button>
              {m.length > 0 && <button onClick={() => setM([])} className="text-muted-foreground">Tout décocher</button>}
            </span>
          </div>
          <Segmente
            label="Mode de sélection"
            className="mb-2"
            valeur={vue}
            onChange={setVue}
            options={[{ v: "corps", n: "Sur le corps" }, { v: "liste", n: "Liste" }]}
          />
          {vue === "corps" ? (
            <SchemaCorps
              actif={(r) => !!(r.p && PAT2MUSC[r.p])}
              choisi={(r) => !!(r.p && m.includes(PAT2MUSC[r.p]))}
              onToucher={(r) => r.p && bascule(PAT2MUSC[r.p])}
              legende="Touche un muscle pour le cocher"
            />
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {MUSC.map((g) => {
                const on = m.includes(g.k);
                return (
                  <button
                    key={g.k}
                    aria-pressed={on}
                    onClick={() => bascule(g.k)}
                    className={cn("h-10 rounded-full border px-4 text-[14px] font-medium transition-colors", on ? "border-plate bg-plate text-plate-foreground" : "border-border bg-card")}
                  >
                    {g.n}
                  </button>
                );
              })}
            </div>
          )}
          <p className={cn("mt-2 px-1 text-[14px] font-medium", !noms.length && "text-muted-foreground")}>
            {noms.length ? noms.join(" · ") : "Aucun muscle choisi pour l'instant."}
          </p>
          {m.length > budget && (
            <p className="mt-1 px-1 text-[12.5px] leading-snug text-muted-foreground">
              Beaucoup de muscles pour {d} minutes : un exercice par muscle, avec moins de séries sur les petits groupes. Tu pourras ajuster ensuite.
            </p>
          )}
        </section>

        <section>
          <FiltreMateriel sel={sel} declare={selDeclare(A)} onChange={(s) => setSel(s)} />
        </section>

        <section>
          <div className="eyebrow mb-2 px-1">Durée</div>
          <Segmente label="Durée" valeur={d} onChange={setD} options={DUREES.map(([x]) => ({ v: x, n: `${x} min` }))} />
        </section>

        <section>
          <div className="eyebrow mb-2 px-1">Objectif de la séance</div>
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
          {obj == null && <p className="mt-2 px-1 text-[12.5px] text-muted-foreground">Choisis un objectif : il règle les répétitions, les repos et la collation.</p>}
        </section>

        {type === "mixte" && (
          <section className="rounded-[24px] border border-plate/40 bg-plate-soft/60 p-4">
            <div className="mb-3 flex items-baseline justify-between">
              <h2 className="text-[17px] font-bold">Bloc cardio</h2>
              <span className="text-[13px] text-muted-foreground">Total ≈ <b className="num text-[16px] text-foreground">{d + Math.round(dureeTotaleCardio(construireCardio(choix.f, choix.m, { ...choix.r, echauf: 0 })) / 60)} min</b></span>
            </div>
            <ReglagesCardio choix={choix} onChange={setChoix} />
            <p className="mt-3 text-[12.5px] leading-relaxed text-muted-foreground">Il est placé à la fin, sans échauffement puisque la musculation t&apos;aura chauffé. Dans le composeur, tu le déplaces où tu veux.</p>
          </section>
        )}
      </div>

      <div className="fixed inset-x-0 bottom-[max(env(safe-area-inset-bottom),14px)] z-30 mx-auto max-w-[480px] px-4">
        <Button variant="plate" size="xl" className="w-full" disabled={!peut} onClick={creer}>
          Créer ma séance
        </Button>
      </div>
      </>
      )}
    </>
  );
}
