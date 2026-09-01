"use client";

import Icon, { type IconName } from "@/components/Icon";

interface ProvenanceData {
  weather_source: string;
  weather_retrieved_at: string;
  satellite_source: string;
  score_engine: string;
  crop_knowledge: string;
}

export default function DataProvenance({ data }: { data: ProvenanceData | null }) {
  if (!data) return null;

  const sources: { label: string; value: string; icon: IconName; color: string }[] = [
    { label: "Weather", value: data.weather_source, icon: "cloudSun", color: "text-sky-300 bg-sky-500/12 ring-sky-400/20" },
    { label: "Satellite", value: data.satellite_source, icon: "satellite", color: "text-emerald-300 bg-emerald-500/12 ring-emerald-400/20" },
    { label: "Score Engine", value: data.score_engine, icon: "activity", color: "text-purple-300 bg-purple-500/12 ring-purple-400/20" },
    { label: "Crop Knowledge", value: data.crop_knowledge, icon: "wheat", color: "text-teal-300 bg-teal-500/12 ring-teal-400/20" },
  ];

  const retrievedAt = data.weather_retrieved_at
    ? new Date(data.weather_retrieved_at).toLocaleTimeString("en-PK", {
        hour: "2-digit",
        minute: "2-digit",
      })
    : null;

  return (
    <div className="glass-panel p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-mist">
          <Icon name="database" size={12} className="text-dim" />
          Data Provenance
        </h3>
        {retrievedAt && (
          <span className="flex items-center gap-1 text-[10px] text-dim">
            <Icon name="clock" size={10} />
            Retrieved at {retrievedAt}
          </span>
        )}
      </div>
      <div className="flex flex-wrap gap-2">
        {sources.map((s) => (
          <span
            key={s.label}
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ring-1 ${s.color}`}
          >
            <Icon name={s.icon} size={12} className="opacity-70" />
            <span className="text-[10px] opacity-60">{s.label}:</span>
            {s.value}
          </span>
        ))}
      </div>
    </div>
  );
}
