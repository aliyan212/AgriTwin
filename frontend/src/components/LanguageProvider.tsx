"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { translations, type Language } from "@/lib/translations";

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
  t: (key: string, fallback?: string) => string;
  isUrdu: boolean;
  dir: "ltr" | "rtl";
}

const LanguageContext = createContext<LanguageContextType>({
  language: "en",
  setLanguage: () => {},
  toggleLanguage: () => {},
  t: (k, f) => f || k,
  isUrdu: false,
  dir: "ltr",
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>("en");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("agritwin_language") as Language | null;
      if (saved === "en" || saved === "ur") {
        setLanguageState(saved);
      }
    } catch {}
    setMounted(true);
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    try {
      localStorage.setItem("agritwin_language", lang);
      document.documentElement.lang = lang;
      document.documentElement.dir = lang === "ur" ? "rtl" : "ltr";
      if (lang === "ur") {
        document.documentElement.classList.add("lang-urdu");
      } else {
        document.documentElement.classList.remove("lang-urdu");
      }
    } catch {}
  };

  const toggleLanguage = () => {
    setLanguage(language === "en" ? "ur" : "en");
  };

  useEffect(() => {
    if (!mounted) return;
    document.documentElement.lang = language;
    document.documentElement.dir = language === "ur" ? "rtl" : "ltr";
    if (language === "ur") {
      document.documentElement.classList.add("lang-urdu");
    } else {
      document.documentElement.classList.remove("lang-urdu");
    }
  }, [language, mounted]);

  const t = (key: string, fallback?: string): string => {
    const dict = translations[language] || translations.en;
    if (dict[key]) return dict[key];
    if (translations.en[key]) return translations.en[key];
    return fallback || key;
  };

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage,
        toggleLanguage,
        t,
        isUrdu: language === "ur",
        dir: language === "ur" ? "rtl" : "ltr",
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
