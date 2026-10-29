"use client";

/* Rubriques d'Entraînement : une grande bannière par rubrique (photo à droite, titre et texte sur
   un aplat de couleur). Chaque rubrique s'ouvre sur sa page (/entrainement/rubrique?v=…). */
import { tr } from "@/lib/i18n";
import { useRouter } from "next/navigation";
import type { Route } from "next";
import { AVANT } from "@/lib/nav";
import { cn } from "@/lib/utils";

export type Rubrique = "libre" | "programme" | "corps" | "street" | "course" | "soin";
export const RUBRIQUES: Rubrique[] = ["libre", "programme", "corps", "street", "course", "soin"];

/** Lien vers une rubrique (et, pour la musculation, une zone du corps déjà choisie). */
export const lienRubrique = (v: Rubrique, z?: string) => `/entrainement/rubrique?v=${v}${z ? `&z=${z}` : ""}` as Route;

export const nomRubrique = (v: Rubrique) =>
  ({ libre: tr("Séance libre"), programme: tr("Programme 8 semaines"), corps: tr("Musculation"), street: tr("Street workout"), course: tr("Course"), soin: tr("Soin & mobilité") })[v];

/* photos des exercices (domaine public), en grand ; hors connexion sans elles, la petite */
const BANNIERES: Record<Rubrique, { photo: string; fond: string; texte: () => string }> = {
  libre: { photo: "Dumbbell_Lunges_0", fond: "#14266e", texte: () => tr("Crée ta séance, compose-la exercice par exercice, ou importe-la.") },
  programme: { photo: "Barbell_Squat_0", fond: "#0e7490", texte: () => tr("Huit semaines de séances qui font monter l'effort semaine après semaine.") },
  corps: { photo: "Barbell_Bench_Press_-_Medium_Grip_0", fond: "#2346c4", texte: () => tr("Tous les exercices, muscle par muscle, avec ton matériel.") },
  street: { photo: "Chin-Up_1", fond: "#1d1d1f", texte: () => tr("Poids du corps et barre : programmes par niveau, du plus facile au plus dur.") },
  course: { photo: "Running_Treadmill_0", fond: "#9a4a1c", texte: () => tr("10 km, semi ou marathon : un plan jusqu'au jour J, à ton allure.") },
  soin: { photo: "Hamstring_Stretch_0", fond: "#5d6b55", texte: () => tr("Routines courtes par zone, pour bouger sans douleur.") },
};

/* zones du corps, dans l'ordre des onglets de la rubrique Musculation */
export const ORDRE_ZONES = ["pectoraux", "dos", "epaules", "bras", "jambes", "fessiers", "tronc"];

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
              <span className="absolute inset-0" style={{ background: `linear-gradient(90deg, ${b.fond} 0%, ${b.fond}d9 22%, transparent 70%)` }} />
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
