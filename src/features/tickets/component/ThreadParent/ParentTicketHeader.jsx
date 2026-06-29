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

const getAbbreviation = (text) => {
  if (!text) return "";
  if (text.length <= 3) return text.toUpperCase();
  return text
    .split(/\s+/)
    .map(word => word[0])
    .join("")
    .toUpperCase();
};

const getInitials = (name) => {
  if (!name) return "";
  return name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
};

const hexToRgba = (hex, alpha = 1) => {
  if (!hex) return "";
  let cleanHex = hex.replace("#", "");
  if (cleanHex.length === 3) {
    cleanHex = cleanHex.split("").map(c => c + c).join("");
  }
  const num = parseInt(cleanHex, 16);
  const r = (num >> 16) & 255;
  const g = (num >> 8) & 255;
  const b = num & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
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
  const getStatusStyle = (StatusId) => {
    switch (StatusId) {
      case 15: return { label: "Closed", color: "text-red-600" };
      case 18: return { label: "In Queue", color: " text-yellow-800" };
      case 14: return { label: "On Hold", color: "text-orange-800" };
      default: return null;
    }
  };

  return (
    <>
      <div
        ref={sentinelRef}
        className="absolute top-0 h-[1px] w-full invisible"
      />

      <div
        className={`sticky top-0 z-30 w-full transition-all duration-300 ${isStuck
          ? "py-2 px-4 sm:px-6 bg-white/95 backdrop-blur-xl border-b border-gray-200/80 shadow-md shadow-gray-100/50"
          : "py-3 px-4 sm:px-6 bg-white border-b border-gray-100"
          }`}
      >
        {/* ROW 1: Code, Title, Labels, Due, Edit with space-between and GitHub-style inline wrap */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-x-6 gap-y-2.5 w-full">
          {/* Left Block: Ticket key, title, labels, status (flow inline) */}
          <div className="flex-1 min-w-0">
            <span className="inline-flex items-center align-middle bg-gray-100 text-gray-800 text-xs font-extrabold px-2 py-0.5 rounded border border-gray-200 shadow-xs uppercase tracking-wider mr-2.5 mb-0.5">
              #{parentTicket.ticketKey}
            </span>

            <div className="inline align-middle">
              <h1 className="text-base sm:text-lg text-gray-900 font-extrabold tracking-tight leading-snug break-words inline mr-2" title={parentTicket.title}>
                {parentTicket.title}
              </h1>

              {parentTicket?.label?.length > 0 && (
                <span className="inline-flex flex-wrap gap-1 align-middle mr-2">
                  {parentTicket.label.map((label) => (
                    <span
                      key={label.LABEL_ID}
                      className="inline-flex items-center justify-center text-[10px] h-5 px-2.5 rounded-full font-medium border capitalize whitespace-nowrap align-middle"
                      style={{
                        backgroundColor: hexToRgba(label.LABEL_COLOR, 0.1),
                        color: label.LABEL_COLOR,
                        borderColor: hexToRgba(label.LABEL_COLOR, 0.3),
                      }}
                    >
                      {label.LABEL_TITLE}
                    </span>
                  ))}
                </span>
              )}

              {(() => {
                const Status = getStatusStyle(parentTicket.statusId);
                return Status ? (
                  <span className={`inline-flex align-middle text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded border whitespace-nowrap ${parentTicket.statusId === 15 ? "bg-red-50 text-red-700 border-red-200" :
                    parentTicket.statusId === 18 ? "bg-yellow-50 text-yellow-800 border-yellow-200" :
                      "bg-orange-50 text-orange-850 border-orange-200"
                    }`}>
                    {Status.label}
                  </span>
                ) : null;
              })()}
            </div>
          </div>

          {/* Right Block: Due Date and Edit */}
          <div className="flex items-center gap-2 flex-shrink-0 self-start sm:self-auto mt-0.5">
            {!isViewer && (
              <div className="inline-flex items-center gap-1 bg-white border border-gray-200 shadow-xs px-2 py-0.5 rounded text-[11px] text-gray-600">
                <FaCalendarAlt className="text-[#4b7ed6]" size={11} />
                <span className="font-bold text-gray-800 whitespace-nowrap">
                  Due: {formatDate(parentTicket.dueDate)}
                </span>
              </div>
            )}

            <button
              onClick={() =>
                goTo(ROUTE_KEYS.TICKET_EDIT, {
                  ticketId: parentTicket.navId,
                })
              }
              className="text-gray-400 hover:text-[#4b7ed6] p-1 rounded hover:bg-gray-50 transition-colors"
              title="Edit Ticket"
            >
              <FaEdit size={13} />
            </button>
          </div>
        </div>

        {/* ROW 2: (repo, project, creator, owner) + status pill + time metrics */}
        <div className="flex flex-wrap lg:flex-nowrap items-center justify-between w-full gap-3 mt-2">
          {/* Metadata Row */}
          <div className="flex items-center gap-2 flex-wrap text-xs text-gray-500 font-medium">
            <span className="text-[#4b7ed6] font-bold tracking-wide uppercase">{getAbbreviation(parentTicket.repoName)}</span>
            <span className="opacity-40">•</span>
            <span className="text-[#4b7ed6] font-bold tracking-wide uppercase">{getAbbreviation(parentTicket.projectName)}</span>
            <span className="opacity-40">•</span>
            <span className="inline-flex items-center gap-1">
              Created {dayjs(parentTicket.createdAt).fromNow()} by
              <div
                className="w-5 h-5 rounded-full bg-gray-100 border border-gray-300 text-gray-600 flex items-center justify-center text-[9px] font-black shadow-xs cursor-help"
                title={`Creator: ${parentTicket.ticketCreater || parentTicket.createdBy || "System"}`}
              >
                {getInitials(parentTicket.ticketCreater || parentTicket.createdBy || "System")}
              </div>
            </span>
            {mainAssignee && (
              <>
                <span className="opacity-40">•</span>
                <span>Owner: <strong className="text-gray-700 font-semibold">{mainAssignee.Assignee_Name}</strong></span>
              </>
            )}
          </div>

          {/* Status & Time section */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Status Pill */}
            {(statusSummary || overallPct > 0) && !isViewer && (
              <div className="flex items-center gap-2.5 bg-white border border-gray-200 rounded-lg px-2.5 h-9 shadow-xs transition-all hover:border-[#4b7ed6]/30 flex-shrink-0">
                <div className="flex flex-col justify-center">
                  <span className="text-[8px] font-extrabold text-[#4b7ed6] uppercase tracking-widest leading-none mb-0.5">
                    Status
                  </span>
                  <span className="text-gray-900 font-bold text-xs max-w-[180px] sm:max-w-[260px] truncate leading-none" title={statusSummary}>
                    {statusSummary || "In Progress"}
                  </span>
                </div>

                <div className="flex flex-col items-end justify-center gap-0.5 pl-2 border-l border-gray-100">
                  <span className="text-[10px] font-black text-gray-800 leading-none">
                    {overallPct}%
                  </span>
                  <div className="w-12 sm:w-16 bg-gray-100 rounded-full h-1 overflow-hidden">
                    <div className="bg-gradient-to-r from-[#4b7ed6] to-[#6c9ef2] h-full rounded-full transition-all duration-500" style={{ width: `${overallPct}%` }} />
                  </div>
                </div>

                <div className="w-px h-5 bg-gray-200 mx-0.5"></div>

                <div className="flex items-center gap-1">
                  <button onClick={() => setShowHistoryModal(true)} className="text-gray-400 hover:text-[#4b7ed6] transition-colors p-1 hover:bg-gray-50 rounded" title="View Full History">
                    <FaHistory size={11} />
                  </button>
                  <button onClick={handleScrollToUpdate} className="text-gray-400 hover:text-[#4b7ed6] transition-colors p-1 hover:bg-gray-50 rounded" title="Add New Status Update">
                    <FaPlus size={11} />
                  </button>
                </div>
              </div>
            )}

            {/* Time Stats */}
            {!isViewer && (
              <div className="flex items-center gap-3 text-xs font-semibold bg-white border border-gray-200 shadow-xs rounded-lg px-2.5 h-9 overflow-x-auto wg-scrollbar flex-shrink-0">

                <div className="flex items-center gap-1.5 px-1.5 py-0.5 rounded hover:bg-white transition-all duration-200">
                  <div className="flex flex-col items-center">
                    <span className="text-[7.5px] text-gray-400 uppercase tracking-widest font-black leading-none mb-0.5">
                      EST
                    </span>
                    <span
                      className="text-gray-800 font-bold leading-none cursor-help relative"
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
                </div>

                <div className="w-px h-5 bg-gray-200 flex-shrink-0"></div>

                <div className="flex items-center gap-1.5 px-1.5 py-0.5 rounded hover:bg-white transition-all duration-200">
                  <div className="flex flex-col items-center">
                    <span className="text-[7.5px] text-gray-400 uppercase tracking-widest font-black leading-none mb-0.5">
                      LOG
                    </span>
                    <span className="text-[#4b7ed6] font-bold leading-none">
                      {timeStats.total}
                    </span>
                  </div>
                </div>

                <div className="w-px h-5 bg-gray-200 flex-shrink-0"></div>

                <div className="flex items-center gap-1.5 px-1.5 py-0.5 rounded hover:bg-white transition-all duration-200">
                  <div className="flex flex-col items-center">
                    <span className="text-[7.5px] text-gray-400 uppercase tracking-widest font-black leading-none mb-0.5">
                      MINE
                    </span>
                    <span className="text-[#ffb300] font-bold leading-none">
                      {timeStats.mine}
                    </span>
                  </div>
                </div>

                {Object.entries(teamTimeStats).map(
                  ([teamName, logged], index) => (
                    <React.Fragment key={`frag-${index}`}>
                      <div className="w-px h-5 bg-gray-200 flex-shrink-0" />
                      <div className="flex items-center px-1.5 py-0.5 rounded hover:bg-white transition-all duration-200 flex-shrink-0">
                        <div className="flex flex-col items-center">
                          <span className="text-[7.5px] text-gray-400 uppercase tracking-widest font-black leading-none mb-0.5">
                            {teamName}
                          </span>
                          <span
                            className="px-1.5 py-0.5 rounded-full text-white font-bold text-[9px] leading-none shadow-xs uppercase tracking-wider"
                            style={{ backgroundColor: getTeamColor(teamName) }}
                          >
                            {logged}
                          </span>
                        </div>
                      </div>
                    </React.Fragment>
                  )
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

        {!isViewer && (
          parentTicket?.isCloseRequested ||
          parentTicket?.priorityRequest || parentTicket?.PriorityRequest ||
          parentTicket?.funcResponse || parentTicket?.FuncResponse ||
          parentTicket?.technicalResponse || parentTicket?.TechnicalResponse ||
          parentTicket?.webResponse || parentTicket?.WebResponse ||
          parentTicket?.adminResponse || parentTicket?.AdminResponse
        ) && (
          <div className="flex flex-wrap gap-2.5 mt-3 w-full animate-in fade-in slide-in-from-top-1 duration-300">
            {/* Close Request Chip */}
            {parentTicket?.isCloseRequested && (
              <div className="relative group/tooltip">
                <div
                  className={`bg-rose-50/70 border border-rose-200/60 text-rose-900 rounded-full flex items-center justify-between transition-all duration-300 shadow-2xs hover:bg-rose-50 hover:-translate-y-0.5 hover:shadow-xs cursor-help ${
                    isStuck ? "px-2 py-0.5" : "px-3 py-1"
                  }`}
                >
                  <div className="flex items-center gap-1.5 truncate">
                    <div className="relative flex h-2 w-2 flex-shrink-0">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
                    </div>
                    <span className="text-[11px] font-bold tracking-wide whitespace-nowrap">Closure Requested</span>
                    {isOwner && (
                      <span className={`bg-white border border-rose-200 text-rose-700 font-extrabold uppercase tracking-wider shadow-3xs ml-1 leading-none text-[8px] px-1.5 py-0.5 rounded-full whitespace-nowrap`}>
                        Action Required
                      </span>
                    )}
                  </div>
                </div>

                {/* Custom Tooltip */}
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2.5 w-72 bg-gradient-to-r from-slate-900 to-slate-800 text-white text-xs rounded-xl p-3 shadow-xl border border-white/10 backdrop-blur-xl opacity-0 invisible group-hover/tooltip:opacity-100 group-hover/tooltip:visible transition-all duration-200 z-50 pointer-events-none">
                  <div className="font-bold text-rose-400 mb-1 text-[11px] tracking-wide">Ticket Closure Requested</div>
                  <div className="text-slate-200 leading-normal font-normal text-[11px]">
                    An assignee has notified that the work is complete.
                  </div>
                  {isOwner && (
                    <div className="mt-2 pt-1.5 border-t border-white/10 text-[10px] text-rose-300 font-bold flex items-center justify-between">
                      <span>Owner Action:</span>
                      <span className="bg-rose-500/20 border border-rose-500/30 px-1.5 py-0.5 rounded text-white text-[9px] font-bold">
                        Action Required
                      </span>
                    </div>
                  )}
                  {/* Tooltip Arrow */}
                  <div className="absolute top-full left-1/2 -translate-x-1/2 w-2 h-2 bg-slate-850 rotate-45 -mt-1 border-r border-b border-white/10"></div>
                </div>
              </div>
            )}

            {/* Priority Chip */}
            {(parentTicket?.priorityRequest || parentTicket?.PriorityRequest) && (
              <div className="relative group/tooltip">
                <div
                  className={`bg-orange-50/70 border border-orange-200/60 text-orange-900 rounded-full flex items-center justify-between transition-all duration-300 shadow-2xs hover:bg-orange-50 hover:-translate-y-0.5 hover:shadow-xs cursor-help ${
                    isStuck ? "px-2 py-0.5" : "px-3 py-1"
                  }`}
                >
                  <div className="flex items-center gap-1.5 truncate">
                    <div className="relative flex h-2 w-2 flex-shrink-0">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500"></span>
                    </div>
                    <span className="text-[11px] font-bold tracking-wide whitespace-nowrap">Priority</span>
                    {isOwner && (
                      <span className={`bg-white border border-orange-200 text-orange-700 font-extrabold uppercase tracking-wider shadow-3xs ml-1 leading-none text-[8px] px-1.5 py-0.5 rounded-full whitespace-nowrap`}>
                        Review Required
                      </span>
                    )}
                  </div>
                </div>

                {/* Custom Tooltip */}
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2.5 w-72 bg-gradient-to-r from-slate-900 to-slate-800 text-white text-xs rounded-xl p-3 shadow-xl border border-white/10 backdrop-blur-xl opacity-0 invisible group-hover/tooltip:opacity-100 group-hover/tooltip:visible transition-all duration-200 z-50 pointer-events-none">
                  <div className="font-bold text-orange-400 mb-1 text-[11px] tracking-wide">Priority Ticket</div>
                  <div className="text-slate-200 leading-normal font-normal text-[11px]">
                    Admin has notified that the work is in Priority.
                  </div>
                  {isOwner && (
                    <div className="mt-2 pt-1.5 border-t border-white/10 text-[10px] text-orange-300 font-bold flex items-center justify-between">
                      <span>Owner Action:</span>
                      <span className="bg-orange-500/20 border border-orange-500/30 px-1.5 py-0.5 rounded text-white text-[9px] font-bold">
                        Review Required
                      </span>
                    </div>
                  )}
                  {/* Tooltip Arrow */}
                  <div className="absolute top-full left-1/2 -translate-x-1/2 w-2 h-2 bg-slate-850 rotate-45 -mt-1 border-r border-b border-white/10"></div>
                </div>
              </div>
            )}

            {/* Functional Response Chip */}
            {(parentTicket?.funcResponse || parentTicket?.FuncResponse) && (
              <div className="relative group/tooltip">
                <div
                  className={`bg-purple-50/70 border border-purple-200/60 text-purple-900 rounded-full flex items-center justify-between transition-all duration-300 shadow-2xs hover:bg-purple-50 hover:-translate-y-0.5 hover:shadow-xs cursor-help ${
                    isStuck ? "px-2 py-0.5" : "px-3 py-1"
                  }`}
                >
                  <div className="flex items-center gap-1.5 truncate">
                    <div className="relative flex h-2 w-2 flex-shrink-0">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-purple-500"></span>
                    </div>
                    <span className="text-[11px] font-bold tracking-wide whitespace-nowrap">Awaiting Functional Response</span>
                    {isOwner && (
                      <span className={`bg-white border border-purple-200 text-purple-700 font-extrabold uppercase tracking-wider shadow-3xs ml-1 leading-none text-[8px] px-1.5 py-0.5 rounded-full whitespace-nowrap`}>
                        Response Needed
                      </span>
                    )}
                  </div>
                </div>

                {/* Custom Tooltip */}
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2.5 w-72 bg-gradient-to-r from-slate-900 to-slate-800 text-white text-xs rounded-xl p-3 shadow-xl border border-white/10 backdrop-blur-xl opacity-0 invisible group-hover/tooltip:opacity-100 group-hover/tooltip:visible transition-all duration-200 z-50 pointer-events-none">
                  <div className="font-bold text-purple-400 mb-1 text-[11px] tracking-wide">Awaiting Functional Response</div>
                  <div className="text-slate-200 leading-normal font-normal text-[11px]">
                    An assignee is waiting for response.
                  </div>
                  {isOwner && (
                    <div className="mt-2 pt-1.5 border-t border-white/10 text-[10px] text-purple-300 font-bold flex items-center justify-between">
                      <span>Owner Action:</span>
                      <span className="bg-purple-500/20 border border-purple-500/30 px-1.5 py-0.5 rounded text-white text-[9px] font-bold">
                        Response Needed
                      </span>
                    </div>
                  )}
                  {/* Tooltip Arrow */}
                  <div className="absolute top-full left-1/2 -translate-x-1/2 w-2 h-2 bg-slate-850 rotate-45 -mt-1 border-r border-b border-white/10"></div>
                </div>
              </div>
            )}

            {/* Technical Response Chip */}
            {(parentTicket?.technicalResponse || parentTicket?.TechnicalResponse) && (
              <div className="relative group/tooltip">
                <div
                  className={`bg-green-50/70 border border-green-200/60 text-green-900 rounded-full flex items-center justify-between transition-all duration-300 shadow-2xs hover:bg-green-50 hover:-translate-y-0.5 hover:shadow-xs cursor-help ${
                    isStuck ? "px-2 py-0.5" : "px-3 py-1"
                  }`}
                >
                  <div className="flex items-center gap-1.5 truncate">
                    <div className="relative flex h-2 w-2 flex-shrink-0">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                    </div>
                    <span className="text-[11px] font-bold tracking-wide whitespace-nowrap">Awaiting Technical Response</span>
                    {isOwner && (
                      <span className={`bg-white border border-green-200 text-green-700 font-extrabold uppercase tracking-wider shadow-3xs ml-1 leading-none text-[8px] px-1.5 py-0.5 rounded-full whitespace-nowrap`}>
                        Response Needed
                      </span>
                    )}
                  </div>
                </div>

                {/* Custom Tooltip */}
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2.5 w-72 bg-gradient-to-r from-slate-900 to-slate-800 text-white text-xs rounded-xl p-3 shadow-xl border border-white/10 backdrop-blur-xl opacity-0 invisible group-hover/tooltip:opacity-100 group-hover/tooltip:visible transition-all duration-200 z-50 pointer-events-none">
                  <div className="font-bold text-green-400 mb-1 text-[11px] tracking-wide">Awaiting Technical Response</div>
                  <div className="text-slate-200 leading-normal font-normal text-[11px]">
                    An assignee is waiting for response.
                  </div>
                  {isOwner && (
                    <div className="mt-2 pt-1.5 border-t border-white/10 text-[10px] text-green-300 font-bold flex items-center justify-between">
                      <span>Owner Action:</span>
                      <span className="bg-green-500/20 border border-green-500/30 px-1.5 py-0.5 rounded text-white text-[9px] font-bold">
                        Response Needed
                      </span>
                    </div>
                  )}
                  {/* Tooltip Arrow */}
                  <div className="absolute top-full left-1/2 -translate-x-1/2 w-2 h-2 bg-slate-850 rotate-45 -mt-1 border-r border-b border-white/10"></div>
                </div>
              </div>
            )}

            {/* Web Response Chip */}
            {(parentTicket?.webResponse || parentTicket?.WebResponse) && (
              <div className="relative group/tooltip">
                <div
                  className={`bg-blue-50/70 border border-blue-200/60 text-blue-900 rounded-full flex items-center justify-between transition-all duration-300 shadow-2xs hover:bg-blue-50 hover:-translate-y-0.5 hover:shadow-xs cursor-help ${
                    isStuck ? "px-2 py-0.5" : "px-3 py-1"
                  }`}
                >
                  <div className="flex items-center gap-1.5 truncate">
                    <div className="relative flex h-2 w-2 flex-shrink-0">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                    </div>
                    <span className="text-[11px] font-bold tracking-wide whitespace-nowrap">Awaiting Web Response</span>
                    {isOwner && (
                      <span className={`bg-white border border-blue-200 text-blue-700 font-extrabold uppercase tracking-wider shadow-3xs ml-1 leading-none text-[8px] px-1.5 py-0.5 rounded-full whitespace-nowrap`}>
                        Response Needed
                      </span>
                    )}
                  </div>
                </div>

                {/* Custom Tooltip */}
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2.5 w-72 bg-gradient-to-r from-slate-900 to-slate-800 text-white text-xs rounded-xl p-3 shadow-xl border border-white/10 backdrop-blur-xl opacity-0 invisible group-hover/tooltip:opacity-100 group-hover/tooltip:visible transition-all duration-200 z-50 pointer-events-none">
                  <div className="font-bold text-blue-400 mb-1 text-[11px] tracking-wide">Awaiting Web Response</div>
                  <div className="text-slate-200 leading-normal font-normal text-[11px]">
                    An assignee is waiting for response.
                  </div>
                  {isOwner && (
                    <div className="mt-2 pt-1.5 border-t border-white/10 text-[10px] text-blue-300 font-bold flex items-center justify-between">
                      <span>Owner Action:</span>
                      <span className="bg-blue-500/20 border border-blue-500/30 px-1.5 py-0.5 rounded text-white text-[9px] font-bold">
                        Response Needed
                      </span>
                    </div>
                  )}
                  {/* Tooltip Arrow */}
                  <div className="absolute top-full left-1/2 -translate-x-1/2 w-2 h-2 bg-slate-850 rotate-45 -mt-1 border-r border-b border-white/10"></div>
                </div>
              </div>
            )}

            {/* Admin Response Chip */}
            {(parentTicket?.adminResponse || parentTicket?.AdminResponse) && (
              <div className="relative group/tooltip">
                <div
                  className={`bg-amber-50/70 border border-amber-200/60 text-amber-900 rounded-full flex items-center justify-between transition-all duration-300 shadow-2xs hover:bg-amber-50 hover:-translate-y-0.5 hover:shadow-xs cursor-help ${
                    isStuck ? "px-2 py-0.5" : "px-3 py-1"
                  }`}
                >
                  <div className="flex items-center gap-1.5 truncate">
                    <div className="relative flex h-2 w-2 flex-shrink-0">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                    </div>
                    <span className="text-[11px] font-bold tracking-wide whitespace-nowrap">Awaiting Admin Response</span>
                    {isOwner && (
                      <span className={`bg-white border border-amber-200 text-amber-700 font-extrabold uppercase tracking-wider shadow-3xs ml-1 leading-none text-[8px] px-1.5 py-0.5 rounded-full whitespace-nowrap`}>
                        Response Needed
                      </span>
                    )}
                  </div>
                </div>

                {/* Custom Tooltip */}
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2.5 w-72 bg-gradient-to-r from-slate-900 to-slate-800 text-white text-xs rounded-xl p-3 shadow-xl border border-white/10 backdrop-blur-xl opacity-0 invisible group-hover/tooltip:opacity-100 group-hover/tooltip:visible transition-all duration-200 z-50 pointer-events-none">
                  <div className="font-bold mb-1 text-[11px] tracking-wide text-amber-500">Awaiting Admin Response</div>
                  <div className="text-slate-200 leading-normal font-normal text-[11px]">
                    An assignee is waiting for response.
                  </div>
                  {isOwner && (
                    <div className="mt-2 pt-1.5 border-t border-white/10 text-[10px] text-amber-400 font-bold flex items-center justify-between">
                      <span>Owner Action:</span>
                      <span className="bg-amber-500/20 border border-amber-500/30 px-1.5 py-0.5 rounded text-white text-[9px] font-bold">
                        Response Needed
                      </span>
                    </div>
                  )}
                  {/* Tooltip Arrow */}
                  <div className="absolute top-full left-1/2 -translate-x-1/2 w-2 h-2 bg-slate-850 rotate-45 -mt-1 border-r border-b border-white/10"></div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="px-4 sm:px-6">
        <div className="border-t border-gray-100/70 pt-2.5">
          <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-1">
            Description
          </span>
          <div className="prose prose-sm max-w-none text-gray-700 font-normal leading-relaxed text-[12px]">
            <HtmlRenderer html={parentTicket.HtmlDesc || parentTicket.description} />
          </div>
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