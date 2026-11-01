/* Pages du blog, communes au français (/blog) et à l'anglais (/en/blog) : rendues au build. */
import type { Metadata } from "next";
import Link from "next/link";
import type { Route } from "next";
import { CaretLeftIcon } from "@phosphor-icons/react/dist/ssr";
import { BILLETS, GUIDES, aLireAussi, adresse, dateTxt, nomCategorie, programme, tempsLecture, texte, type Article, type Langue } from "@/lib/data/blog";
import { ProposerAnglais } from "./anglais";
import { LogoTuile } from "@/components/repere/logo";
import { ListeBlog } from "./liste";

const SITE = (process.env.NEXT_PUBLIC_SITE_URL || "https://repere-soz5.onrender.com").trim();
const T = {
  fr: { titre: "Guides et blog Oxa", sous: "Les guides pour bien démarrer, puis des articles qui s'ajoutent chaque semaine.", guides: "Les guides", guidesSous: "Les essentiels, à lire dans l'ordre que tu veux.", blog: "Le blog", blogSous: "De nouveaux articles chaque semaine.", guide: "Guide", retour: "Guides et blog", autre: "English", autreLien: "/en/blog/", lireAussi: "À lire aussi", ouvrir: "Ouvrir Oxa", fin: "Tes séances, tes charges et ta progression, au même endroit.", photo: "Photo :", sur: "sur Unsplash", min: "min" },
  en: { titre: "Oxa guides and blog", sous: "Guides to get started, then new articles every week.", guides: "Guides", guidesSous: "The essentials, read them in any order.", blog: "Blog", blogSous: "New articles every week.", guide: "Guide", retour: "Guides and blog", autre: "Français", autreLien: "/blog/", lireAussi: "Keep reading", ouvrir: "Open Oxa", fin: "Your sessions, your weights and your progress, in one place.", photo: "Photo:", sur: "on Unsplash", min: "min" },
};

export const metaListe = (l: Langue): Metadata => ({
  title: l === "en" ? "The Oxa blog: strength, calisthenics, running, Hyrox and nutrition" : "Le blog Oxa : muscu, street workout, course, Hyrox et nutrition",
  description: l === "en" ? "Training plans, Hyrox, protein, creatine, hybrid training: practical, evidence-based advice to make progress, by Oxa." : "Programmes, Hyrox, protéines, créatine, entraînement hybride : des conseils concrets et sourcés pour progresser, par Oxa.",
  alternates: { canonical: l === "en" ? "/en/blog/" : "/blog/", languages: { fr: "/blog/", en: "/en/blog/", "x-default": "/blog/" } },
  openGraph: { title: T[l].titre, url: l === "en" ? "/en/blog/" : "/blog/", images: ["/og.jpg"], locale: l === "en" ? "en_GB" : "fr_FR" },
});

const carte = (a: Article, l: Langue) => {
  const t = texte(a, l);
  return { href: adresse(a, l), titre: t.titre, categorie: a.categorie, nomCat: nomCategorie(a.categorie, l), couverture: a.couverture, date: dateTxt(a.date, l), lecture: tempsLecture(a, l) };
};

