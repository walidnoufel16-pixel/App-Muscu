"use client";

/* Visite guidée du premier lancement : une feuille de bienvenue (les 4 grands axes), puis une bulle
   posée sur chaque repère de la vraie interface (repérés par data-visite), puis la fin :
   - sans Oxa Plan : la mise en route en 3 questions si le profil est vide, puis « Ta première séance ? » ;
   - avec Oxa Plan : une bulle de plus sur la tuile du programme, puis « Construisons ton programme »
     (ou « Ta séance du jour » s'il est déjà construit).
   Une seule fois (repere.visite), pour un compte qui n'a encore rien fait ; jamais pendant une séance
   ni sur l'ancienne adresse. Revoir : menu ☰ › Aide.
   Mini-visite : quand Oxa Plan s'ouvre plus tard pour un compte, une bulle unique sur sa tuile,
   une seule fois (repere.visite.plan). */
import { tr } from "@/lib/i18n";
import { useEffect, useLayoutEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { create } from "zustand";
import { BarbellIcon, ChartLineUpIcon, FireIcon, ForkKnifeIcon, UserCircleIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Drawer, DrawerContent, DrawerDescription, DrawerTitle } from "@/components/ui/drawer";
import { useRepere } from "@/lib/store";
import { useCelebrer } from "@/lib/celebrer";
import { useProgrammeActif } from "@/lib/fonctionnalites";
import { AVANT } from "@/lib/nav";
import { tactile } from "@/lib/repos";
import { lienRubrique } from "./rubriques";
import { MiseEnRoute, profilMinimal } from "./profil-sportif";

const CLE = "repere.visite", CLE_PLAN = "repere.visite.plan";
/** Étape en cours : null = fermée ; 0 bienvenue ; 1 à n bulles ; n + 1 la fin. */
export const useVisite = create<{ etape: number | null; mini: boolean }>(() => ({ etape: null, mini: false }));
export const revoirVisite = () => useVisite.setState({ etape: 0 });

type BulleDef = { cible: string; k: () => string; t: () => string; d: () => string };
const ENTRAINEMENT: BulleDef = { cible: "entrainement", k: () => tr("Entraînement"), t: () => tr("Tes séances"), d: () => tr("Ta semaine en un coup d'œil, ta séance du jour et l'agenda. « Pour moi » : Oxa compose une séance selon les muscles que tu as récupérés.") };
const ENTRAINEMENT_PLAN: BulleDef = { cible: "entrainement", k: () => tr("Entraînement"), t: () => tr("Tes séances"), d: () => tr("Ta semaine en un coup d'œil et ta séance du jour. Des séances libres quand tu veux, en plus de ton programme.") };
const PROGRAMME: BulleDef = { cible: "rubrique-programme", k: () => "Oxa Plan", t: () => tr("Ton programme sur 8 semaines"), d: () => tr("L'effort monte de semaine en semaine, puis une semaine d'allègement pour récupérer. Tes charges s'ajustent toutes seules à ce que tu réussis.") };
const AUTRES: BulleDef[] = [
  { cible: "repas", k: () => "Oxa Meal", t: () => tr("Tes repas"), d: () => tr("Tes besoins du jour, calculés sur tes vraies séances, ta semaine de repas et ta liste de courses.") },
  { cible: "progres", k: () => tr("Progrès"), t: () => tr("Tes progrès"), d: () => tr("Ta série de semaines, tes records et ton historique, où tu peux retirer une séance validée par erreur.") },
  { cible: "profil", k: () => tr("Profil"), t: () => tr("Ton profil sportif"), d: () => tr("Âge, objectif, niveau, séances par semaine : plus il est complet, plus tes séances et tes repas sont justes.") },
  { cible: "menu", k: () => tr("Menu"), t: () => tr("Tes réglages"), d: () => tr("Ton matériel, tes rappels, le blog, ton avis… et « Inviter un ami » pour t'entraîner à plusieurs.") },
];
const MINI: BulleDef = { ...PROGRAMME, t: () => tr("Nouveau : ton programme sur 8 semaines"), d: () => tr("Réponds à quelques questions : Oxa construit tes 8 semaines avec tes charges de départ, puis les ajuste à ce que tu réussis.") };

const lu = (k: string) => { try { return !!localStorage.getItem(k); } catch { return true; } };
const noter = (k: string) => { try { localStorage.setItem(k, String(Date.now())); } catch {} };
const RACINE = /^\/(entrainement|repas|progres)\/?$/;

export function Visite() {
  const router = useRouter(), chemin = usePathname();
  const { etape, mini } = useVisite();
  const pseudo = useRepere((s) => s.pseudo);
  const pret = useRepere((s) => s.pret);
  const A = useRepere((s) => s.etat.A);
  const planConstruit = useRepere((s) => !!s.etat.PLAN || !!s.etat.FINI);
  const neuf = useRepere((s) => !(s.etat.HIST || []).length && !s.etat.SEANCES.length);
  const bilan = useCelebrer((s) => !!s.bilan);
  const prog = useProgrammeActif();
  const ancienne = typeof location !== "undefined" && location.hostname.endsWith(".onrender.com") && !!process.env.NEXT_PUBLIC_NOUVELLE_ADRESSE;

  const bulles = prog ? [ENTRAINEMENT_PLAN, PROGRAMME, ...AUTRES] : [ENTRAINEMENT, ...AUTRES];
  const n = bulles.length, fin = etape !== null && etape > n;
  const besoinProfil = !A.miseEnRoute && !profilMinimal(A);

  /* première ouverture d'un compte qui n'a encore rien fait : la visite démarre d'elle-même */
  useEffect(() => {
    if (!pret || !pseudo || !neuf || bilan || etape !== null || mini || ancienne) return;
    if (!RACINE.test(chemin) || lu(CLE)) return;
    const t = setTimeout(() => useVisite.setState({ etape: 0 }), 700);
    return () => clearTimeout(t);
  }, [pret, pseudo, neuf, bilan, etape, mini, chemin, ancienne]);

  /* Oxa Plan ouvert plus tard : une bulle sur sa tuile, une fois, tant que le programme n'est pas construit */
  useEffect(() => {
    if (!pret || !pseudo || !prog || planConstruit || bilan || etape !== null || mini || ancienne) return;
    if (!/^\/entrainement\/?$/.test(chemin) || lu(CLE_PLAN) || (neuf && !lu(CLE))) return;
    const t = setTimeout(() => useVisite.setState({ mini: true }), 900);
    return () => clearTimeout(t);
  }, [pret, pseudo, prog, planConstruit, bilan, etape, mini, chemin, neuf, ancienne]);

  const finir = () => { noter(CLE); if (prog) noter(CLE_PLAN); useVisite.setState({ etape: null }); };
  const suivant = () => {
    tactile(5);
    /* les bulles se posent sur les onglets : depuis un autre écran, on part d'Entraînement */
    if (etape === 0 && !RACINE.test(chemin)) router.push("/entrainement");
    useVisite.setState({ etape: (etape ?? 0) + 1 });
  };
  const allerVers = (lien: Parameters<typeof router.push>[0]) => { tactile(10); finir(); router.push(lien, AVANT); };
  const finMini = () => { noter(CLE_PLAN); useVisite.setState({ mini: false }); };

  const AXES = [
    { I: BarbellIcon, t: tr("T'entraîner"), d: prog ? tr("Ton programme de 8 semaines, et des séances libres quand tu veux") : tr("Ta séance du jour, prête en un geste") },
    { I: ForkKnifeIcon, t: tr("Bien manger"), d: tr("Tes repas, tes besoins et ta liste de courses") },
    { I: ChartLineUpIcon, t: tr("Progresser"), d: tr("Ta série, tes records, tes charges qui montent") },
    { I: UserCircleIcon, t: tr("Ton profil"), d: tr("Il calcule tes séances et tes repas") },
  ];

  return (
    <>
      <Drawer open={etape === 0} onOpenChange={(o) => !o && etape === 0 && finir()}>
        <DrawerContent>
          <div className="px-5 pt-3 pb-[max(env(safe-area-inset-bottom),20px)]">
            <div className="eyebrow text-plate-ink">{tr("Bienvenue")}</div>
            <DrawerTitle className="mt-0.5 text-[26px] leading-tight font-black tracking-[-0.02em]">{pseudo ? tr("Bienvenue sur Oxa, {p}", { p: pseudo }) : tr("Bienvenue sur Oxa")}</DrawerTitle>
            <DrawerDescription className="mt-1 text-[14.5px] text-muted-foreground">{tr("Tout ce qu'il faut pour t'entraîner, en 4 endroits.")}</DrawerDescription>
            <ul className="mt-4 flex flex-col gap-2">
              {AXES.map(({ I, t, d }, i) => (
                <li key={t} className="flex animate-[monter_.45s_ease-out_both] items-center gap-3 rounded-2xl bg-card p-3" style={{ animationDelay: 80 + i * 70 + "ms" }}>
                  <span className="grid size-10 shrink-0 place-items-center rounded-[12px] bg-plate-soft text-plate-ink"><I className="size-5" weight="bold" /></span>
                  <span className="min-w-0">
                    <span className="block text-[15px] font-semibold">{t}</span>
                    <span className="block text-[12.5px] leading-snug text-muted-foreground">{d}</span>
                  </span>
                </li>
              ))}
            </ul>
            <Button variant="plate" size="xl" className="mt-5 w-full" onClick={suivant}>{tr("Faire la visite · 30 s")}</Button>
            <button onClick={finir} className="mt-1 w-full py-2.5 text-[14px] font-medium text-muted-foreground">{tr("Passer")}</button>
          </div>
        </DrawerContent>
      </Drawer>

      {etape !== null && etape >= 1 && etape <= n && <Bulle key={etape} b={bulles[etape - 1]} i={etape} total={n} onSuivant={suivant} onPasser={finir} />}
      {mini && etape === null && <Bulle b={MINI} i={1} total={1} onSuivant={() => { finMini(); router.push(lienRubrique("programme"), AVANT); }} onPasser={finMini} onAbsent={() => useVisite.setState({ mini: false })} bouton={tr("Découvrir")} passer={tr("Plus tard")} />}

      {/* fin sans Oxa Plan : 3 questions si le profil est vide, puis la première séance */}
      <MiseEnRoute ouvert={fin && !prog && besoinProfil} onFin={() => {}} />
      <Fin
        ouvert={fin && !prog && !besoinProfil}
        titre={tr("Ta première séance ?")}
        texte={tr("Touche les muscles que tu veux travailler, ou choisis une rubrique : ta séance est prête en un geste.")}
        bouton={tr("Créer ma première séance")}
        onOk={() => allerVers(lienRubrique("libre"))} onPlusTard={finir} />
      {/* fin avec Oxa Plan */}
      <Fin
        ouvert={fin && prog}
        titre={planConstruit ? tr("Ta séance du jour") : tr("Construisons ton programme")}
        texte={planConstruit
          ? tr("Ton programme t'attend : ouvre la séance prévue aujourd'hui.")
          : tr("Quelques questions, et Oxa bâtit tes 8 semaines avec tes charges de départ. Ce que tu as déjà indiqué dans ton profil est repris.")}
        bouton={planConstruit ? tr("Voir ma séance") : tr("Construire mon programme")}
        onOk={() => allerVers(planConstruit ? lienRubrique("programme") : "/questionnaire")} onPlusTard={finir} />
    </>
  );
}

function Fin({ ouvert, titre, texte, bouton, onOk, onPlusTard }: { ouvert: boolean; titre: string; texte: string; bouton: string; onOk: () => void; onPlusTard: () => void }) {
  return (
    <Drawer open={ouvert} onOpenChange={(o) => !o && ouvert && onPlusTard()}>
      <DrawerContent>
        <div className="px-5 pt-3 pb-[max(env(safe-area-inset-bottom),20px)] text-center">
          <FireIcon className="mx-auto size-12 animate-[medaille_.8s_cubic-bezier(.3,1.5,.5,1)_both] text-plate" weight="fill" />
          <DrawerTitle className="mt-3 text-[25px] font-black tracking-[-0.02em]">{titre}</DrawerTitle>
          <DrawerDescription className="mx-auto mt-1.5 max-w-[34ch] text-[14.5px] leading-relaxed text-muted-foreground">{texte}</DrawerDescription>
          <Button variant="plate" size="xl" className="mt-5 w-full" onClick={onOk}>{bouton}</Button>
          <button onClick={onPlusTard} className="mt-1 w-full py-2.5 text-[14px] font-medium text-muted-foreground">{tr("Plus tard")}</button>
        </div>
      </DrawerContent>
    </Drawer>
  );
}

/* Une bulle sur un repère de l'interface : le repère est éclairé, le reste assombri. Un repère hors
   de l'écran est amené au centre ; un repère absent (écran sans cette tuile) est sauté. */
function Bulle({ b, i, total, onSuivant, onPasser, onAbsent = onSuivant, bouton, passer }: { b: BulleDef; i: number; total: number; onSuivant: () => void; onPasser: () => void; onAbsent?: () => void; bouton?: string; passer?: string }) {
  const [r, setR] = useState<DOMRect | null>(null);
  useLayoutEffect(() => {
    let essais = 0, vivant = true, t: ReturnType<typeof setTimeout>;
    const el = () => document.querySelector<HTMLElement>(`[data-visite="${b.cible}"]`);
    const mesurer = () => { const e = el(); if (vivant) setR(e?.getBoundingClientRect() ?? null); };
    const chercher = () => {
      const e = el();
      if (!e) { if (++essais < 20) t = setTimeout(chercher, 100); else onAbsent(); return; }
      const q = e.getBoundingClientRect();
      if (q.top < 60 || q.bottom > innerHeight - 90) { e.scrollIntoView({ block: "center", behavior: "smooth" }); t = setTimeout(mesurer, 450); }
      mesurer();
    };
    chercher();
    addEventListener("resize", mesurer);
    addEventListener("scroll", mesurer, true);
    return () => { vivant = false; clearTimeout(t); removeEventListener("resize", mesurer); removeEventListener("scroll", mesurer, true); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [b.cible]);
  if (!r) return null;
  const pad = 6, rond = b.cible === "menu" || b.cible === "profil" ? 999 : 18;
  const enBas = r.top > innerHeight / 2;
  const cx = r.left + r.width / 2;
  return (
    <div className="fixed inset-0 z-[60]" role="dialog" aria-modal="true" aria-label={b.t()}>
      {/* le voile, percé autour du repère */}
      <div className="absolute transition-all duration-300 ease-out"
        style={{ left: r.left - pad, top: r.top - pad, width: r.width + pad * 2, height: r.height + pad * 2, borderRadius: rond, boxShadow: "0 0 0 9999px rgba(10,10,12,.6)", outline: "3px solid var(--plate)" }} />
      <div className="absolute inset-x-4 animate-[monter_.35s_ease-out_both] rounded-[22px] bg-card p-4 shadow-[0_20px_40px_-12px_rgba(0,0,0,.5)]"
        style={enBas ? { bottom: innerHeight - r.top + pad + 14 } : { top: r.bottom + pad + 14 }}>
        <span aria-hidden className="absolute size-4 rotate-45 bg-card" style={{ left: Math.min(Math.max(cx - 16 - 8, 14), innerWidth - 32 - 30), ...(enBas ? { bottom: -7 } : { top: -7 }) }} />
        <div className="eyebrow text-plate-ink">{total > 1 ? `${i} / ${total} · ` : ""}{b.k()}</div>
        <h3 className="mt-1 text-[18px] font-bold">{b.t()}</h3>
        <p className="mt-1 text-[14px] leading-relaxed text-muted-foreground">{b.d()}</p>
        <div className="mt-3 flex items-center justify-between">
          <span className="flex gap-1.5" aria-hidden>
            {total > 1 && Array.from({ length: total }, (_, k) => <i key={k} className={k === i - 1 ? "h-1.5 w-4 rounded-full bg-plate" : "size-1.5 rounded-full bg-muted-foreground/30"} />)}
          </span>
          <span className="flex items-center gap-1">
            <button onClick={onPasser} className="px-3 py-2 text-[13.5px] font-semibold text-muted-foreground">{passer ?? tr("Passer")}</button>
            <Button variant="plate" size="sm" className="h-9 rounded-full px-4" onClick={onSuivant}>{bouton ?? tr("Suivant")}</Button>
          </span>
        </div>
      </div>
    </div>
  );
}
