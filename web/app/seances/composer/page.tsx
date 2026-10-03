"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowsClockwiseIcon, ArrowsLeftRightIcon, CaretDownIcon, CaretLeftIcon, DotsSixVerticalIcon, InfoIcon, MinusIcon, PlusIcon, TrashIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EnTete } from "@/components/repere/en-tete";
import { Vignette } from "@/components/repere/exercice-carte";
import { FicheExercice, type FicheOuverte } from "@/components/repere/fiche-exercice";
import { FiltreMateriel } from "@/components/repere/filtre-materiel";
import { Remplacer } from "@/components/repere/seance-vues";
import { Bibliotheque, ListeRecherche } from "@/components/repere/bibliotheque";
import { Segmente } from "@/components/repere/segmente";
import { confirmer } from "@/components/repere/confirmer";
import { EX } from "@/lib/data/exercices";
import { OBJS, PAS_REPOS } from "@/lib/data/referentiels";
import { exoFiltre, musclesDe, nomPat, selDeclare } from "@/lib/logic/core";
import { construireSeance, dureeEstimee, exParDefaut } from "@/lib/logic/assistant";
import * as act from "@/lib/logic/actions";
import type { ExLibre } from "@/lib/logic/types";
import { useRepere } from "@/lib/store";
import { ARRIERE } from "@/lib/nav";
import { useBrouillon } from "@/lib/brouillon";
import { tactile } from "@/lib/repos";
import { cn } from "@/lib/utils";

