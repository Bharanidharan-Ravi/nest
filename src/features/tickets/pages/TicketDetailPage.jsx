import React, { useState, useRef, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useThreadMaster } from "../hooks/useTicketThread";
import { useTicketMaster } from "../hooks/useTicketMaster";
import { useMasterData } from "../../../core/master/useMasterData";
import { readUserFromSession } from "../../../core/auth/useCurrentUser";
import { useSmartNavigation } from "../../../core/navigation/useSmartNavigation";
import FloatingArrowScroll from "../../../app/shared/Component/FloatingArrowScroll";
import AssigneesWidget from "../component/AssigneesWidget";

// Import your new split components
import ParentTicketHeader from "../component/ThreadParent/ParentTicketHeader";
import TicketThreads from "../component/ThreadListCard/TicketThreads";
const TicketDetailPage = () => {
  const { ticketId } = useParams();
  const { data } = useMasterData();
  const user = readUserFromSession();
  const { goTo } = useSmartNavigation();

  const [editingItem, setEditingItem] = useState(null);
  const [isStuck, setIsStuck] = useState(false);
  const sentinelRef = useRef(null);

  const [selectedWorkStream, setSelectedWorkStream] = useState(null);
  const [selectedHandoffId, setSelectedHandoffId] = useState(null);

  // 🔥 FETCH DATA
  const { data: ThreadsList } = useThreadMaster(ticketId, editingItem?.Id);
  const { data: ticketMasterData } = useTicketMaster();
console.log("ThreadsList :", ThreadsList, ticketMasterData);

  // Handle header stickiness
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => setIsStuck(!entry.isIntersecting),
      { root: null, threshold: 0, rootMargin: "-12px 0px 0px 0px" },
    );
    if (sentinelRef.current) observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, []);

  // 1. Process Parent Ticket
  const parentTicket = React.useMemo(() => {
    if (!ticketMasterData) return null;
    const ticket = ticketMasterData.find(
      (issue) => issue.Issue_Id === ticketId,
    );
    if (!ticket) return null;
    const projectDetails = data?.ProjectList?.find(
      (p) => p.Id === ticket.Project_Id,
    );
    return {
      ...ticket,
      id: ticket.Issue_Id, // Ensure we have a consistent 'id' field for the ticket
      Project_Name: projectDetails?.Project_Name || "Unknown Project",
      projKey: projectDetails?.ProjectKey || "Unknown Repo",
      Repo_Name: projectDetails?.Repo_Name || "Unknown Repo",
    };
  }, [ticketMasterData, ticketId, data]);

  // 2. Process Assignees and Roles
  const assigneesJsonString = JSON.parse(parentTicket?.All_Assignees || "[]");
  const myAssignments = assigneesJsonString.filter(
    (a) => a.Assignee_Id?.toLowerCase() === user?.userId?.toLowerCase(),
  );

  const activeStream = myAssignments.find(
    (a) =>
      ![14, 15, 16].includes(a.StreamStatus) && Number(a.CompletionPct) < 100,
  );
  const myValidStreams = myAssignments.filter((a) => a.StreamId !== null);
  const lastValidStream =
    myValidStreams.length > 0
      ? myValidStreams[myValidStreams.length - 1]
      : null;
  const myCurrentStream =
    activeStream ||
    (myAssignments.length > 0 ? myAssignments[myAssignments.length - 1] : null);
  const evaluatedStream = selectedWorkStream || myCurrentStream;

  const isOwner = parentTicket?.Assignee_Id === user?.userId;
  let userRole = "Standard";
  const isWorkCompleted = evaluatedStream
    ? Number(evaluatedStream.CompletionPct) === 100 ||
      [14, 15, 16].includes(evaluatedStream.StreamStatus)
    : false;

  if (isOwner && !selectedWorkStream) userRole = "Owner";
  else if (evaluatedStream && isWorkCompleted) userRole = "Standard";
  else {
    if (user?.department === "Development") userRole = "Dev";
    if (user?.department === "Testing" || user?.department === "QA")
      userRole = "Tester";
  }

  const formContext = {
    userRole,
    isOwner,
    currentUser: user,
    activeWorkStream: evaluatedStream,
    selectedHandoffId: selectedHandoffId,
    lastValidStreamId: lastValidStream?.StreamId || null,
  };

  const mainAssignee = assigneesJsonString.find(
    (a) =>
      a.Assignee_Type === "Main Assignee" ||
      a.Assignment_Type === "Main Assignee",
  );

  // 3. Time Stats
  // const timeStats = React.useMemo(() => {
  //   let totalMinutes = 0, myMinutes = 0;
  //   (ThreadsList?.ThreadsList || []).forEach((thread) => {
  //     if (thread.Hours && typeof thread.Hours === "string") {
  //       const parts = thread.Hours.trim().split(":");
  //       const mins = (parseInt(parts[0], 10) || 0) * 60 + (parseInt(parts[1], 10) || 0);
  //       totalMinutes += mins;
  //       if (thread.UpdatedBy === user?.userId) myMinutes += mins;
  //     }
  //   });

  //   const formatTime = (totalMins) => {
  //     return `${String(Math.floor(totalMins / 60)).padStart(2, "0")}:${String(totalMins % 60).padStart(2, "0")}`;
  //   };

  //   return { total: formatTime(totalMinutes), mine: formatTime(myMinutes) };
  // }, [ThreadsList?.ThreadsList, user]);
  const timeStats = React.useMemo(() => {
    let totalMinutes = 0,
      myMinutes = 0;

    const threads = Array.isArray(ThreadsList?.ThreadsList) ? ThreadsList?.ThreadsList : [];

    threads.forEach((thread) => {
      if (thread?.Hours && typeof thread.Hours === "string") {
        const parts = thread.Hours.trim().split(":");

        const mins =
          (parseInt(parts[0], 10) || 0) * 60 + (parseInt(parts[1], 10) || 0);

        totalMinutes += mins;

        if (thread.UpdatedBy === user?.userId) {
          myMinutes += mins;
        }
      }
    });

    const formatTime = (totalMins) => {
      return `${String(Math.floor(totalMins / 60)).padStart(2, "0")}:${String(
        totalMins % 60,
      ).padStart(2, "0")}`;
    };

    return {
      total: formatTime(totalMinutes),
      mine: formatTime(myMinutes),
    };
  }, [ThreadsList, user]);
  if (!parentTicket) return null;

  return (
    <div className="flex flex-col relative w-full pb-10 wg-scrollbar bg-white">
      {/* Top Header extracted to its own Component */}
      <ParentTicketHeader
        parentTicket={parentTicket}
        timeStats={timeStats}
        mainAssignee={mainAssignee}
        isStuck={isStuck}
        sentinelRef={sentinelRef}
        goTo={goTo}
      />

      <div className="flex flex-col gap-8 mt-6 px-4 sm:px-6 relative">
        <div className="flex flex-col lg:flex-row gap-8 w-full relative">
          {/* ========================================= */}
          {/* LEFT COLUMN: Timeline & History           */}
          {/* ========================================= */}
          <div className="w-full lg:w-3/4 flex flex-col gap-6">
            <TicketThreads
              ticketId={ticketId}
              threadsData={ThreadsList?.ThreadsList || []}
              historyData={
                ThreadsList?.TicketHistory || ThreadsList?.ticketHistory || []
              }
              assigneesJsonString={assigneesJsonString}
              selectedWorkStream={selectedWorkStream}
              selectedHandoffId={selectedHandoffId}
              parentTicket={parentTicket}
              formContext={formContext}
              editingItem={editingItem}
              setEditingItem={setEditingItem}
              currentUser={user}
            />
          </div>

          {/* ========================================= */}
          {/* RIGHT COLUMN: Sticky Sidebar              */}
          {/* ========================================= */}
          <div className="w-full lg:w-1/4">
            <div className="sticky top-28 h-[calc(100vh-8rem)] flex flex-col gap-6">
              <AssigneesWidget
                workStreams={assigneesJsonString}
                data={parentTicket}
                ticketId={ticketId}
                formContext={formContext}
                selectedWorkStream={selectedWorkStream}
                onSelectWorkStream={setSelectedWorkStream}
                selectedHandoffId={selectedHandoffId}
                onSelectHandoff={setSelectedHandoffId}
              />
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

// import { useParams } from "react-router-dom";
// import { useThreadMaster, useTicketHistory } from "../hooks/useTicketThread";
// import { ListProvider } from "../../../packages/ui-List/components/ListProvider";
// import { ListCardView } from "../../../packages/ui-List/components/ListCardView";
// import { ThreadListConfig } from "../config/ThreadUI.Config";
// import { ThreadFieldConfig } from "../config/Thread.config";
// import EntityFormPage from "../../../packages/crud/pages/EntityFormPage";
// import { ThreadFormConfig } from "../config/ThreadForm.config";
// import { useTicketMaster } from "../hooks/useTicketMaster";
// import React from "react";
// import FloatingArrowScroll from "../../../app/shared/Component/FloatingArrowScroll";
// import ThreadListCard from "../component/ThreadListCard/ThreadListCard";
// import {
//   formatDate,
//   HtmlRenderer,
// } from "../../../app/shared/utilities/utilities";
// import { FaCalendarAlt, FaEdit } from "react-icons/fa";
// import { useState } from "react";
// import { useRef } from "react";
// import { useEffect } from "react";
// import { useMasterData } from "../../../core/master/useMasterData";
// import { readUserFromSession } from "../../../core/auth/useCurrentUser";
// import AssigneesWidget from "../component/AssigneesWidget";
// import { useSmartNavigation } from "../../../core/navigation/useSmartNavigation";
// import { ROUTE_KEYS } from "../../../core/routing/paths";
// import { queryKeys } from "../../../core/query/queryKeys";

// const TicketDetailPage = () => {
//   const { ticketId } = useParams();
//   const { data } = useMasterData();
//   const user = readUserFromSession();
//   const { goTo } = useSmartNavigation();
//   const [editingItem, setEditingItem] = useState(null);
//   const { data: ThreadsList } = useThreadMaster(ticketId, editingItem?.Id);
//   const { data: ticketMasterData } = useTicketMaster();
//   const [isStuck, setIsStuck] = useState(false);
//   const sentinelRef = useRef(null);
//   const [selectedWorkStream, setSelectedWorkStream] = useState(null);
//   const [selectedHandoffId, setSelectedHandoffId] = useState(null);
//   // 🔥 1. Add state to track middle-expansion
//   const [expandCount, setExpandCount] = useState(0);
// console.log("TicketHistory :", ThreadsList);

//   // 🔥 2. Reset the expansion if they click a different person in the sidebar
//   useEffect(() => {
//     setExpandCount(0);
//     setSelectedHandoffId(null);
//   }, [selectedWorkStream, ticketId]);

//   useEffect(() => {
//     const observer = new IntersectionObserver(
//       ([entry]) => {
//         // threshold: 0 means this fires the exact millisecond the sentinel
//         // completely leaves the visible area (isIntersecting becomes false)
//         setIsStuck(!entry.isIntersecting);
//       },
//       {
//         root: null,
//         threshold: 0,
//         rootMargin: "-12px 0px 0px 0px", // Must match the top-[-12px] of the sticky header
//       },
//     );

//     if (sentinelRef.current) {
//       observer.observe(sentinelRef.current);
//     }

//     return () => observer.disconnect();
//   }, []);

//   const parentTicket = React.useMemo(() => {
//     if (!ticketMasterData) return null;

//     // 1. Find the parent ticket first
//     const ticket = ticketMasterData.find(
//       (issue) => issue.Issue_Id === ticketId,
//     );

//     // If no ticket is found, exit early
//     if (!ticket) return null;

//     // 2. Find the matching project details using the ticket's Project_Id
//     const projectDetails = data?.ProjectList?.find(
//       (project) => project.Id === ticket.Project_Id,
//     );

//     // 3. Merge the ticket data with the project details and return it
//     return {
//       ...ticket, // Spread all existing ticket properties
//       Project_Name: projectDetails?.Project_Name || "Unknown Project",
//       projKey: projectDetails?.ProjectKey || "Unknown Repo",
//       Repo_Name: projectDetails?.Repo_Name || "Unknown Repo",
//     };

//     // 4. Don't forget to add 'data' to the dependency array!
//   }, [ticketMasterData, ticketId, data]);

//   // 1. Parse the array safely
//   const assigneesJsonString = JSON.parse(parentTicket?.All_Assignees || "[]");

// console.log("assigneesJsonString :", assigneesJsonString, ThreadsList);

//   // 2. Find ALL assignments for the logged-in user
//   const myAssignments = assigneesJsonString.filter(
//     (assignee) =>
//       assignee.Assignee_Id?.toLowerCase() === user?.userId?.toLowerCase(),
//   );

//   // 3. Find their ACTIVE stream (Ignore Closed, Cancelled, Inactive, AND 100% completed tasks)
//   const activeStream = myAssignments.find(
//     (a) =>
//       ![14, 15, 16].includes(a.StreamStatus) && Number(a.CompletionPct) < 100,
//   );
//   // 🔥 NEW: Filter out the "Main Assignee" to find ACTUAL workstreams with StreamIds
//   const myValidStreams = myAssignments.filter((a) => a.StreamId !== null);
//   const lastValidStream =
//     myValidStreams.length > 0
//       ? myValidStreams[myValidStreams.length - 1]
//       : null;

//   const myCurrentStream =
//     activeStream ||
//     (myAssignments.length > 0 ? myAssignments[myAssignments.length - 1] : null);

//   const evaluatedStream = selectedWorkStream || myCurrentStream;

//   // 4. Dynamically determine their state/role for the UI
//   const isOwner = parentTicket?.Assignee_Id === user?.userId;
//   let userRole = "Standard";

//   // 🔥 FIX 3: Check if the evaluated stream is completely finished (100% or Closed)
//   const isWorkCompleted = evaluatedStream
//     ? Number(evaluatedStream.CompletionPct) === 100 ||
//       [14, 15, 16].includes(evaluatedStream.StreamStatus)
//     : false;

//   // 🔥 FIX 2: Highest Priority - If they are the Owner and haven't clicked a sidebar card, ALWAYS be Owner!
//   if (isOwner && !selectedWorkStream) {
//     userRole = "Owner";
//   }
//   // If work is NOT done, give them Dev/Tester buttons
//   // else if (evaluatedStream && !isWorkCompleted) {
//   //   const currentStatusId = evaluatedStream.StreamStatus;

//   //   if (currentStatusId === 5 || currentStatusId === 6) {
//   //     userRole = "Dev";
//   //   } else if (currentStatusId >= 7 && currentStatusId <= 11) {
//   //     userRole = "Tester";
//   //   }
//   // }
//   // 🔥 FIX 3: If their work IS 100% done, revert to Standard to hide action buttons!
//   else if (evaluatedStream && isWorkCompleted) {
//     userRole = "Standard";
//   }
//   // Fallbacks
//   else {
//     if (user?.department === "Development") userRole = "Dev";
//     if (user?.department === "Testing" || user?.department === "QA")
//       userRole = "Tester";
//   }

//   const formContext = {
//     userRole,
//     isOwner,
//     currentUser: user,
//     activeWorkStream: evaluatedStream,
//     selectedHandoffId: selectedHandoffId,
//     lastValidStreamId: lastValidStream?.StreamId || null,
//   };

//   // console.log(
//   //   "parentTicket :",
//   //   parentTicket,
//   //   assigneesJsonString,
//   //   myCurrentStream,
//   //   isOwner,
//   //   myAssignments,
//   //   userRole,
//   // );

//   // --- 1. Thread Data Processing ---
//   const threads = ThreadsList?.ThreadsList || [];
//   // const rawList = threads.map((thread) => ({
//   //   Id: thread.ThreadId,
//   //   Issue_Id: thread.Issue_Id,
//   //   description: thread.HtmlDesc,
//   //   Hours: thread.Hours,
//   //   fromTime: thread.From_Time,
//   //   toTime: thread.To_Time,
//   //   createdAt: thread.CreatedAt,
//   //   CreatedBy: thread.CreatedBy,
//   //   CreatedId: thread.CreatedId,
//   //   UpdatedAt: thread.UpdatedAt,
//   //   UpdatedBy: thread.UpdatedBy,
//   //   All_Assignees: thread.All_Assignees,
//   //   HandsOffId: thread.HandsOffId,
//   // }));

//   const rawList = threads.map((thread) => {
//     let parsedAssignees = [];
//     try {
//       if (thread.All_Assignees) {
//         parsedAssignees = JSON.parse(thread.All_Assignees);
//       }
//     } catch (error) {
//       console.error("failed to parse a all_assignees", thread.ThreadId);
//     }

//     const assignedUser = parsedAssignees.map((assignee) => ({
//       id: assignee.Assignee_Id || assignee.Id,
//       name: assignee.Assignee_Name,
//       type: assignee.Assignee_Type,
//     }));
//     console.log("parsedAssignees :", parsedAssignees, thread);

//     return {
//       Id: thread.ThreadId,
//       Issue_Id: thread.Issue_Id,
//       description: thread.HtmlDesc,
//       Hours: thread.Hours,
//       fromTime: thread.From_Time,
//       toTime: thread.To_Time,
//       createdAt: thread.CreatedAt,
//       CreatedBy: thread.CreatedBy,
//       CreatedId: thread.CreatedId,
//       UpdatedAt: thread.UpdatedAt,
//       UpdatedBy: thread.UpdatedBy,
//       All_Assignees: thread.All_Assignees,
//       HandsOffId: thread.HandsOffId,
//     };
//   });
//   const mainAssignee = React.useMemo(() => {
//     return assigneesJsonString.find(
//       (a) =>
//         a.Assignee_Type === "Main Assignee" ||
//         a.Assignment_Type === "Main Assignee",
//     );
//   }, [assigneesJsonString]);

//   // 🔥 2. FILTER THREADS BY SELECTED SIDEBAR CARD OR HANDOFF
//   const displayedThreads = React.useMemo(() => {
//     // 1. If nothing is selected, show all threads normally
//     if (!selectedWorkStream && !selectedHandoffId) return rawList;
//     // ================================================================
//     // SCENARIO A: A SPECIFIC HANDOFF IS CLICKED (e.g., "Push #54")
//     // ================================================================
//     if (selectedHandoffId) {
//       // First, find the specific handoff object across all workstreams
//       // so we can extract its InitiatingThreadId
//       let activeHandoff = null;
//       for (const ws of assigneesJsonString) {
//         if (ws.HandOffData) {
//           const found = ws.HandOffData.find(
//             (h) => h.HandsOffId === selectedHandoffId,
//           );
//           if (found) {
//             activeHandoff = found;
//             break;
//           }
//         }
//       }

//       return rawList.filter((thread) => {
//         // Show ONLY the parent thread that triggered this specific handoff
//         if (activeHandoff && thread.Id === activeHandoff.InitiatingThreadId)
//           return true;

//         // Also include any specific threads tied directly to this handoff ID
//         if (thread.HandsOffId === selectedHandoffId) return true;

//         return false;
//       });
//     }

//     // ================================================================
//     // SCENARIO B: A WORKSTREAM IS CLICKED (Overall Assignee Block)
//     // ================================================================
//     if (selectedWorkStream) {
//       const parentThreadId = selectedWorkStream.ParentThreadId;
//       const targetAssigneeId = selectedWorkStream.Assignee_Id?.toLowerCase();

//       // 1. Get Outgoing Handoffs (e.g. Developer pushing to Tester)
//       const outgoingHandoffIds =
//         selectedWorkStream.HandOffData?.map((h) => h.HandsOffId) || [];

//       // 2. Get Incoming Handoffs (e.g. Tester receiving from Developer)
//       const incomingHandoffIds = [];
//       assigneesJsonString.forEach((ws) => {
//         if (ws.HandOffData) {
//           ws.HandOffData.forEach((h) => {
//             if (h.TargetStreamId === selectedWorkStream.StreamId) {
//               incomingHandoffIds.push(h.HandsOffId);
//             }
//           });
//         }
//       });

//       // Combine them so this person sees ALL handoffs involving them
//       const allRelevantHandoffIds = [
//         ...outgoingHandoffIds,
//         ...incomingHandoffIds,
//       ];

//       return rawList.filter((thread) => {
//         // 1. The Parent Thread (Where this Workstream started/was assigned)
//         if (parentThreadId && thread.Id === parentThreadId) return true;

//         // 2. All threads where this specific user entered a value
//         // We check both CreatedId and CreatedBy just to be safe
//         const isByAssignee =
//           thread.CreatedId?.toLowerCase() === targetAssigneeId ||
//           thread.CreatedBy?.toLowerCase() === targetAssigneeId;
//         if (isByAssignee) return true;

//         // 3. Child threads (Handoff threads incoming/outgoing for this user)
//         if (
//           thread.HandsOffId &&
//           allRelevantHandoffIds.includes(thread.HandsOffId)
//         )
//           return true;

//         return false;
//       });
//     }

//     return rawList;
//   }, [rawList, selectedWorkStream, selectedHandoffId, assigneesJsonString]);
//   // ... (your existing displayedThreads useMemo) ...

//   // 🔥 3. THE GITHUB MIDDLE-COLLAPSE LOGIC
//   const finalThreads = React.useMemo(() => {
//     if (!displayedThreads) return [];

//     const TOTAL = displayedThreads.length;
//     const INITIAL_TOP = 10;
//     const INITIAL_BOTTOM = 10;
//     const LOAD_CHUNK = 30; // How many to load per click

//     // If total is 30 or less, just show all of them normally
//     if (TOTAL <= INITIAL_TOP + INITIAL_BOTTOM) {
//       return displayedThreads;
//     }

//     const currentTopCount = INITIAL_TOP + expandCount;
//     const remainingHidden = TOTAL - currentTopCount - INITIAL_BOTTOM;

//     // If we have expanded enough to see everything, show all
//     if (remainingHidden <= 0) {
//       return displayedThreads;
//     }

//     // Slice the top and bottom arrays
//     const topPart = displayedThreads.slice(0, currentTopCount);
//     const bottomPart = displayedThreads.slice(TOTAL - INITIAL_BOTTOM);

//     // Inject a "Dummy Marker" directly into the array!
//     return [
//       ...topPart,
//       {
//         isCollapsedMarker: true,
//         hiddenCount: remainingHidden,
//         Id: "collapsed-marker", // Fake ID so ListProvider doesn't crash
//       },
//       ...bottomPart,
//     ];
//   }, [displayedThreads, expandCount]);

//   const listConfig = {
//     ...ThreadListConfig,
//     pageSize: 9999, // 🔥 Override UI default pagination to allow our custom logic
//     infinite: false,
//     cardRenderer: (item) => {
//       // 🔥 RENDER THE GITHUB LOAD MORE BUTTON
//       if (item.isCollapsedMarker) {
//         return (
//           <div
//             key="collapsed-marker"
//             className="flex items-center justify-center my-6 relative w-full group"
//           >
//             {/* The horizontal rule line behind the button */}
//             <div className="absolute w-full h-px bg-gray-200"></div>

//             <button
//               onClick={() => setExpandCount((prev) => prev + 30)}
//               className="relative z-10 bg-gray-50 hover:bg-white text-gray-500 hover:text-blue-600 text-xs font-bold px-5 py-2 border border-gray-200 hover:border-blue-300 shadow-sm rounded-full transition-all duration-200"
//             >
//               Load {Math.min(item.hiddenCount, 30)} more comments (
//               {item.hiddenCount} hidden)
//             </button>
//           </div>
//         );
//       }

//       // Existing Edit Logic
//       if (editingItem && editingItem.Id === item.Id) {
//         return (
//           <EntityFormPage
//             mode="Edit"
//             config={{
//               ...ThreadFormConfig,
//               invalidateKeys: queryKeys.ticket.thread(ticketId),
//               api: `thread/${editingItem?.Id}`,
//             }}
//             context={{ isEdit: true, editingItem }}
//             module="Thread"
//             onCancel={() => setEditingItem(null)}
//             onSuccessCallback={() => setEditingItem(null)}
//           />
//         );
//       }

//       // Standard Card Rendering
//       return (
//         <ThreadListCard
//           item={item}
//           currentUser={user?.name}
//           onEdit={() => setEditingItem(item)}
//         />
//       );
//     },
//     // cardRenderer: (item) => {
//     //   if (editingItem && editingItem.Id === item.Id) {
//     //     return (
//     //       <EntityFormPage
//     //         mode="Edit"
//     //         config={{
//     //           ...ThreadFormConfig,
//     //           invalidateKeys: queryKeys.ticket.thread(ticketId),
//     //           api: `thread/${editingItem?.Id}`,
//     //         }}
//     //         context={{ isEdit: true, editingItem }}
//     //         module="Thread"
//     //         onCancel={() => setEditingItem(null)}
//     //       />
//     //     );
//     //   }
//     //   return (
//     //     <ThreadListCard
//     //       item={item}
//     //       currentUser={user?.name}
//     //       onEdit={() => setEditingItem(item)}
//     //     />
//     //   );
//     // },
//   };
//   // --- Calculate Time Totals ---
//   // --- Calculate Time Totals ---
//   const timeStats = React.useMemo(() => {
//     let totalMinutes = 0;
//     let myMinutes = 0;

//     rawList.forEach((thread) => {
//       // 1. Ensure thread.Hours exists and is actually a string
//       if (thread.Hours && typeof thread.Hours === "string") {
//         // 2. Trim whitespace and split
//         const cleanHours = thread.Hours.trim();
//         const parts = cleanHours.split(":");

//         // 3. FORCE base-10 parsing using the ", 10" parameter!
//         const h = parseInt(parts[0], 10) || 0;
//         const m = parseInt(parts[1], 10) || 0;

//         // 4. Convert completely to minutes
//         const mins = h * 60 + m;

//         totalMinutes += mins;

//         // 5. Track your own hours
//         if (thread.UpdatedBy === user?.userId) {
//           myMinutes += mins;
//         }
//       }
//     });

//     // Helper to format total minutes perfectly back to "HH:mm"
//     const formatTime = (totalMins) => {
//       const hrs = Math.floor(totalMins / 60);
//       const mins = totalMins % 60;
//       return `${String(hrs).padStart(2, "0")}:${String(mins).padStart(2, "0")}`;
//     };

//     return {
//       total: formatTime(totalMinutes),
//       mine: formatTime(myMinutes),
//     };
//   }, [rawList, user]);

//   if (!parentTicket) return null;
//   return (
//     // Clean w-full container with white background
//     <div className="flex flex-col relative w-full pb-10 wg-scrollbar bg-white">
//       {/* Sentinel is now absolutely positioned at the top so it never messes with the layout */}
//       <div
//         ref={sentinelRef}
//         className="absolute top-0 h-[1px] w-full invisible"
//       />

//       {/* ========================================================
//           FULL WIDTH STICKY HEADER
//           Using top-0 ensures it never scrolls out of view.
//           Applying px-4 sm:px-6 directly keeps contents aligned perfectly.
//           ======================================================== */}
//       <div
//         className={`sticky top-0 z-30 w-full transition-all duration-300 ${
//           isStuck
//             ? "py-4 px-4 sm:px-6 bg-gray-100/90 backdrop-blur-xl border-b border-gray-200/60 shadow-sm"
//             : "py-4 px-4 sm:px-6 bg-white border-transparent"
//         }`}
//       >
//         <div className="flex justify-between items-start w-full">
//           <div className="flex flex-col gap-1">
//             <div className="flex items-center gap-3">
//               <h3 className="text-2xl text-gray-900 font-bold tracking-tight">
//                 {parentTicket.Title}
//                 <span className="text-gray-400 font-light ml-2">
//                   #{parentTicket.Issue_Code}
//                 </span>
//               </h3>

//               {parentTicket?.labels?.length > 0 && (
//                 <div className="flex gap-1.5 mt-1">
//                   {parentTicket.labels.map((label) => (
//                     <span
//                       key={label.LABEL_ID}
//                       className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full shadow-sm text-white"
//                       style={{ backgroundColor: label.LABEL_COLOR }}
//                     >
//                       {label.LABEL_TITLE}
//                     </span>
//                   ))}
//                 </div>
//               )}
//             </div>

//             <div className="text-sm text-gray-500 flex items-center gap-2">
//               <span className="font-medium">{parentTicket.Repo_Name}</span>
//               <span className="opacity-40">•</span>
//               <span>{parentTicket.Project_Name}</span>
//               {mainAssignee && (
//                 <>
//                   <span className="opacity-40">•</span>
//                   <div className="flex items-center gap-1.5 bg-blue-50 text-blue-700 px-2 py-0.5 rounded-md border border-blue-100 shadow-sm">
//                     <span className="text-[10px] font-bold uppercase tracking-wider opacity-80">
//                       Owner:
//                     </span>
//                     <span className="text-xs font-bold">
//                       {mainAssignee.Assignee_Name}
//                     </span>
//                   </div>
//                 </>
//               )}
//             </div>
//           </div>
//           <div className="flex flex-col items-end gap-2">
//             {/* Top Row: Date & Edit Button */}
//             <div className="flex items-center gap-2">
//               <div className="flex items-center gap-1.5 bg-white border border-gray-200 shadow-sm px-3 py-1.5 rounded-lg text-xs text-gray-600">
//                 <FaCalendarAlt className="text-blue-500" size={13} />
//                 <span className="font-medium">
//                   Due: {formatDate(parentTicket.Due_Date)}
//                 </span>
//               </div>
//               <button
//                 onClick={() =>
//                   goTo(ROUTE_KEYS.TICKET_EDIT, {
//                     ticketId: parentTicket.Issue_Id,
//                   })
//                 }
//                 className=" text-gray-500 hover:text-blue-600  hover:bg-gray-50  rounded-lg transition-all"
//                 title="Edit Ticket"
//               >
//                 <FaEdit size={20} />
//               </button>
//             </div>

//             {/* Bottom Row: Compact Time Tracking Stats */}
//             <div className="flex items-center gap-3 text-xs font-medium bg-gray-50/80 border border-gray-200/60 shadow-sm rounded-lg px-3 py-1">
//               {/* Estimated */}
//               <div className="flex flex-col items-center">
//                 <span className="text-[9px] text-gray-400 uppercase tracking-wider font-bold leading-none mb-0.5">
//                   Estimated
//                 </span>
//                 <span className="text-gray-700 leading-none">
//                   {parentTicket.Hours || "00:00"}
//                 </span>
//               </div>

//               <div className="w-px h-5 bg-gray-300"></div>

//               {/* Total Logged */}
//               <div className="flex flex-col items-center">
//                 <span className="text-[9px] text-gray-400 uppercase tracking-wider font-bold leading-none mb-0.5">
//                   Total Logged
//                 </span>
//                 <span className="text-blue-600 leading-none">
//                   {timeStats.total}
//                 </span>
//               </div>

//               <div className="w-px h-5 bg-gray-300"></div>

//               {/* My Contribution */}
//               <div className="flex flex-col items-center">
//                 <span className="text-[9px] text-gray-400 uppercase tracking-wider font-bold leading-none mb-0.5">
//                   My Hours
//                 </span>
//                 <span className="text-brand-yellow drop-shadow-sm leading-none">
//                   {timeStats.mine}
//                 </span>
//               </div>
//             </div>
//           </div>
//         </div>
//       </div>

//       {/* ========================================================
//           SCROLLING CONTENT
//           We apply the same px-4 sm:px-6 here so it lines up with the header!
//           ======================================================== */}

//       <div className="flex flex-col gap-8 mt-2 px-4 sm:px-6 relative">
//         {/* Parent Description */}
//         <div className="bg-gray-50 border border-gray-100 shadow-[0_4px_20px_rgb(0,0,0,0.03)] rounded-3xl p-6 text-sm text-gray-800 leading-relaxed">
//           <HtmlRenderer
//             html={parentTicket.HtmlDesc || parentTicket.Description}
//           />
//         </div>

//         {/* --- MAIN SPLIT LAYOUT --- */}
//         {/* Removed items-start so both columns stretch to the maximum height */}
//         <div className="flex flex-col lg:flex-row gap-8 mt-6 w-full relative">
//           {/* ========================================= */}
//           {/* LEFT COLUMN (Threads + Editor)            */}
//           {/* ========================================= */}
//           <div className="w-full lg:w-3/4 flex flex-col gap-6">
//             {/* 1. Conversation Threads */}
//             <div className="w-full">
//               <ListProvider
//                 config={listConfig}
//                 // data={rawList}
//                 data={finalThreads}
//               >
//                 <ListCardView />
//               </ListProvider>
//             </div>

//             {/* 2. Reply Form (MOVED INSIDE THE LEFT COLUMN) */}
//             {!editingItem &&
//               (parentTicket.Status !== "Inactive" ||
//                 parentTicket.Status !== "Cancelled" ||
//                 parentTicket.Status !== "Closed") && (
//                 <div className="rounded-3xl p-2">
//                   <EntityFormPage
//                     mode="Create"
//                     config={{
//                       ...ThreadFormConfig,
//                       fields: ThreadFieldConfig(ticketId),
//                     }}
//                     // context={{ userRole, isOwner, currentUser: user }}
//                     context={formContext}
//                     module="Thread"
//                   />
//                 </div>
//               )}
//           </div>

//           {/* ========================================= */}
//           {/* RIGHT COLUMN (Sticky Sidebar)             */}
//           {/* ========================================= */}
//           <div className="w-full lg:w-1/4">
//             {/* Changed h-[75vh] to max-h-[calc(100vh-8rem)]
//         This prevents it from getting cut off on small screens while remaining sticky.
//       */}
//             <div className="sticky top-28 h-[calc(100vh-8rem)] flex flex-col gap-6">
//               <AssigneesWidget
//                 workStreams={assigneesJsonString}
//                 data={parentTicket}
//                 ticketId={ticketId}
//                 formContext={formContext}
//                 selectedWorkStream={selectedWorkStream} // 👈 Pass the state down
//                 onSelectWorkStream={setSelectedWorkStream}
//                 selectedHandoffId={selectedHandoffId} // 🔥 NEW PROP
//                 onSelectHandoff={setSelectedHandoffId}
//               />
//               {/* Render Labels Widget Here later */}
//             </div>
//           </div>
//         </div>
//       </div>
//       <div id="bottomSection"></div>
//       <FloatingArrowScroll targetId="bottomSection" />
//     </div>
//   );
// };

// export default TicketDetailPage;
