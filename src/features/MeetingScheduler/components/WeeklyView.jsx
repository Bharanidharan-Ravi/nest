// src/features/meeting-scheduler/components/WeekView.jsx
// Time grid for the Day (one column) and Week (seven columns) views.
import React, { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { Plus, Repeat } from "lucide-react";

import { formatTime24h, minutesToTime, toDayKey, toMinutes } from "../Helpers/dateTime";
import { groupOccurrencesByDate, isRecurring } from "../Helpers/recurrence";
import { layoutOverlaps, meetingToneClass, visibleHours } from "../Helpers/common";
import { OFFICE_START_MINUTES, isMeetingHost } from "../Helpers/meetingValidation";

const HOUR_HEIGHT = 56; // px per hour
const SLOT_MINUTES = 30; // one click on an empty slot books this long
const MIN_MEETING_MINUTES = 20; // short meetings still get a block big enough to click
const TIME_COLUMN_WIDTH = "56px";

const toPx = (minutes) => (minutes / 60) * HOUR_HEIGHT;

/** The current time, refreshed every minute for the "now" line. */
function useNow() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);
  return now;
}

function MeetingBlock({ item, gridStart, isHost, onOpen }) {
  const { meeting, start, end, column, columns } = item;
  const height = Math.max(toPx(end - start), 22);
  const cancelled = meeting.status === "Cancelled";
  const title = meeting.title || "Untitled Meeting";
  const time = `${formatTime24h(meeting.start_time)} – ${formatTime24h(meeting.end_time)}`;

  return (
    <button
      type="button"
      onClick={(event) => onOpen(meeting, event.currentTarget.getBoundingClientRect())}
      title={`${title} · ${time}`}
      className={`absolute z-10 overflow-hidden rounded-md px-1.5 py-1 text-left text-[11px] leading-tight shadow-sm transition hover:z-20 hover:shadow-md focus-visible:z-20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 ${meetingToneClass(meeting.status, isHost)} ${cancelled ? "opacity-60" : ""}`}
      style={{
        top: toPx(start - gridStart),
        height,
        // Overlapping meetings share the column side by side.
        left: `calc(${(column / columns) * 100}% + 2px)`,
        width: `calc(${100 / columns}% - 4px)`,
      }}
    >
      <span className={`flex items-center gap-1 font-semibold ${cancelled ? "line-through" : ""}`}>
        {isRecurring(meeting) && <Repeat size={10} className="shrink-0" aria-label="Repeats" />}
        <span className="truncate">{title}</span>
      </span>
      {height >= 36 && <span className="block truncate opacity-80">{time}</span>}
      {height >= 64 && meeting.HostName && <span className="block truncate opacity-70">{meeting.HostName}</span>}
    </button>
  );
}

