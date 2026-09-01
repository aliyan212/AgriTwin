"use client";

import Icon, { type IconName } from "@/components/Icon";
import { useLanguage } from "./LanguageProvider";

interface WeatherCardProps {
  data: Record<string, unknown> | null;
  loading?: boolean;
  error?: string | null;
  airQuality?: { pm2_5: number | null; pm10: number | null } | null;
}

function getAqiStatus(pm2_5: number | null, isUrdu = false): { label: string; color: string; bg: string; ring: string } {
  if (pm2_5 == null) return { label: isUrdu ? "نامعلوم" : "Unknown", color: "text-dim", bg: "bg-ink/6", ring: "ring-ink/10" };
  if (pm2_5 <= 35) return { label: isUrdu ? "صاف ہوا" : "Good Air", color: "text-emerald-300", bg: "bg-emerald-500/15", ring: "ring-emerald-400/30" };
  if (pm2_5 <= 75) return { label: isUrdu ? "ہلکی سموگ" : "Moderate Smog", color: "text-amber-300", bg: "bg-amber-500/15", ring: "ring-amber-400/30" };
  if (pm2_5 <= 150) return { label: isUrdu ? "نقصان دہ سموگ" : "Unhealthy Smog", color: "text-orange-300", bg: "bg-orange-500/15", ring: "ring-orange-400/30" };
  return { label: isUrdu ? "شدید خطرناک سموگ" : "Severe Smog Hazard", color: "text-rose-300", bg: "bg-rose-500/15", ring: "ring-rose-400/30" };
}

