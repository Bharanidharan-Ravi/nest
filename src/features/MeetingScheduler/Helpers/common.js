// Small shared helpers for the meeting scheduler: constants, calendar colours
// and time-grid layout, meeting links, participants and ids, the API row
// mapping, and the list query string the filters live in.
import { parseQuery } from "../../../packages/ui-List/hooks/useQueryParser";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export const VIEW_MODES = ["List", "Day", "Week", "Month"];

export const WEEKDAY_LABELS_SHORT = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

// Office hours the Day / Week grid always shows (10:00 - 19:00); the grid
// stretches past them when a meeting starts earlier or ends later.
export const WEEK_VIEW_START_HOUR = 10;
export const WEEK_VIEW_HOUR_COUNT = 9;

// ---------------------------------------------------------------------------
// Calendar colours
// ---------------------------------------------------------------------------

// Colours for meetings on the Day / Week / Month calendars. The status picks
// the colour; a meeting you host is filled, one you're invited to is outlined.
const MEETING_TONES = {
  Scheduled: {
    solid: "bg-blue-100 text-blue-900 border-blue-500",
    outline: "bg-white text-blue-900 border-blue-200 border-l-blue-500",
    dot: "bg-blue-500",
  },
  Completed: {
    solid: "bg-green-100 text-green-900 border-green-500",
    outline: "bg-white text-green-900 border-green-200 border-l-green-500",
    dot: "bg-green-500",
  },
  Cancelled: {
    solid: "bg-red-50 text-red-800 border-red-400",
    outline: "bg-white text-red-800 border-red-200 border-l-red-400",
    dot: "bg-red-400",
  },
};

const DEFAULT_TONE = {
  solid: "bg-sky-100 text-sky-900 border-sky-500",
  outline: "bg-white text-sky-900 border-sky-200 border-l-sky-500",
  dot: "bg-sky-500",
};

export const meetingTone = (status) => MEETING_TONES[status] ?? DEFAULT_TONE;

/** Background, text and border classes for a calendar meeting. */
export function meetingToneClass(status, isHost) {
  const tone = meetingTone(status);
  return isHost ? `border-l-4 ${tone.solid}` : `border border-l-4 ${tone.outline}`;
}

// ---------------------------------------------------------------------------
// Day / Week time grid
// ---------------------------------------------------------------------------

// Placement of meetings on the Day / Week time grid. Times are minutes from
// midnight, so these stay plain functions that are easy to test.

/**
 * Puts overlapping meetings side by side. Each item keeps its fields and gets
 * `column` (0-based) and `columns` (how many share that stretch of time).
 * Items need numeric `start` and `end`.
 */
export function layoutOverlaps(items) {
  const sorted = [...items].sort((a, b) => a.start - b.start || b.end - a.end);
  const placed = [];
  let group = [];
  let groupEnd = -Infinity;
  let columnEnds = [];

  const closeGroup = () => {
    const columns = columnEnds.length;
    group.forEach((item) => placed.push({ ...item, columns }));
    group = [];
    columnEnds = [];
  };

  sorted.forEach((item) => {
    // Nothing still running when this one starts: the next group begins.
    if (group.length && item.start >= groupEnd) closeGroup();

    let column = columnEnds.findIndex((end) => end <= item.start);
    if (column === -1) {
      column = columnEnds.length;
      columnEnds.push(item.end);
    } else {
      columnEnds[column] = item.end;
    }
    group.push({ ...item, column });
    groupEnd = group.length === 1 ? item.end : Math.max(groupEnd, item.end);
  });
  if (group.length) closeGroup();

  return placed;
}

/**
 * The hours to draw: office hours, stretched so no meeting falls outside.
 * Returns whole hours, endHour exclusive (10 and 19 draw 10:00 – 19:00).
 */
export function visibleHours(
  items,
  defaultStart = WEEK_VIEW_START_HOUR,
  defaultEnd = WEEK_VIEW_START_HOUR + WEEK_VIEW_HOUR_COUNT
) {
  const startHour = Math.min(defaultStart, ...items.map((item) => Math.floor(item.start / 60)));
  const endHour = Math.max(defaultEnd, ...items.map((item) => Math.ceil(item.end / 60)));
  return { startHour: Math.max(0, startHour), endHour: Math.min(24, endHour) };
}

