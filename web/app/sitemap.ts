import type { MetadataRoute } from "next";
import { GUIDES } from "@/lib/data/guides";

export const dynamic = "force-static";
const SITE = (process.env.NEXT_PUBLIC_SITE_URL || "https://repere-soz5.onrender.com").trim();

/* Pages publiques : l'accueil et les guides (le reste de l'app est personnel). */
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: `${SITE}/`, changeFrequency: "weekly", priority: 1 },
    { url: `${SITE}/guides/`, changeFrequency: "monthly", priority: 0.8 },
    ...GUIDES.map((g) => ({ url: `${SITE}/guides/${g.slug}/`, changeFrequency: "monthly" as const, priority: 0.7 })),
  ];
}
