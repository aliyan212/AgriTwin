"use client";

import { useEffect, useState } from "react";
import Icon from "@/components/Icon";
import { useLanguage } from "@/components/LanguageProvider";

export default function OfflineBanner() {
  const [isOffline, setIsOffline] = useState(false);
  const [showRestored, setShowRestored] = useState(false);
  const { isUrdu } = useLanguage();

  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleOffline = () => {
      setIsOffline(true);
      setShowRestored(false);
    };

    const handleOnline = () => {
      setIsOffline(false);
      setShowRestored(true);
      const timer = setTimeout(() => setShowRestored(false), 4000);
      return () => clearTimeout(timer);
    };

    // Check initial state
    if (!navigator.onLine) {
      setIsOffline(true);
    }

    window.addEventListener("offline", handleOffline);
    window.addEventListener("online", handleOnline);

    return () => {
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("online", handleOnline);
    };
  }, []);

  if (!isOffline && !showRestored) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed top-16 left-1/2 -translate-x-1/2 z-50 transition-all duration-300 animate-slide-down pointer-events-none max-w-[92vw]"
    >
      {isOffline ? (
        <div className="flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-50/95 dark:bg-amber-950/80 px-4 py-2 text-xs font-semibold text-amber-900 dark:text-amber-200 shadow-lg backdrop-blur-md">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
          </span>
          <Icon name="cloud" size={14} />
          <span className="truncate">
            {isUrdu
              ? "📶 آف لائن موڈ — محفوظ معلومات دکھائی جا رہی ہیں"
              : "📶 Offline Mode — Using cached intelligence"}
          </span>
        </div>
      ) : (
        <div className="flex items-center gap-2 rounded-full border border-brand/30 bg-emerald-50/95 dark:bg-emerald-950/80 px-4 py-2 text-xs font-semibold text-emerald-900 dark:text-emerald-200 shadow-lg backdrop-blur-md">
          <span className="relative inline-flex rounded-full h-2 w-2 bg-brand"></span>
          <Icon name="check" size={14} />
          <span className="truncate">
            {isUrdu
              ? "✓ آن لائن کنکشن بحال ہو گیا"
              : "✓ Internet restored — Live sync active"}
          </span>
        </div>
      )}
    </div>
  );
}

