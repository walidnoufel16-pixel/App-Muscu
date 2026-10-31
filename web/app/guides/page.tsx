import type { Metadata } from "next";
import Link from "next/link";
import type { Route } from "next";
import { GUIDES } from "@/lib/data/guides";
import { LogoTuile } from "@/components/repere/logo";

export const metadata: Metadata = {
  title: "Guides muscu et street workout",
  description: "Programme street workout débutant, première traction, séance sans matériel, repas petit budget : les guides d'Oxa.",
  alternates: { canonical: "/guides/" },
};

export default function PageGuides() {
  return (
    <div className="px-5 pt-[max(env(safe-area-inset-top),20px)] pb-12">
      <Link href={"/?src=guides" as Route} className="flex items-center gap-2 text-[15px] font-semibold"><LogoTuile className="size-7" />Oxa</Link>
      <h1 className="mt-7 text-[32px] leading-[1.08] font-extrabold tracking-[-0.025em]">Guides muscu et street workout</h1>
      <p className="mt-3 text-[16px] leading-relaxed text-muted-foreground">Des réponses courtes et concrètes pour bien commencer.</p>
      <div className="mt-6 flex flex-col gap-2.5">
        {GUIDES.map((g) => (
          <Link key={g.slug} href={`/guides/${g.slug}` as Route} className="rounded-[20px] bg-card p-4 active:opacity-80">
            <h2 className="text-[17px] leading-snug font-bold">{g.titre}</h2>
            <p className="mt-1 line-clamp-2 text-[14px] leading-snug text-muted-foreground">{g.description}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
