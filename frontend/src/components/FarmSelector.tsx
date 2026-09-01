"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { Farm } from "@/lib/api";

interface FarmSelectorProps {
  farms: Farm[];
  selected: Farm | null;
  onSelect: (farm: Farm | null) => void;
}

/**
 * Location-aware farm picker: searchable, grouped by district,
 * showing area + coordinates for each farm.
 */
export default function FarmSelector({ farms, selected, onSelect }: FarmSelectorProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const rootRef = useRef<HTMLDivElement>(null);

  // Close on outside click / Escape
  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return farms;
    return farms.filter(
      (f) =>
        f.name.toLowerCase().includes(q) ||
        (f.district ?? "").toLowerCase().includes(q) ||
        f.province.toLowerCase().includes(q)
    );
  }, [farms, query]);

  const grouped = useMemo(() => {
    const m = new Map<string, Farm[]>();
    for (const f of filtered) {
      const key = f.district?.trim() || f.province || "Other";
      const list = m.get(key) ?? [];
      list.push(f);
      m.set(key, list);
    }
    return [...m.entries()];
  }, [filtered]);

  return (
    <div ref={rootRef} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex min-w-[190px] items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm shadow-sm hover:border-green-400"
      >
        <span className="text-base leading-none">🌾</span>
        <span className="flex-1 truncate text-left font-medium text-gray-800">
          {selected ? selected.name : "Select a farm"}
        </span>
        {selected && (
          <span
            role="button"
            tabIndex={0}
            onClick={(e) => {
              e.stopPropagation();
              onSelect(null);
              setOpen(false);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.stopPropagation();
                onSelect(null);
                setOpen(false);
              }
            }}
            className="cursor-pointer px-1 text-xs text-gray-400 hover:text-red-500"
            title="Clear selection"
          >
            ✕
          </span>
        )}
        <span className={`text-gray-400 transition-transform ${open ? "rotate-180" : ""}`}>▾</span>
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-1 w-80 rounded-xl border border-gray-200 bg-white shadow-lg">
          <div className="border-b border-gray-100 p-2">
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name or district…"
              className="w-full rounded-lg border border-gray-200 px-3 py-1.5 text-sm focus:border-green-500 focus:outline-none"
            />
          </div>

          <div className="max-h-72 overflow-y-auto p-1">
            {grouped.length === 0 && (
              <p className="px-3 py-4 text-center text-xs text-gray-400">
                {farms.length === 0
                  ? "No farms yet — draw one on the map"
                  : "No farms match your search"}
              </p>
            )}
            {grouped.map(([district, list]) => (
              <div key={district} className="mb-1">
                <p className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-gray-400">
                  📍 {district} · {list.length}
                </p>
                {list.map((f) => {
                  const active = selected?.id === f.id;
                  return (
                    <button
                      key={f.id}
                      onClick={() => {
                        onSelect(f);
                        setOpen(false);
                        setQuery("");
                      }}
                      className={`w-full rounded-lg px-2 py-2 text-left transition-colors ${
                        active ? "bg-green-50" : "hover:bg-gray-50"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span
                          className={`truncate text-sm font-medium ${
                            active ? "text-green-700" : "text-gray-800"
                          }`}
                        >
                          {f.name}
                        </span>
                        {f.area_acres != null && (
                          <span className="whitespace-nowrap rounded bg-gray-100 px-1.5 py-0.5 text-[10px] font-semibold text-gray-600">
                            {f.area_acres} ac
                          </span>
                        )}
                      </div>
                      <p className="mt-0.5 text-[10px] text-gray-400">
                        {f.latitude != null && f.longitude != null
                          ? `${f.latitude.toFixed(4)}, ${f.longitude.toFixed(4)}`
                          : f.province}
                      </p>
                    </button>
                  );
                })}
              </div>
            ))}
          </div>

          <div className="border-t border-gray-100 px-3 py-1.5 text-[10px] text-gray-400">
            {farms.length} farm{farms.length === 1 ? "" : "s"} · grouped by district
          </div>
        </div>
      )}
    </div>
  );
}
