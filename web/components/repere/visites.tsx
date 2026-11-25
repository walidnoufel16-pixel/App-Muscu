"use client";

/* Visites guidées (21/11/2026), regroupées dans menu ☰ › Visites guidées :
   - « Découvrir l'app » : la visite générale (visite.tsx) ;
   - « Créer ta séance » : 5 bulles sur l'écran de création, d'elle-même la première fois qu'une séance
     a ses exercices ;
   - « Ta séance » : 5 bulles sur la séance, d'elle-même à la première séance lancée.
   Lancées depuis la liste, « Créer ta séance » et « Ta séance » s'ouvrent sur une démonstration
   (lib/demo.ts) : on essaie tout, rien n'est enregistré, l'état d'avant revient à la sortie.
   Les bulles sont celles de la visite générale (repères data-visite) ; un repère absent est sauté.
   Mode Suivi : « Créer ta séance » sans les cases d'Oxa (on choisit ses exercices), « Ta séance » avec
   la colonne « Précédent » et la charge proposée qu'on corrige. */
import { tr } from "@/lib/i18n";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { Route } from "next";
import { BarbellIcon, CheckIcon, CompassIcon, PlusIcon } from "@phosphor-icons/react";
import { Drawer, DrawerContent, DrawerDescription, DrawerTitle } from "@/components/ui/drawer";
import { useBrouillon } from "@/lib/brouillon";
import { jourDe } from "@/lib/logic/historique";
import { avecSalle, selDeclare } from "@/lib/logic/core";
import { casesPour, seancePour } from "@/lib/logic/generer-seance";
import { gabaritPour } from "@/lib/logic/gabarit";
import { HAUT_CORPS } from "@/lib/logic/raccourcis";
import { AVANT, useMenu } from "@/lib/nav";
import { tactile } from "@/lib/repos";
import { useRepere } from "@/lib/store";
import { cn } from "@/lib/utils";
import { enSuivi } from "@/lib/logic/mode";
import { Bulle, revoirVisite, useVisite, type BulleDef } from "./visite";

export type CleVisite = "decouvrir" | "creer" | "seance";
const CLES: Record<CleVisite, string> = { decouvrir: "repere.visite", creer: "repere.visite.creer", seance: "repere.visite.seance" };
export const vueVisite = (k: CleVisite) => { try { return !!localStorage.getItem(CLES[k]); } catch { return true; } };
const marquerVue = (k: CleVisite) => { try { localStorage.setItem(CLES[k], String(Date.now())); } catch {} };

export const BULLES_SEANCE: BulleDef[] = [
  { cible: "seance-serie", k: () => tr("Ta séance"), t: () => tr("Note ta série"), d: () => tr("Oxa propose la charge et les répétitions. Touche un chiffre pour mettre ce que tu fais vraiment.") },
  { cible: "seance-valider", k: () => tr("Ta séance"), t: () => tr("Valide-la"), d: () => tr("Une fois la série faite, coche-la : le minuteur de repos se lance tout seul.") },
  { cible: "seance-repos", k: () => tr("Ta séance"), t: () => tr("Ajuste ton repos"), d: () => tr("Pendant le repos, touche le chiffre du minuteur pour ajouter ou retirer 15 s, ou passe-le si tu es prêt.") },
  { cible: "seance-remplacer", k: () => tr("Ta séance"), t: () => tr("Remplace un exercice"), d: () => tr("Machine prise ou matériel absent ? Oxa te propose un exercice pour le même muscle, sans changer tes séries.") },
  { cible: "seance-fiche", k: () => tr("Ta séance"), t: () => tr("Regarde comment faire"), d: () => tr("Touche la photo : la fiche montre le mouvement, l'animation départ et fin, et les conseils.") },
];
export const BULLES_CREER: BulleDef[] = [
  { cible: "creer-muscles", k: () => tr("Créer ta séance"), t: () => tr("Choisis tes muscles"), d: () => tr("Un raccourci (tout le corps, le haut, le bas) ou touche les muscles sur le corps. Oxa prépare les cases à remplir.") },
  { cible: "creer-cases", k: () => tr("Créer ta séance"), t: () => tr("Les cases d'Oxa"), d: () => tr("D'abord les gros mouvements, puis un autre angle, puis l'isolation. « Compléter » remplit les cases vides pour toi.") },
  { cible: "creer-ajouter", k: () => tr("Créer ta séance"), t: () => tr("Ajoute ou remplace un exercice"), d: () => tr("Ajoute l'exercice que tu veux ; dans un exercice, « Remplacer » propose les autres pour le même muscle.") },
  { cible: "creer-exercice", k: () => tr("Créer ta séance"), t: () => tr("Règle séries, répétitions et repos"), d: () => tr("Touche un exercice pour régler ses séries, ses répétitions et son temps de repos.") },
  { cible: "creer-lancer", k: () => tr("Créer ta séance"), t: () => tr("Commence ou programme"), d: () => tr("« Commencer » lance la séance ; « Plus tard » la programme pour un autre jour, avec un rappel.") },
];

