/* Variantes d'un exercice : les exercices du même schéma moteur, d'abord ceux
   que permet le matériel déclaré. */
import { tr } from "@/lib/i18n";
import { EX } from "@/lib/data/exercices";
import { dispoDeclare } from "./core";
import type { Reponses } from "./types";

const EQ = [tr("Machine"), tr("Barre"), tr("Haltères"), tr("Poids du corps")];
const ACC: Record<string, string> = { kb: tr("Kettlebell"), el: tr("Élastique"), trx: "TRX" };

/** Matériel d'un exercice, en clair. */
export const materielDe = (id: string) => {
  const e = EX[id];
  return e.acc ? ACC[e.acc] ?? EQ[e.eq] : EQ[e.eq] ?? "";
};

export function variantesDe(A: Reponses, id: string, max = 8) {
  const e = EX[id];
  if (!e) return [];
  const proches = Object.keys(EX).filter((o) => o !== id && (EX[o].pat === e.pat || EX[o].pat2 === e.pat || (e.pat2 && EX[o].pat === e.pat2)));
  /* même schéma principal d'abord, puis faisables avec le matériel déclaré */
  const rang = (o: string) => (EX[o].pat === e.pat ? 0 : 2) + (dispoDeclare(A, o) ? 0 : 1);
  return proches
    .sort((a, b) => rang(a) - rang(b))
    .slice(0, max)
    .map((o) => ({ id: o, dispo: dispoDeclare(A, o), materiel: materielDe(o) }));
}
