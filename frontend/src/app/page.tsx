"use client";

import { useCallback, useEffect, useState } from "react";
import dynamic from "next/dynamic";
import {
  api,
  type Farm,
  type HealthScore,
  type Recommendation,
  type ForecastDay,
} from "@/lib/api";
import Link from "next/link";
import HealthScoreCard from "@/components/HealthScoreCard";
import WeatherCard from "@/components/WeatherCard";
import NdviChart from "@/components/NdviChart";
import RecommendationPanel from "@/components/RecommendationPanel";
import ForecastChart from "@/components/ForecastChart";
import CropManager from "@/components/CropManager";
import FarmSelector from "@/components/FarmSelector";
import Icon from "@/components/Icon";
import ConfirmModal from "@/components/ConfirmModal";
import LazyCard from "@/components/LazyCard";
import SkeletonCard from "@/components/SkeletonCard";
import WarabandiAdvisor from "@/components/WarabandiAdvisor";
import { useLanguage } from "@/components/LanguageProvider";

// Dynamic import prevents SSR issues with Leaflet
const FarmMap = dynamic(() => import("@/components/FarmMap"), { ssr: false });

const PUNJAB_CANALS = [
  "Lower Bari Doab Canal (LBDC)",
  "Upper Chenab Canal",
  "Muzaffargarh Canal",
  "Sidhnai Canal",
  "Thal Canal",
  "Fordwah Canal",
  "Dera Ghazi Khan Canal",
  "Pakpattan Canal",
  "Upper Jhelum Canal",
  "Central Bari Doab Canal",
];

const WEEKDAYS = [
  { en: "Monday", ur: "پیر" },
  { en: "Tuesday", ur: "منگل" },
  { en: "Wednesday", ur: "بدھ" },
  { en: "Thursday", ur: "جمعرات" },
  { en: "Friday", ur: "جمعہ" },
  { en: "Saturday", ur: "ہفتہ" },
  { en: "Sunday", ur: "اتوار" },
];

const PUNJAB_CANAL_DISTRICT_MAP: Record<string, string> = {
  // Bari Doab
  okara: "Lower Bari Doab Canal (LBDC)",
  sahiwal: "Lower Bari Doab Canal (LBDC)",
  khanewal: "Lower Bari Doab Canal (LBDC)",
  pakpattan: "Lower Bari Doab Canal (LBDC)",
  lahore: "Central Bari Doab Canal (CBDC)",
  kasur: "Central Bari Doab Canal (CBDC)",
  vehari: "Fordwah Canal",
  bahawalnagar: "Fordwah Canal",

  // Rechna Doab
  faisalabad: "Lower Chenab Canal (LCC)",
  "toba tek singh": "Lower Chenab Canal (LCC)",
  jhang: "Lower Chenab Canal (LCC)",
  chiniot: "Lower Chenab Canal (LCC)",
  "nankana sahib": "Lower Chenab Canal (LCC)",
  hafizabad: "Lower Chenab Canal (LCC)",
  gujranwala: "Upper Chenab Canal",
  sialkot: "Upper Chenab Canal",
  sheikhupura: "Upper Chenab Canal",
  narowal: "Upper Chenab Canal",

  // Chaj Doab
  sargodha: "Lower Jhelum Canal",
  "mandi bahauddin": "Lower Jhelum Canal",
  gujrat: "Upper Jhelum Canal",
  jhelum: "Upper Jhelum Canal",
  rawalpindi: "Upper Jhelum Canal",
  chakwal: "Upper Jhelum Canal",
  attock: "Upper Jhelum Canal",

  // Thal
  bhakkar: "Thal Canal",
  layyah: "Thal Canal",
  khushab: "Thal Canal",
  mianwali: "Thal Canal",

  // Indus & Lower Punjab
  multan: "Sidhnai Canal",
  lodhran: "Sidhnai Canal",
  muzaffargarh: "Muzaffargarh Canal",
  "kot addu": "Muzaffargarh Canal",
  "dera ghazi khan": "Dera Ghazi Khan Canal",
  "dg khan": "Dera Ghazi Khan Canal",
  rajanpur: "Dera Ghazi Khan Canal",
  bahawalpur: "Panjnad & Abbasia Canals",
  "rahim yar khan": "Panjnad & Abbasia Canals",
};

