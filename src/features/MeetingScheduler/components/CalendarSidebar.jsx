import React from "react";
import dayjs from "dayjs";
import { LocalizationProvider, DateCalendar, PickersDay } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import Badge from "./Badge"; // Your badge component


// Helper to get unique meeting dates
// function getMeetingDateSet(meetings = []) {
//   const list = Array.isArray(meetings) ? meetings : meetings?.data ?? [];
//   return new Set(list.map((m) => dayjs(m.valid_from_date).format("YYYY-MM-DD")));
// }

// // Format date string for display
// function fmtDate(str) {
//   return new Date(str).toLocaleDateString("en-IN", {
//     day: "numeric",
//     month: "short",
//     year: "numeric",
//   });
// }
// // Custom day component for the calendar
// function MeetingDay({ day, meetingDates = new Set(), ...props }) {
//   const dateStr = day.format("YYYY-MM-DD");
//   const hasMeeting = meetingDates.has(dateStr);
//   const isPast = day.isBefore(dayjs(), "day");

//   let sx = {};
//   if (hasMeeting && !isPast) {
//     sx = {
//       backgroundColor: "#E6F1FB",
//       color: "#185FA5",
//       fontWeight: 600,
//       borderRadius: "6px",
//       "&:hover": { backgroundColor: "#B5D4F4" },
//       "&.Mui-selected": { backgroundColor: "#185FA5", color: "#fff" },
//     };
//   } else if (hasMeeting && isPast) {
//     sx = {
//       backgroundColor: "rgba(136,135,128,0.12)",
//       color: "#888780",
//       fontWeight: 500,
//       borderRadius: "6px",
//       "&.Mui-selected": { backgroundColor: "#888780", color: "#fff" },
//     };
//   }

//   return <PickersDay {...props} day={day} sx={sx} />;
// }
// // Legend colors
// const LEGEND = [
//   { color: "#378ADD", label: "Upcoming" },
//   { color: "#888780", label: "Past" },
//   { color: "#639922", label: "Available" },
//   { color: "#E24B4A", label: "Leave/Vacation" },
// ];
// dayjs.extend(isSameOrAfter)
// export default function CalendarSidebar({data}) {

//   // Handle API returning { data: [...] } or array directly
//   const meetings = Array.isArray(data) ? data : data?.data ?? [];
//   const meetingDates = getMeetingDateSet(meetings)

//   const upcoming = meetings
//     .filter((e) => dayjs(e.valid_from_date).isSameOrAfter(dayjs(), "day"))
//     .sort((a, b) => new Date(a.valid_from_date) - new Date(b.valid_from_date));

//   return (
//     <aside className="w-[300px] bg-white border-r border-gray-100 flex flex-col overflow-y-auto shrink-0">
//       {/* Calendar */}
//       <LocalizationProvider dateAdapter={AdapterDayjs}>
//         <DateCalendar
//           value={dayjs()}
//           slots={{
//             day: (props) => <MeetingDay {...props} meetingDates={meetingDates} />,
//           }}
//           sx={{ "& .MuiPickersDay-root": { fontSize: "0.75rem" } }}
//         />
//       </LocalizationProvider>

//       {/* Legend */}
//       <div className="px-4 pb-3">
//         <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">
//           Legend
//         </p>
//         <div className="grid grid-cols-2 gap-1.5">
//           {LEGEND.map(({ color, label }) => (
//             <div key={label} className="flex items-center gap-1.5">
//               <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
//               <span className="text-[11px] text-gray-500">{label}</span>
//             </div>
//           ))}
//         </div>
//       </div>
//       <div className="mx-3 border-t border-gray-100"></div>

//       {/* Upcoming meetings */}
//       <div className="px-4 py-3 border-t border-gray-100 flex-1">
//         <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">
//           Upcoming
//         </p>

//         {upcoming.length === 0 ? (
//           <p className="text-xs text-gray-400">No upcoming meetings</p>
//         ) : (
//           upcoming.map((e) => {
//             const isClient = e.meetingType === "Client";
//             const barColor = isClient ? "#D4537E" : "#378ADD";

