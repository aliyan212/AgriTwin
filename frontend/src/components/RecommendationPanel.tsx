"use client";

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
  low: "bg-green-100 text-green-800",
  moderate: "bg-yellow-100 text-yellow-800",
  high: "bg-orange-100 text-orange-800",
  critical: "bg-red-100 text-red-800",
};

export default function RecommendationPanel({
  recommendation,
  loading,
}: RecommendationPanelProps) {
  if (loading) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <h3 className="mb-3 text-sm font-semibold text-gray-500 uppercase tracking-wide">
          AI Recommendation
        </h3>
        <div className="flex items-center gap-2 py-4">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-green-500 border-t-transparent" />
          <span className="text-sm text-gray-500">Analyzing farm data...</span>
        </div>
      </div>
    );
  }

  if (!recommendation) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <h3 className="mb-3 text-sm font-semibold text-gray-500 uppercase tracking-wide">
          AI Recommendation
        </h3>
        <div className="rounded-lg bg-gray-50 p-4 text-center">
          <p className="text-2xl mb-2">🤖</p>
          <p className="text-sm text-gray-500">
            Create a farm and add crop data to get AI-powered recommendations.
          </p>
        </div>
      </div>
    );
  }

  const risk = recommendation.risk_level.toLowerCase();
  const riskBadge = riskColors[risk] ?? riskColors.moderate;

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
          AI Recommendation
        </h3>
        <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${riskBadge}`}>
          {recommendation.risk_level} risk
        </span>
      </div>

      {/* Alert box */}
      <div className="rounded-lg bg-amber-50 border border-amber-200 p-4 mb-4">
        <div className="flex items-start gap-2">
          <span className="text-lg">⚠️</span>
          <p className="text-sm font-medium text-amber-900">
            {recommendation.recommendation}
          </p>
        </div>
      </div>

      {/* Reasoning */}
      <div className="mb-3">
        <h4 className="text-xs font-semibold text-gray-500 uppercase mb-1">
          Why?
        </h4>
        <p className="text-sm text-gray-700 leading-relaxed">
          {recommendation.reasoning}
        </p>
      </div>

      {/* Confidence */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-gray-500">Confidence:</span>
        <div className="h-2 flex-1 rounded-full bg-gray-100">
          <div
            className="h-2 rounded-full bg-green-500"
            style={{ width: `${recommendation.confidence * 100}%` }}
          />
        </div>
        <span className="text-xs font-semibold text-gray-700">
          {Math.round(recommendation.confidence * 100)}%
        </span>
      </div>
    </div>
  );
}
