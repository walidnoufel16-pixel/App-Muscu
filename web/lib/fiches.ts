"use client";

/* Textes des fiches d'exercice : 120 Ko chargés une seule fois, à la première
   fiche ouverte, plutôt qu'au démarrage de chaque écran. Le service worker les
   met en cache avec le reste : ils restent disponibles hors ligne. */
import { useEffect, useState } from "react";
import type { Fiche } from "@/lib/data/types";

let promesse: Promise<Record<string, Fiche>> | null = null;
const charger = () => (promesse ??= fetch("/data/fiches.json").then((r) => r.json()).catch((e) => { promesse = null; throw e; }));

export function useFiche(id: string | null | undefined) {
  const [fiches, setFiches] = useState<Record<string, Fiche> | null>(null);
  useEffect(() => {
    if (!id) return;
    let actif = true;
    charger().then((f) => { if (actif) setFiches(f); }).catch(() => {});
    return () => { actif = false; };
  }, [id]);
  return id && fiches ? fiches[id] ?? null : null;
}
