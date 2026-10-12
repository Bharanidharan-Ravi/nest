/** "2026-06-04" from a Date object */
export const dateKey = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

import { formatTime } from "../../../app/shared/utils/dateFormat";

/** "09:00:00" from "09:00" */
export const fmtTime = (t) => formatTime(t, "");

/** "AB" from "AnbuMani" */
export const initials = (name) =>
  name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

/** Deterministic Tailwind colour pair for an avatar */
export const avatarColor = (name) => {
  const palette = [
    "bg-blue-100 text-blue-700",
    "bg-emerald-100 text-emerald-700",
    "bg-amber-100 text-amber-700",
    "bg-rose-100 text-rose-700",
    "bg-violet-100 text-violet-700",
    "bg-teal-100 text-teal-700",
  ];
  let sum = 0;
  for (const c of name) sum += c.charCodeAt(0);
  return palette[sum % palette.length];
};

/** Group an array of events by their start-hour integer */
export const groupByHour = (events) => {
  const map = {};
  for (const e of events) {
    const h = parseInt((e.start_time || "08:00").split(":")[0], 10);
    if (!map[h]) map[h] = [];
    map[h].push(e);
  }
  return map;
};
