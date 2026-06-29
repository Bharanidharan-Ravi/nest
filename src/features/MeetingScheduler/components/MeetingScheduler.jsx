

import React, { useState, useMemo, useCallback } from "react";
import {
  FaChevronLeft,
  FaChevronRight,
  FaSearch,
  FaBell,
  FaPlus,
  FaBars,
  FaRegCalendarAlt,
  FaClock,
  FaMapMarkerAlt,
  FaUsers,
  FaTimes,
} from "react-icons/fa";
import { useList } from "../../../packages/ui-List/context/ListContext";
import { meetingFormConfig } from "../config/Meetingform.config";
import { readUserFromSession } from "../../../core/auth/useCurrentUser";
import EntityFormPage from "../../../packages/crud/pages/EntityFormPage";
import { useTicketMaster } from "../../tickets/hooks/useTicketMaster";
import { useQueryClient } from "@tanstack/react-query";
import { useParams } from "react-router-dom";



/* ------------------------------------------------------------------ */
/* Constants & Helpers                                                  */
/* ------------------------------------------------------------------ */

const VIEW_MODES = ["Month", "Week", "Day", "List"];

const PRIORITY_STYLES = {
  HIGH: "bg-rose-100 text-rose-700",
  MEDIUM: "bg-amber-100 text-amber-700",
  LOW: "bg-emerald-100 text-emerald-700",
};

const TYPE_STYLES = {
  "Team Sync": "bg-violet-100 text-violet-700",
  "Client Call": "bg-amber-100 text-amber-800",
  Review: "bg-emerald-100 text-emerald-700",
  Workshop: "bg-pink-100 text-pink-700",
  "1:1": "bg-gray-100 text-gray-700",
};

const STATUS_BAR_COLOR = {
  Upcoming: "bg-sky-50 border-l-4 border-sky-400",
  "In-Progress": "bg-amber-50 border-l-4 border-amber-400",
  Completed: "bg-emerald-50 border-l-4 border-emerald-400",
  Cancelled: "bg-gray-50 border-l-4 border-gray-300",
};

const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const HOURS = Array.from({ length: 9 }, (_, i) => 10 + i); // 08:00 – 18:00
const STATUS_OPTIONS = ["All", "Upcoming", "In-Progress", "Completed", "Cancelled"];
const PRIORITY_OPTIONS = ["All", "Low", "Medium", "High"];

const pad2 = (n) => String(n).padStart(2, "0");
const toISODate = (d) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
const isSameDay = (a, b) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

const startOfWeek = (date) => {
  const d = new Date(date);
  d.setDate(d.getDate() - d.getDay());
  d.setHours(0, 0, 0, 0);
  return d;
};

const addDays = (date, days) => {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
};

const getMonthMatrix = (date) => {
  const year = date.getFullYear();
  const month = date.getMonth();
  const gridStart = startOfWeek(new Date(year, month, 1));
  const weeks = [];
  let cursor = new Date(gridStart);
  for (let w = 0; w < 6; w++) {
    const week = [];
    for (let d = 0; d < 7; d++) {
      week.push(new Date(cursor));
      cursor = addDays(cursor, 1);
    }
    weeks.push(week);
    if (cursor.getMonth() !== month && week[6].getMonth() !== month) break;
  }
  return weeks;
};

const getRangeForView = (date, viewMode) => {
  if (viewMode === "Month") {
    const flat = getMonthMatrix(date).flat();
    return { FromDate: toISODate(flat[0]), ToDate: toISODate(flat[flat.length - 1]) };
  }
  if (viewMode === "Week") {
    const start = startOfWeek(date);
    return { FromDate: toISODate(start), ToDate: toISODate(addDays(start, 6)) };
  }
  if (viewMode === "Day") {
    return { FromDate: toISODate(date), ToDate: toISODate(date) };
  }
  // List — two-month rolling window
  const start = new Date(date.getFullYear(), date.getMonth(), 1);
  const end = new Date(date.getFullYear(), date.getMonth() + 2, 0);
  return { FromDate: toISODate(start), ToDate: toISODate(end) };
};

const formatMonthYear = (d) => d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
const formatHeaderDate = (d) =>
  d.toLocaleDateString("en-US", { weekday: "long", day: "2-digit", month: "long", year: "numeric" });
