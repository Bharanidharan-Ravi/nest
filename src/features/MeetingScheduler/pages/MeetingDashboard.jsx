
import { useState } from "react";
import { ListLayout } from "../../../packages/ui-List/components/ListLayout";
import { ListProvider } from "../../../packages/ui-List/components/ListProvider";
import { useMeetingData } from "../hooks/Usemeetingdata";
import { FaCalendarAlt, FaPlus } from 'react-icons/fa';
import { useEmployeeOptions } from "../../../core/master/selectors/selectors";
import { readUserFromSession } from "../../../core/auth/useCurrentUser";

const MeetingDashboard = () => {
  const user = readUserFromSession();
  const currentUserId = user?.userId;
  const currentDate = new Date().toISOString().split("T")[0];
  const { data: meeting } = useMeetingData(currentUserId, currentDate, currentDate);
  const employeeFilterOptions = useEmployeeOptions(true);
  const normalizemeeting = (meet) => ({
    meeting_id: meet.meeting_id,
    title: meet.title,
    meeting_summary: meet.meeting_summary,
    ticket_id: meet.ticket_id,
    project_id: meet.project_id,
    recurrence_type: meet.recurrence_type,
    slot_duration: meet.slot_duration,
    booking_type: meet.booking_type,
    created_at: meet.created_at,
    HostName: meet.HostName,
    days_of_week: meet.days_of_week,
    start_time: meet.start_time,
    status: meet.status ?? "Active",
    end_time: meet.end_time,
    host_id: meet.host_id,
    host_type: meet.host_type,
    meet_link: meet.meet_link,
    meet_method: meet.meet_method,
    meet_password: meet.meet_password,
    valid_from_date: meet.valid_from_date,
    valid_to_date: meet.valid_to_date,
    updated_by: meet.updated_by,
    updated_at: meet.updated_at,
  });

  const meetlist = Array.isArray(meeting) ? meeting.map(normalizemeeting) : [];
  const listConfigWithNav = {
    defaultView: "Scheduler",
    enableTabs: false,
    tabConfig: [
      { key: "timeline", label: "Timeline" },
      { key: "meetings", label: `Meetings` },
      { key: "availability", label: `Availability` },
    ],
    actionButtons: [
      {
        name: "availablity",
        label: "Set Availability",
        icon: <FaCalendarAlt />,
        className:
          "bg-gray-200  hover:bg-gray-400 text-gray-800 font-semibold border-transparent",
      },
      {
        name: "meeting",
        label: "New Meeting",
        icon: <FaPlus />,
        className:
          "bg-amber-400 hover:bg-amber-500 text-gray-900 font-semibold border-transparent",
      },
    ],
    filters: [
      {
        type: "weekRange",
        key: "weekRange",
        enableDailyNav: true,
        filterType: "api",
        api: "/sync/v2",
        configKey: "MeetingData",
        source: "MeetingData",
        defaultRange: "today",
        apiMode: "split",
        apiStartKey: "FromDate",
        apiEndKey: "ToDate",
        apiDateFormat: "YYYY-MM-DD",
      },
      {
        key: "HostName",
        apiKey: "EmployeeID",
        filterType: "api",
        api: "/sync/v2",
        configKey: "MeetingData",
        source: "MeetingData",
        options: employeeFilterOptions,
        defaultValue: currentUserId,
      },
    ]
  };

  return (
    <>


      <div className="flex-1 min-h-0">
        <ListProvider config={listConfigWithNav} data={meetlist}>
          <ListLayout />
        </ListProvider>
      </div>
    </>
  );
};

export default MeetingDashboard;