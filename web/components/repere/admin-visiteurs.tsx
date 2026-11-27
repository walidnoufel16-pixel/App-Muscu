"use client";

/* Admin › Visiteurs (27/11/2026) : chaque appareil venu sur l'app, inscrit ou non (mesure anonyme,
   jamais liée à un compte). La liste dit d'où il vient, jusqu'où il est allé et combien de temps il est
   resté ; le toucher ouvre son parcours complet, minute par minute (écrans, temps, défilement, clics).
   Réservé à l'admin, en français seulement. */
import { useEffect, useMemo, useState } from "react";
import { CaretDownIcon } from "@phosphor-icons/react";
import { parcoursVisiteur, visiteursAdmin } from "@/lib/admin";
import { duree, etapeVisiteur, nomEcran, phraseEvenement, provenance, type EvenementVisiteur, type ResumeVisiteur } from "@/lib/logic/visiteurs";
import { tactile } from "@/lib/repos";
import { cn } from "@/lib/utils";

const PERIODES: [number, string][] = [[1, "Aujourd'hui"], [7, "7 jours"], [30, "30 jours"]];
const quand = (iso: string) => new Date(iso).toLocaleString("fr-FR", { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
const heure = (iso: string) => new Date(iso).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
const TEINTE = ["bg-muted text-muted-foreground", "bg-[#fff1e6] text-[#b45309]", "bg-plate-soft text-plate-ink", "bg-plate-soft text-plate-ink", "bg-plate text-plate-foreground", "bg-plate text-plate-foreground", "bg-plate text-plate-foreground"];

export function Visiteurs({ avecMoi }: { avecMoi: boolean }) {
  const [jours, setJours] = useState(7);
  /* la liste est rangée avec la période qu'elle concerne : une autre période affiche « Chargement… » */
  const [res, setRes] = useState<{ cle: string; l: ResumeVisiteur[] } | null>(null);
  const [err, setErr] = useState("");
  const [ouvert, setOuvert] = useState<string | null>(null);
  const cle = `${jours}|${avecMoi}`;
  useEffect(() => {
    let vivant = true;
    visiteursAdmin(jours, avecMoi).then((l) => vivant && (setRes({ cle: `${jours}|${avecMoi}`, l }), setErr(""))).catch((e) => vivant && setErr((e as Error).message));
    return () => { vivant = false; };
  }, [jours, avecMoi]);
  const L = res?.cle === cle ? res.l : null;
  const bilan = useMemo(() => {
    if (!L) return null;
    const n = L.length, partis = L.filter((v) => etapeVisiteur(v).n === 0).length;
    const temps = n ? Math.round(L.reduce((a, v) => a + v.temps, 0) / n) : 0;
    return { n, partis, comptes: L.filter((v) => v.compte).length, temps };
  }, [L]);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex gap-1.5">
        {PERIODES.map(([j, n]) => (
          <button key={j} aria-pressed={jours === j} onClick={() => { tactile(4); setJours(j); }}
            className={cn("h-9 rounded-full border px-3.5 text-[13.5px] font-semibold", jours === j ? "border-foreground bg-foreground text-background" : "border-border bg-card")}>{n}</button>
        ))}
      </div>
      {err && <p className="rounded-2xl bg-card p-4 text-[14px] text-destructive">{err}</p>}
      {!err && !L && <p className="py-8 text-center text-[14px] text-muted-foreground">Chargement…</p>}
      {bilan && (
        <section className="grid grid-cols-2 gap-2">
          {[[bilan.n, "visiteurs"], [bilan.partis, "partis sans s'inscrire"], [bilan.comptes, "comptes créés"], [duree(bilan.temps), "temps moyen"]].map(([v, n]) => (
            <div key={String(n)} className="rounded-[18px] bg-card p-3">
              <div className="num text-[24px] leading-tight font-bold">{v}</div>
              <div className="text-[12.5px] text-muted-foreground">{n}</div>
            </div>
          ))}
        </section>
      )}
      {L && !L.length && <p className="rounded-2xl bg-card p-4 text-[14px] text-muted-foreground">Aucun visiteur sur la période.</p>}
      {L?.map((v) => {
        const e = etapeVisiteur(v), o = ouvert === v.appareil;
        return (
          <section key={v.appareil} className="rounded-[20px] bg-card">
            <button onClick={() => { tactile(5); setOuvert(o ? null : v.appareil); }} aria-expanded={o} className="flex w-full items-start gap-3 p-3.5 text-left">
              <span className="min-w-0 flex-1">
                <span className="flex flex-wrap items-center gap-1.5">
                  <span className={cn("rounded-full px-2 py-0.5 text-[11.5px] font-bold", TEINTE[e.n])}>{e.texte}</span>
                  {v.jours > 1 && <span className="rounded-full bg-muted px-2 py-0.5 text-[11.5px] font-semibold">{v.jours} jours</span>}
                </span>
                <span className="mt-1.5 block text-[14.5px] font-semibold">{provenance(v.ouverture)}</span>
                <span className="block text-[12.5px] text-muted-foreground">
                  {quand(v.premier)} · {duree(v.temps)} · {v.ecrans} écran{v.ecrans > 1 ? "s" : ""} · {v.clics} clic{v.clics > 1 ? "s" : ""}
                </span>
                <span className="block text-[12.5px] text-muted-foreground">Dernier écran : {nomEcran(v.dernier_ecran)}</span>
              </span>
              <CaretDownIcon className={cn("mt-1 size-4 shrink-0 text-muted-foreground transition-transform", o && "rotate-180")} />
            </button>
            {o && <Parcours appareil={v.appareil} />}
          </section>
        );
      })}
    </div>
  );
}

function Parcours({ appareil }: { appareil: string }) {
  const [l, setL] = useState<EvenementVisiteur[] | null>(null);
  const [err, setErr] = useState("");
  useEffect(() => { parcoursVisiteur(appareil).then(setL).catch((e) => setErr((e as Error).message)); }, [appareil]);
  if (err) return <p className="px-3.5 pb-3.5 text-[13px] text-destructive">{err}</p>;
  if (!l) return <p className="px-3.5 pb-3.5 text-[13px] text-muted-foreground">Chargement du parcours…</p>;
  const jourDe = (h: string) => new Date(h).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });
  return (
    <ol className="border-t border-border/70 px-3.5 py-2.5">
      {l.map((e, i) => {
        const ph = phraseEvenement(e), j = jourDe(e.h);
        const entete = i === 0 || jourDe(l[i - 1].h) !== j ? j : null;
        return (
          <li key={i}>
            {entete && <div className="mt-2 mb-1 text-[11.5px] font-bold tracking-[0.06em] text-muted-foreground uppercase">{entete}</div>}
            <div className="flex gap-2.5 py-1 text-[13.5px] leading-snug">
              <span className="num w-[62px] shrink-0 text-muted-foreground">{heure(e.h)}</span>
              <span className={cn("min-w-0", ph.fort && "font-bold")}>{ph.texte}{ph.detail && <span className="font-normal text-muted-foreground"> · {ph.detail}</span>}</span>
            </div>
          </li>
        );
      })}
      <li className="pt-1.5 text-[11.5px] text-muted-foreground">Appareil {appareil.slice(0, 6)}… · anonyme</li>
    </ol>
  );
}
