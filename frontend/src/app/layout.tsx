import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AgriTwin AI — Pakistan Agriculture Intelligence",
  description:
    "Farm location, satellite observations, weather, soil/water indicators, and crop information — AI reasoning to actionable recommendations.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {/* ── Top Navigation ─────────────────────────────────────────────── */}
        <header className="sticky top-0 z-50 border-b border-gray-200 bg-white/80 backdrop-blur">
          <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
            <div className="flex items-center gap-2">
              <span className="text-xl">🌾</span>
              <span className="text-lg font-bold tracking-tight text-green-700">
                AgriTwin
              </span>
              <span className="rounded bg-green-100 px-1.5 py-0.5 text-[10px] font-semibold text-green-800 uppercase">
                AI
              </span>
            </div>
            <nav className="flex items-center gap-4 text-sm text-gray-600">
              <a href="/" className="font-medium text-green-700">
                Dashboard
              </a>
              <a href="/farms" className="hover:text-green-700">
                Farms
              </a>
              <a href="/docs" className="hover:text-green-700">
                Docs
              </a>
            </nav>
          </div>
        </header>

        {/* ── Main Content ───────────────────────────────────────────────── */}
        <main className="flex-1">{children}</main>

        {/* ── Footer ─────────────────────────────────────────────────────── */}
        <footer className="border-t border-gray-200 py-4 text-center text-xs text-gray-400">
          AgriTwin AI &mdash; Pakistan-focused agriculture intelligence &mdash;
          Hackathon MVP
        </footer>
      </body>
    </html>
  );
}
