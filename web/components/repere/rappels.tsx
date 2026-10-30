"use client";

import { tr } from "@/lib/i18n";
import { useEffect, useState } from "react";
import { activerRappels, couperRappels, etatRappels, type EtatRappels } from "@/lib/rappels";
import { Segmente } from "@/components/repere/segmente";

/* Profil : rappels après quelques jours sans séance. */
export function ReglageRappels() {
  const [etat, setEtat] = useState<EtatRappels | null>(null);
  const [occupe, setOccupe] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  useEffect(() => { etatRappels().then(setEtat); }, []);
  if (!etat || etat === "indispo") return <p className="px-1 text-[12.5px] text-muted-foreground">{etat ? tr("Ce navigateur ne reçoit pas de notifications.") : ""}</p>;
  if (etat === "installer") return <p className="rounded-[18px] bg-card px-4 py-3.5 text-[13.5px] leading-relaxed text-muted-foreground">{tr("Sur iPhone, installe d'abord l'app sur l'écran d'accueil (Partager › Sur l'écran d'accueil), puis reviens ici.")}</p>;
  const changer = async (v: number) => {
    if (occupe) return;
    setOccupe(true); setMsg(null);
    const e = await (v ? activerRappels() : couperRappels()).catch(() => "inactif" as const);
    setEtat(e); setOccupe(false);
    if (v && e !== "actif") setMsg(e === "refuse" ? tr("Notifications refusées : tu peux les autoriser dans les réglages du téléphone.") : tr("Activation impossible pour l'instant. Réessaie depuis Profil."));
  };
  return (
    <>
      <Segmente label={tr("Rappels")} valeur={etat === "actif" ? 1 : 0} onChange={changer} options={[{ v: 1, n: tr("Activés") }, { v: 0, n: tr("Coupés") }]} />
      <p className="mt-2 px-1 text-[12.5px] text-muted-foreground">
        {etat === "refuse"
          ? tr("Notifications refusées : tu peux les autoriser dans les réglages du téléphone.")
          : tr("Une notification après quelques jours sans séance, trois au plus, jamais avant 18 h.")}
      </p>
      {msg && etat !== "refuse" && <p className="mt-1 px-1 text-[12.5px] text-destructive">{msg}</p>}
    </>
  );
}