function inferCanalFromLocation(
  district?: string,
  lat?: number,
  lng?: number
): string {
  if (district) {
    const clean = district.trim().toLowerCase();
    for (const [key, canal] of Object.entries(PUNJAB_CANAL_DISTRICT_MAP)) {
      if (clean.includes(key) || key.includes(clean)) {
        return canal;
      }
    }
  }

  // Coordinate geographic zones if district is not yet resolved
  if (lat !== undefined && lng !== undefined) {
    if (lat >= 30.3 && lat <= 31.3 && lng >= 72.8 && lng <= 74.0) return "Lower Bari Doab Canal (LBDC)";
    if (lat >= 30.8 && lat <= 31.9 && lng >= 72.3 && lng <= 73.6) return "Lower Chenab Canal (LCC)";
    if (lat >= 31.8 && lat <= 32.7 && lng >= 73.8 && lng <= 75.0) return "Upper Chenab Canal";
    if (lat >= 31.0 && lat <= 31.8 && lng >= 74.0 && lng <= 74.6) return "Central Bari Doab Canal (CBDC)";
    if (lat >= 29.8 && lat <= 30.6 && lng >= 71.0 && lng <= 72.2) return "Sidhnai Canal";
    if (lat >= 29.8 && lat <= 30.9 && lng >= 70.7 && lng <= 71.4) return "Muzaffargarh Canal";
    if (lat >= 29.5 && lat <= 30.9 && lng >= 70.0 && lng <= 70.8) return "Dera Ghazi Khan Canal";
    if (lat >= 30.7 && lat <= 32.2 && lng >= 70.8 && lng <= 71.9) return "Thal Canal";
    if (lat >= 29.5 && lat <= 30.5 && lng >= 72.5 && lng <= 74.0) return "Fordwah Canal";
    if (lat >= 28.0 && lat <= 29.8 && lng >= 69.8 && lng <= 72.0) return "Panjnad & Abbasia Canals";
    if (lat >= 31.7 && lat <= 32.7 && lng >= 72.2 && lng <= 73.5) return "Lower Jhelum Canal";
    if (lat >= 32.4 && lat <= 33.5 && lng >= 73.4 && lng <= 74.5) return "Upper Jhelum Canal";
  }

  return "Lower Bari Doab Canal (LBDC)";
}

