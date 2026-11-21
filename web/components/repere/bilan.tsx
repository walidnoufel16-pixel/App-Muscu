"use client";

import { noter } from "@/lib/mesure";
import { parOnglet } from "@/lib/nav";
import { loc, pluriel, tr } from "@/lib/i18n";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { Route } from "next";
import { BellRingingIcon, CaretRightIcon, FlameIcon, ForkKnifeIcon, ShareFatIcon, TrophyIcon } from "@phosphor-icons/react";
import { imageSeance, partagerImage } from "@/lib/carte-seance";
import { sb } from "@/lib/supabase";
import { activerRappels, dejaPropose, etatRappels, noterPropose } from "@/lib/rappels";
import { ajouterAuSuivi } from "@/lib/suivi";
import { tactile } from "@/lib/repos";
import { useRepere } from "@/lib/store";
import { jourDe } from "@/lib/logic/historique";
import { objectifHebdo, serie } from "@/lib/logic/motivation";
import { avecSorties } from "@/lib/logic/course";
import { besoins, macros, nomRecette, NOM_CRENEAU, portion, prefsDe, repasRecuperation, suggestions } from "@/lib/logic/repas";
import { Button } from "@/components/ui/button";
import { Drawer, DrawerContent, DrawerDescription, DrawerTitle } from "@/components/ui/drawer";
import { mouvementReduit, useCelebrer } from "@/lib/celebrer";
import { cn } from "@/lib/utils";

/* Chiffre qui monte de 0 à sa valeur, sans re-rendu React (on écrit directement dans le nœud). */
function Compteur({ valeur, delai = 0 }: { valeur: number; delai?: number }) {
  const fmt = (v: number) => Math.round(v).toLocaleString(loc());
  const monter = useCallback((el: HTMLSpanElement | null) => {
    if (!el) return;
    if (mouvementReduit() || valeur === 0) { el.textContent = fmt(valeur); return; }
    const duree = 900, t0 = performance.now() + delai;
    const pas = (t: number) => {
      const e = Math.min(1, Math.max(0, (t - t0) / duree));
      el.textContent = fmt(valeur * (1 - Math.pow(1 - e, 3)));
      if (e < 1) requestAnimationFrame(pas);
    };
    requestAnimationFrame(pas);
  }, [valeur, delai]);
  return <span ref={monter}>0</span>;
}

/* Fin de séance : un bilan qui se compte sous tes yeux, la semaine, une seule proposition en plus
   (rappels, sinon avis), « Terminer », et le partage en action secondaire.
   Séance libre : fermer le bilan la range dans Progrès et la remet à zéro pour la prochaine fois. */
