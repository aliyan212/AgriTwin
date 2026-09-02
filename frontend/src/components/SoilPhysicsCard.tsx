"use client";

import { useEffect, useState } from "react";
import Icon from "@/components/Icon";
import { useLanguage } from "@/components/LanguageProvider";
import { api, type SoilPhysicsData } from "@/lib/api";

interface SoilPhysicsCardProps {
  farmId: number;
}

export default function SoilPhysicsCard({ farmId }: SoilPhysicsCardProps) {
  const { t, isUrdu } = useLanguage();
  const [data, setData] = useState<SoilPhysicsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    api
      .getSoilPhysics(farmId)
      .then((res) => {
        if (mounted) setData(res);
      })
      .catch((err) => {
        console.warn("Failed to load soil physics:", err);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [farmId]);

  if (loading) {
    return (
      <div className="glass-panel p-5 animate-pulse">
        <div className="h-4 w-48 bg-ink/10 rounded mb-4" />
        <div className="grid grid-cols-3 gap-3">
          <div className="h-20 bg-ink/5 rounded-xl" />
          <div className="h-20 bg-ink/5 rounded-xl" />
          <div className="h-20 bg-ink/5 rounded-xl" />
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="glass-panel p-5 relative overflow-hidden transition-all duration-300 hover:shadow-xl">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-amber-500/15 text-amber-500 ring-1 ring-amber-400/30">
            <Icon name="layers" size={13} />
          </div>
          <span className="text-xs font-semibold uppercase tracking-widest text-mist">
            {isUrdu ? "مٹی دی فزکس تے ساخت (ISRIC 250m)" : "ISRIC SOILGRIDS 2.0 & SAXTON-RAWLS SOIL PHYSICS"}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="hud-pill text-amber-400 border-amber-400/25 bg-amber-500/10">
            {data.data_source === "isric_soilgrids_250m" ? "250m Grid Satellite" : "Indus Alluvium Baseline"}
          </span>
        </div>
      </div>

      {/* Hero Soil Texture Banner */}
      <div className="rounded-xl border border-ink/6 bg-ink/[0.03] p-3.5 mb-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <span className="text-[10px] font-mono uppercase tracking-wider text-dim block mb-0.5">
            {isUrdu ? "مٹی دی قسم / ساخت" : "Classified Soil Texture"}
          </span>
          <h3 className="text-base sm:text-lg font-bold text-ink flex items-center gap-2">
            <span>{data.usda_texture}</span>
            <span className="text-xs px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-600 dark:text-amber-300 font-urdu font-semibold">
              {data.punjabi_texture}
            </span>
          </h3>
          <p className="text-[11px] text-mist mt-0.5">
            {isUrdu
              ? "مٹی دی پانی محفوظ کرن دی صلاحیت جڑاں دے زون لئی کیلیبریٹ کیتی گئی ہے۔"
              : "Calibrated root-zone water retention parameters for precise deficit irrigation."}
          </p>
        </div>

        {/* Sand / Silt / Clay Bars */}
        <div className="sm:w-60 shrink-0 space-y-1.5 pt-2 sm:pt-0 border-t sm:border-t-0 border-ink/8">
          <div className="flex justify-between text-[10px] font-mono text-dim">
            <span>{isUrdu ? "ریت" : "Sand"}: <strong className="text-ink">{data.sand_pct}%</strong></span>
            <span>{isUrdu ? "بھل" : "Silt"}: <strong className="text-ink">{data.silt_pct}%</strong></span>
            <span>{isUrdu ? "چکنی" : "Clay"}: <strong className="text-ink">{data.clay_pct}%</strong></span>
          </div>
          <div className="h-2 w-full rounded-full bg-ink/10 overflow-hidden flex">
            <div style={{ width: `${data.sand_pct}%` }} className="bg-amber-400 h-full" title={`Sand: ${data.sand_pct}%`} />
            <div style={{ width: `${data.silt_pct}%` }} className="bg-emerald-400 h-full" title={`Silt: ${data.silt_pct}%`} />
            <div style={{ width: `${data.clay_pct}%` }} className="bg-sky-400 h-full" title={`Clay: ${data.clay_pct}%`} />
          </div>
          <div className="flex items-center justify-between text-[9px] text-mist">
            <span>OM: {data.organic_matter_pct}%</span>
            <span>Ksat: {data.ksat_mm_hr} mm/hr</span>
          </div>
        </div>
      </div>

      {/* 3-Column Hydraulic Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
        {/* Metric 1: Field Capacity */}
        <div className="rounded-xl border border-ink/6 bg-ink/[0.02] p-3 hover:border-ink/12 transition-colors">
          <span className="text-[11px] text-dim block mb-1">
            {isUrdu ? "فیلڈ کیپیسٹی (مکسیمم پانی)" : "Field Capacity (θ_FC)"}
          </span>
          <p className="text-base font-bold font-mono tabular-nums text-ink">
            {(data.field_capacity_m3m3 * 100).toFixed(1)}%
          </p>
          <span className="text-[10px] text-mist font-mono">
            {data.field_capacity_m3m3.toFixed(3)} m³/m³
          </span>
        </div>

        {/* Metric 2: Wilting Point */}
        <div className="rounded-xl border border-ink/6 bg-ink/[0.02] p-3 hover:border-ink/12 transition-colors">
          <span className="text-[11px] text-dim block mb-1">
            {isUrdu ? "مرجھاؤ نقطہ (ویلٹنگ پوائنٹ)" : "Wilting Point (θ_PWP)"}
          </span>
          <p className="text-base font-bold font-mono tabular-nums text-ink">
            {(data.wilting_point_m3m3 * 100).toFixed(1)}%
          </p>
          <span className="text-[10px] text-mist font-mono">
            {data.wilting_point_m3m3.toFixed(3)} m³/m³
          </span>
        </div>

        {/* Metric 3: Available Water Capacity */}
        <div className="rounded-xl border border-ink/6 bg-ink/[0.02] p-3 hover:border-ink/12 transition-colors">
          <span className="text-[11px] text-dim block mb-1">
            {isUrdu ? "دستیاب فصل پانی (AWC)" : "Available Water (AWC)"}
          </span>
          <p className="text-base font-bold font-mono tabular-nums text-emerald-500 dark:text-emerald-400">
            {data.available_water_capacity_in_ft} in / ft
          </p>
          <span className="text-[10px] text-mist font-mono">
            {data.available_water_capacity_mm_m} mm / meter
          </span>
        </div>
      </div>
    </div>
  );
}
