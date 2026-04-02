import React from "react";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { GoIssueOpened, GoIssueClosed } from "react-icons/go";
import { Tooltip } from "@mui/material";
import "../css/TicketListCard.css";
import { useMasterData } from "../../../core/master/useMasterData";
import BatteryCompletionIndicator from "../../../app/shared/Component/BatteryCompletionIndicator/BatteryCompletionIndicator";
import { FiAlertTriangle, FiClock, FiCheckCircle } from "react-icons/fi";
import { ROUTE_KEYS } from "../../../core/routing/paths";
import { tryBuildPath } from "../../../core/routing/routeRegistry";
import { useState } from "react";

dayjs.extend(relativeTime);

export default function TicketListCard({ item, controls, focused }) {
  const [isCommentExpand, setIsCommentExpand] = useState(false);
  const { data: Master } = useMasterData();
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

  const ProjectDetails = Master?.ProjectList?.find(
    (proj) => proj.Id === item?.project,
  );

  const updated = Master?.EmployeeList?.find(
    (e) => e.UserID === item.UpdatedBy,
  );

  const { renderCheckbox, renderEdit, disabled } = controls || {};

  const statusIcon =
    item.status === "Active" ? (
      <GoIssueOpened className="status-icon status-open" />
    ) : (
      <GoIssueClosed className="status-icon status-closed" />
    );

  const getInitials = (name) => {
    if (!name) return "U";
    const parts = name.split(" ");
    return parts.length > 1
      ? (parts[0][0] + parts[1][0]).toUpperCase()
      : name.substring(0, 2).toUpperCase();
  };

  const getDueStatus = (dueDate) => {
    if (!dueDate) return null;

    const diff = dayjs(dueDate).diff(dayjs(), "day");

    if (diff < 0) {
      return {
        text: `${Math.abs(diff)} days overdue`,
        icon: <FiAlertTriangle className="due-icon" />,
        className: "overdue",
      };
    }

    if (diff === 0) {
      return {
        text: "Due today",
        icon: <FiClock className="due-icon" />,
        className: "today",
      };
    }

    return {
      text: `${diff} days left`,
      icon: <FiCheckCircle className="due-icon" />,
      className: "remaining",
    };
  };

  const dueStatus = getDueStatus(item.dueDate);

  // Placeholders for your new data properties
  const department = item.department || "Development"; // Replace with your logic
  const priority = item.priority || "Medium"; // Replace with your logic
  const getLabelStyle = (hexColor) => {
    // Fallback for missing colors
    if (!hexColor || !hexColor.startsWith("#")) {
      return {
        backgroundColor: "#f3f4f6",
        color: "#4b5563",
        borderColor: "#d1d5db",
      };
    }

    // Parse RGB values
    const hex = hexColor.replace("#", "");
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);

    // YIQ formula to calculate perceived brightness (0 to 255)
    const yiq = (r * 299 + g * 587 + b * 114) / 1000;

    // If brightness is high (> 180), it's a light color. Force dark text.
    const isLight = yiq > 180;

    return {
      backgroundColor: `${hexColor}1A`, // 10% opacity background
      color: isLight ? "#374151" : hexColor, // Dark gray text for light colors
      borderColor: isLight ? `${hexColor}80` : `${hexColor}4D`, // Make border slightly darker for light colors
    };
  };

  const openInNewTab = (url) => {
    const newTab = window.open(url, "_blank");
    if (newTab) {
      newTab.opener = null;
    }
  };

  const createRouteKey = ROUTE_KEYS.TICKET_DETAIL;
  const ticketUrl = tryBuildPath(createRouteKey, { ticketId: item.id });
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
                {item.title}
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
              <Tooltip title={ProjectDetails.Repo_Name} arrow>
                <span className="repo-key">
                  {ProjectDetails?.Repo_Name?.split(" ")
                    .map((word) => word[0]?.toUpperCase())
                    .join("")}
                </span>
              </Tooltip>
              <span className="meta-divider">•</span>
              <Tooltip title={ProjectDetails.Project_Name} arrow>
                <span className="project-key">
                  {ProjectDetails.Project_Name.split(" ").length > 2
                    ? ProjectDetails.Project_Name.split(" ")
                        .slice(0, 2)
                        .join(" ") + "..."
                    : ProjectDetails.Project_Name}
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
      </div>

      {/* MIDDLE BLOCK: Due Date */}
      <div className="ticket-due">
        <div className="due-date">
          {item.dueDate ? dayjs(item.dueDate).format("DD MMM YYYY") : "-"}
        </div>
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
          <BatteryCompletionIndicator defaultValue={item.progress ?? 0} />
          <div className="edit-icon">{renderEdit && renderEdit()}</div>
        </div>
        <div className="update-info">
          <div className="ticket-assignees">
            <Tooltip key={updated?.UserID} title={updated?.UserName} arrow>
              <div className="avatar">{getInitials(updated?.UserName)} </div>
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

