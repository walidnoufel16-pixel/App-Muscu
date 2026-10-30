"use client";

/* La bibliothèque d'exercices sur le corps humain : on touche un ou plusieurs muscles, leurs
   exercices s'affichent dessous, rangés par muscle (matériel du Profil par défaut, modifiable sur
   une ligne). Toucher un exercice ouvre sa fiche. Dans « Créer une séance pour moi » › Exercices. */
import { tr } from "@/lib/i18n";
import { useState } from "react";
import { HandPointingIcon } from "@phosphor-icons/react";
import { SchemaCorps } from "./schema-corps";
import { FicheExercice, type FicheOuverte } from "./fiche-exercice";
import { MaterielRepliable } from "./filtre-materiel";
import { LigneExercice } from "./ligne-exercice";
import { EX } from "@/lib/data/exercices";
import { MUSC, PAT2MUSC } from "@/lib/data/referentiels";
import { estSoin } from "@/lib/data/soin";
import { exoFiltre, selDeclare, avecSalle } from "@/lib/logic/core";
import { useRepere } from "@/lib/store";
import { useBrouillon } from "@/lib/brouillon";
import { useOngletsExercices } from "@/lib/nav";
import { tactile } from "@/lib/repos";

/* `outils` : le matériel proposé seulement (street workout : poids du corps, barre, élastiques, TRX). */
export function BibliothequeMuscles({ outils, depart }: { outils?: string[]; depart?: string[] } = {}) {
  const A = useRepere((s) => s.etat.A);
  const { sel: selB, setSel } = useBrouillon();
  /* sans choix de matériel : celui du Profil, pour voir tout de suite des exercices */
  const sel = outils ? (selB ?? depart ?? outils).filter((t) => outils.includes(t)) : avecSalle(selB ?? selDeclare(A), A);
  /* l'app retient les muscles touchés, le temps de la session */
  const memo = useOngletsExercices((s) => s.muscles);
  const m = memo ? memo.split(",").filter(Boolean) : [];
  const basculer = (k: string) => { tactile(6); useOngletsExercices.setState({ muscles: (m.includes(k) ? m.filter((x) => x !== k) : [...m, k]).join(",") }); };
  const [fiche, setFiche] = useState<FicheOuverte | null>(null);
  /* rien en isolation avec ce matériel (biceps au poids du corps) : les exercices qui travaillent aussi ce muscle */
  const groupes = MUSC.filter((g) => m.includes(g.k)).map((g) => {
    const de = (cle: "pat" | "pat2") => Object.keys(EX).filter((o) => { const p = EX[o][cle]; return !!p && PAT2MUSC[p] === g.k && !estSoin(o) && exoFiltre(o, sel); });
    const l = de("pat");
    return l.length ? { g, l, aussi: false } : { g, l: de("pat2"), aussi: true };
  });
  return (
    <div className="flex flex-col gap-4">
      <SchemaCorps
        actif={(r) => !!(r.p && PAT2MUSC[r.p])}
        choisi={(r) => !!(r.p && m.includes(PAT2MUSC[r.p]))}
        onToucher={(r) => r.p && PAT2MUSC[r.p] && basculer(PAT2MUSC[r.p])}
        legende={tr("Touche un ou plusieurs muscles")}
      />
      <MaterielRepliable sel={sel} declare={outils ? depart ?? outils : selDeclare(A)} types={outils} onChange={setSel} />
      {!m.length ? (
        <p className="flex items-center gap-2 rounded-2xl bg-plate-soft px-3.5 py-3 text-[14px] font-semibold text-plate-ink">
          <HandPointingIcon className="size-5 shrink-0 -rotate-12" weight="fill" />{tr("Touche un muscle pour voir ses exercices.")}
        </p>
      ) : groupes.map(({ g, l, aussi }) => (
        <section key={g.k} aria-label={g.n}>
          <div className="mb-2 flex items-baseline justify-between px-1">
            <h3 className="text-[19px] font-bold">{g.n}</h3>
            <span className="text-[12.5px] text-muted-foreground">{l.length}</span>
          </div>
          {aussi && l.length > 0 && <p className="mb-2 px-1 text-[12.5px] leading-snug text-muted-foreground">{tr("Pas d'exercice d'isolation avec ce matériel : ceux-ci le travaillent aussi.")}</p>}
          <div className="flex flex-col gap-1.5">
            {l.map((o) => <LigneExercice key={o} id={o} onOuvrir={() => setFiche({ id: o, idx: -1, pres: [3, 10, tr("90 s")], libelle: tr("bibliothèque") })} />)}
            {!l.length && <p className="px-1 text-[13.5px] text-muted-foreground">{tr("Aucun exercice avec ce matériel.")}</p>}
          </div>
        </section>
      ))}
      <FicheExercice fiche={fiche} onClose={() => setFiche(null)} />
    </div>
  );
}
