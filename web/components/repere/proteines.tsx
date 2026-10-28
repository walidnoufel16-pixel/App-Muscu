"use client";

/* Protéines du jour : un anneau, et une feuille pour ajouter en un geste. */
import { tr } from "@/lib/i18n";
import { useState } from "react";
import { BarcodeIcon, CaretRightIcon, EggIcon, MagnifyingGlassIcon, MinusIcon, PlusIcon } from "@phosphor-icons/react";
import { toast } from "sonner";
import { ChercherProduit, QuantiteProduit, Scanner } from "./produits";
import { garderProduit, produitParCode, protDe } from "@/lib/logic/produits";
import type { Produit } from "@/lib/logic/types";
import { Drawer, DrawerContent, DrawerDescription, DrawerTitle } from "@/components/ui/drawer";
import { ajouterProt, ALIMENTS, objectifProteines, poidsDe, protDuJour } from "@/lib/logic/nutrition";
import { jourDe } from "@/lib/logic/historique";
import { useRepere } from "@/lib/store";
import { tactile } from "@/lib/repos";
import { cn } from "@/lib/utils";

export function CarteProteines({ accueil = false, tuile = false }: { accueil?: boolean; tuile?: boolean }) {
  const A = useRepere((s) => s.etat.A);
  const muter = useRepere((s) => s.muter);
  const [auj] = useState(() => jourDe(Date.now()));
  const [ouvert, setOuvert] = useState(false);
  /* dans la feuille : le jour, la recherche d'un produit, ou la quantité d'un produit choisi */
  const [vue, setVue] = useState<{ e: "jour" } | { e: "chercher"; q?: string; erreur?: string } | { e: "quantite"; p: Produit }>({ e: "jour" });
  const [scan, setScan] = useState(false);
  const produits = (A.produits as Produit[] | undefined) ?? [];
  if (accueil && A.protOff) return null;
  const obj = objectifProteines(A), g = protDuJour(A, auj), p = Math.min(1, g / obj);
  const ajouter = (n: number) => { tactile(n > 0 ? 8 : 5); muter((E) => ajouterProt(E.A, auj, n)); };
  const ajouterProduit = (n: number, pr: Produit) => {
    muter((E) => { ajouterProt(E.A, auj, n); E.A.produits = garderProduit(E.A.produits as Produit[] | undefined, pr); });
    toast.success(tr("+{n} g de protéines : {p}", { n, p: pr.n }), { duration: 1800 });
    setVue({ e: "jour" });
  };
  /* code lu par le scanner : le produit, sinon la recherche avec le code et un message */
  const codeLu = async (code: string) => {
    setScan(false);
    try {
      const pr = await produitParCode(code);
      setVue(pr ? { e: "quantite", p: pr } : { e: "chercher", q: code, erreur: tr("Ce produit n'est pas dans Open Food Facts, ou sans protéines indiquées. Essaie avec son nom.") });
    } catch {
      setVue({ e: "chercher", q: code, erreur: tr("Pas de réponse du service : vérifie ta connexion, puis touche Chercher.") });
    }
  };
  return (
    <>
      {tuile ? (
        /* tuile de l'accueil : l'anneau, puis les grammes du jour */
        <button onClick={() => setOuvert(true)} className="flex min-h-[124px] flex-col justify-between rounded-[22px] bg-card p-3.5 text-left active:scale-[.98]">
          <span className="flex items-center justify-between">
            <span className="grid size-8 place-items-center rounded-full" style={{ background: `conic-gradient(var(--success) ${p * 360}deg, var(--muted) 0)` }}>
              <span className="grid size-6 place-items-center rounded-full bg-card"><EggIcon className="size-3.5 text-success" weight="fill" /></span>
            </span>
            <PlusIcon className="size-4 text-muted-foreground" weight="bold" />
          </span>
          <span>
            <span className="num block text-[24px] leading-none font-bold">{g}<span className="text-[16px] text-muted-foreground">/{obj}{" "}{tr("g")}</span></span>
            <span className="mt-1 block text-[12.5px] leading-snug text-muted-foreground">{g >= obj ? tr("Objectif du jour atteint") : tr("protéines aujourd'hui")}</span>
          </span>
        </button>
      ) : (
      <button onClick={() => setOuvert(true)} className="flex w-full items-center gap-3 rounded-[20px] border border-border/80 bg-card p-3.5 text-left active:bg-muted">
        <span className="relative grid size-12 shrink-0 place-items-center rounded-full" style={{ background: `conic-gradient(var(--success) ${p * 360}deg, var(--muted) 0)` }}>
          <span className="grid size-[38px] place-items-center rounded-full bg-card"><EggIcon className="size-5 text-success" weight="fill" /></span>
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-[16px] leading-tight font-semibold">
            <span className="num text-[19px]">{g}</span><span className="text-muted-foreground">{" "}{tr("/ {obj} g", { obj })}</span>{" "}{tr("de protéines")}
          </span>
          <span className="block text-[12.5px] text-muted-foreground">{g >= obj ? tr("Objectif du jour atteint") : tr("Touche pour ajouter un repas")}</span>
        </span>
        <CaretRightIcon className="size-4 shrink-0 text-muted-foreground" />
      </button>
      )}
      {/* pas de repositionnement au clavier (champ de recherche) : sur iPhone la feuille remonterait hors de l'écran */}
      <Drawer open={ouvert} onOpenChange={(o) => { setOuvert(o); if (!o) setVue({ e: "jour" }); }} repositionInputs={false}>
        <DrawerContent>
          <div className="max-h-[80vh] overflow-y-auto px-5 pt-2 pb-[max(env(safe-area-inset-bottom),20px)]">
            {vue.e === "chercher" && <ChercherProduit key={vue.q ?? ""} q0={vue.q} erreur0={vue.erreur} onChoisir={(pr) => setVue({ e: "quantite", p: pr })} onScanner={() => setScan(true)} onRetour={() => setVue({ e: "jour" })} />}
            {vue.e === "quantite" && <QuantiteProduit produit={vue.p} onAjouter={ajouterProduit} onRetour={() => setVue({ e: "chercher" })} />}
            <div className={cn(vue.e !== "jour" && "hidden")}>
            <DrawerTitle className="text-[20px] font-bold">{tr("Protéines aujourd'hui")}</DrawerTitle>
            <DrawerDescription className="mt-0.5 text-[13px] text-muted-foreground">{tr("{a} Pas de calories à compter.", { a: poidsDe(A) ? tr("Objectif calculé sur ton poids ({a} kg) et ton objectif.", { a: poidsDe(A) }) : tr("Note ton poids dans Progrès pour un objectif sur mesure.") })}</DrawerDescription>
            <div className="mt-4 flex items-center justify-center gap-4">
              <button aria-label={tr("Retirer 10 g")} onClick={() => ajouter(-10)} disabled={!g} className="grid size-11 place-items-center rounded-full bg-muted disabled:opacity-40"><MinusIcon className="size-5" weight="bold" /></button>
              <span className="text-center">
                <span className="num block text-[44px] leading-none font-bold">{g}<span className="text-[20px] text-muted-foreground">{" "}{tr("g")}</span></span>
                <span className="text-[12.5px] text-muted-foreground">{tr("sur {obj} g", { obj })}</span>
              </span>
              <button aria-label={tr("Ajouter 10 g")} onClick={() => ajouter(10)} className="grid size-11 place-items-center rounded-full bg-success text-white"><PlusIcon className="size-5" weight="bold" /></button>
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-success transition-[width] duration-300" style={{ width: p * 100 + "%" }} /></div>
            <h3 className="eyebrow mt-5 mb-2">{tr("Ajouter un aliment")}</h3>
            <div className="grid grid-cols-2 gap-1.5">
              {ALIMENTS.map((a) => (
                <button key={a.n} onClick={() => ajouter(a.g)} className="flex items-center justify-between gap-2 rounded-2xl border bg-card px-3 py-2.5 text-left active:scale-[.98]">
                  <span className="min-w-0">
                    <span className="block truncate text-[13.5px] font-medium">{a.n}</span>
                    <span className="block text-[11.5px] text-muted-foreground">{a.q}</span>
                  </span>
                  <span className="num shrink-0 text-[15px] font-bold text-success">+{a.g}</span>
                </button>
              ))}
            </div>
            <h3 className="eyebrow mt-5 mb-2">{tr("Un produit précis")}</h3>
            <div className="grid grid-cols-2 gap-1.5">
              <button onClick={() => { tactile(6); setScan(true); }} className="flex items-center justify-center gap-2 rounded-2xl border bg-card px-3 py-3 text-[14px] font-semibold active:scale-[.98]"><BarcodeIcon className="size-5" />{tr("Scanner")}</button>
              <button onClick={() => { tactile(6); setVue({ e: "chercher" }); }} className="flex items-center justify-center gap-2 rounded-2xl border bg-card px-3 py-3 text-[14px] font-semibold active:scale-[.98]"><MagnifyingGlassIcon className="size-5" />{tr("Chercher")}</button>
            </div>
            {produits.length > 0 && (
              <>
                <h3 className="eyebrow mt-4 mb-2">{tr("Mes produits")}</h3>
                <ul className="overflow-hidden rounded-[18px] border bg-card" aria-label={tr("Mes produits")}>
                  {produits.slice(0, 6).map((pr) => (
                    <li key={pr.code ?? pr.n + pr.marque} className="border-t border-border/60 first:border-t-0">
                      <button onClick={() => { tactile(5); setVue({ e: "quantite", p: pr }); }} className="flex w-full items-center gap-3 px-3.5 py-2.5 text-left active:bg-muted">
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-[14px] font-medium">{pr.n}</span>
                          <span className="block truncate text-[11.5px] text-muted-foreground">{[pr.marque, pr.portion ? tr("1 portion ({g} g)", { g: pr.portion }) : tr("100 g")].filter(Boolean).join(" · ")}</span>
                        </span>
                        <span className="num shrink-0 text-[15px] font-bold text-success">+{protDe(pr, pr.portion ?? 100)}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </>
            )}
            <div className="mt-4 flex items-center justify-between gap-3 rounded-2xl bg-muted/60 px-3.5 py-2.5">
              <span className="text-[13.5px]">{tr("Objectif par jour")}</span>
              <span className="flex items-center gap-1">
                <button aria-label={tr("Objectif : moins")} onClick={() => muter((E) => { E.A.protObj = Math.max(40, obj - 5); })} className="grid size-8 place-items-center rounded-full bg-card"><MinusIcon className="size-3.5" weight="bold" /></button>
                <span className="num w-14 text-center text-[16px] font-bold">{obj}{" "}{tr("g")}</span>
                <button aria-label={tr("Objectif : plus")} onClick={() => muter((E) => { E.A.protObj = Math.min(300, obj + 5); })} className="grid size-8 place-items-center rounded-full bg-card"><PlusIcon className="size-3.5" weight="bold" /></button>
              </span>
            </div>
            <label className="mt-2 flex items-center justify-between gap-3 px-1 py-2 text-[13.5px]">
              {tr("Afficher sur l'écran Entraînement")}
              <input type="checkbox" checked={!A.protOff} onChange={(e) => muter((E) => { E.A.protOff = !e.target.checked; })} className={cn("size-5 accent-[var(--plate)]")} />
            </label>
            </div>
          </div>
        </DrawerContent>
      </Drawer>
      <Scanner ouvert={scan} onCode={codeLu} onClose={() => setScan(false)} />
    </>
  );
}
