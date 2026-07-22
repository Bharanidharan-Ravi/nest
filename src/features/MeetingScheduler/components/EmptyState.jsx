// src/shared/ui/EmptyState.jsx
import React from "react";
import { Calendar } from "lucide-react";

/**
 * Standard "nothing here" state. Accepts any lucide icon so it can be reused
 * outside the scheduler (e.g. empty ticket list, empty search results) —
 * previously this markup was hardcoded once in ListView with a fixed message.
 */
export function EmptyState({
  icon: Icon = Calendar,
  title = "Nothing to show",
  description,
  className = "",
}) {
  return (
    <div
      className={`h-full flex flex-col items-center justify-center gap-2 bg-gray-50 p-10 text-center `}
    >
      <Icon size={28} className="text-gray-300" aria-hidden="true" />
      <p className="text-sm font-medium text-gray-500">{title}</p>
      {description && <p className="text-xs text-gray-400">{description}</p>}
    </div>
  );
}
