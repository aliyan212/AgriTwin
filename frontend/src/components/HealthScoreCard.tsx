"use client";

interface HealthScoreProps {
  overall: number;
  vegetation: number;
  water: number;
  weather: number;
  pestRisk: number;
  climate: number;
}

function scoreColor(score: number): string {
  if (score >= 75) return "text-green-600";
  if (score >= 50) return "text-yellow-600";
  if (score >= 25) return "text-orange-500";
  return "text-red-600";
}

function bgColor(score: number): string {
  if (score >= 75) return "bg-green-500";
  if (score >= 50) return "bg-yellow-500";
  if (score >= 25) return "bg-orange-500";
  return "bg-red-500";
}

export default function HealthScoreCard({
  overall,
  vegetation,
  water,
  weather,
  pestRisk,
  climate,
}: HealthScoreProps) {
  const dimensions = [
    { label: "Vegetation", icon: "🌱", score: vegetation },
    { label: "Water", icon: "💧", score: water },
    { label: "Weather", icon: "🌦️", score: weather },
    { label: "Pest Risk", icon: "🐛", score: pestRisk },
    { label: "Climate", icon: "🌡️", score: climate },
  ];

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <h3 className="mb-1 text-sm font-semibold text-gray-500 uppercase tracking-wide">
        AgriTwin Decision Support
      </h3>

      {/* Overall score */}
      <div className="flex items-end gap-3 my-4">
        <span className={`text-5xl font-bold ${scoreColor(overall)}`}>
          {overall}
        </span>
        <span className="mb-1 text-lg text-gray-400">/ 100</span>
      </div>

      {/* Dimension bars */}
      <div className="space-y-3">
        {dimensions.map((d) => (
          <div key={d.label}>
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-1.5">
                <span>{d.icon}</span>
                <span className="text-gray-700">{d.label}</span>
              </span>
              <span className={`font-semibold ${scoreColor(d.score)}`}>
                {d.score}
              </span>
            </div>
            <div className="mt-1 h-2 w-full rounded-full bg-gray-100">
              <div
                className={`h-2 rounded-full transition-all ${bgColor(d.score)}`}
                style={{ width: `${d.score}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
