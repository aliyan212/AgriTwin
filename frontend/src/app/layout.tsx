import type { Metadata, Viewport } from "next";
import HeaderNav from "@/components/HeaderNav";
import { ThemeProvider } from "@/components/ThemeProvider";
import { LanguageProvider } from "@/components/LanguageProvider";
import ServiceWorkerRegistration from "@/components/ServiceWorkerRegistration";
import OfflineBanner from "@/components/OfflineBanner";
import "./globals.css";

export const viewport: Viewport = {
  themeColor: "#070c09",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  title: "AgriTwin AI — Pakistan Agriculture Intelligence",
  description:
    "Farm location, satellite observations, weather, soil/water indicators, and crop information — AI reasoning to actionable recommendations.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "AgriTwin AI",
  },
  icons: {
    icon: "/icons/icon-192.svg",
    apple: "/icons/icon-192.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className="h-full antialiased font-sans"
      suppressHydrationWarning
    >
      <head>
        <link rel="manifest" href="/manifest.webmanifest" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="mobile-web-app-capable" content="yes" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                if (localStorage.theme === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                  document.documentElement.classList.add('dark')
                } else {
                  document.documentElement.classList.remove('dark')
                }
                if (localStorage.agritwin_language === 'ur') {
                  document.documentElement.lang = 'ur';
                  document.documentElement.dir = 'rtl';
                  document.documentElement.classList.add('lang-urdu');
                }
              } catch (_) {}
            `,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col">
        <ThemeProvider>
          <LanguageProvider>
            {/* ── Offline Network Status Banner ────────────────────────────────── */}
            <OfflineBanner />

            {/* ── Top Navigation ─────────────────────────────────────────────── */}
            <HeaderNav />

            {/* ── Main Content ───────────────────────────────────────────────── */}
            <main className="flex-1">{children}</main>

            {/* ── PWA Install Prompt Listener ─────────────────────────────────── */}
            <ServiceWorkerRegistration />

            {/* ── Footer ─────────────────────────────────────────────────────── */}
            <footer className="border-t border-ink/8 py-5 text-center text-xs text-dim bg-abyss/60">
              <div className="mx-auto max-w-7xl px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
                <span className="inline-flex items-center gap-2">
                  <span className="inline-block h-1.5 w-1.5 rounded-full bg-brand shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
                  AgriTwin AI &mdash; Pakistan Agriculture Intelligence Engine
                </span>
                <span className="font-mono text-[11px] text-dim">
                  MODIS Terra &middot; Open-Meteo &middot; NASA POWER &middot; AgriCore v0.1
                </span>
              </div>
            </footer>
          </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
