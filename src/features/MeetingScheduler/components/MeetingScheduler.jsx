


// import { useEffect, useMemo, useState } from "react";




// import { useList } from "../../../packages/ui-List/context/ListContext";
// import EntityFormPage from "../../../packages/crud/pages/EntityFormPage";
// import { meetingFormConfig } from "../config/Meetingform.config";
// import { MeetinglFieldConfig } from "../config/Meetingcreate.config";
// import { FaBullseye, FaCalendarAlt, FaRegEnvelopeOpen } from "react-icons/fa";
// import { readUserFromSession } from "../../../core/auth/useCurrentUser";
// import dayjs from "dayjs";
// import { useTicketMaster } from "../../tickets/hooks/useTicketMaster";
// import CalendarSidebar from "./CalendarSidebar";
// import TimelineBlock from "./TimelineBlock";
// import { HOURS } from "./constants";
// import Badge from "./Badge";
// import { fmtTime } from "./helpers";



// export default function MeetingScheduler() {
//   const user = readUserFromSession();
//   const currentUserId = user?.userId;
//   const today = useMemo(() => new Date(), []);
//   const { config, data } = useList();
//   const { data: TicketMaster } = useTicketMaster({ employeeId: currentUserId });
//   const ticketMasterOption = TicketMaster?.map(issue => ({
//     value: { id: issue.Issue_Id, name: issue.Title },
//     label: issue.Title,
//   }));
//   const [selected, setSelected] = useState(today);
//   const [activeTab, setActiveTab] = useState("timeline");
//   const [events, setEvents] = useState({});

//   useEffect(() => {
//     setEvents(data || []); // Directly use API data
//   }, [data]);
//   const meetingCount = data.filter((e) => e.booking_type === "meeting").length;
//   const availabilityCount = data.filter((e) => e.booking_type === "Availability").length;
//   // ── Slots by hour for timeline
//   const slotsByHour = useMemo(() => {
//     const grouped = {};
//     data.forEach((event) => {
//       const hour = parseInt(event.start_time?.split(":")[0]);
//       if (!grouped[hour]) grouped[hour] = [];
//       grouped[hour].push(event);
//     });
//     return grouped;
//   }, [data]);
//   // ── Modal state
//   const [modalMode, setModalMode] = useState(null);
//   const [openModel, setOpenModel] = useState(false);
//   const openModal = (mode) => {
//     setModalMode(mode);
//     setOpenModel(true);
//   };
//   const closeModal = () => setOpenModel(false);
//   // function formatHeaderFromData(data = []) {
//   //   if (!data || data.length === 0) return "";

//   //   // Extract all valid dates from your data
//   //   const dates = data
//   //     .map((e) => dayjs(e.valid_from_date || e.fromTime)) // fallback if fromTime is used
//   //     .sort((a, b) => a.valueOf() - b.valueOf());

//   //   if (!dates.length) return "";

//   //   const from = dates[0];
//   //   const to = dates[dates.length - 1];

//   //   if (from.isSame(to, "day")) {
//   //     // Same day → full date format
//   //     return from.format("dddd, D MMMM YYYY");
//   //   }

//   //   // Different days → range format
//   //   return `${from.format("D MMM YYYY")} – ${to.format("D MMM YYYY")}`;
//   // }
//    function formatHeaderFromData(data = []) {
//     if (!Array.isArray(data) || data.length === 0) return "";
//     const dates = data
//       .map((e) => {
//         const rawDate =
//           e.recurrence_type === "onetime"
//             ? e.meeting_date
//             : e.valid_from_date;

//         const d = dayjs(rawDate);

//         return d.isValid() ? d : null;
//       })
//       .filter(Boolean)
//       .sort((a, b) => a.valueOf() - b.valueOf());

//     if (dates.length === 0) return "";

//     const from = dates[0];
//     const to = dates[dates.length - 1];
//     // If same day → show full readable date
//     if (from.isSame(to, "day")) {
//       return from.format("dddd, D MMMM YYYY");
//     }

//     // If different days → show range
//     return `${from.format("D MMM YYYY")} – ${to.format("D MMM YYYY")}`;
//   }
//   const ticketField = {
//     label: "Ticket",
//     name: "ticket",
//     type: "select",
//     ui: "mui",
//     required: false,
//     dataType: "string",
//     apiKey: "ticket_id",
//     options: ticketMasterOption,
//     // initValueResolver: ({ context }) =>
//     //   context.isEdit ? context.entityData?.ticket_id ?? "" : "",
//   };
//   const dynamicConfig = {
//     ...meetingFormConfig,
//     fields: [...meetingFormConfig.fields, ticketField] // Add status field on edit

