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
import { useLanguage } from "./LanguageProvider";

interface NdviChartProps {
  series?: { date: string; ndvi: number }[];
  ndviChange?: number | null;
  source?: string | null;
}

const MONTHS_EN = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const MONTHS_UR = ["جنوری", "فروری", "مارچ", "اپریل", "مئی", "جون", "جولائی", "اگست", "ستمبر", "اکتوبر", "نومبر", "دسمبر"];

function monthLabel(dateStr: string, isUrdu = false): string {
  const d = new Date(dateStr);
  const m = isUrdu ? MONTHS_UR[d.getMonth()] : MONTHS_EN[d.getMonth()];
  return `${m} '${String(d.getFullYear()).slice(2)}`;
}

const CustomTooltip = ({ active, payload, label, isUrdu }: { active?: boolean; payload?: Array<{ value: number }>; label?: string; isUrdu?: boolean }) => {
  if (active && payload && payload.length) {
    const val = payload[0].value;
    const status = isUrdu
      ? val >= 0.5
        ? "بہترین گھنی ہریالی"
        : val >= 0.35
          ? "درمیانی فصل"
          : val >= 0.2
            ? "ہلکی فصل / ابتدائی اگاؤ"
            : "خالی زمین / دباؤ"
      : val >= 0.5
        ? "Dense Canopy"
        : val >= 0.35
          ? "Moderate Crop"
          : val >= 0.2
            ? "Sparse / Sowing"
            : "Bare Soil / Stressed";

    return (
      <div className="rounded-xl border border-ink/12 bg-panel/95 p-3 shadow-2xl backdrop-blur-xl text-xs font-mono">
        <p className="text-dim text-[10px] mb-1">{label}</p>
        <div className="flex items-baseline gap-2">
          <span className="text-base font-bold text-brand tabular-nums">{val.toFixed(3)}</span>
          <span className="text-[11px] text-ink font-sans font-medium">{status}</span>
        </div>
      </div>
    );
  }
  return null;
};

export default function NdviChart({ series, ndviChange, source }: NdviChartProps) {
  const { t, isUrdu } = useLanguage();
  const hasData = series && series.length > 0;

  const header = (
    <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
      <div className="flex items-center gap-2">
        <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-400/30">
          <Icon name="satellite" size={14} />
        </span>
        <h3 className="text-xs font-semibold uppercase tracking-widest text-mist">
          {t("modisSatelliteNdvi", "MODIS Satellite NDVI Time Series (12-Month)")}
        </h3>
      </div>

      <span className="hud-pill text-emerald-300 border-emerald-400/25 bg-emerald-500/10">
        {source || "MODIS Terra (MOD13Q1 250m)"}
      </span>
    </div>
  );

  if (!hasData) {
    return (
      <div className="glass-panel p-5">
        {header}
        <div className="rounded-xl border border-ink/6 bg-ink/[0.02] p-8 text-center">
          <Icon name="satellite" size={24} className="mx-auto text-dim mb-2" />
          <p className="text-xs text-dim">
            {isUrdu
              ? "فارم منتخب کرن تے 12 مہینے دا سیٹلائٹ ہریالی ریکارڈ ایتھے ظاہر ہوئے گا۔"
              : "Orbital NDVI composite history will appear once farm coordinates are selected."}
          </p>
        </div>
      </div>
    );
  }

  const data = series!.map((p) => ({
    label: monthLabel(p.date, isUrdu),
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
        ? isUrdu
          ? `+${ndviChange.toFixed(3)} پچھلی تصویر نالوں بہتری`
          : `+${ndviChange.toFixed(3)} vs previous composite`
        : isUrdu
          ? `${ndviChange.toFixed(3)} پچھلی تصویر نالوں کمی`
          : `${ndviChange.toFixed(3)} vs previous composite`;

  const changeColor =
    ndviChange == null ? "text-dim" : ndviChange >= 0 ? "text-emerald-400" : "text-rose-400";

  return (
    <div className="glass-panel p-5 relative overflow-hidden">
      {header}

      {/* Latest value row with hero telemetry metric */}
      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-bold font-mono tabular-nums text-brand">
            {latest.ndvi.toFixed(3)}
          </span>
          <span className="text-xs text-dim font-mono">
            {isUrdu ? `تازہ ترین سیٹلائٹ تصویر (${latest.label})` : `latest composite (${latest.label})`}
          </span>
        </div>

        {changeLabel && (
          <span className={`inline-flex items-center gap-1 rounded-full border border-ink/8 bg-ink/4 px-2.5 py-1 text-xs font-mono font-semibold ${changeColor}`}>
            <Icon name={ndviChange! >= 0 ? "trendUp" : "trendDown"} size={13} />
            {changeLabel}
          </span>
        )}
      </div>

      <div className="h-60">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
            <defs>
              <linearGradient id="ndviFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#34d399" stopOpacity={0.45} />
                <stop offset="100%" stopColor="#34d399" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 10, fill: "#9db4a7", fontFamily: "var(--font-mono)" }}
              angle={-25}
              textAnchor="end"
              height={45}
              stroke="rgba(255,255,255,0.1)"
            />
            <YAxis
              domain={[yMin, yMax]}
              tick={{ fontSize: 10, fill: "#9db4a7", fontFamily: "var(--font-mono)" }}
              tickFormatter={(v: number) => v.toFixed(2)}
              stroke="rgba(255,255,255,0.1)"
            />
            <Tooltip content={<CustomTooltip isUrdu={isUrdu} />} />
            <ReferenceLine
              y={0.4}
              stroke="#fbbf24"
              strokeDasharray="4 4"
              strokeWidth={1.5}
              label={{
                value: isUrdu ? "صحت مند حد (0.40)" : "Healthy Threshold (0.40)",
                position: "insideTopRight",
                fill: "#fbbf24",
                fontSize: 10,
                fontFamily: "var(--font-mono)",
              }}
            />
            <Area
              type="monotone"
              dataKey="ndvi"
              stroke="#34d399"
              strokeWidth={2.5}
              fill="url(#ndviFill)"
              dot={{ r: 2.5, fill: "#34d399", stroke: "none" }}
              activeDot={{ r: 5, fill: "#6ee7b7", stroke: "#05090a", strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Subtext info */}
      <div className="mt-2 flex flex-wrap items-center justify-between gap-2 border-t border-ink/6 pt-2 text-[10px] font-mono text-dim">
        <span>{isUrdu ? "ناسا موڈس 16 روزہ سپیکٹرل امیجری" : "NASA ORNL DAAC MODIS 16-Day Spectral Composites"}</span>
        <span className="text-amber-400/90">&bull; {isUrdu ? "فصل دی صحت مند حد 0.40 این ڈی وی آئی اے" : "Vegetative canopy boundary at 0.40 NDVI"}</span>
      </div>
    </div>
  );
}
