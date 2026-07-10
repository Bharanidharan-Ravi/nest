// src/features/meeting-scheduler/constants.js

export const VIEW_MODES = ["List", "Month", "Week"];

export const WEEKDAY_LABELS_SHORT = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

// Visible calendar hours in WeekView (10:00 - 18:00). Pulled out as a
// constant instead of a magic Array.from(...) so it's obvious what it
// controls and easy to extend to a configurable office-hours range later.
export const WEEK_VIEW_START_HOUR = 10;
export const WEEK_VIEW_HOUR_COUNT = 9;

// Left border color used on calendar/list meeting chips, keyed by status.
export const STATUS_BAR_COLOR = {
  Scheduled: "bg-blue-50 border-l-4 border-blue-500",
  Completed: "bg-green-50 border-l-4 border-green-500",
  Cancelled: "bg-red-50 border-l-4 border-red-500",
};
export const DEFAULT_STATUS_BAR_COLOR = "bg-sky-50 border-l-4 border-sky-400";
