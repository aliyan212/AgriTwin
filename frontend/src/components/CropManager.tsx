"use client";

import { useEffect, useState } from "react";
import { api, type Crop, type CropKnowledge } from "@/lib/api";
import Icon from "@/components/Icon";
import { useLanguage } from "./LanguageProvider";
import { getLocalizedCropName, getLocalizedStageName } from "@/lib/translations";

interface CropManagerProps {
  farmId: number;
  onCropAdded?: () => void;
}

function parseDaysRange(das: string): { min: number; max: number } {
  const nums = das.match(/\d+/g)?.map(Number) || [];
  if (nums.length >= 2) return { min: nums[0], max: nums[1] };
  if (nums.length === 1) return { min: nums[0], max: nums[0] + 15 };
  return { min: 0, max: 999 };
}

function deriveStageInfo(
  activeCrop: Crop | null,
  knowledge: CropKnowledge[]
): {
  stages: { name: string; das: string; sensitivity: string }[];
  stageIndex: number;
  currentStageName: string;
  daysAfterSowing: number;
} {
  if (!activeCrop) {
    return { stages: [], stageIndex: 0, currentStageName: "No crop", daysAfterSowing: 0 };
  }

  const k = knowledge.find(
    (item) =>
      item.name.toLowerCase() === activeCrop.crop_name.toLowerCase() ||
      activeCrop.crop_name.toLowerCase().includes(item.name.toLowerCase()) ||
      item.name.toLowerCase().includes(activeCrop.crop_name.toLowerCase())
  );

  const rawStages = k?.growth_stages || [
    { stage: "Germination", days_after_sowing: "0–10", water_sensitivity: "moderate" },
    { stage: "Vegetative", days_after_sowing: "15–50", water_sensitivity: "high" },
    { stage: "Flowering", days_after_sowing: "50–85", water_sensitivity: "critical" },
    { stage: "Grain Filling", days_after_sowing: "85–125", water_sensitivity: "high" },
    { stage: "Maturity", days_after_sowing: "125–160", water_sensitivity: "low" },
  ];

  const stages = rawStages.map((s) => ({
    name: s.stage,
    das: s.days_after_sowing,
    sensitivity: s.water_sensitivity,
  }));

  if (!activeCrop.sowing_date) {
    const defaultIdx = Math.min(1, stages.length - 1);
    return {
      stages,
      stageIndex: defaultIdx,
      currentStageName: activeCrop.growth_stage || stages[defaultIdx]?.name || "Vegetative",
      daysAfterSowing: 30,
    };
  }

  const sowing = new Date(activeCrop.sowing_date);
  const now = new Date();
  const diffDays = Math.max(0, Math.floor((now.getTime() - sowing.getTime()) / (1000 * 60 * 60 * 24)));

  let matchedIdx = -1;
  const parsed = stages.map((s) => parseDaysRange(s.das));

  for (let i = 0; i < parsed.length; i++) {
    if (diffDays >= parsed[i].min && diffDays <= parsed[i].max) {
      matchedIdx = i;
      break;
    }
  }

  if (matchedIdx === -1) {
    for (let i = 0; i < parsed.length - 1; i++) {
      if (diffDays > parsed[i].max && diffDays < parsed[i + 1].min) {
        matchedIdx = i + 1;
        break;
      }
    }
  }

  if (matchedIdx === -1) {
    matchedIdx = diffDays > (parsed[parsed.length - 1]?.max || 160) ? stages.length - 1 : 0;
  }

  return {
    stages,
    stageIndex: matchedIdx,
    currentStageName: stages[matchedIdx]?.name || activeCrop.growth_stage || "Active",
    daysAfterSowing: diffDays,
  };
}

