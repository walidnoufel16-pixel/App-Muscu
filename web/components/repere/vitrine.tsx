"use client";

/* Page d'accueil des visiteurs sans compte (écran « accueil » de /bienvenue), maquette B validée
   le 14 novembre 2026, passée au mode Suivi le 26 novembre (les nouveaux comptes n'ont que lui ;
   promesses : « Ce que la comm promet », docs/reseaux/README.md) : une grande photo et la promesse,
   puis une séance racontée en quatre temps (tes séances, pendant, ta récupération, les semaines
   suivantes) avec des aperçus de l'app dessinés au design v2, « Pour qui ? », le blog et l'appel à
   commencer. Jamais « coach », ni séance préparée par Oxa. */
import { tr, langue } from "@/lib/i18n";
import { ArrowRightIcon, CheckIcon, NewspaperIcon, PlayIcon } from "@phosphor-icons/react";
import { ARTICLES, texte } from "@/lib/data/blog";
import { nb } from "@/lib/logic/core";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { LogoTuile } from "./logo";
import { Reseaux } from "./reseaux";

/* ---------- aperçus de l'app (décoratifs : le texte de chaque étape dit la même chose) ---------- */

/* « Mes séances » : la prochaine, avec ce qui a été fait la dernière fois */
function CarteSeances() {
  return (
    <div className="flex flex-col gap-2">
      <div className="rounded-[20px] border-2 border-plate bg-[#17171b] p-3">
        <div className="flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/img/grand/seance-jambes.avif" alt="" loading="lazy" className="size-11 rounded-[12px] object-cover" />
          <span className="min-w-0">
            <span className="titre block text-[17px]">{tr("Jambes")}</span>
            <span className="block truncate text-[12.5px] text-[#9d9da7]">{tr("Dernière fois jeudi · squat barre 80 × 10")}</span>
          </span>
        </div>
        <div className="mt-2.5 flex h-10 items-center justify-center gap-1.5 rounded-full bg-plate text-[14px] font-bold text-[#0a0a0c]"><PlayIcon className="size-3.5" weight="fill" />{tr("Commencer")}</div>
      </div>
      <div className="flex items-center gap-3 rounded-[20px] bg-[#17171b] p-3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/img/grand/seance-pecs.avif" alt="" loading="lazy" className="size-10 rounded-[12px] object-cover" />
        <span className="min-w-0">
          <span className="block text-[15px] font-semibold">{tr("Pecs · Épaules · Triceps")}</span>
          <span className="block text-[12.5px] text-[#9d9da7]">{tr("Dernière fois lundi")}</span>
        </span>
      </div>
    </div>
  );
}

