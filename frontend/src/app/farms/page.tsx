"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { api, type Farm } from "@/lib/api";
import Icon from "@/components/Icon";
import ConfirmModal from "@/components/ConfirmModal";
import LazyCard from "@/components/LazyCard";
import SkeletonCard from "@/components/SkeletonCard";
import { useLanguage } from "@/components/LanguageProvider";

export default function FarmsHubPage() {
  const { t, isUrdu } = useLanguage();
  const [farms, setFarms] = useState<Farm[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDistrict, setSelectedDistrict] = useState<string>("all");
  const [farmToDelete, setFarmToDelete] = useState<Farm | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    setLoading(true);
    api
      .listFarms()
      .then((data) => setFarms(data))
      .catch(() => setFarms([]))
      .finally(() => setLoading(false));
  }, []);

  const confirmDeleteFarm = async () => {
    if (!farmToDelete) return;
    setDeleting(true);
    try {
      await api.deleteFarm(farmToDelete.id);
      setFarms((prev) => prev.filter((f) => f.id !== farmToDelete.id));
      setFarmToDelete(null);
    } catch {
      alert("Failed to delete farm. Please try again.");
    } finally {
      setDeleting(false);
    }
  };

  const districts = useMemo(() => {
    const set = new Set<string>();
    farms.forEach((f) => {
      if (f.district) set.add(f.district);
    });
    return ["all", ...Array.from(set)];
  }, [farms]);

  const filteredFarms = useMemo(() => {
    return farms.filter((f) => {
      const matchesSearch =
        searchQuery === "" ||
        f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (f.district && f.district.toLowerCase().includes(searchQuery.toLowerCase())) ||
        f.province.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesDistrict =
        selectedDistrict === "all" || f.district === selectedDistrict;

      return matchesSearch && matchesDistrict;
    });
  }, [farms, searchQuery, selectedDistrict]);

  const totalAcres = useMemo(() => {
    return farms.reduce((acc, f) => acc + (f.area_acres || 0), 0);
  }, [farms]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      {/* ── Top Header & Stats ────────────────────────────────────────── */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/15 text-brand ring-1 ring-emerald-400/30">
                <Icon name="wheat" size={16} />
              </span>
              <h1 className="text-2xl font-bold tracking-tight text-ink">
                {t("hubTitle", "Farms Operations Hub")}
              </h1>
            </div>
            <p className="mt-1 text-xs text-mist">
              {t("hubSubtitle", "Centralized registry of digital twin nodes across Punjab agricultural zones.")}
            </p>
          </div>

          <Link
            href="/"
            className="flex items-center gap-2 rounded-xl bg-gradient-to-b from-emerald-400 to-emerald-600 px-4 py-2 text-xs font-semibold text-abyss shadow-[0_4px_16px_rgba(16,185,129,0.35)] transition-all hover:scale-[1.02] hover:shadow-[0_4px_24px_rgba(16,185,129,0.55)] w-fit"
          >
            <Icon name="plus" size={14} strokeWidth={2.5} />
            <span>{t("registerNewFarm", "Register / Draw New Farm")}</span>
          </Link>
        </div>

        {/* Quick KPI Stats Bar with Lazy Smooth Entrance */}
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <LazyCard delayMs={40}>
            <div className="glass-panel p-4 hover:border-brand/30 transition-colors">
              <span className="text-[11px] font-mono uppercase tracking-wider text-dim">
                {t("totalFarms", "Total Farms")}
              </span>
              <p className="mt-1 text-2xl font-bold text-ink">{farms.length}</p>
            </div>
          </LazyCard>

          <LazyCard delayMs={80}>
            <div className="glass-panel p-4 hover:border-brand/30 transition-colors">
              <span className="text-[11px] font-mono uppercase tracking-wider text-dim">
                {t("monitoredArea", "Monitored Area")}
              </span>
              <p className="mt-1 text-2xl font-bold text-ink">
                {totalAcres.toLocaleString()}{" "}
                <span className="text-xs font-normal text-mist">{t("acres", "acres")}</span>
              </p>
            </div>
          </LazyCard>

          <LazyCard delayMs={120}>
            <div className="glass-panel p-4 hover:border-brand/30 transition-colors">
              <span className="text-[11px] font-mono uppercase tracking-wider text-dim">
                {t("activeDistricts", "Active Districts")}
              </span>
              <p className="mt-1 text-2xl font-bold text-brand">
                {districts.length > 1 ? districts.length - 1 : 0}
              </p>
            </div>
          </LazyCard>

          <LazyCard delayMs={160}>
            <div className="glass-panel p-4 hover:border-brand/30 transition-colors">
              <span className="text-[11px] font-mono uppercase tracking-wider text-dim">
                {t("liveSync", "Data Status")}
              </span>
              <p className="mt-1 text-2xl font-bold text-emerald-400 flex items-center gap-2">
                <span className="inline-block h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                {t("liveSync", "Live Sync")}
              </p>
            </div>
          </LazyCard>
        </div>
      </div>

      {/* ── Search & Filter Controls ──────────────────────────────────── */}
      <div className="mb-6 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-dim">
            <Icon name="search" size={14} />
          </span>
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filter by farm name, district, province…"
            className="input-theme pl-9 text-xs"
          />
        </div>

        {/* District Filter Pills */}
        <div className="flex w-full sm:w-auto items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {districts.map((d) => {
            const active = selectedDistrict === d;
            return (
              <button
                key={d}
                onClick={() => setSelectedDistrict(d)}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium capitalize transition-all shrink-0 ${active
                    ? "bg-brand/15 text-brand border border-brand/40 shadow-sm"
                    : "text-mist hover:bg-ink/6 hover:text-ink border border-ink/6"
                  }`}
              >
                {d === "all" ? "All Districts" : d}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Farm Cards Grid with Staggered Shimmer & Lazy Loading ─────── */}
      {loading ? (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((idx) => (
            <SkeletonCard key={idx} height="h-56" rows={3} />
          ))}
        </div>
      ) : filteredFarms.length === 0 ? (
        <div className="glass-panel p-12 text-center">
          <span className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-ink/6 text-dim">
            <Icon name="wheat" size={28} />
          </span>
          <h3 className="text-base font-semibold text-ink">No farms found</h3>
          <p className="mt-1 text-sm text-mist max-w-sm mx-auto">
            {searchQuery || selectedDistrict !== "all"
              ? "No farms match your search criteria. Try resetting your filters."
              : "No farms registered yet. Open the Mission Control map to draw your first farm boundary."}
          </p>
          <div className="mt-5">
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-b from-emerald-400 to-emerald-600 px-4 py-2 text-sm font-semibold text-abyss shadow-[0_4px_16px_rgba(16,185,129,0.35)]"
            >
              <Icon name="pencil" size={14} />
              Open Map &amp; Draw Farm
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {filteredFarms.map((farm, idx) => (
            <LazyCard key={farm.id} delayMs={Math.min(300, idx * 50)}>
              <div className="glass-card-hover group flex flex-col justify-between p-5 relative overflow-hidden h-full">
                {/* Subtle top glow bar */}
                <div className="absolute top-0 inset-x-0 h-0.5 bg-gradient-to-r from-emerald-500/40 via-brand to-lime-400/40 opacity-0 group-hover:opacity-100 transition-opacity" />

                <div>
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div>
                      <h3 className="text-base font-bold text-ink group-hover:text-brand transition-colors">
                        {farm.name}
                      </h3>
                      <p className="flex items-center gap-1.5 text-xs text-mist mt-0.5">
                        <Icon name="mapPin" size={12} className="text-brand shrink-0" />
                        {farm.district || "Punjab"}, {farm.province}
                      </p>
                    </div>
                    <span className="hud-pill text-emerald-300 border-emerald-400/30 bg-emerald-500/10 shrink-0">
                      Farm #{farm.id}
                    </span>
                  </div>

                  {/* Metrics Grid */}
                  <div className="my-4 grid grid-cols-2 gap-2 rounded-xl border border-ink/6 bg-ink/[0.02] p-3 text-xs">
                    <div>
                      <span className="text-[10px] uppercase font-mono tracking-wider text-dim block">
                        Field Area
                      </span>
                      <span className="text-sm font-semibold tabular-nums text-ink">
                        {farm.area_acres != null ? `${farm.area_acres.toLocaleString()} ac` : "—"}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-mono tracking-wider text-dim block">
                        Centroid
                      </span>
                      <span className="text-xs font-mono text-mist truncate block">
                        {farm.latitude != null && farm.longitude != null
                          ? `${farm.latitude.toFixed(3)}, ${farm.longitude.toFixed(3)}`
                          : "—"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="pt-3 border-t border-ink/6 flex items-center gap-2 mt-auto">
                  <Link
                    href={`/farms/${farm.id}`}
                    className="flex-1 flex items-center justify-center gap-1.5 rounded-lg bg-ink/8 px-3 py-2 text-xs font-semibold text-ink hover:bg-brand hover:text-abyss transition-all shadow-sm"
                  >
                    <Icon name="activity" size={13} />
                    <span>{t("viewAnalytics", "Intelligence")}</span>
                  </Link>
                  <Link
                    href={`/farms/${farm.id}/history`}
                    className="flex items-center justify-center gap-1 rounded-lg border border-ink/10 px-3 py-2 text-xs font-semibold text-mist hover:text-ink hover:border-ink/20 transition-colors"
                    title="View History"
                  >
                    <Icon name="clock" size={13} />
                    <span>{t("viewHistory", "History")}</span>
                  </Link>
                  <button
                    onClick={() => setFarmToDelete(farm)}
                    className="flex items-center justify-center rounded-lg border border-rose-500/20 bg-rose-500/10 px-2.5 py-2 text-xs font-semibold text-rose-400 hover:bg-rose-500/20 hover:text-rose-300 transition-colors"
                    title="Delete Farm Node"
                  >
                    <Icon name="trash" size={13} />
                  </button>
                </div>
              </div>
            </LazyCard>
          ))}
        </div>
      )}

      {/* Custom Confirmation Modal */}
      <ConfirmModal
        isOpen={Boolean(farmToDelete)}
        title="Delete Agricultural Farm Node"
        message={`Are you sure you want to delete "${farmToDelete?.name}"? This action is irreversible and will permanently delete all associated crop cycles, satellite NDVI observations, and AI intelligence records.`}
        confirmText="Delete Farm Node"
        cancelText="Keep Farm"
        isDestructive={true}
        loading={deleting}
        onConfirm={confirmDeleteFarm}
        onClose={() => setFarmToDelete(null)}
      />
    </div>
  );
}
