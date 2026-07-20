

// import React, { useEffect, useMemo, useState } from "react";
// import { Calendar, Plus } from "lucide-react";
// import { format } from "date-fns";
// import { readUserFromSession } from "../../../core/auth/useCurrentUser";
// import { useEmployeeOptions } from "../../../core/master/selectors/selectors";
// import { ListLayout } from "../../../packages/ui-List/components/ListLayout";
// import { ListProvider } from "../../../packages/ui-List/components/ListProvider";
// import MeetingScheduler from "./MeetingScheduler";
// import { useMeetingData } from "../hooks/useMeetingData";
// import { normalizeMeeting } from "../hooks/normalizeMeeting";

// function buildTabConfig() {
//   return [
//     { key: "timeline", label: "Timeline" },
//     { key: "meetings", label: "Meetings" },
//     { key: "availability", label: "Availability" },
//   ];
// }

// function buildActionButtons() {
//   return [
//     {
//       name: "availability",
//       label: "Set Availability",
//       icon: <Calendar size={14} />,
//       className: "bg-gray-200 hover:bg-gray-400 text-gray-800 font-semibold border-transparent",
//     },
//     {
//       name: "meeting",
//       label: "New Meeting",
//       icon: <Plus size={14} />,
//       className: "bg-amber-400 hover:bg-amber-500 text-gray-900 font-semibold border-transparent",
//     },
//   ];
// }

// function buildFilters({ employeeFilterOptions, currentUserId }) {
//   return [
//     {
//       type: "weekRange",
//       key: "weekRange",
//       enableDailyNav: true,
//       filterType: "api",
//       api: "/sync/v2",
//       configKey: "MeetingData",
//       source: "MeetingData",
//       defaultRange: "today",
//       apiMode: "split",
//       apiStartKey: "FromDate",
//       apiEndKey: "ToDate",
//       apiDateFormat: "YYYY-MM-DD",
 
//     },
//     {
//       key: "HostName",
//       label: "Host",
//       apiKey: "EmployeeID",
//       filterType: "api",
//       api: "/sync/v2",
//       configKey: "MeetingData",
//       source: "MeetingData",
//       options: employeeFilterOptions,
//       defaultValue: currentUserId ? String(currentUserId) : "",
//     },
//   ];
// }

// const MeetingDashboard = () => {
//   const user = readUserFromSession();
//   const currentUserId = user?.userId;
//   // const todayIso = () => format(new Date(), "yyyy-MM-dd");
//   const today = format(new Date(), "yyyy-MM-dd");
//   const {
//     data: meetings,
//   } = useMeetingData({
//     HostId: currentUserId,
//     FromDate: today,
//     ToDate: today,
//   })

//   const employeeFilterOptions = useEmployeeOptions(true);
//   const meetingList = useMemo(
//     () => (Array.isArray(meetings) ? meetings.map(normalizeMeeting) : []),
//     [meetings]
//   );
//   const listConfigWithNav = useMemo(
//     () => ({
//       moduleId: "meeting_scheduler",
//       defaultView: "Scheduler",
//       allowViewSwitch: false,
//       enableTabs: false,
//       enableSearch: false,
//       enablePagination: false,
//       hideTopFilter: true,

//       Custommodule: () => (
//         <MeetingScheduler/>
//       ),

//       normalizer: normalizeMeeting,
//       tabConfig: buildTabConfig(),
//       actionButtons: buildActionButtons(),
//       filters: buildFilters({ employeeFilterOptions, currentUserId }),
//     }),
//     [
//       employeeFilterOptions,
//       currentUserId,
//     ]
//   );

//   return (
//     <div className="flex-1 min-h-0">
//       <ListProvider config={listConfigWithNav} data={meetingList}>
//         <ListLayout />
//       </ListProvider>
//     </div>
//   );
// };

// export default MeetingDashboard;


import React, { useEffect, useMemo, useState } from "react";
import { Calendar, Plus } from "lucide-react";
import { format } from "date-fns";
import { readUserFromSession } from "../../../core/auth/useCurrentUser";
import { useEmployeeOptions } from "../../../core/master/selectors/selectors";
import { ListLayout } from "../../../packages/ui-List/components/ListLayout";
import { ListProvider } from "../../../packages/ui-List/components/ListProvider";
import MeetingScheduler from "./MeetingScheduler";
import { useMeetingData } from "../hooks/useMeetingData";
import { normalizeMeeting } from "../hooks/normalizeMeeting";

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
  // const todayIso = () => format(new Date(), "yyyy-MM-dd");
  const today = format(new Date(), "yyyy-MM-dd");
  const {
    data: meetings,
  } = useMeetingData({
    HostId: currentUserId,
    FromDate: today,
    ToDate: today,
  })

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
      // theme: {
      //   stickyTop: 0,
      // },
      enableTabs: false,
      enableSearch: false,
      enablePagination: false,
      hideTopFilter: true,

      Custommodule: () => (
        <MeetingScheduler/>
      ),

      normalizer: normalizeMeeting,
      tabConfig: buildTabConfig(),
      actionButtons: buildActionButtons(),
      filters: buildFilters({ employeeFilterOptions, currentUserId }),
      CalenderFilter: [
        {
          type: "CustomCalender",
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
      ]
    }),
    [
      employeeFilterOptions,
      currentUserId,
    ]
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
