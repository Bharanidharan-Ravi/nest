import { formatDate, formatTime } from "../../../app/shared/utils/dateFormat";

const sameDay = (a, b) => a.toDateString() === b.toDateString();

/** "14:05:09" today, "Yesterday", otherwise "12/09/2026". */
export function formatListTime(value) {
  if (!value) return "";
  const date = new Date(value);
  const now = new Date();
  if (sameDay(date, now)) return formatTime(date, "");

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (sameDay(date, yesterday)) return "Yesterday";

  return formatDate(date, "");
}

export const formatMessageTime = (value) => (value ? formatTime(new Date(value), "") : "");

/** Divider label between days in a timeline. */
export function formatDayLabel(value) {
  const date = new Date(value);
  const now = new Date();
  if (sameDay(date, now)) return "Today";
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (sameDay(date, yesterday)) return "Yesterday";
  return formatDate(date, "");
}

export const isSameDay = (a, b) => !!a && !!b && sameDay(new Date(a), new Date(b));
