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

interface NdviChartProps {
  series?: { date: string; ndvi: number }[];
  ndviChange?: number | null;
  source?: string | null;
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function monthLabel(dateStr: string): string {
  const d = new Date(dateStr);
  return `${MONTHS[d.getMonth()]} ${String(d.getFullYear()).slice(2)}`;
}

export default function NdviChart({ series, ndviChange, source }: NdviChartProps) {
  const hasData = series && series.length > 0;

  const header = (
    <div className="flex items-center justify-between mb-4">
      <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
        NDVI — 12-Month Trend
      </h3>
      {source && (
        <span className="rounded bg-green-100 px-2 py-0.5 text-[10px] font-medium text-green-700">
          {source}
        </span>
      )}
    </div>
  );

  if (!hasData) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        {header}
        <p className="text-sm text-gray-400 py-8 text-center">
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
  const changeColor = ndviChange == null ? "text-gray-400" : ndviChange >= 0 ? "text-green-600" : "text-red-600";

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      {header}

      {/* Latest value row */}
      <div className="mb-3 flex items-baseline gap-3">
        <span className="text-3xl font-bold text-gray-900">{latest.ndvi.toFixed(2)}</span>
        <span className="text-xs text-gray-400">latest NDVI ({monthLabel(latest.date)})</span>
        {changeLabel && (
          <span className={`text-xs font-medium ${changeColor} ml-auto`}>
            {ndviChange! >= 0 ? "▲" : "▼"} {changeLabel}
          </span>
        )}
      </div>

      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 5, right: 10, left: -18, bottom: 0 }}>
            <defs>
              <linearGradient id="ndviFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#22c55e" stopOpacity={0.35} />
                <stop offset="100%" stopColor="#22c55e" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 10 }}
              angle={-30}
              textAnchor="end"
              height={55}
              interval="preserveStartEnd"
            />
            <YAxis
              domain={[yMin, yMax]}
              tick={{ fontSize: 11 }}
              tickFormatter={(v: number) => v.toFixed(1)}
            />
            <Tooltip
              contentStyle={{ fontSize: 12, borderRadius: 8 }}
              formatter={(value) => [Number(value).toFixed(3), "NDVI"]}
              labelFormatter={(label) => `Composite: ${label}`}
            />
            <ReferenceLine y={0.4} stroke="#f59e0b" strokeDasharray="4 4" strokeWidth={1} />
            <Area
              type="monotone"
              dataKey="ndvi"
              stroke="#16a34a"
              strokeWidth={2.5}
              fill="url(#ndviFill)"
              dot={{ r: 2.5, fill: "#16a34a" }}
              activeDot={{ r: 5 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-2 flex items-center justify-between border-t border-gray-100 pt-2">
        <p className="text-[10px] text-gray-400">
          MODIS 16-day composites · 250 m resolution
        </p>
        <p className="text-[10px] text-amber-600">
          ┄ healthy threshold (0.40)
        </p>
      </div>
    </div>
  );
}
