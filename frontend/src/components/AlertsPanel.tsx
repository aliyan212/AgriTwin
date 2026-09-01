"use client";

import type { FarmAlert } from "@/lib/api";
import Icon, { type IconName } from "@/components/Icon";
import { useLanguage } from "./LanguageProvider";

const severityStyles: Record<
  string,
  { bg: string; border: string; badge: string; text: string; icon: string; dot: string }
> = {
  critical: {
    bg: "bg-rose-500/[0.06]",
    border: "border-rose-400/25",
    badge: "bg-rose-500/15 text-rose-300 ring-1 ring-rose-400/30",
    text: "text-rose-200",
    icon: "text-rose-400",
    dot: "bg-rose-400",
  },
  warning: {
    bg: "bg-amber-500/[0.06]",
    border: "border-amber-400/25",
    badge: "bg-amber-500/15 text-amber-300 ring-1 ring-amber-400/30",
    text: "text-amber-200",
    icon: "text-amber-400",
    dot: "bg-amber-400",
  },
  info: {
    bg: "bg-sky-500/[0.06]",
    border: "border-sky-400/25",
    badge: "bg-sky-500/15 text-sky-300 ring-1 ring-sky-400/30",
    text: "text-sky-200",
    icon: "text-sky-400",
    dot: "bg-sky-400",
  },
};

const categoryIcons: Record<string, IconName> = {
  irrigation: "droplet",
  heat: "thermometer",
  climate: "globe",
  vegetation: "sprout",
  pest: "bug",
  rain: "cloudRain",
  wind: "wind",
  general: "info",
};

const categoryLabels: Record<string, { en: string; ur: string }> = {
  irrigation: { en: "Irrigation", ur: "آبپاشی" },
  heat: { en: "Thermal Stress", ur: "گرمی / لو دا دباؤ" },
  climate: { en: "Climate Anomaly", ur: "موسمیاتی فرق" },
  vegetation: { en: "Canopy Density", ur: "فصل دی ہریالی" },
  pest: { en: "Pest Pressure", ur: "کیڑے مکوڑے" },
  rain: { en: "Precipitation", ur: "بارش" },
  wind: { en: "Wind Velocity", ur: "تیز ہوا" },
  general: { en: "General", ur: "عام انتباہ" },
};

export default function AlertsPanel({
  alerts,
  loading,
}: {
  alerts: FarmAlert[];
  loading?: boolean;
}) {
  const { t, isUrdu } = useLanguage();

  if (loading) {
    return (
      <div className="glass-panel p-5 text-center">
        <div className="mx-auto mb-2 h-6 w-6 animate-spin rounded-full border-2 border-brand border-t-transparent" />
        <p className="text-xs text-mist">
          {isUrdu ? "فیلڈ رسک ویکٹرز دی جانچ جاری اے…" : "Scanning farm risk vector matrices…"}
        </p>
      </div>
    );
  }

  if (!alerts || alerts.length === 0) {
    return (
      <div className="glass-panel border-emerald-400/20 bg-emerald-500/[0.03] p-5">
        <div className="flex items-center gap-2 text-sm font-medium text-emerald-300">
          <Icon name="shield" size={16} className="text-emerald-400" />
          {t("noActiveAlerts", "No Active Agronomic Risk Vectors")}
        </div>
        <p className="mt-1 text-xs text-mist">
          {t("noAlertsSubtext", "All weather sensors, satellite indices, and temperature-humidity vectors are within normal physiological thresholds.")}
        </p>
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
        const cat = categoryLabels[alert.category];
        const catName = isUrdu ? cat?.ur || alert.category : cat?.en || alert.category;

        const severityText = isUrdu
          ? alert.severity === "critical"
            ? "فوری توجہ"
            : alert.severity === "warning"
              ? "انتباہ"
              : "اطلاع"
          : alert.severity;

        return (
          <div
            key={i}
            className={`rounded-xl border ${style.border} ${style.bg} p-4 backdrop-blur-md transition-all hover:bg-ink/[0.04]`}
          >
            <div className="flex items-start gap-3">
              <span className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-ink/6 ${style.icon}`}>
                <Icon name={icon} size={15} />
              </span>

              <div className="min-w-0 flex-1">
                <div className="mb-1.5 flex flex-wrap items-center gap-2">
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${style.badge}`}
                  >
                    <span className={`h-1.5 w-1.5 rounded-full ${style.dot} animate-pulse`} />
                    {severityText}
                  </span>
                  <span className="font-mono text-[10px] font-medium uppercase tracking-wider text-dim">
                    {catName}
                  </span>
                </div>

                <h4 className={`text-sm font-semibold ${style.text}`}>{alert.title}</h4>
                <p className="mt-1 text-xs leading-relaxed text-mist">{alert.description}</p>

                {alert.evidence && alert.evidence.length > 0 && (
                  <div className="mt-2.5 rounded-lg border border-ink/6 bg-ink/[0.02] p-2">
                    <p className="mb-1 text-[9px] font-mono font-semibold uppercase tracking-wider text-dim">
                      {t("alertEvidence", "Diagnostic Evidence")}
                    </p>
                    <ul className="space-y-0.5">
                      {alert.evidence.map((e, j) => (
                        <li key={j} className="flex items-center gap-1.5 text-xs text-mist">
                          <span className="h-1 w-1 shrink-0 rounded-full bg-dim" />
                          {e}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {alert.recommendation && (
                  <div className="mt-2 rounded-lg border border-ink/8 bg-ink/4 px-3 py-2">
                    <p className="mb-0.5 text-[9px] font-mono font-semibold uppercase tracking-wider text-brand">
                      {t("alertAction", "Mitigation Action")}
                    </p>
                    <p className="text-xs text-ink/90 leading-relaxed">{alert.recommendation}</p>
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
