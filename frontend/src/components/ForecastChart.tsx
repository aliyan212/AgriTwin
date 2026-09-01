"use client";

import {
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
import Icon from "@/components/Icon";

interface ForecastChartProps {
  data: ForecastDay[];
  loading?: boolean;
}

const TOOLTIP_STYLE = {
  fontSize: 12,
  borderRadius: 10,
  background: "rgba(11,18,16,0.95)",
  border: "1px solid rgba(255,255,255,0.12)",
  color: "#ecf5ef",
};

export default function ForecastChart({ data, loading }: ForecastChartProps) {
  if (loading) {
    return (
      <div className="glass-panel p-5">
        <h3 className="mb-3 text-xs font-semibold uppercase tracking-widest text-mist">
          7-Day Forecast
        </h3>
        <div className="flex items-center justify-center py-12">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-sky-400 border-t-transparent" />
        </div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="glass-panel p-5">
        <h3 className="mb-3 text-xs font-semibold uppercase tracking-widest text-mist">
          7-Day Forecast
        </h3>
        <p className="text-sm text-dim">
          Select a farm to see the weather forecast.
        </p>
      </div>
    );
  }

  return (
    <div className="glass-panel p-5">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-mist">
          <Icon name="cloudSun" size={13} className="text-sky-300" />
          7-Day Forecast
        </h3>
        <span className="rounded-md border border-sky-400/25 bg-sky-400/10 px-2 py-0.5 text-[10px] font-medium text-sky-300">
          Open-Meteo
        </span>
      </div>

      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 11, fill: "#9db4a7" }}
              angle={-20}
              textAnchor="end"
              height={50}
              stroke="rgba(255,255,255,0.15)"
            />
            <YAxis
              yAxisId="temp"
              orientation="left"
              tick={{ fontSize: 11, fill: "#9db4a7" }}
              stroke="rgba(255,255,255,0.15)"
              label={{ value: "°C", angle: -90, position: "insideLeft", style: { fontSize: 11, fill: "#5f7268" } }}
            />
            <YAxis
              yAxisId="rain"
              orientation="right"
              tick={{ fontSize: 11, fill: "#9db4a7" }}
              stroke="rgba(255,255,255,0.15)"
              label={{ value: "mm", angle: 90, position: "insideRight", style: { fontSize: 11, fill: "#5f7268" } }}
            />
            <Tooltip
              contentStyle={TOOLTIP_STYLE}
              formatter={(value, name) => {
                const v = Number(value);
                if (name === "precipitation_mm") return [`${v.toFixed(1)} mm`, "Rain"];
                if (name === "temp_max") return [`${v.toFixed(1)}°C`, "High Temp"];
                if (name === "temp_min") return [`${v.toFixed(1)}°C`, "Low Temp"];
                return [value, name];
              }}
            />
            <Legend wrapperStyle={{ fontSize: 12, color: "#9db4a7" }} />
            <Bar
              yAxisId="rain"
              dataKey="precipitation_mm"
              fill="rgba(56,189,248,0.45)"
              radius={[3, 3, 0, 0]}
              name="Rain"
            />
            <Line
              yAxisId="temp"
              type="monotone"
              dataKey="temp_max"
              stroke="#fb7185"
              strokeWidth={2}
              dot={{ r: 3, fill: "#fb7185", stroke: "none" }}
              name="High Temp"
            />
            <Line
              yAxisId="temp"
              type="monotone"
              dataKey="temp_min"
              stroke="#38bdf8"
              strokeWidth={2}
              dot={{ r: 3, fill: "#38bdf8", stroke: "none" }}
              name="Low Temp"
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Summary row */}
      <div className="mt-3 flex items-center justify-around border-t border-white/6 pt-3">
        {data.slice(0, 7).map((d) => (
          <div key={d.date} className="text-center">
            <p className="text-[10px] uppercase tracking-wide text-dim">{d.label.split(" ")[0]}</p>
            <p className="text-xs font-semibold tabular-nums text-rose-400">{d.temp_max?.toFixed(0)}°</p>
            <p className="text-xs tabular-nums text-sky-400">{d.temp_min?.toFixed(0)}°</p>
            {(d.precipitation_mm ?? 0) > 0 && (
              <p className="text-[10px] tabular-nums text-sky-300/70">{d.precipitation_mm?.toFixed(1)}mm</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
