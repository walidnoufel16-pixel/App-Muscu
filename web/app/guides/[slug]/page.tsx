import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ARTICLES, article, texte } from "@/lib/data/blog";
import { VueArticle, metaArticle } from "../../blog/vues";

/* /guides/[slug] : un guide (les essentiels, fixes), en français ; mêmes adresses que les anciens guides. */
export const dynamicParams = false;
export const generateStaticParams = () => ARTICLES.filter((a) => a.type === "guide").map((a) => ({ slug: texte(a, "fr").slug }));
export async function generateMetadata({ params }: PageProps<"/guides/[slug]">): Promise<Metadata> {
  return metaArticle(article((await params).slug, "fr", "guide"), "fr");
}
export default async function Page({ params }: PageProps<"/guides/[slug]">) {
  const a = article((await params).slug, "fr", "guide");
  if (!a) notFound();
  return <VueArticle a={a} l="fr" />;
}
