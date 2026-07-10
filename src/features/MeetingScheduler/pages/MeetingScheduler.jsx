

// import React, { useState, useMemo, useCallback } from "react";
// import {
//   FaPlus,
//   FaBars,
//   FaTimes,
// } from "react-icons/fa";
// import { useList } from "../../../packages/ui-List/context/ListContext";

// import EntityFormPage from "../../../packages/crud/pages/EntityFormPage";

// import SchedulerSidebar from "./SchedulerSidebar";
// import { addMonths, format, subMonths } from "date-fns"
// import MonthView from "./MonthView";
// import WeekView from "./WeeklyView";
// import ListView from "./ListView";
// import { readUserFromSession } from "../../../core/auth/useCurrentUser";
// import { useTicketMaster } from "../../tickets/hooks/useTicketMaster";
// import { useParams } from "react-router-dom";
// import { useUpcomingMeeting } from "../hooks/Usemeetingdata";
// import { meetingFormConfig } from "../config/Meetingform.config";

// /* ------------------------------------------------------------------ */
// /* Constants & Helpers                                                  */
// /* ------------------------------------------------------------------ */
// const VIEW_MODES = [ "List","Month", "Week",];
// export const MeetingFormModal = ({
//   isOpen,
//   onClose,
//   onSuccess,
//   context,
// }) => {
//   const ticketMaster = context?.ticketMaster || [];
//   const dynamicConfig = useMemo(() => {
//     const ticketField = {
//       label: "Ticket",
//       name: "ticket",
//       type: "select",
//       ui: "mui",
//       required: false,
//       dataType: "string",
//       apiKey: "Ticket_id",
//       initValueResolver: ({ context }) => {
//         const ticketId = context?.isEditMode? context.entityData.ticket_id :context?.fromTicketId;
//         if (!ticketId) return null;
//         const ticket = (ticketMaster || []).find(
//           (t) => t.Issue_Id == ticketId
//         );
//         if (ticket) {
//           return {
//             value: {
//               id: ticket.Issue_Id,
//               name: ticket.Title,
//             },
//             label: ticket.Title,
//           };
//         }
//         const fallbackTitle = context?.fromTicketTitle;

//         if (fallbackTitle) {
//           return {
//             value: {
//               id: ticketId,
//               name: fallbackTitle,
//             },
//             label: fallbackTitle,
//           };
//         }
//         return null;
//       },
//       // optionsResolver receives live formData at render time
//       optionsResolver: ({ formData, context }) => {
//         const selectedProjectId = formData?.project?.value?.id;
//         return (context.ticketMaster || [])
//           .filter((t) => (selectedProjectId ? t.Project_Id === selectedProjectId : true))
//           .map((t) => ({ value: { id: t.Issue_Id, name: t.Title }, label: t.Title }));
//       },
//     };

//     return {
//       ...meetingFormConfig,
//       api: context?.isEditMode ? `MeetingSchedulerControler/${context?.meetingId}` : meetingFormConfig.api,
//       fields: [...(meetingFormConfig.fields || []), ticketField],
//     };
//   }, [ticketMaster,context]); 

//   if (!isOpen) return null;

//   const handleSuccess = () => {
//     onSuccess?.();
//     onClose();
//   };

//   return (
//     <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">

//       <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden mx-4">

//         {/* Modal header */}
//         <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
//           <h2 className="text-base font-bold text-gray-900">
//             {context?.isEditMode ? "Edit" : "New"} Meeting
//           </h2>

//           {/* ONLY THIS CLOSES MODAL */}
//           <button
//             onClick={onClose}
//             className="text-gray-400 hover:text-gray-700 transition"
//             aria-label="Close"
//           >
//             <FaTimes size={16} />
//           </button>
//         </div>

//         {/* Scrollable form body */}
//         <div className="flex-1 overflow-y-auto">
//           <EntityFormPage
//             mode={context?.isEditMode ? "Edit" : "Create"}
//             config={dynamicConfig}
//             module={"Meeting"}
//             onSuccessCallback={handleSuccess}
//             onCancel={onClose}
//             context={context}
//           />
//         </div>

//       </div>
//     </div>
//   );
// }



// const SchedulerHeader = ({ viewMode, onViewModeChange, onNewMeeting, headerLabel }) => (
//   <div className="flex items-center justify-between gap-4 px-5 py-4 border-b border-gray-100 bg-white flex-wrap">
//     <div className="flex items-center gap-3">
//       <FaBars className="text-gray-400 hidden sm:block" />
//       <div>
//         <h2 className="text-lg font-bold text-gray-900 leading-tight">Meetings</h2>
//         {/* <p className="text-xs text-gray-400 leading-tight">{formatHeaderDate(activeDate)}</p> */}
//       </div>
//     </div>

