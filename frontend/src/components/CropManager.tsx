"use client";

import { useEffect, useState } from "react";
import { api, type Crop, type CropKnowledge } from "@/lib/api";
import Icon from "@/components/Icon";

interface CropManagerProps {
  farmId: number;
  onCropAdded?: () => void;
}

export default function CropManager({ farmId, onCropAdded }: CropManagerProps) {
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
          Crop Management
        </h3>
        <div className="flex items-center justify-center py-4">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-brand border-t-transparent" />
        </div>
      </div>
    );
  }

  const selectedInfo = knowledge.find((k) => k.name === selectedCrop);

  return (
    <div className="glass-panel p-5">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-mist">
          <Icon name="wheat" size={13} className="text-brand" />
          Crop Management
        </h3>
        {!showAddForm && (
          <button
            onClick={() => setShowAddForm(true)}
            className="flex items-center gap-1 rounded-lg bg-gradient-to-b from-emerald-400 to-emerald-600 px-3 py-1 text-xs font-semibold text-abyss shadow-[0_2px_12px_rgba(16,185,129,0.35)] transition-shadow hover:shadow-[0_2px_18px_rgba(16,185,129,0.55)]"
          >
            <Icon name="plus" size={12} strokeWidth={2.5} />
            Add Crop
          </button>
        )}
      </div>

      {/* Existing crops */}
      {crops.length > 0 ? (
        <div className="mb-3 space-y-2">
          {crops.map((c) => (
            <div
              key={c.id}
              className="flex items-center justify-between rounded-lg border border-white/6 bg-white/4 p-2.5"
            >
              <div>
                <p className="text-sm font-medium text-ink">{c.crop_name}</p>
                <p className="text-xs text-dim">
                  {c.season ?? "—"}
                  {c.sowing_date
                    ? ` · Sown ${new Date(c.sowing_date).toLocaleDateString()}`
                    : ""}
                </p>
              </div>
              <span className="rounded-full border border-emerald-400/25 bg-emerald-400/10 px-2 py-0.5 text-[10px] font-medium text-emerald-300">
                {c.growth_stage ?? "Active"}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <p className="mb-3 text-sm text-dim">No crops registered yet.</p>
      )}

      {/* Add crop form */}
      {showAddForm && (
        <div className="space-y-3 rounded-lg border border-brand/25 bg-brand/6 p-3">
          <select
            value={selectedCrop}
            onChange={(e) => {
              setSelectedCrop(e.target.value);
              const info = knowledge.find((k) => k.name === e.target.value);
              if (info) setSelectedSeason(info.season);
            }}
            className="input-dark bg-panel"
          >
            {knowledge.map((k) => (
              <option key={k.name} value={k.name}>
                {k.name} ({k.season})
              </option>
            ))}
          </select>

          <input
            type="date"
            value={sowingDate}
            onChange={(e) => setSowingDate(e.target.value)}
            className="input-dark [color-scheme:dark]"
            placeholder="Sowing date"
          />

          {/* Crop info preview */}
          {selectedInfo && (
            <div className="rounded-lg border border-white/6 bg-white/4 p-2.5 text-xs text-mist">
              <p>
                <span className="font-medium text-ink">Sowing:</span>{" "}
                {selectedInfo.sowing_window}
              </p>
              <p>
                <span className="font-medium text-ink">Harvest:</span>{" "}
                {selectedInfo.harvest_window}
              </p>
              <p>
                <span className="font-medium text-ink">Water:</span>{" "}
                {selectedInfo.water_requirement_mm} mm total
              </p>
              <p>
                <span className="font-medium text-ink">Pests:</span>{" "}
                {selectedInfo.common_pests.slice(0, 3).join(", ")}
              </p>
            </div>
          )}

          <div className="flex gap-2">
            <button
              onClick={handleAddCrop}
              className="flex-1 rounded-lg bg-gradient-to-b from-emerald-400 to-emerald-600 px-3 py-1.5 text-sm font-semibold text-abyss shadow-[0_2px_12px_rgba(16,185,129,0.35)] transition-shadow hover:shadow-[0_2px_18px_rgba(16,185,129,0.55)]"
            >
              Add Crop
            </button>
            <button
              onClick={() => setShowAddForm(false)}
              className="rounded-lg border border-white/12 px-3 py-1.5 text-sm text-mist transition-colors hover:bg-white/6 hover:text-ink"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
