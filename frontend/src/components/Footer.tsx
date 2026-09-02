"use client";

import Link from "next/link";
import Icon from "@/components/Icon";
import { useLanguage } from "@/components/LanguageProvider";

export default function Footer() {
  const { isUrdu } = useLanguage();

  const docsUrl =
    typeof process !== "undefined" && process.env.NEXT_PUBLIC_API_URL
      ? process.env.NEXT_PUBLIC_API_URL.replace("/api/v1", "/docs")
      : "http://127.0.0.1:8000/docs";

  return (
    <footer className="border-t border-ink/8 bg-abyss/80 backdrop-blur-md py-8 text-xs text-dim">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Brand & Mission */}
          <div className="flex flex-col sm:flex-row items-center gap-3 text-center sm:text-left">
            <Link href="/" className="flex items-center gap-2 group">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/15 text-brand ring-1 ring-emerald-400/30 group-hover:scale-105 transition-all">
                <Icon name="sprout" size={15} strokeWidth={2.4} />
              </span>
              <span className="text-sm font-bold tracking-tight text-ink">
                Agri<span className="text-brand">Twin</span> AI
              </span>
            </Link>
            <span className="hidden sm:inline text-ink/20">|</span>
            <span className="text-mist text-xs">
              {isUrdu
                ? "پنجاب ڈیجیٹل ٹوئن زرعی پلیٹ فارم — انڈس بیسن واٹر نیٹ ورک"
                : "Pakistan Precision Agriculture & Indus Basin Digital Twin"}
            </span>
          </div>

          {/* Nav Links: Dashboard, Farms, About, API Docs */}
          <div className="flex flex-wrap items-center justify-center gap-5 sm:gap-6 font-medium text-xs">
            <Link href="/" className="text-mist hover:text-brand transition-colors">
              {isUrdu ? "ڈیش بورڈ" : "Mission Control"}
            </Link>
            <Link href="/farms" className="text-mist hover:text-brand transition-colors">
              {isUrdu ? "فارمز ہب" : "Farms Hub"}
            </Link>
            <Link href="/about" className="text-mist hover:text-brand font-semibold transition-colors flex items-center gap-1">
              <Icon name="info" size={12} className="text-brand" />
              <span>{isUrdu ? "پلیٹ فارم تعارف" : "About Platform"}</span>
            </Link>
            <a
              href={docsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-mist hover:text-brand font-semibold transition-colors flex items-center gap-1"
            >
              <span>{isUrdu ? "اے پی آئی دستاویزات" : "API Docs"}</span>
              <Icon name="externalLink" size={11} className="text-dim" />
            </a>
          </div>
        </div>

        {/* Bottom Sub-row: Telemetry & Provenance */}
        <div className="mt-6 pt-5 border-t border-ink/6 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-dim font-mono">
          <div className="flex items-center gap-2">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-brand shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
            <span>Punjab Telemetry Live · Open-Meteo · MODIS Terra · ISRIC SoilGrids</span>
          </div>
          <div>
            <span>AgriCore v1.0 · Hackathon Edition · MIT License</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
