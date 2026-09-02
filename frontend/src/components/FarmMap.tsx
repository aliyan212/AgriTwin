"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Layer, LayerGroup, LeafletMouseEvent, Map as LeafletMap } from "leaflet";
import "leaflet/dist/leaflet.css";
import Icon from "@/components/Icon";

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
    area += points[i][1] * points[j][0];
    area -= points[j][1] * points[i][0];
  }
  area = Math.abs(area) / 2;

  const avgLat = points.reduce((s, p) => s + p[0], 0) / n;
  const latRad = (avgLat * Math.PI) / 180;
  const mPerDegreeLat = 111_320;
  const mPerDegreeLng = 111_320 * Math.cos(latRad);
  const areaM2 = area * mPerDegreeLat * mPerDegreeLng;

  return Math.round((areaM2 / 4046.86) * 10) / 10;
}

/** Best-effort district lookup from coordinates via OSM Nominatim. */
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
  resetSignal?: number;
  onPolygonDrawn?: (
    geojson: string,
    centroid: LatLngTuple,
    areaAcres: number,
    suggestedDistrict?: string
  ) => void;
}

const DEFAULT_CENTER: LatLngTuple = [32.5736, 74.0782]; // Gujrat, Punjab

// High-resolution Satellite Hybrid with built-in English & Urdu roads, canals, towns & place labels
const GOOGLE_HYBRID = "https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}";
const GOOGLE_STREET = "https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}";

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
  const tileRefs = useRef<{ satellite?: Layer; street?: Layer }>({});
  const skipFirstCenter = useRef(true);
  const skipFirstReset = useRef(true);

  const [mapReady, setMapReady] = useState(false);
  const [basemap, setBasemap] = useState<"satellite" | "street">("satellite");
  const [isDrawing, setIsDrawing] = useState(false);
  const [isFinishing, setIsFinishing] = useState(false);
  const [drawnPoints, setDrawnPoints] = useState<LatLngTuple[]>([]);
  const drawnPointsRef = useRef<LatLngTuple[]>([]);

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<NominatimResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [locating, setLocating] = useState(false);

  useEffect(() => {
    drawnPointsRef.current = drawnPoints;
  }, [drawnPoints]);

  // ── Initialize Leaflet Map with full-bleed dimensions and tile buffering ──
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    let cancelled = false;

    (async () => {
      try {
        const L = (await import("leaflet")).default;
        if (cancelled || !containerRef.current) return;
        leafletRef.current = L;

        // Force container to have explicit dimensions if not already set
        const el = containerRef.current;
        el.style.position = "absolute";
        el.style.top = "0";
        el.style.left = "0";
        el.style.width = "100%";
        el.style.height = "100%";

        // Initialize map instance
        const map = L.map(el, {
          zoomControl: false,
          attributionControl: false,
          scrollWheelZoom: false,
          doubleClickZoom: false,
          fadeAnimation: false,
          zoomAnimation: true,
          trackResize: true,
        }).setView(center ?? DEFAULT_CENTER, zoom);

        // Hybrid satellite tile layer with large buffer for seamless full-bleed rendering
        tileRefs.current.satellite = L.tileLayer(GOOGLE_HYBRID, {
          maxZoom: 20,
          subdomains: ["mt0", "mt1", "mt2", "mt3"],
          tileSize: 256,
          keepBuffer: 12,
          updateWhenIdle: false,
          updateWhenZooming: true,
        });

        tileRefs.current.street = L.tileLayer(GOOGLE_STREET, {
          maxZoom: 20,
          subdomains: ["mt0", "mt1", "mt2", "mt3"],
          tileSize: 256,
          keepBuffer: 12,
          updateWhenIdle: false,
          updateWhenZooming: true,
        });

        map.addLayer(tileRefs.current.satellite);

        farmLayerRef.current = L.layerGroup().addTo(map);
        previewLayerRef.current = L.layerGroup().addTo(map);
        userLayerRef.current = L.layerGroup().addTo(map);

        mapRef.current = map;
        setMapReady(true);

        // Repeated invalidation to fill the viewport as the parent container layout settles
        map.whenReady(() => {
          map.invalidateSize(true);
        });

        [50, 150, 300, 600, 1200].forEach((delay) => {
          setTimeout(() => {
            if (!cancelled && mapRef.current) {
              mapRef.current.invalidateSize(true);
            }
          }, delay);
        });
      } catch (err) {
        console.error("Leaflet initialization failed", err);
      }
    })();

    // ResizeObserver ensures 100% full-bleed coverage upon container resize
    const ro = new ResizeObserver(() => {
      if (mapRef.current) {
        try {
          mapRef.current.invalidateSize(true);
        } catch {
          /* ignore */
        }
      }
    });

    if (containerRef.current) {
      ro.observe(containerRef.current);
    }

    return () => {
      cancelled = true;
      ro.disconnect();
      if (mapRef.current) {
        try {
          mapRef.current.remove();
        } catch {
          /* ignore */
        }
        mapRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Basemap switching ─────────────────────────────────────────────────────
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;
    const { satellite, street } = tileRefs.current;

    try {
      if (basemap === "satellite") {
        if (street && map.hasLayer(street)) map.removeLayer(street);
        if (satellite && !map.hasLayer(satellite)) map.addLayer(satellite);
      } else {
        if (satellite && map.hasLayer(satellite)) map.removeLayer(satellite);
        if (street && !map.hasLayer(street)) map.addLayer(street);
      }
      map.invalidateSize(true);
    } catch (e) {
      console.error("Error switching basemap", e);
    }
  }, [basemap, mapReady]);

  // ── Fly to farm when selection changes ────────────────────────────────────
  useEffect(() => {
    if (!mapReady) return;
    if (skipFirstCenter.current) {
      skipFirstCenter.current = false;
      return;
    }
    if (center && !polygonGeoJson) {
      try {
        mapRef.current?.flyTo(center, zoom, { duration: 0.8 });
      } catch {
        /* ignore */
      }
    }
    mapRef.current?.invalidateSize(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [center, mapReady]);

  // ── Render saved farm polygon + marker ────────────────────────────────────
  useEffect(() => {
    const L = leafletRef.current;
    const layer = farmLayerRef.current;
    if (!L || !layer || !mapReady) return;
    try {
      layer.clearLayers();
      if (!polygonGeoJson) return;

      const geo = JSON.parse(polygonGeoJson);
      const gj = L.geoJSON(geo, {
        style: { color: "#34d399", weight: 3.5, fillOpacity: 0.3 },
      }).addTo(layer);

      const ring: number[][] = geo.coordinates?.[0] ?? [];
      if (ring.length > 1) {
        const lats = ring.map((c) => c[1]);
        const lngs = ring.map((c) => c[0]);
        const cl = lats.reduce((a, b) => a + b, 0) / lats.length;
        const cg = lngs.reduce((a, b) => a + b, 0) / lngs.length;

        L.circleMarker([cl, cg], {
          radius: 7,
          color: "#ffffff",
          fillColor: "#10b981",
          fillOpacity: 1,
          weight: 2,
        })
          .addTo(layer)
          .bindPopup(`<b>${farmLabel ?? "Farm"}</b><br/>${calculatePolygonAreaAcres(ring.map(c => [c[1], c[0]]))} acres`);
      }
      mapRef.current?.fitBounds(gj.getBounds(), { padding: [50, 50], maxZoom: 18 });
      mapRef.current?.invalidateSize(true);
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
    try {
      previewLayerRef.current?.clearLayers();
    } catch {
      /* ignore */
    }
  }, [resetSignal]);

  // ── Drawing click handler ─────────────────────────────────────────────────
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;

    const onClick = (e: LeafletMouseEvent) => {
      if (!isDrawing) return;
      setDrawnPoints((prev) => [...prev, [e.latlng.lat, e.latlng.lng]]);
    };

    map.on("click", onClick);
    return () => {
      map.off("click", onClick);
    };
  }, [isDrawing, mapReady]);

  // ── Live drawing preview: vertices + perimeter line ───────────────────────
  useEffect(() => {
    const L = leafletRef.current;
    const layer = previewLayerRef.current;
    if (!L || !layer || !mapReady) return;

    try {
      layer.clearLayers();
      if (drawnPoints.length === 0) return;

      drawnPoints.forEach((p) => {
        L.circleMarker(p, {
          radius: 6,
          color: "#ffffff",
          weight: 2,
          fillColor: "#10b981",
          fillOpacity: 1,
        }).addTo(layer);
      });

      if (drawnPoints.length >= 2) {
        L.polyline(drawnPoints, {
          color: "#34d399",
          weight: 2.5,
          dashArray: "6 6",
        }).addTo(layer);
      }

      if (drawnPoints.length >= 3) {
        L.polyline([drawnPoints[drawnPoints.length - 1], drawnPoints[0]], {
          color: "#34d399",
          weight: 1.5,
          dashArray: "3 6",
          opacity: 0.8,
        }).addTo(layer);
      }
    } catch (e) {
      console.error("Error updating preview layer", e);
    }
  }, [drawnPoints, mapReady]);

  // ── Drawing actions ───────────────────────────────────────────────────────
  const undoPoint = useCallback(() => {
    setDrawnPoints((prev) => prev.slice(0, -1));
  }, []);

  const cancelDrawing = useCallback(() => {
    setDrawnPoints([]);
    setIsDrawing(false);
    try {
      previewLayerRef.current?.clearLayers();
    } catch {
      /* ignore */
    }
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

    const layer = previewLayerRef.current;
    if (L && layer) {
      try {
        layer.clearLayers();
        L.polygon(pts, { color: "#34d399", weight: 3, fillOpacity: 0.25 }).addTo(layer);
      } catch {
        /* ignore */
      }
    }

    onPolygonDrawn?.(geojson, centroid, areaAcres, suggestedDistrict);
    setIsDrawing(false);
  }, [onPolygonDrawn]);

  // ── Keyboard shortcuts ────────────────────────────────────────────────────
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

  // ── Location search ───────────────────────────────────────────────────────
  const runSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const q = searchQuery.trim();
    if (!q) return;
    setSearching(true);
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
    try {
      mapRef.current?.flyTo([Number(r.lat), Number(r.lon)], 17, { duration: 1 });
    } catch {
      /* ignore */
    }
    setShowSearch(false);
    setSearchResults([]);
  };

  // ── GPS Locate ────────────────────────────────────────────────────────────
  const locateMe = () => {
    if (!navigator.geolocation) return;
    const L = leafletRef.current;
    setLocating(true);
    try {
      userLayerRef.current?.clearLayers();
    } catch {
      /* ignore */
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const c: LatLngTuple = [pos.coords.latitude, pos.coords.longitude];
        try {
          mapRef.current?.flyTo(c, 17, { duration: 1 });
          if (L && mapRef.current && userLayerRef.current) {
            L.circleMarker(c, {
              radius: 8,
              color: "#ffffff",
              weight: 2,
              fillColor: "#10b981",
              fillOpacity: 1,
            }).addTo(userLayerRef.current);
          }
        } catch {
          /* ignore */
        }
        setLocating(false);
      },
      () => setLocating(false),
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  // ── Custom Zoom Actions ───────────────────────────────────────────────────
  const zoomIn = () => {
    try {
      mapRef.current?.zoomIn();
    } catch {
      /* ignore */
    }
  };

  const zoomOut = () => {
    try {
      mapRef.current?.zoomOut();
    } catch {
      /* ignore */
    }
  };

  const liveArea = drawnPoints.length >= 3 ? calculatePolygonAreaAcres(drawnPoints) : 0;
  const canDraw = Boolean(onPolygonDrawn);

  return (
    <div className="relative h-full w-full select-none overflow-hidden rounded-2xl bg-abyss min-h-[420px]">
      {/* ── Leaflet Map Canvas Container (Absolute Full-Bleed 100%) ────────── */}
      <div className={`absolute inset-0 z-0 ${isDrawing ? "cursor-crosshair [&_.leaflet-interactive]:cursor-crosshair [&_.leaflet-container]:!cursor-crosshair" : ""}`}>
        <div
          ref={containerRef}
          className="absolute inset-0 h-full w-full bg-abyss"
          style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, width: "100%", height: "100%" }}
        />
      </div>

      {/* ── Unified Floating Glass Command Bar (Top) ──────────────────────── */}
      <div className="absolute top-3 inset-x-3 z-[1000] flex flex-wrap items-center justify-between gap-2 pointer-events-none">
        {/* Left: Draw Action Controls */}
        <div className="pointer-events-auto flex items-center gap-1.5 rounded-xl border border-ink/12 bg-panel/95 p-1 shadow-2xl backdrop-blur-xl">
          {canDraw && !isDrawing && (
            <button
              onClick={() => {
                setDrawnPoints([]);
                setIsDrawing(true);
              }}
              className="flex items-center gap-1.5 rounded-lg bg-gradient-to-b from-emerald-400 to-emerald-600 px-3 py-1.5 text-xs font-semibold text-abyss shadow-md hover:scale-[1.02] transition-all"
            >
              <Icon name="pencil" size={13} strokeWidth={2.4} />
              Draw Field Boundary
            </button>
          )}

          {isDrawing && (
            <div className="flex items-center gap-1">
              <button
                onClick={async () => {
                  setIsFinishing(true);
                  try { await finishPolygon(); } finally { setIsFinishing(false); }
                }}
                disabled={drawnPoints.length < 3 || isFinishing}
                className="flex items-center gap-1.5 rounded-lg bg-gradient-to-b from-emerald-400 to-emerald-600 px-3 py-1.5 text-xs font-semibold text-abyss shadow-md transition-all disabled:opacity-40"
              >
                {isFinishing ? (
                  <span className="h-3 w-3 rounded-full border-2 border-abyss border-r-transparent animate-spin" />
                ) : (
                  <Icon name="check" size={13} strokeWidth={2.5} />
                )}
                {isFinishing ? "Processing..." : `Finish (${drawnPoints.length} pts)`}
              </button>
              <button
                onClick={undoPoint}
                disabled={drawnPoints.length === 0}
                className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium text-mist hover:text-ink hover:bg-ink/8 disabled:opacity-40 transition-colors"
                title="Undo point (Z)"
              >
                <Icon name="undo" size={12} />
                Undo
              </button>
              <button
                onClick={cancelDrawing}
                className="flex items-center rounded-lg bg-rose-500/80 px-2.5 py-1.5 text-xs font-medium text-white hover:bg-rose-500 transition-colors"
                title="Cancel (Esc)"
              >
                <Icon name="x" size={12} />
              </button>
            </div>
          )}
        </div>

        {/* Right: Basemap + Search + Locate + Zoom Controls */}
        <div className="pointer-events-auto flex items-center gap-1.5 rounded-xl border border-ink/12 bg-panel/95 p-1 shadow-2xl backdrop-blur-xl">
          {/* Basemap Toggle */}
          <div className="flex rounded-lg bg-ink/6 p-0.5">
            <button
              onClick={() => setBasemap("satellite")}
              className={`rounded-md px-2.5 py-1 text-xs font-medium transition-all ${basemap === "satellite"
                ? "bg-brand/20 text-brand font-semibold shadow-sm"
                : "text-mist hover:text-ink"
                }`}
            >
              Satellite
            </button>
            <button
              onClick={() => setBasemap("street")}
              className={`rounded-md px-2.5 py-1 text-xs font-medium transition-all ${basemap === "street"
                ? "bg-brand/20 text-brand font-semibold shadow-sm"
                : "text-mist hover:text-ink"
                }`}
            >
              Street
            </button>
          </div>

          <div className="h-4 w-px bg-ink/10" />

          {/* Search trigger */}
          <button
            onClick={() => setShowSearch((v) => !v)}
            className={`flex h-7 w-7 items-center justify-center rounded-lg text-mist hover:text-ink hover:bg-ink/8 transition-colors ${showSearch ? "bg-ink/10 text-brand" : ""}`}
            title="Search location"
          >
            <Icon name="search" size={13} />
          </button>

          {/* GPS Locate */}
          <button
            onClick={locateMe}
            disabled={locating}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-sky-300 hover:text-sky-200 hover:bg-ink/8 transition-colors disabled:opacity-50"
            title="Locate my position"
          >
            <Icon name="crosshair" size={13} />
          </button>

          <div className="h-4 w-px bg-ink/10" />

          {/* Zoom Buttons */}
          <div className="flex items-center">
            <button
              onClick={zoomIn}
              className="flex h-7 w-7 items-center justify-center rounded-lg text-mist hover:text-ink hover:bg-ink/8 transition-colors"
              title="Zoom In"
            >
              <Icon name="plus" size={14} />
            </button>
            <button
              onClick={zoomOut}
              className="flex h-7 w-7 items-center justify-center rounded-lg text-mist hover:text-ink hover:bg-ink/8 transition-colors"
              title="Zoom Out"
            >
              <Icon name="minus" size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* ── Compact Search Drawer (Opens when search icon clicked) ─────────── */}
      {
        showSearch && (
          <div className="absolute top-14 right-3 z-[1001] w-72 rounded-xl border border-ink/12 bg-panel/95 p-2 shadow-2xl backdrop-blur-xl">
            <form onSubmit={runSearch} className="flex gap-1.5">
              <input
                autoFocus
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search Punjab city or farm…"
                className="input-theme py-1 px-2.5 text-xs flex-1"
              />
              <button
                type="submit"
                disabled={searching}
                className="rounded-lg bg-brand/20 px-2.5 text-brand hover:bg-brand/30 transition-colors text-xs"
              >
                {searching ? "…" : "Go"}
              </button>
            </form>

            {searchResults.length > 0 && (
              <div className="mt-2 max-h-48 overflow-y-auto space-y-1">
                {searchResults.map((r, i) => (
                  <button
                    key={i}
                    onClick={() => goToResult(r)}
                    className="w-full rounded-lg px-2 py-1.5 text-left text-xs text-mist hover:bg-ink/8 hover:text-ink transition-colors truncate block"
                  >
                    {r.display_name}
                  </button>
                ))}
              </div>
            )}
          </div>
        )
      }

      {/* ── Drawing Mode Instruction Banner (Bottom) ───────────────────────── */}
      {
        isDrawing && (
          <div className="absolute bottom-3 inset-x-3 z-[1000] flex items-center justify-between rounded-xl border border-brand/30 bg-panel/95 px-4 py-2 text-xs shadow-2xl backdrop-blur-xl">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-brand animate-ping" />
              <span className="font-medium text-ink">
                Click on satellite map to plot boundary points.
              </span>
            </div>

            <div className="flex items-center gap-3">
              {drawnPoints.length >= 3 && (
                <span className="font-mono text-xs font-bold text-brand">
                  ≈ {liveArea.toLocaleString()} acres
                </span>
              )}
              <span className="text-[11px] text-dim hidden sm:inline font-mono">
                Press <kbd className="rounded bg-ink/10 px-1 text-ink">Enter</kbd> to finish &middot; <kbd className="rounded bg-ink/10 px-1 text-ink">Esc</kbd> to cancel
              </span>
            </div>
          </div>
        )
      }
    </div >
  );
}
