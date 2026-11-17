"use client";

import { toast } from "sonner";

import { lignesProfil, ProfilSportif } from "@/components/repere/profil-sportif";
import { Retour } from "@/components/repere/retour";
import { tactile } from "@/lib/repos";
import { BLESN, MATN } from "@/lib/data/referentiels";
import type { Route } from "next";
import { langue, LANGUES, pluriel, tr } from "@/lib/i18n";
import { ReglageCycle, useCycleCharge } from "@/components/repere/cycle";
import { ReglageZones } from "@/components/repere/forme";
import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTheme } from "next-themes";
import { ArrowsLeftRightIcon, BandaidsIcon, BarbellIcon, CaretRightIcon, ChartBarIcon, CheckCircleIcon, CloudArrowUpIcon, CloudSlashIcon, EnvelopeIcon, FileTextIcon, GearSixIcon, ListChecksIcon, LockSimpleIcon, MoonStarsIcon, ShieldWarningIcon, UserIcon, WarningIcon } from "@phosphor-icons/react";
import { Drawer, DrawerContent, DrawerDescription, DrawerTitle } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SaisieCodeMail } from "@/components/repere/code-mail";
import { useChangerLangue } from "@/components/repere/choix-langue";
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
import { ReglageRappels } from "@/components/repere/rappels";
import { cn } from "@/lib/utils";

export default function PageProfil() {
  return <Suspense><Profil /></Suspense>;
}

