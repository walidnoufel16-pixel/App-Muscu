"use client";

/* Les cartes d'un écran apparaissent en léger décalé à la première visite
   seulement : en revenant sur l'écran, tout est déjà là. */
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

const vus = new Set<string>();
export function usePremiereVisite() {
  const chemin = usePathname();
  const [premiere] = useState(() => !vus.has(chemin));
  useEffect(() => { vus.add(chemin); }, [chemin]);
  return premiere;
}
