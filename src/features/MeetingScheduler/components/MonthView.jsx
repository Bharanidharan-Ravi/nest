// import { useMemo } from "react";
// import {
//   format,
//   startOfMonth,
//   endOfMonth,
//   startOfWeek,
//   endOfWeek,
//   eachDayOfInterval,
//   isSameMonth,
//   isToday,
// } from "date-fns";

// const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

// const STATUS_BAR_COLOR = {
//   Scheduled: "bg-blue-50 border-l-4 border-blue-500",
//   Completed: "bg-green-50 border-l-4 border-green-500",
//   Cancelled: "bg-red-50 border-l-4 border-red-500",
// };
// const formatTime = (time) => {
//   if (!time) return "";
//   const [hours, minutes] = time.split(":");
//   let hour = Number(hours);
//   const ampm = hour >= 12 ? "PM" : "AM";
//   hour = hour % 12 || 12;
//   return `${hour}:${minutes} ${ampm}`;
// };

// const MonthView = ({ activeDate, data = [], onSelectDate }) => {
//   const currentMonth = new Date(activeDate);
//   const calendarStart = startOfWeek(startOfMonth(currentMonth));
//   const calendarEnd = endOfWeek(endOfMonth(currentMonth));

//   const days = eachDayOfInterval({
//     start: calendarStart,
//     end: calendarEnd,
//   });

//   // Group meetings by date
//   const meetingsByDate = useMemo(() => {
//     return data.reduce((acc, meeting) => {
//       if (!meeting.meeting_date) return acc;
//       const key = meeting.meeting_date.split("T")[0];
//       if (!acc[key]) {
//         acc[key] = [];
//       }
//       acc[key].push(meeting);
//       return acc;
//     }, {});
//   }, [data]);

//   return (
//     // <div className="flex flex-col h-full">
//     <>
//       <div className="grid grid-cols-7 border-b border-gray-200 bg-gray-50">
//         {WEEKDAY_LABELS.map((weekday) => (
//           <div
//             key={weekday}
//             className="py-3 text-center text-xs font-semibold uppercase text-gray-600"
//           >
//             {weekday}
//           </div>
//         ))}
//       </div>
//       {/* Month Grid */}
//       <div className="grid grid-cols-7 flex-1 auto-rows-fr">
//         {days.map((day) => {
//           const dateKey = format(day, "yyyy-MM-dd");
//           const dayMeetings = meetingsByDate[dateKey] || [];
//           const isActiveDay = !!activeDate;
//           return (
//             <button
//               key={dateKey}
//               onClick={() => onSelectDate(dateKey)}
//               className={`border border-gray-100 p-2 text-left min-h-[120px] flex flex-col gap-2 transition hover:bg-gray-50 ${
//                 isSameMonth(day, currentMonth)
//                   ? "bg-white"
//                   : "bg-gray-50 text-gray-400"
//               } ${isActiveDay ? "border-amber-500 border-2" : ""}`}
//             >
//               {/* Date */}
//               <div className="flex items-center justify-between">
//                 <span
//                   className={`text-sm font-semibold ${
//                     isToday(day)
//                       ? "flex h-7 w-7 items-center justify-center rounded-full bg-blue-600 text-white"
//                       : ""
//                   }`}
//                 >
//                   {format(day, "d")}
//                 </span>

//                 {dayMeetings.length > 1 && (
//                   <span className="text-[10px] text-gray-500">
//                     {dayMeetings.length}
//                   </span>
//                 )}
//               </div>

//               {/* Meetings */}
//               <div className="flex flex-col gap-1">
//                 {dayMeetings.slice(0, 2).map((meeting) => (
//                   <div
//                     key={meeting.Meeting_Id}
//                     className={`rounded px-2 py-1 text-[11px] truncate ${
//                       STATUS_BAR_COLOR[meeting.status] ||
//                       "bg-sky-50 border-l-4 border-sky-400"
//                     }`}
//                     title={meeting.title}
//                   >
//                     <div className="font-semibold">
//                       {formatTime(meeting.start_time)}
//                     </div>

