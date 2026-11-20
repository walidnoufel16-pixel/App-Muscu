"use client";

/* Les 3 raccourcis du choix des muscles (Full body, Haut du corps, Bas du corps), au-dessus du schéma :
   un appui coche le groupe, un second le décoche ; on ajuste ensuite muscle par muscle sur le corps
   (le raccourci n'est alors plus surligné). Même composant dans « Exercice par exercice » et
   « Créer une séance pour moi ». */
import { RACCOURCIS, raccourciDe } from "@/lib/logic/raccourcis";
import { tactile } from "@/lib/repos";
import { cn } from "@/lib/utils";

export function RaccourcisCorps({ m, onChange }: { m: string[]; onChange: (m: string[]) => void }) {
  const actif = raccourciDe(m);
  return (
    <div className="grid grid-cols-3 gap-1.5">
      {RACCOURCIS.map((r) => (
        <button key={r.k} aria-pressed={actif === r.k} onClick={() => { tactile(8); onChange(actif === r.k ? [] : [...r.m]); }}
          className={cn("rounded-[14px] border px-2.5 py-2 text-left active:scale-[.98]", actif === r.k ? "border-transparent bg-plate-soft text-plate-ink dark:text-plate" : "border-border bg-background")}>
          <span className="block text-[14px] leading-tight font-bold">{r.n()}</span>
          <span className={cn("mt-0.5 block text-[11.5px] leading-tight", actif !== r.k && "text-muted-foreground")}>{r.d()}</span>
        </button>
      ))}
    </div>
  );
}
