"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useRepere } from "@/lib/store";

/* Aiguillage : sans compte, l'accueil ; avec un cycle, le plan ; sinon les séances. */
export default function Racine() {
  const router = useRouter();
  const { user, etat } = useRepere();
  useEffect(() => {
    if (!user && !etat.FINI && !etat.SEANCES.length) router.replace("/bienvenue/");
    else router.replace(etat.FINI || etat.PLAN ? "/plan/" : "/seances/");
  }, [router, user, etat.FINI, etat.PLAN, etat.SEANCES.length]);
  return null;
}
