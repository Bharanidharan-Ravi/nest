import { useNavigate, useParams } from "react-router-dom";
import { useThreadMaster } from "../hooks/useTicketThread";
import { ListProvider } from "../../../packages/ui-List/components/ListProvider";
import { ListCardView } from "../../../packages/ui-List/components/ListCardView";
import {
  ThreadListConfig
} from "../config/ThreadUI.Config";
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

const TicketDetailPage = () => {
  const { ticketId } = useParams();
  const navigate = useNavigate();
  const { data } = useMasterData();
  const user = readUserFromSession();
  const { data: ThreadsList } = useThreadMaster(ticketId);
  const { data: ticketMasterData } = useTicketMaster();

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
  }));
console.log("user :",user);

  const listConfigWithEdit = {
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
  console.log("parentTicket :", parentTicket, ticketMasterData);

  const labels = parentTicket.Labels_JSON
    ? JSON.parse(parentTicket.Labels_JSON)
    : [];
  const formattedDueDate = formatDate(parentTicket.Due_Date);
 
  return (
    <div className="flex flex-col relative w-full pb-10">
      {/* INVISIBLE SENTINEL FOR STICKY HEADER */}
      <div ref={sentinelRef} className="h-[1px] w-full invisible" />

      {/* CLEAN STICKY HEADER */}
      <div
        className={`sticky top-[-12px] z-40 transition-all duration-200 bg-white border-b border-gray-200 shadow-sm ${
          isStuck ? "pt-3 pb-4 -mx-3 px-3" : "pb-4"
        }`}
      >
        <div className="flex justify-between px-3 items-start w-full">
          <div className="flex flex-col gap-1">
            {/* Title Row */}
            <div className="flex items-center gap-3">
              <h3 className="text-2xl text-gray-800 font-semibold leading-tight tracking-tight">
                {parentTicket.Title}{" "}
                <span className="text-gray-400 font-light text-2xl">
                  #{parentTicket.Issue_Code}
                </span>
              </h3>

              {/* Labels beside title */}
              {labels.length > 0 && (
                <div className="flex gap-1.5 flex-wrap">
                  {labels.map((label) => (
                    <span
                      key={label.LABEL_ID}
                      className="text-xs font-medium px-2.5 py-0.5 rounded-full border border-transparent"
                      style={{
                        backgroundColor: label.LABEL_COLOR,
                        color: "#fff",
                      }}
                    >
                      {label.LABEL_TITLE}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Subtitle Row (Project / Repo info) */}
            <div className="text-sm text-gray-500 flex items-center gap-2">
              <span className="font-medium">{parentTicket.Repo_Name}</span>
              <span>•</span>
              <span>{parentTicket.Project_Name}</span>
            </div>
          </div>

          {/* Right side actions */}
          <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
            <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 px-3 py-1.5 rounded-md">
              <FaCalendarAlt className="text-gray-400" />
              <span className="font-medium">Due: {formattedDueDate}</span>
            </div>
            <button
              onClick={() => navigate(`/tickets/edit/${ticketId}`)}
              className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 border border-transparent hover:border-blue-200 rounded-md transition-all"
            >
              <FaEdit size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* THE TIMELINE CONTAINER */}
      {/* ml-5 pushes the whole conversation right. We draw the vertical line absolutely inside it. */}
      <div className="relative mt-2">
        {/* 🚀 THE MAGIC VERTICAL LINE */}
        <div className="absolute top-0 bottom-0 left-[20px] w-0.5 bg-gray-200 -z-10"></div>

        {/* Parent Ticket Description (Styled like the first comment) */}
        <div className="pt-2 flex flex-col gap-6">
          {/* Parent Ticket Description (Clean block, no OP avatar) */}
          <div className="bg-white  px-5 py-3 border-b border-gray-200 shadow-sm text-sm text-gray-800 leading-relaxed min-h-[100px]">
            <HtmlRenderer
              html={parentTicket.HtmlDesc || parentTicket.Description}
            />
          </div>

          {/* THE TIMELINE CONTAINER (Only surrounds the threads now) */}
          <div className="relative ml-4 mt-2">
            {/* The vertical timeline line */}
            <div className="absolute top-0 bottom-0 left-[20px] w-0.5 bg-gray-200 -z-10"></div>

            {/* Threads List */}
            <ListProvider config={listConfigWithEdit} data={rawList}>
              <ListCardView />
            </ListProvider>
          </div>

          {/* Thread Form */}
          <div id="bottomSection" className="mt-4">
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
      </div>

      <FloatingArrowScroll targetId="bottomSection" />
    </div>
  );
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
};

export default TicketDetailPage;
// const TicketDetailPage = () => {
//   const { ticketId } = useParams();
//   const { data: ThreadsList } = useThreadMaster(ticketId);
//   const { data: ticketMasterData } = useTicketMaster();

//   const threads = ThreadsList?.ThreadsList?.Data || [];
//   const normalizeThread = (thread) => ({
//     Id: thread.ThreadId,
//     Issue_Id: thread.Issue_Id,
//     description: thread.HtmlDesc,
//     Hours: thread.Hours,
//     fromTime: thread.From_Time,
//     toTime: thread.To_Time,
//     createdAt: thread.CreatedAt,
//     CreatedBy: thread.CreatedBy,
//     UpdatedAt: thread.UpdatedAt,
//     UpdatedBy: thread.UpdatedBy,
//   });

//   const rawList = threads.map(normalizeThread);

//   // Prepare UI data for the parent (issue)
//   const IssueParentData = React.useMemo(() => {
//     if (!ticketMasterData) return [];
//     const parent = ticketMasterData.find(
//       (issue) => issue.Issue_Id === ticketId,
//     );

//     return parent
//       ? [
//           {
//             id: parent.Issue_Id,
//             title: parent.Title,
//             description: parent.HtmlDesc || parent.Description,
//             label: parent.Labels_JSON,
//             project: parent.Project_Id,
//             assginedTo: parent.Assignee_Name,
//             estimateHours: parent.hours,
//             status: parent.Status,
//             DueDate: parent.Due_Date,
//             UpdatedAt: parent.UpdatedAt,
//             UpdatedBy: parent.UpdatedBy,
//           },
//         ]
//       : [];
//   }, [ticketMasterData]);
//  // 1. Tag the data with a _type so we can differentiate them
//   const combinedData = useMemo(() => {
//     const parentData = IssueParentData.map(p => ({ ...p, _type: 'parent' }));
//     const threadData = rawList.map(t => ({ ...t, _type: 'thread' }));

//     // Parent is always first, followed by all threads
//     return [...parentData, ...threadData];
//   }, [IssueParentData, rawList]);

//   // 2. Create a Unified Config
//   const unifiedListConfig = {
//     ...ThreadListConfig,
//     enableEdit: true, // Enables the edit icon for all items

//     // Conditionally trigger the right edit function
//     onEditClick: (item) => {
//       if (item._type === 'parent') {
//         navigate(`/tickets/edit/${item.id}`); // Or use your goTo navigation here
//       } else {
//         // Handle thread edit here
//         console.log("Editing thread:", item.Id);
//       }
//     },

//     // Conditionally render the correct component
//     cardRenderer: (item) => {
//       if (item._type === 'parent') {
//         return <ThreadParent item={item} />; // Renders the big parent card
//       }
//       return <ThreadListCard item={item} />; // Renders the smaller thread cards
//     }
//   };
//   return (
//     <>
//       <div className="mb-8 overflow-visible">
//         {/* We now only need ONE ListProvider and ONE ListCardView! */}
//         <ListProvider config={unifiedListConfig} data={combinedData}>
//           <ListCardView />
//         </ListProvider>
//       </div>

//       <div className="mt-2" id="bottomSection">
//         <EntityFormPage mode="Create" config={{...ThreadFormConfig, fields: ThreadFieldConfig(ticketId)}} module="Thread" />
//       </div>
//       <FloatingArrowScroll targetId="bottomSection" />
//     </>
//     // <>
//     //   {/* Display Parent Data List */}

//     //   <div className="mb-4 overflow-visible">
//     //     <ListProvider config={ThreadParentConfig} data={IssueParentData}>
//     //       {/* Pass overflow-visible to override the default "overflow-hidden" in ListLayout */}
//     //       <ListLayout className="h-auto overflow-visible border-none shadow-none" />
//     //     </ListProvider>
//     //   </div>
//     //   {/* <div className="overflow-auto"> */}
//     //     {/* Display Threads List */}
//     //     <div className="mb-8">
//     //       <ListProvider config={listConfigWithEdit} data={rawList}>
//     //         {/* <ListLayout /> */}
//     //         <ListCardView />
//     //       </ListProvider>
//     //     </div>

//     //     {/* Thread Form */}
//     //     <div className="mt-2" id="bottomSection">
//     //       <EntityFormPage
//     //         mode="Create"
//     //         config={{
//     //           ...ThreadFormConfig,
//     //           fields: ThreadFieldConfig(ticketId),
//     //         }}
//     //         module="Thread"
//     //       />
//     //     </div>
//     //   {/* </div> */}
//     //   <FloatingArrowScroll targetId="bottomSection" />
//     // </>
//   );
// };

// export default TicketDetailPage;
