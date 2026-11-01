import type { MetadataRoute } from "next";
import { ARTICLES, adresse } from "@/lib/data/blog";

export const dynamic = "force-static";
const SITE = (process.env.NEXT_PUBLIC_SITE_URL || "https://repere-soz5.onrender.com").trim();

/* Pages publiques : l'accueil, les guides et le blog, en français et en anglais (le reste de l'app est personnel). */
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: `${SITE}/`, changeFrequency: "weekly", priority: 1 },
    { url: `${SITE}/blog/`, lastModified: ARTICLES[0].date, changeFrequency: "weekly", priority: 0.8 },
    ...ARTICLES.map((a) => ({ url: `${SITE}${adresse(a, "fr")}`, lastModified: a.date, changeFrequency: "monthly" as const, priority: 0.7 })),
    { url: `${SITE}/en/blog/`, lastModified: ARTICLES[0].date, changeFrequency: "weekly", priority: 0.7 },
    ...ARTICLES.map((a) => ({ url: `${SITE}${adresse(a, "en")}`, lastModified: a.date, changeFrequency: "monthly" as const, priority: 0.6 })),
  ];
}