//                     <div className="truncate">
//                       {meeting.title}
//                     </div>
//                   </div>
//                 ))}

//                 {dayMeetings.length > 2 && (
//                   <div className="px-1 text-[10px] text-gray-500">
//                     +{dayMeetings.length - 2} more
//                   </div>
//                 )}
//               </div>
//             </button>
//           );
//         })}
//       </div>
//     </>
//   );
// };

// export default MonthView;

// import { useMemo } from "react";
// import {
//   format,
//   startOfMonth,
//   endOfMonth,
//   startOfWeek,
//   endOfWeek,
//   eachDayOfInterval,
//   isSameMonth,
//   isToday,
//   isSameDay,
// } from "date-fns";
// import { FaUserTie } from "react-icons/fa";

// const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

// const STATUS_BAR_COLOR = {
//   Scheduled: "bg-blue-50 border-l-4 border-blue-500",
//   Completed: "bg-green-50 border-l-4 border-green-500",
//   Cancelled: "bg-red-50 border-l-4 border-red-500",
// };

// const formatTime = (time) => {
//   if (!time) return "";
//   const [hours, minutes] = time.split(":");
//   let hour = Number(hours);
//   const ampm = hour >= 12 ? "PM" : "AM";
//   hour = hour % 12 || 12;
//   return `${hour}:${minutes} ${ampm}`;
// };

// // Parse participants safely
// const getParticipants = (meeting) => {
//   try {
//     const internal = meeting.InternalParticipants
//       ? JSON.parse(meeting.InternalParticipants)
//       : [];

//     const client = meeting.ClientParticipants
//       ? JSON.parse(meeting.ClientParticipants)
//       : [];

//     return [...internal, ...client];
//   } catch {
//     return [];
//   }
// };

// // Get initials for avatar
// const getInitials = (name = "") =>
//   name
//     .trim()
//     .split(" ")
//     .map((n) => n[0])
//     .join("")
//     .slice(0, 2)
//     .toUpperCase();

// const avatarColors = [
//   "bg-blue-500",
//   "bg-purple-500",
//   "bg-pink-500",
//   "bg-green-500",
//   "bg-orange-500",
//   "bg-indigo-500",
// ];

// const MonthView = ({ activeDate, data = [], onSelectDate }) => {
//   const currentMonth = new Date(activeDate);

//   const calendarStart = startOfWeek(startOfMonth(currentMonth));
//   const calendarEnd = endOfWeek(endOfMonth(currentMonth));

//   const days = eachDayOfInterval({
//     start: calendarStart,
//     end: calendarEnd,
//   });

//   // Group meetings by date
//   const meetingsByDate = useMemo(() => {
//     return data.reduce((acc, meeting) => {
//       if (!meeting.meeting_date) return acc;

//       const key = meeting.meeting_date.split("T")[0];

//       if (!acc[key]) {
//         acc[key] = [];
//       }

//       acc[key].push(meeting);

//       return acc;
//     }, {});
//   }, [data]);

//   return (
//     <>
//       {/* Week Header */}
//       <div className="grid grid-cols-7 border-b border-gray-200 bg-gray-50">
//         {WEEKDAY_LABELS.map((weekday) => (
//           <div
//             key={weekday}
//             className="py-3 text-center text-xs font-semibold uppercase text-gray-600"
//           >
//             {weekday}
//           </div>
//         ))}
//       </div>

//       {/* Calendar Grid */}
//       <div className="grid grid-cols-7 flex-1 auto-rows-fr">
//         {days.map((day) => {
//           const dateKey = format(day, "yyyy-MM-dd");
//           const dayMeetings = meetingsByDate[dateKey] || [];

//           const isSelected =
//             activeDate && isSameDay(new Date(activeDate), day);

