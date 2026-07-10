

// import React, { useState } from "react";
// import {
//   Calendar,
//   Clock,
//   Users,
//   Repeat,
//   ChevronDown,
//   ChevronUp,
//   Eye,
//   Pencil,
//   Trash2,
//   CalendarClock,
//   CalendarDays,
//   CheckCircle,
// } from "lucide-react";
// import { GoIssueClosed, GoIssueOpened } from "react-icons/go";
// const safeParse = (val) => {
//   try {
//     const parsed = JSON.parse(val || "[]");
//     return Array.isArray(parsed) ? parsed : [];
//   } catch {
//     return [];
//   }
// };

// const formatDate = (d) =>
//   d ? new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "—";

// const formatTime = (t) => {
//   if (!t) return "—";
//   const parts = t.split(":");
//   return parts.length >= 2 ? `${parts[0]}:${parts[1]}` : t;
// };

// const formatDuration = (slot) => {
//   if (!slot) return "—";
//   const [h, m] = slot.split(":").map(Number);
//   const bits = [];
//   if (h) bits.push(`${h}h`);
//   if (m) bits.push(`${m}m`);
//   return bits.length ? bits.join(" ") : "—";
// };

// const STATUS_STYLES = {
//   Scheduled: { dot: "bg-blue-500", text: "text-blue-700", bg: "bg-blue-50", ring: "ring-blue-200" },
//   Completed: { dot: "bg-emerald-500", text: "text-emerald-700", bg: "bg-emerald-50", ring: "ring-emerald-200" },
//   Cancelled: { dot: "bg-red-500", text: "text-red-700", bg: "bg-red-50", ring: "ring-red-200" },
// };
// const DEFAULT_STATUS_STYLE = { dot: "bg-gray-400", text: "text-gray-600", bg: "bg-gray-50", ring: "ring-gray-200" };

// const AVATAR_PALETTE = [
//   "bg-amber-100 text-amber-700",
//   "bg-blue-100 text-blue-700",
//   "bg-violet-100 text-violet-700",
//   "bg-rose-100 text-rose-700",
//   "bg-teal-100 text-teal-700",
//   "bg-indigo-100 text-indigo-700",
// ];

// const hashString = (str = "") => {
//   let hash = 0;
//   for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
//   return Math.abs(hash);
// };

// const initialsOf = (name = "") =>
//   name
//     .trim()
//     .split(/\s+/)
//     .slice(0, 2)
//     .map((p) => p[0]?.toUpperCase())
//     .join("") || "?";

// // Small avatar chip for a participant
// const ParticipantChip = ({ name, role }) => {
//   const palette = AVATAR_PALETTE[hashString(name) % AVATAR_PALETTE.length];
//   return (
//     <div
//       className="flex items-center gap-2 pl-1 pr-3 py-1 rounded-full bg-gray-50 border border-gray-200"
//       title={role ? `${name} · ${role}` : name}
//     >
//       <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-semibold ${palette}`}>
//         {initialsOf(name)}
//       </span>
//       <span className="text-xs font-medium text-gray-700">{name}</span>
//       {role && <span className="text-[10px] text-gray-400 border-l border-gray-200 pl-2">{role}</span>}
//     </div>
//   );
// };

// // One icon + value tile, no text label — meaning carried by the icon (with a tooltip for a11y)
// const InfoTile = ({ icon: Icon, value, hint }) => (
//   <div
//     className="flex items-center gap-2 rounded-lg border border-gray-100 bg-gray-50/70 px-3 py-2"
//     title={hint}
//   >
//     <Icon size={14} className="text-amber-500 shrink-0" />
//     <span className="text-xs font-medium text-gray-700 truncate">{value || "—"}</span>
//   </div>
// );

// const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

// export function binaryToDaysList(binary) {
//   if (!binary || typeof binary !== "string") return [];

//   return binary
//     .split("")
//     .map((bit, index) => (bit === "1" ? DAYS[index] : null))
//     .filter(Boolean);
// }

