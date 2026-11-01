import type { MetadataRoute } from "next";

export const dynamic = "force-static";
const SITE = (process.env.NEXT_PUBLIC_SITE_URL || "https://repere-soz5.onrender.com").trim();
/* l'app de test ne doit pas être indexée */
const TEST = process.env.NEXT_PUBLIC_APP_TEST === "1";

export default function robots(): MetadataRoute.Robots {
  return TEST
    ? { rules: { userAgent: "*", disallow: "/" } }
    : { rules: { userAgent: "*", allow: ["/", "/blog/"], disallow: ["/admin/"] }, sitemap: `${SITE}/sitemap.xml` };
}
