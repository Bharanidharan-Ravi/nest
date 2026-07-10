// import { eachDayOfInterval, endOfMonth, endOfWeek, format, isSameDay, isSameMonth, startOfMonth, startOfWeek } from "date-fns";
// import { FaChevronLeft, FaChevronRight } from "react-icons/fa";



// const WEEKDAY_LABELS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

// const MiniCalendar = ({
//     activeDate,
//     datesWithMeetings = [],
//     onSelectDate,
//     onPrevMonth,
//     onNextMonth,
//     onToday,
//   }) => {
//     const currentMonth = startOfMonth(new Date(activeDate));
//     const calendarDays = eachDayOfInterval({
//       start: startOfWeek(currentMonth),
//       end: endOfWeek(endOfMonth(currentMonth)),
//     });
  
//     return (
//       <div className="px-4 pt-4 pb-3 border-b border-gray-100">
//         {/* HEADER */}
//         <div className="flex items-center justify-between mb-3">
//           <span className="font-semibold text-sm text-gray-800">
//             {format(currentMonth, "MMMM yyyy")}
//           </span>
  
//           <div className="flex items-center gap-2 text-gray-400">
//             <button
//               onClick={onPrevMonth}
//               className="hover:text-gray-700"
//               aria-label="Previous month"
//             >
//               <FaChevronLeft size={11} />
//             </button>
  
//             <button
//               onClick={onToday}
//               className="text-xs font-medium text-gray-500 hover:text-gray-800"
//             >
//               Today
//             </button>
  
//             <button
//               onClick={onNextMonth}
//               className="hover:text-gray-700"
//               aria-label="Next month"
//             >
//               <FaChevronRight size={11} />
//             </button>
//           </div>
//         </div>
  
//         {/* WEEK LABELS */}
//         <div className="grid grid-cols-7 text-center text-[11px] text-gray-400 mb-2">
//           {WEEKDAY_LABELS.map((d) => (
//             <div key={d}>{d}</div>
//           ))}
//         </div>
  
//         {/* DAYS */}
//         <div className="grid grid-cols-7 gap-y-1 text-center text-[12px]">
//           {calendarDays.map((day) => {
//             const dateString = format(day, "yyyy-MM-dd");
  
//             const isSelected = dateString === activeDate;
//             const isToday = isSameDay(day, new Date());
//             const hasMeeting = datesWithMeetings.includes(dateString);
//             const inMonth = isSameMonth(day, currentMonth);
  
//             return (
//               <button
//                 key={dateString}
//                 onClick={() => onSelectDate(dateString)}
//                 className={`
//                   relative mx-auto flex items-center justify-center
//                   w-9 h-8 rounded-md transition
  
//                   ${!inMonth ? "text-gray-300" : "text-gray-700"}
  
//                   ${
//                     isSelected
//                       ? "bg-amber-400 text-gray-900 font-semibold shadow-sm"
//                       : "hover:bg-gray-100"
//                   }
  
//                   ${
//                     isToday && !isSelected
//                       ? "ring-1 ring-amber-300"
//                       : ""
//                   }
//                 `}
//               >
//                 {/* DATE */}
//                 {format(day, "d")}
  
//                 {/* MEETING DOT */}
//                 {hasMeeting && !isSelected && (
//                   <span className="absolute bottom-1 w-1.5 h-1.5 rounded-full bg-amber-500" />
//                 )}
//               </button>
//             );
//           })}
//         </div>
//       </div>
//     );
//   };
  
//   export default MiniCalendar;

// src/features/meeting-scheduler/components/MiniCalendar.jsx
import React, { useMemo } from "react";
import {
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { WEEKDAY_LABELS_SHORT } from "../Helpers/constants";
import { Button } from "./Button";

export default function MiniCalendar({
  activeDate,
  datesWithMeetings = [],
  onSelectDate,
  onPrevMonth,
  onNextMonth,
  onToday,
}) {
  const currentMonth = useMemo(() => startOfMonth(new Date(activeDate)), [activeDate]);

  const calendarDays = useMemo(
    () =>
      eachDayOfInterval({
        start: startOfWeek(currentMonth),
        end: endOfWeek(endOfMonth(currentMonth)),
      }),
    [currentMonth]
  );

  // O(1) lookups instead of Array.includes() per day cell (was O(n) per cell,
  // O(n*days) overall on a month with many meetings).
  const meetingDateSet = useMemo(() => new Set(datesWithMeetings), [datesWithMeetings]);

  return (
    <div className="px-4 pt-4 pb-3 border-b border-gray-100">
      <div className="flex items-center justify-between mb-3">
        <span className="font-semibold text-sm text-gray-800">
          {format(currentMonth, "MMMM yyyy")}
        </span>
        <div className="flex items-center gap-1 text-gray-400">
          <Button
            variant="ghost"
            size="sm"
            className="!p-1.5"
            onClick={onPrevMonth}
            aria-label="Previous month"
          >
            <ChevronLeft size={13} />
          </Button>
          <Button variant="ghost" size="sm" className="!px-2 !py-1 text-gray-500" onClick={onToday}>
            Today
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="!p-1.5"
            onClick={onNextMonth}
            aria-label="Next month"
          >
            <ChevronRight size={13} />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-7 text-center text-[11px] text-gray-400 mb-2">
        {WEEKDAY_LABELS_SHORT.map((day, i) => (
          // eslint-disable-next-line react/no-array-index-key -- static, never reorders
          <div key={`${day}-${i}`}>{day}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-y-1 text-center text-[12px]">
        {calendarDays.map((day) => {
          const dateKey = format(day, "yyyy-MM-dd");
          const isSelected = dateKey === activeDate;
          const isToday = isSameDay(day, new Date());
          const hasMeeting = meetingDateSet.has(dateKey);
          const inMonth = isSameMonth(day, currentMonth);

          return (
            <button
              type="button"
              key={dateKey}
              onClick={() => onSelectDate(dateKey)}
              aria-current={isToday ? "date" : undefined}
              aria-pressed={isSelected}
              className={`relative mx-auto flex items-center justify-center w-9 h-8 rounded-md transition
                ${!inMonth ? "text-gray-300" : "text-gray-700"}
                ${isSelected ? "bg-amber-400 text-gray-900 font-semibold shadow-sm" : "hover:bg-gray-100"}
                ${isToday && !isSelected ? "ring-1 ring-amber-300" : ""}`}
            >
              {format(day, "d")}
              {hasMeeting && !isSelected && (
                <span className="absolute bottom-1 w-1.5 h-1.5 rounded-full bg-amber-500" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