//   };

//   return (
//     <div className="flex h-screen bg-gray-50 font-sans overflow-hidden">
//       {/* ── Left sidebar */}
//       {/* <CalendarSidebar data={data} setSelected={setSelected} /> */}
//       <CalendarSidebar data={data} setSelected={setSelected} />

//       {/* ── Main content */}
//       <main className="flex-1 flex flex-col overflow-hidden">
//         {/* Top bar */}
//         <header className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between shrink-0">
//           <div>
//             <h1 className="text-base font-semibold text-gray-900">
//               {/* {selected.toLocaleDateString("en-IN", {
//                 weekday: "long",
//                 day: "numeric",
//                 month: "long",
//                 year: "numeric",
//               })} */}
//               {formatHeaderFromData(data)}
//             </h1>
//             <p className="text-xs text-gray-400 mt-0.5">

//               {meetingCount} meeting{meetingCount !== 1 ? "s" : ""} · {availabilityCount} availability block{availabilityCount !== 1 ? "s" : ""}
//             </p>
//           </div>
//           <div className="flex gap-2">
//             {config?.actionButtons?.map((btn) => (
//               <button
//                 key={btn.label}
//                 onClick={() => openModal(btn.name)}
//                 className={`flex items-center gap-1.5 px-4 py-2 text-sm rounded-lg transition-all ${btn.className}`}
//               >
//                 <span>{btn.icon}</span>
//                 {btn.label}
//               </button>
//             ))}
//           </div>
//         </header>

//         {/* Tabs */}
//         <div className="bg-white border-b border-gray-100 px-6 flex gap-0 shrink-0">
//           {config?.tabConfig?.map(({ key, label }) => (
//             <button
//               key={key}
//               onClick={() => setActiveTab(key)}
//               className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${activeTab === key
//                 ? "border-indigo-600 text-indigo-600"
//                 : "border-transparent text-gray-500 hover:text-gray-700"
//                 }`}
//             >
//               {label}
//             </button>
//           ))}
//         </div>

//         {/* Tab panels */}
//         <div className="flex-1 overflow-y-auto">
//           {/* ── Timeline */}
//           {activeTab === "timeline" && (
//             <div className="px-6 py-4">
//               {HOURS.map((h) => {
//                 const label = h <= 12 ? `${h} AM` : `${h - 12} PM`;
//                 const blocks = slotsByHour[h] || [];
//                 return (
//                   <div key={h} className="flex gap-3 min-h-[52px]">
//                     <div className="w-12 text-right shrink-0 pt-1">
//                       <span className="text-[11px] text-gray-400 font-medium">{label}</span>
//                     </div>
//                     <div className="flex-1 border-t border-gray-100 pt-1 pb-1 flex flex-wrap gap-2">
//                       {blocks.map((e) => (
//                         <TimelineBlock key={e.id} event={e} />
//                       ))}
//                     </div>
//                   </div>
//                 );
//               })}
//             </div>
//           )}

//           {/* ── Meetings list */}
//           {activeTab === "meetings" && (
//             <div className="px-6 py-4 space-y-3">
//               {data.length === 0 ? (
//                 <div className="flex flex-col items-center justify-center py-16 text-gray-400">
//                   <span className="text-4xl mb-3"><FaRegEnvelopeOpen /></span>
//                   <p className="text-sm">No meetings scheduled</p>
//                   <button onClick={() => openModal("meeting")} className="mt-3 text-xs text-indigo-600 hover:underline">
//                     + Add a meeting
//                   </button>
//                 </div>
//               ) : (
//                 data.map((e) => (
//                   <div key={e.id}

//                     // onClick={() => setDetail(e)} 
//                     className="bg-white border border-gray-100 rounded-xl p-4 cursor-pointer hover:shadow-sm hover:border-indigo-200 transition-all">
//                     <div className="flex items-start justify-between mb-2">
//                       <div>
//                         <h3 className="text-sm font-semibold text-gray-900">{e.title}</h3>
//                         <p className="text-xs text-gray-400 mt-0.5">
//                           {fmtTime(e.fromTime)} – {fmtTime(e.endTime)}
//                         </p>
//                       </div>
//                       <div className="flex items-center gap-1.5">
//                         <Badge status={e.meetingType} />
//                         <Badge status={e.status} />
//                       </div>
//                     </div>
//                   </div>
//                 ))
//               )}
//             </div>
//           )}