export default function WeekView({ days, data = [], currentUserId, onOpenMeeting, onCreateAt }) {
  const now = useNow();
  const todayKey = toDayKey(now);
  const nowMinutes = now.getHours() * 60 + now.getMinutes();

  // Recurring meetings are expanded onto every matching day, then each day's
  // meetings get their place (minutes from midnight) and overlap column.
  const placedByDate = useMemo(() => {
    const byDate = groupOccurrencesByDate(data, days);
    return Object.fromEntries(
      Object.entries(byDate).map(([dateKey, meetings]) => {
        const items = meetings
          .map((meeting) => {
            const start = toMinutes(meeting.start_time);
            if (start == null) return null;
            const end = Math.max(toMinutes(meeting.end_time) ?? start, start + MIN_MEETING_MINUTES);
            return { meeting, start, end: Math.min(end, 24 * 60) };
          })
          .filter(Boolean);
        return [dateKey, layoutOverlaps(items)];
      })
    );
  }, [data, days]);

  // Office hours, stretched so an early or late meeting is never cut off.
  const { startHour, endHour } = useMemo(
    () => visibleHours(Object.values(placedByDate).flat()),
    [placedByDate]
  );
  const gridStart = startHour * 60;
  const gridHeight = toPx((endHour - startHour) * 60);
  const hours = Array.from({ length: endHour - startHour }, (_, i) => startHour + i);
  const slots = Array.from(
    { length: ((endHour - startHour) * 60) / SLOT_MINUTES },
    (_, i) => gridStart + i * SLOT_MINUTES
  );
  const columns = `${TIME_COLUMN_WIDTH} repeat(${days.length}, minmax(0, 1fr))`;

  return (
    <div className="min-h-full">
      <div className="sticky top-0 z-30 grid border-b border-gray-200 bg-white" style={{ gridTemplateColumns: columns }}>
        <div />
        {days.map((day) => {
          const dateKey = toDayKey(day);
          const isToday = dateKey === todayKey;
          return (
            <div key={dateKey} className={`border-l border-gray-100 py-2 text-center ${isToday ? "bg-amber-50" : ""}`}>
              <p className={`text-[11px] font-medium uppercase ${isToday ? "text-amber-700" : "text-gray-400"}`}>
                {format(day, "EEE")}
              </p>
              <p
                className={`mx-auto mt-0.5 flex h-7 w-7 items-center justify-center rounded-full text-sm font-semibold ${
                  isToday ? "bg-amber-500 text-white" : "text-gray-800"
                }`}
              >
                {format(day, "d")}
              </p>
            </div>
          );
        })}
      </div>

      <div className="grid" style={{ gridTemplateColumns: columns }}>
        <div className="relative" style={{ height: gridHeight }}>
          {hours.map((hour) => (
            <span
              key={hour}
              className="absolute right-2 text-[11px] tabular-nums text-gray-400"
              style={{ top: toPx(hour * 60 - gridStart) + 2 }}
            >
              {minutesToTime(hour * 60)}
            </span>
          ))}
        </div>

        {days.map((day) => {
          const dateKey = toDayKey(day);
          const isToday = dateKey === todayKey;
          return (
            <div
              key={dateKey}
              className={`relative border-l border-gray-100 ${isToday ? "bg-amber-50/40" : ""}`}
              style={{ height: gridHeight }}
            >
              {slots.map((slot) => {
                const style = { top: toPx(slot - gridStart), height: toPx(SLOT_MINUTES) };
                const line = slot % 60 === 0 ? "border-t border-gray-100" : "border-t border-dashed border-gray-100";
                // Free slots from office hours on, and not already over, open New Meeting.
                const bookable =
                  slot >= OFFICE_START_MINUTES &&
                  (dateKey > todayKey || (dateKey === todayKey && slot + SLOT_MINUTES > nowMinutes));

                return bookable ? (
                  <button
                    key={slot}
                    type="button"
                    tabIndex={-1}
                    onClick={() => onCreateAt(dateKey, minutesToTime(slot))}
                    aria-label={`New meeting on ${format(day, "EEE d MMM")} at ${minutesToTime(slot)}`}
                    className={`group/slot absolute inset-x-0 flex items-start px-1.5 pt-0.5 text-[10px] font-medium text-amber-700 transition hover:bg-amber-50 ${line}`}
                    style={style}
                  >
                    <span className="hidden items-center gap-0.5 group-hover/slot:inline-flex">
                      <Plus size={10} aria-hidden="true" />
                      {minutesToTime(slot)}
                    </span>
                  </button>
                ) : (
                  <div key={slot} className={`absolute inset-x-0 ${line}`} style={style} aria-hidden="true" />
                );
              })}

              {(placedByDate[dateKey] ?? []).map((item) => (
                <MeetingBlock
                  key={item.meeting.occurrence_key}
                  item={item}
                  gridStart={gridStart}
                  isHost={isMeetingHost(item.meeting, currentUserId)}
                  onOpen={onOpenMeeting}
                />
              ))}

              {isToday && nowMinutes >= gridStart && nowMinutes <= endHour * 60 && (
                <div
                  className="pointer-events-none absolute inset-x-0 z-20 flex items-center"
                  style={{ top: toPx(nowMinutes - gridStart) }}
                  aria-hidden="true"
                >
                  <span className="-ml-1 h-2 w-2 rounded-full bg-red-500" />
                  <span className="h-px flex-1 bg-red-500" />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