//           return (
//             <button
//               key={dateKey}
//               onClick={() => onSelectDate(dateKey)}
//               className={`border p-2 text-left min-h-[140px] flex flex-col gap-2 transition hover:bg-gray-50
//               ${
//                 isSameMonth(day, currentMonth)
//                   ? "bg-white"
//                   : "bg-gray-50 text-gray-400"
//               }
//               ${
//                 isSelected
//                   ? "border-amber-500 border-2"
//                   : "border-gray-100"
//               }`}
//             >
//               {/* Date */}
//               <div className="flex items-center justify-between">
//                 <span
//                   className={`text-sm font-semibold ${
//                     isToday(day)
//                       ? "flex h-7 w-7 items-center justify-center rounded-full bg-blue-600 text-white"
//                       : ""
//                   }`}
//                 >
//                   {format(day, "d")}
//                 </span>

//                 {dayMeetings.length > 1 && (
//                   <span className="text-[10px] text-gray-500 font-medium">
//                     {dayMeetings.length}
//                   </span>
//                 )}
//               </div>

//               {/* Meetings */}
//               <div className="flex flex-col gap-2">
//                 {dayMeetings.slice(0, 2).map((meeting) => {
//                   const participants = getParticipants(meeting);

//                   const host = participants.find(
//                     (p) => p.Participant_Role === "Host"
//                   );

//                   return (
//                     <div
//                       key={meeting.Meeting_Id}
//                       className={`rounded-md px-2 py-2 text-[11px] ${
//                         STATUS_BAR_COLOR[meeting.status] ||
//                         "bg-sky-50 border-l-4 border-sky-400"
//                       }`}
//                     >
//                       {/* Time */}
//                       <div className="font-semibold text-gray-700">
//                         {formatTime(meeting.start_time)}
//                       </div>

//                       {/* Title */}
//                       <div
//                         className="truncate font-medium text-gray-800"
//                         title={meeting.title}
//                       >
//                         {meeting.title}
//                       </div>

//                       {/* Host */}
//                       {host && (
//                         <div className="mt-1 flex items-center gap-1 text-[10px] text-gray-600">
//                           <FaUserTie className="text-gray-500" />
//                           <span className="truncate">
//                             {host.Participant_Name}
//                           </span>
//                         </div>
//                       )}

//                       {/* Participants */}
//                       {participants.length > 0 && (
//                         <div className="mt-2 flex items-center justify-between">
//                           <div className="flex -space-x-2">
//                             {participants
//                               .slice(0, 3)
//                               .map((participant, index) => (
//                                 <div
//                                   key={participant.Participant_Id}
//                                   title={participant.Participant_Name}
//                                   className={`w-6 h-6 rounded-full border-2 border-white text-white text-[9px] font-semibold flex items-center justify-center ${
//                                     avatarColors[
//                                       index % avatarColors.length
//                                     ]
//                                   }`}
//                                 >
//                                   {getInitials(
//                                     participant.Participant_Name
//                                   )}
//                                 </div>
//                               ))}

//                             {participants.length > 3 && (
//                               <div className="w-6 h-6 rounded-full border-2 border-white bg-gray-300 text-gray-700 text-[9px] font-semibold flex items-center justify-center">
//                                 +{participants.length - 3}
//                               </div>
//                             )}
//                           </div>

//                           <span className="text-[10px] text-gray-500">
//                             {participants.length} People
//                           </span>
//                         </div>
//                       )}
//                     </div>
//                   );
//                 })}

//                 {dayMeetings.length > 2 && (
//                   <div className="text-[10px] text-gray-500 font-medium px-1">
//                     +{dayMeetings.length - 2} more meetings
//                   </div>
//                 )}
//               </div>
//             </button>
//           );
//         })}
//       </div>
//     </>
//   );
// };

// export default MonthView;

