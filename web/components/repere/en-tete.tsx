"use client";

import { useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { BoutonMenu, estRacine } from "./menu-lateral";
import { Retour } from "./retour";
import { usePile } from "@/lib/nav";

const rien = () => () => {};

/* Grand titre façon iOS : la barre prend un fond translucide dès que la page défile,
   et le titre s'y réduit quand le grand titre sort de l'écran. */
export function EnTete({
  surtitre, titre, actions, gauche, children, className, aside,
}: {
  surtitre?: React.ReactNode;
  /** à droite du grand titre (anneau d'avancement d'une séance…) */
  aside?: React.ReactNode;
  titre: React.ReactNode;
  actions?: React.ReactNode;
  gauche?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
}) {
  const chemin = usePathname();
  /* page d'accueil d'un onglet ouverte depuis un autre écran (et non par la barre du bas) : on peut y revenir */
  const retourPossible = usePile((s) => {
    const prec = s.pile.at(-2)?.split("?")[0].replace(/(.)\/$/, "$1");
    return !!prec && !["/", "/bienvenue", "/questionnaire"].includes(prec);
  });
  const ref = useRef<HTMLHeadingElement>(null);
  /* le titre réduit de la barre : coupé, il n'est pas affiché */
  const reduit = useRef<HTMLDivElement>(null);
  const [coupe, setCoupe] = useState(false);
  const [replie, setReplie] = useState(false);
  const [fond, setFond] = useState(false);
  /* la barre est rendue hors de la page (dans <body>), comme la barre d'onglets : dans la page,
     sous la transition d'écran, l'iPhone la dessinait en basse résolution (menu, avatar flous) */
  const monte = useSyncExternalStore(rien, () => true, () => false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setReplie(!e.isIntersecting), { rootMargin: "-44px 0px 0px 0px" });
    io.observe(el);
    /* le fond paraît dès que la page défile : rien ne passe sous l'heure sans fond */
    const defile = () => setFond(window.scrollY > 4);
    defile();
    window.addEventListener("scroll", defile, { passive: true });
    return () => { io.disconnect(); window.removeEventListener("scroll", defile); };
  }, []);
  useLayoutEffect(() => {
    const el = reduit.current;
    if (!el) return;
    const mesurer = () => setCoupe(el.scrollWidth > el.clientWidth + 1);
    mesurer();
    const ro = new ResizeObserver(mesurer);
    ro.observe(el);
    return () => ro.disconnect();
  }, [monte, titre, actions]);
  return (
    <>
      {/* Barre fixe (et non « sticky ») : sur iPhone, le contenu d'une barre sticky est dessiné flou.
          Une cale de même hauteur garde la place dans la page. */}
      <div className="safe-top" aria-hidden><div className="h-11" /></div>
      {monte && createPortal(
      <div className="safe-top fixed inset-x-0 top-0 z-30 mx-auto max-w-[480px]" style={{ viewTransitionName: "entete" }}>
        {/* Le flou est sur une couche à part, derrière le contenu : sur iPhone, ce qui est
            à l'intérieur d'un élément flouté (backdrop-filter) est dessiné en basse résolution. */}
        {/* Fond uni, sans backdrop-filter : sur iPhone, un fond flouté fait dessiner en basse
            résolution ce qui est posé dessus (bouton retour, menu, avatar). Il paraît quand la page a défilé,
            sans fondu (un fondu y laissait aussi le texte flou jusqu'au défilement suivant). */}
        {fond && (
          <div
            aria-hidden
            data-fond
            className="pointer-events-none absolute inset-0 border-b border-border/70 bg-background"
          />
        )}
        {/* retour à gauche, actions à droite, de même largeur : le titre réduit est centré sur l'écran (tronqué plutôt que chevauchant) */}
        <div className="relative grid h-11 grid-cols-[minmax(max-content,1fr)_minmax(0,auto)_minmax(max-content,1fr)] items-center gap-2 px-4">
          <div className="flex min-w-0 items-center">{gauche ?? (estRacine(chemin) ? <>{retourPossible && <Retour repli="/entrainement" />}<BoutonMenu /></> : null)}</div>
          {/* pas la place pour le titre en entier (« F… » ne dirait rien) : on ne l'affiche pas */}
          <div
            ref={reduit}
            className={cn(
              "pointer-events-none truncate text-center text-[15px] font-semibold",
              (!replie || coupe) && "invisible",
            )}
            aria-hidden
          >
            {titre}
          </div>
          <div className="flex shrink-0 items-center justify-end gap-1">{actions}</div>
        </div>
      </div>,
        document.body,
      )}
      <header className={cn("px-5 pt-1 pb-3", className)}>
        <div className="flex items-center gap-3.5">
          <div className="min-w-0 flex-1">
            {surtitre && <div className="eyebrow mb-1">{surtitre}</div>}
            <h1 ref={ref} className="titre line-clamp-3 text-[32px] leading-[1.05] text-balance">
              {titre}
            </h1>
          </div>
          {aside}
        </div>
        {children}
      </header>
    </>
  );
}
