"use client";

/* « Comment as-tu connu Oxa ? » sur l'accueil Entraînement (21/11/2026), pour ceux qui n'y ont jamais
   répondu : comptes d'avant la question (#187) et ceux qui ont touché « Plus tard » à l'accueil.
   Seulement sans lien ?src= (la source est alors déjà connue). Mêmes choix que le questionnaire
   d'accueil ; une réponse ou « Passer » (A.connu = "passe") et elle ne revient plus. La réponse part
   avec la sauvegarde du compte et s'affiche dans Admin › Vue d'ensemble, comme aujourd'hui. */
import { tr } from "@/lib/i18n";
import { useState } from "react";
import { toast } from "sonner";
import { sourceNotee } from "@/lib/source";
import { useRepere } from "@/lib/store";
import { tactile } from "@/lib/repos";
import type { Connu } from "@/lib/logic/types";
import { cn } from "@/lib/utils";
import { CONNUS } from "./accueil-premier";

export function CarteConnu() {
  const pret = useRepere((s) => s.pret);
  const connu = useRepere((s) => s.etat.A.connu);
  const muter = useRepere((s) => s.muter);
  const [source] = useState(() => !!sourceNotee());
  const [autre, setAutre] = useState(false);
  const [txt, setTxt] = useState("");
  if (!pret || connu || source) return null;
  const garder = (k: Connu) => {
    tactile(6);
    muter((E) => { E.A.connu = k; const t = txt.trim().slice(0, 60); if (k === "autre" && t) E.A.connuTxt = t; else delete E.A.connuTxt; });
    if (k !== "passe") toast(tr("Merci !"), { description: tr("Ça nous aide à savoir où parler d'Oxa.") });
  };
  return (
    <section aria-label={tr("Comment as-tu connu Oxa ?")} className="rounded-[20px] border border-border/80 bg-card p-3.5">
      <div className="flex items-baseline justify-between gap-2">
        <h2 className="text-[15.5px] font-bold">{tr("Comment as-tu connu Oxa ?")}</h2>
        <button onClick={() => garder("passe")} className="-my-2 -mr-1.5 h-9 shrink-0 px-1.5 text-[13px] font-semibold text-muted-foreground">{tr("Passer")}</button>
      </div>
      <p className="mt-0.5 text-[12.5px] text-muted-foreground">{tr("Une seule réponse, ça nous aide à savoir où parler d'Oxa.")}</p>
      <div className="mt-2.5 grid grid-cols-2 gap-1.5">
        {CONNUS.map((o) => (
          <button key={o.k} onClick={() => (o.k === "autre" ? (tactile(5), setAutre(true)) : garder(o.k))} aria-pressed={o.k === "autre" && autre}
            className={cn("flex min-h-11 items-center gap-2 rounded-[12px] border px-2.5 py-1.5 text-left text-[13.5px] leading-tight font-semibold active:scale-[.98]", o.k === "autre" && autre ? "border-plate bg-plate-soft" : "border-border bg-background")}>
            {/* en entier, sur deux lignes au besoin (« Un ami ou un proche ») */}
            <span aria-hidden className="text-[15px]">{o.ic}</span><span className="min-w-0">{o.n()}</span>
          </button>
        ))}
      </div>
      {autre && (
        <div className="mt-2 flex gap-1.5">
          <input value={txt} onChange={(e) => setTxt(e.target.value)} maxLength={60} placeholder={tr("Où ça ? (facultatif)")} aria-label={tr("Où ça ? (facultatif)")}
            className="h-11 min-w-0 flex-1 rounded-[12px] border border-plate bg-background px-3 text-[16px] outline-none" />
          <button onClick={() => garder("autre")} className="h-11 shrink-0 rounded-full bg-plate px-4 text-[14px] font-bold text-plate-foreground active:scale-[.98]">{tr("Envoyer")}</button>
        </div>
      )}
    </section>
  );
}
