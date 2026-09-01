"use client";

import {
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ComposedChart,
} from "recharts";
import type { ForecastDay } from "@/lib/api";
import Icon from "@/components/Icon";
import { useLanguage } from "./LanguageProvider";

interface ForecastChartProps {
  data: ForecastDay[];
  loading?: boolean;
}

const weekdayMap: Record<string, { en: string; ur: string }> = {
  Mon: { en: "Mon", ur: "پیر" },
  Tue: { en: "Tue", ur: "منگل" },
  Wed: { en: "Wed", ur: "بدھ" },
  Thu: { en: "Thu", ur: "جمعرات" },
  Fri: { en: "Fri", ur: "جمعہ" },
  Sat: { en: "Sat", ur: "ہفتہ" },
  Sun: { en: "Sun", ur: "اتوار" },
};

const CustomTooltip = ({ active, payload, label, isUrdu }: { active?: boolean; payload?: Array<{ name: string; value: number; color: string }>; label?: string; isUrdu?: boolean }) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-xl border border-ink/12 bg-panel/95 p-3 shadow-2xl backdrop-blur-xl text-xs font-mono">
        <p className="font-bold text-ink mb-1.5 pb-1 border-b border-ink/8">{label}</p>
        <div className="space-y-1">
          {payload.map((entry, idx) => (
            <div key={idx} className="flex items-center justify-between gap-4">
              <span className="flex items-center gap-1.5 text-mist">
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: entry.color }} />
                {entry.name}:
              </span>
              <span className="font-bold text-ink tabular-nums">
                {entry.name.includes("Rain") || entry.name.includes("بارش")
                  ? `${Number(entry.value).toFixed(1)} mm`
                  : `${Number(entry.value).toFixed(1)}°C`}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }
  return null;
};

export default function ForecastChart({ data, loading }: ForecastChartProps) {
  const { t, isUrdu } = useLanguage();

  if (loading) {
    return (
      <div className="glass-panel p-5">
        <h3 className="mb-3 text-xs font-semibold uppercase tracking-widest text-mist">
          {t("forecast7Day", "7-Day Weather Outlook")}
        </h3>
        <div className="flex flex-col items-center justify-center py-12">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-sky-400 border-t-transparent mb-2" />
          <p className="text-xs text-dim font-mono">
            {isUrdu ? "موسمی ماڈلز لوڈ ہو رہے نیں…" : "Loading forecast models…"}
          </p>
        </div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="glass-panel p-5">
        <h3 className="mb-3 text-xs font-semibold uppercase tracking-widest text-mist">
          {t("forecast7Day", "7-Day Weather Outlook")}
        </h3>
        <div className="rounded-xl border border-ink/6 bg-ink/[0.02] p-8 text-center">
          <Icon name="cloudSun" size={24} className="mx-auto text-dim mb-2" />
          <p className="text-xs text-dim">
            {isUrdu
              ? "7 روزہ موسمی پیشگوئی لئی کوئی فارم منتخب کرو۔"
              : "Select a farm node to load the 7-day meteorological forecast."}
          </p>
        </div>
      </div>
    );
  }

  const localizedData = data.map((d) => {
    const rawDay = d.label.split(" ")[0];
    const translatedDay = isUrdu ? weekdayMap[rawDay]?.ur || rawDay : rawDay;
    const rest = d.label.split(" ").slice(1).join(" ");
    return {
      ...d,
      displayLabel: `${translatedDay} ${rest}`,
      shortDay: translatedDay,
    };
  });

  return (
    <div className="glass-panel p-5 relative overflow-hidden">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-sky-500/15 text-sky-400 ring-1 ring-sky-400/30">
            <Icon name="cloudSun" size={14} />
          </span>
          <h3 className="text-xs font-semibold uppercase tracking-widest text-mist">
            {t("forecast7Day", "7-Day Agrometeorological Forecast")}
          </h3>
        </div>

        <span className="hud-pill text-sky-300 border-sky-400/25 bg-sky-500/10">
          Open-Meteo GFS
        </span>
      </div>

      <div className="h-60">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={localizedData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis
              dataKey="displayLabel"
              tick={{ fontSize: 10, fill: "#9db4a7", fontFamily: "var(--font-mono)" }}
              stroke="rgba(255,255,255,0.1)"
            />
            <YAxis
              yAxisId="temp"
              orientation="left"
              tick={{ fontSize: 10, fill: "#9db4a7", fontFamily: "var(--font-mono)" }}
              stroke="rgba(255,255,255,0.1)"
              unit="°"
            />
            <YAxis
              yAxisId="rain"
              orientation="right"
              tick={{ fontSize: 10, fill: "#9db4a7", fontFamily: "var(--font-mono)" }}
              stroke="rgba(255,255,255,0.1)"
              unit="mm"
            />
            <Tooltip content={<CustomTooltip isUrdu={isUrdu} />} />
            <Legend
              wrapperStyle={{ fontSize: 11, fontFamily: "var(--font-mono)", paddingTop: 8 }}
            />
            <Bar
              yAxisId="rain"
              dataKey="precipitation_mm"
              fill="rgba(56,189,248,0.5)"
              radius={[4, 4, 0, 0]}
              name={isUrdu ? "بارش (ملی میٹر)" : "Rain"}
            />
            <Line
              yAxisId="temp"
              type="monotone"
              dataKey="temp_max"
              stroke="#fb7185"
              strokeWidth={2.5}
              dot={{ r: 3, fill: "#fb7185", stroke: "none" }}
              activeDot={{ r: 5, fill: "#fda4af" }}
              name={isUrdu ? "زیادہ درجہ حرارت" : "High Temp"}
            />
            <Line
              yAxisId="temp"
              type="monotone"
              dataKey="temp_min"
              stroke="#38bdf8"
              strokeWidth={2.5}
              dot={{ r: 3, fill: "#38bdf8", stroke: "none" }}
              activeDot={{ r: 5, fill: "#7dd3fc" }}
              name={isUrdu ? "گھٹ درجہ حرارت" : "Low Temp"}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* 7-Day Day Pills Summary */}
      <div className="mt-3 grid grid-cols-7 gap-1 border-t border-ink/6 pt-3">
        {localizedData.slice(0, 7).map((d) => (
          <div key={d.date} className="rounded-lg bg-ink/[0.02] p-1.5 text-center">
            <p className="text-[10px] font-mono uppercase text-dim">{d.shortDay}</p>
            <p className="text-xs font-bold font-mono text-rose-400">{d.temp_max?.toFixed(0)}°</p>
            <p className="text-[11px] font-mono text-sky-400">{d.temp_min?.toFixed(0)}°</p>
            {(d.precipitation_mm ?? 0) > 0 ? (
              <p className="text-[9px] font-mono text-sky-300 font-semibold">{d.precipitation_mm?.toFixed(1)}m</p>
            ) : (
              <p className="text-[9px] text-dim font-mono">-</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