//     <div className="flex items-center gap-3 flex-wrap">
//       {/* View switcher */}
//       <div className="flex rounded-md border border-gray-200 overflow-hidden text-sm">
//         {VIEW_MODES.map((mode) => (
//           <button
//             key={mode}
//             onClick={() => onViewModeChange(mode)}
//             className={`px-3 py-1.5 font-medium transition border-r border-gray-200 last:border-r-0 ${viewMode === mode
//               ? "bg-white text-gray-900"
//               : "bg-gray-50 text-gray-400 hover:text-gray-600"
//               }`}
//           >
//             {mode}
//           </button>
//         ))}
//       </div>
//       {/* NEW MEETING — opens modal */}
//       <button
//         onClick={onNewMeeting}
//         className="flex items-center gap-2 bg-amber-400 hover:bg-amber-500 text-gray-900 font-semibold text-sm px-4 py-2 rounded-md transition"
//       >
//         <FaPlus size={12} />
//         New Meeting
//       </button>
//     </div>
//   </div>
// );



// const MeetingScheduler = () => {
//   const { data = [] } = useList();
//   const user = readUserFromSession();
//   const params = useParams();
//   const currentUserId = user?.userId;
//   const { data: UpcomingMeetings = [] } = useUpcomingMeeting();
//   const { data: ticketMaster = [] } = useTicketMaster({ employeeId: currentUserId });
//   const [viewMode, setViewMode] = useState("List");
//   const [modalOpen, setModalOpen] = useState(false);
//   const [selectedMeeting, setSelectedMeeting] = useState(null);
//   const [isEditMode, setIsEditMode] = useState(false);
//   const [activeDate, setActiveDate] = useState(
//     new Date().toISOString().split("T")[0]
//   );
//   const meetingContext = useMemo(
//     () => ({
//       ticketMaster,
//       currentUserId,
//       UpcomingMeetings,
//       isEditMode,
//       meetingId:selectedMeeting?.meeting_id,
//       entityData: selectedMeeting,
//       fromTicketId: params.ticketId,
//       fromProjectId: params.projectId,
//       fromTicketTitle: params.ticketTitle,
//     }),
//     [ticketMaster, currentUserId, params,selectedMeeting,isEditMode,UpcomingMeetings]
//   );
//   const handlePrevMonth = () => {
//     setActiveDate((prev) =>
//       format(subMonths(new Date(prev), 1), "yyyy-MM-dd")
//     );
//   };
//   const handleNextMonth = () => {
//     setActiveDate((prev) =>
//       format(addMonths(new Date(prev), 1), "yyyy-MM-dd")
//     );
//   };

//   const handleToday = () => {
//     setActiveDate(format(new Date(), "yyyy-MM-dd"));
//   };

//   const onNewMeeting = () => {
//     setModalOpen(true);
//   }


//   const handleFormSuccess = () => {
//     setModalOpen(false)
//   };

//   const onEdit = (item) => {
//     setIsEditMode(true);
//     setModalOpen(true);
//     setSelectedMeeting(item);

//   }

//   const closeModal = () => {
//     setModalOpen(false);
//     setIsEditMode(false);
//     setSelectedMeeting(null);
//   };
//   return (
//     <div className="flex flex-col lg:flex-row   bg-white rounded-lg border border-gray-100 ">

//       {/* Sidebar */}
//       <SchedulerSidebar
//           className="w-full lg:w-80 xl:w-80"
//         activeDate={activeDate}
//         onSelectDate={setActiveDate}
//         onPrevMonth={handlePrevMonth}
//         onNextMonth={handleNextMonth}
//         onToday={handleToday}
//         UpcomingMeetings={UpcomingMeetings}

//       />

//       {/* Main Content */}
//       <div className="flex-1 flex flex-col min-h-0">
//         <SchedulerHeader
//           viewMode={viewMode}
//           onViewModeChange={setViewMode}
//           onNewMeeting={onNewMeeting}
//         />

//         <div className="flex-1 min-h-0 relative overflow-auto">
//           {viewMode === "Month" && (
//             <MonthView
//               activeDate={activeDate}
//               data={data}
//               onSelectDate={setActiveDate}
//             />
//           )}