export function VueListe({ l }: { l: Langue }) {
  const D = T[l];
  return (
    <div lang={l} className="px-5 pt-[max(env(safe-area-inset-top),20px)] pb-12">
      <div className="flex items-center justify-between">
        <Link href={`/?src=blog${l === "en" ? "-en" : ""}` as Route} className="flex items-center gap-2 text-[15px] font-semibold"><LogoTuile className="size-7" />Oxa</Link>
        <Link href={T[l].autreLien as Route} hrefLang={l === "en" ? "fr" : "en"} className="rounded-full bg-muted px-3 py-1.5 text-[13px] font-semibold">{T[l].autre}</Link>
      </div>
      <h1 className="mt-7 text-[32px] leading-[1.06] font-extrabold tracking-[-0.025em]">{T[l].titre}</h1>
      <p className="mt-2 text-[15.5px] leading-relaxed text-muted-foreground">{T[l].sous}</p>
      {/* les guides : les essentiels, fixes, en cartes à faire défiler */}
      <h2 className="mt-7 text-[12px] font-bold tracking-[0.1em] text-muted-foreground uppercase">{D.guides}</h2>
      <p className="mt-0.5 text-[14px] text-muted-foreground">{D.guidesSous}</p>
      <div className="no-scrollbar -mx-5 mt-3 flex snap-x gap-2.5 overflow-x-auto px-5 pb-1">
        {GUIDES.map((g, i) => {
          const c = carte(g, l);
          return (
            <Link key={c.href} href={c.href as Route} className="w-[232px] shrink-0 snap-start overflow-hidden rounded-[20px] bg-card active:opacity-85">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={c.couverture} alt="" loading={i < 2 ? undefined : "lazy"} className="h-[136px] w-full bg-muted object-cover" />
              <div className="px-3.5 pt-2.5 pb-3.5">
                <div className="text-[11.5px] font-bold tracking-[0.06em] text-plate-ink uppercase">{D.guide} {i + 1}</div>
                <h3 className="mt-0.5 text-[15.5px] leading-snug font-bold">{c.titre}</h3>
                <p className="mt-1 text-[12.5px] text-muted-foreground">{c.lecture} {l === "en" ? "min read" : "min de lecture"}</p>
              </div>
            </Link>
          );
        })}
      </div>
      {/* le blog : ce qui s'ajoute avec le temps */}
      <h2 className="mt-8 text-[12px] font-bold tracking-[0.1em] text-muted-foreground uppercase">{D.blog}</h2>
      <p className="mt-0.5 text-[14px] text-muted-foreground">{D.blogSous}</p>
      <ListeBlog articles={BILLETS.map((a) => carte(a, l))} l={l} />
      {l === "fr" && <ProposerAnglais href="/en/blog/" />}
    </div>
  );
}

export function metaArticle(a: Article | undefined, l: Langue): Metadata {
  if (!a) return {};
  const t = texte(a, l);
  return {
    title: t.titre, description: t.description,
    alternates: { canonical: adresse(a, l), languages: { fr: adresse(a, "fr"), en: adresse(a, "en"), "x-default": adresse(a, "fr") } },
    openGraph: { title: t.titre, description: t.description, type: "article", publishedTime: a.date, url: adresse(a, l), locale: l === "en" ? "en_GB" : "fr_FR", images: [a.couverture.startsWith("/") ? a.couverture.replace("/grand/", "/") : a.couverture] },
  };
}

