"use client";

/* Admin › Technique : le journal des erreurs des 14 derniers jours (mesure anonyme, lib/mesure.ts),
   avec le statut de chacune : à regarder, analysée (note de l'admin) ou bruit connu ignoré
   (lib/logic/erreurs.ts). Une notification arrive à l'admin à chaque nouvelle erreur. */
import { tr } from "@/lib/i18n";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { analyserErreur, analysesErreurs, mesureAdmin, type MesureAdmin } from "@/lib/admin";
import { trierErreurs, type Analyse, type Statut } from "@/lib/logic/erreurs";
import { tactile } from "@/lib/repos";
import { cn } from "@/lib/utils";

const PASTILLE: Record<Statut["etat"], { n: () => string; c: string }> = {
  a_regarder: { n: () => tr("À regarder"), c: "bg-destructive/12 text-destructive" },
  analysee: { n: () => tr("Analysée"), c: "bg-success-soft text-success" },
  ignoree: { n: () => tr("Analysée, ignorée"), c: "bg-success-soft text-success" },
};

export function ErreursAdmin() {
  const [E, setE] = useState<MesureAdmin["erreurs"] | null>(null);
  const [A, setA] = useState<Analyse[]>([]);
  const [err, setErr] = useState("");
  const [ouverte, setOuverte] = useState<number | null>(null);
  const [note, setNote] = useState("");
  const [occupe, setOccupe] = useState(false);
  useEffect(() => {
    Promise.all([mesureAdmin(), analysesErreurs()]).then(([m, a]) => { setE(m.erreurs); setA(a); }).catch((e) => setErr((e as Error).message));
  }, []);
  const liste = E ? trierErreurs(E, A) : [];
  const nbARegarder = liste.filter((e) => e.statut.etat === "a_regarder").length;

  const enregistrer = async (message: string, n: string | null) => {
    setOccupe(true);
    try {
      await analyserErreur(message, n);
      setA(await analysesErreurs());
      setOuverte(null); setNote("");
      toast.success(n == null ? tr("Marque retirée") : tr("Erreur marquée comme analysée"));
    } catch (e) { toast.error(tr("Impossible pour l'instant"), { description: (e as Error).message }); }
    setOccupe(false);
  };

  return (
    <section className="rounded-[22px] bg-card p-4">
      <h2 className="eyebrow mb-1">{tr("Erreurs · 14 jours")}</h2>
      {E && <p className="mb-2 text-[13.5px] font-semibold">{nbARegarder ? <span className="text-destructive">{nbARegarder === 1 ? tr("1 erreur à regarder") : tr("{n} erreurs à regarder", { n: nbARegarder })}</span> : <span className="text-success">{tr("Rien à regarder : tout est analysé.")}</span>}</p>}
      {err ? <p className="text-[13.5px] text-destructive">{err}</p>
        : !E ? <p className="text-[13.5px] text-muted-foreground">{tr("Chargement…")}</p>
        : liste.length ? liste.map((e, i) => {
          const p = PASTILLE[e.statut.etat], grise = e.statut.etat !== "a_regarder";
          return (
            <div key={i} className="border-t border-border/60 py-2.5 first:border-t-0">
              <button onClick={() => { tactile(4); setOuverte(ouverte === i ? null : i); setNote(e.statut.etat === "analysee" ? e.statut.note : ""); }} className="block w-full text-left">
                <span className="flex items-start justify-between gap-3">
                  <span className={cn("min-w-0 text-[13.5px] font-medium break-words", grise && "text-muted-foreground")}>{e.message}</span>
                  <span className="num shrink-0 rounded-full bg-muted px-2 py-0.5 text-[12px] font-bold">{e.n}</span>
                </span>
                <span className="block text-[12px] text-muted-foreground">{e.page || "—"} · {tr("version")} {e.version || "—"} · {tr("{n} jour(s)", { n: e.jours })}</span>
                <span className={cn("mt-1.5 inline-block rounded-full px-2 py-0.5 text-[11.5px] font-bold", p.c)}>{p.n()}</span>
                {e.statut.note && <span className="mt-1 block text-[12.5px] leading-snug text-muted-foreground">{e.statut.note}</span>}
              </button>
              {ouverte === i && (
                <div className="mt-2">
                  <pre className="max-h-56 overflow-auto rounded-xl bg-muted p-2 text-[11px] whitespace-pre-wrap">{e.navigateur}{"\n\n"}{e.pile}</pre>
                  {e.statut.etat !== "ignoree" && (
                    <div className="mt-2">
                      <textarea value={note} onChange={(x) => setNote(x.target.value.slice(0, 300))} rows={2} placeholder={tr("Ce qu'on en a conclu (facultatif)")}
                        className="w-full rounded-xl border border-border bg-background px-3 py-2 text-[13.5px]" />
                      <div className="mt-1.5 flex gap-2">
                        <button disabled={occupe} onClick={() => enregistrer(e.message, note.trim())} className="h-10 flex-1 rounded-full bg-plate text-[14px] font-semibold text-plate-foreground active:scale-[.98]">
                          {e.statut.etat === "analysee" ? tr("Mettre à jour la note") : tr("Marquer comme analysée")}
                        </button>
                        {e.statut.etat === "analysee" && (
                          <button disabled={occupe} onClick={() => enregistrer(e.message, null)} className="h-10 rounded-full px-4 text-[14px] font-semibold text-destructive">{tr("Retirer")}</button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        }) : <p className="text-[13.5px] text-muted-foreground">{tr("Aucune erreur. Tu reçois une notification à chaque nouvelle erreur.")}</p>}
    </section>
  );
}
