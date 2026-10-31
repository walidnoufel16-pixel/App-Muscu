/* Logo d'Oxa : un haltère soulevé, avec deux traînées sous les disques (il décolle : tu progresses).
   L'haltère et les traînées ont chacun leur couleur (`haltere`, `trainee`), pour pouvoir les
   distinguer plus tard. Source de l'icône : public/icone-source.svg (même dessin). */
import { useId } from "react";
import { tr } from "@/lib/i18n";
import { cn } from "@/lib/utils";

/** Icône d'app : l'haltère blanc sur une tuile cobalt. Le dessin est réduit (0,84) pour tenir dans
    la zone sûre des icônes Android, rognées en cercle. */
export function LogoTuile({ className }: { className?: string }) {
  const id = useId();
  return (
    <svg viewBox="0 0 512 512" className={cn("rounded-[22.37%]", className)} role="img" aria-label={tr("Oxa")}>
      <defs>
        <linearGradient id={`${id}fond`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#3b67f5" />
          <stop offset="1" stopColor="#2346c4" />
        </linearGradient>
      </defs>
      <rect width="512" height="512" fill={`url(#${id}fond)`} />
      <g transform="translate(256 256) scale(.84) translate(-256 -256)">
        <Marque haltere="#fff" trainee="#fff" />
      </g>
    </svg>
  );
}

/** L'haltère seul, dans la couleur du texte (ou cobalt avec `accent`). */
export function LogoDisque({ className, accent }: { className?: string; accent?: boolean }) {
  return (
    <svg viewBox="64 64 384 384" className={cn(accent ? "text-plate" : "", className)} role="img" aria-label={tr("Oxa")}>
      <Marque haltere="currentColor" trainee="currentColor" />
    </svg>
  );
}

/** Le dessin, centré dans un carré de 512. */
function Marque({ haltere, trainee }: { haltere: string; trainee: string }) {
  const id = useId();
  return (
    <g transform="translate(0 -28)">
      <defs>
        <linearGradient id={`${id}t`} gradientUnits="userSpaceOnUse" x1="0" y1="252" x2="0" y2="470">
          <stop offset="0" stopColor={trainee} stopOpacity=".9" />
          <stop offset="1" stopColor={trainee} stopOpacity="0" />
        </linearGradient>
      </defs>
      <rect x="119" y="252" width="58" height="218" rx="29" fill={`url(#${id}t)`} />
      <rect x="335" y="252" width="58" height="218" rx="29" fill={`url(#${id}t)`} />
      <g fill={haltere} transform="translate(256 170) scale(.86)">
        <rect x="-120" y="-15" width="240" height="30" rx="8" />
        <rect x="-142" y="-80" width="44" height="160" rx="16" />
        <rect x="98" y="-80" width="44" height="160" rx="16" />
        <rect x="-184" y="-58" width="36" height="116" rx="14" />
        <rect x="148" y="-58" width="36" height="116" rx="14" />
        <rect x="-206" y="-22" width="28" height="44" rx="10" />
        <rect x="178" y="-22" width="28" height="44" rx="10" />
      </g>
    </g>
  );
}
