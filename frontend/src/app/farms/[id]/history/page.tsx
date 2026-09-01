"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { api, type FarmHistory } from "@/lib/api";
import ScoreTrendChart from "@/components/ScoreTrendChart";
import WeatherHistoryChart from "@/components/WeatherHistoryChart";
import Icon from "@/components/Icon";

const severityStyles: Record<string, { badge: string; bar: string }> = {
  critical: { badge: "bg-red-500/15 text-red-300 ring-1 ring-red-400/30", bar: "bg-red-500" },
  warning: { badge: "bg-amber-500/15 text-amber-300 ring-1 ring-amber-400/30", bar: "bg-amber-500" },
  info: { badge: "bg-sky-500/15 text-sky-300 ring-1 ring-sky-400/30", bar: "bg-sky-500" },
};

const riskStyles: Record<string, string> = {
  critical: "bg-red-500/15 text-red-300 ring-1 ring-red-400/30",
  high: "bg-orange-500/15 text-orange-300 ring-1 ring-orange-400/30",
  moderate: "bg-amber-500/15 text-amber-300 ring-1 ring-amber-400/30",
  low: "bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-400/30",
};

function fmtTime(ts: string | null): string {
  if (!ts) return "—";
  const d = new Date(ts.endsWith("Z") ? ts : `${ts}Z`); // server stores UTC without suffix
  return d.toLocaleString("en-PK", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function FarmHistoryPage() {
  const params = useParams();
  const farmId = Number(params.id);

  const [history, setHistory] = useState<FarmHistory | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchHistory = async () => {
    try {
      const data = await api.getFarmHistory(farmId);
      setHistory(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load history");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (farmId) fetchHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [farmId]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-brand border-t-transparent" />
          <p className="text-sm text-mist">Loading farm history...</p>
        </div>
      </div>
    );
  }

  if (error || !history) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-6">
        <Link href={`/farms/${farmId}`} className="mb-4 inline-flex items-center gap-1.5 text-sm text-brand hover:text-brand-light hover:underline">
          <Icon name="arrowLeft" size={14} />
          Back to Farm
        </Link>
        <div className="glass-panel border-red-400/25 bg-red-500/5 p-8 text-center">
          <p className="font-medium text-red-300">Failed to load farm history</p>
          <p className="mt-1 text-sm text-red-400/80">{error}</p>
          <button
            onClick={fetchHistory}
            className="mt-4 rounded-lg bg-red-500/20 px-4 py-2 text-sm text-red-200 ring-1 ring-red-400/30 transition-colors hover:bg-red-500/30"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const trackingSince = history.weather.length
    ? fmtTime(history.weather[0].timestamp)
    : "now";

  const stats = [
    { label: "Score snapshots", value: history.scores.length },
    { label: "Weather observations", value: history.weather.length },
    { label: "Alerts raised", value: history.alerts.length },
    { label: "AI recommendations", value: history.recommendations.length },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      {/* ── Header ────────────────────────────────────────────────────────── */}
      <div className="mb-6">
        <Link href={`/farms/${farmId}`} className="mb-1 inline-flex items-center gap-1.5 text-sm text-brand hover:text-brand-light hover:underline">
          <Icon name="arrowLeft" size={14} />
          Back to {history.farm.name}
        </Link>
        <h1 className="text-2xl font-bold tracking-tight text-ink">Digital Twin History</h1>
        <p className="flex items-center gap-1 text-sm text-mist">
          <Icon name="mapPin" size={12} className="text-dim" />
          {history.farm.name} — {history.farm.district ?? "Unknown district"}, {history.farm.province}
        </p>
      </div>

      {/* ── Summary stats ────────────────────────────────────────────────── */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="glass-panel p-4">
            <p className="text-2xl font-bold tabular-nums text-ink">{s.value}</p>
            <p className="mt-0.5 text-xs text-mist">{s.label}</p>
          </div>
        ))}
      </div>

      {/* ── Trend charts ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <ScoreTrendChart snapshots={history.scores} />
        <WeatherHistoryChart observations={history.weather} />
      </div>

      {/* ── Timelines ────────────────────────────────────────────────────── */}
      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Alerts timeline */}
        <div className="glass-panel p-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-mist">
              <Icon name="alert" size={13} className="text-amber-400" />
              Alert History
            </h3>
            <span className="text-[10px] text-dim">tracking since {trackingSince}</span>
          </div>
          {history.alerts.length === 0 ? (
            <p className="py-8 text-center text-sm text-dim">
              No alerts recorded for this farm.
            </p>
          ) : (
            <div className="max-h-[480px] space-y-4 overflow-y-auto pr-1">
              {history.alerts.map((a) => {
                const style = severityStyles[a.severity] ?? severityStyles.info;
                return (
                  <div key={a.id} className="relative pl-4">
                    <span className={`absolute left-0 top-1.5 h-2 w-2 rounded-full ${style.bar}`} />
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-medium leading-snug text-ink">{a.title}</p>
                      <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${style.badge}`}>
                        {a.severity}
                      </span>
                    </div>
                    <p className="mt-1 text-xs leading-relaxed text-mist">{a.description}</p>
                    {a.recommendation && (
                      <p className="mt-1 text-xs leading-relaxed text-emerald-300/90">
                        → {a.recommendation}
                      </p>
                    )}
                    <p className="mt-1.5 text-[10px] text-dim">{fmtTime(a.created_at)}</p>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Recommendations timeline */}
        <div className="glass-panel p-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-mist">
              <Icon name="spark" size={13} className="text-brand" />
              AI Recommendation History
            </h3>
            <span className="text-[10px] text-dim">newest first</span>
          </div>
          {history.recommendations.length === 0 ? (
            <p className="py-8 text-center text-sm text-dim">
              No recommendations recorded for this farm.
            </p>
          ) : (
            <div className="max-h-[480px] space-y-4 overflow-y-auto pr-1">
              {history.recommendations.map((r) => (
                <div key={r.id} className="border-l-2 border-emerald-400/30 pl-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      {r.risk_level && (
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${riskStyles[r.risk_level] ?? "bg-white/8 text-mist"}`}>
                          {r.risk_level}
                        </span>
                      )}
                      {r.confidence != null && (
                        <span className="text-[10px] text-dim">
                          {Math.round(r.confidence * 100)}% confidence
                        </span>
                      )}
                    </div>
                    <span className="shrink-0 text-[10px] text-dim">{fmtTime(r.created_at)}</span>
                  </div>
                  <p className="mt-1.5 text-sm leading-relaxed text-ink/90">{r.text}</p>
                  {r.reason && (
                    <p className="mt-1 line-clamp-3 text-xs leading-relaxed text-dim">
                      {r.reason}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Footer note ─────────────────────────────────────────────────── */}
      <p className="mt-6 text-center text-[10px] text-dim">
        Every dashboard visit records a twin snapshot — weather from Open-Meteo, NDVI from MODIS Terra,
        alerts &amp; recommendations from AgriCore. Duplicate alerts within 24h are collapsed.
      </p>
    </div>
  );
}
