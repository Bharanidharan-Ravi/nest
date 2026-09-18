import { useState } from "react";

const COLORS = [
  "bg-amber-200 text-amber-900",
  "bg-sky-200 text-sky-900",
  "bg-emerald-200 text-emerald-900",
  "bg-rose-200 text-rose-900",
  "bg-violet-200 text-violet-900",
  "bg-lime-200 text-lime-900",
  "bg-orange-200 text-orange-900",
  "bg-teal-200 text-teal-900",
];

export function colorFor(seed) {
  let hash = 0;
  for (const ch of String(seed ?? "")) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  return COLORS[hash % COLORS.length];
}

export function initials(name) {
  const parts = String(name ?? "").trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "?";
  return (parts[0][0] + (parts.length > 1 ? parts[parts.length - 1][0] : "")).toUpperCase();
}

const SIZES = { sm: "h-7 w-7 text-[11px]", md: "h-9 w-9 text-xs", lg: "h-10 w-10 text-sm", xl: "h-20 w-20 text-xl" };

/** Employee photo when one's on file (master's PreviewUrl), otherwise initials on a stable color. */
export default function ChatAvatar({ name, seed, size = "md", photoUrl = null }) {
  const [broken, setBroken] = useState(false);

  if (photoUrl && !broken) {
    return (
      <img
        src={photoUrl}
        alt={name || ""}
        onError={() => setBroken(true)}
        className={`${SIZES[size]} shrink-0 rounded-full object-cover`}
      />
    );
  }

  return (
    <span
      className={`${SIZES[size]} ${colorFor(seed ?? name)} shrink-0 rounded-full flex items-center justify-center font-semibold select-none`}
      aria-hidden="true"
    >
      {initials(name)}
    </span>
  );
}