/* mode Suivi (docs/produit/mode-suivi) */
export const BULLES_SEANCE_SUIVI: BulleDef[] = [
  { cible: "seance-serie", k: () => tr("Ta séance"), t: () => tr("Note ta série"), d: () => tr("« Précédent » rappelle la dernière fois ; Oxa propose la suite. Touche un chiffre pour mettre ce que tu fais vraiment.") },
  ...BULLES_SEANCE.slice(1),
];
export const BULLES_CREER_SUIVI: BulleDef[] = [
  { cible: "creer-ajouter", k: () => tr("Créer ta séance"), t: () => tr("Ajoute tes exercices"), d: () => tr("Sur le corps ou en liste, avec ton matériel : touche + sur chaque exercice de ta séance.") },
  { cible: "creer-exercice", k: () => tr("Créer ta séance"), t: () => tr("Règle séries, répétitions et repos"), d: () => tr("Touche un exercice pour régler ses séries, ses répétitions et son repos.") },
  { cible: "creer-lancer", k: () => tr("Créer ta séance"), t: () => tr("Garde-la ou commence"), d: () => tr("« Enregistrer » la range dans Mes séances ; « Commencer » la lance tout de suite.") },
];

/** Une suite de bulles : d'elle-même une seule fois quand `pret`, ou tout de suite avec `force`. */
function VisiteBulles({ k, bulles, pret = true, force = false, onFin }: { k: CleVisite; bulles: BulleDef[]; pret?: boolean; force?: boolean; onFin?: () => void }) {
  const [i, setI] = useState<number | null>(null);
  /* jamais par-dessus la visite générale */
  const general = useVisite((s) => s.etape !== null);
  useEffect(() => {
    if (general || !pret || (!force && vueVisite(k))) return;
    /* le temps que l'écran s'affiche */
    const t = setTimeout(() => setI(0), 900);
    return () => clearTimeout(t);
  }, [general, pret, force, k]);
  if (i == null || i >= bulles.length) return null;
  const fin = () => { marquerVue(k); setI(bulles.length); onFin?.(); };
  const suivant = () => (i + 1 >= bulles.length ? fin() : setI(i + 1));
  return (
    <Bulle key={i} b={bulles[i]} i={i + 1} total={bulles.length} onSuivant={suivant} onPasser={fin}
      bouton={i + 1 === bulles.length ? tr("C'est parti") : undefined} />
  );
}

export function VisiteSeance({ force }: { force?: boolean }) {
  const suivi = useRepere((s) => enSuivi(s.etat));
  return <VisiteBulles k="seance" bulles={suivi ? BULLES_SEANCE_SUIVI : BULLES_SEANCE} force={force} />;
}
export function VisiteCreer({ pret, force }: { pret: boolean; force?: boolean }) {
  const suivi = useRepere((s) => enSuivi(s.etat));
  return <VisiteBulles k="creer" bulles={suivi ? BULLES_CREER_SUIVI : BULLES_CREER} pret={pret} force={force} />;
}

/** Bandeau des démonstrations, fixé en haut : on essaie tout, rien n'est enregistré ; « Quitter »
    rend l'état d'avant. */
export function BandeauDemo({ onQuitter }: { onQuitter: () => void }) {
  return (
    <div className="fixed inset-x-0 top-[max(env(safe-area-inset-top),8px)] z-[55] mx-auto flex max-w-[480px] justify-center px-4">
      <div className="flex w-full items-center gap-2.5 rounded-[14px] bg-foreground py-2 pr-2 pl-3.5 text-[13px] text-background shadow-[0_10px_24px_-10px_rgba(0,0,0,.5)]">
        <span className="min-w-0 flex-1 leading-snug"><b className="text-plate">{tr("Démonstration")}</b>{" · "}{tr("essaie tout, rien n'est enregistré.")}</span>
        <button onClick={() => { tactile(6); onQuitter(); }} className="shrink-0 rounded-full bg-background/15 px-3 py-1.5 text-[12.5px] font-semibold">{tr("Quitter")}</button>
      </div>
    </div>
  );
}

/** En quittant l'écran d'une démonstration (et seulement alors : React peut remonter un écran sans
    qu'on le quitte), l'état d'avant revient. `ici` dit si l'adresse est encore celle de la démo. */
export function finDemoEnQuittant(ici: () => boolean, nettoyer?: () => void) {
  return () => {
    setTimeout(() => {
      if (ici()) return;
      nettoyer?.();
      useRepere.getState().sortirDemo();
    }, 0);
  };
}

/* les démonstrations partent d'une séance « Haut du corps » construite comme celles d'Oxa */
function demoHaut() {
  const E = useRepere.getState().etat, sel = avecSalle(selDeclare(E.A), E.A), auj = jourDe(Date.now()), m = [...HAUT_CORPS];
  return { E, sel, auj, m, nom: tr("Démo · Haut du corps") };
}

