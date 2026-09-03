"use client";

import React from "react";
import Icon from "./Icon";

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isDestructive?: boolean;
  loading?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

export default function ConfirmModal({
  isOpen,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  isDestructive = true,
  loading = false,
  onConfirm,
  onClose,
}: ConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div
        className={`relative w-full max-w-md rounded-2xl border p-5 sm:p-6 shadow-2xl backdrop-blur-2xl animate-in zoom-in-95 duration-200 ${isDestructive
            ? "border-rose-500/30 bg-panel/95 text-ink"
            : "border-brand/30 bg-panel/95 text-ink"
          }`}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          disabled={loading}
          className="absolute right-4 top-4 flex h-7 w-7 items-center justify-center rounded-lg text-dim hover:bg-ink/10 hover:text-ink transition-colors"
        >
          <Icon name="x" size={14} />
        </button>

        {/* Icon Badge */}
        <div
          className={`mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl ${isDestructive
              ? "bg-rose-500/15 text-rose-400 ring-1 ring-rose-500/30 shadow-[0_0_20px_rgba(244,63,94,0.2)]"
              : "bg-brand/15 text-brand ring-1 ring-brand/30 shadow-[0_0_20px_rgba(52,211,153,0.2)]"
            }`}
        >
          <Icon name={isDestructive ? "trash" : "activity"} size={22} />
        </div>

        {/* Header Content */}
        <div className="text-center">
          <h3 className="text-base font-bold text-ink">{title}</h3>
          <p className="mt-2 text-xs text-mist leading-relaxed">{message}</p>
        </div>

        {/* Action Buttons */}
        <div className="mt-6 flex flex-col-reverse sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="flex-1 rounded-xl border border-ink/10 bg-ink/5 px-4 py-2.5 text-xs font-semibold text-mist hover:bg-ink/10 hover:text-ink transition-colors disabled:opacity-50 text-center"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={`flex-1 flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition-all disabled:opacity-50 text-center ${isDestructive
                ? "bg-gradient-to-b from-rose-500 to-rose-700 text-white shadow-[0_4px_16px_rgba(244,63,94,0.35)] hover:shadow-[0_4px_24px_rgba(244,63,94,0.55)]"
                : "bg-gradient-to-b from-emerald-400 to-emerald-600 text-abyss shadow-[0_4px_16px_rgba(16,185,129,0.35)] hover:shadow-[0_4px_24px_rgba(16,185,129,0.55)]"
              }`}
          >
            {loading && <span className="h-3 w-3 rounded-full border-2 border-white border-r-transparent animate-spin shrink-0" />}
            <span className="whitespace-nowrap">{loading ? "Deleting Node…" : confirmText}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
