"use client";

/* Feuille « Ajouter un exercice » : la bibliothèque (sur le corps ou en liste, avec
   le filtre matériel) dans une feuille. Chaque exercice touché s'ajoute ; « Terminé » referme.
   Utilisée par le composeur et pendant une séance libre. */
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Drawer, DrawerContent, DrawerDescription, DrawerTitle } from "@/components/ui/drawer";
import { Bibliotheque, ListeRecherche } from "./bibliotheque";
import { FiltreMateriel } from "./filtre-materiel";
import { Segmente } from "./segmente";
import { EX } from "@/lib/data/exercices";
import { selDeclare } from "@/lib/logic/core";
import { useRepere } from "@/lib/store";

export function FeuilleAjout({
  ouvert, onClose, onAjouter, pris, onFiche, sel: selP, onSel, une = false,
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
}) {
  const A = useRepere((s) => s.etat.A);
  const [selL, setSelL] = useState<string[] | null>(null);
  const sel = selP ?? selL ?? selDeclare(A);
  const setSel = onSel ?? setSelL;
  const [vue, setVue] = useState<"corps" | "liste">("liste");
  const [zone, setZone] = useState<{ z: string; p: string | null } | null>(null);
  const [q, setQ] = useState("");
  const [n, setN] = useState(0);
  const ajouter = (id: string) => {
    onAjouter(id);
    toast.success(`Ajouté : ${EX[id]?.n || id}`, { duration: 1400 });
    if (une) onClose(); else setN((x) => x + 1);
  };
  return (
    <Drawer open={ouvert} onOpenChange={(o) => { if (!o) { onClose(); setN(0); } }} repositionInputs={false}>
      <DrawerContent className="h-[92dvh] max-h-[92dvh]">
        <div className="flex items-center justify-between gap-3 px-5 pt-2">
          <div>
            <DrawerTitle className="text-[20px] font-bold">Ajouter un exercice</DrawerTitle>
            <DrawerDescription className="text-[12.5px] text-muted-foreground">{une ? "Il s'ajoute à la fin de ta séance." : "Touche + sur chaque exercice à ajouter."}</DrawerDescription>
          </div>
          {!une && <Button variant="plate" className="shrink-0 rounded-full px-5" onClick={() => { onClose(); setN(0); }}>Terminé{n ? ` (${n})` : ""}</Button>}
        </div>
        <div className="mt-3 flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto overscroll-contain px-4 pb-[max(env(safe-area-inset-bottom),20px)]">
          <FiltreMateriel sel={sel} declare={selDeclare(A)} onChange={setSel} />
          <Segmente label="Affichage de la bibliothèque" valeur={vue} onChange={setVue} options={[{ v: "liste", n: "Liste" }, { v: "corps", n: "Sur le corps" }]} />
          {vue === "corps"
            ? <Bibliotheque sel={sel} zone={zone} setZone={setZone} pris={pris} onAjouter={ajouter} onFiche={onFiche} />
            : <ListeRecherche sel={sel} q={q} setQ={setQ} pris={pris} onAjouter={ajouter} onFiche={onFiche} />}
        </div>
      </DrawerContent>
    </Drawer>
  );
}