//           {/* ── Availability list */}
//           {activeTab === "availability" && (
//             <div className="px-6 py-4 space-y-2">
//               {avail.length === 0 ? (
//                 <div className="flex flex-col items-center justify-center py-16 text-gray-400">
//                   <span className="text-4xl mb-3"><FaCalendarAlt /></span>
//                   <p className="text-sm">No availability set for this day</p>
//                   <button onClick={() => openModal("availability")} className="mt-3 text-xs text-indigo-600 hover:underline">
//                     + Set availability
//                   </button>
//                 </div>
//               ) : (
//                 avail.map((e) => (
//                   <div key={e.id}
//                     // onClick={() => setDetail(e)}
//                     className="bg-white border border-gray-100 rounded-xl p-4 cursor-pointer hover:shadow-sm transition-all">
//                     <div className="flex items-center justify-between">
//                       <div>
//                         <Badge status={e.availabilityType} />
//                         <p className="text-xs text-gray-500 mt-1.5">
//                           {e.isFullDay ? "Full Day" : `${fmtTime(e.fromTime)} – ${fmtTime(e.endTime)}`}
//                         </p>
//                         {e.reason && (
//                           <p className="text-xs text-gray-400 mt-0.5">{e.reason}</p>
//                         )}
//                       </div>
//                       <div className="text-right text-[10px] text-gray-300 font-mono tracking-widest">
//                         {e.daysOfWeek}
//                       </div>
//                     </div>
//                   </div>
//                 ))
//               )}
//             </div>
//           )}
//         </div>

//         {/* ── Modal */}
//         {openModel && (
//           <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={closeModal}>
//             <div className="bg-white rounded-2xl shadow-2xl w-full max-w-[1000px] max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
//               <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-gray-100">
//                 <div>
//                   <h2 className="text-[15px] font-semibold text-gray-900">
//                     {modalMode === "meeting" ? "Schedule Meeting" : "Set Availability"}
//                   </h2>
//                 </div>
//                 <button onClick={closeModal} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
//                   ✕
//                 </button>
//               </div>
//               <EntityFormPage
//                 mode="Create"
//                 // config={{
//                 //   ...meetingFormConfig,
//                 //   theme: {
//                 //     formContainer: "flex flex-col h-full min-h-0",
//                 //     footer: "flex-shrink-0 p-4 border-t border-gray-200 bg-gray-50 flex justify-end items-center gap-3",
//                 //   },
//                 //   fields: MeetinglFieldConfig(),
//                 // }}
//                 config={dynamicConfig}
//                 module={modalMode === "meeting" ? "Meeting" : "Availability"}
//                 onSuccessCallback={() => {
//                   setOpenModel(false);
//                   // queryClient.invalidateQueries({ queryKey: ["MeetingData"] });
//                 }}
//                 context={{ data }}
//               />
//             </div>
//           </div>
//         )}
//       </main>
//     </div>
//   );
// }


import dayjs from "dayjs";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore";
import isSameOrAfter from "dayjs/plugin/isSameOrAfter";
import { FaPlus, FaCalendarAlt, FaVideo, FaPhone, FaUsers, FaChevronLeft, FaChevronRight, FaClock, FaRegCircle, FaCheckCircle, FaTimes, FaUser, FaEdit } from "react-icons/fa";


import { useList } from "../../../packages/ui-List/context/ListContext";
import { useTicketMaster } from "../../tickets/hooks/useTicketMaster";
import { readUserFromSession } from "../../../core/auth/useCurrentUser";
import EntityFormPage from "../../../packages/crud/pages/EntityFormPage";
import { meetingFormConfig } from "../config/Meetingform.config";
import { useCallback, useMemo, useState } from "react";
import { useMasterData } from "../../../core/master/masterCall/useMasterData";

dayjs.extend(isSameOrBefore);
dayjs.extend(isSameOrAfter);

// ─── Constants ────────────────────────────────────────────────────────────────
const HOURS = Array.from({ length: 9 }, (_, i) => i + 10); // 7 AM – 8 PM