// // ---------------------------------------------------------------------------
// // Main component
// // ---------------------------------------------------------------------------
// const ListView = ({ data = [], onEdit }) => {
//   const [expandedId, setExpandedId] = useState(null);
//   const toggle = (id) => setExpandedId((prev) => (prev === id ? null : id));
//   if (!data || data.length === 0) {
//     return (
//       <div className="h-full flex flex-col items-center justify-center gap-2 bg-gray-50 p-10 text-center">
//         <Calendar size={28} className="text-gray-300" />
//         <p className="text-sm font-medium text-gray-500">No meetings to show</p>
//         <p className="text-xs text-gray-400">Meetings you schedule will show up here.</p>
//       </div>
//     );
//   }

//   const renderStatusIcon = (status) => {
//     console.log("status",status);
    
//     switch (status) {
//       case "Scheduled":
//         return <GoIssueOpened className="mt-1.5 status-icon text-green-500" title="Active" />
//       case "Completed":
//         return <GoIssueClosed  className="mt-1.5 status-icon text-violet-500" title="Completed" />;
//       default:
//         return  <GoIssueOpened className="mt-1.5 status-icon text-green-500" title="Active" />
//     }
//   };
  
//   return (
//     <div className="max-h-[76vh] overflow-y-auto bg-gray-50 p-4 space-y-3">
//       {
//       data.map((m) => {
//         const internal = safeParse(m.InternalParticipants);
//         const client = safeParse(m.ClientParticipants);
//         const isOpen = expandedId === m.meeting_id;
//         const statusStyle = STATUS_STYLES[m.status] || DEFAULT_STATUS_STYLE;
//         const isRecurring = m.recurrence_type && m.recurrence_type !== "ONETIME";

//         return (
//           <div
//             key={m.meeting_id}
//             className={`bg-white border rounded-2xl shadow-sm transition-shadow duration-200 ${isOpen ? "border-amber-200 shadow-md" : "border-gray-200 hover:shadow-md"
//               }`}
//           >
//             {/* ------------------------------------------------------------------ HEADER */}
//             <button
//               onClick={() => toggle(m.meeting_id)}
//               className="w-full flex items-start gap-3 p-4 text-left"
//             >
//               {renderStatusIcon(m.status)}

//               <div className="flex-1 min-w-0">
//                 <div className="flex flex-wrap items-center gap-2">
//                   <p
//                     className="font-semibold text-gray-900 truncate max-w-[220px]"
//                     title={m.title || "Untitled Meeting"}
//                   >
//                     {m.title || "Untitled Meeting"}
//                   </p>

//                   {m.booking_type && (
//                     <span className="px-2 py-0.2 rounded-md bg-amber-50 text-amber-700 text-[10px] font-medium border border-amber-200 capitalize">
//                       {m.booking_type}
//                     </span>
//                   )}

//                   <span
//                     className={`px-2 py-0.2 rounded-md text-[10px] font-medium ring-1 ${statusStyle.bg} ${statusStyle.text} ${statusStyle.ring}`}
//                   >
//                     {m.status}
//                   </span>

//                   {isRecurring && (
//                     <span className="flex items-center gap-1 px-2 py-0.2 rounded-md bg-gray-50 text-gray-500 text-[10px] font-medium border border-gray-200">
//                       <Repeat size={10} />
//                       {m.recurrence_type.toLowerCase()}
//                     </span>
//                   )}
//                 </div>

