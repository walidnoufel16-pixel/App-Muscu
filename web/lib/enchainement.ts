"use client";

/* Ce qui suit la fin d'un exercice : la coche se dessine, la carte se replie,
   la suivante s'ouvre et vient à l'écran. Après le dernier : le bilan. */
import { useRepere } from "@/lib/store";
import { useRepos } from "@/lib/repos";
import { bilanDe } from "@/lib/logic/records";
import { mouvementReduit, seanceDe, useCelebrer } from "@/lib/celebrer";

export function enchainer({ k, cles, titre, setOuvert }: { k: string; cles: string[]; titre: string; setOuvert: (k: string | null) => void }) {
  const C = useCelebrer.getState();
  C.terminer(k);
  try { navigator.vibrate?.([10, 50, 14]); } catch {}
  setTimeout(() => {
    const LOG = useRepere.getState().etat.LOG, i = cles.indexOf(k);
    const suivante = [...cles.slice(i + 1), ...cles.slice(0, i)].find((x) => !LOG[x]?.done);
    if (suivante) {
      setOuvert(suivante);
      requestAnimationFrame(() =>
        document.getElementById("ex-" + suivante)?.scrollIntoView({ behavior: mouvementReduit() ? "auto" : "smooth", block: "start" }),
      );
      return;
    }
    setOuvert(null);
    useRepos.getState().arreter();
    const s = seanceDe(k), c = useCelebrer.getState();
    c.montrerBilan({ titre, ...bilanDe(cles.map((x) => LOG[x]), c.records[s] || 0, c.debut[s] || null) });
  }, 650);
}
