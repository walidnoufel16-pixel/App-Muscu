import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ARTICLES, article, texte } from "@/lib/data/blog";
import { VueArticle, metaArticle } from "../vues";

/* /blog/[slug] : un article du blog, en français. */
export const dynamicParams = false;
export const generateStaticParams = () => ARTICLES.filter((a) => a.type === "article").map((a) => ({ slug: texte(a, "fr").slug }));
export async function generateMetadata({ params }: PageProps<"/blog/[slug]">): Promise<Metadata> {
  return metaArticle(article((await params).slug, "fr", "article"), "fr");
}
export default async function Page({ params }: PageProps<"/blog/[slug]">) {
  const a = article((await params).slug, "fr", "article");
  if (!a) notFound();
  return <VueArticle a={a} l="fr" />;
}
