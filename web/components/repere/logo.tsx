/* Logo de Repère : un disque vu de face dont l'anneau se remplit aux trois quarts,
   comme la frise des semaines et le minuteur. Source de l'icône : public/icone-source.svg. */
import { cn } from "@/lib/utils";

/** Icône d'app : le disque blanc sur une tuile cobalt. */
export function LogoTuile({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 512 512" className={cn("rounded-[22.37%]", className)} role="img" aria-label="Repère">
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

/** Le disque seul, dans la couleur du texte (ou cobalt avec `accent`). */
export function LogoDisque({ className, accent }: { className?: string; accent?: boolean }) {
  return (
    <svg viewBox="80 80 352 352" className={cn(accent ? "text-plate" : "", className)} role="img" aria-label="Repère">
      <Disque couleur="currentColor" />
    </svg>
  );
}

function Disque({ couleur }: { couleur: string }) {
  return (
    <>
      <circle cx="256" cy="256" r="148" fill="none" stroke={couleur} strokeOpacity=".28" strokeWidth="46" />
      <circle cx="256" cy="256" r="148" fill="none" stroke={couleur} strokeWidth="46" strokeLinecap="round" strokeDasharray="697.4 929.9" transform="rotate(-90 256 256)" />
      <circle cx="256" cy="256" r="34" fill={couleur} />
    </>
  );
}
