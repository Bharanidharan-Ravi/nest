import { useNavigate, useParams } from "react-router-dom";
import { useThreadMaster } from "../hooks/useTicketThread";
import { ListProvider } from "../../../packages/ui-List/components/ListProvider";
import { ListCardView } from "../../../packages/ui-List/components/ListCardView";
import { ThreadListConfig } from "../config/ThreadUI.Config";
import { ThreadFieldConfig } from "../config/Thread.config";
import EntityFormPage from "../../../packages/crud/pages/EntityFormPage";
import { ThreadFormConfig } from "../config/ThreadForm.config";
import { useTicketMaster } from "../hooks/useTicketMaster";
import React from "react";
import FloatingArrowScroll from "../../../app/shared/Component/FloatingArrowScroll";
import ThreadListCard from "../component/ThreadListCard/ThreadListCard";
import {
  formatDate,
  HtmlRenderer,
} from "../../../app/shared/utilities/utilities";
import { FaCalendarAlt, FaEdit } from "react-icons/fa";
import { useState } from "react";
import { useRef } from "react";
import { useEffect } from "react";
import { useMasterData } from "../../../core/master/useMasterData";
import { readUserFromSession } from "../../../core/auth/useCurrentUser";
import AssigneesWidget from "../component/AssigneesWidget";
import { useSmartNavigation } from "../../../core/navigation/useSmartNavigation";
import { ROUTE_KEYS } from "../../../core/routing/paths";