export function Bilan() {
  const bilan = useCelebrer((s) => s.bilan);
  const fermerBilan = useCelebrer((s) => s.fermerBilan);
  const libre = bilan?.s?.startsWith("L|") ? +bilan.s.slice(2) : null;
  /* séance du programme (ou autre) terminée : comptée ici ; la séance libre l'est en entrant dans le suivi */
  const sBilan = bilan?.s;
  useEffect(() => { if (sBilan && !sBilan.startsWith("L|")) noter("seance_terminee", { r: /^\d/.test(sBilan) ? "plan" : "autre" }); }, [sBilan]);
  const router = useRouter();
  /* séance libre : rangée dans Progrès (elle repart vierge), et on y va pour la voir */
  const fermer = (vers?: string) => { fermerBilan(); if (libre != null) ajouterAuSuivi(libre); if (vers ?? libre != null) { parOnglet(); router.replace((vers ?? "/progres") as Route); } };
  const stats = !bilan ? [] : bilan.cases ? bilan.cases : [
        { n: tr("exercices"), v: bilan.exercices },
        { n: tr("séries validées"), v: bilan.series },
        ...(bilan.minutes != null ? [{ n: tr("minutes"), v: bilan.minutes }] : []),
        /* aucun record (la toute première séance, rien à battre encore) : pas de tuile « 0 record battu » */
        ...(bilan.records > 0 ? [{ n: tr(pluriel(bilan.records) ? "records battus" : "record battu"), v: bilan.records, accent: true }] : []),
      ];
  return (
    <Drawer open={!!bilan} onOpenChange={(o) => !o && fermer()}>
      <DrawerContent>
        {bilan && (
          <div className="min-h-0 overflow-y-auto overscroll-contain px-5 pt-3 pb-[max(env(safe-area-inset-bottom),20px)] text-center">
            <div className="mx-auto grid size-20 animate-[medaille_.8s_cubic-bezier(.3,1.5,.5,1)_both] place-items-center rounded-full bg-plate text-plate-foreground shadow-[0_12px_40px_-10px_var(--plate)]">
              <TrophyIcon className="size-10" weight="fill" />
            </div>
            <div className="eyebrow mt-5 animate-[monter_.5s_.15s_ease-out_both]">{tr("Séance terminée")}</div>
            <DrawerTitle className="mt-1 animate-[monter_.5s_.22s_ease-out_both] text-[26px] leading-tight font-bold tracking-[-0.02em]">{bilan.titre}</DrawerTitle>
            <DrawerDescription className="sr-only">{tr("Bilan de la séance")}</DrawerDescription>
            <div className="mt-6 grid grid-cols-2 gap-2">
              {stats.map((s, i) => (
                <div
                  key={s.n}
                  className={cn("animate-[monter_.5s_ease-out_both] rounded-2xl border p-3.5 text-left", s.accent ? "border-plate bg-plate-soft" : "bg-card", stats.length % 2 === 1 && i === stats.length - 1 && "col-span-2")}
                  style={{ animationDelay: 300 + i * 80 + "ms" }}
                >
                  <div className="num text-[34px] leading-none font-bold"><Compteur valeur={s.v} delai={350 + i * 80} /></div>
                  <div className="mt-1 text-[12.5px] font-medium text-muted-foreground">{s.n}</div>
                </div>
              ))}
            </div>
            <Suite />
            <PourRecuperer ouvrir={(id) => fermer(`/repas?r=${id}`)} />
            <UnePropositionDePlus />
            <Button variant="plate" size="xl" className="mt-6 w-full" onClick={() => { tactile(12); fermer(); }}>{tr("Terminer")}</Button>
            {libre != null && <p className="mt-2 text-[12.5px] text-muted-foreground">{tr("Elle s'enregistre dans Progrès et repart à zéro pour la prochaine fois.")}</p>}
            <PartagerSeance titre={bilan.titre} cases={stats} />
          </div>
        )}
      </DrawerContent>
    </Drawer>
  );
}

/* Pour récupérer : un repas riche en protéines dans les 2 h ; le repas prévu dans Repas si les
   préférences sont faites (déjeuner si la séance finit avant 11 h, sinon dîner). */
function PourRecuperer({ ouvrir }: { ouvrir: (id: string) => void }) {
  const etat = useRepere((x) => x.etat);
  const [auj] = useState(() => jourDe(Date.now()));
  const p = prefsDe(etat.A);
  const c = repasRecuperation(new Date().getHours());
  const r = p.fait ? suggestions(p, auj, true)[c] : undefined;
  const prot = r ? Math.round(macros(r, portion(r, besoins(etat, true), c)).p) : 0;
  return (
    <div className="mt-1.5 animate-[monter_.5s_.8s_ease-out_both] rounded-2xl border bg-card p-3.5 text-left">
      <div className="flex items-start gap-2.5">
        <ForkKnifeIcon className="mt-0.5 size-4 shrink-0 text-primary" weight="fill" />
        <div className="min-w-0 flex-1">
          <div className="text-[14px] font-semibold">{tr("Pour récupérer")}</div>
          <p className="mt-0.5 text-[12.5px] leading-snug text-muted-foreground">
            {tr("Un repas riche en protéines dans les 2 h.")}{!r && " " + tr("Poulet, poisson, œufs, skyr ou tofu, peu importe.")}
          </p>
        </div>
      </div>
      {r && (
        <button onClick={() => { tactile(6); ouvrir(r.id); }} className="mt-2.5 flex w-full items-center gap-2 rounded-xl bg-muted/60 px-3 py-2.5 text-left active:scale-[.99]">
          <span className="min-w-0 flex-1">
            <span className="block text-[11.5px] text-muted-foreground">{tr("Ton {c} prévu", { c: NOM_CRENEAU[c].toLowerCase() })}</span>
            <span className="block truncate text-[14px] font-semibold">{nomRecette(r)}</span>
            <span className="block text-[12px] text-muted-foreground">≈ <b className="num text-foreground">{prot}</b> {tr("g de protéines")}</span>
          </span>
          <CaretRightIcon className="size-4 shrink-0 text-muted-foreground" weight="bold" />
        </button>
      )}
    </div>
  );
}

