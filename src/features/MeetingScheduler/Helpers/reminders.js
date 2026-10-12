// Which of today's meetings the user should be reminded about right now.
// Pure, so it can be tested without a clock or a browser.
//
// A meeting is in one of two phases, worked out from the clock:
//   soon   starts within REMINDER_LEAD_MINUTES
//   live   already started, not ended yet (the user opened the app late)
// A meeting that already ended is not reminded about.

import { safeParseList, sameId } from "./common";
import { minutesToTime, toDayKey, toMinutes } from "./dateTime";
import { upcomingOccursOn } from "./meetingValidation";

/** The reminder pops up this many minutes before a meeting starts. */
export const REMINDER_LEAD_MINUTES = 5;

const INACTIVE_STATUSES = ["Completed", "Cancelled"];

/** "10:00 - 10:30" -> ["10:00", "10:30"] */
const timesInText = (text) => String(text ?? "").match(/\d{1,2}:\d{2}/g) ?? [];

/** An upcoming row's start / end in minutes: start_time / end_time, else the "Time" text. */
function slotOf(meeting) {
  const [textStart, textEnd] = timesInText(meeting?.Time);
  const start = toMinutes(String(meeting?.start_time ?? textStart ?? ""));
  const end = toMinutes(String(meeting?.end_time ?? textEnd ?? ""));
  return { start, end: end != null && start != null && end > start ? end : null };
}

/** The row plus its start / end as minutes and "HH:mm" (start can be null when unknown). */
const withSlot = (meeting, start, end) => ({
  ...meeting,
  startsAt: start,
  endsAt: end,
  startLabel: start == null ? null : minutesToTime(start),
  endLabel: end == null ? null : minutesToTime(end),
});

/** The organizer or a participant. Without a user id nothing is filtered out. */
function involvesUser(meeting, userId) {
  if (userId == null) return true;
  return (
    sameId(meeting.Organizer_Id, userId) ||
    safeParseList(meeting.Participants).some((p) => sameId(p.participant_id, userId))
  );
}

/** "soon" | "live" for a reminder item at `now`. */
export function phaseOf(item, now = new Date()) {
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  return nowMinutes < item.startsAt ? "soon" : "live";
}

/**
 * Today's meetings the user organizes or attends that are not completed or
 * cancelled, whatever the time (the header calendar count). Completing a
 * meeting takes it out, since a completed meeting is gone from the list.
 */
export function todaysMeetings(meetings, now = new Date(), userId = null) {
  const dayKey = toDayKey(now);
  return (meetings ?? []).flatMap((meeting) => {
    if (!meeting || INACTIVE_STATUSES.includes(meeting.status)) return [];
    if (!involvesUser(meeting, userId) || !upcomingOccursOn(meeting, dayKey)) return [];
    const { start, end } = slotOf(meeting);
    return [withSlot(meeting, start, end)];
  });
}

/**
 * Today's meetings the user is part of that are in the reminder window or
 * already running / over. Each has a `reminderKey` that is the same for that
 * day's occurrence of that meeting, so it is only reminded once.
 */
export function dueMeetings(meetings, now = new Date(), userId = null, lead = REMINDER_LEAD_MINUTES) {
  const dayKey = toDayKey(now);
  const nowMinutes = now.getHours() * 60 + now.getMinutes();

  return (meetings ?? []).flatMap((meeting) => {
    if (!meeting || INACTIVE_STATUSES.includes(meeting.status)) return [];
    if (!involvesUser(meeting, userId)) return [];

    const { start, end } = slotOf(meeting);
    if (start == null || start - nowMinutes > lead) return [];
    // Already over: no reminder. No end time known: counts as running all day
    if (end != null && nowMinutes >= end) return [];
    if (!upcomingOccursOn(meeting, dayKey)) return [];

    return [{ ...withSlot(meeting, start, end), reminderKey: `${meeting.meeting_id}|${dayKey}|${start}` }];
  });
}

/** The line under the title, from the clock rather than a stored count. */
export function reminderLabel(item, now = new Date()) {
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const phase = phaseOf(item, now);

  if (phase === "soon") {
    const left = item.startsAt - nowMinutes;
    return left <= 0 ? "Starting now" : `Starts in ${left} minute${left === 1 ? "" : "s"}`;
  }
  const ago = nowMinutes - item.startsAt;
  return ago <= 0 ? "Starting now" : `In progress, started ${ago} minute${ago === 1 ? "" : "s"} ago`;
}
