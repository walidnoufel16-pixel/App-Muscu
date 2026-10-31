"use client";

/* « Donner mon avis » (menu ☰) : une phrase envoyée dans la table avis, lue dans Admin,
   comme la question posée après la 5e séance (bilan.tsx). */
import { tr } from "@/lib/i18n";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Drawer, DrawerContent, DrawerDescription, DrawerTitle } from "@/components/ui/drawer";
import { sb } from "@/lib/supabase";
import { useRepere } from "@/lib/store";
import { useMenu } from "@/lib/nav";

export function FeuilleAvis() {
  const ouvert = useMenu((s) => s.avis);
  const n = useRepere((x) => (x.etat.HIST || []).length);
  const [texte, setTexte] = useState("");
  const [etat, setEtat] = useState<"" | "envoi" | "merci" | "erreur">("");
  const fermer = () => { useMenu.setState({ avis: false }); if (etat === "merci") { setTexte(""); setEtat(""); } };
  const envoyer = async () => {
    const t = texte.trim().slice(0, 1000);
    if (!t) return;
    setEtat("envoi");
    const c = await sb(), { error } = (await c?.from("avis").insert({ texte: t, seances: n })) ?? { error: true };
    setEtat(error ? "erreur" : "merci");
  };
  return (
    <Drawer open={ouvert} onOpenChange={(o) => !o && fermer()}>
      <DrawerContent>
        <div className="px-5 pt-3 pb-[max(env(safe-area-inset-bottom),20px)]">
          <DrawerTitle className="text-[22px] font-bold">{tr("Donner mon avis")}</DrawerTitle>
          <DrawerDescription className="mt-1 text-[14.5px] leading-relaxed text-muted-foreground">
            {tr("Une idée, un exercice qui manque, un souci : écris-le ici. Chaque message est lu.")}
          </DrawerDescription>
          {etat === "merci" ? (
            <>
              <p className="mt-4 rounded-2xl bg-plate-soft p-3.5 text-[14.5px] font-medium">{tr("Merci ! Ton avis est bien arrivé, il compte vraiment pour la suite.")}</p>
              <Button variant="plate" size="xl" className="mt-4 w-full" onClick={fermer}>{tr("Fermer")}</Button>
            </>
          ) : (
            <>
              <textarea value={texte} onChange={(e) => setTexte(e.target.value)} maxLength={1000} rows={4} autoFocus
                placeholder={tr("Une fonction, un exercice, un souci…")}
                className="mt-4 w-full resize-none rounded-xl border bg-background p-3 text-[16px] outline-none focus:border-foreground" />
              {etat === "erreur" && <p className="mt-1 text-[12.5px] text-destructive">{tr("Envoi impossible pour l'instant, réessaie plus tard.")}</p>}
              <Button variant="plate" size="xl" className="mt-3 w-full" disabled={!texte.trim() || etat === "envoi"} onClick={envoyer}>
                {etat === "envoi" ? tr("Envoi…") : tr("Envoyer")}
              </Button>
            </>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  );
}