export default function CropManager({ farmId, onCropAdded }: CropManagerProps) {
  const { t, isUrdu } = useLanguage();
  const [crops, setCrops] = useState<Crop[]>([]);
  const [knowledge, setKnowledge] = useState<CropKnowledge[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [loading, setLoading] = useState(true);

  // Add form state
  const [selectedCrop, setSelectedCrop] = useState("");
  const [selectedSeason, setSelectedSeason] = useState("");
  const [sowingDate, setSowingDate] = useState("");

  // Load crops + knowledge
  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.listCrops(farmId).catch(() => []),
      api.getCropKnowledge().catch(() => []),
    ]).then(([c, k]) => {
      setCrops(c);
      setKnowledge(k);
      if (k.length > 0) {
        setSelectedCrop(k[0].name);
        setSelectedSeason(k[0].season);
      }
      setLoading(false);
    });
  }, [farmId]);

  const handleAddCrop = async () => {
    if (!selectedCrop) return;
    try {
      const crop = await api.addCrop(farmId, {
        crop_name: selectedCrop,
        season: selectedSeason || undefined,
        sowing_date: sowingDate ? new Date(sowingDate).toISOString() : undefined,
      });
      setCrops((prev) => [...prev, crop]);
      setShowAddForm(false);
      setSowingDate("");
      onCropAdded?.();
    } catch (err) {
      alert(`Failed to add crop: ${err}`);
    }
  };

  if (loading) {
    return (
      <div className="glass-panel p-5">
        <h3 className="mb-3 text-xs font-semibold uppercase tracking-widest text-mist">
          {t("cropLifecycle", "Crop Lifecycle & Phenology")}
        </h3>
        <div className="flex items-center justify-center py-6">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-brand border-t-transparent" />
        </div>
      </div>
    );
  }

  const selectedInfo = knowledge.find((k) => k.name === selectedCrop);
  const activeCrop = crops[0]; // primary active crop
  const { stages, stageIndex, currentStageName, daysAfterSowing } = deriveStageInfo(activeCrop, knowledge);

  return (
    <>
      <div className="glass-panel p-5 relative overflow-hidden">
        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-emerald-500/15 text-brand ring-1 ring-emerald-400/30">
              <Icon name="wheat" size={14} />
            </span>
            <h3 className="text-xs font-semibold uppercase tracking-widest text-mist">
              {t("cropLifecycle", "Crop Lifecycle & Phenology")}
            </h3>
          </div>

          {!showAddForm && (
            <button
              onClick={() => setShowAddForm(true)}
              className="flex items-center gap-1 rounded-lg bg-brand/15 border border-brand/30 px-2.5 py-1 text-xs font-semibold text-brand transition-all hover:bg-brand/25"
            >
              <Icon name="plus" size={12} strokeWidth={2.5} />
              <span>{t("addCrop", "Add Crop")}</span>
            </button>
          )}
        </div>

        {/* Active Crop Lifecycle Stepper */}
        {activeCrop ? (
          <div className="mb-4 rounded-xl border border-ink/6 bg-ink/[0.03] p-4">
            <div className="flex items-start justify-between gap-2 mb-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-base font-bold text-ink">
                    {getLocalizedCropName(activeCrop.crop_name, isUrdu)}
                  </span>
                  <span className="rounded-md border border-brand/30 bg-brand/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-brand">
                    {activeCrop.season === "Rabi"
                      ? isUrdu
                        ? "ربیع (ہاڑی)"
                        : "Rabi Season"
                      : activeCrop.season === "Kharif"
                        ? isUrdu
                          ? "خریف (ساؤنی)"
                          : "Kharif Season"
                        : activeCrop.season || "Punjab Season"}
                  </span>
                </div>
                <p className="text-xs text-mist mt-0.5">
                  {activeCrop.sowing_date ? (
                    <>
                      {isUrdu ? "بیجائی دی تاریخ: " : "Sown "}
                      {new Date(activeCrop.sowing_date).toLocaleDateString("en-PK", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}{" "}
                      &middot;{" "}
                      <span className="text-ink font-semibold">
                        {daysAfterSowing} {t("daysAfterSowing", "days after sowing")}
                      </span>
                    </>
                  ) : (
                    t("activeCroppingCycle", "Active cropping cycle")
                  )}
                </p>
              </div>
            </div>

            {/* Growth Stage Spotlight & Stepper */}
            <div className="pt-2">
              <div className="flex items-center justify-between text-[11px] font-mono text-dim mb-2">
                <span>{t("knowledgeBaseStage", "Growth Phenology Stage")}</span>
                <span className="text-brand font-bold bg-brand/10 border border-brand/25 px-2 py-0.5 rounded-md">
                  {getLocalizedStageName(currentStageName, isUrdu)} ({stageIndex + 1}/{stages.length})
                </span>
              </div>

              {/* Progress Bar Track */}
              <div className="relative h-2 w-full rounded-full bg-ink/10 overflow-hidden mb-3">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-emerald-500 via-brand to-lime-300 transition-all duration-500 shadow-[0_0_12px_rgba(52,211,153,0.8)]"
                  style={{
                    width: `${Math.min(100, Math.max(10, ((stageIndex + 1) / Math.max(1, stages.length)) * 100))}%`,
                  }}
                />
              </div>

              {/* Horizontal Scrollable Stage Pills with Full Breathing Room */}
              <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-ink/10">
                {stages.map((s, idx) => {
                  const isPast = idx < stageIndex;
                  const isCurrent = idx === stageIndex;
                  return (
                    <div
                      key={s.name}
                      className={`shrink-0 flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs transition-all ${
                        isCurrent
                          ? "bg-brand/20 border border-brand/40 text-brand font-bold shadow-sm ring-1 ring-brand/30"
                          : isPast
                            ? "bg-emerald-500/10 border border-emerald-500/20 text-mist font-medium"
                            : "bg-ink/[0.02] border border-ink/6 text-dim font-normal"
                      }`}
                    >
                      <span
                        className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[9px] font-mono font-bold ${
                          isCurrent
                            ? "bg-brand text-abyss shadow-sm"
                            : isPast
                              ? "bg-emerald-500/30 text-emerald-300"
                              : "bg-ink/10 text-dim"
                        }`}
                      >
                        {isPast ? "✓" : idx + 1}
                      </span>
                      <span className={`whitespace-nowrap ${isUrdu ? "font-urdu text-[13px]" : "text-xs"}`}>
                        {getLocalizedStageName(s.name, isUrdu)}
                      </span>
                      {s.das && (
                        <span className="text-[10px] font-mono opacity-75 shrink-0">
                          ({s.das}d)
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ) : (
          <div className="mb-4 rounded-xl border border-ink/6 bg-ink/[0.02] p-6 text-center">
            <Icon name="wheat" size={24} className="mx-auto text-dim mb-2" />
            <p className="text-sm font-medium text-ink">
              {isUrdu ? "کوئی فصل رجسٹرڈ نہیں" : "No Crops Registered"}
            </p>
            <p className="text-xs text-dim mt-1">
              {isUrdu
                ? "اپنی کاشت کیتی فصل (گندم، کپاس، دھان، کماد) درج کرو تاکہ فصلی مراحل دا تجزیہ مل سکے۔"
                : "Register your planted crop (e.g. Wheat, Cotton, Rice) to unlock growth stage intelligence."}
            </p>
          </div>
        )}
      </div>

      {/* Add Crop Modal Form (Moved to fixed modal) */}
      {showAddForm && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="rounded-2xl border border-brand/40 bg-panel/95 p-6 shadow-2xl w-full max-w-md relative animate-in fade-in zoom-in-95 duration-300">
            <div className="flex items-center justify-between mb-5">
              <h4 className="text-sm font-bold uppercase tracking-wider text-brand flex items-center gap-2">
                <Icon name="wheat" size={16} />
                <span>{t("addCrop", "Register Planted Crop")}</span>
              </h4>
              <button
                onClick={() => setShowAddForm(false)}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-dim hover:bg-ink/10 hover:text-ink transition-colors"
              >
                <Icon name="x" size={16} />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="text-xs font-semibold text-mist mb-1.5 block">
                  {t("cropVariety", "Crop Variety (Punjab Agricultural Index)")}
                </label>
                <select
                  value={selectedCrop}
                  onChange={(e) => {
                    setSelectedCrop(e.target.value);
                    const info = knowledge.find((k) => k.name === e.target.value);
                    if (info) setSelectedSeason(info.season);
                  }}
                  className="input-theme bg-panel w-full"
                >
                  {knowledge.map((k) => (
                    <option key={k.name} value={k.name}>
                      {getLocalizedCropName(k.name, isUrdu)} &mdash; {k.season === "Rabi" ? (isUrdu ? "ربیع (ہاڑی)" : "Rabi Season") : (isUrdu ? "خریف (ساؤنی)" : "Kharif Season")}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-mist mb-1.5 block">
                  {t("sowingDate", "Sowing Date (for phenology tracking)")}
                </label>
                <input
                  type="date"
                  value={sowingDate}
                  onChange={(e) => setSowingDate(e.target.value)}
                  className="input-theme w-full"
                />
              </div>

              {/* Crop Info Preview */}
              {selectedInfo && (
                <div className="grid grid-cols-2 gap-3 rounded-xl border border-ink/6 bg-ink/[0.03] p-3.5 text-xs text-mist">
                  <div>
                    <span className="text-dim block text-[10px] uppercase font-semibold mb-0.5">
                      {isUrdu ? "بیجائی دا بہترین وقت" : "Sowing Window"}
                    </span>
                    <span className="font-medium text-ink">{selectedInfo.sowing_window}</span>
                  </div>
                  <div>
                    <span className="text-dim block text-[10px] uppercase font-semibold mb-0.5">
                      {isUrdu ? "پانی دی کل ضرورت" : "Water Demand"}
                    </span>
                    <span className="font-medium text-ink">{selectedInfo.water_requirement_mm} mm</span>
                  </div>
                  <div className="col-span-2 pt-2 mt-1 border-t border-ink/6">
                    <span className="text-dim block text-[10px] uppercase font-semibold mb-0.5">
                      {isUrdu ? "پنجاب وچ عام کیڑے مکوڑے" : "Common Punjab Pests"}
                    </span>
                    <span className="text-ink">{selectedInfo.common_pests.slice(0, 3).join(", ")}</span>
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-3 mt-4 border-t border-ink/10">
                <button
                  onClick={handleAddCrop}
                  className="flex-1 rounded-xl bg-gradient-to-b from-emerald-400 to-emerald-600 px-4 py-2.5 text-sm font-bold text-abyss shadow-md hover:shadow-lg transition-all"
                >
                  {t("saveCrop", "Save Crop Data")}
                </button>
                <button
                  onClick={() => setShowAddForm(false)}
                  className="rounded-xl border border-ink/12 bg-ink/5 px-4 py-2.5 text-sm font-medium text-mist hover:bg-ink/10 hover:text-ink transition-colors"
                >
                  {t("cancel", "Cancel")}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
