"use client";

import { langue, LANGUES, pluriel, tr } from "@/lib/i18n";
import { ReglageCycle, useCycleCharge } from "@/components/repere/cycle";
import { ReglageZones } from "@/components/repere/forme";
import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Route } from "next";
import { prefsDe } from "@/lib/logic/repas";
import { resumePrefs } from "@/components/repere/repas";
import { useTheme } from "next-themes";
import { ArrowsLeftRightIcon, CaretRightIcon, ChartBarIcon, CheckCircleIcon, CloudSlashIcon, EnvelopeIcon, ShieldWarningIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SaisieCodeMail } from "@/components/repere/code-mail";
import { ChoixLangue, useChangerLangue } from "@/components/repere/choix-langue";
import { EnTete } from "@/components/repere/en-tete";
import { Segmente } from "@/components/repere/segmente";
import { confirmer } from "@/components/repere/confirmer";
import { messageErreur, sb, valideMail } from "@/lib/supabase";
import { useRepere } from "@/lib/store";
import { useEstAdmin } from "@/lib/admin";
import { CREDITS } from "@/lib/medias";
import { ARRIERE, AVANT } from "@/lib/nav";
import { recap } from "@/lib/logic/questionnaire";
import { useProgrammeActif } from "@/lib/fonctionnalites";
import { MonMateriel } from "@/components/repere/mon-materiel";
import { cn } from "@/lib/utils";

