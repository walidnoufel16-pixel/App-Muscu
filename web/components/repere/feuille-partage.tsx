"use client";

/* Feuille de partage d'une séance : le code en très grand (à lire ou à dicter),
   le lien, les boutons pour copier, et « Envoyer… » qui ouvre la feuille de
   partage du téléphone seulement si on la demande. */
import { CheckIcon, CopyIcon, PaperPlaneTiltIcon } from "@phosphor-icons/react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Drawer, DrawerContent, DrawerDescription, DrawerTitle } from "@/components/ui/drawer";
import { tactile } from "@/lib/repos";

export type Partage = { nom: string; code: string; defi?: boolean };

export function FeuillePartage({ partage, onClose }: { partage: Partage | null; onClose: () => void }) {
  return (
    <Drawer open={!!partage} onOpenChange={(o) => !o && onClose()}>
      <DrawerContent>{partage && <Contenu key={partage.code} {...partage} />}</DrawerContent>
    </Drawer>
  );
}

function Contenu({ nom, code, defi }: Partage) {
  const lien = (typeof location !== "undefined" ? location.origin : "") + (defi ? "/?d=" : "/?s=") + code;
  const [copie, setCopie] = useState<"code" | "lien" | null>(null);
  const copier = async (quoi: "code" | "lien") => {
    tactile(8);
    try {
      await navigator.clipboard.writeText(quoi === "code" ? code : lien);
      setCopie(quoi);
      toast.success(quoi === "code" ? "Code copié" : "Lien copié");
    } catch {
      toast("Copie impossible ici", { description: "Sélectionne le texte et copie-le à la main." });
    }
  };
  const envoyer = async () => {
    try { await navigator.share({ title: nom, text: defi ? `Rejoins mon défi « ${nom} » sur Repère. Code : ${code}` : `Ma séance « ${nom} » sur Repère. Code : ${code}`, url: lien }); } catch {}
  };
  return (
    <div className="px-5 pt-2 pb-[max(env(safe-area-inset-bottom),20px)]">
      <DrawerTitle className="text-center text-[20px] leading-tight font-bold text-balance">Partager « {nom} »</DrawerTitle>
      <DrawerDescription className="mt-1 text-center text-[13.5px] text-muted-foreground">{defi ? "Code du défi" : "Code de la séance"}, à lire ou à dicter</DrawerDescription>

      <div className="mt-4 flex justify-center gap-1.5 select-all" aria-label={`Code : ${code.split("").join(" ")}`}>
        {code.split("").map((c, i) => (
          <span key={i} className="num grid h-16 w-[min(15vw,56px)] place-items-center rounded-2xl bg-plate-soft text-[40px] leading-none font-bold text-plate-ink">
            {c}
          </span>
        ))}
      </div>
      <Button variant="soft" size="lg" className="mt-3 w-full rounded-xl" onClick={() => copier("code")}>
        {copie === "code" ? <CheckIcon weight="bold" /> : <CopyIcon />}Copier le code
      </Button>

      <div className="mt-4 rounded-2xl border bg-card p-3">
        <div className="eyebrow mb-1">Lien</div>
        <p className="text-[14px] font-medium break-all select-all">{lien}</p>
        <button onClick={() => copier("lien")} className="mt-2 flex items-center gap-1.5 text-[14px] font-semibold text-plate-ink">
          {copie === "lien" ? <CheckIcon className="size-4" weight="bold" /> : <CopyIcon className="size-4" />}Copier le lien
        </button>
      </div>

      {typeof navigator !== "undefined" && "share" in navigator && (
        <Button variant="plate" size="xl" className="mt-4 w-full" onClick={envoyer}>
          <PaperPlaneTiltIcon weight="fill" />Envoyer…
        </Button>
      )}
      <p className="mt-3 text-center text-[12.5px] leading-relaxed text-muted-foreground">
        {defi
          ? "Ton ami ouvre le lien, ou saisit le code dans Progrès › Défis entre amis › Rejoindre."
          : "Ton ami ouvre le lien, ou saisit le code dans Entraînement › Mes séances › Importer une séance avec un code."}
      </p>
    </div>
  );
}
