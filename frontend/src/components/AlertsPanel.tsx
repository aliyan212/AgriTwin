"use client";

import type { FarmAlert } from "@/lib/api";

const severityStyles: Record<string, { bg: string; border: string; badge: string; text: string }> = {
  critical: {
    bg: "bg-red-50",
    border: "border-red-200",
    badge: "bg-red-600 text-white",
    text: "text-red-800",
  },
  warning: {
    bg: "bg-amber-50",
    border: "border-amber-200",
    badge: "bg-amber-500 text-white",
    text: "text-amber-800",
  },
  info: {
    bg: "bg-blue-50",
    border: "border-blue-200",
    badge: "bg-blue-500 text-white",
    text: "text-blue-800",
  },
};

const categoryIcons: Record<string, string> = {
  irrigation: "💧",
  heat: "🌡️",
  climate: "🌡️",
  vegetation: "🌿",
  pest: "🐛",
  rain: "🌧️",
  wind: "💨",
  general: "ℹ️",
};

export default function AlertsPanel({
  alerts,
  loading,
}: {
  alerts: FarmAlert[];
  loading?: boolean;
}) {
  if (loading) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm text-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-green-500 border-t-transparent mx-auto mb-2" />
        <p className="text-xs text-gray-500">Analyzing risks...</p>
      </div>
    );
  }

  if (!alerts || alerts.length === 0) {
    return (
      <div className="rounded-xl border border-green-200 bg-green-50 p-5 shadow-sm">
        <p className="text-sm text-green-700 font-medium">No active alerts</p>
        <p className="text-xs text-green-600 mt-1">All conditions are within normal ranges.</p>
      </div>
    );
  }

  // Sort: critical first, then warning, then info
  const sorted = [...alerts].sort((a, b) => {
    const order = { critical: 0, warning: 1, info: 2 };
    return (order[a.severity] ?? 3) - (order[b.severity] ?? 3);
  });

  return (
    <div className="space-y-3">
      {sorted.map((alert, i) => {
        const style = severityStyles[alert.severity] ?? severityStyles.info;
        const icon = categoryIcons[alert.category] ?? "⚠️";

        return (
          <div
            key={i}
            className={`rounded-xl border ${style.border} ${style.bg} p-4 shadow-sm transition-all hover:shadow-md`}
          >
            <div className="flex items-start gap-3">
              <span className="text-2xl flex-shrink-0 mt-0.5">{icon}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${style.badge}`}
                  >
                    {alert.severity}
                  </span>
                  <span className="text-[10px] font-medium text-gray-500 uppercase">
                    {alert.category}
                  </span>
                </div>
                <h4 className={`text-sm font-semibold ${style.text}`}>{alert.title}</h4>
                <p className="text-xs text-gray-600 mt-1 leading-relaxed">{alert.description}</p>

                {alert.evidence && alert.evidence.length > 0 && (
                  <div className="mt-2">
                    <p className="text-[10px] font-semibold text-gray-500 uppercase mb-1">Evidence</p>
                    <ul className="space-y-0.5">
                      {alert.evidence.map((e, j) => (
                        <li key={j} className="text-xs text-gray-500 flex items-center gap-1">
                          <span className="h-1 w-1 rounded-full bg-gray-400 flex-shrink-0" />
                          {e}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {alert.recommendation && (
                  <div className="mt-2 rounded-lg bg-white/60 border border-gray-200/50 px-3 py-2">
                    <p className="text-[10px] font-semibold text-gray-500 uppercase mb-0.5">
                      Recommendation
                    </p>
                    <p className="text-xs text-gray-700">{alert.recommendation}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