// import React from "react";
// // import { useProjectData } from "../../project/hooks/useProjectData";
// import dayjs from "dayjs";
// import relativeTime from "dayjs/plugin/relativeTime";
// // import { FaUserAlt } from "react-icons/fa";
// import { GoIssueOpened, GoIssueClosed } from "react-icons/go";
// import { Tooltip } from "@mui/material"; // Import MUI Tooltip
// import "../css/TicketListCard.css";
// import { useMasterData } from "../../../core/master/useMasterData";
// import BatteryCompletionIndicator from "../../../app/shared/Component/BatteryCompletionIndicator/BatteryCompletionIndicator";
// import { FiAlertTriangle, FiClock, FiCheckCircle } from "react-icons/fi";
// dayjs.extend(relativeTime);
// // Make sure to import your dependencies like Tooltip, dayjs, useMasterData, and icons at the top of the file

// export default function TicketListCard({ item, controls, focused }) {
//   const { data: Master } = useMasterData();

//   const ProjectDetails = Master?.ProjectList?.find(
//     (proj) => proj.Id === item?.project,
//   );

//   const { renderCheckbox, renderEdit } = controls || {};

//   const statusIcon =
//     item.status === "Active" ? (
//       <GoIssueOpened className="status-open" />
//     ) : (
//       <GoIssueClosed className="status-closed" />
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
//         icon: <FiAlertTriangle className="due-icon overdue-icon" />,
//         className: "overdue",
//       };
//     }

//     if (diff === 0) {
//       return {
//         text: "Due today",
//         icon: <FiClock className="due-icon today-icon" />,
//         className: "today",
//       };
//     }

//     return {
//       text: `${diff} days left`,
//       icon: <FiCheckCircle className="due-icon remaining-icon" />,
//       className: "remaining",
//     };
//   };
//   const dueStatus = getDueStatus(item.dueDate);
//   return (
//     <div className={`ticket-row ${focused ? "focused-row" : ""}`}>
//       {/* LEFT BLOCK */}
//       <div className="ticket-main">
//         <div className="ticket-title-row">
//           {/* {renderCheckbox && renderCheckbox()} */}

//           {statusIcon}

//           <span className="ticket-id">#{item.ticketKey}</span>

//           <p className="ticket-title">
//             {item.title} <span className="ticket-labels">
//               {item.label?.map((label) => (
//                 <span key={label.LABEL_ID} className="ticket-label">
//                   {label.LABEL_TITLE}
//                 </span>
//               ))}
//             </span>
//           </p>
//         </div>

//         <div className="ticket-repo">
//           {ProjectDetails && (
//             <p className="mr-4">
//               <Tooltip title={ProjectDetails.Repo_Name} arrow>
//                 <span className="repo-key">
//                   {ProjectDetails?.Repo_Name.split(" ")
//                     .map((word) => word[0]?.toUpperCase())
//                     .join("")}
//                 </span>
//               </Tooltip>
//               {" - "}
//               <Tooltip title={ProjectDetails.Project_Name} arrow>
//                 <span className="project-key">
//                   {ProjectDetails.Project_Name.split(" ").length > 2
//                     ? ProjectDetails.Project_Name.split(" ")
//                         .slice(0, 2)
//                         .join(" ") + "..."
//                     : ProjectDetails.Project_Name}
//                 </span>
//               </Tooltip>
//               {" - "}
//               <Tooltip title={dayjs(item.createdAt).format("YYYY-MM-DD")} arrow>
//                 <span className="created-key">
//                   Created {dayjs(item.createdAt).fromNow()}
//                 </span>
//               </Tooltip>
//             </p>
//           )}
//           <div className="ticket-meta-row">
//             {/* assignees */}
//             <div className="ticket-assignees">
//               {item.multiAssignees?.slice(0, 3).map((a) => (
//                 <Tooltip title={a.Assignee_Name}>
//                   <div key={a.Assignee_Id} className="avatar">
//                     {getInitials(a.Assignee_Name)}
//                   </div>
//                 </Tooltip>
//               ))}
//             </div>
//           </div>
//         </div>
//       </div>