//             return (
//               <div
//                 key={e.meeting_id}
//                 // onClick={() => onSelectUpcoming(e)}
//                 className="flex items-start gap-2 p-2 rounded-lg hover:bg-gray-50 cursor-pointer mb-2 transition-colors border border-gray-100"
//               >
//                 <div
//                   className="w-[3px] self-stretch rounded-full flex-shrink-0 min-h-[36px]"
//                   style={{ backgroundColor: barColor }}
//                 />

//                 <div className="min-w-0 flex-1">
//                   <div className="flex items-center justify-between gap-1">
//                     <p className="text-xs font-smibold text-gray-800 truncate leading-snug">{e.title}</p>
//                     <span
//                       className={`text-[9px] px-1.5 py-0.5 rounded-full font-medium flex-shrink-0 ${
//                         e.status === "Active" ? "bg-green-50 text-green-700" : "bg-amber-50 text-amber-700"
//                       }`}
//                     >
//                       {e.status}
//                     </span>
//                   </div>

//                   <div className="flex items-center gap-2 mt-0.5 flex-wrap text-[10px] text-gray-400">
//                     <span className="flex items-center gap-1">
//                       <svg
//                         className="w-3 h-3 text-gray-400 shrink-0"
//                         fill="none"
//                         viewBox="0 0 24 24"
//                         stroke="currentColor"
//                       >
//                         <path
//                           strokeLinecap="round"
//                           strokeLinejoin="round"
//                           strokeWidth={2}
//                           d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
//                         />
//                       </svg>
//                       {e.HostName}
//                     </span>

//                     <span className="flex items-center gap-1">
//                       <svg
//                         className="w-3 h-3 text-gray-400 shrink-0"
//                         fill="none"
//                         viewBox="0 0 24 24"
//                         stroke="currentColor"
//                       >
//                         <path
//                           strokeLinecap="round"
//                           strokeLinejoin="round"
//                           strokeWidth={2}
//                           d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
//                         />
//                       </svg>
//                       {fmtDate(e.valid_from_date)}
//                     </span>

//                     <span className="flex items-center gap-1">
//                       {e.start_time} - {e.end_time} ({e.slot_duration}h)
//                     </span>
//                   </div>

//                   {/* <Badge status={e.status} /> */}
//                 </div>
//               </div>
//             );
//           })
//         )}
//       </div>
//     </aside>
//   );
// }

// Legend colors
// const LEGEND = [
//   { color: "#378ADD", label: "Upcoming" },
//   { color: "#888780", label: "Past" },
//   { color: "#639922", label: "Available" },
//   { color: "#E24B4A", label: "Leave/Vacation" },
// ];

// // Extend dayjs
// dayjs.extend(isSameOrAfter);

// // Format date string for display
// function fmtDate(str) {
//   return new Date(str).toLocaleDateString("en-IN", {
//     day: "numeric",
//     month: "short",
//     year: "numeric",
//   });
// }

// // Helper: Get a map of meeting counts per date
// function getMeetingDateMap(meetings = []) {
//   const list = Array.isArray(meetings) ? meetings : meetings?.data ?? [];
//   return list.reduce((acc, meeting) => {
//     const date = dayjs(meeting.valid_from_date).format("YYYY-MM-DD");
//     acc[date] = (acc[date] || 0) + 1;
//     return acc;
//   }, {});
// }

// // Custom Day component with dots
// function MeetingDay({ day, meetingDateMap = {}, ...props }) {
//   const dateStr = day.format("YYYY-MM-DD");
//   const meetingCount = meetingDateMap[dateStr] || 0;

//   const isPast = day.isBefore(dayjs(), "day");

//   let sx = {};
//   if (meetingCount > 0 && !isPast) {
//     sx = {
//       backgroundColor: "#E6F1FB",
//       color: "#185FA5",
//       fontWeight: 600,
//       borderRadius: "6px",
//       "&:hover": { backgroundColor: "#B5D4F4" },
//       "&.Mui-selected": { backgroundColor: "#185FA5", color: "#fff" },
//     };
//   } else if (meetingCount > 0 && isPast) {
//     sx = {
//       backgroundColor: "rgba(136,135,128,0.12)",
//       color: "#888780",
//       fontWeight: 500,
//       borderRadius: "6px",
//       "&.Mui-selected": { backgroundColor: "#888780", color: "#fff" },
//     };
//   }

