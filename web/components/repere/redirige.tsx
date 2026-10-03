"use client";

import type { Route } from "next";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

/* Anciennes adresses (avant la navigation en trois onglets) : elles mènent au
   nouvel écran, en gardant les paramètres utiles. */
export function Redirige({ vers, params }: { vers: string; params?: Record<string, string> }) {
  const router = useRouter();
  useEffect(() => {
    const q = new URLSearchParams(location.search), r = new URLSearchParams();
    for (const [a, b] of Object.entries(params || {})) { const v = q.get(a); if (v != null) r.set(b, v); }
    router.replace((vers + (r.size ? "?" + r : "")) as Route);
  }, [router, vers, params]);
  return null;
}
