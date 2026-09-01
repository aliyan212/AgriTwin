"use client";

import { useEffect, useRef, useState } from "react";
import type { Map as LeafletMap } from "leaflet";

/**
 * Approximate polygon area in acres using the Shoelace formula
 * with a latitude-corrected conversion for small polygons.
 * Input: array of [lat, lng] points.
 */
function calculatePolygonAreaAcres(points: [number, number][]): number {
  if (points.length < 3) return 0;
  const n = points.length;
  // Shoelace formula in degrees
  let area = 0;
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    area += points[i][1] * points[j][0]; // lng_i * lat_j
    area -= points[j][1] * points[i][0]; // lng_j * lat_i
  }
  area = Math.abs(area) / 2;

  // Convert from degrees^2 to m^2 using average latitude correction
  const avgLat = points.reduce((s, p) => s + p[0], 0) / n;
  const latRad = (avgLat * Math.PI) / 180;
  const mPerDegreeLat = 111_320;
  const mPerDegreeLng = 111_320 * Math.cos(latRad);
  const areaM2 = area * mPerDegreeLat * mPerDegreeLng;

  // m^2 to acres (1 acre = 4046.86 m^2)
  return Math.round((areaM2 / 4046.86) * 10) / 10;
}

interface FarmMapProps {
  center?: [number, number];
  zoom?: number;
  polygonGeoJson?: string | null;
  onPolygonDrawn?: (geojson: string, centroid: [number, number], areaAcres: number) => void;
}

export default function FarmMap({
  center = [32.5736, 74.0782], // Gujrat, Punjab
  zoom = 13,
  polygonGeoJson,
  onPolygonDrawn,
}: FarmMapProps) {
  const mapRef = useRef<LeafletMap | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawnPoints, setDrawnPoints] = useState<[number, number][]>([]);
  const [leafletReady, setLeafletReady] = useState(false);

  // Load Leaflet + CSS dynamically (SSR-safe)
  useEffect(() => {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
    document.head.appendChild(link);
    setLeafletReady(true);
    return () => {
      document.head.removeChild(link);
    };
  }, []);

  // Initialize map
  useEffect(() => {
    if (!leafletReady || !mapContainerRef.current || mapRef.current) return;

    let cancelled = false;
    (async () => {
      const L = (await import("leaflet")).default;
      if (cancelled || !mapContainerRef.current) return;

      const map = L.map(mapContainerRef.current).setView(center, zoom);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "&copy; OpenStreetMap contributors",
      }).addTo(map);

      mapRef.current = map;
    })();

    return () => {
      cancelled = true;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [leafletReady]);

  // Handle click to add polygon point
  useEffect(() => {
    if (!isDrawing || !mapRef.current) return;
    const L = require("leaflet");
    const map = mapRef.current;

    const onClick = (e: { latlng: { lat: number; lng: number } }) => {
      setDrawnPoints((prev) => [...prev, [e.latlng.lat, e.latlng.lng]]);
    };

    map.on("click", onClick);
    return () => {
      map.off("click", onClick);
    };
  }, [isDrawing]);

  // Render existing polygon from GeoJSON
  useEffect(() => {
    if (!mapRef.current || !polygonGeoJson) return;
    (async () => {
      const L = (await import("leaflet")).default;
      try {
        const geo = JSON.parse(polygonGeoJson);
        L.geoJSON(geo, { style: { color: "#16a34a", weight: 3, fillOpacity: 0.15 } }).addTo(
          mapRef.current!
        );
      } catch {
        /* ignore parse errors */
      }
    })();
  }, [polygonGeoJson]);

  const finishPolygon = async () => {
    if (drawnPoints.length < 3) return;
    const L = (await import("leaflet")).default;

    // Close the polygon
    const coords = drawnPoints.map(([lat, lng]) => [lng, lat]);
    coords.push(coords[0]);

    const geojson = JSON.stringify({
      type: "Polygon",
      coordinates: [coords],
    });

    // Calculate centroid
    const lats = drawnPoints.map((p) => p[0]);
    const lngs = drawnPoints.map((p) => p[1]);
    const centroidLat = lats.reduce((a, b) => a + b, 0) / lats.length;
    const centroidLng = lngs.reduce((a, b) => a + b, 0) / lngs.length;

    // Calculate approximate area in acres using the Shoelace formula on lat/lng
    const areaAcres = calculatePolygonAreaAcres(drawnPoints);

    // Draw the polygon on the map
    L.polygon(
      drawnPoints,
      { color: "#16a34a", weight: 3, fillOpacity: 0.15 }
    ).addTo(mapRef.current!);

    onPolygonDrawn?.(geojson, [centroidLat, centroidLng], areaAcres);
    setIsDrawing(false);
    setDrawnPoints([]);
  };

  const cancelDrawing = () => {
    setIsDrawing(false);
    setDrawnPoints([]);
  };

  return (
    <div className="relative h-full w-full">
      {/* Drawing controls */}
      <div className="absolute top-3 left-3 z-[1000] flex gap-2">
        {!isDrawing ? (
          <button
            onClick={() => setIsDrawing(true)}
            className="rounded-lg bg-green-600 px-3 py-1.5 text-sm font-medium text-white shadow hover:bg-green-700"
          >
            ✏️ Draw Farm
          </button>
        ) : (
          <>
            <button
              onClick={finishPolygon}
              disabled={drawnPoints.length < 3}
              className="rounded-lg bg-green-600 px-3 py-1.5 text-sm font-medium text-white shadow hover:bg-green-700 disabled:opacity-40"
            >
              ✓ Finish ({drawnPoints.length} pts)
            </button>
            <button
              onClick={cancelDrawing}
              className="rounded-lg bg-red-500 px-3 py-1.5 text-sm font-medium text-white shadow hover:bg-red-600"
            >
              ✕ Cancel
            </button>
          </>
        )}
      </div>

      {isDrawing && (
        <div className="absolute bottom-3 left-3 z-[1000] rounded-lg bg-white/90 px-3 py-1.5 text-xs text-gray-700 shadow backdrop-blur">
          Click on the map to add polygon points ({drawnPoints.length} added,
          need 3+)
        </div>
      )}

      {/* Map container */}
      <div ref={mapContainerRef} className="h-full w-full" />
    </div>
  );
}
