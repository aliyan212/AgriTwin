"use client";

import {
  BarChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ComposedChart,
} from "recharts";
import type { ForecastDay } from "@/lib/api";

interface ForecastChartProps {
  data: ForecastDay[];
  loading?: boolean;
}

export default function ForecastChart({ data, loading }: ForecastChartProps) {
  if (loading) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <h3 className="mb-3 text-sm font-semibold text-gray-500 uppercase tracking-wide">
          7-Day Forecast
        </h3>
        <div className="flex items-center justify-center py-12">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
        </div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <h3 className="mb-3 text-sm font-semibold text-gray-500 uppercase tracking-wide">
          7-Day Forecast
        </h3>
        <p className="text-sm text-gray-400">
          Select a farm to see the weather forecast.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
          7-Day Forecast
        </h3>
        <span className="rounded bg-blue-100 px-2 py-0.5 text-[10px] font-medium text-blue-700">
          Open-Meteo
        </span>
      </div>

      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 11 }}
              angle={-20}
              textAnchor="end"
              height={50}
            />
            <YAxis
              yAxisId="temp"
              orientation="left"
              tick={{ fontSize: 11 }}
              label={{ value: "°C", angle: -90, position: "insideLeft", style: { fontSize: 11 } }}
            />
            <YAxis
              yAxisId="rain"
              orientation="right"
              tick={{ fontSize: 11 }}
              label={{ value: "mm", angle: 90, position: "insideRight", style: { fontSize: 11 } }}
            />
            <Tooltip
              contentStyle={{ fontSize: 12, borderRadius: 8 }}
              formatter={(value, name) => {
                const v = Number(value);
                if (name === "precipitation_mm") return [`${v.toFixed(1)} mm`, "Rain"];
                if (name === "temp_max") return [`${v.toFixed(1)}°C`, "High Temp"];
                if (name === "temp_min") return [`${v.toFixed(1)}°C`, "Low Temp"];
                return [value, name];
              }}
            />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Bar
              yAxisId="rain"
              dataKey="precipitation_mm"
              fill="#60a5fa"
              radius={[3, 3, 0, 0]}
              name="Rain"
            />
            <Line
              yAxisId="temp"
              type="monotone"
              dataKey="temp_max"
              stroke="#ef4444"
              strokeWidth={2}
              dot={{ r: 3, fill: "#ef4444" }}
              name="High Temp"
            />
            <Line
              yAxisId="temp"
              type="monotone"
              dataKey="temp_min"
              stroke="#3b82f6"
              strokeWidth={2}
              dot={{ r: 3, fill: "#3b82f6" }}
              name="Low Temp"
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Summary row */}
      <div className="mt-3 flex items-center justify-around border-t border-gray-100 pt-3">
        {data.slice(0, 7).map((d) => (
          <div key={d.date} className="text-center">
            <p className="text-[10px] text-gray-400">{d.label.split(" ")[0]}</p>
            <p className="text-xs font-semibold text-red-500">{d.temp_max?.toFixed(0)}°</p>
            <p className="text-xs text-blue-500">{d.temp_min?.toFixed(0)}°</p>
            {(d.precipitation_mm ?? 0) > 0 && (
              <p className="text-[10px] text-blue-400">{d.precipitation_mm?.toFixed(1)}mm</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
