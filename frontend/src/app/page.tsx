"use client";

import { useCallback, useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { api, type Farm, type HealthScore, type Recommendation, type ForecastDay, type AuthUser } from "@/lib/api";
import Link from "next/link";
import HealthScoreCard from "@/components/HealthScoreCard";
import WeatherCard from "@/components/WeatherCard";
import NdviChart from "@/components/NdviChart";
import RecommendationPanel from "@/components/RecommendationPanel";
import ForecastChart from "@/components/ForecastChart";
import CropManager from "@/components/CropManager";
import FarmSelector from "@/components/FarmSelector";
import Icon from "@/components/Icon";

// Dynamic import prevents SSR issues with Leaflet
const FarmMap = dynamic(() => import("@/components/FarmMap"), { ssr: false });

export default function DashboardPage() {
  const [farms, setFarms] = useState<Farm[]>([]);
  const [selectedFarm, setSelectedFarm] = useState<Farm | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [apiStatus, setApiStatus] = useState<"online" | "offline">("offline");

  // Auth state
  const [user, setUser] = useState<AuthUser | null>(null);

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
  const [drawnPolygon, setDrawnPolygon] = useState<string | null>(null);
  const [drawnCentroid, setDrawnCentroid] = useState<[number, number] | null>(null);
  const [drawnArea, setDrawnArea] = useState<number | null>(null);
  const [districtAutoDetected, setDistrictAutoDetected] = useState(false);
  // Increment to clear the unsaved drawing from the map
  const [drawReset, setDrawReset] = useState(0);

  // ── Load farms on mount ─────────────────────────────────────────────────
  useEffect(() => {
    api.healthCheck().then((h) => setApiStatus(h.status === "ok" ? "online" : "offline"));
    api.listFarms().then(setFarms).catch(() => setFarms([]));
    // Load user from localStorage
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("agri_user");
      if (stored) {
        try { setUser(JSON.parse(stored)); } catch { /* ignore */ }
      }
    }
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
      .catch(() => setHealth(null))
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

  // ── Handle polygon drawn on map (district auto-detected from location) ──
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
      });
      setFarms((prev) => [...prev, farm]);
      setSelectedFarm(farm);
      setShowCreateForm(false);
      setNewFarmName("");
      setDrawnPolygon(null);
      setDrawnCentroid(null);
      setDrawnArea(null);
      setDistrictAutoDetected(false);
      setDrawReset((n) => n + 1); // clear the drawing off the map
    } catch (err) {
      alert(`Failed to create farm: ${err}`);
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      {/* ── Page Header ──────────────────────────────────────────────────── */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-ink">
            Farm <span className="bg-gradient-to-r from-emerald-400 to-lime-300 bg-clip-text text-transparent">Mission Control</span>
          </h1>
          <p className="mt-0.5 text-sm text-mist">
            AgriTwin agriculture intelligence — Punjab, Pakistan
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span
            className={`flex items-center gap-1.5 rounded-full border px-3 py-1 font-mono text-[11px] font-medium uppercase tracking-wide ${
              apiStatus === "online"
                ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-300"
                : "border-red-400/30 bg-red-400/10 text-red-300"
            }`}
          >
            <span className="relative flex h-2 w-2">
              {apiStatus === "online" && (
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
              )}
              <span
                className={`relative inline-flex h-2 w-2 rounded-full ${
                  apiStatus === "online" ? "bg-emerald-400" : "bg-red-400"
                }`}
              />
            </span>
            {apiStatus}
          </span>
          {user ? (
            <span className="flex items-center gap-1.5 text-xs text-mist">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand/15 text-[10px] font-bold uppercase text-brand">
                {user.name.charAt(0)}
              </span>
              {user.name}
            </span>
          ) : (
            <Link
              href="/login"
              className="rounded-lg bg-gradient-to-b from-emerald-400 to-emerald-600 px-3.5 py-1.5 text-xs font-semibold text-abyss shadow-[0_4px_16px_rgba(16,185,129,0.35)] transition-shadow hover:shadow-[0_4px_24px_rgba(16,185,129,0.55)]"
            >
              Sign In
            </Link>
          )}
          <FarmSelector farms={farms} selected={selectedFarm} onSelect={setSelectedFarm} />
          {selectedFarm && (
            <Link
              href={`/farms/${selectedFarm.id}`}
              className="flex items-center gap-1.5 rounded-lg border border-white/12 bg-white/6 px-3.5 py-1.5 text-xs font-semibold text-ink transition-colors hover:border-brand/40 hover:bg-brand/10 hover:text-brand"
            >
              <Icon name="activity" size={13} />
              View Details
            </Link>
          )}
        </div>
      </div>

      {/* ── Main Grid ────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left: Map (spans 2 cols) */}
        <div className="glass-panel lg:col-span-2 h-[480px] overflow-hidden">
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

        {/* Right: Health score + Crop Manager */}
        <div className="space-y-6">
          {healthLoading ? (
            <div className="glass-panel p-5 text-center">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand border-t-transparent mx-auto mb-2" />
              <p className="text-xs text-mist">Computing health score...</p>
            </div>
          ) : health ? (
            <HealthScoreCard
              overall={health.overall}
              vegetation={health.vegetation}
              water={health.water}
              weather={health.weather}
              pestRisk={health.pest_risk}
              climate={health.climate}
            />
          ) : (
            <HealthScoreCard overall={0} vegetation={0} water={0} weather={0} pestRisk={0} climate={0} />
          )}

          {/* Crop manager — only show when a farm is selected */}
          {selectedFarm && (
            <CropManager
              farmId={selectedFarm.id}
              onCropAdded={() => {
                // Re-compute health after adding a crop
                if (!selectedFarm) return;
                setHealthLoading(true);
                api
                  .getHealthScore(selectedFarm.id)
                  .then((res) => setHealth(res.health))
                  .catch(() => {})
                  .finally(() => setHealthLoading(false));
              }}
            />
          )}

          {/* Farm creation form */}
          {showCreateForm && (
            <div className="glass-panel brand-glow p-5">
              <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-brand">
                <Icon name="mapPin" size={14} />
                Create Farm
              </h3>
              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="Farm name"
                  value={newFarmName}
                  onChange={(e) => setNewFarmName(e.target.value)}
                  className="input-dark"
                />
                <div>
                  <label className="mb-1 block text-xs font-medium text-mist">
                    District{" "}
                    {districtAutoDetected && (
                      <span className="font-normal text-brand">
                        · auto-detected from location
                      </span>
                    )}
                  </label>
                  <input
                    type="text"
                    placeholder="District"
                    value={newFarmDistrict}
                    onChange={(e) => {
                      setNewFarmDistrict(e.target.value);
                      setDistrictAutoDetected(false);
                    }}
                    className="input-dark"
                  />
                </div>
                {drawnCentroid && (
                  <p className="flex items-center gap-1.5 text-xs text-mist">
                    <Icon name="mapPin" size={12} className="text-brand" />
                    {drawnCentroid[0].toFixed(5)}, {drawnCentroid[1].toFixed(5)}
                    {drawnArea !== null && (
                      <>
                        {" "}·{" "}
                        <span className="font-semibold text-brand">
                          {drawnArea.toLocaleString()} acres
                        </span>{" "}
                        ({(drawnArea * 0.404686).toFixed(1)} ha)
                      </>
                    )}
                  </p>
                )}
                <div className="flex gap-2">
                  <button
                    onClick={handleCreateFarm}
                    disabled={!newFarmName.trim()}
                    className="flex-1 rounded-lg bg-gradient-to-b from-emerald-400 to-emerald-600 px-4 py-2 text-sm font-semibold text-abyss shadow-[0_4px_16px_rgba(16,185,129,0.35)] transition-shadow hover:shadow-[0_4px_24px_rgba(16,185,129,0.55)] disabled:opacity-40 disabled:shadow-none"
                  >
                    Save Farm
                  </button>
                  <button
                    onClick={() => {
                      setShowCreateForm(false);
                      setDrawnPolygon(null);
                      setDrawnCentroid(null);
                      setDrawnArea(null);
                      setDistrictAutoDetected(false);
                      setDrawReset((n) => n + 1);
                    }}
                    className="rounded-lg border border-white/12 px-4 py-2 text-sm text-mist transition-colors hover:bg-white/6 hover:text-ink"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Second Row: Weather + Forecast ─────────────────────────────────── */}
      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <WeatherCard data={weatherData} loading={weatherLoading} error={weatherError} />
        <ForecastChart data={forecastData} loading={forecastLoading} />
      </div>

      {/* ── Third Row: NDVI ───────────────────────────────────────────────── */}
      <div className="mt-6 grid grid-cols-1 gap-6">
        {ndviLoading ? (
          <div className="glass-panel p-5">
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-widest text-mist">
              NDVI — 12-Month Trend
            </h3>
            <div className="flex items-center justify-center py-12">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand border-t-transparent" />
            </div>
          </div>
        ) : (
          <NdviChart series={ndviSeries} ndviChange={ndviChange} source={ndviSource ?? undefined} />
        )}
      </div>

      {/* ── Fourth Row: AI Recommendation ─────────────────────────────────── */}
      <div className="mt-6">
        <div className="mb-3 flex items-center justify-between">
          <span className="flex items-center gap-2 text-sm font-semibold text-ink">
            <Icon name="spark" size={15} className="text-brand" />
            AI Analysis
          </span>
          {selectedFarm && (
            <button
              onClick={handleGetRecommendation}
              disabled={recLoading}
              className="flex items-center gap-1.5 rounded-lg bg-gradient-to-b from-emerald-400 to-emerald-600 px-4 py-1.5 text-sm font-semibold text-abyss shadow-[0_4px_16px_rgba(16,185,129,0.35)] transition-shadow hover:shadow-[0_4px_24px_rgba(16,185,129,0.55)] disabled:opacity-50 disabled:shadow-none"
            >
              <Icon name="bot" size={14} />
              {recLoading ? "Analyzing..." : "Generate Recommendation"}
            </button>
          )}
        </div>
        <RecommendationPanel
          recommendation={recommendation}
          loading={recLoading}
        />
      </div>

      {/* ── Data Sources Footer ──────────────────────────────────────────── */}
      <div className="glass-panel mt-8 p-4">
        <h3 className="mb-2.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-dim">
          <Icon name="database" size={12} />
          Data Sources
        </h3>
        <div className="flex flex-wrap gap-2 text-xs">
          <span className="rounded-md border border-sky-400/25 bg-sky-400/10 px-2 py-1 text-sky-300">Open-Meteo (Weather + Soil)</span>
          <span className="rounded-md border border-orange-400/25 bg-orange-400/10 px-2 py-1 text-orange-300">NASA POWER (Historical Climate)</span>
          <span className="rounded-md border border-emerald-400/25 bg-emerald-400/10 px-2 py-1 text-emerald-300">MODIS Terra (NDVI)</span>
          <span className="rounded-md border border-purple-400/25 bg-purple-400/10 px-2 py-1 text-purple-300">AgriCore (Score Engine)</span>
          <span className="rounded-md border border-teal-400/25 bg-teal-400/10 px-2 py-1 text-teal-300">Punjab Crop Knowledge</span>
          <span className="rounded-md border border-yellow-400/25 bg-yellow-400/10 px-2 py-1 text-yellow-300">OSM Nominatim (Geocoding)</span>
        </div>
      </div>
    </div>
  );
}