function CarteExercice() {
  const champ = "num grid h-[34px] place-items-center rounded-[9px] border-[1.5px] border-[#6a6a74] bg-[#26262d] text-[18px] font-bold";
  return (
    <div className="overflow-hidden rounded-[20px] border-2 border-plate bg-[#17171b]">
      <div className="px-3.5 pt-3 pb-2">
        <div className="text-[10px] font-semibold tracking-[0.1em] text-plate uppercase">{tr("En cours")}</div>
        <div className="titre text-[19px]">{tr("Développé couché barre")}</div>
        <div className="text-[12px] text-[#9d9da7]">{tr("Pectoraux · Triceps")}</div>
      </div>
      <div className="border-t border-[#303038] px-3 pt-2.5 pb-3">
        <div className="text-[13px] font-semibold text-plate">ⓘ {tr("Pourquoi {v} kg ?", { v: nb(32.5) })}</div>
        <p className="mt-0.5 mb-2 text-[12px] leading-snug text-[#9d9da7]">{tr("12 répétitions réussies sur toutes tes séries la dernière fois : on ajoute 2,5 kg.")}</p>
        <div className="flex flex-col gap-1.5">
          {[true, true, false].map((ok, i) => (
            <div key={i} className={cn("grid grid-cols-[18px_1fr_64px_52px_36px] items-center gap-2 rounded-[10px] px-1.5 py-1", ok && "bg-plate/15")}>
              <span className="num text-[16px] font-bold">{i + 1}</span>
              <span className="num text-[15px] text-[#9d9da7]">30 × 10</span>
              <span className={champ}>{nb(32.5)}</span>
              <span className={champ}>8</span>
              {ok ? <span className="grid size-9 place-items-center rounded-full bg-plate text-[#0a0a0c]"><CheckIcon className="size-4" weight="bold" /></span> : <span className="size-9 rounded-full border-2 border-[#9d9da7]" />}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function BarreValider() {
  return (
    <div className="flex items-center gap-2.5 rounded-[22px] border border-[#303038] bg-[#26262d] py-2.5 pr-2.5 pl-4">
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[11.5px] text-[#f5f5f7]/70">{tr("Série {a}/{b}", { a: 3, b: 3 })} · {tr("Développé couché barre")}</span>
        <span className="num block text-[24px] leading-tight font-bold">{nb(32.5)} kg × 8</span>
      </span>
      <span className="flex h-[46px] items-center gap-1 rounded-full bg-plate px-4.5 text-[15px] font-bold text-[#0a0a0c]"><CheckIcon className="size-4" weight="bold" />{tr("Valider")}</span>
    </div>
  );
}

/* La récupération, muscle par muscle, d'après les séances notées */
function Recuperation() {
  const p = (t: string, ok: boolean) => (
    <span key={t} className={cn("flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[12.5px] font-semibold", ok ? "bg-plate/15 text-plate" : "bg-[#3a2410] text-[#fb923c]")}>
      <i className="size-2 rounded-full bg-current" />{t}
    </span>
  );
  return (
    <div className="rounded-[18px] border border-[#303038] bg-[#17171b] p-3">
      <div className="text-[10.5px] font-semibold tracking-[0.08em] text-[#9d9da7] uppercase">{tr("Récupération")}</div>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {[p(tr("Pecs · prêt"), true), p(tr("Dos · prêt"), true), p(tr("Quadriceps · demain"), false)]}
      </div>
    </div>
  );
}

/* Un vrai exemple de progression (compte d'un utilisateur d'Oxa, anonyme, avec son accord). */
function Progression() {
  return (
    <div className="rounded-[18px] border border-[#303038] bg-[#17171b] p-3.5">
      <div className="text-[10.5px] font-semibold tracking-[0.08em] text-[#9d9da7] uppercase">{tr("Un utilisateur d'Oxa, pour de vrai")}</div>
      <div className="titre mt-0.5 text-[16px]">{tr("Rowing buste appuyé haltères")}</div>
      <div className="mt-2 flex items-center gap-2.5 text-center">
        <span className="flex-1">
          <span className="block text-[10.5px] font-semibold tracking-[0.08em] text-[#9d9da7] uppercase">{tr("3 nov.")}</span>
          <span className="num block text-[24px] font-bold">10 kg × 10</span>
        </span>
        <ArrowRightIcon className="size-5 text-plate" weight="bold" />
        <span className="flex-1">
          <span className="block text-[10.5px] font-semibold tracking-[0.08em] text-plate uppercase">{tr("14 nov.")}</span>
          <span className="num block text-[24px] font-bold text-plate">12 kg × 11</span>
        </span>
      </div>
      <p className="mt-1.5 text-center text-[12px] text-[#9d9da7]">{tr("+2 kg et une répétition de plus, en 11 jours")}</p>
    </div>
  );
}

/* ---------- la page ---------- */

const ETAPES = [
  { quand: "Avant", titre: "Tes séances, comme dans ton carnet", texte: "Écris-les une fois : tes exercices, tes séries, ton repos. Ensuite, « Commencer » et c'est parti.", Visuel: CarteSeances },
  { quand: "Pendant", titre: "Un geste par série", texte: "« Précédent » te rappelle la dernière fois, Oxa te propose la suite : tu valides, ou tu corriges. Le repos se lance seul.", Visuel: () => <div className="flex flex-col gap-2.5"><CarteExercice /><BarreValider /></div> },
  { quand: "Entre deux séances", titre: "Ta récupération, muscle par muscle", texte: "D'après les séances que tu notes : tu sais ce qui est prêt et ce qui récupère encore.", Visuel: Recuperation },
  { quand: "Les semaines suivantes", titre: "Tu progresses", texte: "La courbe de chaque exercice, tes records, tes semaines d'affilée. Un exemple réel :", Visuel: Progression },
];
const POUR_QUI = [
  { t: "Tu as déjà ton programme", d: "Pas de questionnaire : tu notes tes séances, Oxa garde ta charge d'avant, ton max et tes progrès." },
  { t: "Tu débutes", d: "Plus de 250 exercices en photo, avec les bons gestes, et une charge proposée à chaque série." },
  { t: "Tu t'entraînes à plusieurs", d: "Partage ta séance avec un code : ton partenaire la retrouve en un geste." },
];

export function Vitrine({ onCommencer, onCompte }: { onCommencer: () => void; onCompte: () => void }) {
  const en = langue() === "en", blog = en ? "/en/blog/" : "/blog/";
  /* les 3 derniers articles publiés du blog (les guides restent dans /guides) */
  const articles = ARTICLES.filter((a) => a.type === "article").slice(0, 3);
  const lienArticle = (a: (typeof ARTICLES)[number]) => (en ? "/en" : "") + "/blog/" + a.slug + "/";
  return (
    <div className="-mx-6 -mt-[max(env(safe-area-inset-top),24px)] -mb-[max(env(safe-area-inset-bottom),20px)] bg-[#0a0a0c] text-[#f5f5f7]">
      <header className="relative isolate flex min-h-[560px] flex-col px-6 pt-[max(env(safe-area-inset-top),22px)] pb-7">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/img/grand/seance-corps.avif" alt="" className="absolute inset-0 -z-20 size-full object-cover" />
        <span className="absolute inset-0 -z-10 bg-[linear-gradient(180deg,rgba(10,10,12,.55),rgba(10,10,12,.35)_40%,#0a0a0c_98%)]" />
        <div className="flex items-center gap-2.5 text-[18px] font-bold text-white">
          <LogoTuile className="size-9" />{tr("Oxa")}
          <a href={blog} className="ml-auto flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1.5 text-[14px] font-semibold"><NewspaperIcon className="size-4" weight="bold" />{tr("Blog")}</a>
          <button onClick={onCompte} className="text-[14px] font-semibold opacity-90">{tr("Connexion")}</button>
        </div>
        <div className="mt-auto text-white">
          <h1 className="titre text-[40px] leading-none font-extrabold">{tr("Note tes séances.")}<span className="block text-plate">{tr("Oxa garde le fil.")}</span></h1>
          <p className="mt-3 text-[16px] leading-snug opacity-90">{tr("Ta charge d'avant, ton max, ta récup et tes progrès. Et la charge suivante, proposée.")}</p>
          <Button variant="plate" size="xl" onClick={onCommencer} className="mt-5 w-full">{tr("Commencer")}<ArrowRightIcon /></Button>
          <p className="mt-3 text-center text-[14px] font-semibold">{tr("+250 exercices de musculation, chacun en photo")}</p>
          <p className="mt-1 text-center text-[13px] font-medium opacity-80">{tr("Pas d'App Store : ajoute-la à ton écran d'accueil en 2 gestes")}</p>
        </div>
      </header>

      <section className="px-5 pt-4">
        <div className="text-[11.5px] font-semibold tracking-[0.1em] text-[#9d9da7] uppercase">{tr("Une séance avec Oxa")}</div>
        <h2 className="titre mt-1 text-[27px] leading-tight">{tr("Ton carnet de muscu, en mieux")}</h2>
        <ol className="mt-6">
          {ETAPES.map(({ quand, titre, texte: t, Visuel }, i) => (
            <li key={quand} className="relative pb-8 pl-9">
              {i < ETAPES.length - 1 && <span aria-hidden className="absolute top-6 bottom-0 left-[10px] w-0.5 bg-[#303038]" />}
              <span aria-hidden className="absolute top-0 left-0 grid size-[22px] place-items-center rounded-full bg-plate text-[12px] font-extrabold text-[#0a0a0c]">{i + 1}</span>
              <div className="text-[11.5px] font-semibold tracking-[0.1em] text-plate uppercase">{tr(quand)}</div>
              <h3 className="titre mt-0.5 text-[23px] leading-tight">{tr(titre)}</h3>
              <p className="mt-1.5 text-[14.5px] leading-snug text-[#9d9da7]">{tr(t)}</p>
              <div aria-hidden className="mt-3.5"><Visuel /></div>
            </li>
          ))}
        </ol>
      </section>

      <div className="rounded-t-[34px] bg-background px-5 pt-7 pb-[max(env(safe-area-inset-bottom),20px)] text-foreground">
        <div className="eyebrow">{tr("Pour qui ?")}</div>
        <h2 className="titre mt-1 text-[25px] leading-tight">{tr("Débutant ou confirmé")}</h2>
        <div className="mt-3 flex flex-col gap-2.5">
          {POUR_QUI.map((p) => (
            <div key={p.t} className="rounded-[20px] border border-border/80 bg-card px-4 py-3.5">
              <div className="text-[15.5px] font-bold">{tr(p.t)}</div>
              <p className="mt-0.5 text-[14px] leading-snug text-muted-foreground">{tr(p.d)}</p>
            </div>
          ))}
        </div>

        <div className="eyebrow mt-7">{tr("Et aussi")}</div>
        <p className="mt-2 text-[14.5px] leading-relaxed">{tr("Recettes selon tes goûts · street workout, course et Hyrox · partage de séance par code · hors connexion à la salle")}</p>

        {articles.length > 0 && (
          <section className="pt-7">
            <div className="flex items-baseline justify-between">
              <div className="eyebrow">{tr("Le blog Oxa")}</div>
              <a href={blog} className="text-[14px] font-semibold text-plate-ink dark:text-plate">{tr("Tous les articles")}</a>
            </div>
            <div className="mt-3 flex flex-col gap-2.5">
              {articles.map((a) => (
                <a key={a.slug} href={lienArticle(a)} className="flex items-center gap-3 rounded-[20px] bg-card p-2.5 active:scale-[.99]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={a.couverture} alt="" loading="lazy" className="size-[72px] shrink-0 rounded-[14px] bg-muted object-cover" />
                  <span className="min-w-0 flex-1">
                    <span className="text-[11.5px] font-semibold tracking-[0.06em] text-plate-ink uppercase dark:text-plate">{a.categorie}</span>
                    <span className="mt-0.5 line-clamp-2 block text-[15px] leading-snug font-semibold">{texte(a, en ? "en" : "fr")?.titre ?? a.titre}</span>
                  </span>
                </a>
              ))}
            </div>
          </section>
        )}

        <section className="mt-8 rounded-[28px] bg-[#0f1218] px-5.5 py-6.5 text-white">
          <h2 className="titre text-[27px] leading-tight">{tr("Ta prochaine séance, notée en un geste.")}</h2>
          <p className="mt-2 text-[15px] opacity-75">{tr("Pas de questionnaire : écris ta séance, Oxa garde le fil.")}</p>
          <Button variant="plate" size="xl" onClick={onCommencer} className="mt-5 w-full">{tr("Commencer")}<ArrowRightIcon /></Button>
        </section>
        <Reseaux titre={tr("Suis Oxa")} className="mt-8" />
        <p className="pt-4 pb-2 text-center text-[12.5px] text-muted-foreground">
          {tr("Oxa · le suivi de tes séances de muscu")} · <a href={blog} className="font-semibold text-plate-ink underline-offset-2 hover:underline dark:text-plate">{tr("Le blog Oxa")}</a>
        </p>
      </div>
    </div>
  );
}