//       {/* DUE DATE BLOCK */}
//       <div className="ticket-due">
//         <div className="due-date">
//           {item.dueDate ? dayjs(item.dueDate).format("DD MMM") : "-"}
//         </div>

//         {dueStatus && (
//           <div className={`due-status ${dueStatus.className}`}>
//             {dueStatus.icon}
//             {dueStatus.text}
//           </div>
//         )}
//       </div>

//       {/* RIGHT BLOCK */}
//       <div className="ticket-progress">
//         <div className="battery-header">
//           <BatteryCompletionIndicator defaultValue={item.progress ?? 0} />

//           <div className="edit-icon">{renderEdit && renderEdit()}</div>
//         </div>

//         <div className="update-info">
//           <span>Updated by {item.assginedTo}</span>

//           <span>{dayjs(item.updatedAt).fromNow()}</span>
//         </div>
//       </div>
//     </div>
//   );
// }
//  <div className="flex items-center">
//         {statusIcon && <span className="mr-2">{statusIcon}</span>}
//         <h3 className="text-ghBlue text-sm font-semibold m-0">{item.title}</h3>

//         {item.label?.length > 0 && (
//           <div className="flex gap-2 ml-2">
//             {item.label.map((label) => {
//               const borderColor = label.LABEL_COLOR;
//               const textColor = lightenColor(label.LABEL_COLOR, 30);

//               return (
//                 <span
//                   key={label.LABEL_ID}
//                   className="label-tickets"
//                   style={{
//                     backgroundColor: `rgba(${parseInt(label.LABEL_COLOR.slice(1, 3), 16)}, ${parseInt(label.LABEL_COLOR.slice(3, 5), 16)}, ${parseInt(label.LABEL_COLOR.slice(5, 7), 16)}, 0.1)`,
//                     borderColor: borderColor,
//                     border: "1px",
//                     borderStyle: "solid",
//                     color: textColor, // Use the brightened color for text
//                     height: "18px", // Set height to max
//                     padding: "0 10px", // Optional: Make sure the text isn't too cramped
//                     display: "inline-flex", // Make sure the label content fits
//                     alignItems: "center", // Vertically center the text
//                   }}
//                 >
//                   {label.LABEL_TITLE}
//                 </span>
//               );
//             })}
//           </div>
//         )}
//       </div>

//       {/* Project Details, Created Time */}
//       <div className="flex justify-between items-center text-xs text-ghMuted">
//         {projectDetails && (
//           <p className="mr-4">
//             <Tooltip title={projectDetails.Repo_Name} arrow>
//               <span className="repo-key">
//                 {projectDetails?.Repo_Name.split(" ")
//                   .map((word) => word[0]?.toUpperCase())
//                   .join("")}
//               </span>
//             </Tooltip>
//             {" - "}
//             <Tooltip title={projectDetails.Project_Name} arrow>
//               <span className="project-key">
//                 {projectDetails.Project_Name.split(" ").length > 2
//                   ? projectDetails.Project_Name.split(" ")
//                       .slice(0, 2)
//                       .join(" ") + "..."
//                   : projectDetails.Project_Name}
//               </span>
//             </Tooltip>
//             {" - "}
//             <Tooltip title={dayjs(item.createdAt).format("YYYY-MM-DD")} arrow>
//               <span className="created-key">
//                 Created {dayjs(item.createdAt).fromNow()}
//               </span>
//             </Tooltip>
//           </p>
//         )}

//////////////////////////////////////////////---------------------------------------------------------------------------------

//         <div className="flex justify-between items-center gap-3 text-xs text-ghMuted">
//           <div className="profile flex items-center ml-auto text-xs text-ghMuted">
//             {/* <FaUserAlt /> */}
//             <Tooltip title={item.assginedTo} arrow>
//               <span>
//                 {getInitials(
//                   typeof item.assginedTo === "string"
//                     ? item.assginedTo
//                     : item.assginedTo?.name || "",
//                 )}
//               </span>
//             </Tooltip>
//           </div>
//           <p>
//             <Tooltip title={dayjs(item.updatedAt).format("YYYY-MM-DD")} arrow>
//               <span className="created-key">
//                 Updated {dayjs(item.updatedAt).fromNow()}
//               </span>
//             </Tooltip>
//           </p>
//         </div>
//       </div>
