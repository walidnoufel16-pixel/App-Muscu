"use client";

/* Menu latéral (☰) : tout ce qui n'est pas du quotidien. Les trois onglets du bas gardent
   l'entraînement, les repas et les progrès ; ici, le compte, l'invitation d'un ami, les défis,
   les réglages (matériel, rappels, repas, apparence), l'avis et l'installation de l'app.
   Confidentialité et crédits en petits liens, en bas. */
import { langue, tr } from "@/lib/i18n";
import { usePathname, useRouter } from "next/navigation";
import type { Route } from "next";
import { BellIcon, CalendarDotsIcon, CompassIcon, CaretRightIcon, ChatCircleTextIcon, CircleHalfIcon, DeviceMobileIcon, DownloadSimpleIcon, ForkKnifeIcon, ListIcon, NewspaperIcon, ToolboxIcon, TrophyIcon, UserPlusIcon, WrenchIcon, type Icon } from "@phosphor-icons/react";
import { Drawer, DrawerContent, DrawerDescription, DrawerTitle } from "@/components/ui/drawer";
import { useRepere } from "@/lib/store";
import { useEstAdmin } from "@/lib/admin";
import { useMenu } from "@/lib/nav";
import { lienRubrique } from "./rubriques";
import { tactile } from "@/lib/repos";
import { appInstallee } from "./installer";
import { inviterAmi } from "./inviter";
import { revoirVisite } from "./visite";
import { useProgrammeActif } from "@/lib/fonctionnalites";
import { cn } from "@/lib/utils";

/* Les écrans des quatre onglets, et « Compte et réglages » : le bouton ☰ y remplace le retour. */
export const RACINES = ["/entrainement", "/repas", "/progres", "/profil"];
export const estRacine = (chemin: string) => RACINES.includes(chemin.replace(/\/$/, "") || "/");

/** Bouton ☰ de l'en-tête, avec la pastille de synchronisation. */
export function BoutonMenu() {
  const sync = useRepere((s) => s.sync);
  return (
    <button data-visite="menu" onClick={() => { tactile(6); useMenu.setState({ ouvert: true }); }} aria-label={tr("Menu")} className="relative -ml-1.5 grid size-10 place-items-center rounded-full active:bg-muted">
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
  const programme = useProgrammeActif();
  const fermer = () => useMenu.setState({ ouvert: false });
  const va = (c: string, ancre?: string) => () => { tactile(5); fermer(); setTimeout(() => allerA(router, c, ancre), 180); };
  const initiale = (pseudo || "?").trim().charAt(0).toUpperCase();

  type Ligne = { Icone: Icon; n: string; onClick: () => void; cache?: boolean };
  const ouvrir = (cle: "installer" | "avis") => () => { tactile(5); fermer(); setTimeout(() => useMenu.setState({ [cle]: true }), 250); };
  const blocs: { titre: string; l: Ligne[] }[] = [
    {
      titre: tr("Mon entraînement"),
      l: [
        { Icone: TrophyIcon, n: tr("Défis et badges"), onClick: va("/progres?o=defis", "defis") },
        { Icone: CalendarDotsIcon, n: `Oxa Plan · ${tr("8 semaines")}`, onClick: va(lienRubrique("programme")), cache: !programme && !admin },
        { Icone: DownloadSimpleIcon, n: tr("Importer une séance"), onClick: () => { va(lienRubrique("libre"))(); setTimeout(() => useMenu.setState({ importer: true }), 500); } },
      ],
    },
    {
      titre: tr("Mes réglages"),
      l: [
        { Icone: ToolboxIcon, n: tr("Mon matériel"), onClick: va("/profil", "materiel") },
        { Icone: BellIcon, n: tr("Rappels"), onClick: va("/profil", "rappels") },
        { Icone: ForkKnifeIcon, n: tr("Préférences repas"), onClick: va("/repas?prefs=1") },
        { Icone: CircleHalfIcon, n: tr("Apparence et langue"), onClick: va("/profil", "apparence") },
      ],
    },
    {
      titre: tr("Aide"),
      l: [
        { Icone: ChatCircleTextIcon, n: tr("Donner mon avis"), onClick: ouvrir("avis") },
        { Icone: NewspaperIcon, n: tr("Le blog Oxa"), onClick: va(langue() === "en" ? "/en/blog" : "/blog") },
        { Icone: CompassIcon, n: tr("Revoir la visite"), onClick: () => { tactile(5); fermer(); setTimeout(revoirVisite, 300); } },
        { Icone: DeviceMobileIcon, n: tr("Installer l'app"), onClick: ouvrir("installer"), cache: appInstallee() && !admin },
        { Icone: WrenchIcon, n: tr("Administration"), onClick: va("/admin"), cache: !admin },
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
                {user ? (sync ? tr("Synchronisé") : tr("Hors ligne")) : tr("Sur ce téléphone")} · {tr("Profil et compte")}
              </span>
            </span>
            <CaretRightIcon className="size-4 text-muted-foreground" />
          </button>

          {/* faire venir un ami : la façon la plus simple de faire connaître l'app */}
          <button onClick={() => { fermer(); void inviterAmi(); }} className="mt-2.5 flex items-center gap-3 rounded-[18px] bg-plate px-3.5 py-3 text-left text-plate-foreground active:opacity-85">
            <UserPlusIcon className="size-[22px] shrink-0" weight="bold" aria-hidden />
            <span className="min-w-0 flex-1">
              <span className="block text-[15px] font-semibold">{tr("Inviter un ami")}</span>
              <span className="block text-[12.5px] opacity-80">{tr("Envoie-lui le lien d'Oxa, en un geste.")}</span>
            </span>
          </button>

          {blocs.map((b) => (
            <section key={b.titre} className="mt-5" aria-label={b.titre}>
              <h2 className="eyebrow mb-1.5 px-2">{b.titre}</h2>
              <div className="overflow-hidden rounded-[18px] bg-card">
                {b.l.filter((x) => !x.cache).map((x) => (
                  <button key={x.n} onClick={x.onClick} className="flex w-full items-center gap-3 border-t border-border/60 px-3.5 py-3 text-left first:border-t-0 active:bg-muted">
                    {/* même dessin que les icônes des onglets : trait fin, 22 px */}
                    <x.Icone className="size-[22px] shrink-0 text-foreground" aria-hidden />
                    <span className="flex-1 text-[15px] font-medium">{x.n}</span>
                    <CaretRightIcon className="size-3.5 text-muted-foreground" />
                  </button>
                ))}
              </div>
            </section>
          ))}

          <p className="mt-auto pt-6 text-center text-[13px] text-muted-foreground">
            <button onClick={va("/profil?voir=confidentialite")} className="px-1.5 py-1 underline-offset-2 active:underline">{tr("Confidentialité")}</button>
            ·
            <button onClick={va("/profil?voir=credits")} className="px-1.5 py-1 underline-offset-2 active:underline">{tr("Crédits")}</button>
          </p>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
