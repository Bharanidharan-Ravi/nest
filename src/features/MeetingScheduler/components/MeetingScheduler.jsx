
// import dayjs from "dayjs";
// import isSameOrBefore from "dayjs/plugin/isSameOrBefore";
// import isSameOrAfter from "dayjs/plugin/isSameOrAfter";
// import { FaPlus, FaCalendarAlt, FaVideo, FaPhone, FaUsers, FaChevronLeft, FaChevronRight, FaClock, FaRegCircle, FaCheckCircle, FaTimes, FaUser, FaEdit } from "react-icons/fa";


// import { useList } from "../../../packages/ui-List/context/ListContext";
// import { useTicketMaster } from "../../tickets/hooks/useTicketMaster";
// import { readUserFromSession } from "../../../core/auth/useCurrentUser";
// import EntityFormPage from "../../../packages/crud/pages/EntityFormPage";
// import { meetingFormConfig } from "../config/Meetingform.config";
// import { useCallback, useMemo, useState } from "react";
// import { useMasterData } from "../../../core/master/masterCall/useMasterData";

// dayjs.extend(isSameOrBefore);
// dayjs.extend(isSameOrAfter);

// // ─── Constants ────────────────────────────────────────────────────────────────
// const HOURS = Array.from({ length: 9 }, (_, i) => i + 10); // 7 AM – 8 PM

// const BOOKING_COLORS = {
//   meeting: { bg: "bg-indigo-50", border: "border-indigo-200", text: "text-indigo-700", dot: "bg-indigo-500" },
//   interview: { bg: "bg-violet-50", border: "border-violet-200", text: "text-violet-700", dot: "bg-violet-500" },
//   demo: { bg: "bg-amber-50", border: "border-amber-200", text: "text-amber-700", dot: "bg-amber-500" },
//   discussion: { bg: "bg-teal-50", border: "border-teal-200", text: "text-teal-700", dot: "bg-teal-500" },
//   supportCall: { bg: "bg-rose-50", border: "border-rose-200", text: "text-rose-700", dot: "bg-rose-500" },
//   Availability: { bg: "bg-emerald-50", border: "border-emerald-200", text: "text-emerald-700", dot: "bg-emerald-500" },
// };

// const STATUS_COLORS = {
//   Active: "bg-emerald-100 text-emerald-700",
//   Inactive: "bg-gray-100 text-gray-500",
//   Cancelled: "bg-red-100 text-red-600",
//   Completed: "bg-blue-100 text-blue-600",
// };

// const METHOD_ICONS = {
//   video: <FaVideo className="w-3 h-3" />,
//   phone: <FaPhone className="w-3 h-3" />,
//   inperson: <FaUsers className="w-3 h-3" />,
// };

// // ─── Helpers ──────────────────────────────────────────────────────────────────
// function fmtTime(t) {
//   if (!t) return "--";
//   const [h, m] = t.split(":").map(Number);
//   const ampm = h >= 12 ? "PM" : "AM";
//   const hour = h % 12 || 12;
//   return `${hour}:${String(m).padStart(2, "0")} ${ampm}`;
// }

// function hourLabel(h) {
//   if (h === 0) return "12 AM";
//   if (h < 12) return `${h} AM`;
//   if (h === 12) return "12 PM";
//   return `${h - 12} PM`;
// }

// function formatHeaderFromData(data = []) {
//   if (!Array.isArray(data) || data.length === 0) return dayjs().format("dddd, D MMMM YYYY");
//   const dates = data
//     .map((e) => {
//       const raw = e.recurrence_type === "onetime" ? e.meeting_date : e.valid_from_date;
//       const d = dayjs(raw);
//       return d.isValid() ? d : null;
//     })
//     .filter(Boolean)
//     .sort((a, b) => a.valueOf() - b.valueOf());

//   if (dates.length === 0) return dayjs().format("dddd, D MMMM YYYY");
//   const from = dates[0];
//   const to = dates[dates.length - 1];
//   if (from.isSame(to, "day")) return from.format("dddd, D MMMM YYYY");
//   return `${from.format("D MMM")} – ${to.format("D MMM YYYY")}`;
// }

// // ─── Sub-components ───────────────────────────────────────────────────────────

// function Badge({ label, colorClass }) {
//   return (
//     <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-wide uppercase ${colorClass}`}>
//       {label}
//     </span>
//   );
// }


// function TimelineBlock({ event, onClick }) {
//   const type = event.booking_type?.toLowerCase() || "meeting";
//   const colors = BOOKING_COLORS[type] || BOOKING_COLORS.meeting;

//   const internalParticipants = event.InternalParticipants
//     ? JSON.parse(event.InternalParticipants)
//     : [];
//   const clientParticipants = event.ClientParticipants
//     ? JSON.parse(event.ClientParticipants)
//     : [];

//   const attendanceCount = internalParticipants.length + clientParticipants.length;

//   return (
//     <button
//       onClick={() => onClick?.(event)}
//       className={`group flex-1 min-w-[160px] max-w-[260px] rounded-lg border px-3 py-2 text-left transition-all hover:shadow-md ${colors.bg} ${colors.border}`}
//     >
//       {/* Top line: Title and Booking Type Badge */}
//       <div className="flex justify-between items-center mb-1">
//         <span className={`text-[12px] font-bold truncate ${colors.text}`}>
//           {event.title}
//         </span>
//         <span
//           className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${colors.dot} bg-opacity-20`}
//         >
//           {event.booking_type?.toUpperCase()}
//         </span>
//       </div>

//       {/* Second line: Time and Participants */}
//       <div className="flex items-center gap-3 text-[10px] text-gray-500">
//         <div className="flex items-center gap-1">
//           <FaClock className="w-3 h-3" />
//           {fmtTime(event.start_time)} – {fmtTime(event.end_time)}
//         </div>

//         <div className="flex items-center gap-1">
//           <FaUser className="w-3 h-3" />
//           {attendanceCount} Participants
//         </div>
//       </div>

//       {/* Optional Host info */}
//       {/* {event.HostName && (
//         <div className="text-[10px] text-gray-400 mt-1 truncate">
//           Host: {event.HostName}
//         </div>
//       )} */}
//     </button>
//   );
// }

// // Participant Avatar Component
// const ParticipantAvatar = ({ name }) => (
//   <div
//     title={name}
//     className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-bold border-2 border-white shadow-sm"
//   >
//     {name?.charAt(0)?.toUpperCase() || "?"}
//   </div>
// );

// // Participants Group Component
// const ParticipantsGroup = ({ participants = [] }) => {
//   const visible = participants.slice(0, 4);
//   const remaining = participants.length - visible.length;

//   return (
//     <div className="flex items-center -space-x-3">
//       {visible.map((p, idx) => (
//         <ParticipantAvatar key={idx} name={p.name} />
//       ))}
//       {remaining > 0 && (
//         <div className="w-2  rounded-full bg-gray-700 text-white flex items-center justify-center text-xs font-semibold border-2 border-white">
//           +{remaining}
//         </div>
//       )}
//     </div>
//   );
// };
// function MeetingCard({ event, onClick, onEdit }) {
//   const allParticipants = [
//     ...JSON.parse(event.ClientParticipants || "[]"),
//     ...JSON.parse(event.InternalParticipants || "[]"),
//   ];

//   const participants = allParticipants.map((p) => ({
//     id: p.participant_id,
//     name: p.participant_name || "User",
//     avatar: p.avatar_url || null, // Add avatar URL if available
//   }));

//   const type = event.booking_type?.toLowerCase() || "meeting";
//   const colors = BOOKING_COLORS[type] || BOOKING_COLORS.meeting;
//   const statusColor = STATUS_COLORS[event.status] || STATUS_COLORS.Active;

//   return (
//     <div
//       onClick={() => onClick?.(event)}
//       className="
//         relative
//         cursor-pointer
//         rounded-2xl
//         border border-slate-200
//         bg-gradient-to-br from-white via-slate-50 to-white
//         shadow-md
//         hover:shadow-xl
//         transition-all duration-300
//         p-5
//         flex flex-col
//         gap-3
//       "
//     >
//       {/* EDIT BUTTON */}
//       <button
//         onClick={(e) => {
//           e.stopPropagation();
//           onEdit?.(event);
//         }}
//         className="
//           absolute top-3 right-3
//           p-2
//           rounded-lg
//           hover:bg-slate-100
//           transition
//           text-slate-500 hover:text-slate-900
//         "
//       >
//         <FaEdit size={16} />
//       </button>

//       {/* FIRST LINE: Title | Ticket Title | Type | Status */}
//       <div className="flex items-center gap-2 flex-wrap">
//         {/* Main Title */}
//         <h3 className="text-sm font-semibold text-slate-900 truncate">{event.title}</h3>

//         {/* Ticket Title */}
//         {event.Ticket_Title && (
//           <span className="text-xs font-medium text-indigo-600 truncate">
//             [{event.Ticket_Title}]
//           </span>
//         )}

//         {/* Booking Type Badge */}
//         <Badge
//           label={type}
//           colorClass={`${colors.bg} ${colors.text} text-[10px] font-medium`}
//         />

//         {/* Status Badge */}
//         <Badge
//           label={event.status}
//           colorClass={`${statusColor} text-[10px] font-medium`}
//         />
//       </div>

//       {/* SECOND LINE: Time | Host | Participants | Recurrence */}
//       <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600">
//         {/* Time */}
//         <span className="flex items-center gap-1">
//           <FaClock className="text-indigo-500" />
//           <strong>{fmtTime(event.start_time)}</strong> - <strong>{fmtTime(event.end_time)}</strong>
//         </span>