/** Nombre de visites jamais vues (pastille du menu). */
export function useVisitesNonVues() {
  /* relu à chaque ouverture du menu (le composant se redessine alors) */
  useMenu((s) => s.ouvert || s.visites);
  return (["decouvrir", "creer", "seance"] as CleVisite[]).filter((k) => !vueVisite(k)).length;
}

/* La liste des visites (menu ☰ › Visites guidées). */
export function FeuilleVisites() {
  const router = useRouter();
  const ouvert = useMenu((s) => s.visites), fermer = () => useMenu.setState({ visites: false });
  const setLibre = useBrouillon((s) => s.setLibre);
  const suivi = useRepere((s) => enSuivi(s.etat));
  const vues: Record<CleVisite, boolean> = { decouvrir: vueVisite("decouvrir"), creer: vueVisite("creer"), seance: vueVisite("seance") };

  const lancer = (k: CleVisite) => {
    tactile(8); fermer();
    if (k === "decouvrir") { setTimeout(revoirVisite, 300); return; }
    const { E, sel, auj, m, nom } = demoHaut();
    /* mode Suivi : une séance à soi, sans cases ni séance construite par Oxa */
    if (k === "creer" && suivi) {
      const ex = seancePour(E, m, 30, 0, sel, auj).slice(0, 3);
      useRepere.getState().entrerDemo();
      setLibre({ nom, ex, idx: null, demo: true });
      router.push("/entrainement/composer" as Route, AVANT);
      return;
    }
    if (k === "creer") {
      const gab = gabaritPour(E, m, 30, 0, sel, auj), ex = casesPour(E, m, 30, 0, sel, auj).slice(0, 3);
      useRepere.getState().entrerDemo();
      setLibre({ nom, ex, idx: null, pour: auj, guide: true, gab, gen: { m, d: 30, obj: 0 }, demo: true });
      router.push("/entrainement/composer" as Route, AVANT);
      return;
    }
    const ex = seancePour(E, m, 30, 0, sel, auj).slice(0, 3);
    useRepere.getState().entrerDemo();
    let i = 0;
    useRepere.getState().muter((x) => { x.SEANCES.push({ nom, ex }); i = x.SEANCES.length - 1; });
    router.push(`/entrainement/seance?l=${i}&demo=1` as Route, AVANT);
  };

  const L: { k: CleVisite; icone: React.ReactNode; n: string; d: string }[] = [
    { k: "decouvrir", icone: <CompassIcon className="size-5" weight="bold" />, n: tr("Découvrir l'app"), d: tr("Les grandes parties d'Oxa · 1 min") },
    { k: "creer", icone: <PlusIcon className="size-5" weight="bold" />, n: tr("Créer ta séance"), d: suivi ? tr("Exercices, séries, répétitions et repos · 3 étapes") : tr("Muscles, exercices, séries et repos · 5 étapes") },
    { k: "seance", icone: <BarbellIcon className="size-5" weight="bold" />, n: tr("Ta séance"), d: tr("Noter, valider, repos, remplacer · 5 étapes") },
  ];
  return (
    <Drawer open={ouvert} onOpenChange={(o) => !o && fermer()}>
      <DrawerContent>
        <div className="px-4 pt-2 pb-[max(env(safe-area-inset-bottom),20px)]">
          <DrawerTitle className="px-1 text-[21px] font-extrabold">{tr("Visites guidées")}</DrawerTitle>
          <DrawerDescription className="mt-0.5 px-1 text-[13px] text-muted-foreground">{tr("Pour découvrir une partie de l'app, ou la revoir. « Créer ta séance » et « Ta séance » s'ouvrent sur une démonstration : rien n'est enregistré.")}</DrawerDescription>
          <div className="mt-3 flex flex-col gap-2">
            {L.map((v) => (
              <div key={v.k} className="flex items-center gap-3 rounded-[16px] bg-muted/60 p-3">
                <span className="grid size-10 shrink-0 place-items-center rounded-[12px] bg-plate-soft text-plate-ink dark:text-plate">{v.icone}</span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[15px] font-bold">{v.n}</span>
                  <span className="block text-[12px] leading-snug text-muted-foreground">
                    {vues[v.k] && <span className="font-semibold text-plate-ink dark:text-plate"><CheckIcon className="mr-0.5 inline size-3" weight="bold" />{tr("Vue")} · </span>}{v.d}
                  </span>
                </span>
                <button onClick={() => lancer(v.k)}
                  className={cn("shrink-0 rounded-full px-3.5 py-2 text-[13px] font-bold active:scale-95", vues[v.k] ? "border border-border bg-background" : "bg-plate text-plate-foreground")}>
                  {vues[v.k] ? tr("Revoir") : tr("Lancer")}
                </button>
              </div>
            ))}
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
