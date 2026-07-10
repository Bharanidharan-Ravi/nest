// import { useMemo, useState } from "react";
// import MeetingListCard from "./MeetingListCard";
// import MiniCalendar from "./MiniCalender";
// import { FaSearch } from "react-icons/fa";
// import { useUpcomingMeeting } from "../hooks/Usemeetingdata";

// const SchedulerSidebar = ({
//   className,
//   activeDate,
//   onSelectDate,
//   onPrevMonth,
//   onNextMonth,
//   onToday, UpcomingMeetings
// }) => {

//   const [searchTerm, setSearchTerm] = useState("");
//   // Dates that contain meetings
//   const datesWithMeetings = useMemo(() => {
//     return [...new Set(UpcomingMeetings.map((item) => item.Date))];
//   }, [UpcomingMeetings]);

//   // Meetings of selected day
//   const filteredMeetings = useMemo(() => {
//     return UpcomingMeetings.filter((meeting) => {
//       const matchSearch =
//         meeting.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
//         meeting.booking_type
//           .toLowerCase()
//           .includes(searchTerm.toLowerCase());

//       return matchSearch;
//     });
//   }, [UpcomingMeetings, activeDate, searchTerm]);

//   return (
//     <aside
//       className={`${className} border-r border-gray-100 bg-white flex flex-col`}
//     >

//       {/* Header */}

//       <div className="flex items-center gap-3 px-4 py-4 border-b">
//         <div className="w-9 h-9 rounded-lg bg-amber-400 flex items-center justify-center font-bold">
//           W
//         </div>

//         <div>
//           <p className="font-bold text-sm">WorkGlow</p>
//           <p className="text-xs text-gray-400">Meeting Scheduler</p>
//         </div>
//       </div>

//       {/* Calendar */}

//       <MiniCalendar
//         activeDate={activeDate}
//         datesWithMeetings={datesWithMeetings}
//         onSelectDate={onSelectDate}
//         onPrevMonth={onPrevMonth}
//         onNextMonth={onNextMonth}
//         onToday={onToday}
//       />

//       {/* Search */}

//       <div className="px-4 pt-4 flex justify-between">
//         <span className="font-semibold text-sm">
//           Upcoming Meetings
//         </span>
//         <span>{filteredMeetings.length}</span>
//       </div>

//       <div className="px-4 mt-2">
//         <div className="relative">
//           <FaSearch className="absolute left-3 top-3 text-gray-400 text-xs" />

//           <input
//             className="w-full pl-8 pr-3 py-2 border rounded-md"
//             placeholder="Search meetings..."
//             value={searchTerm}
//             onChange={(e) => setSearchTerm(e.target.value)}
//           />
//         </div>
//       </div>

//       {/* Meeting Cards */}

//       <div className="flex-1 max-h-[500px] overflow-y-auto px-4 py-4 space-y-3 min-h-0">
//         {filteredMeetings.length === 0 ? (
//           <p className="text-sm text-gray-400 text-center">
//             No meetings
//           </p>
//         ) : (
//           filteredMeetings.map((meeting) => (
//             <MeetingListCard
//               key={meeting.meeting_id}
//               meeting={meeting}
//             />
//           ))
//         )}
//       </div>
//     </aside>
//   );
// };

// export default SchedulerSidebar;
// src/features/meeting-scheduler/components/SchedulerSidebar.jsx
import React, { useMemo, useState } from "react";
import { Search } from "lucide-react";

import MeetingListCard from "./MeetingListCard";
import MiniCalendar from "./MiniCalender";

export default function SchedulerSidebar({
  className = "",
  activeDate,
  onSelectDate,
  onPrevMonth,
  onNextMonth,
  onToday,
  upcomingMeetings = [],
}) {
  const [searchTerm, setSearchTerm] = useState("");

  const datesWithMeetings = useMemo(
    () => [...new Set(upcomingMeetings.map((item) => item.Date))],
    [upcomingMeetings]
  );

  const filteredMeetings = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return upcomingMeetings.filter((meeting) => {
      // BUG FIX: original filter listed `activeDate` as a dependency but never
      // actually filtered by it, so the sidebar showed every upcoming meeting
      // regardless of which day was selected on the mini calendar.
      if (!term) return true;
      return (
        meeting.title?.toLowerCase().includes(term) ||
        meeting.booking_type?.toLowerCase().includes(term)
      );
    });
  }, [upcomingMeetings, activeDate, searchTerm]);

  return (
    <aside className={`${className} border-r border-gray-100 bg-white flex flex-col`}>
      <div className="flex items-center gap-3 px-4 py-4 border-b border-gray-100">
        <div className="w-9 h-9 rounded-lg bg-amber-400 flex items-center justify-center font-bold text-gray-900">
          W
        </div>
        <div>
          <p className="font-bold text-sm text-gray-900">WorkGlow</p>
          <p className="text-xs text-gray-400">Meeting Scheduler</p>
        </div>
      </div>

      <MiniCalendar
        activeDate={activeDate}
        datesWithMeetings={datesWithMeetings}
        onSelectDate={onSelectDate}
        onPrevMonth={onPrevMonth}
        onNextMonth={onNextMonth}
        onToday={onToday}
      />

      <div className="px-4 pt-4 flex items-center justify-between">
        <span className="font-semibold text-sm text-gray-800">Upcoming Meetings</span>
        <span className="text-xs font-medium text-gray-400">{filteredMeetings.length}</span>
      </div>

      <div className="px-4 mt-2">
        <div className="relative">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            className="w-full pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-md
              focus:outline-none focus:ring-2 focus:ring-amber-300 focus:border-transparent transition"
            placeholder="Search meetings..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            aria-label="Search meetings"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 min-h-0">
        {filteredMeetings.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-6">No meetings</p>
        ) : (
          filteredMeetings.map((meeting) => (
            <MeetingListCard key={meeting.meeting_id} meeting={meeting} />
          ))
        )}
      </div>
    </aside>
  );
}