//         {/* Host */}
//         {event.HostName && (
//           <span className="flex items-center gap-1">
//             <FaUsers className="text-indigo-500" />
//             <span className="font-medium truncate">{event.HostName}</span>
//           </span>
//         )}

//         {/* Participants */}
//         {participants.length > 0 && (
//           <span className="flex items-center gap-1">
//             <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-0.5">
//               Participants:
//             </p>
//             <ParticipantsGroup participants={participants} />
//           </span>
//         )}

//         {/* Recurrence */}
//         {event.recurrence_type && (
//           <span className="px-2 py-0.5 rounded-full bg-indigo-600 text-white text-[10px] font-semibold uppercase">
//             {event.recurrence_type}
//           </span>
//         )}

//         {/* Meeting Method */}
//         {event.meet_method && (
//           <span className="flex items-center gap-1">
//             <FaVideo className="text-indigo-500" />
//             {event.meet_method}
//           </span>
//         )}
//       </div>

//       {/* THIRD LINE: Summary */}
//       {event.meeting_summary && (
//         <p className="text-xs text-slate-500 mt-2 line-clamp-2">
//           {event.meeting_summary}
//         </p>
//       )}
//     </div>
//   );
// }

// function AvailabilityCard({ event }) {
//   const colors = BOOKING_COLORS.Availability;
//   return (
//     <div className="bg-white border border-gray-100 rounded-xl p-4 hover:shadow-sm transition-all">
//       <div className="flex items-center justify-between">
//         <div className="flex items-center gap-3">
//           <span className={`w-2 h-2 rounded-full ${colors.dot}`} />
//           <div>
//             <p className="text-sm font-medium text-gray-800">
//               {event.title || "Available"}
//             </p>
//             <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
//               <FaClock className="w-2.5 h-2.5" />
//               {fmtTime(event.start_time)} – {fmtTime(event.end_time)}
//             </p>
//           </div>
//         </div>
//         {event.days_of_week && (
//           <span className="text-[10px] font-mono text-gray-300 tracking-widest uppercase">
//             {event.days_of_week}
//           </span>
//         )}
//       </div>
//     </div>
//   );
// }

// // ─── Calendar Sidebar ─────────────────────────────────────────────────────────
// function CalendarSidebar({ data, selected, setSelected }) {
//   const [viewMonth, setViewMonth] = useState(dayjs(selected));

//   const daysWithEvents = useMemo(() => {
//     const set = new Set();
//     data.forEach((e) => {
//       const d = e.recurrence_type === "onetime" ? e.meeting_date : e.valid_from_date;
//       if (d) set.add(dayjs(d).format("YYYY-MM-DD"));
//     });
//     return set;
//   }, [data]);

//   const startOfMonth = viewMonth.startOf("month");
//   const daysInMonth = viewMonth.daysInMonth();
//   const startDow = startOfMonth.day(); // 0=Sun
//   const totalCells = Math.ceil((startDow + daysInMonth) / 7) * 7;

//   const upcomingMeetings = useMemo(() =>
//     data
//       .filter((e) => e.booking_type?.toLowerCase() === "meeting")
//       .slice(0, 5),
//     [data]
//   );

//   return (
//     <aside className="w-64 shrink-0 bg-white border-r border-gray-100 flex flex-col h-full overflow-y-auto">
//       {/* Month nav */}
//       <div className="px-4 pt-5 pb-3">
//         <div className="flex items-center justify-between mb-4">
//           <button
//             onClick={() => setViewMonth(v => v.subtract(1, "month"))}
//             className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
//           >
//             <FaChevronLeft className="w-3 h-3" />
//           </button>
//           <span className="text-sm font-semibold text-gray-800">
//             {viewMonth.format("MMMM YYYY")}
//           </span>
//           <button
//             onClick={() => setViewMonth(v => v.add(1, "month"))}
//             className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
//           >
//             <FaChevronRight className="w-3 h-3" />
//           </button>
//         </div>

//         {/* Day headers */}
//         <div className="grid grid-cols-7 mb-1">
//           {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
//             <div key={i} className="text-center text-[10px] font-semibold text-gray-400 py-1">{d}</div>
//           ))}
//         </div>

//         {/* Calendar grid */}
//         <div className="grid grid-cols-7 gap-y-0.5">
//           {Array.from({ length: totalCells }).map((_, idx) => {
//             const dayNum = idx - startDow + 1;
//             if (dayNum < 1 || dayNum > daysInMonth) return <div key={idx} />;
//             const date = viewMonth.date(dayNum);
//             const dateStr = date.format("YYYY-MM-DD");
//             const isSelected = dayjs(selected).format("YYYY-MM-DD") === dateStr;
//             const isToday = date.isSame(dayjs(), "day");
//             const hasEvent = daysWithEvents.has(dateStr);

//             return (
//               <button
//                 key={idx}
//                 onClick={() => setSelected(date.toDate())}
//                 className={`relative flex flex-col items-center justify-center h-8 w-full rounded-lg text-xs font-medium transition-all
//                   ${isSelected ? "bg-indigo-600 text-white" : isToday ? "bg-indigo-50 text-indigo-700" : "text-gray-600 hover:bg-gray-100"}`}
//               >
//                 {dayNum}
//                 {hasEvent && !isSelected && (
//                   <span className="absolute bottom-0.5 w-1 h-1 rounded-full bg-indigo-400" />
//                 )}
//               </button>
//             );
//           })}
//         </div>
//       </div>

//       <div className="mx-4 border-t border-gray-100 my-2" />

//       {/* Legend */}
//       <div className="px-4 pb-3">
//         <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-2">Legend</p>
//         {Object.entries(BOOKING_COLORS).slice(0, 5).map(([key, c]) => (
//           <div key={key} className="flex items-center gap-2 py-0.5">
//             <span className={`w-2 h-2 rounded-full ${c.dot}`} />
//             <span className="text-xs text-gray-500 capitalize">{key}</span>
//           </div>
//         ))}
//       </div>

//       <div className="mx-4 border-t border-gray-100 my-2" />

//       {/* Upcoming */}
//       <div className="px-4 pb-5 flex-1">
//         <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-2">Upcoming</p>
//         {upcomingMeetings.length === 0 ? (
//           <p className="text-xs text-gray-400">No upcoming meetings</p>
//         ) : upcomingMeetings.map((e) => {
//           const colors = BOOKING_COLORS[e.booking_type?.toLowerCase()] || BOOKING_COLORS.meeting;
//           return (
//             <div key={e.meeting_id} className="flex items-center gap-2 py-1.5 border-b border-gray-50 last:border-0">
//               <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${colors.dot}`} />
//               <div className="min-w-0">
//                 <p className="text-xs font-medium text-gray-700 truncate">{e.title}</p>
//                 <p className="text-[10px] text-gray-400">{fmtTime(e.start_time)}</p>
//               </div>
//             </div>
//           );
//         })}
//       </div>
//     </aside>
//   );
// }

// // ─── Modal ────────────────────────────────────────────────────────────────────
// function SchedulerModal({ open, mode, onClose, dynamicConfig, data,TicketMaster }) {
//   if (!open) return null;
//   return (
//     <div
//       className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
//       onClick={onClose}
//     >
//       <div
//         className="bg-white rounded-2xl shadow-2xl w-full max-w-[960px] max-h-[90vh] flex flex-col overflow-hidden"
//         onClick={(e) => e.stopPropagation()}
//       >
//         {/* Modal header */}
//         <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
//           <div>
//             <h2 className="text-base font-semibold text-gray-900">
//               {mode === "meeting" ? "Schedule a Meeting" : "Set Availability"}
//             </h2>
//             <p className="text-xs text-gray-400 mt-0.5">
//               {mode === "meeting"
//                 ? "Fill in the details to create a new meeting event."
//                 : "Define when you're available for bookings."}
//             </p>
//           </div>
//           <button
//             onClick={onClose}
//             className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
//           >
//             <FaTimes className="w-3.5 h-3.5" />
//           </button>
//         </div>

//         {/* Modal body — scrollable */}
//         <div className="flex-1 overflow-y-auto">
//           <EntityFormPage
//             mode="Create"
//             config={dynamicConfig}
//             module={mode === "meeting" ? "Meeting" : "Availability"}
//             onSuccessCallback={onClose}
//             context={{ 
//             ...data,
//             TicketMaster:[...TicketMaster ]
//             }
//           }
//           />
//         </div>
//       </div>
//     </div>
//   );
// }

// // ─── Empty states ─────────────────────────────────────────────────────────────
// function EmptyState({ icon, message, action, onAction }) {
//   return (
//     <div className="flex flex-col items-center justify-center py-20 text-gray-400">
//       <span className="text-5xl mb-4 opacity-40">{icon}</span>
//       <p className="text-sm font-medium text-gray-500">{message}</p>
//       {action && (
//         <button
//           onClick={onAction}
//           className="mt-4 text-xs font-semibold text-indigo-600 hover:text-indigo-800 underline underline-offset-2 transition-colors"
//         >
//           {action}
//         </button>
//       )}
//     </div>
//   );
// }

// // ─── Main Scheduler ───────────────────────────────────────────────────────────
// export default function MeetingScheduler() {
//   const user = readUserFromSession();
//   const currentUserId = user?.userId;
//   const today = useMemo(() => new Date(), []);

//   const { config, data = [] } = useList();
//   const { data: MasterData } = useMasterData();
//   // const { data: upcoming } = useUpcomingMeeting();
//   const { data: TicketMaster } = useTicketMaster({ employeeId: currentUserId });

