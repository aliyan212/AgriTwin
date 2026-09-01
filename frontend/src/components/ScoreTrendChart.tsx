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
import Icon from "@/components/Icon";

const TOOLTIP_STYLE = {
  fontSize: 12,
  borderRadius: 10,
  background: "rgba(11,18,16,0.95)",
  border: "1px solid rgba(255,255,255,0.12)",
  color: "#ecf5ef",
};

interface ScoreTrendChartProps {
  snapshots: ScoreSnapshot[];
}

const SERIES = [
  { key: "overall", label: "Overall", color: "#34d399", width: 3 },
  { key: "vegetation", label: "Vegetation", color: "#a3e635", width: 1.5 },
  { key: "water", label: "Water", color: "#38bdf8", width: 1.5 },
  { key: "weather", label: "Weather", color: "#fbbf24", width: 1.5 },
  { key: "pest_risk", label: "Pest Risk", color: "#f87171", width: 1.5 },
  { key: "climate", label: "Climate", color: "#c084fc", width: 1.5 },
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
      <h3 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-mist">
        <Icon name="activity" size={13} className="text-emerald-400" />
        Health Score Trend
      </h3>
      <p className="mt-0.5 text-[10px] text-dim">
        Snapshot recorded on every intelligence refresh (deduplicated hourly)
      </p>
    </div>
  );

  if (snapshots.length === 0) {
    return (
      <div className="glass-panel p-5">
        {header}
        <p className="py-8 text-center text-sm text-dim">
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
    <div className="glass-panel p-5">
      {header}
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 10, left: -18, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 10, fill: "#9db4a7" }}
              interval="preserveStartEnd"
              stroke="rgba(255,255,255,0.15)"
            />
            <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: "#9db4a7" }} stroke="rgba(255,255,255,0.15)" />
            <Tooltip
              contentStyle={TOOLTIP_STYLE}
              labelFormatter={(_, payload) =>
                payload?.length ? (payload[0].payload as { time: string }).time : ""
              }
            />
            <Legend wrapperStyle={{ fontSize: 11, color: "#9db4a7" }} iconSize={8} />
            {SERIES.map((s) => (
              <Line
                key={s.key}
                type="monotone"
                dataKey={s.key}
                name={s.label}
                stroke={s.color}
                strokeWidth={s.width}
                dot={{ r: 2, fill: s.color, stroke: "none" }}
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
