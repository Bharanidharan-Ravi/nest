// component/AssigneesWidget.jsx
import React, { useState, useMemo } from "react";
import { FaCheckCircle, FaSpinner, FaPlus, FaTimes } from "react-icons/fa";
import EntityFormPage from "../../../packages/crud/pages/EntityFormPage"; 
import { ProgressUpdateFormConfig } from "../config/AssigneesWidget/ProgressUpdateForm.config";// 👈 Import your new config

export default function AssigneesWidget({ workStreams = [], currentUser, threads = [] }) {
  // Toggle state for the Form Engine
  const [showUpdateForm, setShowUpdateForm] = useState(false);

  const myLastThread = useMemo(() => {
    if (!threads || !currentUser) return null;
    // Filter threads by current user, sort descending by date, grab the first one
    const myThreads = threads.filter(t => t.CreatedBy === currentUser.userId || t.CreatedBy === currentUser.id);
    return myThreads.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0];
  }, [threads, currentUser]);
  // --- 1. Calculate the Roll-up Summary ---
  const summary = useMemo(() => {
    if (!workStreams || workStreams.length === 0) {
      return { total: 0, completed: 0, pending: 0, overallPct: 0, pendingText: "" };
    }

    const total = workStreams.length;
    const completed = workStreams.filter(ws => ws.CompletionPct === 100);
    const pending = workStreams.filter(ws => ws.CompletionPct < 100);
    
    const overallPct = Math.round(
      workStreams.reduce((acc, ws) => acc + (ws.CompletionPct || 0), 0) / total
    );

    const pendingByStatus = pending.reduce((acc, ws) => {
      const statusName = ws.StatusName || `Status ${ws.StreamStatus}`;
      acc[statusName] = (acc[statusName] || 0) + 1;
      return acc;
    }, {});

    const pendingText = Object.entries(pendingByStatus)
      .map(([status, count]) => `${status} (${count})`)
      .join(", ");

    return { total, completed: completed.length, pending: pending.length, overallPct, pendingText };
  }, [workStreams]);


  return (
    // Make sure h-full and overflow-hidden are here so it respects the max-h-[calc(...)] from the parent!
    <div className="bg-white border border-gray-200 shadow-sm rounded-2xl flex flex-col h-full overflow-hidden">
      
      {/* =========================================
          SECTION 1: ROLL-UP SUMMARY (Fixed Top)
          ========================================= */}
      <div className="p-5 bg-gray-50/50 border-b border-gray-100 shrink-0">
        <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">
          Overall Progress
        </h4>
        
        <div className="flex items-center gap-4 mb-3">
          <div className="text-3xl font-black text-gray-800">{summary.overallPct}%</div>
          <div className="flex-1">
            <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-blue-500 transition-all duration-500" 
                style={{ width: `${summary.overallPct}%` }}
              />
            </div>
          </div>
        </div>

        <p className="text-sm text-gray-600 leading-relaxed">
          <span className="font-semibold text-gray-900">{summary.completed} of {summary.total}</span> assignees completed their work.
        </p>
        {summary.pending > 0 && (
          <p className="text-[11px] text-orange-600 mt-2 font-medium bg-orange-50 inline-block px-2 py-1 rounded border border-orange-100">
            Pending: {summary.pendingText}
          </p>
        )}
      </div>

      {/* =========================================
          SECTION 2: ASSIGNEE LIST (Scrollable Middle)
          ========================================= */}
      <div className="p-5 flex flex-col gap-4 flex-1 overflow-y-auto wg-scrollbar bg-white">
        <div className="flex items-center justify-between border-b border-gray-100 pb-2">
            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider">
            Workstreams ({summary.total})
            </h4>
        </div>
        
        {workStreams.length > 0 ? (
            workStreams.map((ws, index) => (
            <div key={ws.StreamId || index} className="flex flex-col gap-1 pb-3 border-b border-gray-50 last:border-0 last:pb-0">
                <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    {ws.CompletionPct === 100 ? (
                    <FaCheckCircle className="text-green-500" size={14} />
                    ) : (
                    <FaSpinner className="text-blue-500 animate-spin-slow" size={14} />
                    )}
                    <span className="text-sm font-semibold text-gray-800">{ws.ResourceName || 'Assignee'}</span>
                </div>
                <span className="text-xs font-bold text-gray-600">{ws.CompletionPct || 0}%</span>
                </div>
                
                <div className="flex items-center justify-between mt-1">
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-gray-100 text-gray-600 border border-gray-200">
                      {ws.StatusName || `Status ID: ${ws.StreamStatus}`}
                  </span>
                </div>
            </div>
            ))
        ) : (
            <div className="text-sm text-gray-500 italic text-center py-4">No assignees assigned to this ticket yet.</div>
        )}
      </div>

      {/* =========================================
          SECTION 3: UPDATE PROGRESS (Fixed Bottom)
          ========================================= */}
      <div className="bg-gray-50 border-t border-gray-200 shrink-0">
        {!showUpdateForm ? (
          // The Trigger Button
          <div className="p-4">
            <button 
                onClick={() => setShowUpdateForm(true)}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-white border border-gray-300 shadow-[0_1px_2px_rgb(0,0,0,0.05)] rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-50 hover:text-blue-600 transition-all"
            >
                <FaPlus size={12} /> Log My Progress
            </button>
          </div>
        ) : (
          // The Form Engine Wrapper
          <div className="p-4 flex flex-col gap-3">
            <div className="flex items-center justify-between mb-1 border-b border-gray-200 pb-2">
                <h4 className="text-sm font-bold text-gray-800">Update Status</h4>
                <button 
                    onClick={() => setShowUpdateForm(false)}
                    className="text-gray-400 hover:text-red-500 bg-gray-100 hover:bg-red-50 rounded p-1.5 transition-colors"
                    title="Cancel"
                >
                    <FaTimes size={12} />
                </button>
            </div>
            
            {/* 🔥 YOUR EXISTING FORM ENGINE 🔥 */}
            <div className="-mx-1">
                <EntityFormPage
                    mode="Create"
                    config={ProgressUpdateFormConfig}
                    module="Progress"
                    context={{ lastThread: myLastThread }}
                    // Optional context if you need to pass down the current user's existing workstream values to pre-fill the form!
                   
                />
            </div>
          </div>
        )}
      </div>

    </div>
  );
}


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
//   console.log("assignees :", assignees, assigneesJson);

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