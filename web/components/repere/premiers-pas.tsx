"use client";

/* Accueil d'un utilisateur qui n'a encore fait aucune séance (maquette validée le 20/11/2026) :
   « Comment veux-tu commencer ? », deux portes plutôt qu'une séance « conseillée » construite sur un
   profil inventé.
   - « Oxa me prépare une séance » : au plus 4 questions sur une feuille (corps, niveau, où, combien de
     temps), seulement celles qui n'ont pas encore de réponse, puis le choix des muscles (assistant).
   - « Je compose ma séance » : le composeur, exercice par exercice.
   - « Je veux d'abord découvrir l'app » : la visite guidée.
   Le chemin choisi est mesuré (chemin_choisi) pour l'entonnoir de l'Admin. */
import { tr } from "@/lib/i18n";
import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Route } from "next";
import { CaretRightIcon, PlusIcon, SparkleIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Drawer, DrawerContent, DrawerDescription, DrawerTitle } from "@/components/ui/drawer";
import { useBrouillon } from "@/lib/brouillon";
import { noter } from "@/lib/mesure";
import { AVANT } from "@/lib/nav";
import { tactile } from "@/lib/repos";
import { useRepere } from "@/lib/store";
import type { Reponses } from "@/lib/logic/types";
import { cn } from "@/lib/utils";
import { NIVEAUX } from "./profil-sportif";
import { Segmente } from "./segmente";
import { revoirVisite } from "./visite";

/* « Où t'entraînes-tu ? » : Salle complète (0), Haltères seuls (2), Poids du corps (3) ; « Home gym »
   (1) reste dans Profil › Matériel, avec le détail des machines. */
const LIEUX: [number, () => string][] = [[0, () => tr("En salle")], [2, () => tr("Haltères")], [3, () => tr("Sans matériel")]];
const DUREES = [30, 45, 60];

type Reps = { sexe?: 0 | 1; niveau?: number; materiel?: number; duree?: number };
/** Les questions encore sans réponse (une réponse donnée n'est jamais redemandée). */
export function questionsManquantes(A: Reponses) {
  return {
    sexe: A.sexe == null,
    niveau: A.regularite == null,
    materiel: A.materiel == null,
    duree: !(typeof A.duree === "number" && DUREES.includes(A.duree)),
  };
}

