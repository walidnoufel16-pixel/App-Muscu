/* Les comptes Oxa sur les réseaux : une rangée d'icônes, en bas de la page d'accueil et du blog. */
import { InstagramLogoIcon, TiktokLogoIcon, YoutubeLogoIcon } from "@phosphor-icons/react/dist/ssr";

export const RESEAUX = [
  { nom: "TikTok", url: "https://www.tiktok.com/@oxafit.app", Icone: TiktokLogoIcon },
  { nom: "Instagram", url: "https://www.instagram.com/oxafit.app/", Icone: InstagramLogoIcon },
  { nom: "YouTube", url: "https://www.youtube.com/@oxafit", Icone: YoutubeLogoIcon },
] as const;

export function Reseaux({ titre, className = "" }: { titre: string; className?: string }) {
  return (
    <nav aria-label={titre} className={`flex flex-col items-center gap-2 ${className}`}>
      <span className="text-[12px] font-semibold tracking-[0.08em] text-muted-foreground uppercase">{titre}</span>
      <div className="flex gap-2.5">
        {RESEAUX.map(({ nom, url, Icone }) => (
          <a key={nom} href={url} target="_blank" rel="noopener" aria-label={nom} className="grid size-11 place-items-center rounded-full bg-card text-foreground active:scale-95">
            <Icone className="size-[22px]" weight="fill" />
          </a>
        ))}
      </div>
    </nav>
  );
}
