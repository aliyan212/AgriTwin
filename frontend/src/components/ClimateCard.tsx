"use client";

import Icon from "@/components/Icon";
import { useLanguage } from "./LanguageProvider";

interface ClimateCardProps {
  climate: {
    baseline_period: string | null;
    baseline_source: string | null;
    historical_mean_temp_c: number | null;
    temp_anomaly_c: number | null;
    historical_mean_humidity_pct: number | null;
    humidity_anomaly_pct: number | null;
    historical_total_precip_mm: number | null;
  } | null;
  currentTemp: number | null;
  currentHumidity: number | null;
}

function anomalyBadge(v: number | null, isUrdu = false): { label: string; text: string; bg: string; ring: string } {
  if (v == null) return { label: isUrdu ? "کوئی فرق نہیں" : "No Anomaly", text: "text-dim", bg: "bg-ink/6", ring: "ring-ink/10" };
  const a = Math.abs(v);
  if (a >= 4) return { label: isUrdu ? "شدید موسمی فرق" : "Severe Deviation", text: "text-rose-300", bg: "bg-rose-500/15", ring: "ring-rose-400/30" };
  if (a >= 2) return { label: isUrdu ? "درمیانہ موسمی فرق" : "Moderate Deviation", text: "text-amber-300", bg: "bg-amber-500/15", ring: "ring-amber-400/30" };
  if (a >= 1) return { label: isUrdu ? "ہلکا موسمی فرق" : "Mild Deviation", text: "text-yellow-300", bg: "bg-yellow-500/15", ring: "ring-yellow-400/30" };
  return { label: isUrdu ? "معمول دے مطابق" : "Historical Normal", text: "text-emerald-300", bg: "bg-emerald-500/15", ring: "ring-emerald-400/30" };
}

function anomalyColor(v: number | null): string {
  if (v == null) return "text-dim";
  const a = Math.abs(v);
  if (a >= 4) return "text-rose-400";
  if (a >= 2) return "text-amber-400";
  return "text-emerald-400";
}

export default function ClimateCard({ climate, currentTemp, currentHumidity }: ClimateCardProps) {
  const { t, isUrdu } = useLanguage();

  if (!climate || climate.historical_mean_temp_c == null) {
    return (
      <div className="glass-panel p-5">
        <h3 className="mb-3 text-xs font-semibold uppercase tracking-widest text-mist">
          {t("climateCardTitle", "Climate Baseline Analysis")}
        </h3>
        <div className="rounded-xl border border-ink/6 bg-ink/[0.02] p-8 text-center">
          <Icon name="globe" size={28} className="mx-auto text-dim mb-2" />
          <p className="text-sm font-medium text-ink">
            {isUrdu ? "ناسا پاور 30 سالہ ریکارڈ لوڈ ہو رہیا اے" : "NASA POWER Baseline Syncing"}
          </p>
          <p className="text-xs text-dim mt-1">
            {isUrdu
              ? "موسمیاتی تجزیہ تے 30 سالہ پرانا ریکارڈ جلد ظاہر ہوئے گا۔"
              : "Historical climate reanalysis model data will appear once loaded."}
          </p>
        </div>
      </div>
    );
  }

  const tempAnomaly = climate.temp_anomaly_c;
  const humAnomaly = climate.humidity_anomaly_pct;
  const badge = anomalyBadge(tempAnomaly, isUrdu);

  return (
    <div className="glass-panel p-5 relative overflow-hidden">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-indigo-500/15 text-indigo-400 ring-1 ring-indigo-400/30">
            <Icon name="globe" size={14} />
          </span>
          <h3 className="text-xs font-semibold uppercase tracking-widest text-mist">
            {t("climateCardTitle", "NASA POWER Climate Baseline")}
          </h3>
        </div>

        <span className="hud-pill text-indigo-300 border-indigo-400/25 bg-indigo-500/10">
          MERRA-2 Reanalysis
        </span>
      </div>

      {/* Hero Temperature Anomaly */}
      <div className="mb-4 rounded-xl border border-ink/6 bg-ink/[0.03] p-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <span className="text-[10px] font-mono uppercase tracking-wider text-dim block">
              {t("tempAnomaly", "Temperature Thermal Anomaly")}
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className={`text-3xl font-bold font-mono tabular-nums ${anomalyColor(tempAnomaly)}`}>
                {tempAnomaly != null
                  ? `${tempAnomaly > 0 ? "+" : ""}${tempAnomaly.toFixed(1)}°C`
                  : "0.0°C"}
              </span>
              <span className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-semibold ring-1 ${badge.bg} ${badge.text} ${badge.ring}`}>
                {badge.label}
              </span>
            </div>
          </div>

          <div className="text-left sm:text-right border-t sm:border-t-0 border-ink/6 pt-2 sm:pt-0">
            <span className="text-[10px] font-mono uppercase tracking-wider text-dim block">
              {isUrdu ? "موجودہ بمقابلہ 30 سالہ اوسط" : "Current vs. Historical Normal"}
            </span>
            <p className="text-xs text-mist font-medium mt-0.5">
              {currentTemp != null ? `${currentTemp.toFixed(1)}°C` : "—"} {isUrdu ? "موجودہ بمقابلہ " : "observed vs. "}
              <span className="text-ink font-semibold">{climate.historical_mean_temp_c.toFixed(1)}°C</span> {isUrdu ? "معمول" : "normal"}
            </p>
          </div>
        </div>
      </div>

      {/* Comparison Metrics Grid */}
      <div className="space-y-2.5 rounded-xl border border-ink/6 bg-ink/[0.02] p-3 text-xs">
        {/* Humidity Comparison */}
        {climate.historical_mean_humidity_pct != null && (
          <div className="flex items-center justify-between pb-2 border-b border-ink/6">
            <span className="text-mist flex items-center gap-1.5">
              <Icon name="droplet" size={12} className="text-sky-400" />
              {t("humidityAnomaly", "Relative Humidity Anomaly")}
            </span>
            <div className="flex items-center gap-2 font-mono">
              <span className="text-ink font-semibold">
                {currentHumidity != null ? `${currentHumidity.toFixed(0)}%` : "—"}
              </span>
              <span className="text-dim">vs. {climate.historical_mean_humidity_pct.toFixed(0)}% {isUrdu ? "اوسط" : "normal"}</span>
              {humAnomaly != null && (
                <span className={`font-semibold ${anomalyColor(humAnomaly)}`}>
                  ({humAnomaly > 0 ? "+" : ""}{humAnomaly.toFixed(1)}%)
                </span>
              )}
            </div>
          </div>
        )}

        {/* Precipitation Monthly Baseline */}
        {climate.historical_total_precip_mm != null && (
          <div className="flex items-center justify-between pb-2 border-b border-ink/6">
            <span className="text-mist flex items-center gap-1.5">
              <Icon name="cloudRain" size={12} className="text-blue-400" />
              {t("historicalPrecip", "Historical Monthly Precipitation")}
            </span>
            <span className="font-mono font-semibold text-ink">
              {climate.historical_total_precip_mm.toFixed(1)} mm {isUrdu ? "معمول" : "normal"}
            </span>
          </div>
        )}

        {/* 30-Year Baseline Period info */}
        <div className="flex items-center justify-between text-[10px] font-mono text-dim pt-0.5">
          <span>{isUrdu ? "بنیادی دورانیہ" : "Baseline Period"}: {climate.baseline_period || "1991–2020"}</span>
          <span>{climate.baseline_source || "NASA POWER MERRA-2"}</span>
        </div>
      </div>
    </div>
  );
}
