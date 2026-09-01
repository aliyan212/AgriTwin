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
    <div className="flex items-center justify-between mb-4">
      <div>
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
          7-Day Health Score Forecast
        </h3>
        <p className="text-[10px] text-gray-400 mt-0.5">
          Predicted by a random forest trained on this farm&rsquo;s own recorded observations
        </p>
      </div>
      {ml && (
        <span className="rounded bg-violet-100 px-2 py-0.5 text-[10px] font-medium text-violet-700">
          Local ML
        </span>
      )}
    </div>
  );

  if (!forecast || forecast.length === 0) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        {header}
        <p className="text-sm text-gray-400 py-8 text-center">
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
  const deltaColor = delta > 0 ? "text-green-600" : delta < 0 ? "text-red-600" : "text-gray-500";

  const trainedOn = ml ? (trainedOnLabels[ml.trained_on] ?? ml.trained_on) : null;
  const trainedAt = ml?.trained_at
    ? new Date(ml.trained_at.endsWith("Z") ? ml.trained_at : `${ml.trained_at}Z`).toLocaleString(
        "en-PK",
        { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }
      )
    : null;

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      {header}

      {/* Latest predicted value row */}
      <div className="mb-3 flex items-baseline gap-3">
        <span className="text-3xl font-bold text-gray-900">{data[data.length - 1].predicted_score}</span>
        <span className="text-xs text-gray-400">
          predicted score by {dayLabel(data[data.length - 1].date)}
        </span>
        <span className={`text-xs font-medium ${deltaColor} ml-auto`}>{deltaLabel}</span>
      </div>

      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 5, right: 10, left: -18, bottom: 0 }}>
            <defs>
              <linearGradient id="forecastFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#6366f1" stopOpacity={0.3} />
                <stop offset="100%" stopColor="#6366f1" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="label" tick={{ fontSize: 10 }} interval="preserveStartEnd" />
            <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
            <Tooltip
              contentStyle={{ fontSize: 12, borderRadius: 8 }}
              formatter={(value) => [Number(value), "Predicted score"]}
              labelFormatter={(label, payload) => {
                const point = payload?.[0]?.payload as { date: string } | undefined;
                return point ? `${label} · ${point.date}` : String(label);
              }}
            />
            {currentScore != null && (
              <ReferenceLine
                y={currentScore}
                stroke="#16a34a"
                strokeDasharray="4 4"
                strokeWidth={1}
                label={{
                  value: `now ${currentScore}`,
                  position: "insideBottomLeft",
                  fontSize: 10,
                  fill: "#16a34a",
                }}
              />
            )}
            <Area
              type="monotone"
              dataKey="predicted_score"
              stroke="#6366f1"
              strokeWidth={2.5}
              strokeDasharray="6 3"
              fill="url(#forecastFill)"
              dot={{ r: 3, fill: "#6366f1" }}
              activeDot={{ r: 5 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Training transparency footer */}
      {ml && (
        <div className="mt-2 flex flex-wrap items-center justify-between gap-2 border-t border-gray-100 pt-2">
          <p className="text-[10px] text-gray-400">
            Trained on {ml.samples} local observations ({ml.observed_samples} real snapshots,{" "}
            {trainedOn}) · fit R² {ml.fit_r2}
            {trainedAt ? ` · retrained ${trainedAt}` : ""}
          </p>
          <p className="text-[10px] text-violet-500">┄ dashed = ML projection</p>
        </div>
      )}
    </div>
  );
}
