// Dates and times for the whole scheduler: parsing ("HH:mm", "yyyy-MM-dd"),
// day keys, and how dates, times, durations and weekdays are shown.

const WEEKDAY_LABELS_LONG = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const pad2 = (number) => String(number).padStart(2, "0");

// ---------------------------------------------------------------------------
// Times of day
// ---------------------------------------------------------------------------

/** "9:30" | "09:30" | "09:30:00" -> 570. Null when it is not a real time. */
export function toMinutes(value) {
  if (typeof value !== "string") return null;
  const match = /^(\d{1,2}):(\d{2})(?::\d{2})?$/.exec(value.trim());
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  return hours <= 23 && minutes <= 59 ? hours * 60 + minutes : null;
}

/** 570 -> "09:30" */
export const minutesToTime = (minutes) => `${pad2(Math.floor(minutes / 60))}:${pad2(minutes % 60)}`;

/** The current time as "HH:mm". */
export function nowTime() {
  const now = new Date();
  return minutesToTime(now.getHours() * 60 + now.getMinutes());
}

// ---------------------------------------------------------------------------
// Days
// ---------------------------------------------------------------------------

/** Local "yyyy-MM-dd" (toISOString would give the UTC date, a day off early in the morning). */
export const toDayKey = (date) => `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;

export const todayKey = () => toDayKey(new Date());

/** "2026-07-15T00:00:00" -> "2026-07-15" ("" when empty) */
export const datePart = (value) => (value ? String(value).split("T")[0] : "");

/** "2026-09-29" | "2026-09-29T00:00:00" -> Date at local midnight. Null when invalid. */
export function parseDay(value) {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(typeof value === "string" ? value : "");
  if (!match) return null;
  const [year, month, day] = [Number(match[1]), Number(match[2]), Number(match[3])];
  const date = new Date(year, month - 1, day);
  // Rejects dates like 2026-02-31 that roll over into the next month.
  return date.getMonth() === month - 1 && date.getDate() === day ? date : null;
}

// ---------------------------------------------------------------------------
// Display
// ---------------------------------------------------------------------------

/** "14:30:00" -> "14:30" (used for compact table/list rendering) */
export function formatTime24h(time) {
  if (!time) return "-";
  return time.slice(0, 5);
}

const formatDay = (date) =>
  date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

/** "yyyy-MM-dd" | Date | ISO string -> "04 Jul 2026" */
export function formatDate(value) {
  if (!value) return "-";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return formatDay(date);
}

/**
 * "2026-07-15~2026-07-15" -> "15 Jul 2026"
 * "2026-07-15~2026-07-19" -> "15 Jul 2026 - 19 Jul 2026"
 */
export function formatDateRange(range) {
  if (!range) return "-";
  const parts = range.includes("~")
    ? range.split("~")
    : range.split(/\s+-\s+/);
  const [start, end] = parts;

  if (!start) return "-";

  const startDate = new Date(start);
  const endDate = end ? new Date(end) : startDate;

  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
    return "-";
  }
  const startFormatted = formatDay(startDate);
  const endFormatted = formatDay(endDate);

  return startFormatted === endFormatted
    ? startFormatted
    : `${startFormatted} - ${endFormatted}`;
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
