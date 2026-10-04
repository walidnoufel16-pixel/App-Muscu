"use client";

/* Bilan d'un mois ou d'une année, façon « stories » : on touche à droite pour avancer,
   à gauche pour revenir. Le dernier écran fabrique une image à partager. */
import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { DownloadSimpleIcon, PaperPlaneTiltIcon, XIcon } from "@phosphor-icons/react";
import { LogoDisque } from "@/components/repere/logo";
import { Button } from "@/components/ui/button";
import { useRetour } from "@/components/repere/retour";
import { recap, type Recap } from "@/lib/logic/recap";
import { useRepere } from "@/lib/store";
import { mouvementReduit } from "@/lib/celebrer";
import { cn } from "@/lib/utils";

const fr = (v: number, d = 0) => v.toLocaleString("fr-FR", { maximumFractionDigits: d });

type Ecran = { sur: string; grand: string; sous?: string; detail?: string[] };
function ecrans(r: Recap): Ecran[] {
  const l: Ecran[] = [{
    sur: r.p.annee ? `Ton année ${r.p.nom}` : `Ton mois de ${r.p.nom.split(" ")[0]}`,
    grand: `${r.seances} séance${r.seances > 1 ? "s" : ""}`,
    sous: `${r.jours} jour${r.jours > 1 ? "s" : ""} d'entraînement${r.jourFavori ? `, surtout le ${r.jourFavori}` : ""}.`,
  }];
  if (r.tonnes > 0) l.push({ sur: "Tu as soulevé", grand: r.tonnes >= 1 ? `${fr(r.tonnes, 1)} t` : `${fr(r.tonnes * 1000)} kg`, sous: r.comparaison ? `Soit ${r.comparaison}.` : undefined, detail: [`${fr(r.series)} séries validées`] });
  if (r.record) l.push({ sur: "Ton plus beau record", grand: r.record.n, sous: `${fr(r.record.avant)} → ${fr(r.record.apres)} ${r.record.unite}`, detail: r.nbRecords > 1 ? [`et ${r.nbRecords - 1} autre${r.nbRecords > 2 ? "s" : ""} record${r.nbRecords > 2 ? "s" : ""}`] : undefined });
  const fav: string[] = [];
  if (r.exFavori) fav.push(`Exercice préféré : ${r.exFavori.n} (${r.exFavori.fois} fois)`);
  if (r.minutesCardio) fav.push(`${fr(r.minutesCardio)} min de cardio${r.formatFavori ? `, surtout en ${r.formatFavori}` : ""}`);
  if (fav.length) l.push({ sur: "Tes habitudes", grand: r.exFavori?.n || `${fr(r.minutesCardio)} min de cardio`, detail: fav });
  if (r.serie > 1 || r.badges.length) l.push({
    sur: "Ta régularité", grand: r.serie > 1 ? `${r.serie} semaines d'affilée` : `${r.badges.length} badge${r.badges.length > 1 ? "s" : ""}`,
    sous: r.serie > 1 ? "ta meilleure série d'objectifs tenus" : undefined, detail: r.badges.length ? [`Badges : ${r.badges.slice(0, 4).join(", ")}${r.badges.length > 4 ? "…" : ""}`] : undefined,
  });
  return l;
}

