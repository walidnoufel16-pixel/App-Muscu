"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useRepere } from "@/lib/store";

/* Aiguillage : un lien de séance partagée (?s=CODE) l'importe ; sinon, sans
   compte, l'accueil ; avec un cycle, le plan ; sinon les séances. */
export default function Racine() {
  const router = useRouter();
  const { user, etat, importer } = useRepere();
  const fait = useRef(false);
  useEffect(() => {
    if (fait.current) return;
    fait.current = true;
    const code = new URLSearchParams(window.location.search).get("s");
    if (code) {
      importer(code).then((r) => {
        if (r.erreur) toast.error(r.erreur);
        else toast.success(`« ${r.nom} » a été ajoutée à tes séances`);
        router.replace("/seances/");
      });
      return;
    }
    if (!user && !etat.FINI && !etat.SEANCES.length) router.replace("/bienvenue/");
    else router.replace(etat.FINI || etat.PLAN ? "/plan/" : "/seances/");
  }, [router, user, etat.FINI, etat.PLAN, etat.SEANCES.length, importer]);
  return null;
}