/* Sous le bilan : la semaine en cours. */
function Suite() {
  const etat = useRepere((x) => x.etat);
  const [auj] = useState(() => jourDe(Date.now()));
  const H = etat.HIST || [];
  const S = serie(H, avecSorties(etat.CARDIO, etat.SORTIES), objectifHebdo(etat.A), auj);
  return (
    <div className="mt-3 flex flex-col gap-1.5 text-left">
      <div className="flex animate-[monter_.5s_.78s_ease-out_both] items-center gap-2.5 rounded-2xl bg-muted/60 px-3.5 py-2.5 text-[13.5px]">
        <FlameIcon className="size-4 shrink-0 text-[#ff7a1a]" weight="fill" />
        <span>{S.cetteSemaine >= S.objectif
          ? <><b>{tr("Objectif de la semaine atteint")}</b>{S.semaines > 1 ? tr(" · {semaines} semaines d'affilée", { semaines: S.semaines }) : ""}</>
          : <><b>{tr("{cetteSemaine} séance{a} sur {objectif}", { cetteSemaine: S.cetteSemaine, a: pluriel(S.cetteSemaine) ? "s" : "", objectif: S.objectif })}</b>{" "}{tr("cette semaine")}</>}</span>
      </div>
    </div>
  );
}

/* Une seule proposition en plus par bilan : les rappels tant qu'ils n'ont pas été proposés,
   sinon (à partir de la 5e séance, une fois) la demande d'avis. */
function UnePropositionDePlus() {
  const [rappels, setRappels] = useState<boolean | null>(() => (dejaPropose() ? false : null));
  useEffect(() => { if (!dejaPropose()) etatRappels().then((e) => setRappels(e === "inactif")).catch(() => setRappels(false)); }, []);
  if (rappels === null) return null;
  return rappels ? <ProposerRappels /> : <DemanderAvis />;
}