/* L'image à partager (format story, 1080 × 1920), dessinée dans le téléphone. */
async function image(r: Recap): Promise<Blob | null> {
  const W = 1080, H = 1920, c = document.createElement("canvas");
  c.width = W; c.height = H;
  const g = c.getContext("2d");
  if (!g) return null;
  const police = getComputedStyle(document.body).fontFamily;
  const fond = g.createLinearGradient(0, 0, 0, H);
  fond.addColorStop(0, "#3b67f5"); fond.addColorStop(1, "#1b36a0");
  g.fillStyle = fond; g.fillRect(0, 0, W, H);
  /* le disque du logo, en grand et en filigrane */
  g.lineCap = "round";
  g.strokeStyle = "rgba(255,255,255,.08)"; g.lineWidth = 120;
  g.beginPath(); g.arc(W - 120, H - 260, 420, 0, Math.PI * 2); g.stroke();
  g.strokeStyle = "rgba(255,255,255,.16)";
  g.beginPath(); g.arc(W - 120, H - 260, 420, -Math.PI / 2, Math.PI); g.stroke();
  g.fillStyle = "#fff";
  const texte = (t: string, x: number, y: number, taille: number, poids = 700, alpha = 1) => {
    g.globalAlpha = alpha; g.font = `${poids} ${taille}px ${police}`; g.fillText(t, x, y); g.globalAlpha = 1;
  };
  texte("REPÈRE", 90, 150, 40, 700, 0.85);
  texte(r.p.annee ? `Mon année ${r.p.nom}` : `Mon mois de ${r.p.nom.split(" ")[0]}`, 90, 330, 76, 800);
  const lignes: [string, string][] = [
    [String(r.seances), r.seances > 1 ? "séances" : "séance"],
    ...(r.tonnes > 0 ? [[r.tonnes >= 1 ? `${fr(r.tonnes, 1)} t` : `${fr(r.tonnes * 1000)} kg`, "soulevés"] as [string, string]] : []),
    ...(r.minutesCardio ? [[fr(r.minutesCardio), "min de cardio"] as [string, string]] : []),
    ...(r.nbRecords ? [[String(r.nbRecords), r.nbRecords > 1 ? "records battus" : "record battu"] as [string, string]] : []),
    ...(r.serie > 1 ? [[String(r.serie), "semaines d'affilée"] as [string, string]] : []),
  ];
  let y = 520;
  for (const [v, n] of lignes.slice(0, 5)) {
    texte(v, 90, y, 150, 800);
    texte(n, 90, y + 62, 46, 500, 0.8);
    y += 232;
  }
  if (r.record) { texte("Plus beau record", 90, H - 230, 38, 500, 0.75); texte(`${r.record.n} · ${fr(r.record.apres)} ${r.record.unite.split(" ")[0]}`, 90, H - 170, 50, 700); }
  return new Promise((ok) => c.toBlob((b) => ok(b), "image/png"));
}

export default function PageBilanPeriode() {
  return <Suspense><BilanPeriode /></Suspense>;
}

