"use client";

import { ThemeProvider as NextThemes } from "next-themes";

/* Même clé que l'ancienne version (« light », « dark », ou absente = suivre le système). */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextThemes attribute="class" storageKey="repere-theme" defaultTheme="system" enableSystem disableTransitionOnChange>
      {children}
    </NextThemes>
  );
}