// ---------------------------------------------------------------------------
// Meeting links
// ---------------------------------------------------------------------------

// Shared by the form (validation) and the views (Join).
// meet_method stores one of these ids in MeetingMaster.meet_method.
export const MEETING_METHODS = [
  { id: "GOOGLE_MEET", label: "Google Meet", hosts: ["meet.google.com"] },
  { id: "TEAMS", label: "Microsoft Teams", hosts: ["teams.microsoft.com", "teams.live.com"] },
  { id: "ZOOM", label: "Zoom", hosts: ["zoom.us", "zoomgov.com"] },
  { id: "OTHER", label: "Other link", hosts: [] },
  { id: "IN_PERSON", label: "In person", hosts: null },
];

const methodById = (id) => MEETING_METHODS.find((m) => m.id === id);

/** True for every method that needs a link (everything except In person). */
export const isOnlineMethod = (id) => !!methodById(id) && id !== "IN_PERSON";

/** Only http(s) URLs — anything else (javascript:, data:, typos) is null. */
function parseMeetingUrl(value) {
  if (!value || typeof value !== "string") return null;
  try {
    const url = new URL(value.trim());
    return url.protocol === "https:" || url.protocol === "http:" ? url : null;
  } catch {
    return null;
  }
}

const hostMatches = (host, hosts) => hosts.some((h) => host === h || host.endsWith(`.${h}`));

/** Form validator: true when fine, otherwise the message to show. */
export function validateMeetingLink(value, methodId) {
  if (!value) return true;
  const url = parseMeetingUrl(value);
  if (!url) return "Enter the full link, starting with https://";
  const method = methodById(methodId);
  if (method?.hosts?.length && !hostMatches(url.hostname.toLowerCase(), method.hosts)) {
    return `This isn't a ${method.label} link. Check the link or choose "Other link".`;
  }
  return true;
}

/**
 * What the views need to offer "Join": a safe URL plus a display label.
 * The label falls back to the link's host when no method was saved.
 */
export function getJoinInfo(meeting) {
  const method = methodById(meeting?.meet_method);
  const url = parseMeetingUrl(meeting?.meet_link);
  if (!url) return method ? { url: null, label: method.label, password: null } : null;

  const detected = MEETING_METHODS.find(
    (m) => m.hosts?.length && hostMatches(url.hostname.toLowerCase(), m.hosts)
  );
  return {
    url: url.href,
    label: method?.label ?? detected?.label ?? url.hostname,
    password: meeting?.meet_password || null,
  };
}

// ---------------------------------------------------------------------------
// Participants and ids
// ---------------------------------------------------------------------------

const AVATAR_PALETTE = [
  "bg-amber-100 text-amber-700",
  "bg-blue-100 text-blue-700",
  "bg-violet-100 text-violet-700",
  "bg-rose-100 text-rose-700",
  "bg-teal-100 text-teal-700",
  "bg-indigo-100 text-indigo-700",
];

/** GUIDs come back in either case from the token, the API and master data. */
export const idKey = (id) => String(id).toLowerCase();

/** True when both ids are set and name the same person / meeting. */
export const sameId = (a, b) => a != null && b != null && idKey(a) === idKey(b);