function BilanPeriode() {
  const etat = useRepere((s) => s.etat);
  const retour = useRetour("/progres");
  const id = useSearchParams().get("p") || "";
  const r = useMemo(() => recap(etat, id), [etat, id]);
  const E = useMemo(() => (r ? ecrans(r) : []), [r]);
  const [i, setI] = useState(0);
  const total = E.length + 1, fin = i >= E.length;
  /* avance seule toutes les 5 s (sauf sur l'écran final et en mouvement réduit) */
  useEffect(() => {
    if (fin || mouvementReduit()) return;
    const t = setTimeout(() => setI((x) => x + 1), 5000);
    return () => clearTimeout(t);
  }, [i, fin]);
  const [img, setImg] = useState<{ url: string; blob: Blob } | null>(null);
  useEffect(() => {
    if (!fin || !r || img) return;
    let vivant = true;
    image(r).then((b) => { if (b && vivant) setImg({ url: URL.createObjectURL(b), blob: b }); });
    return () => { vivant = false; };
  }, [fin, r, img]);

  if (!r || !r.seances)
    return (
      <div className="grid min-h-dvh place-items-center bg-plate p-8 text-center text-plate-foreground">
        <div>
          <p className="text-[18px] font-semibold">Pas encore d&apos;entraînement sur cette période.</p>
          <Button variant="secondary" className="mt-4" onClick={retour}>Revenir</Button>
        </div>
      </div>
    );

  const partager = async () => {
    if (!img) return;
    const f = new File([img.blob], `repere-${r.p.id}.png`, { type: "image/png" });
    try {
      if (navigator.canShare?.({ files: [f] })) await navigator.share({ files: [f], title: "Mon bilan Repère" });
      else { const a = document.createElement("a"); a.href = img.url; a.download = f.name; a.click(); }
    } catch {}
  };
  const e = E[i];
  return (
    <div className="relative isolate min-h-dvh overflow-hidden bg-gradient-to-b from-[#3b67f5] to-[#1b36a0] text-white select-none">
      <LogoDisque className="pointer-events-none absolute -right-24 -bottom-24 -z-10 size-[420px] text-white/[.09]" />
      <div className="flex gap-1 px-4 pt-[max(env(safe-area-inset-top),14px)]" aria-hidden>
        {Array.from({ length: total }, (_, k) => (
          <span key={k} className="h-[3px] flex-1 overflow-hidden rounded-full bg-white/25">
            <span className={cn("block h-full bg-white", k < i ? "w-full" : k === i && !fin ? "w-full origin-left animate-[remplir_5s_linear_both]" : k === i ? "w-full" : "w-0")} key={i + "-" + k} />
          </span>
        ))}
      </div>
      <button onClick={retour} aria-label="Fermer" className="absolute top-[max(env(safe-area-inset-top),14px)] right-3 mt-3 grid size-10 place-items-center rounded-full bg-white/15"><XIcon className="size-5" weight="bold" /></button>

      {!fin ? (
        <>
          <div key={i} className="flex min-h-[80dvh] flex-col justify-center px-7">
            <p className="animate-[monter_.5s_ease-out_both] text-[15px] font-semibold tracking-[0.14em] uppercase opacity-80">{e.sur}</p>
            <h1 className="mt-3 animate-[monter_.6s_.12s_ease-out_both] text-[46px] leading-[1.02] font-extrabold tracking-[-0.03em] text-balance">{e.grand}</h1>
            {e.sous && <p className="mt-4 animate-[monter_.6s_.3s_ease-out_both] text-[19px] leading-snug opacity-90">{e.sous}</p>}
            {e.detail?.map((d, k) => <p key={d} className="mt-2 animate-[monter_.6s_ease-out_both] text-[15px] opacity-75" style={{ animationDelay: 450 + k * 100 + "ms" }}>{d}</p>)}
          </div>
          <button aria-label="Précédent" className="absolute inset-y-0 left-0 w-1/3" onClick={() => setI((x) => Math.max(0, x - 1))} />
          <button aria-label="Suivant" className="absolute inset-y-0 right-0 w-2/3" onClick={() => setI((x) => x + 1)} />
        </>
      ) : (
        <div className="flex min-h-[90dvh] flex-col items-center justify-center gap-5 px-6">
          <p className="text-[15px] font-semibold tracking-[0.14em] uppercase opacity-80">À partager</p>
          <div className="aspect-[9/16] w-[58vw] max-w-[260px] overflow-hidden rounded-2xl bg-white/10 shadow-2xl">
            {/* eslint-disable-next-line @next/next/no-img-element -- image fabriquée dans le téléphone (blob) */}
            {img && <img src={img.url} alt="Ton bilan en image" className="size-full animate-[monter_.5s_ease-out_both] object-cover" />}
          </div>
          <div className="flex w-full max-w-[340px] flex-col gap-2">
            <Button size="xl" className="w-full bg-white text-[#2346c4] hover:bg-white/90" onClick={partager} disabled={!img}>
              {typeof navigator !== "undefined" && "canShare" in navigator ? <PaperPlaneTiltIcon weight="fill" /> : <DownloadSimpleIcon weight="bold" />}Partager l&apos;image
            </Button>
            <Button variant="ghost" className="w-full text-white hover:bg-white/10" onClick={() => setI(0)}>Revoir</Button>
          </div>
        </div>
      )}
    </div>
  );
}
