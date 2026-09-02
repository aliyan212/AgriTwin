"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
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
import ConfirmModal from "@/components/ConfirmModal";
import LazyCard from "@/components/LazyCard";
import WarabandiAdvisor from "@/components/WarabandiAdvisor";
import { useLanguage } from "@/components/LanguageProvider";
import { getLocalizedCropName, getLocalizedStageName } from "@/lib/translations";

const FarmMap = dynamic(() => import("@/components/FarmMap"), { ssr: false });

const statusColors: Record<string, { badge: string; dot: string }> = {
  excellent: { badge: "text-emerald-300 bg-emerald-500/15 ring-1 ring-emerald-400/30", dot: "bg-emerald-400" },
  good: { badge: "text-green-300 bg-green-500/15 ring-1 ring-green-400/30", dot: "bg-green-400" },
  moderate: { badge: "text-amber-300 bg-amber-500/15 ring-1 ring-amber-400/30", dot: "bg-amber-400" },
  poor: { badge: "text-orange-300 bg-orange-500/15 ring-1 ring-orange-400/30", dot: "bg-orange-400" },
  critical: { badge: "text-rose-300 bg-rose-500/15 ring-1 ring-rose-400/30", dot: "bg-rose-400" },
};

export default function FarmDetailPage() {
  const { t, isUrdu } = useLanguage();
  const params = useParams();
  const router = useRouter();
  const farmId = Number(params.id);

  const [intel, setIntel] = useState<FarmIntelligence | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const confirmDeleteFarm = async () => {
    setDeleting(true);
    try {
      await api.deleteFarm(farmId);
      router.push("/farms");
    } catch {
      alert("Failed to delete farm. Please try again.");
      setDeleting(false);
      setShowDeleteModal(false);
    }
  };

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
          <p className="text-sm text-mist font-mono">Analyzing field intelligence &amp; health indices…</p>
        </div>
      </div>
    );
  }

  if (error || !intel) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <Link href="/" className="mb-4 inline-flex items-center gap-1.5 text-xs font-semibold text-brand hover:text-brand-light transition-colors">
          <Icon name="arrowLeft" size={14} />
          Back to Dashboard
        </Link>
        <div className="glass-panel border-rose-400/25 bg-rose-500/5 p-8 text-center">
          <p className="font-semibold text-rose-300">Failed to load farm intelligence</p>
          <p className="mt-1 text-xs text-rose-400/80 font-mono">{error}</p>
          <button
            onClick={fetchIntel}
            className="mt-4 rounded-xl bg-rose-500/20 px-4 py-2 text-xs font-semibold text-rose-200 ring-1 ring-rose-400/30 transition-colors hover:bg-rose-500/30"
          >
            Retry Data Sync
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

  const statusStyle = statusColors[intel.score.status] ?? { badge: "bg-ink/8 text-mist", dot: "bg-mist" };

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
      {/* ── Header ────────────────────────────────────────────────────────── */}
      <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <Link href="/" className="mb-2 inline-flex items-center gap-1.5 text-xs font-semibold text-brand hover:underline">
            <Icon name="arrowLeft" size={13} />
            {t("missionControl", "Mission Control Dashboard")}
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-ink">{intel.farm.name}</h1>
            <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-bold uppercase font-mono ${statusStyle.badge}`}>
              <span className={`h-1.5 w-1.5 rounded-full ${statusStyle.dot} animate-pulse`} />
              {intel.score.status} &middot; {intel.score.value}/100
            </span>
          </div>
          <p className="flex items-center gap-1.5 text-xs text-mist mt-1 font-mono">
            <Icon name="mapPin" size={12} className="text-brand shrink-0" />
            {intel.farm.district || "Punjab"}, {intel.farm.province}
            {intel.farm.area_acres ? ` — ${intel.farm.area_acres.toLocaleString()} ${t("acres", "acres")}` : ""}
            <span className="text-dim">[{intel.farm.latitude.toFixed(4)}, {intel.farm.longitude.toFixed(4)}]</span>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Link
            href={`/farms/${farmId}/history`}
            className="flex items-center gap-1.5 rounded-xl border border-ink/12 bg-ink/6 px-3.5 py-2 text-xs font-semibold text-mist hover:text-ink hover:bg-ink/10 transition-colors"
          >
            <Icon name="clock" size={13} />
            <span>{t("viewHistory", "Field Observation History")}</span>
          </Link>
          <button
            onClick={() => {
              setRefreshing(true);
              fetchIntel();
            }}
            disabled={refreshing || deleting}
            className="flex items-center gap-1.5 rounded-xl bg-gradient-to-b from-emerald-400 to-emerald-600 px-4 py-2 text-xs font-semibold text-abyss shadow-md hover:shadow-lg transition-all disabled:opacity-50"
          >
            <Icon name="refresh" size={13} className={refreshing ? "animate-spin" : ""} />
            <span>{refreshing ? (isUrdu ? "ڈیٹا آ رہیا اے…" : "Syncing…") : (isUrdu ? "ڈیٹا تازہ کرو" : "Refresh Field Data")}</span>
          </button>
          <button
            onClick={() => setShowDeleteModal(true)}
            disabled={deleting}
            className="flex items-center gap-1.5 rounded-xl border border-rose-500/20 bg-rose-500/10 px-3.5 py-2 text-xs font-semibold text-rose-400 hover:bg-rose-500/20 hover:text-rose-300 transition-colors disabled:opacity-50"
            title="Delete this farm"
          >
            <Icon name="trash" size={13} />
            <span>{t("deleteShort", "Delete")}</span>
          </button>
        </div>
      </div>

      {/* ── Active Alerts Warning Banner ─────────────────────────────────── */}
      {intel.alerts.length > 0 && (
        <div className="mb-6">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-rose-300">
              <span className="h-2 w-2 animate-pulse rounded-full bg-rose-500" />
              {t("activeAlerts", "Active Agronomic Alerts")} ({intel.alerts.length})
            </h2>
            <span className="text-[10px] font-mono text-dim">24h Collapsed Duplicates</span>
          </div>
          <AlertsPanel alerts={intel.alerts} />
        </div>
      )}

      {/* ── Top Row: Map + Health Score Breakdown + Crop Details ──────────── */}
      <LazyCard delayMs={50}>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="h-[420px] lg:h-full lg:min-h-[420px] overflow-hidden rounded-2xl border border-ink/10 shadow-[0_12px_32px_rgb(0_0_0/0.35)] lg:col-span-2 p-0">
            <FarmMap
              center={[intel.farm.latitude, intel.farm.longitude]}
              zoom={15}
              polygonGeoJson={intel.farm.geometry ?? undefined}
            />
          </div>

          <div className="space-y-4">
            <HealthScoreCard
              overall={intel.score.value}
              vegetation={intel.score.breakdown.vegetation}
              water={intel.score.breakdown.water}
              weather={intel.score.breakdown.weather}
              pestRisk={intel.score.breakdown.pest_risk}
              climate={intel.score.breakdown.climate}
            />

            {/* Planted Crop Details Card */}
            {intel.crop && (
              <div className="glass-panel p-5">
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-mist">
                    <Icon name="wheat" size={13} className="text-brand" />
                    {t("activeCrop", "Planted Crop")}
                  </h3>
                  <span className="rounded-md border border-brand/30 bg-brand/10 px-2 py-0.5 text-[10px] font-bold text-brand uppercase">
                    {intel.crop.season === "Rabi"
                      ? isUrdu
                        ? "ربیع (ہاڑی)"
                        : "Rabi Season"
                      : intel.crop.season === "Kharif"
                        ? isUrdu
                          ? "خریف (ساؤنی)"
                          : "Kharif Season"
                        : intel.crop.season || "Punjab Season"}
                  </span>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between border-b border-ink/6 pb-1.5">
                    <span className="text-mist">{t("cropVariety", "Variety")}</span>
                    <span className="font-bold text-ink">{getLocalizedCropName(intel.crop.name, isUrdu)}</span>
                  </div>
                  {intel.crop.growth_stage && (
                    <div className="flex justify-between border-b border-ink/6 pb-1.5">
                      <span className="text-mist">{t("growthStage", "Growth Stage")}</span>
                      <span className="font-semibold text-brand font-urdu text-[13px]">{getLocalizedStageName(intel.crop.growth_stage, isUrdu)}</span>
                    </div>
                  )}
                  {intel.crop.sowing_date && (
                    <div className="flex justify-between pt-0.5 font-mono text-[11px]">
                      <span className="text-dim">{t("sowingDate", "Sowing Date")}</span>
                      <span className="text-ink">
                        {new Date(intel.crop.sowing_date).toLocaleDateString("en-PK", { month: "short", day: "numeric", year: "numeric" })}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </LazyCard>

      {/* ── Warabandi Canal Water & Tubewell Energy Optimizer ───────────── */}
      <LazyCard delayMs={75} className="mt-6">
        <WarabandiAdvisor farmId={farmId} />
      </LazyCard>

      {/* ── Weather & 7-Day Forecast ──────────────────────────────────────── */}
      <LazyCard delayMs={100} className="mt-6">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <WeatherCard data={weatherData} loading={false} error={null} airQuality={intel.weather.air_quality} />
          <ForecastChart data={forecastData} loading={false} />
        </div>
      </LazyCard>

      {/* ── Satellite NDVI + Climate Reanalysis ────────────────────────────── */}
      <LazyCard delayMs={150} className="mt-6">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
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
      </LazyCard>

      {/* ── 7-Day ML Score Forecast ───────────────────────────────────────── */}
      <LazyCard delayMs={200} className="mt-6">
        <ScoreForecastChart
          forecast={intel.score_forecast}
          currentScore={intel.score.value}
          ml={intel.ml}
        />
      </LazyCard>

      {/* ── AI Agronomy Copilot Recommendation ─────────────────────────────── */}
      <LazyCard delayMs={250} className="mt-6">
        <RecommendationPanel
          recommendation={{
            recommendation: intel.recommendation.text,
            reasoning: intel.recommendation.reasoning,
            text_ur: (intel.recommendation as Record<string, unknown>).text_ur as string | undefined,
            reasoning_ur: (intel.recommendation as Record<string, unknown>).reasoning_ur as string | undefined,
            confidence: intel.recommendation.confidence,
            risk_level: intel.recommendation.risk_level,
          }}
          loading={false}
        />
      </LazyCard>

      {/* ── Data Provenance ────────────────────────────────────────────────── */}
      <LazyCard delayMs={300} className="mt-6">
        <DataProvenance data={intel.provenance} />
      </LazyCard>

      {/* ── Custom Delete Confirmation Modal ─────────────────────────────── */}
      <ConfirmModal
        isOpen={showDeleteModal}
        title={t("confirmDeleteTitle", "Delete Agricultural Farm Node")}
        message={isUrdu
          ? `کی تسی واقعی "${intel.farm.name}" نوں ختم کرنا چاہندے ہو؟ ایہ عمل واپس نہیں ہو سکدا۔`
          : `Are you sure you want to delete "${intel.farm.name}"? This action is permanent and will remove all telemetry, satellite observations, crop records, and agronomic AI models for this location.`}
        confirmText={t("confirmBtn", "Delete Farm Node")}
        cancelText={t("cancelBtn", "Keep Farm")}
        isDestructive={true}
        loading={deleting}
        onConfirm={confirmDeleteFarm}
        onClose={() => setShowDeleteModal(false)}
      />
    </div>
  );
}