export default function PageProfil() {
  const router = useRouter();
  const prog = useProgrammeActif();
  const { user, pseudo, sync, etat, muter, setUser, pousser, toutEffacer, changerDeCompte } = useRepere();
  const { theme, setTheme } = useTheme();
  const changerLangue = useChangerLangue();
  const cycleActif = !!useCycleCharge()?.actif;
  const admin = useEstAdmin();
  const [mail, setMail] = useState("");
  const [msg, setMsg] = useState<{ t: string; ok?: boolean } | null>(null);
  const [occupe, setOccupe] = useState(false);
  const adresse = user?.email, attente = user?.new_email;

  const lier = async () => {
    const m = mail.trim().toLowerCase();
    setMsg(null);
    if (!valideMail(m)) { setMsg({ t: tr("Cette adresse n'a pas l'air valide.") }); return; }
    const c = await sb();
    if (!c || !user) { setMsg({ t: tr("Pas de connexion au serveur : impossible pour l'instant.") }); return; }
    if (adresse === m) { setMsg({ t: tr("C'est déjà l'adresse de ce compte.") }); return; }
    setOccupe(true);
    try {
      await pousser(); // rien ne doit se perdre
      const { data, error } = await c.auth.updateUser({ email: m });
      if (error) throw error;
      setUser(data.user ? { ...data.user, new_email: data.user.new_email || m } : { ...user, new_email: m });
      setMail("");
      setMsg({ t: tr("Code envoyé à ") + m + ".", ok: true });
    } catch (e) { setMsg({ t: messageErreur(e, "lier") }); }
    setOccupe(false);
  };

  const effacer = async () => {
    const quoi: string[] = [];
    if (etat.FINI || etat.PLAN) quoi.push(tr("ton cycle de huit semaines et tes réponses"));
    if (etat.SEANCES.length) quoi.push(tr("{length} séance{a} composée{a1}", { length: etat.SEANCES.length, a: pluriel(etat.SEANCES.length) ? "s" : "", a1: pluriel(etat.SEANCES.length) ? "s" : "" }));
    if (Object.keys(etat.LOG).length) quoi.push(tr("toutes tes charges enregistrées"));
    if (adresse) quoi.push(tr("le rattachement de ") + adresse);
    if (!quoi.length) quoi.push(tr("le peu qui est enregistré"));
    if (await confirmer({ titre: tr("Tout effacer ?"), texte: tr("Ce qui disparaît :\n· ") + quoi.join("\n· ") + tr("\n\nIci comme sur le serveur, et c'est définitif."), ok: tr("Tout effacer"), danger: true }))
      await toutEffacer();
  };

  /* Quitter ce compte sans rien perdre ; un compte sans adresse, lui, serait perdu. */
  const changer = async () => {
    const ok = adresse
      ? await confirmer({
          titre: tr("Changer de compte ?"),
          texte: tr("Tes données restent sur le compte {adresse}. Pour y revenir, il suffira de saisir cette adresse et le code reçu par e-mail.", { adresse }),
          ok: tr("Changer de compte"),
        })
      : user
        ? await confirmer({
            titre: tr("Ce compte n'a pas d'adresse e-mail"),
            texte: tr("Si tu le quittes maintenant, il sera impossible de le retrouver, avec tout ce qu'il contient : cycle, séances, charges.\n\nRattache d'abord une adresse ci-dessus pour pouvoir y revenir."),
            ok: tr("Le quitter quand même"), danger: true,
          })
        : await confirmer({
            titre: tr("Changer de compte ?"),
            texte: tr("Ce qui est sur ce téléphone n'est rattaché à aucun compte : ce sera effacé."),
            ok: tr("Effacer et changer"), danger: true,
          });
    if (!ok) return;
    await changerDeCompte();
    router.replace("/bienvenue?recup=1", ARRIERE);
  };
  const plan = etat.FINI || !!etat.PLAN;

  return (
    <>
      <EnTete surtitre={tr("Profil")} titre={tr("Compte et réglages")} actions={<ChoixLangue />} />
      <div className="flex flex-col gap-6 px-4">
        {/* identité */}
        <div className="flex items-center gap-4 rounded-[22px] bg-card p-4">
          <span className="grid size-14 shrink-0 place-items-center rounded-full bg-plate text-[22px] font-bold text-plate-foreground">
            {(pseudo || "?").slice(0, 1).toUpperCase()}
          </span>
          <div className="min-w-0 flex-1">
            <div className="truncate text-[18px] font-semibold">{pseudo || tr("Toi")}</div>
            <div className="truncate text-[13.5px] text-muted-foreground">{adresse || tr("Aucune adresse rattachée")}</div>
          </div>
          <span className={cn("flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[12px] font-medium", sync ? "bg-success-soft text-success" : "bg-muted text-muted-foreground")}>
            {sync ? <CheckCircleIcon className="size-3.5" /> : <CloudSlashIcon className="size-3.5" />}
            {sync ? tr("Synchronisé") : tr("Local")}
          </span>
        </div>

        {/* programme */}
        <section>
          <h2 className="eyebrow mb-2 px-1">{tr("Mon programme")}</h2>
          <div className="overflow-hidden rounded-[22px] bg-card">
            {plan && prog && recap(etat).filter(([k]) => [tr("Objectif"), tr("Séances"), tr("Matériel")].includes(k)).map(([k, v]) => (
              <div key={k} className="flex items-baseline justify-between gap-4 border-b border-border/60 px-4 py-3 text-[14.5px]">
                <span className="text-muted-foreground">{k}</span>
                <span className="text-right font-medium">{v}</span>
              </div>
            ))}
            <div className="border-b border-border/60 px-4 py-3">
              <div className="mb-2 text-[14.5px] text-muted-foreground">{tr("Zones à ménager")}</div>
              <ReglageZones />
            </div>
            {prog ? (
              <Ligne onClick={() => router.push("/questionnaire", AVANT)}>{plan ? tr("Modifier mes réponses") : tr("Construire mon programme")}</Ligne>
            ) : (
              <div aria-disabled="true" className="flex items-center justify-between gap-3 px-4 py-3.5 text-[15px] text-muted-foreground">
                {tr("Programme sur 8 semaines")}
                <span className="rounded-full bg-muted px-2.5 py-1 text-[11.5px] font-semibold">{tr("Bientôt disponible")}</span>
              </div>
            )}
          </div>
          {plan && prog && <p className="mt-2 px-1 text-[12.5px] text-muted-foreground">{tr("Le détail du programme est dans Entraînement › Programme.")}</p>}
        </section>

        {/* adresse e-mail */}
        <section id="compte" className="scroll-mt-20">
          <h2 className="eyebrow mb-2 px-1">{tr("Compte")}</h2>
          <div className="rounded-[22px] bg-card p-4">
            {attente && (
              <div className="mb-4">
                <p className="text-[14px] leading-relaxed">
                  {tr("Un code à six chiffres a été envoyé à")}{" "}<b className="font-semibold">{attente}</b>{tr(". Pense à regarder tes indésirables.")}
                </p>
                <SaisieCodeMail />
              </div>
            )}
            <p className="text-[14px] leading-relaxed text-muted-foreground">
              {adresse
                ? tr("Sur un autre téléphone ou un ordinateur, touche « J'ai déjà un compte » et saisis cette adresse : un code te rendra tout ce que tu vois ici.")
                : tr("Sans adresse, ton compte ne vit que sur cet appareil : changer de téléphone te ferait tout perdre. Elle sert uniquement à retrouver ton compte, sans mot de passe.")}
            </p>
            <div className="mt-3 flex gap-2">
              <div className="relative flex-1">
                <EnvelopeIcon className="absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="email" inputMode="email" autoComplete="email" autoCapitalize="off" spellCheck={false}
                  value={mail} onChange={(e) => setMail(e.target.value)} onKeyDown={(e) => e.key === "Enter" && lier()}
                  placeholder={attente ? tr("Une autre adresse") : tr("prenom@exemple.fr")} className="h-11 rounded-xl pl-10"
                />
              </div>
              <Button size="lg" className="h-11 rounded-xl" disabled={occupe || !mail} onClick={lier}>{adresse ? tr("Changer") : tr("Rattacher")}</Button>
            </div>
            {msg && <p className={cn("mt-2 text-[13px]", msg.ok ? "text-success" : "text-destructive")}>{msg.t}</p>}
          </div>
          <div className="mt-2 overflow-hidden rounded-[22px] bg-card">
            <Ligne onClick={changer} icone={<ArrowsLeftRightIcon className="size-5" />}>{tr("Changer de compte")}</Ligne>
            {admin && <div className="border-t border-border/60"><Ligne onClick={() => router.push("/admin", AVANT)} icone={<ChartBarIcon className="size-5" />}>{tr("Admin")}</Ligne></div>}
          </div>
        </section>

        {/* cycle menstruel (facultatif, données locales) */}
        {(etat.A.sexe === 1 || cycleActif) && (
          <section id="cycle" className="scroll-mt-20">
            <h2 className="eyebrow mb-2 px-1">{tr("Cycle menstruel")}</h2>
            <ReglageCycle />
          </section>
        )}

        {/* matériel : par défaut dans les listes et les séances composées */}
        <section id="materiel" className="scroll-mt-20">
          <h2 className="eyebrow mb-2 px-1">{tr("Mon matériel")}</h2>
          <MonMateriel />
          <p className="mt-2 px-1 text-[12.5px] text-muted-foreground">{tr("Sert de point de départ dans Exercices, « Créer une séance pour moi » et le composeur.")}</p>
        </section>

        {/* repas : régime, allergies… ; rouvre le questionnaire de l'onglet Repas */}
        <section>
          <h2 className="eyebrow mb-2 px-1">{tr("Repas")}</h2>
          <button onClick={() => router.push((prefsDe(etat.A).fait ? "/repas?prefs=1" : "/repas") as Route)} className="flex w-full items-center gap-3 rounded-[18px] bg-card px-4 py-3.5 text-left active:opacity-80">
            <span className="min-w-0 flex-1">
              <span className="block text-[15px] font-medium">{tr("Préférences repas")}</span>
              <span className="block truncate text-[12.5px] text-muted-foreground">{prefsDe(etat.A).fait ? resumePrefs(prefsDe(etat.A)) : tr("À régler dans l'onglet Repas")}</span>
            </span>
            <CaretRightIcon className="size-4 shrink-0 text-muted-foreground" />
          </button>
        </section>

        {/* silhouette du corps : homme ou femme */}
        <section id="reglages" className="scroll-mt-20">
          <h2 className="eyebrow mb-2 px-1">{tr("Silhouette")}</h2>
          <Segmente
            label={tr("Silhouette")}
            valeur={etat.A.sexe === 0 || etat.A.sexe === 1 ? etat.A.sexe : -1}
            onChange={(v) => muter((E) => { E.A.sexe = v; })}
            options={[{ v: 0, n: tr("Homme") }, { v: 1, n: tr("Femme") }]}
          />
          <p className="mt-2 px-1 text-[12.5px] text-muted-foreground">{tr("Le schéma du corps prend ta silhouette. Ton choix sert aussi aux prochains programmes.")}</p>
        </section>

        {/* apparence */}
        <section>
          <h2 className="eyebrow mb-2 px-1">{tr("Apparence")}</h2>
          <Segmente
            label={tr("Apparence")}
            valeur={(theme as "system" | "light" | "dark") || "system"}
            onChange={setTheme}
            options={[{ v: "system", n: tr("Automatique") }, { v: "light", n: tr("Clair") }, { v: "dark", n: tr("Sombre") }]}
          />
          <p className="mt-2 px-1 text-[12.5px] text-muted-foreground">{tr("Automatique suit le réglage clair ou sombre de ton téléphone.")}</p>
        </section>

        {/* langue */}
        <section>
          <h2 className="eyebrow mb-2 px-1">{tr("Langue")}</h2>
          <Segmente
            label={tr("Langue")}
            valeur={langue()}
            onChange={changerLangue}
            options={LANGUES}
          />
        </section>

        {/* confidentialité */}
        <section id="confidentialite" className="scroll-mt-20">
          <h2 className="eyebrow mb-2 px-1">{tr("Confidentialité")}</h2>
          <div className="rounded-[22px] bg-card p-4 text-[13.5px] leading-relaxed text-muted-foreground">
            <p>
              {tr("Sur le serveur sont gardés ton surnom, ton adresse si tu l'as rattachée, tes réponses au questionnaire, ton programme, tes séances et charges, tes sorties de course, et, si tu les notes, ta forme du jour, ton poids et tes protéines.")}
            </p>
            <p className="mt-2">
              {tr("L'éditeur de Repère peut les consulter pour suivre l'usage de l'app et l'améliorer. Elles ne sont ni vendues ni partagées. Le suivi du cycle menstruel ne quitte jamais ce téléphone. « Tout effacer », plus bas, supprime tout, ici comme sur le serveur.")}
            </p>
          </div>
        </section>

        {/* crédits */}
        <section id="credits" className="scroll-mt-20">
          <h2 className="eyebrow mb-2 px-1">{tr("Crédits")}</h2>
          <div className="overflow-hidden rounded-[22px] border border-border/80 bg-card">
            {CREDITS.map((c) => (
              <a key={c.quoi} href={c.lien || undefined} target="_blank" rel="noreferrer" className="flex items-center gap-3 border-b border-border/70 px-4 py-3 last:border-b-0 active:bg-muted">
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
            <div className="flex items-center gap-2 text-[15px] font-semibold"><ShieldWarningIcon className="size-4 text-destructive" />{tr("Tout effacer et recommencer")}</div>
            <p className="mt-1 text-[13.5px] leading-relaxed text-muted-foreground">
              {tr("Ton cycle, tes séances composées, tes charges et tes réponses au questionnaire. Rien n'est conservé, ni ici ni sur le serveur.")}
            </p>
            <Button variant="destructive" className="mt-3 w-full rounded-xl" onClick={effacer}>{tr("Tout effacer")}</Button>
          </div>
          <p className="mt-4 text-center text-[11.5px] leading-relaxed text-muted-foreground">
            {tr("Une seule adresse par compte. Nous ne t'écrirons que pour ça.")}
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
