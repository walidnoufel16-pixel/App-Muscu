"use client";

/* Déménagement vers la nouvelle adresse (NEXT_PUBLIC_NOUVELLE_ADRESSE, ex. https://oxafit.app).
   Les données d'une app web sont rangées par adresse : sur l'ancienne (*.onrender.com), une feuille
   explique comment retrouver son compte sur la nouvelle. Le compte passe par l'e-mail (code à six
   chiffres, déjà en place) : un compte sans adresse est d'abord invité à en rattacher une, sinon il
   repartirait de zéro. ?demenagement=1 l'affiche partout, pour la montrer sur l'app test. */
import { tr } from "@/lib/i18n";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowSquareOutIcon, HouseLineIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Drawer, DrawerContent, DrawerDescription, DrawerTitle } from "@/components/ui/drawer";
import { useRepere } from "@/lib/store";
import { AVANT } from "@/lib/nav";

const NOUVELLE = (process.env.NEXT_PUBLIC_NOUVELLE_ADRESSE || "").trim().replace(/\/$/, "");
const VU = "repere.demenagement.plus-tard";

/** Vrai sur l'ancienne adresse quand une nouvelle est configurée (ou en démonstration). */
function ancienneAdresse() {
  if (new URLSearchParams(location.search).get("demenagement") === "1") return true;
  return !!NOUVELLE && location.origin !== NOUVELLE && location.hostname.endsWith(".onrender.com");
}

export function Demenagement() {
  const router = useRouter();
  const user = useRepere((s) => s.user);
  const [ouvert, setOuvert] = useState(false);
  /* sur Android, on installe depuis Chrome (menu ⋮), pas depuis Safari */
  const [android, setAndroid] = useState(false);
  /* une fois par lancement : « Plus tard » la referme jusqu'à la prochaine ouverture de l'app */
  useEffect(() => {
    let vu = false;
    try { vu = !!sessionStorage.getItem(VU); } catch {}
    setAndroid(/Android/i.test(navigator.userAgent));
    if (!vu && ancienneAdresse()) { const t = setTimeout(() => setOuvert(true), 1200); return () => clearTimeout(t); }
  }, []);
  const plusTard = () => { try { sessionStorage.setItem(VU, "1"); } catch {} setOuvert(false); };
  const email = user?.email;
  const adresse = (NOUVELLE || "https://oxafit.app").replace(/^https:\/\//, "");
  return (
    <Drawer open={ouvert} onOpenChange={(o) => !o && plusTard()}>
      <DrawerContent>
        {/* le texte défile, les deux boutons restent toujours visibles en bas (petits écrans Android) */}
        <div className="flex min-h-0 flex-col">
          <div className="min-h-0 flex-1 overflow-y-auto px-5 pt-3">
            <div className="grid size-11 place-items-center rounded-2xl bg-plate-soft text-plate-ink"><HouseLineIcon className="size-6" weight="fill" /></div>
            <DrawerTitle className="mt-3 text-[22px] leading-tight font-bold">{tr("L'app s'appelle maintenant Oxa et déménage")}</DrawerTitle>
            <DrawerDescription className="mt-1.5 text-[15px] leading-relaxed text-muted-foreground">
              {tr("Nouvelle adresse : {adresse}. Tes séances et ton historique te suivent : ils sont gardés sur ton compte.", { adresse })}
            </DrawerDescription>
            <ol className="mt-4 flex flex-col gap-2.5 pb-2 text-[14.5px] leading-snug">
              {!email && (
                <li className="rounded-2xl border-2 border-plate bg-plate-soft p-3.5">
                  <b className="font-semibold">{tr("D'abord : rattache ton adresse e-mail.")}</b>{" "}
                  {tr("Ton compte n'en a pas encore : sans elle, tu repartirais de zéro sur la nouvelle adresse.")}
                  <Button size="sm" className="mt-2.5 rounded-xl" onClick={() => { plusTard(); router.push("/profil#compte" as "/profil", AVANT); }}>{tr("Rattacher mon e-mail")}</Button>
                </li>
              )}
              <li className="rounded-2xl bg-card p-3.5">
                {android
                  ? tr("Ouvre {adresse} dans Chrome, puis menu ⋮ › Ajouter à l'écran d'accueil (ou « Installer l'application »).", { adresse })
                  : tr("Ouvre {adresse} dans Safari, puis Partager › Sur l'écran d'accueil.", { adresse })}
              </li>
              <li className="rounded-2xl bg-card p-3.5">
                {email
                  ? tr("Dans la nouvelle app, touche « J'ai déjà un compte » et saisis {email} : un code par e-mail rouvre ton compte, avec toutes tes séances.", { email })
                  : tr("Dans la nouvelle app, touche « J'ai déjà un compte » et saisis ton adresse : un code par e-mail rouvre ton compte, avec toutes tes séances.")}
              </li>
              <li className="rounded-2xl bg-card p-3.5">{tr("Tu peux ensuite supprimer l'ancienne icône de ton écran d'accueil.")}</li>
            </ol>
          </div>
          <div className="shrink-0 border-t border-border/60 px-5 pt-3 pb-[max(env(safe-area-inset-bottom),20px)]">
            <Button variant="plate" size="xl" className="w-full" disabled={!email}
              onClick={() => window.open(NOUVELLE || "https://oxafit.app", "_blank")}>
              {tr("Ouvrir {adresse}", { adresse })}<ArrowSquareOutIcon />
            </Button>
            <button onClick={plusTard} className="mt-1 w-full py-2 text-[14px] font-medium text-muted-foreground">{tr("Plus tard")}</button>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
