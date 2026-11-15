"use client";

/* Diagnostic d'affichage (admin seulement, activé depuis Admin) : sur iPhone, après une saisie au
   clavier, les éléments fixes (barre du haut, barre Valider, minuteur, onglets) peuvent se
   retrouver décalés. Ce panneau affiche les mesures de l'écran pour régler la correction sur de
   vrais chiffres : hauteurs (fenêtre, document, partie visible), décalage de la partie visible,
   défilement, position réelle de la barre du haut et des onglets, et les 4 derniers événements
   clavier. Toucher le panneau copie les mesures. Aucune donnée ne quitte le téléphone. */
import { useEffect, useState } from "react";
import { create } from "zustand";

export const CLE_DIAG = "oxa.diag.ecran";
export const useDiag = create<{ actif: boolean }>(() => ({ actif: (() => { try { return localStorage.getItem(CLE_DIAG) === "1"; } catch { return false; } })() }));
export const basculerDiag = (on: boolean) => { try { if (on) localStorage.setItem(CLE_DIAG, "1"); else localStorage.removeItem(CLE_DIAG); } catch {} useDiag.setState({ actif: on }); };

type Mesure = Record<string, string | number>;
const arr = (n: number) => Math.round(n * 10) / 10;

function mesurer(): Mesure {
  const vv = window.visualViewport;
  const haut = document.querySelector<HTMLElement>(".safe-top.fixed")?.getBoundingClientRect();
  const onglets = document.querySelector<HTMLElement>("nav")?.getBoundingClientRect();
  const sonde = document.getElementById("diag-sonde");
  const safe = sonde ? parseFloat(getComputedStyle(sonde).paddingTop) || 0 : 0;
  return {
    iH: window.innerHeight, cH: document.documentElement.clientHeight, ecran: screen.height,
    vvH: arr(vv?.height ?? 0), vvTop: arr(vv?.offsetTop ?? 0), vvPage: arr(vv?.pageTop ?? 0), zoom: arr(vv?.scale ?? 1),
    sY: arr(window.scrollY), safe, installee: matchMedia("(display-mode: standalone)").matches ? "oui" : "non",
    barreHaut: haut ? arr(haut.top) : "-", ongletsBas: onglets ? arr(window.innerHeight - onglets.bottom) : "-",
    saisie: (document.activeElement as HTMLElement | null)?.tagName === "INPUT" ? "ouverte" : "non",
  };
}
const texte = (m: Mesure) => Object.entries(m).map(([k, v]) => `${k} ${v}`).join(" · ");

export function DiagnosticEcran() {
  const actif = useDiag((s) => s.actif);
  const [m, setM] = useState<Mesure | null>(null);
  const [journal, setJournal] = useState<string[]>([]);
  useEffect(() => {
    if (!actif) return;
    const maj = () => setM(mesurer());
    const noter = (quoi: string) => setJournal((j) => [`${new Date().toLocaleTimeString().slice(0, 8)} ${quoi} : ${texte(mesurer())}`, ...j].slice(0, 4));
    const ent = () => noter("clavier ouvert");
    const sortie = () => setTimeout(() => noter("clavier fermé +0,8 s"), 800);
    const vv = window.visualViewport;
    vv?.addEventListener("resize", maj); vv?.addEventListener("scroll", maj);
    window.addEventListener("scroll", maj, { passive: true });
    document.addEventListener("focusin", ent); document.addEventListener("focusout", sortie);
    const t = setInterval(maj, 700);
    maj();
    return () => {
      vv?.removeEventListener("resize", maj); vv?.removeEventListener("scroll", maj);
      window.removeEventListener("scroll", maj);
      document.removeEventListener("focusin", ent); document.removeEventListener("focusout", sortie);
      clearInterval(t);
    };
  }, [actif]);
  if (!actif || !m) return null;
  const copier = () => { try { navigator.clipboard?.writeText([texte(m), ...journal].join("\n")); } catch {} };
  return (
    <>
      <div id="diag-sonde" aria-hidden className="pointer-events-none invisible fixed top-0 left-0 pt-[env(safe-area-inset-top)]" />
      <button onClick={copier} aria-label="Diagnostic d'affichage : toucher pour copier"
        className="fixed top-[30%] left-1 z-[100] max-w-[46%] rounded-lg bg-black/80 px-2 py-1.5 text-left font-mono text-[9.5px] leading-[1.35] text-lime-300">
        {Object.entries(m).map(([k, v]) => <div key={k}>{k} {String(v)}</div>)}
        {journal.length > 0 && <div className="mt-1 border-t border-lime-300/30 pt-1 text-[8.5px] text-lime-200/80">{journal.map((l, i) => <div key={i} className="break-all">{l}</div>)}</div>}
      </button>
    </>
  );
}