export default function PageComposer() {
  const router = useRouter();
  const { etat, muter } = useRepere();
  const { libre, majLibre, sel: selB, setSel, setLibre } = useBrouillon();
  const sel = selB ?? selDeclare(etat.A);
  const [ouv, setOuv] = useState<string | null>(null);
  const [fiche, setFiche] = useState<FicheOuverte | null>(null);
  const [remp, setRemp] = useState<number | null>(null);
  const [vueBib, setVueBib] = useState<"corps" | "liste">("corps");
  const [zone, setZone] = useState<{ z: string; p: string | null } | null>(null);
  const [q, setQ] = useState("");
  const liste = useRef<HTMLDivElement>(null);
  const [glisse, setGlisse] = useState<string | null>(null);

  useEffect(() => { if (!libre) router.replace("/seances"); }, [libre, router]);
  if (!libre) return null;
  const L = libre;

  const ajouter = (o: string) => { tactile(8); majLibre((l) => { l.ex.push(exParDefaut(o)); }); };
  const pris = (o: string) => L.ex.some((e) => e.id === o);
  const regl = (i: number, c: "s" | "r", d: number) => majLibre((l) => { const e = l.ex[i]; e[c] = Math.min(c === "s" ? 6 : 600, Math.max(1, e[c] + d)); });
  const reglRepos = (i: number, d: number) => majLibre((l) => { const e = l.ex[i]; let k = PAS_REPOS.indexOf(e.p); if (k < 0) k = 3; e.p = PAS_REPOS[Math.min(PAS_REPOS.length - 1, Math.max(0, k + d))]; });
  const deplacer = (i: number, d: number) => majLibre((l) => { const j = i + d; if (j < 0 || j >= l.ex.length) return; [l.ex[i], l.ex[j]] = [l.ex[j], l.ex[i]]; });
  const retirer = (i: number) => { setOuv(null); majLibre((l) => { l.ex.splice(i, 1); }); };

  /* Glisser-déposer à la poignée : on échange avec la voisine dès que le doigt
     passe son milieu. Écoute sur le document : la carte se déplace sous le doigt. */
  const saisir = (ev: React.PointerEvent, id: string) => {
    ev.preventDefault();
    setGlisse(id);
    tactile(10);
    const bouge = (e: PointerEvent) => {
      const cartes = [...(liste.current?.querySelectorAll<HTMLElement>("[data-carte]") || [])];
      const pos = cartes.findIndex((c) => c.dataset.carte === id);
      for (let j = 0; j < cartes.length; j++) {
        if (j === pos) continue;
        const r = cartes[j].getBoundingClientRect(), mid = r.top + r.height / 2;
        if ((j < pos && e.clientY < mid) || (j > pos && e.clientY > mid)) {
          useBrouillon.getState().majLibre((l) => { const t = l.ex.splice(pos, 1)[0]; l.ex.splice(j, 0, t); });
          tactile(4);
          break;
        }
      }
    };
    const fin = () => { document.removeEventListener("pointermove", bouge); document.removeEventListener("pointerup", fin); document.removeEventListener("pointercancel", fin); setGlisse(null); };
    document.addEventListener("pointermove", bouge);
    document.addEventListener("pointerup", fin);
    document.addEventListener("pointercancel", fin);
  };

  const enregistrer = () => {
    const nom = L.nom.trim() || "Séance libre";
    const s = { nom, ex: L.ex, ...(L.obj != null ? { obj: L.obj } : {}), ...(L.colObj != null ? { colObj: L.colObj } : {}), ...(L.gen ? { gen: L.gen } : {}), ...(L.code ? { code: L.code } : {}) };
    muter((E) => { if (L.idx != null) E.SEANCES[L.idx] = s; else E.SEANCES.push(s); });
    setLibre(null);
    router.push("/seances", ARRIERE);
  };
  const supprimer = async () => {
    if (L.idx == null) { setLibre(null); router.push("/seances", ARRIERE); return; }
    if (!(await confirmer({ titre: `Supprimer « ${etat.SEANCES[L.idx]?.nom} » ?`, texte: "Les charges enregistrées sur cette séance seront effacées aussi.", ok: "Supprimer", danger: true }))) return;
    const i = L.idx;
    muter((E) => act.supprimerSeance(E, i));
    setLibre(null);
    router.push("/seances", ARRIERE);
  };

  const rempCur = remp != null ? L.ex[remp]?.id : undefined;
  const rempListe = rempCur ? [rempCur, ...Object.keys(EX).filter((o) => o !== rempCur && EX[o].pat === EX[rempCur].pat && exoFiltre(o, sel) && !pris(o))] : [];

  return (
    <>
      <EnTete
        surtitre={L.idx != null ? "Modifier la séance" : "Nouvelle séance"}
        titre={L.nom || "Séance libre"}
        gauche={<Button variant="ghost" size="sm" className="-ml-2 text-[15px]" onClick={() => router.push("/seances", ARRIERE)}><CaretLeftIcon className="size-5" />Séances</Button>}
        actions={<Button variant="ghost" size="icon" aria-label="Supprimer" onClick={supprimer}><TrashIcon className="size-5 text-destructive" /></Button>}
      />
      <div className="flex flex-col gap-5 px-4 pb-28">
        <section>
          <label className="eyebrow mb-1.5 block px-1" htmlFor="nom">Nom de la séance</label>
          <Input id="nom" value={L.nom} onChange={(e) => majLibre((l) => { l.nom = e.target.value; })} placeholder="Haut du corps, jambes, jour de bras…" className="h-12 rounded-2xl bg-card text-[17px] font-semibold" />
          <div className="eyebrow mt-4 mb-1.5 px-1">Objectif · facultatif</div>
          <div className="no-scrollbar -mx-4 flex gap-1.5 overflow-x-auto px-4">
            {OBJS.map((o, i) => (
              <button key={o} aria-pressed={L.obj === i} onClick={() => majLibre((l) => { l.obj = l.obj === i ? undefined : i; })}
                className={cn("h-9 shrink-0 rounded-full border px-3.5 text-[13.5px] font-medium", L.obj === i ? "border-foreground bg-foreground text-background" : "border-border bg-card text-muted-foreground")}>
                {o}
              </button>
            ))}
          </div>
        </section>

        {L.gen && (
          <div className="flex items-center gap-3 rounded-[20px] bg-plate-soft p-3.5">
            <p className="flex-1 text-[13.5px] leading-snug">Proposition de départ : réordonne, remplace ou ajoute ce que tu veux.</p>
            <Button variant="outline" size="sm" className="rounded-full bg-card" onClick={() => { tactile(10); majLibre((l) => { const ex = construireSeance(l.gen!.m, l.gen!.d, l.gen!.obj, sel); if (ex.length) l.ex = ex; }); setOuv(null); }}>
              <ArrowsClockwiseIcon />Autre
            </Button>
          </div>
        )}

        <section>
          <div className="eyebrow mb-2 px-1">
            Ta séance · {L.ex.length} exercice{L.ex.length > 1 ? "s" : ""}{L.ex.length ? ` · environ ${dureeEstimee(L.ex)} min` : ""}
          </div>
          <div ref={liste} className="flex flex-col gap-2">
            {L.ex.length ? L.ex.map((e, i) => (
              <CarteCompo
                key={e.id}
                e={e} i={i} n={L.ex.length}
                ouvert={ouv === e.id}
                glisse={glisse === e.id}
                onToggle={() => setOuv(ouv === e.id ? null : e.id)}
                onSaisir={(ev) => saisir(ev, e.id)}
                regl={regl} reglRepos={reglRepos} deplacer={deplacer}
                onFiche={() => setFiche({ id: e.id, idx: -1, pres: [e.s, e.r, e.p], libelle: "séance libre" })}
                onRemplacer={() => setRemp(i)}
                onRetirer={() => retirer(i)}
              />
            )) : (
              <p className="rounded-[20px] border border-dashed bg-card/50 p-5 text-center text-[14px] text-muted-foreground">Touche un exercice ci-dessous pour l&apos;ajouter.</p>
            )}
          </div>
        </section>

        <section className="flex flex-col gap-3">
          <div className="eyebrow px-1">Bibliothèque</div>
          <FiltreMateriel sel={sel} declare={selDeclare(etat.A)} onChange={setSel} />
          <Segmente label="Affichage de la bibliothèque" valeur={vueBib} onChange={setVueBib} options={[{ v: "corps", n: "Sur le corps" }, { v: "liste", n: "Liste" }]} />
          {vueBib === "corps" ? (
            <Bibliotheque sel={sel} zone={zone} setZone={setZone} pris={pris} onAjouter={ajouter} onFiche={(id) => setFiche({ id, idx: -1, pres: [3, 10, "90 s"], libelle: "bibliothèque" })} />
          ) : (
            <ListeRecherche sel={sel} q={q} setQ={setQ} pris={pris} onAjouter={ajouter} onFiche={(id) => setFiche({ id, idx: -1, pres: [3, 10, "90 s"], libelle: "bibliothèque" })} />
          )}
        </section>
      </div>

      <div className="fixed inset-x-0 bottom-[calc(max(env(safe-area-inset-bottom),10px)+80px)] z-30 mx-auto max-w-[480px] px-4">
        <Button variant="plate" size="xl" className="w-full" disabled={!L.ex.length} onClick={enregistrer}>Enregistrer la séance</Button>
      </div>

      <FicheExercice fiche={fiche} onClose={() => setFiche(null)} />
      <Remplacer
        ouvert={remp != null && !!rempCur}
        onClose={() => setRemp(null)}
        titre={rempCur ? EX[rempCur].n : ""}
        sousTitre={rempCur ? `Remplacer · ${nomPat(EX[rempCur].pat)}` : ""}
        liste={rempListe}
        courant={rempCur}
        onChoisir={(o) => {
          majLibre((l) => {
            const e = l.ex[remp!], x = EX[o], old = EX[e.id];
            if (x.ch !== old.ch) e.r = x.ch === "temps" ? 45 : x.ch === "dist" ? 250 : 10;
            e.id = o;
          });
          setOuv(o);
          setRemp(null);
        }}
      />
    </>
  );
}