//                 <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500 mt-1.5">
//                   {(m.project_Name || m.Ticket_Title) && (
//                     <div className="flex flex-wrap items-center gap-2">
//                       {m.project_Name && (
//                         <span className="px-2 py-1 rounded-lg bg-blue-50 text-blue-700 border border-blue-100 font-small">
//                           {m.project_Code} - {m.project_Name}
//                         </span>
//                       )}
//                       {m.Ticket_Title && (
//                         <span className="px-2 py-1 rounded-lg bg-gray-50 text-gray-600 border border-gray-100">
//                           {m.issue_Code} - {m.Ticket_Title}
//                         </span>
//                       )}
//                     </div>
//                   )}
//                   <span className="flex items-center gap-1">
//                     <Calendar size={12} />
//                     {m.recurrence_type?.toUpperCase() === "ONETIME"
//                       ? formatDate(m.meeting_date)
//                       : `${formatDate(m.valid_from_date)} - ${formatDate(m.valid_to_date)}`}
//                   </span>
//                   <span className="flex items-center gap-1">
//                     <Clock size={12} />
//                     {formatTime(m.start_time)} – {formatTime(m.end_time)}
//                   </span>
//                   <span className="flex items-center gap-1">
//                     <Users size={12} />
//                     {internal.length + client.length} attendee{internal.length + client.length === 1 ? "" : "s"}
//                   </span>
//                   {m.HostName && (
//                     <span className="flex items-center gap-1.5">
//                       <span
//                         className={`w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-semibold ${AVATAR_PALETTE[hashString(m.HostName) % AVATAR_PALETTE.length]
//                           }`}
//                       >
//                         {initialsOf(m.HostName)}
//                       </span>
//                       {m.HostName}
//                     </span>
//                   )}
//                 </div>
//               </div>
//               <div
//                 className="flex items-center gap-2 mr-2"
//                 onClick={(e) => e.stopPropagation()} // prevents expand/collapse
//               >
//                 {m.status !== "Completed" && (
//                   <>
//                     <button
//                       onClick={() => onSelectMeeting?.(m)}
//                       className="px-3 py-1.5 rounded-lg bg-amber-400 hover:bg-amber-500 text-black text-xs font-bold"
//                     >
//                       <CheckCircle size={14} className="inline mr-1" />
//                       Complete
//                     </button>

//                     <button
//                       onClick={() => onEdit(m)}
//                       className="px-3 py-1.5 rounded-lg bg-gray-200 hover:bg-gray-300 text-gray-700 text-xs font-bold"
//                     >
//                       <Pencil size={13} className="inline mr-1" />
//                       Edit
//                     </button>
//                   </>
//                 )}
//               </div>
//               <span className="mt-1 text-gray-400 shrink-0">
//                 {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
//               </span>
//             </button>

//             {/* ------------------------------------------------------------------ DETAILS */}
//             {isOpen && (
//               <div className="border-t border-gray-100 px-4 pb-4 pt-3 space-y-4 text-xs text-gray-700">
//                 {/* quick-glance tiles, icon carries the meaning */}
//                 <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
//                   <InfoTile icon={Users} value={m.host_type} hint="Host type" />
//                   <InfoTile icon={Repeat} value={m.recurrence_type} hint="Recurrence" />
//                   <InfoTile icon={Clock} value={formatDuration(m.slot_duration)} hint="Slot duration" />
//                   <InfoTile icon={CalendarDays} value={binaryToDaysList(m.days_of_week).join(" | ")} hint="Days of week" />
//                 </div>
//                 {/* summary */}
//                 <p className="text-gray-600 leading-relaxed bg-gray-50/70 border border-gray-100 rounded-lg p-3">
//                   {m.meeting_summary || "No summary added yet."}
//                 </p>
               
//                 {/* internal participants */}
//                 <div>
//                   <p className="font-semibold text-gray-800 mb-2 flex items-center gap-1.5">
//                     <Users size={13} className="text-amber-500" />
//                     Internal · {internal.length}
//                   </p>
//                   <div className="flex flex-wrap gap-2">
//                     {internal.length === 0 ? (
//                       <span className="text-gray-400 text-xs">No internal participants</span>
//                     ) : (
//                       internal.map((p, i) => (
//                         <ParticipantChip key={p.Participant_Id || i} name={p.Participant_Name} role={p.Participant_Role} />
//                       ))
//                     )}
//                   </div>
//                 </div>