//   // const ticketOptions = useMemo(
//   //   () =>
//   //     (TicketMaster || []).map((issue) => ({
//   //       value: { id: issue.Issue_Id, name: issue.Title },
//   //       label: issue.Title,
//   //     })),
//   //   [TicketMaster]
//   // );
//   const dynamicConfig = useMemo(() => ({
//     ...meetingFormConfig,
//     fields: [
//       ...meetingFormConfig.fields,
//       {
//         label: "Ticket",
//         name: "ticket",
//         type: "select",
//         ui: "mui",
//         required: false,
//         dataType: "string",
//         apiKey: "ticket_id",
//         optionsResolver: ({ formData }) => {
//           const selectedProjectId = formData?.project?.value?.id;
        
//           return (TicketMaster || [])
//             .filter((ticket) => {
//               // if project selected, show only tickets for that project
//               if (selectedProjectId) {
//                 return ticket.Project_Id === selectedProjectId;
//               }
//               return true;
//             })
//             .map((ticket) => ({
//               value: { id: ticket.Issue_Id, name: ticket.Title },
//               label: ticket.Title,
//             }));
//         },
//       },
//     ],
//   }), [TicketMaster, meetingFormConfig]);

//   // ── State
//   const [selected, setSelected] = useState(today);
//   const [activeTab, setActiveTab] = useState("timeline");
//   const [modalMode, setModalMode] = useState(null);
//   const [openModal, setOpenModal] = useState(false);

//   const openModalFn = useCallback((mode) => {
//     setModalMode(mode);
//     setOpenModal(true);
//   }, []);

//   const closeModal = useCallback(() => {
//     setOpenModal(false);
//     setModalMode(null);
//   }, []);

//   // ── Derived data
//   const meetings = useMemo(
//     () => data.filter((e) => e.booking_type?.toLowerCase() !== "availability"),
//     [data]
//   );

//   const availability = useMemo(
//     () => data.filter((e) => e.booking_type?.toLowerCase() === "availability"),
//     [data]
//   );

//   const meetingCount = meetings.length;
//   const availabilityCount = availability.length;

//   const slotsByHour = useMemo(() => {
//     const grouped = {};
//     data.forEach((event) => {
//       const hour = parseInt(event.start_time?.split(":")[0] ?? "0", 10);
//       if (!grouped[hour]) grouped[hour] = [];
//       grouped[hour].push(event);
//     });
//     return grouped;
//   }, [data]);

//   const hasTimelineData = HOURS.some((h) => (slotsByHour[h] || []).length > 0);

//   return (
//     <div className="flex h-[calc(100vh-120px)] bg-gray-50 font-sans overflow-hidden">
//       {/* Sidebar */}
//       <CalendarSidebar data={data} selected={selected} setSelected={setSelected} />

//       {/* Main */}
//       <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
//         {/* Top bar */}
//         <header className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between shrink-0">
//           <div>
//             <h1 className="text-[15px] font-semibold text-gray-900 tracking-tight">
//               {formatHeaderFromData(data)}
//             </h1>
//             <p className="text-xs text-gray-400 mt-0.5">
//               <span className="inline-flex items-center gap-1">
//                 <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 inline-block" />
//                 {meetingCount} meeting{meetingCount !== 1 ? "s" : ""}
//               </span>
//               <span className="mx-2 text-gray-200">·</span>
//               <span className="inline-flex items-center gap-1">
//                 <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
//                 {availabilityCount} availability block{availabilityCount !== 1 ? "s" : ""}
//               </span>
//             </p>
//           </div>

//           <div className="flex gap-2">
            // {(config?.actionButtons || []).map((btn) => (
            //   <button
            //     key={btn.name}
            //     onClick={() => openModalFn(btn.name)}
            //     className={`flex items-center gap-2 px-4 py-2 text-sm rounded-lg border transition-all font-medium ${btn.className}`}
            //   >
            //     <span className="text-[13px]">{btn.icon}</span>
            //     {btn.label}
            //   </button>
            // ))}
//           </div>
//         </header>

//         {/* Tabs */}
//         <nav className="bg-white border-b border-gray-100 px-6 flex shrink-0">
//           {(config?.tabConfig || []).map(({ key, label }) => (
//             <button
//               key={key}
//               onClick={() => setActiveTab(key)}
//               className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors -mb-px select-none
//                 ${activeTab === key
//                   ? "border-indigo-600 text-indigo-700"
//                   : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-200"
//                 }`}
//             >
//               {label}
//               {key === "meetings" && meetingCount > 0 && (
//                 <span className={`ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] font-semibold
//                   ${activeTab === key ? "bg-indigo-100 text-indigo-700" : "bg-gray-100 text-gray-500"}`}>
//                   {meetingCount}
//                 </span>
//               )}
//               {key === "availability" && availabilityCount > 0 && (
//                 <span className={`ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] font-semibold
//                   ${activeTab === key ? "bg-indigo-100 text-indigo-700" : "bg-gray-100 text-gray-500"}`}>
//                   {availabilityCount}
//                 </span>
//               )}
//             </button>
//           ))}
//         </nav>

//         {/* Tab panels */}
//         <div className="flex-1 overflow-y-auto">
//           {/* ── Timeline ──────────────────────────────────────── */}
//           {activeTab === "timeline" && (
//             <div className="px-6 py-5">
//               {!hasTimelineData ? (
//                 <EmptyState
//                   icon={<FaClock />}
//                   message="No events on the timeline for this period."
//                   action="+ Schedule a meeting"
//                   onAction={() => openModalFn("meeting")}
//                 />
//               ) : (
//                 HOURS.map((h) => {
//                   const blocks = slotsByHour[h] || [];
//                   const isCurrentHour = new Date().getHours() === h;
//                   return (
//                     <div key={h} className="flex gap-4 min-h-[56px] group">
//                       {/* Hour label */}
//                       <div className="w-14 text-right shrink-0 pt-2">
//                         <span className={`text-[11px] font-medium ${isCurrentHour ? "text-indigo-500" : "text-gray-300"}`}>
//                           {hourLabel(h)}
//                         </span>
//                       </div>

//                       {/* Event blocks */}
//                       <div className="flex-1 border-t border-gray-100 pt-2 pb-2 flex flex-wrap gap-2">
//                         {isCurrentHour && (
//                           <div className="w-full h-px bg-indigo-300 mb-1 -mt-px" />
//                         )}
//                         {blocks.map((e) => (
//                           <TimelineBlock key={e.meeting_id} event={e} />
//                         ))}
//                       </div>
//                     </div>
//                   );
//                 })
//               )}
//             </div>
//           )}

//           {/* ── Meetings ──────────────────────────────────────── */}
//           {activeTab === "meetings" && (
//             <div className="px-6 py-5 space-y-3">
//               {meetings.length === 0 ? (
//                 <EmptyState
//                   icon={<FaCalendarAlt />}
//                   message="No meetings scheduled for this period."
//                   action="+ Schedule a meeting"
//                   onAction={() => openModalFn("meeting")}
//                 />
//               ) : (
//                 meetings.map((e) => <MeetingCard key={e.meeting_id} event={e} />)
//               )}
//             </div>
//           )}

//           {/* ── Availability ──────────────────────────────────── */}
//           {activeTab === "availability" && (
//             <div className="px-6 py-5 space-y-2">
//               {availability.length === 0 ? (
//                 <EmptyState
//                   icon={<FaCalendarAlt />}
//                   message="No availability blocks set for this period."
//                   action="+ Set availability"
//                   onAction={() => openModalFn("availablity")}
//                 />
//               ) : (
//                 availability.map((e) => <AvailabilityCard key={e.meeting_id} event={e} />)
//               )}
//             </div>
//           )}
//         </div>
//       </main>

//       {/* Modal */}
//       <SchedulerModal
//         open={openModal}
//         mode={modalMode}
//         onClose={closeModal}
//         dynamicConfig={dynamicConfig}
//         data={data}
//         TicketMaster={TicketMaster}
//         // MasterData={{
//         //   ...MasterData,
//         //   TicketMaster: { ...TicketMaster }
//         // }}
//       />
//     </div>
//   );
// }

// import dayjs from "dayjs";
// import isSameOrBefore from "dayjs/plugin/isSameOrBefore";
// import isSameOrAfter from "dayjs/plugin/isSameOrAfter";
// import { 
//   FaPlus, FaCalendarAlt, FaVideo, FaPhone, FaUsers, 
//   FaChevronLeft, FaChevronRight, FaClock, FaUser, FaEdit, 
//   FaSearch, FaTimes 
// } from "react-icons/fa";

// import { useList } from "../../../packages/ui-List/context/ListContext";
// import { useTicketMaster } from "../../tickets/hooks/useTicketMaster";
// import { readUserFromSession } from "../../../core/auth/useCurrentUser";
// import EntityFormPage from "../../../packages/crud/pages/EntityFormPage";
// import { meetingFormConfig } from "../config/Meetingform.config";
// import { useCallback, useMemo, useState } from "react";
// import { useMasterData } from "../../../core/master/masterCall/useMasterData";

// dayjs.extend(isSameOrBefore);
// dayjs.extend(isSameOrAfter);

// // ─── Constants ────────────────────────────────────────────────────────────────
// const HOURS = Array.from({ length: 11 }, (_, i) => i + 7); // 7 AM – 5 PM approx

