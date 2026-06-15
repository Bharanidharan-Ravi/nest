
import dayjs from "dayjs";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore";
import isSameOrAfter from "dayjs/plugin/isSameOrAfter";
import { 
  FaPlus, FaCalendarAlt, FaVideo, FaPhone, FaUsers, 
  FaChevronLeft, FaChevronRight, FaClock, FaTimes, FaUser, FaEdit, FaSearch, FaEllipsisH, FaArrowDown
} from "react-icons/fa";

import { useList } from "../../../packages/ui-List/context/ListContext";
import { useTicketMaster } from "../../tickets/hooks/useTicketMaster";
import { readUserFromSession } from "../../../core/auth/useCurrentUser";
import EntityFormPage from "../../../packages/crud/pages/EntityFormPage";
import { meetingFormConfig } from "../config/Meetingform.config";
import { useCallback, useMemo, useState } from "react";
// import { useMasterData } from "../../../core/master/masterCall/useMasterData";

dayjs.extend(isSameOrBefore);
dayjs.extend(isSameOrAfter);

// ─── Constants ────────────────────────────────────────────────────────────────
const HOURS = Array.from({ length: 14 }, (_, i) => i + 7); // 7 AM - 8 PM

const BOOKING_COLORS = {
  meeting: { 
    bg: "bg-[#251f47]", borderL: "border-l-[#6e58d1]", text: "text-[#e2ddfc]", 
    textDim: "text-[#9789cc]", dot: "bg-[#6e58d1]", badge: "bg-[#3e327a] text-[#c1b5fa]" 
  },
  availability: { 
    bg: "bg-[#103621]", borderL: "border-l-[#21b35b]", text: "text-[#55db8d]", 
    textDim: "text-[#47b373]", dot: "bg-[#21b35b]", badge: "bg-[#3e327a] text-[#c1b5fa]" 
  },
  interview: { bg: "bg-[#332240]", borderL: "border-l-[#6e468d]", text: "text-[#d6aef8]", textDim: "text-[#9778b3]", dot: "bg-fuchsia-500", badge: "bg-[#4e2f66] text-[#d6aef8]" },
  demo: { bg: "bg-[#332917]", borderL: "border-l-[#7a602d]", text: "text-[#f5ce8c]", textDim: "text-[#b39562]", dot: "bg-amber-500", badge: "bg-[#54411d] text-[#f5ce8c]" },
  discussion: { bg: "bg-[#112d33]", borderL: "border-l-[#246977]", text: "text-[#81e1f5]", textDim: "text-[#5b9ca8]", dot: "bg-cyan-500", badge: "bg-[#1b4b56] text-[#81e1f5]" },
  supportCall: { bg: "bg-[#361a20]", borderL: "border-l-[#7a3443]", text: "text-[#f7a6b8]", textDim: "text-[#b07382]", dot: "bg-rose-500", badge: "bg-[#542530] text-[#f7a6b8]" },
};

