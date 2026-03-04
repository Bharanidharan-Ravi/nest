import React from "react";
import { useProjectData } from "../../project/hooks/useProjectData";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { FaUserAlt } from "react-icons/fa";
import { GoIssueOpened, GoIssueClosed } from "react-icons/go";
import { Tooltip } from "@mui/material"; // Import MUI Tooltip
import "../css/TicketListCard.css";
import { useMasterData } from "../../../core/master/useMasterData";
dayjs.extend(relativeTime);
// Make sure to import your dependencies like Tooltip, dayjs, useMasterData, and icons at the top of the file

const TicketListCard = ({ item }) => {
  // const labels = item.label ? JSON.parse(item.label) : [];
  const { data } = useMasterData();
  const projectDetails = data?.ProjectList?.find(
    (project) => project.Id === item.project,
  ); // Match by 'Id' or use any other property

  const getInitials = (name) => {
    if (!name) return "U";
    const parts = name.trim().split(" ");
    if (parts.length > 1) return (parts[0][0] + parts[1][0]).toUpperCase();
    return name.substring(0, 2).toUpperCase();
  };

  // Helper functions for color manipulation
  const hexToRgb = (hex) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return { r, g, b };
  };

  const lightenColor = (hex, amount) => {
    const { r, g, b } = hexToRgb(hex);
    return `rgb(${Math.min(r + amount, 255)}, ${Math.min(g + amount, 255)}, ${Math.min(b + amount, 255)})`;
  };

  // Get the appropriate status icon
  const statusIcon =
    item.status === "Active" ? (
      <GoIssueOpened className="text-green-500" />
    ) : item.status === "Inactive" ? (
      <GoIssueClosed className="text-red-500" />
    ) : null;

  return (
    <>
      <div className="flex items-center">
        {statusIcon && <span className="mr-2">{statusIcon}</span>}
        <h3 className="text-ghBlue text-sm font-semibold m-0">{item.title}</h3>

        {item.label?.length > 0 && (
          <div className="flex gap-2 ml-2">
            {item.label.map((label) => {
              const borderColor = label.LABEL_COLOR;
              const textColor = lightenColor(label.LABEL_COLOR, 30);

              return (
                <span
                  key={label.LABEL_ID}
                  className="label-tickets"
                  style={{
                    backgroundColor: `rgba(${parseInt(label.LABEL_COLOR.slice(1, 3), 16)}, ${parseInt(label.LABEL_COLOR.slice(3, 5), 16)}, ${parseInt(label.LABEL_COLOR.slice(5, 7), 16)}, 0.1)`,
                    borderColor: borderColor,
                    border: "1px",
                    borderStyle: "solid",
                    color: textColor, // Use the brightened color for text
                    height: "18px", // Set height to max
                    padding: "0 10px", // Optional: Make sure the text isn't too cramped
                    display: "inline-flex", // Make sure the label content fits
                    alignItems: "center", // Vertically center the text
                  }}
                >
                  {label.LABEL_TITLE}
                </span>
              );
            })}
          </div>
        )}
      </div>

      {/* Project Details, Created Time */}
      <div className="flex justify-between items-center text-xs text-ghMuted">
        {projectDetails && (
          <p className="mr-4">
            <Tooltip title={projectDetails.Repo_Name} arrow>
              <span className="repo-key">
                {projectDetails.Repo_Name.split(" ")
                  .map((word) => word[0].toUpperCase())
                  .join("")}
              </span>
            </Tooltip>
            {" - "}
            <Tooltip title={projectDetails.Project_Name} arrow>
              <span className="project-key">
                {projectDetails.Project_Name.split(" ").length > 2
                  ? projectDetails.Project_Name.split(" ")
                      .slice(0, 2)
                      .join(" ") + "..."
                  : projectDetails.Project_Name}
              </span>
            </Tooltip>
            {" - "}
            <Tooltip title={dayjs(item.createdAt).format("YYYY-MM-DD")} arrow>
              <span className="created-key">
                Created {dayjs(item.createdAt).fromNow()}
              </span>
            </Tooltip>
          </p>
        )}

        <div className="flex justify-between items-center gap-3 text-xs text-ghMuted">
          <div className="profile flex items-center ml-auto text-xs text-ghMuted">
            {/* <FaUserAlt /> */}
            <Tooltip title={item.assginedTo} arrow>
              <span>
                {getInitials(
                  typeof item.assginedTo === "string"
                    ? item.assginedTo
                    : item.assginedTo?.name || "",
                )}
              </span>
            </Tooltip>
          </div>
          <p>
            <Tooltip title={dayjs(item.updatedAt).format("YYYY-MM-DD")} arrow>
              <span className="created-key">
                Updated {dayjs(item.updatedAt).fromNow()}
              </span>
            </Tooltip>
          </p>
        </div>
      </div>
    </>
  );
};

