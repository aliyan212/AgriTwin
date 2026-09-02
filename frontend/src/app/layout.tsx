import type { Metadata, Viewport } from "next";
import HeaderNav from "@/components/HeaderNav";
import Footer from "@/components/Footer";
import { ThemeProvider } from "@/components/ThemeProvider";
import { LanguageProvider } from "@/components/LanguageProvider";
import ServiceWorkerRegistration from "@/components/ServiceWorkerRegistration";
import OfflineBanner from "@/components/OfflineBanner";
import { AuthProvider } from "@/components/AuthProvider";
import { AuthGuard } from "@/components/AuthGuard";
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
        {/* Preconnect to Google Font CDNs for zero-blocking font fetch */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Noto+Nastaliq+Urdu:wght@400;500;600;700&family=Noto+Sans+Arabic:wght@400;500;600;700&display=swap"
        />
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
            <AuthProvider>
              <AuthGuard>
                {/* ── Offline Network Status Banner ────────────────────────────────── */}
                <OfflineBanner />

                {/* ── Top Navigation ─────────────────────────────────────────────── */}
                <HeaderNav />

                {/* ── Main Content ───────────────────────────────────────────────── */}
                <main className="flex-1">{children}</main>

                {/* ── PWA Install Prompt Listener ─────────────────────────────────── */}
                <ServiceWorkerRegistration />

                {/* ── Global Footer ─────────────────────────────────────────────── */}
                <Footer />
              </AuthGuard>
            </AuthProvider>
          </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
