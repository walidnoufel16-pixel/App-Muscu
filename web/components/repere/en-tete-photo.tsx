"use client";

/* En-tête en grande photo (préparation de course, plan, séance Hyrox) : la photo passe sous la
   barre d'état, un dégradé sombre porte le titre en blanc. Le retour reste en haut, dans une
   pastille floutée, même quand la photo est sortie de l'écran.
   `photo` : nom du fichier dans public/img (grande version dans public/img/grand, petite en secours). */
import type { Route } from "next";
import { Retour } from "./retour";

export function EnTetePhoto({ photo, position = "center", surtitre, titre, sous, repli, children }: {
  photo: string; position?: string; surtitre?: React.ReactNode; titre: React.ReactNode; sous?: React.ReactNode; repli: Route; children?: React.ReactNode;
}) {
  const petite = `/img/${photo}.avif`;
  return (
    <>
      <div className="safe-top pointer-events-none fixed inset-x-0 top-0 z-30 mx-auto max-w-[480px]">
        <div className="flex h-11 items-center px-3">
          <span className="pointer-events-auto">
            <Retour repli={repli} className="ml-0 h-8 rounded-full bg-black/40 px-3 text-white backdrop-blur-md hover:bg-black/50 hover:text-white" />
          </span>
        </div>
      </div>
      <header className="relative mb-4 h-[calc(272px+env(safe-area-inset-top))] overflow-hidden text-white">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img key={photo} src={`/img/grand/${photo}.avif`} alt="" className="absolute inset-0 size-full object-cover" style={{ objectPosition: position }}
          onError={(e) => { if (!e.currentTarget.src.endsWith(petite)) e.currentTarget.src = petite; }} />
        <span aria-hidden className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,.45)_0%,rgba(0,0,0,0)_26%,rgba(0,0,0,0)_38%,rgba(10,10,12,.9)_100%)]" />
        <div className="absolute inset-x-0 bottom-0 px-5 pb-4">
          {surtitre && <div className="text-[11.5px] font-bold tracking-[0.12em] uppercase opacity-85">{surtitre}</div>}
          <h1 className="mt-1 text-[30px] leading-[1.05] font-extrabold tracking-[-0.02em]">{titre}</h1>
          {sous && <p className="mt-1.5 text-[14px] leading-snug opacity-90">{sous}</p>}
          {children}
        </div>
      </header>
    </>
  );
}
