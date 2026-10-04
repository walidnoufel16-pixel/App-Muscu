/* Défis entre amis : types, score calculé depuis l'historique, jours restants. Logique pure.
   Le serveur ne reçoit que le score (lib/defis.ts). */
import { dateDe, decaler, jourDe } from "./historique";
import type { Etat } from "./types";

export type TypeDefi = "seances" | "tonnage" | "cardio";
export type Participant = { pseudo: string; score: number; moi: boolean };
export type Defi = { code: string; nom: string; type: TypeDefi; cible: number; debut: string; fin: string; participants: Participant[] };

export const TYPES_DEFI: Record<TypeDefi, { nom: string; unite: string; cibles: number[]; exemple: (c: number, sem: number) => string }> = {
  seances: { nom: "Séances", unite: "séances", cibles: [4, 8, 12, 16, 20], exemple: (c, s) => `${c} séances en ${s} semaine${s > 1 ? "s" : ""}` },
  tonnage: { nom: "Tonnage", unite: "kg", cibles: [5000, 10000, 20000, 40000, 80000], exemple: (c, s) => `${(c / 1000).toLocaleString("fr-FR")} t en ${s} semaine${s > 1 ? "s" : ""}` },
  cardio: { nom: "Cardio", unite: "min", cibles: [60, 120, 200, 300, 500], exemple: (c, s) => `${c} min de cardio en ${s} semaine${s > 1 ? "s" : ""}` },
};

/** Mon score sur la période du défi : séances (muscu + cardio seul), kg soulevés ou minutes de cardio. */
export function scoreDe(E: Etat, d: Pick<Defi, "type" | "debut" | "fin">): number {
  const dans = (j: string) => j >= d.debut && j <= d.fin;
  const H = (E.HIST || []).filter((l) => dans(l.d)), C = (E.CARDIO || []).filter((c) => dans(jourDe(c.ts)));
  if (d.type === "tonnage") return Math.round(H.reduce((n, l) => n + l.vol, 0));
  if (d.type === "cardio") return Math.round(C.reduce((n, c) => n + c.min, 0));
  return H.length + C.filter((c) => !c.ref).length;
}

export const joursRestants = (d: Pick<Defi, "fin">, auj = jourDe(Date.now())) =>
  Math.max(0, Math.round((dateDe(d.fin).getTime() - dateDe(auj).getTime()) / 864e5) + 1);
export const termine = (d: Pick<Defi, "fin">, auj = jourDe(Date.now())) => auj > d.fin;
export const finDe = (debut: string, semaines: number) => decaler(debut, semaines * 7 - 1);

export const ALPHA = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
export const nouveauCode = (rnd = Math.random) => Array.from({ length: 5 }, () => ALPHA[Math.floor(rnd() * ALPHA.length)]).join("");
export const codePropre = (c: string) => (c || "").trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