const formatTime = (t) => (t ? t.slice(0, 5) : "");
const parseHour = (t) => (t ? parseInt(t.split(":")[0], 10) : null);

const normalizeSchedulerMeeting = (m) => ({
  id: m.meeting_id,
  title: m.title,
  date: m.meeting_date,
  startTime: m.start_time,
  endTime: m.end_time,
  status: m.status ?? "Upcoming",
  priority: (m.priority || "MEDIUM").toUpperCase(),
  type: m.booking_type || m.type || "Meeting",
  host: m.HostName,
  location: m.meet_method === "Online" ? m.meet_link : m.location || m.meet_method,
  participants: [...(m.InternalParticipants || []), ...(m.ClientParticipants || [])]
    .map((p) => p?.name || p?.full_name || p)
    .filter(Boolean),
  refId: m.display_id || m.ticket_id,
  raw: m, // keep original for form pre-fill on edit
});

/* ------------------------------------------------------------------ */
/* Shared Badges                                                        */
/* ------------------------------------------------------------------ */

const PriorityBadge = ({ priority }) => (
  <span className={`text-[11px] font-semibold px-2 py-0.5 rounded ${PRIORITY_STYLES[priority] || PRIORITY_STYLES.MEDIUM}`}>
    {priority}
  </span>
);

const TypeBadge = ({ type }) => (
  <span className={`text-[11px] font-semibold px-2 py-0.5 rounded ${TYPE_STYLES[type] || "bg-gray-100 text-gray-700"}`}>
    {type}
  </span>
);

/* ------------------------------------------------------------------ */
/* Meeting Form Modal                                                   */
/* ------------------------------------------------------------------ */

export const MeetingFormModal = ({
  isOpen,
  mode,
  selectedEvent,
  currentUserId,
  params,
  modalMode = "meeting",
  ticketMaster = [],
  onClose,
  onSuccess,
}) => {
  // Build dynamic config here (safe — not inside useMemo with a hook)
  const dynamicConfig = useMemo(() => {
    const ticketField = {
      label: "Ticket",
      name: "ticket",
      type: "select",
      ui: "mui",
      required: false,
      dataType: "string",
      apiKey: "Ticket_id",
      initValueResolver: ({ context, masterData }) => {
        const ticketId = context?.fromTicketId;
        if (!ticketId) return null;
        const ticket = (ticketMaster || []).find(
          (t) => t.Issue_Id === ticketId
        );
        if (ticket) {
          return {
            value: {
              id: ticket.Issue_Id,
              name: ticket.Title,
            },
            label: ticket.Title,
          };
        }
        const fallbackTitle = params?.ticketTitle || context?.fromTicketTitle;
        if (fallbackTitle) {
          return {
            value: {
              id: ticketId,
              name: fallbackTitle,
            },
            label: fallbackTitle,
          };
        }
        return null;
      },
      // optionsResolver receives live formData at render time
      optionsResolver: ({ formData }) => {
        const selectedProjectId = formData?.project?.value?.id;
        return (ticketMaster || [])
          .filter((t) => (selectedProjectId ? t.Project_Id === selectedProjectId : true))
          .map((t) => ({ value: { id: t.Issue_Id, name: t.Title }, label: t.Title }));
      },
    };

    return {
      ...meetingFormConfig,
      fields: [...(meetingFormConfig.fields || []), ticketField],
    };
  }, [ticketMaster, params]); // only rebuilds when ticketMaster list or params changes

  if (!isOpen) return null;

  const context = {
    isEdit: mode === "Edit",
    entityData: selectedEvent?.raw ?? selectedEvent ?? null,
    ticketMaster,
    modalMode,
    currentUserId,
    fromTicketId: params?.ticketId,
    fromProjectId: params?.projectId,
    fromTicketTitle: params?.ticketTitle
  };

  const handleSuccess = () => {
    onSuccess?.();
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden mx-4">

        {/* Modal header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
          <h2 className="text-base font-bold text-gray-900">
            {mode === "Edit" ? "Edit Meeting" : "New Meeting"}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700 transition"
            aria-label="Close"
          >
            <FaTimes size={16} />
          </button>
        </div>

        {/* Scrollable form body */}
        <div className="flex-1 overflow-y-auto">
          <EntityFormPage
            mode={mode}
            config={dynamicConfig}
            module={modalMode === "meeting" ? "Meeting" : "Availability"}
            onSuccessCallback={handleSuccess}
            context={context}
          />
        </div>
      </div>
    </div>
  );
};


