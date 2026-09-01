"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Icon from "@/components/Icon";
import ThemeToggle from "@/components/ThemeToggle";
import LanguageToggle from "@/components/LanguageToggle";
import { useLanguage } from "@/components/LanguageProvider";
import { api, type AuthUser } from "@/lib/api";

export default function HeaderNav() {
  const pathname = usePathname();
  const { t, isUrdu } = useLanguage();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [apiOnline, setApiOnline] = useState<boolean | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    // Check API health
    api
      .healthCheck()
      .then((h) => setApiOnline(h.status === "ok"))
      .catch(() => setApiOnline(false));

    // Load auth user
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("agri_user");
      if (stored) {
        try {
          setUser(JSON.parse(stored));
        } catch {
          // ignore
        }
      }
    }
  }, []);

  const handleLogout = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("agri_token");
      localStorage.removeItem("agri_user");
      setUser(null);
      window.location.href = "/";
    }
  };

  const navLinks = [
    { href: "/", label: t("navDashboard", "Dashboard"), icon: "activity" as const },
    { href: "/farms", label: t("navFarmsHub", "Farms Hub"), icon: "wheat" as const },
  ];

  return (
    <header className="sticky top-0 z-[2000] border-b border-ink/8 bg-abyss/85 backdrop-blur-xl">
      {/* Glowing accent underline */}
      <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-brand/60 to-transparent" />

      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6">
        {/* Brand */}
        <div className="flex items-center gap-6">
          <Link href="/" className="group flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-400 via-emerald-500 to-emerald-600 text-abyss shadow-[0_0_18px_rgba(52,211,153,0.45)] transition-all group-hover:scale-105 group-hover:shadow-[0_0_26px_rgba(52,211,153,0.7)]">
              <Icon name="sprout" size={18} strokeWidth={2.4} />
            </span>
            <div className="flex items-center gap-1.5">
              <span className="text-lg font-bold tracking-tight text-ink">
                Agri<span className="text-brand">Twin</span>
              </span>
              <span className="rounded-md border border-brand/30 bg-brand/10 px-1.5 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wider text-brand">
                AI
              </span>
            </div>
          </Link>

          {/* Navigation links */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => {
              const isActive =
                link.href === "/"
                  ? pathname === "/"
                  : pathname.startsWith(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold tracking-wide transition-all ${isActive
                    ? "border border-brand/30 bg-brand/12 text-brand shadow-[0_0_12px_rgba(52,211,153,0.2)]"
                    : "text-mist hover:bg-ink/6 hover:text-ink"
                    }`}
                >
                  <Icon
                    name={link.icon}
                    size={13}
                    className={isActive ? "text-brand" : "text-dim"}
                  />
                  <span>{link.label}</span>
                </Link>
              );
            })}

            {/* FastAPI Docs External Link */}
            <a
              href="http://127.0.0.1:8000/docs"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-semibold text-mist transition-colors hover:bg-ink/6 hover:text-ink"
              title="Open Swagger REST API Docs (Backend :8000)"
            >
              <span>{t("navDocs", "API Docs")}</span>
              <Icon name="externalLink" size={11} className="text-dim" />
            </a>
          </nav>
        </div>

        {/* Right utilities: Telemetry status + Language + Theme + User profile */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Live Node Telemetry Beacon */}
          <div className="hidden sm:flex items-center gap-2 rounded-full border border-ink/10 bg-ink/5 px-2.5 py-1 text-[11px] font-mono">
            <span className="relative flex h-2 w-2">
              {apiOnline === true && (
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-70" />
              )}
              <span
                className={`relative inline-flex h-2 w-2 rounded-full ${apiOnline === true
                  ? "bg-emerald-400"
                  : apiOnline === false
                    ? "bg-rose-500"
                    : "bg-amber-400"
                  }`}
              />
            </span>
            <span className="text-mist font-medium text-[10px]">
              {apiOnline === true
                ? t("nodeLive", "Punjab Node Live")
                : apiOnline === false
                  ? "API Offline"
                  : "Connecting…"}
            </span>
          </div>

          {/* Language Toggle (EN / اردو) */}
          <LanguageToggle />

          {/* Theme Toggle (Dark / Light) */}
          <ThemeToggle />

          {/* User Auth or Sign In */}
          {user ? (
            <div className="flex items-center gap-2 rounded-xl border border-ink/10 bg-ink/4 p-1 pl-2.5">
              <span className="text-xs font-medium text-ink truncate max-w-[120px]">
                {user.name}
              </span>
              <button
                onClick={handleLogout}
                title="Sign out"
                className="flex h-7 w-7 items-center justify-center rounded-lg text-mist hover:bg-ink/10 hover:text-rose-400 transition-colors"
              >
                <Icon name="logOut" size={13} />
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              className="flex items-center gap-1.5 rounded-lg bg-gradient-to-b from-emerald-400 to-emerald-600 px-3.5 py-1.5 text-xs font-semibold text-abyss shadow-[0_4px_16px_rgba(16,185,129,0.35)] transition-all hover:scale-[1.02] hover:shadow-[0_4px_24px_rgba(16,185,129,0.55)]"
            >
              <Icon name="user" size={12} strokeWidth={2.5} />
              <span>{t("signIn", "Sign In")}</span>
            </Link>
          )}
          {/* Mobile menu toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden flex h-8 w-8 items-center justify-center rounded-lg text-mist hover:bg-ink/10 hover:text-ink transition-colors"
          >
            <Icon name={mobileMenuOpen ? "x" : "menu"} size={16} />
          </button>
        </div>
      </div>

      {/* Mobile dropdown menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-ink/8 bg-abyss/95 backdrop-blur-xl px-4 py-3 shadow-xl">
          <nav className="flex flex-col gap-2">
            {navLinks.map((link) => {
              const isActive =
                link.href === "/"
                  ? pathname === "/"
                  : pathname.startsWith(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-semibold tracking-wide transition-all ${isActive
                    ? "border border-brand/30 bg-brand/12 text-brand shadow-[0_0_12px_rgba(52,211,153,0.2)]"
                    : "text-mist hover:bg-ink/6 hover:text-ink"
                    }`}
                >
                  <Icon
                    name={link.icon}
                    size={15}
                    className={isActive ? "text-brand" : "text-dim"}
                  />
                  {link.label}
                </Link>
              );
            })}

            {/* FastAPI Docs External Link (Mobile) */}
            <a
              href="http://127.0.0.1:8000/docs"
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-semibold text-mist transition-colors hover:bg-ink/6 hover:text-ink"
            >
              <Icon name="externalLink" size={15} className="text-dim" />
              <span>API Docs</span>
            </a>
          </nav>
        </div>
      )}
    </header>
  );
}

