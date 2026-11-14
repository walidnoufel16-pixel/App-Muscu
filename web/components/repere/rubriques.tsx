"use client";

/* Rubriques d'Entraînement : une grande bannière par rubrique (photo à droite, titre et texte sur
   un aplat de couleur). Chaque rubrique s'ouvre sur sa page (/entrainement/rubrique?v=…). */
import { noter } from "@/lib/mesure";
import { tr } from "@/lib/i18n";
import { useRouter } from "next/navigation";
import type { Route } from "next";
import { AVANT } from "@/lib/nav";
import { cn } from "@/lib/utils";

export type Rubrique = "libre" | "programme" | "street" | "course" | "soin";
export const RUBRIQUES: Rubrique[] = ["libre", "programme", "street", "course", "soin"];

/** Lien vers une rubrique. */
export const lienRubrique = (v: Rubrique) => `/entrainement/rubrique?v=${v}` as Route;

/* Les univers de marque (Oxa Plan, Oxa Street, Oxa Run) ne se traduisent pas. */
export const nomRubrique = (v: Rubrique) =>
  ({ libre: tr("Mes séances"), programme: "Oxa Plan", street: "Oxa Street", course: "Oxa Run", soin: tr("Soin & mobilité") })[v];

/* photos des exercices (domaine public), sauf Oxa Street et Oxa Run (photos de l'éditeur), en grand ;
   hors connexion sans elles, la petite */
/* `pos` : cadrage de la photo (object-position) quand le centre coupe le sujet */
const BANNIERES: Record<Rubrique, { photo: string; fond: string; texte: () => string; pos?: string }> = {
  libre: { photo: "seance-libre", fond: "#0b7f73", texte: () => tr("Muscu, cardio ou combinée : crée ta séance, compose-la, ou parcours les exercices.") },
  programme: { photo: "seance-plan", fond: "#1e3a8a", texte: () => tr("Huit semaines de séances qui font monter l'effort semaine après semaine.") },
  street: { photo: "rubrique-street", fond: "var(--street)", texte: () => tr("Poids du corps et barre : programmes par niveau, du plus facile au plus dur.") },
  course: { photo: "rubrique-run", fond: "#9a4a1c", texte: () => tr("10 km, semi, marathon ou Hyrox : un plan jusqu'au jour J, à ton allure.") },
  soin: { photo: "seance-soin", fond: "#5d6b55", texte: () => tr("Routines courtes par zone, pour bouger sans douleur.") },
};

export function Photo({ nom, className, pos }: { nom: string; className?: string; pos?: string }) {
  const petite = `/img/${nom}.avif`;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={`/img/grand/${nom}.avif`} alt="" loading="lazy" className={cn("object-cover", className)} style={pos ? { objectPosition: pos } : undefined}
      onError={(e) => { if (!e.currentTarget.src.endsWith(petite)) e.currentTarget.src = petite; else e.currentTarget.style.visibility = "hidden"; }} />
  );
}

/** Les bannières des rubriques données ; `texte` remplace la phrase d'une rubrique, `detail` ajoute une ligne en capitales. */
export function Bannieres({ rubriques, texte = {}, detail = {} }: {
  rubriques: Rubrique[]; texte?: Partial<Record<Rubrique, string>>; detail?: Partial<Record<Rubrique, string>>;
}) {
  const router = useRouter();
  return (
    <div className="flex flex-col gap-3">
      {rubriques.map((v) => {
        const b = BANNIERES[v];
        return (
          <button key={v} data-visite={`rubrique-${v}`} onClick={() => router.push(lienRubrique(v), AVANT)}
            className="relative isolate flex min-h-[150px] overflow-hidden rounded-[22px] text-left text-white active:scale-[.99]" style={{ background: b.fond }}>
            {/* la photo occupe la droite et se fond dans l'aplat */}
            <span className="absolute inset-y-0 right-0 -z-10 w-[58%]">
              <Photo nom={b.photo} pos={b.pos} className="size-full" />
              <span className="absolute inset-0" style={{ background: `linear-gradient(90deg, ${b.fond} 0%, color-mix(in oklab, ${b.fond} 85%, transparent) 22%, transparent 70%)` }} />
            </span>
            <span className="flex max-w-[68%] flex-col justify-center gap-1.5 p-4">
              <span className="text-[22px] leading-[1.05] font-extrabold tracking-[-0.01em] uppercase">{nomRubrique(v)}</span>
              <span className="text-[13.5px] leading-snug text-white/90">{texte[v] ?? b.texte()}</span>
              {detail[v] && <span className="mt-1 text-[11.5px] font-semibold tracking-[0.08em] text-white/70 uppercase">{detail[v]}</span>}
            </span>
          </button>
        );
      })}
    </div>
  );
}

/* phrase courte pour la mosaïque */
const COURT: Record<Rubrique, () => string> = {
  libre: () => tr("Muscu, cardio, combinée"),
  programme: () => tr("8 semaines guidées"),
  street: () => tr("Poids du corps et barre"),
  course: () => tr("10 km, semi, Hyrox"),
  soin: () => tr("Routines par zone"),
};

/** Les rubriques en mosaïque de photos (accueil d'Entraînement) : la première en large, les autres
    deux par deux ; une dernière seule prend toute la largeur. */
export function Mosaique({ rubriques, detail = {} }: { rubriques: Rubrique[]; detail?: Partial<Record<Rubrique, string>> }) {
  const router = useRouter();
  const reste = rubriques.length - 1;
  return (
    <div className="grid grid-cols-2 gap-2.5">
      {rubriques.map((v, i) => {
        const b = BANNIERES[v], large = i === 0 || (reste % 2 === 1 && i === rubriques.length - 1);
        return (
          <button key={v} data-visite={`rubrique-${v}`} onClick={() => { noter("rubrique_ouverte", { r: v }); router.push(lienRubrique(v), AVANT); }}
            className={cn("relative isolate overflow-hidden rounded-[20px] text-left text-white active:scale-[.98]", large ? "col-span-2 h-[140px]" : "h-[124px]")} style={{ background: b.fond }}>
            <Photo nom={b.photo} pos={b.pos} className="absolute inset-0 -z-10 size-full" />
            <span className="absolute inset-0 -z-10" style={{ background: `linear-gradient(180deg, transparent 30%, color-mix(in oklab, ${b.fond} 92%, transparent) 90%)` }} />
            <span className="absolute inset-x-3 bottom-2.5">
              <span className="block text-[17px] leading-tight font-extrabold tracking-[-0.01em]">{nomRubrique(v)}</span>
              <span className="block truncate text-[12px] text-white/85">{detail[v] ?? COURT[v]()}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
}
