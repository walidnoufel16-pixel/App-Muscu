"use client";

/* Page d'accueil des visiteurs sans compte (écran « accueil » de /bienvenue) : la promesse,
   trois arguments illustrés par de vraies captures de l'app (public/img/vitrine, recadrées depuis
   l'app de test), le reste en une liste, et deux appels à commencer. */
import { tr } from "@/lib/i18n";
import { ArrowRightIcon, CheckIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { LogoTuile } from "./logo";

const ARGUMENTS = [
  { img: "corps", t: "Touche tes muscles, ta séance est prête", d: "Le corps se colore selon ce que tu as travaillé cette semaine. Tu choisis, Oxa compose la séance avec ton matériel." },
  { img: "progression", t: "Tes charges montent toutes seules", d: "Toutes tes séries réussies ? La séance suivante te propose +2,5 kg. Trop dur ? On garde la charge." },
  { img: "street", t: "Street workout : ton niveau en 5 minutes", d: "Un test de tractions, pompes, dips et squats te place dans le bon programme, de ta première traction au muscle-up." },
];
const AUSSI = [
  "Repas de la semaine et liste de courses avec ton budget",
  "Préparation de course : 10 km, semi, marathon",
  "Fonctionne hors connexion à la salle",
  "Tes séances sur tous tes appareils",
];

export function Vitrine({ onCommencer, onCompte }: { onCommencer: () => void; onCompte: () => void }) {
  return (
    <div className="-mx-6 -mt-[max(env(safe-area-inset-top),24px)]">
      <header className="overflow-hidden rounded-b-[34px] bg-bandeau px-6 pt-[max(env(safe-area-inset-top),22px)] text-bandeau-foreground">
        <div className="flex items-center gap-2.5 text-[18px] font-bold">
          <LogoTuile className="size-9" />{tr("Oxa")}
          <button onClick={onCompte} className="ml-auto text-[14px] font-semibold opacity-90">{tr("J'ai déjà un compte")}</button>
        </div>
        <h1 className="mt-8 text-[35px] leading-[1.06] font-black tracking-[-0.03em]">{tr("Touche un muscle.")}<span className="block opacity-80">{tr("Ta séance est prête.")}</span></h1>
        <p className="mt-3.5 text-[16.5px] leading-relaxed opacity-90">
          {tr("Quels exercices, combien de séries, quel poids : Oxa décide avec toi, et ajoute du poids quand tu es prêt.")}
        </p>
        <Button size="xl" onClick={onCommencer} className="mt-6 w-full bg-white text-[#0a0a0c] hover:bg-white/90">{tr("Commencer gratuitement")}<ArrowRightIcon /></Button>
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
        <h2 className="mt-1.5 text-[26px] leading-tight font-extrabold tracking-[-0.02em]">{tr("Trois choses que les autres applis ne font pas")}</h2>
        {ARGUMENTS.map((a, i) => (
          <article key={a.img} className="mt-4 overflow-hidden rounded-[24px] bg-card">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={`/img/vitrine/${a.img}.avif`} alt="" loading="lazy" className="aspect-[1170/710] w-full bg-muted object-cover" />
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

      <section className="mx-6 mt-8 rounded-[28px] bg-[#0f1218] px-5.5 py-6.5 text-white">
        <h2 className="text-[26px] leading-tight font-extrabold tracking-[-0.02em]">{tr("Ta première séance dans 2 minutes.")}</h2>
        <p className="mt-2 text-[15px] opacity-75">{tr("Sans carte bancaire, sans pub.")}</p>
        <Button variant="plate" size="xl" onClick={onCommencer} className="mt-5 w-full">{tr("Commencer gratuitement")}<ArrowRightIcon /></Button>
      </section>
      <p className="pt-5 pb-2 text-center text-[12.5px] text-muted-foreground">{tr("Oxa · gratuit, sans publicité")}</p>
    </div>
  );
}