function Profil() {
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
  /* Confidentialité et Crédits s'ouvrent en feuille ; ?voir=… les ouvre depuis le menu */
  const params = useSearchParams();
  const voir = params.get("voir");
  const p0 = params.get("p");
  const page = (PAGES as readonly string[]).includes(p0 ?? "") ? (p0 as Page) : null;
  const lien = voir === "confidentialite" || voir === "credits" ? voir : null;
  const [feuille, setFeuille] = useState<"confidentialite" | "credits" | null>(lien);
  /* un nouveau ?voir=… (depuis le menu, page déjà ouverte) rouvre la feuille demandée */
  const [lienVu, setLienVu] = useState(lien);
  if (lien !== lienVu) { setLienVu(lien); if (lien) setFeuille(lien); }
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
    const gardees = etat.SEANCES.filter((x) => !x.auto).length;
    if (gardees) quoi.push(tr("{length} séance{a} composée{a1}", { length: gardees, a: pluriel(gardees) ? "s" : "", a1: pluriel(gardees) ? "s" : "" }));
    if (Object.keys(etat.LOG).length) quoi.push(tr("toutes tes charges enregistrées"));
    if (adresse) quoi.push(tr("le rattachement de ") + adresse);
    if (!quoi.length) quoi.push(tr("le peu qui est enregistré"));
    if (await confirmer({ titre: tr("Tout effacer ?"), texte: tr("Ce qui disparaît :\n· ") + quoi.join("\n· ") + tr("\n\nIci comme sur le serveur, et c'est définitif."), ok: tr("Tout effacer"), danger: true }) && !(await toutEffacer()))
      toast.error(tr("La suppression n'a pas pu être confirmée par le serveur : rien n'a été effacé. Vérifie ta connexion et réessaie."));
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
  const feuilles = <Feuilles feuille={feuille} setFeuille={setFeuille} />;

  const A = etat.A;
  const lp = lignesProfil(A), faits = lp.filter((l) => l.v).length;
  const zones = (A.blessure || []).filter((i) => i < 4).map((i) => tr(BLESN[i]));
  const avecCycle = A.sexe === 1 || cycleActif;
  const ouvrir = (q: Page) => { tactile(5); router.push(`/profil?p=${q}` as Route, AVANT); };
  const resumeSportif = lp[3].v ?? lp[0].v;

  /* ---------- une rubrique ouverte ---------- */
  if (page) {
    const T: Record<Page, string> = {
      sportif: tr("Profil sportif"), zones: tr("Zones à ménager"), cycle: tr("Cycle menstruel"), materiel: tr("Mon matériel"),
      seances: tr("Mes séances"), reglages: tr("Réglages"), compte: tr("Mon compte"),
    };
    return (
      <>
        <EnTete titre={T[page]} gauche={<Retour repli="/profil" />} />
        <div className="flex flex-col gap-6 px-4">
          {page === "sportif" && <ProfilSportif />}
          {page === "zones" && (
            <section>
              <div className="rounded-[22px] bg-card px-4 py-3"><ReglageZones /></div>
              <p className="mt-2 px-1 text-[12.5px] text-muted-foreground">{tr("Touche une zone fragile : Oxa écarte les mouvements qui la sollicitent.")}</p>
            </section>
          )}
          {page === "cycle" && <section id="cycle"><ReglageCycle /></section>}
          {page === "materiel" && (
            <section id="materiel">
              <MonMateriel />
              <p className="mt-2 px-1 text-[12.5px] text-muted-foreground">{tr("Sert de point de départ dans Exercices, « Créer une séance pour moi » et le composeur.")}</p>
            </section>
          )}
          {page === "seances" && (
            <>
              {/* « Exercice par exercice » : les cases guidées, ou la page blanche (un coach n'en a pas besoin) */}
              <section id="guidee">
                <h3 className="eyebrow mb-2 px-1">{tr("Séance exercice par exercice")}</h3>
                <Segmente label={tr("Séance exercice par exercice")} valeur={A.sansCases ? "blanche" : "cases"} onChange={(v) => muter((E) => { if (v === "blanche") E.A.sansCases = true; else delete E.A.sansCases; })}
                  options={[{ v: "cases", n: tr("Cases guidées") }, { v: "blanche", n: tr("Page blanche") }]} />
                <p className="mt-2 px-1 text-[12.5px] text-muted-foreground">{tr("Cases guidées : Oxa prépare les cases Base, Complément, Isolation selon tes muscles. Page blanche : tu ajoutes tes exercices librement.")}</p>
              </section>
              {/* le programme sur 8 semaines, seulement s'il est ouvert pour ce compte */}
              {prog && (
                <section>
                  <h3 className="eyebrow mb-2 px-1">{`Oxa Plan · ${tr("8 semaines")}`}</h3>
                  <div className="overflow-hidden rounded-[22px] bg-card">
                    {plan && recap(etat).filter(([k]) => [tr("Objectif"), tr("Séances"), tr("Matériel")].includes(k)).map(([k, v]) => (
                      <div key={k} className="flex items-baseline justify-between gap-4 border-b border-border/60 px-4 py-3 text-[14.5px]">
                        <span className="text-muted-foreground">{k}</span>
                        <span className="text-right font-medium">{v}</span>
                      </div>
                    ))}
                    <Ligne onClick={() => router.push("/questionnaire", AVANT)}>{plan ? tr("Modifier mes réponses") : tr("Construire mon programme")}</Ligne>
                  </div>
                </section>
              )}
            </>
          )}
          {page === "reglages" && (
            <>
              {/* rappels après quelques jours sans séance */}
              <section id="rappels" className="scroll-mt-20">
                <h3 className="eyebrow mb-2 px-1">{tr("Rappels")}</h3>
                <ReglageRappels />
              </section>
              {/* apparence et langue, ensemble (« Apparence et langue » dans le menu) */}
              <section id="apparence" className="scroll-mt-20 flex flex-col gap-5">
                <div>
                  <h3 className="eyebrow mb-2 px-1">{tr("Apparence")}</h3>
                  <Segmente
                    label={tr("Apparence")}
                    valeur={(theme as "system" | "light" | "dark") || "system"}
                    onChange={setTheme}
                    options={[{ v: "system", n: tr("Automatique") }, { v: "light", n: tr("Clair") }, { v: "dark", n: tr("Sombre") }]}
                  />
                  <p className="mt-2 px-1 text-[12.5px] text-muted-foreground">{tr("Automatique suit le réglage clair ou sombre de ton téléphone.")}</p>
                </div>
                <div>
                  <h3 className="eyebrow mb-2 px-1">{tr("Langue")}</h3>
                  <Segmente label={tr("Langue")} valeur={langue()} onChange={changerLangue} options={LANGUES} />
                </div>
              </section>
              <section>
                <h3 className="eyebrow mb-2 px-1">{tr("À propos")}</h3>
                <div className="overflow-hidden rounded-[22px] bg-card">
                  <Ligne onClick={() => setFeuille("confidentialite")} icone={<LockSimpleIcon className="size-5" />}>{tr("Confidentialité")}</Ligne>
                  <div className="border-t border-border/60"><Ligne onClick={() => setFeuille("credits")} icone={<FileTextIcon className="size-5" />}>{tr("Crédits")}</Ligne></div>
                  {admin && <div className="border-t border-border/60"><Ligne onClick={() => router.push("/admin", AVANT)} icone={<ChartBarIcon className="size-5" />}>{tr("Admin")}</Ligne></div>}
                </div>
              </section>
            </>
          )}
          {page === "compte" && (
            <>
              <section id="compte">
                {!adresse && (
                  <div className="mb-4 flex items-start gap-2.5 rounded-2xl bg-amber-500/12 px-3.5 py-3 text-[14px] leading-snug">
                    <WarningIcon className="mt-0.5 size-4 shrink-0 text-amber-600 dark:text-amber-300" weight="fill" />
                    <span>{tr("Sans adresse, ton compte ne vit que sur ce téléphone : en changer te ferait tout perdre.")}</span>
                  </div>
                )}
                <h3 className="eyebrow mb-2 px-1">{adresse ? tr("Adresse du compte") : tr("Sauvegarder mon compte")}</h3>
                <div className="rounded-[22px] bg-card p-4">
                  {attente && (
                    <div className="mb-4">
                      <p className="text-[14px] leading-relaxed">
                        {tr("Un code à six chiffres a été envoyé à")}{" "}<b className="font-semibold">{attente}</b>{tr(". Pense à regarder tes indésirables.")}
                      </p>
                      <SaisieCodeMail />
                    </div>
                  )}
                  {adresse && (
                    <>
                      <div className="flex items-center justify-between gap-3">
                        <span className="min-w-0 truncate text-[15.5px] font-semibold">{adresse}</span>
                        <span className={cn("flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-[12px] font-medium", sync ? "bg-success-soft text-success" : "bg-muted text-muted-foreground")}>
                          {sync ? <CheckCircleIcon className="size-3.5" /> : <CloudSlashIcon className="size-3.5" />}
                          {sync ? tr("Synchronisé") : tr("Local")}
                        </span>
                      </div>
                      <p className="mt-2 text-[13.5px] leading-relaxed text-muted-foreground">{tr("Sur un autre téléphone ou un ordinateur, touche « J'ai déjà un compte » et saisis cette adresse : un code te rendra tout ce que tu vois ici.")}</p>
                    </>
                  )}
                  <div className={cn("flex gap-2", adresse && "mt-3")}>
                    <div className="relative flex-1">
                      <EnvelopeIcon className="absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        type="email" inputMode="email" autoComplete="email" autoCapitalize="off" spellCheck={false}
                        value={mail} onChange={(e) => setMail(e.target.value)} onKeyDown={(e) => e.key === "Enter" && lier()}
                        placeholder={attente || adresse ? tr("Une autre adresse") : tr("prenom@exemple.fr")} className="h-11 rounded-xl pl-10"
                      />
                    </div>
                    <Button size="lg" className="h-11 rounded-xl" disabled={occupe || !mail} onClick={lier}>{adresse ? tr("Changer") : tr("Rattacher")}</Button>
                  </div>
                  {msg && <p className={cn("mt-2 text-[13px]", msg.ok ? "text-success" : "text-destructive")}>{msg.t}</p>}
                  <p className="mt-3 text-[12px] text-muted-foreground">{tr("Un code arrive par e-mail, sans mot de passe. Une seule adresse par compte, et on ne t'écrit que pour ça.")}</p>
                </div>
                <div className="mt-2 overflow-hidden rounded-[22px] bg-card">
                  <Ligne onClick={changer} icone={<ArrowsLeftRightIcon className="size-5" />}>{tr("Changer de compte")}</Ligne>
                </div>
              </section>
              {/* zone sensible, tout en bas */}
              <section className="mt-6">
                <div className="overflow-hidden rounded-[22px] bg-card">
                  <button onClick={effacer} className="flex w-full items-center gap-3 px-4 py-3.5 text-left text-[15px] font-medium text-destructive active:bg-muted">
                    <ShieldWarningIcon className="size-5" />
                    <span className="flex-1">{tr("Tout effacer et recommencer")}</span>
                  </button>
                </div>
                <p className="mt-2 px-1 text-[12.5px] leading-snug text-muted-foreground">{tr("Ton cycle, tes séances composées, tes charges et tes réponses au questionnaire. Rien n'est conservé, ni ici ni sur le serveur.")}</p>
              </section>
            </>
          )}
        </div>
        {feuilles}
      </>
    );
  }

  /* ---------- le sommaire ---------- */
  return (
    <>
      <EnTete surtitre={tr("Compte et réglages")} titre={tr("Profil")} />
      <div className="flex flex-col gap-3.5 px-4">
        <div className="overflow-hidden rounded-[22px] bg-card">
          <div className="flex items-center gap-3.5 px-4 py-3.5">
            <span className="grid size-13 shrink-0 place-items-center rounded-full bg-plate text-[21px] font-bold text-plate-foreground">
              {(pseudo || "?").slice(0, 1).toUpperCase()}
            </span>
            <div className="min-w-0 flex-1">
              <div className="truncate text-[18px] font-semibold">{pseudo || tr("Toi")}</div>
              <div className="text-[13px] text-muted-foreground">{tr("Profil complété · {n} sur {t}", { n: faits, t: lp.length })}</div>
              <span className="mt-1.5 block h-1.5 overflow-hidden rounded-full bg-muted"><i className="block h-full rounded-full bg-plate" style={{ width: `${(faits / lp.length) * 100}%` }} /></span>
            </div>
          </div>
          {faits < lp.length && (
            <button onClick={() => ouvrir("sportif")} className="flex w-full items-center gap-3 border-t border-border/60 px-4 py-2.5 text-left active:bg-muted">
              <span className="flex-1 text-[15px] font-semibold text-plate-ink dark:text-plate">{tr("Compléter mon profil")}</span>
              <span className="text-[13.5px] text-muted-foreground">{tr("{n} réponse{s}", { n: lp.length - faits, s: pluriel(lp.length - faits) ? "s" : "" })}</span>
              <CaretRightIcon className="size-3.5 text-muted-foreground" />
            </button>
          )}
          {!adresse && (
            <button onClick={() => ouvrir("compte")} className="flex w-full items-center gap-2 border-t border-border/60 px-4 py-2.5 text-left active:bg-muted">
              <span aria-hidden className="size-2 rounded-full bg-amber-500" />
              <span className="flex-1 text-[15px] font-semibold text-amber-700 dark:text-amber-300">{tr("Sauvegarder mon compte")}</span>
              <CaretRightIcon className="size-3.5 text-muted-foreground" />
            </button>
          )}
        </div>

        <Rubriques titre={tr("Moi")} l={[
          { k: "sportif", n: tr("Profil sportif"), v: resumeSportif, fond: "#5e5ce6", icone: <UserIcon className="size-4" weight="bold" /> },
          { k: "zones", n: tr("Zones à ménager"), v: zones.length ? zones.join(", ") : tr("Aucune"), fond: "#e5484d", icone: <BandaidsIcon className="size-4" weight="bold" /> },
          ...(avecCycle ? [{ k: "cycle" as Page, n: tr("Cycle menstruel"), v: cycleActif ? tr("Activé") : tr("Désactivé"), fond: "#c65d92", icone: <MoonStarsIcon className="size-4" weight="bold" /> }] : []),
        ]} ouvrir={ouvrir} />
        <Rubriques titre={tr("Entraînement")} l={[
          { k: "materiel", n: tr("Mon matériel"), v: tr(MATN[A.materiel ?? 0]), fond: "#2f9e6a", icone: <BarbellIcon className="size-4" weight="bold" /> },
          { k: "seances", n: tr("Mes séances"), v: A.sansCases ? tr("Page blanche") : tr("Cases guidées"), fond: "#2b7fd9", icone: <ListChecksIcon className="size-4" weight="bold" /> },
        ]} ouvrir={ouvrir} />
        <Rubriques titre={tr("App")} l={[
          { k: "reglages", n: tr("Réglages"), v: tr("Rappels, langue"), fond: "#f08a24", icone: <GearSixIcon className="size-4" weight="bold" /> },
          { k: "compte", n: tr("Mon compte"), v: adresse ?? null, fond: "#636370", icone: <CloudArrowUpIcon className="size-4" weight="bold" />, alerte: !adresse },
        ]} ouvrir={ouvrir} />
      </div>
      {feuilles}
    </>
  );
}

