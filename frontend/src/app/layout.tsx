import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Icon from "@/components/Icon";
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
        <header className="sticky top-0 z-50 border-b border-white/8 bg-abyss/75 backdrop-blur-xl">
          {/* glowing accent line under the header */}
          <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-brand/60 to-transparent" />
          <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
            <a href="/" className="group flex items-center gap-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-400 to-emerald-600 text-abyss shadow-[0_0_18px_rgba(52,211,153,0.45)] transition-shadow group-hover:shadow-[0_0_26px_rgba(52,211,153,0.65)]">
                <Icon name="sprout" size={18} strokeWidth={2.2} />
              </span>
              <span className="text-lg font-bold tracking-tight text-ink">
                Agri<span className="text-brand">Twin</span>
              </span>
              <span className="rounded-md border border-brand/30 bg-brand/10 px-1.5 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wider text-brand">
                AI
              </span>
            </a>
            <nav className="flex items-center gap-1 text-sm">
              <a
                href="/"
                className="rounded-lg bg-white/6 px-3 py-1.5 font-medium text-brand"
              >
                Dashboard
              </a>
              <a
                href="/farms"
                className="rounded-lg px-3 py-1.5 text-mist transition-colors hover:bg-white/6 hover:text-ink"
              >
                Farms
              </a>
              <a
                href="/docs"
                className="rounded-lg px-3 py-1.5 text-mist transition-colors hover:bg-white/6 hover:text-ink"
              >
                Docs
              </a>
            </nav>
          </div>
        </header>

        {/* ── Main Content ───────────────────────────────────────────────── */}
        <main className="flex-1">{children}</main>

        {/* ── Footer ─────────────────────────────────────────────────────── */}
        <footer className="border-t border-white/8 py-5 text-center text-xs text-dim">
          <span className="inline-flex items-center gap-2">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-brand shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
            AgriTwin AI &mdash; Pakistan-focused agriculture intelligence &mdash;
            Hackathon MVP
          </span>
        </footer>
      </body>
    </html>
  );
}
