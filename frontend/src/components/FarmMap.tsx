"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Layer, LayerGroup, LeafletMouseEvent, Map as LeafletMap } from "leaflet";

type LatLngTuple = [number, number];
type LeafletModule = typeof import("leaflet");

/**
 * Approximate polygon area in acres using the Shoelace formula
 * with a latitude-corrected conversion for small polygons.
 */
function calculatePolygonAreaAcres(points: LatLngTuple[]): number {
  if (points.length < 3) return 0;
  const n = points.length;
  let area = 0;
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    area += points[i][1] * points[j][0]; // lng_i * lat_j
    area -= points[j][1] * points[i][0]; // lng_j * lat_i
  }
  area = Math.abs(area) / 2;

  const avgLat = points.reduce((s, p) => s + p[0], 0) / n;
  const latRad = (avgLat * Math.PI) / 180;
  const mPerDegreeLat = 111_320;
  const mPerDegreeLng = 111_320 * Math.cos(latRad);
  const areaM2 = area * mPerDegreeLat * mPerDegreeLng;

  return Math.round((areaM2 / 4046.86) * 10) / 10;
}

/** Best-effort district lookup from coordinates via OSM Nominatim (free, no key). */
async function reverseGeocodeDistrict(lat: number, lng: number): Promise<string | undefined> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&zoom=10&lat=${lat}&lon=${lng}`
    );
    if (!res.ok) return undefined;
    const data = await res.json();
    const a = data.address ?? {};
    return a.state_district || a.county || a.city_district || a.city || a.state;
  } catch {
    return undefined;
  }
}

interface NominatimResult {
  display_name: string;
  lat: string;
  lon: string;
}

interface FarmMapProps {
  center?: LatLngTuple;
  zoom?: number;
  polygonGeoJson?: string | null;
  farmLabel?: string | null;
  /** Increment to clear an unsaved drawing from the map (after save/cancel). */
  resetSignal?: number;
  onPolygonDrawn?: (
    geojson: string,
    centroid: LatLngTuple,
    areaAcres: number,
    suggestedDistrict?: string
  ) => void;
}

const DEFAULT_CENTER: LatLngTuple = [32.5736, 74.0782]; // Gujrat, Punjab
const SAT_TILES =
  "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}";
const SAT_ATTR = "Tiles © Esri — Source: Esri, Maxar, Earthstar Geographics";
const LABEL_TILES =
  "https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}";
const OSM_TILES = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
const OSM_ATTR = "&copy; OpenStreetMap contributors";

export default function FarmMap({
  center,
  zoom = 16,
  polygonGeoJson,
  farmLabel,
  resetSignal,
  onPolygonDrawn,
}: FarmMapProps) {
  const mapRef = useRef<LeafletMap | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const leafletRef = useRef<LeafletModule | null>(null);
  const farmLayerRef = useRef<LayerGroup | null>(null);
  const previewLayerRef = useRef<LayerGroup | null>(null);
  const userLayerRef = useRef<LayerGroup | null>(null);
  const tileRefs = useRef<{ satellite?: Layer; labels?: Layer; street?: Layer }>({});
  const skipFirstCenter = useRef(true);
  const skipFirstReset = useRef(true);

  const [mapReady, setMapReady] = useState(false);
  const [basemap, setBasemap] = useState<"satellite" | "street">("satellite");
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawnPoints, setDrawnPoints] = useState<LatLngTuple[]>([]);
  const drawnPointsRef = useRef<LatLngTuple[]>([]);

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<NominatimResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [locating, setLocating] = useState(false);

  useEffect(() => {
    drawnPointsRef.current = drawnPoints;
  }, [drawnPoints]);

  // ── Load Leaflet CSS + custom cursor style (SSR-safe) ──────────────────────
  useEffect(() => {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
    document.head.appendChild(link);
    const style = document.createElement("style");
    style.textContent =
      ".leaflet-crosshair.leaflet-container{cursor:crosshair !important;}";
    document.head.appendChild(style);
    setMapReady(false);
    return () => {
      document.head.removeChild(link);
      document.head.removeChild(style);
    };
  }, []);

  // ── Initialize map with satellite basemap ─────────────────────────────────
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    let cancelled = false;
    (async () => {
      const L = (await import("leaflet")).default;
      if (cancelled || !containerRef.current) return;
      leafletRef.current = L;

      const map = L.map(containerRef.current, {
        zoomControl: true,
        doubleClickZoom: true,
      }).setView(center ?? DEFAULT_CENTER, zoom);

      tileRefs.current.satellite = L.tileLayer(SAT_TILES, {
        attribution: SAT_ATTR,
        maxZoom: 19,
      });
      tileRefs.current.labels = L.tileLayer(LABEL_TILES, { maxZoom: 19 });
      tileRefs.current.street = L.tileLayer(OSM_TILES, {
        attribution: OSM_ATTR,
        maxZoom: 19,
      });
      map.addLayer(tileRefs.current.satellite);
      map.addLayer(tileRefs.current.labels);

      L.control.scale({ imperial: true, metric: true, position: "bottomright" }).addTo(map);

      farmLayerRef.current = L.layerGroup().addTo(map);
      previewLayerRef.current = L.layerGroup().addTo(map);
      userLayerRef.current = L.layerGroup().addTo(map);

      mapRef.current = map;
      setMapReady(true);
    })();

    return () => {
      cancelled = true;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Basemap switching ─────────────────────────────────────────────────────
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;
    const { satellite, labels, street } = tileRefs.current;
    if (basemap === "satellite") {
      if (street && map.hasLayer(street)) map.removeLayer(street);
      if (satellite && !map.hasLayer(satellite)) map.addLayer(satellite);
      if (labels && !map.hasLayer(labels)) map.addLayer(labels);
    } else {
      if (satellite && map.hasLayer(satellite)) map.removeLayer(satellite);
      if (labels && map.hasLayer(labels)) map.removeLayer(labels);
      if (street && !map.hasLayer(street)) map.addLayer(street);
    }
  }, [basemap, mapReady]);

  // ── Fly to farm when selection changes (unless polygon fits itself) ───────
  useEffect(() => {
    if (!mapReady) return;
    if (skipFirstCenter.current) {
      skipFirstCenter.current = false;
      return;
    }
    if (center && !polygonGeoJson) {
      mapRef.current?.flyTo(center, zoom, { duration: 0.8 });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [center, mapReady]);

  // ── Render saved farm polygon + centroid marker, fit bounds ───────────────
  useEffect(() => {
    const L = leafletRef.current;
    const layer = farmLayerRef.current;
    if (!L || !layer || !mapReady) return;
    layer.clearLayers();
    if (!polygonGeoJson) return;
    try {
      const geo = JSON.parse(polygonGeoJson);
      const gj = L.geoJSON(geo, {
        style: { color: "#22c55e", weight: 3, fillOpacity: 0.2 },
      }).addTo(layer);

      const ring: number[][] = geo.coordinates?.[0] ?? [];
      if (ring.length > 1) {
        const lats = ring.map((c) => c[1]);
        const lngs = ring.map((c) => c[0]);
        const cl = lats.reduce((a, b) => a + b, 0) / lats.length;
        const cg = lngs.reduce((a, b) => a + b, 0) / lngs.length;
        L.marker([cl, cg]).addTo(layer).bindPopup(farmLabel ?? "Farm");
      }
      mapRef.current?.fitBounds(gj.getBounds(), { padding: [40, 40], maxZoom: 18 });
    } catch {
      /* ignore parse errors */
    }
  }, [polygonGeoJson, farmLabel, mapReady]);

  // ── Reset unsaved drawing when parent signals ─────────────────────────────
  useEffect(() => {
    if (skipFirstReset.current) {
      skipFirstReset.current = false;
      return;
    }
    setDrawnPoints([]);
    setIsDrawing(false);
  }, [resetSignal]);

  // ── Click to add polygon points (only while drawing) ──────────────────────
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady || !isDrawing) return;

    const onClick = (e: LeafletMouseEvent) => {
      setDrawnPoints((prev) => [...prev, [e.latlng.lat, e.latlng.lng]]);
    };
    map.on("click", onClick);
    map.doubleClickZoom.disable();
    return () => {
      map.off("click", onClick);
      map.doubleClickZoom.enable();
    };
  }, [isDrawing, mapReady]);

  // ── Live drawing preview: numbered vertices + dashed outline ──────────────
  useEffect(() => {
    const L = leafletRef.current;
    const layer = previewLayerRef.current;
    if (!L || !layer || !mapReady) return;
    layer.clearLayers();
    if (drawnPoints.length === 0) return;

    drawnPoints.forEach((p, i) => {
      L.circleMarker(p, {
        radius: 6,
        color: "#ffffff",
        weight: 2,
        fillColor: "#16a34a",
        fillOpacity: 1,
      })
        .addTo(layer)
        .bindTooltip(String(i + 1), {
          permanent: true,
          direction: "top",
          offset: [0, -6],
          className: "text-[10px]",
        });
    });
    if (drawnPoints.length >= 2) {
      L.polyline(drawnPoints, {
        color: "#16a34a",
        weight: 2.5,
        dashArray: "6 6",
      }).addTo(layer);
    }
    if (drawnPoints.length >= 3) {
      // Rubber band back to the first vertex
      L.polyline([drawnPoints[drawnPoints.length - 1], drawnPoints[0]], {
        color: "#16a34a",
        weight: 1.5,
        dashArray: "3 7",
        opacity: 0.7,
      }).addTo(layer);
    }
  }, [drawnPoints, mapReady]);

  // ── Drawing actions ───────────────────────────────────────────────────────
  const undoPoint = useCallback(() => {
    setDrawnPoints((prev) => prev.slice(0, -1));
  }, []);

  const cancelDrawing = useCallback(() => {
    setDrawnPoints([]);
    setIsDrawing(false);
  }, []);

  const finishPolygon = useCallback(async () => {
    const pts = drawnPointsRef.current;
    if (pts.length < 3) return;
    const L = leafletRef.current;

    const coords = pts.map(([lat, lng]) => [lng, lat]);
    coords.push(coords[0]);
    const geojson = JSON.stringify({ type: "Polygon", coordinates: [coords] });

    const lats = pts.map((p) => p[0]);
    const lngs = pts.map((p) => p[1]);
    const centroid: LatLngTuple = [
      lats.reduce((a, b) => a + b, 0) / lats.length,
      lngs.reduce((a, b) => a + b, 0) / lngs.length,
    ];
    const areaAcres = calculatePolygonAreaAcres(pts);
    const suggestedDistrict = await reverseGeocodeDistrict(centroid[0], centroid[1]);

    // Freeze the preview into a solid polygon while the user fills the form
    const layer = previewLayerRef.current;
    layer?.clearLayers();
    if (L && layer) {
      L.polygon(pts, { color: "#16a34a", weight: 3, fillOpacity: 0.2 }).addTo(layer);
    }

    onPolygonDrawn?.(geojson, centroid, areaAcres, suggestedDistrict);
    setIsDrawing(false);
  }, [onPolygonDrawn]);

  // ── Keyboard shortcuts while drawing: Enter finish, Z undo, Esc cancel ────
  useEffect(() => {
    if (!isDrawing) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return;
      if (e.key === "Enter") {
        e.preventDefault();
        finishPolygon();
      } else if (e.key === "z" || e.key === "Z" || e.key === "Backspace") {
        e.preventDefault();
        undoPoint();
      } else if (e.key === "Escape") {
        cancelDrawing();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isDrawing, finishPolygon, undoPoint, cancelDrawing]);

  // ── Location search (Nominatim, restricted to Pakistan) ───────────────────
  const runSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const q = searchQuery.trim();
    if (!q) return;
    setSearching(true);
    setSearchOpen(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&limit=5&countrycodes=pk&q=${encodeURIComponent(q)}`
      );
      const data = await res.json();
      setSearchResults(Array.isArray(data) ? data : []);
    } catch {
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  };

  const goToResult = (r: NominatimResult) => {
    mapRef.current?.flyTo([Number(r.lat), Number(r.lon)], 17, { duration: 1 });
    setSearchOpen(false);
    setSearchResults([]);
  };

  // ── GPS locate me ─────────────────────────────────────────────────────────
  const locateMe = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by this browser.");
      return;
    }
    const L = leafletRef.current;
    setLocating(true);
    userLayerRef.current?.clearLayers();
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const c: LatLngTuple = [pos.coords.latitude, pos.coords.longitude];
        mapRef.current?.flyTo(c, 17, { duration: 1 });
        if (L && mapRef.current) {
          L.circle(c, {
            radius: Math.max(pos.coords.accuracy, 30),
            color: "#2563eb",
            weight: 1,
            fillOpacity: 0.08,
          }).addTo(userLayerRef.current!);
          L.circleMarker(c, {
            radius: 8,
            color: "#ffffff",
            weight: 2,
            fillColor: "#2563eb",
            fillOpacity: 1,
          })
            .addTo(userLayerRef.current!)
            .bindPopup(`Your location (±${Math.round(pos.coords.accuracy)} m)`)
            .openPopup();
        }
        setLocating(false);
      },
      () => {
        setLocating(false);
        alert("Could not get your location. Check browser permissions.");
      },
      { enableHighAccuracy: true, timeout: 10_000 }
    );
  };

  const liveArea = drawnPoints.length >= 3 ? calculatePolygonAreaAcres(drawnPoints) : 0;
  const canDraw = Boolean(onPolygonDrawn);

  return (
    <div className="relative h-full w-full">
      {/* ── Left control cluster: draw + basemap + locate ─────────────────── */}
      <div className="absolute top-3 left-3 z-[1000] flex flex-col gap-2">
        {canDraw &&
          (!isDrawing ? (
            <button
              onClick={() => {
                setDrawnPoints([]);
                setIsDrawing(true);
              }}
              className="rounded-lg bg-green-600 px-3 py-1.5 text-sm font-medium text-white shadow hover:bg-green-700"
            >
              ✏️ Draw Farm
            </button>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={finishPolygon}
                disabled={drawnPoints.length < 3}
                className="rounded-lg bg-green-600 px-3 py-1.5 text-sm font-medium text-white shadow hover:bg-green-700 disabled:opacity-40"
              >
                ✓ Finish ({drawnPoints.length})
              </button>
              <button
                onClick={undoPoint}
                disabled={drawnPoints.length === 0}
                className="rounded-lg bg-white px-2.5 py-1.5 text-sm font-medium text-gray-700 shadow hover:bg-gray-50 disabled:opacity-40"
                title="Undo last point (Z)"
              >
                ↩ Undo
              </button>
              <button
                onClick={cancelDrawing}
                className="rounded-lg bg-red-500 px-2.5 py-1.5 text-sm font-medium text-white shadow hover:bg-red-600"
                title="Cancel (Esc)"
              >
                ✕
              </button>
            </div>
          ))}

        {/* Basemap toggle */}
        <div className="flex overflow-hidden rounded-lg bg-white shadow">
          <button
            onClick={() => setBasemap("satellite")}
            className={`px-2.5 py-1 text-xs font-medium ${
              basemap === "satellite"
                ? "bg-green-600 text-white"
                : "text-gray-600 hover:bg-gray-50"
            }`}
          >
            🛰 Satellite
          </button>
          <button
            onClick={() => setBasemap("street")}
            className={`px-2.5 py-1 text-xs font-medium ${
              basemap === "street"
                ? "bg-green-600 text-white"
                : "text-gray-600 hover:bg-gray-50"
            }`}
          >
            🗺 Street
          </button>
        </div>

        <button
          onClick={locateMe}
          disabled={locating}
          className="w-fit rounded-lg bg-white px-2.5 py-1.5 text-xs font-medium text-blue-700 shadow hover:bg-blue-50 disabled:opacity-50"
          title="Center the map on your current position"
        >
          {locating ? "Locating…" : "📍 Locate me"}
        </button>
      </div>

      {/* ── Location search (top-right) ──────────────────────────────────── */}
      <form
        onSubmit={runSearch}
        className="absolute top-3 right-3 z-[1000] w-64"
      >
        <div className="flex overflow-hidden rounded-lg bg-white shadow">
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setSearchResults.length > 0 && setSearchOpen(true)}
            placeholder="Search location in Pakistan…"
            className="min-w-0 flex-1 px-3 py-1.5 text-sm focus:outline-none"
          />
          <button
            type="submit"
            disabled={searching}
            className="bg-green-600 px-3 text-sm text-white hover:bg-green-700 disabled:opacity-50"
          >
            {searching ? "…" : "🔍"}
          </button>
        </div>
        {searchOpen && (
          <div className="mt-1 max-h-56 overflow-y-auto rounded-lg bg-white py-1 shadow-lg">
            {searchResults.length === 0 ? (
              <p className="px-3 py-2 text-xs text-gray-400">
                {searching ? "Searching…" : "No places found"}
              </p>
            ) : (
              searchResults.map((r, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => goToResult(r)}
                  className="block w-full truncate px-3 py-2 text-left text-xs text-gray-700 hover:bg-green-50"
                  title={r.display_name}
                >
                  📍 {r.display_name}
                </button>
              ))
            )}
          </div>
        )}
      </form>

      {/* ── Bottom-left: drawing hints + live measurements ───────────────── */}
      {isDrawing && (
        <div className="absolute bottom-3 left-3 z-[1000] max-w-md rounded-lg bg-white/95 px-3 py-2 text-xs text-gray-700 shadow backdrop-blur">
          <p>
            Click the map to add boundary points — draw over the satellite
            imagery of your field.{" "}
            <span className="text-gray-400">
              Z = undo · Enter = finish · Esc = cancel
            </span>
          </p>
          {drawnPoints.length > 0 && (
            <p className="mt-1 flex items-center gap-2">
              <span className="rounded bg-green-100 px-1.5 py-0.5 font-semibold text-green-700">
                {drawnPoints.length} point{drawnPoints.length === 1 ? "" : "s"}
              </span>
              {drawnPoints.length >= 3 && (
                <span className="rounded bg-emerald-100 px-1.5 py-0.5 font-semibold text-emerald-700">
                  ≈ {liveArea.toLocaleString()} acres ({(liveArea * 0.404686).toFixed(1)} ha)
                </span>
              )}
            </p>
          )}
        </div>
      )}

      {/* ── Unsaved polygon chip (after finish, before save) ──────────────── */}
      {!isDrawing && drawnPoints.length > 0 && canDraw && (
        <div className="absolute bottom-3 left-3 z-[1000] flex items-center gap-2 rounded-lg bg-white/95 px-3 py-2 text-xs shadow backdrop-blur">
          <span className="font-medium text-green-700">
            ✓ Polygon ready — fill the form to save
          </span>
          <span className="rounded bg-emerald-100 px-1.5 py-0.5 font-semibold text-emerald-700">
            {liveArea.toLocaleString()} acres
          </span>
          <button
            onClick={cancelDrawing}
            className="text-gray-400 hover:text-red-500"
            title="Discard polygon"
          >
            ✕ Discard
          </button>
        </div>
      )}

      {/* Map container */}
      <div
        ref={containerRef}
        className={`h-full w-full ${isDrawing ? "leaflet-crosshair" : ""}`}
      />
    </div>
  );
}