// const BOOKING_COLORS = {
//   meeting: { 
//     bg: "bg-[#1c1c2e]", 
//     borderL: "border-l-indigo-500", 
//     border: "border-indigo-500/20", 
//     text: "text-indigo-300", 
//     dot: "bg-indigo-500",
//     badge: "bg-indigo-600 text-white" 
//   },
//   availability: { 
//     bg: "bg-[#14291f]", 
//     borderL: "border-l-emerald-500", 
//     border: "border-emerald-500/20", 
//     text: "text-emerald-400", 
//     dot: "bg-emerald-500",
//     badge: "bg-indigo-600 text-white" // Badge on right stays purple in design
//   },
//   interview: { bg: "bg-[#251a2e]", borderL: "border-l-violet-500", text: "text-violet-300", dot: "bg-violet-500", badge: "bg-violet-600" },
//   demo: { bg: "bg-[#2e2518]", borderL: "border-l-amber-500", text: "text-amber-300", dot: "bg-amber-500", badge: "bg-amber-600" },
//   supportCall: { bg: "bg-[#2e181a]", borderL: "border-l-rose-500", text: "text-rose-300", dot: "bg-rose-500", badge: "bg-rose-600" },
// };

// const STATUS_COLORS = {
//   Active: "bg-[#1a3b2b] text-emerald-400 border border-emerald-500/20",
//   Inactive: "bg-[#262633] text-gray-400",
//   Cancelled: "bg-[#3b1a1a] text-red-400",
//   Completed: "bg-[#1a2b3b] text-blue-400",
// };

// // ─── Helpers ──────────────────────────────────────────────────────────────────
// function fmtTime(t) {
//   if (!t) return "--";
//   const [h, m] = t.split(":").map(Number);
//   const ampm = h >= 12 ? "PM" : "AM";
//   const hour = h % 12 || 12;
//   return `${hour}:${String(m).padStart(2, "0")} ${ampm}`;
// }

// function hourLabel(h) {
//   if (h === 0) return "12 AM";
//   if (h < 12) return `${h} AM`;
//   if (h === 12) return "12 PM";
//   return `${h - 12} PM`;
// }

// function formatHeaderFromData(data = []) {
//   if (!Array.isArray(data) || data.length === 0) return dayjs().format("dddd, MMMM D, YYYY");
//   const dates = data
//     .map((e) => {
//       const raw = e.recurrence_type === "onetime" ? e.meeting_date : e.valid_from_date;
//       const d = dayjs(raw);
//       return d.isValid() ? d : null;
//     })
//     .filter(Boolean)
//     .sort((a, b) => a.valueOf() - b.valueOf());

//   if (dates.length === 0) return dayjs().format("dddd, MMMM D, YYYY");
//   const from = dates[0];
//   const to = dates[dates.length - 1];
//   if (from.isSame(to, "day")) return from.format("dddd, MMMM D, YYYY");
//   return `${from.format("D MMM")} – ${to.format("D MMM YYYY")}`;
// }

// // ─── Sub-components ───────────────────────────────────────────────────────────

// function TimelineBlock({ event, onClick }) {
//   const isAvailability = event.booking_type?.toLowerCase() === "availability";
//   const type = isAvailability ? "availability" : (event.booking_type?.toLowerCase() || "meeting");
//   const colors = BOOKING_COLORS[type] || BOOKING_COLORS.meeting;

//   const internalParticipants = event.InternalParticipants ? JSON.parse(event.InternalParticipants) : [];
//   const clientParticipants = event.ClientParticipants ? JSON.parse(event.ClientParticipants) : [];
//   const attendanceCount = internalParticipants.length + clientParticipants.length;

//   return (
//     <button
//       onClick={() => onClick?.(event)}
//       className={`w-full flex justify-between items-center rounded-lg border-l-4 border px-4 py-3 text-left transition-all hover:opacity-90 ${colors.bg} ${colors.borderL} border-y-transparent border-r-transparent mb-2`}
//     >
//       <div>
//         <span className={`block text-sm font-semibold mb-0.5 ${colors.text}`}>
//           {event.title || (isAvailability ? "Available" : "Meeting")}
//         </span>
//         <div className="flex items-center gap-2 text-xs text-[#8a8a9d]">
//           <span>{fmtTime(event.start_time)} – {fmtTime(event.end_time)}</span>
//           <span>·</span>
//           {isAvailability ? (
//              <span>{event.days_of_week || "Mon, Tue, Wed, Thu, Fri"}</span>
//           ) : (
//             <>
//               <span>{attendanceCount} attendees</span>
//               <span>·</span>
//               <span>{event.days_of_week || "Mon, Tue, Wed, Thu, Fri"}</span>
//             </>
//           )}
//         </div>
//       </div>
//       <span className={`text-[10px] font-medium px-2.5 py-1 rounded-sm ${colors.badge}`}>
//         {isAvailability ? "Available" : type}
//       </span>
//     </button>
//   );
// }

// // Participant Avatar Component
// const ParticipantAvatar = ({ name }) => (
//   <div
//     title={name}
//     className="w-7 h-7 rounded-full bg-[#3b3b4f] text-gray-300 flex items-center justify-center text-[10px] font-bold border-2 border-[#16161e]"
//   >
//     {name?.charAt(0)?.toUpperCase() || "?"}
//   </div>
// );

// const ParticipantsGroup = ({ participants = [] }) => {
//   const visible = participants.slice(0, 4);
//   const remaining = participants.length - visible.length;

//   return (
//     <div className="flex items-center -space-x-2">
//       {visible.map((p, idx) => (
//         <ParticipantAvatar key={idx} name={p.name} />
//       ))}
//       {remaining > 0 && (
//         <div className="w-7 h-7 rounded-full bg-[#262633] text-gray-400 flex items-center justify-center text-[10px] font-semibold border-2 border-[#16161e]">
//           +{remaining}
//         </div>
//       )}
//     </div>
//   );
// };

// function MeetingCard({ event, onClick, onEdit }) {
//   const allParticipants = [
//     ...JSON.parse(event.ClientParticipants || "[]"),
//     ...JSON.parse(event.InternalParticipants || "[]"),
//   ];

//   const participants = allParticipants.map((p) => ({
//     id: p.participant_id,
//     name: p.participant_name || "User",
//   }));

//   const isAvailability = event.booking_type?.toLowerCase() === "availability";
//   const type = isAvailability ? "availability" : (event.booking_type?.toLowerCase() || "meeting");
//   const colors = BOOKING_COLORS[type] || BOOKING_COLORS.meeting;
//   const statusColor = STATUS_COLORS[event.status] || STATUS_COLORS.Active;

//   return (
//     <div
//       onClick={() => onClick?.(event)}
//       className="relative cursor-pointer rounded-xl border border-[#262633] bg-[#16161e] hover:bg-[#1a1a24] transition-all p-4 flex flex-col gap-3"
//     >
//       <button
//         onClick={(e) => { e.stopPropagation(); onEdit?.(event); }}
//         className="absolute top-4 right-4 p-1.5 rounded-md hover:bg-[#262633] text-gray-400 hover:text-white"
//       >
//         <FaEdit size={14} />
//       </button>

//       <div className="flex items-center gap-2 flex-wrap pr-8">
//         <h3 className="text-sm font-semibold text-gray-200">{event.title}</h3>
//         {event.Ticket_Title && (
//           <span className="text-xs font-medium text-indigo-400 truncate">[{event.Ticket_Title}]</span>
//         )}
//         <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${colors.bg} ${colors.text} border ${colors.borderL}`}>
//           {type}
//         </span>
//         <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${statusColor}`}>
//           {event.status || 'Active'}
//         </span>
//       </div>

//       <div className="flex flex-wrap items-center gap-3 text-xs text-gray-400">
//         <span className="flex items-center gap-1">
//           <FaClock className="text-gray-500" />
//           {fmtTime(event.start_time)} - {fmtTime(event.end_time)}
//         </span>
//         {event.HostName && (
//           <span className="flex items-center gap-1">
//             <FaUsers className="text-gray-500" /> {event.HostName}
//           </span>
//         )}
//         {participants.length > 0 && (
//           <span className="flex items-center gap-2">
//             <span className="text-[10px] uppercase text-gray-500">Participants:</span>
//             <ParticipantsGroup participants={participants} />
//           </span>
//         )}
//         {event.recurrence_type && (
//           <span className="px-2 py-0.5 rounded-sm bg-[#262633] text-gray-300 text-[10px] uppercase">
//             {event.recurrence_type}
//           </span>
//         )}
//       </div>
//     </div>
//   );
// }

// // ─── Calendar Sidebar ─────────────────────────────────────────────────────────
// function CalendarSidebar({ data, selected, setSelected }) {
//   const [viewMonth, setViewMonth] = useState(dayjs(selected));

//   const daysWithEvents = useMemo(() => {
//     const set = new Set();
//     data.forEach((e) => {
//       const d = e.recurrence_type === "onetime" ? e.meeting_date : e.valid_from_date;
//       if (d) set.add(dayjs(d).format("YYYY-MM-DD"));
//     });
//     return set;
//   }, [data]);

//   const startOfMonth = viewMonth.startOf("month");
//   const daysInMonth = viewMonth.daysInMonth();
//   const startDow = startOfMonth.day(); // 0=Sun
//   const totalCells = Math.ceil((startDow + daysInMonth) / 7) * 7;

//   const upcomingMeetings = useMemo(() =>
//     data.filter((e) => e.booking_type?.toLowerCase() === "meeting").slice(0, 5),
//     [data]
//   );

//   return (
//     <aside className="w-[300px] shrink-0 bg-[#16161e] border-r border-[#262633] flex flex-col h-full overflow-y-auto text-gray-300">
//       {/* Title */}
//       <div className="flex items-center gap-3 px-5 py-6">
//         <FaCalendarAlt className="text-indigo-500 text-lg" />
//         <h2 className="text-lg font-bold text-white tracking-wide">Schedule</h2>
//       </div>

