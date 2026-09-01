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
import { useLanguage } from "./LanguageProvider";

type MlMeta = NonNullable<FarmIntelligence["ml"]>;

interface ScoreForecastChartProps {
  forecast?: { date: string; predicted_score: number }[] | null;
  currentScore?: number | null;
  ml?: MlMeta | null;
}

const trainedOnLabels: Record<string, { en: string; ur: string }> = {
  observed: { en: "real snapshots", ur: "حقیقی فیلڈ ریکارڈ" },
  mixed: { en: "snapshots + rule bootstrap", ur: "فیلڈ ریکارڈ + ماڈل بوٹ سٹریپ" },
  bootstrapped: { en: "rule bootstrap", ur: "ماڈل بوٹ سٹریپ" },
};

const dayNamesUrdu: Record<string, string> = {
  Mon: "پیر",
  Tue: "منگل",
  Wed: "بدھ",
  Thu: "جمعرات",
  Fri: "جمعہ",
  Sat: "ہفتہ",
  Sun: "اتوار",
};

function dayLabel(dateStr: string, isUrdu = false): string {
  const d = new Date(dateStr);
  const weekday = d.toLocaleDateString("en-PK", { weekday: "short" });
  const dayNum = d.toLocaleDateString("en-PK", { day: "numeric" });
  const localizedDay = isUrdu ? dayNamesUrdu[weekday] || weekday : weekday;
  return `${localizedDay} ${dayNum}`;
}

const CustomTooltip = ({ active, payload, label, isUrdu }: { active?: boolean; payload?: Array<{ value: number }>; label?: string; isUrdu?: boolean }) => {
  if (active && payload && payload.length) {
    const val = payload[0].value;
    return (
      <div className="rounded-xl border border-ink/12 bg-panel/95 p-3 shadow-2xl backdrop-blur-xl text-xs font-mono">
        <p className="text-dim text-[10px] mb-1">{label}</p>
        <div className="flex items-baseline gap-2">
          <span className="text-base font-bold text-violet-400 tabular-nums">{val}</span>
          <span className="text-[11px] text-mist font-sans">
            {isUrdu ? "متوقع فیلڈ صحت اسکور" : "Predicted Health Score"}
          </span>
        </div>
      </div>
    );
  }
  return null;
};

export default function ScoreForecastChart({ forecast, currentScore, ml }: ScoreForecastChartProps) {
  const { t, isUrdu } = useLanguage();

  const header = (
    <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
      <div className="flex items-center gap-2">
        <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-violet-500/15 text-violet-400 ring-1 ring-violet-400/30">
          <Icon name="bot" size={14} />
        </span>
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-widest text-mist">
            {t("mlForecastTitle", "7-Day Health Score ML Forecast")}
          </h3>
          <p className="text-[10px] text-dim font-mono">
            {t("mlForecastSubtext", "Random Forest regression model trained on local farm observation history")}
          </p>
        </div>
      </div>

      {ml && (
        <span className="hud-pill text-violet-300 border-violet-400/25 bg-violet-500/10">
          Scikit-Learn ML Node
        </span>
      )}
    </div>
  );

  if (!forecast || forecast.length === 0) {
    return (
      <div className="glass-panel p-5">
        {header}
        <div className="rounded-xl border border-ink/6 bg-ink/[0.02] p-8 text-center">
          <Icon name="bot" size={24} className="mx-auto text-dim mb-2" />
          <p className="text-xs text-dim">
            {isUrdu
              ? "مشین لرننگ ماڈل دی تربیت جاری اے۔ ڈیٹا جمع ہون تے پیشگوئی ظاہر ہو جائے گی۔"
              : "The local ML engine is calibrating — visit the dashboard regularly to accumulate training snapshots."}
          </p>
        </div>
      </div>
    );
  }

  const data = forecast.map((f) => ({
    label: dayLabel(f.date, isUrdu),
    date: f.date,
    predicted_score: f.predicted_score,
  }));

  const first = data[0].predicted_score;
  const last = data[data.length - 1].predicted_score;
  const delta = currentScore != null ? last - currentScore : last - first;
  const deltaLabel =
    delta === 0
      ? isUrdu ? `${last} تے مستحکم` : `holding steady at ${last}`
      : delta > 0
        ? isUrdu ? `${last} تک بہتری (+${delta} پوائنٹس)` : `trending up to ${last} (+${delta} pts)`
        : isUrdu ? `${last} تک کمی (${delta} پوائنٹس)` : `trending down to ${last} (${delta} pts)`;
  const deltaColor = delta > 0 ? "text-emerald-400" : delta < 0 ? "text-rose-400" : "text-mist";

  const trainedOn = ml
    ? isUrdu
      ? trainedOnLabels[ml.trained_on]?.ur || ml.trained_on
      : trainedOnLabels[ml.trained_on]?.en || ml.trained_on
    : null;

  return (
    <div className="glass-panel p-5 relative overflow-hidden">
      {header}

      {/* Latest predicted value row */}
      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-bold font-mono tabular-nums text-violet-300">
            {data[data.length - 1].predicted_score}
          </span>
          <span className="text-xs text-dim font-mono">
            {isUrdu ? `${data[data.length - 1].label} تک متوقع اسکور` : `projected by ${data[data.length - 1].label}`}
          </span>
        </div>

        <span className={`inline-flex items-center gap-1 rounded-full border border-ink/8 bg-ink/4 px-2.5 py-1 text-xs font-mono font-semibold ${deltaColor}`}>
          <Icon name={delta >= 0 ? "trendUp" : "trendDown"} size={13} />
          {deltaLabel}
        </span>
      </div>

      <div className="h-60">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
            <defs>
              <linearGradient id="forecastFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#a78bfa" stopOpacity={0.4} />
                <stop offset="100%" stopColor="#a78bfa" stopOpacity={0.02} />
              </linearGradient>
            </defs>
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
            <Tooltip content={<CustomTooltip isUrdu={isUrdu} />} />
            {currentScore != null && (
              <ReferenceLine
                y={currentScore}
                stroke="#34d399"
                strokeDasharray="4 4"
                strokeWidth={1.5}
                label={{
                  value: isUrdu ? `موجودہ اسکور (${currentScore})` : `Current Score (${currentScore})`,
                  position: "insideTopLeft",
                  fontSize: 10,
                  fill: "#34d399",
                  fontFamily: "var(--font-mono)",
                }}
              />
            )}
            <Area
              type="monotone"
              dataKey="predicted_score"
              stroke="#a78bfa"
              strokeWidth={2.5}
              strokeDasharray="6 4"
              fill="url(#forecastFill)"
              dot={{ r: 3, fill: "#a78bfa", stroke: "none" }}
              activeDot={{ r: 5, fill: "#c4b5fd", stroke: "#05090a", strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Training transparency footer */}
      {ml && (
        <div className="mt-2 flex flex-wrap items-center justify-between gap-2 border-t border-ink/6 pt-2 text-[10px] font-mono text-dim">
          <p>
            {isUrdu ? "تربیت کیتا گیا" : "Trained on"} {ml.samples} {isUrdu ? "مشاہدات تے" : "observations"} ({ml.observed_samples} {isUrdu ? "اصل فیلڈ ریکارڈز" : "real snapshots"}, {trainedOn}) &middot; Model Fit R² {ml.fit_r2}
          </p>
          <p className="text-violet-400/90">&bull; {isUrdu ? "ڈیش لائن اگلے 7 دن دی مشین لرننگ پیشگوئی اے" : "Dashed line represents 7-day ML projection"}</p>
        </div>
      )}
    </div>
  );
}