const BOOKING_COLORS = {
  meeting: { bg: "bg-indigo-50", border: "border-indigo-200", text: "text-indigo-700", dot: "bg-indigo-500" },
  interview: { bg: "bg-violet-50", border: "border-violet-200", text: "text-violet-700", dot: "bg-violet-500" },
  demo: { bg: "bg-amber-50", border: "border-amber-200", text: "text-amber-700", dot: "bg-amber-500" },
  discussion: { bg: "bg-teal-50", border: "border-teal-200", text: "text-teal-700", dot: "bg-teal-500" },
  supportCall: { bg: "bg-rose-50", border: "border-rose-200", text: "text-rose-700", dot: "bg-rose-500" },
  Availability: { bg: "bg-emerald-50", border: "border-emerald-200", text: "text-emerald-700", dot: "bg-emerald-500" },
};

const STATUS_COLORS = {
  Active: "bg-emerald-100 text-emerald-700",
  Inactive: "bg-gray-100 text-gray-500",
  Cancelled: "bg-red-100 text-red-600",
  Completed: "bg-blue-100 text-blue-600",
};

const METHOD_ICONS = {
  video: <FaVideo className="w-3 h-3" />,
  phone: <FaPhone className="w-3 h-3" />,
  inperson: <FaUsers className="w-3 h-3" />,
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

function formatHeaderFromData(data = []) {
  if (!Array.isArray(data) || data.length === 0) return dayjs().format("dddd, D MMMM YYYY");
  const dates = data
    .map((e) => {
      const raw = e.recurrence_type === "onetime" ? e.meeting_date : e.valid_from_date;
      const d = dayjs(raw);
      return d.isValid() ? d : null;
    })
    .filter(Boolean)
    .sort((a, b) => a.valueOf() - b.valueOf());

  if (dates.length === 0) return dayjs().format("dddd, D MMMM YYYY");
  const from = dates[0];
  const to = dates[dates.length - 1];
  if (from.isSame(to, "day")) return from.format("dddd, D MMMM YYYY");
  return `${from.format("D MMM")} – ${to.format("D MMM YYYY")}`;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function Badge({ label, colorClass }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-wide uppercase ${colorClass}`}>
      {label}
    </span>
  );
}


function TimelineBlock({ event, onClick }) {
  const type = event.booking_type?.toLowerCase() || "meeting";
  const colors = BOOKING_COLORS[type] || BOOKING_COLORS.meeting;

  const internalParticipants = event.InternalParticipants
    ? JSON.parse(event.InternalParticipants)
    : [];
  const clientParticipants = event.ClientParticipants
    ? JSON.parse(event.ClientParticipants)
    : [];

  const attendanceCount = internalParticipants.length + clientParticipants.length;

  return (
    <button
      onClick={() => onClick?.(event)}
      className={`group flex-1 min-w-[160px] max-w-[260px] rounded-lg border px-3 py-2 text-left transition-all hover:shadow-md ${colors.bg} ${colors.border}`}
    >
      {/* Top line: Title and Booking Type Badge */}
      <div className="flex justify-between items-center mb-1">
        <span className={`text-[12px] font-bold truncate ${colors.text}`}>
          {event.title}
        </span>
        <span
          className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${colors.dot} bg-opacity-20`}
        >
          {event.booking_type?.toUpperCase()}
        </span>
      </div>

      {/* Second line: Time and Participants */}
      <div className="flex items-center gap-3 text-[10px] text-gray-500">
        <div className="flex items-center gap-1">
          <FaClock className="w-3 h-3" />
          {fmtTime(event.start_time)} – {fmtTime(event.end_time)}
        </div>

        <div className="flex items-center gap-1">
          <FaUser className="w-3 h-3" />
          {attendanceCount} Participants
        </div>
      </div>

      {/* Optional Host info */}
      {/* {event.HostName && (
        <div className="text-[10px] text-gray-400 mt-1 truncate">
          Host: {event.HostName}
        </div>
      )} */}
    </button>
  );
}

// Participant Avatar Component
const ParticipantAvatar = ({ name }) => (
  <div
    title={name}
    className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-bold border-2 border-white shadow-sm"
  >
    {name?.charAt(0)?.toUpperCase() || "?"}
  </div>
);

