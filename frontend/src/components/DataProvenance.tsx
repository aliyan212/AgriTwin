"use client";

interface ProvenanceData {
  weather_source: string;
  weather_retrieved_at: string;
  satellite_source: string;
  score_engine: string;
  crop_knowledge: string;
}

export default function DataProvenance({ data }: { data: ProvenanceData | null }) {
  if (!data) return null;

  const sources = [
    { label: "Weather", value: data.weather_source, color: "text-blue-700 bg-blue-50" },
    { label: "Satellite", value: data.satellite_source, color: "text-green-700 bg-green-50" },
    { label: "Score Engine", value: data.score_engine, color: "text-purple-700 bg-purple-50" },
    { label: "Crop Knowledge", value: data.crop_knowledge, color: "text-teal-700 bg-teal-50" },
  ];

  const retrievedAt = data.weather_retrieved_at
    ? new Date(data.weather_retrieved_at).toLocaleTimeString("en-PK", {
        hour: "2-digit",
        minute: "2-digit",
      })
    : null;

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
          Data Provenance
        </h3>
        {retrievedAt && (
          <span className="text-[10px] text-gray-400">
            Retrieved at {retrievedAt}
          </span>
        )}
      </div>
      <div className="flex flex-wrap gap-2">
        {sources.map((s) => (
          <span
            key={s.label}
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${s.color}`}
          >
            <span className="text-[10px] opacity-60">{s.label}:</span>
            {s.value}
          </span>
        ))}
      </div>
    </div>
  );
}