export default function WeatherCard({ data, loading, error, airQuality }: WeatherCardProps) {
  const { t, isUrdu } = useLanguage();

  if (loading) {
    return (
      <div className="glass-panel p-5">
        <h3 className="mb-3 text-xs font-semibold uppercase tracking-widest text-mist">
          {t("currentWeather", "Live Weather & Soil Conditions")}
        </h3>
        <div className="flex flex-col items-center justify-center py-10">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand border-t-transparent mb-2" />
          <p className="text-xs text-dim font-mono">Syncing Open-Meteo feeds…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="glass-panel border-rose-400/30 bg-rose-500/5 p-5">
        <h3 className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-rose-400">
          <Icon name="alert" size={14} />
          Weather Feed Unavailable
        </h3>
        <p className="text-xs text-rose-300/80 leading-relaxed">{error}</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="glass-panel p-5">
        <h3 className="mb-3 text-xs font-semibold uppercase tracking-widest text-mist">
          {t("currentWeather", "Live Weather & Soil Conditions")}
        </h3>
        <div className="rounded-xl border border-ink/6 bg-ink/[0.02] p-8 text-center">
          <Icon name="cloudSun" size={28} className="mx-auto text-dim mb-2" />
          <p className="text-sm font-medium text-ink">No Farm Selected</p>
          <p className="text-xs text-dim mt-1">
            Choose a farm from the header to view live weather and soil conditions.
          </p>
        </div>
      </div>
    );
  }

  // Parse Open-Meteo response
  const current = (data.current || data) as Record<string, number> | undefined;
  const temp = current?.temperature_2m ?? (data.temperature_c as number | undefined);
  const humidity = current?.relative_humidity_2m ?? (data.humidity_pct as number | undefined);
  const precip = current?.precipitation ?? (data.rainfall_mm as number | undefined);
  const wind = current?.wind_speed_10m ?? (data.wind_speed_kmh as number | undefined);
  const soilMoisture = current?.soil_moisture_0_to_7cm ?? (data.soil_moisture_m3m3 as number | undefined);
  const soilTemp = current?.soil_temperature_0_to_7cm ?? (data.soil_temperature_c as number | undefined);
  const et0 = (data.et0_mm ?? data.et0_fao_evapotranspiration) as number | undefined;

  const aqi = getAqiStatus(airQuality?.pm2_5 ?? null, isUrdu);

  const metrics: {
    label: string;
    value: string;
    icon: IconName;
    subtext: string;
    progress?: number;
    color: string;
  }[] = [
      {
        label: t("humidity", "Relative Humidity"),
        value: humidity != null ? `${humidity}%` : "—",
        icon: "droplet",
        subtext: isUrdu ? "ہوا وچ نمی دا تناسب" : "Ambient air moisture",
        progress: humidity != null ? humidity : undefined,
        color: "from-sky-500 to-sky-300",
      },
      {
        label: t("soilMoisture", "Root Soil Moisture"),
        value: soilMoisture != null ? `${(soilMoisture * 100).toFixed(1)}%` : "—",
        icon: "soil",
        subtext: isUrdu ? "0 توں 7 سینٹی میٹر سطح" : "0–7 cm topsoil layer",
        progress: soilMoisture != null ? Math.min(100, soilMoisture * 200) : undefined,
        color: "from-amber-500 to-amber-300",
      },
      {
        label: t("soilTemp", "Surface Soil Temp"),
        value: soilTemp != null ? `${soilTemp.toFixed(1)}°C` : "—",
        icon: "globe",
        subtext: isUrdu ? "زمین دا اندرونی درجہ حرارت" : "Root microbial zone",
        color: "from-emerald-500 to-emerald-300",
      },
      {
        label: t("windSpeed", "10m Wind Velocity"),
        value: wind != null ? `${wind.toFixed(1)} km/h` : "—",
        icon: "wind",
        subtext: isUrdu ? "سپرے لئی ہوا دی رفتار" : "Spray drift safety",
        progress: wind != null ? Math.min(100, (wind / 40) * 100) : undefined,
        color: "from-teal-500 to-teal-300",
      },
      {
        label: t("rainfall", "Precipitation Rate"),
        value: precip != null ? `${precip.toFixed(1)} mm` : "0.0 mm",
        icon: "cloudRain",
        subtext: isUrdu ? "حالیہ بارش دی مقدار" : "Past hour accumulation",
        color: "from-blue-500 to-blue-300",
      },
      {
        label: t("et0", "Reference ET₀"),
        value: et0 != null ? `${Number(et0).toFixed(1)} mm` : "—",
        icon: "cloudSun",
        subtext: isUrdu ? "روزانہ پانی دی طلب" : "Daily crop water demand",
        color: "from-purple-500 to-purple-300",
      },
    ];

  return (
    <div className="glass-panel p-5 relative overflow-hidden">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-sky-500/15 text-sky-400 ring-1 ring-sky-400/30">
            <Icon name="cloudSun" size={14} />
          </span>
          <h3 className="text-xs font-semibold uppercase tracking-widest text-mist">
            {t("currentWeather", "Agrometeorology & Soil Physics")}
          </h3>
        </div>

        <div className="flex items-center gap-2">
          <span className="hud-pill text-sky-300 border-sky-400/25 bg-sky-500/10">
            Open-Meteo
          </span>
        </div>
      </div>

      {/* Hero Temperature + Air Quality Banner */}
      <div className="mb-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Air Temp Hero */}
        <div className="flex items-center gap-3 rounded-xl border border-ink/6 bg-ink/[0.03] p-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-500/15 text-orange-400 ring-1 ring-orange-400/30">
            <Icon name="thermometer" size={22} />
          </span>
          <div>
            <span className="text-[10px] font-mono uppercase tracking-wider text-dim block">
              Ambient Air Temp
            </span>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-bold font-mono tabular-nums text-ink">
                {temp != null ? `${temp.toFixed(1)}°` : "—"}
              </span>
              <span className="text-xs text-mist font-medium">Celsius</span>
            </div>
          </div>
        </div>

        {/* Smog & Air Quality Card */}
        <div className="flex items-center gap-3 rounded-xl border border-ink/6 bg-ink/[0.03] p-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-500/15 text-amber-400 ring-1 ring-amber-400/30">
            <Icon name="activity" size={20} />
          </span>
          <div className="min-w-0">
            <span className="text-[10px] font-mono uppercase tracking-wider text-dim block">
              Air Quality / Smog Index
            </span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-semibold ring-1 ${aqi.bg} ${aqi.color} ${aqi.ring}`}>
                {aqi.label}
              </span>
              {airQuality?.pm2_5 != null && (
                <span className="font-mono text-[10px] text-dim">
                  PM2.5: {airQuality.pm2_5}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 6-Grid Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
        {metrics.map((m) => (
          <div
            key={m.label}
            className="flex flex-col justify-between rounded-xl border border-ink/6 bg-ink/[0.02] p-3 transition-colors hover:border-ink/12 hover:bg-ink/4"
          >
            <div className="flex items-center justify-between gap-1 mb-1">
              <span className="text-[11px] text-dim truncate">{m.label}</span>
              <Icon name={m.icon} size={13} className="text-dim shrink-0" />
            </div>

            <p className="text-base font-bold font-mono tabular-nums text-ink my-0.5">
              {m.value}
            </p>

            {m.progress !== undefined ? (
              <div className="mt-1 h-1 w-full rounded-full bg-ink/6 overflow-hidden">
                <div
                  className={`h-full rounded-full bg-gradient-to-r ${m.color}`}
                  style={{ width: `${Math.max(0, Math.min(100, m.progress))}%` }}
                />
              </div>
            ) : (
              <span className="text-[10px] text-dim truncate">{m.subtext}</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
