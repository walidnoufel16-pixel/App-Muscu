"use client";

/* Blog ouvert depuis l'app (menu ☰ › Le blog Oxa) : « ‹ Profil » ramène à l'écran d'où l'on vient.
   Ouvert depuis Google ou un lien partagé, on garde le logo, qui mène à l'app. */
import { useRouter } from "next/navigation";
import { CaretLeftIcon } from "@phosphor-icons/react";
import { ARRIERE, revenirA, titreDe, usePile } from "@/lib/nav";

const estBlog = (p: string) => /^\/(en\/)?(blog|guides)(\/|\?|$)/.test(p);

export function RetourApp({ children, l }: { children: React.ReactNode; l: "fr" | "en" }) {
  const router = useRouter();
  const app = usePile((s) => s.pile.findLast((p) => !estBlog(p)));
  if (!app) return <>{children}</>;
  return (
    <button onClick={() => revenirA(app.split("?")[0], () => router.push("/entrainement", ARRIERE))} className="-ml-1 flex items-center gap-1 text-[15px] font-semibold text-plate-ink">
      <CaretLeftIcon className="size-5" weight="bold" />
      {l === "en" && titreDe(app) === "Retour" ? "Back" : titreDe(app)}
    </button>
  );
}
