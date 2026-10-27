"use client";

/* Menu latéral (☰) : tout ce qui n'est pas du quotidien. Les quatre onglets du bas gardent
   l'entraînement, les exercices, les repas et les progrès ; ici, le compte, les réglages,
   les défis, les badges, l'import d'une séance et l'installation de l'app. */
import { tr } from "@/lib/i18n";
import { usePathname, useRouter } from "next/navigation";
import type { Route } from "next";
import { CaretRightIcon, ListIcon } from "@phosphor-icons/react";
import { Drawer, DrawerContent, DrawerDescription, DrawerTitle } from "@/components/ui/drawer";
import { useRepere } from "@/lib/store";
import { useEstAdmin } from "@/lib/admin";
import { useMenu, useVueEntrainement } from "@/lib/nav";
import { tactile } from "@/lib/repos";
import { appInstallee } from "./installer";
import { cn } from "@/lib/utils";

/* Les écrans des quatre onglets, et « Compte et réglages » : le bouton ☰ y remplace le retour. */
export const RACINES = ["/entrainement", "/exercices", "/repas", "/progres", "/profil"];
export const estRacine = (chemin: string) => RACINES.includes(chemin.replace(/\/$/, "") || "/");

/** Bouton ☰ de l'en-tête, avec la pastille de synchronisation. */
export function BoutonMenu() {
  const sync = useRepere((s) => s.sync);
  return (
    <button onClick={() => { tactile(6); useMenu.setState({ ouvert: true }); }} aria-label={tr("Menu")} className="relative -ml-1.5 grid size-10 place-items-center rounded-full active:bg-muted">
      <ListIcon className="size-6" weight="bold" />
      {sync !== null && <span className={cn("absolute top-2 right-1.5 size-2 rounded-full ring-2 ring-background", sync ? "bg-success" : "bg-muted-foreground")} aria-label={sync ? tr("Synchronisé") : tr("Hors ligne")} />}
    </button>
  );
}

/* Va sur un écran, puis sur une section : elle défile en haut et s'éclaire un instant. */
function allerA(router: ReturnType<typeof useRouter>, chemin: string, ancre?: string) {
  router.push(chemin as Route);
  if (!ancre) return;
  let essais = 0;
  const chercher = () => {
    const el = document.getElementById(ancre);
    if (!el) { if (++essais < 40) setTimeout(chercher, 100); return; }
    el.scrollIntoView({ block: "start", behavior: "smooth" });
    el.animate([{ backgroundColor: "color-mix(in oklab, var(--plate) 14%, transparent)" }, { backgroundColor: "transparent" }], { duration: 1600, easing: "ease-out" });
  };
  setTimeout(chercher, 150);
}

export function MenuLateral() {
  const router = useRouter(), chemin = usePathname();
  const ouvert = useMenu((s) => s.ouvert);
  const { pseudo, user, sync } = useRepere();
  const admin = useEstAdmin() === true;
  const fermer = () => useMenu.setState({ ouvert: false });
  const va = (c: string, ancre?: string) => () => { tactile(5); fermer(); setTimeout(() => allerA(router, c, ancre), 180); };
  const initiale = (pseudo || "?").trim().charAt(0).toUpperCase();

  type Ligne = { e: string; n: string; onClick: () => void; cache?: boolean };
  const blocs: { titre: string; l: Ligne[] }[] = [
    {
      titre: tr("Aller plus loin"),
      l: [
        { e: "🏆", n: tr("Défis entre amis"), onClick: va("/progres", "defis") },
        { e: "🎖️", n: tr("Badges et bilans"), onClick: va("/progres", "badges") },
        { e: "📅", n: tr("Programme 8 semaines"), onClick: () => { useVueEntrainement.setState({ vue: "programme" }); va("/entrainement")(); } },
        { e: "📥", n: tr("Importer une séance"), onClick: () => { useVueEntrainement.setState({ vue: "libres" }); va("/entrainement")(); setTimeout(() => useMenu.setState({ importer: true }), 500); } },
      ],
    },
    {
      titre: tr("Mes réglages"),
      l: [
        { e: "🧰", n: tr("Mon matériel"), onClick: va("/profil", "materiel") },
        { e: "🍽️", n: tr("Préférences repas"), onClick: va("/repas?prefs=1") },
        { e: "⚙️", n: tr("Réglages : langue, apparence, silhouette"), onClick: va("/profil", "reglages") },
      ],
    },
    {
      titre: tr("L'app"),
      l: [
        { e: "📲", n: tr("Installer l'app"), onClick: () => { tactile(5); fermer(); setTimeout(() => useMenu.setState({ installer: true }), 250); }, cache: appInstallee() && !admin },
        { e: "🔒", n: tr("Confidentialité"), onClick: va("/profil", "confidentialite") },
        { e: "📄", n: tr("Crédits"), onClick: va("/profil", "credits") },
        { e: "🛠️", n: tr("Administration"), onClick: va("/admin"), cache: !admin },
      ],
    },
  ];

  return (
    <Drawer open={ouvert} onOpenChange={(o) => useMenu.setState({ ouvert: o })} direction="left">
      <DrawerContent className="w-[82%] max-w-[340px] rounded-r-[26px] border-r-0 bg-background">
        <div className="flex h-full flex-col overflow-y-auto overscroll-contain px-3 pt-[max(env(safe-area-inset-top),16px)] pb-[max(env(safe-area-inset-bottom),16px)]">
          <DrawerTitle className="sr-only">{tr("Menu")}</DrawerTitle>
          <DrawerDescription className="sr-only">{tr("Compte, réglages, défis, badges et plus")}</DrawerDescription>
          {/* le compte */}
          <button onClick={va("/profil", "compte")} className={cn("flex items-center gap-3 rounded-[20px] bg-card p-3.5 text-left active:opacity-80", chemin.startsWith("/profil") && "ring-2 ring-plate/40")}>
            <span className="grid size-12 shrink-0 place-items-center rounded-full bg-plate text-[20px] font-bold text-plate-foreground">{initiale}</span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[17px] font-semibold">{pseudo || tr("Mon compte")}</span>
              <span className="flex items-center gap-1.5 text-[12.5px] text-muted-foreground">
                <span className={cn("size-2 rounded-full", user && sync ? "bg-success" : "bg-muted-foreground")} />
                {user ? (sync ? tr("Synchronisé") : tr("Hors ligne")) : tr("Sur ce téléphone")}
              </span>
            </span>
            <CaretRightIcon className="size-4 text-muted-foreground" />
          </button>

          {blocs.map((b) => (
            <section key={b.titre} className="mt-5" aria-label={b.titre}>
              <h2 className="eyebrow mb-1.5 px-2">{b.titre}</h2>
              <div className="overflow-hidden rounded-[18px] bg-card">
                {b.l.filter((x) => !x.cache).map((x) => (
                  <button key={x.n} onClick={x.onClick} className="flex w-full items-center gap-3 border-t border-border/60 px-3.5 py-3 text-left first:border-t-0 active:bg-muted">
                    <span className="grid size-8 shrink-0 place-items-center rounded-[10px] bg-muted text-[17px]" aria-hidden>{x.e}</span>
                    <span className="flex-1 text-[15px] font-medium">{x.n}</span>
                    <CaretRightIcon className="size-3.5 text-muted-foreground" />
                  </button>
                ))}
              </div>
            </section>
          ))}
        </div>
      </DrawerContent>
    </Drawer>
  );
}
