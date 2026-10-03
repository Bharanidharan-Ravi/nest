import React, { useMemo, useState } from "react";
import { Search } from "lucide-react";

import { MeetingListCard } from "./Common";
import { MiniCalendar } from "./MiniCalender";
import { useList } from "../../../packages/ui-List/context/ListContext";
import { ListFilters } from "../../../packages/ui-List/components/ListFilters";
import { HOST_FILTER_KEY } from "../config/meetingFilters";
import { safeParseList, sameId, setQueryFilter } from "../Helpers/common";

export default function SchedulerSidebar({
  className = "",
  upcomingMeetings = [],
  currentUserId,
  currentValue,
  focusMonth,
  selectedMeetingId,
  onOpenMeeting,
}) {
  const { config, setQuery } = useList();
  const [searchTerm, setSearchTerm] = useState("");
  // Days with a meeting the current user is in, marked on the small calendar.
  const datesWithMeetings = useMemo(() => {
    return upcomingMeetings
      .filter((meeting) =>
        safeParseList(meeting.Participants).some((user) => sameId(user.participant_id, currentUserId))
      )
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
    <aside className={`${className} border-r border-gray-100 bg-white flex flex-col min-h-0 overflow-y-auto`}>
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
        focusMonth={focusMonth}
        headerFilters={<ListFilters only={[HOST_FILTER_KEY]} />}
        updateQuery={(key, values) => setQuery((current) => setQueryFilter(current, key, values))}
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

      <div className="flex-1 min-h-[200px] overflow-y-auto px-4 py-4 space-y-3">
        {filteredMeetings.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-6">No meetings</p>
        ) : (
          filteredMeetings.map((meeting) => (
            <MeetingListCard
              key={meeting.meeting_id}
              meeting={meeting}
              selected={sameId(meeting.meeting_id, selectedMeetingId)}
              onClick={onOpenMeeting}
            />
          ))
        )}
      </div>
    </aside>
  );
}