//       {/* Month nav */}
//       <div className="px-5 pb-4">
//         <div className="flex items-center justify-between mb-4 bg-[#1a1a24] rounded-lg border border-[#262633] p-1">
//           <button
//             onClick={() => setViewMonth(v => v.subtract(1, "month"))}
//             className="p-2 rounded-md hover:bg-[#262633] text-gray-400 transition-colors"
//           >
//             <FaChevronLeft className="w-3 h-3" />
//           </button>
//           <span className="text-sm font-semibold text-gray-200">
//             {viewMonth.format("MMMM YYYY")}
//           </span>
//           <button
//             onClick={() => setViewMonth(v => v.add(1, "month"))}
//             className="p-2 rounded-md hover:bg-[#262633] text-gray-400 transition-colors"
//           >
//             <FaChevronRight className="w-3 h-3" />
//           </button>
//         </div>

//         {/* Day headers */}
//         <div className="grid grid-cols-7 mb-2">
//           {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d, i) => (
//             <div key={i} className="text-center text-[11px] font-medium text-gray-500 py-1">{d}</div>
//           ))}
//         </div>

//         {/* Calendar grid */}
//         <div className="grid grid-cols-7 gap-y-1">
//           {Array.from({ length: totalCells }).map((_, idx) => {
//             const dayNum = idx - startDow + 1;
//             if (dayNum < 1 || dayNum > daysInMonth) return <div key={idx} className="h-8" />;
//             const date = viewMonth.date(dayNum);
//             const dateStr = date.format("YYYY-MM-DD");
//             const isSelected = dayjs(selected).format("YYYY-MM-DD") === dateStr;
//             const hasEvent = daysWithEvents.has(dateStr);

//             return (
//               <button
//                 key={idx}
//                 onClick={() => setSelected(date.toDate())}
//                 className={`relative flex flex-col items-center justify-center h-8 w-full rounded-md text-[13px] font-medium transition-all
//                   ${isSelected ? "bg-indigo-600 text-white" : "text-gray-400 hover:bg-[#262633] hover:text-white"}`}
//               >
//                 {dayNum}
//                 {hasEvent && !isSelected && (
//                   <span className="absolute bottom-1 w-1 h-1 rounded-full bg-indigo-500" />
//                 )}
//               </button>
//             );
//           })}
//         </div>
//       </div>

//       <div className="mx-5 border-t border-[#262633] my-2" />

//       {/* Legend */}
//       <div className="px-5 py-2">
//         <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-3">Legend</p>
//         <div className="grid grid-cols-2 gap-y-3 gap-x-2">
//           <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-indigo-500" /><span className="text-xs text-gray-400">Upcoming</span></div>
//           <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-gray-500" /><span className="text-xs text-gray-400">Past</span></div>
//           <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-emerald-500" /><span className="text-xs text-gray-400">Available</span></div>
//           <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-red-500" /><span className="text-xs text-gray-400">Leave/Vacation</span></div>
//         </div>
//       </div>

//       <div className="mx-5 border-t border-[#262633] my-2" />

//       {/* Search */}
//       <div className="px-5 py-2">
//         <div className="relative">
//           <FaSearch className="absolute left-3 top-2.5 text-gray-500 w-3.5 h-3.5" />
//           <input 
//             type="text" 
//             placeholder="Search..." 
//             className="w-full bg-[#1a1a24] border border-[#262633] rounded-lg py-2 pl-9 pr-3 text-sm text-gray-300 focus:outline-none focus:border-indigo-500 transition-colors placeholder-gray-500"
//           />
//         </div>
//       </div>

//       {/* Upcoming Section */}
//       <div className="px-5 py-4 flex-1">
//         <div className="flex items-center justify-between mb-3">
//           <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Upcoming</p>
//           <span className="bg-[#262633] text-gray-400 text-[10px] px-1.5 py-0.5 rounded-md font-bold">{upcomingMeetings.length}</span>
//         </div>
        
//         <div className="space-y-3">
//           {upcomingMeetings.length === 0 ? (
//             <p className="text-xs text-gray-500">No upcoming meetings</p>
//           ) : upcomingMeetings.map((e) => (
//             <div key={e.meeting_id} className="bg-[#1a1a24] border border-[#262633] rounded-lg p-3">
//               <div className="flex justify-between items-start mb-2">
//                 <p className="text-xs font-bold text-gray-200">{e.title}</p>
//                 <span className="bg-[#1a3b2b] text-emerald-400 text-[9px] px-1.5 py-0.5 rounded font-semibold border border-emerald-500/20">Active</span>
//               </div>
//               {e.HostName && <p className="text-[11px] text-gray-500 mb-1 flex items-center gap-1.5"><FaUser className="w-2.5 h-2.5"/> {e.HostName}</p>}
//               <p className="text-[11px] text-gray-500 flex items-center gap-1.5"><FaClock className="w-2.5 h-2.5"/> {fmtTime(e.start_time)} – {fmtTime(e.end_time)}</p>
//             </div>
//           ))}
//         </div>
//       </div>
//     </aside>
//   );
// }

// function SchedulerModal({ open, mode, onClose, dynamicConfig, data, TicketMaster }) {
//   if (!open) return null;
//   return (
//     <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 backdrop-blur-sm" onClick={onClose}>
//       <div className="bg-[#16161e] border border-[#262633] rounded-2xl shadow-2xl w-full max-w-[960px] max-h-[90vh] flex flex-col overflow-hidden" onClick={(e) => e.stopPropagation()}>
//         <div className="flex items-center justify-between px-6 py-4 border-b border-[#262633] shrink-0 bg-[#1a1a24]">
//           <div>
//             <h2 className="text-base font-semibold text-white">
//               {mode === "meeting" ? "Schedule a Meeting" : "Set Availability"}
//             </h2>
//           </div>
//           <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[#262633] text-gray-400 transition-colors">
//             <FaTimes className="w-3.5 h-3.5" />
//           </button>
//         </div>
//         <div className="flex-1 overflow-y-auto p-4 text-gray-300">
//           <EntityFormPage
//             mode="Create"
//             config={dynamicConfig}
//             module={mode === "meeting" ? "Meeting" : "Availability"}
//             onSuccessCallback={onClose}
//             context={{ ...data, TicketMaster: [...TicketMaster] }}
//           />
//         </div>
//       </div>
//     </div>
//   );
// }

// // ─── Empty states ─────────────────────────────────────────────────────────────
// function EmptyState({ icon, message, action, onAction }) {
//   return (
//     <div className="flex flex-col items-center justify-center py-20 text-gray-500">
//       <span className="text-5xl mb-4 opacity-20">{icon}</span>
//       <p className="text-sm font-medium">{message}</p>
//       {action && (
//         <button onClick={onAction} className="mt-4 text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition-colors border border-[#262633] bg-[#1a1a24] px-4 py-2 rounded-md">
//           {action}
//         </button>
//       )}
//     </div>
//   );
// }

// export default function MeetingScheduler() {
//   const user = readUserFromSession();
//   const currentUserId = user?.userId;
//   const today = useMemo(() => new Date(), []);

//   const { config, data = [] } = useList();
//   const { data: MasterData } = useMasterData();
//   const { data: TicketMaster } = useTicketMaster({ employeeId: currentUserId });

//   const dynamicConfig = useMemo(() => ({
//     ...meetingFormConfig,
//     fields: [
//       ...meetingFormConfig.fields,
//       {
//         label: "Ticket",
//         name: "ticket",
//         type: "select",
//         ui: "mui",
//         required: false,
//         dataType: "string",
//         apiKey: "ticket_id",
//         optionsResolver: ({ formData }) => {
//           const selectedProjectId = formData?.project?.value?.id;
//           return (TicketMaster || [])
//             .filter((ticket) => selectedProjectId ? ticket.Project_Id === selectedProjectId : true)
//             .map((ticket) => ({ value: { id: ticket.Issue_Id, name: ticket.Title }, label: ticket.Title }));
//         },
//       },
//     ],
//   }), [TicketMaster, meetingFormConfig]);

//   const [selected, setSelected] = useState(today);
//   const [activeTab, setActiveTab] = useState("timeline");
//   const [modalMode, setModalMode] = useState(null);
//   const [openModal, setOpenModal] = useState(false);

//   const openModalFn = useCallback((mode) => { setModalMode(mode); setOpenModal(true); }, []);
//   const closeModal = useCallback(() => { setOpenModal(false); setModalMode(null); }, []);

//   const meetings = useMemo(() => data.filter((e) => e.booking_type?.toLowerCase() !== "availability"), [data]);
//   const availability = useMemo(() => data.filter((e) => e.booking_type?.toLowerCase() === "availability"), [data]);

//   const meetingCount = meetings.length;
//   const availabilityCount = availability.length;

//   const slotsByHour = useMemo(() => {
//     const grouped = {};
//     data.forEach((event) => {
//       const hour = parseInt(event.start_time?.split(":")[0] ?? "0", 10);
//       if (!grouped[hour]) grouped[hour] = [];
//       grouped[hour].push(event);
//     });
//     return grouped;
//   }, [data]);
  
//   const hasTimelineData = HOURS.some((h) => (slotsByHour[h] || []).length > 0);

//   return (
//     <div className="flex h-[calc(100vh-120px)] bg-[#0e0e12] font-sans overflow-hidden text-gray-200 selection:bg-indigo-500/30">
//       <CalendarSidebar data={data} selected={selected} setSelected={setSelected} />

//       <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
//         {/* Top bar */}
//         <header className="px-8 py-6 flex flex-col sm:flex-row items-start sm:items-center justify-between shrink-0 border-b border-[#262633] bg-[#121217]">
//           <div className="mb-4 sm:mb-0">
//             <h1 className="text-xl font-bold text-white tracking-tight">
//               {formatHeaderFromData(data)}
//             </h1>
//             <p className="text-sm text-gray-500 mt-1">
//               {meetingCount} meeting{meetingCount !== 1 ? "s" : ""} · {availabilityCount} availability block{availabilityCount !== 1 ? "s" : ""}
//             </p>
//           </div>

