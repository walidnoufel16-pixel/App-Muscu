import type { Metadata } from "next";
import Link from "next/link";
import type { Route } from "next";

/* Les guides sont devenus le blog : l'ancienne adresse renvoie vers /blog/ (redirection côté page,
   le site étant un export statique). */
export const metadata: Metadata = { title: "Le blog Oxa", alternates: { canonical: "/blog/" }, robots: { index: false } };

export default function PageGuides() {
  return (
    <div className="px-5 pt-10">
      <meta httpEquiv="refresh" content="0;url=/blog/" />
      <p className="text-[15px]">Les guides ont déménagé : <Link href={"/blog/" as Route} className="font-semibold text-plate-ink underline">le blog Oxa</Link>.</p>
    </div>
  );
}
