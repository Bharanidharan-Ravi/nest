// Note: You will need to ensure your imports for hooks (useState, useEffect, useMemo), 
// dayjs, and your custom components/providers are present at the top of the file.

import { useState } from "react";
import { readUserFromSession } from "../../../core/auth/useCurrentUser";
import { useEffect } from "react";
import dayjs from "dayjs";
import { useDashboardData, useDashboardTimesheetData } from "../hooks/dashboard.api";
import { useMasterData } from "../../../core/master/useMasterData";
import { useMemo } from "react";
 import { DashboardCardConfig, DashboardTableUI, DashboardTimesheet } from "../config/DashboardUI.config";
import { ListProvider } from "../../../packages/ui-List/components/ListProvider";
import { ListCardView } from "../../../packages/ui-List/components/ListCardView";
import DateRangePickerComponent from "../component/DatePicker/DatePicker";
import { ListTableView } from "../../../packages/ui-List/components/ListTableView";
import "./Dashboard.css";

export default function Dashboard() {
  const user = readUserFromSession();
  const storageKey = `dashboard_selected_${user.userId}`;
  const [selectedItems, setSelectedItems] = useState(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(selectedItems));
  }, [selectedItems, storageKey]);

  const currentDate = new Date();
  const [fromDate, setFromDate] = useState(dayjs());
  const [toDate, setToDate] = useState(dayjs());

  const { data } = useDashboardData(user.userId);
  const { data: TimeSheet } = useDashboardTimesheetData(user.userId, fromDate, toDate);
  // for employee list data
  const { data: EmployeeList, isLoading, error } = useMasterData(["EmployeeList"]);
  console.log("EmployeeList", EmployeeList);

  const normalizeCount = (count) => ({
    id: 1,
    title: count.Total_Count,
  });

  const normalizeData = (Listdata) => ({
    id: Listdata.Issue_Id,
    issueId: Listdata.Issue_Id,
    issuesNo: Listdata.Issue_Code,
    title: Listdata.Title,
    dueDate: Listdata.DueDate,
    assignee: Listdata.Assigned_By,
  });

  const normalizeTimeData = (Timedata) => ({
    id: Timedata.ThreadId,
    issueId: Timedata["Issue_Id"],
    TicketNo: Timedata.TicketNo,
    TicketName: Timedata.TicketName,
    StartTime: Timedata.StartTime,
    EndTime: Timedata.EndTime,
    ConsumeTime: Timedata.ConsumeTime,
    total: Timedata.total,
  });

  // const normalizeEmploye = (emp) => ({
  //   id: emp.UserID,
  //   name: emp.UserName,
  // });

  const TicketCount = data?.TicketCount.map(normalizeCount) || [];
  const DashBoardData = data?.DashBoardData.map(normalizeData) || [];
  const TimeSheetData = TimeSheet?.map(normalizeTimeData) || [];
  // const employees = EmployeeList?.EmployeeList?.map(normalizeEmploye) || [];

  const handleSelectionChange = (item, ischecked) => {
    setSelectedItems((prev) => {
      if (ischecked) {
        const exists = prev.some((i) => i.id === item.id);
        if (exists) return prev;
        return [...prev, item];
      } else {
        return prev.filter((i) => i.id !== item.id);
      }
    });
  };

  const selectedIds = useMemo(() => {
    return selectedItems.map((item) => item.id);
  }, [selectedItems]);

  const stickTable = {
    ...DashboardTableUI,
    onSelectionChange: handleSelectionChange,
    selectedIds,
  };

  const FinalTimesheetData = useMemo(() => {
    const merged = [...TimeSheetData];
    selectedItems.forEach((ticket) => {
      const existingIndex = merged.findIndex(
        (row) => row.issueId === ticket.issueId
      );
      
      if (existingIndex !== -1) {
        merged[existingIndex] = {
          ...merged[existingIndex],
          TicketNo: ticket.issuesNo,
          TicketName: ticket.title,
        };
      } else {
        merged.push({
          id: `selected-${ticket.id}`,
          issueId: ticket.issueId || ticket.id,
          TicketNo: ticket.issuesNo,
          TicketName: ticket.title,
          StartTime: "",
          EndTime: "",
          total: "",
        });
      }
    });
    return merged;
  }, [TimeSheetData, selectedItems]);

  const dynamicConfig = {
    fields: [
      {
        label: "Employee List",
        name: "employee",
        type: "select",
        ui: "mui",
        required: true,
        dataType: "string",
        visibleWhen: () => true,
        optionsResolver: (masterData) => {
          if (!masterData?.EmployeeList) return [];
          return masterData.EmployeeList.map((emp) => ({
            label: emp.UserName,
            value: emp.UserID, // just the UserID
          }));
        },
      },
    ],
  };

  return (
    <div className="dashview">
      <h2>Dashboard</h2>
      <div className="div-1">
        <div className="card">
          <ListProvider data={TicketCount} config={DashboardCardConfig}>
            <div className="tab-container">
              Total Tickets
              <div className="tab-container-data">
                <ListCardView />
              </div>
            </div>
          </ListProvider>
        </div>

        <div className="card">
          <div className="tab-container">
            Selected Tickets
            <div className="tab-container-data">
              {selectedItems.length}
            </div>
          </div>
        </div>
      </div>

      {/* Employee List */}
      {/* <div className="employeeList">...
      </div> */}

      <div className="date-range-picker-container">
        <div className="date-range-picker">
          <DateRangePickerComponent
            value={[fromDate, toDate]}
            onChange={({ startDate, endDate }) => {
              setFromDate(startDate);
              setToDate(endDate);
            }}
          />
        </div>
      </div>

      <div className="div-2">
        <div className="ticketList">
          <ListProvider data={DashBoardData} config={stickTable}>
            <div className="listWrapper">
              <div className="table-view">
                <ListTableView />
              </div>
            </div>
          </ListProvider>
        </div>

        <div className="Timesheet_data">
          <div className="getdata">
            <ListProvider data={FinalTimesheetData} config={DashboardTimesheet}>
              <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
                <ListTableView />
              </div>
            </ListProvider>
          </div>
        </div>
      </div>
    </div>
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


