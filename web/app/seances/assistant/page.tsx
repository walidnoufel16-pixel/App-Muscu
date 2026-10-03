"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EnTete } from "@/components/repere/en-tete";
import { SchemaCorps } from "@/components/repere/schema-corps";
import { FiltreMateriel } from "@/components/repere/filtre-materiel";
import { Segmente } from "@/components/repere/segmente";
import { dire } from "@/components/repere/confirmer";
import { DUREES, FULLBODY, MUSC, OBJS, PAT2MUSC } from "@/lib/data/referentiels";
import { selDeclare } from "@/lib/logic/core";
import { construireSeance, nomSeance } from "@/lib/logic/assistant";
import { useRepere } from "@/lib/store";
import { useBrouillon } from "@/lib/brouillon";
import { tactile } from "@/lib/repos";
import { cn } from "@/lib/utils";

export default function PageAssistant() {
  const router = useRouter();
  const A = useRepere((s) => s.etat.A);
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
    const ex = construireSeance(m, d, obj, sel);
    if (!ex.length) { dire("Pas d'exercice disponible", "Aucun exercice ne correspond à ces muscles avec le matériel coché. Ajoute du matériel ou choisis d'autres muscles."); return; }
    setLibre({ nom: nomSeance(m), ex, idx: null, obj, gen: { m: [...m], d, obj } });
    router.push("/seances/composer/");
  };

  return (
    <>
      <EnTete
        surtitre="Séance sur mesure"
        titre="Créer une séance pour moi"
        gauche={<Button variant="ghost" size="sm" className="-ml-2 text-[15px]" onClick={() => router.push("/seances/")}><ChevronLeft className="size-5" />Séances</Button>}
      >
        <p className="mt-2 text-[15px] leading-relaxed text-muted-foreground">Choisis ce que tu veux travailler : Repère te propose une séance, que tu modifies ensuite comme tu veux.</p>
      </EnTete>

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
      </div>

      <div className="fixed inset-x-0 bottom-[calc(max(env(safe-area-inset-bottom),10px)+80px)] z-30 mx-auto max-w-[480px] px-4">
        <Button variant="plate" size="xl" className="w-full" disabled={!peut} onClick={creer}>
          Créer ma séance
        </Button>
      </div>
    </>
  );
}
