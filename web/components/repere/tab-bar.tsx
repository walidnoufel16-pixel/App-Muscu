"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarbellIcon, PersonSimpleIcon, UserCircleIcon } from "@phosphor-icons/react";
import { useRepere } from "@/lib/store";
import { cn } from "@/lib/utils";

/* Trois onglets, un rôle chacun : faire, chercher, régler. */
const ONGLETS = [
  { href: "/entrainement", nom: "Entraînement", Icone: BarbellIcon },
  { href: "/exercices", nom: "Exercices", Icone: PersonSimpleIcon },
  { href: "/profil", nom: "Profil", Icone: UserCircleIcon },
] as const;

/* Barre d'onglets flottante, translucide, au-dessus de la zone sûre. */
export function TabBar() {
  const chemin = usePathname().replace(/(.)\/$/, "$1");
  const sync = useRepere((s) => s.sync);
  return (
    <nav
      aria-label="Navigation principale"
      style={{ viewTransitionName: "onglets" }}
      className="fixed inset-x-0 bottom-0 z-40 mx-auto max-w-[480px] px-3 pb-[max(env(safe-area-inset-bottom),10px)]"
    >
      <div className="grid grid-cols-3 rounded-[22px] border border-border/70 bg-card/80 p-1.5 shadow-[0_8px_30px_-12px_rgba(0,0,0,.25)] backdrop-blur-xl backdrop-saturate-150">
        {ONGLETS.map(({ href, nom, Icone }) => {
          const actif = chemin === href || chemin.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              aria-current={actif ? "page" : undefined}
              className={cn(
                "relative flex flex-col items-center gap-1 rounded-2xl py-2 text-[10.5px] font-medium transition-colors",
                actif ? "bg-foreground/[.06] text-foreground" : "text-muted-foreground hover:text-foreground",
              )}
            >
              <span className="relative">
                <Icone className={cn("size-[22px]", actif && "animate-[rebond_.45s_cubic-bezier(.3,1.6,.5,1)]")} weight={actif ? "fill" : "regular"} />
                {href === "/profil" && sync !== null && (
                  <span
                    className={cn("absolute -top-0.5 -right-1 size-2 rounded-full ring-2 ring-card", sync ? "bg-success" : "bg-muted-foreground")}
                    aria-label={sync ? "Synchronisé" : "Hors ligne"}
                  />
                )}
              </span>
              {nom}
              {actif && <span className="absolute -bottom-0.5 h-[3px] w-5 rounded-full bg-plate" aria-hidden />}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