// Participants Group Component
const ParticipantsGroup = ({ participants = [] }) => {
  const visible = participants.slice(0, 4);
  const remaining = participants.length - visible.length;

  return (
    <div className="flex items-center -space-x-3">
      {visible.map((p, idx) => (
        <ParticipantAvatar key={idx} name={p.name} />
      ))}
      {remaining > 0 && (
        <div className="w-2  rounded-full bg-gray-700 text-white flex items-center justify-center text-xs font-semibold border-2 border-white">
          +{remaining}
        </div>
      )}
    </div>
  );
};
function MeetingCard({ event, onClick, onEdit }) {
  const allParticipants = [
    ...JSON.parse(event.ClientParticipants || "[]"),
    ...JSON.parse(event.InternalParticipants || "[]"),
  ];

  const participants = allParticipants.map((p) => ({
    id: p.participant_id,
    name: p.participant_name || "User",
    avatar: p.avatar_url || null, // Add avatar URL if available
  }));

  const type = event.booking_type?.toLowerCase() || "meeting";
  const colors = BOOKING_COLORS[type] || BOOKING_COLORS.meeting;
  const statusColor = STATUS_COLORS[event.status] || STATUS_COLORS.Active;

  return (
    <div
      onClick={() => onClick?.(event)}
      className="
        relative
        cursor-pointer
        rounded-2xl
        border border-slate-200
        bg-gradient-to-br from-white via-slate-50 to-white
        shadow-md
        hover:shadow-xl
        transition-all duration-300
        p-5
        flex flex-col
        gap-3
      "
    >
      {/* EDIT BUTTON */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onEdit?.(event);
        }}
        className="
          absolute top-3 right-3
          p-2
          rounded-lg
          hover:bg-slate-100
          transition
          text-slate-500 hover:text-slate-900
        "
      >
        <FaEdit size={16} />
      </button>

      {/* FIRST LINE: Title | Ticket Title | Type | Status */}
      <div className="flex items-center gap-2 flex-wrap">
        {/* Main Title */}
        <h3 className="text-sm font-semibold text-slate-900 truncate">{event.title}</h3>

        {/* Ticket Title */}
        {event.Ticket_Title && (
          <span className="text-xs font-medium text-indigo-600 truncate">
            [{event.Ticket_Title}]
          </span>
        )}

        {/* Booking Type Badge */}
        <Badge
          label={type}
          colorClass={`${colors.bg} ${colors.text} text-[10px] font-medium`}
        />

        {/* Status Badge */}
        <Badge
          label={event.status}
          colorClass={`${statusColor} text-[10px] font-medium`}
        />
      </div>

      {/* SECOND LINE: Time | Host | Participants | Recurrence */}
      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600">
        {/* Time */}
        <span className="flex items-center gap-1">
          <FaClock className="text-indigo-500" />
          <strong>{fmtTime(event.start_time)}</strong> - <strong>{fmtTime(event.end_time)}</strong>
        </span>

        {/* Host */}
        {event.HostName && (
          <span className="flex items-center gap-1">
            <FaUsers className="text-indigo-500" />
            <span className="font-medium truncate">{event.HostName}</span>
          </span>
        )}

        {/* Participants */}
        {participants.length > 0 && (
          <span className="flex items-center gap-1">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-0.5">
              Participants:
            </p>
            <ParticipantsGroup participants={participants} />
          </span>
        )}

        {/* Recurrence */}
        {event.recurrence_type && (
          <span className="px-2 py-0.5 rounded-full bg-indigo-600 text-white text-[10px] font-semibold uppercase">
            {event.recurrence_type}
          </span>
        )}

        {/* Meeting Method */}
        {event.meet_method && (
          <span className="flex items-center gap-1">
            <FaVideo className="text-indigo-500" />
            {event.meet_method}
          </span>
        )}
      </div>

      {/* THIRD LINE: Summary */}
      {event.meeting_summary && (
        <p className="text-xs text-slate-500 mt-2 line-clamp-2">
          {event.meeting_summary}
        </p>
      )}
    </div>
  );
}
function AvailabilityCard({ event }) {
  const colors = BOOKING_COLORS.Availability;
  return (
    <div className="bg-white border border-gray-100 rounded-xl p-4 hover:shadow-sm transition-all">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className={`w-2 h-2 rounded-full ${colors.dot}`} />
          <div>
            <p className="text-sm font-medium text-gray-800">
              {event.title || "Available"}
            </p>
            <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
              <FaClock className="w-2.5 h-2.5" />
              {fmtTime(event.start_time)} – {fmtTime(event.end_time)}
            </p>
          </div>
        </div>
        {event.days_of_week && (
          <span className="text-[10px] font-mono text-gray-300 tracking-widest uppercase">
            {event.days_of_week}
          </span>
        )}
      </div>
    </div>
  );
}

