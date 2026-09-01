"use client";

import React from "react";

interface SkeletonCardProps {
  height?: string;
  rows?: number;
  className?: string;
}

export default function SkeletonCard({
  height = "h-48",
  rows = 3,
  className = "",
}: SkeletonCardProps) {
  return (
    <div
      className={`glass-panel p-5 relative overflow-hidden flex flex-col justify-between ${height} ${className}`}
    >
      <div className="space-y-3">
        {/* Header bar skeleton */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-lg skeleton-box" />
            <div className="h-4 w-32 rounded-md skeleton-box" />
          </div>
          <div className="h-4 w-16 rounded-full skeleton-box" />
        </div>

        {/* Dynamic content lines */}
        <div className="space-y-2 pt-2">
          {Array.from({ length: rows }).map((_, i) => (
            <div
              key={i}
              className={`h-3.5 rounded-md skeleton-box ${
                i === 0 ? "w-full" : i === 1 ? "w-4/5" : "w-3/5"
              }`}
            />
          ))}
        </div>
      </div>

      {/* Footer skeleton pill */}
      <div className="flex items-center justify-between pt-4 border-t border-ink/6">
        <div className="h-3 w-24 rounded skeleton-box" />
        <div className="h-6 w-20 rounded-lg skeleton-box" />
      </div>
    </div>
  );
}