//           <div className="flex gap-3">
//             <button onClick={() => openModalFn("availability")} className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-transparent border border-[#383846] rounded-xl hover:bg-[#1a1a24] transition-all">
//               <FaCalendarAlt className="text-gray-400" /> Set Availability
//             </button>
//             <button onClick={() => openModalFn("meeting")} className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-transparent border border-[#383846] rounded-xl hover:bg-[#1a1a24] transition-all">
//               <FaPlus className="text-gray-400" /> New Meeting
//             </button>
//           </div>
//         </header>

//         {/* Tabs */}
//         <div className="px-8 pt-6 pb-2 shrink-0 bg-[#121217]">
//           <div className="inline-flex rounded-xl border border-[#262633] p-1 bg-[#16161e]">
//             {[
//               { key: "timeline", label: "Timeline" },
//               { key: "meetings", label: "Meetings" },
//               { key: "availability", label: "Availability" }
//             ].map(({ key, label }) => (
//               <button
//                 key={key}
//                 onClick={() => setActiveTab(key)}
//                 className={`px-5 py-2 text-sm font-semibold rounded-lg transition-all ${
//                   activeTab === key
//                     ? "bg-[#262633] text-white shadow-sm"
//                     : "text-gray-400 hover:text-gray-200 hover:bg-[#1a1a24]"
//                 }`}
//               >
//                 {label}
//               </button>
//             ))}
//           </div>
//         </div>

//         {/* Content Area */}
//         <div className="flex-1 overflow-y-auto bg-[#121217]">
//           {/* Timeline View */}
//           {activeTab === "timeline" && (
//             <div className="px-8 py-4">
//               {!hasTimelineData ? (
//                 <EmptyState icon={<FaClock />} message="No events on the timeline for this period." action="+ Schedule a meeting" onAction={() => openModalFn("meeting")} />
//               ) : (
//                 <div className="relative">
//                   {HOURS.map((h) => {
//                     const blocks = slotsByHour[h] || [];
//                     return (
//                       <div key={h} className="flex gap-6 group relative">
//                         {/* Hour label */}
//                         <div className="w-16 text-right shrink-0 py-4">
//                           <span className="text-[12px] font-semibold text-gray-500">
//                             {hourLabel(h)}
//                           </span>
//                         </div>

//                         {/* Event blocks */}
//                         <div className="flex-1 border-t border-[#262633] py-2">
//                           {blocks.length > 0 ? (
//                             <div className="flex flex-col gap-2 mt-2">
//                               {blocks.map((e) => (
//                                 <TimelineBlock key={e.meeting_id} event={e} />
//                               ))}
//                             </div>
//                           ) : (
//                             <div className="h-10" /> // Empty hour spacing
//                           )}
//                         </div>
//                       </div>
//                     );
//                   })}
//                 </div>
//               )}
//             </div>
//           )}

//           {/* Meetings View */}
//           {activeTab === "meetings" && (
//             <div className="px-8 py-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
//               {meetings.length === 0 ? (
//                 <div className="col-span-full"><EmptyState icon={<FaCalendarAlt />} message="No meetings scheduled." action="+ Schedule" onAction={() => openModalFn("meeting")} /></div>
//               ) : (
//                 meetings.map((e) => <MeetingCard key={e.meeting_id} event={e} onEdit={openModalFn} />)
//               )}
//             </div>
//           )}

//           {/* Availability View */}
//           {activeTab === "availability" && (
//             <div className="px-8 py-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
//               {availability.length === 0 ? (
//                 <div className="col-span-full"><EmptyState icon={<FaCalendarAlt />} message="No availability blocks set." action="+ Set Availability" onAction={() => openModalFn("availability")} /></div>
//               ) : (
//                 availability.map((e) => <MeetingCard key={e.meeting_id} event={e} onEdit={openModalFn} />)
//               )}
//             </div>
//           )}
//         </div>
//       </main>

//       {/* Modal */}
//       <SchedulerModal
//         open={openModal}
//         mode={modalMode}
//         onClose={closeModal}
//         dynamicConfig={dynamicConfig}
//         data={data}
//         TicketMaster={TicketMaster}
//       />
//     </div>
//   );
// }


// import dayjs from "dayjs";
// import isSameOrBefore from "dayjs/plugin/isSameOrBefore";
// import isSameOrAfter from "dayjs/plugin/isSameOrAfter";
// import { 
//   FaPlus, FaCalendarAlt, FaVideo, FaPhone, FaUsers, 
//   FaChevronLeft, FaChevronRight, FaClock, FaTimes, FaUser, FaEdit, FaSearch, FaEllipsisH, FaArrowDown
// } from "react-icons/fa";

// import { useList } from "../../../packages/ui-List/context/ListContext";
// import { useTicketMaster } from "../../tickets/hooks/useTicketMaster";
// import { readUserFromSession } from "../../../core/auth/useCurrentUser";
// import EntityFormPage from "../../../packages/crud/pages/EntityFormPage";
// import { meetingFormConfig } from "../config/Meetingform.config";
// import { useCallback, useMemo, useState } from "react";
// import { useMasterData } from "../../../core/master/masterCall/useMasterData";

// dayjs.extend(isSameOrBefore);
// dayjs.extend(isSameOrAfter);

// // ─── Constants ────────────────────────────────────────────────────────────────
// const HOURS = Array.from({ length: 9 }, (_, i) => i + 7); // 7 AM – 3 PM

// // Exact colors matched from the image
// const BOOKING_COLORS = {
//   meeting: { 
//     bg: "bg-[#251f47]", // Dark purple background
//     borderL: "border-l-[#6e58d1]", // Bright purple left border
//     text: "text-[#e2ddfc]", // Light purple text
//     textDim: "text-[#9789cc]", // Dim purple text for time
//     dot: "bg-[#6e58d1]",
//     badge: "bg-[#3e327a] text-[#c1b5fa]" // Purple badge
//   },
//   availability: { 
//     bg: "bg-[#103621]", // Dark green background
//     borderL: "border-l-[#21b35b]", // Bright green left border
//     text: "text-[#55db8d]", // Light green text
//     textDim: "text-[#47b373]", // Dim green text for time
//     dot: "bg-[#21b35b]",
//     badge: "bg-[#3e327a] text-[#c1b5fa]" // Badge is purple even in availability block in image
//   },
//   interview: { bg: "bg-[#332240]", borderL: "border-l-[#6e468d]", text: "text-[#d6aef8]", textDim: "text-[#9778b3]", dot: "bg-fuchsia-500", badge: "bg-[#4e2f66] text-[#d6aef8]" },
//   demo: { bg: "bg-[#332917]", borderL: "border-l-[#7a602d]", text: "text-[#f5ce8c]", textDim: "text-[#b39562]", dot: "bg-amber-500", badge: "bg-[#54411d] text-[#f5ce8c]" },
//   discussion: { bg: "bg-[#112d33]", borderL: "border-l-[#246977]", text: "text-[#81e1f5]", textDim: "text-[#5b9ca8]", dot: "bg-cyan-500", badge: "bg-[#1b4b56] text-[#81e1f5]" },
//   supportCall: { bg: "bg-[#361a20]", borderL: "border-l-[#7a3443]", text: "text-[#f7a6b8]", textDim: "text-[#b07382]", dot: "bg-rose-500", badge: "bg-[#542530] text-[#f7a6b8]" },
// };

// const STATUS_COLORS = {
//   Active: "bg-[#14472a] text-[#34c76b]", // Green "Active" badge from bottom left
//   Inactive: "bg-[#2a2c3d] text-gray-400",
//   Cancelled: "bg-[#451e25] text-red-400",
//   Completed: "bg-[#1d2f47] text-blue-400",
// };

// // ─── Helpers ──────────────────────────────────────────────────────────────────
// function fmtTime(t) {
//   if (!t) return "--";
//   const [h, m] = t.split(":").map(Number);
//   const ampm = h >= 12 ? "PM" : "AM";
//   const hour = h % 12 || 12;
//   return `${hour}:${String(m).padStart(2, "0")} ${ampm}`;
// }

// function hourLabel(h) {
//   if (h === 0) return "12 AM";
//   if (h < 12) return `${h} AM`;
//   if (h === 12) return "12 PM";
//   return `${h - 12} PM`;
// }

// function formatHeaderFromData(data = []) {
//   if (!Array.isArray(data) || data.length === 0) return dayjs().format("dddd, MMMM D, YYYY");
//   const dates = data
//     .map((e) => {
//       const raw = e.recurrence_type === "onetime" ? e.meeting_date : e.valid_from_date;
//       const d = dayjs(raw);
//       return d.isValid() ? d : null;
//     })
//     .filter(Boolean)
//     .sort((a, b) => a.valueOf() - b.valueOf());

//   if (dates.length === 0) return dayjs().format("dddd, MMMM D, YYYY");
//   const from = dates[0];
//   const to = dates[dates.length - 1];
//   if (from.isSame(to, "day")) return from.format("dddd, MMMM D, YYYY");
//   return `${from.format("dddd, MMMM D, YYYY")}`;
// }

// // ─── Sub-components ───────────────────────────────────────────────────────────

// function TimelineBlock({ event, onClick }) {
//   const isAvailable = event.booking_type?.toLowerCase() === "availability";
//   const type = isAvailable ? "availability" : (event.booking_type?.toLowerCase() || "meeting");
//   const colors = BOOKING_COLORS[type] || BOOKING_COLORS.meeting;

