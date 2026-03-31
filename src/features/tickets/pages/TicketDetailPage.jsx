import { useParams } from "react-router-dom";
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
import { queryKeys } from "../../../core/query/queryKeys";

const TicketDetailPage = () => {
  const { ticketId } = useParams();
  const { data } = useMasterData();
  const user = readUserFromSession();
  const { goTo } = useSmartNavigation();
  const [editingItem, setEditingItem] = useState(null);
  const { data: ThreadsList } = useThreadMaster(ticketId, editingItem?.Id);
  const { data: ticketMasterData } = useTicketMaster();
  const [isStuck, setIsStuck] = useState(false);
  const sentinelRef = useRef(null);
  const [selectedWorkStream, setSelectedWorkStream] = useState(null);
  const [selectedHandoffId, setSelectedHandoffId] = useState(null);
  // 🔥 1. Add state to track middle-expansion
  const [expandCount, setExpandCount] = useState(0);

  // 🔥 2. Reset the expansion if they click a different person in the sidebar
  useEffect(() => {
    setExpandCount(0);
    setSelectedHandoffId(null);
  }, [selectedWorkStream, ticketId]);

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

  // 1. Parse the array safely
  const assigneesJsonString = JSON.parse(parentTicket?.All_Assignees || "[]");
  // const handoffsJsonString = JSON.parse(parentTicket?.HandOffs || "[]");

  // 2. Find ALL assignments for the logged-in user
  // 2. Find ALL assignments for the logged-in user
  const myAssignments = assigneesJsonString.filter(
    (assignee) =>
      assignee.Assignee_Id?.toLowerCase() === user?.userId?.toLowerCase(),
  );

  // 3. Find their ACTIVE stream (Ignore Closed, Cancelled, Inactive, AND 100% completed tasks)
  const activeStream = myAssignments.find(
    (a) =>
      ![14, 15, 16].includes(a.StreamStatus) && Number(a.CompletionPct) < 100,
  );

  const myCurrentStream =
    activeStream ||
    (myAssignments.length > 0 ? myAssignments[myAssignments.length - 1] : null);

  const evaluatedStream = selectedWorkStream || myCurrentStream;

  // 4. Dynamically determine their state/role for the UI
  const isOwner = parentTicket?.Assignee_Id === user?.userId;
  let userRole = "Standard";

  // 🔥 FIX 3: Check if the evaluated stream is completely finished (100% or Closed)
  const isWorkCompleted = evaluatedStream
    ? Number(evaluatedStream.CompletionPct) === 100 ||
      [14, 15, 16].includes(evaluatedStream.StreamStatus)
    : false;

  // 🔥 FIX 2: Highest Priority - If they are the Owner and haven't clicked a sidebar card, ALWAYS be Owner!
  if (isOwner && !selectedWorkStream) {
    userRole = "Owner";
  }
  // If work is NOT done, give them Dev/Tester buttons
  // else if (evaluatedStream && !isWorkCompleted) {
  //   const currentStatusId = evaluatedStream.StreamStatus;

  //   if (currentStatusId === 5 || currentStatusId === 6) {
  //     userRole = "Dev";
  //   } else if (currentStatusId >= 7 && currentStatusId <= 11) {
  //     userRole = "Tester";
  //   }
  // }
  // 🔥 FIX 3: If their work IS 100% done, revert to Standard to hide action buttons!
  else if (evaluatedStream && isWorkCompleted) {
    userRole = "Standard";
  }
  // Fallbacks
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
  };
  // if (isOwner) {
  //   userRole = "Owner";
  // } else if (myCurrentStream) {
  //   const currentStatusId = myCurrentStream.StreamStatus;
  //   // If their latest stream is 14 (Closed), their work is done
  //   if (currentStatusId === 14) {
  //     isMyWorkCompleted = true;
  //   }

  //   // Infer their role based on the status they were assigned to
  //   // Adjust these IDs based on your actual Status_Master table
  //   if (currentStatusId === 5) {
  //     // 5 = In Development, 6 = Dev Completed
  //     userRole = "Dev";
  //   } else if (currentStatusId >= 7 && currentStatusId <= 11) {
  //     // 8 = Functional Testing, 10 = Testing Failed, 11 = Functional Fix
  //     userRole = "Tester";
  //   } else {
  //     // Fallback if status is Null or 1 (New/Just Assigned)
  //     if (user?.department === "Development") userRole = "Dev";
  //     if (user?.department === "Testing" || user?.department === "QA")
  //       userRole = "Tester";
  //   }
  // }

  console.log(
    "parentTicket :",
    parentTicket,
    assigneesJsonString,
    myCurrentStream,
    isOwner,
    myAssignments,
    userRole,
  );

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
    CreatedId: thread.CreatedId,
    UpdatedAt: thread.UpdatedAt,
    UpdatedBy: thread.UpdatedBy,
    All_Assignees: thread.All_Assignees,
    HandsOffId: thread.HandsOffId,
  }));

  const mainAssignee = React.useMemo(() => {
    return assigneesJsonString.find(
      (a) =>
        a.Assignee_Type === "Main Assignee" ||
        a.Assignment_Type === "Main Assignee",
    );
  }, [assigneesJsonString]);

  // 🔥 2. FILTER THREADS BY SELECTED SIDEBAR CARD
 // 🔥 2. FILTER THREADS BY SELECTED SIDEBAR CARD OR HANDOFF
  // 🔥 2. FILTER THREADS BY SELECTED SIDEBAR CARD OR HANDOFF
  const displayedThreads = React.useMemo(() => {
    // 1. If nothing is selected, show all threads normally
    if (!selectedWorkStream && !selectedHandoffId) return rawList;

    const parentThreadId = selectedWorkStream?.ParentThreadId;

    // ================================================================
    // SCENARIO A: A SPECIFIC HANDOFF IS CLICKED
    // ================================================================
    if (selectedHandoffId) {
      return rawList.filter((thread) => {
        // Keep the exact Parent Thread (So they can see who assigned it)
        if (parentThreadId && thread.Id === parentThreadId) return true;
        
        // Keep ONLY the threads strictly tied to this exact Handoff
        if (thread.HandsOffId === selectedHandoffId) return true;

        return false;
      });
    }

    // ================================================================
    // SCENARIO B: A WORKSTREAM IS CLICKED (But no specific handoff)
    // ================================================================
    if (selectedWorkStream) {
      const startId = selectedWorkStream.ParentThreadId;
      const endId = selectedWorkStream.ThreadId;
      const targetAssigneeId = selectedWorkStream.Assignee_Id?.toLowerCase();
      const ticketOwnerId = parentTicket?.CreatedBy?.toLowerCase();

      // 1. Get Outgoing Handoffs (e.g. Developer pushing to Tester)
      const outgoingHandoffIds = selectedWorkStream.HandOffData?.map(h => h.HandsOffId) || [];

      // 2. Get Incoming Handoffs (e.g. Tester receiving from Developer)
      const incomingHandoffIds = [];
      assigneesJsonString.forEach(ws => {
        if (ws.HandOffData) {
          ws.HandOffData.forEach(h => {
            if (h.TargetStreamId === selectedWorkStream.StreamId) {
              incomingHandoffIds.push(h.HandsOffId);
            }
          });
        }
      });

      // Combine them so this person sees ALL handoffs involving them
      const allRelevantHandoffIds = [...outgoingHandoffIds, ...incomingHandoffIds];

      return rawList.filter((thread) => {
        // 1. Explicit Handoff Relationship (Always keep these!)
        if (thread.HandsOffId && allRelevantHandoffIds.includes(thread.HandsOffId)) return true;

        // 2. Explicit Assignment Thread (Always keep the exact thread that assigned them)
        if (startId && thread.Id === startId) return true;

        // 3. General Comments made DURING this specific WorkStream
        const isByAssignee = thread.CreatedId?.toLowerCase() === targetAssigneeId;
        const isByOwner = thread.CreatedId?.toLowerCase() === ticketOwnerId;

        if (isByAssignee || isByOwner) {
          // If the work is completed, only show comments between Start and End
          if (startId && endId) {
            if (thread.Id >= startId && thread.Id <= endId) return true;
          } 
          // If the work is currently active (No End ID yet), show comments after the Start ID
          else if (startId && !endId) {
            if (thread.Id >= startId) return true;
          }
          // Fallback if there's no Start ID
          else if (!startId && endId) {
            if (thread.Id === endId) return true;
          }
        }

        return false;
      });
    }

    return rawList;
  }, [rawList, selectedWorkStream, selectedHandoffId, parentTicket, assigneesJsonString]);
  // ... (your existing displayedThreads useMemo) ...

  // 🔥 3. THE GITHUB MIDDLE-COLLAPSE LOGIC
  const finalThreads = React.useMemo(() => {
    if (!displayedThreads) return [];

    const TOTAL = displayedThreads.length;
    const INITIAL_TOP = 10;
    const INITIAL_BOTTOM = 10;
    const LOAD_CHUNK = 30; // How many to load per click

    // If total is 30 or less, just show all of them normally
    if (TOTAL <= INITIAL_TOP + INITIAL_BOTTOM) {
      return displayedThreads;
    }

    const currentTopCount = INITIAL_TOP + expandCount;
    const remainingHidden = TOTAL - currentTopCount - INITIAL_BOTTOM;

    // If we have expanded enough to see everything, show all
    if (remainingHidden <= 0) {
      return displayedThreads;
    }

    // Slice the top and bottom arrays
    const topPart = displayedThreads.slice(0, currentTopCount);
    const bottomPart = displayedThreads.slice(TOTAL - INITIAL_BOTTOM);

    // Inject a "Dummy Marker" directly into the array!
    return [
      ...topPart,
      {
        isCollapsedMarker: true,
        hiddenCount: remainingHidden,
        Id: "collapsed-marker", // Fake ID so ListProvider doesn't crash
      },
      ...bottomPart,
    ];
  }, [displayedThreads, expandCount]);

  const listConfig = {
    ...ThreadListConfig,
    pageSize: 9999, // 🔥 Override UI default pagination to allow our custom logic
    infinite: false,
    cardRenderer: (item) => {
      // 🔥 RENDER THE GITHUB LOAD MORE BUTTON
      if (item.isCollapsedMarker) {
        return (
          <div
            key="collapsed-marker"
            className="flex items-center justify-center my-6 relative w-full group"
          >
            {/* The horizontal rule line behind the button */}
            <div className="absolute w-full h-px bg-gray-200"></div>

            <button
              onClick={() => setExpandCount((prev) => prev + 30)}
              className="relative z-10 bg-gray-50 hover:bg-white text-gray-500 hover:text-blue-600 text-xs font-bold px-5 py-2 border border-gray-200 hover:border-blue-300 shadow-sm rounded-full transition-all duration-200"
            >
              Load {Math.min(item.hiddenCount, 30)} more comments (
              {item.hiddenCount} hidden)
            </button>
          </div>
        );
      }

      // Existing Edit Logic
      if (editingItem && editingItem.Id === item.Id) {
        return (
          <EntityFormPage
            mode="Edit"
            config={{
              ...ThreadFormConfig,
              invalidateKeys: queryKeys.ticket.thread(ticketId),
              api: `thread/${editingItem?.Id}`,
            }}
            context={{ isEdit: true, editingItem }}
            module="Thread"
            onCancel={() => setEditingItem(null)}
          />
        );
      }

      // Standard Card Rendering
      return (
        <ThreadListCard
          item={item}
          currentUser={user?.name}
          onEdit={() => setEditingItem(item)}
        />
      );
    },
    // cardRenderer: (item) => {
    //   if (editingItem && editingItem.Id === item.Id) {
    //     return (
    //       <EntityFormPage
    //         mode="Edit"
    //         config={{
    //           ...ThreadFormConfig,
    //           invalidateKeys: queryKeys.ticket.thread(ticketId),
    //           api: `thread/${editingItem?.Id}`,
    //         }}
    //         context={{ isEdit: true, editingItem }}
    //         module="Thread"
    //         onCancel={() => setEditingItem(null)}
    //       />
    //     );
    //   }
    //   return (
    //     <ThreadListCard
    //       item={item}
    //       currentUser={user?.name}
    //       onEdit={() => setEditingItem(item)}
    //     />
    //   );
    // },
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

  if (!parentTicket) return null;
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
        className={`sticky top-0 z-30 w-full transition-all duration-300 ${
          isStuck
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
              {mainAssignee && (
                <>
                  <span className="opacity-40">•</span>
                  <div className="flex items-center gap-1.5 bg-blue-50 text-blue-700 px-2 py-0.5 rounded-md border border-blue-100 shadow-sm">
                    <span className="text-[10px] font-bold uppercase tracking-wider opacity-80">
                      Owner:
                    </span>
                    <span className="text-xs font-bold">
                      {mainAssignee.Assignee_Name}
                    </span>
                  </div>
                </>
              )}
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
                onClick={() =>
                  goTo(ROUTE_KEYS.TICKET_EDIT, {
                    ticketId: parentTicket.Issue_Id,
                  })
                }
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
              <ListProvider
                config={listConfig}
                // data={rawList}
                data={finalThreads}
              >
                <ListCardView />
              </ListProvider>
            </div>

            {/* 2. Reply Form (MOVED INSIDE THE LEFT COLUMN) */}
            {!editingItem &&
              (parentTicket.Status !== "Inactive" ||
                parentTicket.Status !== "Cancelled" ||
                parentTicket.Status !== "Closed") && (
                <div className="rounded-3xl p-2">
                  <EntityFormPage
                    mode="Create"
                    config={{
                      ...ThreadFormConfig,
                      fields: ThreadFieldConfig(ticketId),
                    }}
                    // context={{ userRole, isOwner, currentUser: user }}
                    context={formContext}
                    module="Thread"
                  />
                </div>
              )}
          </div>

          {/* ========================================= */}
          {/* RIGHT COLUMN (Sticky Sidebar)             */}
          {/* ========================================= */}
          <div className="w-full lg:w-1/4">
            {/* Changed h-[75vh] to max-h-[calc(100vh-8rem)]
        This prevents it from getting cut off on small screens while remaining sticky.
      */}
            <div className="sticky top-28 h-[calc(100vh-8rem)] flex flex-col gap-6">
              <AssigneesWidget
                workStreams={assigneesJsonString}
                data={parentTicket}
                ticketId={ticketId}
                formContext={formContext}
                selectedWorkStream={selectedWorkStream} // 👈 Pass the state down
                onSelectWorkStream={setSelectedWorkStream}
                selectedHandoffId={selectedHandoffId} // 🔥 NEW PROP
                onSelectHandoff={setSelectedHandoffId}
              />
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
