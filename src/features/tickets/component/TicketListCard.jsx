import React from "react";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { GoIssueOpened, GoIssueClosed } from "react-icons/go";
import { Tooltip } from "@mui/material";
import "../css/TicketListCard.css";
import BatteryCompletionIndicator from "../../../app/shared/Component/BatteryCompletionIndicator/BatteryCompletionIndicator";
import { FiClock } from "react-icons/fi";
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

dayjs.extend(relativeTime);

export default function TicketListCard({ item, controls, focused, quickCommentButton }) {
  const [isCommentExpanded, setIsCommentExpanded] = useState(false);
  const ProjectDetails = useProjectById(item?.project);
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
  const statusIcon = activeStatus.includes(item.statusId) ? (
    <GoIssueClosed className="status-icon status-closed" />
  ) : (
    <GoIssueOpened className="status-icon status-open" />
  );
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
  return (
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
              <Tooltip title={dayjs(item.createdAt).format("YYYY-MM-DD")} arrow>
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
      <div className="ticket-due">
        <div className="due-date-row">
          {quickCommentButton && (
            <div className="quick-comment-wrapper">{quickCommentButton}</div>
          )}
          <div className="due-date">
            {item.dueDate ? dayjs(item.dueDate).format("DD MMM YYYY") : ""}
          </div>
        </div>
        {/* <div className="due-date">
          {item.dueDate ? dayjs(item.dueDate).format("DD MMM YYYY") : "-"}
        </div> */}
        {dueStatus && (
          <div className={`due-status ${dueStatus.className}`}>
            {dueStatus.icon}
            <span>{dueStatus.text}</span>
          </div>
        )}
      </div>

      {/* RIGHT BLOCK: Progress & Actions */}
      <div className="ticket-progress">
        <div className="battery-header">
          <BatteryCompletionIndicator defaultValue={item.CompletionPct ?? 0} />
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
  );
}

// export default function TicketListCard({ item, controls, focused }) {
//   const [isCommentExpand, setIsCommentExpand] = useState(false);
//   const { data: Master } = useMasterData();
//   const mainAssignee = item.multiAssignees?.find(
//     (a) => a.Assignee_Type === "Main Assignee",
//   );

//   const uniqueAssignees = Array.from(
//     new Map(
//       (item.multiAssignees || [])
//         .filter((a) => a.Assignee_Type !== "Main Assignee")
//         .map((a) => [a.Assignee_Id, a]),
//     ).values(),
//   );

//   const ProjectDetails = Master?.ProjectList?.find(
//     (proj) => proj.Id === item?.project,
//   );

//   const updated = Master?.EmployeeList?.find(
//     (e) => e.UserID === item.UpdatedBy,
//   );

//   const { renderCheckbox, renderEdit, disabled } = controls || {};

//   const statusIcon =
//     item.status === "Active" ? (
//       <GoIssueOpened className="status-icon status-open" />
//     ) : (
//       <GoIssueClosed className="status-icon status-closed" />
//     );

//   const getInitials = (name) => {
//     if (!name) return "U";
//     const parts = name.split(" ");
//     return parts.length > 1
//       ? (parts[0][0] + parts[1][0]).toUpperCase()
//       : name.substring(0, 2).toUpperCase();
//   };

//   const getDueStatus = (dueDate) => {
//     if (!dueDate) return null;

//     const diff = dayjs(dueDate).diff(dayjs(), "day");

//     if (diff < 0) {
//       return {
//         text: `${Math.abs(diff)} days overdue`,
//         icon: <FiAlertTriangle className="due-icon" />,
//         className: "overdue",
//       };
//     }

//     if (diff === 0) {
//       return {
//         text: "Due today",
//         icon: <FiClock className="due-icon" />,
//         className: "today",
//       };
//     }

//     return {
//       text: `${diff} days left`,
//       icon: <FiCheckCircle className="due-icon" />,
//       className: "remaining",
//     };
//   };

//   const dueStatus = getDueStatus(item.dueDate);

//   // Placeholders for your new data properties
//   const department = item.department || "Development"; // Replace with your logic
//   const priority = item.priority || "Medium"; // Replace with your logic
//   const getLabelStyle = (hexColor) => {
//     // Fallback for missing colors
//     if (!hexColor || !hexColor.startsWith("#")) {
//       return {
//         backgroundColor: "#f3f4f6",
//         color: "#4b5563",
//         borderColor: "#d1d5db",
//       };
//     }

//     // Parse RGB values
//     const hex = hexColor.replace("#", "");
//     const r = parseInt(hex.substr(0, 2), 16);
//     const g = parseInt(hex.substr(2, 2), 16);
//     const b = parseInt(hex.substr(4, 2), 16);

//     // YIQ formula to calculate perceived brightness (0 to 255)
//     const yiq = (r * 299 + g * 587 + b * 114) / 1000;

//     // If brightness is high (> 180), it's a light color. Force dark text.
//     const isLight = yiq > 180;

//     return {
//       backgroundColor: `${hexColor}1A`, // 10% opacity background
//       color: isLight ? "#374151" : hexColor, // Dark gray text for light colors
//       borderColor: isLight ? `${hexColor}80` : `${hexColor}4D`, // Make border slightly darker for light colors
//     };
//   };

//   const openInNewTab = (url) => {
//     const newTab = window.open(url, "_blank");
//     if (newTab) {
//       newTab.opener = null;
//     }
//   };

