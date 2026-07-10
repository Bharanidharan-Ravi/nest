// src/shared/lib/datetime.js
// Centralized date/time formatting so every scheduler component agrees on
// how a Date, an "HH:mm:ss" string, and a "days_of_week" bitmask are shown.

// const WEEKDAY_LABELS_SHORT = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const WEEKDAY_LABELS_LONG = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/** "14:30:00" -> "2:30 PM" */
export function formatTime12h(time) {
  if (!time) return "-";
  const [hoursStr, minutesStr] = time.split(":");
  const hours = Number(hoursStr);
  if (Number.isNaN(hours)) return "-";
  const period = hours >= 12 ? "PM" : "AM";
  const hour12 = hours % 12 || 12;
  return `${hour12}:${minutesStr ?? "00"} ${period}`;
}

/** "14:30:00" -> "14:30" (used for compact table/list rendering) */
export function formatTime24h(time) {
  if (!time) return "-";
  return time.slice(0, 5);
}

/** "yyyy-MM-dd" | Date | ISO string -> "04 Jul 2026" */
export function formatDate(value) {
  if (!value) return "-";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

/** "01:30:00" (HH:mm:ss) slot duration -> "1h 30m" */
export function formatDuration(slot) {
  if (!slot) return "-";
  const [h, m] = slot.split(":").map(Number);
  const bits = [];
  if (h) bits.push(`${h}h`);
  if (m) bits.push(`${m}m`);
  return bits.length ? bits.join(" ") : "-";
}

/** "1010100" -> ["Sun", "Wed", "Fri"] */
export function binaryToDaysList(binary) {
  if (!binary || typeof binary !== "string") return [];
  return binary
    .split("")
    .map((bit, index) => (bit === "1" ? WEEKDAY_LABELS_LONG[index] : null))
    .filter(Boolean);
}

export {  WEEKDAY_LABELS_LONG };
