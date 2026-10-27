"use client";

import { tr } from "@/lib/i18n";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import type { Route } from "next";
import { BarbellIcon, ChartLineUpIcon, ForkKnifeIcon, PersonSimpleIcon, UserCircleIcon } from "@phosphor-icons/react";
import { useRepere } from "@/lib/store";
import { noterPosition, oublierPosition, positionDe } from "@/lib/nav";
import { cn } from "@/lib/utils";

/* Quatre onglets, un rôle chacun : faire, chercher, mesurer, régler. */
const ONGLETS = [
  { href: "/entrainement", nom: tr("Entraînement"), Icone: BarbellIcon },
  { href: "/exercices", nom: tr("Exercices"), Icone: PersonSimpleIcon },
  { href: "/repas", nom: tr("Repas"), Icone: ForkKnifeIcon },
  { href: "/progres", nom: tr("Progrès"), Icone: ChartLineUpIcon },
  { href: "/profil", nom: tr("Profil"), Icone: UserCircleIcon },
] as const;

/* Barre d'onglets flottante, translucide, au-dessus de la zone sûre.
   Comme sur iOS : le contenu change d'un coup, c'est la pastille de sélection qui glisse. */
export function TabBar() {
  const chemin = usePathname().replace(/(.)\/$/, "$1");
  const router = useRouter();
  const sync = useRepere((s) => s.sync);
  const est = (href: string) => chemin === href || chemin.startsWith(href + "/");
  const courant = ONGLETS.findIndex((o) => est(o.href));

  /* arrivée sur la page d'accueil d'un onglet : on remet sa position */
  useEffect(() => {
    const y = positionDe(chemin);
    if (y == null) return;
    requestAnimationFrame(() => requestAnimationFrame(() => window.scrollTo(0, Math.min(y, document.documentElement.scrollHeight - innerHeight))));
  }, [chemin]);

  const toucher = (e: React.MouseEvent, href: string, actif: boolean) => {
    if (!actif) {
      if (ONGLETS.some((o) => o.href === chemin)) noterPosition(chemin, window.scrollY);
      return;
    }
    /* onglet déjà ouvert : on remonte en haut, ou à la page d'accueil de l'onglet */
    e.preventDefault();
    if (chemin === href) window.scrollTo({ top: 0, behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
    else { oublierPosition(href); router.push(href as Route); }
  };

  return (
    <nav
      aria-label={tr("Navigation principale")}
      style={{ viewTransitionName: "onglets" }}
      className="fixed inset-x-0 bottom-0 z-40 mx-auto max-w-[480px] px-3 pb-[max(env(safe-area-inset-bottom),10px)]"
    >
      <div className="relative grid grid-cols-5 rounded-[22px] border border-border/70 bg-card/80 p-1.5 shadow-[0_8px_30px_-12px_rgba(0,0,0,.25)] backdrop-blur-xl backdrop-saturate-150">
        {/* pastille de sélection : une seule, elle glisse d'un onglet à l'autre avec un léger rebond */}
        <span
          aria-hidden
          data-pastille
          className={cn("pointer-events-none absolute top-1.5 bottom-1.5 left-1.5 w-[calc((100%-12px)/5)] rounded-2xl bg-foreground/[.06] transition-transform duration-[420ms] ease-[cubic-bezier(.3,1.3,.5,1)] motion-reduce:transition-none", courant < 0 && "opacity-0")}
          style={{ transform: `translateX(${Math.max(courant, 0) * 100}%)` }}
        >
          <span className="absolute -bottom-2 left-1/2 h-[3px] w-5 -translate-x-1/2 rounded-full bg-plate" />
        </span>
        {ONGLETS.map(({ href, nom, Icone }) => {
          const actif = est(href);
          return (
            <Link
              key={href}
              href={href}
              scroll={false}
              onClick={(e) => toucher(e, href, actif)}
              aria-current={actif ? "page" : undefined}
              className={cn(
                "relative flex flex-col items-center gap-1 rounded-2xl py-2 text-[10.5px] font-medium transition-colors",
                actif ? "text-foreground" : "text-muted-foreground hover:text-foreground",
              )}
            >
              <span className="relative">
                <Icone className={cn("size-[22px]", actif && "animate-[rebond_.45s_cubic-bezier(.3,1.6,.5,1)]")} weight={actif ? "fill" : "regular"} />
                {href === "/profil" && sync !== null && (
                  <span
                    className={cn("absolute -top-0.5 -right-1 size-2 rounded-full ring-2 ring-card", sync ? "bg-success" : "bg-muted-foreground")}
                    aria-label={sync ? tr("Synchronisé") : tr("Hors ligne")}
                  />
                )}
              </span>
              {nom}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
