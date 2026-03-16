// Note: You will need to ensure your imports for hooks (useState, useEffect, useMemo),
// dayjs, and your custom components/providers are present at the top of the file.

import { useState } from "react";
import { readUserFromSession } from "../../../core/auth/useCurrentUser";
import { useEffect } from "react";
import dayjs from "dayjs";
import {
  useDashboardData,
  useDashboardTimesheetData,
} from "../hooks/dashboard.api";
import { useMasterData } from "../../../core/master/useMasterData";
import { useMemo } from "react";
import {
  DashboardCardConfig,
  DashboardTableUI,
  DashboardTimesheet,
} from "../config/DashboardUI.config";
import { ListProvider } from "../../../packages/ui-List/components/ListProvider";
import { ListCardView } from "../../../packages/ui-List/components/ListCardView";
import DateRangePickerComponent from "../component/DatePicker/DatePicker";
import { ListTableView } from "../../../packages/ui-List/components/ListTableView";
import "./Dashboard.css";
import { useSmartNavigation } from "../../../core/navigation/useSmartNavigation";
import { ROUTE_KEYS } from "../../../core/routing/paths";
import MuiSelectInput from "../../../packages/react-input-engine/adapters/mui/MuiSelectInput";
import { useTicketMaster } from "../../tickets/hooks/useTicketMaster";
import { TicketListConfig } from "../../tickets/config/TicketUI.config";
import { ListLayout } from "../../../packages/ui-List/components/ListLayout";
import ModuleSwitcher from "../component/ModuleSwitcher";
import { ProjUIConfig } from "../../project/config/ProjectUI.config";

export default function Dashboard() {
  const user = readUserFromSession();
  const { goTo } = useSmartNavigation();
  const { data: ProjectList } = useMasterData();
  const storageKey = `dashboard_selected_${user.userId}`;
  
  const [selectedItems, setSelectedItems] = useState(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const currentUserName = user?.name;
  console.log("ProjectList :",currentUserName, user);

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(selectedItems));
  }, [selectedItems, storageKey]);
  const [fromDate, setFromDate] = useState(dayjs());
  const [toDate, setToDate] = useState(dayjs());
  const { data } = useTicketMaster({ employeeId: user.userId });
  const { data: TimeSheet } = useDashboardTimesheetData(
    user.userId,
    fromDate,
    toDate,
  );
  const { data: Master } = useMasterData();

  const normalizeTimeData = (data) => ({
    id: 0,
  });

  const TicketCount = normalizeTimeData(data);
  // const TimeSheetData = TimeSheet?.map(normalizeTimeData) || [];

  const normalizeTicket = (ticket) => ({
    id: ticket.Issue_Id,
    title: ticket.Title,
    ticketKey: ticket.Issue_Code,
    status: ticket.Status,
    description: ticket.HtmlDesc || ticket.Description,
    assginedTo: ticket.Assignee_Name,
    estimateHours: ticket.hours,
    createdAt: ticket.CreatedAt,
    updatedAt: ticket.UpdatedAt,
    UpdatedBy: ticket.UpdatedBy,
    repoId: ticket.RepoId,
    dueDate: ticket.Due_Date,
    project: ticket.Project_Id,
    priority: ticket.Priority,
    multiAssignees: ticket.All_Assignees
      ? JSON.parse(ticket.All_Assignees)
      : [],
    RepoKey: ticket.RepoKey,
    label: ticket.Labels_JSON ? JSON.parse(ticket.Labels_JSON) : [],
  });
  const normalizeProj = (proj) => ({
    id: proj.Id,
    title: proj.Project_Name,
    key: proj.ProjectKey,
    status: proj.Status,
    owner: proj.EmployeeName,
    createdAt: proj.CreatedAt,
    CreatedBy: proj.CreatedBy,
    repoId: proj.Repo_Id,
    repoName: proj.Repo_Name,
    repoKey: proj.RepoKey,
    UpdatedAt: proj.UpdatedAt,
    UpdatedBy: proj.UpdatedBy,
  });

  const Project = ProjectList?.ProjectList?.map(normalizeProj) || [];

  const TicketList = data?.map(normalizeTicket) || [];
  const employeeFilterOptions = [
    { label: "All Employees", value: "" },
    ...(Master?.EmployeeList?.map((user) => ({
      label: user.UserName,
      value: user.UserName,
    })) || []),
  ];
  console.log("TicketList :", TicketList, data, TicketCount);

  const listConfigWithNav = {
    ...TicketListConfig,
    defaultFilters: {
      assginedTo: currentUserName,
    },
    filters: [
      {
        key: "assginedTo", // 👈 MUST match the 'owner' key in normalizeProj
        view: "Assignee",
        options: employeeFilterOptions,
        defaultValue: currentUserName,
      },
    ],
  };
  const dashboardModules = [
    {
      id: "tickets",
      label: "My Tickets",
      config: listConfigWithNav,
      data: TicketList,
    },
    {
      id: "timesheets",
      label: "My Timesheets",
      config: ProjUIConfig,
      data: Project,
    },
    // {
    //   id: "planner",
    //   label: "Daily Planner",
    //   config: PlannerListConfig,
    //   data: normalizedPlanner,
    // },
  ];
  return (
    <div className="dashview">
      <h2>Dashboard</h2>
      {/* Pass the master config into your new Switcher component */}
      <ModuleSwitcher modules={dashboardModules} />
    </div>
    // <div className="dashview">
    //   <h2>Dashboard</h2>
    //   <div className="div-1">
    //     <div className="card">
    //       <div className="tab-container">
    //         Selected Tickets
    //         <div className="tab-container-data">{selectedItems.length}</div>
    //       </div>
    //     </div>
    //   </div>

    //   <div className="date-range-picker-container">
    //     <div className="date-range-picker">
    //       <DateRangePickerComponent
    //         value={[fromDate, toDate]}
    //         onChange={({ startDate, endDate }) => {
    //           setFromDate(startDate);
    //           setToDate(endDate);
    //         }}
    //       />
    //     </div>
    //   </div>

    //   <div className="div-2">
    //     <div className="w-full pb-10">
    //       <ListProvider config={listConfigWithNav} data={TicketList}>
    //         <ListLayout />
    //       </ListProvider>
    //     </div>
    //     <div className="Timesheet_data"></div>
    //   </div>
    // </div>
  );
}

