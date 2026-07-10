// import React, { useMemo } from "react";
// import { addDays, format, startOfWeek } from "date-fns";

// const HOURS = Array.from({ length: 9 }, (_, i) => i + 10);

// const WeekView = ({
//   activeDate,
//   today = new Date(),
//   data = [],
//   onSelectMeeting,
// }) => {
//   const weekStart = useMemo(
//     () => startOfWeek(new Date(activeDate)),
//     [activeDate]
//   );

//   const days = useMemo(
//     () => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)),
//     [weekStart]
//   );

//   // Group meetings by date (API format support)
//   const meetingsByDate = useMemo(() => {
//     return data.reduce((acc, meeting) => {
//       const date = meeting.meeting_date?.split("T")[0];
//       if (!date) return acc;

//       (acc[date] ??= []).push(meeting);
//       return acc;
//     }, {});
//   }, [data]);
// console.log("meetingsByDate",meetingsByDate);

//   return (
//     <div className="flex flex-col h-full overflow-auto">

//       {/* HEADER */}
//       <div className="grid grid-cols-[64px_repeat(7,1fr)] sticky top-0 bg-white border-b z-10">
//         <div />

//         {days.map((day) => {
//           const isToday =
//             format(day, "yyyy-MM-dd") === format(today, "yyyy-MM-dd");

//           return (
//             <div key={day.toISOString()} className="text-center py-2 border-l">
//               <p className="text-xs text-gray-400 uppercase">
//                 {format(day, "EEE")}
//               </p>
//               <p
//                 className={`font-semibold ${
//                   isToday ? "text-amber-500" : "text-gray-800"
//                 }`}
//               >
//                 {format(day, "dd")}
//               </p>
//             </div>
//           );
//         })}
//       </div>

//       {/* GRID */}
//       <div className="grid grid-cols-[64px_repeat(7,1fr)]">
//         {HOURS.map((hour) => (
//           <React.Fragment key={hour}>

//             {/* TIME LABEL */}
//             <div className="text-xs text-right pr-2 py-4 border-b text-gray-400">
//               {String(hour).padStart(2, "0")}:00
//             </div>

//             {/* DAY COLUMNS */}
//             {days.map((day) => {
//               const dateKey = format(day, "yyyy-MM-dd");

//               const meetings =
//                 (meetingsByDate[dateKey] || []).filter((m) => {
//                   const startHour = Number(m.start_time?.split(":")[0]);
//                   return startHour === hour;
//                 });

//               return (
//                 <div
//                   key={`${dateKey}-${hour}`}
//                   className="border-l border-b min-h-[70px] p-1"
//                 >
//                   {meetings.map((meeting) => (
//                     <button
//                       key={meeting.meeting_id}
//                       onClick={() => onSelectMeeting?.(meeting)}
//                       className="w-full text-left bg-sky-100 hover:bg-sky-200 rounded p-2 mb-1 transition"
//                     >
//                       <p className="text-xs font-semibold truncate">
//                         {meeting.title}
//                       </p>

//                       <p className="text-[11px] text-gray-500">
//                         {meeting.start_time?.slice(0, 5)} -{" "}
//                         {meeting.end_time?.slice(0, 5)}
//                       </p>

//                       <p className="text-[11px] text-gray-400 truncate">
//                         {meeting.HostName || "No Host"}
//                       </p>
//                     </button>
//                   ))}
//                 </div>
//               );
//             })}
//           </React.Fragment>
//         ))}
//       </div>
//     </div>
//   );
// };

// export default WeekView;

// src/features/meeting-scheduler/components/WeekView.jsx
import React, { useMemo } from "react";
import { addDays, format, startOfWeek } from "date-fns";


import { WEEK_VIEW_HOUR_COUNT, WEEK_VIEW_START_HOUR } from "../Helpers/constants";
import { formatTime24h } from "../Helpers/dateTime";

const HOURS = Array.from({ length: WEEK_VIEW_HOUR_COUNT }, (_, i) => i + WEEK_VIEW_START_HOUR);

export default function WeekView({ activeDate, today = new Date(), data = [], onSelectMeeting }) {
  const weekStart = useMemo(() => startOfWeek(new Date(activeDate)), [activeDate]);
  const days = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)), [weekStart]);

  const meetingsByDate = useMemo(() => {
    return data.reduce((acc, meeting) => {
      const date = meeting.meeting_date?.split("T")[0];
      if (!date) return acc;
      (acc[date] ??= []).push(meeting);
      return acc;
    }, {});
  }, [data]);

  // Pre-index by "date|hour" once per render instead of filtering the whole
  // day's meetings array inside every one of the 7*9 grid cells.
  const meetingsByDateHour = useMemo(() => {
    const map = {};
    Object.entries(meetingsByDate).forEach(([date, meetings]) => {
      meetings.forEach((meeting) => {
        const startHour = Number(meeting.start_time?.split(":")[0]);
        const key = `${date}|${startHour}`;
        (map[key] ??= []).push(meeting);
      });
    });
    return map;
  }, [meetingsByDate]);

  return (
    <div className="flex flex-col h-full overflow-auto">
      <div className="grid grid-cols-[64px_repeat(7,1fr)] sticky top-0 bg-white border-b z-10">
        <div />
        {days.map((day) => {
          const isToday = format(day, "yyyy-MM-dd") === format(today, "yyyy-MM-dd");
          return (
            <div key={day.toISOString()} className="text-center py-2 border-l">
              <p className="text-xs text-gray-400 uppercase">{format(day, "EEE")}</p>
              <p className={`font-semibold ${isToday ? "text-amber-500" : "text-gray-800"}`}>
                {format(day, "dd")}
              </p>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-[64px_repeat(7,1fr)]">
        {HOURS.map((hour) => (
          <React.Fragment key={hour}>
            <div className="text-xs text-right pr-2 py-4 border-b text-gray-400">
              {String(hour).padStart(2, "0")}:00
            </div>
            {days.map((day) => {
              const dateKey = format(day, "yyyy-MM-dd");
              const meetings = meetingsByDateHour[`${dateKey}|${hour}`] ?? [];
              return (
                <div key={`${dateKey}-${hour}`} className="border-l border-b min-h-[70px] p-1">
                  {meetings.map((meeting) => (
                    <button
                      type="button"
                      key={meeting.meeting_id}
                      onClick={() => onSelectMeeting?.(meeting)}
                      className="w-full text-left bg-sky-100 hover:bg-sky-200 rounded p-2 mb-1 transition"
                    >
                      <p className="text-xs font-semibold truncate">{meeting.title}</p>
                      <p className="text-[11px] text-gray-500">
                        {formatTime24h(meeting.start_time)} - {formatTime24h(meeting.end_time)}
                      </p>
                      <p className="text-[11px] text-gray-400 truncate">{meeting.HostName || "No Host"}</p>
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
}
