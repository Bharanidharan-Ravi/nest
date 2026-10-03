// Expands meeting rows into the calendar days they actually occur on.
// A recurring meeting is stored once, with valid_from_date / valid_to_date
// and (for WEEKLY) a "days_of_week" bitmask, so the calendar views can't
// just group by meeting_date — that is only meaningful for ONETIME meetings.
import { datePart, parseDay, toDayKey, toMinutes } from "./dateTime";

const OPEN_ENDED_DATE = "9999-12-31";
const CANCELLED = "Cancelled";

// Times per day is disabled for now.
// export const isTwiceADay = (meeting) =>
//   meeting?.recurrence_type === "WEEKLY" &&
//   Number(meeting?.times_per_day) === 2 &&
//   !!meeting?.second_start_time;

function occursOn(meeting, dayKey, weekday) {
  const type = meeting.recurrence_type?.toUpperCase();

  if (!type || type === "ONETIME") {
    return datePart(meeting.meeting_date) === dayKey;
  }

  const from = datePart(meeting.valid_from_date) || datePart(meeting.meeting_date);
  const to = datePart(meeting.valid_to_date) || OPEN_ENDED_DATE;
  if (!from || dayKey < from || dayKey > to) return false;

  if (type === "WEEKLY") {
    return meeting.days_of_week?.[weekday] === "1";
  }
  return type === "DAILY";
}

/** One entry per time slot the meeting has on a given day. */
function slotsFor(meeting, dayKey, status = meeting.status) {
  const slots = [{ start_time: meeting.start_time, end_time: meeting.end_time }];
  // Times per day is disabled for now.
  // if (isTwiceADay(meeting)) {
  //   slots.push({ start_time: meeting.second_start_time, end_time: meeting.second_end_time });
  // }
  return slots.map((slot, index) => ({
    ...meeting,
    ...slot,
    status,
    occurrence_date: dayKey,
    occurrence_key: `${meeting.meeting_id}|${dayKey}|${index}`,
    // The untouched row, so edit/complete actions never see the slot's times.
    source: meeting,
  }));
}

export const isRecurring = (meeting) =>
  ["DAILY", "WEEKLY"].includes(meeting?.recurrence_type?.toUpperCase());

/**
 * The next day ("yyyy-MM-dd") a sidebar "Upcoming Meetings" row occurs on,
 * today or later. Its Date is "yyyy-MM-dd" for a one-time meeting and
 * "from - to" for a repeating one (to is empty when open-ended).
 */
export function nextUpcomingDay(meeting, today = new Date()) {
  const [from, to] = String(meeting?.Date ?? "").split(/\s+-\s*/);
  const first = parseDay(from);
  if (!first) return null;

  const row = isRecurring(meeting)
    ? { ...meeting, valid_from_date: from, valid_to_date: to }
    : { ...meeting, meeting_date: from };
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const day = first > todayStart ? first : todayStart;
  // Any 7 days in a row cover every weekday.
  for (let i = 0; i < 7; i += 1) {
    const dayKey = toDayKey(day);
    if (occursOn(row, dayKey, day.getDay())) return dayKey;
    day.setDate(day.getDate() + 1);
  }
  return from;
}

/**
 * When a cancelled meeting was cancelled, or null. The API stamps updated_at
 * (UTC, usually without a "Z") on cancel, and a cancelled meeting can't be
 * edited afterwards, so it stays the cancel time.
 */
export function cancelledAt(meeting) {
  if (meeting?.status !== CANCELLED || !meeting.updated_at) return null;
  const text = String(meeting.updated_at).trim().replace(" ", "T");
  const date = new Date(/(Z|[+-]\d{2}:?\d{2})$/i.test(text) ? text : `${text}Z`);
  return Number.isNaN(date.getTime()) ? null : date;
}

/**
 * The day a cancelled DAILY / WEEKLY meeting was cancelled for ("yyyy-MM-dd"):
 * its first day that had not started yet when it was cancelled. Null when no
 * day was left by then.
 */
function cancelledDay(meeting, at) {
  const from = parseDay(datePart(meeting.valid_from_date) || datePart(meeting.meeting_date));
  const to = datePart(meeting.valid_to_date) || OPEN_ENDED_DATE;
  const startMinutes = toMinutes(meeting.start_time) ?? 0;

  const cancelDay = new Date(at.getFullYear(), at.getMonth(), at.getDate());
  const day = from && from > cancelDay ? from : cancelDay;
  // Any 7 days in a row cover every weekday, so 8 days from the cancel day are enough.
  for (let i = 0; i < 8; i += 1) {
    const dayKey = toDayKey(day);
    if (dayKey > to) return null;
    const start = new Date(day.getFullYear(), day.getMonth(), day.getDate(), 0, startMinutes);
    if (occursOn(meeting, dayKey, day.getDay()) && start >= at) return dayKey;
    day.setDate(day.getDate() + 1);
  }
  return null;
}

/**
 * dayKey -> the status to show that day, or null to leave the day out.
 * A DAILY / WEEKLY meeting cancelled part way through still took place before
 * that, so those days stay "Scheduled"; the day it was cancelled for shows
 * "Cancelled", and the days after it are left out.
 */
function statusByDay(meeting) {
  const at = isRecurring(meeting) ? cancelledAt(meeting) : null;
  if (!at) return () => meeting.status;

  const stopDay = cancelledDay(meeting, at);
  return (dayKey) => {
    if (!stopDay || dayKey < stopDay) return "Scheduled";
    return dayKey === stopDay ? CANCELLED : null;
  };
}

/**
 * The days a recurring meeting ran on, up to and including lastDay,
 * newest first ("yyyy-MM-dd"), at most `max` of them.
 */
export function occurrenceDatesUpTo(meeting, lastDay = new Date(), max = 30) {
  if (!isRecurring(meeting)) return [];

  const from = datePart(meeting.valid_from_date) || datePart(meeting.meeting_date);
  const to = datePart(meeting.valid_to_date) || OPEN_ENDED_DATE;
  const lastKey = toDayKey(lastDay);
  const day = new Date(`${lastKey < to ? lastKey : to}T00:00:00`);

  const dates = [];
  while (dates.length < max) {
    const dayKey = toDayKey(day);
    if (!from || dayKey < from) break;
    if (occursOn(meeting, dayKey, day.getDay())) dates.push(dayKey);
    day.setDate(day.getDate() - 1);
  }
  return dates;
}

/**
 * Builds { "yyyy-MM-dd": occurrence[] } for the given calendar days.
 * Each occurrence is the meeting row with start_time/end_time set to that
 * slot and status set for that day, sorted by start time within the day.
 */
export function groupOccurrencesByDate(meetings = [], days = []) {
  const rows = meetings.filter(Boolean).map((meeting) => ({ meeting, statusOn: statusByDay(meeting) }));
  const byDate = {};
  days.forEach((day) => {
    const dayKey = toDayKey(day);
    const weekday = day.getDay();
    const occurrences = rows
      .filter(({ meeting }) => occursOn(meeting, dayKey, weekday))
      .flatMap(({ meeting, statusOn }) => {
        const status = statusOn(dayKey);
        return status ? slotsFor(meeting, dayKey, status) : [];
      })
      .sort((a, b) => (a.start_time ?? "").localeCompare(b.start_time ?? ""));
    if (occurrences.length) byDate[dayKey] = occurrences;
  });
  return byDate;
}
