/**
 * AgriTwin API client — talks to the FastAPI backend at localhost:8000.
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000/api/v1";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  // Attach JWT token if available
  const token = typeof window !== "undefined" ? localStorage.getItem("agri_token") : null;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(init?.headers as Record<string, string>),
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, { ...init, headers });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`API ${res.status}: ${body || res.statusText}`);
  }
  return res.json() as Promise<T>;
}

// ── Types ────────────────────────────────────────────────────────────────────
export interface Farm {
  id: number;
  name: string;
  geometry_geojson: string | null;
  area_acres: number | null;
  district: string | null;
  province: string;
  latitude: number | null;
  longitude: number | null;
  created_at: string;
}

export interface Crop {
  id: number;
  farm_id: number;
  crop_name: string;
  variety: string | null;
  sowing_date: string | null;
  expected_harvest_date: string | null;
  growth_stage: string | null;
  season: string | null;
}

export interface WeatherData {
  farm_id: number;
  source: string;
  data: Record<string, unknown>;
}

export interface HealthScore {
  overall: number;
  vegetation: number;
  water: number;
  weather: number;
  pest_risk: number;
  climate: number;
}

export interface Recommendation {
  id?: number;
  farm_id?: number;
  recommendation: string;
  reasoning: string;
  confidence: number;
  risk_level: string;
  data_summary?: Record<string, unknown>;
}

export interface ForecastDay {
  date: string;
  label: string;
  temp_max: number | null;
  temp_min: number | null;
  precipitation_mm: number | null;
  et0_mm: number | null;
}

export interface CropKnowledge {
  name: string;
  season: string;
  sowing_window: string;
  harvest_window: string;
  optimal_temperature_c: { min: number; max: number; critical_high: number };
  water_requirement_mm: number;
  growth_stages: { stage: string; days_after_sowing: string; water_sensitivity: string }[];
  common_pests: string[];
}

// ── Intelligence types ──────────────────────────────────────────────────────
export interface FarmAlert {
  severity: "info" | "warning" | "critical";
  category: string;
  title: string;
  description: string;
  evidence: string[];
  recommendation: string;
  icon: string;
}

export interface FarmIntelligence {
  farm: {
    id: number;
    name: string;
    district: string | null;
    province: string;
    area_acres: number | null;
    latitude: number;
    longitude: number;
    geometry: string | null;
  };
  crop: {
    name: string;
    season: string | null;
    growth_stage: string | null;
    sowing_date: string | null;
  } | null;
  weather: {
    temperature_c: number | null;
    humidity_pct: number | null;
    rainfall_mm: number | null;
    wind_speed_kmh: number | null;
    soil_moisture_m3m3: number | null;
    soil_temperature_c: number | null;
    et0_mm: number | null;
    source: string;
    observed_at: string;
  };
  forecast: {
    date: string;
    temp_max: number | null;
    temp_min: number | null;
    rain_mm: number | null;
    et0_mm: number | null;
  }[];
  satellite: {
    ndvi: number | null;
    ndvi_change: number | null;
    source: string | null;
    series?: { date: string; ndvi: number }[];
  };
  climate: {
    baseline_period: string | null;
    baseline_source: string | null;
    historical_mean_temp_c: number | null;
    temp_anomaly_c: number | null;
    historical_mean_humidity_pct: number | null;
    humidity_anomaly_pct: number | null;
    historical_total_precip_mm: number | null;
  } | null;
  soil: { moisture_m3m3: number | null; temperature_c: number | null; source: string };
  score: {
    value: number;
    status: "excellent" | "good" | "moderate" | "poor" | "critical";
    breakdown: { vegetation: number; water: number; weather: number; pest_risk: number; climate: number };
  };
  alerts: FarmAlert[];
  recommendation: {
    text: string;
    reasoning: string;
    confidence: number;
    risk_level: string;
  };
  provenance: {
    weather_source: string;
    weather_retrieved_at: string;
    satellite_source: string;
    climate_source?: string;
    score_engine: string;
    crop_knowledge: string;
  };
}

// ── Auth types ──────────────────────────────────────────────────────────────
export interface AuthUser {
  id: number;
  name: string;
  email: string;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
  user: AuthUser;
}

// ── Farms ────────────────────────────────────────────────────────────────────
export const api = {
  // Farms
  listFarms: () => request<Farm[]>("/farms/"),
  getFarm: (id: number) => request<Farm>(`/farms/${id}`),
  createFarm: (farm: {
    name: string;
    geometry_geojson?: string;
    area_acres?: number;
    district?: string;
    province?: string;
    latitude?: number;
    longitude?: number;
  }) => request<Farm>("/farms/", { method: "POST", body: JSON.stringify(farm) }),
  deleteFarm: (id: number) =>
    request<void>(`/farms/${id}`, { method: "DELETE" }),

  // Crops
  addCrop: (farmId: number, crop: { crop_name: string; sowing_date?: string; season?: string }) =>
    request<Crop>(`/farms/${farmId}/crops`, { method: "POST", body: JSON.stringify(crop) }),
  listCrops: (farmId: number) => request<Crop[]>(`/farms/${farmId}/crops`),

  // Weather
  getWeatherForecast: (farmId: number, days = 7) =>
    request<WeatherData>(`/weather/forecast/${farmId}?days=${days}`),
  getCurrentWeather: (farmId: number) =>
    request<WeatherData>(`/weather/current/${farmId}`),

  // Satellite
  getNdvi: (farmId: number, daysBack = 30) =>
    request<{ farm_id: number; source: string; data: unknown }>(
      `/satellite/ndvi/${farmId}?days_back=${daysBack}`
    ),
  getNdviSeries: (farmId: number, months = 12) =>
    request<{
      farm_id: number;
      source: string;
      ndvi: number | null;
      ndvi_change: number | null;
      series: { date: string; ndvi: number }[];
    }>(`/satellite/ndvi-series/${farmId}?months=${months}`),

  // Analytics — AgriCore
  getHealthScore: (farmId: number) =>
    request<{ farm_id: number; health: HealthScore; context: Record<string, unknown> }>(
      `/analytics/health/${farmId}`
    ),
  getRecommendation: (farmId: number) =>
    request<Recommendation>(`/analytics/recommendation/${farmId}`, { method: "POST" }),
  getRecommendationHistory: (farmId: number, limit = 5) =>
    request<Recommendation[]>(`/analytics/recommendations/history/${farmId}?limit=${limit}`),
  getForecastChart: (farmId: number, days = 7) =>
    request<{ farm_id: number; source: string; forecast: ForecastDay[] }>(
      `/analytics/forecast-chart/${farmId}?days=${days}`
    ),
  getCropKnowledge: () => request<CropKnowledge[]>("/analytics/crops/knowledge"),

  // Health
  healthCheck: () => request<{ status: string }>("/health").catch(() => ({ status: "offline" })),

  // Intelligence (Phase 3)
  getFarmIntelligence: (farmId: number) =>
    request<FarmIntelligence>(`/farms/${farmId}/intelligence`),

  // Auth (Phase 3)
  register: (data: { name: string; email: string; phone?: string; password: string }) =>
    request<AuthUser>("/auth/register", { method: "POST", body: JSON.stringify(data) }),
  login: (data: { email: string; password: string }) =>
    request<LoginResponse>("/auth/login", { method: "POST", body: JSON.stringify(data) }),
  getMe: () => request<AuthUser>("/auth/me"),
};
