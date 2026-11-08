/* Muscles ciblés par un exercice, pour le corps en miniature de la fiche. Logique pure.
   - Principal : les zones du schéma de l'exercice (pat).
   - Secondaires : le second schéma (pat2) et tous les muscles cités dans sa description (m, « Lombaires,
     fessiers »), sauf les zones déjà principales. Les mots qui ne désignent pas une zone du corps
     (cardio, mobilité, équilibre…) sont ignorés. */
import { EX_FR } from "@/lib/data/exercices";
import { EX } from "@/lib/data/exercices";

type Zone = { p?: string; n?: string };
type Test = (z: Zone) => boolean;
const pat = (...l: string[]): Test => (z) => !!z.p && l.includes(z.p);
const nom = (debut: string): Test => (z) => !!z.n && z.n.startsWith(debut);
const FESSIERS = nom("Fessiers"), ISCHIOS = nom("Ischio");

/* mot de la description → zones (le premier qui correspond l'emporte) */
const MOTS: [RegExp, Test[]][] = [
  [/chaîne postérieure/, [pat("lo"), FESSIERS, ISCHIOS]],
  [/jambes|corps entier/, [pat("eg", "mol"), FESSIERS, ISCHIOS]],
  [/pector/, [pat("ph")]],
  [/triceps/, [pat("ec")]],
  [/biceps|brachial/, [pat("fc")]],
  [/arrière|coiffe|rotateurs|subscapulaire/, [pat("re")]],
  [/épaule|faisceau|deltoïde/, [pat("pv", "re")]],
  [/haut du dos|rhomboïde|trapèze|nuque/, [pat("tra")]],
  [/dorsal|^dos|épaisseur/, [pat("tv")]],
  [/lombaire/, [pat("lo")]],
  [/fessier|piriforme|hanche/, [FESSIERS]],
  [/ischio/, [ISCHIOS]],
  [/adducteur/, [pat("add")]],
  [/quadri|cuisse|genou/, [pat("eg")]],
  [/mollet|soléaire|gastroc|cheville|achille/, [pat("mol")]],
  [/oblique|rotation/, [pat("ae")]],
  [/abdo|gainage/, [pat("ft", "ae")]],
  [/avant-bras|poignet|prise|extenseurs/, [pat("avb")]],
];

/** Pour un exercice : le test des zones principales et celui des zones secondaires (null si inconnu). */
export function musclesCibles(id: string): { principal: Test; secondaire: Test } | null {
  const x = EX[id], fr = EX_FR[id];
  if (!x) return null;
  const principal = pat(x.pat);
  const tests: Test[] = x.pat2 && x.pat2 !== x.pat ? [pat(x.pat2)] : [];
  for (const t of (fr?.m || "").split(",")) {
    const m = t.trim().toLowerCase(), f = MOTS.find(([r]) => r.test(m));
    if (f) tests.push(...f[1]);
  }
  return { principal, secondaire: (z) => !principal(z) && tests.some((t) => t(z)) };
}
