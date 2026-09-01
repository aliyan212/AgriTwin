"use client";

import Icon from "@/components/Icon";

interface RecommendationPanelProps {
  recommendation?: {
    recommendation: string;
    reasoning: string;
    confidence: number;
    risk_level: string;
  } | null;
  loading?: boolean;
}

const riskColors: Record<string, string> = {
  low: "border-emerald-400/30 bg-emerald-400/10 text-emerald-300",
  moderate: "border-yellow-400/30 bg-yellow-400/10 text-yellow-300",
  high: "border-orange-400/30 bg-orange-400/10 text-orange-300",
  critical: "border-red-400/30 bg-red-400/10 text-red-300",
};

export default function RecommendationPanel({
  recommendation,
  loading,
}: RecommendationPanelProps) {
  if (loading) {
    return (
      <div className="glass-panel p-5">
        <h3 className="mb-3 text-xs font-semibold uppercase tracking-widest text-mist">
          AI Recommendation
        </h3>
        <div className="flex items-center gap-2 py-4">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-brand border-t-transparent" />
          <span className="text-sm text-mist">Analyzing farm data...</span>
        </div>
      </div>
    );
  }

  if (!recommendation) {
    return (
      <div className="glass-panel p-5">
        <h3 className="mb-3 text-xs font-semibold uppercase tracking-widest text-mist">
          AI Recommendation
        </h3>
        <div className="rounded-lg border border-white/6 bg-white/4 p-6 text-center">
          <span className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-brand/10 text-brand">
            <Icon name="bot" size={22} />
          </span>
          <p className="text-sm text-mist">
            Create a farm and add crop data to get AI-powered recommendations.
          </p>
        </div>
      </div>
    );
  }

  const risk = recommendation.risk_level.toLowerCase();
  const riskBadge = riskColors[risk] ?? riskColors.moderate;

  return (
    <div className="glass-panel p-5">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-mist">
          <Icon name="bot" size={13} className="text-brand" />
          AI Recommendation
        </h3>
        <span className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${riskBadge}`}>
          {recommendation.risk_level} risk
        </span>
      </div>

      {/* Alert box */}
      <div className="mb-4 rounded-lg border border-amber-400/25 bg-amber-400/8 p-4">
        <div className="flex items-start gap-2.5">
          <Icon name="alert" size={17} className="mt-0.5 shrink-0 text-amber-400" />
          <p className="text-sm font-medium leading-relaxed text-amber-200">
            {recommendation.recommendation}
          </p>
        </div>
      </div>

      {/* Reasoning */}
      <div className="mb-3">
        <h4 className="mb-1 text-[10px] font-semibold uppercase tracking-widest text-dim">
          Why?
        </h4>
        <p className="text-sm leading-relaxed text-mist">
          {recommendation.reasoning}
        </p>
      </div>

      {/* Confidence */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-dim">Confidence:</span>
        <div className="h-1.5 flex-1 rounded-full bg-white/6">
          <div
            className="h-1.5 rounded-full bg-gradient-to-r from-emerald-500 to-emerald-300 shadow-[0_0_8px_rgba(52,211,153,0.5)]"
            style={{ width: `${recommendation.confidence * 100}%` }}
          />
        </div>
        <span className="text-xs font-semibold tabular-nums text-ink">
          {Math.round(recommendation.confidence * 100)}%
        </span>
      </div>
    </div>
  );
}
