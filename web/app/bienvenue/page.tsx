"use client";

import { tr } from "@/lib/i18n";
import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CaretLeftIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { messageErreur, sb, valideMail } from "@/lib/supabase";
import { useRepere } from "@/lib/store";
import { toast } from "sonner";
import { AVANT } from "@/lib/nav";
import { cn } from "@/lib/utils";
import { SaisieCodeMail } from "@/components/repere/code-mail";
import { Vitrine } from "@/components/repere/vitrine";

type Etape = "accueil" | "compte" | "confirmer" | "entrer" | "recup" | "code";

function Bienvenue() {
  const router = useRouter();
  const recup = useSearchParams().get("recup");
  const { user, creerCompte, setUser, apresConnexion } = useRepere();
  const [etape, setEtape] = useState<Etape>(recup ? "recup" : user ? "entrer" : "accueil");
  const [pseudo, setPseudo] = useState(() => (typeof window !== "undefined" && localStorage.getItem("palier.pseudo.v1")) || "");
  const [mail, setMail] = useState("");
  const [code, setCode] = useState("");
  const [err, setErr] = useState("");
  const [occupe, setOccupe] = useState(false);
  /* compte prêt : on arrive directement dans Entraînement, sur les rubriques */
  useEffect(() => { if (etape === "entrer") router.replace("/entrainement", AVANT); }, [etape, router]);

  const creer = async () => {
    const p = pseudo.trim(), m = mail.trim().toLowerCase();
    if (p.length < 2) { setErr(tr("Deux caractères au minimum.")); return; }
    if (m && !valideMail(m)) { setErr(tr("Cette adresse n'a pas l'air valide. Corrige-la, ou laisse le champ vide.")); return; }
    setErr(""); setOccupe(true);
    try {
      const r = await creerCompte(p, m || undefined);
      if (!r.ok) setErr(messageErreur({ message: r.message }, "connexion") + tr(" Tes données resteront sur ce téléphone."));
      else if (r.message) { toast(r.message, { duration: 8000 }); setEtape("entrer"); }
      /* Le code part tout de suite : on le fait saisir ici, pas dans Profil. */
      else setEtape(m && useRepere.getState().user?.new_email ? "confirmer" : "entrer");
    } catch (e) { setErr(messageErreur(e, "connexion")); }
    setOccupe(false);
  };

  const demanderCode = async () => {
    const m = mail.trim().toLowerCase(), c = await sb();
    if (!valideMail(m)) { setErr(tr("Cette adresse n'a pas l'air valide.")); return; }
    if (!c) { setErr(tr("Pas de connexion au serveur : impossible pour l'instant.")); return; }
    setErr(""); setOccupe(true);
    const { error } = await c.auth.signInWithOtp({ email: m, options: { shouldCreateUser: false } });
    setOccupe(false);
    if (error) setErr(messageErreur(error, "recup"));
    else setEtape("code");
  };

  const validerCode = async () => {
    const k = code.replace(/\D/g, ""), c = await sb();
    if (!c) return;
    if (k.length !== 6) { setErr(tr("Le code fait six chiffres.")); return; }
    setErr(""); setOccupe(true);
    /* On ne se déconnecte pas avant : si le code est refusé, la session en cours doit survivre. */
    const { data, error } = await c.auth.verifyOtp({ email: mail.trim().toLowerCase(), token: k, type: "email" });
    if (error || !data.user) { setOccupe(false); setErr(messageErreur(error, "code")); return; }
    setUser(data.user);
    await apresConnexion(true);
    setOccupe(false);
    router.replace("/");
  };

  return (
    <div className="flex min-h-dvh flex-col px-6 pt-[max(env(safe-area-inset-top),24px)] pb-[max(env(safe-area-inset-bottom),20px)]">
      {etape !== "accueil" && etape !== "entrer" && etape !== "confirmer" && (
        <button onClick={() => { setErr(""); setEtape(etape === "code" ? "recup" : "accueil"); }} className="-ml-1 flex items-center gap-0.5 self-start py-2 text-[15px] font-medium text-muted-foreground">
          <CaretLeftIcon className="size-5" />{tr("Retour")}
        </button>
      )}

      {etape === "accueil" && <Vitrine onCommencer={() => setEtape(user ? "entrer" : "compte")} onCompte={() => setEtape("recup")} />}

      {etape === "compte" && (
        <Form
          titre={tr("Ton surnom")}
          texte={tr("Il sert juste à t'accueillir. Pas de mot de passe : ton compte est créé automatiquement.")}
          bouton={occupe ? tr("Création du compte…") : tr("Créer mon compte")}
          onValider={creer} occupe={occupe} err={err}
        >
          <Input autoFocus value={pseudo} onChange={(e) => setPseudo(e.target.value)} maxLength={24} placeholder={tr("Ton surnom")} autoCapitalize="words" className="h-13 rounded-2xl bg-card text-[17px]" />
          <label className="mt-5 block text-[14px] font-medium">{tr("Ton adresse e-mail")}{" "}<span className="font-normal text-muted-foreground">{tr("— facultatif")}</span></label>
          <Input type="email" inputMode="email" autoComplete="email" autoCapitalize="off" spellCheck={false} value={mail} onChange={(e) => setMail(e.target.value)} placeholder={tr("prenom@exemple.fr")} className="mt-2 h-13 rounded-2xl bg-card text-[17px]" />
          <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">
            {tr("Sans adresse, ton compte ne vit que sur ce téléphone. Avec, tu retrouves ton cycle et tes séances partout, grâce à un code reçu par mail. Tu pourras l'ajouter plus tard.")}
          </p>
        </Form>
      )}

      {etape === "recup" && (
        <Form titre={tr("Retrouver mon compte")} texte={tr("Saisis l'adresse rattachée à ton compte : tu recevras un code à six chiffres. Pas de mot de passe à retenir.")} bouton={occupe ? tr("Envoi…") : tr("Recevoir mon code")} onValider={demanderCode} occupe={occupe} err={err}>
          <Input autoFocus type="email" inputMode="email" autoComplete="email" autoCapitalize="off" spellCheck={false} value={mail} onChange={(e) => setMail(e.target.value)} onKeyDown={(e) => e.key === "Enter" && demanderCode()} placeholder={tr("prenom@exemple.fr")} className="h-13 rounded-2xl bg-card text-[17px]" />
        </Form>
      )}

      {etape === "code" && (
        <Form titre={tr("Ton code")} texte={tr("Six chiffres viennent d'être envoyés à {mail}. Il reste valable une heure. Pense à regarder tes indésirables.", { mail })} bouton={occupe ? tr("Vérification…") : tr("Ouvrir mon compte")} onValider={validerCode} occupe={occupe} err={err}>
          <Input autoFocus value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))} onKeyDown={(e) => e.key === "Enter" && validerCode()} inputMode="numeric" autoComplete="one-time-code" placeholder="000000" aria-label={tr("Code à six chiffres")} className="num h-16 rounded-2xl bg-card text-center text-[34px] font-bold tracking-[0.4em]" />
          <p className="mt-3 text-[13px] leading-relaxed text-muted-foreground">{tr("En validant, les données de ton compte remplaceront celles de cet appareil. Si le compte est vide, rien ne sera perdu.")}</p>
        </Form>
      )}

      {etape === "confirmer" && (
        <div className="mt-4 flex flex-1 flex-col">
          <h1 className="text-[34px] leading-[1.05] font-bold tracking-[-0.025em]">{tr("Confirme ton adresse")}</h1>
          <p className="mt-2 mb-6 text-[15px] leading-relaxed text-muted-foreground">
            {tr("Six chiffres viennent d'être envoyés à")}{" "}<b className="font-semibold text-foreground">{user?.new_email}</b>{tr(". Pense à regarder tes indésirables.")}
          </p>
          <SaisieCodeMail grand onConfirme={(u) => { if (!u?.new_email) setEtape("entrer"); }} />
          <div className="mt-auto pt-6">
            <Button variant="ghost" className="w-full" onClick={() => setEtape("entrer")}>{tr("Plus tard")}</Button>
            <p className="mt-1 text-center text-[12.5px] text-muted-foreground">{tr("Le code restera à saisir dans Profil.")}</p>
          </div>
        </div>
      )}

    </div>
  );
}

function Form({ titre, texte, bouton, onValider, occupe, err, children }: { titre: string; texte: string; bouton: string; onValider: () => void; occupe: boolean; err: string; children: React.ReactNode }) {
  return (
    <div className="mt-4 flex flex-1 flex-col">
      <h1 className="text-[34px] leading-[1.05] font-bold tracking-[-0.025em]">{titre}</h1>
      <p className="mt-2 mb-6 text-[15px] leading-relaxed text-muted-foreground">{texte}</p>
      {children}
      <p className={cn("mt-3 min-h-5 text-[13.5px]", err && "text-destructive")}>{err}</p>
      <div className="mt-auto pt-6">
        <Button variant="plate" size="xl" className="w-full" disabled={occupe} onClick={onValider}>{bouton}</Button>
      </div>
    </div>
  );
}

export default function PageBienvenue() {
  return <Suspense><Bienvenue /></Suspense>;
}
