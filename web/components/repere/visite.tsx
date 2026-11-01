"use client";

/* Visite guidée du premier lancement : une feuille de bienvenue (les 4 grands axes), puis une bulle
   posée sur chaque repère de la vraie interface (onglets Entraînement, Repas, Progrès, menu ☰ ; repérés
   par data-visite), puis « Ta première séance ? ». Une seule fois (repere.visite), pour un compte qui
   n'a encore rien fait ; jamais pendant une séance ni sur l'ancienne adresse. Revoir : menu ☰ › Aide. */
import { tr } from "@/lib/i18n";
import { useEffect, useLayoutEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { create } from "zustand";
import { BarbellIcon, ChartLineUpIcon, FireIcon, ForkKnifeIcon, ListIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Drawer, DrawerContent, DrawerDescription, DrawerTitle } from "@/components/ui/drawer";
import { useRepere } from "@/lib/store";
import { useCelebrer } from "@/lib/celebrer";
import { AVANT } from "@/lib/nav";
import { tactile } from "@/lib/repos";
import { lienRubrique } from "./rubriques";

const CLE = "repere.visite";
/** Étape en cours : null = fermée ; 0 bienvenue ; 1 à 4 bulles ; 5 première séance. */
export const useVisite = create<{ etape: number | null }>(() => ({ etape: null }));
export const revoirVisite = () => useVisite.setState({ etape: 0 });

const BULLES = [
  { cible: "entrainement", k: () => tr("Entraînement"), t: () => tr("Tes séances"), d: () => tr("Choisis une rubrique (Mes séances, Oxa Street, Oxa Run…) ou touche un muscle : Oxa compose ta séance avec ton matériel.") },
  { cible: "repas", k: () => "Oxa Meal", t: () => tr("Tes repas"), d: () => tr("Tes besoins du jour, ta semaine de repas et ta liste de courses, avec ton budget.") },
  { cible: "progres", k: () => tr("Progrès"), t: () => tr("Tes progrès"), d: () => tr("Ta série de semaines, tes records et tes charges qui montent, séance après séance.") },
  { cible: "menu", k: () => tr("Menu"), t: () => tr("Ton compte et tes réglages"), d: () => tr("Ton compte, ton matériel, tes rappels… et « Inviter un ami » pour t'entraîner à plusieurs.") },
];

export function Visite() {
  const router = useRouter(), chemin = usePathname();
  const etape = useVisite((s) => s.etape);
  const pseudo = useRepere((s) => s.pseudo);
  const pret = useRepere((s) => s.pret);
  const neuf = useRepere((s) => !(s.etat.HIST || []).length && !s.etat.SEANCES.length);
  const bilan = useCelebrer((s) => !!s.bilan);

  /* première ouverture d'un compte qui n'a encore rien fait : la visite démarre d'elle-même */
  useEffect(() => {
    if (!pret || !pseudo || !neuf || bilan || etape !== null) return;
    if (!/^\/(entrainement|repas|progres)\/?$/.test(chemin)) return;
    if (location.hostname.endsWith(".onrender.com") && process.env.NEXT_PUBLIC_NOUVELLE_ADRESSE) return;
    let vue = true;
    try { vue = !!localStorage.getItem(CLE); } catch {}
    if (vue) return;
    const t = setTimeout(() => useVisite.setState({ etape: 0 }), 700);
    return () => clearTimeout(t);
  }, [pret, pseudo, neuf, bilan, etape, chemin]);

  const finir = () => { try { localStorage.setItem(CLE, String(Date.now())); } catch {} useVisite.setState({ etape: null }); };
  const suivant = () => { tactile(5); useVisite.setState({ etape: (etape ?? 0) + 1 }); };
  const premiere = () => { tactile(10); finir(); router.push(lienRubrique("libre"), AVANT); };

  const AXES = [
    { I: BarbellIcon, t: tr("T'entraîner"), d: tr("Touche un muscle : ta séance est prête") },
    { I: ForkKnifeIcon, t: tr("Bien manger"), d: tr("Tes repas de la semaine et ta liste de courses") },
    { I: ChartLineUpIcon, t: tr("Progresser"), d: tr("Ta série, tes records, tes charges qui montent") },
    { I: ListIcon, t: tr("Ton compte"), d: tr("Matériel, rappels, inviter un ami") },
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

      {etape !== null && etape >= 1 && etape <= 4 && <Bulle n={etape} onSuivant={suivant} onPasser={finir} />}

      <Drawer open={etape === 5} onOpenChange={(o) => !o && etape === 5 && finir()}>
        <DrawerContent>
          <div className="px-5 pt-3 pb-[max(env(safe-area-inset-bottom),20px)] text-center">
            <FireIcon className="mx-auto size-12 animate-[medaille_.8s_cubic-bezier(.3,1.5,.5,1)_both] text-plate" weight="fill" />
            <DrawerTitle className="mt-3 text-[25px] font-black tracking-[-0.02em]">{tr("Ta première séance ?")}</DrawerTitle>
            <DrawerDescription className="mx-auto mt-1.5 max-w-[34ch] text-[14.5px] leading-relaxed text-muted-foreground">
              {tr("Touche les muscles que tu veux travailler, ou choisis une rubrique : ta séance est prête en un geste.")}
            </DrawerDescription>
            <Button variant="plate" size="xl" className="mt-5 w-full" onClick={premiere}>{tr("Créer ma première séance")}</Button>
            <button onClick={finir} className="mt-1 w-full py-2.5 text-[14px] font-medium text-muted-foreground">{tr("Plus tard")}</button>
          </div>
        </DrawerContent>
      </Drawer>
    </>
  );
}

/* Une bulle sur un repère de l'interface : le repère est éclairé, le reste assombri. */
function Bulle({ n, onSuivant, onPasser }: { n: number; onSuivant: () => void; onPasser: () => void }) {
  const b = BULLES[n - 1];
  const [r, setR] = useState<DOMRect | null>(null);
  useLayoutEffect(() => {
    const mesurer = () => setR(document.querySelector(`[data-visite="${b.cible}"]`)?.getBoundingClientRect() ?? null);
    mesurer();
    const t = setTimeout(mesurer, 120);
    addEventListener("resize", mesurer);
    return () => { clearTimeout(t); removeEventListener("resize", mesurer); };
  }, [b.cible]);
  if (!r) return null;
  const pad = 6, rond = b.cible === "menu" ? 999 : 18;
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
        <div className="eyebrow text-plate-ink">{n} / 4 · {b.k()}</div>
        <h3 className="mt-1 text-[18px] font-bold">{b.t()}</h3>
        <p className="mt-1 text-[14px] leading-relaxed text-muted-foreground">{b.d()}</p>
        <div className="mt-3 flex items-center justify-between">
          <span className="flex gap-1.5" aria-hidden>
            {BULLES.map((_, i) => <i key={i} className={i === n - 1 ? "h-1.5 w-4 rounded-full bg-plate" : "size-1.5 rounded-full bg-muted-foreground/30"} />)}
          </span>
          <span className="flex items-center gap-1">
            <button onClick={onPasser} className="px-3 py-2 text-[13.5px] font-semibold text-muted-foreground">{tr("Passer")}</button>
            <Button variant="plate" size="sm" className="h-9 rounded-full px-4" onClick={onSuivant}>{tr("Suivant")}</Button>
          </span>
        </div>
      </div>
    </div>
  );
}
