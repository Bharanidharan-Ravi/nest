
import React, { useEffect } from "react";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { GoIssueOpened, GoIssueClosed, GoIssueReopened } from "react-icons/go";
import { Tooltip } from "@mui/material";
import "../css/TicketListCard.css";
import BatteryCompletionIndicator from "../../../app/shared/Component/BatteryCompletionIndicator/BatteryCompletionIndicator";
import { FiCalendar, FiClock, FiMessageCircle, FiMessageSquare, FiX } from "react-icons/fi";
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
import { FaHistory, FaRegClock, FaStopwatch } from "react-icons/fa";
import { HiPause } from "react-icons/hi";
import { useCurrentUser } from "../../../core/auth/useCurrentUser";
import { useNavigate } from "react-router-dom";
import { useSmartNavigation } from "../../../core/navigation/useSmartNavigation";
import { parse } from "date-fns";
import { getEmployeeList } from "../../employee/hooks/useEmployeeList";
import SmartAvatar from "./SmartAvatar";
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
    console.log('setting quickformtickety',item.navId);
    
    setQuickFormTicket(item);
  };
useEffect(()=>{
  console.log('qick formticket changed',quickFormTicket);
  
},[quickFormTicket])
  const parseToMinutes = (timeStr) => {
    if (!timeStr) return 0
    const [h, m] = timeStr.toString().split(':').map(Number)
    return (h || 0) * 60 + (m || 0)
  }
  const isOverEstimate =
    item.EntireWorkingTime &&
    item.estimateHours &&
    parseToMinutes(item.EntireWorkingTime) > parseToMinutes(item.estimateHours)

  const AssigneeAvatar = ({ Assignee_Id, Assignee_Name }) => {
    const { data: empData } = getEmployeeList()
    const employee = empData?.find(
      (e) => e.UserID?.toLowerCase() === Assignee_Id.toLowerCase()
    )
    const avatarPath = employee?.PreviewUrl
    return (
      <Tooltip title={Assignee_Name} arrow>
        <div className="assignee-avatar-wrapper">
          {avatarPath ? (
            <img
              className="h-6 w-6 rounded-full object-cover border-2 border-white"
              src={avatarPath}
              alt={Assignee_Name}
            />
          ) : (<div className="avatar">{getInitials(Assignee_Name)}</div>
          )}
        </div>
      </Tooltip>
    )
  }
  // console.log("itemmmm",item);
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
        {/* <div
          key={item.id}
          className={`ticket-row ${focused ? "focused-row" : ""}`}
        > */}
        <div
          key={item.id}
          className={`ticket-row ${focused ? "focused-row" : ""
            } ${!isViewer && item.raiseToClient ? "raise-to-client-row" : ""}`}
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

                  <span className="repo-key">
                    {ProjectDetails.repoName}
                  </span>

                  <span className="meta-divider">•</span>

                  <span className="project-key">
                    {ProjectDetails.name}
                  </span>

                  <span className="meta-divider">•</span>
                  <Tooltip
                    title={dayjs(item.createdAt).format("YYYY-MM-DD")}
                    arrow
                  >
                    <span className="created-key">
                      Created {dayjs(item.createdAt).fromNow()}
                    </span>
                  </Tooltip>

                  {!isViewer && item.ticketCreater && (
                    <span className="flex items-center gap-1 ">
                      {/* <span className="meta-divider text-gray-400">•</span> */}

                      <span className="text-xs text-gray-500">by</span>
                      <Tooltip  arrow>
                        <span>
                          <SmartAvatar
                            name={item.ticketCreater}
                            
                            userId={item.createdBy}
                            
                            className="w-7 h-7 text-[10px]"
                          />

                        </span>
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
                        <div className="flex items-center gap-1">
                          <span className="text-xs text-gray-500">Owner:</span>
                          <Tooltip  arrow>
                            <span>
                              <SmartAvatar
                              userId={mainAssignee.Assignee_Id}
                                name={mainAssignee.Assignee_Name}
                                className="w-7 h-7 text-[10px]"
                              />
                            </span>
                          </Tooltip>
                        </div>

                      )}
                    </div>
                  </>
                  {/* Assignees Avatars */}
                  <span className="text-xs text-gray-500">Assignees:</span>
                  <div className="ticket-assignees">

                    {uniqueAssignees.slice(0, 3).map((a) => (
                      // <Tooltip
                      //   key={a.Assignee_Id}
                      //   title={a.Assignee_Name}
                      //   arrow
                      // >
                      //   {/* <div className="avatar">
                      //     {getInitials(a.Assignee_Name)}
                      //   </div> */}
                      //   <AssigneeAvatar
                      //     Assignee_Id={a.Assignee_Id}
                      //     Assignee_Name={a.Assignee_Name} />
                      // </Tooltip>
                      <div key={a.Assignee_Id} className="assignee-avatar-wrapper">
                        <SmartAvatar
                          userId={a.Assignee_Id}
                          name={a.Assignee_Name}
                          className="w-7 h-7 text-[11px]"
                        />
                      </div>
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
          <div className="ticket-right-grid">
            <div className="grid-col">
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
              {item.threadCount &&
                <Tooltip title={`${item.threadCount} Thread`} arrow>
                  <div className="inline-flex items-center gap-1 px-2  rounded-full bg-gray-200 text-gray-700 text-sm">
                    {/* <FiMessageSquare className="text-base text-gray-500" /> */}
                    <span>{item.threadCount}</span>
                  </div>
                </Tooltip>
              }
            </div>
            <div className="grid-col">
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
            {!isViewer && (
              <div className="grid-col">
                <div className="due-date-text">
                  {item.dueDate
                    ? dayjs(item.dueDate).format("DD MMM YYYY")
                    : ""}
                </div>

                {dueStatus && (
                  <div
                    className={`due-status-row ${dueStatus.className}`}
                  >
                    {dueStatus.icon}
                    <span>{dueStatus.text}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="grid-col">
            <div className="grid-row">
              {!isViewer && (
                <>
                  <BatteryCompletionIndicator
                    value={item.overallPercentage ?? 0}
                  />
                  {item.estimateHours &&
                    <div className="estimate-row">
                      <span className="estimate-time">
                        <FaRegClock size={12} />
                        {item.estimateHours}hr
                      </span>
                    </div>
                  }

                </>
              )}

              <div className="edit-icon">
                {renderEdit && renderEdit()}
              </div>
            </div>

            <div className="grid-row updated-row">
              {!isViewer && (
                <>
                  <div className="updated-user">
                    <Tooltip key={updated?.id} >
                      {/* <div className="avatar">
                        {getInitials(updated?.name)}
                      </div> */}
                      <span>
                        <SmartAvatar
                          userId={updated?.id}
                          name={updated?.name}
                          className="w-6 h-6 text-[10px]"
                        />
                      </span>
                    </Tooltip>

                    <p className="text-xs text-gray-500 updated-text">
                      Updated <span>{dayjs(item.updatedAt).fromNow()}</span>
                    </p>
                  </div>
                  {item.EntireWorkingTime &&
                    <div className="estimate-row">
                      <span className={`estimate-time ${isOverEstimate ? 'over-estimate' : ''}`}>
                        <FaStopwatch size={12} />
                        {item.EntireWorkingTime}hr
                      </span>
                    </div>
                  }
                </>
              )}
              {item.move_toJson && (
                <div className="flex items-center last-assignees">
                  {JSON.parse(item.move_toJson).map((user, index) => (
                    <Tooltip key={index} title={user.Title} arrow>
                      <div className="avatar-assignee">
                        {user.Title?.charAt(0).toUpperCase()}
                      </div>
                      {/* <span className="assignee-avatar-wrapper">
                        <SmartAvatar
                          name={user.Title}
                          className="w-6 h-6 text-[10px]"
                        />
                      </span> */}
                    </Tooltip>
                  ))}
                </div>
              )}
            </div>

          </div>
        </div>
      </Tooltip >
      {(isQuickFormOpen ||isQuickStatusOpen) && (
        <>
          {/* 1. Backdrop */}
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-[9999] transition-opacity"
            onClick={(e) => {
              e.stopPropagation(); // Prevent backdrop click from opening ticket
              setQuickFormTicket(null)
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
      )
      }
    </>
  );
}
