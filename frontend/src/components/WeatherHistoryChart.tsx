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

interface WeatherHistoryChartProps {
  observations: WeatherObservation[];
}

function parseTs(ts: string | null): Date | null {
  if (!ts) return null;
  return new Date(ts.endsWith("Z") ? ts : `${ts}Z`);
}

const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ name: string; value: number; color: string; payload: { time: string } }> }) => {
  if (active && payload && payload.length) {
    const time = payload[0]?.payload?.time || "";
    return (
      <div className="rounded-xl border border-ink/12 bg-panel/95 p-3 shadow-2xl backdrop-blur-xl text-xs font-mono">
        <p className="text-dim text-[10px] mb-1.5 pb-1 border-b border-ink/8">{time}</p>
        <div className="space-y-1">
          {payload.map((entry) => (
            <div key={entry.name} className="flex items-center justify-between gap-3">
              <span className="flex items-center gap-1 text-mist">
                <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: entry.color }} />
                {entry.name}:
              </span>
              <span className="font-bold text-ink tabular-nums">
                {entry.name.includes("Temp")
                  ? `${entry.value}°C`
                  : entry.name.includes("Rain")
                    ? `${entry.value} mm`
                    : `${entry.value}%`}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }
  return null;
};

export default function WeatherHistoryChart({ observations }: WeatherHistoryChartProps) {
  const header = (
    <div className="mb-4 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-sky-500/15 text-sky-400 ring-1 ring-sky-400/30">
          <Icon name="cloudSun" size={14} />
        </span>
        <h3 className="text-xs font-semibold uppercase tracking-widest text-mist">
          Weather Observations History
        </h3>
      </div>
      <span className="hud-pill text-sky-300 border-sky-400/25 bg-sky-500/10">
        Open-Meteo Logs
      </span>
    </div>
  );

  if (observations.length === 0) {
    return (
      <div className="glass-panel p-5">
        {header}
        <div className="rounded-xl border border-ink/6 bg-ink/[0.02] p-8 text-center">
          <Icon name="cloudSun" size={24} className="mx-auto text-dim mb-2" />
          <p className="text-xs text-dim">
            No meteorological observations logged yet.
          </p>
        </div>
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
    <div className="glass-panel p-5 relative overflow-hidden">
      {header}
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 10, fill: "#9db4a7", fontFamily: "var(--font-mono)" }}
              stroke="rgba(255,255,255,0.1)"
            />
            <YAxis
              yAxisId="left"
              domain={[0, 100]}
              tick={{ fontSize: 10, fill: "#9db4a7", fontFamily: "var(--font-mono)" }}
              stroke="rgba(255,255,255,0.1)"
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              tick={{ fontSize: 10, fill: "#9db4a7", fontFamily: "var(--font-mono)" }}
              stroke="rgba(255,255,255,0.1)"
              unit="m"
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              wrapperStyle={{ fontSize: 11, fontFamily: "var(--font-mono)", paddingTop: 8 }}
              iconSize={8}
            />
            <Bar
              yAxisId="right"
              dataKey="rainfall_mm"
              name="Rain (mm)"
              fill="rgba(56,189,248,0.4)"
              radius={[3, 3, 0, 0]}
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
