"use client";

import { ReglageCycle, useCycleCharge } from "@/components/repere/cycle";
import { ReglageZones } from "@/components/repere/forme";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { ArrowsLeftRightIcon, CaretRightIcon, CheckCircleIcon, CloudSlashIcon, EnvelopeIcon, ShieldWarningIcon } from "@phosphor-icons/react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EnTete } from "@/components/repere/en-tete";
import { Segmente } from "@/components/repere/segmente";
import { confirmer } from "@/components/repere/confirmer";
import { messageErreur, sb, valideMail } from "@/lib/supabase";
import { useRepere } from "@/lib/store";
import { CREDITS } from "@/lib/medias";
import { ARRIERE, AVANT } from "@/lib/nav";
import { recap } from "@/lib/logic/questionnaire";
import { cn } from "@/lib/utils";

export default function PageProfil() {
  const router = useRouter();
  const { user, pseudo, sync, etat, setUser, pousser, toutEffacer, changerDeCompte } = useRepere();
  const { theme, setTheme } = useTheme();
  const cycleActif = !!useCycleCharge()?.actif;
  const [mail, setMail] = useState("");
  const [code, setCode] = useState("");
  const [msg, setMsg] = useState<{ t: string; ok?: boolean } | null>(null);
  const [occupe, setOccupe] = useState(false);
  const adresse = user?.email, attente = user?.new_email;

  const lier = async () => {
    const m = mail.trim().toLowerCase();
    setMsg(null);
    if (!valideMail(m)) { setMsg({ t: "Cette adresse n'a pas l'air valide." }); return; }
    const c = await sb();
    if (!c || !user) { setMsg({ t: "Pas de connexion au serveur : impossible pour l'instant." }); return; }
    if (adresse === m) { setMsg({ t: "C'est déjà l'adresse de ce compte." }); return; }
    setOccupe(true);
    try {
      await pousser(); // rien ne doit se perdre
      const { data, error } = await c.auth.updateUser({ email: m });
      if (error) throw error;
      setUser(data.user ? { ...data.user, new_email: data.user.new_email || m } : { ...user, new_email: m });
      setMail("");
      setMsg({ t: "Code envoyé à " + m + ".", ok: true });
    } catch (e) { setMsg({ t: messageErreur(e, "lier") }); }
    setOccupe(false);
  };

  const confirmerCode = async () => {
    const c = await sb(), k = code.replace(/\D/g, "");
    if (!c || !user?.new_email) return;
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
    } catch (e) { setMsg({ t: messageErreur(e, "code") }); }
    setOccupe(false);
  };

  const renvoyer = async () => {
    const c = await sb(), m = user?.new_email;
    if (!c || !m) return;
    const { error } = await c.auth.updateUser({ email: m });
    setMsg(error ? { t: messageErreur(error) } : { t: "Nouveau code envoyé à " + m + ".", ok: true });
  };

  const effacer = async () => {
    const quoi: string[] = [];
    if (etat.FINI || etat.PLAN) quoi.push("ton cycle de huit semaines et tes réponses");
    if (etat.SEANCES.length) quoi.push(`${etat.SEANCES.length} séance${etat.SEANCES.length > 1 ? "s" : ""} composée${etat.SEANCES.length > 1 ? "s" : ""}`);
    if (Object.keys(etat.LOG).length) quoi.push("toutes tes charges enregistrées");
    if (adresse) quoi.push("le rattachement de " + adresse);
    if (!quoi.length) quoi.push("le peu qui est enregistré");
    if (await confirmer({ titre: "Tout effacer ?", texte: "Ce qui disparaît :\n· " + quoi.join("\n· ") + "\n\nIci comme sur le serveur, et c'est définitif.", ok: "Tout effacer", danger: true }))
      await toutEffacer();
  };

  /* Quitter ce compte sans rien perdre ; un compte sans adresse, lui, serait perdu. */
  const changer = async () => {
    const ok = adresse
      ? await confirmer({
          titre: "Changer de compte ?",
          texte: `Tes données restent sur le compte ${adresse}. Pour y revenir, il suffira de saisir cette adresse et le code reçu par e-mail.`,
          ok: "Changer de compte",
        })
      : user
        ? await confirmer({
            titre: "Ce compte n'a pas d'adresse e-mail",
            texte: "Si tu le quittes maintenant, il sera impossible de le retrouver, avec tout ce qu'il contient : cycle, séances, charges.\n\nRattache d'abord une adresse ci-dessus pour pouvoir y revenir.",
            ok: "Le quitter quand même", danger: true,
          })
        : await confirmer({
            titre: "Changer de compte ?",
            texte: "Ce qui est sur ce téléphone n'est rattaché à aucun compte : ce sera effacé.",
            ok: "Effacer et changer", danger: true,
          });
    if (!ok) return;
    await changerDeCompte();
    router.replace("/bienvenue?recup=1", ARRIERE);
  };
  const plan = etat.FINI || !!etat.PLAN;

  return (
    <>
      <EnTete titre="Profil" />
      <div className="flex flex-col gap-6 px-4">
        {/* identité */}
        <div className="flex items-center gap-4 rounded-[22px] bg-card p-4">
          <span className="grid size-14 shrink-0 place-items-center rounded-full bg-plate text-[22px] font-bold text-plate-foreground">
            {(pseudo || "?").slice(0, 1).toUpperCase()}
          </span>
          <div className="min-w-0 flex-1">
            <div className="truncate text-[18px] font-semibold">{pseudo || "Toi"}</div>
            <div className="truncate text-[13.5px] text-muted-foreground">{adresse || "Aucune adresse rattachée"}</div>
          </div>
          <span className={cn("flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[12px] font-medium", sync ? "bg-success-soft text-success" : "bg-muted text-muted-foreground")}>
            {sync ? <CheckCircleIcon className="size-3.5" /> : <CloudSlashIcon className="size-3.5" />}
            {sync ? "Synchronisé" : "Local"}
          </span>
        </div>

        {/* programme */}
        <section>
          <h2 className="eyebrow mb-2 px-1">Mon programme</h2>
          <div className="overflow-hidden rounded-[22px] bg-card">
            {plan && recap(etat).filter(([k]) => ["Objectif", "Séances", "Matériel"].includes(k)).map(([k, v]) => (
              <div key={k} className="flex items-baseline justify-between gap-4 border-b border-border/60 px-4 py-3 text-[14.5px]">
                <span className="text-muted-foreground">{k}</span>
                <span className="text-right font-medium">{v}</span>
              </div>
            ))}
            <div className="border-b border-border/60 px-4 py-3">
              <div className="mb-2 text-[14.5px] text-muted-foreground">Zones à ménager</div>
              <ReglageZones />
            </div>
            <Ligne onClick={() => router.push("/questionnaire", AVANT)}>{plan ? "Modifier mes réponses" : "Construire mon programme"}</Ligne>
          </div>
          {plan && <p className="mt-2 px-1 text-[12.5px] text-muted-foreground">Le détail du programme est dans Entraînement › Programme.</p>}
        </section>

        {/* adresse e-mail */}
        <section>
          <h2 className="eyebrow mb-2 px-1">Compte</h2>
          <div className="rounded-[22px] bg-card p-4">
            {attente && (
              <div className="mb-4">
                <p className="text-[14px] leading-relaxed">
                  Un code à six chiffres a été envoyé à <b className="font-semibold">{attente}</b>. Pense à regarder tes indésirables.
                </p>
                <Input
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  onKeyDown={(e) => e.key === "Enter" && confirmerCode()}
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  placeholder="000000"
                  aria-label="Code à six chiffres"
                  className="num mt-3 h-14 rounded-2xl text-center text-[30px] font-bold tracking-[0.4em]"
                />
                <div className="mt-2 flex gap-2">
                  <Button variant="plate" size="lg" className="flex-1 rounded-xl" disabled={occupe} onClick={confirmerCode}>Confirmer l&apos;adresse</Button>
                  <Button variant="soft" size="lg" className="rounded-xl" onClick={renvoyer}>Renvoyer</Button>
                </div>
              </div>
            )}
            <p className="text-[14px] leading-relaxed text-muted-foreground">
              {adresse
                ? "Sur un autre téléphone ou un ordinateur, touche « J'ai déjà un compte » et saisis cette adresse : un code te rendra tout ce que tu vois ici."
                : "Sans adresse, ton compte ne vit que sur cet appareil : changer de téléphone te ferait tout perdre. Elle sert uniquement à retrouver ton compte, sans mot de passe."}
            </p>
            <div className="mt-3 flex gap-2">
              <div className="relative flex-1">
                <EnvelopeIcon className="absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="email" inputMode="email" autoComplete="email" autoCapitalize="off" spellCheck={false}
                  value={mail} onChange={(e) => setMail(e.target.value)} onKeyDown={(e) => e.key === "Enter" && lier()}
                  placeholder={attente ? "Une autre adresse" : "prenom@exemple.fr"} className="h-11 rounded-xl pl-10"
                />
              </div>
              <Button size="lg" className="h-11 rounded-xl" disabled={occupe || !mail} onClick={lier}>{adresse ? "Changer" : "Rattacher"}</Button>
            </div>
            {msg && <p className={cn("mt-2 text-[13px]", msg.ok ? "text-success" : "text-destructive")}>{msg.t}</p>}
          </div>
          <div className="mt-2 overflow-hidden rounded-[22px] bg-card">
            <Ligne onClick={changer} icone={<ArrowsLeftRightIcon className="size-5" />}>Changer de compte</Ligne>
          </div>
        </section>

        {/* cycle menstruel (facultatif, données locales) */}
        {(etat.A.sexe === 1 || cycleActif) && (
          <section>
            <h2 className="eyebrow mb-2 px-1">Cycle menstruel</h2>
            <ReglageCycle />
          </section>
        )}

        {/* apparence */}
        <section>
          <h2 className="eyebrow mb-2 px-1">Apparence</h2>
          <Segmente
            label="Apparence"
            valeur={(theme as "system" | "light" | "dark") || "system"}
            onChange={setTheme}
            options={[{ v: "system", n: "Automatique" }, { v: "light", n: "Clair" }, { v: "dark", n: "Sombre" }]}
          />
          <p className="mt-2 px-1 text-[12.5px] text-muted-foreground">Automatique suit le réglage clair ou sombre de ton téléphone.</p>
        </section>

        {/* crédits */}
        <section>
          <h2 className="eyebrow mb-2 px-1">Crédits</h2>
          <div className="overflow-hidden rounded-[22px] border border-border/80 bg-card">
            {CREDITS.map((c) => (
              <a key={c.quoi} href={c.lien} target="_blank" rel="noreferrer" className="flex items-center gap-3 border-b border-border/70 px-4 py-3 last:border-b-0 active:bg-muted">
                <span className="min-w-0 flex-1">
                  <span className="block text-[12px] font-medium text-muted-foreground">{c.quoi}</span>
                  <span className="block truncate text-[14.5px] font-medium">{c.nom}</span>
                </span>
                <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">{c.licence}</span>
              </a>
            ))}
          </div>
        </section>

        {/* zone sensible */}
        <section>
          <div className="rounded-[22px] border border-destructive/30 bg-card p-4">
            <div className="flex items-center gap-2 text-[15px] font-semibold"><ShieldWarningIcon className="size-4 text-destructive" />Tout effacer et recommencer</div>
            <p className="mt-1 text-[13.5px] leading-relaxed text-muted-foreground">
              Ton cycle, tes séances composées, tes charges et tes réponses au questionnaire. Rien n&apos;est conservé, ni ici ni sur le serveur.
            </p>
            <Button variant="destructive" className="mt-3 w-full rounded-xl" onClick={effacer}>Tout effacer</Button>
          </div>
          <p className="mt-4 text-center text-[11.5px] leading-relaxed text-muted-foreground">
            Une seule adresse par compte. Nous ne t&apos;écrirons que pour ça.
          </p>
        </section>
      </div>
    </>
  );
}

function Ligne({ onClick, children, icone }: { onClick: () => void; children: React.ReactNode; icone?: React.ReactNode }) {
  return (
    <button onClick={onClick} className="flex w-full items-center gap-3 px-4 py-3.5 text-left text-[15px] font-medium active:bg-muted">
      {icone && <span className="text-muted-foreground">{icone}</span>}
      <span className="flex-1">{children}</span>
      <CaretRightIcon className="size-4 text-muted-foreground" />
    </button>
  );
}
