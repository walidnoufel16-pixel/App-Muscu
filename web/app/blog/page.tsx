import type { Metadata } from "next";
import Link from "next/link";
import type { Route } from "next";
import { ARTICLES, dateTxt, tempsLecture } from "@/lib/data/blog";
import { LogoTuile } from "@/components/repere/logo";
import { ListeBlog } from "./liste";

export const metadata: Metadata = {
  title: "Le blog Oxa : muscu, street workout, course, Hyrox et nutrition",
  description: "Programmes, Hyrox, protéines, créatine, entraînement hybride : des conseils concrets et sourcés pour progresser, par Oxa.",
  alternates: { canonical: "/blog/" },
  openGraph: { title: "Le blog Oxa", description: "Des conseils concrets et sourcés pour progresser en muscu, street workout, course et nutrition.", url: "/blog/", images: ["/og.jpg"] },
};

/* Page du blog, rendue au build : tous les articles sont dans le HTML (lisibles sans JavaScript) ;
   les pastilles de catégorie filtrent ensuite sur le téléphone. */
export default function PageBlog() {
  const items = ARTICLES.map((a) => ({ slug: a.slug, titre: a.titre, description: a.description, categorie: a.categorie, couverture: a.couverture, date: dateTxt(a.date), lecture: tempsLecture(a) }));
  return (
    <div className="px-5 pt-[max(env(safe-area-inset-top),20px)] pb-12">
      <Link href={"/?src=blog" as Route} className="flex items-center gap-2 text-[15px] font-semibold"><LogoTuile className="size-7" />Oxa</Link>
      <h1 className="mt-7 text-[32px] leading-[1.06] font-extrabold tracking-[-0.025em]">Le blog Oxa</h1>
      <p className="mt-2 text-[15.5px] leading-relaxed text-muted-foreground">Muscu, street workout, course et nutrition : des conseils concrets, sans bla-bla.</p>
      <ListeBlog articles={items} />
    </div>
  );
}
