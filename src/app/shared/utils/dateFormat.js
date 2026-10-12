// The one place the app decides how a date / time is shown to the user.
// Every screen shows dates as "DD/MM/YYYY HH:mm:ss" (24-hour), no matter what
// the browser locale or the server's own format is. Use these helpers instead
// of toLocaleString / toLocaleDateString / dayjs().format("...") for display.
//
// Formats sent to the API ("YYYY-MM-DD", ISO) are not display and stay as they are.

import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";

dayjs.extend(customParseFormat);

export const DATE_FORMAT = "DD/MM/YYYY";
export const TIME_FORMAT = "HH:mm:ss";
export const DATE_TIME_FORMAT = `${DATE_FORMAT} ${TIME_FORMAT}`;

// Server / legacy shapes that dayjs cannot read on its own.
const FALLBACK_PARSE_FORMATS = [
  "DD/MM/YYYY HH:mm:ss",
  "DD/MM/YYYY HH:mm",
  "DD/MM/YYYY",
  "DD-MM-YYYY HH:mm:ss",
  "DD-MM-YYYY HH:mm",
  "DD-MM-YYYY",
  "DD MMM YYYY",
  "D MMM YYYY",
];

/** Date | dayjs | ISO string | timestamp | "DD/MM/YYYY..." -> dayjs, or null when empty / invalid. */
export function toDayjs(value) {
  if (value === null || value === undefined || value === "") return null;
  if (dayjs.isDayjs(value)) return value.isValid() ? value : null;

  if (typeof value === "string") {
    const text = value.trim();
    // "DD/MM/YYYY" and "DD-MM-YYYY" would be misread as month-first, so try them first.
    if (/^\d{1,2}[/-]\d{1,2}[/-]\d{4}/.test(text) || /^\d{1,2} [A-Za-z]{3} \d{4}$/.test(text)) {
      const parsed = dayjs(text, FALLBACK_PARSE_FORMATS, true);
      if (parsed.isValid()) return parsed;
    }
    const parsed = dayjs(text);
    return parsed.isValid() ? parsed : null;
  }

  const parsed = dayjs(value);
  return parsed.isValid() ? parsed : null;
}

/** -> "07/10/2026 14:05:09" */
export function formatDateTime(value, fallback = "-") {
  const d = toDayjs(value);
  return d ? d.format(DATE_TIME_FORMAT) : fallback;
}

/** -> "07/10/2026" (for values that are only a date: due dates, leave days, holidays, DOB...) */
export function formatDate(value, fallback = "-") {
  const d = toDayjs(value);
  return d ? d.format(DATE_FORMAT) : fallback;
}

/** Date-like value or a bare "HH:mm" / "HH:mm:ss" / "h:mm AM" time -> "14:05:09" */
export function formatTime(value, fallback = "-") {
  if (typeof value === "string") {
    const match = /^(\d{1,2}):(\d{2})(?::(\d{2}))?(?:\.\d+)?\s*(AM|PM)?$/i.exec(value.trim());
    if (match) {
      let hours = Number(match[1]);
      const meridiem = match[4]?.toUpperCase();
      if (meridiem === "PM" && hours < 12) hours += 12;
      if (meridiem === "AM" && hours === 12) hours = 0;
      return `${String(hours).padStart(2, "0")}:${match[2]}:${match[3] ?? "00"}`;
    }
  }
  const d = toDayjs(value);
  return d ? d.format(TIME_FORMAT) : fallback;
}

/** Two dates -> "07/10/2026 - 09/10/2026", or a single date when both are the same day. */
export function formatDateRange(start, end, fallback = "-") {
  const from = formatDate(start, "");
  const to = formatDate(end, "");
  if (!from) return fallback;
  return !to || from === to ? from : `${from} - ${to}`;
}