const PAGES = ["sportif", "zones", "cycle", "materiel", "seances", "reglages", "compte"] as const;
type Page = (typeof PAGES)[number];

/* Un groupe du sommaire : chaque ligne ouvre sa rubrique, avec son réglage actuel à droite. */
function Rubriques({ titre, l, ouvrir }: { titre: string; l: { k: Page; n: string; v: string | null; fond: string; icone: React.ReactNode; alerte?: boolean }[]; ouvrir: (k: Page) => void }) {
  return (
    <section aria-label={titre}>
      <h2 className="eyebrow mb-1.5 px-1">{titre}</h2>
      <div className="overflow-hidden rounded-[18px] bg-card">
        {l.map((x) => (
          <button key={x.k} onClick={() => ouvrir(x.k)} className="flex w-full items-center gap-3 border-b border-border/70 px-3.5 py-2.5 text-left last:border-b-0 active:bg-muted">
            <span className="grid size-7 shrink-0 place-items-center rounded-lg text-white" style={{ background: x.fond }}>{x.icone}</span>
            <span className="shrink-0 text-[15px]">{x.n}</span>
            <span className={cn("ml-auto min-w-0 truncate text-right text-[14px]", x.alerte ? "font-semibold text-amber-700 dark:text-amber-300" : x.v ? "text-muted-foreground" : "font-semibold text-plate-ink dark:text-plate")}>
              {x.alerte ? tr("Pas sauvegardé") : x.v ?? tr("À compléter")}
            </span>
            <CaretRightIcon className="size-3.5 shrink-0 text-muted-foreground" />
          </button>
        ))}
      </div>
    </section>
  );
}

