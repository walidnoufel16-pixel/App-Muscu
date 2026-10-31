/* Logo d'Oxa : un haltère qui décolle, propulsé par deux flammes de fusée (tu progresses).
   Tuile noire, haltère blanc, flammes turquoise. L'haltère et les
   flammes ont chacun leur couleur. Source de l'icône : public/icone-source.svg (même dessin). */
import { useId } from "react";
import { tr } from "@/lib/i18n";
import { cn } from "@/lib/utils";

/** Icône d'app : tuile noire, haltère blanc, flammes turquoise. Le dessin est réduit (0,84) pour
    tenir dans la zone sûre des icônes Android, rognées en cercle. */
export function LogoTuile({ className }: { className?: string }) {
  const id = useId();
  return (
    <svg viewBox="0 0 512 512" className={cn("rounded-[22.37%]", className)} role="img" aria-label={tr("Oxa")}>
      <defs>
        <linearGradient id={`${id}fond`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#25252b" />
          <stop offset="1" stopColor="#0a0a0c" />
        </linearGradient>
      </defs>
      <rect width="512" height="512" fill={`url(#${id}fond)`} />
      <g transform="translate(256 256) scale(.84) translate(-256 -256)">
        <Marque haltere="#fff" flamme="#2dd4bf" />
      </g>
    </svg>
  );
}

/** Le logo sans tuile, dans la couleur du texte. `feu` colore les flammes en turquoise
    (sinon elles suivent le texte, pour les filigranes). `accent` : haltère couleur d'action. */
export function LogoDisque({ className, accent, feu }: { className?: string; accent?: boolean; feu?: boolean }) {
  return (
    <svg viewBox="64 64 384 384" className={cn(accent ? "text-plate" : "", className)} role="img" aria-label={tr("Oxa")}>
      <Marque haltere="currentColor" flamme={feu ? "var(--feu)" : "currentColor"} />
    </svg>
  );
}

/* une flamme sous le disque d'abscisse x : large à la sortie de la tuyère, pointue en bas */
const flamme = (x: number) => `M${x - 24} 270 C${x - 54} 318 ${x - 38} 410 ${x} 486 C${x + 38} 410 ${x + 54} 318 ${x + 24} 270 Z`;
const tuyere = (x: number) => `M${x - 18} 242 H${x + 18} L${x + 26} 272 H${x - 26} Z`;

/** Le dessin, centré dans un carré de 512. */
function Marque({ haltere, flamme: couleur }: { haltere: string; flamme: string }) {
  const id = useId();
  return (
    <g transform="translate(0 -28)">
      <defs>
        <linearGradient id={`${id}f`} gradientUnits="userSpaceOnUse" x1="0" y1="270" x2="0" y2="486">
          <stop offset="0" stopColor={couleur} stopOpacity=".95" />
          <stop offset="1" stopColor={couleur} stopOpacity="0" />
        </linearGradient>
      </defs>
      {[153, 359].map((x) => (
        <g key={x}>
          <path d={tuyere(x)} fill={haltere} />
          <path d={flamme(x)} fill={`url(#${id}f)`} />
        </g>
      ))}
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
