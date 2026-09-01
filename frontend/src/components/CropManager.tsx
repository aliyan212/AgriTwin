"use client";

import { useEffect, useState } from "react";
import { api, type Crop, type CropKnowledge } from "@/lib/api";

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
      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <h3 className="mb-3 text-sm font-semibold text-gray-500 uppercase tracking-wide">
          Crop Management
        </h3>
        <div className="flex items-center justify-center py-4">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-green-500 border-t-transparent" />
        </div>
      </div>
    );
  }

  const selectedInfo = knowledge.find((k) => k.name === selectedCrop);

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
          Crop Management
        </h3>
        {!showAddForm && (
          <button
            onClick={() => setShowAddForm(true)}
            className="rounded-lg bg-green-600 px-3 py-1 text-xs font-medium text-white hover:bg-green-700"
          >
            + Add Crop
          </button>
        )}
      </div>

      {/* Existing crops */}
      {crops.length > 0 ? (
        <div className="mb-3 space-y-2">
          {crops.map((c) => (
            <div
              key={c.id}
              className="flex items-center justify-between rounded-lg bg-gray-50 p-2.5"
            >
              <div>
                <p className="text-sm font-medium text-gray-900">{c.crop_name}</p>
                <p className="text-xs text-gray-500">
                  {c.season ?? "—"}
                  {c.sowing_date
                    ? ` · Sown ${new Date(c.sowing_date).toLocaleDateString()}`
                    : ""}
                </p>
              </div>
              <span className="rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-medium text-green-700">
                {c.growth_stage ?? "Active"}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <p className="mb-3 text-sm text-gray-400">No crops registered yet.</p>
      )}

      {/* Add crop form */}
      {showAddForm && (
        <div className="space-y-3 rounded-lg border border-green-200 bg-green-50 p-3">
          <select
            value={selectedCrop}
            onChange={(e) => {
              setSelectedCrop(e.target.value);
              const info = knowledge.find((k) => k.name === e.target.value);
              if (info) setSelectedSeason(info.season);
            }}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none"
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
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none"
            placeholder="Sowing date"
          />

          {/* Crop info preview */}
          {selectedInfo && (
            <div className="rounded bg-white p-2 text-xs text-gray-600">
              <p>
                <span className="font-medium">Sowing:</span>{" "}
                {selectedInfo.sowing_window}
              </p>
              <p>
                <span className="font-medium">Harvest:</span>{" "}
                {selectedInfo.harvest_window}
              </p>
              <p>
                <span className="font-medium">Water:</span>{" "}
                {selectedInfo.water_requirement_mm} mm total
              </p>
              <p>
                <span className="font-medium">Pests:</span>{" "}
                {selectedInfo.common_pests.slice(0, 3).join(", ")}
              </p>
            </div>
          )}

          <div className="flex gap-2">
            <button
              onClick={handleAddCrop}
              className="flex-1 rounded-lg bg-green-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-green-700"
            >
              Add Crop
            </button>
            <button
              onClick={() => setShowAddForm(false)}
              className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
