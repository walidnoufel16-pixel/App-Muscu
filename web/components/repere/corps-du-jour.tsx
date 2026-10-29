"use client";

/* Le corps humain en tête d'Entraînement : « Qu'est-ce que tu travailles aujourd'hui ? ».
   Teinté selon les 7 derniers jours (plus c'est bleu, plus le muscle a travaillé) ; toucher des
   muscles fait apparaître « Créer ma séance », qui ouvre l'assistant avec ces muscles cochés. */
import { tr } from "@/lib/i18n";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { Route } from "next";
import { ArrowRightIcon } from "@phosphor-icons/react";
import { SchemaCorps } from "./schema-corps";
import { MUSC, PAT2MUSC } from "@/lib/data/referentiels";
import { decaler, jourDe, seriesParMuscle } from "@/lib/logic/historique";
import { useRepere } from "@/lib/store";
import { AVANT } from "@/lib/nav";
import { tactile } from "@/lib/repos";

/* les grands groupes, pour « pas encore cette semaine » (les petits muscles n'y figurent pas) */
const PRINCIPAUX = ["pec", "dos", "epa", "bic", "tri", "qua", "isc", "mol", "abd"];

export function CorpsDuJour({ titre }: { titre: string }) {
  const router = useRouter();
  const H = useRepere((s) => s.etat.HIST);
  const [m, setM] = useState<string[]>([]);
  const [auj] = useState(() => jourDe(Date.now()));
  const parM = useMemo(() => seriesParMuscle(H || [], decaler(auj, -6), auj), [H, auj]);
  const travaille = Object.values(parM).some((n) => n > 0);
  /* 16 séries dans la semaine : le bleu le plus foncé */
  const teinte = (r: { p?: string }) => { const k = r.p && PAT2MUSC[r.p]; return k && parM[k] ? Math.min(1, parM[k] / 16) : 0; };
  const nom = (k: string) => MUSC.find((g) => g.k === k)?.n ?? k;
  const restants = PRINCIPAUX.filter((k) => !parM[k]).map(nom);
  const basculer = (k: string) => { tactile(6); setM((l) => (l.includes(k) ? l.filter((x) => x !== k) : [...l, k])); };

  return (
    <section>
      <h2 className="mb-2 px-1 text-[20px] leading-tight font-bold tracking-[-0.01em]">{titre}</h2>
      {travaille && (
        <div className="mb-2 flex items-center gap-3 px-1 text-[12px] text-muted-foreground">
          <span className="flex items-center gap-1"><i className="size-3 rounded-[4px] bg-plate" />{tr("beaucoup")}</span>
          <span className="flex items-center gap-1"><i className="size-3 rounded-[4px] bg-plate/45" />{tr("un peu")}</span>
          <span className="flex items-center gap-1"><i className="size-3 rounded-[4px] bg-foreground/35" />{tr("pas encore")}</span>
          <span className="ml-auto">{tr("7 derniers jours")}</span>
        </div>
      )}
      <SchemaCorps
        actif={(r) => !!(r.p && PAT2MUSC[r.p])}
        choisi={(r) => !!(r.p && m.includes(PAT2MUSC[r.p]))}
        onToucher={(r) => r.p && PAT2MUSC[r.p] && basculer(PAT2MUSC[r.p])}
        teinte={travaille ? teinte : undefined}
        legende={tr("Touche les muscles à travailler")}
      />
      {travaille && restants.length > 0 && !m.length && (
        <p className="mt-2 rounded-2xl bg-card px-3.5 py-2.5 text-[13px] leading-snug">
          {tr("Pas encore cette semaine :")}{" "}<b className="font-semibold">{restants.slice(0, 4).join(", ").toLowerCase()}</b>
        </p>
      )}
      {m.length > 0 && (
        /* au-dessus de la barre d'onglets, tant que des muscles sont touchés */
        <div className="fixed inset-x-0 bottom-[calc(max(env(safe-area-inset-bottom),10px)+82px)] z-40 mx-auto max-w-[480px] px-4">
          <button onClick={() => router.push(`/entrainement/assistant?m=${m.join(",")}` as Route, AVANT)}
            className="flex h-14 w-full animate-[monter_.3s_ease-out_both] items-center justify-center gap-2 rounded-full bg-plate px-5 text-[15px] font-semibold text-plate-foreground shadow-[0_12px_28px_-10px_var(--plate)] active:scale-[.98]">
            <span className="truncate">{tr("Créer ma séance · {a}", { a: m.map(nom).join(", ") })}</span><ArrowRightIcon className="size-4 shrink-0" weight="bold" />
          </button>
        </div>
      )}
    </section>
  );
}
