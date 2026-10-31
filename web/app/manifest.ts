import { tr } from "@/lib/i18n";
import type { MetadataRoute } from "next";

export const dynamic = "force-static";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: process.env.NEXT_PUBLIC_APP_TEST === "1" ? "Oxa test" : tr("Oxa"),
    short_name: process.env.NEXT_PUBLIC_APP_TEST === "1" ? "Oxa test" : tr("Oxa"),
    description: tr("Programme de musculation personnalisé, piloté à l'effort ressenti."),
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    lang: "fr",
    background_color: "#0a0a0c",
    theme_color: "#0a0a0c",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "maskable" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
    ],
  };
}
