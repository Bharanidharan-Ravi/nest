// import { useMemo } from "react";
// import { useMeetingScheduler } from "./hooks/useMeetingScheduler";
// import CalendarSidebar from "./components/CalendarSidebar";
// import TimelineBlock from "./components/TimelineBlock";
// import Badge from "./components/Badge";
// import Avatar from "./components/Avatar";
// import DetailDrawer from "./components/DetailDrawer";
// import MeetingModal from "./modals/MeetingModal";
// import AvailabilityModal from "./modals/AvailabilityModal";
// import { HOURS } from "./utils/constants";
// import { groupByHour, fmtTime, avatarColor, initials } from "./utils/helpers";
// import { useMeetingData } from "../../../features/MeetingScheduler/hooks/Usemeetingdata";

// /**
//  * MeetingScheduler — root component.
//  * Owns no state itself; all state lives in useMeetingScheduler.
//  */
// export default function MeetingScheduler() {
//   const {
//     today, viewYM, selected, events,
//     modal, detail, activeTab,
//     dk, dayEvents, meetings, avail,
//     upcomingMeetings,
//     setSelected, setModal, setDetail, setActiveTab,
//     prevMonth, nextMonth,
//     saveMeeting, saveAvailability, disbandMeeting,
//   } = useMeetingScheduler();
//   const { data: rawMeetingData = [] } = useMeetingData();
//   const slotsByHour = useMemo(() => groupByHour(dayEvents), [dayEvents]);

//   return (
//     <div className="flex h-screen bg-gray-50 font-sans overflow-hidden">

//       {/* ── Left sidebar */}
//       <CalendarSidebar
//       rawMeetingData={rawMeetingData}
//       />

//       {/* ── Main content */}
//       <main className="flex-1 flex flex-col overflow-hidden">

//         {/* Top bar */}
//         <header className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between shrink-0">
//           <div>
//             <h1 className="text-base font-semibold text-gray-900">
//               {selected.toLocaleDateString("en-IN", {
//                 weekday: "long", day: "numeric", month: "long", year: "numeric",
//               })}
//             </h1>
//             <p className="text-xs text-gray-400 mt-0.5">
//               {meetings.length} meeting{meetings.length !== 1 ? "s" : ""}
//               {" · "}
//               {avail.length} availability block{avail.length !== 1 ? "s" : ""}
//             </p>
//           </div>

//           <div className="flex gap-2">
//             <button
//               onClick={() => setModal("availability")}
//               className="flex items-center gap-1.5 px-4 py-2 text-sm border border-gray-200
//                          rounded-lg hover:bg-gray-50 text-gray-600 transition-all"
//             >
//               <span className="text-base leading-none">📅</span> Set Availability
//             </button>
//             <button
//               onClick={() => setModal("meeting")}
//               className="flex items-center gap-1.5 px-4 py-2 text-sm bg-indigo-600 text-white
//                          rounded-lg hover:bg-indigo-700 active:scale-95 transition-all shadow-sm"
//             >
//               <span className="text-base leading-none">＋</span> New Meeting
//             </button>
//           </div>
//         </header>

//         {/* Tabs */}
//         <div className="bg-white border-b border-gray-100 px-6 flex gap-0 shrink-0">
//           {[
//             { key: "timeline", label: "Timeline" },
//             { key: "meetings", label: `Meetings (${meetings.length})` },
//             { key: "availability", label: `Availability (${avail.length})` },
//           ].map(({ key, label }) => (
//             <button
//               key={key}
//               onClick={() => setActiveTab(key)}
//               className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px
//                 ${activeTab === key
//                   ? "border-indigo-600 text-indigo-600"
//                   : "border-transparent text-gray-500 hover:text-gray-700"
//                 }`}
//             >
//               {label}
//             </button>
//           ))}
//         </div>

//         {/* Tab panels */}
//         <div className="flex-1 overflow-y-auto">

