"use client";

/* Liste des articles avec les pastilles de catégorie : le premier article affiché est mis à la une. */
import { useState } from "react";
import Link from "next/link";
import type { Route } from "next";
import { CATEGORIES, nomCategorie, type Categorie, type Langue } from "@/lib/data/blog";
import { cn } from "@/lib/utils";

type Item = { href: string; titre: string; categorie: Categorie; nomCat: string; couverture: string; date: string; lecture: number };

export function ListeBlog({ articles, l }: { articles: Item[]; l: Langue }) {
  const [cat, setCat] = useState<Categorie | null>(null);
  const liste = cat ? articles.filter((a) => a.categorie === cat) : articles;
  const [une, ...autres] = liste;
  return (
    <>
      <div className="no-scrollbar -mx-5 mt-3 flex gap-2 overflow-x-auto px-5" role="tablist" aria-label={l === "en" ? "Categories" : "Catégories"}>
        {[null, ...CATEGORIES.filter((c) => articles.some((a) => a.categorie === c))].map((c) => (
          <button key={c ?? "tout"} role="tab" aria-selected={cat === c} onClick={() => setCat(c)}
            className={cn("shrink-0 rounded-full px-4 py-2 text-[14px] font-semibold", cat === c ? "bg-plate text-plate-foreground" : "bg-muted text-foreground")}>
            {c ? nomCategorie(c, l) : l === "en" ? "All" : "Tout"}
          </button>
        ))}
      </div>
      {une && (
        <Link href={une.href as Route} className="mt-3 block overflow-hidden rounded-[24px] bg-card active:opacity-85">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={une.couverture} alt="" className="aspect-[16/10] w-full bg-muted object-cover" />
          <div className="px-4 pt-3.5 pb-4">
            <div className="text-[12px] font-bold tracking-[0.06em] text-plate-ink uppercase">{une.nomCat}{une === articles[0] && (l === "en" ? " · Latest" : " · Le plus récent")}</div>
            <h2 className="mt-1.5 text-[21px] leading-[1.15] font-extrabold tracking-[-0.01em]">{une.titre}</h2>
            <p className="mt-1.5 text-[13px] text-muted-foreground">{une.lecture} {l === "en" ? "min read" : "min de lecture"} · {une.date}</p>
          </div>
        </Link>
      )}
      <div className="mt-2.5 flex flex-col gap-2.5">
        {autres.map((a) => (
          <Link key={a.href} href={a.href as Route} className="flex items-center gap-3 rounded-[20px] bg-card p-2.5 active:opacity-85">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={a.couverture} alt="" loading="lazy" className="size-[92px] shrink-0 rounded-[14px] bg-muted object-cover" />
            <div className="min-w-0">
              <div className="text-[11.5px] font-bold tracking-[0.06em] text-plate-ink uppercase">{a.nomCat}</div>
              <h3 className="mt-0.5 line-clamp-3 text-[15px] leading-snug font-bold">{a.titre}</h3>
              <p className="mt-1 text-[12.5px] text-muted-foreground">{a.lecture} min · {a.date}</p>
            </div>
          </Link>
        ))}
      </div>
    </>
  );
}
