import { useNavigate, useParams } from "react-router-dom";
import React from "react";
import { useTicketMaster } from "../hooks/useTicketMaster";
import "../css/ViewTickets.css";
import { ListProvider } from "../../../packages/ui-List/components/ListProvider";
import { ListLayout } from "../../../packages/ui-List/components/ListLayout";
import { useMasterData } from "../../../core/master/useMasterData";
import { TicketListConfig } from "../config/TicketUI.config";
import { ROUTE_KEYS } from "../../../core/routing/paths";
import { useSmartNavigation } from "../../../core/navigation/useSmartNavigation";

export default function TicketsPage() {
  const { repoId, projId } = useParams();
  const navigate = useNavigate();
  const { data: Master } = useMasterData();
  const activeProjectId = projId;
  const { goTo } = useSmartNavigation();

  const { data, isLoading } = useTicketMaster({
    repoId: repoId ?? null,
    projectId: activeProjectId ?? null,
  });
  const editRouteKey = projId
    ? ROUTE_KEYS.PROJ_TICKET_EDIT
    : ROUTE_KEYS.TICKET_EDIT;

  const createRouteKey = repoId
    ? ROUTE_KEYS.REPO_TICKET_CREATE
    : projId
    ? ROUTE_KEYS.PROJ_TICKET_CREATE
    : ROUTE_KEYS.TICKET_CREATE;

  const isRepoScoped = !!repoId;
  const normalizeTicket = (ticket) => ({
    id: ticket.Issue_Id,
    title: ticket.Title,
    status: ticket.Status,
    description: ticket.HtmlDesc || ticket.Description,
    assginedTo: ticket.Assignee_Name,
    estimateHours: ticket.hours,
    createdAt: ticket.CreatedAt,
    updatedAt: ticket.UpdatedAt,
    repoId: ticket.RepoId,
    project: ticket.Project_Id,
    RepoKey: ticket.RepoKey,
    label: ticket.Labels_JSON ? JSON.parse(ticket.Labels_JSON) : [],
  });
  const employeeFilterOptions = [
    { label: "All Employees", value: "" },
    ...(Master?.EmployeeList?.map((user) => ({
      label: user.UserName,
      value: user.UserName,
    })) || []),
  ];

  const repoFilterOptions = [
    { label: " Repositories", value: "" },
    ...(Master?.RepoList?.map((repo) => ({
      label: repo.Title, // What the user sees in the dropdown
      value: repo.Repo_Id, // What the system uses to filter the cards
    })) || []),
  ];
  const projectFilterOptions = [
    { label: "Projects", value: "" },
    ...(Master?.ProjectList?.map((prj) => ({
      label: prj.Project_Name, // What the user sees in the dropdown
      value: prj.Id, // What the system uses to filter the cards
    })) || []),
  ];

  const LabelFilterOptions = [
    { label: " Labels", value: "" },
    ...(Master?.LabelMaster?.map((labels) => ({
      label: labels.Title, // What the user sees in the dropdown
      value: labels.Id, // What the system uses to filter the cards
    })) || []),
  ];

  const listConfigWithNav = {
    ...TicketListConfig,
    filters: [
      ...(!repoId
        ? [
            {
              key: "repoId",
              view: "Repo",
              options: repoFilterOptions,
            },
          ]
        : []),
      {
        key: "assginedTo", // 👈 MUST match the 'owner' key in normalizeProj
        view: "Assignee",
        options: employeeFilterOptions,
      },
      {
        key: "project", // 👈 MUST match the 'owner' key in normalizeProj
        view: "Project",
        options: projectFilterOptions,
      },
      {
        key: "label", // 👈 MUST match the 'owner' key in normalizeProj
        view: "Label",
        options: LabelFilterOptions,
        filterType: "array",
        filterKey: "LABEL_ID", // Because label is an array of objects, we need to specify which key to filter on
      },
    ],
    onItemClick: (item) => {
      navigate(`${location.pathname}/${item.id}`);
    },
    onEditClick: (item) => {
      goTo(editRouteKey, { ticketId: item.id, repoId, projId });
    },
  };
  const TicketList = data?.map(normalizeTicket) || [];

  return (
    <>
      {/* <h3>{isRepoScoped ? `Tickets for Repo ${repoId}` : "All Tickets"}</h3> */}

      {/* 🔥 Create Button */}
      {/* <button onClick={handleCreate}>Create Ticket</button> */}
      {(!repoId && !projId )&& (
        <div className="flex justify-between items-center mb-3 flex-none">
          <h2>Tickets</h2>

          <button
            onClick={() => goTo(createRouteKey, { repoId, projId })}
            className="bg-brand-yellow text-white px-4 py-2 rounded-md font-medium hover:bg-yellow-500 transition-colors"
          >
            Create New Tickets
          </button>
        </div>
      )}

      {/* <div className="tickets-container container"> */}
      <div className="flex-1 min-h-0">
        <ListProvider config={listConfigWithNav} data={TicketList}>
          <ListLayout />
        </ListProvider>
      </div>
      {/* </div> */}
    </>
  );
}
