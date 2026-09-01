"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { Farm } from "@/lib/api";
import Icon from "@/components/Icon";

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
        className="flex min-w-[190px] items-center gap-2 rounded-lg border border-white/12 bg-white/6 px-3 py-1.5 text-sm transition-colors hover:border-brand/40"
      >
        <Icon name="wheat" size={14} className="shrink-0 text-brand" />
        <span className="flex-1 truncate text-left font-medium text-ink">
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
            className="cursor-pointer px-1 text-dim hover:text-red-400"
            title="Clear selection"
          >
            <Icon name="x" size={12} />
          </span>
        )}
        <Icon
          name="chevronDown"
          size={14}
          className={`text-dim transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-1 w-80 rounded-xl border border-white/12 bg-panel/95 shadow-[0_16px_48px_rgba(0,0,0,0.6)] backdrop-blur-xl">
          <div className="border-b border-white/8 p-2">
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name or district…"
              className="input-dark"
            />
          </div>

          <div className="max-h-72 overflow-y-auto p-1">
            {grouped.length === 0 && (
              <p className="px-3 py-4 text-center text-xs text-dim">
                {farms.length === 0
                  ? "No farms yet — draw one on the map"
                  : "No farms match your search"}
              </p>
            )}
            {grouped.map(([district, list]) => (
              <div key={district} className="mb-1">
                <p className="flex items-center gap-1 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-dim">
                  <Icon name="mapPin" size={10} />
                  {district} · {list.length}
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
                        active ? "bg-brand/12" : "hover:bg-white/6"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span
                          className={`truncate text-sm font-medium ${
                            active ? "text-brand" : "text-ink"
                          }`}
                        >
                          {f.name}
                        </span>
                        {f.area_acres != null && (
                          <span className="whitespace-nowrap rounded-md border border-white/10 bg-white/6 px-1.5 py-0.5 text-[10px] font-semibold text-mist">
                            {f.area_acres} ac
                          </span>
                        )}
                      </div>
                      <p className="mt-0.5 font-mono text-[10px] text-dim">
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

          <div className="border-t border-white/8 px-3 py-1.5 text-[10px] text-dim">
            {farms.length} farm{farms.length === 1 ? "" : "s"} · grouped by district
          </div>
        </div>
      )}
    </div>
  );
}
