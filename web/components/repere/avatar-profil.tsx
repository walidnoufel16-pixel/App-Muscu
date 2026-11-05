"use client";

/* Le Profil en un toucher, en haut à droite des onglets (à la manière de l'App Store) :
   l'initiale du compte dans une pastille. */
import { tr } from "@/lib/i18n";
import { useRouter } from "next/navigation";
import { useRepere } from "@/lib/store";
import { AVANT } from "@/lib/nav";
import { tactile } from "@/lib/repos";

export function AvatarProfil() {
  const router = useRouter();
  const pseudo = useRepere((s) => s.pseudo);
  const initiale = (pseudo || "").trim().charAt(0).toUpperCase();
  return (
    <button aria-label={tr("Profil")} onClick={() => { tactile(5); router.push("/profil", AVANT); }}
      className="grid size-9 place-items-center rounded-full bg-foreground/[.08] text-[15px] font-bold text-foreground active:scale-95">
      {initiale || <svg viewBox="0 0 24 24" className="size-5" fill="currentColor" aria-hidden><circle cx="12" cy="8" r="4" /><path d="M4 20c0-4 3.6-6 8-6s8 2 8 6" /></svg>}
    </button>
  );
}
