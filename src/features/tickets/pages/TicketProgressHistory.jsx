import React, { useState } from "react";
import { useParams } from "react-router-dom";
import { FaChevronDown, FaChevronUp, FaHistory } from "react-icons/fa";
import { useTicketProgress } from "../../../core/master/selectors/selectors"; // Adjust path as needed

const TicketProgressHistory = ({ options }) => {
 const routeParams = useParams();
  console.log("options :", options);
  
  // 🔥 1. Prioritize the ticketId from FormEngine config, fallback to URL params
  const activeTicketId = options?.ticketId || routeParams.ticketId;
  
  // 2. Fetch the data using the resolved ID
  const { data: progressLogs = [], isLoading } = useTicketProgress(activeTicketId, {
    enabled: !!activeTicketId,
  });
  const [showMainPanel, setShowMainPanel] = useState(false);
  const [expandedAssignees, setExpandedAssignees] = useState({});

  // Hide the entire component if there are no logs yet
  if (!isLoading && (!progressLogs || progressLogs.length === 0)) {
    return null;
  }

  // Group logs by Assignee
  const groupedLogs = progressLogs.reduce((acc, log) => {
    if (!acc[log.Assignee_Id]) {
      acc[log.Assignee_Id] = {
        assigneeName: log.AssigneeName || "Unknown",
        activeLog: null,
        history: [],
      };
    }
    
    if (log.IsActive) {
      acc[log.Assignee_Id].activeLog = log;
    } else {
      acc[log.Assignee_Id].history.push(log);
    }
    return acc;
  }, {});

  const toggleAssigneeHistory = (assigneeId) => {
    setExpandedAssignees((prev) => ({
      ...prev,
      [assigneeId]: !prev[assigneeId],
    }));
  };

  const formatDate = (dateString) => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleString("en-US", {
      month: "short", day: "numeric", hour: "2-digit", minute: "2-digit"
    });
  };
console.log("its trigger");

  return (
    <div className="w-full mt-2">
      {/* 1. Main Toggle Button */}
      <button
        type="button"
        onClick={() => setShowMainPanel(!showMainPanel)}
        className="flex items-center text-sm font-semibold text-blue-600 hover:text-blue-800 transition-colors"
      >
        <FaHistory className="mr-2" />
        {showMainPanel ? "Hide Status History" : "View Full Status History"}
      </button>

      {/* 2. Expanded Main Panel */}
      {showMainPanel && (
        <div className="mt-4 p-4 bg-gray-50 border border-gray-200 rounded-md shadow-inner space-y-4">
          {isLoading ? (
            <div className="text-sm text-gray-500">Loading history...</div>
          ) : (
            Object.entries(groupedLogs).map(([assigneeId, data]) => (
              <div key={assigneeId} className="bg-white border border-gray-200 rounded-md overflow-hidden shadow-sm">
                
                {/* A. Active Log (Always visible when main panel is open) */}
                <div className="p-3 border-l-4 border-green-500 flex flex-col sm:flex-row sm:items-start justify-between gap-2 bg-green-50/30">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold text-gray-800">{data.assigneeName}</span>
                      <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full font-medium">
                        Current Status: {data.activeLog?.Percentage ?? 0}%
                      </span>
                      {data.activeLog?.CreatedAt && (
                         <span className="text-xs text-gray-400">{formatDate(data.activeLog.CreatedAt)}</span>
                      )}
                    </div>
                    <p className="text-sm text-gray-700">
                      {data.activeLog?.StatusSummary || "No summary provided."}
                    </p>
                  </div>

                  {/* B. Toggle Button for Older History */}
                  {data.history.length > 0 && (
                    <button
                      type="button"
                      onClick={() => toggleAssigneeHistory(assigneeId)}
                      className="text-xs flex items-center text-gray-500 hover:text-gray-800 bg-gray-100 px-2 py-1 rounded"
                    >
                      {expandedAssignees[assigneeId] ? (
                        <><FaChevronUp className="mr-1" /> Hide Previous</>
                      ) : (
                        <><FaChevronDown className="mr-1" /> {data.history.length} Previous</>
                      )}
                    </button>
                  )}
                </div>

                {/* C. Inactive Logs (Visible only if assignee history is expanded) */}
                {expandedAssignees[assigneeId] && data.history.length > 0 && (
                  <div className="bg-gray-50 p-3 space-y-3 border-t border-gray-200">
                    {data.history.map((log) => (
                      <div key={log.LogId} className="pl-4 border-l-2 border-gray-300 relative">
                        <div className="absolute -left-[5px] top-1.5 w-2 h-2 bg-gray-300 rounded-full"></div>
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-sm font-semibold text-gray-600">{log.Percentage}%</span>
                          <span className="text-xs text-gray-400">{formatDate(log.CreatedAt)}</span>
                        </div>
                        <p className="text-sm text-gray-500">{log.StatusSummary}</p>
                      </div>
                    ))}
                  </div>
                )}
                
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default TicketProgressHistory;