//   const internalParticipants = event.InternalParticipants ? JSON.parse(event.InternalParticipants) : [];
//   const clientParticipants = event.ClientParticipants ? JSON.parse(event.ClientParticipants) : [];
//   const attendanceCount = internalParticipants.length + clientParticipants.length;

//   return (
//     <button
//       onClick={() => onClick?.(event)}
//       className={`w-full flex items-center justify-between rounded-[4px] border-l-[3px] border-y border-r border-[#ffffff05] px-4 py-3 text-left transition-all hover:opacity-90 ${colors.bg} ${colors.borderL} mb-2`}
//     >
//       <div>
//         <span className={`block text-[13px] font-semibold mb-1 ${colors.text}`}>
//           {event.title || (isAvailable ? "Available" : "Meeting")}
//         </span>
//         <div className={`flex items-center gap-1.5 text-[11px] ${colors.textDim}`}>
//           <span>{fmtTime(event.start_time)} – {fmtTime(event.end_time)}</span>
//           <span className="opacity-50">·</span>
//           {!isAvailable && (
//             <>
//               <span>{attendanceCount} attendees</span>
//               <span className="opacity-50">·</span>
//             </>
//           )}
//           <span>{event.days_of_week || "Mon, Tue, Wed, Thu, Fri"}</span>
//         </div>
//       </div>
//       <span className={`text-[11px] font-medium px-2.5 py-0.5 rounded ${colors.badge} capitalize`}>
//         {isAvailable ? "Available" : type}
//       </span>
//     </button>
//   );
// }

// function MeetingCard({ event, onClick, onEdit }) {
//   const isAvailable = event.booking_type?.toLowerCase() === "availability";
//   const type = isAvailable ? "availability" : (event.booking_type?.toLowerCase() || "meeting");
//   const colors = BOOKING_COLORS[type] || BOOKING_COLORS.meeting;
//   const statusColor = STATUS_COLORS[event.status] || STATUS_COLORS.Active;

//   return (
//     <div
//       onClick={() => onClick?.(event)}
//       className="relative cursor-pointer rounded-xl border border-[#272938] bg-[#1a1c29] p-4 flex flex-col gap-3 hover:bg-[#1e2030] transition-colors"
//     >
//       <button
//         onClick={(e) => { e.stopPropagation(); onEdit?.(event); }}
//         className="absolute top-3 right-3 p-1.5 rounded-md hover:bg-[#272938] text-gray-500 hover:text-gray-300 transition"
//       >
//         <FaEdit size={14} />
//       </button>

//       <div className="flex items-center justify-between pr-6">
//         <h3 className="text-sm font-semibold text-gray-100 truncate">{event.title || "Untitled"}</h3>
//         <span className={`text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded ${statusColor}`}>
//           {event.status || 'Active'}
//         </span>
//       </div>

//       <div className="flex flex-col gap-1.5 text-xs text-gray-400">
//         <span className="flex items-center gap-2">
//           <FaClock className="text-[#6e58d1]" />
//           {fmtTime(event.start_time)} - {fmtTime(event.end_time)}
//         </span>
//         {event.HostName && (
//           <span className="flex items-center gap-2">
//             <FaUser className="text-[#6e58d1]" />
//             {event.HostName}
//           </span>
//         )}
//       </div>
//     </div>
//   );
// }

// // ─── Calendar Sidebar ─────────────────────────────────────────────────────────
// function CalendarSidebar({ data, selected, setSelected }) {
//   const [viewMonth, setViewMonth] = useState(dayjs(selected));

//   const daysWithEvents = useMemo(() => {
//     const set = new Set();
//     data.forEach((e) => {
//       const d = e.recurrence_type === "onetime" ? e.meeting_date : e.valid_from_date;
//       if (d) set.add(dayjs(d).format("YYYY-MM-DD"));
//     });
//     return set;
//   }, [data]);

//   const startOfMonth = viewMonth.startOf("month");
//   const daysInMonth = viewMonth.daysInMonth();
//   const startDow = startOfMonth.day(); // 0=Sun
//   const totalCells = Math.ceil((startDow + daysInMonth) / 7) * 7;

//   const upcomingMeetings = useMemo(() =>
//     data.filter((e) => e.booking_type?.toLowerCase() === "meeting").slice(0, 5),
//     [data]
//   );

//   return (
//     <aside className="w-[280px] shrink-0 bg-[#14151f] border-r border-[#212330] flex flex-col h-full overflow-y-auto text-gray-300">
      
//       {/* Title */}
//       <div className="px-5 py-5 flex items-center gap-2 text-white border-b border-[#212330]">
//         <FaCalendarAlt className="text-[#6e58d1] text-lg" />
//         <h2 className="text-[15px] font-bold tracking-wide">Schedule</h2>
//       </div>

//       {/* Month nav */}
//       <div className="px-5 pt-5 pb-4 border-b border-[#212330]">
//         <div className="flex items-center justify-between mb-4">
//           <button onClick={() => setViewMonth(v => v.subtract(1, "month"))} className="p-2 rounded-md bg-[#1a1c29] border border-[#272938] hover:bg-[#212330] text-gray-400 transition-colors">
//             <FaChevronLeft className="w-3 h-3" />
//           </button>
//           <span className="text-[13px] font-semibold text-gray-200">
//             {viewMonth.format("MMMM YYYY")}
//           </span>
//           <button onClick={() => setViewMonth(v => v.add(1, "month"))} className="p-2 rounded-md bg-[#1a1c29] border border-[#272938] hover:bg-[#212330] text-gray-400 transition-colors">
//             <FaChevronRight className="w-3 h-3" />
//           </button>
//         </div>

//         {/* Day headers */}
//         <div className="grid grid-cols-7 mb-2">
//           {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d, i) => (
//             <div key={i} className="text-center text-[10px] font-medium text-gray-500 py-1">{d}</div>
//           ))}
//         </div>

//         {/* Calendar grid */}
//         <div className="grid grid-cols-7 gap-y-1">
//           {Array.from({ length: totalCells }).map((_, idx) => {
//             const dayNum = idx - startDow + 1;
//             if (dayNum < 1 || dayNum > daysInMonth) return <div key={idx} className="h-8" />;
//             const date = viewMonth.date(dayNum);
//             const dateStr = date.format("YYYY-MM-DD");
//             const isSelected = dayjs(selected).format("YYYY-MM-DD") === dateStr;
//             const hasEvent = daysWithEvents.has(dateStr);

//             return (
//               <button
//                 key={idx}
//                 onClick={() => setSelected(date.toDate())}
//                 className={`relative flex flex-col items-center justify-center h-8 w-full rounded-md text-[12px] font-medium transition-all
//                   ${isSelected ? "bg-[#3e327a] text-[#d0c5fb]" : "text-gray-400 hover:bg-[#1a1c29]"}`}
//               >
//                 {dayNum}
//                 {hasEvent && !isSelected && (
//                   <span className="absolute bottom-1 w-1 h-1 rounded-full bg-[#6e58d1]" />
//                 )}
//               </button>
//             );
//           })}
//         </div>
//       </div>

//       {/* Legend */}
//       <div className="px-5 py-4 border-b border-[#212330]">
//         <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-3">Legend</p>
//         <div className="grid grid-cols-2 gap-y-2 text-[11px] text-gray-400">
//           <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-[#6e58d1]" /> Upcoming</div>
//           <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-gray-500" /> Past</div>
//           <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-[#21b35b]" /> Available</div>
//           <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-red-500" /> Leave/Vacation</div>
//         </div>
//       </div>

//       {/* Search Bar */}
//       <div className="px-5 py-4">
//         <div className="relative">
//           <FaSearch className="absolute left-3 top-2.5 text-gray-500 w-3 h-3" />
//           <input 
//             type="text" 
//             placeholder="Search..." 
//             className="w-full bg-[#1a1c29] border border-[#272938] rounded-lg py-1.5 pl-8 pr-3 text-[13px] text-gray-200 focus:outline-none focus:border-[#6e58d1] transition-colors placeholder-gray-600"
//           />
//         </div>
//       </div>

//       {/* Upcoming */}
//       <div className="px-5 pb-5 flex-1">
//         <div className="flex items-center justify-between mb-3">
//           <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Upcoming</p>
//           <span className="bg-[#1a1c29] text-gray-400 border border-[#272938] text-[10px] px-1.5 py-0.5 rounded font-bold">
//             {upcomingMeetings.length}
//           </span>
//         </div>
        
//         <div className="space-y-3">
//           {upcomingMeetings.length === 0 ? (
//             <p className="text-xs text-gray-500">No upcoming meetings</p>
//           ) : upcomingMeetings.map((e) => (
//             <div key={e.meeting_id} className="bg-[#1a1c29] border border-[#272938] rounded-lg p-3">
//               <div className="flex justify-between items-start mb-1.5">
//                 <p className="text-[13px] font-semibold text-[#e2ddfc] truncate pr-2">{e.title}</p>
//                 <span className="bg-[#14472a] text-[#34c76b] text-[9px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wide">
//                   Active
//                 </span>
//               </div>
//               <div className="text-[11px] text-gray-500 flex flex-col gap-1">
//                 {e.HostName && <span className="flex items-center gap-1.5"><FaUser className="w-2.5 h-2.5"/> {e.HostName}</span>}
//                 <span className="flex items-center gap-1.5"><FaClock className="w-2.5 h-2.5"/> {fmtTime(e.start_time)} – {fmtTime(e.end_time)}</span>
//               </div>
//             </div>
//           ))}
//         </div>
//       </div>
//     </aside>
//   );
// }

// // ─── Main Scheduler ───────────────────────────────────────────────────────────
// export default function MeetingScheduler() {
//   const user = readUserFromSession();
//   const currentUserId = user?.userId;
//   const today = useMemo(() => new Date(), []);

