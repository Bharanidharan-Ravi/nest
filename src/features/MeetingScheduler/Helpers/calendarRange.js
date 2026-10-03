// Date ranges for the calendar views. Meetings are loaded for the list's
// "weekRange" filter ("yyyy-MM-dd~yyyy-MM-dd"), so each calendar view keeps
// that filter set to exactly the days it shows.
import {
  addDays,
  addMonths,
  addWeeks,
  differenceInCalendarDays,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  startOfDay,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { parseDay } from "./dateTime";

const CALENDAR_VIEWS = ["Day", "Week", "Month"];
export const isCalendarView = (view) => CALENDAR_VIEWS.includes(view);

const toKey = (date) => format(date, "yyyy-MM-dd");

/** "2026-09-28~2026-10-04" -> { start, end } at local midnight. Today when empty or invalid. */
export function parseRangeValue(value) {
  const [startText, endText] = String(value || "").split("~");
  const start = parseDay(startText);
  if (!start) {
    const today = startOfDay(new Date());
    return { start: today, end: today };
  }
  const end = parseDay(endText);
  return { start, end: end && end >= start ? end : start };
}

/** { start, end } -> "2026-09-28~2026-10-04" */
export const toRangeValue = ({ start, end }) => `${toKey(start)}~${toKey(end)}`;

export const sameRange = (a, b) => toRangeValue(a) === toRangeValue(b);

export function rangeContains({ start, end }, date) {
  const key = toKey(date);
  return key >= toKey(start) && key <= toKey(end);
}

export const daysInRange = ({ start, end }) => eachDayOfInterval({ start, end });

/** The days a view shows around `anchor`. Month includes the leading / trailing days of its grid. */
export function rangeForView(view, anchor) {
  if (view === "Day") return { start: startOfDay(anchor), end: startOfDay(anchor) };
  if (view === "Week") return { start: startOfWeek(anchor), end: startOfDay(endOfWeek(anchor)) };
  return {
    start: startOfWeek(startOfMonth(anchor)),
    end: startOfDay(endOfWeek(endOfMonth(anchor))),
  };
}

/**
 * The date a view is centred on, read back from the loaded range. A month
 * grid starts in the previous month, so Month uses the middle of the range.
 */
export function anchorFromRange(view, { start, end }) {
  if (view !== "Month") return start;
  return addDays(start, Math.floor(differenceInCalendarDays(end, start) / 2));
}

/** One step back (-1) or forward (+1) in the view's unit. */
export function shiftAnchor(view, anchor, step) {
  if (view === "Day") return addDays(anchor, step);
  if (view === "Week") return addWeeks(anchor, step);
  return addMonths(anchor, step);
}

/** Header text: "Thu, 1 Oct 2026", "27 Sep – 3 Oct 2026", "October 2026". */
export function rangeLabel(view, anchor) {
  if (view === "Day") return format(anchor, "EEE, d MMM yyyy");
  if (view === "Month") return format(anchor, "MMMM yyyy");

  const { start, end } = rangeForView("Week", anchor);
  if (start.getFullYear() !== end.getFullYear()) {
    return `${format(start, "d MMM yyyy")} – ${format(end, "d MMM yyyy")}`;
  }
  if (start.getMonth() !== end.getMonth()) {
    return `${format(start, "d MMM")} – ${format(end, "d MMM yyyy")}`;
  }
  return `${format(start, "d")} – ${format(end, "d MMM yyyy")}`;
}
