import type { Metadata } from "next";
import Link from "next/link";
import type { Route } from "next";
import { notFound } from "next/navigation";
import { CaretLeftIcon } from "@phosphor-icons/react/dist/ssr";
import { ARTICLES, aLireAussi, article, dateTxt, tempsLecture } from "@/lib/data/blog";

/* Un article du blog : texte lisible sans compte (rendu au build), puis un lien vers l'app. */
export const dynamicParams = false;
export const generateStaticParams = () => ARTICLES.map((a) => ({ slug: a.slug }));
const SITE = (process.env.NEXT_PUBLIC_SITE_URL || "https://repere-soz5.onrender.com").trim();

export async function generateMetadata({ params }: PageProps<"/blog/[slug]">): Promise<Metadata> {
  const a = article((await params).slug);
  if (!a) return {};
  return {
    title: a.titre, description: a.description, alternates: { canonical: `/blog/${a.slug}/` },
    openGraph: { title: a.titre, description: a.description, type: "article", publishedTime: a.date, url: `/blog/${a.slug}/`, images: [a.couverture.startsWith("/") ? a.couverture.replace("/grand/", "/") : a.couverture] },
  };
}

export default async function PageArticle({ params }: PageProps<"/blog/[slug]">) {
  const a = article((await params).slug);
  if (!a) notFound();
  const image = a.couverture.startsWith("/") ? SITE + a.couverture : a.couverture;
  const ld = { "@context": "https://schema.org", "@type": "Article", headline: a.titre, description: a.description, datePublished: a.date, image, inLanguage: "fr", author: { "@type": "Organization", name: "Oxa" }, publisher: { "@type": "Organization", name: "Oxa", logo: { "@type": "ImageObject", url: `${SITE}/icon-512.png` } }, mainEntityOfPage: `${SITE}/blog/${a.slug}/` };
  return (
    <article className="pb-12">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} />
      <div className="relative h-[calc(250px+env(safe-area-inset-top))] overflow-hidden bg-muted">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={a.couverture} alt="" className="size-full object-cover" />
        <Link href={"/blog/" as Route} className="absolute top-[max(env(safe-area-inset-top),14px)] left-3 flex items-center gap-1 rounded-full bg-[#0a0a0c]/70 py-1.5 pr-3.5 pl-2.5 text-[14px] font-semibold text-white backdrop-blur-md">
          <CaretLeftIcon className="size-4" weight="bold" />Blog
        </Link>
      </div>
      <div className="px-5">
        {a.credit && <p className="mt-1.5 text-[11.5px] text-muted-foreground">Photo : <a href={a.credit.lien} className="underline">{a.credit.nom}</a> sur Unsplash</p>}
        <p className="mt-4 text-[12px] font-bold tracking-[0.06em] text-plate-ink uppercase">{a.categorie} · {tempsLecture(a)} min · {dateTxt(a.date)}</p>
        <h1 className="mt-2 text-[29px] leading-[1.08] font-extrabold tracking-[-0.025em]">{a.titre}</h1>
        <p className="mt-4 text-[16.5px] leading-relaxed">{a.intro}</p>
        {a.blocs.map((b) => (
          <section key={b.h} className="mt-8">
            <h2 className="text-[21px] font-bold tracking-[-0.01em]">{b.h}</h2>
            {b.p?.map((p) => <p key={p} className="mt-2.5 text-[15.5px] leading-relaxed">{p}</p>)}
            {b.liste && <ul className="mt-3 flex flex-col gap-2 text-[15.5px] leading-relaxed">{b.liste.map((l) => <li key={l} className="rounded-2xl bg-card px-4 py-3">{l}</li>)}</ul>}
            {b.tableau?.map((t) => (
              <div key={t.titre} className="mt-3 rounded-[20px] bg-card p-4">
                <h3 className="text-[16px] font-bold">{t.titre}</h3>
                <ul className="mt-2 flex flex-col gap-1.5 text-[15px] leading-snug">{t.lignes.map((l) => <li key={l}>{l}</li>)}</ul>
              </div>
            ))}
          </section>
        ))}
        <div className="mt-10 rounded-[26px] bg-bandeau p-5 text-bandeau-foreground">
          <p className="text-[19px] leading-tight font-bold">{a.cta}</p>
          <p className="mt-1.5 text-[14.5px] opacity-85">Gratuit, sans abonnement, sans publicité.</p>
          <a href={a.lien} className="mt-4 block rounded-2xl bg-white py-3.5 text-center text-[16px] font-bold text-plate-ink">Ouvrir Oxa</a>
        </div>
        <h2 className="mt-9 text-[12px] font-bold tracking-[0.08em] text-muted-foreground uppercase">À lire aussi</h2>
        <div className="mt-2.5 flex flex-col gap-2.5">
          {aLireAussi(a.slug).map((x) => (
            <Link key={x.slug} href={`/blog/${x.slug}/` as Route} className="flex items-center gap-3 rounded-[20px] bg-card p-2.5 active:opacity-85">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={x.couverture} alt="" loading="lazy" className="size-[84px] shrink-0 rounded-[14px] bg-muted object-cover" />
              <div className="min-w-0">
                <div className="text-[11.5px] font-bold tracking-[0.06em] text-plate-ink uppercase">{x.categorie}</div>
                <h3 className="mt-0.5 line-clamp-3 text-[15px] leading-snug font-bold">{x.titre}</h3>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </article>
  );
}
