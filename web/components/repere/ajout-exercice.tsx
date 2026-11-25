"use client";

/* Feuille « Ajouter un exercice » : la bibliothèque (sur le corps d'abord, avec la musculation
   et le soin & mobilité de la zone touchée, ou en liste ; filtre matériel) dans une feuille. Chaque exercice touché s'ajoute ; « Terminé » referme.
   Utilisée par le composeur et pendant une séance libre.
   Mode Suivi : sur le corps, on touche un ou plusieurs muscles ; leurs exercices apparaissent dessous,
   rangés par muscle puis par rôle (Base, Complément, Isolation, avec une ligne d'explication). */
import { tr } from "@/lib/i18n";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Drawer, DrawerContent, DrawerDescription, DrawerTitle } from "@/components/ui/drawer";
import { Bibliotheque, ListeRecherche, parRole, TitreRole } from "./bibliotheque";
import { exosParMuscle } from "./bibliotheque-muscles";
import { SchemaCorps } from "./schema-corps";
import { LigneExercice } from "./ligne-exercice";
import { HandPointingIcon } from "@phosphor-icons/react";
import { PAT2MUSC } from "@/lib/data/referentiels";
import { enSuivi } from "@/lib/logic/mode";
import { tactile } from "@/lib/repos";
import { FiltreMateriel, MaterielRepliable } from "./filtre-materiel";
import { Segmente } from "./segmente";
import { EX } from "@/lib/data/exercices";
import { selDeclare } from "@/lib/logic/core";
import { useRepere } from "@/lib/store";

export function FeuilleAjout({
  ouvert, onClose, onAjouter, pris, onFiche, sel: selP, onSel, une = false, muscles,
}: {
  ouvert: boolean;
  onClose: () => void;
  onAjouter: (id: string) => void;
  pris?: (id: string) => boolean;
  onFiche: (id: string) => void;
  sel?: string[];
  onSel?: (s: string[]) => void;
  /* un seul exercice à la fois (pendant une séance) : la feuille se ferme après l'ajout */
  une?: boolean;
  /* mode Suivi : muscles déjà touchés (le corps de l'accueil) */
  muscles?: string[];
}) {
  const suivi = useRepere((s) => enSuivi(s.etat));
  const [m, setM] = useState<string[]>(muscles ?? []);
  const A = useRepere((s) => s.etat.A);
  const [selL, setSelL] = useState<string[] | null>(null);
  const sel = selP ?? selL ?? [];
  const setSel = onSel ?? setSelL;
  const [vue, setVue] = useState<"corps" | "liste">("corps");
  const [zone, setZone] = useState<{ z: string; p: string | null } | null>(null);
  const [q, setQ] = useState("");
  const [n, setN] = useState(0);
  const ajouter = (id: string) => {
    onAjouter(id);
    toast.success(tr("Ajouté : {a}", { a: EX[id]?.n || id }), { duration: 1400 });
    if (une) onClose(); else setN((x) => x + 1);
  };
  return (
    <Drawer open={ouvert} onOpenChange={(o) => { if (!o) { onClose(); setN(0); } }} repositionInputs={false}>
      <DrawerContent className="h-[92dvh] max-h-[92dvh]">
        <div className="flex items-center justify-between gap-3 px-5 pt-2">
          <div>
            <DrawerTitle className="text-[20px] font-bold">{tr("Ajouter un exercice")}</DrawerTitle>
            <DrawerDescription className="text-[12.5px] text-muted-foreground">{une ? tr("Il s'ajoute à la fin de ta séance.") : tr("Touche + sur chaque exercice à ajouter.")}</DrawerDescription>
          </div>
          {!une && <Button variant="plate" className="shrink-0 rounded-full px-5" onClick={() => { onClose(); setN(0); }}>{tr("Terminé{a}", { a: n ? ` (${n})` : "" })}</Button>}
        </div>
        <div className="mt-3 flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto overscroll-contain px-4 pb-[max(env(safe-area-inset-bottom),20px)]">
          {/* mode Suivi : le corps d'abord ; le matériel replié sur une ligne, sous le corps */}
          {!suivi && <FiltreMateriel sel={sel} declare={selDeclare(A)} onChange={setSel} />}
          <Segmente label={tr("Affichage de la bibliothèque")} valeur={vue} onChange={setVue} options={[{ v: "corps", n: tr("Corps") }, { v: "liste", n: tr("Liste d'exercices") }]} />
          {vue === "corps" && suivi
            ? <CorpsMuscles sel={sel} m={m} setM={setM} pris={pris} onAjouter={ajouter} onFiche={onFiche} materiel={<MaterielRepliable sel={sel} declare={selDeclare(A)} onChange={setSel} />} />
            : vue === "corps"
            ? <Bibliotheque sel={sel} zone={zone} setZone={setZone} pris={pris} onAjouter={ajouter} onFiche={onFiche} />
            : <>{suivi && <MaterielRepliable sel={sel} declare={selDeclare(A)} onChange={setSel} />}<ListeRecherche sel={sel} q={q} setQ={setQ} pris={pris} onAjouter={ajouter} onFiche={onFiche} /></>}
        </div>
      </DrawerContent>
    </Drawer>
  );
}

