"use client";

import type { FarmAlert } from "@/lib/api";
import Icon, { type IconName } from "@/components/Icon";

const severityStyles: Record<string, { bg: string; border: string; badge: string; text: string; icon: string }> = {
  critical: {
    bg: "bg-red-500/8",
    border: "border-red-400/25",
    badge: "bg-red-500/20 text-red-300 ring-1 ring-red-400/30",
    text: "text-red-300",
    icon: "text-red-400",
  },
  warning: {
    bg: "bg-amber-500/8",
    border: "border-amber-400/25",
    badge: "bg-amber-500/20 text-amber-300 ring-1 ring-amber-400/30",
    text: "text-amber-300",
    icon: "text-amber-400",
  },
  info: {
    bg: "bg-sky-500/8",
    border: "border-sky-400/25",
    badge: "bg-sky-500/20 text-sky-300 ring-1 ring-sky-400/30",
    text: "text-sky-300",
    icon: "text-sky-400",
  },
};

const categoryIcons: Record<string, IconName> = {
  irrigation: "droplet",
  heat: "thermometer",
  climate: "thermometer",
  vegetation: "sprout",
  pest: "bug",
  rain: "cloudRain",
  wind: "wind",
  general: "info",
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
      <div className="glass-panel p-5 text-center">
        <div className="mx-auto mb-2 h-6 w-6 animate-spin rounded-full border-2 border-brand border-t-transparent" />
        <p className="text-xs text-mist">Analyzing risks...</p>
      </div>
    );
  }

  if (!alerts || alerts.length === 0) {
    return (
      <div className="glass-panel border-emerald-400/20 bg-emerald-500/5 p-5">
        <p className="flex items-center gap-2 text-sm font-medium text-emerald-300">
          <Icon name="shield" size={16} className="text-emerald-400" />
          No active alerts
        </p>
        <p className="mt-1 text-xs text-mist">All conditions are within normal ranges.</p>
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
        const icon = categoryIcons[alert.category] ?? "alert";

        return (
          <div
            key={i}
            className={`rounded-2xl border ${style.border} ${style.bg} p-4 backdrop-blur-sm transition-colors hover:bg-white/[0.03]`}
          >
            <div className="flex items-start gap-3">
              <span className={`mt-0.5 flex-shrink-0 ${style.icon}`}>
                <Icon name={icon} size={20} />
              </span>
              <div className="min-w-0 flex-1">
                <div className="mb-1 flex items-center gap-2">
                  <span
                    className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${style.badge}`}
                  >
                    {alert.severity}
                  </span>
                  <span className="text-[10px] font-medium uppercase tracking-wider text-dim">
                    {alert.category}
                  </span>
                </div>
                <h4 className={`text-sm font-semibold ${style.text}`}>{alert.title}</h4>
                <p className="mt-1 text-xs leading-relaxed text-mist">{alert.description}</p>

                {alert.evidence && alert.evidence.length > 0 && (
                  <div className="mt-2">
                    <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-dim">Evidence</p>
                    <ul className="space-y-0.5">
                      {alert.evidence.map((e, j) => (
                        <li key={j} className="flex items-center gap-1.5 text-xs text-mist">
                          <span className="h-1 w-1 flex-shrink-0 rounded-full bg-dim" />
                          {e}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {alert.recommendation && (
                  <div className="mt-2 rounded-lg border border-white/8 bg-white/4 px-3 py-2">
                    <p className="mb-0.5 text-[10px] font-semibold uppercase tracking-wider text-dim">
                      Recommendation
                    </p>
                    <p className="text-xs text-ink/90">{alert.recommendation}</p>
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
