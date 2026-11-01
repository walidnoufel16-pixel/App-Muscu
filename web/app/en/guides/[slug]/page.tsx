import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ARTICLES, article, texte } from "@/lib/data/blog";
import { VueArticle, metaArticle } from "../../../blog/vues";

/* /en/guides/[slug] : un guide, en anglais. */
export const dynamicParams = false;
export const generateStaticParams = () => ARTICLES.filter((a) => a.type === "guide").map((a) => ({ slug: texte(a, "en").slug }));
export async function generateMetadata({ params }: PageProps<"/en/guides/[slug]">): Promise<Metadata> {
  return metaArticle(article((await params).slug, "en", "guide"), "en");
}
export default async function Page({ params }: PageProps<"/en/guides/[slug]">) {
  const a = article((await params).slug, "en", "guide");
  if (!a) notFound();
  return <VueArticle a={a} l="en" />;
}