// src/features/meeting-scheduler/components/MonthView.jsx
import React, { useMemo } from "react";
import {
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  isToday as isTodayFn,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { UserSquare2 } from "lucide-react";
import { DEFAULT_STATUS_BAR_COLOR, STATUS_BAR_COLOR, WEEKDAY_LABELS_SHORT } from "../Helpers/constants";
import { getAllParticipants } from "../hooks/participants";
import { AvatarGroup } from "./Avatar";
import { formatTime24h } from "../Helpers/dateTime";

const MAX_MEETINGS_PER_CELL = 2;

export default function MonthView({ activeDate, data = [], onSelectDate }) {
  const currentMonth = useMemo(() => new Date(activeDate), [activeDate]);

  const days = useMemo(() => {
    const calendarStart = startOfWeek(startOfMonth(currentMonth));
    const calendarEnd = endOfWeek(endOfMonth(currentMonth));
    return eachDayOfInterval({ start: calendarStart, end: calendarEnd });
  }, [currentMonth]);

  const meetingsByDate = useMemo(() => {
    return data.reduce((acc, meeting) => {
      if (!meeting.meeting_date) return acc;
      const key = meeting.meeting_date.split("T")[0];
      (acc[key] ??= []).push(meeting);
      return acc;
    }, {});
  }, [data]);

  return (
    <>
      <div className="grid grid-cols-7 border-b border-gray-200 bg-gray-50">
        {WEEKDAY_LABELS_SHORT.map((weekday, i) => (
          // eslint-disable-next-line react/no-array-index-key -- static header
          <div key={`${weekday}-${i}`} className="py-3 text-center text-xs font-semibold uppercase text-gray-600">
            {weekday}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 flex-1 auto-rows-fr">
        {days.map((day) => {
          const dateKey = format(day, "yyyy-MM-dd");
          const dayMeetings = meetingsByDate[dateKey] || [];
          const isSelected = activeDate && isSameDay(new Date(activeDate), day);

          return (
            <button
              type="button"
              key={dateKey}
              onClick={() => onSelectDate(dateKey)}
              className={`border p-2 text-left min-h-[140px] flex flex-col gap-2 transition hover:bg-gray-50
                ${isSameMonth(day, currentMonth) ? "bg-white" : "bg-gray-50 text-gray-400"}
                ${isSelected ? "border-amber-500 border-2" : "border-gray-100"}`}
            >
              <div className="flex items-center justify-between">
                <span
                  className={`text-sm font-semibold ${
                    isTodayFn(day) ? "flex h-7 w-7 items-center justify-center rounded-full bg-blue-600 text-white" : ""
                  }`}
                >
                  {format(day, "d")}
                </span>
                {dayMeetings.length > 1 && (
                  <span className="text-[10px] text-gray-500 font-medium">{dayMeetings.length}</span>
                )}
              </div>

              <div className="flex flex-col gap-2">
                {dayMeetings.slice(0, MAX_MEETINGS_PER_CELL).map((meeting) => {
                  const { all: participants } = getAllParticipants(meeting);
                  const host = participants.find((p) => p.Participant_Role === "Host");

                  return (
                    <div
                      key={meeting.Meeting_Id ?? meeting.meeting_id}
                      className={`rounded-md px-2 py-2 text-[11px] ${
                        STATUS_BAR_COLOR[meeting.status] ?? DEFAULT_STATUS_BAR_COLOR
                      }`}
                    >
                      <div className="font-semibold text-gray-700">{formatTime24h(meeting.start_time)}</div>
                      <div className="truncate font-medium text-gray-800" title={meeting.title}>
                        {meeting.title}
                      </div>

                      {host && (
                        <div className="mt-1 flex items-center gap-1 text-[10px] text-gray-600">
                          <UserSquare2 size={11} className="text-gray-500" />
                          <span className="truncate">{host.Participant_Name}</span>
                        </div>
                      )}

                      {participants.length > 0 && (
                        <div className="mt-2 flex items-center justify-between">
                          <AvatarGroup people={participants} max={3} size={22} />
                          <span className="text-[10px] text-gray-500">{participants.length} People</span>
                        </div>
                      )}
                    </div>
                  );
                })}

                {dayMeetings.length > MAX_MEETINGS_PER_CELL && (
                  <div className="text-[10px] text-gray-500 font-medium px-1">
                    +{dayMeetings.length - MAX_MEETINGS_PER_CELL} more meetings
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </>
  );
}
