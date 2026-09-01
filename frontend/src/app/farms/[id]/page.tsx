"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import dynamic from "next/dynamic";
import { api, type FarmIntelligence } from "@/lib/api";
import HealthScoreCard from "@/components/HealthScoreCard";
import WeatherCard from "@/components/WeatherCard";
import ForecastChart from "@/components/ForecastChart";
import NdviChart from "@/components/NdviChart";
import ClimateCard from "@/components/ClimateCard";
import ScoreForecastChart from "@/components/ScoreForecastChart";
import AlertsPanel from "@/components/AlertsPanel";
import RecommendationPanel from "@/components/RecommendationPanel";
import DataProvenance from "@/components/DataProvenance";
import Icon from "@/components/Icon";

const FarmMap = dynamic(() => import("@/components/FarmMap"), { ssr: false });

const statusColors: Record<string, string> = {
  excellent: "text-emerald-300 bg-emerald-500/15 ring-1 ring-emerald-400/30",
  good: "text-green-300 bg-green-500/15 ring-1 ring-green-400/30",
  moderate: "text-amber-300 bg-amber-500/15 ring-1 ring-amber-400/30",
  poor: "text-orange-300 bg-orange-500/15 ring-1 ring-orange-400/30",
  critical: "text-red-300 bg-red-500/15 ring-1 ring-red-400/30",
};

