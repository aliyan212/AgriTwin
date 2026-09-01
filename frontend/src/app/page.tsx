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
  const [newFarmDistrict, setNewFarmDistrict] = useState("Gujrat");
  const [drawnPolygon, setDrawnPolygon] = useState<string | null>(null);
  const [drawnCentroid, setDrawnCentroid] = useState<[number, number] | null>(null);
  const [drawnArea, setDrawnArea] = useState<number | null>(null);

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

  // ── Handle polygon drawn on map ─────────────────────────────────────────
  const handlePolygonDrawn = useCallback(
    (geojson: string, centroid: [number, number], areaAcres: number) => {
      setDrawnPolygon(geojson);
      setDrawnCentroid(centroid);
      setDrawnArea(areaAcres);
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
    } catch (err) {
      alert(`Failed to create farm: ${err}`);
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      {/* ── Page Header ──────────────────────────────────────────────────── */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Farm Dashboard</h1>
          <p className="text-sm text-gray-500">
            AgriTwin agriculture intelligence — Punjab, Pakistan
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span
            className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${
              apiStatus === "online"
                ? "bg-green-100 text-green-700"
                : "bg-red-100 text-red-700"
            }`}
          >
            <span
              className={`h-2 w-2 rounded-full ${
                apiStatus === "online" ? "bg-green-500" : "bg-red-500"
              }`}
            />
            Backend {apiStatus}
          </span>
          {user ? (
            <span className="text-xs text-gray-600">
              {user.name}
            </span>
          ) : (
            <Link
              href="/login"
              className="rounded-lg bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-700"
            >
              Sign In
            </Link>
          )}
          <select
            className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm"
            value={selectedFarm?.id ?? ""}
            onChange={(e) => {
              const f = farms.find((f) => f.id === Number(e.target.value));
              setSelectedFarm(f ?? null);
            }}
          >
            <option value="">Select a farm...</option>
            {farms.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name} ({f.district ?? f.province})
              </option>
            ))}
          </select>
          {selectedFarm && (
            <Link
              href={`/farms/${selectedFarm.id}`}
              className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-700"
            >
              View Details
            </Link>
          )}
        </div>
      </div>

      {/* ── Main Grid ────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left: Map (spans 2 cols) */}
        <div className="lg:col-span-2 h-[480px] rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
          <FarmMap
            center={
              selectedFarm?.latitude && selectedFarm?.longitude
                ? [selectedFarm.latitude, selectedFarm.longitude]
                : [32.5736, 74.0782]
            }
            zoom={13}
            polygonGeoJson={selectedFarm?.geometry_geojson}
            onPolygonDrawn={handlePolygonDrawn}
          />
        </div>

        {/* Right: Health score + Crop Manager */}
        <div className="space-y-6">
          {healthLoading ? (
            <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm text-center">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-green-500 border-t-transparent mx-auto mb-2" />
              <p className="text-xs text-gray-500">Computing health score...</p>
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
            <div className="rounded-xl border border-green-300 bg-green-50 p-5 shadow-sm">
              <h3 className="mb-3 text-sm font-semibold text-green-800 uppercase">
                Create Farm
              </h3>
              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="Farm name"
                  value={newFarmName}
                  onChange={(e) => setNewFarmName(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none"
                />
                <input
                  type="text"
                  placeholder="District"
                  value={newFarmDistrict}
                  onChange={(e) => setNewFarmDistrict(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none"
                />
                {drawnCentroid && (
                  <p className="text-xs text-gray-500">
                    Centroid: {drawnCentroid[0].toFixed(4)},{" "}
                    {drawnCentroid[1].toFixed(4)}
                  </p>
                )}
                {drawnArea !== null && (
                  <p className="text-xs text-gray-500">
                    Area: <span className="font-semibold text-green-700">{drawnArea} acres</span>
                  </p>
                )}
                <div className="flex gap-2">
                  <button
                    onClick={handleCreateFarm}
                    disabled={!newFarmName.trim()}
                    className="flex-1 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-40"
                  >
                    Save Farm
                  </button>
                  <button
                    onClick={() => {
                      setShowCreateForm(false);
                      setDrawnPolygon(null);
                      setDrawnCentroid(null);
                      setDrawnArea(null);
                    }}
                    className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50"
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
          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <h3 className="mb-3 text-sm font-semibold text-gray-500 uppercase tracking-wide">
              NDVI — 12-Month Trend
            </h3>
            <div className="flex items-center justify-center py-12">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-green-500 border-t-transparent" />
            </div>
          </div>
        ) : (
          <NdviChart series={ndviSeries} ndviChange={ndviChange} source={ndviSource ?? undefined} />
        )}
      </div>

      {/* ── Fourth Row: AI Recommendation ─────────────────────────────────── */}
      <div className="mt-6">
        <div className="mb-3 flex items-center justify-between">
          <span className="text-sm font-semibold text-gray-600">AI Analysis</span>
          {selectedFarm && (
            <button
              onClick={handleGetRecommendation}
              disabled={recLoading}
              className="rounded-lg bg-indigo-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
            >
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
      <div className="mt-8 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <h3 className="mb-2 text-xs font-semibold text-gray-400 uppercase tracking-wide">
          Data Sources
        </h3>
        <div className="flex flex-wrap gap-3 text-xs text-gray-500">
          <span className="rounded bg-blue-50 px-2 py-1 text-blue-700">Open-Meteo (Weather)</span>
          <span className="rounded bg-orange-50 px-2 py-1 text-orange-700">NASA POWER (Historical)</span>
          <span className="rounded bg-green-50 px-2 py-1 text-green-700">Sentinel-2 (NDVI)</span>
          <span className="rounded bg-purple-50 px-2 py-1 text-purple-700">ERA5-Land (Soil)</span>
          <span className="rounded bg-teal-50 px-2 py-1 text-teal-700">Punjab Agri (Crop Data)</span>
          <span className="rounded bg-yellow-50 px-2 py-1 text-yellow-700">PMD (Agromet)</span>
        </div>
      </div>
    </div>
  );
}