// import { useEffect, useMemo, useState } from "react";
// import { ListCardView } from "../../../packages/ui-List/components/ListCardView";
// import { ListProvider } from "../../../packages/ui-List/components/ListProvider";
// import { DashboardCardConfig, DashboardTableUI, DashboardTimesheet } from "../config/DashboardUI.config";
// import Dayjs from "dayjs";
// import { useDashboardData, useDashboardTimesheetData } from "../hooks/dashboard.api";
// import { ListLayout } from "../../../packages/ui-List/components/ListLayout";
// import DateRangePickerComponent from "../component/DatePicker/DatePicker";
// import { decryptUserInfo } from "../../../app/shared/decryption/Decryption";
// import "../pages/Dashboard.css"
// import { ListTableView } from "../../../packages/ui-List/components/ListTableView";
// import { Ticket } from "lucide-react";
// import { readUserFromSession } from "../../../core/auth/useCurrentUser";

// export default function Dashboard() {
//   // const user = sessionStorage.getItem("user");
//     const user = readUserFromSession();

//   const storagekey = `dashboard_selected_${user.userId}`;

//   const [selectedItems, setSelectedItems] = useState(() => {
//     try {
//       const saved = localStorage.getItem(storagekey);
//       return saved ? JSON.parse(saved) : [];
//     } catch {
//       return [];
//     }
//   });

//   useEffect(() => {
//     localStorage.setItem(storagekey, JSON.stringify(selectedItems));
//   }, [selectedItems, storagekey]);

//   const currentDate = new Date();
//   const [fromDate, setFromDate] = useState(Dayjs());
//   const [toDate, setToDate] = useState(Dayjs());

//   const { data } = useDashboardData(user.userId);
//   const { data: TimeSheet } = useDashboardTimesheetData(user.userId, fromDate, toDate);

//   // Normalize dashboard ticket count
//   const normalizeCount = (count) => ({
//     id: 1,
//     title: count.Total_Count
//   });

