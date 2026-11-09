"use client";

/* « Mon agenda » : les feuilles pour programmer, déplacer, modifier ou retirer une séance (avec un
   rappel la veille ou le jour même à l'heure choisie), la feuille « Nouvelle séance » du bouton +,
   et les cases de la grille. Servent à l'accueil d'Entraînement et à l'écran Agenda.
   Logique : lib/logic/agenda.ts. */
import { loc, tp, tr } from "@/lib/i18n";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { Route } from "next";
import { toast } from "sonner";
import { confirmer } from "./confirmer";
import { retirerDeHistorique } from "@/lib/logic/actions";
import { BellIcon, CaretDownIcon, CaretRightIcon, CheckIcon, DownloadSimpleIcon, HeartbeatIcon, PersonSimpleIcon, PersonSimpleRunIcon, PlusIcon, SparkleIcon, BarbellIcon } from "@phosphor-icons/react";
import { MiniCorps } from "./corps-muscles";
import { Drawer, DrawerContent, DrawerDescription, DrawerTitle } from "@/components/ui/drawer";
import { Segmente } from "./segmente";
import {
  deplacer, HEURES_JOUR, HEURES_VEILLE, joursAgenda, nomCourt, prochainsJours, programmer, retirer,
  type JourAgenda, type Prevu, type QuoiPrevu, type Rappel,
} from "@/lib/logic/agenda";
import { decaler, jourDe } from "@/lib/logic/historique";
import { dureeTotale } from "@/lib/logic/combinee";
import { musclesDe } from "@/lib/logic/core";
import { genererPlan, semaineDe, vdotActuel } from "@/lib/logic/course";
import { musclesRecommandes, effortsEndurance, nomGroupe, recoDuJour, type Groupe } from "@/lib/logic/recommandation";
import { activerRappels, etatRappels } from "@/lib/rappels";
import { useRepere } from "@/lib/store";
import { useBrouillon } from "@/lib/brouillon";
import { AVANT, useMenu } from "@/lib/nav";
import { tactile } from "@/lib/repos";
import { cn } from "@/lib/utils";
import type { Etat } from "@/lib/logic/types";
import { EX } from "@/lib/data/exercices";

export const jourLong = (d: string) => new Date(d + "T12:00").toLocaleDateString(loc(), { weekday: "long", day: "numeric", month: "long" });
export const jourCourt = (d: string) => new Date(d + "T12:00").toLocaleDateString(loc(), { weekday: "short", day: "numeric" }).replace(".", "");
const nomJourSemaine = (d: string) => new Date(d + "T12:00").toLocaleDateString(loc(), { weekday: "long" });
export const initiales = () => Array.from({ length: 7 }, (_, i) => new Date(2024, 0, 1 + i).toLocaleDateString(loc(), { weekday: "narrow" }));
export const maj = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/* la séance libre visée : par son index, ou par son nom si les séances ont bougé */
const indexLibre = (E: Etat, i: number, nom: string) => (E.SEANCES[i]?.nom === nom ? i : E.SEANCES.findIndex((s) => s.nom === nom));
const indexCardio = (E: Etat, i: number, nom: string) => (E.SEANCES_CARDIO?.[i]?.nom === nom ? i : (E.SEANCES_CARDIO || []).findIndex((s) => s.nom === nom));

function texteRappel(r?: Rappel | null) {
  if (!r) return tr("sans rappel");
  return r.veille ? tr("rappel la veille à {h} h", { h: r.h }) : tr("rappel le jour même à {h} h", { h: r.h });
}

/** Lancer une séance prévue. */
export function useLancer() {
  const router = useRouter();
  const muter = useRepere((s) => s.muter);
  return (E: Etat, p: Prevu) => {
    const q = p.quoi;
    if (q.t === "libre") { const i = indexLibre(E, q.i, p.nom); if (i >= 0) router.push(`/entrainement/seance?l=${i}` as Route, AVANT); return; }
    if (q.t === "cardio") { const i = indexCardio(E, q.i, p.nom); if (i >= 0) router.push(`/entrainement/cardio?s=${i}` as Route, AVANT); return; }
    if (q.t === "course") { router.push(`/entrainement/course?s=${q.cle}` as Route, AVANT); return; }
    if (q.t === "plan") { muter((x) => { x.day = q.day; }); router.push("/entrainement/seance", AVANT); return; }
    /* proposition d'Oxa : l'assistant s'ouvre avec ses muscles ; sans muscles, ceux conseillés ce jour-là */
    const m = q.t === "reco" && q.m?.length ? q.m : musclesRecommandes(recoDuJour(E.HIST || [], jourDe(Date.now()), E.A.recoSans || [], E.A.regularite, effortsEndurance(E.SORTIES, E.CARDIO)));
    router.push((m ? `/entrainement/assistant?m=${m.join(",")}` : "/entrainement/assistant?type=cardio") as Route, AVANT);
  };
}

export type Feuille =
  | { m: "jour"; d: string }
  | { m: "programmer"; d: string; quoi?: QuoiPrevu; nom?: string; modifier?: boolean }
  | { m: "deplacer"; id: string; de: string }
  | { m: "nouvelle"; d: string };

