import type { Metadata } from "next";
import Link from "next/link";
import type { Route } from "next";
import { notFound } from "next/navigation";
import { article } from "@/lib/data/blog";

/* Anciennes adresses des guides : chacune renvoie vers son article du blog (même identifiant). */
const ANCIENS = ["programme-street-workout-debutant", "premiere-traction", "seance-full-body-sans-materiel", "repas-prise-de-muscle-petit-budget"];
export const dynamicParams = false;
export const generateStaticParams = () => ANCIENS.map((slug) => ({ slug }));

export async function generateMetadata({ params }: PageProps<"/guides/[slug]">): Promise<Metadata> {
  const a = article((await params).slug);
  return a ? { title: a.titre, alternates: { canonical: `/blog/${a.slug}/` }, robots: { index: false } } : {};
}

export default async function AncienGuide({ params }: PageProps<"/guides/[slug]">) {
  const a = article((await params).slug);
  if (!a) notFound();
  return (
    <div className="px-5 pt-10">
      <meta httpEquiv="refresh" content={`0;url=/blog/${a.slug}/`} />
      <p className="text-[15px]">Cet article a déménagé : <Link href={`/blog/${a.slug}/` as Route} className="font-semibold text-plate-ink underline">{a.titre}</Link>.</p>
    </div>
  );
}
