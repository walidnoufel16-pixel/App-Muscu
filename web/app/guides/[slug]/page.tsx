import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { GUIDES, guide } from "@/lib/data/guides";
import { LogoTuile } from "@/components/repere/logo";

/* Un guide public : texte lisible sans compte (rendu au build), puis un lien vers l'app. */
export const dynamicParams = false;
export const generateStaticParams = () => GUIDES.map((g) => ({ slug: g.slug }));

export async function generateMetadata({ params }: PageProps<"/guides/[slug]">): Promise<Metadata> {
  const g = guide((await params).slug);
  if (!g) return {};
  return {
    title: g.titre, description: g.description, alternates: { canonical: `/guides/${g.slug}/` },
    openGraph: { title: g.titre, description: g.description, type: "article", url: `/guides/${g.slug}/`, images: ["/og.jpg"] },
  };
}

export default async function PageGuide({ params }: PageProps<"/guides/[slug]">) {
  const g = guide((await params).slug);
  if (!g) notFound();
  return (
    <article className="px-5 pt-[max(env(safe-area-inset-top),20px)] pb-12">
      <Link href="/guides" className="flex items-center gap-2 text-[15px] font-semibold"><LogoTuile className="size-7" />Oxa · guides</Link>
      <h1 className="mt-7 text-[32px] leading-[1.08] font-extrabold tracking-[-0.025em]">{g.titre}</h1>
      <p className="mt-4 text-[16.5px] leading-relaxed">{g.intro}</p>
      {g.blocs.map((b) => (
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
      <div className="mt-10 rounded-[26px] bg-plate p-5 text-plate-foreground">
        <p className="text-[20px] font-bold leading-tight">{g.cta}</p>
        <p className="mt-1.5 text-[14.5px] opacity-90">Gratuit, sans abonnement, sans publicité.</p>
        <a href={g.lien} className="mt-4 block rounded-2xl bg-white py-3.5 text-center text-[16px] font-bold text-plate-ink">Ouvrir Oxa</a>
      </div>
    </article>
  );
}