//           {/* ── Timeline */}
//           {activeTab === "timeline" && (
//             <div className="px-6 py-4">
//               {HOURS.map((h) => {
//                 const label = h <= 12 ? `${h} AM` : `${h - 12} PM`;
//                 const blocks = slotsByHour[h] || [];
//                 return (
//                   <div key={h} className="flex gap-3 min-h-[52px]">
//                     <div className="w-12 text-right shrink-0 pt-1">
//                       <span className="text-[11px] text-gray-400 font-medium">{label}</span>
//                     </div>
//                     <div className="flex-1 border-t border-gray-100 pt-1 pb-1">
//                       {blocks.map((e) => (
//                         <TimelineBlock key={e.id} event={e} onClick={setDetail} />
//                       ))}
//                     </div>
//                   </div>
//                 );
//               })}
//             </div>
//           )}

//           {/* ── Meetings list */}
//           {activeTab === "meetings" && (
//             <div className="px-6 py-4 space-y-3">
//               {meetings.length === 0 ? (
//                 <div className="flex flex-col items-center justify-center py-16 text-gray-400">
//                   <span className="text-4xl mb-3">📭</span>
//                   <p className="text-sm">No meetings scheduled</p>
//                   <button
//                     onClick={() => setModal("meeting")}
//                     className="mt-3 text-xs text-indigo-600 hover:underline"
//                   >
//                     + Add a meeting
//                   </button>
//                 </div>
//               ) : (
//                 meetings.map((e) => (
//                   <div
//                     key={e.id}
//                     onClick={() => setDetail(e)}
//                     className="bg-white border border-gray-100 rounded-xl p-4 cursor-pointer
//                                hover:shadow-sm hover:border-indigo-200 transition-all"
//                   >
//                     <div className="flex items-start justify-between mb-2">
//                       <div>
//                         <h3 className="text-sm font-semibold text-gray-900">{e.title}</h3>
//                         <p className="text-xs text-gray-400 mt-0.5">
//                           {fmtTime(e.fromTime)} – {fmtTime(e.endTime)}
//                         </p>
//                       </div>
//                       <div className="flex items-center gap-1.5">
//                         <Badge status={e.meetingType} />
//                         <Badge status={e.status} />
//                       </div>
//                     </div>

//                     {e.notes && (
//                       <p className="text-xs text-gray-500 mb-3 line-clamp-2">{e.notes}</p>
//                     )}

//                     {/* Stacked avatars */}
//                     {e.attendees?.length > 0 && (
//                       <div className="flex items-center gap-1.5">
//                         <div className="flex -space-x-1.5">
//                           {e.attendees.slice(0, 5).map((a) => (
//                             <div
//                               key={a}
//                               title={a}
//                               className={`w-6 h-6 rounded-full border-2 border-white flex items-center
//                                           justify-center text-[9px] font-bold ${avatarColor(a)}`}
//                             >
//                               {initials(a)}
//                             </div>
//                           ))}
//                         </div>
//                         {e.attendees.length > 5 && (
//                           <span className="text-[11px] text-gray-400">
//                             +{e.attendees.length - 5} more
//                           </span>
//                         )}
//                         <span className="text-[11px] text-gray-400 ml-1">
//                           {e.attendees.length} attendee{e.attendees.length !== 1 ? "s" : ""}
//                         </span>
//                       </div>
//                     )}

//                     <div className="flex justify-end mt-2">
//                       <button
//                         onClick={(ev) => { ev.stopPropagation(); disbandMeeting(e.id); }}
//                         className={`text-xs px-3 py-1 rounded-lg border transition-all
//                           ${e.status === "Disbanded"
//                             ? "border-emerald-300 text-emerald-600 hover:bg-emerald-50"
//                             : "border-red-200 text-red-500 hover:bg-red-50"
//                           }`}
//                       >
//                         {e.status === "Disbanded" ? "Restore" : "Disband"}
//                       </button>
//                     </div>
//                   </div>
//                 ))
//               )}
//             </div>
//           )}