export default function DashboardPage() {
  const { t, isUrdu } = useLanguage();
  const [farms, setFarms] = useState<Farm[]>([]);
  const [selectedFarm, setSelectedFarm] = useState<Farm | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);

  // Weather
  const [weatherData, setWeatherData] = useState<Record<string, unknown> | null>(null);
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [weatherError, setWeatherError] = useState<string | null>(null);

  // Forecast chart
  const [forecastData, setForecastData] = useState<ForecastDay[]>([]);
  const [forecastLoading, setForecastLoading] = useState(false);

  // NDVI time series (real MODIS satellite data)
  const [ndviSeries, setNdviSeries] = useState<{ date: string; ndvi: number }[]>([]);
  const [ndviChange, setNdviChange] = useState<number | null>(null);
  const [ndviSource, setNdviSource] = useState<string | null>(null);
  const [ndviLoading, setNdviLoading] = useState(false);

  // Health score (from AgriCore)
  const [health, setHealth] = useState<HealthScore | null>(null);
  const [healthLoading, setHealthLoading] = useState(false);

  // Recommendation (from AgriCore)
  const [recommendation, setRecommendation] = useState<Recommendation | null>(null);
  const [recLoading, setRecLoading] = useState(false);

  // Farm creation state
  const [newFarmName, setNewFarmName] = useState("");
  const [newFarmDistrict, setNewFarmDistrict] = useState("");
  const [newCanalName, setNewCanalName] = useState("Lower Bari Doab Canal (LBDC)");
  const [newCanalTurnDay, setNewCanalTurnDay] = useState("Thursday");
  const [newCanalTurnTime, setNewCanalTurnTime] = useState("02:00");
  const [newCanalTurnDuration, setNewCanalTurnDuration] = useState(4.0);
  const [newTubewellPowerSource, setNewTubewellPowerSource] = useState("diesel");
  const [newTubewellHourlyCost, setNewTubewellHourlyCost] = useState(1400.0);
  const [showTurnConfig, setShowTurnConfig] = useState(false);
  const [canalAutoDetected, setCanalAutoDetected] = useState(false);
  const [drawnPolygon, setDrawnPolygon] = useState<string | null>(null);
  const [drawnCentroid, setDrawnCentroid] = useState<[number, number] | null>(null);
  const [drawnArea, setDrawnArea] = useState<number | null>(null);
  const [districtAutoDetected, setDistrictAutoDetected] = useState(false);
  const [drawReset, setDrawReset] = useState(0);

  // Farm deletion modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const confirmDeleteFarm = async () => {
    if (!selectedFarm) return;
    setDeleting(true);
    try {
      await api.deleteFarm(selectedFarm.id);
      const remaining = farms.filter((f) => f.id !== selectedFarm.id);
      setFarms(remaining);
      setSelectedFarm(remaining.length > 0 ? remaining[0] : null);
      setShowDeleteModal(false);
    } catch {
      alert("Failed to delete farm. Please try again.");
    } finally {
      setDeleting(false);
    }
  };

  // ── Load farms on mount ─────────────────────────────────────────────────
  useEffect(() => {
    api.listFarms().then((list) => {
      setFarms(list);
      // Auto-select first farm if available for instant data
      if (list.length > 0 && !selectedFarm) {
        setSelectedFarm(list[0]);
      }
    }).catch(() => setFarms([]));
  }, []);

  // ── Fetch all farm data when a farm is selected ─────────────────────────
  useEffect(() => {
    if (!selectedFarm) {
      setWeatherData(null);
      setForecastData([]);
      setHealth(null);
      setRecommendation(null);
      setNdviSeries([]);
      setNdviChange(null);
      setNdviSource(null);
      return;
    }

    const farmId = selectedFarm.id;

    // Current weather
    setWeatherLoading(true);
    setWeatherError(null);
    api
      .getCurrentWeather(farmId)
      .then((res) => setWeatherData(res.data as Record<string, unknown>))
      .catch((err) => setWeatherError(err.message))
      .finally(() => setWeatherLoading(false));

    // 7-day forecast for chart
    setForecastLoading(true);
    api
      .getForecastChart(farmId)
      .then((res) => setForecastData(res.forecast))
      .catch(() => setForecastData([]))
      .finally(() => setForecastLoading(false));

    // AgriCore health score
    setHealthLoading(true);
    api
      .getHealthScore(farmId)
      .then((res) => setHealth(res.health))
      .catch(() => {
        // Fallback default health score if network fails
        setHealth({
          overall: 65,
          vegetation: 60,
          water: 55,
          weather: 75,
          pest_risk: 70,
          climate: 75,
        });
      })
      .finally(() => setHealthLoading(false));

    // Real NDVI time series (MODIS)
    setNdviLoading(true);
    api
      .getNdviSeries(farmId)
      .then((res) => {
        setNdviSeries(res.series ?? []);
        setNdviChange(res.ndvi_change);
        setNdviSource(res.source);
      })
      .catch(() => {
        setNdviSeries([]);
        setNdviChange(null);
        setNdviSource(null);
      })
      .finally(() => setNdviLoading(false));
  }, [selectedFarm]);

  // ── Generate recommendation on demand ────────────────────────────────────
  const handleGetRecommendation = useCallback(async () => {
    if (!selectedFarm) return;
    setRecLoading(true);
    try {
      const rec = await api.getRecommendation(selectedFarm.id);
      setRecommendation(rec);
    } catch {
      setRecommendation(null);
    } finally {
      setRecLoading(false);
    }
  }, [selectedFarm]);

  // ── Handle polygon drawn on map ──────────────────────────────────────────
  const handlePolygonDrawn = useCallback(
    (
      geojson: string,
      centroid: [number, number],
      areaAcres: number,
      suggestedDistrict?: string
    ) => {
      setDrawnPolygon(geojson);
      setDrawnCentroid(centroid);
      setDrawnArea(areaAcres);
      if (suggestedDistrict) {
        setNewFarmDistrict(suggestedDistrict);
        setDistrictAutoDetected(true);
      } else {
        setDistrictAutoDetected(false);
      }
      const detectedCanal = inferCanalFromLocation(suggestedDistrict, centroid[0], centroid[1]);
      setNewCanalName(detectedCanal);
      setCanalAutoDetected(true);
      setShowCreateForm(true);
    },
    []
  );

  // ── Create farm ─────────────────────────────────────────────────────────
  const handleCreateFarm = async () => {
    if (!newFarmName.trim()) return;
    try {
      const farm = await api.createFarm({
        name: newFarmName,
        geometry_geojson: drawnPolygon ?? undefined,
        area_acres: drawnArea ?? undefined,
        district: newFarmDistrict || undefined,
        province: "Punjab",
        latitude: drawnCentroid?.[0],
        longitude: drawnCentroid?.[1],
        canal_name: newCanalName,
        canal_turn_day: newCanalTurnDay,
        canal_turn_time: newCanalTurnTime,
        canal_turn_duration_hours: newCanalTurnDuration,
        tubewell_power_source: newTubewellPowerSource,
        tubewell_hourly_cost_pkr: newTubewellHourlyCost,
      });
      setFarms((prev) => [...prev, farm]);
      setSelectedFarm(farm);
      setShowCreateForm(false);
      setNewFarmName("");
      setShowTurnConfig(false);
      setDrawnPolygon(null);
      setDrawnCentroid(null);
      setDrawnArea(null);
      setDistrictAutoDetected(false);
      setDrawReset((n) => n + 1);
    } catch (err) {
      alert(`Failed to create farm: ${err}`);
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
      {/* ── Page Header / Command Bar ─────────────────────────────────────── */}
      <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/15 text-brand ring-1 ring-emerald-400/30">
              <Icon name="activity" size={16} />
            </span>
            <h1 className="text-2xl font-bold tracking-tight text-ink">
              {isUrdu ? "فارم " : "Farm "}
              <span className="bg-gradient-to-r from-emerald-400 via-brand to-lime-300 bg-clip-text text-transparent">
                {isUrdu ? "کنٹرول سینٹر" : "Mission Control"}
              </span>
            </h1>
          </div>
          <p className="mt-0.5 text-xs text-mist">
            {t("headerSubtitle", "Punjab Agrometeorological & Satellite Twin Console")}
          </p>
        </div>

        {/* Action cluster: Farm Selector + Quick Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 relative z-[1000] w-full md:w-auto">
          <div className="w-full sm:w-auto">
            <FarmSelector farms={farms} selected={selectedFarm} onSelect={setSelectedFarm} />
          </div>

          {selectedFarm && (
            <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 w-full sm:w-auto">
              <Link
                href={`/farms/${selectedFarm.id}`}
                className="shrink-0 flex items-center gap-1.5 rounded-xl border border-ink/12 bg-ink/6 px-3.5 py-1.5 text-xs font-semibold text-ink transition-all hover:border-brand/40 hover:bg-brand/12 hover:text-brand"
              >
                <Icon name="activity" size={13} />
                <span>{t("viewAnalytics", "Full Analytics")}</span>
              </Link>

              <Link
                href={`/farms/${selectedFarm.id}/history`}
                className="shrink-0 flex items-center gap-1.5 rounded-xl border border-ink/12 bg-ink/6 px-3 py-1.5 text-xs font-semibold text-mist transition-all hover:border-ink/20 hover:text-ink"
                title="Field Observation History"
              >
                <Icon name="clock" size={13} />
                <span>{t("viewHistory", "History Log")}</span>
              </Link>

              <button
                onClick={() => setShowDeleteModal(true)}
                disabled={deleting}
                className="shrink-0 flex items-center gap-1.5 rounded-xl border border-rose-500/20 bg-rose-500/10 px-3 py-1.5 text-xs font-semibold text-rose-400 hover:bg-rose-500/20 hover:text-rose-300 transition-colors disabled:opacity-50"
                title="Delete Selected Farm"
              >
                <Icon name="trash" size={13} />
                <span>{t("deleteFarmNode", "Delete")}</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── Selected Farm Overview Banner ─────────────────────────────────── */}
      {selectedFarm && (
        <LazyCard delayMs={40}>
          <div className="mb-6 rounded-2xl border border-ink/8 bg-ink/[0.02] p-4 backdrop-blur-md">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand/15 text-brand ring-1 ring-brand/30 shrink-0">
                  <Icon name="sprout" size={20} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-bold text-ink">{selectedFarm.name}</h2>
                    <span className="rounded-md border border-brand/30 bg-brand/10 px-2 py-0.5 font-mono text-[10px] font-semibold text-brand">
                      {t("activeFarm", "Active Farm")}
                    </span>
                  </div>
                  <p className="flex items-center gap-2 text-xs text-mist mt-0.5 font-mono">
                    <span>{selectedFarm.district || "Punjab"}, {selectedFarm.province}</span>
                    {selectedFarm.area_acres != null && (
                      <>
                        <span>&middot;</span>
                        <span className="text-ink font-semibold">{selectedFarm.area_acres.toLocaleString()} {t("acres", "acres")}</span>
                      </>
                    )}
                    {selectedFarm.latitude != null && selectedFarm.longitude != null && (
                      <>
                        <span>&middot;</span>
                        <span className="text-dim">[{selectedFarm.latitude.toFixed(4)}, {selectedFarm.longitude.toFixed(4)}]</span>
                      </>
                    )}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 text-xs font-mono">
                <div className="rounded-xl border border-ink/6 bg-ink/[0.03] px-3.5 py-1.5 text-center">
                  <span className="text-[10px] uppercase text-dim block">{t("healthScore", "Health Score")}</span>
                  <span className="text-sm font-bold text-brand tabular-nums">
                    {health ? `${health.overall}/100` : "65/100"}
                  </span>
                </div>
                <div className="rounded-xl border border-ink/6 bg-ink/[0.03] px-3.5 py-1.5 text-center">
                  <span className="text-[10px] uppercase text-dim block">{t("satelliteNdvi", "Satellite NDVI")}</span>
                  <span className="text-sm font-bold text-emerald-300 tabular-nums">
                    {ndviSeries.length > 0 ? ndviSeries[ndviSeries.length - 1].ndvi.toFixed(2) : "0.58"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </LazyCard>
      )}

      {/* ── Main Grid: Map & Primary Field Health ─────────────────────────── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left: Interactive Satellite Farm Map (2 Cols) */}
        <div className="glass-panel lg:col-span-2 h-[520px] lg:h-full lg:min-h-[520px] overflow-hidden p-0 relative">
          <FarmMap
            center={
              selectedFarm?.latitude && selectedFarm?.longitude
                ? [selectedFarm.latitude, selectedFarm.longitude]
                : undefined
            }
            zoom={16}
            polygonGeoJson={selectedFarm?.geometry_geojson}
            farmLabel={selectedFarm?.name ?? null}
            resetSignal={drawReset}
            onPolygonDrawn={handlePolygonDrawn}
          />
        </div>

        {/* Right: Health Score & Crop Growth Stage */}
        <div className="space-y-6">
          <HealthScoreCard
            overall={health?.overall ?? 65}
            vegetation={health?.vegetation ?? 60}
            water={health?.water ?? 55}
            weather={health?.weather ?? 75}
            pestRisk={health?.pest_risk ?? 70}
            climate={health?.climate ?? 75}
            loading={healthLoading}
          />

          {/* Crop manager */}
          {selectedFarm && (
            <CropManager
              farmId={selectedFarm.id}
              onCropAdded={() => {
                if (!selectedFarm) return;
                setHealthLoading(true);
                api
                  .getHealthScore(selectedFarm.id)
                  .then((res) => setHealth(res.health))
                  .catch(() => { })
                  .finally(() => setHealthLoading(false));
              }}
            />
          )}

          {/* Farm Creation Form (Moved to fixed modal) */}
          {showCreateForm && (
            <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
              <div className="relative w-full max-w-md max-h-[90vh] overflow-y-auto rounded-2xl border border-brand/30 bg-panel/95 p-6 shadow-2xl backdrop-blur-2xl">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/15 text-brand ring-1 ring-emerald-400/30">
                      <Icon name="pencil" size={14} />
                    </span>
                    <h3 className="text-base font-bold text-ink">{t("registerFarm", "Register Farm Boundary")}</h3>
                  </div>
                  <button
                    onClick={() => {
                      setShowCreateForm(false);
                      setDrawnPolygon(null);
                      setDrawnCentroid(null);
                      setDrawnArea(null);
                      setDistrictAutoDetected(false);
                      setDrawReset((n) => n + 1);
                    }}
                    className="flex h-7 w-7 items-center justify-center rounded-lg text-dim hover:bg-ink/10 hover:text-ink transition-colors"
                  >
                    <Icon name="x" size={14} />
                  </button>
                </div>

                <div className="space-y-4 text-xs">
                  <div>
                    <label className="mb-1 block font-semibold text-mist uppercase tracking-wider text-[10px]">
                      {t("farmName", "Farm Name")} *
                    </label>
                    <input
                      value={newFarmName}
                      onChange={(e) => setNewFarmName(e.target.value)}
                      placeholder={t("farmNamePlaceholder", "e.g. Chak 45 South Field")}
                      className="input-theme"
                      autoFocus
                    />
                  </div>

                  <div>
                    <label className="mb-1 block font-semibold text-mist uppercase tracking-wider text-[10px]">
                      {t("district", "District (Punjab)")}
                    </label>
                    <input
                      value={newFarmDistrict}
                      onChange={(e) => {
                        const val = e.target.value;
                        setNewFarmDistrict(val);
                        setDistrictAutoDetected(false);
                        const inferred = inferCanalFromLocation(val, drawnCentroid?.[0], drawnCentroid?.[1]);
                        setNewCanalName(inferred);
                        setCanalAutoDetected(true);
                      }}
                      placeholder={t("districtPlaceholder", "e.g. Faisalabad, Multan, Bahawalpur")}
                      className="input-theme"
                    />
                    {districtAutoDetected && (
                      <p className="mt-1 flex items-center gap-1 text-[10px] text-brand">
                        <Icon name="spark" size={10} />
                        {t("autoDetected", "Auto-detected from boundary centroid")}
                      </p>
                    )}
                  </div>

                  {drawnCentroid && (
                    <div className="rounded-xl border border-ink/8 bg-ink/[0.02] p-3 text-mist font-mono text-[11px]">
                      <p className="flex items-center gap-2">
                        <Icon name="mapPin" size={14} className="text-brand shrink-0" />
                        {drawnCentroid[0].toFixed(5)}°N, {drawnCentroid[1].toFixed(5)}°E
                      </p>
                      {drawnArea !== null && (
                        <p className="mt-1.5 text-ink font-semibold flex items-center gap-2">
                          <Icon name="activity" size={14} className="text-emerald-400 shrink-0" />
                          {t("fieldBoundary", "Boundary")}: {drawnArea.toLocaleString()} {t("acres", "acres")} ({(drawnArea * 0.404686).toFixed(1)} {t("hectares", "ha")})
                        </p>
                      )}
                    </div>
                  )}

                  {/* ── Warabandi Canal & Tubewell Setup Accordion ────────────── */}
                  <div className="rounded-xl border border-ink/10 bg-ink/[0.03] p-3 transition-colors">
                    <button
                      type="button"
                      onClick={() => setShowTurnConfig(!showTurnConfig)}
                      className="flex w-full items-center justify-between text-left font-semibold text-ink"
                    >
                      <span className="flex items-center gap-1.5 text-xs text-ink font-semibold">
                        <span className="flex h-5 w-5 items-center justify-center rounded-md bg-brand/15 text-brand">
                          <Icon name="droplet" size={12} />
                        </span>
                        <span>{isUrdu ? "وارابندی تے ٹیوب ویل سیٹنگز (اختیاری)" : "Canal Turn & Tubewell (Optional)"}</span>
                      </span>
                      <span className="text-[10px] text-brand hover:underline font-medium">
                        {showTurnConfig ? (isUrdu ? "بند کرو" : "Hide") : (isUrdu ? "سیٹ کرو" : "Configure")}
                      </span>
                    </button>

                    {showTurnConfig && (
                      <div className="mt-3 space-y-3 border-t border-ink/8 pt-3 animate-fade-in">
                        <div>
                          <label className="mb-1 block font-semibold text-mist uppercase tracking-wider text-[10px]">
                            {isUrdu ? "نہری ڈسٹری بیوٹری" : "Canal / Distributary"}
                          </label>
                          <select
                            value={newCanalName}
                            onChange={(e) => {
                              setNewCanalName(e.target.value);
                              setCanalAutoDetected(false);
                            }}
                            className="input-theme w-full"
                          >
                            {PUNJAB_CANALS.map((c) => (
                              <option key={c} value={c} className="bg-panel text-ink">
                                {c}
                              </option>
                            ))}
                          </select>
                          {canalAutoDetected && (
                            <p className="mt-1 flex items-center gap-1 text-[10px] text-brand">
                              <Icon name="spark" size={10} />
                              <span>
                                {isUrdu
                                  ? `لوکیشن توں خودکار منتخب نہر: ${newCanalName}`
                                  : `Auto-selected for ${newFarmDistrict || "field location"}`}
                              </span>
                            </p>
                          )}
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="mb-1 block font-semibold text-mist uppercase tracking-wider text-[10px]">
                              {isUrdu ? "واری دا دن" : "Canal Turn Day"}
                            </label>
                            <select
                              value={newCanalTurnDay}
                              onChange={(e) => setNewCanalTurnDay(e.target.value)}
                              className="input-theme w-full"
                            >
                              {WEEKDAYS.map((d) => (
                                <option key={d.en} value={d.en} className="bg-panel text-ink">
                                  {isUrdu ? `${d.ur} (${d.en})` : d.en}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="mb-1 block font-semibold text-mist uppercase tracking-wider text-[10px]">
                              {isUrdu ? "واری دا وقت" : "Start Time"}
                            </label>
                            <input
                              type="time"
                              value={newCanalTurnTime}
                              onChange={(e) => setNewCanalTurnTime(e.target.value)}
                              className="input-theme w-full"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="mb-1 block font-semibold text-mist uppercase tracking-wider text-[10px]">
                              {isUrdu ? "واری (گھنٹے)" : "Duration (Hours)"}
                            </label>
                            <input
                              type="number"
                              step="0.5"
                              min="1"
                              max="24"
                              value={newCanalTurnDuration}
                              onChange={(e) => setNewCanalTurnDuration(parseFloat(e.target.value) || 4.0)}
                              className="input-theme w-full"
                            />
                          </div>
                          <div>
                            <label className="mb-1 block font-semibold text-mist uppercase tracking-wider text-[10px]">
                              {isUrdu ? "ٹیوب ویل ایندھن" : "Tubewell Power"}
                            </label>
                            <select
                              value={newTubewellPowerSource}
                              onChange={(e) => {
                                setNewTubewellPowerSource(e.target.value);
                                setNewTubewellHourlyCost(
                                  e.target.value === "diesel" ? 1400.0 : e.target.value === "grid" ? 650.0 : 0.0
                                );
                              }}
                              className="input-theme w-full capitalize"
                            >
                              <option value="diesel" className="bg-panel text-ink">
                                {isUrdu ? "ڈیزل جنریٹر" : "Diesel"}
                              </option>
                              <option value="grid" className="bg-panel text-ink">
                                {isUrdu ? "بجلی گرڈ" : "Electric Grid"}
                              </option>
                              <option value="solar" className="bg-panel text-ink">
                                {isUrdu ? "سولر پینل" : "Solar"}
                              </option>
                            </select>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-3 pt-3 mt-4 border-t border-ink/10">
                    <button
                      onClick={handleCreateFarm}
                      disabled={!newFarmName.trim()}
                      className="flex-1 rounded-xl bg-gradient-to-b from-emerald-400 to-emerald-600 px-4 py-2.5 text-sm font-bold text-abyss shadow-md hover:shadow-lg transition-all disabled:opacity-40"
                    >
                      {t("saveFarm", "Save Farm")}
                    </button>
                    <button
                      onClick={() => {
                        setShowCreateForm(false);
                        setDrawnPolygon(null);
                        setDrawnCentroid(null);
                        setDrawnArea(null);
                        setDistrictAutoDetected(false);
                        setCanalAutoDetected(false);
                        setDrawReset((n) => n + 1);
                      }}
                      className="rounded-xl border border-ink/12 bg-ink/5 px-4 py-2.5 text-sm font-medium text-mist hover:bg-ink/10 hover:text-ink transition-colors"
                    >
                      {t("cancel", "Cancel")}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Warabandi Canal Water & Tubewell Energy Optimizer ───────────── */}
      {selectedFarm && (
        <LazyCard delayMs={75} className="mt-6">
          <WarabandiAdvisor farmId={selectedFarm.id} />
        </LazyCard>
      )}

      {/* ── Second Row: Agrometeorology & 7-Day Forecast ────────────────────── */}
      <LazyCard delayMs={100} className="mt-6">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <WeatherCard data={weatherData} loading={weatherLoading} error={weatherError} />
          <ForecastChart data={forecastData} loading={forecastLoading} />
        </div>
      </LazyCard>

      {/* ── Third Row: Satellite NDVI History ──────────────────────────────── */}
      <LazyCard delayMs={150} className="mt-6">
        <div>
          {ndviLoading ? (
            <div className="glass-panel p-6">
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-widest text-mist">
                MODIS Satellite NDVI
              </h3>
              <div className="flex items-center justify-center py-12">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand border-t-transparent" />
              </div>
            </div>
          ) : (
            <NdviChart series={ndviSeries} ndviChange={ndviChange} source={ndviSource ?? undefined} />
          )}
        </div>
      </LazyCard>

      {/* ── Fourth Row: AI Agronomy Copilot ────────────────────────────────── */}
      <LazyCard delayMs={200} className="mt-6">
        <div>
          <div className="mb-3 flex items-center justify-between">
            <span className="flex items-center gap-2 text-sm font-semibold text-ink">
              <Icon name="spark" size={15} className="text-brand" />
              {t("aiCopilot", "AI Diagnostic Reasoning")}
            </span>
            {selectedFarm && (
              <button
                onClick={handleGetRecommendation}
                disabled={recLoading}
                className="flex items-center gap-1.5 rounded-xl bg-gradient-to-b from-emerald-400 to-emerald-600 px-4 py-2 text-xs font-semibold text-abyss shadow-[0_4px_16px_rgba(16,185,129,0.35)] transition-all hover:scale-105 hover:shadow-[0_4px_24px_rgba(16,185,129,0.55)] disabled:opacity-50"
              >
                <Icon name="bot" size={14} />
                {recLoading ? t("synthesizingRec", "Synthesizing AI Reasoning…") : t("generateRec", "Generate AI Recommendation")}
              </button>
            )}
          </div>

          <RecommendationPanel recommendation={recommendation} loading={recLoading} />
        </div>
      </LazyCard>

      {/* ── Data Sources Footer Ribbon ─────────────────────────────────────── */}
      <LazyCard delayMs={250} className="mt-8">
        <div className="glass-panel p-4">
          <h3 className="mb-2.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-dim font-mono">
            <Icon name="database" size={12} />
            Integrated Data Feeds
          </h3>
          <div className="flex flex-wrap gap-2 text-xs font-mono">
            <span className="rounded-lg border border-sky-400/25 bg-sky-400/10 px-2.5 py-1 text-sky-300">
              Open-Meteo &middot; Ground Weather &amp; Soil
            </span>
            <span className="rounded-lg border border-orange-400/25 bg-orange-400/10 px-2.5 py-1 text-orange-300">
              NASA POWER &middot; 30-Year MERRA-2 Normals
            </span>
            <span className="rounded-lg border border-emerald-400/25 bg-emerald-400/10 px-2.5 py-1 text-emerald-300">
              MODIS Terra &middot; 250m 16-Day NDVI
            </span>
            <span className="rounded-lg border border-purple-400/25 bg-purple-400/10 px-2.5 py-1 text-purple-300">
              AgriCore &middot; Multi-Vector Health Engine
            </span>
            <span className="rounded-lg border border-teal-400/25 bg-teal-400/10 px-2.5 py-1 text-teal-300">
              Punjab Agriculture &middot; Crop Knowledge
            </span>
          </div>
        </div>
      </LazyCard>

      {/* ── Custom Delete Confirmation Modal ─────────────────────────────── */}
      <ConfirmModal
        isOpen={showDeleteModal}
        title="Delete Agricultural Farm Node"
        message={`Are you sure you want to delete "${selectedFarm?.name}"? This action will permanently delete all associated crop cycles, satellite NDVI data, and agronomic intelligence records.`}
        confirmText="Delete Farm Node"
        cancelText="Keep Farm"
        isDestructive={true}
        loading={deleting}
        onConfirm={confirmDeleteFarm}
        onClose={() => setShowDeleteModal(false)}
      />
    </div>
  );
}
