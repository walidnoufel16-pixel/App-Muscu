"use client";

/* Confirmation façon iOS (feuille d'alerte), promesse : await confirmer({...}). */
import { create } from "zustand";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

type Q = { titre: string; texte?: string; ok?: string; non?: string; danger?: boolean; seulOk?: boolean };
type S = { q: Q | null; res: ((v: boolean) => void) | null; ouvrir: (q: Q) => Promise<boolean>; fermer: (v: boolean) => void };

const useC = create<S>((set, get) => ({
  q: null,
  res: null,
  ouvrir: (q) => new Promise<boolean>((res) => set({ q, res })),
  fermer: (v) => { get().res?.(v); set({ q: null, res: null }); },
}));

export const confirmer = (q: Q) => useC.getState().ouvrir(q);
export const dire = (titre: string, texte?: string) => useC.getState().ouvrir({ titre, texte, seulOk: true, ok: "OK" });

export function Confirmateur() {
  const { q, fermer } = useC();
  return (
    <Dialog open={!!q} onOpenChange={(o) => !o && fermer(false)}>
      <DialogContent showCloseButton={false} className="max-w-[340px] gap-0 rounded-[22px] p-0">
        {q && (
          <>
            <div className="px-5 pt-5 pb-4 text-center">
              <DialogTitle className="text-[17px] font-semibold">{q.titre}</DialogTitle>
              <DialogDescription className="mt-1.5 text-[14px] leading-relaxed whitespace-pre-line text-muted-foreground">{q.texte || ""}</DialogDescription>
            </div>
            <div className={q.seulOk ? "p-3 pt-0" : "grid grid-cols-2 gap-2 p-3 pt-0"}>
              {!q.seulOk && <Button variant="soft" size="lg" className="rounded-xl" onClick={() => fermer(false)}>{q.non || "Annuler"}</Button>}
              <Button variant={q.danger ? "destructive" : "default"} size="lg" className="w-full rounded-xl" onClick={() => fermer(true)} autoFocus>
                {q.ok || "Confirmer"}
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
