import React from "react";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { GoIssueOpened, GoIssueClosed, GoIssueReopened } from "react-icons/go";
import { Tooltip } from "@mui/material";
import "../css/TicketListCard.css";
import BatteryCompletionIndicator from "../../../app/shared/Component/BatteryCompletionIndicator/BatteryCompletionIndicator";
import { FiCalendar, FiClock, FiMessageSquare, FiX } from "react-icons/fi";
import { ROUTE_KEYS } from "../../../core/routing/paths";
import { tryBuildPath } from "../../../core/routing/routeRegistry";
import { useState } from "react";
import {
  getDueStatus,
  getInitials,
  getLabelStyle,
  HighlightText,
} from "../../../app/shared/utilities/utilities";
import {
  useEmployeeById,
  useProjectById,
} from "../../../core/master/selectors/selectors";
import { useList } from "../../../packages/ui-List/context/ListContext";
import { parseQuery } from "../../../packages/ui-List/hooks/useQueryParser";
import { useCallback } from "react";
import EntityFormPage from "../../../packages/crud/pages/EntityFormPage";
import { ThreadFormConfig } from "../config/ThreadForm.config";
import { ThreadFieldConfig } from "../config/Thread.config";
import { FaHistory } from "react-icons/fa";
import { HiPause } from "react-icons/hi";
import { useCurrentUser } from "../../../core/auth/useCurrentUser";
import { useNavigate } from "react-router-dom";
import { useSmartNavigation } from "../../../core/navigation/useSmartNavigation";

dayjs.extend(relativeTime);