//   // Normalize dashboard data with issueId
//   const normalizedata = (Listdata) => ({
//     id: Listdata.Issue_Id,
//     issueId: Listdata.Issue_Id, // Add issueId for matching
//     issuesNo: Listdata.Issue_Code,
//     title: Listdata.Title,
//     dueDate: Listdata.DueDate,
//     assignee: Listdata.Assinged_By,
//   });

//   // Normalize timesheet data with issueId
//   const normalizeTimedata = (Timedata) => ({
//     id: Timedata.ThreadId,
//     issueId: Timedata["Issue_Id"], // Critical: Ensure issueId is always present
//     TicketNo: Timedata.TicketNo,
//     TicketName: Timedata.TicketName,
//     StartTime: Timedata.StartTime,
//     EndTime: Timedata.EndTime,
//     ConsumeTime: Timedata.ConsumeTime,
//     total: Timedata.total,
//   });

//   const TicketCount = data?.TicketCount.map(normalizeCount) || [];
//   const DashBoardData = data?.DashBoardData.map(normalizedata) || [];
//   const TimeSheetData = TimeSheet?.map(normalizeTimedata) || [];

//   const handleSelectionChange = (item, ischecked) => {
//     setSelectedItems((prev) => {
//       if (ischecked) {
//         const exists = prev.some((i) => i.id == item.id);
//         if (exists) return prev;
//         return [...prev, item];
//       } else {
//         return prev.filter((i) => i.id !== item.id);
//       }
//     });
//   };

//   const selectedIds=useMemo(()=>{
//     return selectedItems.map((item)=>item.id);
//   },[selectedItems]);

//   const stickTable = {
//     ...DashboardTableUI,
//     onSelectionChange: handleSelectionChange,
//     selectedIds,
//   };

//   const FinalTimesheetdata = useMemo(() => {
//      const merged = [...TimeSheetData];
//     selectedItems.forEach((ticket)=>{
//       const existingIndex=merged.findIndex(
//         (row)=>row.issueId===ticket.issueId
//       );
//       if (existingIndex!==-1){
//         merged[existingIndex]={
//           ...merged[existingIndex],
//           TicketNo: ticket.issuesNo,
//          TicketName: ticket.title,
//         };
//       }else{
//         merged.push({
//           id: `selected-${ticket.id}`, // Different ID pattern for selected tickets
//          issueId: ticket.issueId || ticket.id,
//          TicketNo: ticket.issuesNo,
//            TicketName: ticket.title,
//            StartTime: "",
//            EndTime: "",
//            total: "",

//         })

//       }
//     })
//     return merged;
//     },[TimeSheetData,selectedItems]);
//   return (
//     <div className="dashview overflow-auto">
//       <h2>Dashboard</h2>
//       <div className="div-1">
//         <div className="card">
//           <ListProvider data={TicketCount} config={DashboardCardConfig}>
//             <div className="tab-container">
//               List Of Tickets
//               <div className="tab-container-data">
//                 <ListCardView />
//               </div>
//             </div>
//           </ListProvider>
//         </div>

//         <div className="card">
//           <div className="tab-container">
//             Selected Tickets
//             <div className="tab-container-data">
//               {selectedItems.length}
//             </div>
//           </div>
//         </div>

//         <div className="date-range-picker">
//           <DateRangePickerComponent
//             value={[fromDate, toDate]}
//             onChange={({ startDate, endDate }) => {
//               setFromDate(startDate);
//               setToDate(endDate);
//             }}
//           />
//         </div>
//       </div>

//       <div className="div-2">
//         <div className="ticketList border border-gray-300 rounded-lg shadow-sm">
//           <ListProvider data={DashBoardData} config={stickTable}>
//             <div className="listWrapper">
//               <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
//                 <ListTableView />
//               </div>
//             </div>
//           </ListProvider>
//         </div>

//         <div className="Timesheet_data">
//           <div className="getdata border border-gray-300 rounded-lg shadow-sm">
//             <ListProvider data={FinalTimesheetdata} config={DashboardTimesheet}>
//               <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
//                 <ListTableView />
//               </div>
//             </ListProvider>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }
