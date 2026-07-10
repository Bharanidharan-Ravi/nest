

// import React from "react";
// import { FaCalendarAlt, FaPlus } from "react-icons/fa";
// import { readUserFromSession } from "../../../core/auth/useCurrentUser";
// import { useEmployeeOptions } from "../../../core/master/selectors/selectors";
// import MeetingScheduler from "../components/MeetingScheduler";
// import { ListLayout } from "../../../packages/ui-List/components/ListLayout";
// import { ListProvider } from "../../../packages/ui-List/components/ListProvider";
// import { useParams } from "react-router-dom";
// import { useMeetingData } from "../hooks/Usemeetingdata";
// const normalizeMeeting = (meet) => ({
//   meeting_id: meet?.Meeting_Id,
//   meeting_date: meet.Meeting_Date  ,
//   title: meet.Title ,
//   Ticket_Title: meet.Ticket_Title,
//   meeting_summary: meet.Meeting_Summary  ,
//   ticket_id: meet.Ticket_Id,
//   project_id: meet.Project_Id,
//   project_Name: meet.Project_Name,
//   recurrence_type: meet.Recurrence_Type,
//   slot_duration: meet.Slot_Duration  ,
//   booking_type: meet.Booking_Type ,
//   created_at: meet.Created_At,
//   HostName: meet.Host_Name,
//   days_of_week: meet.Days_Of_Week,
//   start_time: meet.Start_Time ,
//   status: meet.Status ?? "Active",
//   end_time: meet.End_Time,
//   host_id: meet.Host_Id ,
//   host_type: meet.Host_Type,
//   issue_Code: meet.Issue_Code,
//   project_Code: meet.ProjectKey,
//   // meet_method: meet.meet_method,
//   // meet_password: meet.meet_password,
//   valid_from_date: meet.Valid_From_Date,
//   valid_to_date: meet.Valid_To_Date ,
//   // updated_by: meet.updated_by,
//   // updated_at: meet.updated_at,
//   InternalParticipants: meet.InternalParticipants,
//   ClientParticipants: meet.ClientParticipants  ,
// });

// const MeetingDashboard = () => {
//   const params = useParams();
//   const user = readUserFromSession();
//   const currentUserId = user?.userId;
//   const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
//   const { data: meeting } = useMeetingData({
//     currentUserId,
//     FromDate: today,
//     ToDate: today,

//   });

//   const employeeFilterOptions = useEmployeeOptions(true);

//   const meetingList = Array.isArray(meeting) ? meeting.map(normalizeMeeting) : [];

//   const listConfigWithNav = {
//     moduleId: "meeting_scheduler",
//     defaultView: "Scheduler",
//     // enableCardControls: true,
//     allowViewSwitch: false,
//     enableTabs: false,
//     enableSearch: false,
//     enablePagination: false,
    
 
//     Custommodule: () => <MeetingScheduler />,
//     // searchFields: ["title", "meeting_summary", "HostName", "Ticket_Title", "booking_type", "status"],
//     // defaultSort: { field: "start_time", order: "asc" },
//     normalizer: normalizeMeeting,
//     tabConfig: [
//       { key: "timeline", label: "Timeline" },
//       { key: "meetings", label: "Meetings" },
//       { key: "availability", label: "Availability" },
//     ],
//     actionButtons: [
//       {
//         name: "availability",
//         label: "Set Availability",
//         icon: <FaCalendarAlt />,
//         className: "bg-gray-200 hover:bg-gray-400 text-gray-800 font-semibold border-transparent",
//       },
//       {
//         name: "meeting",
//         label: "New Meeting",
//         icon: <FaPlus />,
//         className: "bg-amber-400 hover:bg-amber-500 text-gray-900 font-semibold border-transparent",
//       },
//     ],
//     filters: [
//       {
//         type: "weekRange",
//         key: "weekRange",
//         enableDailyNav: true,
//         filterType: "api",
//         api: "/sync/v2",
//         configKey: "MeetingData",
//         source: "MeetingData",
//         defaultRange: "today",
//         apiMode: "split",
//         apiStartKey: "FromDate",
//         apiEndKey: "ToDate",
//         apiDateFormat: "YYYY-MM-DD",
//       },
//       {
//         key: "HostName",
//         label: "Host",
//         apiKey: "EmployeeID",
//         filterType: "api",
//         api: "/sync/v2",
//         configKey: "MeetingData",
//         source: "MeetingData",
//         options: employeeFilterOptions,
//         defaultValue: currentUserId ? String(currentUserId) : "",
//       },
//     ],
//   };

//   return (
//     <div className="flex-1 min-h-0">
//       <ListProvider config={listConfigWithNav} data={meetingList}>
//         <ListLayout />
//       </ListProvider>
//     </div>
//   );
// };

// export default MeetingDashboard;// src/features/meeting-scheduler/MeetingDashboard.jsx
import React, { useMemo } from "react";
import { Calendar, Plus } from "lucide-react";
import { format } from "date-fns";





import { readUserFromSession } from "../../../core/auth/useCurrentUser";
import { useEmployeeOptions } from "../../../core/master/selectors/selectors";
import { ListLayout } from "../../../packages/ui-List/components/ListLayout";
import { ListProvider } from "../../../packages/ui-List/components/ListProvider";
import MeetingScheduler from "./MeetingScheduler";
import { useMeetingData } from "../hooks/useMeetingData";
import { normalizeMeeting } from "../hooks/normalizeMeeting";

// BUG FIX: the original `listConfigWithNav` object was malformed — the
// `filters` array was opened with `{filters: [...` in the middle of the
// object (never closed against the outer object), `tabConfig`/`actionButtons`
// were arrays of objects missing their own `[`, and there were two stray
// `1,}` tokens left over from edits. None of this would have parsed. It's
// rebuilt below as one valid object, split into named constants so each
// piece is easy to scan and edit independently.

function buildTabConfig() {
  return [
    { key: "timeline", label: "Timeline" },
    { key: "meetings", label: "Meetings" },
    { key: "availability", label: "Availability" },
  ];
}

function buildActionButtons() {
  return [
    {
      name: "availability",
      label: "Set Availability",
      icon: <Calendar size={14} />,
      className: "bg-gray-200 hover:bg-gray-400 text-gray-800 font-semibold border-transparent",
    },
    {
      name: "meeting",
      label: "New Meeting",
      icon: <Plus size={14} />,
      className: "bg-amber-400 hover:bg-amber-500 text-gray-900 font-semibold border-transparent",
    },
  ];
}

function buildFilters({ employeeFilterOptions, currentUserId }) {
  return [
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
      label: "Host",
      apiKey: "EmployeeID",
      filterType: "api",
      api: "/sync/v2",
      configKey: "MeetingData",
      source: "MeetingData",
      options: employeeFilterOptions,
      defaultValue: currentUserId ? String(currentUserId) : "",
    },
  ];
}

const MeetingDashboard = () => {
  const user = readUserFromSession();
  const currentUserId = user?.userId;
  const today = format(new Date(), "yyyy-MM-dd");

  const { data: meetings } = useMeetingData({
    currentUserId,
    FromDate: today,
    ToDate: today,
  });

  const employeeFilterOptions = useEmployeeOptions(true);
  const meetingList = useMemo(
    () => (Array.isArray(meetings) ? meetings.map(normalizeMeeting) : []),
    [meetings]
  );

  const listConfigWithNav = useMemo(
    () => ({
      moduleId: "meeting_scheduler",
      defaultView: "Scheduler",
      allowViewSwitch: false,
      enableTabs: false,
      enableSearch: false,
      enablePagination: false,
      Custommodule: () => <MeetingScheduler />,
      normalizer: normalizeMeeting,
      tabConfig: buildTabConfig(),
      actionButtons: buildActionButtons(),
      filters: buildFilters({ employeeFilterOptions, currentUserId }),
    }),
    [employeeFilterOptions, currentUserId]
  );

  return (
    <div className="flex-1 min-h-0">
      <ListProvider config={listConfigWithNav} data={meetingList}>
        <ListLayout />
      </ListProvider>
    </div>
  );
};

export default MeetingDashboard;
