"use client";

import Icon from "@/components/Icon";

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

function anomalyColor(v: number | null): string {
  if (v == null) return "text-dim";
  const a = Math.abs(v);
  if (a >= 4) return "text-red-400";
  if (a >= 2) return "text-amber-400";
  return "text-emerald-400";
}

function anomalyBadge(v: number | null): string {
  if (v == null) return "bg-white/8 text-mist";
  const a = Math.abs(v);
  if (a >= 4) return "bg-red-500/15 text-red-300 ring-1 ring-red-400/25";
  if (a >= 2) return "bg-amber-500/15 text-amber-300 ring-1 ring-amber-400/25";
  return "bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-400/25";
}

export default function ClimateCard({ climate, currentTemp, currentHumidity }: ClimateCardProps) {
  if (!climate || climate.historical_mean_temp_c == null) {
    return (
      <div className="glass-panel p-5">
        <h3 className="mb-3 text-xs font-semibold uppercase tracking-widest text-mist">
          Climate Baseline
        </h3>
        <p className="text-sm text-dim">
          Historical baseline is not available right now (NASA POWER unreachable).
        </p>
      </div>
    );
  }

  const tempAnomaly = climate.temp_anomaly_c;
  const humAnomaly = climate.humidity_anomaly_pct;
  const statusText =
    tempAnomaly == null
      ? "No anomaly computed"
      : Math.abs(tempAnomaly) < 1
        ? "Near normal"
        : Math.abs(tempAnomaly) < 2
          ? "Mild deviation"
          : Math.abs(tempAnomaly) < 4
            ? "Moderate deviation"
            : "Extreme deviation";

  return (
    <div className="glass-panel p-5">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-xs font-semibold uppercase tracking-widest text-mist">
          Climate vs. Historical
        </h3>
        <span className="flex items-center gap-1 rounded-full bg-indigo-500/15 px-2 py-0.5 text-[10px] font-medium text-indigo-300 ring-1 ring-indigo-400/25">
          <Icon name="globe" size={10} />
          NASA POWER
        </span>
      </div>

      {/* Temperature anomaly — hero metric */}
      <div className="mb-4 flex items-center gap-4">
        <div className="flex-1">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-dim">
            Temperature Anomaly
          </p>
          <div className="mt-1 flex items-baseline gap-2">
            <span className={`text-3xl font-bold tabular-nums ${anomalyColor(tempAnomaly)}`}>
              {tempAnomaly != null ? `${tempAnomaly > 0 ? "+" : ""}${tempAnomaly.toFixed(1)}°C` : "—"}
            </span>
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${anomalyBadge(tempAnomaly)}`}>
              {statusText}
            </span>
          </div>
          <p className="mt-1 text-xs text-mist">
            Current {currentTemp != null ? `${currentTemp.toFixed(1)}°C` : "—"} vs.{" "}
            {climate.historical_mean_temp_c.toFixed(1)}°C baseline
            {climate.baseline_period ? ` (${climate.baseline_period})` : ""}
          </p>
        </div>
      </div>

      {/* Comparison rows */}
      <div className="space-y-2 border-t border-white/8 pt-3">
        <div className="flex items-center justify-between text-sm">
          <span className="text-mist">Historical mean temp</span>
          <span className="font-medium tabular-nums text-ink">
            {climate.historical_mean_temp_c.toFixed(1)}°C
          </span>
        </div>
        {climate.historical_mean_humidity_pct != null && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-mist">Humidity (now)</span>
            <span className="font-medium tabular-nums text-ink">
              {currentHumidity != null ? `${currentHumidity.toFixed(0)}%` : "—"}
              <span className="font-normal text-dim">
                {" "}vs {climate.historical_mean_humidity_pct.toFixed(0)}%
              </span>
            </span>
          </div>
        )}
        {humAnomaly != null && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-mist">Humidity anomaly</span>
            <span className={`font-medium tabular-nums ${anomalyColor(humAnomaly)}`}>
              {humAnomaly > 0 ? "+" : ""}
              {humAnomaly.toFixed(1)}%
            </span>
          </div>
        )}
        {climate.historical_total_precip_mm != null && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-mist">Rainfall, baseline month total</span>
            <span className="font-medium tabular-nums text-ink">
              {climate.historical_total_precip_mm.toFixed(1)} mm
            </span>
          </div>
        )}
        <div className="flex items-center justify-between pt-1 text-xs">
          <span className="text-dim">Baseline source</span>
          <span className="text-mist">{climate.baseline_source ?? "NASA POWER (MERRA-2)"}</span>
        </div>
      </div>
    </div>
  );
}