//   return (
//     <div style={{ position: "relative" }}>
//       <PickersDay {...props} day={day} sx={sx} />

//       {/* Dots below date */}
//       {meetingCount > 0 && (
//         <div
//           style={{
//             position: "absolute",
//             bottom: 2,
//             left: "50%",
//             transform: "translateX(-50%)",
//             display: "flex",
//             gap: 2,
//           }}
//         >
//           {Array.from({ length: Math.min(meetingCount, 3) }).map((_, i) => (
//             <span
//               key={i}
//               style={{
//                 width: 4,
//                 height: 4,
//                 borderRadius: "50%",
//                 backgroundColor: "#185FA5",
//               }}
//             />
//           ))}
//         </div>
//       )}
//     </div>
//   );
// }

// export default function CalendarSidebar({ data }) {
//  const {data:upcominger} = useUpcomingMeeting()
//   const meetings = Array.isArray(data) ? data : data?.data ?? [];
//   const meetingDateMap = getMeetingDateMap(meetings);

//   const upcoming = meetings
//     .filter((e) => dayjs(e.valid_from_date).isSameOrAfter(dayjs(), "day"))
//     .sort((a, b) => new Date(a.valid_from_date) - new Date(b.valid_from_date));

//   return (
//     <aside className="w-[300px] bg-white border-r border-gray-100 flex flex-col overflow-y-auto shrink-0">
//       {/* Calendar */}
//       <LocalizationProvider dateAdapter={AdapterDayjs}>
//         <DateCalendar
//           value={dayjs()}
//           slots={{
//             day: (props) => <MeetingDay {...props} meetingDateMap={meetingDateMap} />,
//           }}
//           sx={{ "& .MuiPickersDay-root": { fontSize: "0.75rem" } }}
//         />
//       </LocalizationProvider>

//       {/* Legend */}
//       <div className="px-4 pb-3">
//         <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">
//           Legend
//         </p>
//         <div className="grid grid-cols-2 gap-1.5">
//           {LEGEND.map(({ color, label }) => (
//             <div key={label} className="flex items-center gap-1.5">
//               <span
//                 className="w-2 h-2 rounded-full flex-shrink-0"
//                 style={{ backgroundColor: color }}
//               />
//               <span className="text-[11px] text-gray-500">{label}</span>
//             </div>
//           ))}
//         </div>
//       </div>

//       <div className="mx-3 border-t border-gray-100"></div>

//       {/* Upcoming meetings */}
//       <div className="px-4 py-3 border-t border-gray-100 flex-1">
//         <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">
//           Upcoming
//         </p>

//         {upcoming.length === 0 ? (
//           <p className="text-xs text-gray-400">No upcoming meetings</p>
//         ) : (
//           upcoming.map((e) => {
//             const isClient = e.meetingType === "Client";
//             const barColor = isClient ? "#D4537E" : "#378ADD";

//             return (
//               <div
//                 key={e.meeting_id}
//                 className="flex items-start gap-2 p-2 rounded-lg hover:bg-gray-50 cursor-pointer mb-2 transition-colors border border-gray-100"
//               >
//                 <div
//                   className="w-[3px] self-stretch rounded-full flex-shrink-0 min-h-[36px]"
//                   style={{ backgroundColor: barColor }}
//                 />

//                 <div className="min-w-0 flex-1">
//                   <div className="flex items-center justify-between gap-1">
//                     <p className="text-xs font-smibold text-gray-800 truncate leading-snug">{e.title}</p>
//                     <span
//                       className={`text-[9px] px-1.5 py-0.5 rounded-full font-medium flex-shrink-0 ${
//                         e.status === "Active" ? "bg-green-50 text-green-700" : "bg-amber-50 text-amber-700"
//                       }`}
//                     >
//                       {e.status}
//                     </span>
//                   </div>

