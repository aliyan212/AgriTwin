"use client";

import Icon, { type IconName } from "@/components/Icon";

interface WeatherCardProps {
  data: Record<string, unknown> | null;
  loading?: boolean;
  error?: string | null;
  airQuality?: { pm2_5: number | null; pm10: number | null } | null;
}

export default function WeatherCard({ data, loading, error, airQuality }: WeatherCardProps) {
  if (loading) {
    return (
      <div className="glass-panel p-5">
        <h3 className="mb-3 text-xs font-semibold uppercase tracking-widest text-mist">
          Weather
        </h3>
        <div className="flex items-center justify-center py-8">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand border-t-transparent" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="glass-panel border-red-400/30 p-5">
        <h3 className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-red-400">
          <Icon name="alert" size={14} />
          Weather Error
        </h3>
        <p className="text-sm text-red-300/80">{error}</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="glass-panel p-5">
        <h3 className="mb-3 text-xs font-semibold uppercase tracking-widest text-mist">
          Weather
        </h3>
        <p className="text-sm text-dim">
          Create a farm with coordinates to see weather data.
        </p>
      </div>
    );
  }

  // Parse Open-Meteo response
  const current = data.current as Record<string, number> | undefined;
  const temp = current?.temperature_2m;
  const humidity = current?.relative_humidity_2m;
  const precip = current?.precipitation;
  const wind = current?.wind_speed_10m;
  const cloud = current?.cloud_cover;
  const soilMoisture = current?.soil_moisture_0_to_7cm;
  const soilTemp = current?.soil_temperature_0_to_7cm;

  const metrics: { label: string; value: string; icon: IconName; tint: string }[] = [
    { label: "Temperature", value: temp != null ? `${temp}°C` : "—", icon: "thermometer", tint: "text-orange-300" },
    { label: "Humidity", value: humidity != null ? `${humidity}%` : "—", icon: "droplet", tint: "text-sky-300" },
    { label: "Precipitation", value: precip != null ? `${precip} mm` : "—", icon: "cloudRain", tint: "text-blue-300" },
    { label: "Wind", value: wind != null ? `${wind} km/h` : "—", icon: "wind", tint: "text-teal-300" },
    { label: "Cloud Cover", value: cloud != null ? `${cloud}%` : "—", icon: "cloud", tint: "text-slate-300" },
    { label: "Soil Moisture", value: soilMoisture != null ? `${(soilMoisture * 100).toFixed(1)}%` : "—", icon: "soil", tint: "text-amber-300" },
    { label: "Soil Temp", value: soilTemp != null ? `${soilTemp}°C` : "—", icon: "globe", tint: "text-emerald-300" },
  ];

  return (
    <div className="glass-panel p-5">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-xs font-semibold uppercase tracking-widest text-mist">
          Current Weather
        </h3>
        <div className="flex items-center gap-1.5">
          {airQuality?.pm2_5 != null && (
            <span className="rounded-md border border-orange-400/25 bg-orange-400/10 px-2 py-0.5 text-[10px] font-medium text-orange-300">
              PM2.5 {airQuality.pm2_5} µg/m³
            </span>
          )}
          <span className="rounded-md border border-sky-400/25 bg-sky-400/10 px-2 py-0.5 text-[10px] font-medium text-sky-300">
            Open-Meteo
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2.5">
        {metrics.map((m) => (
          <div
            key={m.label}
            className="flex items-center gap-2.5 rounded-lg border border-white/6 bg-white/4 p-2.5 transition-colors hover:border-white/12 hover:bg-white/6"
          >
            <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/6 ${m.tint}`}>
              <Icon name={m.icon} size={16} />
            </span>
            <div className="min-w-0">
              <p className="truncate text-[11px] text-dim">{m.label}</p>
              <p className="text-sm font-semibold tabular-nums text-ink">{m.value}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
