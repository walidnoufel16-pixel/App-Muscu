"use client";

import { tr } from "@/lib/i18n";
import { useState } from "react";
import { BarbellIcon, BuildingsIcon, CaretRightIcon, CheckIcon, XIcon } from "@phosphor-icons/react";
import { Drawer, DrawerContent, DrawerDescription, DrawerTitle } from "@/components/ui/drawer";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { POSTES, ZONES_SALLE, type Poste } from "@/lib/data/salle";
import { creditPoste, imgPoste, imgPosteGrand } from "@/lib/medias";
import { useRepere } from "@/lib/store";
import { cn } from "@/lib/utils";

/* Postes visibles selon le matériel coché : machines (m0), postes à barre (m1). */
const zonesPour = (types: string[]) => ZONES_SALLE.filter((z) => types.includes(z.type));

/* Photo d'un poste ; icône s'il n'en a pas ou si elle ne charge pas (hors ligne, image bloquée). */
function PhotoPoste({ p, className }: { p: Poste; className?: string }) {
  const src = imgPoste(p);
  const [rate, setRate] = useState(false);
  return (
    <span className={cn("relative grid place-items-center overflow-hidden bg-muted", className)}>
      {src && !rate ? (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img src={src} alt="" loading="lazy" className="size-full object-cover" onError={() => setRate(true)} />
      ) : (
        <BarbellIcon className="size-9 text-muted-foreground/70" weight="duotone" />
      )}
    </span>
  );
}

/* Une machine en grand, photo entière, avec son auteur. Se ferme avec la croix, en touchant le
   fond ou avec Échap. Hors connexion sans la grande photo : la petite, sinon l'icône. */
function Visionneuse({ p, onClose }: { p: Poste | null; onClose: () => void }) {
  const sources = p ? ([imgPosteGrand(p), imgPoste(p)].filter(Boolean) as string[]) : [];
  const [rate, setRate] = useState(0);
  const credit = p ? creditPoste(p) : undefined;
  return (
    <Dialog open={!!p} onOpenChange={(o) => { if (!o) { setRate(0); onClose(); } }}>
      <DialogContent showCloseButton={false} onClick={() => { setRate(0); onClose(); }}
        className="flex h-dvh max-h-dvh w-screen max-w-none flex-col items-center justify-center gap-3 rounded-none border-0 bg-black/95 p-4 text-white shadow-none sm:max-w-none">
        <DialogTitle className="sr-only">{p?.n}</DialogTitle>
        <DialogDescription className="sr-only">{tr("Photo en grand. Touche la croix pour la fermer.")}</DialogDescription>
        <button onClick={(e) => { e.stopPropagation(); setRate(0); onClose(); }} aria-label={tr("Fermer")} autoFocus
          className="absolute top-[max(env(safe-area-inset-top),14px)] right-4 grid size-11 place-items-center rounded-full bg-white/15 text-white backdrop-blur active:scale-90">
          <XIcon className="size-5" weight="bold" />
        </button>
        {rate < sources.length ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img key={sources[rate]} src={sources[rate]} alt={p?.n ?? ""} onError={() => setRate((x) => x + 1)} onClick={(e) => e.stopPropagation()}
            className="max-h-[72dvh] w-auto max-w-full rounded-2xl object-contain" />
        ) : (
          <BarbellIcon className="size-24 text-white/50" weight="duotone" />
        )}
        <p className="text-center text-[18px] font-semibold">{p?.n}</p>
        {credit && (
          <a href={credit.lien} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()} className="text-center text-[12.5px] text-white/65 underline underline-offset-2">
            {tr("Photo : {n} · {l}", { n: credit.nom, l: credit.licence })}
          </a>
        )}
      </DialogContent>
    </Dialog>
  );
}

/* « Ma salle » : une planche illustrée des machines et postes ; on touche ceux
   qu'on n'a pas. Enregistré dans le compte (A.sansPostes). */
