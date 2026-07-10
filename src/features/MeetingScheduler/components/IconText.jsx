// src/shared/ui/IconText.jsx
import React from "react";

/** Icon + text, the single most repeated pattern across the scheduler views. */
export function IconText({ icon: Icon, size = 12, className = "", children }) {
  return (
    <span className={`inline-flex items-center gap-1 ${className}`}>
      <Icon size={size} />
      <span>{children}</span>
    </span>
  );
}

/** Icon + value "tile" used in the expanded meeting details row. */
export function InfoTile({ icon: Icon, value, hint }) {
  return (
    <div
      className="flex items-center gap-2 rounded-lg border border-gray-100 bg-gray-50/70 px-3 py-2"
      title={hint}
    >
      <Icon size={14} className="text-amber-500 shrink-0" />
      <span className="text-xs font-medium text-gray-700 truncate">{value || "-"}</span>
    </div>
  );
}
