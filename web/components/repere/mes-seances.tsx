"use client";

import { useState, ViewTransition } from "react";
import { useRouter } from "next/navigation";
import { CaretRightIcon, CheckIcon, DownloadSimpleIcon, ExportIcon, PlusIcon, SparkleIcon } from "@phosphor-icons/react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { LigneBalayable } from "@/components/repere/ligne-balayable";
import { Vignette } from "@/components/repere/exercice-carte";
import { confirmer, dire } from "@/components/repere/confirmer";
import { EX } from "@/lib/data/exercices";
import { dispoDeclare, musclesDe } from "@/lib/logic/core";
import { dureeEstimee } from "@/lib/logic/assistant";
import * as act from "@/lib/logic/actions";
import { useRepere } from "@/lib/store";
import { AVANT } from "@/lib/nav";
import { useBrouillon } from "@/lib/brouillon";
import type { Route } from "next";
import { construireSeance, dureeTotale, FORMATS, MACHINES } from "@/lib/logic/cardio";
import { ICONE_FORMAT } from "./reglages-cardio";
import { cn } from "@/lib/utils";

/* Séances libres : la liste (balayer pour supprimer, partager), puis les façons d'en créer une. */
export function MesSeances() {
  const router = useRouter();
  const { etat, muter, partager, partagerCardio, importer } = useRepere();
  const cardio = etat.SEANCES_CARDIO || [];
  const setLibre = useBrouillon((s) => s.setLibre);
  const [imp, setImp] = useState(false);
  const [code, setCode] = useState("");

  const supprimer = async (i: number) => {
    const ok = await confirmer({
      titre: `Supprimer « ${etat.SEANCES[i].nom} » ?`,
      texte: "Les charges enregistrées sur cette séance seront effacées aussi, y compris dans l'historique des exercices concernés.",
      ok: "Supprimer", danger: true,
    });
    if (ok) muter((E) => act.supprimerSeance(E, i));
  };

  const supprimerCardio = async (i: number) => {
    if (await confirmer({ titre: `Supprimer « ${cardio[i].nom} » ?`, texte: "Ton historique de cardio est conservé.", ok: "Supprimer", danger: true }))
      muter((E) => { E.SEANCES_CARDIO!.splice(i, 1); });
  };

  const partagerSeance = async (i: number, estCardio = false) => {
    const r = await (estCardio ? partagerCardio(i) : partager(i));
    if (r.erreur || !r.code) { dire("Partage impossible", r.erreur); return; }
    const lien = location.origin + "/?s=" + r.code, nom = estCardio ? cardio[i].nom : etat.SEANCES[i].nom;
    if (navigator.share) { try { await navigator.share({ title: nom, text: `Ma séance « ${nom} » sur Repère`, url: lien }); return; } catch {} }
    try { await navigator.clipboard.writeText(lien); toast.success("Lien copié", { description: "Code à dicter : " + r.code }); }
    catch { dire("Ta séance partagée", lien + "\n\nCode à dicter : " + r.code); }
  };

  const lancerImport = async () => {
    const r = await importer(code);
    if (r.erreur) { dire("Import impossible", r.erreur); return; }
    setImp(false); setCode("");
    toast.success(`« ${r.nom} » ajoutée à tes séances${r.cardio ? " cardio" : ""}`);
  };

  return (
    <>
      <div className="flex flex-col gap-2">
        {cardio.length > 0 && <h3 className="px-1 text-[13px] font-semibold text-muted-foreground">Musculation</h3>}
        {etat.SEANCES.length ? (
          etat.SEANCES.map((s, i) => {
            const absents = s.ex.filter((e) => !dispoDeclare(etat.A, e.id)).length;
            return (
              <LigneBalayable key={i + s.nom} label={s.nom} onSupprimer={() => supprimer(i)}>
                <div className="flex items-stretch rounded-[20px] border border-border/80 bg-card">
                  <button onClick={() => router.push(`/entrainement/seance?l=${i}`, AVANT)} className="flex min-w-0 flex-1 items-center gap-3 p-3 text-left">
                    {/* même nom que dans l'en-tête de la séance : les vignettes s'y transforment */}
                    <ViewTransition name={`vignettes-${i}`} share="morph" default="none">
                      <span className="flex -space-x-3">
                        {s.ex.slice(0, 3).map((e) => EX[e.id] && <Vignette key={e.id} id={e.id} className="size-11 rounded-[12px] ring-2 ring-card" />)}
                      </span>
                    </ViewTransition>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[16px] font-semibold tracking-[-0.01em]">{s.nom}</span>
                      <span className="block truncate text-[12.5px] text-muted-foreground">
                        {s.ex.length} exercice{s.ex.length > 1 ? "s" : ""} · environ {dureeEstimee(s.ex)} min · {musclesDe(s.ex.map((e) => e.id)).slice(0, 3).join(", ")}
                      </span>
                      {absents > 0 && <span className="block text-[12px] text-destructive">{absents} hors de ton matériel</span>}
                    </span>
                  </button>
                  <button onClick={() => partagerSeance(i)} aria-label="Partager" className="grid w-12 place-items-center border-l border-border/70 text-muted-foreground">
                    {s.code ? <CheckIcon className="size-5" /> : <ExportIcon className="size-5" />}
                  </button>
                </div>
              </LigneBalayable>
            );
          })
        ) : (
          <div className="rounded-[22px] border border-dashed bg-card/50 p-5 text-center text-[14px] leading-relaxed text-muted-foreground">
            Aucune séance {cardio.length ? "de musculation " : ""}enregistrée pour l&apos;instant. Crée la première : elle restera disponible ensuite.
          </div>
        )}

        {/* séances cardio : une catégorie à part */}
        {cardio.length > 0 && <h3 className="mt-3 px-1 text-[13px] font-semibold text-muted-foreground">Cardio</h3>}
        {cardio.map((c, i) => {
          const I = ICONE_FORMAT[c.f];
          return (
            <LigneBalayable key={"c" + i + c.nom} label={c.nom} onSupprimer={() => supprimerCardio(i)}>
              <div className="flex items-stretch rounded-[20px] border border-border/80 bg-card">
                <button onClick={() => router.push(`/entrainement/cardio?s=${i}` as Route, AVANT)} className="flex min-w-0 flex-1 items-center gap-3 p-3 text-left">
                  <span className="grid size-11 shrink-0 place-items-center rounded-[12px] bg-plate-soft text-plate-ink"><I className="size-6" weight="fill" /></span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[16px] font-semibold tracking-[-0.01em]">{c.nom}</span>
                    <span className="block truncate text-[12.5px] text-muted-foreground">
                      {FORMATS[c.f].nom} · {MACHINES[c.m].nom} · {Math.round(dureeTotale(construireSeance(c.f, c.m, c.r)) / 60)} min
                    </span>
                  </span>
                </button>
                <button onClick={() => partagerSeance(i, true)} aria-label="Partager" className="grid w-12 place-items-center border-l border-border/70 text-muted-foreground">
                  {c.code ? <CheckIcon className="size-5" /> : <ExportIcon className="size-5" />}
                </button>
              </div>
            </LigneBalayable>
          );
        })}
        {etat.SEANCES.length + cardio.length > 0 && <p className="px-2 text-center text-[11.5px] text-muted-foreground">Fais glisser une séance vers la gauche pour la supprimer.</p>}

        <div className="mt-1 overflow-hidden rounded-[20px] border border-border/80 bg-card">
          <Action accent icone={<SparkleIcon className="size-5" weight="fill" />} label="Créer une séance pour moi" onClick={() => router.push("/entrainement/assistant", AVANT)} />
          <Action icone={<PlusIcon className="size-5" />} label="Composer exercice par exercice" onClick={() => { setLibre({ nom: "Séance libre", ex: [], idx: null }); router.push("/entrainement/composer", AVANT); }} />
          <Action icone={<DownloadSimpleIcon className="size-5" />} label="Importer une séance avec un code" onClick={() => setImp(true)} />
        </div>
      </div>

      <Dialog open={imp} onOpenChange={setImp}>
        <DialogContent className="max-w-[360px] rounded-[22px]">
          <DialogTitle>Importer une séance</DialogTitle>
          <DialogDescription>Le code que t&apos;a transmis la personne qui partage la séance : cinq caractères.</DialogDescription>
          <Input
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            onKeyDown={(e) => e.key === "Enter" && lancerImport()}
            placeholder="AB12C"
            maxLength={8}
            autoCapitalize="characters"
            autoComplete="off"
            className="num h-12 text-center text-[24px] tracking-[0.3em]"
          />
          <Button size="lg" className="rounded-xl" onClick={lancerImport}>Importer</Button>
        </DialogContent>
      </Dialog>
    </>
  );
}

function Action({ icone, label, onClick, accent }: { icone: React.ReactNode; label: string; onClick: () => void; accent?: boolean }) {
  return (
    <button onClick={onClick} className={cn("flex w-full items-center gap-3.5 border-b border-border/70 px-4 py-3.5 text-left text-[15px] font-medium last:border-b-0 active:bg-muted", accent && "font-semibold text-plate-ink")}>
      <span className={accent ? "text-plate" : "text-muted-foreground"}>{icone}</span>
      <span className="flex-1">{label}</span>
      <CaretRightIcon className="size-4 text-muted-foreground" />
    </button>
  );
}