//                 {/* client participants */}
//                 <div>
//                   <p className="font-semibold text-gray-800 mb-2 flex items-center gap-1.5">
//                     <Users size={13} className="text-amber-500" />
//                     Client · {client.length}
//                   </p>
//                   <div className="flex flex-wrap gap-2">
//                     {client.length === 0 ? (
//                       <span className="text-gray-400 text-xs">No client participants</span>
//                     ) : (
//                       client.map((p, i) => (
//                         <ParticipantChip key={p.Participant_Id || i} name={p.Participant_Name} role={p.Participant_Role} />
//                       ))
//                     )}
//                   </div>
//                 </div>

//               </div>
//             )}
//           </div>
//         );
//       })}
//     </div>
//   );
// };

// export default ListView;
// src/features/meeting-scheduler/components/ListView.jsx
import React, { useMemo, useState } from "react";
import {
  Calendar,
  Clock,
  Users,
  Repeat,
  ChevronDown,
  ChevronUp,
  Pencil,
  CalendarDays,
  CheckCircle,
  CircleDot,
  CircleCheck,
  CircleX,
} from "lucide-react";
import { Pill, StatusBadge } from "./Badge";
import { IconText, InfoTile } from "./IconText";
import { EmptyState } from "./EmptyState";
import { Avatar } from "./Avatar";
import { Button } from "./Button";
import { getAllParticipants } from "../hooks/participants";
import { binaryToDaysList, formatDate, formatDuration, formatTime24h } from "../Helpers/dateTime";

// BUG FIX: original switch only handled "Scheduled" and "Completed" and fell
// through to the green "open" icon for everything else — including
// "Cancelled", which silently looked like an active meeting.
function StatusIcon({ status }) {
  if (status === "Completed") return <CircleCheck size={15} className="mt-1.5 text-violet-500" title="Completed" />;
  if (status === "Cancelled") return <CircleX size={15} className="mt-1.5 text-red-500" title="Cancelled" />;
  return <CircleDot size={15} className="mt-1.5 text-green-500" title="Active" />;
}

function ParticipantChip({ name, role }) {
  return (
    <div
      className="flex items-center gap-2 pl-1 pr-3 py-1 rounded-full bg-gray-50 border border-gray-200"
      title={role ? `${name} · ${role}` : name}
    >
      <Avatar name={name} size={24} />
      <span className="text-xs font-medium text-gray-700">{name}</span>
      {role && (
        <span className="text-[10px] text-gray-400 border-l border-gray-200 pl-2">{role}</span>
      )}
    </div>
  );
}

function ParticipantSection({ label, people }) {
  return (
    <div>
      <p className="font-semibold text-gray-800 mb-2 flex items-center gap-1.5">
        <Users size={13} className="text-amber-500" />
        {label} ({people.length})
      </p>
      <div className="flex flex-wrap gap-2">
        {people.length === 0 ? (
          <span className="text-gray-400 text-xs">No {label.toLowerCase()} participants</span>
        ) : (
          people.map((p, i) => (
            <ParticipantChip key={p.Participant_Id ?? i} name={p.Participant_Name} role={p.Participant_Role} />
          ))
        )}
      </div>
    </div>
  );
}

