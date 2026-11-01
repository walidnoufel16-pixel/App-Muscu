"use client";

/* Inviter un ami (Profil et menu ☰). Le lien porte ?src=ami pour qu'Admin compte les arrivées par invitation. */
import { tr } from "@/lib/i18n";
import { UserPlusIcon } from "@phosphor-icons/react";
import { toast } from "sonner";
import { tactile } from "@/lib/repos";

/** Ouvre la feuille de partage du téléphone avec le lien d'Oxa (ou copie le lien). */
export async function inviterAmi() {
  tactile(8);
  const url = `${location.origin}/?src=ami`;
  const text = tr("Je m'entraîne avec Oxa : il crée mes séances et fait monter mes charges tout seul.");
  try {
    if (navigator.share) { await navigator.share({ title: tr("Oxa"), text, url }); return; }
    await navigator.clipboard.writeText(`${text} ${url}`);
    toast.success(tr("Lien copié : colle-le dans un message."));
  } catch {}
}

export function InviterAmi() {
  return (
    <button onClick={inviterAmi} className="flex w-full items-center gap-3 rounded-[18px] bg-card px-4 py-3.5 text-left active:opacity-80">
      <span className="grid size-9 shrink-0 place-items-center rounded-full bg-plate-soft text-plate-ink"><UserPlusIcon className="size-5" weight="bold" /></span>
      <span className="min-w-0 flex-1">
        <span className="block text-[15px] font-medium">{tr("Inviter un ami")}</span>
        <span className="block text-[12.5px] text-muted-foreground">{tr("Envoie-lui le lien d'Oxa, en un geste.")}</span>
      </span>
    </button>
  );
}
