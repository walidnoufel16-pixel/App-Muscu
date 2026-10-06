"use client";

import { useState } from "react";
import type { User } from "@supabase/supabase-js";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { messageErreur, sb } from "@/lib/supabase";
import { useRepere } from "@/lib/store";
import { cn } from "@/lib/utils";

/* Saisie du code à six chiffres qui confirme l'adresse rattachée au compte
   (après « Créer mon compte » ou un rattachement depuis Profil). */
export function SaisieCodeMail({ grand, onConfirme }: { grand?: boolean; onConfirme?: (u: User | null) => void }) {
  const { user, setUser } = useRepere();
  const [code, setCode] = useState("");
  const [msg, setMsg] = useState<{ t: string; ok?: boolean } | null>(null);
  const [occupe, setOccupe] = useState(false);

  const confirmer = async (saisi = code) => {
    const c = await sb(), k = saisi.replace(/\D/g, "");
    if (!c || !user?.new_email || occupe) return;
    if (k.length !== 6) { setMsg({ t: "Le code fait six chiffres." }); return; }
    setOccupe(true);
    try {
      const essai = (email: string) => c.auth.verifyOtp({ email, token: k, type: "email_change" });
      let { data, error } = await essai(user.new_email);
      /* Changement d'une adresse existante : l'ancienne reçoit aussi son code. */
      if (error && user.email) ({ data, error } = await essai(user.email));
      if (error) throw error;
      const u = data.user || (await c.auth.getUser()).data.user;
      if (u) setUser(u);
      setCode("");
      toast.success(u?.new_email ? "Code accepté" : "Adresse confirmée", {
        description: u?.new_email ? "Un second code a été envoyé à ton ancienne adresse : saisis-le aussi." : "Ton compte est maintenant récupérable sur un autre appareil.",
      });
      setMsg(null);
      onConfirme?.(u);
    } catch (e) { setMsg({ t: messageErreur(e, "code") }); }
    setOccupe(false);
  };

  const renvoyer = async () => {
    const c = await sb(), m = user?.new_email;
    if (!c || !m) return;
    const { error } = await c.auth.updateUser({ email: m });
    setMsg(error ? { t: messageErreur(error) } : { t: "Nouveau code envoyé à " + m + ".", ok: true });
  };

  return (
    <div>
      <Input
        autoFocus={grand}
        value={code}
        onChange={(e) => {
          const v = e.target.value.replace(/\D/g, "").slice(0, 6);
          setCode(v);
          if (v.length === 6) confirmer(v);
        }}
        onKeyDown={(e) => e.key === "Enter" && confirmer()}
        inputMode="numeric"
        autoComplete="one-time-code"
        placeholder="000000"
        aria-label="Code à six chiffres"
        className={cn("num rounded-2xl text-center font-bold tracking-[0.4em]", grand ? "h-16 bg-card text-[34px]" : "mt-3 h-14 text-[30px]")}
      />
      <div className="mt-2 flex gap-2">
        <Button variant="plate" size="lg" className="flex-1 rounded-xl" disabled={occupe} onClick={() => confirmer()}>
          {occupe ? "Vérification…" : "Confirmer l'adresse"}
        </Button>
        <Button variant="soft" size="lg" className="rounded-xl" onClick={renvoyer}>Renvoyer</Button>
      </div>
      {msg && <p className={cn("mt-2 text-[13px]", msg.ok ? "text-success" : "text-destructive")}>{msg.t}</p>}
    </div>
  );
}
