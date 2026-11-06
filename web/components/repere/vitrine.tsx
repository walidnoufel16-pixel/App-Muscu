"use client";

/* Page d'accueil des visiteurs sans compte (écran « accueil » de /bienvenue) : la promesse,
   trois arguments illustrés par de vraies captures de l'app (public/img/vitrine : cartes capturées
   au ras, sur le fond de l'app), le reste en une liste, et deux appels à commencer. */
import { tr, langue } from "@/lib/i18n";
import { ArrowRightIcon, CheckIcon, NewspaperIcon } from "@phosphor-icons/react";
import { ARTICLES, texte } from "@/lib/data/blog";
import { Button } from "@/components/ui/button";
import { LogoTuile } from "./logo";
import { Reseaux } from "./reseaux";

const ARGUMENTS = [
  { img: "recuperation", h: 711, t: "Ta séance du jour, d'après tes muscles", d: "Oxa sait ce qui a récupéré et ce qui a besoin de repos. Il te propose la bonne séance, avec ton matériel." },
  { img: "pourquoi", h: 1386, t: "Un coach qui t'explique chaque charge", d: "+2,5 kg quand tu as réussi, −10 % après une pause : chaque poids proposé vient avec son pourquoi." },
  { img: "bilan", h: 768, t: "Ta semaine en un coup d'œil", d: "Chaque lundi, ton bilan : séances, records, muscles travaillés, et le conseil pour la semaine qui vient." },
];
const AUSSI = [
  "Oxa Plan : un programme de 8 semaines qui progresse avec toi",
  "Street workout : ton niveau en 5 minutes, de la première traction au muscle-up",
  "Course : 10 km, semi, marathon, Hyrox",
  "Repas de la semaine, liste de courses et budget",
  "Fonctionne hors connexion à la salle, sur tous tes appareils",
];

