"use client";

/* Admin › Technique : le journal des erreurs des 14 derniers jours (mesure anonyme, lib/mesure.ts).
   Une notification arrive à l'admin à chaque nouvelle erreur (fonction Edge « rappels »). */
import { tr } from "@/lib/i18n";
import { useEffect, useState } from "react";
import { mesureAdmin, type MesureAdmin } from "@/lib/admin";

export function ErreursAdmin() {
  const [E, setE] = useState<MesureAdmin["erreurs"] | null>(null);
  const [err, setErr] = useState("");
  const [ouverte, setOuverte] = useState<number | null>(null);
  useEffect(() => { mesureAdmin().then((m) => setE(m.erreurs)).catch((e) => setErr((e as Error).message)); }, []);
  return (
    <section className="rounded-[22px] bg-card p-4">
      <h2 className="eyebrow mb-2">{tr("Erreurs · 14 jours")}</h2>
      {err ? <p className="text-[13.5px] text-destructive">{err}</p>
        : !E ? <p className="text-[13.5px] text-muted-foreground">{tr("Chargement…")}</p>
        : E.length ? E.map((e, i) => (
          <button key={i} onClick={() => setOuverte(ouverte === i ? null : i)} className="block w-full border-t border-border/60 py-2 text-left first:border-t-0">
            <span className="flex items-start justify-between gap-3">
              <span className="min-w-0 text-[13.5px] font-medium break-words">{e.message}</span>
              <span className="num shrink-0 rounded-full bg-destructive/10 px-2 py-0.5 text-[12px] font-bold text-destructive">{e.n}</span>
            </span>
            <span className="block text-[12px] text-muted-foreground">{e.page || "—"} · {tr("version")} {e.version || "—"} · {tr("{n} jour(s)", { n: e.jours })}</span>
            {ouverte === i && <pre className="mt-2 max-h-56 overflow-auto rounded-xl bg-muted p-2 text-[11px] whitespace-pre-wrap">{e.navigateur}{"\n\n"}{e.pile}</pre>}
          </button>
        )) : <p className="text-[13.5px] text-muted-foreground">{tr("Aucune erreur. Tu reçois une notification à chaque nouvelle erreur.")}</p>}
    </section>
  );
}