function Feuilles({ feuille, setFeuille }: { feuille: "confidentialite" | "credits" | null; setFeuille: (f: "confidentialite" | "credits" | null) => void }) {
  return (
    <>
      <Drawer open={feuille === "confidentialite"} onOpenChange={(o) => !o && setFeuille(null)}>
        <DrawerContent>
          <div className="px-5 pt-3 pb-[max(env(safe-area-inset-bottom),20px)] text-[14px] leading-relaxed text-muted-foreground">
            <DrawerTitle className="mb-3 text-[22px] font-bold text-foreground">{tr("Confidentialité")}</DrawerTitle>
            <DrawerDescription asChild>
              <div>
                <p>{tr("Sur le serveur sont gardés ton surnom, ton adresse si tu l'as rattachée, tes réponses au questionnaire, ton programme, tes séances et charges, tes sorties de course, et, si tu les notes, ta forme du jour, ton poids et tes protéines.")}</p>
                <p className="mt-2">{tr("L'éditeur d'Oxa peut les consulter pour suivre l'usage de l'app et l'améliorer. Elles ne sont ni vendues ni partagées. Le suivi du cycle menstruel ne quitte jamais ce téléphone. « Tout effacer », dans Mon compte, supprime tout, ici comme sur le serveur.")}</p>
                <p className="mt-2">{tr("Pour savoir quelles rubriques servent et corriger les bugs, l'app note aussi, de façon anonyme, quelques gestes (ouverture, séance terminée, rubrique ouverte…) et les erreurs qui surviennent. Ces notes portent un identifiant tiré au hasard sur ce téléphone, jamais ton compte ni ton adresse, et sont effacées au bout de 13 mois au plus.")}</p>
              </div>
            </DrawerDescription>
          </div>
        </DrawerContent>
      </Drawer>
      <Drawer open={feuille === "credits"} onOpenChange={(o) => !o && setFeuille(null)}>
        <DrawerContent className="max-h-[85dvh]">
          <div className="overflow-y-auto px-4 pt-3 pb-[max(env(safe-area-inset-bottom),20px)]">
            <DrawerTitle className="mb-3 px-1 text-[22px] font-bold">{tr("Crédits")}</DrawerTitle>
            <DrawerDescription className="sr-only">{tr("Crédits")}</DrawerDescription>
            <div className="overflow-hidden rounded-[22px] bg-card">
              {CREDITS.map((c) => (
                <a key={c.quoi + c.nom} href={c.lien || undefined} target="_blank" rel="noreferrer" className="flex items-center gap-3 border-b border-border/70 px-4 py-3 last:border-b-0 active:bg-muted">
                  <span className="min-w-0 flex-1">
                    <span className="block text-[12px] font-medium text-muted-foreground">{c.quoi}</span>
                    <span className="block truncate text-[14.5px] font-medium">{c.nom}</span>
                  </span>
                  <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">{c.licence}</span>
                </a>
              ))}
            </div>
          </div>
        </DrawerContent>
      </Drawer>
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
