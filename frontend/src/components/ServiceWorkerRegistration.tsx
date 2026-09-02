"use client";

import { useEffect, useState } from "react";
import Icon from "@/components/Icon";
import { useLanguage } from "@/components/LanguageProvider";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export default function ServiceWorkerRegistration() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);
  const { isUrdu } = useLanguage();

  useEffect(() => {
    // 1. Register Service Worker
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      window.addEventListener("load", () => {
        navigator.serviceWorker
          .register("/sw.js")
          .then((reg) => {
            console.log("[PWA] Service Worker registered with scope:", reg.scope);
          })
          .catch((err) => {
            console.warn("[PWA] Service Worker registration failed:", err);
          });
      });
    }

    // 2. Listen for Install Prompt
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowPrompt(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);

    // 3. Detect standalone launch
    if (
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true
    ) {
      setIsInstalled(true);
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setShowPrompt(false);
      setIsInstalled(true);
    }
    setDeferredPrompt(null);
  };

  if (!showPrompt || isInstalled) return null;

  return (
    <aside
      aria-label="PWA Installation Prompt"
      className="fixed bottom-4 right-4 z-50 flex items-center gap-3 rounded-2xl border border-brand/30 bg-abyss/90 px-4 py-3 shadow-[0_12px_40px_rgba(0,0,0,0.5)] backdrop-blur-xl animate-fade-in"
    >
      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand/15 text-brand ring-1 ring-brand/30 shrink-0">
        <Icon name="download" size={16} />
      </div>
      <div className="flex flex-col text-xs">
        <span className="font-semibold text-ink">
          {isUrdu ? "موبائل ایپ انسٹال کرو" : "Install AgriTwin App"}
        </span>
        <span className="text-mist text-[11px]">
          {isUrdu
            ? "بغیر انٹرنیٹ وی دیکھو"
            : "Offline access & home screen launcher"}
        </span>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={handleInstallClick}
          className="rounded-xl bg-brand px-3 py-1.5 text-xs font-semibold text-abyss hover:bg-brand/90 transition-colors shadow-sm"
        >
          {isUrdu ? "انسٹال" : "Install"}
        </button>
        <button
          onClick={() => setShowPrompt(false)}
          className="rounded-lg p-1 text-dim hover:text-ink transition-colors"
          title="Dismiss"
        >
          <Icon name="x" size={14} />
        </button>
      </div>
    </aside>
  );
}