/* ------------------------------------------------------------------ */
/* Sidebar – Mini Calendar                                             */
/* ------------------------------------------------------------------ */

const MiniCalendar = ({ activeDate, today, datesWithMeetings, onSelectDate, onPrevMonth, onNextMonth, onToday }) => {
  const weeks = useMemo(() => getMonthMatrix(activeDate), [activeDate]);

  return (
    <div className="px-4 pt-4 pb-3 border-b border-gray-100">
      <div className="flex items-center justify-between mb-3">
        <span className="font-semibold text-sm text-gray-800">{formatMonthYear(activeDate)}</span>
        <div className="flex items-center gap-2 text-gray-400">
          <button onClick={onPrevMonth} className="hover:text-gray-700" aria-label="Previous month">
            <FaChevronLeft size={11} />
          </button>
          <button onClick={onToday} className="text-xs font-medium text-gray-500 hover:text-gray-800">
            Today
          </button>
          <button onClick={onNextMonth} className="hover:text-gray-700" aria-label="Next month">
            <FaChevronRight size={11} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 text-center text-[11px] text-gray-400 mb-1">
        {WEEKDAY_LABELS.map((d) => <div key={d}>{d}</div>)}
      </div>

      <div className="grid grid-cols-7 gap-y-1 text-center text-[12px]">
        {weeks.flat().map((day) => {
          const inMonth = day.getMonth() === activeDate.getMonth();
          const isToday = isSameDay(day, today);
          const isSelected = isSameDay(day, activeDate);
          const hasMeeting = datesWithMeetings.has(toISODate(day));

          return (
            <button
              key={day.toISOString()}
              onClick={() => onSelectDate(day)}
              className={`relative mx-auto flex items-center justify-center w-7 h-7 rounded-full transition
                ${!inMonth ? "text-gray-300" : "text-gray-700"}
                ${isSelected ? "bg-amber-400 text-gray-900 font-semibold" : ""}
                ${!isSelected && isToday ? "ring-1 ring-amber-300" : ""}
                ${!isSelected ? "hover:bg-gray-100" : ""}
              `}
            >
              {day.getDate()}
              {hasMeeting && !isSelected && (
                <span className="absolute bottom-0.5 w-1 h-1 rounded-full bg-amber-400" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* Sidebar – Upcoming Card                                             */
/* ------------------------------------------------------------------ */

const UpcomingMeetingCard = ({ meeting, onSelect }) => (
  <button
    onClick={() => onSelect(meeting)}
    className="w-full text-left rounded-lg bg-sky-50 hover:bg-sky-100 transition p-3 mb-2 border border-sky-100"
  >
    <div className="flex items-start justify-between gap-2">
      <p className="font-semibold text-sm text-gray-900 leading-snug">{meeting.title}</p>
      <span className="mt-1 w-2 h-2 rounded-full bg-sky-400 shrink-0" />
    </div>
    <div className="flex items-center gap-1.5 text-xs text-gray-500 mt-1">
      <FaClock size={10} />
      <span>
        {new Date(meeting.date).toLocaleDateString("en-US", { weekday: "short", day: "2-digit", month: "short" })}
        {meeting.startTime ? ` · ${formatTime(meeting.startTime)}` : ""}
      </span>
    </div>
    <div className="flex items-center gap-2 mt-2">
      <TypeBadge type={meeting.type} />
      <PriorityBadge priority={meeting.priority} />
    </div>
  </button>
);

/* ------------------------------------------------------------------ */
/* Sidebar                                                              */
/* ------------------------------------------------------------------ */

const SchedulerSidebar = ({
  activeDate, today, datesWithMeetings,
  onSelectDate, onPrevMonth, onNextMonth, onToday,
  searchTerm, onSearchChange,
  upcomingMeetings, onSelectMeeting,
}) => (
  <aside className="w-full lg:w-[320px] border-r border-gray-100 bg-white flex flex-col h-full">
    {/* Brand */}
    <div className="flex items-center gap-3 px-4 py-4 border-b border-gray-100">
      <div className="w-9 h-9 rounded-lg bg-amber-400 flex items-center justify-center text-gray-900 font-bold">
        W
      </div>
      <div>
        <p className="font-bold text-gray-900 leading-tight text-sm">WorkGlow</p>
        <p className="text-xs text-gray-400 leading-tight">Meeting Scheduler</p>
      </div>
    </div>

    <MiniCalendar
      activeDate={activeDate} today={today}
      datesWithMeetings={datesWithMeetings}
      onSelectDate={onSelectDate}
      onPrevMonth={onPrevMonth} onNextMonth={onNextMonth} onToday={onToday}
    />

    {/* Upcoming header + search */}
    <div className="px-4 pt-3 flex items-center justify-between">
      <span className="font-semibold text-sm text-gray-800">Upcoming Meetings</span>
      <span className="text-xs text-gray-400">{upcomingMeetings.length}</span>
    </div>
    <div className="px-4 pt-2">
      <div className="relative">
        <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300 text-xs" />
        <input
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search meetings..."
          className="w-full text-sm pl-8 pr-3 py-2 rounded-md border border-gray-200 focus:outline-none focus:ring-1 focus:ring-amber-300"
        />
      </div>
    </div>

    <div className="flex-1 overflow-y-auto px-4 py-3">
      {upcomingMeetings.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-6">No upcoming meetings</p>
      ) : (
        upcomingMeetings.map((m) => (
          <UpcomingMeetingCard key={m.id} meeting={m} onSelect={onSelectMeeting} />
        ))
      )}
    </div>
  </aside>
);

/* ------------------------------------------------------------------ */
/* Header                                                               */
/* ------------------------------------------------------------------ */

const SchedulerHeader = ({ viewMode, onViewModeChange, onNewMeeting, headerLabel }) => (
  <div className="flex items-center justify-between gap-4 px-5 py-4 border-b border-gray-100 bg-white flex-wrap">
    <div className="flex items-center gap-3">
      <FaBars className="text-gray-400 hidden sm:block" />
      <div>
        <h2 className="text-lg font-bold text-gray-900 leading-tight">Meetings</h2>
        <p className="text-xs text-gray-400 leading-tight">{headerLabel}</p>
      </div>
    </div>

    <div className="flex items-center gap-3 flex-wrap">
      {/* View switcher */}
      <div className="flex rounded-md border border-gray-200 overflow-hidden text-sm">
        {VIEW_MODES.map((mode) => (
          <button
            key={mode}
            onClick={() => onViewModeChange(mode)}
            className={`px-3 py-1.5 font-medium transition border-r border-gray-200 last:border-r-0 ${viewMode === mode
              ? "bg-white text-gray-900"
              : "bg-gray-50 text-gray-400 hover:text-gray-600"
              }`}
          >
            {mode}
          </button>
        ))}
      </div>

      {/* <button className="relative text-gray-400 hover:text-gray-600">
        <FaBell />
        <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-amber-400" />
      </button> */}

      {/* NEW MEETING — opens modal */}
      <button
        onClick={onNewMeeting}
        className="flex items-center gap-2 bg-amber-400 hover:bg-amber-500 text-gray-900 font-semibold text-sm px-4 py-2 rounded-md transition"
      >
        <FaPlus size={12} />
        New Meeting
      </button>
    </div>
  </div>
);

/* ------------------------------------------------------------------ */
/* Month View                                                           */
/* ------------------------------------------------------------------ */

const MonthView = ({ activeDate, today, meetingsByDate, onSelectDate }) => {
  const weeks = useMemo(() => getMonthMatrix(activeDate), [activeDate]);

  return (
    <div className="flex flex-col h-full">
      <div className="grid grid-cols-7 border-b border-gray-100 text-xs font-semibold text-gray-500">
        {WEEKDAY_LABELS.map((d) => (
          <div key={d} className="px-3 py-2 text-center uppercase tracking-wide">{d}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 flex-1 auto-rows-fr">
        {weeks.flat().map((day) => {
          const inMonth = day.getMonth() === activeDate.getMonth();
          const isToday = isSameDay(day, today);
          const isSelected = isSameDay(day, activeDate);
          const dayMtgs = meetingsByDate.get(toISODate(day)) || [];

          return (
            <button
              key={day.toISOString()}
              onClick={() => onSelectDate(day)}
              className={`text-left border-r border-b border-gray-100 p-2 flex flex-col gap-1 min-h-[88px] transition
                ${!inMonth ? "bg-gray-50/60 text-gray-300" : "bg-white text-gray-700"}
                ${isSelected ? "ring-2 ring-amber-300 z-10" : "hover:bg-gray-50"}
              `}
            >
              <div className="flex items-center justify-between">
                <span className={`text-sm font-medium ${isToday ? "w-6 h-6 flex items-center justify-center rounded-full bg-amber-400 text-gray-900" : ""
                  }`}>
                  {day.getDate()}
                </span>
                {dayMtgs.length > 1 && (
                  <span className="text-[10px] text-gray-400">{dayMtgs.length}</span>
                )}
              </div>

              <div className="flex flex-col gap-1">
                {dayMtgs.slice(0, 2).map((m) => (
                  <div
                    key={m.id}
                    className={`text-[11px] truncate px-1.5 py-0.5 rounded ${STATUS_BAR_COLOR[m.status] || "bg-sky-50 border-l-4 border-sky-400"
                      }`}
                    title={m.title}
                  >
                    {m.startTime && <span className="font-semibold mr-1">{formatTime(m.startTime)}</span>}
                    {m.title}
                  </div>
                ))}
                {dayMtgs.length > 2 && (
                  <div className="text-[10px] text-gray-400 px-1.5">+{dayMtgs.length - 2} more</div>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* Week View                                                            */
/* ------------------------------------------------------------------ */

const WeekView = ({ activeDate, today, meetingsByDate, onSelectMeeting }) => {
  const weekStart = useMemo(() => startOfWeek(activeDate), [activeDate]);
  const days = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)), [weekStart]);

  return (
    <div className="flex flex-col h-full overflow-auto">
      <div className="flex items-center px-4 py-3 border-b border-gray-100">
        <h3 className="font-semibold text-gray-800">
          Week of {weekStart.toLocaleDateString("en-US", { day: "2-digit", month: "short" })}
        </h3>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-[64px_repeat(7,1fr)] border-b border-gray-100 sticky top-0 bg-white z-10">
        <div />
        {days.map((day) => {
          const isToday = isSameDay(day, today);
          return (
            <div key={day.toISOString()} className="text-center py-2 border-l border-gray-100">
              <p className="text-xs text-gray-400 uppercase">{WEEKDAY_LABELS[day.getDay()]}</p>
              <p className={`text-sm font-semibold ${isToday ? "text-amber-500" : "text-gray-800"}`}>
                {day.getDate()}
              </p>
            </div>
          );
        })}
      </div>

      {/* Hour rows */}
      <div className="grid grid-cols-[64px_repeat(7,1fr)]">
        {HOURS.map((hour) => (
          <React.Fragment key={hour}>
            <div className="text-xs text-gray-400 text-right pr-2 py-4 border-b border-gray-50">
              {pad2(hour)}:00
            </div>
            {days.map((day) => {
              const slotMtgs = (meetingsByDate.get(toISODate(day)) || []).filter(
                (m) => parseHour(m.startTime) === hour
              );
              return (
                <div key={day.toISOString() + hour} className="border-l border-b border-gray-50 min-h-[64px] p-1">
                  {slotMtgs.map((m) => (
                    <button
                      key={m.id}
                      onClick={() => onSelectMeeting(m)}
                      className="w-full text-left bg-sky-100 hover:bg-sky-200 rounded-md px-2 py-1 mb-1 transition"
                    >
                      <p className="text-xs font-semibold text-gray-800 truncate">{m.title}</p>
                      <p className="text-[11px] text-gray-500">{formatTime(m.startTime)}</p>
                    </button>
                  ))}
                </div>
              );
            })}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* Day View                                                             */
/* ------------------------------------------------------------------ */

const DayView = ({ activeDate, dayMeetings, onSelectMeeting }) => (


  <div className="p-5 h-full overflow-auto">
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm divide-y divide-gray-50 max-w-3xl mx-auto">
      <div className="flex items-center gap-2 px-5 py-4 text-amber-500 font-semibold">
        <FaRegCalendarAlt />
        {formatHeaderDate(activeDate)}
      </div>
      {dayMeetings.length === 0 ? (
        <div className="px-5 py-10 text-center text-gray-400 text-sm">
          No meetings scheduled for this day.
        </div>
      ) : (
        dayMeetings
          .slice()
          .sort((a, b) => (a.startTime || "").localeCompare(b.startTime || ""))
          .map((m) => (
            <button
              key={m.id}
              onClick={() => onSelectMeeting(m)}
              className={`w-full text-left flex items-center justify-between gap-4 px-5 py-4 hover:bg-gray-50 transition ${STATUS_BAR_COLOR[m.status] || "bg-sky-50 border-l-4 border-sky-400"
                }`}
            >
              <div className="flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-semibold text-gray-900">{m.title}</p>
                  <div className="flex items-center gap-2 shrink-0">
                    <TypeBadge type={m.type} />
                    <PriorityBadge priority={m.priority} />
                  </div>
                </div>
                <div className="flex items-center gap-4 text-xs text-gray-500 mt-1.5">
                  <span className="flex items-center gap-1">
                    <FaClock size={10} />
                    {formatTime(m.startTime)} – {formatTime(m.endTime)}
                  </span>
                  {m.location && (
                    <span className="flex items-center gap-1">
                      <FaMapMarkerAlt size={10} />
                      {m.location}
                    </span>
                  )}
                </div>
                {/* {m.participants?.length > 0 && (
                  <div className="flex items-center gap-1 text-xs text-gray-400 mt-1.5">
                    <FaUsers size={10} />
                    {m.participants.join(", ")}
                  </div>
                )} */}
              </div>
            </button>
          ))
      )}
    </div>
  </div>
);

/* ------------------------------------------------------------------ */
/* List View                                                            */
/* ------------------------------------------------------------------ */

const FilterDropdown = ({ label, value, options, onChange }) => (
  <div className="flex items-center gap-2">
    <span className="text-sm text-gray-500">{label}:</span>
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="text-sm border border-gray-200 rounded-md px-2 py-1.5 bg-white focus:outline-none focus:ring-1 focus:ring-amber-300"
    >
      {options.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
    </select>
  </div>
);
const ListView = ({ meetings, onSelectMeeting }) => {
  const [status, setStatus] = useState("All");
  const [priority, setPriority] = useState("All");
  const [type, setType] = useState("All");

  // ✅ Parse participants safely
  const parseParticipants = (raw) => {
    try {
      const internal = JSON.parse(raw?.InternalParticipants || "[]");
      const client = JSON.parse(raw?.ClientParticipants || "[]");
      return [...internal, ...client];
    } catch {
      return [];
    }
  };

  // ✅ Format slot duration (API source of truth)
  const formatSlotDuration = (duration) => {
    if (!duration) return "";

    const parts = duration.split(":").map(Number);

    const hh = parts[0] || 0;
    const mm = parts[1] || 0;

    return `${hh > 0 ? `${hh}h ` : ""}${mm > 0 ? `${mm}m` : ""}`.trim();
  };

  const typeOptions = useMemo(() => {
    const set = new Set(meetings.map((m) => m.type).filter(Boolean));
    return ["All", ...Array.from(set)];
  }, [meetings]);

  const filtered = useMemo(
    () =>
      meetings
        .filter((m) => status === "All" || m.status === status)
        .filter(
          (m) =>
            priority === "All" ||
            m.priority === priority.toUpperCase()
        )
        .filter((m) => type === "All" || m.type === type)
        .sort((a, b) => {
          const dc = (a.date || "").localeCompare(b.date || "");
          return dc !== 0
            ? dc
            : (a.startTime || "").localeCompare(b.startTime || "");
        }),
    [meetings, status, priority, type]
  );

  return (
    <div className="flex flex-col h-full overflow-auto">

      {/* HEADER */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
        <span className="text-sm text-gray-400">
          {filtered.length} meeting(s)
        </span>
      </div>

      {/* LIST */}
      <div className="flex-1 overflow-auto p-4 flex flex-col gap-3">
        {filtered.length === 0 ? (
          <div className="text-center text-gray-400 text-sm py-10">
            No meetings match the selected filters.
          </div>
        ) : (
          filtered.map((m) => {
            const participants = parseParticipants(m.raw);
            const duration = formatSlotDuration(m.slot_duration);

            return (
              <button
                key={m.id}
                // onClick={() => onSelectMeeting(m)}
                className={`w-full text-left rounded-lg px-4 py-3 transition hover:shadow-sm ${STATUS_BAR_COLOR[m.status] ||
                  "bg-sky-50 border-l-4 border-sky-400"
                  }`}
              >
                <div className="flex items-start justify-between gap-3">

                  {/* LEFT SIDE */}
                  <div className="flex items-start gap-3">

                    <span className="mt-1.5 w-2 h-2 rounded-full bg-sky-400 shrink-0" />

                    <div>

                      {/* TITLE */}
                      <p className="font-semibold text-gray-900">
                        {m.title}
                      </p>

                      {/* DATE + TIME + DURATION */}
                      <p className="text-xs text-gray-500 mt-0.5">
                        {new Date(m.date).toLocaleDateString("en-US", {
                          weekday: "short",
                          day: "2-digit",
                          month: "short",
                        })}

                        {m.startTime && m.endTime && (
                          <span>
                            {" "}· {m.startTime} - {m.endTime}
                          </span>
                        )}
                        {duration && (
                          <span className="text-gray-400">
                            {" "}({duration})
                          </span>
                        )}

                        {m.host && <span> · Host: {m.host}</span>}
                      </p>

                      {/* SUMMARY */}
                      {m.raw?.meeting_summary && (
                        <p className="text-xs text-gray-400 mt-1 line-clamp-1">
                          {m.raw.meeting_summary}
                        </p>
                      )}

                      {/* PARTICIPANT AVATARS */}
                      <div className="flex items-center mt-2">
                        {participants.slice(0, 6).map((p, i) => {
                          const name = p.Participant_Name || "U";

                          const initials = name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")
                            .slice(0, 2)
                            .toUpperCase();

                          return (
                            <div
                              key={i}
                              className="w-7 h-7 rounded-full bg-purple-200 text-purple-700 text-[10px] font-bold flex items-center justify-center border-2 border-white -ml-2 first:ml-0"
                              title={name}
                            >
                              {initials}
                            </div>
                          );
                        })}

                        {participants.length > 6 && (
                          <div className="ml-2 text-xs text-gray-400">
                            +{participants.length - 6}
                          </div>
                        )}
                      </div>

                    </div>
                  </div>

                  {/* RIGHT SIDE BADGES */}
                  <div className="flex items-center gap-2 shrink-0">
                    <TypeBadge type={m.type} />
                    <PriorityBadge priority={m.priority} />
                  </div>

                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* Root Component                                                       */
/* ------------------------------------------------------------------ */

const MeetingScheduler = () => {
  const params = useParams();

  const queryClient = useQueryClient();

  const user = readUserFromSession();
  const currentUserId = user?.userId;
  const today = useMemo(() => new Date(), []);

  const { data = [] } = useList();
  const { data: ticketMaster = [] } = useTicketMaster({ employeeId: currentUserId });

  // Calendar state
  const [activeDate, setActiveDate] = useState(today);
  const [viewMode, setViewMode] = useState("Month");
  const [searchTerm, setSearchTerm] = useState("");
  // Modal state
  // modalState: null | { mode: "Create"|"Edit", selectedEvent: null|meeting }
  const [modalState, setModalState] = useState(!!params.ticketId);

  const openCreateModal = useCallback(() => {
    setModalState({ mode: "Create", selectedEvent: null });
  }, []);

  const openEditModal = useCallback((meeting) => {
    setModalState({ mode: "Edit", selectedEvent: meeting });
  }, []);

  const closeModal = useCallback(() => setModalState(null), []);

  // Jump to Day view when a meeting card is clicked in sidebar / week / list
  const handleSelectMeeting = useCallback((meeting) => {
    setActiveDate(new Date(meeting.date));
    setViewMode("Day");
  }, []);

  // Date range for the current view (efficient — only fetches what's visible)
  const { FromDate, ToDate } = useMemo(
    () => getRangeForView(activeDate, viewMode),
    [activeDate, viewMode]
  );

  // Org-wide feed — no HostId, separate configKey
  // const { data: rawMeetings, isLoading, refetch } = useMeetingData({ FromDate, ToDate });

  const meetings = useMemo(
    () => (Array.isArray(data) ? data.map(normalizeSchedulerMeeting) : []),
    [data]
  );

  const meetingsByDate = useMemo(() => {
    const map = new Map();
    for (const m of meetings) {
      if (!m.date) continue;
      const key = m.date.slice(0, 10);
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(m);
    }
    return map;
  }, [meetings]);
  const datesWithMeetings = useMemo(() => new Set(meetingsByDate.keys()), [meetingsByDate]);

  const upcomingMeetings = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return meetings
      .filter((m) => m.date >= toISODate(today))
      .filter((m) =>
        term
          ? m.title?.toLowerCase().includes(term) ||
          m.type?.toLowerCase().includes(term) ||
          m.host?.toLowerCase().includes(term)
          : true
      )
      .sort((a, b) => {
        const dc = (a.date || "").localeCompare(b.date || "");
        return dc !== 0 ? dc : (a.startTime || "").localeCompare(b.startTime || "");
      })
      .slice(0, 20);
  }, [meetings, searchTerm, today]);

  const dayMeetings = useMemo(
    () => meetingsByDate.get(toISODate(activeDate)) || [],
    [meetingsByDate, activeDate]
  );
  const handlePrevMonth = useCallback(
    () => setActiveDate((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1)), []
  );
  const handleNextMonth = useCallback(
    () => setActiveDate((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1)), []
  );
  const handleToday = useCallback(() => setActiveDate(new Date()), []);

  const headerLabel = useMemo(
    () => viewMode === "List" ? "All meetings" : formatHeaderDate(activeDate),
    [activeDate, viewMode]
  );

  // After a successful save, close modal and refresh data
  const handleFormSuccess = useCallback(() => {
    closeModal();
    // queryClient.invalidateQueries(queryKeys.all);
  }, [closeModal]);

  return (
    <>
      {/* ── Scheduler shell ── */}
      <div className="flex flex-col lg:flex-row h-full min-h-[600px] bg-white rounded-lg border border-gray-100 overflow-hidden">

        <SchedulerSidebar
          activeDate={activeDate}
          today={today}
          datesWithMeetings={datesWithMeetings}
          onSelectDate={setActiveDate}
          onPrevMonth={handlePrevMonth}
          onNextMonth={handleNextMonth}
          onToday={handleToday}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          upcomingMeetings={upcomingMeetings}
          onSelectMeeting={handleSelectMeeting}
        />

        <div className="flex-1 flex flex-col min-h-0">
          <SchedulerHeader
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            onNewMeeting={openCreateModal}
            headerLabel={headerLabel}
          />

          <div className="flex-1 min-h-0 relative overflow-auto">
            {/* {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-white/60 text-sm text-gray-400 z-10">
                Loading meetings…
              </div>
            )} */}

            {viewMode === "Month" && (
              <MonthView
                activeDate={activeDate}
                today={today}
                meetingsByDate={meetingsByDate}
                onSelectDate={setActiveDate}
              />
            )}

            {viewMode === "Week" && (
              <WeekView
                activeDate={activeDate}
                today={today}
                meetingsByDate={meetingsByDate}
                onSelectMeeting={handleSelectMeeting}
              />
            )}

            {viewMode === "Day" && (
              <DayView
                activeDate={activeDate}
                dayMeetings={dayMeetings}
                onSelectMeeting={openEditModal}
              />
            )}

            {viewMode === "List" && (
              <ListView
                meetings={meetings}
                onSelectMeeting={openEditModal}
              />
            )}
          </div>
        </div>
      </div>

      {/* ── Meeting Form Modal (Create / Edit) ── */}
      <MeetingFormModal
        isOpen={!!modalState}
        mode={modalState?.mode ?? "Create"}
        selectedEvent={modalState?.selectedEvent ?? null}
        modalMode="meeting"
        currentUserId={currentUserId}
        params={params}
        ticketMaster={ticketMaster}
        onClose={closeModal}
        onSuccess={handleFormSuccess}
      />
    </>
  );
};

export default MeetingScheduler;