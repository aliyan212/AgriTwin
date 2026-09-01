"use client";

import { useEffect, useState } from "react";
import Icon from "@/components/Icon";
import { useLanguage } from "./LanguageProvider";

interface RecommendationPanelProps {
  recommendation?: {
    recommendation: string;
    reasoning: string;
    text_ur?: string;
    reasoning_ur?: string;
    confidence: number;
    risk_level: string;
  } | null;
  loading?: boolean;
}

const riskColors: Record<string, { bg: string; text: string; ring: string }> = {
  low: { bg: "bg-emerald-500/15", text: "text-emerald-300", ring: "ring-emerald-400/30" },
  moderate: { bg: "bg-amber-500/15", text: "text-amber-300", ring: "ring-amber-400/30" },
  high: { bg: "bg-orange-500/15", text: "text-orange-300", ring: "ring-orange-400/30" },
  critical: { bg: "bg-rose-500/15", text: "text-rose-300", ring: "ring-rose-400/30" },
};

export default function RecommendationPanel({
  recommendation,
  loading,
}: RecommendationPanelProps) {
  const { isUrdu: globalIsUrdu, t } = useLanguage();
  const [activeLang, setActiveLang] = useState<"en" | "ur">(globalIsUrdu ? "ur" : "en");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setActiveLang(globalIsUrdu ? "ur" : "en");
  }, [globalIsUrdu]);

  const handleCopy = () => {
    if (!recommendation) return;
    const textToCopy =
      activeLang === "ur" && recommendation.text_ur
        ? `ایگری ٹوئن پنجابی زرعی مشورہ:\n${recommendation.text_ur}\n\nوجہ: ${recommendation.reasoning_ur || recommendation.reasoning}\nخطرے دی سطح: ${recommendation.risk_level} (${Math.round(recommendation.confidence * 100)}% اعتماد)`
        : `AgriTwin AI Recommendation:\n${recommendation.recommendation}\n\nReasoning: ${recommendation.reasoning}\nRisk: ${recommendation.risk_level} (${Math.round(recommendation.confidence * 100)}% confidence)`;

    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="glass-panel p-6 relative overflow-hidden">
        <div className="flex items-center gap-3">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand border-t-transparent" />
          <div>
            <h4 className="text-sm font-semibold text-ink">
              {t("synthesizingRec", "Synthesizing Multi-Source Agronomy Reasoning…")}
            </h4>
            <p className="text-xs text-mist mt-0.5">
              {activeLang === "ur"
                ? "سیٹلائٹ این ڈی وی آئی، اوپن میٹیو، ناسا پاور موسمی ریکارڈ تے پنجاب زرعی ڈیٹا دا تجزیہ جاری اے۔"
                : "Analyzing satellite NDVI trend, Open-Meteo forecasts, NASA POWER climate anomaly, and crop knowledge models."}
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!recommendation) {
    return (
      <div className="glass-panel p-6">
        <div className="rounded-xl border border-ink/6 bg-ink/[0.02] p-8 text-center">
          <span className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-brand/10 text-brand ring-1 ring-brand/20">
            <Icon name="bot" size={24} />
          </span>
          <h4 className="text-sm font-semibold text-ink">{t("aiCopilot", "AI Agronomy Copilot Ready")}</h4>
          <p className="mt-1 text-xs text-mist max-w-md mx-auto">
            {activeLang === "ur"
              ? "فارم منتخب کرو تے پنجاب فیلڈ مشاہدات تے مبنی خودکار اے آئی زرعی مشورہ حاصل کرو۔"
              : "Select a farm and click “Generate Recommendation” to trigger AI reasoning grounded in real Punjab field observations."}
          </p>
        </div>
      </div>
    );
  }

  const risk = recommendation.risk_level.toLowerCase();
  const riskBadge = riskColors[risk] ?? riskColors.moderate;

  const currentText =
    activeLang === "ur"
      ? recommendation.text_ur || recommendation.recommendation
      : recommendation.recommendation;

  const currentReasoning =
    activeLang === "ur"
      ? recommendation.reasoning_ur || recommendation.reasoning
      : recommendation.reasoning;

  return (
    <div className="glass-panel p-5 relative overflow-hidden">
      {/* Header */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand/15 text-brand ring-1 ring-brand/30">
            <Icon name="spark" size={15} />
          </span>
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-widest text-mist">
              {t("aiCopilot", "AI Agronomy Copilot")}
            </h3>
            <span className="text-[10px] text-dim font-mono">
              {activeLang === "ur" ? "لائیو فیلڈ ڈیٹا تے مشین لرننگ ماڈل" : "Grounded in Live Field Data & ML Forecast"}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* In-Card Language Switcher */}
          <div className="flex items-center rounded-lg border border-ink/10 bg-ink/5 p-0.5 text-[11px] font-medium">
            <button
              onClick={() => setActiveLang("en")}
              className={`rounded-md px-2 py-0.5 transition-all ${activeLang === "en"
                ? "bg-panel text-brand shadow-sm font-bold ring-1 ring-brand/30"
                : "text-mist hover:text-ink"
                }`}
            >
              English
            </button>
            <button
              onClick={() => setActiveLang("ur")}
              className={`rounded-md px-2 py-0.5 transition-all font-urdu ${activeLang === "ur"
                ? "bg-panel text-brand shadow-sm font-bold ring-1 ring-brand/30"
                : "text-mist hover:text-ink"
                }`}
            >
              پنجابی
            </button>
          </div>

          <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ${riskBadge.bg} ${riskBadge.text} ${riskBadge.ring}`}>
            {recommendation.risk_level} Risk
          </span>

          <button
            onClick={handleCopy}
            className="flex items-center gap-1 rounded-lg border border-ink/10 bg-ink/4 px-2.5 py-1 text-xs font-medium text-mist hover:bg-ink/10 hover:text-ink transition-colors"
            title="Copy recommendation text"
          >
            <Icon name={copied ? "checkCircle" : "copy"} size={12} className={copied ? "text-brand" : ""} />
            {copied ? "Copied" : "Copy"}
          </button>
        </div>
      </div>

      {/* Action Recommendation Box */}
      <div className="mb-4 rounded-xl border border-brand/25 bg-brand/[0.04] p-4 relative">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-brand/20 text-brand">
            <Icon name="checkCircle" size={14} strokeWidth={2.4} />
          </span>
          <div className="min-w-0 flex-1">
            <h4 className="text-xs font-bold uppercase tracking-wider text-brand mb-1">
              {t("recommendationLabel", "Recommended Action Plan")}
            </h4>
            <p className={`text-sm font-medium leading-relaxed text-ink ${activeLang === "ur" ? "font-urdu text-base leading-loose" : ""}`}>
              {currentText}
            </p>
          </div>
        </div>
      </div>

      {/* Agronomic Reasoning */}
      <div className="mb-4 rounded-xl border border-ink/6 bg-ink/[0.02] p-3.5">
        <h4 className="mb-1 text-[10px] font-mono font-semibold uppercase tracking-widest text-dim">
          {t("reasoningLabel", "Diagnostic Evidence & Reasoning")}
        </h4>
        <p className={`text-xs leading-relaxed text-mist ${activeLang === "ur" ? "font-urdu text-sm leading-relaxed" : ""}`}>
          {currentReasoning}
        </p>
      </div>

      {/* Confidence Gauge & Provenance */}
      <div className="flex items-center justify-between gap-4 border-t border-ink/6 pt-3 text-xs">
        <div className="flex items-center gap-2 flex-1 max-w-xs">
          <span className="text-[11px] text-dim shrink-0">{t("confidence", "Model Confidence")}:</span>
          <div className="h-1.5 flex-1 rounded-full bg-ink/6 overflow-hidden">
            <div
              className="h-full rounded-full bg-brand transition-all duration-500"
              style={{ width: `${Math.round(recommendation.confidence * 100)}%` }}
            />
          </div>
          <span className="font-mono text-[11px] font-semibold text-brand tabular-nums">
            {Math.round(recommendation.confidence * 100)}%
          </span>
        </div>

        <span className="text-[10px] font-mono text-dim">
          AgriCore &middot; Gemini &middot; Punjab Knowledge
        </span>
      </div>
    </div>
  );
}
