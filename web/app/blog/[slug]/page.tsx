import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ARTICLES, article } from "@/lib/data/blog";
import { VueArticle, metaArticle } from "../vues";

export const dynamicParams = false;
export const generateStaticParams = () => ARTICLES.map((a) => ({ slug: a.slug }));
export async function generateMetadata({ params }: PageProps<"/blog/[slug]">): Promise<Metadata> {
  return metaArticle(article((await params).slug, "fr"), "fr");
}
export default async function PageArticle({ params }: PageProps<"/blog/[slug]">) {
  const a = article((await params).slug, "fr");
  if (!a) notFound();
  return <VueArticle a={a} l="fr" />;
}