function CarteCompo({
  e, i, n, ouvert, glisse, onToggle, onSaisir, regl, reglRepos, deplacer, onFiche, onRemplacer, onRetirer,
}: {
  e: ExLibre; i: number; n: number; ouvert: boolean; glisse: boolean;
  onToggle: () => void; onSaisir: (ev: React.PointerEvent) => void;
  regl: (i: number, c: "s" | "r", d: number) => void; reglRepos: (i: number, d: number) => void; deplacer: (i: number, d: number) => void;
  onFiche: () => void; onRemplacer: () => void; onRetirer: () => void;
}) {
  const x = EX[e.id], mus = musclesDe([e.id]), pas = x.ch === "temps" ? 5 : x.ch === "dist" ? 50 : 1;
  const prescr = x.ch === "temps" ? `${e.s} × ${e.r}s` : x.ch === "dist" ? `${e.s} × ${e.r}m` : `${e.s} × ${e.r}`;
  return (
    <div data-carte={e.id} className={cn("overflow-hidden rounded-[20px] border bg-card transition-shadow", glisse ? "z-10 border-plate shadow-[0_14px_34px_-14px_rgba(0,0,0,.45)]" : "border-border/80")}>
      <div className="flex items-center">
        <button onPointerDown={onSaisir} aria-label="Glisser pour déplacer" className="grid h-16 w-8 shrink-0 cursor-grab touch-none place-items-center text-muted-foreground/70 active:cursor-grabbing">
          <DotsSixVerticalIcon className="size-5" />
        </button>
        <button onClick={onToggle} aria-expanded={ouvert} className="flex min-w-0 flex-1 items-center gap-3 py-3 pr-3 text-left">
          <Vignette id={e.id} num={i + 1} />
          <span className="flex min-w-0 flex-1 flex-col gap-0.5">
            <span className="truncate text-[16px] font-semibold tracking-[-0.01em]">{x.n}</span>
            {mus.length > 0 && <span className="truncate text-[12.5px] text-muted-foreground">{mus.join(" · ")}</span>}
            <span className="num text-[15px] font-semibold text-foreground/80">{prescr} <span className="font-sans text-[12.5px] font-normal text-muted-foreground">· repos {e.p}</span></span>
          </span>
          <CaretDownIcon className={cn("size-5 shrink-0 text-muted-foreground transition-transform", ouvert && "rotate-180")} />
        </button>
      </div>
      {ouvert && (
        <div className="animate-in fade-in-0 duration-150">
          <div className="grid grid-cols-2 gap-2 border-t border-border/70 p-3">
            <Pas titre="Séries" val={e.s} moins={() => regl(i, "s", -1)} plus={() => regl(i, "s", 1)} d1={e.s <= 1} d2={e.s >= 6} />
            <Pas titre={x.ch === "temps" ? "Secondes" : x.ch === "dist" ? "Mètres" : "Répétitions"} val={e.r} moins={() => regl(i, "r", -pas)} plus={() => regl(i, "r", pas)} d1={e.r <= pas} />
            <Pas titre="Repos" val={e.p} moins={() => reglRepos(i, -1)} plus={() => reglRepos(i, 1)} />
            <Pas titre="Position" val={`${i + 1} / ${n}`} moins={() => deplacer(i, -1)} plus={() => deplacer(i, 1)} d1={i === 0} d2={i === n - 1} />
          </div>
          <div className="grid grid-cols-3 border-t border-border/70">
            <Outil onClick={onFiche} icone={<InfoIcon className="size-5" />} label="Fiche" />
            <Outil onClick={onRemplacer} icone={<ArrowsLeftRightIcon className="size-5" />} label="Remplacer" />
            <Outil onClick={onRetirer} icone={<TrashIcon className="size-5 text-destructive" />} label="Retirer" />
          </div>
        </div>
      )}
    </div>
  );
}