export default function FarmDetailPage() {
  const params = useParams();
  const farmId = Number(params.id);

  const [intel, setIntel] = useState<FarmIntelligence | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchIntel = async () => {
    try {
      const data = await api.getFarmIntelligence(farmId);
      setIntel(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load intelligence");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (farmId) fetchIntel();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [farmId]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-brand border-t-transparent" />
          <p className="text-sm text-mist">Loading farm intelligence...</p>
        </div>
      </div>
    );
  }

  if (error || !intel) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-6">
        <Link href="/" className="mb-4 inline-flex items-center gap-1.5 text-sm text-brand hover:text-brand-light hover:underline">
          <Icon name="arrowLeft" size={14} />
          Back to Dashboard
        </Link>
        <div className="glass-panel border-red-400/25 bg-red-500/5 p-8 text-center">
          <p className="font-medium text-red-300">Failed to load farm intelligence</p>
          <p className="mt-1 text-sm text-red-400/80">{error}</p>
          <button
            onClick={fetchIntel}
            className="mt-4 rounded-lg bg-red-500/20 px-4 py-2 text-sm text-red-200 ring-1 ring-red-400/30 transition-colors hover:bg-red-500/30"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const forecastData = intel.forecast.map((f) => ({
    date: f.date,
    label: new Date(f.date).toLocaleDateString("en-PK", { weekday: "short" }),
    temp_max: f.temp_max,
    temp_min: f.temp_min,
    precipitation_mm: f.rain_mm,
    et0_mm: f.et0_mm,
  }));

  const weatherData: Record<string, unknown> = {
    temperature_2m: intel.weather.temperature_c,
    relative_humidity_2m: intel.weather.humidity_pct,
    precipitation: intel.weather.rainfall_mm,
    wind_speed_10m: intel.weather.wind_speed_kmh,
    soil_moisture_0_to_7cm: intel.weather.soil_moisture_m3m3,
    soil_temperature_0_to_7cm: intel.weather.soil_temperature_c,
    et0_fao_evapotranspiration: intel.weather.et0_mm,
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      {/* ── Header ────────────────────────────────────────────────────────── */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <Link href="/" className="mb-1 inline-flex items-center gap-1.5 text-sm text-brand hover:text-brand-light hover:underline">
            <Icon name="arrowLeft" size={14} />
            Back to Dashboard
          </Link>
          <h1 className="text-2xl font-bold tracking-tight text-ink">{intel.farm.name}</h1>
          <p className="flex items-center gap-1 text-sm text-mist">
            <Icon name="mapPin" size={12} className="text-dim" />
            {intel.farm.district}, {intel.farm.province}
            {intel.farm.area_acres ? ` — ${intel.farm.area_acres} acres` : ""}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span
            className={`rounded-full px-3 py-1 text-xs font-bold uppercase ${
              statusColors[intel.score.status] ?? "bg-white/8 text-mist"
            }`}
          >
            {intel.score.status} — {intel.score.value}/100
          </span>
          <Link
            href={`/farms/${farmId}/history`}
            className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/4 px-4 py-1.5 text-sm font-medium text-mist transition-colors hover:border-emerald-400/30 hover:text-emerald-300"
          >
            <Icon name="clock" size={14} />
            View History
          </Link>
          <button
            onClick={() => {
              setRefreshing(true);
              fetchIntel();
            }}
            disabled={refreshing}
            className="flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-emerald-500 to-emerald-400 px-4 py-1.5 text-sm font-medium text-abyss transition-all hover:from-emerald-400 hover:to-emerald-300 disabled:opacity-50"
          >
            <Icon name="refresh" size={14} className={refreshing ? "animate-spin" : ""} />
            {refreshing ? "Refreshing..." : "Refresh"}
          </button>
        </div>
      </div>

      {/* ── Alerts Section ────────────────────────────────────────────────── */}
      {intel.alerts.length > 0 && (
        <div className="mb-6">
          <h2 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-mist">
            <span className="h-2 w-2 animate-pulse rounded-full bg-red-500" />
            Active Alerts ({intel.alerts.filter((a) => a.severity !== "info").length})
          </h2>
          <AlertsPanel alerts={intel.alerts} />
        </div>
      )}

      {/* ── Top Row: Map + Score + Crop Info ──────────────────────────────── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="h-[400px] overflow-hidden rounded-2xl border border-white/10 shadow-[0_12px_32px_rgb(0_0_0/0.35)] lg:col-span-2">
          <FarmMap
            center={[intel.farm.latitude, intel.farm.longitude]}
            zoom={14}
            polygonGeoJson={intel.farm.geometry ?? undefined}
          />
        </div>
        <div className="space-y-4">
          <HealthScoreCard
            overall={intel.score.breakdown.vegetation + intel.score.breakdown.water + intel.score.breakdown.weather + intel.score.breakdown.pest_risk + intel.score.breakdown.climate > 0 ? intel.score.value : 0}
            vegetation={intel.score.breakdown.vegetation}
            water={intel.score.breakdown.water}
            weather={intel.score.breakdown.weather}
            pestRisk={intel.score.breakdown.pest_risk}
            climate={intel.score.breakdown.climate}
          />

          {/* Crop Info */}
          {intel.crop && (
            <div className="glass-panel p-5">
              <h3 className="mb-3 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-mist">
                <Icon name="wheat" size={13} className="text-lime-400" />
                Current Crop
              </h3>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-mist">Crop</span>
                  <span className="font-medium text-ink">{intel.crop.name}</span>
                </div>
                {intel.crop.season && (
                  <div className="flex justify-between text-sm">
                    <span className="text-mist">Season</span>
                    <span className="font-medium text-ink">{intel.crop.season}</span>
                  </div>
                )}
                {intel.crop.growth_stage && (
                  <div className="flex justify-between text-sm">
                    <span className="text-mist">Growth Stage</span>
                    <span className="font-medium text-ink">{intel.crop.growth_stage}</span>
                  </div>
                )}
                {intel.crop.sowing_date && (
                  <div className="flex justify-between text-sm">
                    <span className="text-mist">Sowing Date</span>
                    <span className="font-medium text-ink">
                      {new Date(intel.crop.sowing_date).toLocaleDateString("en-PK")}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Weather + Forecast ────────────────────────────────────────────── */}
      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <WeatherCard data={weatherData} loading={false} error={null} airQuality={intel.weather.air_quality} />
        <ForecastChart data={forecastData} loading={false} />
      </div>

      {/* ── NDVI Time Series + Climate Anomaly ────────────────────────── */}
      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <NdviChart
          series={intel.satellite.series}
          ndviChange={intel.satellite.ndvi_change}
          source={intel.satellite.source ?? undefined}
        />
        <ClimateCard
          climate={intel.climate}
          currentTemp={intel.weather.temperature_c}
          currentHumidity={intel.weather.humidity_pct}
        />
      </div>

      {/* ── 7-Day ML Score Forecast ───────────────────────────────── */}
      <div className="mt-6">
        <ScoreForecastChart
          forecast={intel.score_forecast}
          currentScore={intel.score.value}
          ml={intel.ml}
        />
      </div>

      {/* ── AI Recommendation ─────────────────────────────────────────────── */}
      <div className="mt-6">
        <h2 className="mb-3 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-mist">
          <Icon name="spark" size={13} className="text-brand" />
          AI Recommendation
        </h2>
        <RecommendationPanel
          recommendation={{
            recommendation: intel.recommendation.text,
            reasoning: intel.recommendation.reasoning,
            confidence: intel.recommendation.confidence,
            risk_level: intel.recommendation.risk_level,
          }}
          loading={false}
        />
      </div>

      {/* ── Data Provenance ───────────────────────────────────────────────── */}
      <div className="mt-6">
        <DataProvenance data={intel.provenance} />
      </div>
    </div>
  );
}
