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

interface ScoreTrendChartProps {
  snapshots: ScoreSnapshot[];
}

const SERIES = [
  { key: "overall", label: "Overall", color: "#34d399", width: 2.5 },
  { key: "vegetation", label: "Vegetation", color: "#a3e635", width: 1.5 },
  { key: "water", label: "Water", color: "#38bdf8", width: 1.5 },
  { key: "weather", label: "Weather", color: "#fbbf24", width: 1.5 },
  { key: "pest_risk", label: "Pest Risk", color: "#f87171", width: 1.5 },
  { key: "climate", label: "Climate", color: "#c084fc", width: 1.5 },
];

function parseTs(ts: string | null): Date | null {
  if (!ts) return null;
  return new Date(ts.endsWith("Z") ? ts : `${ts}Z`);
}

function axisLabel(ts: string | null): string {
  const d = parseTs(ts);
  if (!d) return "";
  return d.toLocaleDateString("en-PK", { day: "numeric", month: "short" });
}

const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ name: string; value: number; color: string; payload: { time: string } }> }) => {
  if (active && payload && payload.length) {
    const time = payload[0]?.payload?.time || "";
    return (
      <div className="rounded-xl border border-ink/12 bg-panel/95 p-3 shadow-2xl backdrop-blur-xl text-xs font-mono">
        <p className="text-dim text-[10px] mb-1.5 pb-1 border-b border-ink/8">{time}</p>
        <div className="grid grid-cols-2 gap-x-3 gap-y-1">
          {payload.map((entry) => (
            <div key={entry.name} className="flex items-center justify-between gap-2">
              <span className="flex items-center gap-1 text-mist">
                <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: entry.color }} />
                {entry.name}:
              </span>
              <span className="font-bold text-ink tabular-nums">{entry.value}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }
  return null;
};

export default function ScoreTrendChart({ snapshots }: ScoreTrendChartProps) {
  const header = (
    <div className="mb-4 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-400/30">
          <Icon name="activity" size={14} />
        </span>
        <h3 className="text-xs font-semibold uppercase tracking-widest text-mist">
          Historical Score Progression
        </h3>
      </div>
      <span className="hud-pill text-emerald-300 border-emerald-400/25 bg-emerald-500/10">
        AgriCore History
      </span>
    </div>
  );

  if (snapshots.length === 0) {
    return (
      <div className="glass-panel p-5">
        {header}
        <div className="rounded-xl border border-ink/6 bg-ink/[0.02] p-8 text-center">
          <Icon name="activity" size={24} className="mx-auto text-dim mb-2" />
          <p className="text-xs text-dim">
            No score snapshots recorded yet. Open the farm dashboard to log real-time data.
          </p>
        </div>
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
    <div className="glass-panel p-5 relative overflow-hidden">
      {header}
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 10, fill: "#9db4a7", fontFamily: "var(--font-mono)" }}
              stroke="rgba(255,255,255,0.1)"
            />
            <YAxis
              domain={[0, 100]}
              tick={{ fontSize: 10, fill: "#9db4a7", fontFamily: "var(--font-mono)" }}
              stroke="rgba(255,255,255,0.1)"
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              wrapperStyle={{ fontSize: 11, fontFamily: "var(--font-mono)", paddingTop: 8 }}
              iconSize={8}
            />
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