//                   <div className="flex items-center gap-2 mt-0.5 flex-wrap text-[10px] text-gray-400">
//                     <span className="flex items-center gap-1">
//                       <svg
//                         className="w-3 h-3 text-gray-400 shrink-0"
//                         fill="none"
//                         viewBox="0 0 24 24"
//                         stroke="currentColor"
//                       >
//                         <path
//                           strokeLinecap="round"
//                           strokeLinejoin="round"
//                           strokeWidth={2}
//                           d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
//                         />
//                       </svg>
//                       {e.HostName}
//                     </span>

//                     <span className="flex items-center gap-1">
//                       <svg
//                         className="w-3 h-3 text-gray-400 shrink-0"
//                         fill="none"
//                         viewBox="0 0 24 24"
//                         stroke="currentColor"
//                       >
//                         <path
//                           strokeLinecap="round"
//                           strokeLinejoin="round"
//                           strokeWidth={2}
//                           d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
//                         />
//                       </svg>
//                       {fmtDate(e.valid_from_date)}
//                     </span>

//                     <span className="flex items-center gap-1">
//                       {e.start_time} - {e.end_time} ({e.slot_duration}h)
//                     </span>
//                   </div>
//                 </div>
//               </div>
//             );
//           })
//         )}
//       </div>
//     </aside>
//   );
// }



import isSameOrAfter from "dayjs/plugin/isSameOrAfter";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore";
import { FaUser, FaCalendarAlt, FaClock } from "react-icons/fa";
import { useUpcomingMeeting } from "../hooks/Usemeetingdata";

// extend dayjs
dayjs.extend(isSameOrAfter);
dayjs.extend(isSameOrBefore);

const LEGEND = [
  { color: "#378ADD", label: "Upcoming" },
  { color: "#888780", label: "Past" },
  { color: "#639922", label: "Available" },
  { color: "#E24B4A", label: "Leave/Vacation" },
];