const TicketDetailPage = () => {
  const { ticketId } = useParams();
  const navigate = useNavigate();
  const { data } = useMasterData();
  const user = readUserFromSession();
  const { data: ThreadsList } = useThreadMaster(ticketId);
  const { data: ticketMasterData } = useTicketMaster();
  const { goTo } = useSmartNavigation();

  const [isStuck, setIsStuck] = useState(false);
  const sentinelRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        // threshold: 0 means this fires the exact millisecond the sentinel
        // completely leaves the visible area (isIntersecting becomes false)
        setIsStuck(!entry.isIntersecting);
      },
      {
        root: null,
        threshold: 0,
        rootMargin: "-12px 0px 0px 0px", // Must match the top-[-12px] of the sticky header
      },
    );

    if (sentinelRef.current) {
      observer.observe(sentinelRef.current);
    }

    return () => observer.disconnect();
  }, []);

  // --- 1. Thread Data Processing ---
  const threads = ThreadsList?.ThreadsList?.Data || [];
  const rawList = threads.map((thread) => ({
    Id: thread.ThreadId,
    Issue_Id: thread.Issue_Id,
    description: thread.HtmlDesc,
    Hours: thread.Hours,
    fromTime: thread.From_Time,
    toTime: thread.To_Time,
    createdAt: thread.CreatedAt,
    CreatedBy: thread.CreatedBy,
    UpdatedAt: thread.UpdatedAt,
    UpdatedBy: thread.UpdatedBy,
    All_Assignees: thread.All_Assignees,
  }));

  const listConfig = {
    ...ThreadListConfig,
    // enableEdit: true,
    cardRenderer: (item) => (
      <ThreadListCard
        item={item}
        currentUser={user?.name}
        onEdit={() => {
          console.log("Editing thread:", item.Id);
          // Add your edit navigation or modal logic here!
        }}
      />
    ),
  };
  // --- Calculate Time Totals ---
  // --- Calculate Time Totals ---
  const timeStats = React.useMemo(() => {
    let totalMinutes = 0;
    let myMinutes = 0;

    rawList.forEach((thread) => {
      // 1. Ensure thread.Hours exists and is actually a string
      if (thread.Hours && typeof thread.Hours === "string") {
        // 2. Trim whitespace and split
        const cleanHours = thread.Hours.trim();
        const parts = cleanHours.split(":");

        // 3. FORCE base-10 parsing using the ", 10" parameter!
        const h = parseInt(parts[0], 10) || 0;
        const m = parseInt(parts[1], 10) || 0;

        // 4. Convert completely to minutes
        const mins = h * 60 + m;

        totalMinutes += mins;

        // 5. Track your own hours
        if (thread.UpdatedBy === user?.userId) {
          myMinutes += mins;
        }
      }
    });

    // Helper to format total minutes perfectly back to "HH:mm"
    const formatTime = (totalMins) => {
      const hrs = Math.floor(totalMins / 60);
      const mins = totalMins % 60;
      return `${String(hrs).padStart(2, "0")}:${String(mins).padStart(2, "0")}`;
    };

    return {
      total: formatTime(totalMinutes),
      mine: formatTime(myMinutes),
    };
  }, [rawList, user]);
  // --- 2. Parent Ticket Processing ---
  const parentTicket = React.useMemo(() => {
    if (!ticketMasterData) return null;

    // 1. Find the parent ticket first
    const ticket = ticketMasterData.find(
      (issue) => issue.Issue_Id === ticketId,
    );

    // If no ticket is found, exit early
    if (!ticket) return null;

    // 2. Find the matching project details using the ticket's Project_Id
    const projectDetails = data?.ProjectList?.find(
      (project) => project.Id === ticket.Project_Id,
    );

    // 3. Merge the ticket data with the project details and return it
    return {
      ...ticket, // Spread all existing ticket properties
      Project_Name: projectDetails?.Project_Name || "Unknown Project",
      projKey: projectDetails?.ProjectKey || "Unknown Repo",
      Repo_Name: projectDetails?.Repo_Name || "Unknown Repo",
    };

    // 4. Don't forget to add 'data' to the dependency array!
  }, [ticketMasterData, ticketId, data]);

  if (!parentTicket) return null;

  const labels = parentTicket.Labels_JSON
    ? JSON.parse(parentTicket.Labels_JSON)
    : [];
  const formattedDueDate = formatDate(parentTicket.Due_Date);
  const assigneesJsonString = parentTicket?.All_Assignees || null;

  return (
    // Clean w-full container with white background
    <div className="flex flex-col relative w-full pb-10 wg-scrollbar bg-white">
      {/* Sentinel is now absolutely positioned at the top so it never messes with the layout */}
      <div
        ref={sentinelRef}
        className="absolute top-0 h-[1px] w-full invisible"
      />

      {/* ========================================================
          FULL WIDTH STICKY HEADER
          Using top-0 ensures it never scrolls out of view.
          Applying px-4 sm:px-6 directly keeps contents aligned perfectly.
          ======================================================== */}
      <div
        className={`sticky top-0 z-50 w-full transition-all duration-300 ${isStuck
          ? "py-4 px-4 sm:px-6 bg-gray-100/90 backdrop-blur-xl border-b border-gray-200/60 shadow-sm"
          : "py-4 px-4 sm:px-6 bg-white border-transparent"
          }`}
      >
        <div className="flex justify-between items-start w-full">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-3">
              <h3 className="text-2xl text-gray-900 font-bold tracking-tight">
                {parentTicket.Title}
                <span className="text-gray-400 font-light ml-2">
                  #{parentTicket.Issue_Code}
                </span>
              </h3>

              {parentTicket?.labels?.length > 0 && (
                <div className="flex gap-1.5 mt-1">
                  {parentTicket.labels.map((label) => (
                    <span
                      key={label.LABEL_ID}
                      className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full shadow-sm text-white"
                      style={{ backgroundColor: label.LABEL_COLOR }}
                    >
                      {label.LABEL_TITLE}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="text-sm text-gray-500 flex items-center gap-2">
              <span className="font-medium">{parentTicket.Repo_Name}</span>
              <span className="opacity-40">•</span>
              <span>{parentTicket.Project_Name}</span>
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            {/* Top Row: Date & Edit Button */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 bg-white border border-gray-200 shadow-sm px-3 py-1.5 rounded-lg text-xs text-gray-600">
                <FaCalendarAlt className="text-blue-500" size={13} />
                <span className="font-medium">
                  Due: {formatDate(parentTicket.Due_Date)}
                </span>
              </div>
              <button
                onClick={() => goTo(ROUTE_KEYS.TICKET_EDIT, { ticketId: parentTicket.Issue_Id })}
                className=" text-gray-500 hover:text-blue-600  hover:bg-gray-50  rounded-lg transition-all"
                title="Edit Ticket"
              >
                <FaEdit size={20} />
              </button>
            </div>

            {/* Bottom Row: Compact Time Tracking Stats */}
            <div className="flex items-center gap-3 text-xs font-medium bg-gray-50/80 border border-gray-200/60 shadow-sm rounded-lg px-3 py-1">
              {/* Estimated */}
              <div className="flex flex-col items-center">
                <span className="text-[9px] text-gray-400 uppercase tracking-wider font-bold leading-none mb-0.5">
                  Estimated
                </span>
                <span className="text-gray-700 leading-none">
                  {parentTicket.Hours || "00:00"}
                </span>
              </div>

              <div className="w-px h-5 bg-gray-300"></div>

              {/* Total Logged */}
              <div className="flex flex-col items-center">
                <span className="text-[9px] text-gray-400 uppercase tracking-wider font-bold leading-none mb-0.5">
                  Total Logged
                </span>
                <span className="text-blue-600 leading-none">
                  {timeStats.total}
                </span>
              </div>

              <div className="w-px h-5 bg-gray-300"></div>

              {/* My Contribution */}
              <div className="flex flex-col items-center">
                <span className="text-[9px] text-gray-400 uppercase tracking-wider font-bold leading-none mb-0.5">
                  My Hours
                </span>
                <span className="text-brand-yellow drop-shadow-sm leading-none">
                  {timeStats.mine}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================
          SCROLLING CONTENT
          We apply the same px-4 sm:px-6 here so it lines up with the header!
          ======================================================== */}
     
      <div className="flex flex-col gap-8 mt-2 px-4 sm:px-6 relative">
  {/* Parent Description */}
  <div className="bg-gray-50 border border-gray-100 shadow-[0_4px_20px_rgb(0,0,0,0.03)] rounded-3xl p-6 text-sm text-gray-800 leading-relaxed">
    <HtmlRenderer
      html={parentTicket.HtmlDesc || parentTicket.Description}
    />
  </div>

  {/* --- MAIN SPLIT LAYOUT --- */}
  {/* Removed items-start so both columns stretch to the maximum height */}
  <div className="flex flex-col lg:flex-row gap-8 mt-6 w-full relative">
    
    {/* ========================================= */}
    {/* LEFT COLUMN (Threads + Editor)            */}
    {/* ========================================= */}
    <div className="w-full lg:w-3/4 flex flex-col gap-6">
      
      {/* 1. Conversation Threads */}
      <div className="w-full">
        <ListProvider config={listConfig} data={rawList}>
          <ListCardView />
        </ListProvider>
      </div>

      {/* 2. Reply Form (MOVED INSIDE THE LEFT COLUMN) */}
      <div className="rounded-3xl p-2">
        <EntityFormPage
          mode="Create"
          config={{
            ...ThreadFormConfig,
            fields: ThreadFieldConfig(ticketId),
          }}
          module="Thread"
        />
      </div>

    </div>

    {/* ========================================= */}
    {/* RIGHT COLUMN (Sticky Sidebar)             */}
    {/* ========================================= */}
    <div className="w-full lg:w-1/4">
      {/* Changed h-[75vh] to max-h-[calc(100vh-8rem)]
        This prevents it from getting cut off on small screens while remaining sticky.
      */}
      <div className="sticky top-28 max-h-[calc(100vh-8rem)] flex flex-col gap-6">
        <AssigneesWidget assigneesJson={assigneesJsonString} />
        {/* Render Labels Widget Here later */}
      </div>
    </div>

  </div>
</div>
      <div id="bottomSection"></div>
      <FloatingArrowScroll targetId="bottomSection" />
    </div>
  );
};

export default TicketDetailPage;
//  <div className="flex flex-col gap-8 mt-2 px-4 sm:px-6 relative">
//         {/* Parent Description */}
//         <div className="bg-gray-50 border border-gray-100 shadow-[0_4px_20px_rgb(0,0,0,0.03)] rounded-3xl p-6 text-sm text-gray-800 leading-relaxed">
//           <HtmlRenderer
//             html={parentTicket.HtmlDesc || parentTicket.Description}
//           />
//         </div>
//         <div className="flex flex-col lg:flex-row gap-8 mt-6 w-full">
//           {/* Conversation Threads */}
//           <div className="w-full lg:w-3/4">
//             <ListProvider config={listConfig} data={rawList}>
//               <ListCardView />
//             </ListProvider>
//           </div>
//           <div className="w-full lg:w-1/4 ">

//             {/* 🔥 THIS IS THE MAGIC WRAPPER 🔥 */}
//             {/* sticky: Makes it stick as you scroll */}
//             {/* top-24: Leaves a little gap under your top header (adjust as needed) */}
//             {/* h-[75vh]: Forces it to be exactly 75% of the screen height */}
//             <div className="sticky top-24 h-[75vh] flex flex-col gap-6">
//               <AssigneesWidget assigneesJson={assigneesJsonString} />
//               {/* Render Labels Widget Here later */}
//             </div>
//           </div>
//         </div>

//         {/* Reply Form */}
//         {/* <div className="mt-4"> */}
//         <div className=" rounded-3xl p-2 w-full lg:w-3/4">
//           <EntityFormPage
//             mode="Create"
//             config={{
//               ...ThreadFormConfig,
//               fields: ThreadFieldConfig(ticketId),
//             }}
//             module="Thread"
//           />
//         </div>
//         {/* </div> */}
//       </div>



//   return (
//     <div className="flex flex-col relative w-full pb-10">
//       {/* INVISIBLE SENTINEL FOR STICKY HEADER */}
//       <div ref={sentinelRef} className="h-[1px] w-full invisible" />

//       {/* CLEAN STICKY HEADER */}
//       <div
//         className={`sticky top-[-12px] z-40 transition-all duration-200 bg-white border-b border-gray-200 shadow-sm ${
//           isStuck ? "pt-3 pb-4 -mx-3 px-3" : "pb-4"
//         }`}
//       >
//         <div className="flex justify-between px-3 items-start w-full">
//           <div className="flex flex-col gap-1">
//             {/* Title Row */}
//             <div className="flex items-center gap-3">
//               <h3 className="text-2xl text-gray-800 font-semibold leading-tight tracking-tight">
//                 {parentTicket.Title}{" "}
//                 <span className="text-gray-400 font-light text-2xl">
//                   #{parentTicket.Issue_Code}
//                 </span>
//               </h3>

//               {/* Labels beside title */}
//               {labels.length > 0 && (
//                 <div className="flex gap-1.5 flex-wrap">
//                   {labels.map((label) => (
//                     <span
//                       key={label.LABEL_ID}
//                       className="text-xs font-medium px-2.5 py-0.5 rounded-full border border-transparent"
//                       style={{
//                         backgroundColor: label.LABEL_COLOR,
//                         color: "#fff",
//                       }}
//                     >
//                       {label.LABEL_TITLE}
//                     </span>
//                   ))}
//                 </div>
//               )}
//             </div>

//             {/* Subtitle Row (Project / Repo info) */}
//             <div className="text-sm text-gray-500 flex items-center gap-2">
//               <span className="font-medium">{parentTicket.Repo_Name}</span>
//               <span>•</span>
//               <span>{parentTicket.Project_Name}</span>
//             </div>
//           </div>

//           {/* Right side actions */}
//           <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
//             <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 px-3 py-1.5 rounded-md">
//               <FaCalendarAlt className="text-gray-400" />
//               <span className="font-medium">Due: {formattedDueDate}</span>
//             </div>
//             <button
//               onClick={() => navigate(`/tickets/edit/${ticketId}`)}
//               className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 border border-transparent hover:border-blue-200 rounded-md transition-all"
//             >
//               <FaEdit size={16} />
//             </button>
//           </div>
//         </div>
//       </div>

//       {/* THE TIMELINE CONTAINER */}
//       {/* ml-5 pushes the whole conversation right. We draw the vertical line absolutely inside it. */}
//       <div className="relative mt-2">
//         {/* 🚀 THE MAGIC VERTICAL LINE */}
//         <div className="absolute top-0 bottom-0 left-[20px] w-0.5 bg-gray-200 -z-10"></div>

//         {/* Parent Ticket Description (Styled like the first comment) */}
//         <div className="pt-2 flex flex-col gap-6">
//           {/* Parent Ticket Description (Clean block, no OP avatar) */}
//           <div className="bg-white  px-5 py-3 border-b border-gray-200 shadow-sm text-sm text-gray-800 leading-relaxed min-h-[100px]">
//             <HtmlRenderer
//               html={parentTicket.HtmlDesc || parentTicket.Description}
//             />
//           </div>

//           {/* THE TIMELINE CONTAINER (Only surrounds the threads now) */}
//           <div className="relative ml-4 mt-2">
//             {/* The vertical timeline line */}
//             <div className="absolute top-0 bottom-0 left-[20px] w-0.5 bg-gray-200 -z-10"></div>

//             {/* Threads List */}
//             <ListProvider config={listConfigWithEdit} data={rawList}>
//               <ListCardView />
//             </ListProvider>
//           </div>

//           {/* Thread Form */}
//           <div id="bottomSection" className="mt-4">
//             <EntityFormPage
//               mode="Create"
//               config={{
//                 ...ThreadFormConfig,
//                 fields: ThreadFieldConfig(ticketId),
//               }}
//               module="Thread"
//             />
//           </div>
//         </div>
//       </div>

//       <FloatingArrowScroll targetId="bottomSection" />
//     </div>
//   );
// };



// return (
//   // We use relative positioning here, NO overflow-hidden, allowing the <main> tag to handle the scrolling
//   <div className="flex flex-col relative w-full pb-10">
//     {/* ========================================================
//         GITHUB-STYLE STICKY HEADER
//         Using top-[-12px] counteracts the p-3 padding from your
//         MainLayout so it docks perfectly flush with the top edge.
//         ======================================================== */}
//     {/* <div className="sticky top-[-12px] z-40 bg-brand-gray-light pt-3 pb-4 -mx-3 px-3 border-b border-gray-300 shadow-sm"> */}
//     {/* <div ref={sentinelRef} className="absolute w-full h-[1px] top-[-13px] pointer-events-none opacity-0" /> */}
//     {/* 1. INVISIBLE TRIGGER ELEMENT */}
//     <div ref={sentinelRef} className="h-[1px] w-full invisible" />

//     {/* 2. DYNAMIC STICKY HEADER */}
//     <div
//       className={`sticky top-[-12px] z-40 transition-all duration-200 bg-white border-b border-gray-200 shadow-sm ${
//         isStuck ? "pt-3 pb-4 -mx-3 px-3" : "pb-4"
//       }`}
//     >
//       <div className="flex justify-between items-center w-full">
//         <div className="flex flex-col md:flex-row gap-3 md:gap-6 items-start md:items-center">
//           {/* Title */}
//           <h3 className="text-2xl text-gray-800 font-bold leading-tight">
//             {parentTicket.Title}{" "}
//             <span className="text-gray-400 font-light text-xl">
//               #{parentTicket.Issue_Code}
//             </span>
//           </h3>

//           {/* Labels */}
//           {labels.length > 0 && (
//             <div className="flex gap-2 flex-wrap">
//               {labels.map((label) => (
//                 <span
//                   key={label.LABEL_ID}
//                   className="text-xs font-medium text-white px-3 py-1 rounded-full"
//                   style={{ backgroundColor: label.LABEL_COLOR }}
//                 >
//                   {label.LABEL_TITLE}
//                 </span>
//               ))}
//             </div>
//           )}
//         </div>

//         <div className="flex items-center gap-4 text-sm text-gray-600 font-medium">
//           <div className="flex items-center gap-2">
//             <FaCalendarAlt className="text-ghBlue" />
//             <span>Due Date: {formattedDueDate}</span>
//           </div>

//           {/* Parent Edit Button */}
//           <button
//             onClick={() => navigate(`/tickets/edit/${ticketId}`)}
//             className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 border border-transparent hover:border-blue-200 rounded-md transition-all"
//             title="Edit Ticket"
//           >
//             <FaEdit size={18} />
//           </button>
//         </div>
//       </div>
//       <div>
//         <Tooltip title={parentTicket.Repo_Name} arrow>
//           <span>{parentTicket.RepoKey}</span>.
//           <span>{getInitials(parentTicket.Repo_Name)}</span>
//         </Tooltip>
//         {" - "}
//         <Tooltip title={parentTicket.Project_Name} arrow>
//           <span>{parentTicket.Project_Name}</span>
//         </Tooltip>
//       </div>
//     </div>
//     {/* ========================================================
//         SCROLLING BODY (Description + Threads)
//         This starts below the header and scrolls normally.
//         ======================================================== */}
//     <div className="pt-2 flex flex-col gap-6">
//       {/* Parent Ticket Description */}
//       <div className="bg-white p-5 border-b border-gray-200 shadow-sm text-sm text-gray-700">
//         <HtmlRenderer
//           html={parentTicket.HtmlDesc || parentTicket.Description}
//         />
//       </div>

//       {/* Threads List */}
//       <div>
//         <ListProvider config={listConfigWithEdit} data={rawList}>
//           <ListCardView />
//         </ListProvider>
//       </div>

//       {/* Thread Form */}
//       <div id="bottomSection">
//         <EntityFormPage
//           mode="Create"
//           config={{
//             ...ThreadFormConfig,
//             fields: ThreadFieldConfig(ticketId),
//           }}
//           module="Thread"
//         />
//       </div>
//     </div>

//     <FloatingArrowScroll targetId="bottomSection" />
//   </div>
// );