export default TicketListCard;

// const TicketListCard = ({ item }) => {
//     // const labels = item.label ? JSON.parse(item.label) : [];
//     const { data: projects } = useProjectData();
//     const projectDetails = projects?.find((project) => project.Id === item.project); // Match by 'Id' or use any other property

//     // Get the appropriate status icon
//     const statusIcon =
//         item.status === 'Active' ? <GoIssueOpened className="text-green-500" /> : item.status === 'Inactive' ? <GoIssueClosed className="text-red-500" /> : null;

//     return (
//         <>
//             <div className="pl-4 pr-4">
//                 <div className="flex items-baseline" >
//                     {statusIcon && <span className="mr-2">{statusIcon}</span>}

//                     <h3 className="text-ghBlue text-sm font-semibold mr-2">{item.title}</h3>

//                     {item.label.length > 0 && (
//                         <div className="flex gap-2 ml-2">
//                             {item.label.map((label) => (
//                                 <span
//                                     key={label.LABEL_ID}
//                                     className="label-tickets"
//                                     style={{
//                                         backgroundColor: `rgba(${parseInt(label.LABEL_COLOR.slice(1, 3), 16)}, ${parseInt(label.LABEL_COLOR.slice(3, 5), 16)}, ${parseInt(label.LABEL_COLOR.slice(5, 7), 16)}, 0.7)`,
//                                     }}
//                                 >
//                                     {label.LABEL_TITLE}
//                                 </span>
//                             ))}
//                         </div>
//                     )}

//                     <div className="flex items-center gap-1 ml-auto text-xs text-ghMuted">
//                         {/* <FaUserAlt /> */}
//                         <span>
//                             {typeof item.assginedTo === "string"
//                                 ? item.assginedTo
//                                 : item.assginedTo?.name || ""}
//                         </span>
//                     </div>
//                 </div>

//                 {/* Project Details, Created Time */}
//                 <div className="flex justify-between text-xs text-ghMuted mt-1">
//                     {/* Project Details */}
//                     {projectDetails && (
//                         <p className="mr-4">
//                             <Tooltip title={projectDetails.Project_Name} arrow>
//                                 <span className="project-key">{projectDetails.ProjectKey}</span>
//                             </Tooltip>
//                             {' - '}
//                             <Tooltip title={projectDetails.Repo_Name} arrow>
//                                 <span className="repo-key">{projectDetails.RepoKey}</span>
//                             </Tooltip>
//                             {' - '}
//                             <Tooltip title={dayjs(item.createdAt).format('YYYY-MM-DD')} arrow>
//                                 <span className="created-key">
//                                     Created {dayjs(item.createdAt).fromNow()}
//                                 </span>
//                             </Tooltip>
//                         </p>
//                     )}
//                     <div className="flex justify-between text-xs text-ghMuted mt-1">
//                         <Tooltip title={dayjs(item.updatedAt).format('YYYY-MM-DD')} arrow>
//                             <span className="created-key">Updated {dayjs(item.updatedAt).fromNow()}</span>
//                         </Tooltip>
//                     </div>
//                 </div>
//             </div>
//         </>
//     );
// };

// export default TicketListCard;