export function Vitrine({ onCommencer, onCompte }: { onCommencer: () => void; onCompte: () => void }) {
  const en = langue() === "en", blog = en ? "/en/blog/" : "/blog/";
  /* les 3 derniers articles publiés du blog (les guides restent dans /guides) */
  const articles = ARTICLES.filter((a) => a.type === "article").slice(0, 3);
  const lienArticle = (a: (typeof ARTICLES)[number]) => (en ? "/en" : "") + "/blog/" + a.slug + "/";
  return (
    <div className="-mx-6 -mt-[max(env(safe-area-inset-top),24px)]">
      <header className="overflow-hidden rounded-b-[34px] bg-bandeau px-6 pt-[max(env(safe-area-inset-top),22px)] text-bandeau-foreground">
        <div className="flex items-center gap-2.5 text-[18px] font-bold">
          <LogoTuile className="size-9" />{tr("Oxa")}
          <a href={blog} className="ml-auto flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1.5 text-[14px] font-semibold"><NewspaperIcon className="size-4" weight="bold" />{tr("Blog")}</a>
          <button onClick={onCompte} className="text-[14px] font-semibold opacity-90">{tr("Connexion")}</button>
        </div>
        <h1 className="mt-8 text-[35px] leading-[1.06] font-black tracking-[-0.03em]">{tr("Touche un muscle.")}<span className="block opacity-80">{tr("Ta séance est prête.")}</span></h1>
        <p className="mt-3.5 text-[16.5px] leading-relaxed opacity-90">
          {tr("Quels exercices, combien de séries, quel poids : Oxa décide avec toi, et ajoute du poids quand tu es prêt.")}
        </p>
        <Button size="xl" onClick={onCommencer} className="mt-6 w-full bg-white text-[#0a0a0c] hover:bg-white/90">{tr("Commencer")}<ArrowRightIcon /></Button>
        <p className="mt-3 text-center text-[13.5px] font-medium opacity-90">{tr("Pas d'App Store : ajoute-la à ton écran d'accueil en 2 gestes")}</p>
        <div className="mt-3.5 flex flex-wrap justify-center gap-1.5">
          {[tr("Salle"), tr("Street workout"), tr("Course"), tr("Repas")].map((b) => <span key={b} className="rounded-full bg-white/15 px-2.5 py-1 text-[12px] font-semibold">{b}</span>)}
        </div>
        <div className="mx-auto mt-6 h-[260px] w-[250px] overflow-hidden rounded-t-[30px] border-[7px] border-b-0 border-[#0b0d12] bg-white">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/img/vitrine/ecran.avif" alt={tr("Le schéma du corps d'Oxa, muscles travaillés cette semaine en bleu")} className="w-full" />
        </div>
      </header>

      <section className="px-6 pt-8">
        <div className="eyebrow">{tr("Comment ça marche")}</div>
        <h2 className="mt-1.5 text-[26px] leading-tight font-extrabold tracking-[-0.02em]">{tr("Un vrai coach, dans ta poche")}</h2>
        {ARGUMENTS.map((a, i) => (
          <article key={a.img} className="mt-4 overflow-hidden rounded-[24px] bg-card">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={`/img/vitrine/${a.img}.avif`} alt="" loading="lazy" width={1170} height={a.h} className="h-auto w-full bg-[#f2f2f4]" />
            <div className="px-4.5 pt-4 pb-4.5">
              <span className="num text-[15px] font-bold tracking-wider text-plate-ink">0{i + 1}</span>
              <h3 className="text-[18px] font-bold">{tr(a.t)}</h3>
              <p className="mt-1 text-[14.5px] leading-relaxed text-muted-foreground">{tr(a.d)}</p>
            </div>
          </article>
        ))}
      </section>

      <section className="px-6 pt-8">
        <div className="eyebrow">{tr("Et aussi")}</div>
        <ul className="mt-3 rounded-[22px] bg-card px-4.5 py-1.5">
          {AUSSI.map((t) => (
            <li key={t} className="flex gap-3 border-b border-border/60 py-3 text-[15px] leading-snug last:border-0">
              <CheckIcon className="mt-0.5 size-4 shrink-0 text-plate" weight="bold" />{tr(t)}
            </li>
          ))}
        </ul>
      </section>

      {articles.length > 0 && (
        <section className="px-6 pt-8">
          <div className="flex items-baseline justify-between">
            <div className="eyebrow">{tr("Le blog Oxa")}</div>
            <a href={blog} className="text-[14px] font-semibold text-plate-ink">{tr("Tous les articles")}</a>
          </div>
          <div className="mt-3 flex flex-col gap-2.5">
            {articles.map((a) => (
              <a key={a.slug} href={lienArticle(a)} className="flex items-center gap-3 rounded-[20px] bg-card p-2.5 active:scale-[.99]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={a.couverture} alt="" loading="lazy" className="size-[72px] shrink-0 rounded-[14px] bg-muted object-cover" />
                <span className="min-w-0 flex-1">
                  <span className="text-[11.5px] font-semibold tracking-[0.06em] text-plate-ink uppercase">{a.categorie}</span>
                  <span className="mt-0.5 line-clamp-2 block text-[15px] leading-snug font-semibold">{texte(a, en ? "en" : "fr")?.titre ?? a.titre}</span>
                </span>
              </a>
            ))}
          </div>
        </section>
      )}

      <section className="mx-6 mt-8 rounded-[28px] bg-[#0f1218] px-5.5 py-6.5 text-white">
        <h2 className="text-[26px] leading-tight font-extrabold tracking-[-0.02em]">{tr("Ta première séance dans 2 minutes.")}</h2>
        <p className="mt-2 text-[15px] opacity-75">{tr("Réponds à 3 questions, Oxa s'occupe du reste.")}</p>
        <Button variant="plate" size="xl" onClick={onCommencer} className="mt-5 w-full">{tr("Commencer")}<ArrowRightIcon /></Button>
      </section>
      <Reseaux titre={tr("Suis Oxa")} className="mt-8" />
      <p className="pt-4 pb-2 text-center text-[12.5px] text-muted-foreground">
        {tr("Oxa · ton coach de poche")} · <a href={blog} className="font-semibold text-plate-ink underline-offset-2 hover:underline">{tr("Le blog Oxa")}</a>
      </p>
    </div>
  );
}
