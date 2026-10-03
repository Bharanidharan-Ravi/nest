// Validation rules for the meeting form. Each rule is a plain function that
// returns true when the value is fine, or the message to show under the field.
// Field names below are the form's (formData) names, e.g. "validate_From".

import { idKey, safeParseList, sameId } from "./common";
import { formatDate, minutesToTime, parseDay, toDayKey, todayKey, toMinutes } from "./dateTime";

/** Earliest allowed meeting start (office opens at 10:00). */
export const OFFICE_START_MINUTES = 10 * 60;
/** Longest allowed Validate From -> Validate To span for daily / weekly meetings. */
const MAX_RECURRENCE_DAYS = 366;
const TITLE_MAX_LENGTH = 255; // MeetingMaster.title

const DAY_MS = 24 * 60 * 60 * 1000;
const INACTIVE_STATUSES = ["Completed", "Cancelled"];

const daysBetween = (from, to) => Math.round((to - from) / DAY_MS);
const recurrenceOf = (data) => data?.recurrence_type?.value?.id ?? "ONETIME";
// Times per day is disabled for now.
// const hasSecondSlot = (data) => recurrenceOf(data) === "WEEKLY" && data?.times_Per_Day?.value?.id === 2;

// ---------------------------------------------------------------------------
// What the meeting being entered covers
// ---------------------------------------------------------------------------

/** Every "yyyy-MM-dd" the meeting in the form would take place on. */
function formOccurrenceDays(data) {
  const type = recurrenceOf(data);
  if (type === "ONETIME") {
    const day = parseDay(data?.meeting_Date);
    return day ? [toDayKey(day)] : [];
  }

  const from = parseDay(data?.validate_From);
  const to = parseDay(data?.validate_To);
  if (!from || !to || to < from || daysBetween(from, to) > MAX_RECURRENCE_DAYS) return [];

  const bits = data?.days_of_Week ?? "";
  const days = [];
  for (const day = new Date(from); day <= to; day.setDate(day.getDate() + 1)) {
    if (type === "WEEKLY" && bits[day.getDay()] !== "1") continue;
    days.push(toDayKey(day));
  }
  return days;
}

/** The meeting's time slots as [startMinutes, endMinutes] pairs. */
function formSlots(data) {
  const slots = [];
  const start = toMinutes(data?.start_time);
  const end = toMinutes(data?.end_time);
  if (start != null && end != null && end > start) slots.push([start, end]);

  // Times per day is disabled for now.
  // if (hasSecondSlot(data)) {
  //   const start2 = toMinutes(data?.second_Start_Time);
  //   const end2 = toMinutes(data?.second_End_Time);
  //   if (start2 != null && end2 != null && end2 > start2) slots.push([start2, end2]);
  // }
  return slots;
}

/** Host + participants picked in the form, as { id (lower-case) -> name }. */
function formPeople(data) {
  const people = new Map();
  const add = (option) => {
    const id = option?.value?.id;
    if (id) people.set(idKey(id), option.label ?? option.value?.name ?? "A participant");
  };
  add(data?.host_Name);
  (data?.internalParticipants ?? []).forEach(add);
  (data?.clientParticipants ?? []).forEach(add);
  return people;
}

// ---------------------------------------------------------------------------
// Existing meetings (context.upcomingMeetings, from Sp_GetUpcomingMeetings)
// ---------------------------------------------------------------------------

/** Upcoming "Date" is "2026-07-15", "2026-07-15~2026-07-19" or "2026-07-15 - 2026-07-19". */
function upcomingRange(dateText) {
  const [start, end] = String(dateText ?? "").split(/~| - /).map((part) => part.trim());
  const from = parseDay(start);
  return from ? [from, parseDay(end) ?? from] : null;
}

function upcomingOccursOn(meeting, dayKey) {
  const range = upcomingRange(meeting.Date);
  const day = parseDay(dayKey);
  if (!range || !day || day < range[0] || day > range[1]) return false;
  if (String(meeting.recurrence_type).toUpperCase() === "WEEKLY" && meeting.days_of_week) {
    return meeting.days_of_week[day.getDay()] === "1";
  }
  return true;
}

/**
 * The first existing meeting that shares a person and overlaps in date and
 * time with the meeting in the form, or null. Skips the meeting being edited
 * and meetings that are completed or cancelled.
 */