export function PremiersPas({ auj }: { auj: string }) {
  const router = useRouter();
  const A = useRepere((s) => s.etat.A);
  const muter = useRepere((s) => s.muter);
  const setLibre = useBrouillon((s) => s.setLibre);
  const [feuille, setFeuille] = useState(false);
  const [r, setR] = useState<Reps>({});
  const q = questionsManquantes(A);
  const aDemander = q.sexe || q.niveau || q.materiel || q.duree;
  const complet = (!q.sexe || r.sexe != null) && (!q.niveau || r.niveau != null) && (!q.materiel || r.materiel != null) && (!q.duree || r.duree != null);

  const versAssistant = () => router.push("/entrainement/assistant" as Route, AVANT);
  const oxa = () => {
    tactile(8); noter("chemin_choisi", { c: "oxa" });
    if (!aDemander) { versAssistant(); return; }
    setR({ duree: q.duree ? 45 : undefined, materiel: q.materiel ? 0 : undefined });
    setFeuille(true);
  };
  const valider = () => {
    muter((E) => {
      if (r.sexe != null) E.A.sexe = r.sexe;
      if (r.niveau != null) E.A.regularite = r.niveau;
      if (r.materiel != null) E.A.materiel = r.materiel;
      if (r.duree != null) E.A.duree = r.duree;
      /* le niveau vient d'être donné : la petite feuille de l'assistant ne le redemande pas */
      E.A.miseEnRoute = true;
    });
    setFeuille(false);
    versAssistant();
  };
  const composer = () => {
    tactile(8); noter("chemin_choisi", { c: "compose" });
    setLibre({ nom: tr("Séance libre"), ex: [], idx: null, pour: auj, guide: !A.sansCases });
    router.push("/entrainement/composer" as Route, AVANT);
  };
  const decouvrir = () => { tactile(5); noter("chemin_choisi", { c: "decouvrir" }); revoirVisite(); };

  return (
    <>
      <section aria-label={tr("Comment veux-tu commencer ?")} className="rounded-[22px] bg-card p-4">
        <div className="eyebrow flex items-center gap-1"><SparkleIcon className="size-3.5" weight="fill" />{tr("Pour commencer")}</div>
        <h2 className="mt-0.5 text-[21px] leading-tight font-extrabold">{tr("Comment veux-tu commencer ?")}</h2>
        <Porte principale icone={<SparkleIcon className="size-5" weight="fill" />} titre={tr("Oxa me prépare une séance")}
          sous={aDemander ? tr("Quelques questions, puis une séance réglée sur toi") : tr("Choisis tes muscles, Oxa règle le reste")} onClick={oxa} />
        <Porte icone={<PlusIcon className="size-5" weight="bold" />} titre={tr("Je compose ma séance")}
          sous={tr("Tu sais ce que tu veux faire : choisis tes exercices")} onClick={composer} />
        <button onClick={decouvrir} className="mt-2 h-10 w-full text-[13.5px] text-muted-foreground underline underline-offset-2">{tr("Je veux d'abord découvrir l'app")}</button>
      </section>

      <Drawer open={feuille} onOpenChange={(o) => !o && setFeuille(false)}>
        <DrawerContent className="max-h-[92dvh]">
          <div className="overflow-y-auto overscroll-contain px-4 pb-[max(env(safe-area-inset-bottom),20px)]">
            <DrawerTitle className="mt-2 px-1 text-[21px] font-extrabold">{tr("Pour te préparer la bonne séance")}</DrawerTitle>
            <DrawerDescription className="mt-0.5 px-1 text-[13px] text-muted-foreground">{tr("Oxa règle les exercices, les séries et les charges avec tes réponses.")}</DrawerDescription>
            {q.sexe && (
              <Question titre={tr("Sur quel corps afficher tes muscles ?")} note={tr("Pour dessiner tes muscles et calculer tes besoins. Modifiable dans Profil.")}>
                <Segmente label={tr("Corps")} valeur={r.sexe ?? -1} onChange={(v) => setR({ ...r, sexe: v as 0 | 1 })} options={[{ v: 1, n: tr("Femme") }, { v: 0, n: tr("Homme") }]} />
              </Question>
            )}
            {q.niveau && (
              <Question titre={tr("Ton niveau")}>
                <div className="flex flex-col gap-1.5">
                  {NIVEAUX().map((x) => (
                    <button key={x.v} onClick={() => { tactile(6); setR({ ...r, niveau: x.v }); }} aria-pressed={r.niveau === x.v}
                      className={cn("rounded-[14px] border-2 px-3 py-2 text-left", r.niveau === x.v ? "border-plate bg-background" : "border-transparent bg-muted/60")}>
                      <span className="block text-[14.5px] font-semibold">{x.n}</span>
                      <span className="block text-[12px] leading-snug text-muted-foreground">{x.d}</span>
                    </button>
                  ))}
                </div>
              </Question>
            )}
            {q.materiel && (
              <Question titre={tr("Où t'entraînes-tu ?")} note={tr("Tu pourras préciser ton matériel plus tard dans Profil › Matériel : les machines de ta salle, tes haltères, un banc…")}>
                <Segmente label={tr("Lieu")} valeur={r.materiel ?? 0} onChange={(v) => setR({ ...r, materiel: v })} options={LIEUX.map(([v, n]) => ({ v, n: n() }))} />
              </Question>
            )}
            {q.duree && (
              <Question titre={tr("Combien de temps ?")}>
                <Segmente label={tr("Durée")} valeur={r.duree ?? 45} onChange={(v) => setR({ ...r, duree: v })} options={DUREES.map((v) => ({ v, n: tr("{a} min", { a: v }) }))} />
              </Question>
            )}
            <Button variant="plate" size="xl" className="mt-5 w-full" disabled={!complet} onClick={() => { tactile(10); valider(); }}>{tr("Choisir mes muscles")}</Button>
          </div>
        </DrawerContent>
      </Drawer>
    </>
  );
}

function Porte({ principale, icone, titre, sous, onClick }: { principale?: boolean; icone: React.ReactNode; titre: string; sous: string; onClick: () => void }) {
  return (
    <button onClick={onClick}
      className={cn("mt-2.5 flex w-full items-center gap-3 rounded-[18px] border-2 p-3.5 text-left active:scale-[.99]", principale ? "border-plate bg-plate text-plate-foreground" : "border-border bg-background")}>
      <span className={cn("grid size-10 shrink-0 place-items-center rounded-[12px]", principale ? "bg-white/20" : "bg-plate-soft text-plate-ink dark:text-plate")}>{icone}</span>
      <span className="min-w-0 flex-1">
        <span className="block text-[16px] font-bold">{titre}</span>
        <span className={cn("block text-[12.5px] leading-snug", principale ? "opacity-90" : "text-muted-foreground")}>{sous}</span>
      </span>
      <CaretRightIcon className="size-4 shrink-0 opacity-70" />
    </button>
  );
}

function Question({ titre, note, children }: { titre: string; note?: string; children: React.ReactNode }) {
  return (
    <section className="mt-4">
      <h3 className="mb-1.5 px-1 text-[14px] font-bold">{titre}</h3>
      {children}
      {note && <p className="mt-1.5 px-1 text-[11.5px] leading-snug text-muted-foreground">{note}</p>}
    </section>
  );
}