/** Les feuilles de l'agenda (un jour, programmer, déplacer, nouvelle séance), dans un seul tiroir. */
export function FeuillesAgenda({ f, setF, auj }: { f: Feuille | null; setF: (f: Feuille | null) => void; auj: string }) {
  const etat = useRepere((s) => s.etat);
  return (
    <Drawer open={!!f} onOpenChange={(o) => !o && setF(null)} repositionInputs={false}>
      <DrawerContent className="max-h-[92dvh]">
        <div className="overflow-y-auto overscroll-contain px-4 pb-[max(env(safe-area-inset-bottom),20px)]">
          {f?.m === "jour" && <FeuilleJour d={f.d} auj={auj} j={joursAgenda(etat, f.d, auj, 1)[0]} setF={setF} />}
          {f?.m === "programmer" && <FeuilleProgrammer key={f.d + (f.nom ?? "")} init={f} auj={auj} fermer={() => setF(null)} />}
          {f?.m === "deplacer" && <FeuilleDeplacer id={f.id} de={f.de} auj={auj} fermer={() => setF(null)} />}
          {f?.m === "nouvelle" && <FeuilleNouvelle key={f.d} d={f.d} auj={auj} setF={setF} />}
        </div>
      </DrawerContent>
    </Drawer>
  );
}

/** Toucher un jour : vide et à venir (ou aujourd'hui), le menu du jour ; vide et passé, rien ; sinon sa feuille. */
export const feuilleDuJour = (j: JourAgenda, auj: string): Feuille | null =>
  !j.fait.length && !j.prevus.length && !j.manques.length ? (j.d >= auj ? { m: "nouvelle", d: j.d } : null) : { m: "jour", d: j.d };

/* ---------------- la feuille « Programmer une séance » (un jour, le bouton +, « Programmer une séance ») ----------------
   En haut, créer : je choisis les muscles (assistant), exercice par exercice (composeur), importer.
   Puis « Oxa choisit pour toi » : les propositions d'Oxa d'après les muscles prêts ce jour-là (et,
   pour un jour à venir, « Oxa décidera le jour J »). Enfin les séances déjà créées, en
   groupes repliés. Toucher une séance ou une proposition : « Ajouter ce jour » la programme ce
   jour-là, « Programmer un autre jour » ouvre la feuille Programmer. Une séance créée pour un jour à
   venir y est programmée (?jour=, Brouillon.pour). */