/* Une seule fois, à la fin d'une séance : proposer les rappels après quelques jours sans séance. */
function ProposerRappels() {
  const [voir, setVoir] = useState(true);
  const [msg, setMsg] = useState<string | null>(null);
  if (!voir) return null;
  const oui = async () => {
    tactile(10);
    const e = await activerRappels().catch(() => "inactif");
    if (e === "actif") setVoir(false);
    else setMsg(e === "refuse" ? tr("Notifications refusées : tu peux les autoriser dans les réglages du téléphone.") : tr("Activation impossible pour l'instant. Réessaie depuis Profil."));
  };
  const non = () => { noterPropose(); setVoir(false); };
  return (
    <div className="mt-1.5 animate-[monter_.5s_.9s_ease-out_both] rounded-2xl border bg-card p-3.5 text-left">
      <div className="flex items-start gap-2.5">
        <BellRingingIcon className="mt-0.5 size-4 shrink-0 text-primary" weight="fill" />
        <div className="min-w-0 flex-1">
          <div className="text-[14px] font-semibold">{tr("Un petit mot si tu décroches ?")}</div>
          <p className="mt-0.5 text-[12.5px] leading-snug text-muted-foreground">{tr("Une notification après quelques jours sans séance, trois au plus, jamais avant 18 h.")}</p>
          {msg && <p className="mt-1.5 text-[12.5px] text-destructive">{msg}</p>}
          <div className="mt-2.5 flex gap-2">
            <Button size="sm" className="rounded-xl" onClick={oui}>{tr("Activer")}</Button>
            <Button size="sm" variant="ghost" className="rounded-xl text-muted-foreground" onClick={non}>{tr("Non merci")}</Button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* La carte « Séance terminée » à partager en story : préparée dès l'ouverture du bilan, pour que
   le partage parte directement du geste (Safari l'exige). */
function PartagerSeance({ titre, cases }: { titre: string; cases: { n: string; v: number }[] }) {
  const etat = useRepere((x) => x.etat);
  const [img, setImg] = useState<Blob | null>(null);
  /* les cases arrivent recréées à chaque rendu : on suit leur contenu, pas leur identité */
  const cle = JSON.stringify(cases);
  useEffect(() => {
    let vivant = true;
    const H = etat.HIST || [], auj = jourDe(Date.now());
    const S = serie(H, avecSorties(etat.CARDIO, etat.SORTIES), objectifHebdo(etat.A), auj);
    const jour = new Date().toLocaleDateString(loc(), { weekday: "long" });
    imageSeance({
      titre, jour, cases: JSON.parse(cle),
      semaine: S.cetteSemaine >= S.objectif ? tr("Objectif de la semaine atteint")
        : tr("{cetteSemaine} séance{a} sur {objectif} cette semaine", { cetteSemaine: S.cetteSemaine, a: pluriel(S.cetteSemaine) ? "s" : "", objectif: S.objectif }),
      serie: S.semaines > 1 ? tr("{semaines} semaines d'affilée", { semaines: S.semaines }) : undefined,
    }).then((b) => { if (vivant) setImg(b); });
    return () => { vivant = false; };
  }, [titre, cle, etat]);
  return (
    <button disabled={!img} onClick={() => { tactile(10); if (img) partagerImage(img, "oxa-seance.png", tr("Ma séance Oxa")); }}
      className="mt-1 flex w-full items-center justify-center gap-2 py-2.5 text-[14.5px] font-semibold text-plate-ink disabled:opacity-50">
      <ShareFatIcon className="size-4.5" weight="fill" />{tr("Partager ma séance")}
    </button>
  );
}

/* Une seule fois, à partir de la 5e séance : ce qui manque à Repère (table avis, lue dans Admin). */
const AVIS = "repere.avis";
function DemanderAvis() {
  const n = useRepere((x) => (x.etat.HIST || []).length);
  const [ferme, setFerme] = useState(() => { try { return !!localStorage.getItem(AVIS); } catch { return true; } });
  const [texte, setTexte] = useState("");
  const [etat, setEtat] = useState<"" | "envoi" | "merci" | "erreur">("");
  if (n < 5 || (ferme && etat !== "merci")) return null;
  const noter = () => { try { localStorage.setItem(AVIS, String(Date.now())); } catch {} };
  const envoyer = async () => {
    const t = texte.trim().slice(0, 1000);
    if (!t) return;
    setEtat("envoi");
    const c = await sb(), { error } = (await c?.from("avis").insert({ texte: t, seances: n })) ?? { error: true };
    if (error) { setEtat("erreur"); return; }
    noter(); setEtat("merci"); setFerme(true);
  };
  if (etat === "merci")
    return <p className="mt-1.5 rounded-2xl bg-plate-soft p-3.5 text-left text-[14px] font-medium">{tr("Merci ! Ton avis est bien arrivé, il compte vraiment pour la suite.")}</p>;
  return (
    <div className="mt-1.5 animate-[monter_.5s_.95s_ease-out_both] rounded-2xl border bg-card p-3.5 text-left">
      <div className="text-[14px] font-semibold">{tr("Qu'est-ce qui manque à Oxa ?")}</div>
      <p className="mt-0.5 text-[12.5px] leading-snug text-muted-foreground">{tr("{n} séances déjà : ton avis aide à décider la suite. Une phrase suffit.", { n })}</p>
      <textarea value={texte} onChange={(e) => setTexte(e.target.value)} maxLength={1000} rows={3}
        placeholder={tr("Une fonction, un exercice, un souci…")} className="mt-2.5 w-full resize-none rounded-xl border bg-background p-2.5 text-[16px] outline-none focus:border-foreground" />
      {etat === "erreur" && <p className="mt-1 text-[12.5px] text-destructive">{tr("Envoi impossible pour l'instant, réessaie plus tard.")}</p>}
      <div className="mt-2 flex gap-2">
        <Button size="sm" className="rounded-xl" disabled={!texte.trim() || etat === "envoi"} onClick={envoyer}>{etat === "envoi" ? tr("Envoi…") : tr("Envoyer")}</Button>
        <Button size="sm" variant="ghost" className="rounded-xl text-muted-foreground" onClick={() => { noter(); setFerme(true); }}>{tr("Non merci")}</Button>
      </div>
    </div>
  );
}
