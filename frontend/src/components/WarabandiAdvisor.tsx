"use client";

import { useEffect, useState } from "react";
import { api, type WarabandiAdvice } from "@/lib/api";
import Icon from "@/components/Icon";
import { useLanguage } from "./LanguageProvider";

interface WarabandiAdvisorProps {
  farmId: number;
}

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

export default function WarabandiAdvisor({ farmId }: WarabandiAdvisorProps) {
  const [advice, setAdvice] = useState<WarabandiAdvice | null>(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const { t, isUrdu } = useLanguage();

  // Modal edit form state
  const [formData, setFormData] = useState({
    canal_name: "",
    canal_turn_day: "Thursday",
    canal_turn_time: "02:00",
    canal_turn_duration_hours: 4.0,
    tubewell_power_source: "diesel",
    tubewell_hourly_cost_pkr: 1400.0,
  });

  const loadAdvice = async () => {
    try {
      setLoading(true);
      const res = await api.getWarabandiAdvice(farmId);
      setAdvice(res);
      setFormData({
        canal_name: res.canal_name,
        canal_turn_day: res.canal_turn_day,
        canal_turn_time: res.canal_turn_time,
        canal_turn_duration_hours: res.canal_turn_duration_hours,
        tubewell_power_source: res.tubewell_power_source,
        tubewell_hourly_cost_pkr: 1400.0,
      });
    } catch (err) {
      console.warn("[Warabandi] Could not fetch advice:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (farmId) loadAdvice();
  }, [farmId]);

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      const updated = await api.updateWarabandiConfig(farmId, formData);
      setAdvice(updated);
      setShowModal(false);
    } catch (err) {
      console.error("[Warabandi] Save failed:", err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="glass-panel p-5 animate-pulse">
        <div className="h-4 w-1/3 rounded bg-ink/10 mb-4" />
        <div className="h-24 w-full rounded bg-ink/5" />
      </div>
    );
  }

  if (!advice) return null;

  const hoursRemaining = Math.max(0, Math.round(advice.hours_until_turn));
  const daysRemaining = Math.floor(hoursRemaining / 24);
  const remHours = hoursRemaining % 24;

  return (
    <div className="glass-panel p-5 relative overflow-hidden">
      {/* ── Header (Identical structure to WeatherCard & ForecastChart) ── */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-sky-500/15 text-sky-400 ring-1 ring-sky-400/30">
            <Icon name="droplet" size={14} />
          </span>
          <h3 className="text-xs font-semibold uppercase tracking-widest text-mist">
            {t("warabandiOptimizer", "Warabandi Rotational Canal Water & Tubewell Optimizer")}
          </h3>
        </div>

        <div className="flex items-center gap-2">
          <span className="hud-pill text-sky-300 border-sky-400/25 bg-sky-500/10">
            {advice.canal_name}
          </span>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold text-mist hover:bg-ink/6 hover:text-ink transition-colors"
            title="Edit Canal Turn Schedule"
          >
            <Icon name="pencil" size={11} className="text-dim" />
            <span>{isUrdu ? "واری سیٹ کرو" : "Configure"}</span>
          </button>
        </div>
      </div>

      {/* ── Two Hero Banners (Exact match to Ambient Air Temp & Air Quality in WeatherCard) ── */}
      <div className="mb-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Next Scheduled Canal Turn */}
        <div className="flex items-center gap-3 rounded-xl border border-ink/6 bg-ink/[0.03] p-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-sky-500/15 text-sky-400 ring-1 ring-sky-400/30 shrink-0">
            <Icon name="clock" size={22} />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-1">
              <span className="text-[10px] font-mono uppercase tracking-wider text-dim block truncate">
                {isUrdu ? "اگلی نہری واری" : "Next Canal Water Turn"}
              </span>
              <span className="inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] font-semibold font-mono bg-sky-500/10 text-sky-600 dark:text-sky-300 ring-1 ring-sky-400/20 shrink-0">
                {daysRemaining}d {remHours}h left
              </span>
            </div>
            <p className="text-base font-bold font-mono tabular-nums text-ink truncate mt-0.5">
              {isUrdu ? advice.next_turn_formatted_ur : advice.next_turn_formatted}
            </p>
            <p className="text-[10px] text-mist truncate">
              {advice.canal_turn_duration_hours}h turn • {advice.tubewell_power_source} backup
            </p>
          </div>
        </div>

        {/* Energy Cost Savings */}
        <div className="flex items-center gap-3 rounded-xl border border-ink/6 bg-ink/[0.03] p-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-400/30 shrink-0">
            <Icon name="activity" size={22} />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-1">
              <span className="text-[10px] font-mono uppercase tracking-wider text-dim block truncate">
                {isUrdu ? "ڈیزل / بجلی بچت" : "Tubewell Energy Saved"}
              </span>
              {advice.hold_tubewell_recommended && (
                <span className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-brand ring-1 ring-emerald-400/20 shrink-0">
                  Hold Tubewell
                </span>
              )}
            </div>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-2xl font-bold font-mono tabular-nums text-emerald-600 dark:text-brand">
                Rs. {advice.potential_savings_pkr.toLocaleString()}
              </span>
              <span className="text-xs text-mist font-medium">{isUrdu ? "بچت" : "saved"}</span>
            </div>
            <p className="text-[10px] text-mist truncate">
              {advice.upcoming_rain_48h_mm > 0
                ? `${advice.upcoming_rain_48h_mm} mm rain forecast`
                : "Canal turn satisfies crop water deficit"}
            </p>
          </div>
        </div>
      </div>

      {/* ── 3-Grid Metrics (Exact match to the 6-Grid metrics in WeatherCard) ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 mb-3">
        {/* Metric 1: Crop Water Need */}
        <div className="flex flex-col justify-between rounded-xl border border-ink/6 bg-ink/[0.02] p-3 transition-colors hover:border-ink/12 hover:bg-ink/4">
          <div className="flex items-center justify-between gap-1 mb-1">
            <span className="text-[11px] text-dim truncate">
              {isUrdu ? "فصل دی لوڑ" : "Crop Water Deficit"}
            </span>
            <Icon name="droplet" size={13} className="text-dim shrink-0" />
          </div>
          <p className="text-base font-bold font-mono tabular-nums text-ink my-0.5">
            {advice.water_demand_inches} in
          </p>
          <span className="text-[10px] text-mist truncate">
            {advice.water_demand_m3.toLocaleString()} m³ root zone demand
          </span>
        </div>

        {/* Metric 2: Rain Forecast */}
        <div className="flex flex-col justify-between rounded-xl border border-ink/6 bg-ink/[0.02] p-3 transition-colors hover:border-ink/12 hover:bg-ink/4">
          <div className="flex items-center justify-between gap-1 mb-1">
            <span className="text-[11px] text-dim truncate">
              {isUrdu ? "48 گھنٹے بارش" : "48h Rain Forecast"}
            </span>
            <Icon name="cloudSun" size={13} className="text-dim shrink-0" />
          </div>
          <p className="text-base font-bold font-mono tabular-nums text-ink my-0.5">
            {advice.upcoming_rain_48h_mm.toFixed(1)} mm
          </p>
          <span className="text-[10px] text-mist truncate">
            {advice.upcoming_rain_48h_mm >= 8 ? "Significant rain expected" : "Negligible precipitation"}
          </span>
        </div>

        {/* Metric 3: Pumping Backup */}
        <div className="flex flex-col justify-between rounded-xl border border-ink/6 bg-ink/[0.02] p-3 transition-colors hover:border-ink/12 hover:bg-ink/4">
          <div className="flex items-center justify-between gap-1 mb-1">
            <span className="text-[11px] text-dim truncate">
              {isUrdu ? "ٹیوب ویل ایندھن بیک اپ" : "Tubewell Power Backup"}
            </span>
            <Icon name="activity" size={13} className="text-dim shrink-0" />
          </div>
          <p className="text-base font-bold font-mono tabular-nums text-ink capitalize my-0.5">
            {advice.tubewell_power_source}
          </p>
          <span className="text-[10px] text-mist truncate">
            {advice.tubewell_power_source === "solar"
              ? "Zero fuel expenditure"
              : advice.tubewell_power_source === "diesel"
                ? "Rs. 1,400 / hr diesel est."
                : "Rs. 650 / hr grid tariff"}
          </span>
        </div>
      </div>

      {/* ── Agronomic Directive Banner (Subtle, clean, matching app palette) ── */}
      <div className="flex items-start gap-3 rounded-xl border border-ink/6 bg-ink/[0.02] p-3">
        <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-emerald-500/15 text-brand ring-1 ring-brand/30 shrink-0 mt-0.5">
          <Icon name="spark" size={12} />
        </span>
        <div className="min-w-0">
          <h4 className="text-xs font-semibold text-ink">
            {isUrdu ? advice.action_ur : advice.action_en}
          </h4>
          <p className="text-[11px] text-mist leading-relaxed mt-0.5">
            {isUrdu ? advice.reasoning_ur : advice.reasoning_en}
          </p>
        </div>
      </div>

      {/* ── Settings Modal ─────────────────────────────────────────────────── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-md rounded-2xl border border-brand/25 bg-panel p-6 shadow-2xl backdrop-blur-2xl">
            <div className="flex items-center justify-between border-b border-ink/10 pb-3">
              <h3 className="text-sm font-bold text-ink flex items-center gap-2">
                <Icon name="droplet" size={16} className="text-cyan-500 dark:text-cyan-400" />
                <span>{isUrdu ? "نہری واری سیٹنگز" : "Configure Warabandi Turn"}</span>
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="rounded-lg p-1 text-dim hover:text-ink transition-colors"
              >
                <Icon name="x" size={16} />
              </button>
            </div>

            <form onSubmit={handleSaveConfig} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="mb-1 block font-semibold text-mist uppercase tracking-wider text-[10px]">
                  {isUrdu ? "نہری ڈسٹری بیوٹری دا ناں" : "Canal / Distributary Name"}
                </label>
                <select
                  value={formData.canal_name}
                  onChange={(e) => setFormData({ ...formData, canal_name: e.target.value })}
                  className="input-theme w-full"
                >
                  {PUNJAB_CANALS.map((c) => (
                    <option key={c} value={c} className="bg-panel text-ink">
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block font-semibold text-mist uppercase tracking-wider text-[10px]">
                    {isUrdu ? "واری دا دن" : "Canal Turn Day"}
                  </label>
                  <select
                    value={formData.canal_turn_day}
                    onChange={(e) => setFormData({ ...formData, canal_turn_day: e.target.value })}
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
                    value={formData.canal_turn_time}
                    onChange={(e) => setFormData({ ...formData, canal_turn_time: e.target.value })}
                    className="input-theme w-full"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block font-semibold text-mist uppercase tracking-wider text-[10px]">
                    {isUrdu ? "واری دا دورانیہ (گھنٹے)" : "Turn Duration (Hours)"}
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    min="1"
                    max="24"
                    value={formData.canal_turn_duration_hours}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        canal_turn_duration_hours: parseFloat(e.target.value) || 4.0,
                      })
                    }
                    className="input-theme w-full"
                  />
                </div>

                <div>
                  <label className="mb-1 block font-semibold text-mist uppercase tracking-wider text-[10px]">
                    {isUrdu ? "ٹوب ویل دا ایندھن" : "Tubewell Power Source"}
                  </label>
                  <select
                    value={formData.tubewell_power_source}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        tubewell_power_source: e.target.value,
                        tubewell_hourly_cost_pkr:
                          e.target.value === "diesel"
                            ? 1400.0
                            : e.target.value === "grid"
                              ? 650.0
                              : 0.0,
                      })
                    }
                    className="input-theme w-full capitalize"
                  >
                    <option value="diesel" className="bg-panel text-ink">
                      {isUrdu ? "ڈیزل جنریٹر (Diesel)" : "Diesel Generator"}
                    </option>
                    <option value="grid" className="bg-panel text-ink">
                      {isUrdu ? "بجلی گرڈ (Electric Grid)" : "Electric Grid (WAPDA)"}
                    </option>
                    <option value="solar" className="bg-panel text-ink">
                      {isUrdu ? "سولر ٹیوب ویل (Solar)" : "Solar Powered"}
                    </option>
                  </select>
                </div>
              </div>

              <div className="mt-5 flex items-center justify-end gap-2 border-t border-ink/10 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="rounded-xl border border-ink/12 bg-ink/5 px-4 py-2 font-semibold text-mist hover:text-ink transition-colors"
                >
                  {isUrdu ? "منسوخ" : "Cancel"}
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-xl bg-brand px-4 py-2 font-bold text-abyss hover:bg-brand/90 transition-colors shadow-sm disabled:opacity-50"
                >
                  {saving ? (isUrdu ? "محفوظ ہو رہا ہے..." : "Saving...") : isUrdu ? "محفوظ کرو" : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

