"use client";

import type { Route } from "next";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { remplacement } from "@/lib/nav";

/* Anciennes adresses (avant la navigation en trois onglets) : elles mènent au
   nouvel écran, en gardant les paramètres utiles. */
export function Redirige({ vers, params, force }: { vers: string; params?: Record<string, string>; force?: Record<string, string> }) {
  const router = useRouter();
  useEffect(() => {
    const q = new URLSearchParams(location.search), r = new URLSearchParams();
    for (const [a, b] of Object.entries(params || {})) { const v = q.get(a); if (v != null) r.set(b, v); }
    for (const [a, v] of Object.entries(force || {})) r.set(a, v);
    remplacement();
    router.replace((vers + (r.size ? "?" + r : "")) as Route);
  }, [router, vers, params, force]);
  return null;
}
