"use client";

import { useEffect, useState } from "react";

export interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

declare global {
  interface Window {
    __pwaPrompt?: BeforeInstallPromptEvent;
  }
}

/**
 * Custom hook to check PWA installability and trigger install from menu/header
 */
export function usePwaInstall() {
  const [canInstall, setCanInstall] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    const updateStatus = () => {
      if (typeof window === "undefined") return;
      const standalone =
        window.matchMedia("(display-mode: standalone)").matches ||
        (window.navigator as unknown as { standalone?: boolean }).standalone === true;
      setIsInstalled(standalone);
      setCanInstall(Boolean(window.__pwaPrompt) && !standalone);
    };

    updateStatus();
    window.addEventListener("pwa:ready", updateStatus);
    window.addEventListener("pwa:installed", updateStatus);
    return () => {
      window.removeEventListener("pwa:ready", updateStatus);
      window.removeEventListener("pwa:installed", updateStatus);
    };
  }, []);

  const installApp = async () => {
    if (typeof window === "undefined" || !window.__pwaPrompt) return;
    const prompt = window.__pwaPrompt;
    await prompt.prompt();
    const { outcome } = await prompt.userChoice;
    if (outcome === "accepted") {
      setIsInstalled(true);
      setCanInstall(false);
      window.dispatchEvent(new CustomEvent("pwa:installed"));
    }
    window.__pwaPrompt = undefined;
    window.dispatchEvent(new CustomEvent("pwa:ready"));
  };

  return { canInstall, isInstalled, installApp };
}

export default function ServiceWorkerRegistration() {
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

    // 2. Listen for Install Prompt and store in memory for menu usage
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      window.__pwaPrompt = e as BeforeInstallPromptEvent;
      window.dispatchEvent(new CustomEvent("pwa:ready"));
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
    };
  }, []);

  // Main screen remains clean without floating toasts
  return null;
}

