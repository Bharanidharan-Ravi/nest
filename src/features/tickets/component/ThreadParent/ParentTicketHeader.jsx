import React, { useState } from "react";
import { FaCalendarAlt, FaEdit, FaHistory, FaPlus, FaTimes } from "react-icons/fa";
import dayjs from "dayjs";
import {
  formatDate,
  HtmlRenderer,
} from "../../../../app/shared/utilities/utilities";
import { ROUTE_KEYS } from "../../../../core/routing/paths";

const getTeamColor = (teamName) => {
  let hash = 0;
  for (let i = 0; i < teamName.length; i++) {
    hash = teamName.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash) % 360;
  const saturation = 65 + (Math.abs(hash) % 35); 
  const lightness = 48 + (Math.abs(hash) % 12); 
  return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
};

const ParentTicketHeader = ({
  parentTicket,
  timeStats,
  mainAssignee,
  teamTimeStats,
  isStuck,
  sentinelRef,
  goTo,
  isOwner,
  progressLogs, 
}) => {
  // 🔥 1. State for the History Modal
  const [showHistoryModal, setShowHistoryModal] = useState(false);

  // 🔥 2. Function to scroll to the bottom form
  const handleScrollToUpdate = () => {
    const bottomSection = document.getElementById("bottomSection");
    if (bottomSection) {
      bottomSection.scrollIntoView({ behavior: "smooth" });
    }
  };

  if (!parentTicket) return null;

  const latestLog = progressLogs?.length > 0 ? progressLogs[0] : null;
  const statusSummary = latestLog?.StatusSummary || latestLog?.statusSummary || parentTicket?.CurrentStatusSummary;
  const overallPct = latestLog?.Percentage ?? latestLog?.percentage ?? parentTicket?.OverallPercentage ?? parentTicket?.CompletionPct ?? 0;

  return (
    <>
      <div
        ref={sentinelRef}
        className="absolute top-0 h-[1px] w-full invisible"
      />

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
            <div className="flex items-center gap-2">
             {/* 🔥 NEW: Compact Status Pill */}
            {(statusSummary || overallPct > 0) && (
              <div className="flex items-center gap-2.5 bg-white border border-blue-200/80 px-3 py-1.5 rounded-full shadow-sm">
                <span className="text-[10px] font-extrabold text-blue-600 uppercase tracking-widest">
                  Status:
                </span>
                <span className="text-gray-700 font-medium text-xs max-w-[120px] sm:max-w-[180px] truncate" title={statusSummary}>
                  {statusSummary || "In Progress"}
                </span>
                
                <div className="flex items-center gap-1.5 ml-1">
                  <div className="w-12 sm:w-16 bg-blue-100 rounded-full h-1.5 overflow-hidden">
                    <div className="bg-blue-500 h-full rounded-full transition-all duration-500" style={{ width: `${overallPct}%` }} />
                  </div>
                  <span className="text-[11px] font-black text-blue-700 w-8 text-right">
                    {overallPct}%
                  </span>
                </div>

                <div className="w-px h-3.5 bg-gray-200 mx-0.5"></div>
                
                {/* Icons */}
                <button onClick={() => setShowHistoryModal(true)} className="text-blue-500 hover:text-blue-700 transition-colors p-0.5" title="View Full History">
                  <FaHistory size={13} />
                </button>
                <button onClick={handleScrollToUpdate} className="text-green-500 hover:text-green-700 transition-colors p-0.5" title="Add New Status Update">
                  <FaPlus size={14} />
                </button>
              </div>
            )}

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

            <div className="flex items-center gap-3 text-xs font-medium bg-gray-50/80 border border-gray-200/60 shadow-sm rounded-lg px-3 py-1">
              <div className="flex flex-col items-center">
                <span className="text-[9px] text-gray-400 uppercase tracking-wider font-bold leading-none mb-0.5">
                  Estimated
                </span>
                <span className="text-gray-700 leading-none">
                  {parentTicket.Hours || "00:00"}
                </span>
              </div>
              <div className="w-px h-5 bg-gray-300"></div>
              <div className="flex flex-col items-center">
                <span className="text-[9px] text-gray-400 uppercase tracking-wider font-bold leading-none mb-0.5">
                  Total Logged
                </span>
                <span className="text-blue-600 leading-none">
                  {timeStats.total}
                </span>
              </div>
              <div className="w-px h-5 bg-gray-300"></div>
              <div className="flex flex-col items-center">
                <span className="text-[9px] text-gray-400 uppercase tracking-wider font-bold leading-none mb-0.5">
                  My Hours
                </span>
                <span className="text-brand-yellow drop-shadow-sm leading-none">
                  {timeStats.mine}
                </span>
              </div>
              {Object.entries(teamTimeStats).map(
                ([teamName, logged], index) => (
                  <React.Fragment key={`frag-${index}`}>
                    <div
                      className="w-px h-5 bg-gray-300"
                      key={`divider-team-${index}`}
                    />
                    <div
                      className="flex flex-col items-center"
                      key={`team-${teamName}-${index}`}
                    >
                      <span className="text-[9px] text-gray-400 uppercase tracking-wider font-bold leading-none mb-0.5">
                        {teamName}
                      </span>
                      <span
                        className="px-1.5 py-0.5 rounded-md text-white font-bold text-xs leading-none drop-shadow-sm shadow-sm"
                        style={{ color: getTeamColor(teamName) }}
                      >
                        {logged}
                      </span>
                    </div>
                  </React.Fragment>
                ),
              )}
            </div>
          </div>
        </div>

        {(parentTicket?.IsCloseRequested || parentTicket?.isCloseRequested) && (
          <div
            className={`bg-red-50 border border-red-100 border-l-4 border-l-red-500 shadow-sm flex items-center justify-between w-full transition-all duration-300 ${
              isStuck
                ? "mt-2 px-3 py-1.5 rounded-lg"
                : "mt-3 px-4 py-2.5 rounded-xl"
            }`}
          >
            <div className="flex items-center gap-3 truncate">
              <div className="relative flex h-3 w-3 flex-shrink-0 ml-1">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
              </div>
              <div className="flex items-baseline gap-2 truncate">
                <h4 className={`text-red-900 font-bold whitespace-nowrap transition-all ${isStuck ? "text-xs" : "text-sm"}`}>
                  Ticket Closure Requested
                </h4>
                <span className="hidden sm:inline text-red-300 text-sm">•</span>
                <p className={`text-red-700 truncate transition-all hidden sm:block ${isStuck ? "text-[11px]" : "text-xs"}`}>
                  An assignee has notified that the work is complete.
                </p>
              </div>
            </div>
            {isOwner && (
              <div className="flex-shrink-0 ml-3">
                <span
                  className={`bg-white border border-red-200 text-red-700 font-extrabold uppercase tracking-wider shadow-sm transition-all ${
                    isStuck ? "text-[9px] px-2.5 py-0.5 rounded-full" : "text-[10px] px-3 py-1 rounded-full"
                  }`}
                >
                  Action Required
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="flex flex-col gap-8 mt-2 px-4 sm:px-6 relative">
        <div className="bg-gray-50 border border-gray-100 shadow-[0_4px_20px_rgb(0,0,0,0.03)] rounded-3xl p-6 text-sm text-gray-800 leading-relaxed">
          <HtmlRenderer html={parentTicket.HtmlDesc || parentTicket.Description} />
        </div>
      </div>

      {/* 🔥 4. NEW: History Modal Overlay */}
      {showHistoryModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm px-4 transition-opacity">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="font-bold text-gray-800 text-lg flex items-center gap-2">
                <FaHistory className="text-blue-500" />
                Ticket Status History
              </h3>
              <button 
                onClick={() => setShowHistoryModal(false)} 
                className="text-gray-400 hover:text-red-500 hover:bg-red-50 p-1.5 rounded-full transition-colors"
              >
                <FaTimes size={16} />
              </button>
            </div>

            {/* Modal Body (Scrollable) */}
            <div className="p-6 overflow-y-auto wg-scrollbar flex flex-col gap-4">
              {progressLogs?.length > 0 ? (
                progressLogs.map((log, index) => (
                  <div key={log.LogId || index} className="flex flex-col gap-2 p-4 rounded-xl border border-gray-100 bg-white shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start gap-4">
                      <span className="font-bold text-gray-800 text-sm break-all">
                        {log.StatusSummary || log.statusSummary || "No Summary"}
                      </span>
                      <span className="text-xs font-bold px-2 py-1 bg-blue-50 text-blue-700 rounded-md whitespace-nowrap flex-shrink-0">
                        {log.Percentage ?? log.percentage ?? 0}%
                      </span>
                    </div>
                    <div className="text-xs text-gray-500 flex justify-between items-center mt-1 pt-2 border-t border-gray-50">
                      <span>Logged by: <span className="font-medium text-gray-700">{log.AssigneeName || "System"}</span></span>
                      <span>{dayjs(log.CreatedAt).format("MMM D, YYYY h:mm A")}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-10 flex flex-col items-center gap-2">
                  <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center">
                     <FaHistory className="text-gray-300" size={20} />
                  </div>
                  <p className="text-gray-500 font-medium">No status history available.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ParentTicketHeader;