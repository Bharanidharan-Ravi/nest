

// // src/features/meeting-scheduler/components/MeetingScheduler.jsx
// import React, { useCallback, useMemo, useState } from "react";
// import { addMonths, endOfDay, format, startOfDay, subMonths } from "date-fns";
// import { useParams } from "react-router-dom";
// import { useList } from "../../../packages/ui-List/context/ListContext"; // adjust to your real path
// import { readUserFromSession } from "../../../core/auth/useCurrentUser";
// import { useTicketMaster } from "../../tickets/hooks/useTicketMaster";
// import { useMeetingData, useUpcomingMeeting } from "../hooks/useMeetingData";
// import SchedulerSidebar from "../components/SchedulerSidebar";
// import ListView from "../components/ListView";
// import WeekView from "../components/WeeklyView";
// import { MeetingFormModal } from "../components/MeetingFormModal";
// import MonthView from "../components/MonthView";
// import SchedulerHeader from "../components/SchedulerHeader";
// import MeetingCompleteModal from "../components/MeetingCompletionModel/MeetingCompletionModel";
// import { parseQuery } from "../../../packages/ui-List/hooks/useQueryParser";



// export default function MeetingScheduler() {
//   const { data = [], query, setQuery, config } = useList();
//   const params = useParams();
//   const user = readUserFromSession();
//   const currentUserId = user?.userId;

//   const today = format(new Date(), "yyyy-MM-dd");
//   const { data: upcomingMeetings = [] } = useUpcomingMeeting();
//   const { data: ticketMaster = [] } = useTicketMaster();
//   const [viewMode, setViewMode] = useState("List");
//   const [modalOpen, setModalOpen] = useState(false);
//   const [selectedMeeting, setSelectedMeeting] = useState(null);
//   const [completeModalOpen, setCompleteModalOpen] = useState(false);
//   const [sidebarOpen, setSidebarOpen] = useState(true);
//   const [isEditMode, setIsEditMode] = useState(false);

//   const meetingContext = useMemo(
//     () => ({
//       ticketMaster,
//       currentUserId,
//       upcomingMeetings,
//       entityData: selectedMeeting,
//       isEditMode,
//       meetingId: selectedMeeting?.meeting_id,
//       fromTicketId: params.ticketId,
//       fromProjectId: params.projectId,
//       fromTicketTitle: params.ticketTitle,
//     }),
//     [ticketMaster, currentUserId, params, selectedMeeting, isEditMode, upcomingMeetings]
//   );

//   const updateQuery = (key, values, isMulti = false) => {
//     const currentParsed = parseQuery(query);
//     const otherFilters = Object.entries(currentParsed.filters)
//       .filter(([k]) => k !== key)
//       .map(([k, v]) => `${k}:${Array.isArray(v) ? v.join(",") : v}`);
//     const normalizedValues = Array.isArray(values)
//       ? values
//       : values !== undefined && values !== null && values !== ""
//         ? [String(values)]
//         : [];
//     if (normalizedValues.length > 0) {
//       const joined = normalizedValues.join(",");
//       const safe = joined.includes(" ") ? `"${joined}"` : joined;
//       otherFilters.push(`${key}:${safe}`);
//     }
//     const newQuery = [...otherFilters, currentParsed.text]
//       .filter(Boolean)
//       .join(" ");
//     setQuery(newQuery);
//   };
//   const weekRangeFilter = useMemo(
//     () => config?.filters?.find((f) => f.type === "weekRange"),
//     [config]
//   );

//   const parsed = parseQuery(query);
//   const currentValue = parsed.filters?.[weekRangeFilter?.key] || "";



//   const onNewMeeting = useCallback(() => setModalOpen(true), []);
//   const handleFormSuccess = useCallback(() => setModalOpen(false), []);
//   const onEdit = useCallback((item) => {
//     setIsEditMode(true);
//     setModalOpen(true);
//     setSelectedMeeting(item);
//   }, []);

//   const onComplete = useCallback((meeting) => {
//     setSelectedMeeting(meeting);
//     setCompleteModalOpen(true);
//   }, []);
//   const closeCompleteModal = useCallback(() => {
//     setCompleteModalOpen(false);
//     setSelectedMeeting(null);
//   }, []);
//   const handleCompleteSubmit = useCallback(() => {
//     closeCompleteModal();
//   }, [closeCompleteModal]);
//   const closeModal = useCallback(() => {
//     setModalOpen(false);
//     setIsEditMode(false);
//     setSelectedMeeting(null);
//   }, []);
//   const toggleSidebar = useCallback(() => {
//     setSidebarOpen((prev) => !prev);
//   }, []);
//   return (
//     <div className="flex flex-col lg:flex-row bg-white rounded-lg border border-gray-100">
//      {sidebarOpen && (
//     <SchedulerSidebar
//       className="w-full lg:w-80 xl:w-80"
//       upcomingMeetings={upcomingMeetings}
//       currentUserId={currentUserId}
//       weekRangeFilter={weekRangeFilter}
//       currentValue={currentValue}
//       updateQuery={updateQuery}
//     />
//   )}

//       <div className="flex-1 flex flex-col min-h-0">
//         <SchedulerHeader  currentDate ={currentValue} viewMode={viewMode} onViewModeChange={setViewMode} onNewMeeting={onNewMeeting} onMenuClick={toggleSidebar} />

