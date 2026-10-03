"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, CalendarRange, ChevronLeft, Dumbbell, Share2, Sparkles, WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { messageErreur, sb, valideMail } from "@/lib/supabase";
import { useRepere } from "@/lib/store";
import { cn } from "@/lib/utils";

type Etape = "accueil" | "compte" | "choix" | "recup" | "code";

/* Barre chargée : la signature visuelle de Repère. */
function Barre() {
  return (
    <svg viewBox="30 140 452 232" className="w-full max-w-[300px]" role="img" aria-label="Barre chargée">
      <rect x="40" y="244" width="432" height="24" rx="12" className="fill-foreground/25" />
      <rect x="96" y="150" width="46" height="212" rx="12" className="fill-foreground" />
      <rect x="150" y="176" width="36" height="160" rx="10" className="fill-plate" />
      <rect x="194" y="226" width="16" height="60" rx="5" className="fill-foreground/40" />
      <rect x="370" y="150" width="46" height="212" rx="12" className="fill-foreground" />
      <rect x="326" y="176" width="36" height="160" rx="10" className="fill-plate" />
      <rect x="302" y="226" width="16" height="60" rx="5" className="fill-foreground/40" />
    </svg>
  );
}

function Bienvenue() {
  const router = useRouter();
  const recup = useSearchParams().get("recup");
  const { user, creerCompte, setUser, apresConnexion } = useRepere();
  const [etape, setEtape] = useState<Etape>(recup ? "recup" : user ? "choix" : "accueil");
  const [pseudo, setPseudo] = useState(() => (typeof window !== "undefined" && localStorage.getItem("palier.pseudo.v1")) || "");
  const [mail, setMail] = useState("");
  const [code, setCode] = useState("");
  const [err, setErr] = useState("");
  const [occupe, setOccupe] = useState(false);

  const creer = async () => {
    const p = pseudo.trim(), m = mail.trim().toLowerCase();
    if (p.length < 2) { setErr("Deux caractères au minimum."); return; }
    if (m && !valideMail(m)) { setErr("Cette adresse n'a pas l'air valide. Corrige-la, ou laisse le champ vide."); return; }
    setErr(""); setOccupe(true);
    try {
      const r = await creerCompte(p, m || undefined);
      if (!r.ok) setErr(messageErreur({ message: r.message }, "connexion") + " Tes données resteront sur ce téléphone.");
      else { if (r.message) setErr(r.message); setEtape("choix"); }
    } catch (e) { setErr(messageErreur(e, "connexion")); }
    setOccupe(false);
  };

  const demanderCode = async () => {
    const m = mail.trim().toLowerCase(), c = sb();
    if (!valideMail(m)) { setErr("Cette adresse n'a pas l'air valide."); return; }
    if (!c) { setErr("Pas de connexion au serveur : impossible pour l'instant."); return; }
    setErr(""); setOccupe(true);
    const { error } = await c.auth.signInWithOtp({ email: m, options: { shouldCreateUser: false } });
    setOccupe(false);
    if (error) setErr(messageErreur(error, "recup"));
    else setEtape("code");
  };

  const validerCode = async () => {
    const k = code.replace(/\D/g, ""), c = sb();
    if (!c) return;
    if (k.length !== 6) { setErr("Le code fait six chiffres."); return; }
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
      {etape !== "accueil" && etape !== "choix" && (
        <button onClick={() => { setErr(""); setEtape(etape === "code" ? "recup" : "accueil"); }} className="-ml-1 flex items-center gap-0.5 self-start py-2 text-[15px] font-medium text-muted-foreground">
          <ChevronLeft className="size-5" />Retour
        </button>
      )}

      {etape === "accueil" && (
        <>
          <div className="mt-6 flex flex-1 flex-col">
            <div className="eyebrow">Musculation · piloté à l&apos;effort</div>
            <h1 className="mt-2 text-[56px] leading-[.95] font-bold tracking-[-0.04em]">Repère</h1>
            <p className="mt-3 text-[19px] leading-snug font-medium">Ton point de repère à la salle.</p>
            <div className="my-8 flex justify-center"><Barre /></div>
            <ul className="flex flex-col gap-3.5">
              {[
                [CalendarRange, "Un plan sur huit semaines", "Un effort qui monte chaque semaine"],
                [Sparkles, "Des séances sur mesure", "Tu choisis les muscles, Repère compose"],
                [Share2, "Partagées avec tes proches", "Un lien, et ils ont la même séance"],
                [Dumbbell, "231 exercices illustrés", "Classés par muscle et selon ton matériel"],
                [WifiOff, "Fonctionne sans réseau", "Même au sous-sol de ta salle"],
              ].map(([I, t, d]) => {
                const Icone = I as typeof Dumbbell;
                return (
                  <li key={t as string} className="flex items-center gap-3.5">
                    <span className="grid size-10 shrink-0 place-items-center rounded-[12px] bg-card"><Icone className="size-5" /></span>
                    <span><b className="block text-[15px] font-semibold">{t as string}</b><span className="text-[13.5px] text-muted-foreground">{d as string}</span></span>
                  </li>
                );
              })}
            </ul>
          </div>
          <div className="mt-8 flex flex-col gap-2">
            <Button variant="plate" size="xl" onClick={() => setEtape(user ? "choix" : "compte")}>Commencer<ArrowRight /></Button>
            <Button variant="ghost" onClick={() => setEtape("recup")}>J&apos;ai déjà un compte</Button>
          </div>
        </>
      )}

      {etape === "compte" && (
        <Form
          titre="Ton surnom"
          texte="Il sert juste à t'accueillir. Pas de mot de passe : ton compte est créé automatiquement."
          bouton={occupe ? "Création du compte…" : "Créer mon compte"}
          onValider={creer} occupe={occupe} err={err}
        >
          <Input autoFocus value={pseudo} onChange={(e) => setPseudo(e.target.value)} maxLength={24} placeholder="Ton surnom" autoCapitalize="words" className="h-13 rounded-2xl bg-card text-[17px]" />
          <label className="mt-5 block text-[14px] font-medium">Ton adresse e-mail <span className="font-normal text-muted-foreground">— facultatif</span></label>
          <Input type="email" inputMode="email" autoComplete="email" autoCapitalize="off" spellCheck={false} value={mail} onChange={(e) => setMail(e.target.value)} placeholder="prenom@exemple.fr" className="mt-2 h-13 rounded-2xl bg-card text-[17px]" />
          <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">
            Sans adresse, ton compte ne vit que sur ce téléphone. Avec, tu retrouves ton cycle et tes séances partout, grâce à un code reçu par mail. Tu pourras l&apos;ajouter plus tard.
          </p>
        </Form>
      )}

      {etape === "recup" && (
        <Form titre="Retrouver mon compte" texte="Saisis l'adresse rattachée à ton compte : tu recevras un code à six chiffres. Pas de mot de passe à retenir." bouton={occupe ? "Envoi…" : "Recevoir mon code"} onValider={demanderCode} occupe={occupe} err={err}>
          <Input autoFocus type="email" inputMode="email" autoComplete="email" autoCapitalize="off" spellCheck={false} value={mail} onChange={(e) => setMail(e.target.value)} onKeyDown={(e) => e.key === "Enter" && demanderCode()} placeholder="prenom@exemple.fr" className="h-13 rounded-2xl bg-card text-[17px]" />
        </Form>
      )}

      {etape === "code" && (
        <Form titre="Ton code" texte={`Six chiffres viennent d'être envoyés à ${mail}. Il reste valable une heure. Pense à regarder tes indésirables.`} bouton={occupe ? "Vérification…" : "Ouvrir mon compte"} onValider={validerCode} occupe={occupe} err={err}>
          <Input autoFocus value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))} onKeyDown={(e) => e.key === "Enter" && validerCode()} inputMode="numeric" autoComplete="one-time-code" placeholder="000000" aria-label="Code à six chiffres" className="num h-16 rounded-2xl bg-card text-center text-[34px] font-bold tracking-[0.4em]" />
          <p className="mt-3 text-[13px] leading-relaxed text-muted-foreground">En validant, les données de ton compte remplaceront celles de cet appareil. Si le compte est vide, rien ne sera perdu.</p>
        </Form>
      )}

      {etape === "choix" && (
        <div className="mt-6 flex flex-1 flex-col">
          <div className="eyebrow">Par où commencer</div>
          <h1 className="mt-2 text-[34px] leading-[1.05] font-bold tracking-[-0.025em]">Deux façons de t&apos;entraîner</h1>
          <button onClick={() => router.push("/questionnaire/")} className="mt-6 rounded-[24px] bg-foreground p-5 text-left text-background active:scale-[.99]">
            <span className="flex items-center justify-between"><b className="text-[19px] font-semibold">Un plan sur huit semaines</b><span className="num rounded-full bg-plate px-2.5 py-0.5 text-[15px] font-bold text-plate-foreground">8 sem.</span></span>
            <span className="mt-2 block text-[14px] leading-relaxed text-background/75">Une douzaine de questions, puis un cycle complet qui suit tes charges et fait monter l&apos;effort semaine après semaine. C&apos;est le mode qui te fait progresser.</span>
            <span className="mt-3 block text-[13px] font-medium text-plate">Compter trois minutes →</span>
          </button>
          <button onClick={() => router.push("/seances/")} className="mt-3 rounded-[24px] border bg-card p-5 text-left active:scale-[.99]">
            <b className="text-[19px] font-semibold">Une séance à la carte</b>
            <span className="mt-2 block text-[14px] leading-relaxed text-muted-foreground">Tu choisis les muscles, Repère compose, ou tu choisis tes exercices un par un. Aucune question préalable.</span>
            <span className="mt-3 block text-[13px] font-medium">Prêt tout de suite →</span>
          </button>
          <p className="mt-4 text-center text-[12.5px] leading-relaxed text-muted-foreground">Tu pourras passer de l&apos;un à l&apos;autre à tout moment.</p>
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
