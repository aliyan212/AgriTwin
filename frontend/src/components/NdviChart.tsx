"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceLine,
  Tooltip,
  XAxis,
  YAxis,
  ResponsiveContainer,
} from "recharts";
import Icon from "@/components/Icon";

interface NdviChartProps {
  series?: { date: string; ndvi: number }[];
  ndviChange?: number | null;
  source?: string | null;
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const TOOLTIP_STYLE = {
  fontSize: 12,
  borderRadius: 10,
  background: "rgba(11,18,16,0.95)",
  border: "1px solid rgba(255,255,255,0.12)",
  color: "#ecf5ef",
};

function monthLabel(dateStr: string): string {
  const d = new Date(dateStr);
  return `${MONTHS[d.getMonth()]} ${String(d.getFullYear()).slice(2)}`;
}

export default function NdviChart({ series, ndviChange, source }: NdviChartProps) {
  const hasData = series && series.length > 0;

  const header = (
    <div className="mb-4 flex items-center justify-between">
      <h3 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-mist">
        <Icon name="satellite" size={13} className="text-emerald-400" />
        NDVI — 12-Month Trend
      </h3>
      {source && (
        <span className="rounded-md border border-emerald-400/25 bg-emerald-400/10 px-2 py-0.5 text-[10px] font-medium text-emerald-300">
          {source}
        </span>
      )}
    </div>
  );

  if (!hasData) {
    return (
      <div className="glass-panel p-5">
        {header}
        <p className="py-8 text-center text-sm text-dim">
          Satellite NDVI history is not available for this farm.
        </p>
      </div>
    );
  }

  const data = series!.map((p) => ({
    label: monthLabel(p.date),
    date: p.date,
    ndvi: p.ndvi,
  }));

  const latest = data[data.length - 1];
  const minNdvi = Math.min(...data.map((d) => d.ndvi));
  const yMin = Math.max(0, Math.floor((minNdvi - 0.05) * 20) / 20);
  const yMax = Math.min(1, Math.ceil((Math.max(...data.map((d) => d.ndvi)) + 0.05) * 20) / 20);

  const changeLabel =
    ndviChange == null
      ? null
      : ndviChange > 0
        ? `+${ndviChange.toFixed(3)} vs previous composite`
        : `${ndviChange.toFixed(3)} vs previous composite`;
  const changeColor = ndviChange == null ? "text-dim" : ndviChange >= 0 ? "text-emerald-400" : "text-red-400";

  return (
    <div className="glass-panel p-5">
      {header}

      {/* Latest value row */}
      <div className="mb-3 flex items-baseline gap-3">
        <span className="text-3xl font-bold tabular-nums text-ink">{latest.ndvi.toFixed(2)}</span>
        <span className="text-xs text-dim">latest NDVI ({monthLabel(latest.date)})</span>
        {changeLabel && (
          <span className={`ml-auto flex items-center gap-1 text-xs font-medium ${changeColor}`}>
            <Icon name={ndviChange! >= 0 ? "trendUp" : "trendDown"} size={12} />
            {changeLabel}
          </span>
        )}
      </div>

      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 5, right: 10, left: -18, bottom: 0 }}>
            <defs>
              <linearGradient id="ndviFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#34d399" stopOpacity={0.4} />
                <stop offset="100%" stopColor="#34d399" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 10, fill: "#9db4a7" }}
              angle={-30}
              textAnchor="end"
              height={55}
              interval="preserveStartEnd"
              stroke="rgba(255,255,255,0.15)"
            />
            <YAxis
              domain={[yMin, yMax]}
              tick={{ fontSize: 11, fill: "#9db4a7" }}
              tickFormatter={(v: number) => v.toFixed(1)}
              stroke="rgba(255,255,255,0.15)"
            />
            <Tooltip
              contentStyle={TOOLTIP_STYLE}
              formatter={(value) => [Number(value).toFixed(3), "NDVI"]}
              labelFormatter={(label) => `Composite: ${label}`}
            />
            <ReferenceLine y={0.4} stroke="#f59e0b" strokeDasharray="4 4" strokeWidth={1} />
            <Area
              type="monotone"
              dataKey="ndvi"
              stroke="#34d399"
              strokeWidth={2.5}
              fill="url(#ndviFill)"
              dot={{ r: 2.5, fill: "#34d399", stroke: "none" }}
              activeDot={{ r: 5, fill: "#6ee7b7" }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-2 flex items-center justify-between border-t border-white/6 pt-2">
        <p className="text-[10px] text-dim">
          MODIS 16-day composites · 250 m resolution
        </p>
        <p className="text-[10px] text-amber-400/80">
          ┄ healthy threshold (0.40)
        </p>
      </div>
    </div>
  );
}
