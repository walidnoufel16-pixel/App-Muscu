"use client";

/* Rubriques d'Entraînement : une grande bannière par rubrique (photo à droite, titre et texte sur
   un aplat de couleur). Chaque rubrique s'ouvre sur sa page (/entrainement/rubrique?v=…). */
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
const BANNIERES: Record<Rubrique, { photo: string; fond: string; texte: () => string }> = {
  libre: { photo: "Dumbbell_Lunges_0", fond: "#0b7f73", texte: () => tr("Muscu, cardio ou combinée : crée ta séance, compose-la, ou parcours les exercices.") },
  programme: { photo: "Barbell_Squat_0", fond: "#1e3a8a", texte: () => tr("Huit semaines de séances qui font monter l'effort semaine après semaine.") },
  street: { photo: "rubrique-street", fond: "var(--street)", texte: () => tr("Poids du corps et barre : programmes par niveau, du plus facile au plus dur.") },
  course: { photo: "rubrique-run", fond: "#9a4a1c", texte: () => tr("10 km, semi ou marathon : un plan jusqu'au jour J, à ton allure.") },
  soin: { photo: "Hamstring_Stretch_0", fond: "#5d6b55", texte: () => tr("Routines courtes par zone, pour bouger sans douleur.") },
};

function Photo({ nom, className }: { nom: string; className?: string }) {
  const petite = `/img/${nom}.avif`;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={`/img/grand/${nom}.avif`} alt="" loading="lazy" className={cn("object-cover", className)}
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
          <button key={v} onClick={() => router.push(lienRubrique(v), AVANT)}
            className="relative isolate flex min-h-[150px] overflow-hidden rounded-[22px] text-left text-white active:scale-[.99]" style={{ background: b.fond }}>
            {/* la photo occupe la droite et se fond dans l'aplat */}
            <span className="absolute inset-y-0 right-0 -z-10 w-[58%]">
              <Photo nom={b.photo} className="size-full" />
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