function MeetingRow({ meeting, isOpen, onToggle, onEdit, onComplete }) {
  const { internal, client, all } = getAllParticipants(meeting);
  const isRecurring = meeting.recurrence_type && meeting.recurrence_type !== "ONETIME";
  const isOneTime = meeting.recurrence_type?.toUpperCase() === "ONETIME";

  return (
    <div
      className={`bg-white border rounded-2xl shadow-sm transition-shadow duration-200 ${
        isOpen ? "border-amber-200 shadow-md" : "border-gray-200 hover:shadow-md"
      }`}
    >
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={isOpen}
        className="w-full flex items-start gap-3 p-4 text-left"
      >
        <StatusIcon status={meeting.status} />

        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-semibold text-gray-900 truncate max-w-[220px]" title={meeting.title}>
              {meeting.title || "Untitled Meeting"}
            </p>
            {meeting.booking_type && <Pill tone="amber">{meeting.booking_type}</Pill>}
            <StatusBadge status={meeting.status} />
            {isRecurring && (
              <Pill icon={Repeat}>{meeting.recurrence_type.toLowerCase()}</Pill>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500 mt-1.5">
            {(meeting.project_Name || meeting.Ticket_Title) && (
              <div className="flex flex-wrap items-center gap-2">
                {meeting.project_Name && (
                  <span className="px-2 py-1 rounded-lg bg-blue-50 text-blue-700 border border-blue-100">
                    {meeting.project_Code} - {meeting.project_Name}
                  </span>
                )}
                {meeting.Ticket_Title && (
                  <span className="px-2 py-1 rounded-lg bg-gray-50 text-gray-600 border border-gray-100">
                    {meeting.issue_Code} - {meeting.Ticket_Title}
                  </span>
                )}
              </div>
            )}

            <IconText icon={Calendar}>
              {isOneTime
                ? formatDate(meeting.meeting_date)
                : `${formatDate(meeting.valid_from_date)} - ${formatDate(meeting.valid_to_date)}`}
            </IconText>
            <IconText icon={Clock}>
              {formatTime24h(meeting.start_time)} - {formatTime24h(meeting.end_time)}
            </IconText>
            <IconText icon={Users}>
              {all.length} attendee{all.length === 1 ? "" : "s"}
            </IconText>
            {meeting.HostName && (
              <span className="flex items-center gap-1.5">
                <Avatar name={meeting.HostName} size={16} />
                {meeting.HostName}
              </span>
            )}
          </div>
        </div>

        {meeting.status !== "Completed" && (
          <div className="flex items-center gap-2 mr-2" onClick={(e) => e.stopPropagation()}>
            <Button variant="primary" size="sm" icon={CheckCircle} onClick={() => onComplete?.(meeting)}>
              Complete
            </Button>
            <Button variant="secondary" size="sm" icon={Pencil} onClick={() => onEdit?.(meeting)}>
              Edit
            </Button>
          </div>
        )}

        <span className="mt-1 text-gray-400 shrink-0">
          {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </span>
      </button>

      {isOpen && (
        <div className="border-t border-gray-100 px-4 pb-4 pt-3 space-y-4 text-xs text-gray-700">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <InfoTile icon={Users} value={meeting.host_type} hint="Host type" />
            <InfoTile icon={Repeat} value={meeting.recurrence_type} hint="Recurrence" />
            <InfoTile icon={Clock} value={formatDuration(meeting.slot_duration)} hint="Slot duration" />
            <InfoTile
              icon={CalendarDays}
              value={binaryToDaysList(meeting.days_of_week).join(" | ")}
              hint="Days of week"
            />
          </div>

          <p className="text-gray-600 leading-relaxed bg-gray-50/70 border border-gray-100 rounded-lg p-3">
            {meeting.meeting_summary || "No summary added yet."}
          </p>

          <ParticipantSection label="Internal" people={internal} />
          <ParticipantSection label="Client" people={client} />
        </div>
      )}
    </div>
  );
}

export default function ListView({ data = [], onEdit, onComplete }) {
  console.log("data",data);
  
  const [expandedId, setExpandedId] = useState(null);
  const toggle = (id) => setExpandedId((prev) => (prev === id ? null : id));
const validMeetings = useMemo(
  ()=>
  (data || []).filter(
    (meeting) => meeting && meeting.meeting_id != null && meeting.title
  ),
  [data]
)
  if (!data || data.length === 0) {
    return (
      <EmptyState
        title="No meetings to show"
        description="Meetings you schedule will show up here."
      />
    );
  }

  return (
    // <div className="max-h-[76vh] overflow-y-auto bg-gray-50 p-4 space-y-3">
    <div className="bg-gray-50 p-4 space-y-3">
      {validMeetings.map((meeting) => (
        <MeetingRow
          key={meeting.meeting_id}
          meeting={meeting}
          isOpen={expandedId === meeting.meeting_id}
          onToggle={() => toggle(meeting.meeting_id)}
          onEdit={onEdit}
          onComplete={onComplete}
        />
      ))}
    </div>
  );
}
