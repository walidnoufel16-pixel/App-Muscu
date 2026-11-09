"use client";

/* oxafit.app/tt : l'adresse courte à écrire dans la bio TikTok (un compte personnel n'a pas de lien
   cliquable avant ~1 000 abonnés). Elle mène à l'accueil en notant la source « tiktok », comme
   https://oxafit.app/?src=tiktok. */
import { useEffect } from "react";

export default function TikTok() {
  useEffect(() => { location.replace("/?src=tiktok"); }, []);
  return null;
}
