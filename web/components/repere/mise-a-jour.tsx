"use client";

/* Nouvelle version de l'app : le service worker (scripts/sw.mjs) la prépare sans la lancer,
   et ce bandeau propose de recharger. Rien ne change sous les doigts : une séance ou un
   composeur ouverts gardent l'ancienne version tant qu'on ne touche pas « Recharger ». */
import { tr } from "@/lib/i18n";
import { useEffect, useState } from "react";
import { ArrowsClockwiseIcon } from "@phosphor-icons/react";

/* rechargement demandé : la toute première installation prend aussi la main (clients.claim), sans recharger */
let demande = false;

export function MiseAJour({ visible }: { visible: boolean }) {
  const [attente, setAttente] = useState<ServiceWorker | null>(null);

  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) return;
    const sw = navigator.serviceWorker;
    let reg: ServiceWorkerRegistration | undefined;
    /* une version installée attend, et l'app tourne déjà sous une version (pas la toute première visite) */
    const voir = () => { if (reg?.waiting && sw.controller) setAttente(reg.waiting); };
    const suivre = () => {
      const w = reg?.installing;
      w?.addEventListener("statechange", () => { if (w.state === "installed") voir(); });
    };
    /* l'app gardée ouverte longtemps (écran d'accueil) : on regarde au retour */
    const verifier = () => { if (document.visibilityState === "visible") reg?.update().catch(() => {}); };
    const relancer = () => { if (demande) { demande = false; location.reload(); } };
    sw.register("/sw.js").then((r) => {
      reg = r;
      voir();
      r.addEventListener("updatefound", suivre);
    }).catch(() => {});
    sw.addEventListener("controllerchange", relancer);
    document.addEventListener("visibilitychange", verifier);
    return () => {
      reg?.removeEventListener("updatefound", suivre);
      sw.removeEventListener("controllerchange", relancer);
      document.removeEventListener("visibilitychange", verifier);
    };
  }, []);

  if (!attente || !visible) return null;
  return (
    <div className="fixed inset-x-0 top-[calc(max(env(safe-area-inset-top),6px)+28px)] z-50 mx-auto max-w-[480px] px-3">
      <div role="status" className="flex animate-[monter_.4s_cubic-bezier(.3,1.2,.5,1)_both] items-center gap-3 rounded-[20px] border border-border/70 bg-card/95 p-2 pl-3.5 shadow-[0_12px_32px_-14px_rgba(0,0,0,.45)] backdrop-blur-xl">
        <ArrowsClockwiseIcon className="size-5 shrink-0 text-plate" weight="bold" />
        <span className="min-w-0 flex-1 text-[14px] font-medium">{tr("Nouvelle version disponible")}</span>
        <button onClick={() => { demande = true; attente.postMessage("activer"); }} className="h-9 shrink-0 rounded-full bg-plate px-3.5 text-[13.5px] font-semibold text-plate-foreground active:scale-[.97]">
          {tr("Recharger")}
        </button>
      </div>
    </div>
  );
}