//           {viewMode === "Week" && (
//             <WeekView
//               activeDate={new Date(activeDate)}
//               today={new Date()}
//               data={data}
//               onSelectMeeting={(meeting) => console.log(meeting)}
//             />
//           )}
//           {viewMode === "List" && (
//             <ListView data={data}
//               onEdit={onEdit}
//             />
//           )}
//         </div>
//         <MeetingFormModal
//           isOpen={!!modalOpen}
//           onClose={closeModal}
//           onSuccess={handleFormSuccess}
//           context={meetingContext}
//         />
//       </div>

//     </div>
//   );
// };

// export default MeetingScheduler;


// src/features/meeting-scheduler/components/MeetingScheduler.jsx
import React, { useCallback, useMemo, useState } from "react";
import { addMonths, format, subMonths } from "date-fns";
import { useParams } from "react-router-dom";
import { useList } from "../../../packages/ui-List/context/ListContext"; // adjust to your real path
import { readUserFromSession } from "../../../core/auth/useCurrentUser";
import { useTicketMaster } from "../../tickets/hooks/useTicketMaster";
import { useUpcomingMeeting } from "../hooks/useMeetingData";
import SchedulerSidebar from "../components/SchedulerSidebar";
import ListView from "../components/ListView";
import WeekView from "../components/WeeklyView";
import { MeetingFormModal } from "../components/MeetingFormModal";
import MonthView from "../components/MonthView";
import SchedulerHeader from "../components/SchedulerHeader";
import MeetingCompleteModal from "../components/MeetingCompletionModel/MeetingCompletionModel";

const todayIso = () => format(new Date(), "yyyy-MM-dd");

export default function MeetingScheduler() {
  const { data = [] } = useList();
  const params = useParams();
  const user = readUserFromSession();
  const currentUserId = user?.userId;

  const { data: upcomingMeetings = [] } = useUpcomingMeeting();
  const { data: ticketMaster = [] } = useTicketMaster();

  const [viewMode, setViewMode] = useState("List");
  const [modalOpen, setModalOpen] = useState(!!params.ticketId);
  const [selectedMeeting, setSelectedMeeting] = useState(null);
  const [completeModalOpen, setCompleteModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  // BUG FIX: original was `useState( )` followed by a dangling expression
  // statement on the next line — that "initializer" never actually ran.
  const [activeDate, setActiveDate] = useState(todayIso());

  // BUG FIX: original object literal had `fromProjectId`/`fromTicketTitle`
  // written *after* the closing `})` of useMemo, i.e. outside the object and
  // outside the callback entirely — dead, unreachable code that silently
  // meant the form modal never received those two context fields.
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

  const handlePrevMonth = useCallback(
    () => setActiveDate((prev) => format(subMonths(new Date(prev), 1), "yyyy-MM-dd")),
    []
  );
  const handleNextMonth = useCallback(
    () => setActiveDate((prev) => format(addMonths(new Date(prev), 1), "yyyy-MM-dd")),
    []
  );
  const handleToday = useCallback(() => setActiveDate(todayIso()), []);

  const onNewMeeting = useCallback(() => setModalOpen(true), []);

  // BUG FIX: `handleFormSuccess` was declared twice in the original file
  // (identical bodies) — harmless in practice but a lint error and a sign
  // of copy-paste drift. Kept once here.
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
  }, [ closeCompleteModal]);
  const closeModal = useCallback(() => {
    setModalOpen(false);
    setIsEditMode(false);
    setSelectedMeeting(null);
  }, []);

  return (
    <div className="flex flex-col lg:flex-row bg-white rounded-lg border border-gray-100">
      <SchedulerSidebar
        className="w-full lg:w-80 xl:w-80"
        activeDate={activeDate}
        onSelectDate={setActiveDate}
        onPrevMonth={handlePrevMonth}
        onNextMonth={handleNextMonth}
        onToday={handleToday}
        upcomingMeetings={upcomingMeetings}
      />

      <div className="flex-1 flex flex-col min-h-0">
        <SchedulerHeader viewMode={viewMode} onViewModeChange={setViewMode} onNewMeeting={onNewMeeting} />

        <div className="flex-1 min-h-0 relative overflow-auto">
          {viewMode === "Month" && (
            <MonthView activeDate={activeDate} data={data} onSelectDate={setActiveDate} />
          )}
          {viewMode === "Week" && (
            <WeekView
              activeDate={new Date(activeDate)}
              today={new Date()}
              data={data}
              onSelectMeeting={onEdit}
            />
          )}
          {viewMode === "List" && <ListView data={data} onEdit={onEdit} onComplete={onComplete} />}
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
