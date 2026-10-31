/* Logo d'Oxa : un anneau de progression rempli aux trois quarts (comme la frise des semaines
   et le minuteur), et au centre un haltère incliné vers le haut. Source de l'icône :
   public/icone-source.svg (même dessin). */
import { tr } from "@/lib/i18n";
import { cn } from "@/lib/utils";

/** Icône d'app : l'anneau et l'haltère en blanc sur une tuile cobalt. */
export function LogoTuile({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 512 512" className={cn("rounded-[22.37%]", className)} role="img" aria-label={tr("Oxa")}>
      <defs>
        <linearGradient id="logo-fond" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#3b67f5" />
          <stop offset="1" stopColor="#2346c4" />
        </linearGradient>
      </defs>
      <rect width="512" height="512" fill="url(#logo-fond)" />
      <Disque couleur="#fff" />
    </svg>
  );
}

/** L'anneau et l'haltère seuls, dans la couleur du texte (ou cobalt avec `accent`). */
export function LogoDisque({ className, accent }: { className?: string; accent?: boolean }) {
  return (
    <svg viewBox="58 58 396 396" className={cn(accent ? "text-plate" : "", className)} role="img" aria-label={tr("Oxa")}>
      <Disque couleur="currentColor" />
    </svg>
  );
}

function Disque({ couleur }: { couleur: string }) {
  return (
    <>
      <circle cx="256" cy="256" r="178" fill="none" stroke={couleur} strokeOpacity=".28" strokeWidth="40" />
      <circle cx="256" cy="256" r="178" fill="none" stroke={couleur} strokeWidth="40" strokeLinecap="round" strokeDasharray="838.6 1118.4" transform="rotate(-90 256 256)" />
      <g fill={couleur} transform="translate(256 256) rotate(-35) scale(.72)">
        <rect x="-120" y="-15" width="240" height="30" rx="8" />
        <rect x="-142" y="-80" width="44" height="160" rx="16" />
        <rect x="98" y="-80" width="44" height="160" rx="16" />
        <rect x="-184" y="-58" width="36" height="116" rx="14" />
        <rect x="148" y="-58" width="36" height="116" rx="14" />
        <rect x="-206" y="-22" width="28" height="44" rx="10" />
        <rect x="178" y="-22" width="28" height="44" rx="10" />
      </g>
    </>
  );
}