const STATUS_COLORS = {
  Active: "bg-[#14472a] text-[#34c76b]",
  Inactive: "bg-[#2a2c3d] text-gray-400",
  Cancelled: "bg-[#451e25] text-red-400",
  Completed: "bg-[#1d2f47] text-blue-400",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
function fmtTime(t) {
  if (!t) return "--";
  const [h, m] = t.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  const hour = h % 12 || 12;
  return `${hour}:${String(m).padStart(2, "0")} ${ampm}`;
}

function hourLabel(h) {
  if (h === 0) return "12 AM";
  if (h < 12) return `${h} AM`;
  if (h === 12) return "12 PM";
  return `${h - 12} PM`;
}

function safeJsonArray(value) {
  if (Array.isArray(value)) return value;
  if (!value || typeof value !== "string") return [];

  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

// function getEventDate(event) {
//   return event?.meeting_date || event?.valid_from_date || event?.created_at;
// }

// function isEventOnDate(event, selected) {
//   const date = getEventDate(event);
//   if (!date) return false;

//   const selectedDate = dayjs(selected);
//   if (event?.recurrence_type && event.recurrence_type !== "onetime") {
//     const from = dayjs(event.valid_from_date || date);
//     const to = dayjs(event.valid_to_date || event.valid_from_date || date);
//     return selectedDate.isSameOrAfter(from, "day") && selectedDate.isSameOrBefore(to, "day");
//   }

//   return dayjs(date).isSame(selectedDate, "day");
// }

// function eventStartValue(event) {
//   const [hour = 0, minute = 0] = String(event?.start_time || "00:00").split(":").map(Number);
//   return hour * 60 + minute;
// }

// function eventDurationLabel(event) {
//   const start = dayjs(`2000-01-01 ${event?.start_time || "00:00"}`);
//   const end = dayjs(`2000-01-01 ${event?.end_time || event?.start_time || "00:00"}`);
//   const minutes = Math.max(end.diff(start, "minute"), 0);
//   if (!minutes) return "No duration";
//   if (minutes < 60) return `${minutes} min`;
//   const hours = Math.floor(minutes / 60);
//   const rest = minutes % 60;
//   return rest ? `${hours}h ${rest}m` : `${hours}h`;
// }

function formatHeaderFromData(data = []) {
  if (!Array.isArray(data) || data.length === 0) return dayjs().format("dddd, MMMM D, YYYY");
  const dates = data
    .map((e) => {
      const raw = e.recurrence_type === "onetime" ? e.meeting_date : e.valid_from_date;
      const d = dayjs(raw);
      return d.isValid() ? d : null;
    })
    .filter(Boolean)
    .sort((a, b) => a.valueOf() - b.valueOf());

  if (dates.length === 0) return dayjs().format("dddd, MMMM D, YYYY");
  return `${dates[0].format("dddd, MMMM D, YYYY")}`;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

// Notice we now pass an explicit 'isAvailable' flag instead of relying on the database's booking_type
function TimelineBlock({ event, isAvailable, onClick }) {
  const type = isAvailable ? "availability" : (event.booking_type?.toLowerCase() || "meeting");
  const colors = BOOKING_COLORS[type] || BOOKING_COLORS.meeting;

  const internalParticipants = safeJsonArray(event.InternalParticipants);
  const clientParticipants = safeJsonArray(event.ClientParticipants);
  const attendanceCount = internalParticipants.length + clientParticipants.length;

  return (
    <button
      onClick={() => onClick?.(isAvailable ? "availability" : "meeting", event)}
      className={`w-full flex items-center justify-between rounded-[4px] border-l-[3px] border-y border-r border-[#ffffff05] px-4 py-3 text-left transition-all hover:opacity-90 ${colors.bg} ${colors.borderL} mb-2`}
    >
      <div>
        <span className={`block text-[13px] font-semibold mb-1 ${colors.text}`}>
          {event.title || (isAvailable ? "Available" : "Meeting")}
        </span>
        <div className={`flex items-center gap-1.5 text-[11px] ${colors.textDim}`}>
          <span>{fmtTime(event.start_time)} – {fmtTime(event.end_time)}</span>
          <span className="opacity-50">·</span>
          {!isAvailable && (
            <>
              <span>{attendanceCount} attendees</span>
              <span className="opacity-50">·</span>
            </>
          )}
          <span>{event.days_of_week || "Mon, Tue, Wed, Thu, Fri"}</span>
        </div>
      </div>
      <span className={`text-[11px] font-medium px-2.5 py-0.5 rounded ${colors.badge} capitalize`}>
        {isAvailable ? "Available" : type}
      </span>
    </button>
  );
}

function MeetingCard({ event, isAvailable, onClick, onEdit }) {
  // const type = isAvailable ? "availability" : (event.booking_type?.toLowerCase() || "meeting");
  // const colors = BOOKING_COLORS[type] || BOOKING_COLORS.meeting;
  const statusColor = STATUS_COLORS[event.status] || STATUS_COLORS.Active;

  return (
    <div
      onClick={() => onClick?.(isAvailable ? "availability" : "meeting", event)}
      className="relative cursor-pointer rounded-xl border border-[#272938] bg-[#1a1c29] p-4 flex flex-col gap-3 hover:bg-[#1e2030] transition-colors"
    >
      <button
        onClick={(e) => { 
          e.stopPropagation(); 
          onEdit?.(isAvailable ? "availability" : "meeting", event); 
        }}
        className="absolute top-3 right-3 p-1.5 rounded-md hover:bg-[#272938] text-gray-500 hover:text-gray-300 transition"
      >
        <FaEdit size={14} />
      </button>

      <div className="flex items-center justify-between pr-6">
        <h3 className="text-sm font-semibold text-gray-100 truncate">{event.title || (isAvailable ? "Availability Block" : "Untitled")}</h3>
        <span className={`text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded ${statusColor}`}>
          {event.status || 'Active'}
        </span>
      </div>

      <div className="flex flex-col gap-1.5 text-xs text-gray-400">
        <span className="flex items-center gap-2">
          <FaClock className="text-[#6e58d1]" />
          {fmtTime(event.start_time)} - {fmtTime(event.end_time)}
        </span>
        {event.HostName && (
          <span className="flex items-center gap-2">
            <FaUser className="text-[#6e58d1]" />
            {event.HostName}
          </span>
        )}
      </div>
    </div>
  );
}

// ─── Calendar Sidebar ─────────────────────────────────────────────────────────
function CalendarSidebar({ meetings, availability, selected, setSelected }) {
  const [viewMonth, setViewMonth] = useState(dayjs(selected));

  // Combine both tables just for placing dots on the calendar
  const daysWithEvents = useMemo(() => {
    const set = new Set();
    [...meetings, ...availability].forEach((e) => {
      const d = e.recurrence_type === "onetime" ? e.meeting_date : e.valid_from_date;
      if (d) set.add(dayjs(d).format("YYYY-MM-DD"));
    });
    return set;
  }, [meetings, availability]);

  const startOfMonth = viewMonth.startOf("month");
  const daysInMonth = viewMonth.daysInMonth();
  const startDow = startOfMonth.day(); 
  const totalCells = Math.ceil((startDow + daysInMonth) / 7) * 7;

  const upcomingMeetings = useMemo(() => meetings.slice(0, 5), [meetings]);

  return (
    <aside className="w-[280px] shrink-0 bg-[#14151f] border-r border-[#212330] flex flex-col h-full overflow-y-auto text-gray-300">
      {/* Title */}
      <div className="px-5 py-5 flex items-center gap-2 text-white border-b border-[#212330]">
        <FaCalendarAlt className="text-[#6e58d1] text-lg" />
        <h2 className="text-[15px] font-bold tracking-wide">Schedule</h2>
      </div>

      {/* Month nav */}
      <div className="px-5 pt-5 pb-4 border-b border-[#212330]">
        <div className="flex items-center justify-between mb-4">
          <button onClick={() => setViewMonth(v => v.subtract(1, "month"))} className="p-2 rounded-md bg-[#1a1c29] border border-[#272938] hover:bg-[#212330] text-gray-400 transition-colors">
            <FaChevronLeft className="w-3 h-3" />
          </button>
          <span className="text-[13px] font-semibold text-gray-200">
            {viewMonth.format("MMMM YYYY")}
          </span>
          <button onClick={() => setViewMonth(v => v.add(1, "month"))} className="p-2 rounded-md bg-[#1a1c29] border border-[#272938] hover:bg-[#212330] text-gray-400 transition-colors">
            <FaChevronRight className="w-3 h-3" />
          </button>
        </div>

        {/* Day headers & Grid */}
        <div className="grid grid-cols-7 mb-2">
          {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d, i) => (
            <div key={i} className="text-center text-[10px] font-medium text-gray-500 py-1">{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-y-1">
          {Array.from({ length: totalCells }).map((_, idx) => {
            const dayNum = idx - startDow + 1;
            if (dayNum < 1 || dayNum > daysInMonth) return <div key={idx} className="h-8" />;
            const date = viewMonth.date(dayNum);
            const dateStr = date.format("YYYY-MM-DD");
            const isSelected = dayjs(selected).format("YYYY-MM-DD") === dateStr;
            const hasEvent = daysWithEvents.has(dateStr);

            return (
              <button
                key={idx}
                onClick={() => setSelected(date.toDate())}
                className={`relative flex flex-col items-center justify-center h-8 w-full rounded-md text-[12px] font-medium transition-all
                  ${isSelected ? "bg-[#3e327a] text-[#d0c5fb]" : "text-gray-400 hover:bg-[#1a1c29]"}`}
              >
                {dayNum}
                {hasEvent && !isSelected && <span className="absolute bottom-1 w-1 h-1 rounded-full bg-[#6e58d1]" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Legend & Search & Upcoming (Kept exactly as before) */}
      <div className="px-5 py-4 border-b border-[#212330]">
        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-3">Legend</p>
        <div className="grid grid-cols-2 gap-y-2 text-[11px] text-gray-400">
          <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-[#6e58d1]" /> Upcoming</div>
          <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-gray-500" /> Past</div>
          <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-[#21b35b]" /> Available</div>
          <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-red-500" /> Leave/Vacation</div>
        </div>
      </div>
      <div className="px-5 py-5 flex-1">
        <div className="flex items-center justify-between mb-3">
          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Upcoming</p>
          <span className="bg-[#1a1c29] text-gray-400 border border-[#272938] text-[10px] px-1.5 py-0.5 rounded font-bold">
            {upcomingMeetings.length}
          </span>
        </div>
        <div className="space-y-3">
          {upcomingMeetings.map((e) => (
            <div key={e.meeting_id} className="bg-[#1a1c29] border border-[#272938] rounded-lg p-3">
              <div className="flex justify-between items-start mb-1.5">
                <p className="text-[13px] font-semibold text-[#e2ddfc] truncate pr-2">{e.title}</p>
              </div>
              <div className="text-[11px] text-gray-500 flex flex-col gap-1">
                <span className="flex items-center gap-1.5"><FaClock className="w-2.5 h-2.5"/> {fmtTime(e.start_time)} – {fmtTime(e.end_time)}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}

// ─── Main Scheduler ───────────────────────────────────────────────────────────
export default function MeetingScheduler() {
  const user = readUserFromSession();
  const currentUserId = user?.userId;
  const today = useMemo(() => new Date(), []);

  const { config, data = [] } = useList();
  const { data: TicketMaster } = useTicketMaster({ employeeId: currentUserId });

  // 1. DATA SEPARATION:
  // Meetings come from `data`. 
  // Availability will come from a different API eventually, so we mock it as a separate array here.
  const meetings = data || []; 
  const availability = []; // <-- Fetch your separate availability table data here later!

  const meetingCount = meetings.length;
  const availabilityCount = availability.length;

  const dynamicConfig = useMemo(() => ({
    ...meetingFormConfig,
    fields: [
      ...meetingFormConfig.fields,
      {
        label: "Ticket",
        name: "ticket",
        type: "select",
        ui: "mui",
        required: false,
        dataType: "string",
        apiKey: "ticket_id",
        optionsResolver: ({ formData }) => {
          const selectedProjectId = formData?.project?.value?.id;
          return (TicketMaster || [])
            .filter((ticket) => selectedProjectId ? ticket.Project_Id === selectedProjectId : true)
            .map((ticket) => ({ value: { id: ticket.Issue_Id, name: ticket.Title }, label: ticket.Title }));
        },
      },
    ],
  }), [TicketMaster, meetingFormConfig]);

  // ── State for Modal and Editing
  const [selected, setSelected] = useState(today);
  const [activeTab, setActiveTab] = useState("timeline");
  const [modalMode, setModalMode] = useState(null); 
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [openModal, setOpenModal] = useState(false);

  const openModalFn = useCallback((mode, eventData = null) => {
    setModalMode(mode);
    setSelectedEvent(eventData);
    setOpenModal(true);
  }, []);

  const closeModal = useCallback(() => {
    setOpenModal(false);
    setModalMode(null);
    setSelectedEvent(null);
  }, []);

  // 2. COMBINE FOR TIMELINE
  // We combine both tables into a single array purely to render the Timeline UI blocks correctly by time.
  // We tag them with `_isAvailability` so the UI knows how to color them.
  const allTimelineEvents = useMemo(() => [
    ...meetings.map(m => ({ ...m, _isAvailability: false })),
    ...availability.map(a => ({ ...a, _isAvailability: true }))
  ], [meetings, availability]);

  const slotsByHour = useMemo(() => {
    const grouped = {};
    allTimelineEvents.forEach((event) => {
      const hour = parseInt(event.start_time?.split(":")[0] ?? "0", 10);
      if (!grouped[hour]) grouped[hour] = [];
      grouped[hour].push(event);
    });
    return grouped;
  }, [allTimelineEvents]);

  const hasTimelineData = HOURS.some((h) => (slotsByHour[h] || []).length > 0);

  return (
    <div className="flex h-[calc(100vh-120px)] bg-[#0f111a] font-sans overflow-hidden text-gray-200 selection:bg-[#6e58d1]/30">
      
      {/* Sidebar - Pass both arrays so calendar dots show for both */}
      <CalendarSidebar meetings={meetings} availability={availability} selected={selected} setSelected={setSelected} />

      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        {/* Top Header */}
        <header className="px-8 pt-8 pb-4 flex flex-col md:flex-row items-start md:items-center justify-between shrink-0 border-b border-transparent">
          <div>
            <h1 className="text-[22px] font-semibold text-white tracking-wide">
              {formatHeaderFromData(meetings)}
            </h1>
            <p className="text-[13px] text-gray-500 mt-1">
              {meetingCount} meeting{meetingCount !== 1 ? "s" : ""} · {availabilityCount} availability block{availabilityCount !== 1 ? "s" : ""}
            </p>
          </div>

          <div className="flex items-center gap-3 mt-4 md:mt-0">
            {(config?.actionButtons || []).map((btn) => (
              <button
                key={btn.name}
                onClick={() => openModalFn(btn.name, null)} 
                className={`flex items-center gap-2 px-5 py-2.5 text-[13px] rounded-lg border border-[#272938] hover:bg-[#1a1c29] text-white transition-all font-semibold shadow-sm ${btn.className || ''}`}
              >
                <span className="text-gray-300">{btn.icon}</span>
                {btn.label}
              </button>
            ))}
            <button className="p-2.5 rounded-lg border border-[#272938] hover:bg-[#1a1c29] text-gray-400 transition-all shadow-sm">
              <FaEllipsisH />
            </button>
          </div>
        </header>

        {/* Segmented Tabs */}
        <div className="px-8 pb-6 shrink-0 border-b border-[#1b1d29]">
          <div className="inline-flex rounded-xl border border-[#272938] bg-transparent p-[3px]">
            {(config?.tabConfig || []).map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={`flex items-center justify-center min-w-[100px] px-5 py-1.5 text-[13px] font-semibold rounded-lg transition-all
                  ${activeTab === key
                    ? "bg-[#1a1c29] text-white border border-[#272938] shadow-sm"
                    : "text-gray-400 hover:text-gray-200 border border-transparent"
                  }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto relative pb-20">
          
          {/* ── Timeline View ── */}
          {activeTab === "timeline" && (
            <div className="relative">
              {!hasTimelineData ? (
                <div className="flex flex-col items-center justify-center py-20 text-gray-600">
                  <FaClock className="text-4xl mb-3 opacity-20" />
                  <p className="text-sm">No events on the timeline for this period.</p>
                </div>
              ) : (
                <div className="flex flex-col w-full">
                  {HOURS.map((h) => {
                    const blocks = slotsByHour[h] || [];
                    return (
                      <div key={h} className="relative flex w-full min-h-[70px] border-b border-[#1b1d29]">
                        <div className="w-24 shrink-0 text-right pr-6 pt-3">
                          <span className="text-[12px] font-medium text-gray-500">{hourLabel(h)}</span>
                        </div>
                        <div className="flex-1 pb-3 pt-3 pr-8 flex flex-col gap-2">
                          {blocks.map((e) => (
                            <TimelineBlock 
                              key={e.meeting_id} 
                              event={e} 
                              isAvailable={e._isAvailability} 
                              onClick={openModalFn} 
                            />
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
              <div className="fixed bottom-6 right-1/2 translate-x-1/2">
                 <button className="w-10 h-10 rounded-full bg-[#1a1c29] border border-[#272938] flex items-center justify-center text-gray-400 hover:text-white hover:bg-[#212330] shadow-[0_0_15px_rgba(0,0,0,0.5)] transition-colors">
                   <FaArrowDown size={14} />
                 </button>
              </div>
            </div>
          )}

          {/* ── Meetings View ── */}
          {activeTab === "meetings" && (
            <div className="px-8 py-6 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {meetings.length === 0 ? (
                <p className="text-sm text-gray-600 col-span-full py-10 text-center">No meetings scheduled.</p>
              ) : (
                meetings.map((e) => <MeetingCard key={e.meeting_id} event={e} isAvailable={false} onEdit={openModalFn} onClick={openModalFn} />)
              )}
            </div>
          )}

          {/* ── Availability View ── */}
          {activeTab === "availability" && (
            <div className="px-8 py-6 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {availability.length === 0 ? (
                 <p className="text-sm text-gray-600 col-span-full py-10 text-center">No availability blocks set.</p>
              ) : (
                availability.map((e) => <MeetingCard key={e.meeting_id} event={e} isAvailable={true} onEdit={openModalFn} onClick={openModalFn} />)
              )}
            </div>
          )}
        </div>
      </main>

      {/* Reusable Modal Layer for Create and Edit */}
      {openModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm" onClick={closeModal}>
          <div className="bg-[#14151f] border border-[#272938] rounded-2xl shadow-2xl w-full max-w-[960px] max-h-[90vh] flex flex-col overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#272938] shrink-0 bg-[#1a1c29]">
              <h2 className="text-base font-semibold text-white">
                {selectedEvent 
                  ? (modalMode === "meeting" ? "Edit/Reschedule Meeting" : "Edit Availability")
                  : (modalMode === "meeting" ? "Schedule a Meeting" : "Set Availability")
                }
              </h2>
              <button onClick={closeModal} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[#272938] text-gray-400 transition-colors">
                <FaTimes size={14} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 text-gray-300">
              <EntityFormPage
                mode={selectedEvent ? "Edit" : "Create"} 
                config={dynamicConfig}
                module={modalMode === "meeting" ? "Meeting" : "Availability"}
                onSuccessCallback={closeModal}
                context={{ 
                  ...data, 
                  TicketMaster: [...(TicketMaster || [])],
                  isEdit: !!selectedEvent,
                  entityData: selectedEvent,
                  modalMode: modalMode
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
