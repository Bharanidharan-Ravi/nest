// src/features/meeting-scheduler/components/MonthView.jsx
import React, { useMemo } from "react";
import { format, isSameMonth } from "date-fns";
import { Plus, Repeat } from "lucide-react";
import { WEEKDAY_LABELS_SHORT, meetingTone, meetingToneClass } from "../Helpers/common";
import { formatTime24h, toDayKey } from "../Helpers/dateTime";
import { groupOccurrencesByDate, isRecurring } from "../Helpers/recurrence";
import { daysInRange, rangeForView } from "../Helpers/calendarRange";
import { isMeetingHost } from "../Helpers/meetingValidation";

// Lines per day; past that, the last line becomes "+N more".
const MAX_LINES_PER_DAY = 4;
const MAX_DOTS_PER_DAY = 4;

function MeetingChip({ meeting, isHost, onOpen }) {
  const cancelled = meeting.status === "Cancelled";
  const title = meeting.title || "Untitled Meeting";
  return (
    <button
      type="button"
      onClick={(event) => {
        event.stopPropagation();
        onOpen(meeting, event.currentTarget.getBoundingClientRect());
      }}
      title={`${formatTime24h(meeting.start_time)} ${title}`}
      className={`flex w-full min-w-0 items-center gap-1 rounded px-1.5 py-0.5 text-left text-[11px] leading-4 transition hover:brightness-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 ${meetingToneClass(meeting.status, isHost)} ${cancelled ? "opacity-60" : ""}`}
    >
      <span className="shrink-0 font-semibold tabular-nums">{formatTime24h(meeting.start_time)}</span>
      {isRecurring(meeting) && <Repeat size={10} className="shrink-0 opacity-70" aria-label="Repeats" />}
      <span className={`truncate ${cancelled ? "line-through" : ""}`}>{title}</span>
    </button>
  );
}

export default function MonthView({
  anchor,
  data = [],
  currentUserId,
  compact = false,
  onOpenMeeting,
  onOpenDay,
  onCreateAt,
}) {
  const days = useMemo(() => daysInRange(rangeForView("Month", anchor)), [anchor]);

  // Recurring meetings are expanded onto every matching day in the grid.
  const meetingsByDate = useMemo(() => groupOccurrencesByDate(data, days), [data, days]);
  const todayKey = toDayKey(new Date());

  return (
    <div className="flex min-h-full flex-col">
      <div className="sticky top-0 z-10 grid grid-cols-7 border-b border-gray-200 bg-gray-50">
        {WEEKDAY_LABELS_SHORT.map((weekday, i) => (
          // eslint-disable-next-line react/no-array-index-key -- static header
          <div key={`${weekday}-${i}`} className="py-2 text-center text-xs font-semibold uppercase text-gray-600">
            {weekday}
          </div>
        ))}
      </div>

      <div className="grid flex-1 grid-cols-7 auto-rows-fr">
        {days.map((day) => {
          const dateKey = toDayKey(day);
          const meetings = meetingsByDate[dateKey] ?? [];
          const inMonth = isSameMonth(day, anchor);
          const isToday = dateKey === todayKey;
          const canCreate = dateKey >= todayKey;
          const shown = meetings.length > MAX_LINES_PER_DAY ? meetings.slice(0, MAX_LINES_PER_DAY - 1) : meetings;
          const hiddenCount = meetings.length - shown.length;
          const dayLabel = format(day, "EEEE d MMMM");
          // A phone cell is too small for titles, so a tap opens the day instead.
          const onCellClick = compact
            ? () => onOpenDay(dateKey)
            : canCreate
              ? () => onCreateAt(dateKey)
              : undefined;

          return (
            <div
              key={dateKey}
              onClick={onCellClick}
              className={`group relative flex min-h-[72px] min-w-0 flex-col gap-1 border-b border-r border-gray-100 p-1 sm:min-h-[124px] sm:p-1.5 ${
                inMonth ? "bg-white" : "bg-gray-50/70"
              } ${onCellClick ? "cursor-pointer hover:bg-amber-50/40" : ""}`}
            >
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    onOpenDay(dateKey);
                  }}
                  aria-label={`Open ${dayLabel}`}
                  className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold transition sm:h-7 sm:w-7 ${
                    isToday
                      ? "bg-amber-500 text-white"
                      : inMonth
                        ? "text-gray-800 hover:bg-gray-200"
                        : "text-gray-400 hover:bg-gray-200"
                  }`}
                >
                  {format(day, "d")}
                </button>
                {canCreate && !compact && (
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      onCreateAt(dateKey);
                    }}
                    aria-label={`New meeting on ${dayLabel}`}
                    title="New meeting"
                    className="rounded p-0.5 text-gray-400 opacity-0 transition hover:bg-amber-100 hover:text-amber-700 focus-visible:opacity-100 group-hover:opacity-100"
                  >
                    <Plus size={14} />
                  </button>
                )}
              </div>

              {compact ? (
                meetings.length > 0 && (
                  <div className="flex flex-wrap items-center gap-0.5 px-0.5" aria-label={`${meetings.length} meetings`}>
                    {meetings.slice(0, MAX_DOTS_PER_DAY).map((meeting) => (
                      <span
                        key={meeting.occurrence_key}
                        className={`h-1.5 w-1.5 rounded-full ${meetingTone(meeting.status).dot}`}
                      />
                    ))}
                    {meetings.length > MAX_DOTS_PER_DAY && (
                      <span className="text-[9px] leading-none text-gray-500">+{meetings.length - MAX_DOTS_PER_DAY}</span>
                    )}
                  </div>
                )
              ) : (
                <div className="flex min-w-0 flex-col gap-0.5">
                  {shown.map((meeting) => (
                    <MeetingChip
                      key={meeting.occurrence_key}
                      meeting={meeting}
                      isHost={isMeetingHost(meeting, currentUserId)}
                      onOpen={onOpenMeeting}
                    />
                  ))}
                  {hiddenCount > 0 && (
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        onOpenDay(dateKey);
                      }}
                      className="rounded px-1.5 py-0.5 text-left text-[11px] font-medium text-gray-500 transition hover:bg-gray-100 hover:text-gray-800"
                    >
                      +{hiddenCount} more
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
