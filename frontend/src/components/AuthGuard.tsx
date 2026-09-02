"use client";

import React, { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "./AuthProvider";
import Icon from "./Icon";

// Routes that do not require an active authenticated session
const PUBLIC_ROUTES = ["/login", "/about"];

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  const isPublicRoute = PUBLIC_ROUTES.some((route) => pathname === route || pathname.startsWith(`${route}/`));

  useEffect(() => {
    if (isLoading) return;

    // 1. If unauthenticated and trying to access protected routes -> redirect to login
    if (!isAuthenticated && !isPublicRoute) {
      router.replace("/login");
    }

    // 2. If authenticated and on login page -> redirect to dashboard
    if (isAuthenticated && pathname === "/login") {
      router.replace("/");
    }
  }, [isAuthenticated, isLoading, pathname, isPublicRoute, router]);

  // Loading screen while verifying session
  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-abyss text-ink">
        <div className="relative flex items-center justify-center mb-4">
          <div className="absolute h-16 w-16 animate-ping rounded-full bg-brand/20 opacity-75" />
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-600 text-abyss shadow-lg ring-2 ring-emerald-400/40">
            <Icon name="sprout" size={24} strokeWidth={2.4} />
          </div>
        </div>
        <div className="flex items-center gap-2 font-mono text-xs text-mist">
          <span className="h-1.5 w-1.5 rounded-full bg-brand animate-pulse" />
          <span>Securing AgriTwin Twin Session…</span>
        </div>
      </div>
    );
  }

  // If unauthenticated and on a protected route, hold rendering until redirect fires
  if (!isAuthenticated && !isPublicRoute) {
    return null;
  }

  return <>{children}</>;
}