export function FeuilleSalle({ ouvert, onOuvert, types = ["m0", "m1"] }: { ouvert: boolean; onOuvert: (o: boolean) => void; types?: string[] }) {
  const sans = useRepere((s) => s.etat.A.sansPostes) || [];
  const muter = useRepere((s) => s.muter);
  const zones = zonesPour(types);
  const visibles = POSTES.filter((p) => zones.some((z) => z.k === p.zone)).map((p) => p.id);
  const basculer = (id: string) => muter((E) => {
    const l = E.A.sansPostes || [];
    E.A.sansPostes = l.includes(id) ? l.filter((x) => x !== id) : [...l, id];
  });
  const tous = (dispo: boolean) => muter((E) => {
    const l = (E.A.sansPostes || []).filter((x) => !visibles.includes(x));
    E.A.sansPostes = dispo ? l : [...l, ...visibles];
  });
  const n = visibles.filter((id) => !sans.includes(id)).length;
  const [grand, setGrand] = useState<Poste | null>(null);
  return (
    <Drawer open={ouvert} onOpenChange={onOuvert}>
      <DrawerContent className="max-h-[92dvh]">
        <div className="overflow-y-auto px-4 pt-2 pb-[max(env(safe-area-inset-bottom),20px)]">
          <DrawerTitle className="text-center text-[20px] font-bold">{tr("Ma salle")}</DrawerTitle>
          <DrawerDescription className="mt-1 text-center text-[13.5px] text-muted-foreground">
            {tr("Touche le nom d'une machine pour dire que ta salle ne l'a pas : ses exercices disparaissent de tes listes et de tes séances. Touche sa photo pour la voir en grand.")}
          </DrawerDescription>
          <div className="mt-3 flex items-center justify-between px-1">
            <span className="text-[13.5px] font-medium">{tr("{n} sur {t} disponibles", { n, t: visibles.length })}</span>
            <span className="flex gap-1.5">
              <button onClick={() => tous(true)} className="h-8 rounded-full bg-muted px-3 text-[12.5px] font-medium">{tr("Toutes")}</button>
              <button onClick={() => tous(false)} className="h-8 rounded-full bg-muted px-3 text-[12.5px] font-medium">{tr("Aucune")}</button>
            </span>
          </div>
          {zones.map((z) => (
            <section key={z.k} className="mt-4">
              <h3 className="eyebrow mb-2 px-1">{z.n}</h3>
              <div className="grid grid-cols-3 gap-2">
                {POSTES.filter((p) => p.zone === z.k).map((p) => {
                  const dispo = !sans.includes(p.id);
                  return (
                    <div key={p.id} className={cn("relative flex flex-col items-stretch gap-1.5 rounded-[16px] border-2 bg-card p-1.5 transition", dispo ? "border-plate" : "border-transparent")}>
                      {/* la photo s'ouvre en grand ; le nom et la coche disent si la salle a la machine */}
                      <button onClick={() => setGrand(p)} aria-label={tr("Voir en grand : {n}", { n: p.n })} className="rounded-[11px] transition active:scale-[.97]">
                        <PhotoPoste p={p} className={cn("aspect-square w-full rounded-[11px] transition", !dispo && "opacity-40 grayscale")} />
                      </button>
                      <button aria-pressed={dispo} aria-label={p.n} onClick={() => basculer(p.id)}
                        className={cn("line-clamp-2 min-h-[2.4em] px-0.5 text-left text-[12px] leading-[1.2] font-medium", !dispo && "text-muted-foreground line-through")}>
                        {p.n}
                      </button>
                      <button aria-hidden tabIndex={-1} onClick={() => basculer(p.id)} className="absolute top-0.5 right-0.5 grid size-10 place-items-center">
                        <span className={cn("grid size-5 place-items-center rounded-full ring-2 ring-card", dispo ? "bg-plate text-plate-foreground" : "bg-muted")}>
                          {dispo && <CheckIcon className="size-3" weight="bold" />}
                        </span>
                      </button>
                    </div>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      </DrawerContent>
      <Visionneuse p={grand} onClose={() => setGrand(null)} />
    </Drawer>
  );
}

/* Ligne « Ma salle · 24 sur 31 » qui ouvre la planche. */
export function LienSalle({ types = ["m0", "m1"], className }: { types?: string[]; className?: string }) {
  const [ouvert, setOuvert] = useState(false);
  const sans = useRepere((s) => s.etat.A.sansPostes) || [];
  const zones = zonesPour(types);
  const visibles = POSTES.filter((p) => zones.some((z) => z.k === p.zone));
  if (!visibles.length) return null;
  const n = visibles.filter((p) => !sans.includes(p.id)).length;
  return (
    <>
      <button onClick={() => setOuvert(true)} className={cn("flex w-full items-center gap-3 rounded-[16px] bg-card px-3.5 py-2.5 text-left active:scale-[.99]", className)}>
        <BuildingsIcon className="size-5 text-plate" />
        <span className="flex-1 text-[14px] font-medium">{tr("Ma salle")}<span className="text-muted-foreground">{" · "}{tr("{n} sur {t} machines et postes", { n, t: visibles.length })}</span></span>
        <CaretRightIcon className="size-4 text-muted-foreground" />
      </button>
      <FeuilleSalle ouvert={ouvert} onOuvert={setOuvert} types={types} />
    </>
  );
}
