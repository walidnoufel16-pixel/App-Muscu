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

export const metadata: Metadata = {
  title: "Repère",
  description: "Programme de musculation personnalisé, piloté à l'effort ressenti.",
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
        {/* bichromie des photos de la salle (.photo-salle) : ombres bleu nuit, tons moyens au bleu de l'app, lumières blanches */}
        <svg aria-hidden width="0" height="0" className="absolute">
          <filter id="bichromie" colorInterpolationFilters="sRGB">
            <feColorMatrix type="matrix" values="0.2126 0.7152 0.0722 0 0  0.2126 0.7152 0.0722 0 0  0.2126 0.7152 0.0722 0 0  0 0 0 1 0" />
            <feComponentTransfer>
              <feFuncR type="table" tableValues="0.05 0.18 1" />
              <feFuncG type="table" tableValues="0.11 0.36 1" />
              <feFuncB type="table" tableValues="0.40 0.92 1" />
            </feComponentTransfer>
          </filter>
        </svg>
        <ThemeProvider>
          <AppShell>{children}</AppShell>
          <Toaster position="top-center" />
        </ThemeProvider>
      </body>
    </html>
  );
}
