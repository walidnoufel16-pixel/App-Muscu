import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ARTICLES, article, texte } from "@/lib/data/blog";
import { VueArticle, metaArticle } from "../../../blog/vues";

/* /en/blog/[slug] : un article du blog, en anglais. */
export const dynamicParams = false;
export const generateStaticParams = () => ARTICLES.filter((a) => a.type === "article").map((a) => ({ slug: texte(a, "en").slug }));
export async function generateMetadata({ params }: PageProps<"/en/blog/[slug]">): Promise<Metadata> {
  return metaArticle(article((await params).slug, "en", "article"), "en");
}
export default async function Page({ params }: PageProps<"/en/blog/[slug]">) {
  const a = article((await params).slug, "en", "article");
  if (!a) notFound();
  return <VueArticle a={a} l="en" />;
}
