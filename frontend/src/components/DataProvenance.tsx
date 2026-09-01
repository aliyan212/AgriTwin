"use client";

import Icon, { type IconName } from "@/components/Icon";
import { useLanguage } from "./LanguageProvider";

interface ProvenanceData {
  weather_source: string;
  weather_retrieved_at: string;
  satellite_source: string;
  score_engine: string;
  crop_knowledge: string;
}

export default function DataProvenance({ data }: { data: ProvenanceData | null }) {
  const { t, isUrdu } = useLanguage();
  if (!data) return null;

  const sources: { label: string; value: string; icon: IconName; color: string }[] = [
    {
      label: isUrdu ? "موسمیاتی فیڈ" : "Meteorology Feed",
      value: data.weather_source,
      icon: "cloudSun",
      color: "text-sky-300 bg-sky-500/10 border-sky-400/20",
    },
    {
      label: isUrdu ? "سیٹلائٹ امیجری" : "Orbital Satellite",
      value: data.satellite_source,
      icon: "satellite",
      color: "text-emerald-300 bg-emerald-500/10 border-emerald-400/20",
    },
    {
      label: isUrdu ? "تشخیصی اے آئی انجن" : "Decision Engine",
      value: data.score_engine,
      icon: "activity",
      color: "text-purple-300 bg-purple-500/10 border-purple-400/20",
    },
    {
      label: isUrdu ? "زرعی ماہرین دا ماڈل" : "Crop Knowledge Base",
      value: data.crop_knowledge,
      icon: "wheat",
      color: "text-teal-300 bg-teal-500/10 border-teal-400/20",
    },
  ];

  const retrievedAt = data.weather_retrieved_at
    ? new Date(data.weather_retrieved_at).toLocaleTimeString("en-PK", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    })
    : null;

  return (
    <div className="glass-panel p-4 relative overflow-hidden">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="flex h-5 w-5 items-center justify-center rounded bg-ink/6 text-dim">
            <Icon name="database" size={11} />
          </span>
          <h3 className="text-xs font-semibold uppercase tracking-widest text-mist">
            {t("integratedFeeds", "Data Sources & Provenance")}
          </h3>
        </div>

        {retrievedAt && (
          <span className="hud-pill text-[10px] text-dim font-mono">
            <Icon name="clock" size={10} />
            {isUrdu ? `تازہ ترین اپڈیٹ: ${retrievedAt}` : `Data updated: ${retrievedAt}`}
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2">
        {sources.map((s) => (
          <div
            key={s.label}
            className={`flex items-center gap-2 rounded-xl border p-2.5 text-xs ${s.color}`}
          >
            <Icon name={s.icon} size={14} className="shrink-0 opacity-80" />
            <div className="min-w-0">
              <span className="text-[10px] font-mono uppercase tracking-wider text-dim block truncate">
                {s.label}
              </span>
              <span className="font-medium text-ink truncate block">
                {s.value}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