export function VueArticle({ a, l }: { a: Article; l: Langue }) {
  const t = texte(a, l), D = T[l];
  const image = a.couverture.startsWith("/") ? SITE + a.couverture : a.couverture;
  const ld = { "@context": "https://schema.org", "@type": "Article", headline: t.titre, description: t.description, datePublished: a.date, image, inLanguage: l, author: { "@type": "Organization", name: "Oxa" }, publisher: { "@type": "Organization", name: "Oxa", logo: { "@type": "ImageObject", url: `${SITE}/icon-512.png` } }, mainEntityOfPage: SITE + adresse(a, l) };
  const autre: Langue = l === "en" ? "fr" : "en";
  return (
    <article lang={l} className="pb-12">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} />
      <div className="relative h-[calc(250px+env(safe-area-inset-top))] overflow-hidden bg-muted">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={a.couverture} alt="" className="size-full object-cover" />
        <Link href={(l === "en" ? "/en/blog/" : "/blog/") as Route} className="absolute top-[max(env(safe-area-inset-top),14px)] left-3 flex items-center gap-1 rounded-full bg-[#0a0a0c]/70 py-1.5 pr-3.5 pl-2.5 text-[14px] font-semibold text-white backdrop-blur-md">
          <CaretLeftIcon className="size-4" weight="bold" />{D.retour}
        </Link>
        <Link href={adresse(a, autre) as Route} hrefLang={autre} className="absolute top-[max(env(safe-area-inset-top),14px)] right-3 rounded-full bg-[#0a0a0c]/70 px-3 py-1.5 text-[13px] font-semibold text-white backdrop-blur-md">{D.autre}</Link>
      </div>
      <div className="px-5">
        {a.credit && <p className="mt-1.5 text-[11.5px] text-muted-foreground">{D.photo} <a href={a.credit.lien} className="underline">{a.credit.nom}</a> {D.sur}</p>}
        <p className="mt-4 text-[12px] font-bold tracking-[0.06em] text-plate-ink uppercase">{a.type === "guide" ? `${D.guide} · ` : ""}{nomCategorie(a.categorie, l)} · {tempsLecture(a, l)} {D.min}{a.type === "article" ? ` · ${dateTxt(a.date, l)}` : ""}</p>
        {programme(a) && <p className="mt-3 rounded-xl bg-amber-500/15 px-3 py-2 text-[13px] font-semibold">{l === "en" ? "Scheduled" : "Programmé"} · {dateTxt(a.date, l)} ({l === "en" ? "visible on the test app only" : "visible seulement sur l'app test"})</p>}
        <h1 className="mt-2 text-[29px] leading-[1.08] font-extrabold tracking-[-0.025em]">{t.titre}</h1>
        <p className="mt-4 text-[16.5px] leading-relaxed">{t.intro}</p>
        {t.blocs.map((b) => (
          <section key={b.h} className="mt-8">
            <h2 className="text-[21px] font-bold tracking-[-0.01em]">{b.h}</h2>
            {b.p?.map((p) => <p key={p} className="mt-2.5 text-[15.5px] leading-relaxed">{p}</p>)}
            {b.liste && <ul className="mt-3 flex flex-col gap-2 text-[15.5px] leading-relaxed">{b.liste.map((x) => <li key={x} className="rounded-2xl bg-card px-4 py-3">{x}</li>)}</ul>}
            {b.tableau?.map((tb) => (
              <div key={tb.titre} className="mt-3 rounded-[20px] bg-card p-4">
                <h3 className="text-[16px] font-bold">{tb.titre}</h3>
                <ul className="mt-2 flex flex-col gap-1.5 text-[15px] leading-snug">{tb.lignes.map((x) => <li key={x}>{x}</li>)}</ul>
              </div>
            ))}
          </section>
        ))}
        <div className="mt-10 rounded-[26px] bg-bandeau p-5 text-bandeau-foreground">
          <p className="text-[19px] leading-tight font-bold">{t.cta}</p>
          <p className="mt-1.5 text-[14.5px] opacity-85">{D.fin}</p>
          <a href={l === "en" ? a.lien.replace(/src=([a-z0-9_-]+)/, (m, v) => `src=${v}-en`.slice(0, 4 + 24)) : a.lien} className="mt-4 block rounded-2xl bg-white py-3.5 text-center text-[16px] font-bold text-plate-ink">{D.ouvrir}</a>
        </div>
        <h2 className="mt-9 text-[12px] font-bold tracking-[0.08em] text-muted-foreground uppercase">{D.lireAussi}</h2>
        <div className="mt-2.5 flex flex-col gap-2.5">
          {aLireAussi(t.slug, 2, l).map((x) => (
            <Link key={x.slug} href={adresse(x, l) as Route} className="flex items-center gap-3 rounded-[20px] bg-card p-2.5 active:opacity-85">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={x.couverture} alt="" loading="lazy" className="size-[84px] shrink-0 rounded-[14px] bg-muted object-cover" />
              <div className="min-w-0">
                <div className="text-[11.5px] font-bold tracking-[0.06em] text-plate-ink uppercase">{x.type === "guide" ? `${D.guide} · ` : ""}{nomCategorie(x.categorie, l)}</div>
                <h3 className="mt-0.5 line-clamp-3 text-[15px] leading-snug font-bold">{texte(x, l).titre}</h3>
              </div>
            </Link>
          ))}
        </div>
      </div>
      {l === "fr" && <ProposerAnglais href={adresse(a, "en")} />}
    </article>
  );
}
