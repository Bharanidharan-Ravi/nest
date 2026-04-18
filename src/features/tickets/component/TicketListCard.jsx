import React from "react";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { GoIssueOpened, GoIssueClosed, GoIssueReopened } from "react-icons/go";
import { Tooltip } from "@mui/material";
import "../css/TicketListCard.css";
import BatteryCompletionIndicator from "../../../app/shared/Component/BatteryCompletionIndicator/BatteryCompletionIndicator";
import { FiClock, FiMessageSquare, FiX } from "react-icons/fi";
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

dayjs.extend(relativeTime);

export default function TicketListCard({
  item,
  controls,
  focused,
  config,
  quickCommentButton,
}) {
  const [isCommentExpanded, setIsCommentExpanded] = useState(false);
  const ProjectDetails = useProjectById(item?.project);
  const [quickFormTicket, setQuickFormTicket] = useState(null);
  const isQuickFormOpen = quickFormTicket?.navId === item.navId;
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
  const activeStatus = [14, 15, 16, 17];
  let statusIcon;
  if (item.reopenedBy) {
    // If it has a ReopenedBy Guid, show the Reopen icon (usually purple or orange)
    statusIcon = (
      <GoIssueReopened
        className="status-icon text-orange-500"
        title="Reopened Ticket"
      />
    );
  } else if (activeStatus.includes(item.statusId)) {
    // If it's closed/cancelled
    statusIcon = <GoIssueClosed className="status-icon status-closed" />;
  } else {
    // If it's just a normal open ticket
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
  const closeQuickForm = useCallback(() => setQuickFormTicket(null), []);
  const handleQuickComment = (item) => {
    setQuickFormTicket(item);
  };
  return (
    <>
      <div className={`ticket-row ${focused ? "focused-row" : ""}`}>
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
                    style={getLabelStyle(label.LABEL_COLOR)}
                  >
                    {label.LABEL_TITLE}
                  </span>
                ))}

              {/* Department Badge */}
              {department && (
                <span className="department-badge badge">{department}</span>
              )}
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
                    {ProjectDetails.name.split(" ").length > 2
                      ? ProjectDetails.name.split(" ").slice(0, 2).join(" ") +
                        "..."
                      : ProjectDetails.name}
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
              </div>
            )}

            <div className="ticket-repo-info">
              {mainAssignee && <span>Owner: {mainAssignee.Assignee_Name}</span>}
            </div>
            {/* Assignees Avatars */}
            <div className="ticket-assignees">
              {uniqueAssignees.slice(0, 3).map((a) => (
                <Tooltip key={a.Assignee_Id} title={a.Assignee_Name} arrow>
                  <div className="avatar">{getInitials(a.Assignee_Name)}</div>
                </Tooltip>
              ))}
              {uniqueAssignees.length > 3 && (
                <div className="avatar avatar-more">
                  +{item.multiAssignees.length - 3}
                </div>
              )}
            </div>

            {/* Priority Label */}
            {priority && (
              <span
                className={`priority-badge priority-${priority.toLowerCase()}`}
              >
                {priority}
              </span>
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

        <div className="flex items-end gap-3 justify-end">
          {config?.enablequickComment && (
            <button
              className="p-2 rounded-md text-gray-500 hover:text-blue-600 bg-gray-50 hover:bg-blue-50 border border-gray-200 hover:border-blue-300 transition-all duration-150 flex items-center justify-center flex-shrink-0"
              title="Quick Comment"
              onClick={(e) => {
                e.stopPropagation();
                handleQuickComment(item);
              }}
            >
              <FiMessageSquare className="text-base" />
            </button>
          )}
        <div className="flex flex-col items-end text-right w-[90px] flex-shrink-0">
            <div className="text-sm font-semibold text-gray-800 whitespace-nowrap">
              {item.dueDate ? dayjs(item.dueDate).format("DD MMM YYYY") : ""}
            </div>
            {dueStatus && (
              <div className={`flex items-center text-[11px] whitespace-nowrap mt-0.5 ${dueStatus.className}`}>
                {dueStatus.icon}
                <span>{dueStatus.text}</span>
              </div>
            )}
          </div>
          {/* <div>
            <div className="ticket-due due-date-row">
              <div className="due-date">
                {item.dueDate ? dayjs(item.dueDate).format("DD MMM YYYY") : ""}
              </div>
            </div>
            {dueStatus && (
              <div className={`due-status ${dueStatus.className}`}>
                {dueStatus.icon}
                <span>{dueStatus.text}</span>
              </div>
            )}
          </div> */}
        </div>
        {/* <div className="ticket-due">
          <div className="due-date-row">         
            <div className="due-date">
              {item.dueDate ? dayjs(item.dueDate).format("DD MMM YYYY") : ""}
            </div>
          </div>
          {dueStatus && (
            <div className={`due-status ${dueStatus.className}`}>
              {dueStatus.icon}
              <span>{dueStatus.text}</span>
            </div>
          )}
        </div> */}

        {/* RIGHT BLOCK: Progress & Actions */}
        <div className="ticket-progress">
          <div className="battery-header">
            <BatteryCompletionIndicator
              defaultValue={item.CompletionPct ?? 0}
            />
            <div className="edit-icon">{renderEdit && renderEdit()}</div>
          </div>
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
            {/* <span>Updated by {item.assginedTo}</span>
          <span>{dayjs(item.updatedAt).fromNow()}</span> */}
          </div>
        </div>
      </div>
      {isQuickFormOpen && (
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
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">
                      Quick Comment
                    </h3>
                    <p className="text-base sm:text-lg text-gray-600">
                      Ticket #{quickFormTicket?.ticketKey} - {quickFormTicket?.title}
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
                      footer: "flex-shrink-0 p-4 border-t border-gray-200 bg-gray-50 flex justify-end items-center gap-3", 
                    },
                    fields: ThreadFieldConfig(quickFormTicket?.navId).filter(
                      (field) => field.name !== "assignees",
                    ),
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


  //  {isQuickFormOpen && (
  //       <>
  //         {/* Backdrop */}
  //         <div
  //           className="fixed inset-0 bg-black bg-opacity-50 z-[9999] flex items-center justify-center p-4"
  //           onClick={closeQuickForm}
  //         />

  //         {/* Form Container */}
  //         <div
  //           onClick={(e) => e.stopPropagation()}
  //           className="fixed inset-0 z-[10000] flex items-center justify-center p-6 overflow-auto"
  //         >
  //           <div className="w-full max-w-4xl max-h-[90vh] bg-white rounded-1xl shadow-2xl border border-gray-200">
  //             <div className="p-5">
  //               {/* Header */}
  //               <div className="flex justify-between items-center border-b mb-2 pb-2">
  //                 <div>
  //                   <h3 className="text-3xl font-bold text-gray-900 mb-1">
  //                     Quick Comment
  //                   </h3>
  //                   <p className="text-lg text-gray-600">
  //                     Ticket #{quickFormTicket?.ticketKey} -{" "}
  //                     {quickFormTicket?.title}
  //                   </p>
  //                 </div>
  //                 <button
  //                   onClick={closeQuickForm}
  //                   className="closebtn w-10 h-10 flex items-center justify-center rounded-full 
  //                     bg-gray-100 hover:bg-gray-200 
  //                     text-gray-500 hover:text-gray-700 transition-all"
  //                 >
  //                   <FiX size={18} />
  //                 </button>
  //               </div>

  //               {/* EntityForm */}
  //               <EntityFormPage
  //                 mode="Create"
  //                 config={{
  //                   ...ThreadFormConfig,
  //                   fields: ThreadFieldConfig(quickFormTicket?.navId).filter(
  //                     (field) => field.name !== "assignees",
  //                   ),
  //                 }}
  //                 module="Thread"
  //                 onCancel={closeQuickForm}
  //                 onSuccessCallback={() => {
  //                   closeQuickForm();
  //                   // Optional: refresh list data
  //                 }}
  //               />
  //             </div>
  //           </div>
  //         </div>
  //       </>
  //     )}