function FeuilleNouvelle({ d, auj, setF }: { d: string; auj: string; setF: (f: Feuille | null) => void }) {
  const etat = useRepere((s) => s.etat);
  const muter = useRepere((s) => s.muter);
  const router = useRouter();
  const setLibre = useBrouillon((s) => s.setLibre);
  const [ouvert, setOuvert] = useState<string | null>(null);
  const [deplies, setDeplies] = useState<string[]>([]);
  const futur = d > auj, femme = etat.A.sexe === 1;
  const aller = (url: string) => { setF(null); router.push(url as Route, AVANT); };
  const creer: { icone: React.ReactNode; accent?: boolean; titre: string; sous: string; onClick: () => void }[] = [
    { icone: <PersonSimpleIcon className="size-[18px]" weight="bold" />, accent: true, titre: tr("Je choisis les muscles"), sous: tr("Oxa construit la séance"), onClick: () => aller("/entrainement/assistant" + (futur ? `?jour=${d}` : "")) },
    { icone: <PlusIcon className="size-[18px]" weight="bold" />, titre: tr("Exercice par exercice"), sous: tr("Tu choisis tout"), onClick: () => { setLibre({ nom: tr("Séance libre"), ex: [], idx: null, ...(futur ? { pour: d } : {}) }); aller("/entrainement/composer"); } },
    { icone: <DownloadSimpleIcon className="size-[18px]" weight="bold" />, titre: tr("Importer"), sous: tr("Avec un code"), onClick: () => { setF(null); setTimeout(() => useMenu.setState({ importer: true }), 350); } },
  ];
  /* les propositions d'Oxa pour ce jour-là */
  const reco = useMemo(() => recoDuJour(etat.HIST || [], d, etat.A.recoSans || [], etat.A.regularite, effortsEndurance(etat.SORTIES, etat.CARDIO)), [etat, d]);
  const propositions: Choix[] = reco.propositions.slice(0, 3).map((p) => ({ quoi: { t: "reco", m: p.muscles }, nom: p.nom, sous: p.raison, icone: <MiniCorps groupes={p.muscles} femme={femme} /> }));
  const groupes = useMemo(() => seancesDuJour(etat, d, auj), [etat, d, auj]);
  const ajouter = (c: Choix) => {
    tactile(12);
    /* le rappel habituel, pour un jour à venir seulement */
    const rappel = futur ? (etat.A.rappelAgenda === undefined ? { veille: true, h: 20 } : etat.A.rappelAgenda) : null;
    muter((E) => { E.AGENDA ??= []; programmer(E.AGENDA, { d, nom: c.nom, quoi: c.quoi, ...(rappel ? { rappel } : {}) }); });
    toast.success(futur ? tr("Programmée : {nom}", { nom: c.nom }) : tr("Ajoutée à aujourd'hui : {nom}", { nom: c.nom }), { description: maj(jourLong(d)) + (rappel ? " · " + texteRappel(rappel) : "") });
    setF(null);
  };
  /* une ligne (séance ou proposition) : la toucher montre « Ajouter ce jour » et « Programmer un autre jour » */
  const ligne = (c: Choix, conseillee = false, vignette = false) => {
    const cle = c.nom + JSON.stringify(c.quoi), sel = ouvert === cle;
    return (
      <div key={cle} className={cn("rounded-2xl", conseillee ? "bg-plate-soft ring-1 ring-plate/50" : "bg-muted/60", sel && "ring-1 ring-plate/50")}>
        <button onClick={() => { tactile(6); setOuvert(sel ? null : cle); }} aria-expanded={sel} className="flex w-full items-center gap-3 p-3 text-left">
          {vignette ? c.icone : <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-plate-soft text-plate-ink dark:text-plate">{c.icone}</span>}
          <span className="min-w-0 flex-1">
            {conseillee && <span className="mb-0.5 inline-block rounded-full bg-plate px-1.5 py-px text-[10.5px] font-bold text-plate-foreground">{tr("Conseillée")}</span>}
            <span className="block truncate text-[15px] font-semibold">{c.nom}</span>
            {(c.sous || c.deja) && <span className="line-clamp-2 block text-[12.5px] leading-snug text-muted-foreground">{[c.sous, c.deja ? tr("déjà dans l'agenda") : ""].filter(Boolean).join(" · ")}</span>}
          </span>
          <CaretRightIcon className={cn("size-4 shrink-0 text-muted-foreground transition-transform", sel && "rotate-90")} />
        </button>
        {sel && (
          <div className="grid grid-cols-[1fr_1.3fr] gap-2 px-3 pb-3">
            <button onClick={() => ajouter(c)} className="h-11 rounded-full bg-plate px-2 text-[13.5px] font-semibold whitespace-nowrap text-plate-foreground active:scale-[.98]">
              {d === auj ? tr("Ajouter aujourd'hui") : tr("Ajouter le {j}", { j: jourCourt(d) })}
            </button>
            <button onClick={() => { tactile(6); setF({ m: "programmer", d: futur ? d : decaler(auj, 1), quoi: c.quoi, nom: c.nom }); }} className="h-11 rounded-full border border-border bg-card px-2 text-[13.5px] font-semibold whitespace-nowrap active:scale-[.98]">
              {tr("Programmer un autre jour")}
            </button>
          </div>
        )}
      </div>
    );
  };
  return (
    <>
      <DrawerTitle className="mt-2 px-1 text-[22px] font-extrabold">{d === auj ? tr("Aujourd'hui") : tr("Programmer une séance")}</DrawerTitle>
      <DrawerDescription className="mt-0.5 px-1 text-[13.5px] text-muted-foreground">{maj(jourLong(d))}</DrawerDescription>

      <h3 className="eyebrow mt-4 mb-1.5 px-1">{tr("Créer une séance")}</h3>
      <div className="grid grid-cols-3 gap-1.5">
        {creer.map((x) => (
          <button key={x.titre} onClick={() => { tactile(6); x.onClick(); }} className="flex min-w-0 flex-col items-start gap-0.5 rounded-2xl bg-muted/60 p-2.5 text-left active:scale-[.98]">
            <span className={cn("mb-1 grid size-8 place-items-center rounded-[10px]", x.accent ? "bg-plate text-plate-foreground" : "bg-foreground/10")}>{x.icone}</span>
            <span className="text-[13px] leading-tight font-semibold">{x.titre}</span>
            <span className="text-[11px] leading-tight text-muted-foreground">{x.sous}</span>
          </button>
        ))}
      </div>

      <section className="mt-4">
        <h3 className="eyebrow mb-0.5 flex items-center gap-1.5 px-1"><SparkleIcon className="size-3.5 text-plate" weight="fill" />{tr("Oxa choisit pour toi")}</h3>
        <p className="mb-1.5 px-1 text-[12.5px] text-muted-foreground">
          {propositions.length
            ? d === auj ? tr("Les muscles prêts aujourd'hui, d'après ta récupération.") : tr("Les muscles prêts ce jour-là, d'après ta récupération.")
            : reco.type === "fait" ? tr("Tu t'es déjà entraîné ce jour-là : laisse récupérer.") : tr("Tes muscles récupèrent ce jour-là : repos ou cardio léger.")}
        </p>
        <div className="flex flex-col gap-1.5">
          {propositions.map((c, k) => ligne(c, k === 0, true))}
          {futur && (
            <button onClick={() => ajouter({ quoi: { t: "reco" }, nom: tr("Séance choisie par Oxa"), icone: null })}
              className="rounded-2xl border-[1.5px] border-dashed border-plate/50 px-3 py-2.5 text-center active:scale-[.99]">
              <span className="block text-[14px] font-semibold text-plate-ink dark:text-plate">{tr("Oxa décidera le jour J")}</span>
              <span className="block text-[12px] leading-snug text-muted-foreground">{tr("Le créneau est réservé ; les muscles seront choisis ce jour-là, d'après ta récupération.")}</span>
            </button>
          )}
        </div>
      </section>

      {groupes.map((g) => {
        const deplie = deplies.includes(g.titre);
        return (
          <section key={g.titre} className="mt-3">
            <button onClick={() => { tactile(5); setDeplies((l) => (deplie ? l.filter((x) => x !== g.titre) : [...l, g.titre])); }} aria-expanded={deplie}
              className="flex w-full items-center justify-between rounded-2xl bg-muted/60 px-3.5 py-3 text-left">
              <span className="text-[15px] font-semibold">{g.titre}<span className="ml-1.5 font-medium text-muted-foreground">{g.l.length}</span></span>
              <CaretDownIcon className={cn("size-4 text-muted-foreground transition-transform", deplie && "rotate-180")} />
            </button>
            {deplie && <div className="mt-1.5 flex flex-col gap-1.5">{g.l.map((c) => ligne(c))}</div>}
          </section>
        );
      })}
    </>
  );
}

/* ---------------- une case de la grille (écran Agenda, vue semaine) ---------------- */
export function Case({ j, auj, onClick }: { j: JourAgenda; auj: string; onClick: () => void }) {
  const jour = +j.d.slice(8), passe = j.d < auj, vide = !j.fait.length && !j.prevus.length && !j.manques.length;
  const f = j.fait[0], p = j.prevus[0], m = j.manques[0];
  const run = (f?.famille ?? p?.quoi.t) === "course";
  const style = f
    ? run ? "bg-[#9a4a1c] text-white" : "bg-plate text-plate-foreground"
    : p
      ? cn("border-2 border-dashed bg-card", run ? "border-[#9a4a1c] text-[#9a4a1c] dark:text-[#e0895a]" : "border-plate text-plate-ink dark:text-plate")
      : m ? "bg-foreground/[.06] text-muted-foreground line-through decoration-1" : passe ? "bg-foreground/[.03] text-muted-foreground/60" : "bg-foreground/[.07]";
  const nom = f ? (f.famille === "course" ? tr("Course") : nomCourt(f.nom)) : p ? nomCourt(p.nom) : m ? nomCourt(m.nom) : "";
  const plus = j.fait.length + j.prevus.length > 1;
  return (
    <button
      onClick={onClick} disabled={passe && vide}
      aria-label={`${jourLong(j.d)}${nom ? " · " + nom : ""}`}
      className={cn("relative flex h-[58px] min-w-0 flex-col items-center justify-center gap-0.5 rounded-[12px] px-0.5 active:scale-95 disabled:active:scale-100", style, j.d === auj && "ring-2 ring-foreground ring-offset-1 ring-offset-card")}
    >
      <span className="num text-[14px] leading-none font-bold">{jour}</span>
      {nom && <span className="w-full truncate text-center text-[9px] leading-tight font-semibold tracking-[-0.01em]">{nom}</span>}
      {plus && <span className="absolute top-1 right-1 size-1.5 rounded-full bg-current" />}
      {!!p?.rappel && !f && <BellIcon className="absolute top-1 left-1 size-2.5" weight="fill" />}
    </button>
  );
}

export function sousTitre(E: Etat, p: Prevu) {
  if (p.quoi.t === "libre") {
    const i = indexLibre(E, p.quoi.i, p.nom), s = E.SEANCES[i];
    if (s) return `${tp(s.ex.length, "{n} exercice", "{n} exercices")} · ${tr("environ {a} min", { a: dureeTotale(s) })}`;
  }
  if (p.quoi.t === "course") return "Oxa Run";
  if (p.quoi.t === "plan") return "Oxa Plan";
  if (p.quoi.t === "reco") return p.quoi.m?.length ? tr("Proposée par Oxa · {m}", { m: p.quoi.m.map((g) => nomGroupe(g as Groupe)).join(", ") }) : tr("Choisie le jour même par Oxa");
  return undefined;
}

/* ---------------- feuille d'un jour ---------------- */
function FeuilleJour({ d, auj, j, setF }: { d: string; auj: string; j: JourAgenda; setF: (f: Feuille | null) => void }) {
  const etat = useRepere((s) => s.etat);
  const muter = useRepere((s) => s.muter);
  const lancer = useLancer();
  const router = useRouter();
  const setLibre = useBrouillon((s) => s.setLibre);
  const lignes = (etat.HIST || []).filter((l) => l.d === d);
  const modifier = (p: Prevu) => {
    if (p.quoi.t !== "libre") return;
    const i = indexLibre(etat, p.quoi.i, p.nom), S = etat.SEANCES[i];
    if (!S) return;
    setF(null);
    setLibre({ ...structuredClone(S), ex: S.ex.map((e, o) => ({ ...e, o })), idx: i, agenda: { d, id: p.id } });
    router.push("/entrainement/composer", AVANT);
  };
  /* refaire une séance faite : la séance libre de cette ligne (par son numéro, sinon son nom) */
  const refaire = (s: string | undefined, nom: string, modif: boolean) => {
    const m = s ? /^L\|(\d+)$/.exec(s) : null, i = m ? indexLibre(etat, +m[1], nom) : etat.SEANCES.findIndex((x) => x.nom === nom);
    if (i < 0) return null;
    return () => setF({ m: "programmer", d: decaler(auj, 1) > d ? decaler(auj, 1) : decaler(d, 7), quoi: { t: "libre", i }, nom: etat.SEANCES[i].nom, modifier: modif });
  };
  return (
    <>
      <DrawerTitle className="mt-2 px-1 text-[21px] font-extrabold">{maj(jourLong(d))}</DrawerTitle>
      <DrawerDescription className="sr-only">{tr("Ce jour dans ton agenda")}</DrawerDescription>

      {j.fait.map((f, k) => {
        const l = f.famille === "muscu" ? lignes.find((x) => x.nom === f.nom && x.s === f.s) : undefined;
        const r = f.famille === "muscu" ? refaire(f.s, f.nom, false) : null, rm = f.famille === "muscu" ? refaire(f.s, f.nom, true) : null;
        return (
          <div key={"f" + k} className="mt-3">
            <div className="flex items-center gap-1.5 px-1 text-[11px] font-bold tracking-[0.12em] text-plate-ink uppercase dark:text-plate"><CheckIcon className="size-3.5" weight="bold" />{tr("Faite")}</div>
            <div className="mt-0.5 px-1 text-[18px] font-bold">{f.nom}</div>
            {l && <p className="px-1 text-[13px] text-muted-foreground">{[l.min ? tr("{n} min", { n: l.min }) : "", tp(l.ser, "{n} série", "{n} séries"), l.vol ? tr("{n} kg soulevés", { n: Math.round(l.vol).toLocaleString(loc()) }) : ""].filter(Boolean).join(" · ")}</p>}
            {l?.det?.length ? (
              <div className="mt-2 rounded-2xl bg-muted/60 px-3 py-2 text-[13.5px]">
                {l.det.map((x) => {
                  const best = x.s.reduce((a, b) => (b[0] > a[0] || (b[0] === a[0] && b[1] > a[1]) ? b : a), x.s[0]);
                  return (
                    <div key={x.id} className="flex justify-between gap-3 py-1">
                      <span className="truncate">{nomEx(x.id)}</span>
                      <span className="num shrink-0 text-muted-foreground">{x.s.length} × {best ? (best[1] ? `${best[1]} · ${best[0]} kg` : `${best[0]}`) : ""}</span>
                    </div>
                  );
                })}
              </div>
            ) : null}
            {r && (
              <div className="mt-3 flex flex-col gap-2">
                <button onClick={() => { tactile(8); r(); }} className="h-12 rounded-full bg-plate text-[15px] font-semibold text-plate-foreground active:scale-[.98]">{tr("Refaire un autre jour")}</button>
                <button onClick={() => { tactile(6); rm!(); }} className="h-12 rounded-full border border-border text-[15px] font-semibold active:scale-[.98]">{tr("Modifier puis programmer")}</button>
              </div>
            )}
            {l && (
              <button onClick={async () => {
                if (!(await confirmer({ titre: tr("Retirer « {nom} » de ton historique ?", { nom: l.nom }), texte: tr("Ses séries de ce jour-là disparaissent de Progrès, des records et des charges proposées. La séance reste dans Mes séances."), ok: tr("Retirer"), danger: true }))) return;
                muter((E) => retirerDeHistorique(E, l.d, l.s)); toast(tr("Séance retirée de ton historique")); setF(null);
              }} className="mt-3 px-1 text-[14px] font-semibold text-destructive">{tr("Retirer de mon historique")}</button>
            )}
          </div>
        );
      })}

      {[...j.prevus, ...j.manques].map((p) => {
        const manque = j.manques.includes(p);
        return (
          <div key={p.id} className="mt-4">
            <div className={cn("px-1 text-[11px] font-bold tracking-[0.12em] uppercase", manque ? "text-muted-foreground" : "text-plate-ink dark:text-plate")}>{manque ? tr("Prévue, pas faite") : tr("Prévue")}</div>
            <div className="mt-0.5 px-1 text-[18px] font-bold">{p.nom}</div>
            <p className="px-1 text-[13px] text-muted-foreground">{[sousTitre(etat, p), p.hebdo ? tr("chaque {j}", { j: nomJourSemaine(p.d) }) : "", texteRappel(p.rappel)].filter(Boolean).join(" · ")}</p>
            <div className="mt-3 grid grid-cols-2 gap-2">
              {d === auj && !manque && <button onClick={() => { tactile(8); setF(null); lancer(etat, p); }} className="col-span-2 h-12 rounded-full bg-plate text-[15px] font-semibold text-plate-foreground active:scale-[.98]">{tr("Commencer")}</button>}
              <button onClick={() => setF({ m: "deplacer", id: p.id, de: d })} className="h-11 rounded-full border border-border text-[14.5px] font-semibold active:scale-[.98]">{manque ? tr("Reprogrammer") : tr("Déplacer")}</button>
              {p.quoi.t === "libre" ? <button onClick={() => modifier(p)} className="h-11 rounded-full border border-border text-[14.5px] font-semibold active:scale-[.98]">{tr("Modifier")}</button> : <span />}
            </div>
            {!manque && <ChoixRappel valeur={p.rappel ?? null} jour={d} onChange={(r) => muter((E) => { const x = E.AGENDA?.find((y) => y.id === p.id); if (x) { if (r) x.rappel = r; else delete x.rappel; } E.A.rappelAgenda = r; })} />}
            <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 px-1">
              <button onClick={() => { muter((E) => retirer(E.AGENDA ?? [], p.id, d)); toast(tr("Retirée de l'agenda")); setF(null); }} className="text-[14px] font-semibold text-destructive">{p.hebdo ? tr("Retirer ce jour") : tr("Retirer de l'agenda")}</button>
              {p.hebdo && <button onClick={() => { muter((E) => retirer(E.AGENDA ?? [], p.id, "tout")); toast(tr("Retirée de l'agenda")); setF(null); }} className="text-[14px] font-semibold text-destructive">{tr("Retirer toutes les semaines")}</button>}
            </div>
          </div>
        );
      })}

      {d >= auj && (
        <button onClick={() => setF({ m: "nouvelle", d })} className="mt-5 flex w-full items-center justify-center gap-1.5 rounded-full border border-dashed border-plate/60 py-3 text-[14px] font-semibold text-plate-ink dark:text-plate">
          <PlusIcon className="size-4" weight="bold" />{j.fait.length || j.prevus.length ? tr("Ajouter une autre séance ce jour-là") : tr("Ajouter une séance")}
        </button>
      )}
    </>
  );
}

const nomEx = (id: string) => EX[id]?.n ?? id;

/* ---------------- choisir un jour (pastilles des 3 prochaines semaines) ---------------- */
function ChoixJour({ valeur, auj, onChange }: { valeur: string; auj: string; onChange: (d: string) => void }) {
  return (
    <div className="no-scrollbar -mx-4 flex gap-1.5 overflow-x-auto px-4 pb-1">
      {prochainsJours(auj).map((d) => (
        <button key={d} onClick={() => onChange(d)} aria-pressed={d === valeur}
          className={cn("flex h-14 w-12 shrink-0 flex-col items-center justify-center rounded-[14px] border text-[11px] font-semibold", d === valeur ? "border-foreground bg-foreground text-background" : "border-border bg-card text-muted-foreground")}>
          <span className="uppercase">{new Date(d + "T12:00").toLocaleDateString(loc(), { weekday: "short" }).replace(".", "")}</span>
          <span className="num text-[16px] font-bold">{+d.slice(8)}</span>
        </button>
      ))}
    </div>
  );
}

/* ---------------- choisir le rappel ---------------- */
function ChoixRappel({ valeur, jour, onChange }: { valeur: Rappel | null; jour: string; onChange: (r: Rappel | null) => void }) {
  const mode = !valeur ? "non" : valeur.veille ? "veille" : "jour";
  const heures = mode === "veille" ? HEURES_VEILLE : HEURES_JOUR;
  return (
    <div className="mt-3">
      <div className="mb-1.5 px-1 text-[12.5px] font-semibold text-muted-foreground">{tr("Rappel")}</div>
      <Segmente label={tr("Rappel")} valeur={mode} onChange={(m) => onChange(m === "non" ? null : { veille: m === "veille", h: m === "veille" ? (valeur?.veille ? valeur.h : 20) : (valeur && !valeur.veille ? valeur.h : 7) })}
        options={[{ v: "non", n: tr("Non") }, { v: "veille", n: tr("La veille") }, { v: "jour", n: tr("Le jour même") }]} />
      {valeur && (
        <>
          <div className="mt-2.5 mb-1.5 px-1 text-[12.5px] font-semibold text-muted-foreground">
            {valeur.veille ? tr("À quelle heure, {j} ?", { j: nomJourSemaine(decaler(jour, -1)) }) : tr("À quelle heure, le jour même ?")}
          </div>
          <div className="flex flex-wrap gap-1.5">
            {heures.map((h) => (
              <button key={h} onClick={() => onChange({ veille: valeur.veille, h })} aria-pressed={valeur.h === h}
                className={cn("h-9 rounded-full border px-3.5 text-[13.5px] font-semibold", valeur.h === h ? "border-foreground bg-foreground text-background" : "border-border")}>
                {tr("{h} h", { h })}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

/* ---------------- programmer ---------------- */
type Choix = { quoi: QuoiPrevu; nom: string; sous?: string; icone: React.ReactNode; deja?: boolean };

/** Les séances qu'on peut mettre un jour donné : mes séances, Oxa Run de la semaine, cardio. */
function seancesDuJour(etat: Etat, d: string, auj: string): { titre: string; l: Choix[] }[] {
  const o: { titre: string; l: Choix[] }[] = [];
  const libres = etat.SEANCES.map((s, i) => ({ s, i })).filter(({ s }) => s.ex.length);
  if (libres.length) o.push({ titre: tr("Mes séances"), l: libres.map(({ s, i }) => ({ quoi: { t: "libre", i }, nom: s.nom, sous: musclesDe(s.ex.map((e) => e.id)).slice(0, 3).join(", "), icone: <BarbellIcon className="size-5" /> })) });
  const c = etat.COURSE;
  if (c && d >= c.debut && d <= c.date) {
    const P = genererPlan(c, vdotActuel(c, etat.SORTIES, auj)), k = semaineDe(c, d, P.length), sem = P[k];
    const placees = new Set((etat.AGENDA || []).flatMap((p) => (p.quoi.t === "course" ? [p.quoi.cle] : [])));
    if (sem) o.push({ titre: tr("Oxa Run · semaine {a}", { a: k + 1 }), l: sem.seances.map((x, j) => ({ x, j })).filter(({ x }) => x.type !== "renfo").map(({ x, j }) => ({ quoi: { t: "course", cle: `${k}|${j}` }, nom: x.titre, sous: tr("{n} min", { n: x.min }), icone: <PersonSimpleRunIcon className="size-5" />, deja: placees.has(`${k}|${j}`) })) });
  }
  const cardio = etat.SEANCES_CARDIO || [];
  if (cardio.length) o.push({ titre: tr("Cardio"), l: cardio.map((s, i) => ({ quoi: { t: "cardio", i }, nom: s.nom, icone: <HeartbeatIcon className="size-5" /> })) });
  return o.filter((x) => x.l.length);
}

function FeuilleProgrammer({ init, auj, fermer }: { init: { d: string; quoi?: QuoiPrevu; nom?: string; modifier?: boolean }; auj: string; fermer: () => void }) {
  const etat = useRepere((s) => s.etat);
  const muter = useRepere((s) => s.muter);
  const router = useRouter();
  const setLibre = useBrouillon((s) => s.setLibre);
  const [d, setD] = useState(init.d < auj ? auj : init.d);
  const [choix, setChoix] = useState<{ quoi: QuoiPrevu; nom: string } | null>(init.quoi && init.nom ? { quoi: init.quoi, nom: init.nom } : null);
  const [hebdo, setHebdo] = useState(false);
  const [rappel, setRappel] = useState<Rappel | null>(etat.A.rappelAgenda === undefined ? { veille: true, h: 20 } : etat.A.rappelAgenda);

  /* ce qu'on peut programmer ce jour-là */
  const options = useMemo(() => seancesDuJour(etat, d, auj), [etat, d, auj]);

  const valider = async () => {
    if (!choix) return;
    tactile(12);
    let cree = "";
    muter((E) => {
      E.AGENDA ??= [];
      cree = programmer(E.AGENDA, { d, nom: choix.nom, quoi: choix.quoi, ...(hebdo ? { hebdo: true } : {}), ...(rappel ? { rappel } : {}) }).id;
      E.A.rappelAgenda = rappel;
    });
    toast.success(tr("Programmée : {nom}", { nom: choix.nom }), { description: maj(jourLong(d)) + (rappel ? " · " + texteRappel(rappel) : "") });
    fermer();
    /* « Modifier puis programmer » : le composeur s'ouvre, la séance programmée suivra */
    if (init.modifier && choix.quoi.t === "libre") {
      const S = etat.SEANCES[choix.quoi.i];
      if (S) { setLibre({ ...structuredClone(S), ex: S.ex.map((e, o) => ({ ...e, o })), idx: choix.quoi.i, agenda: { d, id: cree } }); router.push("/entrainement/composer", AVANT); }
    }
    /* un rappel demandé : les notifications doivent être actives sur cet appareil */
    if (rappel && (await etatRappels()) !== "actif") {
      try {
        const e = await activerRappels();
        if (e !== "actif") toast(tr("Rappel enregistré"), { description: tr("Active les notifications (Profil › Rappels) pour le recevoir sur ce téléphone."), duration: 7000 });
      } catch {
        toast(tr("Rappel enregistré"), { description: tr("Connecte-toi à ton compte (Profil) puis active les notifications pour le recevoir."), duration: 7000 });
      }
    }
  };

  if (!choix)
    return (
      <>
        <DrawerTitle className="mt-2 px-1 text-[21px] font-extrabold">{tr("Programmer une séance")}</DrawerTitle>
        <DrawerDescription className="mt-0.5 px-1 text-[13.5px] text-muted-foreground">{maj(jourLong(d))}</DrawerDescription>
        {options.map((g) => (
          <section key={g.titre} className="mt-4">
            <h3 className="eyebrow mb-1.5 px-1">{g.titre}</h3>
            <div className="flex flex-col gap-1.5">
              {g.l.map((c) => (
                <button key={c.nom + JSON.stringify(c.quoi)} onClick={() => { tactile(6); setChoix({ quoi: c.quoi, nom: c.nom }); }}
                  className="flex items-center gap-3 rounded-2xl bg-muted/60 p-3 text-left active:scale-[.99]">
                  <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-plate-soft text-plate-ink dark:text-plate">{c.icone}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[15px] font-semibold">{c.nom}</span>
                    {(c.sous || c.deja) && <span className="line-clamp-2 block text-[12.5px] leading-snug text-muted-foreground">{[c.sous, c.deja ? tr("déjà dans l'agenda") : ""].filter(Boolean).join(" · ")}</span>}
                  </span>
                  <CaretRightIcon className="size-4 shrink-0 text-muted-foreground" />
                </button>
              ))}
            </div>
          </section>
        ))}
        {!etat.SEANCES.length && (
          <button onClick={() => { fermer(); router.push("/entrainement/assistant" as Route, AVANT); }} className="mt-4 w-full rounded-2xl border border-dashed border-plate/60 p-3 text-[14px] font-semibold text-plate-ink dark:text-plate">
            {tr("Créer une séance d'abord")}
          </button>
        )}
      </>
    );

  return (
    <>
      <div className="mt-2 px-1 text-[11px] font-bold tracking-[0.12em] text-muted-foreground uppercase">{maj(jourLong(d))}</div>
      <DrawerTitle className="px-1 text-[21px] leading-tight font-extrabold">{choix.nom}</DrawerTitle>
      <DrawerDescription className="mt-0.5 px-1 text-[13.5px] text-muted-foreground">{sousTitre(etat, { id: "", d, nom: choix.nom, quoi: choix.quoi }) ?? ""}</DrawerDescription>
      {!init.quoi && <button onClick={() => setChoix(null)} className="mt-1 px-1 text-[13px] font-semibold text-plate-ink dark:text-plate">{tr("Changer de séance")}</button>}

      <div className="mt-4 mb-1.5 px-1 text-[12.5px] font-semibold text-muted-foreground">{tr("Jour")}</div>
      <ChoixJour valeur={d} auj={auj} onChange={setD} />
      <div className="mt-3 mb-1.5 px-1 text-[12.5px] font-semibold text-muted-foreground">{tr("Répéter")}</div>
      <Segmente label={tr("Répéter")} valeur={hebdo ? "oui" : "non"} onChange={(v) => setHebdo(v === "oui")}
        options={[{ v: "non", n: tr("Juste ce jour") }, { v: "oui", n: tr("Chaque {j}", { j: nomJourSemaine(d) }) }]} />
      <ChoixRappel valeur={rappel} jour={d} onChange={setRappel} />
      {rappel && (
        <p className="mt-3 flex gap-2 rounded-xl bg-plate-soft p-2.5 text-[12.5px] leading-snug text-plate-ink dark:text-plate">
          <BellIcon className="mt-0.5 size-4 shrink-0" weight="fill" />
          {rappel.veille
            ? tr("« Demain : {nom}. Prépare tes affaires de sport. » {j} à {h} h", { nom: choix.nom, j: nomJourSemaine(decaler(d, -1)), h: rappel.h })
            : tr("« Aujourd'hui : {nom}. » {j} à {h} h", { nom: choix.nom, j: nomJourSemaine(d), h: rappel.h })}
        </p>
      )}
      <button onClick={valider} className="mt-4 h-12 w-full rounded-full bg-plate text-[15.5px] font-semibold text-plate-foreground active:scale-[.98]">
        {init.modifier ? tr("Programmer puis modifier") : tr("Programmer")}
      </button>
    </>
  );
}

/* ---------------- déplacer ---------------- */
function FeuilleDeplacer({ id, de, auj, fermer }: { id: string; de: string; auj: string; fermer: () => void }) {
  const p = useRepere((s) => s.etat.AGENDA?.find((x) => x.id === id));
  const muter = useRepere((s) => s.muter);
  const [vers, setVers] = useState(de > auj ? de : auj);
  if (!p) return null;
  return (
    <>
      <DrawerTitle className="mt-2 px-1 text-[21px] font-extrabold">{tr("Déplacer « {nom} »", { nom: p.nom })}</DrawerTitle>
      <DrawerDescription className="mt-0.5 px-1 text-[13.5px] text-muted-foreground">
        {p.hebdo ? tr("Seulement la séance du {a} ; les autres semaines ne bougent pas.", { a: jourLong(de) }) : tr("Prévue {a}", { a: jourLong(de) })}
      </DrawerDescription>
      <div className="mt-4 mb-1.5 px-1 text-[12.5px] font-semibold text-muted-foreground">{tr("Nouveau jour")}</div>
      <ChoixJour valeur={vers} auj={auj} onChange={setVers} />
      <button disabled={vers === de} onClick={() => { tactile(10); muter((E) => deplacer(E.AGENDA ?? [], id, de, vers)); toast.success(tr("Déplacée au {a}", { a: jourLong(vers) })); fermer(); }}
        className="mt-4 h-12 w-full rounded-full bg-plate text-[15.5px] font-semibold text-plate-foreground active:scale-[.98] disabled:opacity-50">
        {tr("Déplacer")}
      </button>
    </>
  );
}
