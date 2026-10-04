"use client";

/* Petits graphiques en SVG, sans bibliothèque : une courbe, des barres, un calendrier.
   Le tracé se dessine à l'apparition (keyframe `tracer`) sauf en mouvement réduit. */
import { useId, useState } from "react";
import { cn } from "@/lib/utils";

const fmt = (v: number) => (Math.round(v * 10) / 10).toLocaleString("fr-FR");

/** Courbe : un point par séance. Toucher le graphique sélectionne le point le plus proche. */
export function Courbe({ points, unite = "", hauteur = 150, className }: {
  points: { x: string; y: number; info?: string }[];
  unite?: string;
  hauteur?: number;
  className?: string;
}) {
  const id = useId();
  const [sel, setSel] = useState<number | null>(null);
  const W = 320, H = hauteur, px = 10, haut = 26, bas = 22;
  if (!points.length) return null;
  const ys = points.map((p) => p.y);
  let min = Math.min(...ys), max = Math.max(...ys);
  if (max - min < 1e-6) { min -= 1; max += 1; }
  const marge = (max - min) * 0.15;
  min = Math.max(0, min - marge); max += marge;
  const X = (i: number) => (points.length === 1 ? W / 2 : px + (i * (W - 2 * px)) / (points.length - 1));
  const Y = (v: number) => haut + (1 - (v - min) / (max - min)) * (H - haut - bas);
  const d = points.map((p, i) => `${i ? "L" : "M"}${X(i).toFixed(1)},${Y(p.y).toFixed(1)}`).join("");
  const aire = `${d}L${X(points.length - 1).toFixed(1)},${H - bas}L${X(0).toFixed(1)},${H - bas}Z`;
  const i = sel ?? points.length - 1, p = points[i];
  const toucher = (e: React.PointerEvent<SVGSVGElement>) => {
    const r = e.currentTarget.getBoundingClientRect(), x = ((e.clientX - r.left) / r.width) * W;
    let best = 0;
    points.forEach((_, j) => { if (Math.abs(X(j) - x) < Math.abs(X(best) - x)) best = j; });
    setSel(best);
  };
  const bulleX = Math.min(W - 60, Math.max(60, X(i)));
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className={cn("block w-full touch-pan-y select-none", className)} onPointerDown={toucher} onPointerMove={(e) => e.buttons && toucher(e)} role="img"
      aria-label={`Courbe : de ${fmt(points[0].y)} à ${fmt(points[points.length - 1].y)} ${unite}`}>
      <defs>
        <linearGradient id={id} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="var(--plate)" stopOpacity=".28" />
          <stop offset="1" stopColor="var(--plate)" stopOpacity="0" />
        </linearGradient>
      </defs>
      {[0.25, 0.5, 0.75].map((t) => (
        <line key={t} x1={0} x2={W} y1={haut + t * (H - haut - bas)} y2={haut + t * (H - haut - bas)} className="stroke-border" strokeDasharray="2 4" />
      ))}
      {points.length > 1 && <path d={aire} fill={`url(#${id})`} className="animate-[monter_.6s_ease-out_both]" />}
      {points.length > 1 && (
        <path d={d} pathLength={1} fill="none" stroke="var(--plate)" strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round"
          strokeDasharray="1" className="animate-[tracer_1s_cubic-bezier(.4,0,.2,1)_both] motion-reduce:animate-none" />
      )}
      {points.map((q, j) => (
        <circle key={j} cx={X(j)} cy={Y(q.y)} r={j === i ? 5 : points.length > 24 ? 0 : 2.6}
          className={j === i ? "fill-plate stroke-card" : "fill-card stroke-plate"} strokeWidth={j === i ? 2.5 : 1.6} />
      ))}
      <line x1={X(i)} x2={X(i)} y1={haut - 2} y2={H - bas} className="stroke-plate/40" strokeDasharray="3 3" />
      <g transform={`translate(${bulleX},12)`}>
        <rect x={-58} y={-11} width={116} height={20} rx={10} className="fill-foreground" />
        <text textAnchor="middle" y={3.5} className="fill-background text-[10.5px] font-semibold">{fmt(p.y)}{unite && " " + unite} · {p.info ?? p.x}</text>
      </g>
      <text x={2} y={H - 6} className="fill-muted-foreground text-[9.5px]">{points[0].x}</text>
      {points.length > 1 && <text x={W - 2} y={H - 6} textAnchor="end" className="fill-muted-foreground text-[9.5px]">{points[points.length - 1].x}</text>}
    </svg>
  );
}