/* Mode Suivi : plusieurs muscles à la fois sur le corps (homme ou femme choisi la première fois),
   leurs exercices dessous, par muscle puis par rôle. */
function CorpsMuscles({ sel, m, setM, pris, onAjouter, onFiche, materiel }: { sel: string[]; m: string[]; setM: (m: string[]) => void; pris?: (o: string) => boolean; onAjouter: (o: string) => void; onFiche: (o: string) => void; materiel: React.ReactNode }) {
  const basculer = (k: string) => { tactile(6); setM(m.includes(k) ? m.filter((x) => x !== k) : [...m, k]); };
  const groupes = exosParMuscle(m, sel);
  return (
    <div className="flex flex-col gap-4">
      <div className="-mb-2 flex items-baseline justify-between px-1">
        <span className="eyebrow">{tr("Muscles{a}", { a: m.length ? ` · ${m.length}` : "" })}</span>
        {m.length > 0 && <button onClick={() => { tactile(5); setM([]); }} className="text-[13px] font-medium text-muted-foreground">{tr("Tout décocher")}</button>}
      </div>
      <SchemaCorps
        actif={(r) => !!(r.p && PAT2MUSC[r.p])}
        choisi={(r) => !!(r.p && m.includes(PAT2MUSC[r.p]))}
        onToucher={(r) => r.p && PAT2MUSC[r.p] && basculer(PAT2MUSC[r.p])}
        legende={tr("Touche un ou plusieurs muscles")}
      />
      {materiel}
      {!m.length ? (
        <p className="flex items-center gap-2 rounded-2xl bg-plate-soft px-3.5 py-3 text-[14px] font-semibold text-plate-ink">
          <HandPointingIcon className="size-5 shrink-0 -rotate-12" weight="fill" />{tr("Touche un muscle pour voir ses exercices.")}
        </p>
      ) : groupes.map(({ g, l, aussi }) => (
        <section key={g.k} aria-label={g.n} className="flex flex-col gap-2">
          <div className="flex items-baseline justify-between px-1">
            <h3 className="text-[19px] font-bold">{g.n}</h3>
            <span className="text-[12.5px] text-muted-foreground">{l.length}</span>
          </div>
          {aussi && l.length > 0 && <p className="px-1 text-[12.5px] leading-snug text-muted-foreground">{tr("Pas d'exercice d'isolation avec ce matériel : ceux-ci le travaillent aussi.")}</p>}
          {parRole(l, g.k).map(({ ro, ids }) => (
            <div key={ro ?? "-"} className="flex flex-col gap-1.5">
              <TitreRole ro={ro} n={ids.length} />
              {ids.map((o) => <LigneExercice key={o} id={o} ro={ro} pris={pris?.(o)} onOuvrir={() => onFiche(o)} onAjouter={() => onAjouter(o)} />)}
            </div>
          ))}
          {!l.length && <p className="px-1 text-[13.5px] text-muted-foreground">{tr("Aucun exercice avec ce matériel.")}</p>}
        </section>
      ))}
    </div>
  );
}
