"use client";

import Icon, { type IconName } from "@/components/Icon";

interface HealthScoreProps {
  overall: number;
  vegetation: number;
  water: number;
  weather: number;
  pestRisk: number;
  climate: number;
}

function scoreColor(score: number): string {
  if (score >= 75) return "text-emerald-400";
  if (score >= 50) return "text-yellow-400";
  if (score >= 25) return "text-orange-400";
  return "text-red-400";
}

function barColor(score: number): string {
  if (score >= 75) return "bg-gradient-to-r from-emerald-500 to-emerald-300";
  if (score >= 50) return "bg-gradient-to-r from-yellow-500 to-yellow-300";
  if (score >= 25) return "bg-gradient-to-r from-orange-500 to-orange-300";
  return "bg-gradient-to-r from-red-500 to-red-300";
}

function gaugeStroke(score: number): string {
  if (score >= 75) return "#34d399";
  if (score >= 50) return "#facc15";
  if (score >= 25) return "#fb923c";
  return "#f87171";
}

function statusLabel(score: number): string {
  if (score >= 75) return "Healthy";
  if (score >= 50) return "Moderate";
  if (score >= 25) return "Stressed";
  return "Critical";
}

export default function HealthScoreCard({
  overall,
  vegetation,
  water,
  weather,
  pestRisk,
  climate,
}: HealthScoreProps) {
  const dimensions: { label: string; icon: IconName; score: number }[] = [
    { label: "Vegetation", icon: "sprout", score: vegetation },
    { label: "Water", icon: "droplet", score: water },
    { label: "Weather", icon: "cloudSun", score: weather },
    { label: "Pest Risk", icon: "bug", score: pestRisk },
    { label: "Climate", icon: "thermometer", score: climate },
  ];

  // Radial gauge geometry
  const R = 52;
  const CIRC = 2 * Math.PI * R;
  const pct = Math.max(0, Math.min(100, overall));

  return (
    <div className="glass-panel p-5">
      <h3 className="mb-1 text-xs font-semibold uppercase tracking-widest text-mist">
        AgriTwin Decision Support
      </h3>

      {/* Overall score — radial gauge */}
      <div className="my-4 flex items-center gap-5">
        <div className="relative h-32 w-32 shrink-0">
          <svg viewBox="0 0 128 128" className="h-full w-full -rotate-90">
            <circle
              cx="64"
              cy="64"
              r={R}
              fill="none"
              stroke="rgba(255,255,255,0.07)"
              strokeWidth="10"
            />
            <circle
              cx="64"
              cy="64"
              r={R}
              fill="none"
              stroke={gaugeStroke(pct)}
              strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray={CIRC}
              strokeDashoffset={CIRC - (pct / 100) * CIRC}
              className="transition-all duration-700 ease-out"
              style={{ filter: `drop-shadow(0 0 6px ${gaugeStroke(pct)}66)` }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={`text-4xl font-bold tabular-nums ${scoreColor(pct)}`}>
              {overall}
            </span>
            <span className="text-[10px] uppercase tracking-wider text-dim">/ 100</span>
          </div>
        </div>
        <div>
          <p className={`text-lg font-semibold ${scoreColor(pct)}`}>{statusLabel(pct)}</p>
          <p className="mt-0.5 text-xs leading-relaxed text-mist">
            Composite of vegetation, water, weather, pest &amp; climate signals
          </p>
        </div>
      </div>

      {/* Dimension bars */}
      <div className="space-y-3">
        {dimensions.map((d) => (
          <div key={d.label}>
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2 text-mist">
                <Icon name={d.icon} size={14} className={scoreColor(d.score)} />
                {d.label}
              </span>
              <span className={`font-semibold tabular-nums ${scoreColor(d.score)}`}>
                {d.score}
              </span>
            </div>
            <div className="mt-1 h-1.5 w-full rounded-full bg-white/6">
              <div
                className={`h-1.5 rounded-full transition-all duration-500 ${barColor(d.score)}`}
                style={{ width: `${d.score}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
