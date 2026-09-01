"use client";

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
  if (v == null) return "text-gray-500";
  const a = Math.abs(v);
  if (a >= 4) return "text-red-600";
  if (a >= 2) return "text-amber-600";
  return "text-green-600";
}

function anomalyBadge(v: number | null): string {
  if (v == null) return "bg-gray-100 text-gray-600";
  const a = Math.abs(v);
  if (a >= 4) return "bg-red-100 text-red-700";
  if (a >= 2) return "bg-amber-100 text-amber-700";
  return "bg-green-100 text-green-700";
}

export default function ClimateCard({ climate, currentTemp, currentHumidity }: ClimateCardProps) {
  if (!climate || climate.historical_mean_temp_c == null) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
          Climate Baseline
        </h3>
        <p className="text-sm text-gray-400">
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
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
          Climate vs. Historical
        </h3>
        <span className="rounded bg-indigo-100 px-2 py-0.5 text-[10px] font-medium text-indigo-700">
          NASA POWER
        </span>
      </div>

      {/* Temperature anomaly — hero metric */}
      <div className="flex items-center gap-4 mb-4">
        <div className="flex-1">
          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">
            Temperature Anomaly
          </p>
          <div className="flex items-baseline gap-2 mt-1">
            <span className={`text-3xl font-bold ${anomalyColor(tempAnomaly)}`}>
              {tempAnomaly != null ? `${tempAnomaly > 0 ? "+" : ""}${tempAnomaly.toFixed(1)}°C` : "—"}
            </span>
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${anomalyBadge(tempAnomaly)}`}>
              {statusText}
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Current {currentTemp != null ? `${currentTemp.toFixed(1)}°C` : "—"} vs.{" "}
            {climate.historical_mean_temp_c.toFixed(1)}°C baseline
            {climate.baseline_period ? ` (${climate.baseline_period})` : ""}
          </p>
        </div>
      </div>

      {/* Comparison rows */}
      <div className="space-y-2 border-t border-gray-100 pt-3">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-500">Historical mean temp</span>
          <span className="font-medium text-gray-900">
            {climate.historical_mean_temp_c.toFixed(1)}°C
          </span>
        </div>
        {climate.historical_mean_humidity_pct != null && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">Humidity (now)</span>
            <span className="font-medium text-gray-900">
              {currentHumidity != null ? `${currentHumidity.toFixed(0)}%` : "—"}
              <span className="text-gray-400 font-normal">
                {" "}vs {climate.historical_mean_humidity_pct.toFixed(0)}%
              </span>
            </span>
          </div>
        )}
        {humAnomaly != null && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">Humidity anomaly</span>
            <span className={`font-medium ${anomalyColor(humAnomaly)}`}>
              {humAnomaly > 0 ? "+" : ""}
              {humAnomaly.toFixed(1)}%
            </span>
          </div>
        )}
        {climate.historical_total_precip_mm != null && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">Rainfall, baseline month total</span>
            <span className="font-medium text-gray-900">
              {climate.historical_total_precip_mm.toFixed(1)} mm
            </span>
          </div>
        )}
        <div className="flex items-center justify-between text-xs pt-1">
          <span className="text-gray-400">Baseline source</span>
          <span className="text-gray-500">{climate.baseline_source ?? "NASA POWER (MERRA-2)"}</span>
        </div>
      </div>
    </div>
  );
}
