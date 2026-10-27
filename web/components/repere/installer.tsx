"use client";

/* Pastille « Installer l'app » : seulement dans le navigateur, tant que l'app n'est pas
   sur l'écran d'accueil (l'admin la voit toujours, pour contrôle). Sur iPhone, une feuille montre les trois gestes dans Safari ;
   sur Android, c'est la fenêtre d'installation du système. « Plus tard » la cache 14 jours. */
import { tr } from "@/lib/i18n";
import { useEffect, useState } from "react";
import { DownloadSimpleIcon, ExportIcon, PlusSquareIcon, XIcon } from "@phosphor-icons/react";
import { Drawer, DrawerContent, DrawerDescription, DrawerTitle } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { useEstAdmin } from "@/lib/admin";
import { useMenu } from "@/lib/nav";

/** L'app est-elle déjà sur l'écran d'accueil ? (le menu cache alors « Installer l'app ») */
export const appInstallee = () => typeof window !== "undefined" && installee();

const CLE = "repere.installer.plus-tard";
const DELAI = 14 * 864e5;
type Invite = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };

const installee = () => matchMedia("(display-mode: standalone)").matches || (navigator as { standalone?: boolean }).standalone === true;
const iphone = () => /iPhone|iPad|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
/* sur iPhone, seul Safari sait ajouter à l'écran d'accueil */
const autreNavigateur = () => /CriOS|FxiOS|EdgiOS|OPiOS|GSA\//.test(navigator.userAgent);
const repousse = () => { try { return Date.now() - +(localStorage.getItem(CLE) || 0) < DELAI; } catch { return false; } };

export function Installer() {
  /* le composant n'est rendu qu'au téléphone (après le démarrage de l'app) : lecture directe */
  const [visible, setVisible] = useState(() => !installee() && !repousse() && iphone());
  /* l'admin la voit partout, même app installée, pour la voir comme ses utilisateurs */
  const admin = useEstAdmin() === true;
  const [ferme, setFerme] = useState(false);
  const [invite, setInvite] = useState<Invite | null>(null);
  /* la feuille s'ouvre aussi depuis le menu (☰ › Installer l'app) */
  const feuille = useMenu((s) => s.installer), setFeuille = (v: boolean) => useMenu.setState({ installer: v });

  useEffect(() => {
    const capter = (e: Event) => { e.preventDefault(); setInvite(e as Invite); if (!installee() && !repousse()) setVisible(true); };
    const finie = () => setVisible(false);
    window.addEventListener("beforeinstallprompt", capter);
    window.addEventListener("appinstalled", finie);
    return () => { window.removeEventListener("beforeinstallprompt", capter); window.removeEventListener("appinstalled", finie); };
  }, []);

  const carte = visible || (admin && !ferme && !repousse());
  const plusTard = () => { try { localStorage.setItem(CLE, String(Date.now())); } catch {} setVisible(false); setFerme(true); };
  const ouvrir = async () => {
    if (invite) { await invite.prompt(); const r = await invite.userChoice; if (r.outcome === "accepted") setVisible(false); return; }
    setFeuille(true);
  };

  return (
    <>
      {/* carte flottante juste au-dessus de la barre d'onglets */}
      {carte && <div className="fixed inset-x-0 bottom-[calc(max(env(safe-area-inset-bottom),10px)+78px)] z-40 mx-auto max-w-[480px] px-3">
        <div className="flex animate-[monter_.4s_cubic-bezier(.3,1.2,.5,1)_both] items-center gap-3 rounded-[20px] border border-border/70 bg-card/95 p-2.5 pr-1.5 shadow-[0_12px_32px_-14px_rgba(0,0,0,.45)] backdrop-blur-xl">
          <span className="grid size-11 shrink-0 place-items-center rounded-[13px] bg-plate-soft text-plate"><DownloadSimpleIcon className="size-6" weight="bold" /></span>
          <button onClick={ouvrir} className="min-w-0 flex-1 text-left text-[14px] leading-snug text-muted-foreground">
            {tr("Installe Repère sur ton iPhone.")}{" "}<span className="font-semibold whitespace-nowrap text-plate-ink">{invite ? tr("Installer →") : tr("Voir les étapes →")}</span>
          </button>
          <button onClick={plusTard} aria-label={tr("Plus tard")} className="grid size-9 shrink-0 place-items-center rounded-full text-muted-foreground active:bg-muted"><XIcon className="size-4" weight="bold" /></button>
        </div>
      </div>}
      <Drawer open={feuille} onOpenChange={setFeuille}>
        <DrawerContent>
          <div className="px-5 pt-2 pb-[max(env(safe-area-inset-bottom),20px)]">
            <DrawerTitle className="text-[20px] font-bold">{tr("Installer Repère")}</DrawerTitle>
            <DrawerDescription className="mt-0.5 text-[13.5px] text-muted-foreground">{tr("En plein écran, comme une vraie app, et utilisable hors connexion.")}</DrawerDescription>
            {autreNavigateur() && (
              <p className="mt-3 rounded-2xl bg-muted px-3.5 py-2.5 text-[13.5px]">{tr("D'abord, ouvre cette page dans Safari : sur iPhone, c'est lui qui ajoute les apps à l'écran d'accueil.")}</p>
            )}
            <ol className="mt-4 flex flex-col gap-2.5">
              <Etape n={1} icone={<ExportIcon className="size-5" />} texte={tr("Touche le bouton Partager de Safari, en bas de l'écran (ou en haut sur iPad).")} />
              <Etape n={2} icone={<PlusSquareIcon className="size-5" />} texte={tr("Fais défiler et choisis « Sur l'écran d'accueil ».")} />
              <Etape n={3} icone={<span className="text-[13px] font-bold">{tr("Ajouter")}</span>} texte={tr("Touche « Ajouter » en haut à droite. Repère apparaît avec les autres apps.")} />
            </ol>
            <Button variant="plate" size="xl" className="mt-5 w-full" onClick={() => setFeuille(false)}>{tr("C'est compris")}</Button>
          </div>
        </DrawerContent>
      </Drawer>
    </>
  );
}

function Etape({ n, icone, texte }: { n: number; icone: React.ReactNode; texte: string }) {
  return (
    <li className="flex items-center gap-3 rounded-2xl bg-card p-3">
      <span className="num grid size-7 shrink-0 place-items-center rounded-full bg-plate text-[14px] font-bold text-plate-foreground">{n}</span>
      <span className="min-w-0 flex-1 text-[14px] leading-snug">{texte}</span>
      <span className="grid h-9 min-w-9 shrink-0 place-items-center rounded-xl bg-muted px-2 text-plate">{icone}</span>
    </li>
  );
}
