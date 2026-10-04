"use client";

/* Défis entre amis côté client : appels aux fonctions du serveur (migration
   20261004090000_defis.sql), cache des défis suivis, envoi du score après chaque
   séance. Les codes suivis sont dans A.defis (synchronisés avec le compte). */
import { create } from "zustand";
import { sb } from "@/lib/supabase";
import { useRepere, sansBalise } from "@/lib/store";
import { codePropre, finDe, nouveauCode, scoreDe, type Defi, type TypeDefi } from "@/lib/logic/defis";
import { decaler, jourDe } from "@/lib/logic/historique";

const nettoyer = (d: Defi): Defi => ({
  ...d, nom: sansBalise(d.nom), participants: (d.participants || []).map((p) => ({ ...p, pseudo: sansBalise(p.pseudo) })),
});
const pseudo = () => (useRepere.getState().pseudo || "Moi").slice(0, 40).replace(/[<>]/g, "") || "Moi";
const suivre = (code: string) => useRepere.getState().muter((E) => {
  const l = (E.A.defis as string[] | undefined) || [];
  if (!l.includes(code)) E.A.defis = [...l, code].slice(-20);
});
/* défi réussi : noté une fois (badge « Défi relevé ») */
const noterReussite = (d: Defi) => {
  const moi = d.participants.find((p) => p.moi);
  const ok = (useRepere.getState().etat.A.defisOk as Record<string, string> | undefined) || {};
  if (moi && moi.score >= d.cible && !ok[d.code]) useRepere.getState().muter((E) => { E.A.defisOk = { ...ok, [d.code]: jourDe(Date.now()) }; });
};

type Etat = {
  liste: Record<string, Defi>;
  charge: boolean;
  rafraichir: () => Promise<void>;
  creer: (nom: string, type: TypeDefi, cible: number, semaines: number) => Promise<{ code?: string; erreur?: string }>;
  rejoindre: (code: string) => Promise<{ defi?: Defi; erreur?: string }>;
  quitter: (code: string) => Promise<void>;
  envoyerScores: () => Promise<void>;
};

export const useDefis = create<Etat>((set, get) => ({
  liste: {},
  charge: false,

  /* Relit chaque défi suivi, puis envoie mes scores à jour. */
  async rafraichir() {
    const c = await sb(), codes = (useRepere.getState().etat.A.defis as string[] | undefined) || [];
    if (!c || !useRepere.getState().user || !codes.length) { set({ charge: true }); return; }
    const liste: Record<string, Defi> = {};
    await Promise.all(codes.map(async (code) => {
      const { data } = await c.rpc("lire_defi", { p_code: code });
      if (data) { liste[code] = nettoyer(data as Defi); noterReussite(liste[code]); }
    }));
    set({ liste, charge: true });
    await get().envoyerScores();
  },

  async creer(nom, type, cible, semaines) {
    const c = await sb();
    if (!c || !useRepere.getState().user) return { erreur: "Les défis demandent un compte (Profil › Compte)." };
    const debut = jourDe(Date.now()), fin = finDe(debut, semaines);
    let err = "";
    for (let essai = 0; essai < 4; essai++) {
      const code = nouveauCode();
      const { data, error } = await c.rpc("creer_defi", {
        p_code: code, p_nom: sansBalise(nom).trim().slice(0, 60) || "Défi", p_type: type, p_cible: cible, p_debut: debut, p_fin: fin, p_pseudo: pseudo(),
      });
      if (!error && data) {
        suivre(code);
        set({ liste: { ...get().liste, [code]: nettoyer(data as Defi) } });
        get().envoyerScores();
        return { code };
      }
      err = error?.message || "";
      if (!/duplicate|unique/i.test(err)) break;
    }
    return { erreur: /trop de défis/.test(err) ? "Tu as déjà 10 défis en cours." : "Création impossible : " + (err || "réessaie") };
  },

  async rejoindre(brut) {
    const code = codePropre(brut);
    if (code.length !== 5) return { erreur: "Le code fait cinq caractères." };
    const c = await sb();
    if (!c || !useRepere.getState().user) return { erreur: "Les défis demandent un compte (Profil › Compte)." };
    const { data, error } = await c.rpc("rejoindre_defi", { p_code: code, p_pseudo: pseudo() });
    if (error) return { erreur: /complet/.test(error.message) ? "Ce défi est complet (50 participants)." : "Impossible de rejoindre : " + error.message };
    if (!data) return { erreur: "Aucun défi ne correspond au code " + code + "." };
    suivre(code);
    const d = nettoyer(data as Defi);
    set({ liste: { ...get().liste, [code]: d } });
    await get().envoyerScores();
    return { defi: get().liste[code] || d };
  },

  async quitter(code) {
    const c = await sb();
    if (c) await c.rpc("quitter_defi", { p_code: code });
    useRepere.getState().muter((E) => { E.A.defis = ((E.A.defis as string[] | undefined) || []).filter((x) => x !== code); });
    const l = { ...get().liste }; delete l[code];
    set({ liste: l });
  },

  /* Mon score, calculé sur l'historique, pour chaque défi en cours (ou fini d'hier). */
  async envoyerScores() {
    const c = await sb(), E = useRepere.getState().etat, auj = jourDe(Date.now());
    if (!c || !useRepere.getState().user) return;
    const liste = { ...get().liste };
    await Promise.all(Object.values(liste).filter((d) => auj >= d.debut && auj <= decaler(d.fin, 1)).map(async (d) => {
      const score = scoreDe(E, d);
      const moi = d.participants.find((p) => p.moi);
      if (moi && moi.score === score) return;
      await c.rpc("maj_score", { p_code: d.code, p_score: score });
      liste[d.code] = { ...d, participants: d.participants.map((p) => (p.moi ? { ...p, score } : p)).sort((a, b) => b.score - a.score) };
      noterReussite(liste[d.code]);
    }));
    set({ liste });
  },
}));

/* Après chaque séance (l'historique ou le cardio change), les scores repartent. */
let branche = false;
export function suivreDefis() {
  if (branche) return;
  branche = true;
  let t: ReturnType<typeof setTimeout> | null = null;
  useRepere.subscribe((st, avant) => {
    if (st.etat.HIST === avant.etat.HIST && st.etat.CARDIO === avant.etat.CARDIO) return;
    if (!((st.etat.A.defis as string[] | undefined) || []).length) return;
    if (t) clearTimeout(t);
    t = setTimeout(() => {
      const D = useDefis.getState();
      if (Object.keys(D.liste).length) D.envoyerScores(); else D.rafraichir();
    }, 2500);
  });
}
