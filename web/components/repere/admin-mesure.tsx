"use client";

/* Admin › Mesure : usage et erreurs, à partir de la mesure anonyme (lib/mesure.ts).
   Agrégats seulement ; aucune donnée ne renvoie à un compte. */
import { tr } from "@/lib/i18n";
import { useEffect, useState } from "react";
import { mesureAdmin, type MesureAdmin } from "@/lib/admin";
import { nomRubrique, RUBRIQUES, type Rubrique } from "./rubriques";

const pc = (a: number, b: number) => (b ? `${Math.round((a / b) * 100)} %` : "—");
const semaine = (d: string) => new Date(d + "T12:00").toLocaleDateString(undefined, { day: "numeric", month: "short" });
const ACTIONS: Record<string, () => string> = {
  premiere_serie: () => tr("premières séries"), plan_genere: () => tr("programmes générés"),
  repas_note: () => tr("repas notés"), visite_finie: () => tr("visites guidées vues"),
};

export function AdminMesure() {
  const [M, setM] = useState<MesureAdmin | null>(null);
  const [err, setErr] = useState("");
  const [ouverte, setOuverte] = useState<number | null>(null);
  useEffect(() => { mesureAdmin().then(setM).catch((e) => setErr((e as Error).message)); }, []);
  if (err) return <p className="rounded-2xl bg-card p-4 text-[14px] text-destructive">{err}</p>;
  if (!M) return <p className="py-10 text-center text-[14px] text-muted-foreground">{tr("Chargement…")}</p>;
  const th = "px-2 py-1.5 text-left text-[11.5px] font-semibold text-muted-foreground", td = "num px-2 py-1.5 text-[13.5px]";
  return (
    <>
      <section className="rounded-[22px] bg-card p-4">
        <h2 className="eyebrow mb-3">{tr("Appareils actifs")}</h2>
        <div className="grid grid-cols-3 gap-2">
          {([["j1", tr("aujourd'hui")], ["j7", tr("7 jours")], ["j30", tr("30 jours")]] as const).map(([k, n]) => (
            <div key={k} className="rounded-2xl bg-muted/60 px-3 py-2.5">
              <div className="num text-[24px] leading-none font-bold">{M.actifs[k]}</div>
              <div className="mt-1 text-[12.5px] text-muted-foreground">{n}</div>
            </div>
          ))}
        </div>
        <p className="mt-2 text-[12px] text-muted-foreground">{tr("Un appareil = un téléphone ou un navigateur, identifié au hasard, sans lien avec un compte.")}</p>
      </section>

      <section className="rounded-[22px] bg-card p-4">
        <h2 className="eyebrow mb-1">{tr("Nouveaux, activation et rétention")}</h2>
        <p className="mb-2 text-[12px] text-muted-foreground">{tr("Par semaine d'arrivée. Activés : une série validée dans les 24 h. J7 et J30 : revenus au moins 7 ou 30 jours après.")}</p>
        {M.cohortes.length ? (
          <table className="w-full">
            <thead><tr><th className={th}>{tr("Semaine")}</th><th className={th}>{tr("Nouveaux")}</th><th className={th}>{tr("Activés")}</th><th className={th}>J7</th><th className={th}>J30</th></tr></thead>
            <tbody>
              {M.cohortes.map((c) => (
                <tr key={c.semaine} className="border-t border-border/60">
                  <td className={td}>{semaine(c.semaine)}</td><td className={td}>{c.nouveaux}</td><td className={td}>{pc(c.actives, c.nouveaux)}</td>
                  <td className={td}>{c.j7 == null ? "…" : pc(c.j7, c.nouveaux)}</td><td className={td}>{c.j30 == null ? "…" : pc(c.j30, c.nouveaux)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : <p className="text-[13.5px] text-muted-foreground">{tr("Pas encore de données.")}</p>}
      </section>

      <section className="rounded-[22px] bg-card p-4">
        <h2 className="eyebrow mb-2">{tr("Séances par semaine")}</h2>
        {M.seances.length ? (
          <table className="w-full">
            <thead><tr><th className={th}>{tr("Semaine")}</th><th className={th}>{tr("Terminées")}</th><th className={th}>{tr("Par appareil")}</th><th className={th}>{tr("Arrêtées")}</th></tr></thead>
            <tbody>
              {M.seances.map((s) => (
                <tr key={s.semaine} className="border-t border-border/60">
                  <td className={td}>{semaine(s.semaine)}</td><td className={td}>{s.seances}</td>
                  <td className={td}>{s.appareils ? (s.seances / s.appareils).toFixed(1) : "—"}</td><td className={td}>{s.arretees}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : <p className="text-[13.5px] text-muted-foreground">{tr("Pas encore de données.")}</p>}
      </section>

      <section className="rounded-[22px] bg-card p-4">
        <h2 className="eyebrow mb-2">{tr("Nouveaux appareils par source · 30 jours")}</h2>
        {M.sources?.length ? M.sources.map((x) => (
          <div key={x.source} className="flex items-baseline justify-between border-t border-border/60 py-1.5 text-[14px] first:border-t-0">
            <span>{x.source || tr("lien direct ou inconnu")}</span>
            <span className="num text-muted-foreground"><b className="text-foreground">{x.appareils}</b> {tr("appareils")} · {x.actives} {tr("avec une série")}</span>
          </div>
        )) : <p className="text-[13.5px] text-muted-foreground">{tr("Pas encore de données.")}</p>}
      </section>

      <section className="rounded-[22px] bg-card p-4">
        <h2 className="eyebrow mb-2">{tr("Rubriques ouvertes · 30 jours")}</h2>
        {M.rubriques.length ? M.rubriques.map((r) => (
          <div key={r.rubrique} className="flex items-baseline justify-between border-t border-border/60 py-1.5 text-[14px] first:border-t-0">
            <span>{RUBRIQUES.includes(r.rubrique as Rubrique) ? nomRubrique(r.rubrique as Rubrique) : r.rubrique}</span>
            <span className="num text-muted-foreground"><b className="text-foreground">{r.appareils}</b> {tr("appareils")} · {r.ouvertures} {tr("ouvertures")}</span>
          </div>
        )) : <p className="text-[13.5px] text-muted-foreground">{tr("Pas encore de données.")}</p>}
        {Object.keys(M.actions).length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {Object.entries(M.actions).map(([k, n]) => <span key={k} className="rounded-full bg-muted px-2.5 py-1 text-[12.5px]"><b className="num">{n}</b> {ACTIONS[k]?.() ?? k}</span>)}
          </div>
        )}
      </section>

      <section className="rounded-[22px] bg-card p-4">
        <h2 className="eyebrow mb-2">{tr("Erreurs · 14 jours")}</h2>
        {M.erreurs.length ? M.erreurs.map((e, i) => (
          <button key={i} onClick={() => setOuverte(ouverte === i ? null : i)} className="block w-full border-t border-border/60 py-2 text-left first:border-t-0">
            <span className="flex items-start justify-between gap-3">
              <span className="min-w-0 text-[13.5px] font-medium break-words">{e.message}</span>
              <span className="num shrink-0 rounded-full bg-destructive/10 px-2 py-0.5 text-[12px] font-bold text-destructive">{e.n}</span>
            </span>
            <span className="block text-[12px] text-muted-foreground">{e.page || "—"} · {tr("version")} {e.version || "—"} · {tr("{n} jour(s)", { n: e.jours })}</span>
            {ouverte === i && <pre className="mt-2 max-h-56 overflow-auto rounded-xl bg-muted p-2 text-[11px] whitespace-pre-wrap">{e.navigateur}{"\n\n"}{e.pile}</pre>}
          </button>
        )) : <p className="text-[13.5px] text-muted-foreground">{tr("Aucune erreur signalée.")}</p>}
      </section>
    </>
  );
}