//   const { config, data = [] } = useList();
//   const { data: MasterData } = useMasterData();
//   const { data: TicketMaster } = useTicketMaster({ employeeId: currentUserId });

//   const dynamicConfig = useMemo(() => ({
//     ...meetingFormConfig,
//     fields: [
//       ...meetingFormConfig.fields,
//       {
//         label: "Ticket",
//         name: "ticket",
//         type: "select",
//         ui: "mui",
//         required: false,
//         dataType: "string",
//         apiKey: "ticket_id",
//         optionsResolver: ({ formData }) => {
//           const selectedProjectId = formData?.project?.value?.id;
//           return (TicketMaster || [])
//             .filter((ticket) => selectedProjectId ? ticket.Project_Id === selectedProjectId : true)
//             .map((ticket) => ({ value: { id: ticket.Issue_Id, name: ticket.Title }, label: ticket.Title }));
//         },
//       },
//     ],
//   }), [TicketMaster, meetingFormConfig]);

//   // ── State
//   const [selected, setSelected] = useState(today);
//   const [activeTab, setActiveTab] = useState("timeline");
//   const [modalMode, setModalMode] = useState(null);
//   const [openModal, setOpenModal] = useState(false);

//   const openModalFn = useCallback((mode) => {
//     setModalMode(mode);
//     setOpenModal(true);
//   }, []);

//   const closeModal = useCallback(() => {
//     setOpenModal(false);
//     setModalMode(null);
//   }, []);

//   // ── Derived data
//   const meetings = useMemo(() => data.filter((e) => e.booking_type?.toLowerCase() !== "availability"), [data]);
//   const availability = useMemo(() => data.filter((e) => e.booking_type?.toLowerCase() === "availability"), [data]);

//   const meetingCount = meetings.length;
//   const availabilityCount = availability.length;

//   const slotsByHour = useMemo(() => {
//     const grouped = {};
//     data.forEach((event) => {
//       const hour = parseInt(event.start_time?.split(":")[0] ?? "0", 10);
//       if (!grouped[hour]) grouped[hour] = [];
//       grouped[hour].push(event);
//     });
//     return grouped;
//   }, [data]);

//   const hasTimelineData = HOURS.some((h) => (slotsByHour[h] || []).length > 0);

//   return (
//     <div className="flex h-[calc(100vh-120px)] bg-[#0f111a] font-sans overflow-hidden text-gray-200 selection:bg-[#6e58d1]/30">
      
//       {/* Sidebar */}
//       <CalendarSidebar data={data} selected={selected} setSelected={setSelected} />

//       {/* Main Container */}
//       <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        
//         {/* Top Header */}
//         <header className="px-8 pt-8 pb-4 flex flex-col md:flex-row items-start md:items-center justify-between shrink-0 border-b border-transparent">
//           <div>
//             <h1 className="text-[22px] font-semibold text-white tracking-wide">
//               {formatHeaderFromData(data)}
//             </h1>
//             <p className="text-[13px] text-gray-500 mt-1">
//               {meetingCount} meeting{meetingCount !== 1 ? "s" : ""} · {availabilityCount} availability block{availabilityCount !== 1 ? "s" : ""}
//             </p>
//           </div>

//           <div className="flex items-center gap-3 mt-4 md:mt-0">
//             {/* Action Buttons Rendered from Config */}
//             {(config?.actionButtons || []).map((btn) => (
//               <button
//                 key={btn.name}
//                 onClick={() => openModalFn(btn.name)}
//                 // We use the exact button styling from the image, appending any custom className
//                 className={`flex items-center gap-2 px-5 py-2.5 text-[13px] rounded-lg border border-[#272938] hover:bg-[#1a1c29] text-white transition-all font-semibold shadow-sm ${btn.className || ''}`}
//               >
//                 <span className="text-gray-300">{btn.icon}</span>
//                 {btn.label}
//               </button>
//             ))}
            
//             {/* Ellipsis button */}
//             <button className="p-2.5 rounded-lg border border-[#272938] hover:bg-[#1a1c29] text-gray-400 transition-all shadow-sm">
//               <FaEllipsisH />
//             </button>
//           </div>
//         </header>

//         {/* Segmented Tabs */}
//         <div className="px-8 pb-6 shrink-0 border-b border-[#1b1d29]">
//           <div className="inline-flex rounded-xl border border-[#272938] bg-transparent p-[3px]">
//             {/* Tabs Rendered from Config */}
//             {(config?.tabConfig || []).map(({ key, label }) => (
//               <button
//                 key={key}
//                 onClick={() => setActiveTab(key)}
//                 className={`flex items-center justify-center min-w-[100px] px-5 py-1.5 text-[13px] font-semibold rounded-lg transition-all
//                   ${activeTab === key
//                     ? "bg-[#1a1c29] text-white border border-[#272938] shadow-sm"
//                     : "text-gray-400 hover:text-gray-200 border border-transparent"
//                   }`}
//               >
//                 {label}
//               </button>
//             ))}
//           </div>
//         </div>

//         {/* Main Content Area */}
//         <div className="flex-1 overflow-y-auto relative pb-20">
          
//           {/* ── Timeline View ──────────────────────────────────────── */}
//           {activeTab === "timeline" && (
//             <div className="relative">
//               {!hasTimelineData ? (
//                 <div className="flex flex-col items-center justify-center py-20 text-gray-600">
//                   <FaClock className="text-4xl mb-3 opacity-20" />
//                   <p className="text-sm">No events on the timeline for this period.</p>
//                 </div>
//               ) : (
//                 <div className="flex flex-col w-full">
//                   {HOURS.map((h) => {
//                     const blocks = slotsByHour[h] || [];
//                     return (
//                       <div key={h} className="relative flex w-full min-h-[70px] border-b border-[#1b1d29]">
                        
//                         {/* Time Label */}
//                         <div className="w-24 shrink-0 text-right pr-6 pt-3">
//                           <span className="text-[12px] font-medium text-gray-500">
//                             {hourLabel(h)}
//                           </span>
//                         </div>

//                         {/* Events Container */}
//                         <div className="flex-1 pb-3 pt-3 pr-8 flex flex-col gap-2">
//                           {blocks.map((e) => (
//                             <TimelineBlock key={e.meeting_id} event={e} />
//                           ))}
//                         </div>

//                       </div>
//                     );
//                   })}
//                 </div>
//               )}
              
//               {/* Floating down arrow strictly from image */}
//               <div className="fixed bottom-6 right-1/2 translate-x-1/2">
//                  <button className="w-10 h-10 rounded-full bg-[#1a1c29] border border-[#272938] flex items-center justify-center text-gray-400 hover:text-white hover:bg-[#212330] shadow-[0_0_15px_rgba(0,0,0,0.5)] transition-colors">
//                    <FaArrowDown size={14} />
//                  </button>
//               </div>
//             </div>
//           )}

//           {/* ── Meetings View ──────────────────────────────────────── */}
//           {activeTab === "meetings" && (
//             <div className="px-8 py-6 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
//               {meetings.length === 0 ? (
//                 <p className="text-sm text-gray-600 col-span-full py-10 text-center">No meetings scheduled.</p>
//               ) : (
//                 meetings.map((e) => <MeetingCard key={e.meeting_id} event={e} onEdit={openModalFn} />)
//               )}
//             </div>
//           )}

//           {/* ── Availability View ──────────────────────────────────── */}
//           {activeTab === "availability" && (
//             <div className="px-8 py-6 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
//               {availability.length === 0 ? (
//                  <p className="text-sm text-gray-600 col-span-full py-10 text-center">No availability blocks set.</p>
//               ) : (
//                 availability.map((e) => <MeetingCard key={e.meeting_id} event={e} onEdit={openModalFn} />)
//               )}
//             </div>
//           )}
//         </div>
//       </main>

//       {/* Reusable Modal Layer */}
//       {openModal && (
//         <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm" onClick={closeModal}>
//           <div className="bg-[#14151f] border border-[#272938] rounded-2xl shadow-2xl w-full max-w-[960px] max-h-[90vh] flex flex-col overflow-hidden" onClick={(e) => e.stopPropagation()}>
//             <div className="flex items-center justify-between px-6 py-4 border-b border-[#272938] shrink-0 bg-[#1a1c29]">
//               <h2 className="text-base font-semibold text-white">
//                 {modalMode === "meeting" ? "Schedule a Meeting" : "Set Availability"}
//               </h2>
//               <button onClick={closeModal} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[#272938] text-gray-400 transition-colors">
//                 <FaTimes size={14} />
//               </button>
//             </div>
//             <div className="flex-1 overflow-y-auto p-4 text-gray-300">
//               <EntityFormPage
//                 mode="Create"
//                 config={dynamicConfig}
//                 module={modalMode === "meeting" ? "Meeting" : "Availability"}
//                 onSuccessCallback={closeModal}
//                 context={{ ...data, TicketMaster: [...TicketMaster] }}
//               />
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }




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
import { useMasterData } from "../../../core/master/masterCall/useMasterData";

dayjs.extend(isSameOrBefore);
dayjs.extend(isSameOrAfter);

// ─── Constants ────────────────────────────────────────────────────────────────
const HOURS = Array.from({ length: 9 }, (_, i) => i + 7); // 7 AM – 3 PM

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

  const internalParticipants = event.InternalParticipants ? JSON.parse(event.InternalParticipants) : [];
  const clientParticipants = event.ClientParticipants ? JSON.parse(event.ClientParticipants) : [];
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
  const type = isAvailable ? "availability" : (event.booking_type?.toLowerCase() || "meeting");
  const colors = BOOKING_COLORS[type] || BOOKING_COLORS.meeting;
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