//           {/* ── Availability list */}
//           {activeTab === "availability" && (
//             <div className="px-6 py-4 space-y-2">
//               {avail.length === 0 ? (
//                 <div className="flex flex-col items-center justify-center py-16 text-gray-400">
//                   <span className="text-4xl mb-3">🗓️</span>
//                   <p className="text-sm">No availability set for this day</p>
//                   <button
//                     onClick={() => setModal("availability")}
//                     className="mt-3 text-xs text-indigo-600 hover:underline"
//                   >
//                     + Set availability
//                   </button>
//                 </div>
//               ) : (
//                 avail.map((e) => (
//                   <div
//                     key={e.id}
//                     onClick={() => setDetail(e)}
//                     className="bg-white border border-gray-100 rounded-xl p-4 cursor-pointer
//                                hover:shadow-sm transition-all"
//                   >
//                     <div className="flex items-center justify-between">
//                       <div>
//                         <Badge status={e.availabilityType} />
//                         <p className="text-xs text-gray-500 mt-1.5">
//                           {e.isFullDay ? "Full Day" : `${fmtTime(e.fromTime)} – ${fmtTime(e.endTime)}`}
//                         </p>
//                         {e.reason && (
//                           <p className="text-xs text-gray-400 mt-0.5">{e.reason}</p>
//                         )}
//                       </div>
//                       <div className="text-right text-[10px] text-gray-300 font-mono tracking-widest">
//                         {e.daysOfWeek}
//                       </div>
//                     </div>
//                   </div>
//                 ))
//               )}
//             </div>
//           )}
//         </div>
//       </main>

//       {/* ── Modals */}
//       {modal === "meeting" && (
//         <MeetingModal
//           date={selected}
//           onClose={() => setModal(null)}
//           onSave={saveMeeting}
//         />
//       )}
//       {modal === "availability" && (
//         <AvailabilityModal
//           date={selected}
//           onClose={() => setModal(null)}
//           onSave={saveAvailability}
//         />
//       )}

//       {/* ── Detail drawer */}
//       {detail && (
//         <DetailDrawer
//           event={detail}
//           onClose={() => setDetail(null)}
//           onDisband={disbandMeeting}
//         />
//       )}
//     </div>
//   );
// }



import { useEffect, useMemo, useState } from "react";




import { useList } from "../../../packages/ui-List/context/ListContext";
import EntityFormPage from "../../../packages/crud/pages/EntityFormPage";
import { meetingFormConfig } from "../config/Meetingform.config";
import { MeetinglFieldConfig } from "../config/Meetingcreate.config";
import { FaBullseye, FaCalendarAlt, FaRegEnvelopeOpen } from "react-icons/fa";
import { readUserFromSession } from "../../../core/auth/useCurrentUser";
import dayjs from "dayjs";
import { useTicketMaster } from "../../tickets/hooks/useTicketMaster";
import CalendarSidebar from "./CalendarSidebar";
import TimelineBlock from "./TimelineBlock";
import { HOURS } from "./constants";
import Badge from "./Badge";
import { fmtTime } from "./helpers";