function Pas({ titre, val, moins, plus, d1, d2 }: { titre: string; val: React.ReactNode; moins: () => void; plus: () => void; d1?: boolean; d2?: boolean }) {
  return (
    <div className="rounded-2xl bg-muted/70 p-2.5">
      <div className="mb-1.5 text-[10.5px] font-medium tracking-[0.1em] text-muted-foreground uppercase">{titre}</div>
      <div className="flex items-center justify-between gap-1">
        <button onClick={moins} disabled={d1} aria-label={`${titre} moins`} className="grid size-9 place-items-center rounded-full bg-card shadow-sm active:scale-90 disabled:opacity-30"><MinusIcon className="size-4" /></button>
        <b className="num text-[19px] font-bold whitespace-nowrap">{val}</b>
        <button onClick={plus} disabled={d2} aria-label={`${titre} plus`} className="grid size-9 place-items-center rounded-full bg-card shadow-sm active:scale-90 disabled:opacity-30"><PlusIcon className="size-4" /></button>
      </div>
    </div>
  );
}

function Outil({ onClick, icone, label }: { onClick: () => void; icone: React.ReactNode; label: string }) {
  return (
    <button onClick={onClick} className="flex flex-col items-center gap-1 border-r border-border/70 py-2.5 text-[12px] font-medium last:border-r-0 active:bg-muted">
      <span className="text-muted-foreground">{icone}</span>
      {label}
    </button>
  );
}

