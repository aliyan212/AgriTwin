"use client";

interface WeatherCardProps {
  data: Record<string, unknown> | null;
  loading?: boolean;
  error?: string | null;
  airQuality?: { pm2_5: number | null; pm10: number | null } | null;
}

export default function WeatherCard({ data, loading, error, airQuality }: WeatherCardProps) {
  if (loading) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <h3 className="mb-3 text-sm font-semibold text-gray-500 uppercase tracking-wide">
          Weather
        </h3>
        <div className="flex items-center justify-center py-8">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-green-500 border-t-transparent" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-5">
        <h3 className="mb-2 text-sm font-semibold text-red-600">Weather Error</h3>
        <p className="text-sm text-red-500">{error}</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <h3 className="mb-3 text-sm font-semibold text-gray-500 uppercase tracking-wide">
          Weather
        </h3>
        <p className="text-sm text-gray-400">
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

  const metrics = [
    { label: "Temperature", value: temp != null ? `${temp}°C` : "—", icon: "🌡️" },
    { label: "Humidity", value: humidity != null ? `${humidity}%` : "—", icon: "💧" },
    { label: "Precipitation", value: precip != null ? `${precip} mm` : "—", icon: "🌧️" },
    { label: "Wind", value: wind != null ? `${wind} km/h` : "—", icon: "💨" },
    { label: "Cloud Cover", value: cloud != null ? `${cloud}%` : "—", icon: "☁️" },
    { label: "Soil Moisture", value: soilMoisture != null ? `${(soilMoisture * 100).toFixed(1)}%` : "—", icon: "🪨" },
    { label: "Soil Temp", value: soilTemp != null ? `${soilTemp}°C` : "—", icon: "🌍" },
  ];

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
          Current Weather
        </h3>
        <div className="flex items-center gap-1.5">
          {airQuality?.pm2_5 != null && (
            <span className="rounded bg-orange-100 px-2 py-0.5 text-[10px] font-medium text-orange-700">
              PM2.5 {airQuality.pm2_5} µg/m³
            </span>
          )}
          <span className="rounded bg-blue-100 px-2 py-0.5 text-[10px] font-medium text-blue-700">
            Open-Meteo
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {metrics.map((m) => (
          <div
            key={m.label}
            className="flex items-center gap-2 rounded-lg bg-gray-50 p-2.5"
          >
            <span className="text-lg">{m.icon}</span>
            <div>
              <p className="text-xs text-gray-500">{m.label}</p>
              <p className="text-sm font-semibold text-gray-900">{m.value}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