//   const createRouteKey = ROUTE_KEYS.TICKET_DETAIL;
//   const ticketUrl = tryBuildPath(createRouteKey, { ticketId: item.id });
//   return (
//     <div className={`ticket-row ${focused ? "focused-row" : ""}`}>
//       {/* LEFT BLOCK: Main Information */}
//       <div className="ticket-main">
//         {/* Row 1: Status, ID, Title, Labels, Department */}
//         <div className="ticket-title-wrapper">
//           {/* 1. Icon & Checkbox stay locked to the left */}
//           <div className="ticket-controls">
//             {/* {renderCheckbox && renderCheckbox()} */}
//             {disabled ? (
//               <Tooltip title="Already Committed" placement="top" arrow>
//                 <div className="cursor-not-allowed opacity-60">
//                   {/* pointer-events-none ensures the tooltip triggers on the wrapper, not the disabled input */}
//                   <div className="pointer-events-none">
//                     {renderCheckbox && renderCheckbox()}
//                   </div>
//                 </div>
//               </Tooltip>
//             ) : (
//               renderCheckbox && renderCheckbox()
//             )}
//             {statusIcon}
//           </div>

//           {/* 2. Text and Badges flow together in ONE paragraph-like container */}
//           <div className="ticket-title-and-badges">
//             <a
//               href={ticketUrl}
//               onClick={(e) => {
//                 e.preventDefault();
//                 e.stopPropagation();
//                 openInNewTab(ticketUrl);
//               }}
//             >
//               <span className="ticket-id">#{item.ticketKey}</span>
//               <span className="ticket-title" title={item.title}>
//                 {item.title}
//               </span>
//             </a>
//             {/* Badges immediately follow the text */}
//             {item.label?.length > 0 &&
//               item.label.map((label) => (
//                 <span
//                   key={label.LABEL_ID}
//                   className="ticket-label badge"
//                   style={getLabelStyle(label.LABEL_COLOR)}
//                 >
//                   {label.LABEL_TITLE}
//                 </span>
//               ))}

//             {/* Department Badge */}
//             {department && (
//               <span className="department-badge badge">{department}</span>
//             )}
//           </div>
//         </div>

//         {/* Row 2: Project Info, Assignees, Priority */}
//         <div className="ticket-meta-row">
//           {ProjectDetails && (
//             <div className="ticket-repo-info">
//               <Tooltip title={ProjectDetails.Repo_Name} arrow>
//                 <span className="repo-key">
//                   {ProjectDetails?.Repo_Name?.split(" ")
//                     .map((word) => word[0]?.toUpperCase())
//                     .join("")}
//                 </span>
//               </Tooltip>
//               <span className="meta-divider">•</span>
//               <Tooltip title={ProjectDetails.name} arrow>
//                 <span className="project-key">
//                   {ProjectDetails.name.split(" ").length > 2
//                     ? ProjectDetails.name.split(" ")
//                         .slice(0, 2)
//                         .join(" ") + "..."
//                     : ProjectDetails.name}
//                 </span>
//               </Tooltip>
//               <span className="meta-divider">•</span>
//               <Tooltip title={dayjs(item.createdAt).format("YYYY-MM-DD")} arrow>
//                 <span className="created-key">
//                   Created {dayjs(item.createdAt).fromNow()}
//                 </span>
//               </Tooltip>
//             </div>
//           )}

//           <div className="ticket-repo-info">
//             {mainAssignee && <span>Owner: {mainAssignee.Assignee_Name}</span>}
//           </div>
//           {/* Assignees Avatars */}
//           <div className="ticket-assignees">
//             {uniqueAssignees.slice(0, 3).map((a) => (
//               <Tooltip key={a.Assignee_Id} title={a.Assignee_Name} arrow>
//                 <div className="avatar">{getInitials(a.Assignee_Name)}</div>
//               </Tooltip>
//             ))}
//             {uniqueAssignees.length > 3 && (
//               <div className="avatar avatar-more">
//                 +{item.multiAssignees.length - 3}
//               </div>
//             )}
//           </div>

//           {/* Priority Label */}
//           {priority && (
//             <span
//               className={`priority-badge priority-${priority.toLowerCase()}`}
//             >
//               {priority}
//             </span>
//           )}
//         </div>
//       </div>

//       {/* MIDDLE BLOCK: Due Date */}
//       <div className="ticket-due">
//         <div className="due-date">
//           {item.dueDate ? dayjs(item.dueDate).format("DD MMM YYYY") : "-"}
//         </div>
//         {dueStatus && (
//           <div className={`due-status ${dueStatus.className}`}>
//             {dueStatus.icon}
//             <span>{dueStatus.text}</span>
//           </div>
//         )}
//       </div>

//       {/* RIGHT BLOCK: Progress & Actions */}
//       <div className="ticket-progress">
//         <div className="battery-header">
//           <BatteryCompletionIndicator defaultValue={item.progress ?? 0} />
//           <div className="edit-icon">{renderEdit && renderEdit()}</div>
//         </div>
//         <div className="update-info">
//           <div className="ticket-assignees">
//             <Tooltip key={updated?.UserID} title={updated?.name} arrow>
//               <div className="avatar">{getInitials(updated?.name)} </div>
//             </Tooltip>
//           </div>
//           <p>
//             {" "}
//             Updated <span>{dayjs(item.updatedAt).fromNow()}</span>
//           </p>
//           {/* <span>Updated by {item.assginedTo}</span>
//           <span>{dayjs(item.updatedAt).fromNow()}</span> */}
//         </div>
//       </div>
//     </div>
//   );
// }
