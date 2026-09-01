"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { api, type FarmHistory } from "@/lib/api";
import ScoreTrendChart from "@/components/ScoreTrendChart";
import WeatherHistoryChart from "@/components/WeatherHistoryChart";
import Icon from "@/components/Icon";
import { useLanguage } from "@/components/LanguageProvider";

const severityStyles: Record<string, { badge: string; dot: string }> = {
  critical: { badge: "bg-rose-500/15 text-rose-300 ring-1 ring-rose-400/30", dot: "bg-rose-400" },
  warning: { badge: "bg-amber-500/15 text-amber-300 ring-1 ring-amber-400/30", dot: "bg-amber-400" },
  info: { badge: "bg-sky-500/15 text-sky-300 ring-1 ring-sky-400/30", dot: "bg-sky-400" },
};

const riskStyles: Record<string, string> = {
  critical: "bg-rose-500/15 text-rose-300 ring-1 ring-rose-400/30",
  high: "bg-orange-500/15 text-orange-300 ring-1 ring-orange-400/30",
  moderate: "bg-amber-500/15 text-amber-300 ring-1 ring-amber-400/30",
  low: "bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-400/30",
};

function fmtTime(ts: string | null): string {
  if (!ts) return "—";
  const d = new Date(ts.endsWith("Z") ? ts : `${ts}Z`);
  return d.toLocaleString("en-PK", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function FarmHistoryPage() {
  const { t, isUrdu } = useLanguage();
  const params = useParams();
  const farmId = Number(params.id);

  const [history, setHistory] = useState<FarmHistory | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "alerts" | "recs">("all");

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

  const handleExportJson = () => {
    if (!history) return;
    const blob = new Blob([JSON.stringify(history, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `agritwin-history-farm-${farmId}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-brand border-t-transparent" />
          <p className="text-sm text-mist font-mono">
            {isUrdu ? "فارم دا تاریخی ریکارڈ لوڈ ہو رہیا اے…" : "Loading field observation history…"}
          </p>
        </div>
      </div>
    );
  }

  if (error || !history) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <Link href={`/farms/${farmId}`} className="mb-4 inline-flex items-center gap-1.5 text-xs font-semibold text-brand hover:underline">
          <Icon name="arrowLeft" size={14} />
          {t("backToIntelligence", "Back to Farm")}
        </Link>
        <div className="glass-panel border-rose-400/25 bg-rose-500/5 p-8 text-center">
          <p className="font-semibold text-rose-300">
            {isUrdu ? "تاریخی ریکارڈ لوڈ نہیں ہو سکیا" : "Failed to load farm history"}
          </p>
          <p className="mt-1 text-xs text-rose-400/80 font-mono">{error}</p>
          <button
            onClick={fetchHistory}
            className="mt-4 rounded-xl bg-rose-500/20 px-4 py-2 text-xs font-semibold text-rose-200 ring-1 ring-rose-400/30 transition-colors hover:bg-rose-500/30"
          >
            {isUrdu ? "دوبارہ کوشش کرو" : "Retry"}
          </button>
        </div>
      </div>
    );
  }

  const stats = [
    { label: isUrdu ? "صحت اسکور لاگز" : "Score Snapshots", value: history.scores.length, icon: "activity" as const, color: "text-brand" },
    { label: isUrdu ? "موسمی ریکارڈز" : "Weather Logs", value: history.weather.length, icon: "cloudSun" as const, color: "text-sky-300" },
    { label: isUrdu ? "فیلڈ الرٹس" : "Alerts Raised", value: history.alerts.length, icon: "alert" as const, color: "text-amber-300" },
    { label: isUrdu ? "اے آئی زرعی مشورے" : "AI Advice Cycles", value: history.recommendations.length, icon: "bot" as const, color: "text-purple-300" },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
      {/* ── Header ────────────────────────────────────────────────────────── */}
      <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <Link href={`/farms/${farmId}`} className="mb-2 inline-flex items-center gap-1.5 text-xs font-semibold text-brand hover:underline">
            <Icon name="arrowLeft" size={13} />
            {isUrdu ? `${history.farm.name} واپس جاؤ` : `Back to ${history.farm.name}`}
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-ink">
              {t("historyTitle", "Field Observation History Log")}
            </h1>
            <span className="hud-pill text-emerald-300 border-emerald-400/25 bg-emerald-500/10">
              Farm #{farmId}
            </span>
          </div>
          <p className="flex items-center gap-1.5 text-xs text-mist mt-1 font-mono">
            <Icon name="mapPin" size={12} className="text-brand shrink-0" />
            {history.farm.name} &mdash; {history.farm.district ?? "Punjab"}, {history.farm.province}
          </p>
        </div>

        <button
          onClick={handleExportJson}
          className="flex items-center gap-1.5 rounded-xl border border-ink/12 bg-ink/6 px-4 py-2 text-xs font-semibold text-ink hover:bg-ink/10 transition-all shadow-sm"
        >
          <Icon name="download" size={13} />
          {isUrdu ? "ڈیٹا فائل (JSON) ڈاؤن لوڈ کرو" : "Export JSON Ledger"}
        </button>
      </div>

      {/* ── Summary Stats ──────────────────────────────────────────────────── */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="glass-card p-4">
            <div className="flex items-center justify-between text-dim mb-1">
              <span className="text-[11px] font-mono uppercase tracking-wider">{s.label}</span>
              <Icon name={s.icon} size={14} className={s.color} />
            </div>
            <p className="text-2xl font-bold font-mono tabular-nums text-ink">{s.value}</p>
          </div>
        ))}
      </div>

      {/* ── Trend Charts ───────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <ScoreTrendChart snapshots={history.scores} />
        <WeatherHistoryChart observations={history.weather} />
      </div>

      {/* ── Timelines Toolbar ──────────────────────────────────────────────── */}
      <div className="mt-8 mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono font-semibold uppercase text-mist tracking-wider">
            {isUrdu ? "تاریخچہ ٹائم لائن" : "History Timeline"}
          </span>
          <div className="flex rounded-lg border border-ink/10 bg-ink/4 p-0.5 text-xs">
            <button
              onClick={() => setFilter("all")}
              className={`rounded px-2.5 py-1 transition-colors ${filter === "all" ? "bg-brand/20 text-brand font-semibold" : "text-mist hover:text-ink"}`}
            >
              {isUrdu ? "تمام ریکارڈ" : "All Events"}
            </button>
            <button
              onClick={() => setFilter("alerts")}
              className={`rounded px-2.5 py-1 transition-colors ${filter === "alerts" ? "bg-brand/20 text-brand font-semibold" : "text-mist hover:text-ink"}`}
            >
              {isUrdu ? `الرٹس (${history.alerts.length})` : `Alerts (${history.alerts.length})`}
            </button>
            <button
              onClick={() => setFilter("recs")}
              className={`rounded px-2.5 py-1 transition-colors ${filter === "recs" ? "bg-brand/20 text-brand font-semibold" : "text-mist hover:text-ink"}`}
            >
              {isUrdu ? `اے آئی مشورے (${history.recommendations.length})` : `AI Advice (${history.recommendations.length})`}
            </button>
          </div>
        </div>
      </div>

      {/* ── Timelines ──────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Alerts Timeline */}
        {(filter === "all" || filter === "alerts") && (
          <div className="glass-panel p-5">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-mist">
                <Icon name="alert" size={13} className="text-amber-400" />
                {isUrdu ? "فیلڈ الرٹس دا ریکارڈ" : "Alerts History"}
              </h3>
              <span className="text-[10px] font-mono text-dim">{history.alerts.length} {isUrdu ? "کل" : "total"}</span>
            </div>

            {history.alerts.length === 0 ? (
              <p className="py-8 text-center text-xs text-dim">
                {isUrdu ? "اس فارم لئی فی الحال کوئی الرٹ ریکارڈ نہیں۔" : "No alerts recorded for this farm."}
              </p>
            ) : (
              <div className="max-h-[480px] space-y-3.5 overflow-y-auto pr-1">
                {history.alerts.map((a) => {
                  const style = severityStyles[a.severity] ?? severityStyles.info;
                  const sevLabel = isUrdu
                    ? a.severity === "critical"
                      ? "فوری توجہ"
                      : a.severity === "warning"
                        ? "انتباہ"
                        : "اطلاع"
                    : a.severity;

                  return (
                    <div key={a.id} className="relative rounded-xl border border-ink/6 bg-ink/[0.02] p-3.5 pl-4">
                      <span className={`absolute left-0 top-3 bottom-3 w-1 rounded-r ${style.dot}`} />
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-semibold leading-snug text-ink">{a.title}</p>
                        <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase font-mono ${style.badge}`}>
                          {sevLabel}
                        </span>
                      </div>
                      <p className="mt-1 text-xs leading-relaxed text-mist">{a.description}</p>
                      {a.recommendation && (
                        <p className="mt-1.5 text-xs leading-relaxed text-emerald-300/90 font-medium">
                          &rarr; {a.recommendation}
                        </p>
                      )}
                      <p className="mt-2 text-[10px] font-mono text-dim">{fmtTime(a.created_at)}</p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* AI Recommendations Timeline */}
        {(filter === "all" || filter === "recs") && (
          <div className="glass-panel p-5">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-mist">
                <Icon name="bot" size={13} className="text-brand" />
                {isUrdu ? "اے آئی زرعی مشوریاں دا ریکارڈ" : "AI Advice History"}
              </h3>
              <span className="text-[10px] font-mono text-dim">{history.recommendations.length} {isUrdu ? "کل" : "total"}</span>
            </div>

            {history.recommendations.length === 0 ? (
              <p className="py-8 text-center text-xs text-dim">
                {isUrdu ? "اس فارم لئی فی الحال کوئی مشورہ لاگ نہیں کیتا گیا۔" : "No recommendations recorded for this farm yet."}
              </p>
            ) : (
              <div className="max-h-[480px] space-y-3.5 overflow-y-auto pr-1">
                {history.recommendations.map((r) => (
                  <div key={r.id} className="rounded-xl border border-ink/6 bg-ink/[0.02] p-3.5">
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <div className="flex items-center gap-2">
                        {r.risk_level && (
                          <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase font-mono ${riskStyles[r.risk_level] ?? "bg-ink/8 text-mist"}`}>
                            {r.risk_level}
                          </span>
                        )}
                        {r.confidence != null && (
                          <span className="text-[10px] font-mono text-dim">
                            {Math.round(r.confidence * 100)}% {isUrdu ? "اعتماد" : "conf"}
                          </span>
                        )}
                      </div>
                      <span className="shrink-0 text-[10px] font-mono text-dim">{fmtTime(r.created_at)}</span>
                    </div>
                    <p className="text-xs font-medium leading-relaxed text-ink/95">{r.text}</p>
                    {r.reason && (
                      <p className="mt-1 line-clamp-3 text-[11px] leading-relaxed text-dim">
                        {r.reason}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Footer Note ─────────────────────────────────────────────────────── */}
      <p className="mt-8 text-center text-[10px] font-mono text-dim">
        {isUrdu
          ? "فارم دے تمام مشاہداتی ریکارڈز اوپن میٹیو، موڈس ٹیرا تے ایگری کور توں خودکار محفوظ کیتے جاندے نیں۔"
          : "Farm observation snapshots are recorded and deduplicated hourly across Open-Meteo, MODIS Terra, and AgriCore."}
      </p>
    </div>
  );
}