// -------------------- DATE FORMAT --------------------
function fmtDate(str) {
  return new Date(str).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

// -------------------- PARSE SINGLE / RANGE DATES --------------------
function parseMeetingDates(meeting) {
  const dateStr = meeting.Date;
  if (!dateStr) return [];

  // Range: "10 Jun 2026 - 23 Jun 2026"
  if (dateStr.includes("-")) {
    const [startStr, endStr] = dateStr.split("-").map((s) => s.trim());

    const start = dayjs(startStr, "DD MMM YYYY");
    const end = dayjs(endStr, "DD MMM YYYY");

    const dates = [];
    let curr = start;

    while (curr.isSameOrBefore(end, "day")) {
      dates.push(curr.format("YYYY-MM-DD"));
      curr = curr.add(1, "day");
    }

    return dates;
  }

  // Single date: "10 Jun 2026"
  return [dayjs(dateStr, "DD MMM YYYY").format("YYYY-MM-DD")];
}

// -------------------- BUILD DATE MAP --------------------
function getMeetingDateMap(meetings = []) {
  const list = Array.isArray(meetings) ? meetings : meetings?.Data ?? [];

  return list.reduce((acc, meeting) => {
    const dates = parseMeetingDates(meeting);

    dates.forEach((d) => {
      acc[d] = (acc[d] || 0) + 1;
    });

    return acc;
  }, {});
}

// -------------------- CUSTOM CALENDAR DAY --------------------
function MeetingDay({ day, meetingDateMap = {}, ...props }) {
  const dateStr = day.format("YYYY-MM-DD");
  const meetingCount = meetingDateMap[dateStr] || 0;

  const isPast = day.isBefore(dayjs(), "day");

  let sx = {};

  if (meetingCount > 0 && !isPast) {
    sx = {
      backgroundColor: "#E6F1FB",
      color: "#185FA5",
      fontWeight: 600,
      borderRadius: "6px",
      "&:hover": { backgroundColor: "#B5D4F4" },
      "&.Mui-selected": { backgroundColor: "#185FA5", color: "#fff" },
    };
  } else if (meetingCount > 0 && isPast) {
    sx = {
      backgroundColor: "rgba(136,135,128,0.12)",
      color: "#888780",
      fontWeight: 500,
      borderRadius: "6px",
      "&.Mui-selected": { backgroundColor: "#888780", color: "#fff" },
    };
  }

  return (
    <div style={{ position: "relative" }}>
      <PickersDay {...props} day={day} sx={sx} />

      {/* dots */}
      {meetingCount > 0 && (
        <div
          style={{
            position: "absolute",
            bottom: 2,
            left: "50%",
            transform: "translateX(-50%)",
            display: "flex",
            gap: 2,
          }}
        >
          {Array.from({ length: Math.min(meetingCount, 3) }).map((_, i) => (
            <span
              key={i}
              style={{
                width: 4,
                height: 4,
                borderRadius: "50%",
                backgroundColor: "#185FA5",
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// -------------------- MAIN COMPONENT --------------------
export default function CalendarSidebar() {
  const { data: upcominger } = useUpcomingMeeting();

  const meetings = upcominger ?? [];
  const meetingDateMap = getMeetingDateMap(meetings);

  // upcoming filter
  const upcoming = meetings
    .filter((e) => {
      const start = dayjs(e.Date.split("-")[0].trim(), "DD MMM YYYY");
      return start.isSameOrAfter(dayjs(), "day");
    })
    .sort((a, b) => {
      const aDate = dayjs(a.Date.split("-")[0].trim(), "DD MMM YYYY");
      const bDate = dayjs(b.Date.split("-")[0].trim(), "DD MMM YYYY");
      return aDate - bDate;
    });

  return (
    <aside className="w-[300px] bg-white border-r border-gray-100 flex flex-col overflow-y-auto shrink-0">

      {/* Calendar */}
      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <DateCalendar
          value={dayjs()}
          slots={{
            day: (props) => (
              <MeetingDay {...props} meetingDateMap={meetingDateMap} />
            ),
          }}
          sx={{ "& .MuiPickersDay-root": { fontSize: "0.75rem" } }}
        />
      </LocalizationProvider>

      {/* Legend */}
      {/* <div className="px-4 pb-3"> */}
      {/* <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">
          Legend
        </p>

        <div className="grid grid-cols-2 gap-1.5">
          {LEGEND.map(({ color, label }) => (
            <div key={label} className="flex items-center gap-1.5">
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: { color } }}
              />
              <span className="text-[11px] text-gray-500">{label}</span>
            </div>
          ))}
        </div> */}
      {/* </div> */}

      <div className="mx-3 border-t border-gray-100" />

      {/* Upcoming */}
      <div className="px-4 py-3 flex-1">
        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">
          Upcoming
        </p>

        {upcoming.length === 0 ? (
          <p className="text-xs text-gray-400">No upcoming meetings</p>
        ) : (
          upcoming.map((e) => {
            const barColor = e.MeetingType === "weekly" ? "#D4537E" : "#378ADD";
          
            return (
              <div
                key={e.meeting_id}
                className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer mb-2 border border-gray-100"
              >
                {/* left color bar */}
                <div
                  className="w-[3px] self-stretch rounded-full min-h-[40px]"
                  style={{ backgroundColor: barColor }}
                />
          
                <div className="flex-1 min-w-0">
                  {/* title + status */}
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-semibold text-gray-800 truncate">
                      {e.title}
                    </p>
          
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full whitespace-nowrap ${
                        e.status === "Active"
                          ? "bg-green-50 text-green-700"
                          : "bg-amber-50 text-amber-700"
                      }`}
                    >
                      {e.status}
                    </span>
                  </div>
          
                  {/* line 1 */}
                  <div className="flex items-center gap-2 text-xs text-gray-600 mt-1">
                    <FaUser className="text-gray-400" />
                    <span>{e.Organizer}</span>
          
                    <span className="text-gray-300">|</span>
          
                    <FaCalendarAlt className="text-gray-400" />
                    <span>{fmtDate(e.Date.split("-")[0].trim())}</span>
                  </div>
          
                  {/* line 2 */}
                  <div className="flex items-center gap-2 text-xs text-gray-600 mt-1">
                    <FaClock className="text-gray-400" />
                    <span>{e.Time}</span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </aside>
  );
}