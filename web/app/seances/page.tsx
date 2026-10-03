"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronRight, Download, Plus, Share, Sparkles, PersonStanding, Check } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { EnTete } from "@/components/repere/en-tete";
import { LigneBalayable } from "@/components/repere/ligne-balayable";
import { Vignette } from "@/components/repere/exercice-carte";
import { confirmer, dire } from "@/components/repere/confirmer";
import { EX } from "@/lib/data/exercices";
import { dispoDeclare, musclesDe } from "@/lib/logic/core";
import { dureeEstimee } from "@/lib/logic/assistant";
import * as act from "@/lib/logic/actions";
import { useRepere } from "@/lib/store";
import { useBrouillon } from "@/lib/brouillon";

export default function PageSeances() {
  const router = useRouter();
  const { etat, muter, partager, importer } = useRepere();
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

  const partagerSeance = async (i: number) => {
    const r = await partager(i);
    if (r.erreur || !r.code) { dire("Partage impossible", r.erreur); return; }
    const lien = location.origin + "/?s=" + r.code, nom = etat.SEANCES[i].nom;
    if (navigator.share) { try { await navigator.share({ title: nom, text: `Ma séance « ${nom} » sur Repère`, url: lien }); return; } catch {} }
    try { await navigator.clipboard.writeText(lien); toast.success("Lien copié", { description: "Code à dicter : " + r.code }); }
    catch { dire("Ta séance partagée", lien + "\n\nCode à dicter : " + r.code); }
  };

  const lancerImport = async () => {
    const r = await importer(code);
    if (r.erreur) { dire("Import impossible", r.erreur); return; }
    setImp(false); setCode("");
    toast.success(`« ${r.nom} » ajoutée à tes séances`);
  };

  return (
    <>
      <EnTete surtitre="Séances libres" titre="Mes séances" />
      <div className="flex flex-col gap-2 px-4">
        {etat.SEANCES.length ? (
          etat.SEANCES.map((s, i) => {
            const absents = s.ex.filter((e) => !dispoDeclare(etat.A, e.id)).length;
            return (
              <LigneBalayable key={i + s.nom} label={s.nom} onSupprimer={() => supprimer(i)}>
                <div className="flex items-stretch rounded-[20px] border border-border/80 bg-card">
                  <button onClick={() => router.push(`/seances/seance/?i=${i}`)} className="flex min-w-0 flex-1 items-center gap-3 p-3 text-left">
                    <span className="flex -space-x-3">
                      {s.ex.slice(0, 3).map((e) => EX[e.id] && <Vignette key={e.id} id={e.id} className="size-11 rounded-[12px] ring-2 ring-card" />)}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[16px] font-semibold tracking-[-0.01em]">{s.nom}</span>
                      <span className="block truncate text-[12.5px] text-muted-foreground">
                        {s.ex.length} exercice{s.ex.length > 1 ? "s" : ""} · environ {dureeEstimee(s.ex)} min · {musclesDe(s.ex.map((e) => e.id)).slice(0, 3).join(", ")}
                      </span>
                      {absents > 0 && <span className="block text-[12px] text-destructive">{absents} hors de ton matériel</span>}
                    </span>
                  </button>
                  <button onClick={() => partagerSeance(i)} aria-label="Partager" className="grid w-12 place-items-center border-l border-border/70 text-muted-foreground">
                    {s.code ? <Check className="size-5" /> : <Share className="size-5" />}
                  </button>
                </div>
              </LigneBalayable>
            );
          })
        ) : (
          <div className="rounded-[22px] border border-dashed bg-card/50 p-5 text-center text-[14px] leading-relaxed text-muted-foreground">
            Aucune séance enregistrée pour l&apos;instant. Crée la première : elle restera disponible ensuite.
          </div>
        )}
        {etat.SEANCES.length > 0 && <p className="px-2 text-center text-[11.5px] text-muted-foreground">Fais glisser une séance vers la gauche pour la supprimer.</p>}

        <Button asChild variant="plate" size="xl" className="mt-3 w-full">
          <Link href="/seances/assistant/"><Sparkles />Créer une séance pour moi</Link>
        </Button>

        <div className="mt-2 overflow-hidden rounded-[20px] border border-border/80 bg-card">
          <Action icone={<Plus className="size-5" />} label="Composer exercice par exercice" onClick={() => { setLibre({ nom: "Séance libre", ex: [], idx: null }); router.push("/seances/composer/"); }} />
          <Action icone={<PersonStanding className="size-5" />} label="Explorer les exercices par le corps" onClick={() => router.push("/explorer/")} />
          <Action icone={<Download className="size-5" />} label="Importer une séance avec un code" onClick={() => setImp(true)} />
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

function Action({ icone, label, onClick }: { icone: React.ReactNode; label: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="flex w-full items-center gap-3.5 border-b border-border/70 px-4 py-3.5 text-left text-[15px] font-medium last:border-b-0 active:bg-muted">
      <span className="text-muted-foreground">{icone}</span>
      <span className="flex-1">{label}</span>
      <ChevronRight className="size-4 text-muted-foreground" />
    </button>
  );
}
