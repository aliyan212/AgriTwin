"use client";

import { useLanguage } from "./LanguageProvider";
import Icon from "./Icon";

export default function LanguageToggle() {
  const { language, setLanguage, isUrdu } = useLanguage();

  return (
    <div className="flex items-center rounded-xl border border-ink/10 bg-ink/5 p-0.5 text-xs font-medium">
      <button
        onClick={() => setLanguage("en")}
        className={`flex items-center gap-1 rounded-lg px-2.5 py-1 transition-all ${!isUrdu
            ? "bg-panel text-brand shadow-sm ring-1 ring-brand/30 font-bold"
            : "text-mist hover:text-ink"
          }`}
        title="Switch to English"
      >
        <span>EN</span>
      </button>

      <button
        onClick={() => setLanguage("ur")}
        className={`flex items-center gap-1 rounded-lg px-2.5 py-1 transition-all font-urdu ${isUrdu
            ? "bg-panel text-brand shadow-sm ring-1 ring-brand/30 font-bold"
            : "text-mist hover:text-ink"
          }`}
        title="پنجابی (پنجاب زرعی زبان)"
      >
        <span>پنجابی</span>
      </button>
    </div>
  );
}
