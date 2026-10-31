import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { ThemeProvider } from "@/components/repere/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { AppShell } from "@/components/repere/app-shell";
import "./globals.css";

/* Chiffres de séance : condensés, pour les charges, répétitions et le minuteur. */
const chiffres = localFont({
  src: [
    { path: "./fonts/barlow-condensed-latin-600-normal.woff2", weight: "600" },
    { path: "./fonts/barlow-condensed-latin-700-normal.woff2", weight: "700" },
    { path: "./fonts/barlow-condensed-latin-800-normal.woff2", weight: "800" },
  ],
  variable: "--font-chiffres",
  display: "swap",
});

/* Adresse publique : aperçus de partage (WhatsApp, Instagram…) et référencement. */
const SITE = (process.env.NEXT_PUBLIC_SITE_URL || "https://repere-soz5.onrender.com").trim();
const ACCROCHE = "Gratuit, sans abonnement, il s'adapte à toi : touche les muscles que tu veux travailler, Repère crée ta séance et fait monter tes charges au bon moment.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE),
  title: { default: "Repère · ton coach muscu et street workout", template: "%s · Repère" },
  description: ACCROCHE,
  openGraph: {
    type: "website", locale: "fr_FR", siteName: "Repère", url: "/",
    title: "Repère · ton coach muscu et street workout",
    description: ACCROCHE,
    images: [{ url: "/og.jpg", width: 1200, height: 630, alt: "Repère, ton coach muscu et street workout" }],
  },
  twitter: { card: "summary_large_image", title: "Repère · ton coach muscu et street workout", description: ACCROCHE, images: ["/og.jpg"] },
  applicationName: "Repère",
  appleWebApp: { capable: true, title: "Repère", statusBarStyle: "black-translucent" },
  icons: { icon: "/icon-192.png", apple: "/apple-touch-icon.png" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f2f3f7" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0b0f" },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="fr"
      suppressHydrationWarning
      className={`${GeistSans.variable} ${GeistMono.variable} ${chiffres.variable} h-full`}
    >
      <head>
        {/* Secours : si la politique de sécurité du site bloque les polices
            auto-hébergées, les mêmes polices viennent de Google Fonts. */}
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@600;700;800&family=Geist:wght@400..800&display=swap" />
      </head>
      <body className="min-h-full">
        <ThemeProvider>
          <AppShell>{children}</AppShell>
          <Toaster position="top-center" />
        </ThemeProvider>
      </body>
    </html>
  );
}