//         <div className="flex-1 min-h-0 relative overflow-auto">
//           {viewMode === "Month" && (
//             <MonthView activeDate={today} data={data} />
//           )}
//           {viewMode === "Week" && (
//             <WeekView
//               activeDate={new Date(today)}
//               today={new Date()}
//               data={data}
//               onSelectMeeting={onEdit}
//             />
//           )}
//           {viewMode === "List" && <ListView data={data} 
//           onEdit={onEdit} onComplete={onComplete} />}
//         </div>

//         <MeetingFormModal
//           isOpen={modalOpen}
//           onClose={closeModal}
//           onSuccess={handleFormSuccess}
//           context={meetingContext}
//         />

//         {completeModalOpen &&
//           <MeetingCompleteModal
//             meeting={selectedMeeting}
//             onClose={closeCompleteModal}
//             handleSuccess={handleCompleteSubmit}
//           />
//         }
//       </div>
//     </div>
//   );
// }



// src/features/meeting-scheduler/components/MeetingScheduler.jsx
import React, { useCallback, useMemo, useState } from "react";
import { addMonths, endOfDay, format, startOfDay, subMonths } from "date-fns";
import { useParams } from "react-router-dom";
import { useList } from "../../../packages/ui-List/context/ListContext"; // adjust to your real path
import { readUserFromSession } from "../../../core/auth/useCurrentUser";
import { useTicketMaster } from "../../tickets/hooks/useTicketMaster";
import { useMeetingData, useUpcomingMeeting } from "../hooks/useMeetingData";
import SchedulerSidebar from "../components/SchedulerSidebar";
import ListView from "../components/ListView";
import WeekView from "../components/WeeklyView";
import { MeetingFormModal } from "../components/MeetingFormModal";
import MonthView from "../components/MonthView";
import SchedulerHeader from "../components/SchedulerHeader";
import MeetingCompleteModal from "../components/MeetingCompletionModel/MeetingCompletionModel";
import { parseQuery } from "../../../packages/ui-List/hooks/useQueryParser";



export default function MeetingScheduler() {
  const { data = [], query } = useList();
  const params = useParams();
  const user = readUserFromSession();
  const currentUserId = user?.userId;

  const today = format(new Date(), "yyyy-MM-dd");
  const { data: upcomingMeetings = [] } = useUpcomingMeeting();
  const { data: ticketMaster = [] } = useTicketMaster();
  const [viewMode, setViewMode] = useState("List");
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedMeeting, setSelectedMeeting] = useState(null);
  const [completeModalOpen, setCompleteModalOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isEditMode, setIsEditMode] = useState(false);

  const meetingContext = useMemo(
    () => ({
      ticketMaster,
      currentUserId,
      upcomingMeetings,
      entityData: selectedMeeting,
      isEditMode,
      meetingId: selectedMeeting?.meeting_id,
      fromTicketId: params.ticketId,
      fromProjectId: params.projectId,
      fromTicketTitle: params.ticketTitle,
    }),
    [ticketMaster, currentUserId, params, selectedMeeting, isEditMode, upcomingMeetings]
  );



  const parsed = parseQuery(query);
  const currentValue = parsed.filters?.["weekRange"] || "";



  const onNewMeeting = useCallback(() => setModalOpen(true), []);
  const handleFormSuccess = useCallback(() => setModalOpen(false), []);
  const onEdit = useCallback((item) => {
    setIsEditMode(true);
    setModalOpen(true);
    setSelectedMeeting(item);
  }, []);

  const onComplete = useCallback((meeting) => {
    setSelectedMeeting(meeting);
    setCompleteModalOpen(true);
  }, []);
  const closeCompleteModal = useCallback(() => {
    setCompleteModalOpen(false);
    setSelectedMeeting(null);
  }, []);
  const handleCompleteSubmit = useCallback(() => {
    closeCompleteModal();
  }, [closeCompleteModal]);
  const closeModal = useCallback(() => {
    setModalOpen(false);
    setIsEditMode(false);
    setSelectedMeeting(null);
  }, []);
  const toggleSidebar = useCallback(() => {
    setSidebarOpen((prev) => !prev);
  }, []);
  return (
    <div className="flex flex-col lg:flex-row bg-white rounded-lg border border-gray-100">
      {sidebarOpen && (
        <SchedulerSidebar
          className="w-full lg:w-80 xl:w-80"
          upcomingMeetings={upcomingMeetings}
          currentUserId={currentUserId}
          currentValue={currentValue}
        />
      )}

      <div className="flex-1 flex flex-col min-h-0">
        <SchedulerHeader currentDate={currentValue}
          viewMode={viewMode} onViewModeChange={setViewMode} onNewMeeting={onNewMeeting} onMenuClick={toggleSidebar} />

        <div className="flex-1 min-h-0 relative overflow-auto">
          {viewMode === "Month" && (
            <MonthView activeDate={today} data={data} />
          )}
          {viewMode === "Week" && (
            <WeekView
              activeDate={new Date(today)}
              today={new Date()}
              data={data}
              onSelectMeeting={onEdit}
            />
          )}
          {viewMode === "List" && <ListView data={data}
            onEdit={onEdit} onComplete={onComplete} />}
        </div>

        <MeetingFormModal
          isOpen={modalOpen}
          onClose={closeModal}
          onSuccess={handleFormSuccess}
          context={meetingContext}
        />

        {completeModalOpen &&
          <MeetingCompleteModal
            meeting={selectedMeeting}
            onClose={closeCompleteModal}
            handleSuccess={handleCompleteSubmit}
          />
        }
      </div>
    </div>
  );
}
