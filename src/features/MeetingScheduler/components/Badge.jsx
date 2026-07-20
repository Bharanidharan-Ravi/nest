// src/shared/ui/Badge.jsx
import React from "react";

/** Generic small pill, used for booking type, recurrence label, tags, etc. */
export function Pill({ children, tone = "neutral", icon: Icon, className = "" }) {
  const tones = {
    neutral: "bg-gray-50 text-gray-600 border-gray-200",
    amber: "bg-amber-50 text-amber-700 border-amber-200",
    blue: "bg-blue-50 text-blue-700 border-blue-200",
  };
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-md border px-1  text-[10px] font-small capitalize ${tones[tone]} ${className}`}
    >
      {Icon && <Icon size={10} />}
      {children}
    </span>
  );
}

const STATUS_TONES = {
  Scheduled: "bg-blue-50 text-blue-700 border-blue-200 ring-blue-200",
  Completed: "bg-emerald-50 text-emerald-700 border-emerald-200 ring-emerald-200",
  Cancelled: "bg-red-50 text-red-700 border-red-200 ring-red-200",
};
const DEFAULT_STATUS_TONE = "bg-gray-50 text-gray-600 border-gray-200 ring-gray-200";

/** Status pill (Scheduled / Completed / Cancelled / fallback) with consistent styling everywhere. */
export function StatusBadge({ status, className = "" }) {
  return (
    <span
      className={`inline-flex items-center rounded-md border px-1 text-[10px] font-small ring-1 ${
        STATUS_TONES[status] ?? DEFAULT_STATUS_TONE
      } ${className}`}
    >
      {status ?? "Unknown"}
    </span>
  );
}
