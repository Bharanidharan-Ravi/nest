
import React from 'react';
import { useProjectData } from '../../project/hooks/useProjectData';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { FaUserAlt } from 'react-icons/fa';
import { GoIssueOpened, GoIssueClosed } from 'react-icons/go';
import { Tooltip } from '@mui/material';  // Import MUI Tooltip
import '../css/TicketListCard.css';
dayjs.extend(relativeTime);

const TicketListCard = ({ item }) => {
    // const labels = item.label ? JSON.parse(item.label) : [];
    const { data: projects } = useProjectData();
    const projectDetails = projects?.find((project) => project.Id === item.project); // Match by 'Id' or use any other property


    // Get the appropriate status icon
    const statusIcon =
        item.status === 'Active' ? <GoIssueOpened className="text-green-500" /> : item.status === 'Inactive' ? <GoIssueClosed className="text-red-500" /> : null;

    return (
        <>
            <div className="pl-4 pr-4">
                <div className="flex items-baseline" >
                    {statusIcon && <span className="mr-2">{statusIcon}</span>}

                    <h3 className="text-ghBlue text-sm font-semibold mr-2">{item.title}</h3>


                    {item.label.length > 0 && (
                        <div className="flex gap-2 ml-2">
                            {item.label.map((label) => (
                                <span
                                    key={label.LABEL_ID}
                                    className="label-tickets"
                                    style={{
                                        backgroundColor: `rgba(${parseInt(label.LABEL_COLOR.slice(1, 3), 16)}, ${parseInt(label.LABEL_COLOR.slice(3, 5), 16)}, ${parseInt(label.LABEL_COLOR.slice(5, 7), 16)}, 0.7)`,
                                    }}
                                >
                                    {label.LABEL_TITLE}
                                </span>
                            ))}
                        </div>
                    )}

                    <div className="flex items-center gap-1 ml-auto text-xs text-ghMuted">
                        {/* <FaUserAlt /> */}
                        <span>
                            {typeof item.assginedTo === "string"
                                ? item.assginedTo
                                : item.assginedTo?.name || ""}
                        </span>
                    </div>
                </div>

                {/* Project Details, Created Time */}
                <div className="flex justify-between text-xs text-ghMuted mt-1">
                    {/* Project Details */}
                    {projectDetails && (
                        <p className="mr-4">
                            <Tooltip title={projectDetails.Project_Name} arrow>
                                <span className="project-key">{projectDetails.ProjectKey}</span>
                            </Tooltip>
                            {' - '}
                            <Tooltip title={projectDetails.Repo_Name} arrow>
                                <span className="repo-key">{projectDetails.RepoKey}</span>
                            </Tooltip>
                            {' - '}
                            <Tooltip title={dayjs(item.createdAt).format('YYYY-MM-DD')} arrow>
                                <span className="created-key">
                                    Created {dayjs(item.createdAt).fromNow()}
                                </span>
                            </Tooltip>
                        </p>
                    )}
                    <div className="flex justify-between text-xs text-ghMuted mt-1">
                        <Tooltip title={dayjs(item.updatedAt).format('YYYY-MM-DD')} arrow>
                            <span className="created-key">Updated {dayjs(item.updatedAt).fromNow()}</span>
                        </Tooltip>
                    </div>
                </div>
            </div>
        </>
    );
};

export default TicketListCard;