export default function MeetingScheduler() {
  const user = readUserFromSession();
  const currentUserId = user?.userId;
  const today = useMemo(() => new Date(), []);
  const { config, data } = useList();
  const { data: TicketMaster } = useTicketMaster({ employeeId: currentUserId });
  const ticketMasterOption = TicketMaster?.map(issue => ({
    value: { id: issue.Issue_Id, name: issue.Title },
    label: issue.Title,
  }));
  const [selected, setSelected] = useState(today);
  const [activeTab, setActiveTab] = useState("timeline");
  const [events, setEvents] = useState({});

  useEffect(() => {
    setEvents(data || []); // Directly use API data
  }, [data]);
  const meetingCount = data.filter((e) => e.booking_type === "meeting").length;
  const availabilityCount = data.filter((e) => e.booking_type === "Availability").length;
  // ── Slots by hour for timeline
  const slotsByHour = useMemo(() => {
    const grouped = {};
    data.forEach((event) => {
      const hour = parseInt(event.start_time?.split(":")[0]);
      if (!grouped[hour]) grouped[hour] = [];
      grouped[hour].push(event);
    });
    return grouped;
  }, [data]);
  // ── Modal state
  const [modalMode, setModalMode] = useState(null);
  const [openModel, setOpenModel] = useState(false);
  const openModal = (mode) => {
    setModalMode(mode);
    setOpenModel(true);
  };
  const closeModal = () => setOpenModel(false);
  // function formatHeaderFromData(data = []) {
  //   if (!data || data.length === 0) return "";

  //   // Extract all valid dates from your data
  //   const dates = data
  //     .map((e) => dayjs(e.valid_from_date || e.fromTime)) // fallback if fromTime is used
  //     .sort((a, b) => a.valueOf() - b.valueOf());

  //   if (!dates.length) return "";

  //   const from = dates[0];
  //   const to = dates[dates.length - 1];

  //   if (from.isSame(to, "day")) {
  //     // Same day → full date format
  //     return from.format("dddd, D MMMM YYYY");
  //   }

  //   // Different days → range format
  //   return `${from.format("D MMM YYYY")} – ${to.format("D MMM YYYY")}`;
  // }
   function formatHeaderFromData(data = []) {
    if (!Array.isArray(data) || data.length === 0) return "";
    const dates = data
      .map((e) => {
        const rawDate =
          e.recurrence_type === "onetime"
            ? e.meeting_date
            : e.valid_from_date;
  
        const d = dayjs(rawDate);
  
        return d.isValid() ? d : null;
      })
      .filter(Boolean)
      .sort((a, b) => a.valueOf() - b.valueOf());
  
    if (dates.length === 0) return "";
  
    const from = dates[0];
    const to = dates[dates.length - 1];
    // If same day → show full readable date
    if (from.isSame(to, "day")) {
      return from.format("dddd, D MMMM YYYY");
    }
  
    // If different days → show range
    return `${from.format("D MMM YYYY")} – ${to.format("D MMM YYYY")}`;
  }
  const ticketField = {
    label: "Ticket",
    name: "ticket",
    type: "select",
    ui: "mui",
    required: false,
    dataType: "string",
    apiKey: "ticket_id",
    options: ticketMasterOption,
    // initValueResolver: ({ context }) =>
    //   context.isEdit ? context.entityData?.ticket_id ?? "" : "",
  };
  const dynamicConfig = {
    ...meetingFormConfig,
    fields: [...meetingFormConfig.fields, ticketField] // Add status field on edit

  };

  return (
    <div className="flex h-screen bg-gray-50 font-sans overflow-hidden">
      {/* ── Left sidebar */}
      {/* <CalendarSidebar data={data} setSelected={setSelected} /> */}
      <CalendarSidebar data={data} setSelected={setSelected} />

      {/* ── Main content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between shrink-0">
          <div>
            <h1 className="text-base font-semibold text-gray-900">
              {/* {selected.toLocaleDateString("en-IN", {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric",
              })} */}
              {formatHeaderFromData(data)}
            </h1>
            <p className="text-xs text-gray-400 mt-0.5">

              {meetingCount} meeting{meetingCount !== 1 ? "s" : ""} · {availabilityCount} availability block{availabilityCount !== 1 ? "s" : ""}
            </p>
          </div>
          <div className="flex gap-2">
            {config?.actionButtons?.map((btn) => (
              <button
                key={btn.label}
                onClick={() => openModal(btn.name)}
                className={`flex items-center gap-1.5 px-4 py-2 text-sm rounded-lg transition-all ${btn.className}`}
              >
                <span>{btn.icon}</span>
                {btn.label}
              </button>
            ))}
          </div>
        </header>

        {/* Tabs */}
        <div className="bg-white border-b border-gray-100 px-6 flex gap-0 shrink-0">
          {config?.tabConfig?.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${activeTab === key
                ? "border-indigo-600 text-indigo-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Tab panels */}
        <div className="flex-1 overflow-y-auto">
          {/* ── Timeline */}
          {activeTab === "timeline" && (
            <div className="px-6 py-4">
              {HOURS.map((h) => {
                const label = h <= 12 ? `${h} AM` : `${h - 12} PM`;
                const blocks = slotsByHour[h] || [];
                return (
                  <div key={h} className="flex gap-3 min-h-[52px]">
                    <div className="w-12 text-right shrink-0 pt-1">
                      <span className="text-[11px] text-gray-400 font-medium">{label}</span>
                    </div>
                    <div className="flex-1 border-t border-gray-100 pt-1 pb-1 flex flex-wrap gap-2">
                      {blocks.map((e) => (
                        <TimelineBlock key={e.id} event={e} />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* ── Meetings list */}
          {activeTab === "meetings" && (
            <div className="px-6 py-4 space-y-3">
              {data.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                  <span className="text-4xl mb-3"><FaRegEnvelopeOpen /></span>
                  <p className="text-sm">No meetings scheduled</p>
                  <button onClick={() => openModal("meeting")} className="mt-3 text-xs text-indigo-600 hover:underline">
                    + Add a meeting
                  </button>
                </div>
              ) : (
                data.map((e) => (
                  <div key={e.id}

                    // onClick={() => setDetail(e)} 
                    className="bg-white border border-gray-100 rounded-xl p-4 cursor-pointer hover:shadow-sm hover:border-indigo-200 transition-all">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="text-sm font-semibold text-gray-900">{e.title}</h3>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {fmtTime(e.fromTime)} – {fmtTime(e.endTime)}
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Badge status={e.meetingType} />
                        <Badge status={e.status} />
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* ── Availability list */}
          {activeTab === "availability" && (
            <div className="px-6 py-4 space-y-2">
              {avail.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                  <span className="text-4xl mb-3"><FaCalendarAlt /></span>
                  <p className="text-sm">No availability set for this day</p>
                  <button onClick={() => openModal("availability")} className="mt-3 text-xs text-indigo-600 hover:underline">
                    + Set availability
                  </button>
                </div>
              ) : (
                avail.map((e) => (
                  <div key={e.id}
                    // onClick={() => setDetail(e)}
                    className="bg-white border border-gray-100 rounded-xl p-4 cursor-pointer hover:shadow-sm transition-all">
                    <div className="flex items-center justify-between">
                      <div>
                        <Badge status={e.availabilityType} />
                        <p className="text-xs text-gray-500 mt-1.5">
                          {e.isFullDay ? "Full Day" : `${fmtTime(e.fromTime)} – ${fmtTime(e.endTime)}`}
                        </p>
                        {e.reason && (
                          <p className="text-xs text-gray-400 mt-0.5">{e.reason}</p>
                        )}
                      </div>
                      <div className="text-right text-[10px] text-gray-300 font-mono tracking-widest">
                        {e.daysOfWeek}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* ── Modal */}
        {openModel && (
          <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={closeModal}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-[1000px] max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-gray-100">
                <div>
                  <h2 className="text-[15px] font-semibold text-gray-900">
                    {modalMode === "meeting" ? "Schedule Meeting" : "Set Availability"}
                  </h2>
                </div>
                <button onClick={closeModal} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
                  ✕
                </button>
              </div>
              <EntityFormPage
                mode="Create"
                // config={{
                //   ...meetingFormConfig,
                //   theme: {
                //     formContainer: "flex flex-col h-full min-h-0",
                //     footer: "flex-shrink-0 p-4 border-t border-gray-200 bg-gray-50 flex justify-end items-center gap-3",
                //   },
                //   fields: MeetinglFieldConfig(),
                // }}
                config={dynamicConfig}
                module={modalMode === "meeting" ? "Meeting" : "Availability"}
                onSuccessCallback={() => {
                  setOpenModel(false);
                  // queryClient.invalidateQueries({ queryKey: ["MeetingData"] });
                }}
                context={{ data }}
              />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}