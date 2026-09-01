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
import Icon from "@/components/Icon";

const TOOLTIP_STYLE = {
  fontSize: 12,
  borderRadius: 10,
  background: "rgba(11,18,16,0.95)",
  border: "1px solid rgba(255,255,255,0.12)",
  color: "#ecf5ef",
};

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
      <h3 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-mist">
        <Icon name="cloudSun" size={13} className="text-sky-400" />
        Weather Observations
      </h3>
      <p className="mt-0.5 text-[10px] text-dim">
        Ground conditions captured on each intelligence refresh · Open-Meteo
      </p>
    </div>
  );

  if (observations.length === 0) {
    return (
      <div className="glass-panel p-5">
        {header}
        <p className="py-8 text-center text-sm text-dim">
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
    <div className="glass-panel p-5">
      {header}
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 5, right: 0, left: -18, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 10, fill: "#9db4a7" }}
              interval="preserveStartEnd"
              stroke="rgba(255,255,255,0.15)"
            />
            <YAxis yAxisId="left" domain={[0, 100]} tick={{ fontSize: 11, fill: "#9db4a7" }} stroke="rgba(255,255,255,0.15)" />
            <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11, fill: "#9db4a7" }} stroke="rgba(255,255,255,0.15)" />
            <Tooltip
              contentStyle={TOOLTIP_STYLE}
              labelFormatter={(_, payload) =>
                payload?.length ? (payload[0].payload as { time: string }).time : ""
              }
            />
            <Legend wrapperStyle={{ fontSize: 11, color: "#9db4a7" }} iconSize={8} />
            <Bar
              yAxisId="right"
              dataKey="rainfall_mm"
              name="Rain (mm)"
              fill="rgba(56,189,248,0.35)"
              radius={[2, 2, 0, 0]}
            />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="temperature_c"
              name="Temp (°C)"
              stroke="#f87171"
              strokeWidth={2}
              dot={{ r: 2, fill: "#f87171", stroke: "none" }}
              connectNulls
            />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="humidity_pct"
              name="Humidity (%)"
              stroke="#38bdf8"
              strokeWidth={2}
              dot={{ r: 2, fill: "#38bdf8", stroke: "none" }}
              connectNulls
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