export function findConflict(data, context) {
  const upcoming = context?.upcomingMeetings ?? [];
  if (!upcoming.length) return null;

  const days = formOccurrenceDays(data);
  const slots = formSlots(data);
  const people = formPeople(data);
  if (!days.length || !slots.length || !people.size) return null;

  for (const meeting of upcoming) {
    // The meeting being edited can't clash with itself.
    if (!meeting || sameId(meeting.meeting_id, context?.meetingId)) continue;
    if (INACTIVE_STATUSES.includes(meeting.status)) continue;

    const theirStart = toMinutes(meeting.start_time);
    const theirEnd = toMinutes(meeting.end_time);
    if (theirStart == null || theirEnd == null) continue;
    if (!slots.some(([start, end]) => start < theirEnd && end > theirStart)) continue;

    const theirPeople = [meeting.Organizer_Id, ...safeParseList(meeting.Participants).map((p) => p.participant_id)]
      .filter(Boolean)
      .map(idKey);
    const sharedId = theirPeople.find((id) => people.has(id));
    if (!sharedId) continue;

    const day = days.find((dayKey) => upcomingOccursOn(meeting, dayKey));
    if (day) {
      return {
        name: people.get(sharedId),
        day,
        title: meeting.title,
        start: minutesToTime(theirStart),
        end: minutesToTime(theirEnd),
      };
    }
  }
  return null;
}

// ---------------------------------------------------------------------------
// Field rules
// ---------------------------------------------------------------------------

export function validateTitle(value) {
  if (!value) return true;
  const title = value.trim();
  if (!title) return "Meeting title is required";
  return title.length <= TITLE_MAX_LENGTH ? true : `Meeting title must be ${TITLE_MAX_LENGTH} characters or fewer`;
}

/** A real date, and (for new meetings) not before today. */
export function validateDateNotPast(label) {
  return (value, data, context) => {
    if (!value) return true;
    const day = parseDay(value);
    if (!day) return "Enter a valid date";
    if (!context?.isEditMode && toDayKey(day) < todayKey()) return `${label} cannot be in the past`;
    return true;
  };
}

export function validateValidTo(value, data) {
  if (!value) return true;
  const to = parseDay(value);
  if (!to) return "Enter a valid date";
  const from = parseDay(data?.validate_From);
  if (!from) return true;
  if (to < from) return "Validate To must be on or after Validate From";
  if (daysBetween(from, to) > MAX_RECURRENCE_DAYS) return "The date range can be at most 1 year";
  return true;
}

export function validateStartTime(value, data, context) {
  if (!value) return true;
  const start = toMinutes(value);
  if (start == null) return "Enter a valid time, like 10:30";
  if (start < OFFICE_START_MINUTES) return "Start Time cannot be before 10:00 AM";

  if (!context?.isEditMode && recurrenceOf(data) === "ONETIME" && parseDay(data?.meeting_Date)
      && toDayKey(parseDay(data.meeting_Date)) === todayKey()) {
    const now = new Date();
    if (start < now.getHours() * 60 + now.getMinutes()) return "Start Time cannot be earlier than now";
  }

  const conflict = findConflict(data, context);
  return conflict ? describeConflict(conflict) : true;
}

/** "Akash is already booked in "Sprint sync" on 30 Sep 2026, 10:00–10:30" */
export function describeConflict(conflict) {
  return `${conflict.name} is already booked in "${conflict.title}" on ${formatDate(parseDay(conflict.day))}, ${conflict.start}–${conflict.end}`;
}

/** End after start. `startField` is the form field holding the matching start. */
export function validateEndTime(startField, message) {
  return (value, data) => {
    if (!value) return true;
    const end = toMinutes(value);
    if (end == null) return "Enter a valid time, like 11:00";
    const start = toMinutes(data?.[startField]);
    return start == null || end > start ? true : message;
  };
}

// Times per day is disabled for now.
// export function validateSecondStartTime(value, data) {
//   if (!value) return true;
//   const start2 = toMinutes(value);
//   if (start2 == null) return "Enter a valid time, like 15:00";
//   const end1 = toMinutes(data?.end_time);
//   return end1 == null || start2 >= end1 ? true : "Second Start Time must be after the first End Time";
// }

export function validateDaysOfWeek(value, data) {
  if (!value) return true;
  if (!value.includes("1")) return "Pick at least one day";
  const from = parseDay(data?.validate_From);
  const to = parseDay(data?.validate_To);
  if (from && to && to >= from && formOccurrenceDays({ ...data, days_of_Week: value }).length === 0) {
    return "None of the selected days fall between Validate From and Validate To";
  }
  return true;
}

/** The host is added automatically, so picking them again is a mistake. */
export function validateNotHost(value, data) {
  const hostId = data?.host_Name?.value?.id;
  if (!hostId || !Array.isArray(value)) return true;
  return value.some((option) => sameId(option?.value?.id, hostId))
    ? "The host is already included. Remove them from this list."
    : true;
}

/** True when `userId` hosts the meeting (GUIDs compared ignoring case). */
export function isMeetingHost(meeting, userId) {
  return sameId(meeting?.host_id, userId);
}

/** Only the host can edit or cancel a meeting, and only while it is still active. */
export function canManageMeeting(meeting, userId) {
  return isMeetingHost(meeting, userId) && !INACTIVE_STATUSES.includes(meeting.status);
}
