"use client";

import type { Route } from "next";
import { useRouter } from "next/navigation";
import { CaretLeftIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { ARRIERE, titreDe, usePile, useSens } from "@/lib/nav";

/* Bouton retour : il porte le nom de l'écran précédent et y ramène.
   Ouvert directement (lien partagé, rechargement) : il mène à `repli`. */
export function Retour({ repli }: { repli: Route }) {
  const router = useRouter();
  const pile = usePile((s) => s.pile);
  const prec = pile.length > 1 ? pile[pile.length - 2] : null;
  const retour = () => {
    if (!prec) { router.push(repli, ARRIERE); return; }
    useSens.setState({ sens: "nav-back" });
    requestAnimationFrame(() => router.back());
  };
  return (
    <Button variant="ghost" size="sm" className="-ml-2 text-[15px] text-plate-ink" onClick={retour}>
      <CaretLeftIcon className="size-5" weight="bold" />
      {titreDe(prec ?? repli)}
    </Button>
  );
}

/* Revenir en arrière par programme (après un enregistrement, par exemple). */
export function useRetour(repli: Route) {
  const router = useRouter();
  return () => {
    const pile = usePile.getState().pile;
    if (pile.length < 2) { router.push(repli, ARRIERE); return; }
    useSens.setState({ sens: "nav-back" });
    requestAnimationFrame(() => router.back());
  };
}
