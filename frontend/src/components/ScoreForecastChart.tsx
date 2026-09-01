"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { FarmIntelligence } from "@/lib/api";
import Icon from "@/components/Icon";

const TOOLTIP_STYLE = {
  fontSize: 12,
  borderRadius: 10,
  background: "rgba(11,18,16,0.95)",
  border: "1px solid rgba(255,255,255,0.12)",
  color: "#ecf5ef",
};

type MlMeta = NonNullable<FarmIntelligence["ml"]>;

interface ScoreForecastChartProps {
  forecast?: { date: string; predicted_score: number }[] | null;
  currentScore?: number | null;
  ml?: MlMeta | null;
}

const trainedOnLabels: Record<string, string> = {
  observed: "real snapshots",
  mixed: "snapshots + rule bootstrap",
  bootstrapped: "rule bootstrap",
};

function dayLabel(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-PK", { weekday: "short" });
}

export default function ScoreForecastChart({ forecast, currentScore, ml }: ScoreForecastChartProps) {
  const header = (
    <div className="mb-4 flex items-center justify-between">
      <div>
        <h3 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-mist">
          <Icon name="bot" size={13} className="text-violet-400" />
          7-Day Health Score Forecast
        </h3>
        <p className="mt-0.5 text-[10px] text-dim">
          Predicted by a random forest trained on this farm&rsquo;s own recorded observations
        </p>
      </div>
      {ml && (
        <span className="rounded-md border border-violet-400/25 bg-violet-400/10 px-2 py-0.5 text-[10px] font-medium text-violet-300">
          Local ML
        </span>
      )}
    </div>
  );

  if (!forecast || forecast.length === 0) {
    return (
      <div className="glass-panel p-5">
        {header}
        <p className="py-8 text-center text-sm text-dim">
          The local ML model needs a few more farm observations before it can forecast —
          keep refreshing the dashboard to accumulate training data.
        </p>
      </div>
    );
  }

  const data = forecast.map((f) => ({
    label: dayLabel(f.date),
    date: f.date,
    predicted_score: f.predicted_score,
  }));

  const first = data[0].predicted_score;
  const last = data[data.length - 1].predicted_score;
  const delta = currentScore != null ? last - currentScore : last - first;
  const deltaLabel =
    delta === 0
      ? `holding steady at ${last}`
      : delta > 0
        ? `trending up to ${last} (+${delta} by ${dayLabel(data[data.length - 1].date)})`
        : `trending down to ${last} (${delta} by ${dayLabel(data[data.length - 1].date)})`;
  const deltaColor = delta > 0 ? "text-emerald-400" : delta < 0 ? "text-red-400" : "text-mist";

  const trainedOn = ml ? (trainedOnLabels[ml.trained_on] ?? ml.trained_on) : null;
  const trainedAt = ml?.trained_at
    ? new Date(ml.trained_at.endsWith("Z") ? ml.trained_at : `${ml.trained_at}Z`).toLocaleString(
        "en-PK",
        { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }
      )
    : null;

  return (
    <div className="glass-panel p-5">
      {header}

      {/* Latest predicted value row */}
      <div className="mb-3 flex items-baseline gap-3">
        <span className="text-3xl font-bold tabular-nums text-ink">{data[data.length - 1].predicted_score}</span>
        <span className="text-xs text-dim">
          predicted score by {dayLabel(data[data.length - 1].date)}
        </span>
        <span className={`ml-auto text-xs font-medium ${deltaColor}`}>{deltaLabel}</span>
      </div>

      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 5, right: 10, left: -18, bottom: 0 }}>
            <defs>
              <linearGradient id="forecastFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#a78bfa" stopOpacity={0.35} />
                <stop offset="100%" stopColor="#a78bfa" stopOpacity={0.02} />
              </linearGradient>
            </defs>
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
              formatter={(value) => [Number(value), "Predicted score"]}
              labelFormatter={(label, payload) => {
                const point = payload?.[0]?.payload as { date: string } | undefined;
                return point ? `${label} · ${point.date}` : String(label);
              }}
            />
            {currentScore != null && (
              <ReferenceLine
                y={currentScore}
                stroke="#34d399"
                strokeDasharray="4 4"
                strokeWidth={1}
                label={{
                  value: `now ${currentScore}`,
                  position: "insideBottomLeft",
                  fontSize: 10,
                  fill: "#34d399",
                }}
              />
            )}
            <Area
              type="monotone"
              dataKey="predicted_score"
              stroke="#a78bfa"
              strokeWidth={2.5}
              strokeDasharray="6 3"
              fill="url(#forecastFill)"
              dot={{ r: 3, fill: "#a78bfa", stroke: "none" }}
              activeDot={{ r: 5, fill: "#c4b5fd" }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Training transparency footer */}
      {ml && (
        <div className="mt-2 flex flex-wrap items-center justify-between gap-2 border-t border-white/6 pt-2">
          <p className="text-[10px] text-dim">
            Trained on {ml.samples} local observations ({ml.observed_samples} real snapshots,{" "}
            {trainedOn}) · fit R² {ml.fit_r2}
            {trainedAt ? ` · retrained ${trainedAt}` : ""}
          </p>
          <p className="text-[10px] text-violet-400/80">┄ dashed = ML projection</p>
        </div>
      )}
    </div>
  );
}