// ─── Calendar Sidebar ─────────────────────────────────────────────────────────
function CalendarSidebar({ data, selected, setSelected }) {
  const [viewMonth, setViewMonth] = useState(dayjs(selected));

  const daysWithEvents = useMemo(() => {
    const set = new Set();
    data.forEach((e) => {
      const d = e.recurrence_type === "onetime" ? e.meeting_date : e.valid_from_date;
      if (d) set.add(dayjs(d).format("YYYY-MM-DD"));
    });
    return set;
  }, [data]);

  const startOfMonth = viewMonth.startOf("month");
  const daysInMonth = viewMonth.daysInMonth();
  const startDow = startOfMonth.day(); // 0=Sun
  const totalCells = Math.ceil((startDow + daysInMonth) / 7) * 7;

  const upcomingMeetings = useMemo(() =>
    data
      .filter((e) => e.booking_type?.toLowerCase() === "meeting")
      .slice(0, 5),
    [data]
  );

  return (
    <aside className="w-64 shrink-0 bg-white border-r border-gray-100 flex flex-col h-full overflow-y-auto">
      {/* Month nav */}
      <div className="px-4 pt-5 pb-3">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => setViewMonth(v => v.subtract(1, "month"))}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <FaChevronLeft className="w-3 h-3" />
          </button>
          <span className="text-sm font-semibold text-gray-800">
            {viewMonth.format("MMMM YYYY")}
          </span>
          <button
            onClick={() => setViewMonth(v => v.add(1, "month"))}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <FaChevronRight className="w-3 h-3" />
          </button>
        </div>

        {/* Day headers */}
        <div className="grid grid-cols-7 mb-1">
          {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
            <div key={i} className="text-center text-[10px] font-semibold text-gray-400 py-1">{d}</div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-y-0.5">
          {Array.from({ length: totalCells }).map((_, idx) => {
            const dayNum = idx - startDow + 1;
            if (dayNum < 1 || dayNum > daysInMonth) return <div key={idx} />;
            const date = viewMonth.date(dayNum);
            const dateStr = date.format("YYYY-MM-DD");
            const isSelected = dayjs(selected).format("YYYY-MM-DD") === dateStr;
            const isToday = date.isSame(dayjs(), "day");
            const hasEvent = daysWithEvents.has(dateStr);

            return (
              <button
                key={idx}
                onClick={() => setSelected(date.toDate())}
                className={`relative flex flex-col items-center justify-center h-8 w-full rounded-lg text-xs font-medium transition-all
                  ${isSelected ? "bg-indigo-600 text-white" : isToday ? "bg-indigo-50 text-indigo-700" : "text-gray-600 hover:bg-gray-100"}`}
              >
                {dayNum}
                {hasEvent && !isSelected && (
                  <span className="absolute bottom-0.5 w-1 h-1 rounded-full bg-indigo-400" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mx-4 border-t border-gray-100 my-2" />

      {/* Legend */}
      <div className="px-4 pb-3">
        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-2">Legend</p>
        {Object.entries(BOOKING_COLORS).slice(0, 5).map(([key, c]) => (
          <div key={key} className="flex items-center gap-2 py-0.5">
            <span className={`w-2 h-2 rounded-full ${c.dot}`} />
            <span className="text-xs text-gray-500 capitalize">{key}</span>
          </div>
        ))}
      </div>

      <div className="mx-4 border-t border-gray-100 my-2" />

      {/* Upcoming */}
      <div className="px-4 pb-5 flex-1">
        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-2">Upcoming</p>
        {upcomingMeetings.length === 0 ? (
          <p className="text-xs text-gray-400">No upcoming meetings</p>
        ) : upcomingMeetings.map((e) => {
          const colors = BOOKING_COLORS[e.booking_type?.toLowerCase()] || BOOKING_COLORS.meeting;
          return (
            <div key={e.meeting_id} className="flex items-center gap-2 py-1.5 border-b border-gray-50 last:border-0">
              <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${colors.dot}`} />
              <div className="min-w-0">
                <p className="text-xs font-medium text-gray-700 truncate">{e.title}</p>
                <p className="text-[10px] text-gray-400">{fmtTime(e.start_time)}</p>
              </div>
            </div>
          );
        })}
      </div>
    </aside>
  );
}

// ─── Modal ────────────────────────────────────────────────────────────────────
function SchedulerModal({ open, mode, onClose, dynamicConfig, data,TicketMaster }) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-[960px] max-h-[90vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
          <div>
            <h2 className="text-base font-semibold text-gray-900">
              {mode === "meeting" ? "Schedule a Meeting" : "Set Availability"}
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">
              {mode === "meeting"
                ? "Fill in the details to create a new meeting event."
                : "Define when you're available for bookings."}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <FaTimes className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Modal body — scrollable */}
        <div className="flex-1 overflow-y-auto">
          <EntityFormPage
            mode="Create"
            config={dynamicConfig}
            module={mode === "meeting" ? "Meeting" : "Availability"}
            onSuccessCallback={onClose}
            context={{ 
            ...data,
            TicketMaster:[...TicketMaster ]
            }
          }
          />
        </div>
      </div>
    </div>
  );
}

// ─── Empty states ─────────────────────────────────────────────────────────────
function EmptyState({ icon, message, action, onAction }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-gray-400">
      <span className="text-5xl mb-4 opacity-40">{icon}</span>
      <p className="text-sm font-medium text-gray-500">{message}</p>
      {action && (
        <button
          onClick={onAction}
          className="mt-4 text-xs font-semibold text-indigo-600 hover:text-indigo-800 underline underline-offset-2 transition-colors"
        >
          {action}
        </button>
      )}
    </div>
  );
}

// ─── Main Scheduler ───────────────────────────────────────────────────────────
export default function MeetingScheduler() {
  const user = readUserFromSession();
  const currentUserId = user?.userId;
  const today = useMemo(() => new Date(), []);

  const { config, data = [] } = useList();
  const { data: MasterData } = useMasterData();
  // const { data: upcoming } = useUpcomingMeeting();
  const { data: TicketMaster } = useTicketMaster({ employeeId: currentUserId });

  // const ticketOptions = useMemo(
  //   () =>
  //     (TicketMaster || []).map((issue) => ({
  //       value: { id: issue.Issue_Id, name: issue.Title },
  //       label: issue.Title,
  //     })),
  //   [TicketMaster]
  // );
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
            .filter((ticket) => {
              // if project selected, show only tickets for that project
              if (selectedProjectId) {
                return ticket.Project_Id === selectedProjectId;
              }
              return true;
            })
            .map((ticket) => ({
              value: { id: ticket.Issue_Id, name: ticket.Title },
              label: ticket.Title,
            }));
        },
      },
    ],
  }), [TicketMaster, meetingFormConfig]);

  // ── State
  const [selected, setSelected] = useState(today);
  const [activeTab, setActiveTab] = useState("timeline");
  const [modalMode, setModalMode] = useState(null);
  const [openModal, setOpenModal] = useState(false);

  const openModalFn = useCallback((mode) => {
    setModalMode(mode);
    setOpenModal(true);
  }, []);

  const closeModal = useCallback(() => {
    setOpenModal(false);
    setModalMode(null);
  }, []);

  // ── Derived data
  const meetings = useMemo(
    () => data.filter((e) => e.booking_type?.toLowerCase() !== "availability"),
    [data]
  );

  const availability = useMemo(
    () => data.filter((e) => e.booking_type?.toLowerCase() === "availability"),
    [data]
  );

  const meetingCount = meetings.length;
  const availabilityCount = availability.length;

  const slotsByHour = useMemo(() => {
    const grouped = {};
    data.forEach((event) => {
      const hour = parseInt(event.start_time?.split(":")[0] ?? "0", 10);
      if (!grouped[hour]) grouped[hour] = [];
      grouped[hour].push(event);
    });
    return grouped;
  }, [data]);

  const hasTimelineData = HOURS.some((h) => (slotsByHour[h] || []).length > 0);

  return (
    <div className="flex h-[calc(100vh-120px)] bg-gray-50 font-sans overflow-hidden">
      {/* Sidebar */}
      <CalendarSidebar data={data} selected={selected} setSelected={setSelected} />

      {/* Main */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar */}
        <header className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between shrink-0">
          <div>
            <h1 className="text-[15px] font-semibold text-gray-900 tracking-tight">
              {formatHeaderFromData(data)}
            </h1>
            <p className="text-xs text-gray-400 mt-0.5">
              <span className="inline-flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 inline-block" />
                {meetingCount} meeting{meetingCount !== 1 ? "s" : ""}
              </span>
              <span className="mx-2 text-gray-200">·</span>
              <span className="inline-flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
                {availabilityCount} availability block{availabilityCount !== 1 ? "s" : ""}
              </span>
            </p>
          </div>

          <div className="flex gap-2">
            {(config?.actionButtons || []).map((btn) => (
              <button
                key={btn.name}
                onClick={() => openModalFn(btn.name)}
                className={`flex items-center gap-2 px-4 py-2 text-sm rounded-lg border transition-all font-medium ${btn.className}`}
              >
                <span className="text-[13px]">{btn.icon}</span>
                {btn.label}
              </button>
            ))}
          </div>
        </header>

        {/* Tabs */}
        <nav className="bg-white border-b border-gray-100 px-6 flex shrink-0">
          {(config?.tabConfig || []).map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors -mb-px select-none
                ${activeTab === key
                  ? "border-indigo-600 text-indigo-700"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-200"
                }`}
            >
              {label}
              {key === "meetings" && meetingCount > 0 && (
                <span className={`ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] font-semibold
                  ${activeTab === key ? "bg-indigo-100 text-indigo-700" : "bg-gray-100 text-gray-500"}`}>
                  {meetingCount}
                </span>
              )}
              {key === "availability" && availabilityCount > 0 && (
                <span className={`ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] font-semibold
                  ${activeTab === key ? "bg-indigo-100 text-indigo-700" : "bg-gray-100 text-gray-500"}`}>
                  {availabilityCount}
                </span>
              )}
            </button>
          ))}
        </nav>

        {/* Tab panels */}
        <div className="flex-1 overflow-y-auto">
          {/* ── Timeline ──────────────────────────────────────── */}
          {activeTab === "timeline" && (
            <div className="px-6 py-5">
              {!hasTimelineData ? (
                <EmptyState
                  icon={<FaClock />}
                  message="No events on the timeline for this period."
                  action="+ Schedule a meeting"
                  onAction={() => openModalFn("meeting")}
                />
              ) : (
                HOURS.map((h) => {
                  const blocks = slotsByHour[h] || [];
                  const isCurrentHour = new Date().getHours() === h;
                  return (
                    <div key={h} className="flex gap-4 min-h-[56px] group">
                      {/* Hour label */}
                      <div className="w-14 text-right shrink-0 pt-2">
                        <span className={`text-[11px] font-medium ${isCurrentHour ? "text-indigo-500" : "text-gray-300"}`}>
                          {hourLabel(h)}
                        </span>
                      </div>

                      {/* Event blocks */}
                      <div className="flex-1 border-t border-gray-100 pt-2 pb-2 flex flex-wrap gap-2">
                        {isCurrentHour && (
                          <div className="w-full h-px bg-indigo-300 mb-1 -mt-px" />
                        )}
                        {blocks.map((e) => (
                          <TimelineBlock key={e.meeting_id} event={e} />
                        ))}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* ── Meetings ──────────────────────────────────────── */}
          {activeTab === "meetings" && (
            <div className="px-6 py-5 space-y-3">
              {meetings.length === 0 ? (
                <EmptyState
                  icon={<FaCalendarAlt />}
                  message="No meetings scheduled for this period."
                  action="+ Schedule a meeting"
                  onAction={() => openModalFn("meeting")}
                />
              ) : (
                meetings.map((e) => <MeetingCard key={e.meeting_id} event={e} />)
              )}
            </div>
          )}

          {/* ── Availability ──────────────────────────────────── */}
          {activeTab === "availability" && (
            <div className="px-6 py-5 space-y-2">
              {availability.length === 0 ? (
                <EmptyState
                  icon={<FaCalendarAlt />}
                  message="No availability blocks set for this period."
                  action="+ Set availability"
                  onAction={() => openModalFn("availablity")}
                />
              ) : (
                availability.map((e) => <AvailabilityCard key={e.meeting_id} event={e} />)
              )}
            </div>
          )}
        </div>
      </main>

      {/* Modal */}
      <SchedulerModal
        open={openModal}
        mode={modalMode}
        onClose={closeModal}
        dynamicConfig={dynamicConfig}
        data={data}
        TicketMaster={TicketMaster}
        // MasterData={{
        //   ...MasterData,
        //   TicketMaster: { ...TicketMaster }
        // }}
      />
    </div>
  );
}