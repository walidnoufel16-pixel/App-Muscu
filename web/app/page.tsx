"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useRepere } from "@/lib/store";

/* Aiguillage : un lien de séance partagée (?s=CODE) l'importe, un lien de défi (?d=CODE)
   mène à Progrès pour le rejoindre ; sinon, sans
   compte ni données, l'accueil ; sinon Entraînement. */
export default function Racine() {
  const router = useRouter();
  const { user, etat, importer, session } = useRepere();
  const fait = useRef(false);
  useEffect(() => {
    if (fait.current || session === "inconnue") return;
    fait.current = true;
    const q = new URLSearchParams(window.location.search), code = q.get("s"), defi = q.get("d");
    /* lien de défi : on le rejoint depuis Progrès */
    if (defi && /^[A-Za-z0-9]{5}$/.test(defi)) { router.replace(`/progres?d=${defi.toUpperCase()}` as "/progres"); return; }
    if (code) {
      importer(code).then((r) => {
        if (r.erreur) toast.error(r.erreur);
        else toast.success(`« ${r.nom} » a été ajoutée à tes séances`);
        router.replace("/entrainement");
      });
      return;
    }
    if (!user && !etat.FINI && !etat.SEANCES.length) router.replace("/bienvenue");
    else router.replace("/entrainement");
  }, [router, user, etat.FINI, etat.PLAN, etat.SEANCES.length, importer, session]);
  return null;
}