export default function TicketListCard({
  item,
  controls,
  focused,
  config,
  quickCommentButton,
}) {
  const { goTo } = useSmartNavigation();
  const [isCommentExpanded, setIsCommentExpanded] = useState(false);
  const ProjectDetails = useProjectById(item?.project);
  const [quickFormTicket, setQuickFormTicket] = useState(null);
  const [quickTicketStatus, setQuickTicketStatus] = useState(null);
  const isQuickFormOpen = quickFormTicket?.navId === item.navId;
  const isQuickStatusOpen = quickTicketStatus?.navId === item.navId;
  const { isViewer } = useCurrentUser();
  const updated = useEmployeeById(item.updatedBy);
  const { query } = useList();
  const { text } = parseQuery(query);
  const mainAssignee = item.multiAssignees?.find(
    (a) => a.Assignee_Type === "Main Assignee",
  );

  const uniqueAssignees = Array.from(
    new Map(
      (item.multiAssignees || [])
        .filter((a) => a.Assignee_Type !== "Main Assignee")
        .map((a) => [a.Assignee_Id, a]),
    ).values(),
  );
  const { renderCheckbox, renderEdit, disabled } = controls || {};
  const activeStatus = [15, 16, 17];
  const isCloseRequested = item.isCloseRequested;
  const isPriorityRequested = item.priorityRequest;
  const funcResponseRequested = item.funcResponse;
  const technicalResponseRequested = item.technicalResponse;
  const webResponseRequested = item.webResponse;
  const adminResponseRequested = item.adminResponse;
  const rowTooltip = (
    <div className="flex flex-col gap-1 text-sm">
      {item.commenttext && (
        <span className="text-black">Status: {item.commenttext}</span>
      )}
      {isCloseRequested && (
        <span className="text-red-500 font-medium">• Close Requested</span>
      )}
      {isPriorityRequested && (
        <span className="text-orange-500 font-medium">
          • Priority Requested
        </span>
      )}
      {funcResponseRequested && (
        <span className="text-purple-500 font-medium">
          • Awaiting Functional Response
        </span>
      )}
      {technicalResponseRequested && (
        <span className="text-green-500 font-medium">
          • Awaiting Technical Response
        </span>
      )}
      {webResponseRequested && (
        <span className="text-blue-500 font-medium">
          • Awaiting Web Response
        </span>
      )}
      {adminResponseRequested && (
        <span className="text-yellow-500 font-medium">
          • Awaiting Admin Response
        </span>
      )}
      {activeStatus.includes(item.statusId) && (
        <span className="text-gray-500 font-medium">• Closed Ticket</span>
      )}
    </div>
  );

  let statusIcon;
  if (item.reopenedBy) {
    statusIcon = (
      <GoIssueReopened
        className="status-icon text-orange-500"
        title="Reopened Ticket"
      />
    );
  } else if (activeStatus.includes(item.statusId)) {
    statusIcon = <GoIssueClosed className="status-icon status-closed" />;
  } else if (item.statusId === 14) {
    statusIcon = (
      <HiPause className="status-icon text-yellow-500" title="On Hold" />
    );
  } else {
    statusIcon = <GoIssueOpened className="status-icon status-open" />;
  }

  const dueStatus = getDueStatus(item.dueDate);

  // Placeholders for your new data properties
  const department = item.department || "Development"; // Replace with your logic
  const priority = item.priority || "Medium"; // Replace with your logic
  const openInNewTab = (url) => {
    const newTab = window.open(url, "_blank");
    if (newTab) {
      newTab.opener = null;
    }
  };

  const createRouteKey = ROUTE_KEYS.TICKET_DETAIL;
  const ticketUrl = tryBuildPath(createRouteKey, { ticketId: item.navId });
  const closeQuickForm = useCallback(() => {
    setQuickFormTicket(null);
    setQuickTicketStatus(null);
  });
  const handleQuickComment = (item) => {
    setQuickFormTicket(item);
  };
  return (
    <>
      <Tooltip
        title={!isViewer ? rowTooltip : ""}
        arrow
        componentsProps={{
          tooltip: {
            sx: {
              bgcolor: "background.paper", // Makes it white (or your theme's paper color)
              color: "text.primary", // Default dark text color
              boxShadow: 2, // Adds a nice drop shadow so it doesn't blend into the page
              fontSize: "13px",
            },
          },
          arrow: {
            sx: {
              color: "background.paper", // Makes the little arrow match the white background
            },
          },
        }}
      >
        <div
          key={item.id}
          className={`ticket-row ${focused ? "focused-row" : ""}`}
        >
          {/* LEFT BLOCK: Main Information */}
          <div className="ticket-main">
            {/* Row 1: Status, ID, Title, Labels, Department */}
            <div className="ticket-title-wrapper">
              {/* 1. Icon & Checkbox stay locked to the left */}
              <div className="ticket-controls">
                {/* {renderCheckbox && renderCheckbox()} */}
                {disabled ? (
                  <Tooltip title="Already Committed" placement="top" arrow>
                    <div className="cursor-not-allowed opacity-60">
                      {/* pointer-events-none ensures the tooltip triggers on the wrapper, not the disabled input */}
                      <div className="pointer-events-none">
                        {renderCheckbox && renderCheckbox()}
                      </div>
                    </div>
                  </Tooltip>
                ) : (
                  renderCheckbox && renderCheckbox()
                )}
                {statusIcon}
              </div>

              {/* 2. Text and Badges flow together in ONE paragraph-like container */}
              <div className="ticket-title-and-badges">
                <a
                  href={ticketUrl}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    openInNewTab(ticketUrl);
                  }}
                >
                  <span className="ticket-id">#{item.ticketKey}</span>
                  <span className="ticket-title" title={item.title}>
                    <HighlightText text={item.title} highlight={text} />
                  </span>
                </a>
                {/* Badges immediately follow the text */}
                {item.label?.length > 0 &&
                  item.label.map((label) => (
                    <span
                      key={label.LABEL_ID}
                      className="ticket-label badge"
                      // style={getLabelStyle(label.LABEL_COLOR)}
                      style={{
                        ...getLabelStyle(label.LABEL_COLOR),
                        marginLeft: "5px",
                      }}
                    >
                      {label.LABEL_TITLE}
                    </span>
                  ))}

                {/* Department Badge */}
                {/* {department && (
                <span className="department-badge badge">{department}</span>
              )} */}
              </div>
            </div>

            {/* Row 2: Project Info, Assignees, Priority */}
            <div className="ticket-meta-row">
              {ProjectDetails && (
                <div className="ticket-repo-info">
                  <Tooltip title={ProjectDetails.repoName} arrow>
                    <span className="repo-key">
                      {ProjectDetails?.repoName
                        ?.split(" ")
                        .map((word) => word[0]?.toUpperCase())
                        .join("")}
                    </span>
                  </Tooltip>
                  <span className="meta-divider">•</span>
                  <Tooltip title={ProjectDetails.name} arrow>
                    <span className="project-key">
                      {/* {ProjectDetails.name.split(" ").length > 2
                        ? ProjectDetails.name.split(" ").slice(0, 2).join(" ") +
                        "..."
                        : ProjectDetails.name} */}
                      {ProjectDetails.name
                        ?.split(" ")
                        .map((word) => word[0]?.toUpperCase())
                        .join("")}
                    </span>
                  </Tooltip>
                  <span className="meta-divider">•</span>
                  <Tooltip
                    title={dayjs(item.createdAt).format("YYYY-MM-DD")}
                    arrow
                  >
                    <span className="created-key">
                      Created {dayjs(item.createdAt).fromNow()}
                    </span>
                  </Tooltip>

                  {!item.isViewer && item.ticketCreater && (
                    <span className="flex items-center gap-1.5 ml-1">
                      <span className="meta-divider text-gray-400">•</span>
                      <Tooltip title={item.ticketCreater} arrow>
                        <div className="flex items-center justify-center w-5 h-5 rounded-full bg-gray-100 border border-gray-200 text-[10px] font-bold text-gray-600 shadow-sm cursor-help">
                          {getInitials(item.ticketCreater)}
                        </div>
                      </Tooltip>
                    </span>
                  )}
                </div>
              )}
              {!isViewer && (
                <>
                  <>
                    <div className="ticket-repo-info">
                      {mainAssignee && (
                        <span>Owner: {mainAssignee.Assignee_Name}</span>
                      )}
                    </div>
                  </>
                  {/* Assignees Avatars */}
                  <div className="ticket-assignees">
                    {uniqueAssignees.slice(0, 3).map((a) => (
                      <Tooltip
                        key={a.Assignee_Id}
                        title={a.Assignee_Name}
                        arrow
                      >
                        <div className="avatar">
                          {getInitials(a.Assignee_Name)}
                        </div>
                      </Tooltip>
                    ))}
                    {uniqueAssignees.length > 3 && (
                      <div className="avatar avatar-more">
                        +{item.multiAssignees.length - 3}
                      </div>
                    )}
                  </div>
                </>
              )}
              {/* Priority Label */}
              {priority && (
                <span
                  className={`priority-badge priority-${priority.toLowerCase()}`}
                >
                  {priority}
                </span>
              )}

              {!isViewer && (
                <div className="inline-flag-group">
                  {isCloseRequested && (
                    <div className="inline-flag flag-close">
                      <span className="beacon-dot"></span>Close
                    </div>
                  )}
                  {adminResponseRequested && (
                    <div className="inline-flag flag-admin">
                      <span className="beacon-dot"></span>Admin
                    </div>
                  )}
                  {technicalResponseRequested && (
                    <div className="inline-flag flag-tech">
                      <span className="beacon-dot"></span>Technical
                    </div>
                  )}
                  {isPriorityRequested && (
                    <div className="inline-flag flag-priority">
                      <span className="beacon-dot"></span>Priority
                    </div>
                  )}
                  {webResponseRequested && (
                    <div className="inline-flag flag-web">
                      <span className="beacon-dot"></span>Web
                    </div>
                  )}
                  {funcResponseRequested && (
                    <div className="inline-flag flag-func">
                      <span className="beacon-dot"></span>Functional
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Timesheet */}

            {(item.StartTime ||
              item.EndTime ||
              item.ConsumeTime ||
              item.Comment) && (
              <div className="ticket-timesheet-info">
                {/* working time */}
                {item.StartTime && item.EndTime && (
                  <span className="timesheet-item">
                    <FiClock className="due-icon" />
                    Working Time: {dayjs(item.StartTime).format("HH:mm")} -{" "}
                    {dayjs(item.EndTime).format("HH:mm")}
                  </span>
                )}

                {/* time taken */}
                {item.ConsumeTime && (
                  <>
                    <span className="meta-divider">•</span>
                    <span className="timesheet-item">
                      Time taken: {item.ConsumeTime} hr
                    </span>
                  </>
                )}

                {/* view cmnt */}
                {item.Comment && (
                  <>
                    <span className="meta-divider">•</span>
                    <span
                      className="comment-toggle"
                      onClick={(e) => {
                        // 👈 FIX: Add 'e' here
                        e.stopPropagation();
                        e.preventDefault(); // 👈 Good practice to prevent default action if inside an anchor tag
                        setIsCommentExpanded(!isCommentExpanded);
                      }}
                    >
                      {isCommentExpanded ? "Hide Comment" : "View Comment"}
                    </span>
                  </>
                )}
              </div>
            )}
            {item.Comment && isCommentExpanded && (
              <div className="comment-content">{item.Comment} </div>
            )}
          </div>
          {/* MIDDLE BLOCK: Due Date */}

          {/* <div className="flex  items-end gap-2">
               {item.threadCount}
            <div className="flex flex-col">
              <button
                className="p-1 rounded-md text-gray-500 hover:text-purple-600 bg-gray-50 hover:bg-purple-50 border border-gray-200 hover:border-purple-300 transition-all duration-150 flex items-center justify-center "
                title="Meeting Scheduler"
                onClick={(e) => {
                  e.stopPropagation();
                  openInNewTab(meetingUrl); // or navigate()
                }}
              >
                <FiCalendar className="text-base" />
              </button>
            
            </div>
            <div className="flex-col">
              {config?.enablequickStatus && (
                <button
                  className="p-1 rounded-md text-gray-500 hover:text-blue-600 bg-gray-50 hover:bg-blue-50 border border-gray-200 hover:border-blue-300 transition-all duration-150 flex items-center justify-center mb-2"
                  title="Quick Status"
                  onClick={(e) => {
                    e.stopPropagation();
                    setQuickTicketStatus(item);
                  }}
                >
                  <FaHistory className="text-base" />
                </button>
              )}


           
              {config?.enablequickComment && (
                <button
                  className="p-1 rounded-md text-gray-500 hover:text-blue-600 bg-gray-50 hover:bg-blue-50 border border-gray-200 hover:border-blue-300 transition-all duration-150 flex items-center justify-center"
                  title="Quick Comment"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleQuickComment(item);
                  }}
                >
                  <FiMessageSquare className="text-base" />
                </button>
              )}
            </div>
            {!isViewer && (
              <div className="flex flex-col items-end text-right w-[90px] flex-shrink-0">
                <div className="text-sm font-semibold text-gray-800 whitespace-nowrap">
                  {item.dueDate
                    ? dayjs(item.dueDate).format("DD MMM YYYY")
                    : ""}
                </div>
                {dueStatus && (
                  <div
                    className={`flex items-center text-[11px] whitespace-nowrap mt-3 ${dueStatus.className}`}
                  >
                    {dueStatus.icon}
                    <span>{dueStatus.text}</span>
                  </div>
                )}
              </div>
            )}
          </div> */}

          <div className="flex items-end gap-4">
            {/* LEFT COLUMN */}

            <div className="flex flex-col items-center gap-2">
              {!isViewer && (
                <button
                  className="p-1 rounded-md text-gray-500 hover:text-purple-600 bg-gray-50 hover:bg-purple-50 border border-gray-200 hover:border-purple-300 transition-all duration-150 flex items-center justify-center"
                  title="Meeting Scheduler"
                  onClick={(e) => {
                    e.stopPropagation();
                    goTo(ROUTE_KEYS.MEETING_CREATE_WITH_TICKET, {
                      ticketId: item.navId,
                    });
                  }}
                >
                  <FiCalendar className="text-base" />
                </button>
              )}

              <div className="text-sm text-gray-700">{item.threadCount}</div>
            </div>

            {/* RIGHT COLUMN */}
            <div className="flex flex-col items-center gap-2">
              {config?.enablequickStatus && (
                <button
                  className="p-1 rounded-md text-gray-500 hover:text-blue-600 bg-gray-50 hover:bg-blue-50 border border-gray-200 hover:border-blue-300 transition-all duration-150 flex items-center justify-center"
                  title="Quick Status"
                  onClick={(e) => {
                    e.stopPropagation();
                    setQuickTicketStatus(item);
                  }}
                >
                  <FaHistory className="text-base" />
                </button>
              )}

              {config?.enablequickComment && (
                <button
                  className="p-1 rounded-md text-gray-500 hover:text-blue-600 bg-gray-50 hover:bg-blue-50 border border-gray-200 hover:border-blue-300 transition-all duration-150 flex items-center justify-center"
                  title="Quick Comment"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleQuickComment(item);
                  }}
                >
                  <FiMessageSquare className="text-base" />
                </button>
              )}
            </div>

            {/* DUE DATE BLOCK (unchanged) */}
            {!isViewer && (
              <div className="flex flex-col items-end text-right w-[90px] flex-shrink-0">
                <div className="text-sm font-semibold text-gray-800 whitespace-nowrap">
                  {item.dueDate
                    ? dayjs(item.dueDate).format("DD MMM YYYY")
                    : ""}
                </div>

                {dueStatus && (
                  <div
                    className={`flex items-center text-[11px] whitespace-nowrap mt-3 ${dueStatus.className}`}
                  >
                    {dueStatus.icon}
                    <span>{dueStatus.text}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* RIGHT BLOCK: Progress & Actions */}
          <div className="ticket-progress">
            <div className="battery-header">
              {!isViewer && (
                <BatteryCompletionIndicator
                  value={item.overallPercentage ?? 0}
                />
              )}
              <div className="edit-icon">{renderEdit && renderEdit()}</div>
            </div>
            {!isViewer && (
              <div className="update-info">
                <div className="ticket-assignees">
                  <Tooltip key={updated?.id} title={updated?.name} arrow>
                    <div className="avatar">{getInitials(updated?.name)} </div>
                  </Tooltip>
                </div>
                <p>
                  {" "}
                  Updated <span>{dayjs(item.updatedAt).fromNow()}</span>
                </p>
              </div>
            )}
          </div>
        </div>
      </Tooltip>
      {(isQuickFormOpen || isQuickStatusOpen) && (
        <>
          {/* 1. Backdrop */}
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-[9999] transition-opacity"
            onClick={(e) => {
              e.stopPropagation(); // Prevent backdrop click from opening ticket
              closeQuickForm();
            }}
          />

          {/* 2. Modal Wrapper */}
          <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 sm:p-6 pointer-events-none">
            {/* 3. The Modal Box - 🔥 ADD e.stopPropagation() HERE 🔥 */}
            <div
              className="w-full max-w-4xl max-h-[90vh] flex flex-col bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden pointer-events-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* 4. Header */}
              <div className="p-5 border-b border-gray-100 flex-shrink-0 bg-white z-10">
                <div className="flex justify-between items-start gap-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">
                      {isQuickFormOpen ? "Quick Comment" : "Quick Status"}
                    </h3>
                    <p className="text-base sm:text-lg text-gray-600 truncate">
                      Ticket #
                      {isQuickFormOpen
                        ? quickFormTicket?.ticketKey
                        : quickTicketStatus?.ticketKey}{" "}
                      -{" "}
                      {isQuickFormOpen
                        ? quickFormTicket?.title
                        : quickTicketStatus?.title}
                    </p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation(); // Prevent close button from opening ticket
                      closeQuickForm();
                    }}
                    className="closebtn w-10 h-10 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-gray-700 transition-all"
                  >
                    <FiX size={18} />
                  </button>
                </div>
              </div>

              {/* 5. Form Wrapper */}
              <div className="flex-1 overflow-hidden flex flex-col relative bg-white min-h-0">
                <EntityFormPage
                  mode="Create"
                  config={{
                    ...ThreadFormConfig,
                    theme: {
                      ...ThreadFormConfig.theme,
                      // 🔥 FIX 2: Added min-h-0 to the formContainer theme
                      formContainer: "flex flex-col h-full min-h-0",
                      footer:
                        "flex-shrink-0 p-4 border-t border-gray-200 bg-gray-50 flex justify-end items-center gap-3",
                    },
                    fields: ThreadFieldConfig(
                      isQuickFormOpen
                        ? quickFormTicket?.navId
                        : quickTicketStatus?.navId,
                    )
                      // 2. Keep your existing filter logic
                      .filter((field) => {
                        if (isQuickFormOpen) {
                          return field.name !== "assignees";
                        }
                        if (isQuickStatusOpen) {
                          return [
                            "TicketOverallPercentage",
                            "TicketStatusSummary",
                            "TicketProgressHistoryWidget",
                            "issueId",
                          ].includes(field.name);
                        }
                        return true;
                      })
                      // 3. 👇 ADD THIS MAP BLOCK TO OVERRIDE THE OPTIONS 👇
                      .map((field) => {
                        if (field.name === "TicketProgressHistoryWidget") {
                          return {
                            ...field,
                            options: {
                              ...field.options, // Preserve any existing options from the config
                              isQuickStatusOpen,
                            },
                          };
                        }
                        return field;
                      }),
                  }}
                  module="Thread"
                  onCancel={closeQuickForm}
                  onSuccessCallback={() => {
                    closeQuickForm();
                  }}
                />
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}
