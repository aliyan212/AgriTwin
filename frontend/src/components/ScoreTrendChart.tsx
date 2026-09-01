"use client";

import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { ScoreSnapshot } from "@/lib/api";

interface ScoreTrendChartProps {
  snapshots: ScoreSnapshot[];
}

const SERIES = [
  { key: "overall", label: "Overall", color: "#16a34a", width: 3 },
  { key: "vegetation", label: "Vegetation", color: "#84cc16", width: 1.5 },
  { key: "water", label: "Water", color: "#0ea5e9", width: 1.5 },
  { key: "weather", label: "Weather", color: "#f59e0b", width: 1.5 },
  { key: "pest_risk", label: "Pest Risk", color: "#ef4444", width: 1.5 },
  { key: "climate", label: "Climate", color: "#a855f7", width: 1.5 },
];

function parseTs(ts: string | null): Date | null {
  if (!ts) return null;
  return new Date(ts.endsWith("Z") ? ts : `${ts}Z`); // server stores UTC without suffix
}

function axisLabel(ts: string | null): string {
  const d = parseTs(ts);
  if (!d) return "";
  return d.toLocaleDateString("en-PK", { day: "numeric", month: "short" });
}

export default function ScoreTrendChart({ snapshots }: ScoreTrendChartProps) {
  const header = (
    <div className="mb-4">
      <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
        Health Score Trend
      </h3>
      <p className="text-[10px] text-gray-400 mt-0.5">
        Snapshot recorded on every intelligence refresh (deduplicated hourly)
      </p>
    </div>
  );

  if (snapshots.length === 0) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        {header}
        <p className="text-sm text-gray-400 py-8 text-center">
          No score snapshots yet — open the farm dashboard to record the first one.
        </p>
      </div>
    );
  }

  const data = snapshots.map((s) => {
    const d = parseTs(s.timestamp);
    return {
      label: axisLabel(s.timestamp),
      time: d ? d.toLocaleString("en-PK", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : "—",
      overall: s.overall,
      vegetation: s.vegetation,
      water: s.water,
      weather: s.weather,
      pest_risk: s.pest_risk,
      climate: s.climate,
    };
  });

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      {header}
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 10, left: -18, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 10 }}
              interval="preserveStartEnd"
            />
            <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
            <Tooltip
              contentStyle={{ fontSize: 12, borderRadius: 8 }}
              labelFormatter={(_, payload) =>
                payload?.length ? (payload[0].payload as { time: string }).time : ""
              }
            />
            <Legend wrapperStyle={{ fontSize: 11 }} iconSize={8} />
            {SERIES.map((s) => (
              <Line
                key={s.key}
                type="monotone"
                dataKey={s.key}
                name={s.label}
                stroke={s.color}
                strokeWidth={s.width}
                dot={{ r: 2, fill: s.color }}
                activeDot={{ r: 4 }}
                connectNulls
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
