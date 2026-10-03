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
  variable: "--font-num",
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
    { media: "(prefers-color-scheme: light)", color: "#f2f2f4" },
    { media: "(prefers-color-scheme: dark)", color: "#09090b" },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="fr"
      suppressHydrationWarning
      className={`${GeistSans.variable} ${GeistMono.variable} ${chiffres.variable} h-full`}
    >
      <body className="min-h-full">
        <ThemeProvider>
          <AppShell>{children}</AppShell>
          <Toaster position="top-center" />
        </ThemeProvider>
      </body>
    </html>
  );
}