/** Safely parse a JSON array string (or pass an array through); never throws, never returns non-array. */
export function safeParseList(value) {
  if (Array.isArray(value)) return value;
  try {
    const parsed = JSON.parse(value || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/** True when the employee hosts or attends a sidebar "Upcoming Meetings" row. */
export const upcomingMeetingInvolves = (meeting, employeeId) =>
  sameId(meeting?.Organizer_Id, employeeId) ||
  safeParseList(meeting?.Participants).some((user) => sameId(user.participant_id, employeeId));

/** Merge internal + client participant arrays from a normalized meeting row. */
export function getAllParticipants(meeting) {
  const internal = safeParseList(meeting?.InternalParticipants ?? meeting?.internalParticipants);
  const client = safeParseList(meeting?.ClientParticipants ?? meeting?.clientParticipants);
  return { internal, client, all: [...internal, ...client] };
}

/** "Jordan Reeves" -> "JR" */
export function initialsOf(name = "") {
  return (
    name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || "?"
  );
}

/** Deterministic string -> integer hash, used to pick a stable avatar color per name. */
function hashString(str = "") {
  let hash = 0;
  for (let i = 0; i < str.length; i += 1) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash);
}

/** Stable Tailwind color classes for a given participant name. */
export function avatarColorFor(name = "") {
  return AVATAR_PALETTE[hashString(name) % AVATAR_PALETTE.length];
}

// ---------------------------------------------------------------------------
// API row -> view model
// ---------------------------------------------------------------------------

/** Maps an API (PascalCase) meeting row to the fields the scheduler uses. */
export function normalizeMeeting(meet) {
  return {
    meeting_id: meet?.Meeting_Id,
    meeting_date: meet?.Meeting_Date,
    title: meet?.Title,
    Ticket_Title: meet?.Ticket_Title,
    meeting_summary: meet?.Meeting_Summary,
    ticket_id: meet?.Ticket_Id,
    project_id: meet?.Project_Id,
    project_Name: meet?.Project_Name,
    recurrence_type: meet?.Recurrence_Type,
    slot_duration: meet?.Slot_Duration,
    booking_type: meet?.Booking_Type,
    created_at: meet?.Created_At,
    // UTC. For a cancelled meeting this is when it was cancelled.
    updated_at: meet?.Updated_At,
    HostName: meet?.Host_Name,
    days_of_week: meet?.Days_Of_Week,
    start_time: meet?.Start_Time,
    status: meet?.Status ?? "Active",
    end_time: meet?.End_Time,
    // Times per day is disabled for now.
    // times_per_day: meet?.Times_Per_Day,
    // second_start_time: meet?.Second_Start_Time,
    // second_end_time: meet?.Second_End_Time,
    meet_method: meet?.Meet_Method,
    meet_link: meet?.Meet_Link,
    meet_password: meet?.Meet_Password,
    host_id: meet?.Host_Id,
    host_type: meet?.Host_Type,
    issue_Code: meet?.Issue_Code,
    project_Code: meet?.ProjectKey,
    valid_from_date: meet?.Valid_From_Date,
    valid_to_date: meet?.Valid_To_Date,
    InternalParticipants: meet?.InternalParticipants,
    ClientParticipants: meet?.ClientParticipants,
  };
}

// ---------------------------------------------------------------------------
// List query string
// ---------------------------------------------------------------------------

// The query the scheduler's filters live in, e.g.
// 'weekRange:2026-09-27~2026-10-03 status:Scheduled,Completed sprint'.

const isEmpty = (value) => value == null || value === "" || (Array.isArray(value) && value.length === 0);

/** One 'key:value' token; values with spaces are quoted so they read back whole. */
const filterToken = (key, value) => {
  const text = Array.isArray(value) ? value.join(",") : String(value);
  return `${key}:${text.includes(" ") ? `"${text}"` : text}`;
};

/** Builds a query from its filters and search text. */
export const buildQuery = (filters, text = "") =>
  [
    ...Object.entries(filters)
      .filter(([, value]) => !isEmpty(value))
      .map(([key, value]) => filterToken(key, value)),
    text,
  ]
    .filter(Boolean)
    .join(" ");

/** Sets (or, with no values, removes) one filter, keeping the rest and the search text. */
export function setQueryFilter(query, key, values) {
  const { filters, text } = parseQuery(query);
  const rest = { ...filters };
  delete rest[key];
  const normalized = Array.isArray(values) ? values : values ? [String(values)] : [];
  return buildQuery(normalized.length ? { ...rest, [key]: normalized } : rest, text);
}

/** Replaces the search text, keeping every filter. */
export const setQueryText = (query, text) => buildQuery(parseQuery(query).filters, text);

/** Removes the given filters and the search text; other filters (dates, host) stay. */
export function clearQueryFilters(query, keys) {
  const { filters } = parseQuery(query);
  const rest = { ...filters };
  keys.forEach((key) => delete rest[key]);
  return buildQuery(rest);
}
