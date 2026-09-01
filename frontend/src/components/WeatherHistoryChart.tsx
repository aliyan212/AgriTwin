"use client";

import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { WeatherObservation } from "@/lib/api";

interface WeatherHistoryChartProps {
  observations: WeatherObservation[];
}

function parseTs(ts: string | null): Date | null {
  if (!ts) return null;
  return new Date(ts.endsWith("Z") ? ts : `${ts}Z`); // server stores UTC without suffix
}

export default function WeatherHistoryChart({ observations }: WeatherHistoryChartProps) {
  const header = (
    <div className="mb-4">
      <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
        Weather Observations
      </h3>
      <p className="text-[10px] text-gray-400 mt-0.5">
        Ground conditions captured on each intelligence refresh · Open-Meteo
      </p>
    </div>
  );

  if (observations.length === 0) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        {header}
        <p className="text-sm text-gray-400 py-8 text-center">
          No weather observations recorded yet.
        </p>
      </div>
    );
  }

  const data = observations.map((o) => {
    const d = parseTs(o.timestamp);
    return {
      label: d
        ? d.toLocaleDateString("en-PK", { day: "numeric", month: "short" })
        : "",
      time: d
        ? d.toLocaleString("en-PK", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })
        : "—",
      temperature_c: o.temperature_c,
      humidity_pct: o.humidity_pct,
      rainfall_mm: o.rainfall_mm,
    };
  });

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      {header}
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 5, right: 0, left: -18, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="label" tick={{ fontSize: 10 }} interval="preserveStartEnd" />
            <YAxis yAxisId="left" domain={[0, 100]} tick={{ fontSize: 11 }} />
            <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} />
            <Tooltip
              contentStyle={{ fontSize: 12, borderRadius: 8 }}
              labelFormatter={(_, payload) =>
                payload?.length ? (payload[0].payload as { time: string }).time : ""
              }
            />
            <Legend wrapperStyle={{ fontSize: 11 }} iconSize={8} />
            <Bar
              yAxisId="right"
              dataKey="rainfall_mm"
              name="Rain (mm)"
              fill="#bae6fd"
              radius={[2, 2, 0, 0]}
            />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="temperature_c"
              name="Temp (°C)"
              stroke="#ef4444"
              strokeWidth={2}
              dot={{ r: 2, fill: "#ef4444" }}
              connectNulls
            />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="humidity_pct"
              name="Humidity (%)"
              stroke="#0ea5e9"
              strokeWidth={2}
              dot={{ r: 2, fill: "#0ea5e9" }}
              connectNulls
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
