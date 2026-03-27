// component/AssigneesWidget.jsx
import React, { useState, useMemo } from "react";
import {
  FaCheckCircle,
  FaSpinner,
  FaPlus,
  FaTimes,
  FaListUl,
  FaProjectDiagram,
  FaChevronDown,
  FaChevronRight,
} from "react-icons/fa";
import EntityFormPage from "../../../packages/crud/pages/EntityFormPage";
import { ProgressUpdateFormConfig } from "../config/AssigneesWidget/ProgressUpdateForm.config"; // 👈 Import your new config
import { ProgressUpdateConfig } from "../config/AssigneesWidget/ProgressUpdate.config";

export default function AssigneesWidget({
  workStreams = [],
  formContext,
  threads = [],
  ticketId,
  data,
  selectedWorkStream,
  onSelectWorkStream,
  selectedHandoffId, // 🔥 Received from parent
  onSelectHandoff, // 🔥 Received from parent
}) {
  const [showUpdateForm, setShowUpdateForm] = useState(false);
  const [viewMode, setViewMode] = useState("list");
  const [expandedNodes, setExpandedNodes] = useState({});

  const myLastThread = useMemo(() => {
    if (!threads || !formContext?.currentUser) return null;
    const myThreads = threads.filter(
      (t) =>
        t.CreatedBy === formContext.currentUser.userId ||
        t.CreatedBy === formContext.currentUser.id,
    );
    return myThreads.sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
    )[0];
  }, [threads, formContext?.currentUser]);

  const filteredWorkStreams = useMemo(() => {
    if (!workStreams) return [];
    return workStreams.filter(
      (ws) =>
        ws.Assignee_Type !== "Main Assignee" &&
        ws.Assignment_Type !== "Main Assignee",
    );
  }, [workStreams]);

  const allHandoffs = useMemo(() => {
    let list = [];
    filteredWorkStreams.forEach((ws) => {
      if (ws.HandOffData && ws.HandOffData.length > 0) {
        ws.HandOffData.forEach((h) => {
          list.push({
            ...h,
            SourceName: ws.Assignee_Name,
            SourcePct: ws.CompletionPct,
          });
        });
      }
    });
    return list;
  }, [filteredWorkStreams]);

  const getAssigneeName = (streamId) => {
    const match = filteredWorkStreams.find((ws) => ws.StreamId === streamId);
    return match ? match.Assignee_Name : "Unknown";
  };

  const toggleExpand = (streamId, e) => {
    e.stopPropagation();
    setExpandedNodes((prev) => ({ ...prev, [streamId]: !prev[streamId] }));
  };

  const summary = useMemo(() => {
    if (!filteredWorkStreams || filteredWorkStreams.length === 0)
      return { total: 0, completed: 0, pending: 0, overallPct: 0 };
    const total = filteredWorkStreams.length;
    const completed = filteredWorkStreams.filter(
      (ws) => ws.CompletionPct === 100,
    );
    const pending = filteredWorkStreams.filter((ws) => ws.CompletionPct < 100);
    const overallPct = Math.round(
      filteredWorkStreams.reduce(
        (acc, ws) => acc + (ws.CompletionPct || 0),
        0,
      ) / total,
    );
    return {
      total,
      completed: completed.length,
      pending: pending.length,
      overallPct,
    };
  }, [filteredWorkStreams]);

  return (
    <div className="bg-white border border-gray-200 shadow-sm rounded-2xl flex flex-col max-h-full overflow-hidden">
      {/* SECTION 1: OVERALL PROGRESS */}
      <div className="p-4 bg-gray-50/50 border-b border-gray-100 shrink-0">
        <h4 className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2">
          Overall Progress
        </h4>
        <div className="flex items-center gap-3 mb-2">
          <div className="text-2xl font-black text-gray-800">
            {data?.CompletionPct}%
          </div>
          <div className="flex-1">
            <div className="h-1.5 w-full bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-500 transition-all duration-500"
                style={{ width: `${data?.CompletionPct}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* 🔥 SECTION 2: FIXED HEADER (Separated from the scrolling list) 🔥 */}
      <div className="px-4 py-3 bg-white border-b border-gray-100 flex items-center justify-between shrink-0">
        <h4 className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
          Workstreams ({summary.total})
        </h4>
        <div className="flex items-center gap-1 bg-gray-100 p-0.5 rounded-md border border-gray-200">
          <button
            onClick={() => setViewMode("list")}
            className={`p-1 rounded transition-colors ${viewMode === "list" ? "bg-white shadow-sm text-blue-600" : "text-gray-400 hover:text-gray-600"}`}
            title="List View"
          >
            <FaListUl size={12} />
          </button>
          <button
            onClick={() => setViewMode("tree")}
            className={`p-1 rounded transition-colors ${viewMode === "tree" ? "bg-white shadow-sm text-blue-600" : "text-gray-400 hover:text-gray-600"}`}
            title="Tree View"
          >
            <FaProjectDiagram size={12} />
          </button>
        </div>
      </div>

      {/* SECTION 3: SCROLLABLE LIST */}
      <div
        className={`px-4 py-3 flex flex-col gap-3 overflow-y-auto wg-scrollbar bg-white transition-all duration-300 ${showUpdateForm ? "shrink-0 max-h-[25vh]" : "flex-1"}`}
      >
        {filteredWorkStreams?.map((ws, index) => {
          const myTestingQueue = allHandoffs.filter(
            (h) => h.TargetStreamId === ws.StreamId,
          );
          const hasOutgoingHandoffs =
            ws.HandOffData && ws.HandOffData.length > 0;
          const isExpanded = expandedNodes[ws.StreamId];

          return (
            <div
              key={ws.StreamId || index}
              onClick={() => {
                if (selectedWorkStream?.StreamId === ws.StreamId)
                  onSelectWorkStream(null);
                else onSelectWorkStream(ws);
              }}
              className={`flex flex-col gap-1 pb-2 border-b border-gray-50 cursor-pointer p-2 rounded-md transition-all ${
                selectedWorkStream?.StreamId === ws.StreamId
                  ? "bg-blue-50 border-blue-200 ring-1 ring-blue-500"
                  : "hover:bg-gray-50"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {viewMode === "tree" && hasOutgoingHandoffs && (
                    <div
                      onClick={(e) => toggleExpand(ws.StreamId, e)}
                      className="text-gray-400 hover:text-gray-700 w-3"
                    >
                      {isExpanded ? (
                        <FaChevronDown size={10} />
                      ) : (
                        <FaChevronRight size={10} />
                      )}
                    </div>
                  )}

                  {ws.CompletionPct === 100 ? (
                    <FaCheckCircle className="text-green-500" size={13} />
                  ) : (
                    <FaSpinner
                      className="text-blue-500 animate-spin-slow"
                      size={13}
                    />
                  )}
                  <span className="text-[13px] font-semibold text-gray-800">
                    {ws.Assignee_Name || "Assignee"}
                  </span>
                </div>
                <span className="text-[11px] font-bold text-gray-600">
                  {ws.CompletionPct || 0}%
                </span>
              </div>

              <div className="flex items-center justify-between mt-1">
                <span
                  className={`text-[9px] font-semibold px-1.5 py-0.5 rounded bg-gray-100 text-gray-600 border border-gray-200 ${viewMode === "tree" && hasOutgoingHandoffs ? "ml-6" : "ml-6"}`}
                >
                  {ws.StatusName || `Status ID: ${ws.StreamStatus}`}
                </span>
              </div>

              {/* 🔥 TREE VIEW (Dev's Outgoing) */}
              {viewMode === "tree" && isExpanded && hasOutgoingHandoffs && (
                <div className="ml-5 pl-3 mt-2 border-l-2 border-gray-200 flex flex-col gap-1.5">
                  {ws.HandOffData.map((handoff) => (
                    <div
                      key={handoff.HandsOffId}
                      // 🔥 SELECT HANDOFF EVENT
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectHandoff(
                          selectedHandoffId === handoff.HandsOffId
                            ? null
                            : handoff?.HandsOffId,
                        );
                      }}
                      // onClick={() => {
                      //   if (selectedHandoffId?.HandsOffId === handoff.HandsOffId)
                      //     onSelectHandoff(null);
                      //   else onSelectHandoff(handoff);
                      // }}
                      className={`p-1.5 rounded-md border flex justify-between items-center shadow-sm cursor-pointer transition-colors ${
                        selectedHandoffId === handoff.HandsOffId
                          ? "bg-blue-50 border-blue-300 ring-1 ring-blue-400"
                          : "bg-gray-50/80 border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <span className="text-[10px] text-gray-600">
                        ↳ Push #{handoff.HandsOffId} to{" "}
                        <strong className="text-gray-800">
                          {getAssigneeName(handoff.TargetStreamId)}
                        </strong>
                      </span>

                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-gray-600">
                          {handoff.CompletionPct}%
                        </span>
                        {/* <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded ${
                          handoff.Status === 'Pending' ? 'bg-orange-100 text-orange-600' :
                          handoff.Status === 'Passed' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                        }`}>
                          {handoff.Status}
                        </span> */}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* 🔥 LIST VIEW (Tester's Incoming Queue) */}
              {viewMode === "list" && myTestingQueue.length > 0 && (
                <div className="mt-2 border-t border-blue-100/50 pt-2 ml-1">
                  <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">
                    Testing Queue
                  </span>
                  <ul className="mt-1 flex flex-col gap-1.5">
                    {myTestingQueue.map((handoff) => (
                      <li
                        key={handoff.HandsOffId}
                        // 🔥 SELECT HANDOFF EVENT
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectHandoff(
                            selectedHandoffId === handoff.HandsOffId
                              ? null
                              : handoff?.HandsOffId,
                          );
                        }}
                        className={`rounded border p-1.5 shadow-sm cursor-pointer transition-colors ${
                          selectedHandoffId === handoff.HandsOffId
                            ? "bg-blue-50 border-blue-300 ring-1 ring-blue-400"
                            : "bg-white border-gray-200 hover:border-gray-300"
                        }`}
                      >
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] font-semibold text-gray-700">
                            Push #{handoff.HandsOffId} from {handoff.SourceName}
                          </span>

                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold text-gray-600">
                              {handoff.CompletionPct}%
                            </span>
                            {/* <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded ${
                              handoff.Status === 'Pending' ? 'bg-orange-100 text-orange-600' :
                              handoff.Status === 'Passed' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                            }`}>
                              {handoff.Status}
                            </span> */}
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* SECTION 4: YOUR FORM ENGINE */}
      <div
        className={`bg-gray-50 border-t border-gray-200 flex flex-col transition-all duration-300 ${showUpdateForm ? "flex-1 min-h-0" : "shrink-0"}`}
      >
        {!showUpdateForm ? (
          <div className="p-3">
            <button
              onClick={() => setShowUpdateForm(true)}
              className="w-full flex items-center justify-center gap-2 py-2 px-4 bg-white border border-gray-300 shadow-sm rounded-lg text-xs font-semibold text-gray-700 hover:bg-gray-50"
            >
              <FaPlus size={10} /> Log My Progress
            </button>
          </div>
        ) : (
          <div className="flex flex-col h-full overflow-hidden">
            <div className="px-4 py-2 flex items-center justify-between border-b border-gray-200 shrink-0 bg-gray-100">
              <h4 className="text-[13px] font-bold text-gray-800">
                Update Status
              </h4>
              <button
                onClick={() => setShowUpdateForm(false)}
                className="text-gray-400 hover:text-red-500 bg-white border rounded p-1"
              >
                <FaTimes size={10} />
              </button>
            </div>
            <div className="p-4 pb-12 flex-1 overflow-y-auto wg-scrollbar">
              <EntityFormPage
                mode="Create"
                config={{
                  ...ProgressUpdateFormConfig,
                  fields: ProgressUpdateConfig(ticketId),
                }}
                module="Progress"
                context={{
                  ...formContext,
                  lastThread: myLastThread,
                }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// export default function AssigneesWidget({
//   workStreams = [],
//   currentUser,
//   threads = [],
//   ticketId,
//   data,
//   selectedWorkStream, // 👈 New prop
//   onSelectWorkStream,
//   selectedHandoffId,  // 🔥 Received from parent
//   onSelectHandoff,
// }) {
//   const [showUpdateForm, setShowUpdateForm] = useState(false);

//   // 🔥 1. VIEW TOGGLE STATE
//   const [viewMode, setViewMode] = useState("list"); // 'list' or 'tree'
//   const [expandedNodes, setExpandedNodes] = useState({});

//   const myLastThread = useMemo(() => {
//     if (!threads || !currentUser) return null;
//     const myThreads = threads.filter(
//       (t) =>
//         t.CreatedBy === currentUser.userId || t.CreatedBy === currentUser.id,
//     );
//     return myThreads.sort(
//       (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
//     )[0];
//   }, [threads, currentUser]);

//   const filteredWorkStreams = useMemo(() => {
//     if (!workStreams) return [];
//     // Note: Checking both Assignee_Type and Assignment_Type just to be safe
//     // based on your older commented code.
//     return workStreams.filter(
//       (ws) =>
//         ws.Assignee_Type !== "Main Assignee" &&
//         ws.Assignment_Type !== "Main Assignee",
//     );
//   }, [workStreams]);
//   // 🔥 2. HELPER TO EXTRACT ALL HANDOFFS GLOBALLY (For List View)
//   const allHandoffs = useMemo(() => {
//     let list = [];
//     filteredWorkStreams.forEach((ws) => {
//       if (ws.HandOffData && ws.HandOffData.length > 0) {
//         ws.HandOffData.forEach((h) => {
//           list.push({ ...h, SourceName: ws.Assignee_Name });
//         });
//       }
//     });
//     return list;
//   }, [filteredWorkStreams]);

//   // 🔥 3. HELPER TO GET NAME FROM TARGET ID (For Tree View)
//   const getAssigneeName = (streamId) => {
//     const match = filteredWorkStreams.find((ws) => ws.StreamId === streamId);
//     return match ? match.Assignee_Name : "Unknown";
//   };

//   const toggleExpand = (streamId, e) => {
//     e.stopPropagation(); // Prevents selecting the card when just expanding the tree
//     setExpandedNodes((prev) => ({ ...prev, [streamId]: !prev[streamId] }));
//   };

//   const summary = useMemo(() => {
//     if (!filteredWorkStreams || filteredWorkStreams.length === 0) {
//       return {
//         total: 0,
//         completed: 0,
//         pending: 0,
//         overallPct: 0,
//         pendingText: "",
//       };
//     }
//     const total = filteredWorkStreams.length;
//     const completed = filteredWorkStreams.filter(
//       (ws) => ws.CompletionPct === 100,
//     );
//     const pending = filteredWorkStreams.filter((ws) => ws.CompletionPct < 100);
//     const overallPct = Math.round(
//       filteredWorkStreams.reduce(
//         (acc, ws) => acc + (ws.CompletionPct || 0),
//         0,
//       ) / total,
//     );
//     const pendingByStatus = pending.reduce((acc, ws) => {
//       const statusName = ws.StatusName || `Status ${ws.StreamStatus}`;
//       acc[statusName] = (acc[statusName] || 0) + 1;
//       return acc;
//     }, {});
//     const pendingText = Object.entries(pendingByStatus)
//       .map(([status, count]) => `${status} (${count})`)
//       .join(", ");

//     return {
//       total,
//       completed: completed.length,
//       pending: pending.length,
//       overallPct,
//       pendingText,
//     };
//   }, [filteredWorkStreams]);

//   return (
//     <div className="bg-white border border-gray-200 shadow-sm rounded-2xl flex flex-col max-h-full overflow-hidden">
//       {/* SECTION 1: ROLL-UP SUMMARY (Compact Padding) */}
//       <div className="p-4 bg-gray-50/50 border-b border-gray-100 shrink-0">
//         <h4 className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2">
//           Overall Progress
//         </h4>
//         <div className="flex items-center gap-3 mb-2">
//           <div className="text-2xl font-black text-gray-800">
//             {data?.CompletionPct}%
//           </div>
//           <div className="flex-1">
//             <div className="h-1.5 w-full bg-gray-200 rounded-full overflow-hidden">
//               <div
//                 className="h-full bg-blue-500 transition-all duration-500"
//                 style={{ width: `${data?.CompletionPct}%` }}
//               />
//             </div>
//           </div>
//         </div>
//         <p className="text-xs text-gray-600">
//           <span className="font-semibold text-gray-900">
//             {summary.completed} of {summary.total}
//           </span>{" "}
//           completed
//         </p>
//       </div>

//       {/* SECTION 2: ASSIGNEE LIST
//           Dynamic Height: Shrinks to a max of 25% of the screen if form is open, otherwise takes available space. */}
//       <div
//         className={`p-4 flex flex-col gap-3 overflow-y-auto wg-scrollbar bg-white transition-all duration-300 ${
//           showUpdateForm ? "shrink-0 max-h-[25vh]" : ""
//         }`}
//       >
//         <div className="flex items-center justify-between border-b border-gray-100 pb-1.5">
//           <h4 className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
//             Workstreams ({summary.total})
//           </h4>
//           <div className="flex items-center gap-1 bg-gray-100 p-0.5 rounded-md border border-gray-200">
//             <button
//               onClick={() => setViewMode("list")}
//               className={`p-1 rounded transition-colors ${viewMode === "list" ? "bg-white shadow-sm text-blue-600" : "text-gray-400 hover:text-gray-600"}`}
//               title="List View"
//             >
//               <FaListUl size={12} />
//             </button>
//             <button
//               onClick={() => setViewMode("tree")}
//               className={`p-1 rounded transition-colors ${viewMode === "tree" ? "bg-white shadow-sm text-blue-600" : "text-gray-400 hover:text-gray-600"}`}
//               title="Tree View"
//             >
//               <FaProjectDiagram size={12} />
//             </button>
//           </div>
//         </div>
//         {/*
//         {filteredWorkStreams?.length > 0 ? (
//           filteredWorkStreams?.map((ws, index) => (
//             <div
//               key={ws.StreamId || index}
//               // className="flex flex-col gap-1 pb-2 border-b border-gray-50 last:border-0 last:pb-0"
//               onClick={() => {
//                 // If they click the same one again, un-select it
//                 if (selectedWorkStream?.StreamId === ws.StreamId) {
//                   onSelectWorkStream(null);
//                 } else {
//                   onSelectWorkStream(ws);
//                 }
//               }}
//               className={`flex flex-col gap-1 pb-2 border-b border-gray-50 last:border-0 last:pb-0 cursor-pointer p-2 rounded-md transition-all ${
//                 selectedWorkStream?.StreamId === ws.StreamId
//                   ? "bg-blue-50 border-blue-200 ring-1 ring-blue-500" // Highlight selected
//                   : "hover:bg-gray-50" // Normal hover
//               }`}
//             >
//               <div className="flex items-center justify-between">
//                 <div className="flex items-center gap-2">
//                   {ws.CompletionPct === 100 ? (
//                     <FaCheckCircle className="text-green-500" size={13} />
//                   ) : (
//                     <FaSpinner
//                       className="text-blue-500 animate-spin-slow"
//                       size={13}
//                     />
//                   )}
//                   <span className="text-[13px] font-semibold text-gray-800">
//                     {ws.Assignee_Name || "Assignee"}
//                   </span>
//                 </div>
//                 <span className="text-[11px] font-bold text-gray-600">
//                   {ws.CompletionPct || 0}%
//                 </span>
//               </div>
//               <div className="flex items-center justify-between">
//                 <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded bg-gray-100 text-gray-600 border border-gray-200">
//                   {ws.StatusName || `Status ID: ${ws.StreamStatus}`}
//                 </span>
//               </div>
//             </div>
//           ))
//         ) : (
//           <div className="text-xs text-gray-500 italic text-center py-2">
//             No assignees yet.
//           </div>
//         )} */}
//         {filteredWorkStreams?.map((ws, index) => {
//           // List View: Find handoffs where THIS user is the Target (Rekha's Queue)
//           const myTestingQueue = allHandoffs.filter(
//             (h) => h.TargetStreamId === ws.StreamId,
//           );

//           // Tree View: Check if THIS user has outgoing handoffs (Anbu's pushes)
//           const hasOutgoingHandoffs =
//             ws.HandOffData && ws.HandOffData.length > 0;
//           const isExpanded = expandedNodes[ws.StreamId];

//           return (
//             <div
//               key={ws.StreamId || index}
//               onClick={() => {
//                 if (selectedWorkStream?.StreamId === ws.StreamId)
//                   onSelectWorkStream(null);
//                 else onSelectWorkStream(ws);
//               }}
//               className={`flex flex-col gap-1 pb-2 border-b border-gray-50 cursor-pointer p-2 rounded-md transition-all ${
//                 selectedWorkStream?.StreamId === ws.StreamId
//                   ? "bg-blue-50 border-blue-200 ring-1 ring-blue-500"
//                   : "hover:bg-gray-50"
//               }`}
//             >
//               <div className="flex items-center justify-between">
//                 <div className="flex items-center gap-2">
//                   {/* TREE EXPAND ARROW */}
//                   {viewMode === "tree" && hasOutgoingHandoffs && (
//                     <div
//                       onClick={(e) => toggleExpand(ws.StreamId, e)}
//                       className="text-gray-400 hover:text-gray-700 w-3"
//                     >
//                       {isExpanded ? (
//                         <FaChevronDown size={10} />
//                       ) : (
//                         <FaChevronRight size={10} />
//                       )}
//                     </div>
//                   )}

//                   {ws.CompletionPct === 100 ? (
//                     <FaCheckCircle className="text-green-500" size={13} />
//                   ) : (
//                     <FaSpinner
//                       className="text-blue-500 animate-spin-slow"
//                       size={13}
//                     />
//                   )}
//                   <span className="text-[13px] font-semibold text-gray-800">
//                     {ws.Assignee_Name || "Assignee"}
//                   </span>
//                 </div>
//                 <span className="text-[11px] font-bold text-gray-600">
//                   {ws.CompletionPct || 0}%
//                 </span>
//               </div>

//               <div className="flex items-center justify-between mt-1">
//                 <span
//                   className={`text-[9px] font-semibold px-1.5 py-0.5 rounded bg-gray-100 text-gray-600 border border-gray-200 ${viewMode === "tree" && hasOutgoingHandoffs ? "ml-6" : "ml-6"}`}
//                 >
//                   {ws.StatusName || `Status ID: ${ws.StreamStatus}`}
//                 </span>
//               </div>

//               {/* 🔥 TREE VIEW: Show Outgoing Pushes (Developer -> Tester) */}
//               {viewMode === "tree" && isExpanded && hasOutgoingHandoffs && (
//                 <div className="ml-5 pl-3 mt-2 border-l-2 border-gray-200 flex flex-col gap-1.5">
//                   {ws.HandOffData.map((handoff) => (
//                     <div
//                       key={handoff.HandsOffId}
//                       className="bg-gray-50/80 p-1.5 rounded-md border border-gray-200 flex justify-between items-center shadow-sm"
//                     >
//                       <span className="text-[10px] text-gray-600">
//                         ↳ Push #{handoff.HandsOffId} to{" "}
//                         <strong className="text-gray-800">
//                           {getAssigneeName(handoff.TargetStreamId)}
//                         </strong>
//                       </span>
//                       <div className="flex items-center gap-2">
//                         {/* Show Dev's Percentage */}
//                         <span className="text-[10px] font-bold text-gray-600">
//                           {ws.CompletionPct}%
//                         </span>
//                         {/* <span
//                           className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded ${
//                             handoff.Status === "Pending"
//                               ? "bg-orange-100 text-orange-600"
//                               : handoff.Status === "Passed"
//                                 ? "bg-green-100 text-green-600"
//                                 : "bg-red-100 text-red-600"
//                           }`}
//                         >
//                           {handoff.Status}
//                         </span> */}
//                       </div>
//                       {/* <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded ${
//                         handoff.Status === 'Pending' ? 'bg-orange-100 text-orange-600' :
//                         handoff.Status === 'Passed' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
//                       }`}>
//                         {handoff.Status}
//                       </span> */}
//                     </div>
//                   ))}
//                 </div>
//               )}

//               {/* 🔥 LIST VIEW: Show Incoming Testing Queue (Tester's Action List) */}
//               {viewMode === "list" && myTestingQueue.length > 0 && (
//                 <div className="mt-2 border-t border-blue-100/50 pt-2 ml-1">
//                   <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">
//                     Testing Queue
//                   </span>
//                   <ul className="mt-1 flex flex-col gap-1.5">
//                     {myTestingQueue.map((handoff) => (
//                       <li
//                         key={handoff.HandsOffId}
//                         className="bg-white rounded border border-gray-200 p-1.5 shadow-sm"
//                       >
//                         <div className="flex justify-between items-center mb-1.5">
//                           <span className="text-[10px] font-semibold text-gray-700">
//                             Push #{handoff.HandsOffId} from {handoff.SourceName}
//                           </span>
//                           <div className="flex items-center gap-2">
//                             {/* Show the Dev's Percentage from when it was pushed */}
//                             <span className="text-[10px] font-bold text-gray-600">{handoff.SourcePct}%</span>
//                             {/* <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded ${
//                               handoff.Status === 'Pending' ? 'bg-orange-100 text-orange-600' :
//                               handoff.Status === 'Passed' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
//                             }`}>
//                               {handoff.Status}
//                             </span> */}
//                           </div>
//                         </div>

//                         {/* Action Buttons via Form Engine */}
//                         {/* {handoff.Status === "Pending" && (
//                           <div className="flex gap-1.5">
//                             <button
//                               onClick={(e) => {
//                                 e.stopPropagation();
//                                 setActiveHandoffAction({
//                                   action: "Pass",
//                                   handoffId: handoff.HandsOffId,
//                                 });
//                                 setShowUpdateForm(true);
//                               }}
//                               className="flex-1 text-[10px] font-bold bg-green-50 hover:bg-green-100 text-green-700 py-1 rounded border border-green-200"
//                             >
//                               Pass
//                             </button>
//                             <button
//                               onClick={(e) => {
//                                 e.stopPropagation();
//                                 setActiveHandoffAction({
//                                   action: "Fail",
//                                   handoffId: handoff.HandsOffId,
//                                 });
//                                 setShowUpdateForm(true);
//                               }}
//                               className="flex-1 text-[10px] font-bold bg-red-50 hover:bg-red-100 text-red-700 py-1 rounded border border-red-200"
//                             >
//                               Report Bug
//                             </button>
//                           </div>
//                         )} */}
//                       </li>
//                     ))}
//                   </ul>
//                 </div>
//               )}
//             </div>
//           );
//         })}
//       </div>

//       {/* SECTION 3: UPDATE PROGRESS FORM
//           Uses min-h-0 to allow internal scrolling of the form without breaking out of the parent. */}
//       <div
//         className={`bg-gray-50 border-t border-gray-200 flex flex-col transition-all duration-300 ${
//           showUpdateForm ? "flex-1 min-h-0" : "shrink-0"
//         }`}
//       >
//         {!showUpdateForm ? (
//           <div className="p-3">
//             <button
//               onClick={() => setShowUpdateForm(true)}
//               className="w-full flex items-center justify-center gap-2 py-2 px-4 bg-white border border-gray-300 shadow-sm rounded-lg text-xs font-semibold text-gray-700 hover:bg-gray-50 hover:text-blue-600 transition-all"
//             >
//               <FaPlus size={10} /> Log My Progress
//             </button>
//           </div>
//         ) : (
//           <div className="flex flex-col h-full overflow-hidden">
//             {/* Form Header - Sticks to top */}
//             <div className="px-4 py-2 flex items-center justify-between border-b border-gray-200 shrink-0 bg-gray-100">
//               <h4 className="text-[13px] font-bold text-gray-800">
//                 Update Status
//               </h4>
//               <button
//                 onClick={() => setShowUpdateForm(false)}
//                 className="text-gray-400 hover:text-red-500 bg-white border border-gray-200 hover:border-red-200 hover:bg-red-50 rounded p-1 transition-colors"
//               >
//                 <FaTimes size={10} />
//               </button>
//             </div>

//             {/* Form Body - Scrollable Area */}
//             <div className="p-4 pb-12 flex-1 overflow-y-auto wg-scrollbar">
//               <div className="-mx-1">
//                 <EntityFormPage
//                   mode="Create"
//                   config={{
//                     ...ProgressUpdateFormConfig,
//                     fields: ProgressUpdateConfig(ticketId),
//                   }}
//                   module="Progress"
//                   context={{ lastThread: myLastThread }}
//                 />
//               </div>
//             </div>
//           </div>
//         )}
//       </div>
//     </div>
//   );
// }
//////////////////////////////////---------------------------------------
// export default function AssigneesWidget({
//   workStreams = [],
//   currentUser,
//   threads = [],
// }) {
//   // Toggle state for the Form Engine
//   const [showUpdateForm, setShowUpdateForm] = useState(false);

//   const myLastThread = useMemo(() => {
//     if (!threads || !currentUser) return null;
//     // Filter threads by current user, sort descending by date, grab the first one
//     const myThreads = threads.filter(
//       (t) =>
//         t.CreatedBy === currentUser.userId || t.CreatedBy === currentUser.id,
//     );
//     return myThreads.sort(
//       (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
//     )[0];
//   }, [threads, currentUser]);
//   // --- 1. Calculate the Roll-up Summary ---
//   const summary = useMemo(() => {
//     if (!workStreams || workStreams.length === 0) {
//       return {
//         total: 0,
//         completed: 0,
//         pending: 0,
//         overallPct: 0,
//         pendingText: "",
//       };
//     }

//     const total = workStreams.length;
//     const completed = workStreams.filter((ws) => ws.CompletionPct === 100);
//     const pending = workStreams.filter((ws) => ws.CompletionPct < 100);

//     const overallPct = Math.round(
//       workStreams.reduce((acc, ws) => acc + (ws.CompletionPct || 0), 0) / total,
//     );

//     const pendingByStatus = pending.reduce((acc, ws) => {
//       const statusName = ws.StatusName || `Status ${ws.StreamStatus}`;
//       acc[statusName] = (acc[statusName] || 0) + 1;
//       return acc;
//     }, {});

//     const pendingText = Object.entries(pendingByStatus)
//       .map(([status, count]) => `${status} (${count})`)
//       .join(", ");

//     return {
//       total,
//       completed: completed.length,
//       pending: pending.length,
//       overallPct,
//       pendingText,
//     };
//   }, [workStreams]);

//   const statusList = {
//     ...ProgressUpdateFormConfig
//   };
//   return (
//     // Make sure h-full and overflow-hidden are here so it respects the max-h-[calc(...)] from the parent!
//     <div className="bg-white border border-gray-200 shadow-sm rounded-2xl flex flex-col h-full overflow-hidden">
//       {/* =========================================
//           SECTION 1: ROLL-UP SUMMARY (Fixed Top)
//           ========================================= */}
//       <div className="p-5 bg-gray-50/50 border-b border-gray-100 shrink-0">
//         <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">
//           Overall Progress
//         </h4>

//         <div className="flex items-center gap-4 mb-3">
//           <div className="text-3xl font-black text-gray-800">
//             {summary.overallPct}%
//           </div>
//           <div className="flex-1">
//             <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
//               <div
//                 className="h-full bg-blue-500 transition-all duration-500"
//                 style={{ width: `${summary.overallPct}%` }}
//               />
//             </div>
//           </div>
//         </div>

//         <p className="text-sm text-gray-600 leading-relaxed">
//           <span className="font-semibold text-gray-900">
//             {summary.completed} of {summary.total}
//           </span>{" "}
//           assignees completed their work.
//         </p>
//         {summary.pending > 0 && (
//           <p className="text-[11px] text-orange-600 mt-2 font-medium bg-orange-50 inline-block px-2 py-1 rounded border border-orange-100">
//             Pending: {summary.pendingText}
//           </p>
//         )}
//       </div>

//       {/* =========================================
//           SECTION 2: ASSIGNEE LIST (Scrollable Middle)
//           ========================================= */}
//       <div className="p-5 flex flex-col gap-4 flex-1 overflow-y-auto wg-scrollbar bg-white">
//         <div className="flex items-center justify-between border-b border-gray-100 pb-2">
//           <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider">
//             Workstreams ({summary.total})
//           </h4>
//         </div>

//         {workStreams.length > 0 ? (
//           workStreams.map((ws, index) => (
//             <div
//               key={ws.StreamId || index}
//               className="flex flex-col gap-1 pb-3 border-b border-gray-50 last:border-0 last:pb-0"
//             >
//               <div className="flex items-center justify-between">
//                 <div className="flex items-center gap-2">
//                   {ws.CompletionPct === 100 ? (
//                     <FaCheckCircle className="text-green-500" size={14} />
//                   ) : (
//                     <FaSpinner
//                       className="text-blue-500 animate-spin-slow"
//                       size={14}
//                     />
//                   )}
//                   <span className="text-sm font-semibold text-gray-800">
//                     {ws.Assignee_Name || "Assignee"}
//                   </span>
//                 </div>
//                 <span className="text-xs font-bold text-gray-600">
//                   {ws.CompletionPct || 0}%
//                 </span>
//               </div>

//               <div className="flex items-center justify-between mt-1">
//                 <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-gray-100 text-gray-600 border border-gray-200">
//                   {ws.StatusName || `Status ID: ${ws.StreamStatus}`}
//                 </span>
//               </div>
//             </div>
//           ))
//         ) : (
//           <div className="text-sm text-gray-500 italic text-center py-4">
//             No assignees assigned to this ticket yet.
//           </div>
//         )}
//       </div>

//       {/* =========================================
//           SECTION 3: UPDATE PROGRESS (Fixed Bottom)
//           ========================================= */}
//       <div className="bg-gray-50 border-t border-gray-200 shrink-0">
//         {!showUpdateForm ? (
//           // The Trigger Button
//           <div className="p-4">
//             <button
//               onClick={() => setShowUpdateForm(true)}
//               className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-white border border-gray-300 shadow-[0_1px_2px_rgb(0,0,0,0.05)] rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-50 hover:text-blue-600 transition-all"
//             >
//               <FaPlus size={12} /> Log My Progress
//             </button>
//           </div>
//         ) : (
//           // The Form Engine Wrapper
//           <div className="p-4 flex flex-col gap-3">
//             <div className="flex items-center justify-between mb-1 border-b border-gray-200 pb-2">
//               <h4 className="text-sm font-bold text-gray-800">Update Status</h4>
//               <button
//                 onClick={() => setShowUpdateForm(false)}
//                 className="text-gray-400 hover:text-red-500 bg-gray-100 hover:bg-red-50 rounded p-1.5 transition-colors"
//                 title="Cancel"
//               >
//                 <FaTimes size={12} />
//               </button>
//             </div>

//             {/* 🔥 YOUR EXISTING FORM ENGINE 🔥 */}
//             <div className="-mx-1">
//               <EntityFormPage
//                 mode="Create"
//                 config={ProgressUpdateFormConfig}
//                 module="Progress"
//                 context={{ lastThread: myLastThread }}
//                 // Optional context if you need to pass down the current user's existing workstream values to pre-fill the form!
//               />
//             </div>
//           </div>
//         )}
//       </div>
//     </div>
//   );
// }

//////////////---------------------------------------
// import React from 'react';
// import BatteryCompletionIndicator from '../../../app/shared/Component/BatteryCompletionIndicator/BatteryCompletionIndicator';
// import EntityFormPage from '../../../packages/crud/pages/EntityFormPage';
// import { AssigneesFormConfig } from '../config/AssigneesWidget/AssigneesForm.config';

// const AssigneesWidget = ({ assigneesJson }) => {
//   // 1. Safely parse the JSON string coming from the SQL Stored Procedure
//   let assignees = [];
//   try {
//     assignees = assigneesJson ? JSON.parse(assigneesJson) : [];
//   } catch (error) {
//     console.error("Failed to parse assignees", error);
//   }

//   return (
//     <div className="bg-white p-4 rounded-md border border-gray-200">
//       <div>
//         <EntityFormPage
//           // mode={isEdit ? "Update" : "Create"}
//           config={AssigneesFormConfig}
//           module="Ticket"
//           // context={{ params, isEdit, entityData }}
//         />
//       </div>
//       <h3 className="text-sm font-semibold text-gray-700 mb-3 border-b pb-2">
//         Assignees ({assignees.length})
//       </h3>

//       {assignees.length === 0 ? (
//         <span className="text-sm text-gray-500">No one assigned</span>
//       ) : (
//         <ul className="flex flex-col gap-3">
//           {assignees.map((user) => (
//             <li key={user.Assignee_Id} className="flex items-center gap-3">

//               {/* Avatar Placeholder (Use real images if you have them) */}
//               <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs">
//                 {user.Assignee_Name.charAt(0).toUpperCase()}
//               </div>

//               {/* Name and Role */}
//               <div className="flex flex-col">
//                 <span className="text-sm font-medium text-gray-800">
//                   {user.Assignee_Name}
//                 </span>
//                 <span className={`text-xs ${user.Assignment_Type === 'Main Assignee' ? 'text-green-600 font-medium' : 'text-gray-500'}`}>
//                   {user.Assignment_Type}
//                 </span>
//               </div>

//             </li>
//           ))}
//         </ul>
//       )}
//     </div>
//   );
// };

// export default AssigneesWidget;
