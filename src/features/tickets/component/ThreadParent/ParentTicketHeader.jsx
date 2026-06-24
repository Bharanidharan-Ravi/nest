import React, { useState } from "react";
import {
  FaCalendarAlt,
  FaEdit,
  FaHistory,
  FaPlus,
  FaTimes,
} from "react-icons/fa";
import dayjs from "dayjs";
import {
  formatDate,
  HtmlRenderer,
} from "../../../../app/shared/utilities/utilities";
import { ROUTE_KEYS } from "../../../../core/routing/paths";
import { createPortal } from "react-dom";

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
  isViewer,
}) => {
  // 🔥 1. State for the History Modal and Mobile Expand
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [isMobileExpanded, setIsMobileExpanded] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  const [expandedAssignees, setExpandedAssignees] = useState({});
  const estimateBreakDown = {
    web: parentTicket.webTime || "0:00",
    technical: parentTicket.technicalTime || "0:00",
    functional: parentTicket.functionalTime || "0:00",
  };
  // 🔥 2. Function to scroll to the bottom form
  const handleScrollToUpdate = () => {
    const bottomSection = document.getElementById("bottomSection");
    if (bottomSection) {
      bottomSection.scrollIntoView({ behavior: "smooth" });
    }
  };

  if (!parentTicket) return null;   

  const latestLog = progressLogs?.length > 0 ? progressLogs[0] : null;
  const statusSummary =
    latestLog?.StatusSummary ||
    latestLog?.statusSummary ||
    parentTicket?.currentStatusSummary;
  const overallPct =
    latestLog?.Percentage ??
    latestLog?.percentage ??
    parentTicket?.overallPercentage ??
    parentTicket?.completionPct ??
    0;
  const getFlagStyles = (flag) => {
    switch (flag) {
      case "Priority":
        return "bg-orange-100 text-orange-800";

      case "Close Request":
        return "bg-red-100 text-red-800";

      case "Notify Functional":
        return "bg-purple-100 text-purple-800";

      case "Notify Admin":
        return "bg-yellow-100 text-yellow-800";

      case "Notify Web":
        return "bg-blue-100 text-blue-800";

      case "Notify Technical":
        return "bg-green-100 text-green-800";

      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const groupedLogs = progressLogs?.reduce((acc, log) => {
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

  const toggleAssignee = (id) => {
    setExpandedAssignees((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };
const getStatusStyle=(StatusId)=>{
  switch(StatusId){
    case 15:return{label:"Closed",color:"text-red-600"}
    case 18:return{label:"In Queue", color: " text-yellow-800"}
    case 14:return{label:"On Hold",color: "text-orange-800"}
    default:return null;
  }
}

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
        {/* 🔥 3. Restructured to flex-col on mobile, flex-row on desktop */}
        <div className="flex flex-col lg:flex-row justify-between items-start w-full gap-4">
          {/* LEFT SECTION (Row 1 & 2 on mobile) */}
          <div className="flex flex-col gap-2 w-full lg:w-auto flex-1 min-w-0">
            <div className="flex flex-col sm:flex-row sm:items-start gap-2 sm:gap-3 w-full">
              {/* 🔥 FIX: Max 3 lines title + Tooltip */}
              <h3
                className="text-2xl text-gray-900 font-bold tracking-tight line-clamp-3 break-words flex-1"
                title={`${parentTicket.title} #${parentTicket.ticketKey}`}
              >
                {parentTicket.title}
                <span className="text-gray-400 font-light ml-2 whitespace-nowrap">
                  #{parentTicket.ticketKey}
                </span>
                {(()=>{
                  const Status=getStatusStyle(parentTicket.statusId)
                  return Status?(<span className={`text-xs font-bold px-2 py-0.5 ml-2 ${Status.color}`}>{Status.label}</span>):null;
                })()}
              </h3>

              {parentTicket?.label?.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-1 flex-shrink-0">
                  {parentTicket.label.map((label) => (
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

            <div className="text-sm text-gray-500 flex flex-wrap items-center gap-2">
              <span className="font-medium">{parentTicket.repoName}</span>
              <span className="opacity-40">•</span>
              <span>{parentTicket.projectName}</span>
              {mainAssignee && (
                <>
                  <span className="opacity-40">•</span>
                  {!isViewer && (<>
                    <div className="flex items-center gap-1.5 bg-blue-50 text-blue-700 px-2 py-0.5 rounded-md border border-blue-100 shadow-sm">
                      <span className="text-[10px] font-bold uppercase tracking-wider opacity-80">
                        Owner:
                      </span>
                      <span className="text-xs font-bold">
                        {mainAssignee.Assignee_Name}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 bg-blue-50 text-blue-700 px-2 py-0.5 rounded-md border border-blue-100 shadow-sm">
                      <span className="text-[10px] font-bold uppercase tracking-wider opacity-80">
                        Created:
                      </span>
                      <span className="text-xs font-bold">
                        {parentTicket.ticketCreater}
                      </span>
                    </div>
                    </>
                  )}
                </>
              )}
            </div>

            {/* 🔥 NEW: Mobile Toggle Button */}
            <div className="flex justify-between items-center w-full lg:hidden mt-1">
              {!isViewer && (
                <button
                  onClick={() => setIsMobileExpanded(!isMobileExpanded)}
                  className="text-xs font-semibold text-blue-600 flex items-center gap-1 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-md transition-colors border border-blue-100"
                >
                  {isMobileExpanded
                    ? "Hide Ticket Details"
                    : "View Ticket Details (Status & Time)"}
                </button>
              )}

              <button
                onClick={() =>
                  goTo(ROUTE_KEYS.TICKET_EDIT, {
                    ticketId: parentTicket.navId,
                  })
                }
                className="text-gray-500 hover:text-blue-600 bg-white border border-gray-200 shadow-sm px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5"
                title="Edit Ticket"
              >
                <FaEdit size={14} />
              </button>
            </div>
          </div>

          {/* RIGHT SECTION (Row 3 & 4 on mobile, Hidden by default) */}
          <div
            className={`${
              isMobileExpanded ? "flex" : "hidden"
            } lg:flex flex-col items-start lg:items-end gap-3 w-full lg:w-auto flex-shrink-0 mt-2 lg:mt-0`}
          >
            <div className="flex flex-wrap lg:flex-nowrap items-center gap-2 w-full lg:w-auto">
              {/* Status Pill */}
              {(statusSummary || overallPct > 0) && !isViewer && (
                <div className="flex items-center gap-2.5 bg-white border border-blue-200/80 px-3 py-1.5 rounded-full shadow-sm">
                  <span className="text-[10px] font-extrabold text-blue-600 uppercase tracking-widest hidden sm:inline-block">
                    Status:
                  </span>
                  <span className="text-gray-700 font-medium text-xs max-w-[150px] sm:max-w-[180px] truncate" title={statusSummary}>
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

                  <button onClick={() => setShowHistoryModal(true)} className="text-blue-500 hover:text-blue-700 transition-colors p-0.5" title="View Full History">
                    <FaHistory size={13} />
                  </button>
                  <button onClick={handleScrollToUpdate} className="text-green-500 hover:text-green-700 transition-colors p-0.5" title="Add New Status Update">
                    <FaPlus size={14} />
                  </button>
                </div>
              )}
              {!isViewer &&
                <div className="flex items-center gap-1.5 bg-white border border-gray-200 shadow-sm px-3 py-1.5 rounded-lg text-xs text-gray-600">
                  <FaCalendarAlt className="text-blue-500" size={13} />
                  <span className="font-medium whitespace-nowrap">
                    Due: {formatDate(parentTicket.dueDate)}
                  </span>
                </div>
              }
              <button
                onClick={() =>
                  goTo(ROUTE_KEYS.TICKET_EDIT, {
                    ticketId: parentTicket.navId,
                  })
                }
                className="hidden lg:block text-gray-500 hover:text-blue-600 bg-white border border-gray-200 shadow-sm px-2 py-1.5 rounded-lg transition-all"
                title="Edit Ticket"
              >
                <FaEdit size={16} />
              </button>
            </div>

            {/* Time Stats - Added max-w-full and overflow-x-auto for small screens */}
            {/* Time Stats */}
            {!isViewer && (
              <div className="flex items-center gap-3 text-xs font-medium bg-gray-50/80 border border-gray-200/60 shadow-sm rounded-lg px-3 py-2 w-full lg:w-auto overflow-x-auto wg-scrollbar">
                <div className="flex flex-col items-center flex-shrink-0">
                  <span className="text-[9px] text-gray-400 uppercase tracking-wider font-bold leading-none mb-0.5">
                    Estimated
                  </span>
                  <span
                    className="text-gray-700 leading-none cursor-help relative"
                    onMouseEnter={(e) => {
                      const rect = e.currentTarget.getBoundingClientRect();
                      setTooltipPos({
                        x: rect.left + rect.width / 2,
                        y: rect.top - 10,
                      });
                      setShowTooltip(true);
                    }}
                    onMouseLeave={() => setShowTooltip(false)}
                  >
                    {parentTicket.estimateHours || "00:00"}
                  </span>
                </div>
                {showTooltip && (
                  <div className="fixed z-[9999] bg-white border border-gray-200 shadow-xl rounded-lg px-4 py-3 text-sm whitespace-normal max-w-48"
                    style={{
                      left: tooltipPos.x,
                      top: tooltipPos.y,
                      transform: "translate(-50% , -100%)",
                    }}
                      onMouseEnter={() => setShowTooltip(true)}
                      onMouseLeave={() => setShowTooltip(false)}
                    >
                    <div className="font-semibold text-gray-800 mb-2 text-xs uppercase tracking-wider">
                      Estimated Breakdown
                    </div>
                    <div className="text-gray-500">
                      <div>Web: <span className="text-gray-800 font-bold">{estimateBreakDown.web}</span></div>
                      <div>Technical: <span className="text-gray-800 font-bold">{estimateBreakDown.technical}</span></div>
                      <div>Functional: <span className="text-gray-800 font-bold">{estimateBreakDown.functional}</span></div>
                    </div>
                  </div>
                )}

                <div className="w-px h-5 bg-gray-300 flex-shrink-0"></div>

                <div className="flex flex-col items-center flex-shrink-0">
                  <span className="text-[9px] text-gray-400 uppercase tracking-wider font-bold leading-none mb-0.5">
                    Total Logged
                  </span>
                  <span className="text-blue-600 leading-none">
                    {timeStats.total}
                  </span>
                </div>

                <div className="w-px h-5 bg-gray-300 flex-shrink-0"></div>

                <div className="flex flex-col items-center flex-shrink-0">
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
                        className="w-px h-5 bg-gray-300 flex-shrink-0"
                        key={`divider-team-${index}`}
                      />
                      <div
                        className="flex flex-col items-center flex-shrink-0"
                        key={`team-${teamName}-${index}`}
                      >
                        <span className="text-[9px] text-gray-400 uppercase tracking-wider font-bold leading-none mb-0.5">
                          {teamName}
                        </span>
                        <span
                          className="px-1.5 py-0.5 rounded-md text-white font-bold text-xs leading-none shadow-sm"
                          style={{ backgroundColor: getTeamColor(teamName) }}
                        >
                          {logged}
                        </span>
                      </div>
                    </React.Fragment>
                  ),
                )}
              </div>
            )}
          </div>
        </div>
        {showTooltip &&
          parentTicket.technicalTime &&
          createPortal(
            <div
              className="fixed z-[99999] bg-gradient-to-r from-gray-900 to-gray-800 text-white text-xs 
      rounded-2xl px-4 py-3 shadow-2xl border border-white/20 backdrop-blur-xl
      whitespace-pre-wrap max-w-[220px] animate-in fade-in zoom-in-95 duration-200"
            style={{
              left: tooltipPos.x - 110,  // Center horizontally
              top: tooltipPos.y,
              transform: 'translateX(-50%)'
            }}
          >
            <div className="font-bold mb-2 border-b border-white/20 pb-1">Hours Breakdown</div>
            {parentTicket.technicalTime && <div>Dev: <span className="text-blue-300 font-bold">{parentTicket.technicalTime}</span></div>}
            {parentTicket.clientTime && <div>Client: <span className="text-green-300 font-bold">{parentTicket.clientTime}</span></div>}
            {parentTicket.functionalTime && <div>Test: <span className="text-purple-300 font-bold">{parentTicket.functionalTime}</span></div>}
            {parentTicket.webTime && <div>Test: <span className="text-purple-300 font-bold">{parentTicket.webTime}</span></div>}
            <div className="mt-2 pt-1 border-t border-white/10 text-xs opacity-75 text-right">
              Total: {parentTicket.Hours}
            </div>
          </div>,
          document.body
        )}

        {(parentTicket?.isCloseRequested || parentTicket?.isCloseRequested) && !isViewer && (
          <div
            className={`bg-red-50 border border-red-100 border-l-4 border-l-red-500 shadow-sm flex items-center justify-between w-full transition-all duration-300 ${isStuck
              ? "mt-2 px-3 py-1.5"
              : "mt-3 px-4 py-2.5"
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
                  className={`bg-white border border-red-200 text-red-700 font-extrabold uppercase tracking-wider shadow-sm transition-all ${isStuck ? "text-[9px] px-2.5 py-0.5 rounded-full" : "text-[10px] px-3 py-1 rounded-full"
                    }`}
                >
                  Action Required
                </span>
              </div>
            )}
          </div>
        )}

        {(parentTicket?.priorityRequest || parentTicket?.PriorityRequest) && !isViewer && (
          <div
            className={`bg-orange-50 border border-orange-100 border-l-4 border-l-orange-500 shadow-sm flex items-center justify-between w-full transition-all duration-300 ${isStuck
              ? "mt-2 px-3 py-1.5"
              : "mt-3 px-4 py-2.5 "
              }`}
          >
            <div className="flex items-center gap-3 truncate">
              <div className="relative flex h-3 w-3 flex-shrink-0 ml-1">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-orange-500"></span>
              </div>

              <div className="flex items-baseline gap-2 truncate">
                <h4
                  className={`text-orange-900 font-bold whitespace-nowrap transition-all ${isStuck ? "text-xs" : "text-sm"}`}
                >
                  Priority
                </h4>
                <span className="hidden sm:inline text-orange-300 text-sm">•</span>
                <p
                  className={`text-orange-700 truncate transition-all hidden sm:block ${isStuck ? "text-[11px]" : "text-xs"}`}
                >
                  Admin has notified that the work is in Priority.
                </p>
              </div>
            </div>

            {isOwner && (
              <div className="flex-shrink-0 ml-3">
                <span
                  className={`bg-white border border-orange-200 text-orange-700 font-extrabold uppercase tracking-wider shadow-sm transition-all ${isStuck
                    ? "text-[9px] px-2.5 py-0.5 rounded-full"
                    : "text-[10px] px-3 py-1 rounded-full"
                    }`}
                >
                  Review Required
                </span>
              </div>
            )}
          </div>
        )}

        {(parentTicket?.funcResponse || parentTicket?.FuncResponse) && !isViewer && (
          <div
            className={`bg-purple-50 border border-purple-100 border-l-4 border-l-purple-500 shadow-sm flex items-center justify-between w-full transition-all duration-300 ${isStuck
              ? "mt-2 px-3 py-1.5 "
              : "mt-3 px-4 py-2.5 "
              }`}
          >
            <div className="flex items-center gap-3 truncate">
              <div className="relative flex h-3 w-3 flex-shrink-0 ml-1">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-purple-500"></span>
              </div>

              <div className="flex items-baseline gap-2 truncate">
                <h4
                  className={`text-purple-900 font-bold whitespace-nowrap transition-all ${isStuck ? "text-xs" : "text-sm"}`}
                >
                  Awaiting Functional Response.
                </h4>
                <span className="hidden sm:inline text-purple-300 text-sm">•</span>
                <p
                  className={`text-purple-700 truncate transition-all hidden sm:block ${isStuck ? "text-[11px]" : "text-xs"}`}
                >
                  An assignee is waiting for response.
                </p>
              </div>
            </div>

            {isOwner && (
              <div className="flex-shrink-0 ml-3">
                <span
                  className={`bg-white border border-purple-200 text-purple-700 font-extrabold uppercase tracking-wider shadow-sm transition-all ${isStuck
                    ? "text-[9px] px-2.5 py-0.5 rounded-full"
                    : "text-[10px] px-3 py-1 rounded-full"
                    }`}
                >
                  Response Needed
                </span>
              </div>
            )}
          </div>
        )}

        {(parentTicket?.technicalResponse || parentTicket?.TechnicalResponse) && !isViewer && (
          <div
            className={`bg-green-50 border border-green-100 border-l-4 border-l-green-500 shadow-sm flex items-center justify-between w-full transition-all duration-300 ${isStuck
              ? "mt-2 px-3 py-1.5 "
              : "mt-3 px-4 py-2.5 "
              }`}
          >
            <div className="flex items-center gap-3 truncate">
              <div className="relative flex h-3 w-3 flex-shrink-0 ml-1">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
              </div>

              <div className="flex items-baseline gap-2 truncate">
                <h4
                  className={`text-green-900 font-bold whitespace-nowrap transition-all ${isStuck ? "text-xs" : "text-sm"}`}
                >
                  Awaiting Technical Response.
                </h4>
                <span className="hidden sm:inline text-green-300 text-sm">•</span>
                <p
                  className={`text-green-700 truncate transition-all hidden sm:block ${isStuck ? "text-[11px]" : "text-xs"}`}
                >
                  An assignee is waiting for response.
                </p>
              </div>
            </div>

            {isOwner && (
              <div className="flex-shrink-0 ml-3">
                <span
                  className={`bg-white border border-green-200 text-green-700 font-extrabold uppercase tracking-wider shadow-sm transition-all ${isStuck
                    ? "text-[9px] px-2.5 py-0.5 rounded-full"
                    : "text-[10px] px-3 py-1 rounded-full"
                    }`}
                >
                  Response Needed
                </span>
              </div>
            )}
          </div>
        )}

        {(parentTicket?.webResponse || parentTicket?.WebResponse) && !isViewer && (
          <div
            className={`bg-blue-50 border border-blue-100 border-l-4 border-l-blue-500 shadow-sm flex items-center justify-between w-full transition-all duration-300 ${isStuck
              ? "mt-2 px-3 py-1.5 "
              : "mt-3 px-4 py-2.5 "
              }`}
          >
            <div className="flex items-center gap-3 truncate">
              <div className="relative flex h-3 w-3 flex-shrink-0 ml-1">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
              </div>

              <div className="flex items-baseline gap-2 truncate">
                <h4
                  className={`text-blue-900 font-bold whitespace-nowrap transition-all ${isStuck ? "text-xs" : "text-sm"}`}
                >
                  Awaiting Web Response.
                </h4>
                <span className="hidden sm:inline text-blue-300 text-sm">•</span>
                <p
                  className={`text-blue-700 truncate transition-all hidden sm:block ${isStuck ? "text-[11px]" : "text-xs"}`}
                >
                  An assignee is waiting for response.
                </p>
              </div>
            </div>

            {isOwner && (
              <div className="flex-shrink-0 ml-3">
                <span
                  className={`bg-white border border-blue-200 text-blue-700 font-extrabold uppercase tracking-wider shadow-sm transition-all ${isStuck
                    ? "text-[9px] px-2.5 py-0.5 rounded-full"
                    : "text-[10px] px-3 py-1 rounded-full"
                    }`}
                >
                  Response Needed
                </span>
              </div>
            )}
          </div>
        )}

        {(parentTicket?.adminResponse || parentTicket?.AdminResponse) && !isViewer && (
          <div
            className={`bg-yellow-50 border border-yellow-100 border-l-4 border-l-yellow-500 shadow-sm flex items-center justify-between w-full transition-all duration-300 ${isStuck
              ? "mt-2 px-3 py-1.5 "
              : "mt-3 px-4 py-2.5 "
              }`}
          >
            <div className="flex items-center gap-3 truncate">
              <div className="relative flex h-3 w-3 flex-shrink-0 ml-1">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-yellow-500"></span>
              </div>

              <div className="flex items-baseline gap-2 truncate">
                <h4
                  className={`text-yellow-900 font-bold whitespace-nowrap transition-all ${isStuck ? "text-xs" : "text-sm"}`}
                >
                  Awaiting Admin Response.
                </h4>
                <span className="hidden sm:inline text-yellow-300 text-sm">•</span>
                <p
                  className={`text-yellow-700 truncate transition-all hidden sm:block ${isStuck ? "text-[11px]" : "text-xs"}`}
                >
                  An assignee is waiting for response.
                </p>
              </div>
            </div>

            {isOwner && (
              <div className="flex-shrink-0 ml-3">
                <span
                  className={`bg-white border border-yellow-200 text-yellow-700 font-extrabold uppercase tracking-wider shadow-sm transition-all ${isStuck
                    ? "text-[9px] px-2.5 py-0.5 rounded-full"
                    : "text-[10px] px-3 py-1 rounded-full"
                    }`}
                >
                  Response Needed
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="flex flex-col gap-8 mt-2 px-4 sm:px-6 relative">
        <div className="bg-gray-50 border border-gray-100 shadow-[0_4px_20px_rgb(0,0,0,0.03)] rounded-3xl p-6 text-sm text-gray-800 leading-relaxed">
          <HtmlRenderer html={parentTicket.HtmlDesc || parentTicket.description} />
        </div>
      </div>

      {/* History Modal Overlay remains unchanged */}
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
                groupedLogs &&
                Object.entries(groupedLogs).map(([assigneeId, data]) => {
                  const key = assigneeId || data.assigneeName || "unknown";
                  return (
                    <div
                      key={key}
                      className="flex flex-col gap-3 p-4 rounded-xl border border-gray-100 bg-white shadow-sm"
                    >
                      {/* ACTIVE LOG */}
                      <div className="flex justify-between items-start gap-4">
                        <div>
                          <div className="font-bold text-gray-800 text-sm">
                            {data.assigneeName}
                          </div>

                          <div className="text-gray-600 text-xs mt-1">
                            {data.activeLog?.StatusSummary || "No Summary"}
                          </div>

                          {/* DATE TIME */}
                          <div className="text-[11px] text-gray-400 mt-1">
                            {data.activeLog?.CreatedAt
                              ? dayjs(data.activeLog.CreatedAt).format("MMM D, YYYY h:mm A")
                              : ""}
                          </div>
                        </div>

                        <span className="text-xs font-bold px-2 py-1 bg-blue-50 text-blue-700 rounded-md">
                          {data.activeLog?.Percentage ?? 0}%
                        </span>
                      </div>

                      {/* FLAGS */}
                      <div className="flex flex-wrap gap-1">
                        {data.activeLog?.Flag?.split(",").map((flag, idx) => (
                          <span
                            key={idx}
                            className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${getFlagStyles(
                              flag.trim()
                            )}`}
                          >
                            {flag.trim()}
                          </span>
                        ))}
                      </div>

                      {/* TOGGLE HISTORY */}
                      {data.history.length > 0 && (
                        <button
                          onClick={() => toggleAssignee(String(assigneeId))}
                          className="text-xs text-blue-600 font-semibold self-start"
                        >
                          {expandedAssignees[String(assigneeId)]
                            ? "Hide Previous"
                            : `Show Previous (${data.history.length})`}
                        </button>
                      )}

                      {/* HISTORY */}
                      {expandedAssignees[assigneeId] && data.history.length > 0 && (
                        <div className="border-t pt-2 mt-2 space-y-2">
                          {data.history.map((log) => (
                            <div
                              key={log.LogId}
                              className="text-xs text-gray-600 border-l-2 pl-3 border-gray-200"
                            >
                              <div className="flex justify-between gap-3">
                                <div className="flex-1">
                                  <div>{log.StatusSummary}</div>

                                  {/* DATE TIME */}
                                  <div className="text-[10px] text-gray-400 mt-1">
                                    {log.CreatedAt
                                      ? dayjs(log.CreatedAt).format("MMM D, YYYY h:mm A")
                                      : ""}
                                  </div>
                                </div>

                                <span className="text-gray-400 whitespace-nowrap">
                                  {log.Percentage}%
                                </span>
                              </div>

                              <div className="flex gap-1 mt-1 flex-wrap">
                                {log.Flag?.split(",").map((f, i) => (
                                  <span
                                    key={i}
                                    className="text-[10px] bg-gray-100 px-2 rounded"
                                  >
                                    {f.trim()}
                                  </span>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })
              ) : (
                <div className="text-gray-500 text-center py-6">No history available</div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ParentTicketHeader;