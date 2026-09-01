"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { api, type FarmHistory } from "@/lib/api";
import ScoreTrendChart from "@/components/ScoreTrendChart";
import WeatherHistoryChart from "@/components/WeatherHistoryChart";

const severityStyles: Record<string, { badge: string; bar: string }> = {
  critical: { badge: "bg-red-100 text-red-700", bar: "bg-red-500" },
  warning: { badge: "bg-amber-100 text-amber-700", bar: "bg-amber-500" },
  info: { badge: "bg-sky-100 text-sky-700", bar: "bg-sky-500" },
};

const riskStyles: Record<string, string> = {
  critical: "bg-red-100 text-red-700",
  high: "bg-orange-100 text-orange-700",
  moderate: "bg-amber-100 text-amber-700",
  low: "bg-green-100 text-green-700",
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
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-green-500 border-t-transparent mx-auto mb-4" />
          <p className="text-sm text-gray-500">Loading farm history...</p>
        </div>
      </div>
    );
  }

  if (error || !history) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-6">
        <Link href={`/farms/${farmId}`} className="text-sm text-green-600 hover:underline mb-4 inline-block">
          &larr; Back to Farm
        </Link>
        <div className="rounded-xl border border-red-200 bg-red-50 p-8 text-center">
          <p className="text-red-700 font-medium">Failed to load farm history</p>
          <p className="text-sm text-red-600 mt-1">{error}</p>
          <button
            onClick={fetchHistory}
            className="mt-4 rounded-lg bg-red-600 px-4 py-2 text-sm text-white hover:bg-red-700"
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
        <Link href={`/farms/${farmId}`} className="text-sm text-green-600 hover:underline mb-1 inline-block">
          &larr; Back to {history.farm.name}
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Digital Twin History</h1>
        <p className="text-sm text-gray-500">
          {history.farm.name} — {history.farm.district ?? "Unknown district"}, {history.farm.province}
        </p>
      </div>

      {/* ── Summary stats ────────────────────────────────────────────────── */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <p className="text-2xl font-bold text-gray-900">{s.value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
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
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
              Alert History
            </h3>
            <span className="text-[10px] text-gray-400">tracking since {trackingSince}</span>
          </div>
          {history.alerts.length === 0 ? (
            <p className="text-sm text-gray-400 py-8 text-center">
              No alerts recorded for this farm.
            </p>
          ) : (
            <div className="space-y-4 max-h-[480px] overflow-y-auto pr-1">
              {history.alerts.map((a) => {
                const style = severityStyles[a.severity] ?? severityStyles.info;
                return (
                  <div key={a.id} className="relative pl-4">
                    <span className={`absolute left-0 top-1.5 h-2 w-2 rounded-full ${style.bar}`} />
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-medium text-gray-900 leading-snug">{a.title}</p>
                      <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${style.badge}`}>
                        {a.severity}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1 leading-relaxed">{a.description}</p>
                    {a.recommendation && (
                      <p className="text-xs text-green-700 mt-1 leading-relaxed">
                        → {a.recommendation}
                      </p>
                    )}
                    <p className="text-[10px] text-gray-400 mt-1.5">{fmtTime(a.created_at)}</p>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Recommendations timeline */}
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
              AI Recommendation History
            </h3>
            <span className="text-[10px] text-gray-400">newest first</span>
          </div>
          {history.recommendations.length === 0 ? (
            <p className="text-sm text-gray-400 py-8 text-center">
              No recommendations recorded for this farm.
            </p>
          ) : (
            <div className="space-y-4 max-h-[480px] overflow-y-auto pr-1">
              {history.recommendations.map((r) => (
                <div key={r.id} className="border-l-2 border-green-200 pl-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      {r.risk_level && (
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${riskStyles[r.risk_level] ?? "bg-gray-100 text-gray-700"}`}>
                          {r.risk_level}
                        </span>
                      )}
                      {r.confidence != null && (
                        <span className="text-[10px] text-gray-400">
                          {Math.round(r.confidence * 100)}% confidence
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-gray-400 shrink-0">{fmtTime(r.created_at)}</span>
                  </div>
                  <p className="text-sm text-gray-700 mt-1.5 leading-relaxed">{r.text}</p>
                  {r.reason && (
                    <p className="text-xs text-gray-400 mt-1 leading-relaxed line-clamp-3">
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
      <p className="mt-6 text-center text-[10px] text-gray-400">
        Every dashboard visit records a twin snapshot — weather from Open-Meteo, NDVI from MODIS Terra,
        alerts &amp; recommendations from AgriCore. Duplicate alerts within 24h are collapsed.
      </p>
    </div>
  );
}
