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
  const { isUrdu } = useLanguage();

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
      <div className="rounded-2xl border border-ink/8 bg-ink/[0.02] p-6 backdrop-blur-md animate-pulse">
        <div className="h-6 w-1/3 rounded bg-ink/10 mb-4" />
        <div className="h-24 w-full rounded bg-ink/5" />
      </div>
    );
  }

  if (!advice) return null;

  const hoursRemaining = Math.max(0, Math.round(advice.hours_until_turn));
  const daysRemaining = Math.floor(hoursRemaining / 24);
  const remHours = hoursRemaining % 24;

  return (
    <div className="relative overflow-hidden rounded-2xl border border-ink/10 bg-abyss/80 p-6 shadow-xl backdrop-blur-xl transition-all hover:border-brand/30">
      {/* ── Card Header ───────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-ink/8 pb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/15 text-cyan-400 ring-1 ring-cyan-500/30">
            <Icon name="droplet" size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-ink">
                {isUrdu ? "وارابندی تے ٹوب ویل بچت" : "Warabandi & Tubewell Optimizer"}
              </h3>
              <span className="rounded-full border border-cyan-500/30 bg-cyan-500/10 px-2.5 py-0.5 text-[10px] font-semibold text-cyan-300">
                {isUrdu ? "نہری واری" : "Canal Water Rights"}
              </span>
            </div>
            <p className="text-xs text-mist">
              {advice.canal_name} &bull; {advice.canal_turn_duration_hours} {isUrdu ? "گھنٹے واری" : "Hours Turn"}
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-1.5 rounded-xl border border-ink/12 bg-ink/5 px-3 py-1.5 text-xs font-semibold text-mist hover:border-ink/20 hover:text-ink transition-colors"
          title="Edit Canal Turn Schedule"
        >
          <Icon name="pencil" size={13} />
          <span>{isUrdu ? "واری سیٹ کرو" : "Configure Turn"}</span>
        </button>
      </div>

      {/* ── Main Countdown & Hero Panel ───────────────────────────────────── */}
      <div className="mt-5 grid grid-cols-1 md:grid-cols-12 gap-4 items-stretch">
        {/* Next Turn Schedule Box */}
        <div className="md:col-span-7 flex flex-col justify-between rounded-xl border border-cyan-500/20 bg-gradient-to-br from-cyan-950/30 to-abyss p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-cyan-200/80">
              {isUrdu ? "اگلی نہری واری" : "Next Scheduled Canal Turn"}
            </span>
            <span className="font-mono text-xs text-cyan-400 font-semibold">
              {advice.canal_turn_time}
            </span>
          </div>

          <div className="my-2">
            <p className="text-lg font-bold text-ink">
              {isUrdu ? advice.next_turn_formatted_ur : advice.next_turn_formatted}
            </p>
            <div className="mt-2 inline-flex items-center gap-2 rounded-full border border-cyan-400/30 bg-cyan-400/10 px-3 py-1 text-xs font-bold text-cyan-300">
              <Icon name="clock" size={13} />
              <span>
                {isUrdu
                  ? `${daysRemaining} دن ${remHours} گھنٹے باقی`
                  : `${daysRemaining}d ${remHours}h Remaining`}
              </span>
            </div>
          </div>

          <div className="text-[11px] text-mist border-t border-cyan-500/10 pt-2 flex items-center justify-between">
            <span>{isUrdu ? "پاور سورس:" : "Tubewell Power:"}</span>
            <span className="capitalize font-semibold text-ink">
              {advice.tubewell_power_source}
            </span>
          </div>
        </div>

        {/* Rupee Savings & Diesel Alert Box */}
        <div
          className={`md:col-span-5 flex flex-col justify-between rounded-xl border p-4 transition-all ${
            advice.hold_tubewell_recommended
              ? "border-emerald-500/30 bg-emerald-950/20 text-emerald-200"
              : "border-ink/8 bg-ink/[0.02] text-mist"
          }`}
        >
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-dim">
                {isUrdu ? "ڈیزل / توانائی بچت" : "Energy Cost Savings"}
              </span>
              {advice.hold_tubewell_recommended && (
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
              )}
            </div>

            <div className="mt-2">
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-extrabold text-brand font-mono">
                  Rs. {advice.potential_savings_pkr.toLocaleString()}
                </span>
                <span className="text-xs text-mist">{isUrdu ? "بچت" : "saved"}</span>
              </div>
              <p className="mt-1 text-xs text-mist leading-relaxed">
                {advice.upcoming_rain_48h_mm > 0
                  ? isUrdu
                    ? `${advice.upcoming_rain_48h_mm} ملی میٹر بارش دی پیشگوئی`
                    : `${advice.upcoming_rain_48h_mm} mm rain expected in 48h`
                  : isUrdu
                  ? "نہری پانی توں پہلاں ٹوب ویل نہ چلاؤ"
                  : "Canal water turn covers current water deficit"}
              </p>
            </div>
          </div>

          <div className="mt-3 border-t border-ink/8 pt-2 flex items-center justify-between text-[11px]">
            <span>{isUrdu ? "فصل دی لوڑ:" : "Water Need:"}</span>
            <span className="font-semibold text-ink font-mono">
              {advice.water_demand_inches} in ({advice.water_demand_m3.toLocaleString()} m³)
            </span>
          </div>
        </div>
      </div>

      {/* ── AI Action Directive Banner ────────────────────────────────────── */}
      <div className="mt-4 rounded-xl border border-brand/20 bg-brand/5 p-3.5 flex items-start gap-3">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand/20 text-brand shrink-0 mt-0.5">
          <Icon name="spark" size={14} />
        </div>
        <div>
          <h4 className="text-xs font-bold text-ink">
            {isUrdu ? advice.action_ur : advice.action_en}
          </h4>
          <p className="mt-1 text-xs text-mist leading-relaxed">
            {isUrdu ? advice.reasoning_ur : advice.reasoning_en}
          </p>
        </div>
      </div>

      {/* ── Settings Modal ─────────────────────────────────────────────────── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-abyss/80 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-md rounded-2xl border border-ink/15 bg-abyss p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-ink/10 pb-3">
              <h3 className="text-sm font-bold text-ink flex items-center gap-2">
                <Icon name="droplet" size={16} className="text-cyan-400" />
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
                <label className="block font-medium text-mist mb-1">
                  {isUrdu ? "نہری ڈسٹری بیوٹری دا ناں" : "Canal / Distributary Name"}
                </label>
                <select
                  value={formData.canal_name}
                  onChange={(e) => setFormData({ ...formData, canal_name: e.target.value })}
                  className="w-full rounded-xl border border-ink/15 bg-ink/5 px-3 py-2 text-ink focus:border-brand focus:outline-none"
                >
                  {PUNJAB_CANALS.map((c) => (
                    <option key={c} value={c} className="bg-abyss text-ink">
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-mist mb-1">
                    {isUrdu ? "واری دا دن" : "Canal Turn Day"}
                  </label>
                  <select
                    value={formData.canal_turn_day}
                    onChange={(e) => setFormData({ ...formData, canal_turn_day: e.target.value })}
                    className="w-full rounded-xl border border-ink/15 bg-ink/5 px-3 py-2 text-ink focus:border-brand focus:outline-none"
                  >
                    {WEEKDAYS.map((d) => (
                      <option key={d.en} value={d.en} className="bg-abyss text-ink">
                        {isUrdu ? `${d.ur} (${d.en})` : d.en}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-mist mb-1">
                    {isUrdu ? "واری دا وقت" : "Start Time"}
                  </label>
                  <input
                    type="time"
                    value={formData.canal_turn_time}
                    onChange={(e) => setFormData({ ...formData, canal_turn_time: e.target.value })}
                    className="w-full rounded-xl border border-ink/15 bg-ink/5 px-3 py-2 text-ink focus:border-brand focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-mist mb-1">
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
                    className="w-full rounded-xl border border-ink/15 bg-ink/5 px-3 py-2 text-ink focus:border-brand focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-medium text-mist mb-1">
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
                    className="w-full rounded-xl border border-ink/15 bg-ink/5 px-3 py-2 text-ink focus:border-brand focus:outline-none capitalize"
                  >
                    <option value="diesel" className="bg-abyss text-ink">
                      {isUrdu ? "ڈیزل جنریٹر (Diesel)" : "Diesel Generator"}
                    </option>
                    <option value="grid" className="bg-abyss text-ink">
                      {isUrdu ? "بجلی گرڈ (Electric Grid)" : "Electric Grid (WAPDA)"}
                    </option>
                    <option value="solar" className="bg-abyss text-ink">
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
