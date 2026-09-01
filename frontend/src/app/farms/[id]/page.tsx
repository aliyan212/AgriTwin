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
import AlertsPanel from "@/components/AlertsPanel";
import RecommendationPanel from "@/components/RecommendationPanel";
import DataProvenance from "@/components/DataProvenance";

const FarmMap = dynamic(() => import("@/components/FarmMap"), { ssr: false });

const statusColors: Record<string, string> = {
  excellent: "text-emerald-700 bg-emerald-100",
  good: "text-green-700 bg-green-100",
  moderate: "text-amber-700 bg-amber-100",
  poor: "text-orange-700 bg-orange-100",
  critical: "text-red-700 bg-red-100",
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
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-green-500 border-t-transparent mx-auto mb-4" />
          <p className="text-sm text-gray-500">Loading farm intelligence...</p>
        </div>
      </div>
    );
  }

  if (error || !intel) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-6">
        <Link href="/" className="text-sm text-green-600 hover:underline mb-4 inline-block">
          &larr; Back to Dashboard
        </Link>
        <div className="rounded-xl border border-red-200 bg-red-50 p-8 text-center">
          <p className="text-red-700 font-medium">Failed to load farm intelligence</p>
          <p className="text-sm text-red-600 mt-1">{error}</p>
          <button
            onClick={fetchIntel}
            className="mt-4 rounded-lg bg-red-600 px-4 py-2 text-sm text-white hover:bg-red-700"
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
          <Link href="/" className="text-sm text-green-600 hover:underline mb-1 inline-block">
            &larr; Back to Dashboard
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">{intel.farm.name}</h1>
          <p className="text-sm text-gray-500">
            {intel.farm.district}, {intel.farm.province}
            {intel.farm.area_acres ? ` — ${intel.farm.area_acres} acres` : ""}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span
            className={`rounded-full px-3 py-1 text-xs font-bold uppercase ${
              statusColors[intel.score.status] ?? "bg-gray-100 text-gray-700"
            }`}
          >
            {intel.score.status} — {intel.score.value}/100
          </span>
          <button
            onClick={() => {
              setRefreshing(true);
              fetchIntel();
            }}
            disabled={refreshing}
            className="rounded-lg bg-green-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
          >
            {refreshing ? "Refreshing..." : "Refresh"}
          </button>
        </div>
      </div>

      {/* ── Alerts Section ────────────────────────────────────────────────── */}
      {intel.alerts.length > 0 && (
        <div className="mb-6">
          <h2 className="text-sm font-semibold text-gray-600 mb-3 flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
            Active Alerts ({intel.alerts.filter((a) => a.severity !== "info").length})
          </h2>
          <AlertsPanel alerts={intel.alerts} />
        </div>
      )}

      {/* ── Top Row: Map + Score + Crop Info ──────────────────────────────── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 h-[400px] rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
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
            <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
                Current Crop
              </h3>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Crop</span>
                  <span className="font-medium text-gray-900">{intel.crop.name}</span>
                </div>
                {intel.crop.season && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Season</span>
                    <span className="font-medium text-gray-900">{intel.crop.season}</span>
                  </div>
                )}
                {intel.crop.growth_stage && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Growth Stage</span>
                    <span className="font-medium text-gray-900">{intel.crop.growth_stage}</span>
                  </div>
                )}
                {intel.crop.sowing_date && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Sowing Date</span>
                    <span className="font-medium text-gray-900">
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
        <WeatherCard data={weatherData} loading={false} error={null} />
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

      {/* ── AI Recommendation ─────────────────────────────────────────────── */}
      <div className="mt-6">
        <h2 className="text-sm font-semibold text-gray-600 mb-3">AI Recommendation</h2>
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
