import type { Metadata } from "next";
import Link from "next/link";
import type { Route } from "next";

/* La page des guides est celle du blog (les guides en tête) : /guides/ renvoie vers /blog/
   (redirection côté page, le site étant un export statique). */
export const metadata: Metadata = { title: "Le blog Oxa", alternates: { canonical: "/blog/" }, robots: { index: false } };

export default function PageGuides() {
  return (
    <div className="px-5 pt-10">
      <meta httpEquiv="refresh" content="0;url=/blog/" />
      <p className="text-[15px]">Les guides sont ici : <Link href={"/blog/" as Route} className="font-semibold text-plate-ink underline">guides et blog Oxa</Link>.</p>
    </div>
  );
}
