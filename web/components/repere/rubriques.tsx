"use client";

/* Accueil de l'onglet Exercices : une rangée « Par muscle » qui défile à l'horizontale,
   puis une grande bannière par rubrique (photo à droite, titre et texte sur un aplat de couleur).
   Chaque rubrique s'ouvre sur sa page (/exercices/rubrique?v=…). */
import { tr } from "@/lib/i18n";
import { useRouter } from "next/navigation";
import type { Route } from "next";
import { ZONES } from "@/lib/data/referentiels";
import { AVANT } from "@/lib/nav";
import { cn } from "@/lib/utils";

export type Rubrique = "corps" | "street" | "course" | "soin";
export const RUBRIQUES: Rubrique[] = ["corps", "street", "course", "soin"];

/** Lien vers une rubrique (et, pour la musculation, une zone du corps déjà choisie). */
export const lienRubrique = (v: Rubrique, z?: string) => `/exercices/rubrique?v=${v}${z ? `&z=${z}` : ""}` as Route;

export const nomRubrique = (v: Rubrique) =>
  ({ corps: tr("Musculation"), street: tr("Street workout"), course: tr("Course"), soin: tr("Soin & mobilité") })[v];

/* photos des exercices (domaine public), en grand ; hors connexion sans elles, la petite */
const BANNIERES: Record<Rubrique, { photo: string; fond: string; texte: () => string }> = {
  corps: { photo: "Barbell_Bench_Press_-_Medium_Grip_0", fond: "#2346c4", texte: () => tr("Tous les exercices, muscle par muscle, avec ton matériel.") },
  street: { photo: "Chin-Up_1", fond: "#1d1d1f", texte: () => tr("Poids du corps et barre : programmes par niveau, du plus facile au plus dur.") },
  course: { photo: "Running_Treadmill_0", fond: "#9a4a1c", texte: () => tr("10 km, semi ou marathon : un plan jusqu'au jour J, à ton allure.") },
  soin: { photo: "Hamstring_Stretch_0", fond: "#5d6b55", texte: () => tr("Routines courtes par zone, pour bouger sans douleur.") },
};

const ZONE_PHOTO: Record<string, string> = {
  pectoraux: "Pushups_0", dos: "Bent_Over_Barbell_Row_0", epaules: "Dumbbell_Shoulder_Press_0", bras: "Barbell_Curl_0",
  jambes: "Barbell_Squat_0", fessiers: "Barbell_Hip_Thrust_1", tronc: "Plank_0",
};
const ORDRE_ZONES = ["pectoraux", "dos", "epaules", "bras", "jambes", "fessiers", "tronc"];

function Photo({ nom, grand, className }: { nom: string; grand?: boolean; className?: string }) {
  const petite = `/img/${nom}.avif`;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={grand ? `/img/grand/${nom}.avif` : petite} alt="" loading="lazy" className={cn("photo-salle object-cover", className)}
      onError={(e) => { if (!e.currentTarget.src.endsWith(petite)) e.currentTarget.src = petite; else e.currentTarget.style.visibility = "hidden"; }} />
  );
}

export function ParMuscle() {
  const router = useRouter();
  return (
    <section>
      <h2 className="eyebrow mb-2 px-1">{tr("Par muscle")}</h2>
      <div className="no-scrollbar -mx-4 flex snap-x gap-2.5 overflow-x-auto px-4 pb-1">
        {ORDRE_ZONES.map((z) => (
          <button key={z} onClick={() => router.push(lienRubrique("corps", z), AVANT)}
            className="relative isolate h-[148px] w-[118px] shrink-0 snap-start overflow-hidden rounded-[18px] bg-muted active:scale-[.97]">
            <Photo nom={ZONE_PHOTO[z]} className="absolute inset-0 -z-10 size-full" />
            <span className="absolute inset-x-0 bottom-0 -z-10 h-2/3 bg-gradient-to-t from-black/80 to-transparent" />
            <span className="absolute inset-x-2.5 bottom-2.5 text-[14px] leading-tight font-bold text-white">{ZONES[z]}</span>
          </button>
        ))}
      </div>
    </section>
  );
}

export function Bannieres({ compte }: { compte: Partial<Record<Rubrique, string>> }) {
  const router = useRouter();
  return (
    <div className="flex flex-col gap-3">
      {RUBRIQUES.map((v) => {
        const b = BANNIERES[v];
        return (
          <button key={v} onClick={() => router.push(lienRubrique(v), AVANT)}
            className="relative isolate flex text-left min-h-[150px] overflow-hidden rounded-[22px] text-white active:scale-[.99]" style={{ background: b.fond }}>
            {/* la photo occupe la droite et se fond dans l'aplat */}
            <span className="absolute inset-y-0 right-0 -z-10 w-[58%]">
              <Photo nom={b.photo} grand className="size-full" />
              <span className="absolute inset-0" style={{ background: `linear-gradient(90deg, ${b.fond} 0%, ${b.fond}d9 22%, transparent 70%)` }} />
            </span>
            <span className="flex max-w-[68%] flex-col justify-center gap-1.5 p-4">
              <span className="text-[22px] leading-[1.05] font-extrabold tracking-[-0.01em] uppercase">{nomRubrique(v)}</span>
              <span className="text-[13.5px] leading-snug text-white/90">{b.texte()}</span>
              {compte[v] && <span className="mt-1 text-[11.5px] font-semibold tracking-[0.08em] text-white/70 uppercase">{compte[v]}</span>}
            </span>
          </button>
        );
      })}
    </div>
  );
}
