

// import React, { useMemo, useState } from "react";
// import { Search } from "lucide-react";

// import MeetingListCard from "./MeetingListCard";
// import { MiniCalendar } from "./MiniCalender";
// import { useList } from "../../../packages/ui-List/context/ListContext";
// import { parseQuery } from "../../../packages/ui-List/hooks/useQueryParser";
// import { WeekRangeFilter } from "../../../packages/ui-List/components/weeklyFilter";
// import { ListFilters } from "../../../packages/ui-List/components/ListFilters";
// import { safeParseList } from "../hooks/participants";

// export default function SchedulerSidebar({
//   className = "",
//   upcomingMeetings = [],
//   currentUserId,
//   weekRangeFilter,
//   currentValue,
//   updateQuery
// }) {
//   const [searchTerm, setSearchTerm] = useState("");
//   const datesWithMeetings = useMemo(() => {
//     return upcomingMeetings
//       .filter((meeting) => {
//         const participants = safeParseList(meeting.Participants);

//         return participants.some(
//           (user) =>
//             user.participant_id?.toLowerCase() === currentUserId?.toLowerCase()
//         );
//       })
//       .map((meeting) => meeting.Date);
//   }, [upcomingMeetings, currentUserId]);

//   const filteredMeetings = useMemo(() => {
//     const term = searchTerm.trim().toLowerCase();
//     return upcomingMeetings.filter((meeting) => {

//       if (!term) return true;
//       return (
//         meeting.title?.toLowerCase().includes(term) ||
//         meeting.booking_type?.toLowerCase().includes(term)
//       );
//     });
//   }, [upcomingMeetings, searchTerm]);



//   return (
//     <aside className={`${className} border-r border-gray-100 bg-white flex flex-col`}>
//       <div className="flex items-center gap-3 px-4 py-4 border-b border-gray-100">
//         <div className="w-9 h-9 rounded-lg bg-amber-400 flex items-center justify-center font-bold text-gray-900">
//           W
//         </div>
//         <div>
//           <p className="font-bold text-sm text-gray-900">WorkGlow</p>
//           <p className="text-xs text-gray-400">Meeting Scheduler</p>
//         </div>

//       </div>
//       {/* <ListFilters /> */}

//       <MiniCalendar
//         datesWithMeetings={datesWithMeetings}
//         filter={weekRangeFilter}
//         currentValue={currentValue}
//         updateQuery={updateQuery}

//       />

//       <div className="px-4  flex items-center justify-between">
//         <span className="font-semibold text-sm text-gray-800">Upcoming Meetings</span>
//         <span className="text-xs font-medium text-gray-400">{filteredMeetings.length}</span>
//       </div>

//       <div className="px-4 mt-2">
//         <div className="relative">
//           <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
//           <input
//             type="text"
//             className="w-full pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-md
//               focus:outline-none focus:ring-2 focus:ring-amber-300 focus:border-transparent transition"
//             placeholder="Search meetings..."
//             value={searchTerm}
//             onChange={(e) => setSearchTerm(e.target.value)}
//             aria-label="Search meetings"
//           />
//         </div>
//       </div>

//       <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 min-h-0">
//         {filteredMeetings.length === 0 ? (
//           <p className="text-sm text-gray-400 text-center py-6">No meetings</p>
//         ) : (
//           filteredMeetings.map((meeting) => (
//             <MeetingListCard key={meeting.meeting_id} meeting={meeting} />
//           ))
//         )}
//       </div>
//     </aside>
//   );
// }



import React, { useMemo, useState } from "react";
import { Search } from "lucide-react";

import MeetingListCard from "./MeetingListCard";
import { MiniCalendar } from "./MiniCalender";
import { useList } from "../../../packages/ui-List/context/ListContext";
import { parseQuery } from "../../../packages/ui-List/hooks/useQueryParser";
import { ListFilters } from "../../../packages/ui-List/components/ListFilters";
import { safeParseList } from "../hooks/participants";

export default function SchedulerSidebar({
  className = "",
  upcomingMeetings = [],
  currentUserId,
  currentValue
}) {
  const { config, query, setQuery } = useList();
  const [searchTerm, setSearchTerm] = useState("");
  const datesWithMeetings = useMemo(() => {
    return upcomingMeetings
      .filter((meeting) => {
        const participants = safeParseList(meeting.Participants);

        return participants.some(
          (user) =>
            user.participant_id?.toLowerCase() === currentUserId?.toLowerCase()
        );
      })
      .map((meeting) => meeting.Date);
  }, [upcomingMeetings, currentUserId]);

  const filteredMeetings = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return upcomingMeetings.filter((meeting) => {

      if (!term) return true;
      return (
        meeting.title?.toLowerCase().includes(term) ||
        meeting.booking_type?.toLowerCase().includes(term)
      );
    });
  }, [upcomingMeetings, searchTerm]);


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

      <div className="flex justify-center w-full mt-2">
     
      </div>

      <MiniCalendar
        datesWithMeetings={datesWithMeetings}
        filter={config?.CalenderFilter[0]}
        currentValue={currentValue}
        updateQuery={(key, values) => {
          const currentParsed = parseQuery(query);
          const otherFilters = Object.entries(currentParsed.filters)
            .filter(([k]) => k !== key)
            .map(([k, v]) => `${k}:${Array.isArray(v) ? v.join(",") : v}`);
          const normalizedValues = Array.isArray(values)
            ? values
            : values ? [String(values)] : [];
          if (normalizedValues.length) {
            const value = normalizedValues.join(",");
            otherFilters.push(`${key}:${value.includes(" ") ? `"${value}"` : value}`);
          }
          setQuery(
            [...otherFilters, currentParsed.text]
              .filter(Boolean)
              .join(" ")
          );
        }}
      />

      <div className="px-4  flex items-center justify-between">
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