/** Barres verticales, la dernière (en cours) en couleur pleine. */
export function Barres({ valeurs, unite = "", hauteur = 120, couleur = "var(--plate)" }: {
  valeurs: { x: string; y: number }[];
  unite?: string;
  hauteur?: number;
  couleur?: string;
}) {
  const W = 320, H = hauteur, bas = 18, haut = 16, n = valeurs.length;
  const max = Math.max(1, ...valeurs.map((v) => v.y)), larg = (W / n) * 0.62;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="block w-full" role="img" aria-label={`Dernière valeur : ${fmt(valeurs[n - 1]?.y ?? 0)} ${unite}`}>
      {valeurs.map((v, i) => {
        const h = (v.y / max) * (H - bas - haut), x = (i + 0.5) * (W / n) - larg / 2, der = i === n - 1;
        return (
          <g key={i}>
            <rect x={x} y={H - bas - Math.max(h, v.y ? 2 : 0)} width={larg} height={Math.max(h, v.y ? 2 : 0)} rx={Math.min(5, larg / 3)}
              fill={couleur} opacity={der ? 1 : 0.38} style={{ transformOrigin: `0 ${H - bas}px`, animationDelay: i * 30 + "ms" }}
              className="animate-[pousser_.6s_cubic-bezier(.3,1.3,.5,1)_both] motion-reduce:animate-none" />
            {(der || v.y === max) && v.y > 0 && (
              <text x={x + larg / 2} y={H - bas - h - 4} textAnchor="middle" className="fill-foreground text-[9.5px] font-semibold">{fmt(v.y)}</text>
            )}
            {(n - 1 - i) % 3 === 0 && <text x={x + larg / 2} y={H - 4} textAnchor="middle" className="fill-muted-foreground text-[8.5px]">{v.x}</text>}
          </g>
        );
      })}
    </svg>
  );
}

/** Calendrier d'activité : une colonne par semaine (lundi en haut), une case par jour. */
export function Calendrier({ jours, etat, onJour, aujourdhui }: {
  jours: string[]; // tous les jours affichés, du plus ancien au plus récent, en commençant un lundi
  etat: (j: string) => { muscu: boolean; cardio: boolean } | undefined;
  onJour: (j: string) => void;
  aujourdhui: string;
}) {
  const colonnes = Math.ceil(jours.length / 7);
  return (
    <div className="grid grid-flow-col grid-rows-7 gap-[3px]" style={{ gridTemplateColumns: `repeat(${colonnes}, minmax(0, 1fr))` }}>
      {jours.map((j, i) => {
        const e = etat(j), futur = j > aujourdhui;
        const fond = !e ? "var(--muted)" : e.muscu && e.cardio
          ? "linear-gradient(135deg, var(--plate) 50%, var(--success) 50%)" : e.muscu ? "var(--plate)" : "var(--success)";
        return (
          <button
            key={j}
            disabled={futur || !e}
            onClick={() => onJour(j)}
            aria-label={`${j}${e ? (e.muscu ? " · musculation" : "") + (e.cardio ? " · cardio" : "") : ""}`}
            className={cn("aspect-square rounded-[4px] transition-transform active:scale-90", futur && "opacity-0", j === aujourdhui && "ring-2 ring-foreground/50 ring-offset-1 ring-offset-card")}
            style={{ background: fond, animation: e ? `pop .35s ${Math.min(i * 6, 500)}ms both` : undefined }}
          />
        );
      })}
    </div>
  );
}
