// import { useState } from "react";
// import { ListProvider } from "../../../packages/ui-List/components/ListProvider";
// import { ListLayout } from "../../../packages/ui-List/components/ListLayout";
// import { getHolidayList } from "../hooks/useHolidayList";
// import { HolidayDataTable } from "../config/HolidayUI";
// import { useSmartNavigation } from "../../../core/navigation/useSmartNavigation";
// import { ROUTE_KEYS } from "../../../core/routing/paths";
// import { useCurrentUser } from "../../../core/auth/useCurrentUser";
// import {CalendarDays, Plus} from "lucide-react";
// import dayjs from "dayjs";

// export default function EmployeeAreaPage() {
//     const [activeTab] = useState("holidays");
//     const {goTo} = useSmartNavigation();
//     const {data} = getHolidayList();
//     const {isAdmin} = useCurrentUser();

//     const today = dayjs().startOf("day");
//     let nextFound = false;

//     const holidays = (Array.isArray(data) ? data : [])
//     .sort((a, b) => dayjs(a.HolidayDate).diff(dayjs(b.HolidayDate)))
//     .map((h) => {
//         const hDate = dayjs(h.HolidayDate).startOf("day");
//         let status = "future";

//         if (hDate.isBefore(today)){
//             status = "past";
//         } else if (hDate.isSame(today)){
//             status = "today";
//         } else if (!nextFound) {
//             status = "next";
//             nextFound = true;
//         }
//         return { ...h, status};
//     });

//     const listConfigWithNav = {
//         ...HolidayDataTable,
//         enableEdit: isAdmin,
//         isEditDisabled: () => !isAdmin,
//         onEditClick: (item) => {
//             if (!isAdmin) return;
//             goTo(ROUTE_KEYS.HOLIDAY_EDIT, {holidayId: item.Id});
//         },
//     };

//     return (
//         <div className="flex flex-col h-full p-4 md:p-6 bg-brand-gray-light">
//             <div className="flex justify-between items-center mb-4 flex-none">
//                 <h2 className="text-2xl font-semibold text-brand-black m-0">Employee Area</h2>
//                 {isAdmin && activeTab === "holidays" && (
//                     <button
//                      onClick={() => goTo(ROUTE_KEYS.HOLIDAY_CREATE)}
//                      className="bg-brand-yellow text-white px-4 py-2 rounded-md font-medium hover:bg-yellow-500 transition-colors flex items-center gap-2"
//                      >
//                         <Plus className="w-4 h-4"/>Add Holiday
//                      </button>
//                 )}
//             </div>

//             <div className="flex gap-6 border-b border-gray-300 mb-4 flex-none">
//                 <button
//                  className="flex items-center gap-2 pb-3 px-1 text-sm font-semibold border-b-2 border-brand-yellow text-brand-black"
//                  >
//                     <CalendarDays className="w-4 h-4"/>
//                     Holiday List
//                  </button>
//             </div>

//             <div className="flex-1 min-h-0 flex flex-col bg-white border border-gray-200 rounded-lg shadow-sm">
//                 {activeTab === "holidays" && (
//                     <div className="flex-1 min-h-0 p-4">
//                         <ListProvider config={listConfigWithNav} data={holidays}>
//                             <ListLayout/>
//                         </ListProvider>
//                         </div>
//                 )}
//             </div>
//         </div>
//     )
// }


import { useState } from "react";
import { ListProvider } from "../../../packages/ui-List/components/ListProvider";
import { ListLayout } from "../../../packages/ui-List/components/ListLayout";
import { getHolidayList } from "../hooks/useHolidayList";
import { HolidayDataTable } from "../config/HolidayUI";
import { useSmartNavigation } from "../../../core/navigation/useSmartNavigation";
import { ROUTE_KEYS } from "../../../core/routing/paths";
import { useCurrentUser } from "../../../core/auth/useCurrentUser";
import { CalendarDays, Plus, FileText } from "lucide-react";
import dayjs from "dayjs";
import { PolicyTab } from "./PolicyTab";
import { usePolicy } from "../hooks/usePolicy";

export default function EmployeeAreaPage() {
  const [activeTab, setActiveTab] = useState("holidays");
  const { goTo } = useSmartNavigation();
  const { data: holidayData } = getHolidayList();
  const { isAdmin } = useCurrentUser();

  const { policyData, uploadPolicy } = usePolicy(activeTab === "policy");

  const today = dayjs().startOf("day");
  let nextFound = false;

  const holidays = (Array.isArray(holidayData) ? holidayData : [])
    .sort((a, b) => dayjs(a.HolidayDate).diff(dayjs(b.HolidayDate))) 
    .map((h) => {
      const hDate = dayjs(h.HolidayDate).startOf("day");
      let status = "future";
      if (hDate.isBefore(today)) status = "past";
      else if (hDate.isSame(today)) status = "today";
      else if (!nextFound) { status = "next"; nextFound = true; }
      return { ...h, status };
    });

  const listConfigWithNav = {
    ...HolidayDataTable,
    enableEdit: isAdmin,
    isEditDisabled: () => !isAdmin,
    onEditClick: (item) => {
      if (!isAdmin) return;
      goTo(ROUTE_KEYS.HOLIDAY_EDIT, { holidayId: item.Id });
    },
  };

  return (
    <div className="flex flex-col h-full p-4 md:p-6 bg-brand-gray-light">
      <div className="flex justify-between items-center mb-4 flex-none">
        <h2 className="text-2xl font-semibold text-brand-black m-0">Employee Area</h2>
        {isAdmin && activeTab === "holidays" && (
          <button
            onClick={() => goTo(ROUTE_KEYS.HOLIDAY_CREATE)}
            className="bg-brand-yellow text-white px-4 py-2 rounded-md font-medium hover:bg-yellow-500 transition-colors flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> Add Holiday
          </button>
        )}
      </div>

      <div className="flex gap-6 border-b border-gray-300 mb-4 flex-none">
        <button
          onClick={() => setActiveTab("holidays")}
          className={`flex items-center gap-2 pb-3 px-1 text-sm font-semibold border-b-2 ${
            activeTab === "holidays" 
              ? "border-brand-yellow text-brand-black" 
              : "border-transparent text-gray-500 hover:text-gray-800"
          }`}
        >
          <CalendarDays className="w-4 h-4" /> Holiday List
        </button>

        <button
          onClick={() => setActiveTab("policy")}
          className={`flex items-center gap-2 pb-3 px-1 text-sm font-semibold border-b-2 ${
            activeTab === "policy" 
              ? "border-brand-yellow text-brand-black" 
              : "border-transparent text-gray-500 hover:text-gray-800"
          }`}
        >
          <FileText className="w-4 h-4" /> Policy
        </button>
      </div>

      <div className="flex-1 min-h-0 flex flex-col bg-white border border-gray-200 rounded-lg shadow-sm overflow-y-auto">
        {activeTab === "holidays" && (
          <div className="flex-1 min-h-0 p-4">
            <ListProvider config={listConfigWithNav} data={holidays}>
              <ListLayout />
            </ListProvider>
          </div>
        )}
        
        {activeTab === "policy" && (
          <PolicyTab 
            isAdmin={isAdmin} 
            policyData={policyData} 
            onUpload={uploadPolicy} 
          />
        )}
      </div>
    </div>
  );
}