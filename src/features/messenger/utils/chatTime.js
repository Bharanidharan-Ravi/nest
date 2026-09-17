const sameDay = (a, b) => a.toDateString() === b.toDateString();

/** "14:05" today, "Yesterday", "Mon" this week, otherwise "12 Sep". */
export function formatListTime(value) {
  if (!value) return "";
  const date = new Date(value);
  const now = new Date();
  if (sameDay(date, now)) return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (sameDay(date, yesterday)) return "Yesterday";

  if (now - date < 6 * 24 * 60 * 60 * 1000) return date.toLocaleDateString([], { weekday: "short" });
  return date.toLocaleDateString([], { day: "2-digit", month: "short" });
}

export const formatMessageTime = (value) =>
  value ? new Date(value).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "";

/** Divider label between days in a timeline. */
export function formatDayLabel(value) {
  const date = new Date(value);
  const now = new Date();
  if (sameDay(date, now)) return "Today";
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (sameDay(date, yesterday)) return "Yesterday";
  return date.toLocaleDateString([], { weekday: "long", day: "numeric", month: "long", year: "numeric" });
}

export const isSameDay = (a, b) => !!a && !!b && sameDay(new Date(a), new Date(b));
